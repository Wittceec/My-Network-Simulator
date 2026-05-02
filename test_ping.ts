import { PREMADE_LABS } from './src/data/premadeLabs.ts';
import { runOSPF } from './src/core/logic/ospf.ts';
import { simulatePing, tracePath } from './src/core/logic/ping.ts';
import { useNetworkStore } from './src/store/useNetworkStore.ts';

const lab = PREMADE_LABS.find(l => l.id === 'ospf-advanced');
useNetworkStore.getState().loadLab(JSON.parse(JSON.stringify(lab.devices)), JSON.parse(JSON.stringify(lab.links)));

// Delete R1-R4 link
const state = useNetworkStore.getState();
state.removeLink('link-R4-R1');

// Run OSPF
runOSPF();

const r1 = useNetworkStore.getState().devices['R1'];
console.log("R1 Routing Table:", r1.routingTable);

const sim = simulatePing(r1, '10.0.34.4');
console.log("Simulate Ping:", sim);

const trace = tracePath(r1, '10.0.34.4');
console.log("Trace Path:", trace);

