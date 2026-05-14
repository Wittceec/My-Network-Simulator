import { useNetworkStore } from '../../store/useNetworkStore';
import { useAzureStore } from '../../store/useAzureStore';
import { isSameSubnet } from '../../utils/ipMath';
import type { Device } from '../../types/device';

export function resolveHostname(hostname: string): string | null {
  const state = useNetworkStore.getState();
  const targetDevice = Object.values(state.devices).find(d => d.hostname.toLowerCase() === hostname.toLowerCase());
  if (!targetDevice) return null;
  
  // Return the first active IPv4 address
  for (const intf of Object.values(targetDevice.interfaces)) {
    if (intf.isUp && intf.ipv4) return intf.ipv4.ip;
  }
  return null;
}

// --- ACL MATH ENGINE ---
function matchesWildcard(ip: string, network: string, wildcard: string): boolean {
  if (network === '0.0.0.0' && wildcard === '255.255.255.255') return true; 
  const ipParts = ip.split('.').map(Number);
  const netParts = network.split('.').map(Number);
  const wildParts = wildcard.split('.').map(Number);
  for(let i = 0; i < 4; i++) {
    if (wildParts[i] === 0 && ipParts[i] !== netParts[i]) return false;
  }
  return true;
}

function isPermittedByAcl(device: Device, aclId: string | undefined, srcIp: string, dstIp: string): boolean {
  if (!aclId) return true; 
  const acl = device.acls[aclId];
  if (!acl || acl.rules.length === 0) return true;
  const rules = [...acl.rules].sort((a, b) => a.sequence - b.sequence);
  for (const rule of rules) {
    const srcMatch = matchesWildcard(srcIp, rule.sourceIp, rule.sourceWildcard);
    let dstMatch = true;
    if (acl.type === 'extended') dstMatch = matchesWildcard(dstIp, rule.destIp, rule.destWildcard);
    if (srcMatch && dstMatch) return rule.action === 'permit';
  }
  return false; 
}

// --- AZURE NSG MATH ENGINE ---
function cidrToMask(bits: number): string {
  let mask = '';
  for (let i = 0; i < 4; i++) {
    if (bits >= 8) {
      mask += '255';
      bits -= 8;
    } else if (bits > 0) {
      mask += (256 - Math.pow(2, 8 - bits)).toString();
      bits = 0;
    } else {
      mask += '0';
    }
    if (i < 3) mask += '.';
  }
  return mask;
}

function isIpMatch(ip: string, prefix: string): boolean {
  if (prefix === '*' || prefix === 'Internet' || prefix === 'VirtualNetwork') return true;
  if (prefix.includes('/')) {
    const [net, bits] = prefix.split('/');
    const mask = cidrToMask(Number(bits));
    return isSameSubnet(ip, net, mask);
  }
  return ip === prefix;
}

function isPermittedByAzureNsg(nsgId: string | undefined, srcIp: string, dstIp: string, protocol: 'Icmp' | 'Tcp' | 'Udp' | 'Any' = 'Icmp'): boolean {
  if (!nsgId) return true; // Default allow if no NSG
  const azureState = useAzureStore.getState();
  const nsg = azureState.nsgs[nsgId];
  if (!nsg) return true;

  // In Azure, rules are sorted by priority (lowest number first)
  const rules = [...nsg.rules].sort((a, b) => a.priority - b.priority);
  
  for (const rule of rules) {
    if (rule.protocol !== 'Any' && rule.protocol !== protocol) continue;
    if (rule.direction !== 'Inbound') continue;

    const srcMatch = isIpMatch(srcIp, rule.sourceAddressPrefix);
    const dstMatch = isIpMatch(dstIp, rule.destinationAddressPrefix);

    if (srcMatch && dstMatch) {
      return rule.access === 'Allow';
    }
  }

  // Default Azure behavior: Deny all inbound from external, Allow VNet inbound.
  // We'll simplify and say if no explicit rule matched, and src is from external (on-prem), Deny.
  return false;
}
// ----------------------------

