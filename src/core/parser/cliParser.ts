import { useNetworkStore } from '../../store/useNetworkStore';
import type { Device } from '../../types/device';
import { simulatePing, tracePath, animatePath } from '../logic/ping';
import { runOSPF } from '../logic/ospf';

export type CliMode = 'user' | 'privilege' | 'global' | 'interface' | 'dhcp' | 'router';

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

  let result: ParserResult = { output: [], newMode: currentMode, newContext: currentContext };

  if (!cmd) return result;

  const updateDevice = useNetworkStore.getState().updateDevice;

  if (cmd === 'exit') {
    if (currentMode === 'interface' || currentMode === 'dhcp' || currentMode === 'router') { result.newMode = 'global'; result.newContext = ''; } 
    else if (currentMode === 'global') { result.newMode = 'privilege'; } 
    else if (currentMode === 'privilege') { result.newMode = 'user'; }
    return result;
  } 
  
  if (cmd === 'end') {
    if (currentMode === 'global' || currentMode === 'interface' || currentMode === 'dhcp' || currentMode === 'router') {
      result.newMode = 'privilege'; result.newContext = ''; return result;
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
          result.output.push('Codes: C - connected, S - static, O - OSPF\n');
          Object.values(device.interfaces).forEach(intf => {
            if (intf.isUp && intf.ipv4) result.output.push(`C     ${intf.ipv4.ip}/24 is directly connected, ${intf.id}`);
          });
          device.routingTable.forEach(r => {
            const code = r.protocol === 'ospf' ? 'O' : 'S';
            const metric = r.protocol === 'ospf' ? '[110/2]' : '[1/0]';
            result.output.push(`${code}     ${r.network}/24 ${metric} via ${r.nextHopIp}`);
          });
        } else if (args[1] === 'mac' && (args[2] === 'address-table' || args[2] === 'address')) {
          result.output.push('          Mac Address Table\n-------------------------------------------\nVlan    Mac Address       Type        Ports\n----    -----------       --------    -----');
          Object.entries(device.macAddressTable).forEach(([mac, data]: [string, any]) => {
            result.output.push(`${data.vlan.toString().padEnd(7)} ${mac.padEnd(17)} DYNAMIC     ${data.port}`);
          });
        } else if (args[1] === 'arp') {
          const entries = Object.entries(device.arpTable || {});
          result.output.push('Protocol  Address          Age (min)  Hardware Addr   Type   Interface');
          entries.forEach(([ip, mac]) => result.output.push(`Internet  ${ip.padEnd(16)} -          ${mac}  ARPA   FastEthernet0/0`));
        } else if (args[1] === 'spanning-tree') {
          const isRoot = (device as any).isRootBridge;
          result.output.push(isRoot ? 'This bridge is the root' : 'Spanning tree enabled protocol ieee');
          result.output.push('\nInterface           Role Sts Cost      Prio.Nbr Type\n------------------- ---- --- --------- -------- --------------------------------');
          Object.values(device.interfaces).forEach(intf => {
             const state = intf.stpState === 'blocking' ? 'BLK' : 'FWD';
             const role = intf.stpState === 'blocking' ? 'Altn' : 'Desg';
             result.output.push(`${intf.id.padEnd(19)} ${role}  ${state} 19        128.1    P2p`);
          });
        } else if (args[1] === 'access-lists') {
          const acls = Object.values(device.acls);
          if (acls.length === 0) result.output.push('No access lists configured.');
          else {
            acls.forEach(acl => {
              result.output.push(`${acl.type === 'standard' ? 'Standard' : 'Extended'} IP access list ${acl.id}`);
              acl.rules.forEach(r => {
                const srcStr = r.sourceIp === '0.0.0.0' && r.sourceWildcard === '255.255.255.255' ? 'any' : `${r.sourceIp} ${r.sourceWildcard}`;
                const dstStr = r.destIp === '0.0.0.0' && r.destWildcard === '255.255.255.255' ? 'any' : `${r.destIp} ${r.destWildcard}`;
                if (acl.type === 'standard') result.output.push(`    ${r.sequence} ${r.action} ${srcStr}`);
                else result.output.push(`    ${r.sequence} ${r.action} ${r.protocol} ${srcStr} ${dstStr}`);
              });
            });
          }
        } else if (args[1] === 'cdp' && args[2] === 'neighbors') {
          // NEW: Cisco Discovery Protocol
          result.output.push('Capability Codes: R - Router, S - Switch\n');
          result.output.push('Device ID        Local Intrfce     Holdtme    Capability  Platform  Port ID');
          const allLinks = Object.values(useNetworkStore.getState().links);
          const allDevices = useNetworkStore.getState().devices;
          allLinks.forEach(l => {
             if (l.sourceDeviceId === device.id) {
                const neighbor = allDevices[l.targetDeviceId];
                result.output.push(`${neighbor.hostname.padEnd(16)} ${l.sourceInterfaceId.padEnd(17)} 120        ${neighbor.type === 'switch' ? 'S' : 'R'}           ${neighbor.type} ${l.targetInterfaceId}`);
             } else if (l.targetDeviceId === device.id) {
                const neighbor = allDevices[l.sourceDeviceId];
                result.output.push(`${neighbor.hostname.padEnd(16)} ${l.targetInterfaceId.padEnd(17)} 120        ${neighbor.type === 'switch' ? 'S' : 'R'}           ${neighbor.type} ${l.sourceInterfaceId}`);
             }
          });
        } else result.output.push('% Incomplete command.');
      } else if (cmd === 'ping') {
        const targetIp = args[1];
        if (!targetIp) result.output.push('% Incomplete command.');
        else {
          result.output.push(`Sending 5, 100-byte ICMP Echos to ${targetIp}, timeout is 2 seconds:`);
          const pingSuccess = simulatePing(device, targetIp);
          if (pingSuccess) {
            const trace = tracePath(device, targetIp);
            if (trace.success) animatePath(trace.links);
            result.output.push('!!!!!\nSuccess rate is 100 percent (5/5)');
          } else result.output.push('.....\nSuccess rate is 0 percent (0/5)');
        }
      } else if (cmd === 'traceroute') {
        const targetIp = args[1];
        if (!targetIp) result.output.push('% Incomplete command.');
        else {
          result.output.push(`Tracing the route to ${targetIp}\n`);
          const traceResult = tracePath(device, targetIp);
          animatePath(traceResult.links);
          traceResult.hops.forEach((hop, index) => result.output.push(`  ${index + 1} ${hop} 0 msec 0 msec 0 msec`));
        }
      } else result.output.push("% Invalid input detected at '^' marker.");
      break;

    case 'global':
      if (cmd === 'hostname') {
        const newName = args[1];
        if (newName) updateDevice(device.id, (d) => ({ ...d, hostname: newName }));
      } else if (cmd === 'ip' && args[1] === 'route') {
        const [network, mask, nextHop] = [args[2], args[3], args[4]];
        if (network && mask && nextHop) updateDevice(device.id, (d) => ({ ...d, routingTable: [...d.routingTable, { network, mask, nextHopIp: nextHop, protocol: 'static', metric: 1 }] }));
      } else if (cmd === 'ip' && args[1] === 'dhcp' && args[2] === 'pool') {
        const poolName = args[3];
        if (poolName) {
          result.newMode = 'dhcp'; result.newContext = poolName;
          updateDevice(device.id, (d) => ({ ...d, dhcpPools: { ...(d.dhcpPools || {}), [poolName]: { name: poolName, nextIpSuffix: 10 } } }));
        }
      } else if (cmd === 'router' && args[1] === 'ospf') {
        const processId = args[2];
        if (processId) {
          result.newMode = 'router'; result.newContext = `ospf ${processId}`;
          updateDevice(device.id, (d) => ({ ...d, ospf: (d as any).ospf || { processId, networks: [] } }));
        }
      } else if (cmd === 'interface' || cmd === 'int') {
        const intfName = args[1];
        if (intfName) {
           result.newMode = 'interface';
           result.newContext = intfName;
           // NEW: Auto-create sub-interface for Router-on-a-Stick
           if (intfName.includes('.')) {
              updateDevice(device.id, (d) => {
                 if (d.interfaces[intfName]) return d;
                 return { ...d, interfaces: { ...d.interfaces, [intfName]: { id: intfName, shortName: intfName, isUp: true, mode: 'routed', accessVlan: 1, macAddress: '0000.0000.0000' } } };
              });
           }
        }
      } else if (cmd === 'vlan') {
        const vlanId = parseInt(args[1]);
        if (!isNaN(vlanId)) {
          updateDevice(device.id, (d) => ({ ...d, vlans: { ...d.vlans, [vlanId]: `VLAN${vlanId.toString().padStart(4, '0')}` } }));
          result.output.push(`% Created VLAN ${vlanId}`);
        }
      } else if (cmd === 'access-list') {
        const aclId = args[1]; const action = args[2] as 'permit' | 'deny';
        if (!aclId || !action) result.output.push('% Incomplete command.');
        else {
          const idNum = parseInt(aclId);
          const isStandard = idNum >= 1 && idNum <= 99; const isExtended = idNum >= 100 && idNum <= 199;
          let protocol = 'ip'; let srcIp = '', srcWild = '', dstIp = '0.0.0.0', dstWild = '255.255.255.255';
          if (isStandard) {
            let argIdx = 3;
            if (args[argIdx] === 'host') { srcIp = args[argIdx + 1]; srcWild = '0.0.0.0'; }
            else if (args[argIdx] === 'any') { srcIp = '0.0.0.0'; srcWild = '255.255.255.255'; }
            else { srcIp = args[argIdx]; srcWild = args[argIdx + 1] || '0.0.0.0'; }
            updateDevice(device.id, (d) => {
              const currentAcl = d.acls[aclId] || { id: aclId, type: 'standard', rules: [] };
              const newRule = { sequence: currentAcl.rules.length * 10 + 10, action, protocol, sourceIp: srcIp, sourceWildcard: srcWild, destIp: dstIp, destWildcard: dstWild };
              return { ...d, acls: { ...d.acls, [aclId]: { ...currentAcl, rules: [...currentAcl.rules, newRule] } } };
            });
          } else if (isExtended) {
            protocol = args[3]; let argIdx = 4;
            if (args[argIdx] === 'host') { srcIp = args[argIdx + 1]; srcWild = '0.0.0.0'; argIdx += 2; }
            else if (args[argIdx] === 'any') { srcIp = '0.0.0.0'; srcWild = '255.255.255.255'; argIdx += 1; }
            else { srcIp = args[argIdx]; srcWild = args[argIdx + 1]; argIdx += 2; }
            if (args[argIdx] === 'host') { dstIp = args[argIdx + 1]; dstWild = '0.0.0.0'; }
            else if (args[argIdx] === 'any') { dstIp = '0.0.0.0'; dstWild = '255.255.255.255'; }
            else { dstIp = args[argIdx]; dstWild = args[argIdx + 1] || '0.0.0.0'; }
            updateDevice(device.id, (d) => {
              const currentAcl = d.acls[aclId] || { id: aclId, type: 'extended', rules: [] };
              const newRule = { sequence: currentAcl.rules.length * 10 + 10, action, protocol, sourceIp: srcIp, sourceWildcard: srcWild, destIp: dstIp, destWildcard: dstWild };
              return { ...d, acls: { ...d.acls, [aclId]: { ...currentAcl, rules: [...currentAcl.rules, newRule] } } };
            });
          } else result.output.push('% Invalid ACL number.');
        }
      } else result.output.push("% Invalid input detected at '^' marker.");
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
      } else if (cmd === 'switchport' && args[1] === 'port-security') {
        // NEW: Port Security Configurator
        if (args.length === 2) {
           updateDevice(device.id, (d) => {
              const intf = d.interfaces[currentContext];
              return { ...d, interfaces: { ...d.interfaces, [currentContext]: { ...intf, portSecurity: intf.portSecurity || { enabled: true, max: 1, violation: 'shutdown', macs: [] } } } };
           });
        } else if (args[2] === 'maximum') {
           const max = parseInt(args[3]);
           updateDevice(device.id, (d) => {
              const intf = d.interfaces[currentContext];
              return { ...d, interfaces: { ...d.interfaces, [currentContext]: { ...intf, portSecurity: { ...intf.portSecurity!, max } } } };
           });
        } else if (args[2] === 'violation') {
           const violation = args[3] as 'shutdown' | 'restrict';
           updateDevice(device.id, (d) => {
              const intf = d.interfaces[currentContext];
              return { ...d, interfaces: { ...d.interfaces, [currentContext]: { ...intf, portSecurity: { ...intf.portSecurity!, violation } } } };
           });
        }
      } else if (cmd === 'switchport') {
        const sub = args[1];
        updateDevice(device.id, (d) => {
          const intf = d.interfaces[currentContext] || { id: currentContext, shortName: currentContext, isUp: true, accessVlan: 1, mode: 'access', macAddress: '0000.0000.0000' };
          if (sub === 'mode') return { ...d, interfaces: { ...d.interfaces, [currentContext]: { ...intf, mode: args[2] as 'access' | 'trunk' } } };
          else if (sub === 'access' && args[2] === 'vlan') return { ...d, interfaces: { ...d.interfaces, [currentContext]: { ...intf, accessVlan: parseInt(args[3]) } } };
          return d;
        });
      } else if (cmd === 'encapsulation' && args[1] === 'dot1q') {
        // NEW: Sub-interface VLAN assignment
        const vlan = parseInt(args[2]);
        if (!isNaN(vlan)) {
           updateDevice(device.id, (d) => {
              const intf = d.interfaces[currentContext];
              if (!intf) return d;
              return { ...d, interfaces: { ...d.interfaces, [currentContext]: { ...intf, accessVlan: vlan, mode: 'routed' } } };
           });
        }
      } else if (cmd === 'ip' && args[1] === 'access-group') {
        const aclId = args[2]; const direction = args[3] as 'in' | 'out';
        if (aclId && (direction === 'in' || direction === 'out')) {
          updateDevice(device.id, (d) => {
            const intf = d.interfaces[currentContext];
            if (!intf) return d;
            return { ...d, interfaces: { ...d.interfaces, [currentContext]: { ...intf, inboundAclId: direction === 'in' ? aclId : intf.inboundAclId, outboundAclId: direction === 'out' ? aclId : intf.outboundAclId } } };
          });
        }
      } else result.output.push("% Invalid input detected at '^' marker.");
      break;

    case 'dhcp':
      if (cmd === 'network') {
        const network = args[1]; const mask = args[2] || '255.255.255.0';
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
      } else result.output.push("% Invalid input detected at '^' marker.");
      break;

    case 'router':
      if (cmd === 'network') {
        const [network, wildcard, areaKeyword, area] = [args[1], args[2], args[3], args[4]];
        if (network && wildcard && areaKeyword === 'area' && area) {
          updateDevice(device.id, (d) => {
            const currentOspf = (d as any).ospf || { processId: '1', networks: [] };
            if (currentOspf.networks.some((n: any) => n.network === network)) return d;
            return { ...d, ospf: { ...currentOspf, networks: [...currentOspf.networks, { network, wildcard, area }] } };
          });
        }
      } else result.output.push("% Invalid input detected at '^' marker.");
      break;

    default:
      result.output.push('% Unknown command');
  }

  if (cmd === 'network' || cmd === 'shutdown' || cmd === 'no' || (cmd === 'ip' && args[1] === 'address')) {
    setTimeout(() => { runOSPF(); }, 50);
  }

  return result;
}

