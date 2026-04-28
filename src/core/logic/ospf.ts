import { useNetworkStore } from '../../store/useNetworkStore';
import type { Device, Route } from '../../types/device';

// --- MATH HELPERS ---
function getNetworkAddress(ip: string, mask: string): string {
  const ipParts = ip.split('.').map(Number);
  const maskParts = mask.split('.').map(Number);
  return ipParts.map((p, i) => p & maskParts[i]).join('.');
}

function isSameSubnet(ip1: string, ip2: string, mask: string): boolean {
  return getNetworkAddress(ip1, mask) === getNetworkAddress(ip2, mask);
}

function matchesWildcard(ip: string, network: string, wildcard: string) {
  const ipParts = ip.split('.').map(Number);
  const netParts = network.split('.').map(Number);
  const wildParts = wildcard.split('.').map(Number);
  for(let i = 0; i < 4; i++) {
    // If wildcard is 0, the IP and Network must match exactly for this octet
    if (wildParts[i] === 0 && ipParts[i] !== netParts[i]) return false;
  }
  return true;
}

// --- THE ALGORITHM ---
export function runOSPF() {
  const state = useNetworkStore.getState();
  const allDevices = state.devices;
  const allLinks = Object.values(state.links);

  // 1. Identify all OSPF routers and reset their dynamic routes
  const routers = Object.values(allDevices).filter(d => d.type === 'router' && (d as any).ospf);
  const newRoutingTables: Record<string, Route[]> = {};

  routers.forEach(r => {
    // Strip out old OSPF routes to recalculate fresh
    newRoutingTables[r.id] = r.routingTable.filter(route => route.protocol !== 'ospf');
  });

  // 2. Discover local OSPF networks for each router
  const routerLocalNetworks: Record<string, { network: string, mask: string, nextHop: string, metric: number }[]> = {};

  routers.forEach(r => {
    const ospf = (r as any).ospf;
    routerLocalNetworks[r.id] = [];

    Object.values(r.interfaces).forEach(intf => {
      if (!intf.isUp || !intf.ipv4) return;
      
      const isOspfEnabled = ospf.networks.some((n: any) => matchesWildcard(intf.ipv4!.ip, n.network, n.wildcard));

      if (isOspfEnabled) {
        const netAddress = getNetworkAddress(intf.ipv4.ip, intf.ipv4.mask);
        routerLocalNetworks[r.id].push({
          network: netAddress,
          mask: intf.ipv4.mask,
          nextHop: '0.0.0.0', // Directly connected
          metric: 0
        });
      }
    });
  });

  // 3. Form Adjacencies (Neighbors)
  const adjacencies: Record<string, { neighborId: string, neighborIp: string }[]> = {};
  routers.forEach(r => adjacencies[r.id] = []);

  routers.forEach(r1 => {
    routers.forEach(r2 => {
      if (r1.id === r2.id) return;

      // Check if they are physically connected by a cable
      const connectedLink = allLinks.find(l =>
        (l.sourceDeviceId === r1.id && l.targetDeviceId === r2.id) ||
        (l.sourceDeviceId === r2.id && l.targetDeviceId === r1.id)
      );

      if (connectedLink) {
         const intf1Id = connectedLink.sourceDeviceId === r1.id ? connectedLink.sourceInterfaceId : connectedLink.targetInterfaceId;
         const intf2Id = connectedLink.sourceDeviceId === r2.id ? connectedLink.sourceInterfaceId : connectedLink.targetInterfaceId;

         const intf1 = r1.interfaces[intf1Id];
         const intf2 = r2.interfaces[intf2Id];

         // Check if the interfaces are UP, have IPs, are in the same subnet, AND both have OSPF enabled
         if (intf1?.isUp && intf1?.ipv4 && intf2?.isUp && intf2?.ipv4) {
            const ospf1 = (r1 as any).ospf;
            const ospf2 = (r2 as any).ospf;
            const r1Enabled = ospf1.networks.some((n: any) => matchesWildcard(intf1.ipv4!.ip, n.network, n.wildcard));
            const r2Enabled = ospf2.networks.some((n: any) => matchesWildcard(intf2.ipv4!.ip, n.network, n.wildcard));

            if (r1Enabled && r2Enabled && isSameSubnet(intf1.ipv4.ip, intf2.ipv4.ip, intf1.ipv4.mask)) {
               adjacencies[r1.id].push({ neighborId: r2.id, neighborIp: intf2.ipv4.ip });
            }
         }
      }
    });
  });

  // 4. Share Routes (Shortest Path Calculation)
  let changed = true;
  let iterations = 0;
  
  // Prevent infinite loops, cap at 20 hops (OSPF scales much higher, but this is safe for our canvas)
  while (changed && iterations < 20) {
    changed = false;
    iterations++;

    routers.forEach(r => {
       adjacencies[r.id].forEach(adj => {
          routerLocalNetworks[adj.neighborId].forEach(neighborRoute => {
             const existingRoute = routerLocalNetworks[r.id].find(rt => rt.network === neighborRoute.network && rt.mask === neighborRoute.mask);

             // If we don't know this route, OR if this new path has a lower metric, update it!
             if (!existingRoute || existingRoute.metric > neighborRoute.metric + 1) {
                if (existingRoute) {
                   existingRoute.metric = neighborRoute.metric + 1;
                   existingRoute.nextHop = adj.neighborIp;
                } else {
                   routerLocalNetworks[r.id].push({
                      network: neighborRoute.network,
                      mask: neighborRoute.mask,
                      nextHop: adj.neighborIp,
                      metric: neighborRoute.metric + 1
                   });
                }
                changed = true;
             }
          });
       });
    });
  }

  // 5. Inject the calculated routes into the routers' brains
  routers.forEach(r => {
    routerLocalNetworks[r.id].forEach(rt => {
       if (rt.metric > 0) { // Metric 0 is directly connected; no need to inject those
         newRoutingTables[r.id].push({
            network: rt.network,
            mask: rt.mask,
            nextHopIp: rt.nextHop,
            protocol: 'ospf',
            metric: rt.metric
         });
       }
    });

    // Update Zustand
    state.updateDevice(r.id, (d) => ({
       ...d,
       routingTable: newRoutingTables[r.id]
    }));
  });
}