function checkAzureRouting(azureState: any, entryVnetId: string, targetVm: any, srcIp: string, targetIp: string): { success: boolean, droppedByNsg: boolean } {
  const entryVnet = azureState.vnets[entryVnetId];
  if (!entryVnet) return { success: false, droppedByNsg: false };

  let targetSubnet = entryVnet.subnets.find((s: any) => s.id === targetVm.subnetId);

  // If not in entry VNet, check peerings for Gateway Transit
  if (!targetSubnet) {
    const validPeering = entryVnet.peerings.find((p: any) => {
      const remoteVnet = azureState.vnets[p.remoteVirtualNetworkId];
      if (!remoteVnet) return false;
      const isTargetInRemote = remoteVnet.subnets.some((s: any) => s.id === targetVm.subnetId);
      if (!isTargetInRemote) return false;
      
      const reversePeering = remoteVnet.peerings.find((rp: any) => rp.remoteVirtualNetworkId === entryVnet.id);
      return p.allowGatewayTransit && reversePeering?.useRemoteGateways && p.peeringState === 'Connected' && reversePeering.peeringState === 'Connected';
    });

    if (validPeering) {
      const remoteVnet = azureState.vnets[validPeering.remoteVirtualNetworkId];
      targetSubnet = remoteVnet.subnets.find((s: any) => s.id === targetVm.subnetId);
    }
  }

  if (targetSubnet) {
    if (!isPermittedByAzureNsg(targetSubnet.nsgId, srcIp, targetIp, 'Icmp')) {
      return { success: false, droppedByNsg: true };
    }
    return { success: true, droppedByNsg: false };
  }

  return { success: false, droppedByNsg: false };
}

function getLinkBetween(devAId: string, devBId: string): string | null {
  const links = Object.values(useNetworkStore.getState().links);
  const link = links.find(l => 
    (l.sourceDeviceId === devAId && l.targetDeviceId === devBId) || 
    (l.sourceDeviceId === devBId && l.targetDeviceId === devAId)
  );
  return link ? link.id : null;
}

