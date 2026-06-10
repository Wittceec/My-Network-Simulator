import { useActiveDirectoryStore } from '../../store/useActiveDirectoryStore';
import { useDnsStore } from '../../store/useDnsStore';
import { useGpoStore } from '../../store/useGpoStore';
import { useServerStore } from '../../store/useServerStore';
import { useAzureStore } from '../../store/useAzureStore';
import { useNetworkStore } from '../../store/useNetworkStore';
import { useJobStore } from '../../store/useJobStore';

export function buildEnvironment(size: 'Small' | 'Medium' | 'Large') {
  // Clear existing state
  const adStore = useActiveDirectoryStore.getState();
  const dnsStore = useDnsStore.getState();
  const gpoStore = useGpoStore.getState();
  const serverStore = useServerStore.getState();
  const azureStore = useAzureStore.getState();
  const netStore = useNetworkStore.getState();
  const jobStore = useJobStore.getState();

  // Reset stores to empty
  adStore.users = {};
  adStore.groups = {};
  adStore.ous = {};
  
  dnsStore.zones = {};
  
  gpoStore.gpos = {};
  
  serverStore.vms = {};
  serverStore.shares = {};
  
  azureStore.vnets = {};
  azureStore.subnets = {};
  azureStore.nsgs = {};
  azureStore.publicIps = {};
  azureStore.vms = {};
  azureStore.entraUsers = {};
  azureStore.appGateways = {};

  // Delete all tickets and notes
  jobStore.tickets = {};
  jobStore.ticketNotes = {};
  jobStore.completedTicketsCount = 0;

  // Configuration thresholds
  let userCount = 0;
  let ouNames = [];
  let serverCount = 0;
  
  if (size === 'Small') {
    userCount = 20;
    ouNames = ['Users', 'Computers', 'Sales', 'HR'];
    serverCount = 2;
  } else if (size === 'Medium') {
    userCount = 150;
    ouNames = ['Users', 'Computers', 'Sales', 'HR', 'IT', 'Finance', 'Marketing', 'Engineering'];
    serverCount = 10;
  } else {
    userCount = 500;
    ouNames = ['Users', 'Computers', 'Sales', 'HR', 'IT', 'Finance', 'Marketing', 'Engineering', 'Legal', 'Executives', 'Operations', 'Support', 'Facilities'];
    serverCount = 25;
  }

  // 1. AD Setup
  const groupNames = ['Domain Admins', 'Domain Users', 'Finance Team', 'HR Team', 'IT Support', 'Sales Team', 'Engineering Team', 'Marketing Team'];
  
  ouNames.forEach((ou, idx) => {
    adStore.createOu({ id: `ou-${idx}`, name: ou, parentId: null, description: `${ou} Department`, blockInheritance: false });
  });

  groupNames.forEach((group, idx) => {
    adStore.createGroup({ id: `group-${idx}`, name: group, description: `${group} Security Group`, members: [], type: 'Security' });
  });

  const firstNames = ['John', 'Jane', 'Michael', 'Emily', 'Chris', 'Sarah', 'David', 'Jessica', 'Daniel', 'Ashley', 'Matt', 'Amanda', 'Andrew', 'Brittany', 'Josh', 'Megan'];
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Jones', 'Brown', 'Davis', 'Miller', 'Wilson', 'Moore', 'Taylor', 'Anderson', 'Thomas', 'Jackson', 'White', 'Harris'];

  const allUserIds: string[] = [];
  for (let i = 0; i < userCount; i++) {
    const fn = firstNames[Math.floor(Math.random() * firstNames.length)];
    const ln = lastNames[Math.floor(Math.random() * lastNames.length)];
    const username = `${fn.toLowerCase()}.${ln.toLowerCase()}${i}`;
    const ouId = `ou-${Math.floor(Math.random() * (ouNames.length - 2)) + 2}`; // exclude Users and Computers
    const dept = ouNames[parseInt(ouId.split('-')[1])];

    const user = {
      id: `user-${i}`,
      name: `${fn} ${ln}`,
      userPrincipalName: `${username}@corp.local`,
      samAccountName: username,
      enabled: Math.random() > 0.05, // 5% disabled
      lockedOut: Math.random() < 0.02, // 2% locked out
      passwordExpired: Math.random() < 0.05,
      department: dept,
      jobTitle: ['Staff', 'Manager', 'Director', 'Analyst', 'Engineer', 'Specialist'][Math.floor(Math.random() * 6)],
      office: ['New York', 'London', 'Tokyo', 'San Francisco', 'Remote'][Math.floor(Math.random() * 5)],
      accountExpires: null,
      pwdLastSet: new Date().getTime() - Math.floor(Math.random() * 10000000000),
      logonHours: '24/7'
    };
    adStore.createUser(user);
    allUserIds.push(user.id);
    
    // Add to Domain Users
    const du = Object.values(adStore.groups).find(g => g.name === 'Domain Users');
    if (du) {
      adStore.groups[du.id].members.push(user.id);
    }

    // Add to Dept group randomly
    const deptGroup = Object.values(adStore.groups).find(g => g.name.startsWith(dept));
    if (deptGroup && Math.random() > 0.3) {
      adStore.groups[deptGroup.id].members.push(user.id);
    }
  }

  // 2. DNS Setup
  dnsStore.createZone({ id: 'zone-1', name: 'corp.local', type: 'Forward', records: {} });
  dnsStore.createZone({ id: 'zone-2', name: '10.in-addr.arpa', type: 'Reverse', records: {} });

  dnsStore.addRecord('zone-1', { id: 'rec-dc1', name: 'dc01', type: 'A', data: '10.0.0.10', ttl: 3600 });
  dnsStore.addRecord('zone-1', { id: 'rec-mail', name: '@', type: 'MX', data: '10 mail.corp.local', ttl: 3600 });
  dnsStore.addRecord('zone-1', { id: 'rec-mailA', name: 'mail', type: 'A', data: '10.0.0.15', ttl: 3600 });
  dnsStore.addRecord('zone-1', { id: 'rec-www', name: 'www', type: 'A', data: '10.0.0.20', ttl: 3600 });
  
  for (let i = 0; i < serverCount; i++) {
    dnsStore.addRecord('zone-1', { id: `rec-srv-${i}`, name: `srv-${i}`, type: 'A', data: `10.0.0.${100 + i}`, ttl: 3600 });
  }

  // 3. Server Setup (HyperV & File Server)
  for (let i = 0; i < serverCount; i++) {
    serverStore.createVM({
      id: `vm-${i}`,
      name: `SRV-${i.toString().padStart(2, '0')}`,
      state: Math.random() > 0.1 ? 'Running' : 'Off',
      cpuUsage: Math.floor(Math.random() * 100),
      memoryAssigned: [2048, 4096, 8192, 16384][Math.floor(Math.random() * 4)],
      uptime: Math.floor(Math.random() * 10000000),
      checkpoints: Math.random() > 0.5 ? ['Before Patching', 'Clean Install'] : [],
      virtualSwitch: 'vSwitch-External'
    });
  }

  // Shares
  const shareDepts = ['Public', 'HR', 'Finance', 'Engineering', 'Marketing'];
  shareDepts.forEach((dept, idx) => {
    serverStore.createShare({
      id: `share-${idx}`,
      name: dept,
      path: `D:\\Shares\\${dept}`,
      ntfsPermissions: { 'Administrators': 'FullControl', [`${dept} Team`]: 'Modify' },
      quotaLimit: Math.random() > 0.5 ? 51200 : undefined,
      fileScreening: Math.random() > 0.5 ? ['.mp3', '.avi', '.exe'] : undefined
    });
  });

  // 4. GPO Setup
  gpoStore.createGpo({
    id: 'gpo-1',
    name: 'Default Domain Policy',
    status: 'Enabled',
    links: ['corp.local'],
    enforcedLinks: ['corp.local'],
    securityFiltering: ['Authenticated Users'],
    settings: {
      'set-pwd-len': { id: 'set-pwd-len', category: 'Computer', path: 'Security Settings/Password Policy', name: 'Minimum password length', state: 'Enabled' },
      'set-lockout': { id: 'set-lockout', category: 'Computer', path: 'Security Settings/Account Lockout', name: 'Account lockout threshold', state: 'Enabled' },
    }
  });

  gpoStore.createGpo({
    id: 'gpo-2',
    name: 'Disable USB Devices',
    status: 'Enabled',
    links: ['corp.local/Computers'],
    enforcedLinks: [],
    securityFiltering: ['Authenticated Users'],
    settings: {
      'usb-deny': { id: 'usb-deny', category: 'Computer', path: 'System/Removable Storage', name: 'Deny all access', state: 'Enabled' }
    }
  });
  
  // Update state to trigger re-renders
  useActiveDirectoryStore.setState(adStore);
  useDnsStore.setState(dnsStore);
  useGpoStore.setState(gpoStore);
  useServerStore.setState(serverStore);
  useAzureStore.setState(azureStore);
  useJobStore.setState(jobStore);
}
