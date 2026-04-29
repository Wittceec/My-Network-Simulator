import { useNetworkStore } from '../../store/useNetworkStore';

export function runSTP() {
  const state = useNetworkStore.getState();
  const switches = Object.values(state.devices).filter(d => d.type === 'switch');
  const allLinks = Object.values(state.links);

  if (switches.length === 0) return;

  // 1. Elect Root Bridge (We use the lowest Switch ID as a proxy for lowest MAC address)
  const rootBridge = switches.reduce((min, sw) => sw.id < min.id ? sw : min, switches[0]);

  // Map out the switch connections
  const adj: Record<string, { neighbor: string, linkId: string, myIntf: string, theirIntf: string }[]> = {};
  switches.forEach(sw => adj[sw.id] = []);

  allLinks.forEach(l => {
    const d1 = state.devices[l.sourceDeviceId];
    const d2 = state.devices[l.targetDeviceId];
    if (d1?.type === 'switch' && d2?.type === 'switch') {
      adj[l.sourceDeviceId].push({ neighbor: l.targetDeviceId, linkId: l.id, myIntf: l.sourceInterfaceId, theirIntf: l.targetInterfaceId });
      adj[l.targetDeviceId].push({ neighbor: l.sourceDeviceId, linkId: l.id, myIntf: l.targetInterfaceId, theirIntf: l.sourceInterfaceId });
    }
  });

  // 2. Find Shortest Path to Root (Breadth-First Search)
  const costToRoot: Record<string, number> = {};
  switches.forEach(sw => costToRoot[sw.id] = Infinity);
  costToRoot[rootBridge.id] = 0;

  const queue = [rootBridge.id];
  while (queue.length > 0) {
    const curr = queue.shift()!;
    adj[curr].forEach(edge => {
      if (costToRoot[curr] + 1 < costToRoot[edge.neighbor]) {
        costToRoot[edge.neighbor] = costToRoot[curr] + 1;
        queue.push(edge.neighbor);
      }
    });
  }

  // 3. Determine Forwarding vs Blocking Ports
  const forwardingPorts: Record<string, string[]> = {}; 
  switches.forEach(sw => forwardingPorts[sw.id] = []);

  // Determine Root Ports (RP) for non-root switches
  switches.forEach(sw => {
    if (sw.id === rootBridge.id) return;
    let rootPortIntf = '';
    let minCost = Infinity;
    let tieBreakerId = 'ZZZ';

    adj[sw.id].forEach(edge => {
       const neighborCost = costToRoot[edge.neighbor];
       if (neighborCost < minCost || (neighborCost === minCost && edge.neighbor < tieBreakerId)) {
           minCost = neighborCost;
           tieBreakerId = edge.neighbor;
           rootPortIntf = edge.myIntf;
       }
    });
    if (rootPortIntf) forwardingPorts[sw.id].push(rootPortIntf);
  });

  // Determine Designated Ports (DP) for every link
  allLinks.forEach(link => {
    const d1 = state.devices[link.sourceDeviceId];
    const d2 = state.devices[link.targetDeviceId];
    
    if (d1?.type === 'switch' && d2?.type === 'switch') {
      const cost1 = costToRoot[d1.id];
      const cost2 = costToRoot[d2.id];

      let dpSwitch = d1.id;
      let dpIntf = link.sourceInterfaceId;

      if (cost1 < cost2) {
        dpSwitch = d1.id; dpIntf = link.sourceInterfaceId;
      } else if (cost2 < cost1) {
        dpSwitch = d2.id; dpIntf = link.targetInterfaceId;
      } else {
         // Tie breaker
         if (d1.id < d2.id) { dpSwitch = d1.id; dpIntf = link.sourceInterfaceId; }
         else { dpSwitch = d2.id; dpIntf = link.targetInterfaceId; }
      }
      if (!forwardingPorts[dpSwitch].includes(dpIntf)) forwardingPorts[dpSwitch].push(dpIntf);
    } else {
       // Ports connected to PCs/Routers are always forwarding
       if (d1?.type === 'switch') forwardingPorts[d1.id].push(link.sourceInterfaceId);
       if (d2?.type === 'switch') forwardingPorts[d2.id].push(link.targetInterfaceId);
    }
  });

  // 4. Update Zustand Store with port states
  switches.forEach(sw => {
     state.updateDevice(sw.id, (d) => {
        const newInterfaces = { ...d.interfaces };
        Object.keys(newInterfaces).forEach(intfId => {
            newInterfaces[intfId] = {
               ...newInterfaces[intfId],
               stpState: forwardingPorts[sw.id].includes(intfId) ? 'forwarding' : 'blocking'
            };
        });
        return { ...d, interfaces: newInterfaces, isRootBridge: sw.id === rootBridge.id };
     });
  });
}