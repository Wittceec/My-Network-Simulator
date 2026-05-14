import { create } from 'zustand';
import type { ResourceGroup, VNet, VM, NSG, RouteTable, AzureResource, VirtualNetworkGateway, LoadBalancer, StorageAccount, EntraUser, RoleAssignment, DnsZone, AppService, KeyVault, KubernetesCluster, VMScaleSet, RecoveryServicesVault, SqlServer, SqlDatabase, LogAnalyticsWorkspace, AzureFirewall, ApplicationGateway } from '../types/azure';

interface AzureState {
  resourceGroups: Record<string, ResourceGroup>;
  vnets: Record<string, VNet>;
  vms: Record<string, VM>;
  nsgs: Record<string, NSG>;
  routeTables: Record<string, RouteTable>;
  vngs: Record<string, VirtualNetworkGateway>;
  loadBalancers: Record<string, LoadBalancer>;
  storageAccounts: Record<string, StorageAccount>;
  entraUsers: Record<string, EntraUser>;
  roleAssignments: Record<string, RoleAssignment>;
  dnsZones: Record<string, DnsZone>;
  appServices: Record<string, AppService>;
  keyVaults: Record<string, KeyVault>;
  aksClusters: Record<string, KubernetesCluster>;
  vmss: Record<string, VMScaleSet>;
  recoveryVaults: Record<string, RecoveryServicesVault>;
  sqlServers: Record<string, SqlServer>;
  sqlDatabases: Record<string, SqlDatabase>;
  logWorkspaces: Record<string, LogAnalyticsWorkspace>;
  firewalls: Record<string, AzureFirewall>;
  appGateways: Record<string, ApplicationGateway>;
  
  createResourceGroup: (rg: ResourceGroup) => void;
  deleteResourceGroup: (name: string) => void;
  
  createVNet: (vnet: VNet) => void;
  deleteVNet: (id: string) => void;
  updateVNet: (id: string, updater: (vnet: VNet) => VNet) => void;
  
  createVM: (vm: VM) => void;
  deleteVM: (id: string) => void;
  updateVM: (id: string, updater: (vm: VM) => VM) => void;
  
  createNSG: (nsg: NSG) => void;
  deleteNSG: (id: string) => void;
  
  createRouteTable: (rt: RouteTable) => void;
  deleteRouteTable: (id: string) => void;
  
  createVNG: (vng: VirtualNetworkGateway) => void;
  deleteVNG: (id: string) => void;
  
  createLoadBalancer: (lb: LoadBalancer) => void;
  deleteLoadBalancer: (id: string) => void;

  createStorageAccount: (sa: StorageAccount) => void;
  deleteStorageAccount: (id: string) => void;

  createEntraUser: (user: EntraUser) => void;
  deleteEntraUser: (id: string) => void;

  createRoleAssignment: (ra: RoleAssignment) => void;
  deleteRoleAssignment: (id: string) => void;

  createDnsZone: (zone: DnsZone) => void;
  deleteDnsZone: (id: string) => void;

  createAppService: (app: AppService) => void;
  deleteAppService: (id: string) => void;

  createKeyVault: (kv: KeyVault) => void;
  deleteKeyVault: (id: string) => void;

  createAksCluster: (aks: KubernetesCluster) => void;
  deleteAksCluster: (id: string) => void;

  createVMSS: (vmss: VMScaleSet) => void;
  deleteVMSS: (id: string) => void;

  createRecoveryVault: (rv: RecoveryServicesVault) => void;
  deleteRecoveryVault: (id: string) => void;

  createSqlServer: (sql: SqlServer) => void;
  deleteSqlServer: (id: string) => void;

  createSqlDatabase: (db: SqlDatabase) => void;
  deleteSqlDatabase: (id: string) => void;

  createLogWorkspace: (law: LogAnalyticsWorkspace) => void;
  deleteLogWorkspace: (id: string) => void;

  createFirewall: (fw: AzureFirewall) => void;
  deleteFirewall: (id: string) => void;

  createAppGateway: (agw: ApplicationGateway) => void;
  deleteAppGateway: (id: string) => void;

  loadAzureState: (state: Partial<AzureState>) => void;
}

