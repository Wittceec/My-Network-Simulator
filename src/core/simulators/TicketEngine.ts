import { useJobStore } from '../../store/useJobStore';
import { useActiveDirectoryStore } from '../../store/useActiveDirectoryStore';
import { useAzureStore } from '../../store/useAzureStore';
import { useNetworkStore } from '../../store/useNetworkStore';
import type { JobRole, Ticket, TicketSeverity } from '../../types/job';

let ticketTimer: NodeJS.Timeout | null = null;

const TICKETS_PER_ROLE: Record<JobRole, () => Ticket | null> = {
  HelpDesk: generateHelpDeskTicket,
  SysAdmin: generateSysAdminTicket,
  NetAdmin: generateNetAdminTicket,
  CloudArchitect: generateCloudArchitectTicket,
  SecOps: generateSecOpsTicket,
};

function createTicket(
  title: string,
  description: string,
  role: JobRole,
  severity: TicketSeverity,
  type: string,
  targetResourceId?: string
): Ticket {
  return {
    id: `ticket-${Math.random().toString(36).substr(2, 9)}`,
    title,
    description,
    role,
    severity,
    status: 'Open',
    createdAt: Date.now(),
    type,
    targetResourceId
  };
}

// -- TICKET GENERATORS --

function generateHelpDeskTicket(): Ticket | null {
  const adStore = useActiveDirectoryStore.getState();
  const users = Object.values(adStore.users);
  
  // Find a user to lock out
  const unlockedUsers = users.filter(u => !u.lockedOut && u.enabled);
  if (unlockedUsers.length > 0 && Math.random() > 0.5) {
    const targetUser = unlockedUsers[Math.floor(Math.random() * unlockedUsers.length)];
    // Lock them out in the simulation
    adStore.updateUser(targetUser.id, { lockedOut: true });
    
    return createTicket(
      `User Lockout: ${targetUser.name}`,
      `User ${targetUser.name} (${targetUser.userPrincipalName}) called in. They are locked out of their account after multiple failed login attempts. Please unlock their account.`,
      'HelpDesk',
      'Medium',
      'ad_unlock_account',
      targetUser.id
    );
  }
  return null;
}

function generateSysAdminTicket(): Ticket | null {
  const adStore = useActiveDirectoryStore.getState();
  const rand = Math.random();

  if (rand < 0.5) {
    // Bulk user onboarding
    return createTicket(
      'New Hire Onboarding (Marketing)',
      'We have 5 new hires starting in Marketing next Monday. Please create their AD accounts, ensure they are enabled, and add them to the "Marketing" security group. Create the group if it does not exist.',
      'SysAdmin',
      'Medium',
      'ad_bulk_create_users'
    );
  } else {
    // Disk space issue
    const azureStore = useAzureStore.getState();
    const vms = Object.values(azureStore.vms);
    if (vms.length > 0) {
      const vm = vms[Math.floor(Math.random() * vms.length)];
      return createTicket(
        `Low Disk Space alert: ${vm.name}`,
        `Monitoring alert: VM ${vm.name} is running critically low on disk space (C: drive). Please attach a new data disk or expand existing storage.`,
        'SysAdmin',
        'High',
        'azure_vm_storage',
        vm.id
      );
    }
  }
  return null;
}

function generateNetAdminTicket(): Ticket | null {
  const netStore = useNetworkStore.getState();
  const devices = Object.values(netStore.devices);
  
  if (devices.length > 0 && Math.random() > 0.5) {
    const router = devices.find(d => d.type === 'router');
    if (router) {
      return createTicket(
        `OSPF neighbor down on ${router.name}`,
        `We are receiving alerts that an OSPF neighbor relationship has gone down on ${router.name}. Please investigate the interfaces and restore routing.`,
        'NetAdmin',
        'Critical',
        'net_ospf_down',
        router.id
      );
    }
  }
  return null;
}

function generateCloudArchitectTicket(): Ticket | null {
  if (Math.random() > 0.5) {
    return createTicket(
      'Deploy new Application Gateway',
      'We are preparing to launch a new web app. Please provision an Azure Application Gateway with WAF_v2 SKU in the central VNet.',
      'CloudArchitect',
      'Medium',
      'azure_deploy_appgw'
    );
  }
  return null;
}

