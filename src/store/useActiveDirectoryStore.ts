import { create } from 'zustand';
import type { ADDomain, ADOrganizationalUnit, ADUser, ADComputer, ADGroup, GPO } from '../types/ad';

interface ActiveDirectoryState {
  domains: Record<string, ADDomain>;
  ous: Record<string, ADOrganizationalUnit>;
  users: Record<string, ADUser>;
  computers: Record<string, ADComputer>;
  groups: Record<string, ADGroup>;
  gpos: Record<string, GPO>;

  createDomain: (domain: ADDomain) => void;
  createOU: (ou: ADOrganizationalUnit) => void;
  deleteOU: (id: string) => void;
  
  createUser: (user: ADUser) => void;
  updateUser: (id: string, updates: Partial<ADUser>) => void;
  deleteUser: (id: string) => void;

  createComputer: (computer: ADComputer) => void;
  updateComputer: (id: string, updates: Partial<ADComputer>) => void;
  deleteComputer: (id: string) => void;

  createGroup: (group: ADGroup) => void;
  updateGroup: (id: string, updates: Partial<ADGroup>) => void;
  deleteGroup: (id: string) => void;

  createGPO: (gpo: GPO) => void;
  updateGPO: (id: string, updates: Partial<GPO>) => void;
  deleteGPO: (id: string) => void;

  // Helper for generating initial AD structure
  seedDefaultDomain: () => void;
}

export const useActiveDirectoryStore = create<ActiveDirectoryState>((set) => ({
  domains: {},
  ous: {},
  users: {},
  computers: {},
  groups: {},
  gpos: {},

  createDomain: (domain) => set((state) => ({ domains: { ...state.domains, [domain.id]: domain } })),
  createOU: (ou) => set((state) => ({ ous: { ...state.ous, [ou.id]: ou } })),
  deleteOU: (id) => set((state) => {
    const newOus = { ...state.ous };
    delete newOus[id];
    return { ous: newOus };
  }),

  createUser: (user) => set((state) => ({ users: { ...state.users, [user.id]: user } })),
  updateUser: (id, updates) => set((state) => {
    const user = state.users[id];
    if (!user) return state;
    return { users: { ...state.users, [id]: { ...user, ...updates } } };
  }),
  deleteUser: (id) => set((state) => {
    const newUsers = { ...state.users };
    delete newUsers[id];
    return { users: newUsers };
  }),

  createComputer: (computer) => set((state) => ({ computers: { ...state.computers, [computer.id]: computer } })),
  updateComputer: (id, updates) => set((state) => {
    const comp = state.computers[id];
    if (!comp) return state;
    return { computers: { ...state.computers, [id]: { ...comp, ...updates } } };
  }),
  deleteComputer: (id) => set((state) => {
    const newComps = { ...state.computers };
    delete newComps[id];
    return { computers: newComps };
  }),

  createGroup: (group) => set((state) => ({ groups: { ...state.groups, [group.id]: group } })),
  updateGroup: (id, updates) => set((state) => {
    const group = state.groups[id];
    if (!group) return state;
    return { groups: { ...state.groups, [id]: { ...group, ...updates } } };
  }),
  deleteGroup: (id) => set((state) => {
    const newGroups = { ...state.groups };
    delete newGroups[id];
    return { groups: newGroups };
  }),

  createGPO: (gpo) => set((state) => ({ gpos: { ...state.gpos, [gpo.id]: gpo } })),
  updateGPO: (id, updates) => set((state) => {
    const gpo = state.gpos[id];
    if (!gpo) return state;
    return { gpos: { ...state.gpos, [id]: { ...gpo, ...updates } } };
  }),
  deleteGPO: (id) => set((state) => {
    const newGpos = { ...state.gpos };
    delete newGpos[id];
    return { gpos: newGpos };
  }),

  seedDefaultDomain: () => set((state) => {
    if (Object.keys(state.domains).length > 0) return state; // Already seeded

    const domainId = 'dom-1';
    return {
      domains: {
        [domainId]: { id: domainId, name: 'corp.local', netbiosName: 'CORP' }
      },
      ous: {
        'ou-users': { id: 'ou-users', name: 'Users', type: 'OU', distinguishedName: 'OU=Users,DC=corp,DC=local' },
        'ou-computers': { id: 'ou-computers', name: 'Computers', type: 'OU', distinguishedName: 'OU=Computers,DC=corp,DC=local' },
        'ou-servers': { id: 'ou-servers', name: 'Domain Controllers', type: 'OU', distinguishedName: 'OU=Domain Controllers,DC=corp,DC=local' },
      },
      users: {
        'usr-admin': {
          id: 'usr-admin', name: 'Administrator', type: 'User', distinguishedName: 'CN=Administrator,OU=Users,DC=corp,DC=local',
          firstName: 'Admin', lastName: 'User', displayName: 'Administrator', sAMAccountName: 'Administrator', userPrincipalName: 'admin@corp.local',
          enabled: true, lockedOut: false, passwordExpired: false, groups: ['grp-domain-admins'], parentOuId: 'ou-users'
        },
        'usr-jdoe': {
          id: 'usr-jdoe', name: 'John Doe', type: 'User', distinguishedName: 'CN=John Doe,OU=Users,DC=corp,DC=local',
          firstName: 'John', lastName: 'Doe', displayName: 'John Doe', sAMAccountName: 'jdoe', userPrincipalName: 'jdoe@corp.local', department: 'Sales',
          enabled: true, lockedOut: true, passwordExpired: false, groups: ['grp-domain-users'], parentOuId: 'ou-users'
        }
      },
      computers: {
        'comp-dc1': { id: 'comp-dc1', name: 'DC01', type: 'Computer', distinguishedName: 'CN=DC01,OU=Domain Controllers,DC=corp,DC=local', enabled: true, operatingSystem: 'Windows Server 2022', operatingSystemVersion: '10.0', parentOuId: 'ou-servers' }
      },
      groups: {
        'grp-domain-admins': { id: 'grp-domain-admins', name: 'Domain Admins', type: 'Group', distinguishedName: 'CN=Domain Admins,OU=Users,DC=corp,DC=local', groupScope: 'Global', groupType: 'Security', members: ['usr-admin'], parentOuId: 'ou-users' },
        'grp-domain-users': { id: 'grp-domain-users', name: 'Domain Users', type: 'Group', distinguishedName: 'CN=Domain Users,OU=Users,DC=corp,DC=local', groupScope: 'Global', groupType: 'Security', members: ['usr-admin', 'usr-jdoe'], parentOuId: 'ou-users' }
      },
      gpos: {
        'gpo-default': { id: 'gpo-default', name: 'Default Domain Policy', enabled: true, linkedOUs: [], settings: { 'PasswordPolicy.MinLength': '8', 'PasswordPolicy.Complexity': 'true' } }
      }
    };
  })
}));