export const useAzureStore = create<AzureState>((set) => ({
  resourceGroups: {},
  vnets: {},
  vms: {},
  nsgs: {},
  routeTables: {},
  vngs: {},
  loadBalancers: {},
  storageAccounts: {},
  entraUsers: {},
  roleAssignments: {},
  dnsZones: {},
  appServices: {},
  keyVaults: {},
  aksClusters: {},
  vmss: {},
  recoveryVaults: {},
  sqlServers: {},
  sqlDatabases: {},
  logWorkspaces: {},
  firewalls: {},
  appGateways: {},

  createResourceGroup: (rg) => set((state) => ({ resourceGroups: { ...state.resourceGroups, [rg.name]: rg } })),
  deleteResourceGroup: (name) => set((state) => {
    const newRgs = { ...state.resourceGroups };
    delete newRgs[name];
    // In a real app, we might also cascade delete resources in this RG
    return { resourceGroups: newRgs };
  }),

  createVNet: (vnet) => set((state) => ({ vnets: { ...state.vnets, [vnet.id]: vnet } })),
  deleteVNet: (id) => set((state) => {
    const newVnets = { ...state.vnets };
    delete newVnets[id];
    return { vnets: newVnets };
  }),
  updateVNet: (id, updater) => set((state) => {
    const vnet = state.vnets[id];
    if (!vnet) return state;
    return { vnets: { ...state.vnets, [id]: updater(vnet) } };
  }),

  createVM: (vm) => set((state) => ({ vms: { ...state.vms, [vm.id]: vm } })),
  deleteVM: (id) => set((state) => {
    const newVms = { ...state.vms };
    delete newVms[id];
    return { vms: newVms };
  }),
  updateVM: (id, updater) => set((state) => {
    const vm = state.vms[id];
    if (!vm) return state;
    return { vms: { ...state.vms, [id]: updater(vm) } };
  }),

  createNSG: (nsg) => set((state) => ({ nsgs: { ...state.nsgs, [nsg.id]: nsg } })),
  deleteNSG: (id) => set((state) => {
    const newNsgs = { ...state.nsgs };
    delete newNsgs[id];
    return { nsgs: newNsgs };
  }),

  createRouteTable: (rt) => set((state) => ({ routeTables: { ...state.routeTables, [rt.id]: rt } })),
  deleteRouteTable: (id) => set((state) => {
    const newRts = { ...state.routeTables };
    delete newRts[id];
    return { routeTables: newRts };
  }),

  createVNG: (vng) => set((state) => ({ vngs: { ...state.vngs, [vng.id]: vng } })),
  deleteVNG: (id) => set((state) => {
    const newVngs = { ...state.vngs };
    delete newVngs[id];
    return { vngs: newVngs };
  }),

  createLoadBalancer: (lb) => set((state) => ({ loadBalancers: { ...state.loadBalancers, [lb.id]: lb } })),
  deleteLoadBalancer: (id) => set((state) => {
    const newLbs = { ...state.loadBalancers };
    delete newLbs[id];
    return { loadBalancers: newLbs };
  }),

  createStorageAccount: (sa) => set((state) => ({ storageAccounts: { ...state.storageAccounts, [sa.id]: sa } })),
  deleteStorageAccount: (id) => set((state) => {
    const newSas = { ...state.storageAccounts };
    delete newSas[id];
    return { storageAccounts: newSas };
  }),

  createEntraUser: (user) => set((state) => ({ entraUsers: { ...state.entraUsers, [user.id]: user } })),
  deleteEntraUser: (id) => set((state) => {
    const newUsers = { ...state.entraUsers };
    delete newUsers[id];
    return { entraUsers: newUsers };
  }),

  createRoleAssignment: (ra) => set((state) => ({ roleAssignments: { ...state.roleAssignments, [ra.id]: ra } })),
  deleteRoleAssignment: (id) => set((state) => {
    const newRas = { ...state.roleAssignments };
    delete newRas[id];
    return { roleAssignments: newRas };
  }),

  createDnsZone: (zone) => set((state) => ({ dnsZones: { ...state.dnsZones, [zone.id]: zone } })),
  deleteDnsZone: (id) => set((state) => {
    const newZones = { ...state.dnsZones };
    delete newZones[id];
    return { dnsZones: newZones };
  }),

  createAppService: (app) => set((state) => ({ appServices: { ...state.appServices, [app.id]: app } })),
  deleteAppService: (id) => set((state) => {
    const newApps = { ...state.appServices };
    delete newApps[id];
    return { appServices: newApps };
  }),

  createKeyVault: (kv) => set((state) => ({ keyVaults: { ...state.keyVaults, [kv.id]: kv } })),
  deleteKeyVault: (id) => set((state) => {
    const newKvs = { ...state.keyVaults };
    delete newKvs[id];
    return { keyVaults: newKvs };
  }),

  createAksCluster: (aks) => set((state) => ({ aksClusters: { ...state.aksClusters, [aks.id]: aks } })),
  deleteAksCluster: (id) => set((state) => {
    const newAks = { ...state.aksClusters };
    delete newAks[id];
    return { aksClusters: newAks };
  }),

  createVMSS: (scaleSet) => set((state) => ({ vmss: { ...state.vmss, [scaleSet.id]: scaleSet } })),
  deleteVMSS: (id) => set((state) => {
    const newVmss = { ...state.vmss };
    delete newVmss[id];
    return { vmss: newVmss };
  }),

  createRecoveryVault: (rv) => set((state) => ({ recoveryVaults: { ...state.recoveryVaults, [rv.id]: rv } })),
  deleteRecoveryVault: (id) => set((state) => {
    const newRv = { ...state.recoveryVaults };
    delete newRv[id];
    return { recoveryVaults: newRv };
  }),

  createSqlServer: (sql) => set((state) => ({ sqlServers: { ...state.sqlServers, [sql.id]: sql } })),
  deleteSqlServer: (id) => set((state) => {
    const newSql = { ...state.sqlServers };
    delete newSql[id];
    return { sqlServers: newSql };
  }),

  createSqlDatabase: (db) => set((state) => ({ sqlDatabases: { ...state.sqlDatabases, [db.id]: db } })),
  deleteSqlDatabase: (id) => set((state) => {
    const newDb = { ...state.sqlDatabases };
    delete newDb[id];
    return { sqlDatabases: newDb };
  }),

  createLogWorkspace: (law) => set((state) => ({ logWorkspaces: { ...state.logWorkspaces, [law.id]: law } })),
  deleteLogWorkspace: (id) => set((state) => {
    const newLaw = { ...state.logWorkspaces };
    delete newLaw[id];
    return { logWorkspaces: newLaw };
  }),

  createFirewall: (fw) => set((state) => ({ firewalls: { ...state.firewalls, [fw.id]: fw } })),
  deleteFirewall: (id) => set((state) => {
    const newFw = { ...state.firewalls };
    delete newFw[id];
    return { firewalls: newFw };
  }),

  createAppGateway: (agw) => set((state) => ({ appGateways: { ...state.appGateways, [agw.id]: agw } })),
  deleteAppGateway: (id) => set((state) => {
    const newAgw = { ...state.appGateways };
    delete newAgw[id];
    return { appGateways: newAgw };
  }),

  loadAzureState: (newState) => set((state) => ({
    resourceGroups: newState.resourceGroups || {},
    vnets: newState.vnets || {},
    vms: newState.vms || {},
    nsgs: newState.nsgs || {},
    routeTables: newState.routeTables || {},
    vngs: newState.vngs || {},
    loadBalancers: newState.loadBalancers || {},
    storageAccounts: newState.storageAccounts || {},
    entraUsers: newState.entraUsers || {},
    roleAssignments: newState.roleAssignments || {},
    dnsZones: newState.dnsZones || {},
    appServices: newState.appServices || {},
    keyVaults: newState.keyVaults || {},
    aksClusters: newState.aksClusters || {},
    vmss: newState.vmss || {},
    recoveryVaults: newState.recoveryVaults || {},
    sqlServers: newState.sqlServers || {},
    sqlDatabases: newState.sqlDatabases || {},
    logWorkspaces: newState.logWorkspaces || {},
    firewalls: newState.firewalls || {},
    appGateways: newState.appGateways || {}
  }))
}));