function generateSecOpsTicket(): Ticket | null {
  const azureStore = useAzureStore.getState();
  const vms = Object.values(azureStore.vms);
  if (vms.length > 0) {
    const targetVm = vms[Math.floor(Math.random() * vms.length)];
    return createTicket(
      `Vulnerability Scan: Exposed RDP on ${targetVm.name}`,
      `Security scan shows that VM ${targetVm.name} has RDP (port 3389) exposed to the internet. Please update the NSG to restrict port 3389 to internal IPs only or remove the rule entirely.`,
      'SecOps',
      'High',
      'azure_nsg_restrict_rdp',
      targetVm.id
    );
  }
  return null;
}

// -- ENGINE CONTROL --

export function startTicketEngine() {
  if (ticketTimer) clearInterval(ticketTimer);
  
  ticketTimer = setInterval(() => {
    const jobStore = useJobStore.getState();
    if (!jobStore.isClockedIn || !jobStore.currentRole) return;
    
    // 30% chance every tick (e.g. 15s) to get a ticket
    if (Math.random() < 0.3) {
      const generator = TICKETS_PER_ROLE[jobStore.currentRole];
      const newTicket = generator();
      if (newTicket) {
        jobStore.addTicket(newTicket);
      }
    }
    
    // Auto-verify open/in-progress tickets
    verifyTickets();
  }, 15000); // Check every 15 seconds
}

export function stopTicketEngine() {
  if (ticketTimer) clearInterval(ticketTimer);
  ticketTimer = null;
}

// -- TICKET VERIFICATION --

function verifyTickets() {
  const jobStore = useJobStore.getState();
  const tickets = Object.values(jobStore.tickets).filter(t => t.status !== 'Resolved' && t.status !== 'Closed');
  
  tickets.forEach(ticket => {
    switch (ticket.type) {
      case 'ad_unlock_account':
        jobStore.verifyTicketResolution(ticket.id, () => {
          if (!ticket.targetResourceId) return false;
          const user = useActiveDirectoryStore.getState().users[ticket.targetResourceId];
          return user ? !user.lockedOut : false;
        });
        break;
      
      case 'azure_nsg_restrict_rdp':
        jobStore.verifyTicketResolution(ticket.id, () => {
          if (!ticket.targetResourceId) return false;
          const vm = useAzureStore.getState().vms[ticket.targetResourceId];
          if (!vm || !vm.subnetId) return false;
          // Find NSG for subnet
          const vnets = Object.values(useAzureStore.getState().vnets);
          const subnet = vnets.flatMap(v => v.subnets).find(s => s.id === vm.subnetId);
          if (!subnet || !subnet.nsgId) return false; // Not resolved if no NSG
          
          const nsg = useAzureStore.getState().nsgs[subnet.nsgId];
          if (!nsg) return false;
          
          // Check if there is an allow rule for 3389 from Any
          const hasExposedRdp = nsg.rules.some(r => 
            r.access === 'Allow' && 
            r.destinationPortRange === '3389' && 
            r.sourceAddressPrefix === '*'
          );
          return !hasExposedRdp; // Resolved if NO exposed RDP rule
        });
        break;
        
      case 'ad_bulk_create_users':
        jobStore.verifyTicketResolution(ticket.id, () => {
           const adStore = useActiveDirectoryStore.getState();
           const marketingGroup = Object.values(adStore.groups).find(g => g.name.toLowerCase() === 'marketing');
           if (!marketingGroup) return false;
           // Ensure at least 5 enabled members
           const enabledMembers = marketingGroup.members.filter(uid => {
             const u = adStore.users[uid];
             return u && u.enabled;
           });
           return enabledMembers.length >= 5;
        });
        break;

      case 'azure_deploy_appgw':
        jobStore.verifyTicketResolution(ticket.id, () => {
          const azureStore = useAzureStore.getState();
          const appGws = Object.values(azureStore.appGateways);
          return appGws.some(gw => gw.sku === 'WAF_v2');
        });
        break;
    }
  });
}
