import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ResourceGroup, VNet, VM, NSG, RouteTable, AzureResource, VirtualNetworkGateway, LoadBalancer, StorageAccount, EntraUser, EntraGroup, RoleAssignment, DnsZone, AppServicePlan, AppService, KeyVault, KubernetesCluster, VMScaleSet, RecoveryServicesVault, SqlServer, SqlDatabase, LogAnalyticsWorkspace, AzureFirewall, ApplicationGateway, PublicIpAddress, NetworkInterface, AzureBastion, ManagedIdentity, AdvisorRecommendation, PolicyCompliance } from '../types/azure';

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
  publicIps: Record<string, PublicIpAddress>;
  nics: Record<string, NetworkInterface>;
  bastions: Record<string, AzureBastion>;
  entraGroups: Record<string, EntraGroup>;
  appServicePlans: Record<string, AppServicePlan>;
  managedIdentities: Record<string, ManagedIdentity>;
  recommendations: AdvisorRecommendation[];
  compliance: PolicyCompliance[];
  
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

  createPublicIp: (pip: PublicIpAddress) => void;
  deletePublicIp: (id: string) => void;

  createNic: (nic: NetworkInterface) => void;
  deleteNic: (id: string) => void;

  createBastion: (bastion: AzureBastion) => void;
  deleteBastion: (id: string) => void;

  createEntraGroup: (group: EntraGroup) => void;
  deleteEntraGroup: (id: string) => void;

  createAppServicePlan: (asp: AppServicePlan) => void;
  deleteAppServicePlan: (id: string) => void;

  createManagedIdentity: (mi: ManagedIdentity) => void;
  deleteManagedIdentity: (id: string) => void;

  refreshAdvisor: () => void;
  refreshCompliance: () => void;

  loadAzureState: (state: Partial<AzureState>) => void;
}

export const useAzureStore = create<AzureState>()(
  persist(
    (set) => ({

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
  publicIps: {},
  nics: {},
  bastions: {},
  entraGroups: {},
  appServicePlans: {},
  managedIdentities: {},
  recommendations: [],
  compliance: [],

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

  createPublicIp: (pip) => set((state) => ({ publicIps: { ...state.publicIps, [pip.id]: pip } })),
  deletePublicIp: (id) => set((state) => {
    const newPip = { ...state.publicIps };
    delete newPip[id];
    return { publicIps: newPip };
  }),

  createNic: (nic) => set((state) => ({ nics: { ...state.nics, [nic.id]: nic } })),
  deleteNic: (id) => set((state) => {
    const newNic = { ...state.nics };
    delete newNic[id];
    return { nics: newNic };
  }),

  createBastion: (bastion) => set((state) => ({ bastions: { ...state.bastions, [bastion.id]: bastion } })),
  deleteBastion: (id) => set((state) => {
    const newBastions = { ...state.bastions };
    delete newBastions[id];
    return { bastions: newBastions };
  }),

  createEntraGroup: (group) => set((state) => ({ entraGroups: { ...state.entraGroups, [group.id]: group } })),
  deleteEntraGroup: (id) => set((state) => {
    const newGroups = { ...state.entraGroups };
    delete newGroups[id];
    return { entraGroups: newGroups };
  }),

  createAppServicePlan: (asp) => set((state) => ({ appServicePlans: { ...state.appServicePlans, [asp.id]: asp } })),
  deleteAppServicePlan: (id) => set((state) => {
    const newAsps = { ...state.appServicePlans };
    delete newAsps[id];
    return { appServicePlans: newAsps };
  }),

  createManagedIdentity: (mi) => set((state) => ({ managedIdentities: { ...state.managedIdentities, [mi.id]: mi } })),
  deleteManagedIdentity: (id) => set((state) => {
    const newMis = { ...state.managedIdentities };
    delete newMis[id];
    return { managedIdentities: newMis };
  }),

  refreshAdvisor: () => set((state) => {
    const recs: AdvisorRecommendation[] = [];
    
    // 1. Check for VMs without NSGs
    Object.values(state.vms).forEach(vm => {
      const vnet = Object.values(state.vnets).find(v => v.subnets.some(s => s.id === vm.subnetId));
      const subnet = vnet?.subnets.find(s => s.id === vm.subnetId);
      if (subnet && !subnet.nsgId) {
        recs.push({
          id: `rec-nsg-${vm.id}`,
          category: 'Security',
          impact: 'High',
          description: `Virtual machine '${vm.name}' is in a subnet without a Network Security Group.`,
          resourceId: vm.id
        });
      }
    });

    // 2. Check for App Services without plans (shouldn't happen with our UI, but good for sim)
    Object.values(state.appServices).forEach(app => {
      if (!state.appServicePlans[app.appServicePlanId]) {
        recs.push({
          id: `rec-asp-${app.id}`,
          category: 'Operational Excellence',
          impact: 'Medium',
          description: `App Service '${app.name}' is orphaned (missing plan).`,
          resourceId: app.id
        });
      }
    });

    // 3. Cost check: Basic Public IPs vs Standard
    Object.values(state.publicIps).forEach(pip => {
      if (pip.sku === 'Basic') {
        recs.push({
          id: `rec-pip-${pip.id}`,
          category: 'Performance',
          impact: 'Low',
          description: `Upgrade Public IP '${pip.name}' to Standard SKU for better availability.`,
          resourceId: pip.id
        });
      }
    });

    return { recommendations: recs };
  }),

  refreshCompliance: () => set((state) => {
    const compliance: PolicyCompliance[] = [];
    
    // Policy: Allowed locations (Simulate only East US)
    const allResources = [
      ...Object.values(state.vnets),
      ...Object.values(state.vms),
      ...Object.values(state.storageAccounts)
    ];

    allResources.forEach(res => {
      if (res.location !== 'eastus') {
        compliance.push({
          policyDefinitionName: 'Allowed locations',
          resourceId: res.id,
          complianceState: 'Non-compliant',
          reason: `Resource '${res.name}' is in '${res.location}', which is not allowed.`
        });
      } else {
        compliance.push({
          policyDefinitionName: 'Allowed locations',
          resourceId: res.id,
          complianceState: 'Compliant'
        });
      }
    });

    return { compliance };
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
    appGateways: newState.appGateways || {},
    publicIps: newState.publicIps || {},
    nics: newState.nics || {},
    bastions: newState.bastions || {},
    entraGroups: newState.entraGroups || {},
    appServicePlans: newState.appServicePlans || {},
    managedIdentities: newState.managedIdentities || {},
    recommendations: newState.recommendations || [],
    compliance: newState.compliance || []
  }))

    }),
    {
      name: 'network-sim-useazurestore-storage',
    }
  )
);