const IOS_WORDS: Record<CliMode, string[]> = {
  user: ['enable', 'ping', 'traceroute', 'exit'],
  privilege: ['configure', 'terminal', 'show', 'ip', 'interface', 'brief', 'route', 'mac', 'address-table', 'arp', 'ping', 'traceroute', 'spanning-tree', 'access-lists', 'cdp', 'exit', 'end'],
  global: ['hostname', 'ip', 'route', 'router', 'dhcp', 'pool', 'interface', 'vlan', 'access-list', 'exit', 'end'],
  interface: ['ip', 'address', 'access-group', 'shutdown', 'no', 'switchport', 'mode', 'access', 'trunk', 'vlan', 'port-security', 'encapsulation', 'exit', 'end'],
  dhcp: ['network', 'default-router', 'exit', 'end'],
  router: ['network', 'exit', 'end']
};

const HELP_MENUS: Record<CliMode, string[]> = {
  user: ['  enable      Turn on privileged commands', '  ping        Send echo messages', '  traceroute  Trace route to destination', '  exit        Exit from the EXEC'],
  privilege: ['  configure      Enter configuration mode', '  show           Show running system information', '  ping           Send echo messages', '  traceroute     Trace route to destination', '  spanning-tree  Show Spanning Tree information', '  cdp            Cisco Discovery Protocol', '  access-lists   List access lists', '  exit           Exit from the EXEC', '  end            End current mode and down to EXEC'],
  global: ['  hostname    Set system network name', '  interface   Select an interface to configure', '  ip          Global IP configuration subcommands', '  router      Enable a routing process', '  vlan        VLAN configuration', '  access-list Add an access list entry', '  exit        Exit from configure mode', '  end         End current mode and down to EXEC'],
  interface: ['  ip             Interface Internet Protocol config commands', '  switchport     Set switching mode characteristics', '  encapsulation  Set encapsulation type for an interface', '  shutdown       Shutdown the selected interface', '  no             Negate a command or set its defaults', '  exit           Exit from interface configuration mode', '  end            End current mode and down to EXEC'],
  dhcp: ['  network        Network number and mask', '  default-router Default routers', '  exit           Exit from DHCP pool configuration mode', '  end            End current mode and down to EXEC'],
  router: ['  network     Enable routing on an IP network', '  exit        Exit from routing protocol configuration mode', '  end         End current mode and down to EXEC']
};

