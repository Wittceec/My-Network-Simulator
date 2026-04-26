import { useNetworkStore } from '../../store/useNetworkStore';
import { isSameSubnet } from '../../utils/ipMath';
import type { Device } from '../../types/device';

// Helper to find the physical cable between two devices
function getLinkBetween(devAId: string, devBId: string): string | null {
  const links = Object.values(useNetworkStore.getState().links);
  const link = links.find(l => 
    (l.sourceDeviceId === devAId && l.targetDeviceId === devBId) || 
    (l.sourceDeviceId === devBId && l.targetDeviceId === devAId)
  );
  return link ? link.id : null;
}

export function simulatePing(sourceDevice: Device, targetIp: string, ttl: number = 5): boolean {
  if (ttl <= 0) return false;
  const state = useNetworkStore.getState();
  const allDevices = state.devices;
  const allLinks = state.links;

  const isLocal = Object.values(sourceDevice.interfaces).some(intf => intf.ipv4?.ip === targetIp && intf.isUp);
  if (isLocal) return true;

  for (const srcIntf of Object.values(sourceDevice.interfaces)) {
    if (!srcIntf.isUp || !srcIntf.ipv4) continue;
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
        if (neighborIntf.isUp && neighborIntf.ipv4?.ip === targetIp) {
          const srcVlan = srcIntf.accessVlan || 1;
          const targetVlan = neighborIntf.accessVlan || 1;

          if (srcVlan === targetVlan && isSameSubnet(srcIntf.ipv4.ip, neighborIntf.ipv4.ip, srcIntf.ipv4.mask)) {
            const srcIp = srcIntf.ipv4.ip;
            const srcMac = srcIntf.macAddress !== '0000.0000.0000' && srcIntf.macAddress ? srcIntf.macAddress : `0000.1111.${sourceDevice.id.padStart(4, '0')}`;
            const targetMac = neighborIntf.macAddress !== '0000.0000.0000' && neighborIntf.macAddress ? neighborIntf.macAddress : `0000.1111.${neighborDevice.id.padStart(4, '0')}`;
            state.updateDevice(sourceDevice.id, (d) => ({ ...d, arpTable: { ...(d.arpTable || {}), [targetIp]: targetMac } }));
            state.updateDevice(neighborDevice.id, (d) => ({ ...d, arpTable: { ...(d.arpTable || {}), [srcIp]: srcMac } }));
            return true;
          }
        }
      }
    }
  }

  for (const route of sourceDevice.routingTable) {
    if (isSameSubnet(targetIp, route.network, route.mask)) {
      const nextHopDevice = Object.values(allDevices).find(d => Object.values(d.interfaces).some(i => i.ipv4?.ip === route.nextHopIp && i.isUp));
      if (nextHopDevice) return simulatePing(nextHopDevice, targetIp, ttl - 1);
    }
  }
  return false;
}

// Updated TracePath: Now returns the physical links it crossed!
export function tracePath(sourceDevice: Device, targetIp: string, visited: Set<string> = new Set()): { success: boolean, hops: string[], links: string[] } {
  const state = useNetworkStore.getState();
  const allDevices = state.devices;
  const allLinks = state.links;

  if (visited.has(sourceDevice.id)) return { success: false, hops: ['* (Routing Loop Detected)'], links: [] };
  visited.add(sourceDevice.id);

  if (Object.values(sourceDevice.interfaces).some(i => i.ipv4?.ip === targetIp && i.isUp)) {
     return { success: true, hops: [targetIp], links: [] };
  }

  for (const srcIntf of Object.values(sourceDevice.interfaces)) {
    if (!srcIntf.isUp || !srcIntf.ipv4) continue;
    const connectedLinks = Object.values(allLinks).filter(l => l.sourceDeviceId === sourceDevice.id || l.targetDeviceId === sourceDevice.id);
    for (const link of connectedLinks) {
      const neighborId = link.sourceDeviceId === sourceDevice.id ? link.targetDeviceId : link.sourceDeviceId;
      const neighborDevice = allDevices[neighborId];
      if (!neighborDevice) continue;

      for (const neighborIntf of Object.values(neighborDevice.interfaces)) {
        if (neighborIntf.isUp && neighborIntf.ipv4?.ip === targetIp) {
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
        const nextTrace = tracePath(nextHopDevice, targetIp, visited);
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

// NEW: The Animation Controller!
export async function animatePath(links: string[]) {
  const setActiveLink = useNetworkStore.getState().setActiveLink;
  
  for (const linkId of links) {
    if (!linkId) continue;
    setActiveLink(linkId);
    // Pause for 600ms on this cable before moving to the next one
    await new Promise(resolve => setTimeout(resolve, 600)); 
  }
  
  // Turn off the glow when finished
  setActiveLink(null);
}