import { useActiveDirectoryStore } from '../../store/useActiveDirectoryStore';
import { useAzureStore } from '../../store/useAzureStore';
import { useDnsStore } from '../../store/useDnsStore';
import { useNetworkStore } from '../../store/useNetworkStore';
import { useServerStore } from '../../store/useServerStore';
import { useGpoStore } from '../../store/useGpoStore';
import { useJobStore } from '../../store/useJobStore';
import { useSecurityStore } from '../../store/useSecurityStore';
import type { ADDomain, ADOrganizationalUnit, ADUser, ADComputer, ADGroup } from '../../types/ad';
import { generateId } from '../../utils/helpers';

export function generateWorld(size: 'small' | 'medium' | 'enterprise') {
  console.log(`Starting World Generation (${size})...`);
  
  // Clear any existing jobs/tickets
  useJobStore.setState({ tickets: {}, completedTicketsCount: 0 });

  // Clear stores
  useActiveDirectoryStore.setState({ domains: {}, ous: {}, users: {}, computers: {}, groups: {}, gpos: {} });
  useAzureStore.setState({ vnets: {}, publicIps: {}, appGateways: {}, loadBalancers: {}, vms: {}, entraUsers: {}, groups: {}, nsgs: {} });
  useDnsStore.setState({ zones: {} });
  useServerStore.setState({ vms: {}, shares: {} });
  // Network store is cleared
  useNetworkStore.setState({ devices: {}, links: {} });
  // Security store is cleared
  useSecurityStore.setState({ logs: [], firewallRules: {} });

  // 1. Generate Active Directory
  const ad = useActiveDirectoryStore.getState();
  
  const domainId = generateId('dom');
  ad.createDomain({ id: domainId, name: 'corp.local', netbiosName: 'CORP' });

  // OUs
  const ous = [
    { name: 'Domain Controllers', id: generateId('ou') },
    { name: 'Servers', id: generateId('ou') },
    { name: 'Workstations', id: generateId('ou') },
    { name: 'Users', id: generateId('ou') },
  ];
  ous.forEach(ou => {
    ad.createOU({ id: ou.id, name: ou.name, type: 'OU', distinguishedName: `OU=${ou.name},DC=corp,DC=local` });
  });
  
  const usersOu = ous.find(o => o.name === 'Users')!.id;
  const serversOu = ous.find(o => o.name === 'Servers')!.id;
  const dcOu = ous.find(o => o.name === 'Domain Controllers')!.id;

  // Groups
  const groupsData = [
    { name: 'Domain Admins', members: [] as string[] },
    { name: 'Domain Users', members: [] as string[] },
    { name: 'Finance', members: [] as string[] },
    { name: 'HR', members: [] as string[] },
    { name: 'Marketing', members: [] as string[] },
    { name: 'IT Support', members: [] as string[] }
  ];

  const groupIds: Record<string, string> = {};
  groupsData.forEach(g => {
    const gid = generateId('grp');
    groupIds[g.name] = gid;
    ad.createGroup({
      id: gid, name: g.name, type: 'Group', 
      distinguishedName: `CN=${g.name},OU=Users,DC=corp,DC=local`,
      groupScope: 'Global', groupType: 'Security', members: [], parentOuId: usersOu
    });
  });

  // Default Admin
  const adminId = generateId('usr');
  ad.createUser({
    id: adminId, name: 'Administrator', type: 'User', distinguishedName: `CN=Administrator,OU=Users,DC=corp,DC=local`,
    firstName: 'Admin', lastName: 'User', displayName: 'Administrator', sAMAccountName: 'Administrator', userPrincipalName: 'admin@corp.local',
    enabled: true, lockedOut: false, passwordExpired: false, groups: [groupIds['Domain Admins'], groupIds['Domain Users']], parentOuId: usersOu
  });

  // Generate Users based on size
  let userCount = 15;
  if (size === 'medium') userCount = 60;
  if (size === 'enterprise') userCount = 200;
  
  const departments = ['Finance', 'HR', 'Marketing', 'IT Support', 'Sales', 'Operations'];
  const firstNames = ['James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda', 'William', 'Elizabeth', 'David', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica'];
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez'];

  const generatedUsers: ADUser[] = [];

  for (let i = 0; i < userCount; i++) {
    const fn = firstNames[Math.floor(Math.random() * firstNames.length)];
    const ln = lastNames[Math.floor(Math.random() * lastNames.length)];
    const dept = departments[Math.floor(Math.random() * departments.length)];
    
    // Group assignment
    const assignedGroups = [groupIds['Domain Users']];
    if (groupIds[dept]) assignedGroups.push(groupIds[dept]);

    const uid = generateId('usr');
    const u: ADUser = {
      id: uid, name: `${fn} ${ln}`, type: 'User', distinguishedName: `CN=${fn} ${ln},OU=Users,DC=corp,DC=local`,
      firstName: fn, lastName: ln, displayName: `${fn} ${ln}`, 
      sAMAccountName: `${fn.charAt(0).toLowerCase()}${ln.toLowerCase()}${i}`, 
      userPrincipalName: `${fn.charAt(0).toLowerCase()}${ln.toLowerCase()}${i}@corp.local`,
      department: dept,
      jobTitle: Math.random() > 0.8 ? 'Manager' : 'Specialist',
      enabled: Math.random() > 0.05, // 5% disabled
      lockedOut: Math.random() < 0.05, // 5% locked out
      passwordExpired: false,
      groups: assignedGroups,
      parentOuId: usersOu
    };
    ad.createUser(u);
    generatedUsers.push(u);

    // Update group members in store
    assignedGroups.forEach(gid => {
      const g = useActiveDirectoryStore.getState().groups[gid];
      if (g) {
        ad.updateGroup(gid, { members: [...g.members, uid] });
      }
    });
  }

  // Computers
  ad.createComputer({
    id: generateId('comp'), name: 'DC01', type: 'Computer', distinguishedName: 'CN=DC01,OU=Domain Controllers,DC=corp,DC=local',
    enabled: true, operatingSystem: 'Windows Server 2022', parentOuId: dcOu
  });
  const fileServerId = generateId('comp');
  ad.createComputer({
    id: fileServerId, name: 'FILE01', type: 'Computer', distinguishedName: 'CN=FILE01,OU=Servers,DC=corp,DC=local',
    enabled: true, operatingSystem: 'Windows Server 2019', parentOuId: serversOu
  });
  const appServerId = generateId('comp');
  ad.createComputer({
    id: appServerId, name: 'APP-LEGACY', type: 'Computer', distinguishedName: 'CN=APP-LEGACY,OU=Servers,DC=corp,DC=local',
    enabled: true, operatingSystem: 'Windows Server 2016', parentOuId: serversOu
  });

  // 2. Generate GPOs
  const gpoStore = useGpoStore.getState();
  gpoStore.createGpo({ id: generateId('gpo'), name: 'Default Domain Policy', status: 'Enabled', links: ['corp.local'], enforcedLinks: [], securityFiltering: ['Authenticated Users'], settings: { 'PasswordPolicy.MinLength': { id: 'pwd-len', category: 'Computer', path: 'Security Settings/Password Policy', name: 'Minimum password length', state: 'Disabled' }, 'PasswordPolicy.Complexity': { id: 'pwd-comp', category: 'Computer', path: 'Security Settings/Password Policy', name: 'Password must meet complexity requirements', state: 'Disabled' } } });
  gpoStore.createGpo({ id: generateId('gpo'), name: 'Disable USB Devices', status: 'Enabled', links: ['corp.local/Computers'], enforcedLinks: [], securityFiltering: ['Authenticated Users'], settings: { 'usb-deny': { id: 'usb-deny', category: 'Computer', path: 'System/Removable Storage', name: 'Deny all access', state: 'Enabled' } } });
  gpoStore.createGpo({ id: generateId('gpo'), name: 'Map Public Drive', status: 'Enabled', links: [], enforcedLinks: [], securityFiltering: ['Authenticated Users'], settings: { 'map-drive-s': { id: 'map-drive-s', category: 'User', path: 'Preferences/Windows Settings/Drive Maps', name: 'Map S: to \\\\FILE01\\Public', state: 'Not Configured' } } });
  gpoStore.createGpo({ id: generateId('gpo'), name: 'Deploy HR Printers', status: 'Enabled', links: [], enforcedLinks: [], securityFiltering: ['Authenticated Users'], settings: { 'printer-hr': { id: 'printer-hr', category: 'User', path: 'Preferences/Control Panel Settings/Printers', name: 'Deploy Printer \\\\PrintServer\\HR-M507', state: 'Not Configured' } } });

  // 3. Generate DNS
  const dns = useDnsStore.getState();
  const zoneId = generateId('zone');
  dns.createZone({ id: zoneId, name: 'corp.local', type: 'Forward', records: {} });
  
  // Reverse Zone
  const revZoneId = generateId('zone');
  dns.createZone({ id: revZoneId, name: '10.in-addr.arpa', type: 'Reverse', records: {} });
  
  dns.addRecord(zoneId, { id: generateId('rec'), name: 'dc01', type: 'A', data: '10.0.0.10', ttl: 3600 });
  dns.addRecord(zoneId, { id: generateId('rec'), name: 'file01', type: 'A', data: '10.0.0.20', ttl: 3600 });
  dns.addRecord(zoneId, { id: generateId('rec'), name: 'app-legacy', type: 'A', data: '10.0.0.30', ttl: 3600 });
  dns.addRecord(zoneId, { id: generateId('rec'), name: 'mail', type: 'CNAME', data: 'exchange.corp.local', ttl: 3600 });

  // 4. Generate Server/Hyper-V/File Shares
  const srv = useServerStore.getState();
  srv.createVM({ id: generateId('vm'), name: 'SRV-01', state: 'Running', cpuUsage: 14, memoryAssigned: 8192, uptime: 86400000, checkpoints: [], virtualSwitch: 'vSwitch-External' });
  srv.createVM({ id: generateId('vm'), name: 'APP-LEGACY', state: 'Running', cpuUsage: 5, memoryAssigned: 4096, uptime: 1000000, checkpoints: ['Before Upgrade'], virtualSwitch: 'vSwitch-External' });
  srv.createVM({ id: generateId('vm'), name: 'EXCHANGE01', state: 'Off', cpuUsage: 0, memoryAssigned: 16384, uptime: 0, checkpoints: [], virtualSwitch: 'vSwitch-External' });

  srv.createShare({ id: generateId('share'), name: 'Public', path: 'C:\\Shares\\Public', ntfsPermissions: { 'Domain Users': 'Modify', 'Domain Admins': 'FullControl' }, fileScreening: ['.mp3', '.avi'] });
  srv.createShare({ id: generateId('share'), name: 'Finance', path: 'D:\\Shares\\Finance', ntfsPermissions: { 'Domain Users': 'Read', 'Finance': 'Modify', 'Domain Admins': 'FullControl' }, quotaLimit: 51200 }); // Intentional vulnerability for ticket
  srv.createShare({ id: generateId('share'), name: 'HR', path: 'D:\\Shares\\HR', ntfsPermissions: { 'Domain Admins': 'FullControl' } }); // Missing HR group for ticket

  // 5. Generate Azure
  const azure = useAzureStore.getState();
  const vnetId = generateId('vnet');
  azure.createVNet({ id: vnetId, name: 'vnet-core-prod', location: 'East US', type: 'Microsoft.Network/virtualNetworks', addressSpace: ['10.1.0.0/16'], subnets: [{ id: 'sub-1', name: 'default', addressPrefix: '10.1.0.0/24' }], peerings: [], tags: {}, resourceGroupName: 'rg-1' });
  
  const pipId = generateId('pip');
  azure.createPublicIp({ id: pipId, name: 'pip-orphaned-01', location: 'East US', type: 'Microsoft.Network/publicIPAddresses', ipAddress: '203.0.113.45', sku: 'Standard', allocationMethod: 'Static', tags: {}, resourceGroupName: 'rg-1' }); // Orphaned PIP for ticket

  const nsgId = generateId('nsg');
  azure.createNSG({ id: nsgId, name: 'nsg-web-prod', location: 'East US', type: 'Microsoft.Network/networkSecurityGroups', rules: [{ id: 'rule-1', name: 'Allow-RDP', priority: 100, direction: 'Inbound', access: 'Allow', protocol: 'TCP', sourcePortRange: '*', destinationPortRange: '3389', sourceAddressPrefix: '*', destinationAddressPrefix: '*' }], tags: {}, resourceGroupName: 'rg-1' }); // Vulnerable NSG for ticket

  const cloudVmId = generateId('vm');
  azure.createVM({ id: cloudVmId, name: 'vm-web-prod-01', location: 'East US', type: 'Microsoft.Compute/virtualMachines', size: 'Standard_D2s_v3', status: 'Running', os: 'Windows', subnetId: 'sub-1', tags: {}, resourceGroupName: 'rg-1' });

  // Add Load Balancer
  const lbId = generateId('lb');
  azure.createLoadBalancer({ id: lbId, name: 'lb-web-prod', location: 'East US', type: 'Microsoft.Network/loadBalancers', sku: 'Standard', backendPool: [cloudVmId], rules: [{ name: 'HTTP', frontendPort: 80, backendPort: 80, protocol: 'Tcp' }], tags: {}, resourceGroupName: 'rg-1' });

  // Add Storage Account
  const saId = generateId('sa');
  azure.createStorageAccount({ id: saId, name: 'stdiagprod001', location: 'East US', type: 'Microsoft.Storage/storageAccounts', performance: 'Standard', redundancy: 'LRS', accessTier: 'Hot', tags: {}, resourceGroupName: 'rg-1' });

  // Add Route Table
  const rtId = generateId('rt');
  azure.createRouteTable({ id: rtId, name: 'rt-core-prod', location: 'East US', type: 'Microsoft.Network/routeTables', routes: [{ name: 'To-OnPrem', addressPrefix: '10.0.0.0/8', nextHopType: 'Internet' }], tags: {}, resourceGroupName: 'rg-1' }); // Internet hop is intentional bug

  // Add App Service Plan & App Service
  const aspId = generateId('asp');
  azure.createAppServicePlan({ id: aspId, name: 'asp-linux-prod', location: 'East US', type: 'Microsoft.Web/serverfarms', sku: 'S1', os: 'Linux', tags: {}, resourceGroupName: 'rg-1' });
  azure.createAppService({ id: generateId('app'), name: 'app-corp-portal', location: 'East US', type: 'Microsoft.Web/sites', appServicePlanId: aspId, runtimeStack: 'Node.js 18', tags: {}, resourceGroupName: 'rg-1' });

  // Sync users to Azure and Role Assignments
  generatedUsers.slice(0, Math.floor(userCount * 0.8)).forEach((u, idx) => {
    const euId = generateId('eu');
    azure.createEntraUser({ id: euId, displayName: u.displayName, userPrincipalName: u.userPrincipalName, assignedLicenses: ['Office 365 E3'], type: 'EntraUser' });
    
    // Assign contributor to first 2 users for a ticket
    if (idx < 2) {
      azure.createRoleAssignment({ id: generateId('ra'), principalId: euId, roleDefinition: 'Contributor', scope: 'rg-1', type: 'RoleAssignment' });
    }
  });

  // 6. Generate Network Topology
  const net = useNetworkStore.getState();
  const r1Id = generateId('router');
  const r2Id = generateId('router');
  net.addDevice({ id: r1Id, type: 'router', name: 'Core-RTR-1', status: 'up', position: { x: 300, y: 100 }, interfaces: [] });
  net.addDevice({ id: r2Id, type: 'router', name: 'Core-RTR-2', status: 'up', position: { x: 500, y: 100 }, interfaces: [] });

  const sw1Id = generateId('switch');
  const sw2Id = generateId('switch');
  const sw3Id = generateId('switch');
  net.addDevice({ id: sw1Id, type: 'switch', name: 'Access-SW-1', status: 'up', position: { x: 200, y: 300 }, interfaces: [] });
  net.addDevice({ id: sw2Id, type: 'switch', name: 'Access-SW-2', status: 'up', position: { x: 400, y: 300 }, interfaces: [] });
  net.addDevice({ id: sw3Id, type: 'switch', name: 'Access-SW-3', status: 'up', position: { x: 600, y: 300 }, interfaces: [] });

  const svrId = generateId('server');
  net.addDevice({ id: svrId, type: 'server', name: 'DC01', status: 'up', position: { x: 200, y: 500 }, interfaces: [] });
  const svr2Id = generateId('server');
  net.addDevice({ id: svr2Id, type: 'server', name: 'FILE01', status: 'up', position: { x: 400, y: 500 }, interfaces: [] });
  
  // Cross connects
  net.addLink({ id: generateId('link'), sourceId: r1Id, targetId: r2Id, status: 'up', bandwidth: 10000 });
  net.addLink({ id: generateId('link'), sourceId: r1Id, targetId: sw1Id, status: 'up', bandwidth: 1000 });
  net.addLink({ id: generateId('link'), sourceId: r1Id, targetId: sw2Id, status: 'down', bandwidth: 1000 }); // Intentional down link
  net.addLink({ id: generateId('link'), sourceId: r2Id, targetId: sw3Id, status: 'up', bandwidth: 1000 });

  net.addLink({ id: generateId('link'), sourceId: sw1Id, targetId: svrId, status: 'up', bandwidth: 1000 });
  net.addLink({ id: generateId('link'), sourceId: sw2Id, targetId: svr2Id, status: 'up', bandwidth: 1000 });

  // 7. Generate Initial SOC / SIEM Noise
  const sec = useSecurityStore.getState();
  sec.addFirewallRule({
    id: generateId('rule'),
    name: 'Default Deny Inbound',
    action: 'Deny',
    sourceIp: 'Any',
    destinationIp: 'Any',
    destinationPort: 'Any',
    protocol: 'Any',
    priority: 4096
  });

  const now = Date.now();
  // Generate some background noise
  for (let i = 0; i < 50; i++) {
    const isMalicious = Math.random() > 0.9;
    sec.addLog({
      id: generateId('log'),
      timestamp: now - Math.floor(Math.random() * 3600000), // within last hour
      sourceIp: `192.168.1.${Math.floor(Math.random() * 255)}`,
      destinationIp: `10.0.0.${Math.floor(Math.random() * 255)}`,
      action: isMalicious ? 'Denied' : 'Allowed',
      protocol: 'TCP',
      port: isMalicious ? 22 : 443,
      severity: isMalicious ? 'Warning' : 'Info',
      message: isMalicious ? 'Firewall dropped packet from untrusted subnet' : 'Standard web traffic'
    });
  }

  // Generate a brute force attempt
  sec.addLog({
    id: generateId('log'),
    timestamp: now - 300000,
    sourceIp: '203.0.113.42',
    destinationIp: '10.0.0.5',
    action: 'Failed Login',
    protocol: 'RDP',
    port: 3389,
    severity: 'Critical',
    message: 'Multiple failed RDP login attempts detected from anomalous IP address.'
  });

  console.log('World Generation Complete.');
}