export function simulatePing(sourceDevice: Device, targetIp: string, ttl: number = 5, originalSrcIp?: string): boolean {
  if (ttl <= 0) return false;
  const state = useNetworkStore.getState();
  const allDevices = state.devices;
  const allLinks = state.links;

  const srcIp = originalSrcIp || Object.values(sourceDevice.interfaces).find(i => i.isUp && i.ipv4)?.ipv4?.ip || '0.0.0.0';
  const isLocal = Object.values(sourceDevice.interfaces).some(intf => intf.ipv4?.ip === targetIp && intf.isUp);
  if (isLocal) return true;

  // Check if target is an Azure VM in the same broadcast domain (not typical, but just in case)
  const azureState = useAzureStore.getState();
  const targetVm = Object.values(azureState.vms).find(vm => vm.privateIpAddress === targetIp && vm.status === 'Running');

  for (const srcIntf of Object.values(sourceDevice.interfaces)) {
    if (!srcIntf.isUp || !srcIntf.ipv4 || srcIntf.stpState === 'blocking') continue;
    if (!isPermittedByAcl(sourceDevice, srcIntf.outboundAclId, srcIp, targetIp)) continue;

    // ROUTER-ON-A-STICK: Convert 'fa0/0.10' -> 'fa0/0' to find the physical cable
    const physicalSrcIntf = srcIntf.id.split('.')[0];
    const connectedLinks = Object.values(allLinks).filter(l => 
      (l.sourceDeviceId === sourceDevice.id && l.sourceInterfaceId === physicalSrcIntf) || 
      (l.targetDeviceId === sourceDevice.id && l.targetInterfaceId === physicalSrcIntf)
    );

    for (const link of connectedLinks) {
      const neighborId = link.sourceDeviceId === sourceDevice.id ? link.targetDeviceId : link.sourceDeviceId;
      
      // Azure VNG Integration
      if (neighborId.startsWith('azure-vng-')) {
        const rawVngId = neighborId.replace('azure-vng-', '');
        const vng = azureState.vngs[rawVngId];
        if (vng && targetVm) {
          // Simplistic routing: If it reaches the VNG, it reaches the VNet.
          // Now supports VNet Peering via checkAzureRouting
          const routingResult = checkAzureRouting(azureState, vng.vnetId, targetVm, srcIp, targetIp);
          if (routingResult.droppedByNsg) return false;
          if (routingResult.success) return true;
        }
        continue; // Drop if VNG but no VM found
      }

      const neighborDevice = allDevices[neighborId];
      if (!neighborDevice) continue;

      const switchPort = link.sourceDeviceId === neighborDevice.id ? link.sourceInterfaceId : link.targetInterfaceId;
      const srcMac = srcIntf.macAddress !== '0000.0000.0000' && srcIntf.macAddress ? srcIntf.macAddress : `0000.1111.${sourceDevice.id.padStart(4, '0')}`;
      const vlan = srcIntf.accessVlan || 1;

      if (neighborDevice.type === 'switch') {
        const neighborPhysIntf = neighborDevice.interfaces[switchPort];
        
        // NEW: PORT SECURITY ENFORCER
        if (neighborPhysIntf?.portSecurity?.enabled) {
          if (!neighborPhysIntf.portSecurity.macs.includes(srcMac)) {
             if (neighborPhysIntf.portSecurity.macs.length < neighborPhysIntf.portSecurity.max) {
                 // Learn new MAC
                 state.updateDevice(neighborDevice.id, (d) => ({
                    ...d, interfaces: { ...d.interfaces, [switchPort]: { ...neighborPhysIntf, portSecurity: { ...neighborPhysIntf.portSecurity!, macs: [...neighborPhysIntf.portSecurity!.macs, srcMac] } } }
                 }));
             } else {
                 // VIOLATION: Shut it down and drop the packet!
                 if (neighborPhysIntf.portSecurity.violation === 'shutdown') {
                     state.updateDevice(neighborDevice.id, (d) => ({
                         ...d, interfaces: { ...d.interfaces, [switchPort]: { ...neighborPhysIntf, isUp: false } }
                     }));
                 }
                 continue; 
             }
          }
        }

        // MAC Table Learning
        state.updateDevice(neighborDevice.id, (sw) => {
          if (sw.macAddressTable[srcMac]?.port === switchPort) return sw;
          return { ...sw, macAddressTable: { ...sw.macAddressTable, [srcMac]: { port: switchPort, vlan: vlan } } };
        });
      }

      for (const neighborIntf of Object.values(neighborDevice.interfaces)) {
        if (neighborIntf.isUp && neighborIntf.ipv4?.ip === targetIp && neighborIntf.stpState !== 'blocking') {
          if (!isPermittedByAcl(neighborDevice, neighborIntf.inboundAclId, srcIp, targetIp)) continue;

          const targetVlan = neighborIntf.accessVlan || 1;
          if (vlan === targetVlan && isSameSubnet(srcIntf.ipv4.ip, neighborIntf.ipv4.ip, srcIntf.ipv4.mask)) {
            const targetMac = neighborIntf.macAddress !== '0000.0000.0000' && neighborIntf.macAddress ? neighborIntf.macAddress : `0000.1111.${neighborDevice.id.padStart(4, '0')}`;
            state.updateDevice(sourceDevice.id, (d) => ({ ...d, arpTable: { ...(d.arpTable || {}), [targetIp]: targetMac } }));
            state.updateDevice(neighborDevice.id, (d) => ({ ...d, arpTable: { ...(d.arpTable || {}), [srcIntf.ipv4!.ip]: srcMac } }));
            return true;
          }
        }
      }
    }
  }

  for (const route of sourceDevice.routingTable) {
    if (isSameSubnet(targetIp, route.network, route.mask)) {
      let nextHopDevice: Device | undefined;
      let nextHopLinkId: string | null = null;
      let isAzureVng = false;
      let rawVngId = '';

      // Check if the next hop is actually a local interface name (e.g., 'fastethernet0/1')
      const isLocalIntf = Object.keys(sourceDevice.interfaces).includes(route.nextHopIp);
      
      if (isLocalIntf) {
        const physicalIntf = route.nextHopIp.split('.')[0];
        const link = Object.values(allLinks).find(l => 
          (l.sourceDeviceId === sourceDevice.id && l.sourceInterfaceId === physicalIntf) ||
          (l.targetDeviceId === sourceDevice.id && l.targetInterfaceId === physicalIntf)
        );
        
        if (link) {
          nextHopLinkId = link.id;
          const neighborId = link.sourceDeviceId === sourceDevice.id ? link.targetDeviceId : link.sourceDeviceId;
          
          if (neighborId.startsWith('azure-vng-')) {
             isAzureVng = true;
             rawVngId = neighborId.replace('azure-vng-', '');
          } else {
             nextHopDevice = allDevices[neighborId];
          }
        }
      } else {
        // Next hop is an IP address
        nextHopDevice = Object.values(allDevices).find(d => Object.values(d.interfaces).some(i => i.ipv4?.ip === route.nextHopIp && i.isUp));
        if (nextHopDevice) {
           nextHopLinkId = getLinkBetween(sourceDevice.id, nextHopDevice.id);
        }
      }

      if (isAzureVng) {
        const azureState = useAzureStore.getState();
        const vng = azureState.vngs[rawVngId];
        const targetVm = Object.values(azureState.vms).find(vm => vm.privateIpAddress === targetIp && vm.status === 'Running');
        if (vng && targetVm && targetVm.subnetId) {
          const routingResult = checkAzureRouting(azureState, vng.vnetId, targetVm, srcIp, targetIp);
          if (routingResult.droppedByNsg) return false;
          if (routingResult.success) return true;
        }
      } else if (nextHopDevice && nextHopLinkId) {
        return simulatePing(nextHopDevice, targetIp, ttl - 1, srcIp);
      }
    }
  }
  return false;
}

