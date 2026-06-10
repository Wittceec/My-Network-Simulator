import { runOSPF } from '../logic/ospf';
import { useNetworkStore } from '../../store/useNetworkStore';
import type { Device } from '../../types/device';
import { simulatePing, tracePath, animatePath, resolveHostname } from '../logic/ping';
import { useActiveDirectoryStore } from '../../store/useActiveDirectoryStore';
import { useAzureStore } from '../../store/useAzureStore';
import { useDnsStore } from '../../store/useDnsStore';

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
    if (args[1] === '/renew' || args[1] === 'dhcp') {
      output.push('Windows IP Configuration');
      output.push('');
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
    } else if (args[1] === '/release') {
      updateDevice(device.id, (d) => ({
        ...d,
        interfaces: { ...d.interfaces, 'eth0': { id: 'eth0', isUp: true, mode: 'access', accessVlan: 1, shortName: 'eth0', macAddress: '0000.0000.0000' } },
        routingTable: []
      }));
      output.push('Windows IP Configuration');
      output.push('');
      output.push('Ethernet adapter Local Area Connection:');
      output.push('');
      output.push('   Connection-specific DNS Suffix  . :');
      output.push('   IPv4 Address. . . . . . . . . . . : 0.0.0.0');
      output.push('   Subnet Mask . . . . . . . . . . . : 0.0.0.0');
      output.push('   Default Gateway . . . . . . . . . :');
    } else if (args[1] && args[1] !== '/all') {
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
      const dnsStore = useDnsStore.getState();
      const dnsServers = Object.keys(dnsStore.zones).length > 0 ? '10.0.0.10' : '8.8.8.8';
      const mac = intf?.macAddress && intf.macAddress !== '0000.0000.0000' ? intf.macAddress : `0000.1111.${device.id.padStart(4, '0')}`;
      
      output.push('Windows IP Configuration');
      if (args[1] === '/all') {
         output.push('');
         output.push(`   Host Name . . . . . . . . . . . . : ${device.hostname}`);
         output.push(`   Primary Dns Suffix  . . . . . . . : corp.local`);
         output.push(`   Node Type . . . . . . . . . . . . : Hybrid`);
         output.push(`   IP Routing Enabled. . . . . . . . : No`);
         output.push(`   WINS Proxy Enabled. . . . . . . . : No`);
      }
      output.push('');
      output.push('Ethernet adapter Local Area Connection:');
      output.push('');
      if (args[1] === '/all') {
         output.push(`   Description . . . . . . . . . . . : Intel(R) PRO/1000 MT Desktop Adapter`);
         output.push(`   Physical Address. . . . . . . . . : ${mac}`);
         output.push(`   DHCP Enabled. . . . . . . . . . . : ${gw !== '0.0.0.0' ? 'Yes' : 'No'}`);
         output.push(`   Autoconfiguration Enabled . . . . : Yes`);
      }
      output.push(`   IPv4 Address. . . . . . . . . . . : ${ip}`);
      output.push(`   Subnet Mask . . . . . . . . . . . : ${mask}`);
      output.push(`   Default Gateway . . . . . . . . . : ${gw !== '0.0.0.0' ? gw : ''}`);
      if (args[1] === '/all') {
         output.push(`   DNS Servers . . . . . . . . . . . : ${dnsServers}`);
      }
      output.push('');
    }
  } else if (cmd === 'nslookup') {
    const targetHost = args[1];
    if (!targetHost) {
      output.push('Usage: nslookup <hostname>');
    } else {
      const dnsStore = useDnsStore.getState();
      const hasDns = Object.keys(dnsStore.zones).length > 0;
      output.push(`Server:  ${hasDns ? 'dc01.corp.local' : 'UnKnown'}`);
      output.push(`Address:  ${hasDns ? '10.0.0.10' : '8.8.8.8'}`);
      output.push('');
      
      const resolved = resolveHostname(targetHost);
      if (resolved) {
         output.push(`Name:    ${targetHost}`);
         output.push(`Address:  ${resolved}`);
      } else {
         output.push(`*** UnKnown can't find ${targetHost}: Non-existent domain`);
      }
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
        if (args.indexOf('-AccountExpirationDate') !== -1) updates.accountExpires = new Date(args[args.indexOf('-AccountExpirationDate') + 1].replace(/["']/g, "")).getTime();
        if (args.indexOf('-LogonWorkstations') !== -1) updates.logonWorkstations = args[args.indexOf('-LogonWorkstations') + 1].replace(/["']/g, "").split(',');
        if (args.indexOf('-ProfilePath') !== -1) updates.profilePath = args[args.indexOf('-ProfilePath') + 1].replace(/["']/g, "");
        if (args.indexOf('-HomeDirectory') !== -1) updates.homeDirectory = args[args.indexOf('-HomeDirectory') + 1].replace(/["']/g, "");

        if (Object.keys(updates).length > 0) {
          adStore.updateUser(user.id, updates);
          output.push('');
        } else {
          output.push('Usage: Set-ADUser -Identity <username> -Title "Title" -Department "Dept" -AccountExpirationDate "MM/DD/YYYY"');
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
      const groupName = args[identityIndex + 1].replace(/["']/g, "").toLowerCase();
      const userName = args[memberIndex + 1].replace(/["']/g, "").toLowerCase();
      
      const group = Object.values(adStore.groups).find(g => g.name.toLowerCase() === groupName || g.sAMAccountName?.toLowerCase() === groupName);
      const user = Object.values(adStore.users).find(u => u.sAMAccountName.toLowerCase() === userName || u.name.toLowerCase() === userName);
      
      if (group && user) {
        if (!group.members.includes(user.id)) {
          adStore.updateGroup(group.id, { members: [...group.members, user.id] });
          adStore.updateUser(user.id, { groups: [...user.groups, group.id] });
        }
        output.push('');
      } else {
        output.push(`Add-ADGroupMember : Cannot find an object with identity: '${groupName}' or member '${userName}'.`);
      }
    } else {
      output.push('Usage: Add-ADGroupMember -Identity "GroupName" -Members "UserName"');
    }
  } else if (cmd === 'remove-adgroupmember') {
    const adStore = useActiveDirectoryStore.getState();
    const identityIndex = args.indexOf('-Identity');
    const memberIndex = args.indexOf('-Members');
    if (identityIndex !== -1 && memberIndex !== -1 && args[identityIndex + 1] && args[memberIndex + 1]) {
      const groupName = args[identityIndex + 1].replace(/["']/g, "").toLowerCase();
      const userName = args[memberIndex + 1].replace(/["']/g, "").toLowerCase();
      
      const group = Object.values(adStore.groups).find(g => g.name.toLowerCase() === groupName || g.sAMAccountName?.toLowerCase() === groupName);
      const user = Object.values(adStore.users).find(u => u.sAMAccountName.toLowerCase() === userName || u.name.toLowerCase() === userName);
      
      if (group && user) {
        adStore.updateGroup(group.id, { members: group.members.filter(id => id !== user.id) });
        adStore.updateUser(user.id, { groups: user.groups.filter(id => id !== group.id) });
        output.push('');
      } else {
        output.push(`Remove-ADGroupMember : Cannot find an object with identity: '${groupName}' or member '${userName}'.`);
      }
    } else {
      output.push('Usage: Remove-ADGroupMember -Identity "GroupName" -Members "UserName"');
    }
  } else if (cmd === 'get-adgroup') {
    const adStore = useActiveDirectoryStore.getState();
    const identityIndex = args.indexOf('-Identity');
    if (identityIndex !== -1 && args[identityIndex + 1]) {
      const groupName = args[identityIndex + 1].replace(/["']/g, "").toLowerCase();
      const group = Object.values(adStore.groups).find(g => g.name.toLowerCase() === groupName || g.sAMAccountName?.toLowerCase() === groupName);
      
      if (group) {
        output.push(`DistinguishedName : ${group.distinguishedName}`);
        output.push(`GroupCategory     : ${group.groupType}`);
        output.push(`GroupScope        : ${group.groupScope}`);
        output.push(`Name              : ${group.name}`);
        output.push(`ObjectClass       : group`);
        if (args.includes('-Properties') && args.includes('Members')) {
          const memberNames = group.members.map(mid => adStore.users[mid]?.name || adStore.computers[mid]?.name || mid);
          output.push(`Members           : {${memberNames.join(', ')}}`);
        }
      } else {
        output.push(`Get-ADGroup : Cannot find an object with identity: '${groupName}'.`);
      }
    } else {
      output.push('Usage: Get-ADGroup -Identity "GroupName" [-Properties Members]');
    }
  } else if (cmd === 'reset-adaccountpassword') {
    const adStore = useActiveDirectoryStore.getState();
    const identityIndex = args.indexOf('-Identity');
    if (identityIndex !== -1 && args[identityIndex + 1]) {
      const username = args[identityIndex + 1].replace(/["']/g, "").toLowerCase();
      const user = Object.values(adStore.users).find(u => u.sAMAccountName.toLowerCase() === username || u.name.toLowerCase() === username);
      
      if (user) {
        adStore.updateUser(user.id, { pwdLastSet: Date.now(), badPwdCount: 0, passwordExpired: false, lockedOut: false });
        output.push('');
      } else {
        output.push(`Reset-ADAccountPassword : Cannot find an object with identity: '${username}'.`);
      }
    } else {
      output.push('Usage: Reset-ADAccountPassword -Identity <username>');
    }
  } else if (cmd === 'start-adsyncsynccycle') {
    const adStore = useActiveDirectoryStore.getState();
    const azureStore = useAzureStore.getState();
    
    output.push('Result: Success');
    output.push('Starting identity synchronization...');
    
    let addedCount = 0;
    
    Object.values(adStore.users).forEach(adUser => {
      const upn = adUser.userPrincipalName;
      // Check if user exists in Azure Store
      const azureUserExists = Object.values(azureStore.entraUsers).find(eu => eu.userPrincipalName === upn);
      if (!azureUserExists) {
        const newId = `eu-${Math.random().toString(36).substr(2, 5)}`;
        azureStore.createEntraUser({
          id: newId,
          displayName: adUser.displayName || adUser.name,
          userPrincipalName: upn,
          userType: 'Member',
          accountEnabled: adUser.enabled
        });
        addedCount++;
      }
    });
    
    output.push(`Synchronization completed. Exported ${addedCount} user(s) to Azure Active Directory.`);
  } else if (cmd === 'resolve-dnsname') {
    const dnsStore = useDnsStore.getState();
    const nameToResolve = args[0];
    if (!nameToResolve) {
      output.push('Usage: Resolve-DnsName <Name>');
      return output;
    }
    
    // Simple mock resolution
    const zones = Object.values(dnsStore.zones);
    let found = false;
    
    let typeFilter = 'A';
    const typeIndex = args.indexOf('-Type');
    if (typeIndex !== -1 && args[typeIndex + 1]) {
      typeFilter = args[typeIndex + 1].toUpperCase();
    }

    output.push(`Name                                           Type   TTL   Section    NameHost/IPAddress`);
    output.push(`----                                           ----   ---   -------    ------------------`);

    zones.forEach(zone => {
      Object.values(zone.records).forEach(record => {
        let isMatch = false;
        
        if (zone.type === 'Reverse') {
            // For reverse zones, the user is likely querying an IP like 10.0.0.10
            // and the record might just be named '10' or '10.0'
            const ipParts = nameToResolve.split('.');
            if (ipParts.length === 4) {
               const lastOctet = ipParts[3];
               if (record.name === lastOctet) isMatch = true;
            } else if (record.name.toLowerCase() === nameToResolve.toLowerCase()) {
               isMatch = true;
            }
        } else {
            const fqdn = record.name === '@' ? zone.name : `${record.name}.${zone.name}`;
            if (record.name.toLowerCase() === nameToResolve.toLowerCase() || fqdn.toLowerCase() === nameToResolve.toLowerCase()) {
              isMatch = true;
            }
        }

        if (isMatch && (typeFilter === 'ALL' || record.type === typeFilter || (typeFilter === 'A' && !['PTR','MX','TXT','SRV','NS','SOA'].includes(record.type)))) {
          output.push(`${nameToResolve.padEnd(46)} ${record.type.padEnd(6)} ${record.ttl.toString().padEnd(5)} Answer     ${record.data}`);
          found = true;
        }
      });
    });
    
    if (!found) {
      output.push(`Resolve-DnsName : ${nameToResolve} : DNS name does not exist`);
    }
  } else if (cmd === 'gpupdate') {
    output.push('Updating policy...');
    output.push('');
    output.push('Computer Policy update has completed successfully.');
    output.push('User Policy update has completed successfully.');
  } else if (cmd === 'gpresult' && args[1] && args[1].toLowerCase() === '/r') {
    const adStore = useActiveDirectoryStore.getState();
    const gpoStore = useGpoStore.getState();
    
    // In a real system we'd look up the logged in user. Here we'll mock based on the PC name to show application.
    output.push('RSOP data for CORP\\user on ' + device.hostname.toUpperCase() + ' : Logging Mode');
    output.push('---------------------------------------------------------------------------');
    output.push('');
    output.push('OS Configuration:            Member Server');
    output.push('OS Version:                  10.0.19044');
    output.push('Site Name:                   Default-First-Site-Name');
    output.push('Roaming Profile:             N/A');
    output.push('Local Profile:               C:\\Users\\user');
    output.push('');
    output.push('COMPUTER SETTINGS');
    output.push('------------------');
    output.push('    CN=' + device.hostname + ',OU=Computers,DC=corp,DC=local');
    output.push('    Last time Group Policy was applied: ' + new Date().toLocaleString());
    output.push('    Group Policy was applied from:      dc01.corp.local');
    output.push('');
    output.push('    Applied Group Policy Objects');
    output.push('    -----------------------------');

    // Simple mock logic: if the computer is domain joined, apply 'Default Domain Policy'. 
    // If it's a workstation, apply 'Block USB Removable Storage'
    let applied = ['Default Domain Policy'];
    if (device.hostname.toLowerCase().startsWith('ws-')) {
        applied.push('Block USB Removable Storage');
    }

    const gpos = Object.values(gpoStore.gpos);
    applied.forEach(gpoName => {
        const gpo = gpos.find(g => g.name === gpoName);
        if (gpo && gpo.status === 'Enabled') {
            output.push('        ' + gpo.name);
        }
    });

    output.push('');
    output.push('    The following GPOs were not applied because they were filtered out');
    output.push('    -------------------------------------------------------------------');
    output.push('        Local Group Policy');
    output.push('            Filtering:  Not Applied (Empty)');
    output.push('');
    output.push('USER SETTINGS');
    output.push('--------------');
    output.push('    CN=user,OU=Users,DC=corp,DC=local');
    output.push('    Last time Group Policy was applied: ' + new Date().toLocaleString());
    output.push('    Group Policy was applied from:      dc01.corp.local');
    output.push('');
    output.push('    Applied Group Policy Objects');
    output.push('    -----------------------------');
    output.push('        Default Domain Policy');
    output.push('');
    const dnsStore = useDnsStore.getState();
    const query = args[1];
    
    if (!query) {
      output.push('Default Server:  dc01.corp.local');
      output.push('Address:  10.0.0.10');
      output.push('');
      output.push('> (Interactive mode not supported. Use: nslookup <name>)');
      return output;
    }

    let typeFilter = 'A';
    let qArg = args.find(a => a.toLowerCase().startsWith('-type=') || a.toLowerCase().startsWith('-querytype='));
    if (qArg) {
        typeFilter = qArg.split('=')[1].toUpperCase();
    }

    output.push('Server:  dc01.corp.local');
    output.push('Address:  10.0.0.10');
    output.push('');

    const zones = Object.values(dnsStore.zones);
    let found = false;

    // Is it an IP query? (Reverse lookup)
    const isIp = /^(\d{1,3}\.){3}\d{1,3}$/.test(query);

    zones.forEach(zone => {
      Object.values(zone.records).forEach(record => {
        let isMatch = false;

        if (isIp && zone.type === 'Reverse') {
            const ipParts = query.split('.');
            if (ipParts.length === 4 && record.name === ipParts[3]) {
                isMatch = true;
            }
        } else if (!isIp && zone.type === 'Forward') {
            const fqdn = record.name === '@' ? zone.name : `${record.name}.${zone.name}`;
            if (record.name.toLowerCase() === query.toLowerCase() || fqdn.toLowerCase() === query.toLowerCase()) {
                isMatch = true;
            }
        }

        if (isMatch) {
            if (typeFilter === 'A' || record.type === typeFilter) {
               if (!found) output.push(`Non-authoritative answer:`);
               found = true;
               if (record.type === 'PTR') {
                  output.push(`${query}       name = ${record.data}`);
               } else if (record.type === 'A') {
                  const fqdn = record.name === '@' ? zone.name : `${record.name}.${zone.name}`;
                  output.push(`Name:    ${fqdn}`);
                  output.push(`Address:  ${record.data}`);
               } else if (record.type === 'MX') {
                  const fqdn = record.name === '@' ? zone.name : `${record.name}.${zone.name}`;
                  output.push(`${fqdn}      MX preference = ${record.data.split(' ')[0]}, mail exchanger = ${record.data.split(' ')[1]}`);
               } else {
                  output.push(`${record.name}      ${record.type} = ${record.data}`);
               }
            }
        }
      });
    });

    if (!found) {
        output.push(`*** dc01.corp.local can't find ${query}: Non-existent domain`);
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