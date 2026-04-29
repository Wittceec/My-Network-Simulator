import { useNetworkStore } from '../../store/useNetworkStore';
import { isSameSubnet } from '../../utils/ipMath';
import type { Device } from '../../types/device';

// --- NEW: ACL MATH ENGINE ---
function matchesWildcard(ip: string, network: string, wildcard: string): boolean {
  if (network === '0.0.0.0' && wildcard === '255.255.255.255') return true; // 'any' keyword
  
  const ipParts = ip.split('.').map(Number);
  const netParts = network.split('.').map(Number);
  const wildParts = wildcard.split('.').map(Number);
  
  for(let i = 0; i < 4; i++) {
    // If the wildcard octet is 0, the IP octet MUST match the Network octet exactly
    if (wildParts[i] === 0 && ipParts[i] !== netParts[i]) return false;
  }
  return true;
}

function isPermittedByAcl(device: Device, aclId: string | undefined, srcIp: string, dstIp: string): boolean {
  if (!aclId) return true; // No ACL assigned to this interface = traffic allowed
  
  const acl = device.acls[aclId];
  if (!acl || acl.rules.length === 0) return true;

  // Read rules top-down based on sequence number
  const rules = [...acl.rules].sort((a, b) => a.sequence - b.sequence);

  for (const rule of rules) {
    const srcMatch = matchesWildcard(srcIp, rule.sourceIp, rule.sourceWildcard);
    
    let dstMatch = true;
    if (acl.type === 'extended') {
      dstMatch = matchesWildcard(dstIp, rule.destIp, rule.destWildcard);
    }

    if (srcMatch && dstMatch) {
      return rule.action === 'permit';
    }
  }
  
  // Implicit Deny Any at the end of every ACL!
  return false; 
}
// ----------------------------

function getLinkBetween(devAId: string, devBId: string): string | null {
  const links = Object.values(useNetworkStore.getState().links);
  const link = links.find(l => 
    (l.sourceDeviceId === devAId && l.targetDeviceId === devBId) || 
    (l.sourceDeviceId === devBId && l.targetDeviceId === devAId)
  );
  return link ? link.id : null;
}