export function tracePath(sourceDevice: Device, targetIp: string, visited: Set<string> = new Set(), originalSrcIp?: string): { success: boolean, hops: string[], links: string[] } {
  const state = useNetworkStore.getState();
  const allDevices = state.devices;
  const allLinks = state.links;

  const srcIp = originalSrcIp || Object.values(sourceDevice.interfaces).find(i => i.isUp && i.ipv4)?.ipv4?.ip || '0.0.0.0';

  if (visited.has(sourceDevice.id)) return { success: false, hops: ['* (Routing Loop Detected)'], links: [] };
  visited.add(sourceDevice.id);

  if (Object.values(sourceDevice.interfaces).some(i => i.ipv4?.ip === targetIp && i.isUp)) {
     return { success: true, hops: [targetIp], links: [] };
  }

  for (const srcIntf of Object.values(sourceDevice.interfaces)) {
    if (!srcIntf.isUp || !srcIntf.ipv4 || srcIntf.stpState === 'blocking') continue;
    if (!isPermittedByAcl(sourceDevice, srcIntf.outboundAclId, srcIp, targetIp)) return { success: false, hops: ['* (Administratively Prohibited)'], links: [] };

    const physicalSrcIntf = srcIntf.id.split('.')[0];
    const connectedLinks = Object.values(allLinks).filter(l => 
      (l.sourceDeviceId === sourceDevice.id && l.sourceInterfaceId === physicalSrcIntf) || 
      (l.targetDeviceId === sourceDevice.id && l.targetInterfaceId === physicalSrcIntf)
    );

    for (const link of connectedLinks) {
      const neighborId = link.sourceDeviceId === sourceDevice.id ? link.targetDeviceId : link.sourceDeviceId;
      
      // Azure VNG Integration for TracePath
      if (neighborId.startsWith('azure-vng-')) {
        const rawVngId = neighborId.replace('azure-vng-', '');
        const azureState = useAzureStore.getState();
        const vng = azureState.vngs[rawVngId];
        const targetVm = Object.values(azureState.vms).find(vm => vm.privateIpAddress === targetIp && vm.status === 'Running');
        if (vng && targetVm) {
          const routingResult = checkAzureRouting(azureState, vng.vnetId, targetVm, srcIp, targetIp);
          if (routingResult.droppedByNsg) {
             return { success: false, hops: [`${vng.publicIpAddress || 'VNG-Gateway'}`, '* (Administratively Prohibited by NSG)'], links: [link.id] };
          }
          if (routingResult.success) {
             return { success: true, hops: [`${vng.publicIpAddress || 'VNG-Gateway'}`, targetIp], links: [link.id] };
          }
        }
        continue;
      }

      const neighborDevice = allDevices[neighborId];
      if (!neighborDevice) continue;

      for (const neighborIntf of Object.values(neighborDevice.interfaces)) {
        if (neighborIntf.isUp && neighborIntf.ipv4?.ip === targetIp && neighborIntf.stpState !== 'blocking') {
          if (!isPermittedByAcl(neighborDevice, neighborIntf.inboundAclId, srcIp, targetIp)) {
             return { success: false, hops: ['* (Administratively Prohibited)'], links: [] };
          }
          const vlan = srcIntf.accessVlan || 1;
          const targetVlan = neighborIntf.accessVlan || 1;
          if (vlan === targetVlan && isSameSubnet(srcIntf.ipv4.ip, neighborIntf.ipv4.ip, srcIntf.ipv4.mask)) {
            return { success: true, hops: [targetIp], links: [link.id] };
          }
        }
      }
    }
  }

  for (const route of sourceDevice.routingTable) {
    if (isSameSubnet(targetIp, route.network, route.mask)) {
      let nextHopDevice: Device | undefined;
      let nextHopLinkId: string | null = null;
      let isAzureVng = false;
      let rawVngId = '';

      const isLocalIntf = Object.keys(sourceDevice.interfaces).includes(route.nextHopIp);
      if (isLocalIntf) {
        const physicalIntf = route.nextHopIp.split('.')[0];
        const link = Object.values(allLinks).find(l => 
          (l.sourceDeviceId === sourceDevice.id && l.sourceInterfaceId === physicalIntf) ||
          (l.targetDeviceId === sourceDevice.id && l.targetInterfaceId === physicalIntf)
        );
        if (link) {
          nextHopLinkId = link.id;
          const neighborId = link.sourceDeviceId === sourceDevice.id ? link.targetDeviceId : link.sourceDeviceId;
          if (neighborId.startsWith('azure-vng-')) {
             isAzureVng = true;
             rawVngId = neighborId.replace('azure-vng-', '');
          } else {
             nextHopDevice = allDevices[neighborId];
          }
        }
      } else {
        nextHopDevice = Object.values(allDevices).find(d => Object.values(d.interfaces).some(i => i.ipv4?.ip === route.nextHopIp && i.isUp));
        if (nextHopDevice) {
           nextHopLinkId = getLinkBetween(sourceDevice.id, nextHopDevice.id);
        }
      }

      if (isAzureVng && nextHopLinkId) {
        const azureState = useAzureStore.getState();
        const vng = azureState.vngs[rawVngId];
        const targetVm = Object.values(azureState.vms).find(vm => vm.privateIpAddress === targetIp && vm.status === 'Running');
        if (vng && targetVm && targetVm.subnetId) {
          const routingResult = checkAzureRouting(azureState, vng.vnetId, targetVm, srcIp, targetIp);
          if (routingResult.droppedByNsg) {
             return { success: false, hops: [`${vng.publicIpAddress || 'VNG-Gateway'}`, '* (Administratively Prohibited by NSG)'], links: [nextHopLinkId] };
          }
          if (routingResult.success) {
             return { success: true, hops: [`${vng.publicIpAddress || 'VNG-Gateway'}`, targetIp], links: [nextHopLinkId] };
          }
        }
      } else if (nextHopDevice && nextHopLinkId) {
        const nextTrace = tracePath(nextHopDevice, targetIp, visited, srcIp);
        return {
          success: nextTrace.success,
          hops: [isLocalIntf ? nextHopDevice.interfaces['fastethernet0/0']?.ipv4?.ip || '?' : route.nextHopIp, ...nextTrace.hops],
          links: [nextHopLinkId, ...nextTrace.links]
        };
      }
    }
  }

  return { success: false, hops: ['* Request timed out.'], links: [] };
}

export async function animatePath(links: string[]) {
  const setActiveLinks = useNetworkStore.getState().setActiveLinks;
  const currentPath: string[] = [];
  for (const linkId of links) {
    if (!linkId) continue;
    currentPath.push(linkId);
    setActiveLinks([...currentPath]);
    await new Promise(resolve => setTimeout(resolve, 500)); 
  }
  await new Promise(resolve => setTimeout(resolve, 1500)); 
  setActiveLinks([]);
}