export function getTabCompletion(input: string, mode: CliMode): string {
  const parts = input.split(' '); const lastWord = parts[parts.length - 1].toLowerCase();
  if (!lastWord) return input; 
  const availableWords = Array.from(new Set(IOS_WORDS[mode]));
  const matches = availableWords.filter(w => w.startsWith(lastWord));
  if (matches.length === 1) { parts[parts.length - 1] = matches[0]; return parts.join(' ') + ' '; }
  return input;
}

export function getQuestionMarkHelp(input: string, mode: CliMode): string[] {
  const parts = input.split(' '); const lastWord = parts[parts.length - 1].toLowerCase(); const isTrailingSpace = input.endsWith(' ');
  if (!isTrailingSpace && lastWord) {
    const availableWords = Array.from(new Set(IOS_WORDS[mode]));
    const matches = availableWords.filter(w => w.startsWith(lastWord));
    return matches.length > 0 ? matches.map(m => `  ${m}`) : ['% Unrecognized command'];
  }
  const firstWord = parts[0].toLowerCase();
  if (firstWord === 'show' || firstWord === 'sh') return ['  ip             IP information', '  mac            MAC address information', '  arp            ARP table', '  spanning-tree  Show Spanning Tree information', '  cdp            Cisco Discovery Protocol', '  access-lists   List access lists'];
  if (firstWord === 'ip') {
    if (mode === 'global') return ['  route  IP routing table', '  dhcp   DHCP server parameters'];
    if (mode === 'interface') return ['  address       Interface IP address', '  access-group  Specify access control for packets'];
  }
  if (firstWord === 'switchport') return ['  mode           Set trunking mode', '  access         Set access mode characteristics', '  port-security  Security related command'];
  return HELP_MENUS[mode];
}