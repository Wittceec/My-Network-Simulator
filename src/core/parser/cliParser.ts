import { useNetworkStore } from '../../store/useNetworkStore';
import type { Device } from '../../types/device';
import { simulatePing, tracePath, animatePath } from '../logic/ping';

export type CliMode = 'user' | 'privilege' | 'global' | 'interface' | 'dhcp';

interface ParserResult {
  output: string[];
  newMode: CliMode;
  newContext: string;
}

export function executeCommand(
  rawInput: string,
  currentMode: CliMode,
  currentContext: string,
  device: Device
): ParserResult {
  const input = rawInput.trim();
  const args = input.split(/\s+/);
  const cmd = args[0].toLowerCase();

  let result: ParserResult = {
    output: [],
    newMode: currentMode,
    newContext: currentContext,
  };

  if (!cmd) return result;

  const updateDevice = useNetworkStore.getState().updateDevice;

  // --- GLOBAL COMMANDS ---
  if (cmd === 'exit') {
    if (currentMode === 'interface' || currentMode === 'dhcp') {
      result.newMode = 'global';
      result.newContext = '';
    } else if (currentMode === 'global') {
      result.newMode = 'privilege';
    } else if (currentMode === 'privilege') {
      result.newMode = 'user';
    }
    return result;
  } 
  
  if (cmd === 'end') {
    if (currentMode === 'global' || currentMode === 'interface' || currentMode === 'dhcp') {
      result.newMode = 'privilege';
      result.newContext = '';
      return result;
    }
  }

  switch (currentMode) {
    case 'user':
      if (cmd === 'enable' || cmd === 'en') result.newMode = 'privilege';
      else result.output.push('% Unknown command');
      break;

    case 'privilege':
      if (cmd === 'configure' || cmd === 'conf') {
        result.newMode = 'global';
      } else if (cmd === 'show' || cmd === 'sh') {
        if (args[1] === 'ip' && args[2] === 'interface' && args[3] === 'brief') {
          result.output.push('Interface              IP-Address      OK? Method Status                Protocol');
          Object.values(device.interfaces).forEach(intf => {
            const ip = intf.ipv4 ? intf.ipv4.ip : 'unassigned';
            const status = intf.isUp ? 'up' : 'administratively down';
            result.output.push(`${intf.id.padEnd(22)} ${ip.padEnd(15)} YES manual ${status.padEnd(21)} ${status}`);
          });
        } else if (args[1] === 'ip' && args[2] === 'route') {
          result.output.push('Codes: C - connected, S - static\n');
          Object.values(device.interfaces).forEach(intf => {
            if (intf.isUp && intf.ipv4) result.output.push(`C     ${intf.ipv4.ip}/24 is directly connected, ${intf.id}`);
          });
          device.routingTable.forEach(r => result.output.push(`S     ${r.network}/24 via ${r.nextHopIp}`));
        } else if (args[1] === 'mac' && (args[2] === 'address-table' || args[2] === 'address')) {
          result.output.push('          Mac Address Table');
          result.output.push('-------------------------------------------');
          result.output.push('Vlan    Mac Address       Type        Ports');
          result.output.push('----    -----------       --------    -----');
          Object.entries(device.macAddressTable).forEach(([mac, data]: [string, any]) => {
            result.output.push(`${data.vlan.toString().padEnd(7)} ${mac.padEnd(17)} DYNAMIC     ${data.port}`);
          });
        } else if (args[1] === 'arp') {
          const entries = Object.entries(device.arpTable || {});
          result.output.push('Protocol  Address          Age (min)  Hardware Addr   Type   Interface');
          entries.forEach(([ip, mac]) => {
            result.output.push(`Internet  ${ip.padEnd(16)} -          ${mac}  ARPA   FastEthernet0/0`);
          });
        } else {
          result.output.push('% Incomplete command.');
        }
      } else if (cmd === 'ping') {
        const targetIp = args[1];
        if (!targetIp) {
          result.output.push('% Incomplete command.');
        } else {
          result.output.push(`Type escape sequence to abort.`);
          result.output.push(`Sending 5, 100-byte ICMP Echos to ${targetIp}, timeout is 2 seconds:`);
          const pingSuccess = simulatePing(device, targetIp);
          if (pingSuccess) {
            // TRIGGER ANIMATION
            const trace = tracePath(device, targetIp);
            if (trace.success) animatePath(trace.links);

            result.output.push('!!!!!');
            result.output.push('Success rate is 100 percent (5/5)');
          } else {
            result.output.push('.....');
            result.output.push('Success rate is 0 percent (0/5)');
          }
        }
      } else if (cmd === 'traceroute') {
        const targetIp = args[1];
        if (!targetIp) {
          result.output.push('% Incomplete command.');
        } else {
          result.output.push(`Type escape sequence to abort.`);
          result.output.push(`Tracing the route to ${targetIp}\n`);
          const traceResult = tracePath(device, targetIp);
          
          // TRIGGER ANIMATION
          animatePath(traceResult.links);

          traceResult.hops.forEach((hop, index) => {
            result.output.push(`  ${index + 1} ${hop} 0 msec 0 msec 0 msec`);
          });
        }
      } else {
        result.output.push("% Invalid input detected at '^' marker.");
      }
      break;

    case 'global':
      if (cmd === 'hostname') {
        const newName = args[1];
        if (newName) updateDevice(device.id, (d) => ({ ...d, hostname: newName }));
      } else if (cmd === 'ip' && args[1] === 'route') {
        const [network, mask, nextHop] = [args[2], args[3], args[4]];
        if (network && mask && nextHop) {
          updateDevice(device.id, (d) => ({
            ...d,
            routingTable: [...d.routingTable, { network, mask, nextHopIp: nextHop, protocol: 'static', metric: 1 }]
          }));
        }
      } else if (cmd === 'ip' && args[1] === 'dhcp' && args[2] === 'pool') {
        const poolName = args[3];
        if (poolName) {
          result.newMode = 'dhcp';
          result.newContext = poolName;
          updateDevice(device.id, (d) => ({
            ...d,
            dhcpPools: { ...(d.dhcpPools || {}), [poolName]: { name: poolName, nextIpSuffix: 10 } }
          }));
        }
      } else if (cmd === 'interface' || cmd === 'int') {
        result.newMode = 'interface';
        result.newContext = args[1];
      } else if (cmd === 'vlan') {
        const vlanId = parseInt(args[1]);
        if (!isNaN(vlanId)) {
          updateDevice(device.id, (d) => ({
            ...d,
            vlans: { ...d.vlans, [vlanId]: `VLAN${vlanId.toString().padStart(4, '0')}` }
          }));
          result.output.push(`% Created VLAN ${vlanId}`);
        }
      } else {
        result.output.push("% Invalid input detected at '^' marker.");
      }
      break;

    case 'interface':
      if (cmd === 'ip' && args[1] === 'address') {
        const [ip, mask] = [args[2], args[3]];
        updateDevice(device.id, (d) => {
          const intf = d.interfaces[currentContext] || { id: currentContext, shortName: currentContext, isUp: false, accessVlan: 1, mode: 'routed', macAddress: '0000.0000.0000' };
          return { ...d, interfaces: { ...d.interfaces, [currentContext]: { ...intf, ipv4: { ip, mask } } } };
        });
      } else if (cmd === 'no' && (args[1] === 'shutdown' || args[1] === 'shut')) {
        updateDevice(device.id, (d) => {
          const intf = d.interfaces[currentContext] || { id: currentContext, shortName: currentContext, isUp: false, accessVlan: 1, mode: 'routed', macAddress: '0000.0000.0000' };
          return { ...d, interfaces: { ...d.interfaces, [currentContext]: { ...intf, isUp: true } } };
        });
        result.output.push(`%LINK-3-UPDOWN: Interface ${currentContext}, changed state to up`);
      } else if (cmd === 'shutdown' || cmd === 'shut') {
        updateDevice(device.id, (d) => {
          const intf = d.interfaces[currentContext];
          if (!intf) return d;
          return { ...d, interfaces: { ...d.interfaces, [currentContext]: { ...intf, isUp: false } } };
        });
        result.output.push(`%LINK-5-CHANGED: Interface ${currentContext}, changed state to administratively down`);
      } else if (cmd === 'switchport') {
        const sub = args[1];
        updateDevice(device.id, (d) => {
          const intf = d.interfaces[currentContext] || { id: currentContext, shortName: currentContext, isUp: true, accessVlan: 1, mode: 'access', macAddress: '0000.0000.0000' };
          if (sub === 'mode') {
            return { ...d, interfaces: { ...d.interfaces, [currentContext]: { ...intf, mode: args[2] as 'access' | 'trunk' } } };
          } else if (sub === 'access' && args[2] === 'vlan') {
            return { ...d, interfaces: { ...d.interfaces, [currentContext]: { ...intf, accessVlan: parseInt(args[3]) } } };
          }
          return d;
        });
      } else {
        result.output.push("% Invalid input detected at '^' marker.");
      }
      break;

    case 'dhcp':
      if (cmd === 'network') {
        const network = args[1];
        const mask = args[2] || '255.255.255.0';
        updateDevice(device.id, (d) => {
          const pool = d.dhcpPools?.[currentContext];
          if (!pool) return d;
          return { ...d, dhcpPools: { ...d.dhcpPools, [currentContext]: { ...pool, network, mask } } };
        });
      } else if (cmd === 'default-router') {
        const routerIp = args[1];
        updateDevice(device.id, (d) => {
          const pool = d.dhcpPools?.[currentContext];
          if (!pool) return d;
          return { ...d, dhcpPools: { ...d.dhcpPools, [currentContext]: { ...pool, defaultRouter: routerIp } } };
        });
      } else {
        result.output.push("% Invalid input detected at '^' marker.");
      }
      break;

    default:
      result.output.push('% Unknown command');
  }

  return result;
}