// UPDATED: Now tracks originalSrcIp for accurate ACL filtering across multiple hops
export function simulatePing(sourceDevice: Device, targetIp: string, ttl: number = 5, originalSrcIp?: string): boolean {
  if (ttl <= 0) return false;
  const state = useNetworkStore.getState();
  const allDevices = state.devices;
  const allLinks = state.links;

  // The IP this packet was originally generated from
  const srcIp = originalSrcIp || Object.values(sourceDevice.interfaces).find(i => i.isUp && i.ipv4)?.ipv4?.ip || '0.0.0.0';

  const isLocal = Object.values(sourceDevice.interfaces).some(intf => intf.ipv4?.ip === targetIp && intf.isUp);
  if (isLocal) return true;

  for (const srcIntf of Object.values(sourceDevice.interfaces)) {
    if (!srcIntf.isUp || !srcIntf.ipv4 || srcIntf.stpState === 'blocking') continue;
    
    // ACL CHECK: Outbound on source interface
    if (!isPermittedByAcl(sourceDevice, srcIntf.outboundAclId, srcIp, targetIp)) continue;

    const connectedLinks = Object.values(allLinks).filter(l => l.sourceDeviceId === sourceDevice.id || l.targetDeviceId === sourceDevice.id);

    for (const link of connectedLinks) {
      const neighborId = link.sourceDeviceId === sourceDevice.id ? link.targetDeviceId : link.sourceDeviceId;
      const neighborDevice = allDevices[neighborId];
      if (!neighborDevice) continue;

      if (neighborDevice.type === 'switch') {
        const switchPort = link.sourceDeviceId === neighborDevice.id ? link.sourceInterfaceId : link.targetInterfaceId;
        const srcMac = srcIntf.macAddress !== '0000.0000.0000' && srcIntf.macAddress ? srcIntf.macAddress : `0000.1111.${sourceDevice.id.padStart(4, '0')}`;
        const vlan = srcIntf.accessVlan || 1;

        state.updateDevice(neighborDevice.id, (sw) => {
          if (sw.macAddressTable[srcMac]?.port === switchPort) return sw;
          return { ...sw, macAddressTable: { ...sw.macAddressTable, [srcMac]: { port: switchPort, vlan: vlan } } };
        });
      }

      for (const neighborIntf of Object.values(neighborDevice.interfaces)) {
        if (neighborIntf.isUp && neighborIntf.ipv4?.ip === targetIp && neighborIntf.stpState !== 'blocking') {
          
          // ACL CHECK: Inbound on destination interface
          if (!isPermittedByAcl(neighborDevice, neighborIntf.inboundAclId, srcIp, targetIp)) continue;

          const srcVlan = srcIntf.accessVlan || 1;
          const targetVlan = neighborIntf.accessVlan || 1;

          if (srcVlan === targetVlan && isSameSubnet(srcIntf.ipv4.ip, neighborIntf.ipv4.ip, srcIntf.ipv4.mask)) {
            const srcMac = srcIntf.macAddress !== '0000.0000.0000' && srcIntf.macAddress ? srcIntf.macAddress : `0000.1111.${sourceDevice.id.padStart(4, '0')}`;
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
      const nextHopDevice = Object.values(allDevices).find(d => Object.values(d.interfaces).some(i => i.ipv4?.ip === route.nextHopIp && i.isUp));
      // Pass the original source IP down to the next hop!
      if (nextHopDevice) return simulatePing(nextHopDevice, targetIp, ttl - 1, srcIp);
    }
  }
  return false;
}

// UPDATED: TracePath gets the identical ACL treatment
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
    
    // ACL CHECK
    if (!isPermittedByAcl(sourceDevice, srcIntf.outboundAclId, srcIp, targetIp)) return { success: false, hops: ['* (Administratively Prohibited)'], links: [] };

    const connectedLinks = Object.values(allLinks).filter(l => l.sourceDeviceId === sourceDevice.id || l.targetDeviceId === sourceDevice.id);
    for (const link of connectedLinks) {
      const neighborId = link.sourceDeviceId === sourceDevice.id ? link.targetDeviceId : link.sourceDeviceId;
      const neighborDevice = allDevices[neighborId];
      if (!neighborDevice) continue;

      for (const neighborIntf of Object.values(neighborDevice.interfaces)) {
        if (neighborIntf.isUp && neighborIntf.ipv4?.ip === targetIp && neighborIntf.stpState !== 'blocking') {
          
          // ACL CHECK
          if (!isPermittedByAcl(neighborDevice, neighborIntf.inboundAclId, srcIp, targetIp)) {
             return { success: false, hops: ['* (Administratively Prohibited)'], links: [] };
          }

          const srcVlan = srcIntf.accessVlan || 1;
          const targetVlan = neighborIntf.accessVlan || 1;
          if (srcVlan === targetVlan && isSameSubnet(srcIntf.ipv4.ip, neighborIntf.ipv4.ip, srcIntf.ipv4.mask)) {
            return { success: true, hops: [targetIp], links: [link.id] };
          }
        }
      }
    }
  }

  for (const route of sourceDevice.routingTable) {
    if (isSameSubnet(targetIp, route.network, route.mask)) {
      const nextHopDevice = Object.values(allDevices).find(d =>
        Object.values(d.interfaces).some(i => i.ipv4?.ip === route.nextHopIp && i.isUp)
      );
      if (nextHopDevice) {
        const linkId = getLinkBetween(sourceDevice.id, nextHopDevice.id);
        const nextTrace = tracePath(nextHopDevice, targetIp, visited, srcIp);
        return {
          success: nextTrace.success,
          hops: [route.nextHopIp, ...nextTrace.hops],
          links: linkId ? [linkId, ...nextTrace.links] : nextTrace.links
        };
      }
    }
  }

  return { success: false, hops: ['* Request timed out.'], links: [] };
}

export async function animatePath(links: string[]) {
  const setActiveLink = useNetworkStore.getState().setActiveLink;
  for (const linkId of links) {
    if (!linkId) continue;
    setActiveLink(linkId);
    await new Promise(resolve => setTimeout(resolve, 600)); 
  }
  setActiveLink(null);
}