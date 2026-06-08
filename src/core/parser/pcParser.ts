import { runOSPF } from '../logic/ospf';
import { useNetworkStore } from '../../store/useNetworkStore';
import type { Device } from '../../types/device';
import { simulatePing, tracePath, animatePath, resolveHostname } from '../logic/ping';
import { useActiveDirectoryStore } from '../../store/useActiveDirectoryStore';

export function executePcCommand(rawInput: string, device: Device): string[] {
  const input = rawInput.trim();
  const args = input.split(/\s+/);
  const cmd = args[0].toLowerCase();
  const output: string[] = [];

  if (!cmd) return output;

  const updateDevice = useNetworkStore.getState().updateDevice;

  if (cmd === 'ping') {
    let targetIp = args[1];
    if (!targetIp) {
      output.push('Usage: ping <ip_address>');
    } else {
      const resolved = targetIp.match(/[a-zA-Z]/) ? resolveHostname(targetIp) : targetIp;
      if (!resolved) {
        output.push(`Ping request could not find host ${targetIp}. Please check the name and try again.`);
      } else {
        output.push(`Pinging ${resolved} with 32 bytes of data:`);
        const success = simulatePing(device, resolved);
        if (success) {
          const trace = tracePath(device, resolved);
          if (trace.success) animatePath(trace.links);

          output.push(`Reply from ${resolved}: bytes=32 time=1ms TTL=128`);
          output.push(`Reply from ${resolved}: bytes=32 time=1ms TTL=128`);
          output.push(`Reply from ${resolved}: bytes=32 time=1ms TTL=128`);
          output.push(`Reply from ${resolved}: bytes=32 time=1ms TTL=128`);
        } else {
          output.push('Request timed out.');
          output.push('Request timed out.');
          output.push('Request timed out.');
          output.push('Request timed out.');
        }
      }
    }
  } else if (cmd === 'tracert') {
    let targetIp = args[1];
    if (!targetIp) {
      output.push('Usage: tracert <ip_address>');
    } else {
      const resolved = targetIp.match(/[a-zA-Z]/) ? resolveHostname(targetIp) : targetIp;
      if (!resolved) {
        output.push(`Unable to resolve target system name ${targetIp}.`);
      } else {
        output.push(`Tracing route to ${resolved} over a maximum of 30 hops:\n`);
        const traceResult = tracePath(device, resolved);
        
        animatePath(traceResult.links);

        traceResult.hops.forEach((hop, index) => {
          output.push(`  ${index + 1}    <1 ms    <1 ms    <1 ms    ${hop}`);
        });
        output.push(traceResult.success ? '\nTrace complete.' : '\nTrace aborted.');
      }
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

      if (!assigned) {
        output.push('DHCP request failed. No DHCP server found.');
      }
    } else if (args[1]) {
      const ip = args[1];
      const mask = args[2] || '255.255.255.0';
      const gateway = args[3] || '0.0.0.0';

      updateDevice(device.id, (d) => ({
        ...d,
        interfaces: { ...d.interfaces, 'eth0': { id: 'eth0', shortName: 'eth0', isUp: true, mode: 'access', accessVlan: 1, macAddress: '0000.0000.0000', ipv4: { ip, mask } } },
        routingTable: [{ network: '0.0.0.0', mask: '0.0.0.0', nextHopIp: gateway, protocol: 'static', metric: 1 }]
      }));
      output.push(`Configuration saved. IP: ${ip}, Mask: ${mask}, Gateway: ${gateway}`);
    } else {
      const intf = device.interfaces['eth0'];
      const ip = intf?.ipv4?.ip || '0.0.0.0';
      const mask = intf?.ipv4?.mask || '0.0.0.0';
      const gw = device.routingTable.find(r => r.network === '0.0.0.0')?.nextHopIp || '0.0.0.0';
      
      output.push('');
      output.push('Ethernet adapter Local Area Connection:');
      output.push('');
      output.push(`   IPv4 Address. . . . . . . . . . . : ${ip}`);
      output.push(`   Subnet Mask . . . . . . . . . . . : ${mask}`);
      output.push(`   Default Gateway . . . . . . . . . : ${gw}`);
      output.push('');
    }
  } else if (cmd === 'arp' && args[1] === '-a') {
    const entries = Object.entries(device.arpTable || {});
    if (entries.length === 0) {
      output.push('No ARP Entries Found.');
    } else {
      output.push('  Internet Address      Physical Address      Type');
      entries.forEach(([ip, mac]) => {
        output.push(`  ${ip.padEnd(21)} ${mac.padEnd(21)} dynamic`);
      });
    }
  } else if (cmd === 'get-aduser') {
    const adStore = useActiveDirectoryStore.getState();
    const username = args[1];
    if (!username) {
      output.push('Usage: Get-ADUser <username>');
    } else {
      const users = Object.values(adStore.users);
      const user = users.find(u => u.sAMAccountName.toLowerCase() === username.toLowerCase() || u.name.toLowerCase() === username.toLowerCase());
      if (user) {
        output.push(`DistinguishedName : ${user.distinguishedName}`);
        output.push(`Enabled           : ${user.enabled}`);
        output.push(`GivenName         : ${user.firstName}`);
        output.push(`LockedOut         : ${user.lockedOut}`);
        output.push(`Name              : ${user.name}`);
        output.push(`ObjectClass       : user`);
        output.push(`SamAccountName    : ${user.sAMAccountName}`);
        output.push(`UserPrincipalName : ${user.userPrincipalName}`);
      } else {
        output.push(`Get-ADUser : Cannot find an object with identity: '${username}' under: 'DC=corp,DC=local'.`);
      }
    }
  } else if (cmd === 'unlock-adaccount') {
    const adStore = useActiveDirectoryStore.getState();
    const username = args[1];
    if (!username) {
      output.push('Usage: Unlock-ADAccount <username>');
    } else {
      const users = Object.values(adStore.users);
      const user = users.find(u => u.sAMAccountName.toLowerCase() === username.toLowerCase() || u.name.toLowerCase() === username.toLowerCase());
      if (user) {
        adStore.updateUser(user.id, { lockedOut: false });
        output.push('');
      } else {
        output.push(`Unlock-ADAccount : Cannot find an object with identity: '${username}' under: 'DC=corp,DC=local'.`);
      }
    }
  } else if (cmd === 'disable-adaccount') {
    const adStore = useActiveDirectoryStore.getState();
    const identityIndex = args.indexOf('-Identity');
    if (identityIndex !== -1 && args[identityIndex + 1]) {
      const username = args[identityIndex + 1];
      const user = Object.values(adStore.users).find(u => u.sAMAccountName.toLowerCase() === username.toLowerCase());
      if (user) {
        adStore.updateUser(user.id, { enabled: false });
        output.push('');
      } else {
        output.push(`Disable-ADAccount : Cannot find an object with identity: '${username}'.`);
      }
    } else {
      output.push('Usage: Disable-ADAccount -Identity <username>');
    }
  } else if (cmd === 'enable-adaccount') {
    const adStore = useActiveDirectoryStore.getState();
    const identityIndex = args.indexOf('-Identity');
    if (identityIndex !== -1 && args[identityIndex + 1]) {
      const username = args[identityIndex + 1];
      const user = Object.values(adStore.users).find(u => u.sAMAccountName.toLowerCase() === username.toLowerCase());
      if (user) {
        adStore.updateUser(user.id, { enabled: true });
        output.push('');
      } else {
        output.push(`Enable-ADAccount : Cannot find an object with identity: '${username}'.`);
      }
    } else {
      output.push('Usage: Enable-ADAccount -Identity <username>');
    }
  } else if (cmd === 'set-aduser') {
    const adStore = useActiveDirectoryStore.getState();
    const identityIndex = args.indexOf('-Identity');
    if (identityIndex !== -1 && args[identityIndex + 1]) {
      const username = args[identityIndex + 1];
      const user = Object.values(adStore.users).find(u => u.sAMAccountName.toLowerCase() === username.toLowerCase());
      if (user) {
        const updates: any = {};
        if (args.indexOf('-Title') !== -1) updates.title = args[args.indexOf('-Title') + 1].replace(/["']/g, "");
        if (args.indexOf('-Department') !== -1) updates.department = args[args.indexOf('-Department') + 1].replace(/["']/g, "");
        if (args.indexOf('-Company') !== -1) updates.company = args[args.indexOf('-Company') + 1].replace(/["']/g, "");
        if (args.indexOf('-Office') !== -1) updates.office = args[args.indexOf('-Office') + 1].replace(/["']/g, "");
        if (Object.keys(updates).length > 0) {
          adStore.updateUser(user.id, updates);
          output.push('');
        } else {
          output.push('Usage: Set-ADUser -Identity <username> -Title "Title" -Department "Dept"');
        }
      } else {
        output.push(`Set-ADUser : Cannot find an object with identity: '${username}'.`);
      }
    } else {
      output.push('Usage: Set-ADUser -Identity <username> -Title "Title"');
    }
  } else if (cmd === 'search-adaccount') {
    const adStore = useActiveDirectoryStore.getState();
    let results = Object.values(adStore.users);
    
    if (args.includes('-LockedOut')) {
      results = results.filter(u => u.lockedOut);
    }
    if (args.includes('-AccountDisabled')) {
      results = results.filter(u => !u.enabled);
    }
    if (!args.includes('-LockedOut') && !args.includes('-AccountDisabled')) {
       output.push('Usage: Search-ADAccount [-LockedOut] [-AccountDisabled]');
       return output;
    }

    if (results.length === 0) {
      output.push('No accounts found matching criteria.');
    } else {
      results.forEach(u => {
        output.push(`Name : ${u.name} (sAMAccountName: ${u.sAMAccountName})`);
      });
    }
  } else if (cmd === 'new-aduser') {
    const adStore = useActiveDirectoryStore.getState();
    const nameIndex = args.indexOf('-Name');
    if (nameIndex !== -1 && args[nameIndex + 1]) {
      const newName = args[nameIndex + 1].replace(/["']/g, "");
      const newId = `usr-${Math.random().toString(36).substr(2, 5)}`;
      adStore.createUser({
        id: newId,
        name: newName,
        type: 'User',
        distinguishedName: `CN=${newName},OU=Users,DC=corp,DC=local`,
        firstName: newName.split(' ')[0] || '',
        lastName: newName.split(' ')[1] || '',
        sAMAccountName: newName.replace(/\s+/g, '').toLowerCase(),
        userPrincipalName: `${newName.replace(/\s+/g, '').toLowerCase()}@corp.local`,
        enabled: true,
        lockedOut: false,
        passwordExpired: false,
        groups: [],
        parentOuId: 'ou-users'
      });
      output.push('');
    } else {
      output.push('Usage: New-ADUser -Name "John Doe"');
    }
  } else if (cmd === 'new-adgroup') {
    const adStore = useActiveDirectoryStore.getState();
    const nameIndex = args.indexOf('-Name');
    if (nameIndex !== -1 && args[nameIndex + 1]) {
      const newName = args[nameIndex + 1].replace(/["']/g, "");
      const newId = `grp-${Math.random().toString(36).substr(2, 5)}`;
      adStore.createGroup({
        id: newId,
        name: newName,
        type: 'Group',
        distinguishedName: `CN=${newName},OU=Users,DC=corp,DC=local`,
        groupScope: 'Global',
        groupType: 'Security',
        members: [],
        parentOuId: 'ou-users'
      });
      output.push('');
    } else {
      output.push('Usage: New-ADGroup -Name "Marketing"');
    }
  } else if (cmd === 'add-adgroupmember') {
    const adStore = useActiveDirectoryStore.getState();
    const identityIndex = args.indexOf('-Identity');
    const memberIndex = args.indexOf('-Members');
    if (identityIndex !== -1 && memberIndex !== -1 && args[identityIndex + 1] && args[memberIndex + 1]) {
      const groupName = args[identityIndex + 1].replace(/["']/g, "");
      const memberName = args[memberIndex + 1].replace(/["']/g, "");
      
      const group = Object.values(adStore.groups).find(g => g.name.toLowerCase() === groupName.toLowerCase());
      const user = Object.values(adStore.users).find(u => u.sAMAccountName.toLowerCase() === memberName.toLowerCase());
      
      if (group && user) {
        adStore.updateGroup(group.id, { members: [...new Set([...group.members, user.id])] });
        output.push('');
      } else {
        output.push(`Add-ADGroupMember : Cannot find an object with identity: '${groupName}' or '${memberName}'.`);
      }
    } else {
      output.push('Usage: Add-ADGroupMember -Identity "Group Name" -Members "username"');
    }
  } else if (cmd === 'add-computer') {
    const domainIndex = args.indexOf('-DomainName');
    if (domainIndex !== -1 && args[domainIndex + 1]) {
      const domainName = args[domainIndex + 1];
      const adStore = useActiveDirectoryStore.getState();
      const domain = Object.values(adStore.domains).find(d => d.name.toLowerCase() === domainName.toLowerCase());
      
      if (domain) {
        updateDevice(device.id, (d) => ({ ...d, domainJoined: domain.name }));
        adStore.createComputer({
          id: `comp-${device.id}`,
          name: device.hostname,
          type: 'Computer',
          distinguishedName: `CN=${device.hostname},OU=Computers,DC=${domain.name.split('.')[0]},DC=${domain.name.split('.')[1]}`,
          enabled: true,
          operatingSystem: 'Windows 10 Pro',
          operatingSystemVersion: '10.0',
          parentOuId: 'ou-computers'
        });
        output.push(`WARNING: The changes will take effect after you restart the computer ${device.hostname}.`);
      } else {
        output.push(`Add-Computer : Cannot resolve domain ${domainName}.`);
      }
    } else {
      output.push('Usage: Add-Computer -DomainName corp.local');
    }
  } else {
    output.push(`'${cmd}' is not recognized as an internal or external command.`);
  }

  // Trigger OSPF recalculation on any command that might alter topology
  if (cmd === 'network' || cmd === 'shutdown' || cmd === 'no' || (cmd === 'ip' && args[1] === 'address')) {
    // We use setTimeout so the Zustand state has time to save the new IP/Config 
    // before the OSPF engine reads it
    setTimeout(() => {
      runOSPF();
    }, 50);
  }

  return output;
}