import { useNetworkStore } from '../../store/useNetworkStore';
import type { Device } from '../../types/device';
import { simulatePing, tracePath } from '../logic/ping';

export function executePcCommand(rawInput: string, device: Device): string[] {
  const input = rawInput.trim();
  const args = input.split(/\s+/);
  const cmd = args[0].toLowerCase();
  const output: string[] = [];

  if (!cmd) return output;
  const updateDevice = useNetworkStore.getState().updateDevice;

  if (cmd === 'ping') {
    const targetIp = args[1];
    if (!targetIp) {
      output.push('Usage: ping <ip_address>');
    } else {
      output.push(`Pinging ${targetIp} with 32 bytes of data:`);
      const success = simulatePing(device, targetIp);
      if (success) {
        output.push(`Reply from ${targetIp}: bytes=32 time=1ms TTL=128`);
        output.push(`Reply from ${targetIp}: bytes=32 time=1ms TTL=128`);
        output.push(`Reply from ${targetIp}: bytes=32 time=1ms TTL=128`);
        output.push(`Reply from ${targetIp}: bytes=32 time=1ms TTL=128`);
      } else {
        output.push('Request timed out.');
        output.push('Request timed out.');
        output.push('Request timed out.');
        output.push('Request timed out.');
      }
    }
  } else if (cmd === 'tracert') {
    const targetIp = args[1];
    if (!targetIp) {
      output.push('Usage: tracert <ip_address>');
    } else {
      output.push(`Tracing route to ${targetIp} over a maximum of 30 hops:\n`);
      const traceResult = tracePath(device, targetIp);
      traceResult.hops.forEach((hop, index) => {
        output.push(`  ${index + 1}    <1 ms    <1 ms    <1 ms    ${hop}`);
      });
      output.push(traceResult.success ? '\nTrace complete.' : '\nTrace aborted.');
    }
  } else if (cmd === 'ipconfig') {
    if (args[1] === 'dhcp') {
      output.push('Requesting IP address from DHCP server...');
      const state = useNetworkStore.getState();
      const routers = Object.values(state.devices).filter(d => d.type === 'router' && d.dhcpPools);
      
      let assigned = false;
      for (const router of routers) {
        const pools = Object.values(router.dhcpPools || {});
        if (pools.length > 0) {
          const pool = pools[0] as any; 
          const baseIp = pool.network.split('.').slice(0, 3).join('.');
          const newIp = `${baseIp}.${pool.nextIpSuffix}`;
          
          updateDevice(device.id, (d) => ({
            ...d,
            interfaces: { ...d.interfaces, 'eth0': { id: 'eth0', isUp: true, ipv4: { ip: newIp, mask: pool.mask }, mode: 'access', accessVlan: 1, shortName: 'eth0', macAddress: '0000.0000.0000' } },
            routingTable: [{ network: '0.0.0.0', mask: '0.0.0.0', nextHopIp: pool.defaultRouter, protocol: 'static', metric: 1 }]
          }));

          state.updateDevice(router.id, (r) => ({
            ...r, dhcpPools: { ...r.dhcpPools, [pool.name]: { ...pool, nextIpSuffix: pool.nextIpSuffix + 1 } }
          }));

          output.push(`DHCP request successful.`);
          output.push(`IPv4 Address. . . . . . . . . . . : ${newIp}`);
          output.push(`Subnet Mask . . . . . . . . . . . : ${pool.mask}`);
          output.push(`Default Gateway . . . . . . . . . : ${pool.defaultRouter}`);
          assigned = true;
          break;
        }
      }

      if (!assigned) output.push('DHCP request failed. No DHCP server found.');
    } else if (args[1]) {
      const ip = args[1]; const mask = args[2] || '255.255.255.0'; const gateway = args[3] || '0.0.0.0';
      updateDevice(device.id, (d) => ({
        ...d,
        interfaces: { ...d.interfaces, 'eth0': { id: 'eth0', shortName: 'eth0', isUp: true, mode: 'access', accessVlan: 1, macAddress: '0000.0000.0000', ipv4: { ip, mask } } },
        routingTable: [{ network: '0.0.0.0', mask: '0.0.0.0', nextHopIp: gateway, protocol: 'static', metric: 1 }]
      }));
      output.push(`Configuration saved. IP: ${ip}, Mask: ${mask}, Gateway: ${gateway}`);
    } else {
      const intf = device.interfaces['eth0'];
      const ip = intf?.ipv4?.ip || '0.0.0.0'; const mask = intf?.ipv4?.mask || '0.0.0.0';
      const gw = device.routingTable.find(r => r.network === '0.0.0.0')?.nextHopIp || '0.0.0.0';
      output.push(''); output.push('Ethernet adapter Local Area Connection:'); output.push('');
      output.push(`   IPv4 Address. . . . . . . . . . . : ${ip}`);
      output.push(`   Subnet Mask . . . . . . . . . . . : ${mask}`);
      output.push(`   Default Gateway . . . . . . . . . : ${gw}`); output.push('');
    }
  } else if (cmd === 'arp' && args[1] === '-a') {
    const entries = Object.entries(device.arpTable || {});
    if (entries.length === 0) output.push('No ARP Entries Found.');
    else {
      output.push('  Internet Address      Physical Address      Type');
      entries.forEach(([ip, mac]) => output.push(`  ${ip.padEnd(21)} ${mac.padEnd(21)} dynamic`));
    }
  } else {
    output.push(`'${cmd}' is not recognized as an internal or external command.`);
  }

  return output;
}