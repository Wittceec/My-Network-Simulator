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
  const rand = Math.random();

  if (rand < 0.25) {
    // 1. User Lockout
    const unlockedUsers = users.filter(u => !u.lockedOut && u.enabled);
    if (unlockedUsers.length > 0) {
      const targetUser = unlockedUsers[Math.floor(Math.random() * unlockedUsers.length)];
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
  } else if (rand < 0.5) {
    // 2. Terminated Employee
    const activeUsers = users.filter(u => u.enabled);
    if (activeUsers.length > 0) {
      const targetUser = activeUsers[Math.floor(Math.random() * activeUsers.length)];
      return createTicket(
        `Urgent: Terminated Employee - ${targetUser.name}`,
        `HR has informed us that ${targetUser.name} has been terminated effective immediately. Please disable their Active Directory account immediately.`,
        'HelpDesk',
        'High',
        'ad_disable_account',
        targetUser.id
      );
    }
  } else if (rand < 0.75) {
    // 3. Title/Department Update
    const activeUsers = users.filter(u => u.enabled);
    if (activeUsers.length > 0) {
      const targetUser = activeUsers[Math.floor(Math.random() * activeUsers.length)];
      return createTicket(
        `Title Update Request: ${targetUser.name}`,
        `${targetUser.name} has been promoted to 'Senior Manager' in the 'Operations' department. Please update their AD properties.`,
        'HelpDesk',
        'Low',
        'ad_update_title',
        targetUser.id
      );
    }
  } else if (rand < 0.9) {
    // 4. Incorrect Group Membership
    const activeUsers = users.filter(u => u.enabled);
    if (activeUsers.length > 0) {
      const targetUser = activeUsers[Math.floor(Math.random() * activeUsers.length)];
      return createTicket(
        `Add to Finance Group: ${targetUser.name}`,
        `${targetUser.name} needs access to Finance resources. Please add them to the 'Finance' Active Directory security group.`,
        'HelpDesk',
        'Medium',
        'ad_add_to_finance',
        targetUser.id
      );
    }
  } else {
    // 5. File Share issue
    return createTicket(
      'Access Denied to HR Share',
      'Users in the HR department are reporting they receive "Access Denied" when trying to open \\\\FILE01\\HR. Please verify NTFS permissions on the File Server and ensure the HR group has Modify access.',
      'HelpDesk',
      'High',
      'fs_hr_access'
    );
  }
  return null;
}

function generateSysAdminTicket(): Ticket | null {
  const adStore = useActiveDirectoryStore.getState();
  const rand = Math.random();

  if (rand < 0.15) {
    // 1. Bulk user onboarding
    return createTicket(
      'New Hire Onboarding (Marketing)',
      'We have 5 new hires starting in Marketing next Monday. Please create their AD accounts, ensure they are enabled, and add them to the "Marketing" security group. Create the group if it does not exist.',
      'SysAdmin',
      'Medium',
      'ad_bulk_create_users'
    );
  } else if (rand < 0.3) {
    // 2. DNS Issue
    return createTicket(
      'Intranet Site Unreachable',
      'Users are reporting they cannot access the intranet site. Error says "DNS_PROBE_FINISHED_NXDOMAIN". Please check the DNS Server and ensure there is an A record or CNAME for "intranet" pointing to 10.0.0.50 in the corp.local zone.',
      'SysAdmin',
      'High',
      'dns_fix_intranet'
    );
  } else if (rand < 0.45) {
    // 3. Hyper-V Issue
    return createTicket(
      'Legacy App is offline',
      'The legacy application is not responding. It runs on the VM "APP-LEGACY". Please check Hyper-V Manager and ensure the VM is running.',
      'SysAdmin',
      'High',
      'hyperv_start_vm'
    );
  } else if (rand < 0.6) {
    // 4. DNS CNAME Creation
    return createTicket(
      'New CNAME Record for CRM',
      'We are deploying a new CRM tool hosted on the intranet server. Please create a CNAME record in DNS for "crm.corp.local" pointing to "intranet.corp.local".',
      'SysAdmin',
      'Medium',
      'dns_create_cname'
    );
  } else if (rand < 0.75) {
    // 5. GPO Password Policy
    return createTicket(
      'Security Compliance: Enable Password Length Policy',
      'Security audit flagged us. Please open Group Policy Management, edit the "Default Domain Policy", and ensure "Minimum password length" is set to Enabled under Computer/Windows Settings/Security Settings/Account Policies/Password Policy.',
      'SysAdmin',
      'Medium',
      'gpo_password_length'
    );
  } else if (rand < 0.9) {
    // 6. Remove overly permissive NTFS
    return createTicket(
      'File Server Audit: Finance Share',
      'Audit discovered that "Domain Users" has access to the \\\\FILE01\\Finance share. Please use the File Server Resource Manager to remove "Domain Users" from the Finance share NTFS permissions.',
      'SysAdmin',
      'High',
      'fs_cleanup_finance'
    );
  } else {
    // 7. Disk space issue
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
  const rand = Math.random();
  if (rand < 0.25) {
    // 1. Deploy App Gateway
    return createTicket(
      'Deploy new Application Gateway',
      'We are preparing to launch a new web app. Please provision an Azure Application Gateway with WAF_v2 SKU in the central VNet.',
      'CloudArchitect',
      'Medium',
      'azure_deploy_appgw'
    );
  } else if (rand < 0.5) {
    // 2. Identity Sync
    const azureStore = useAzureStore.getState();
    const entraUsers = Object.values(azureStore.entraUsers);
    if (entraUsers.length === 0) {
      return createTicket(
        'Identity Sync Alert: Local users not in Azure AD',
        'Our cloud applications are reporting authentication failures for new users. It appears the Azure AD Connect sync has stalled. Please log into a Domain Controller and force a Delta sync cycle to push the local users up to Entra ID.',
        'CloudArchitect',
        'High',
        'ad_sync_complete'
      );
    }
  } else if (rand < 0.75) {
    // 3. Orphaned Public IP
    const azureStore = useAzureStore.getState();
    const pips = Object.values(azureStore.publicIps);
    if (pips.length > 0) {
      const targetPip = pips[Math.floor(Math.random() * pips.length)];
      return createTicket(
        `Cost Optimization: Delete unused Public IP ${targetPip.name}`,
        `We are being billed for an unassociated Public IP address (${targetPip.name}). Please delete it from the Azure Portal to save costs.`,
        'CloudArchitect',
        'Low',
        'azure_delete_pip',
        targetPip.id
      );
    }
  } else if (rand < 0.9) {
    // 4. Create Entra ID User
    return createTicket(
      'Create Cloud-Only Contractor Account',
      'We have a new external contractor starting today. They only need access to Office 365, so please create a cloud-only user directly in Entra ID (Azure AD) for them.',
      'CloudArchitect',
      'Low',
      'azure_create_entra_user'
    );
  } else {
    // 5. VNet Peering Request
    return createTicket(
      'Provision new VNet',
      'We need a new Virtual Network (VNet) in East US called "vnet-eastus-02". Please create it in the Azure portal.',
      'CloudArchitect',
      'Medium',
      'azure_create_vnet'
    );
  }
  return null;
}

function generateSecOpsTicket(): Ticket | null {
  const rand = Math.random();
  const azureStore = useAzureStore.getState();

  if (rand < 0.33) {
    // 1. Vulnerability Scan
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
  } else if (rand < 0.66) {
    // 2. Disable Stale Accounts
    const adStore = useActiveDirectoryStore.getState();
    const activeUsers = Object.values(adStore.users).filter(u => u.enabled);
    if (activeUsers.length > 0) {
      const targetUser = activeUsers[Math.floor(Math.random() * activeUsers.length)];
      return createTicket(
        `Stale Account Review: ${targetUser.name}`,
        `Our monthly stale account script flagged ${targetUser.name} as having not logged in for 90 days. Please disable this Active Directory account.`,
        'SecOps',
        'Medium',
        'ad_disable_account',
        targetUser.id
      );
    }
  } else {
    // 3. Privileged Access Review
    const adStore = useActiveDirectoryStore.getState();
    const adminGroup = Object.values(adStore.groups).find(g => g.name.toLowerCase() === 'domain admins');
    if (adminGroup && adminGroup.members.length > 0) {
      // Find a member who shouldn't be an admin (let's just pick one randomly that isn't Administrator if possible)
      const targetUserId = adminGroup.members.find(uid => adStore.users[uid]?.name !== 'Administrator') || adminGroup.members[0];
      const targetUser = adStore.users[targetUserId];
      if (targetUser) {
        return createTicket(
          `Privileged Access Violation: ${targetUser.name}`,
          `Access review detected that ${targetUser.name} is a member of the Domain Admins group. This violates least privilege. Please remove them from Domain Admins.`,
          'SecOps',
          'Critical',
          'ad_remove_domain_admin',
          targetUserId
        );
      }
    }
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

      case 'ad_disable_account':
        jobStore.verifyTicketResolution(ticket.id, () => {
          if (!ticket.targetResourceId) return false;
          const user = useActiveDirectoryStore.getState().users[ticket.targetResourceId];
          return user ? !user.enabled : false;
        });
        break;

      case 'ad_update_title':
        jobStore.verifyTicketResolution(ticket.id, () => {
          if (!ticket.targetResourceId) return false;
          const user = useActiveDirectoryStore.getState().users[ticket.targetResourceId];
          return user ? (user.jobTitle === 'Senior Manager' && user.department === 'Operations') : false;
        });
        break;

      case 'ad_remove_domain_admin':
        jobStore.verifyTicketResolution(ticket.id, () => {
          if (!ticket.targetResourceId) return false;
          const adminGroup = Object.values(useActiveDirectoryStore.getState().groups).find((g: any) => g.name.toLowerCase() === 'domain admins');
          if (!adminGroup) return false;
          return !adminGroup.members.includes(ticket.targetResourceId);
        });
        break;

      case 'ad_add_to_finance':
        jobStore.verifyTicketResolution(ticket.id, () => {
          if (!ticket.targetResourceId) return false;
          const financeGroup = Object.values(useActiveDirectoryStore.getState().groups).find((g: any) => g.name.toLowerCase() === 'finance');
          if (!financeGroup) return false;
          return financeGroup.members.includes(ticket.targetResourceId);
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

      case 'ad_sync_complete':
        jobStore.verifyTicketResolution(ticket.id, () => {
          const azureStore = useAzureStore.getState();
          const entraUsers = Object.values(azureStore.entraUsers);
          return entraUsers.length > 0;
        });
        break;

      case 'dns_fix_intranet':
        jobStore.verifyTicketResolution(ticket.id, () => {
          const { useDnsStore } = require('../../store/useDnsStore');
          const dnsStore = useDnsStore.getState();
          const corpZone = Object.values(dnsStore.zones).find((z: any) => z.name === 'corp.local');
          if (!corpZone) return false;
          return Object.values(corpZone.records).some((r: any) => r.name === 'intranet' && (r.type === 'A' && r.data === '10.0.0.50' || r.type === 'CNAME'));
        });
        break;

      case 'dns_create_cname':
        jobStore.verifyTicketResolution(ticket.id, () => {
          const { useDnsStore } = require('../../store/useDnsStore');
          const dnsStore = useDnsStore.getState();
          const corpZone = Object.values(dnsStore.zones).find((z: any) => z.name === 'corp.local');
          if (!corpZone) return false;
          return Object.values(corpZone.records).some((r: any) => r.name.toLowerCase() === 'crm' && r.type === 'CNAME' && r.data.toLowerCase().includes('intranet'));
        });
        break;

      case 'gpo_password_length':
        jobStore.verifyTicketResolution(ticket.id, () => {
          const { useGpoStore } = require('../../store/useGpoStore');
          const gpoStore = useGpoStore.getState();
          const defaultPolicy = Object.values(gpoStore.gpos).find((g: any) => g.name === 'Default Domain Policy');
          if (!defaultPolicy) return false;
          const setting = Object.values(defaultPolicy.settings).find((s: any) => s.name === 'Minimum password length');
          return setting ? setting.state === 'Enabled' : false;
        });
        break;

      case 'fs_cleanup_finance':
        jobStore.verifyTicketResolution(ticket.id, () => {
          const { useServerStore } = require('../../store/useServerStore');
          const sStore = useServerStore.getState();
          const finShare = Object.values(sStore.shares).find((s: any) => s.name === 'Finance');
          if (!finShare) return false;
          // Return true if 'Domain Users' does NOT have any permission
          return !finShare.ntfsPermissions['Domain Users'];
        });
        break;

      case 'fs_hr_access':
        jobStore.verifyTicketResolution(ticket.id, () => {
          const { useServerStore } = require('../../store/useServerStore');
          const sStore = useServerStore.getState();
          const hrShare = Object.values(sStore.shares).find((s: any) => s.name === 'HR');
          if (!hrShare) return false;
          const hrPerm = hrShare.ntfsPermissions['HR'];
          return hrPerm === 'Modify' || hrPerm === 'FullControl';
        });
        break;

      case 'hyperv_start_vm':
        jobStore.verifyTicketResolution(ticket.id, () => {
          const { useServerStore } = require('../../store/useServerStore');
          const sStore = useServerStore.getState();
          const appVm = Object.values(sStore.vms).find((v: any) => v.name === 'APP-LEGACY');
          if (!appVm) return false;
          return appVm.state === 'Running';
        });
        break;

      case 'azure_delete_pip':
        jobStore.verifyTicketResolution(ticket.id, () => {
          if (!ticket.targetResourceId) return false;
          const azureStore = useAzureStore.getState();
          // Verify it's deleted
          return !azureStore.publicIps[ticket.targetResourceId];
        });
        break;

      case 'azure_create_entra_user':
        jobStore.verifyTicketResolution(ticket.id, () => {
          const azureStore = useAzureStore.getState();
          // Any user created after the ticket was created counts.
          const entraUsers = Object.values(azureStore.entraUsers);
          // However entra users don't have createdAt in the type, but we could check if there is an Entra ID user not in AD
          const adStore = useActiveDirectoryStore.getState();
          const adUpns = Object.values(adStore.users).map(u => u.userPrincipalName);
          const cloudOnlyUsers = entraUsers.filter(eu => !adUpns.includes(eu.userPrincipalName));
          return cloudOnlyUsers.length > 0;
        });
        break;

      case 'azure_create_vnet':
        jobStore.verifyTicketResolution(ticket.id, () => {
          const azureStore = useAzureStore.getState();
          const vnets = Object.values(azureStore.vnets || {});
          return vnets.some((v: any) => v.name === 'vnet-eastus-02');
        });
        break;
    }
  });
}
