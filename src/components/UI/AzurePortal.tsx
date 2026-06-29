import React, { useState, Component, ErrorInfo } from 'react';
import { useAzureStore } from '../../store/useAzureStore';
import { X, Plus, Server, Network, Folder, Shield, ArrowRight, LayoutDashboard, Search, Bell, Settings, UserCircle, Activity, TerminalSquare, Map, Scale, ArrowRightLeft, Database, Users, Globe, AppWindow, Key, Box, Layers, Archive, Monitor, Flame, Split, Plug, ShieldCheck, UsersRound, Fingerprint, BookOpen } from 'lucide-react';
import type { ResourceGroup, VNet, AzureRegion, VM } from '../../types/azure';
import AzureVMWizard from './AzureVMWizard';
import AzureVMDetails from './AzureVMDetails';
import AzureCloudShell from './AzureCloudShell';
import CliLabSelector from './CliLabSelector';

interface AzurePortalProps {
  onClose: () => void;
}

type Tab = 'home' | 'allResources' | 'costManagement' | 'resourceGroups' | 'vnets' | 'vms' | 'vngs' | 'nsgs' | 'routeTables' | 'loadBalancers' | 'peerings' | 'storageAccounts' | 'entraId' | 'dnsZones' | 'appServices' | 'keyVaults' | 'aksClusters' | 'vmss' | 'recoveryVaults' | 'sqlServers' | 'sqlDatabases' | 'logWorkspaces' | 'firewalls' | 'appGateways' | 'publicIps' | 'nics' | 'bastions' | 'entraGroups' | 'appServicePlans' | 'managedIdentities' | 'advisor' | 'policy' | 'networkWatcher';

class ErrorBoundary extends Component<{children: React.ReactNode}, {hasError: boolean, error: Error | null}> {
  constructor(props: any) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error: Error) { return { hasError: true, error }; }
  componentDidCatch(error: Error, errorInfo: ErrorInfo) { console.error("ErrorBoundary caught an error", error, errorInfo); }
  render() {
    if (this.state.hasError) {
      return <div style={{padding: 20, color: 'red'}}><h2>Something went wrong.</h2><pre>{this.state.error?.toString()}</pre><pre>{this.state.error?.stack}</pre></div>;
    }
    return this.props.children;
  }
}

function NetworkWatcherBlade({ vms }: { vms: any[] }) {
  const [sourceId, setSourceId] = useState('');
  const [destIp, setDestIp] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [result, setResult] = useState<{ status: string, details: string } | null>(null);

  const runTest = () => {
    setIsTesting(true);
    setResult(null);
    setTimeout(() => {
      const sourceVm = vms.find(v => v.id === sourceId);
      
      if (!sourceVm) {
        setResult({ status: 'Error', details: 'Source VM not found.' });
      } else if (!destIp) {
        setResult({ status: 'Error', details: 'Destination IP/VM required.' });
      } else {
        setResult({ status: 'Reachable', details: 'Connection successful. Path: VNet -> NSG (Allow) -> Target.' });
      }
      setIsTesting(false);
    }, 2000);
  };

  return (
    <div>
      <div className="azure-content-header" style={{ paddingLeft: 0 }}>Network Watcher | Connection troubleshoot</div>
      <div className="azure-form-container" style={{ marginTop: 20, maxWidth: 600 }}>
        <div className="form-group">
          <label>Source Virtual Machine</label>
          <select value={sourceId} onChange={(e) => setSourceId(e.target.value)} className="azure-input">
            <option value="">Select a VM</option>
            {vms.map(vm => <option key={vm.id} value={vm.id}>{vm.name}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label>Destination IP address or VM Name</label>
          <input type="text" value={destIp} onChange={(e) => setDestIp(e.target.value)} placeholder="e.g. 10.0.0.4 or myVM" className="azure-input" />
        </div>
        <button className="azure-btn-primary" onClick={runTest} disabled={isTesting}>
          {isTesting ? 'Checking connectivity...' : 'Check'}
        </button>
      </div>

      {result && (
        <div className={`azure-dash-card`} style={{ marginTop: 20, borderLeft: `4px solid ${result.status === 'Reachable' ? '#107c10' : '#d13438'}` }}>
          <h3 style={{ margin: 0, color: result.status === 'Reachable' ? '#107c10' : '#d13438' }}>{result.status}</h3>
          <p>{result.details}</p>
        </div>
      )}
    </div>
  );
}

export default function AzurePortal({ onClose }: AzurePortalProps) {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [showCreateRG, setShowCreateRG] = useState(false);
  const [showCreateVNet, setShowCreateVNet] = useState(false);
  const [showCreateVNG, setShowCreateVNG] = useState(false);
  const [showCreateNSG, setShowCreateNSG] = useState(false);
  const [showCreateRT, setShowCreateRT] = useState(false);
  const [showCreateLB, setShowCreateLB] = useState(false);
  const [showCreatePeering, setShowCreatePeering] = useState(false);
  const [showCreateStorage, setShowCreateStorage] = useState(false);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [showCreateRole, setShowCreateRole] = useState(false);
  const [showCreateDns, setShowCreateDns] = useState(false);
  const [showCreateApp, setShowCreateApp] = useState(false);
  const [showCreateKv, setShowCreateKv] = useState(false);
  const [showCreateAks, setShowCreateAks] = useState(false);
  const [showCreateVmss, setShowCreateVmss] = useState(false);
  const [showCreateRv, setShowCreateRv] = useState(false);
  const [showCreateSqlSrv, setShowCreateSqlSrv] = useState(false);
  const [showCreateSqlDb, setShowCreateSqlDb] = useState(false);
  const [showCreateLaw, setShowCreateLaw] = useState(false);
  const [showCreateFw, setShowCreateFw] = useState(false);
  const [showCreateAgw, setShowCreateAgw] = useState(false);
  const [showCreatePip, setShowCreatePip] = useState(false);
  const [showCreateNic, setShowCreateNic] = useState(false);
  const [showCreateBastion, setShowCreateBastion] = useState(false);
  const [showCreateEntraGroup, setShowCreateEntraGroup] = useState(false);
  const [showCreateAsp, setShowCreateAsp] = useState(false);
  const [showCreateMi, setShowCreateMi] = useState(false);
  const [showCreateVM, setShowCreateVM] = useState(false);
  const [selectedVM, setSelectedVM] = useState<VM | null>(null);
  const [isGlobalSidebarExpanded, setIsGlobalSidebarExpanded] = useState(false);
  const [showCloudShell, setShowCloudShell] = useState(false);
  const [showCliLab, setShowCliLab] = useState(false);

  const { resourceGroups, vnets, vms, vngs, nsgs, routeTables, loadBalancers, storageAccounts, entraUsers, entraGroups, roleAssignments, dnsZones, appServicePlans, appServices, keyVaults, aksClusters, vmss, recoveryVaults, sqlServers, sqlDatabases, logWorkspaces, firewalls, appGateways, publicIps, nics, bastions, managedIdentities, recommendations, compliance, createResourceGroup, createVNet, createVM, createVNG, createNSG, createRouteTable, createLoadBalancer, createStorageAccount, createEntraUser, createEntraGroup, createRoleAssignment, createDnsZone, createAppServicePlan, createAppService, createKeyVault, createAksCluster, createVMSS, createRecoveryVault, createSqlServer, createSqlDatabase, createLogWorkspace, createFirewall, createAppGateway, createPublicIp, createNic, createBastion, createManagedIdentity, refreshAdvisor, refreshCompliance } = useAzureStore();

  const allResources = [
    ...Object.values(resourceGroups).map(rg => ({ name: rg.name, type: 'Resource group', date: 'Just now' })),
    ...Object.values(vnets).map(vnet => ({ name: vnet.name, type: 'Virtual network', date: 'Just now' })),
    ...Object.values(vms).map(vm => ({ name: vm.name, type: 'Virtual machine', date: 'Just now' })),
    ...Object.values(vngs).map(vng => ({ name: vng.name, type: 'Virtual network gateway', date: 'Just now' })),
    ...Object.values(nsgs).map(nsg => ({ name: nsg.name, type: 'Network security group', date: 'Just now' })),
    ...Object.values(routeTables).map(rt => ({ name: rt.name, type: 'Route table', date: 'Just now' })),
    ...Object.values(loadBalancers).map(lb => ({ name: lb.name, type: 'Load balancer', date: 'Just now' })),
    ...Object.values(vnets).flatMap(v => v.peerings.map(p => ({ name: p.name, type: 'Virtual network peering', date: 'Just now' }))),
    ...Object.values(storageAccounts).map(sa => ({ name: sa.name, type: 'Storage account', date: 'Just now' })),
    ...Object.values(dnsZones).map(z => ({ name: z.name, type: z.zoneType === 'Private' ? 'Private DNS zone' : 'DNS zone', date: 'Just now' })),
    ...Object.values(appServices).map(app => ({ name: app.name, type: 'App Service', date: 'Just now' })),
    ...Object.values(keyVaults).map(kv => ({ name: kv.name, type: 'Key vault', date: 'Just now' })),
    ...Object.values(aksClusters).map(aks => ({ name: aks.name, type: 'Kubernetes service', date: 'Just now' })),
    ...Object.values(vmss).map(v => ({ name: v.name, type: 'Virtual machine scale set', date: 'Just now' })),
    ...Object.values(recoveryVaults).map(v => ({ name: v.name, type: 'Recovery Services vault', date: 'Just now' })),
    ...Object.values(sqlServers).map(s => ({ name: s.name, type: 'SQL server', date: 'Just now' })),
    ...Object.values(sqlDatabases).map(d => ({ name: d.name, type: 'SQL database', date: 'Just now' })),
    ...Object.values(logWorkspaces).map(l => ({ name: l.name, type: 'Log Analytics workspace', date: 'Just now' })),
    ...Object.values(firewalls).map(f => ({ name: f.name, type: 'Firewall', date: 'Just now' })),
    ...Object.values(appGateways).map(a => ({ name: a.name, type: 'Application gateway', date: 'Just now' })),
    ...Object.values(publicIps).map(p => ({ name: p.name, type: 'Public IP address', date: 'Just now' })),
    ...Object.values(nics).map(n => ({ name: n.name, type: 'Network interface', date: 'Just now' })),
    ...Object.values(bastions).map(b => ({ name: b.name, type: 'Bastion', date: 'Just now' })),
    ...Object.values(entraGroups).map(g => ({ name: g.displayName, type: 'Group', date: 'Just now' })),
    ...Object.values(appServicePlans).map(p => ({ name: p.name, type: 'App Service plan', date: 'Just now' })),
    ...Object.values(managedIdentities).map(m => ({ name: m.name, type: 'Managed Identity', date: 'Just now' }))
  ].sort((a, b) => a.name.localeCompare(b.name));

  const handleCreateRG = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const rg: ResourceGroup = {
      name: formData.get('name') as string,
      location: formData.get('location') as AzureRegion,
    };
    createResourceGroup(rg);
    setShowCreateRG(false);
  };

  const handleCreateVNet = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const id = `vnet-${Date.now()}`;
    const vnet: VNet = {
      id,
      name: formData.get('name') as string,
      type: 'Microsoft.Network/virtualNetworks',
      location: formData.get('location') as AzureRegion,
      resourceGroup: formData.get('resourceGroup') as string,
      addressSpace: [formData.get('addressSpace') as string],
      subnets: [{
        id: `${id}-subnet-default`,
        name: 'default',
        addressPrefix: formData.get('subnetPrefix') as string,
        nsgId: formData.get('nsgId') as string || undefined,
        routeTableId: formData.get('routeTableId') as string || undefined
      }],
      peerings: []
    };
    createVNet(vnet);
    setShowCreateVNet(false);
  };

  const handleCreateVM = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const id = `vm-${Date.now()}`;
    
    // Auto-assign an IP for simulation purposes (e.g. 10.0.0.4)
    const subnetId = formData.get('subnetId') as string;
    let privateIp = '10.0.0.4';
    
    // Find the VNet and Subnet to pick a somewhat realistic IP
    for (const vnet of Object.values(vnets)) {
      const sub = vnet.subnets.find(s => s.id === subnetId);
      if (sub) {
        // Just replace the last octet of the prefix with .4
        const parts = sub.addressPrefix.split('/')[0].split('.');
        privateIp = `${parts[0]}.${parts[1]}.${parts[2]}.4`;
      }
    }

    const vm: any = {
      id,
      name: formData.get('name') as string,
      type: 'Microsoft.Compute/virtualMachines',
      location: formData.get('location') as AzureRegion,
      resourceGroup: formData.get('resourceGroup') as string,
      size: formData.get('size') as string,
      os: formData.get('os') as 'Windows' | 'Linux',
      subnetId,
      privateIpAddress: privateIp,
      status: 'Running'
    };
    createVM(vm);
    setShowCreateVM(false);
  };

  const handleCreateVNG = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const id = `vng-${Date.now()}`;
    createVNG({
      id,
      name: formData.get('name') as string,
      type: 'Microsoft.Network/virtualNetworkGateways',
      location: formData.get('location') as AzureRegion,
      resourceGroup: formData.get('resourceGroup') as string,
      vnetId: formData.get('vnetId') as string,
      gatewayType: 'Vpn',
      vpnType: 'RouteBased',
      sku: 'VpnGw1',
      bgpEnabled: false,
      status: 'Succeeded'
    });
    setShowCreateVNG(false);
  };

  const handleCreateNSG = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const id = `nsg-${Date.now()}`;
    createNSG({
      id,
      name: formData.get('name') as string,
      type: 'Microsoft.Network/networkSecurityGroups',
      location: formData.get('location') as AzureRegion,
      resourceGroup: formData.get('resourceGroup') as string,
      rules: [
        {
          name: 'default-allow-rdp',
          priority: 1000,
          direction: 'Inbound',
          access: 'Allow',
          protocol: 'Tcp',
          sourcePortRange: '*',
          destinationPortRange: '3389',
          sourceAddressPrefix: '*',
          destinationAddressPrefix: '*'
        },
        {
          name: 'default-allow-ssh',
          priority: 1010,
          direction: 'Inbound',
          access: 'Allow',
          protocol: 'Tcp',
          sourcePortRange: '*',
          destinationPortRange: '22',
          sourceAddressPrefix: '*',
          destinationAddressPrefix: '*'
        }
      ]
    });
    setShowCreateNSG(false);
  };

  const handleCreateRT = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createRouteTable({
      id: `rt-${Date.now()}`,
      name: formData.get('name') as string,
      type: 'Microsoft.Network/routeTables',
      location: formData.get('location') as AzureRegion,
      resourceGroup: formData.get('resourceGroup') as string,
      routes: []
    });
    setShowCreateRT(false);
  };

  const handleCreateLB = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createLoadBalancer({
      id: `lb-${Date.now()}`,
      name: formData.get('name') as string,
      type: 'Microsoft.Network/loadBalancers',
      location: formData.get('location') as AzureRegion,
      resourceGroup: formData.get('resourceGroup') as string,
      sku: 'Basic',
      backendPool: [],
      rules: []
    });
    setShowCreateLB(false);
  };

  const handleCreatePeering = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const localVnetId = formData.get('localVnetId') as string;
    const remoteVnetId = formData.get('remoteVnetId') as string;
    
    useAzureStore.getState().updateVNet(localVnetId, (vnet) => ({
      ...vnet,
      peerings: [...vnet.peerings, {
        id: `peering-${Date.now()}-local`,
        name: formData.get('name') as string,
        remoteVirtualNetworkId: remoteVnetId,
        allowVirtualNetworkAccess: formData.get('allowVnetAccess') === 'on',
        allowForwardedTraffic: formData.get('allowForwardedTraffic') === 'on',
        allowGatewayTransit: formData.get('allowGatewayTransit') === 'on',
        useRemoteGateways: formData.get('useRemoteGateways') === 'on',
        peeringState: 'Connected'
      }]
    }));

    // In Azure, creating peering typically needs to be done on both sides, but let's auto-link for simulator ease.
    useAzureStore.getState().updateVNet(remoteVnetId, (vnet) => ({
      ...vnet,
      peerings: [...vnet.peerings, {
        id: `peering-${Date.now()}-remote`,
        name: `${formData.get('name')}-remote`,
        remoteVirtualNetworkId: localVnetId,
        allowVirtualNetworkAccess: formData.get('allowVnetAccess') === 'on',
        allowForwardedTraffic: formData.get('allowForwardedTraffic') === 'on',
        allowGatewayTransit: false,
        useRemoteGateways: false,
        peeringState: 'Connected'
      }]
    }));
    
    setShowCreatePeering(false);
  };

  const handleCreateStorage = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createStorageAccount({
      id: `sa-${Date.now()}`,
      name: formData.get('name') as string,
      type: 'Microsoft.Storage/storageAccounts',
      location: formData.get('location') as AzureRegion,
      resourceGroup: formData.get('resourceGroup') as string,
      performance: formData.get('performance') as 'Standard' | 'Premium',
      redundancy: formData.get('redundancy') as 'LRS' | 'GRS' | 'ZRS' | 'RA-GRS',
      accessTier: formData.get('accessTier') as 'Hot' | 'Cool'
    });
    setShowCreateStorage(false);
  };

  const handleCreateUser = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createEntraUser({
      id: `user-${Date.now()}`,
      displayName: formData.get('displayName') as string,
      userPrincipalName: formData.get('userPrincipalName') as string,
      department: formData.get('department') as string,
      jobTitle: formData.get('jobTitle') as string
    });
    setShowCreateUser(false);
  };

  const handleCreateRole = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createRoleAssignment({
      id: `role-${Date.now()}`,
      principalId: formData.get('principalId') as string,
      roleDefinition: formData.get('roleDefinition') as 'Owner' | 'Contributor' | 'Reader',
      scope: formData.get('scope') as string
    });
    setShowCreateRole(false);
  };

  const handleCreateDns = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const zoneType = formData.get('zoneType') as 'Public' | 'Private';
    const linkedVnet = formData.get('linkedVnet') as string;
    
    // Auto-create an A record for realism if the user provided one
    const aRecordName = formData.get('aRecordName') as string;
    const aRecordValue = formData.get('aRecordValue') as string;
    const records = [];
    if (aRecordName && aRecordValue) {
      records.push({ id: `rec-${Date.now()}`, name: aRecordName, recordType: 'A' as const, value: aRecordValue, ttl: 3600 });
    }

    createDnsZone({
      id: `dns-${Date.now()}`,
      name: formData.get('name') as string,
      type: zoneType === 'Private' ? 'Microsoft.Network/privateDnsZones' : 'Microsoft.Network/dnsZones',
      location: 'eastus', // DNS Zones are global, but we use eastus for the sim
      resourceGroup: formData.get('resourceGroup') as string,
      zoneType: zoneType,
      records: records,
      linkedVnetIds: zoneType === 'Private' && linkedVnet ? [linkedVnet] : []
    });
    setShowCreateDns(false);
  };

  const handleCreateApp = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createAppService({
      id: `app-${Date.now()}`,
      name: formData.get('name') as string,
      type: 'Microsoft.Web/sites',
      location: formData.get('location') as AzureRegion,
      resourceGroup: formData.get('resourceGroup') as string,
      appServicePlan: formData.get('appServicePlan') as string || 'ASP-Default',
      runtimeStack: formData.get('runtimeStack') as string,
      status: 'Running'
    });
    setShowCreateApp(false);
  };

  const handleCreateKv = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createKeyVault({
      id: `kv-${Date.now()}`,
      name: formData.get('name') as string,
      type: 'Microsoft.KeyVault/vaults',
      location: formData.get('location') as AzureRegion,
      resourceGroup: formData.get('resourceGroup') as string,
      sku: formData.get('sku') as 'Standard' | 'Premium',
      softDeleteEnabled: true,
      purgeProtectionEnabled: formData.get('purgeProtectionEnabled') === 'true'
    });
    setShowCreateKv(false);
  };

  const handleCreateAks = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createAksCluster({
      id: `aks-${Date.now()}`,
      name: formData.get('name') as string,
      type: 'Microsoft.ContainerService/managedClusters',
      location: formData.get('location') as AzureRegion,
      resourceGroup: formData.get('resourceGroup') as string,
      kubernetesVersion: formData.get('kubernetesVersion') as string,
      nodeCount: parseInt(formData.get('nodeCount') as string) || 1,
      nodeSize: formData.get('nodeSize') as string
    });
    setShowCreateAks(false);
  };

  const handleCreateVmss = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createVMSS({
      id: `vmss-${Date.now()}`,
      name: formData.get('name') as string,
      type: 'Microsoft.Compute/virtualMachineScaleSets',
      location: formData.get('location') as AzureRegion,
      resourceGroup: formData.get('resourceGroup') as string,
      subnetId: formData.get('subnetId') as string,
      os: formData.get('os') as 'Windows'|'Linux',
      sku: formData.get('sku') as string,
      capacity: parseInt(formData.get('capacity') as string) || 0
    });
    setShowCreateVmss(false);
  };

  const handleCreateRv = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createRecoveryVault({
      id: `rsv-${Date.now()}`,
      name: formData.get('name') as string,
      type: 'Microsoft.RecoveryServices/vaults',
      location: formData.get('location') as AzureRegion,
      resourceGroup: formData.get('resourceGroup') as string,
      sku: 'Standard',
      storageRedundancy: formData.get('storageRedundancy') as 'LocallyRedundant'|'GeoRedundant'
    });
    setShowCreateRv(false);
  };

  const handleCreateSqlSrv = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createSqlServer({
      id: `sql-${Date.now()}`,
      name: formData.get('name') as string,
      type: 'Microsoft.Sql/servers',
      location: formData.get('location') as AzureRegion,
      resourceGroup: formData.get('resourceGroup') as string,
      adminLogin: formData.get('adminLogin') as string
    });
    setShowCreateSqlSrv(false);
  };

  const handleCreateSqlDb = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createSqlDatabase({
      id: `sqldb-${Date.now()}`,
      name: formData.get('name') as string,
      type: 'Microsoft.Sql/servers/databases',
      location: formData.get('location') as AzureRegion,
      resourceGroup: formData.get('resourceGroup') as string,
      serverId: formData.get('serverId') as string,
      sku: formData.get('sku') as string,
      maxSizeBytes: parseInt(formData.get('maxSizeGB') as string) * 1024 * 1024 * 1024
    });
    setShowCreateSqlDb(false);
  };

  const handleCreateLaw = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createLogWorkspace({
      id: `law-${Date.now()}`,
      name: formData.get('name') as string,
      type: 'Microsoft.OperationalInsights/workspaces',
      location: formData.get('location') as AzureRegion,
      resourceGroup: formData.get('resourceGroup') as string,
      sku: formData.get('sku') as 'PerGB2018' | 'Free' | 'Standard',
      retentionInDays: parseInt(formData.get('retentionInDays') as string)
    });
    setShowCreateLaw(false);
  };

  const handleCreateFw = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createFirewall({
      id: `fw-${Date.now()}`,
      name: formData.get('name') as string,
      type: 'Microsoft.Network/azureFirewalls',
      location: formData.get('location') as AzureRegion,
      resourceGroup: formData.get('resourceGroup') as string,
      sku: formData.get('sku') as 'Standard' | 'Premium' | 'Basic',
      threatIntelMode: formData.get('threatIntelMode') as 'Alert' | 'Deny' | 'Off',
      vnetId: formData.get('vnetId') as string
    });
    setShowCreateFw(false);
  };

  const handleCreateAgw = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createAppGateway({
      id: `agw-${Date.now()}`,
      name: formData.get('name') as string,
      type: 'Microsoft.Network/applicationGateways',
      location: formData.get('location') as AzureRegion,
      resourceGroup: formData.get('resourceGroup') as string,
      sku: formData.get('sku') as 'Standard_v2' | 'WAF_v2',
      tier: formData.get('sku') as 'Standard_v2' | 'WAF_v2', // tier usually matches sku for v2
      capacity: parseInt(formData.get('capacity') as string),
      vnetId: formData.get('vnetId') as string
    });
    setShowCreateAgw(false);
  };

  const handleCreatePip = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createPublicIp({
      id: `pip-${Date.now()}`,
      name: formData.get('name') as string,
      type: 'Microsoft.Network/publicIPAddresses',
      location: formData.get('location') as AzureRegion,
      resourceGroup: formData.get('resourceGroup') as string,
      sku: formData.get('sku') as 'Basic' | 'Standard',
      allocationMethod: formData.get('allocationMethod') as 'Static' | 'Dynamic',
      ipAddress: formData.get('allocationMethod') === 'Static' ? `20.114.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}` : undefined
    });
    setShowCreatePip(false);
  };

  const handleCreateNic = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createNic({
      id: `nic-${Date.now()}`,
      name: formData.get('name') as string,
      type: 'Microsoft.Network/networkInterfaces',
      location: formData.get('location') as AzureRegion,
      resourceGroup: formData.get('resourceGroup') as string,
      subnetId: formData.get('subnetId') as string,
      privateIpAddress: `10.0.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`, // Simulated IP
      publicIpAddressId: formData.get('publicIpAddressId') as string,
      nsgId: formData.get('nsgId') as string
    });
    setShowCreateNic(false);
  };

  const handleCreateBastion = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createBastion({
      id: `bastion-${Date.now()}`,
      name: formData.get('name') as string,
      type: 'Microsoft.Network/bastionHosts',
      location: formData.get('location') as AzureRegion,
      resourceGroup: formData.get('resourceGroup') as string,
      vnetId: formData.get('vnetId') as string,
      publicIpAddressId: formData.get('publicIpAddressId') as string,
      sku: formData.get('sku') as 'Basic' | 'Standard'
    });
    setShowCreateBastion(false);
  };

  const handleCreateEntraGroup = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createEntraGroup({
      id: `group-${Date.now()}`,
      displayName: formData.get('displayName') as string,
      groupType: formData.get('groupType') as 'Security' | 'Microsoft 365',
      members: []
    });
    setShowCreateEntraGroup(false);
  };

  const handleCreateAsp = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createAppServicePlan({
      id: `asp-${Date.now()}`,
      name: formData.get('name') as string,
      type: 'Microsoft.Web/serverfarms',
      location: formData.get('location') as AzureRegion,
      resourceGroup: formData.get('resourceGroup') as string,
      sku: formData.get('sku') as any,
      os: formData.get('os') as 'Linux' | 'Windows'
    });
    setShowCreateAsp(false);
  };

  const handleCreateMi = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createManagedIdentity({
      id: `mi-${Date.now()}`,
      name: formData.get('name') as string,
      type: 'Microsoft.ManagedIdentity/userAssignedIdentities',
      location: formData.get('location') as AzureRegion,
      resourceGroup: formData.get('resourceGroup') as string,
      clientId: `client-${Math.random().toString(36).substring(7)}`
    });
    setShowCreateMi(false);
  };

  return (
    <div className="azure-portal-overlay">
      <div className="azure-portal-window">
        {/* Portal Header */}
        <div className="azure-header-dark">
          <div className="brand" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button className="azure-hamburger" onClick={() => setIsGlobalSidebarExpanded(!isGlobalSidebarExpanded)}>
              <div className="bar"></div>
              <div className="bar"></div>
              <div className="bar"></div>
            </button>
            <span style={{ color: '#fff', fontWeight: '600', fontSize: '16px' }}>Microsoft Azure</span>
            <div className="azure-search-bar-dark">
              <Search size={14} color="#fff" />
              <input type="text" placeholder="Search resources, services, and docs (G+/)" />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <BookOpen size={18} color="#fff" style={{ cursor: 'pointer' }} onClick={() => setShowCliLab(true)} title="CLI Learning Labs" />
            <TerminalSquare size={18} color="#fff" style={{ cursor: 'pointer' }} onClick={() => setShowCloudShell(!showCloudShell)} title="Cloud Shell" />
            <Settings size={18} color="#fff" style={{ cursor: 'pointer' }} />
            <Bell size={18} color="#fff" style={{ cursor: 'pointer' }} />
            <UserCircle size={24} color="#fff" style={{ cursor: 'pointer' }} />
            <button style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center' }} onClick={onClose} aria-label="Close Portal">
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="azure-body">
          {/* Global Sidebar */}
          <div className={`azure-global-sidebar ${isGlobalSidebarExpanded ? 'expanded' : ''}`}>
            <button className={`nav-item ${activeTab === 'home' ? 'active' : ''}`} onClick={() => { setActiveTab('home'); setIsGlobalSidebarExpanded(false); }} title="Home">
              <LayoutDashboard size={18} color={activeTab === 'home' ? '#0078D4' : '#605e5c'} />
              {isGlobalSidebarExpanded && <span>Home</span>}
            </button>
            <button className="nav-item" title="Dashboard">
              <LayoutDashboard size={18} color="#605e5c" />
              {isGlobalSidebarExpanded && <span>Dashboard</span>}
            </button>
            <button className={`nav-item ${activeTab === 'allResources' ? 'active' : ''}`} onClick={() => { setActiveTab('allResources'); setIsGlobalSidebarExpanded(false); }} title="All resources">
              <Folder size={18} color={activeTab === 'allResources' ? '#0078D4' : '#605e5c'} />
              {isGlobalSidebarExpanded && <span>All resources</span>}
            </button>
            <button className={`nav-item ${activeTab === 'resourceGroups' ? 'active' : ''}`} onClick={() => { setActiveTab('resourceGroups'); setIsGlobalSidebarExpanded(false); }} title="Resource groups">
              <Folder size={18} color={activeTab === 'resourceGroups' ? '#0078D4' : '#605e5c'} />
              {isGlobalSidebarExpanded && <span>Resource groups</span>}
            </button>
            <button className={`nav-item ${activeTab === 'vms' ? 'active' : ''}`} onClick={() => { setActiveTab('vms'); setIsGlobalSidebarExpanded(false); }} title="Virtual machines">
              <Server size={18} color={activeTab === 'vms' ? '#0078D4' : '#605e5c'} />
              {isGlobalSidebarExpanded && <span>Virtual machines</span>}
            </button>
            <button className={`nav-item ${activeTab === 'vnets' ? 'active' : ''}`} onClick={() => { setActiveTab('vnets'); setIsGlobalSidebarExpanded(false); }} title="Virtual networks">
              <Network size={18} color={activeTab === 'vnets' ? '#0078D4' : '#605e5c'} />
              {isGlobalSidebarExpanded && <span>Virtual networks</span>}
            </button>
            <button className={`nav-item ${activeTab === 'vngs' ? 'active' : ''}`} onClick={() => { setActiveTab('vngs'); setIsGlobalSidebarExpanded(false); }} title="Virtual network gateways">
              <Network size={18} color={activeTab === 'vngs' ? '#0078D4' : '#605e5c'} />
              {isGlobalSidebarExpanded && <span>Virtual network gateways</span>}
            </button>
            <button className={`nav-item ${activeTab === 'nsgs' ? 'active' : ''}`} onClick={() => { setActiveTab('nsgs'); setIsGlobalSidebarExpanded(false); }} title="Network security groups">
              <Shield size={18} color={activeTab === 'nsgs' ? '#0078D4' : '#605e5c'} />
              {isGlobalSidebarExpanded && <span>Network security groups</span>}
            </button>
            <button className={`nav-item ${activeTab === 'routeTables' ? 'active' : ''}`} onClick={() => { setActiveTab('routeTables'); setIsGlobalSidebarExpanded(false); }} title="Route tables">
              <Map size={18} color={activeTab === 'routeTables' ? '#0078D4' : '#605e5c'} />
              {isGlobalSidebarExpanded && <span>Route tables</span>}
            </button>
            <button className={`nav-item ${activeTab === 'storageAccounts' ? 'active' : ''}`} onClick={() => { setActiveTab('storageAccounts'); setIsGlobalSidebarExpanded(false); }} title="Storage accounts">
              <Database size={18} color={activeTab === 'storageAccounts' ? '#0078D4' : '#605e5c'} />
              {isGlobalSidebarExpanded && <span>Storage accounts</span>}
            </button>
            <button className={`nav-item ${activeTab === 'dnsZones' ? 'active' : ''}`} onClick={() => { setActiveTab('dnsZones'); setIsGlobalSidebarExpanded(false); }} title="DNS zones">
              <Globe size={18} color={activeTab === 'dnsZones' ? '#0078D4' : '#605e5c'} />
              {isGlobalSidebarExpanded && <span>DNS zones</span>}
            </button>
            <button className={`nav-item ${activeTab === 'appServices' ? 'active' : ''}`} onClick={() => { setActiveTab('appServices'); setIsGlobalSidebarExpanded(false); }} title="App Services">
              <AppWindow size={18} color={activeTab === 'appServices' ? '#0078D4' : '#605e5c'} />
              {isGlobalSidebarExpanded && <span>App Services</span>}
            </button>
            <button className={`nav-item ${activeTab === 'loadBalancers' ? 'active' : ''}`} onClick={() => { setActiveTab('loadBalancers'); setIsGlobalSidebarExpanded(false); }} title="Load balancers">
              <Scale size={18} color={activeTab === 'loadBalancers' ? '#0078D4' : '#605e5c'} />
              {isGlobalSidebarExpanded && <span>Load balancers</span>}
            </button>
            <button className={`nav-item ${activeTab === 'peerings' ? 'active' : ''}`} onClick={() => { setActiveTab('peerings'); setIsGlobalSidebarExpanded(false); }} title="Virtual network peerings">
              <ArrowRightLeft size={18} color={activeTab === 'peerings' ? '#0078D4' : '#605e5c'} />
              {isGlobalSidebarExpanded && <span>Virtual network peerings</span>}
            </button>
            <button className={`nav-item ${activeTab === 'costManagement' ? 'active' : ''}`} onClick={() => { setActiveTab('costManagement'); setIsGlobalSidebarExpanded(false); }} title="Cost Management + Billing">
              <Activity size={18} color={activeTab === 'costManagement' ? '#0078D4' : '#605e5c'} />
              {isGlobalSidebarExpanded && <span>Cost Management + Billing</span>}
            </button>
            <button className={`nav-item ${activeTab === 'entraId' ? 'active' : ''}`} onClick={() => { setActiveTab('entraId'); setIsGlobalSidebarExpanded(false); }} title="Microsoft Entra ID">
              <Users size={18} color={activeTab === 'entraId' ? '#0078D4' : '#605e5c'} />
              {isGlobalSidebarExpanded && <span>Microsoft Entra ID</span>}
            </button>
            <button className={`nav-item ${activeTab === 'aksClusters' ? 'active' : ''}`} onClick={() => { setActiveTab('aksClusters'); setIsGlobalSidebarExpanded(false); }} title="Kubernetes services">
              <Box size={18} color={activeTab === 'aksClusters' ? '#0078D4' : '#605e5c'} />
              {isGlobalSidebarExpanded && <span>Kubernetes services</span>}
            </button>
            <button className={`nav-item ${activeTab === 'vmss' ? 'active' : ''}`} onClick={() => { setActiveTab('vmss'); setIsGlobalSidebarExpanded(false); }} title="Virtual machine scale sets">
              <Layers size={18} color={activeTab === 'vmss' ? '#0078D4' : '#605e5c'} />
              {isGlobalSidebarExpanded && <span>Virtual machine scale sets</span>}
            </button>
            <button className={`nav-item ${activeTab === 'recoveryVaults' ? 'active' : ''}`} onClick={() => { setActiveTab('recoveryVaults'); setIsGlobalSidebarExpanded(false); }} title="Recovery Services vaults">
              <Archive size={18} color={activeTab === 'recoveryVaults' ? '#0078D4' : '#605e5c'} />
              {isGlobalSidebarExpanded && <span>Recovery Services vaults</span>}
            </button>
            <button className={`nav-item ${activeTab === 'managedIdentities' ? 'active' : ''}`} onClick={() => { setActiveTab('managedIdentities'); setIsGlobalSidebarExpanded(false); }} title="Managed Identities">
              <Fingerprint size={18} color={activeTab === 'managedIdentities' ? '#0078D4' : '#605e5c'} />
              {isGlobalSidebarExpanded && <span>Managed Identities</span>}
            </button>
          </div>

          {/* Service Sidebar (Blade) */}
          {activeTab !== 'home' && (
            <div className="azure-service-sidebar">
              {activeTab === 'allResources' && (
                <>
                  <div className="sidebar-header">Resource Manager</div>
                  <div className="search-box">
                    <Search size={14} color="#605e5c" />
                    <input type="text" placeholder="Search" />
                  </div>
                  <div className="nav-group">
                    <button className="nav-item active"><div className="azure-nav-icon"><Folder size={16} /></div> All resources</button>
                    <button className="nav-item"><div className="azure-nav-icon"><Folder size={16} /></div> Favorite resources</button>
                    <button className="nav-item"><div className="azure-nav-icon"><Activity size={16} /></div> Recent resources</button>
                    <button className="nav-item" onClick={() => setActiveTab('resourceGroups')}><div className="azure-nav-icon"><Folder size={16} /></div> Resource groups</button>
                  </div>
                </>
              )}
              {activeTab === 'costManagement' && (
                <>
                  <div className="sidebar-header">Cost Management + Billing</div>
                  <div className="search-box">
                    <Search size={14} color="#605e5c" />
                    <input type="text" placeholder="Search" />
                  </div>
                  <div className="nav-group">
                    <button className="nav-item active"><div className="azure-nav-icon"><Activity size={16} /></div> Overview</button>
                    <button className="nav-item"><div className="azure-nav-icon"><Shield size={16} /></div> Access control (IAM)</button>
                    <div className="nav-group-title">Cost management</div>
                    <button className="nav-item"><div className="azure-nav-icon"><Activity size={16} /></div> Cost analysis</button>
                    <button className="nav-item"><div className="azure-nav-icon"><Bell size={16} /></div> Cost alerts</button>
                    <button className="nav-item"><div className="azure-nav-icon"><Settings size={16} /></div> Budgets</button>
                    <div className="nav-group-title">Billing</div>
                    <button className="nav-item"><div className="azure-nav-icon"><Folder size={16} /></div> Invoices</button>
                    <button className="nav-item"><div className="azure-nav-icon"><Settings size={16} /></div> Payment methods</button>
                  </div>
                </>
              )}
              {['resourceGroups', 'vnets', 'vms', 'vngs', 'nsgs', 'routeTables', 'loadBalancers', 'peerings', 'storageAccounts', 'dnsZones', 'appServices', 'keyVaults', 'aksClusters', 'vmss', 'recoveryVaults', 'sqlServers', 'sqlDatabases', 'logWorkspaces', 'firewalls', 'appGateways', 'publicIps', 'nics', 'bastions', 'appServicePlans', 'managedIdentities', 'advisor', 'policy', 'networkWatcher'].includes(activeTab) && (
                <>
                  <div className="sidebar-header">Resource Manager</div>
                  <div className="nav-group">
                    <button className="nav-item" onClick={() => setActiveTab('allResources')}><div className="azure-nav-icon"><Folder size={16} /></div> All resources</button>
                    <div className="nav-group-title">Help + Support</div>
                    <button className={`nav-item ${activeTab === 'advisor' ? 'active' : ''}`} onClick={() => { refreshAdvisor(); setActiveTab('advisor'); }}><div className="azure-nav-icon"><Activity size={16} /></div> Advisor</button>
                    <button className={`nav-item ${activeTab === 'policy' ? 'active' : ''}`} onClick={() => { refreshCompliance(); setActiveTab('policy'); }}><div className="azure-nav-icon"><Shield size={16} /></div> Policy</button>
                    <button className={`nav-item ${activeTab === 'networkWatcher' ? 'active' : ''}`} onClick={() => setActiveTab('networkWatcher')}><div className="azure-nav-icon"><Monitor size={16} /></div> Network Watcher</button>
                    <div className="nav-group-title">Resources</div>
                    <button className={`nav-item ${activeTab === 'resourceGroups' ? 'active' : ''}`} onClick={() => setActiveTab('resourceGroups')}><div className="azure-nav-icon"><Folder size={16} /></div> Resource groups</button>
                    <button className={`nav-item ${activeTab === 'vms' ? 'active' : ''}`} onClick={() => setActiveTab('vms')}><div className="azure-nav-icon"><Server size={16} /></div> Virtual machines</button>
                    <button className={`nav-item ${activeTab === 'vnets' ? 'active' : ''}`} onClick={() => setActiveTab('vnets')}><div className="azure-nav-icon"><Network size={16} /></div> Virtual networks</button>
                    <button className={`nav-item ${activeTab === 'vngs' ? 'active' : ''}`} onClick={() => setActiveTab('vngs')}><div className="azure-nav-icon"><Network size={16} /></div> Virtual network gateways</button>
                    <button className={`nav-item ${activeTab === 'nsgs' ? 'active' : ''}`} onClick={() => setActiveTab('nsgs')}><div className="azure-nav-icon"><Shield size={16} /></div> Network security groups</button>
                    <button className={`nav-item ${activeTab === 'storageAccounts' ? 'active' : ''}`} onClick={() => setActiveTab('storageAccounts')}><div className="azure-nav-icon"><Database size={16} /></div> Storage accounts</button>
                    <button className={`nav-item ${activeTab === 'appServices' ? 'active' : ''}`} onClick={() => setActiveTab('appServices')}><div className="azure-nav-icon"><AppWindow size={16} /></div> App Services</button>
                    <button className={`nav-item ${activeTab === 'dnsZones' ? 'active' : ''}`} onClick={() => setActiveTab('dnsZones')}><div className="azure-nav-icon"><Globe size={16} /></div> DNS zones</button>
                    <button className={`nav-item ${activeTab === 'keyVaults' ? 'active' : ''}`} onClick={() => setActiveTab('keyVaults')}><div className="azure-nav-icon"><Key size={16} /></div> Key vaults</button>
                    <button className={`nav-item ${activeTab === 'aksClusters' ? 'active' : ''}`} onClick={() => setActiveTab('aksClusters')}><div className="azure-nav-icon"><Box size={16} /></div> Kubernetes services</button>
                    <button className={`nav-item ${activeTab === 'vmss' ? 'active' : ''}`} onClick={() => setActiveTab('vmss')}><div className="azure-nav-icon"><Layers size={16} /></div> Virtual machine scale sets</button>
                    <button className={`nav-item ${activeTab === 'recoveryVaults' ? 'active' : ''}`} onClick={() => setActiveTab('recoveryVaults')}><div className="azure-nav-icon"><Archive size={16} /></div> Recovery Services vaults</button>
                    <button className={`nav-item ${activeTab === 'sqlServers' ? 'active' : ''}`} onClick={() => setActiveTab('sqlServers')}><div className="azure-nav-icon"><Server size={16} /></div> SQL servers</button>
                    <button className={`nav-item ${activeTab === 'sqlDatabases' ? 'active' : ''}`} onClick={() => setActiveTab('sqlDatabases')}><div className="azure-nav-icon"><Database size={16} /></div> SQL databases</button>
                    <button className={`nav-item ${activeTab === 'logWorkspaces' ? 'active' : ''}`} onClick={() => setActiveTab('logWorkspaces')}><div className="azure-nav-icon"><Monitor size={16} /></div> Log Analytics workspaces</button>
                    <button className={`nav-item ${activeTab === 'routeTables' ? 'active' : ''}`} onClick={() => setActiveTab('routeTables')}><div className="azure-nav-icon"><Map size={16} /></div> Route tables</button>
                    <button className={`nav-item ${activeTab === 'firewalls' ? 'active' : ''}`} onClick={() => setActiveTab('firewalls')}><div className="azure-nav-icon"><Flame size={16} /></div> Firewalls</button>
                    <button className={`nav-item ${activeTab === 'appGateways' ? 'active' : ''}`} onClick={() => setActiveTab('appGateways')}><div className="azure-nav-icon"><Split size={16} /></div> Application gateways</button>
                    <button className={`nav-item ${activeTab === 'loadBalancers' ? 'active' : ''}`} onClick={() => setActiveTab('loadBalancers')}><div className="azure-nav-icon"><Scale size={16} /></div> Load balancers</button>
                    <button className={`nav-item ${activeTab === 'peerings' ? 'active' : ''}`} onClick={() => setActiveTab('peerings')}><div className="azure-nav-icon"><ArrowRightLeft size={16} /></div> Peerings</button>
                    <button className={`nav-item ${activeTab === 'publicIps' ? 'active' : ''}`} onClick={() => setActiveTab('publicIps')}><div className="azure-nav-icon"><Globe size={16} /></div> Public IP addresses</button>
                    <button className={`nav-item ${activeTab === 'nics' ? 'active' : ''}`} onClick={() => setActiveTab('nics')}><div className="azure-nav-icon"><Plug size={16} /></div> Network interfaces</button>
                    <button className={`nav-item ${activeTab === 'bastions' ? 'active' : ''}`} onClick={() => setActiveTab('bastions')}><div className="azure-nav-icon"><ShieldCheck size={16} /></div> Bastions</button>
                    <button className={`nav-item ${activeTab === 'appServicePlans' ? 'active' : ''}`} onClick={() => setActiveTab('appServicePlans')}><div className="azure-nav-icon"><Layers size={16} /></div> App Service plans</button>
                    <button className={`nav-item ${activeTab === 'managedIdentities' ? 'active' : ''}`} onClick={() => setActiveTab('managedIdentities')}><div className="azure-nav-icon"><Fingerprint size={16} /></div> Managed Identities</button>
                  </div>
                </>
              )}
              {activeTab === 'entraId' && (
                <>
                  <div className="sidebar-header">Microsoft Entra ID</div>
                  <div className="nav-group">
                    <button className="nav-item active"><div className="azure-nav-icon"><Users size={16} /></div> Overview</button>
                    <button className="nav-item" onClick={() => setActiveTab('entraId')}><div className="azure-nav-icon"><Users size={16} /></div> Users</button>
                    <button className="nav-item" onClick={() => setActiveTab('entraGroups')}><div className="azure-nav-icon"><UsersRound size={16} /></div> Groups</button>
                  </div>
                </>
              )}
              {activeTab === 'entraGroups' && (
                <>
                  <div className="sidebar-header">Microsoft Entra ID | Groups</div>
                  <div className="nav-group">
                    <button className="nav-item" onClick={() => setActiveTab('entraId')}><div className="azure-nav-icon"><Users size={16} /></div> All users</button>
                    <button className="nav-item active"><div className="azure-nav-icon"><UsersRound size={16} /></div> All groups</button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Main Content Area */}
          <ErrorBoundary>
          <div className="azure-content-area">
            {activeTab === 'home' && (
              <div className="azure-content-scroll">
                <div className="azure-home-page">
                  <div className="home-section-header">
                    <h2>Azure services</h2>
                  </div>
                  <div className="azure-services-row">
                    <div className="service-icon-box">
                      <div className="icon-circle"><Plus size={24} color="#0078D4" /></div>
                      <span>Create a resource</span>
                    </div>
                    <div className="service-icon-box" onClick={() => setActiveTab('costManagement')}>
                      <div className="icon-circle"><Activity size={24} color="#107c10" /></div>
                      <span>Cost Management + Billing</span>
                    </div>
                    <div className="service-icon-box" onClick={() => setActiveTab('resourceGroups')}>
                      <div className="icon-circle"><Folder size={24} color="#0078D4" /></div>
                      <span>Resource groups</span>
                    </div>
                    <div className="service-icon-box" onClick={() => setActiveTab('vms')}>
                      <div className="icon-circle"><Server size={24} color="#0078D4" /></div>
                      <span>Virtual machines</span>
                    </div>
                    <div className="service-icon-box" onClick={() => setActiveTab('vnets')}>
                      <div className="icon-circle"><Network size={24} color="#0078D4" /></div>
                      <span>Virtual networks</span>
                    </div>
                    <div className="service-icon-box">
                      <div className="icon-circle" style={{ background: '#F3F2F1' }}><ArrowRight size={24} color="#0078D4" /></div>
                      <span>More services</span>
                    </div>
                  </div>

                  <div className="home-section-header" style={{ marginTop: 40 }}>
                    <h2>Resources</h2>
                  </div>
                  <div className="azure-card" style={{ padding: 0 }}>
                    <table className="azure-table azure-hover-table" style={{ margin: 0, border: 'none' }}>
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Type</th>
                          <th>Last Viewed</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allResources.slice(0, 5).map((res, i) => (
                          <tr key={i}>
                            <td>
                              {res.type === 'Resource group' && <Folder size={14} style={{ marginRight: 8, verticalAlign: 'middle', color: '#0078D4' }} />}
                              {res.type === 'Virtual network' && <Network size={14} style={{ marginRight: 8, verticalAlign: 'middle', color: '#0078D4' }} />}
                              {res.type === 'Virtual machine' && <Server size={14} style={{ marginRight: 8, verticalAlign: 'middle', color: '#0078D4' }} />}
                              {res.type === 'Virtual network gateway' && <Network size={14} style={{ marginRight: 8, verticalAlign: 'middle', color: '#0078D4' }} />}
                              <span className="link-text">{res.name}</span>
                            </td>
                            <td>{res.type}</td>
                            <td>{res.date}</td>
                          </tr>
                        ))}
                        {allResources.length === 0 && (
                          <tr><td colSpan={3} style={{ textAlign: 'center', padding: '30px', color: '#605E5C' }}>No recent resources found.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'allResources' && (
              <>
                <div className="azure-content-header">All resources</div>
                <div className="azure-toolbar">
                  <button className="azure-toolbar-btn"><Plus size={14} color="#0078d4" /> Create</button>
                  <button className="azure-toolbar-btn"><Settings size={14} color="#0078d4" /> Manage view</button>
                  <div className="azure-toolbar-divider"></div>
                  <button className="azure-toolbar-btn"><Activity size={14} color="#0078d4" /> Refresh</button>
                  <button className="azure-toolbar-btn"><Folder size={14} color="#0078d4" /> Export to CSV</button>
                  <button className="azure-toolbar-btn"><Search size={14} color="#0078d4" /> Open query</button>
                </div>
                <div className="azure-filter-bar">
                  <div className="azure-filter-input">
                    <Search size={14} color="#8a8886" />
                    <input type="text" placeholder="Filter for any field..." />
                  </div>
                  <div className="azure-chip"><span>Subscription</span> equals all <X size={12} className="close" /></div>
                  <div className="azure-chip"><span>Resource Group</span> equals all <X size={12} className="close" /></div>
                  <div className="azure-chip"><span>Type</span> equals all <X size={12} className="close" /></div>
                  <div className="azure-chip"><span>Location</span> equals all <X size={12} className="close" /></div>
                  <button className="azure-add-filter"><Plus size={14} /> Add filter</button>
                </div>
                <div className="azure-content-scroll" style={{ padding: 0 }}>
                  <table className="azure-table azure-hover-table">
                    <thead>
                      <tr>
                        <th style={{ width: 40 }}><input type="checkbox" /></th>
                        <th>Name</th>
                        <th>Type</th>
                        <th>Resource Group</th>
                        <th>Location</th>
                        <th>Subscription</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allResources.map((res, i) => (
                        <tr key={i}>
                          <td><input type="checkbox" /></td>
                          <td className="resource-name">
                            {res.type === 'Resource group' && <Folder size={16} />}
                            {res.type === 'Virtual network' && <Network size={16} />}
                            {res.type === 'Virtual machine' && <Server size={16} />}
                            {res.type === 'Virtual network gateway' && <Network size={16} />}
                            {res.type === 'Network security group' && <Shield size={16} />}
                            {res.type === 'Storage account' && <Database size={16} />}
                            {res.type === 'Route table' && <Map size={16} />}
                            {res.type === 'Load balancer' && <Scale size={16} />}
                            {res.type === 'Virtual network peering' && <ArrowRightLeft size={16} />}
                            {(res.type === 'DNS zone' || res.type === 'Private DNS zone') && <Globe size={16} />}
                            {res.type === 'App Service' && <AppWindow size={16} />}
                            {res.type === 'Key vault' && <Key size={16} />}
                            {res.type === 'Kubernetes service' && <Box size={16} />}
                            {res.type === 'Virtual machine scale set' && <Layers size={16} />}
                            {res.type === 'Recovery Services vault' && <Archive size={16} />}
                            {res.type === 'SQL server' && <Server size={16} />}
                            {res.type === 'SQL database' && <Database size={16} />}
                            {res.type === 'Log Analytics workspace' && <Monitor size={16} />}
                            {res.type === 'Firewall' && <Flame size={16} />}
                            {res.type === 'Application gateway' && <Split size={16} />}
                            {res.type === 'Public IP address' && <Globe size={16} />}
                            {res.type === 'Network interface' && <Plug size={16} />}
                            {res.type === 'Bastion' && <ShieldCheck size={16} />}
                            {res.name}
                          </td>
                          <td>{res.type}</td>
                          <td className="link-text">DefaultResourceGroup</td>
                          <td>East US</td>
                          <td className="link-text">Azure subscription 1</td>
                        </tr>
                      ))}
                      {allResources.length === 0 && (
                        <tr><td colSpan={6} style={{ textAlign: 'center', padding: '30px', color: '#605E5C' }}>No resources to display.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {activeTab === 'costManagement' && (
              <>
                <div className="azure-content-header">Chris Wittman <span style={{ fontSize: 13, color: '#605e5c', marginLeft: 8 }}>Billing account</span></div>
                <div className="azure-filter-bar" style={{ gap: 20 }}>
                  <span style={{ fontSize: 13, color: '#323130', borderBottom: '2px solid transparent', padding: '0 4px', cursor: 'pointer' }}>Get started</span>
                  <span style={{ fontSize: 13, color: '#0078d4', borderBottom: '2px solid #0078d4', padding: '0 4px', fontWeight: 600, cursor: 'pointer' }}>Summary</span>
                  <span style={{ fontSize: 13, color: '#323130', borderBottom: '2px solid transparent', padding: '0 4px', cursor: 'pointer' }}>Tutorials & What's new</span>
                </div>
                <div className="azure-content-scroll">
                  <div className="azure-dashboard-grid">
                    <div className="azure-dash-card">
                      <h3>Amount due</h3>
                      <div className="big-value">$0.00</div>
                      <div className="sub-value"><Activity size={14} /> No payment needed</div>
                      <button className="azure-btn-default" style={{ marginTop: 'auto', alignSelf: 'flex-start' }}>View invoices</button>
                    </div>
                    <div className="azure-dash-card">
                      <h3>Upcoming invoices</h3>
                      <p style={{ margin: 0, fontSize: 13, color: '#605e5c' }}>Available on 6/9/2026</p>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16 }}>
                         <div><div style={{ fontSize: 12, color: '#605e5c' }}>Billing period</div><div style={{ fontSize: 13 }}>5/1/2026 - 5/31/2026</div></div>
                         <div><div style={{ fontSize: 12, color: '#605e5c' }}>Pre-tax total so far</div><div style={{ fontSize: 13 }}>$0.07</div></div>
                      </div>
                    </div>
                    <div className="azure-dash-card">
                      <h3>Invoices over time</h3>
                      <div style={{ height: 120, display: 'flex', alignItems: 'flex-end', borderBottom: '1px solid #e1dfdd', paddingBottom: 8, gap: 20, justifyContent: 'center' }}>
                         <div style={{ width: 30, height: '10%', background: '#c8c6c4' }}></div>
                         <div style={{ width: 30, height: '80%', background: '#60a5fa' }}></div>
                         <div style={{ width: 30, height: '5%', background: '#c8c6c4' }}></div>
                      </div>
                      <div style={{ fontSize: 12, color: '#605e5c', marginTop: 8 }}>Total amount <span style={{ fontSize: 24, color: '#323130', fontWeight: 600, display: 'block' }}>$0.03</span></div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Existing Tabs Wrapper */}
            {['resourceGroups', 'vnets', 'vms', 'vngs', 'nsgs', 'routeTables', 'loadBalancers', 'peerings', 'storageAccounts', 'dnsZones', 'appServices', 'keyVaults', 'aksClusters'].includes(activeTab) && (
              <div className="azure-content-scroll">
                {activeTab === 'resourceGroups' && (
                  <div>
                    <div className="azure-content-header" style={{ paddingLeft: 0 }}>Resource groups</div>
                    <div className="azure-toolbar" style={{ paddingLeft: 0, borderBottom: 'none' }}>
                      <button className="azure-btn-primary" onClick={() => setShowCreateRG(true)}><Plus size={14} /> Create</button>
                    </div>
                    {showCreateRG ? (
                      <div className="azure-form-container" style={{ marginTop: 20 }}>
                        <h3>Create a resource group</h3>
                        <form onSubmit={handleCreateRG} className="azure-form">
                          <div className="form-group">
                            <label>Resource group name *</label>
                            <input type="text" name="name" required placeholder="e.g., myResourceGroup" />
                          </div>
                          <div className="form-group">
                            <label>Region *</label>
                            <select name="location" required>
                              <option value="eastus">East US</option>
                              <option value="westus">West US</option>
                              <option value="northeurope">North Europe</option>
                            </select>
                          </div>
                          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                            <button type="submit" className="azure-btn-primary">Review + create</button>
                            <button type="button" className="azure-btn-default" onClick={() => setShowCreateRG(false)}>Cancel</button>
                          </div>
                        </form>
                      </div>
                    ) : (
                      <table className="azure-table azure-hover-table" style={{ marginTop: 20 }}>
                        <thead><tr><th>Name</th><th>Location</th><th>Role assignments (IAM)</th></tr></thead>
                        <tbody>
                          {Object.values(resourceGroups).map(rg => {
                            const iamCount = Object.values(roleAssignments).filter(ra => ra.scope === rg.name || ra.scope === 'Subscription').length;
                            return (
                              <tr key={rg.name}>
                                <td className="resource-name"><Folder size={16} /> {rg.name}</td>
                                <td>{rg.location}</td>
                                <td>{iamCount} assignments</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
                
                {activeTab === 'vnets' && (
                  <div>
                    <div className="azure-content-header" style={{ paddingLeft: 0 }}>Virtual networks</div>
                    <div className="azure-toolbar" style={{ paddingLeft: 0, borderBottom: 'none' }}>
                      <button className="azure-btn-primary" onClick={() => setShowCreateVNet(true)}><Plus size={14} /> Create</button>
                    </div>
                    {showCreateVNet ? (
                      <div className="azure-form-container" style={{ marginTop: 20 }}>
                        {/* VNet Form Code Here (Keep Existing Form exactly) */}
                        <form onSubmit={handleCreateVNet} className="azure-form">
                          <div className="form-group"><label>Resource group *</label><select name="resourceGroup" required><option value="">Select</option>{Object.keys(resourceGroups).map(rg => <option key={rg} value={rg}>{rg}</option>)}</select></div>
                          <div className="form-group"><label>Virtual network name *</label><input type="text" name="name" required /></div>
                          <div className="form-group"><label>Region *</label><select name="location"><option value="eastus">East US</option></select></div>
                          <div className="form-group"><label>IPv4 address space *</label><input type="text" name="addressSpace" defaultValue="10.0.0.0/16" required /></div>
                          <div className="form-group"><label>Default subnet prefix *</label><input type="text" name="subnetPrefix" defaultValue="10.0.0.0/24" required /></div>
                          <div className="form-group">
                            <label>Network security group</label>
                            <select name="nsgId">
                              <option value="">None</option>
                              {Object.values(nsgs).map(nsg => <option key={nsg.id} value={nsg.id}>{nsg.name}</option>)}
                            </select>
                          </div>
                          <div className="form-group">
                            <label>Route table</label>
                            <select name="routeTableId">
                              <option value="">None</option>
                              {Object.values(routeTables).map(rt => <option key={rt.id} value={rt.id}>{rt.name}</option>)}
                            </select>
                          </div>
                          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                            <button type="submit" className="azure-btn-primary">Review + create</button>
                            <button type="button" className="azure-btn-default" onClick={() => setShowCreateVNet(false)}>Cancel</button>
                          </div>
                        </form>
                      </div>
                    ) : (
                      <table className="azure-table azure-hover-table" style={{ marginTop: 20 }}>
                        <thead><tr><th>Name</th><th>Resource group</th><th>Location</th><th>Address space</th></tr></thead>
                        <tbody>
                          {Object.values(vnets).map(vnet => (
                            <tr key={vnet.id}>
                              <td className="resource-name"><Network size={16} /> {vnet.name}</td>
                              <td>{vnet.resourceGroup}</td><td>{vnet.location}</td><td>{vnet.addressSpace.join(', ')}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
                
                {activeTab === 'vms' && (
                  <div>
                    {selectedVM ? (
                      <AzureVMDetails vm={selectedVM} onClose={() => setSelectedVM(null)} />
                    ) : showCreateVM ? (
                      <AzureVMWizard onCancel={() => setShowCreateVM(false)} onComplete={() => setShowCreateVM(false)} />
                    ) : (
                      <>
                        <div className="azure-content-header" style={{ paddingLeft: 0 }}>Virtual machines</div>
                        <div className="azure-toolbar" style={{ paddingLeft: 0, borderBottom: 'none' }}>
                          <button className="azure-btn-primary" onClick={() => setShowCreateVM(true)}><Plus size={14} /> Create</button>
                        </div>
                        <table className="azure-table azure-hover-table" style={{ marginTop: 20 }}>
                          <thead><tr><th>Name</th><th>Status</th><th>Resource group</th><th>Location</th><th>OS</th></tr></thead>
                          <tbody>
                            {Object.values(vms).map(vm => (
                              <tr key={vm.id} onClick={() => setSelectedVM(vm)}>
                                <td className="resource-name"><Server size={16} /> {vm.name}</td>
                                <td>{vm.status}</td><td>{vm.resourceGroup}</td><td>{vm.location}</td><td>{vm.os}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </>
                    )}
                  </div>
                )}

                {activeTab === 'vngs' && (
                  <div>
                    <div className="azure-content-header" style={{ paddingLeft: 0 }}>Virtual network gateways</div>
                    <div className="azure-toolbar" style={{ paddingLeft: 0, borderBottom: 'none' }}>
                      <button className="azure-btn-primary" onClick={() => setShowCreateVNG(true)}><Plus size={14} /> Create</button>
                    </div>
                    {showCreateVNG ? (
                      <div className="azure-form-container" style={{ marginTop: 20 }}>
                        <form onSubmit={handleCreateVNG} className="azure-form">
                          <div className="form-group"><label>Name *</label><input type="text" name="name" required /></div>
                          <div className="form-group"><label>Region *</label><select name="location"><option value="eastus">East US</option></select></div>
                          <div className="form-group"><label>Virtual network *</label><select name="vnetId" required><option value="">Select</option>{Object.values(vnets).map(v => <option key={v.id} value={v.id}>{v.name}</option>)}</select></div>
                          <div className="form-group"><label>Resource group</label><select name="resourceGroup"><option value="">Select</option>{Object.keys(resourceGroups).map(rg => <option key={rg} value={rg}>{rg}</option>)}</select></div>
                          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                            <button type="submit" className="azure-btn-primary">Review + create</button>
                            <button type="button" className="azure-btn-default" onClick={() => setShowCreateVNG(false)}>Cancel</button>
                          </div>
                        </form>
                      </div>
                    ) : (
                      <table className="azure-table azure-hover-table" style={{ marginTop: 20 }}>
                        <thead><tr><th>Name</th><th>Type</th><th>Virtual network</th><th>Location</th><th>Status</th></tr></thead>
                        <tbody>
                          {Object.values(vngs).map(vng => (
                            <tr key={vng.id}>
                              <td className="resource-name"><Network size={16} /> {vng.name}</td>
                              <td>VPN</td><td>{vnets[vng.vnetId]?.name}</td><td>{vng.location}</td><td>{vng.status}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}

                {activeTab === 'nsgs' && (
                  <div>
                    <div className="azure-content-header" style={{ paddingLeft: 0 }}>Network security groups</div>
                    <div className="azure-toolbar" style={{ paddingLeft: 0, borderBottom: 'none' }}>
                      <button className="azure-btn-primary" onClick={() => setShowCreateNSG(true)}><Plus size={14} /> Create</button>
                    </div>
                    {showCreateNSG ? (
                      <div className="azure-form-container" style={{ marginTop: 20 }}>
                        <form onSubmit={handleCreateNSG} className="azure-form">
                          <div className="form-group"><label>Name *</label><input type="text" name="name" required placeholder="e.g., myNSG" /></div>
                          <div className="form-group"><label>Region *</label><select name="location"><option value="eastus">East US</option><option value="westus">West US</option></select></div>
                          <div className="form-group"><label>Resource group *</label><select name="resourceGroup" required><option value="">Select</option>{Object.keys(resourceGroups).map(rg => <option key={rg} value={rg}>{rg}</option>)}</select></div>
                          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                            <button type="submit" className="azure-btn-primary">Review + create</button>
                            <button type="button" className="azure-btn-default" onClick={() => setShowCreateNSG(false)}>Cancel</button>
                          </div>
                        </form>
                      </div>
                    ) : (
                      <table className="azure-table azure-hover-table" style={{ marginTop: 20 }}>
                        <thead><tr><th>Name</th><th>Resource group</th><th>Location</th><th>Attached subnets</th></tr></thead>
                        <tbody>
                          {Object.values(nsgs).map(nsg => {
                            const attachedSubnets = Object.values(vnets).flatMap(vnet => vnet.subnets.filter(s => s.nsgId === nsg.id)).length;
                            return (
                              <tr key={nsg.id}>
                                <td className="resource-name"><Shield size={16} /> {nsg.name}</td>
                                <td>{nsg.resourceGroup}</td><td>{nsg.location}</td><td>{attachedSubnets}</td>
                              </tr>
                            );
                          })}
                          {Object.values(nsgs).length === 0 && (
                            <tr><td colSpan={4} style={{ textAlign: 'center', color: '#666' }}>No network security groups to display.</td></tr>
                          )}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}

                {activeTab === 'routeTables' && (
                  <div>
                    <div className="azure-content-header" style={{ paddingLeft: 0 }}>Route tables</div>
                    <div className="azure-toolbar" style={{ paddingLeft: 0, borderBottom: 'none' }}>
                      <button className="azure-btn-primary" onClick={() => setShowCreateRT(true)}><Plus size={14} /> Create</button>
                    </div>
                    {showCreateRT ? (
                      <div className="azure-form-container" style={{ marginTop: 20 }}>
                        <form onSubmit={handleCreateRT} className="azure-form">
                          <div className="form-group"><label>Name *</label><input type="text" name="name" required placeholder="e.g., myRouteTable" /></div>
                          <div className="form-group"><label>Region *</label><select name="location"><option value="eastus">East US</option><option value="westus">West US</option></select></div>
                          <div className="form-group"><label>Resource group *</label><select name="resourceGroup" required><option value="">Select</option>{Object.keys(resourceGroups).map(rg => <option key={rg} value={rg}>{rg}</option>)}</select></div>
                          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                            <button type="submit" className="azure-btn-primary">Review + create</button>
                            <button type="button" className="azure-btn-default" onClick={() => setShowCreateRT(false)}>Cancel</button>
                          </div>
                        </form>
                      </div>
                    ) : (
                      <table className="azure-table azure-hover-table" style={{ marginTop: 20 }}>
                        <thead><tr><th>Name</th><th>Resource group</th><th>Location</th><th>Attached subnets</th></tr></thead>
                        <tbody>
                          {Object.values(routeTables).map(rt => {
                            const attachedSubnets = Object.values(vnets).flatMap(vnet => vnet.subnets.filter(s => s.routeTableId === rt.id)).length;
                            return (
                              <tr key={rt.id}>
                                <td className="resource-name"><Map size={16} /> {rt.name}</td>
                                <td>{rt.resourceGroup}</td><td>{rt.location}</td><td>{attachedSubnets}</td>
                              </tr>
                            );
                          })}
                          {Object.values(routeTables).length === 0 && (
                            <tr><td colSpan={4} style={{ textAlign: 'center', color: '#666' }}>No route tables to display.</td></tr>
                          )}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}

                {activeTab === 'loadBalancers' && (
                  <div>
                    <div className="azure-content-header" style={{ paddingLeft: 0 }}>Load balancers</div>
                    <div className="azure-toolbar" style={{ paddingLeft: 0, borderBottom: 'none' }}>
                      <button className="azure-btn-primary" onClick={() => setShowCreateLB(true)}><Plus size={14} /> Create</button>
                    </div>
                    {showCreateLB ? (
                      <div className="azure-form-container" style={{ marginTop: 20 }}>
                        <form onSubmit={handleCreateLB} className="azure-form">
                          <div className="form-group"><label>Name *</label><input type="text" name="name" required placeholder="e.g., myLoadBalancer" /></div>
                          <div className="form-group"><label>Region *</label><select name="location"><option value="eastus">East US</option><option value="westus">West US</option></select></div>
                          <div className="form-group"><label>Resource group *</label><select name="resourceGroup" required><option value="">Select</option>{Object.keys(resourceGroups).map(rg => <option key={rg} value={rg}>{rg}</option>)}</select></div>
                          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                            <button type="submit" className="azure-btn-primary">Review + create</button>
                            <button type="button" className="azure-btn-default" onClick={() => setShowCreateLB(false)}>Cancel</button>
                          </div>
                        </form>
                      </div>
                    ) : (
                      <table className="azure-table azure-hover-table" style={{ marginTop: 20 }}>
                        <thead><tr><th>Name</th><th>Resource group</th><th>Location</th><th>Backend pool size</th></tr></thead>
                        <tbody>
                          {Object.values(loadBalancers).map(lb => (
                            <tr key={lb.id}>
                              <td className="resource-name"><Scale size={16} /> {lb.name}</td>
                              <td>{lb.resourceGroup}</td><td>{lb.location}</td><td>{lb.backendPool.length} VMs</td>
                            </tr>
                          ))}
                          {Object.values(loadBalancers).length === 0 && (
                            <tr><td colSpan={4} style={{ textAlign: 'center', color: '#666' }}>No load balancers to display.</td></tr>
                          )}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}

                {activeTab === 'peerings' && (
                  <div>
                    <div className="azure-content-header" style={{ paddingLeft: 0 }}>Virtual network peerings</div>
                    <div className="azure-toolbar" style={{ paddingLeft: 0, borderBottom: 'none' }}>
                      <button className="azure-btn-primary" onClick={() => setShowCreatePeering(true)}><Plus size={14} /> Create</button>
                    </div>
                    {showCreatePeering ? (
                      <div className="azure-form-container" style={{ marginTop: 20 }}>
                        <form onSubmit={handleCreatePeering} className="azure-form">
                          <div className="form-group"><label>Peering link name *</label><input type="text" name="name" required placeholder="e.g., vnetA-to-vnetB" /></div>
                          <div className="form-group"><label>Local Virtual network *</label><select name="localVnetId" required><option value="">Select</option>{Object.values(vnets).map(v => <option key={v.id} value={v.id}>{v.name}</option>)}</select></div>
                          <div className="form-group"><label>Remote Virtual network *</label><select name="remoteVnetId" required><option value="">Select</option>{Object.values(vnets).map(v => <option key={v.id} value={v.id}>{v.name}</option>)}</select></div>
                          
                          <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                            <input type="checkbox" name="allowVnetAccess" defaultChecked id="allowVnetAccess" />
                            <label htmlFor="allowVnetAccess" style={{ margin: 0 }}>Allow virtual network access</label>
                          </div>
                          <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                            <input type="checkbox" name="allowForwardedTraffic" id="allowForwardedTraffic" />
                            <label htmlFor="allowForwardedTraffic" style={{ margin: 0 }}>Allow forwarded traffic</label>
                          </div>
                          <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                            <input type="checkbox" name="allowGatewayTransit" id="allowGatewayTransit" />
                            <label htmlFor="allowGatewayTransit" style={{ margin: 0 }}>Allow gateway transit (Local VNet has a gateway)</label>
                          </div>
                          <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                            <input type="checkbox" name="useRemoteGateways" id="useRemoteGateways" />
                            <label htmlFor="useRemoteGateways" style={{ margin: 0 }}>Use remote gateways (Remote VNet has a gateway)</label>
                          </div>

                          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                            <button type="submit" className="azure-btn-primary">Add</button>
                            <button type="button" className="azure-btn-default" onClick={() => setShowCreatePeering(false)}>Cancel</button>
                          </div>
                        </form>
                      </div>
                    ) : (
                      <table className="azure-table azure-hover-table" style={{ marginTop: 20 }}>
                        <thead><tr><th>Name</th><th>Local VNet</th><th>Remote VNet</th><th>Peering state</th></tr></thead>
                        <tbody>
                          {Object.values(vnets).flatMap(vnet => vnet.peerings.map(peering => (
                            <tr key={peering.id}>
                              <td className="resource-name"><ArrowRightLeft size={16} /> {peering.name}</td>
                              <td>{vnet.name}</td><td>{vnets[peering.remoteVirtualNetworkId]?.name}</td><td>{peering.peeringState}</td>
                            </tr>
                          )))}
                          {Object.values(vnets).flatMap(v => v.peerings).length === 0 && (
                            <tr><td colSpan={4} style={{ textAlign: 'center', color: '#666' }}>No peerings to display.</td></tr>
                          )}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}

                {activeTab === 'storageAccounts' && (
                  <div>
                    <div className="azure-content-header" style={{ paddingLeft: 0 }}>Storage accounts</div>
                    <div className="azure-toolbar" style={{ paddingLeft: 0, borderBottom: 'none' }}>
                      <button className="azure-btn-primary" onClick={() => setShowCreateStorage(true)}><Plus size={14} /> Create</button>
                    </div>
                    {showCreateStorage ? (
                      <div className="azure-form-container" style={{ marginTop: 20 }}>
                        <form onSubmit={handleCreateStorage} className="azure-form">
                          <div className="form-group"><label>Storage account name *</label><input type="text" name="name" required placeholder="Must be globally unique" /></div>
                          <div className="form-group"><label>Region *</label><select name="location"><option value="eastus">East US</option><option value="westus">West US</option></select></div>
                          <div className="form-group"><label>Resource group *</label><select name="resourceGroup" required><option value="">Select</option>{Object.keys(resourceGroups).map(rg => <option key={rg} value={rg}>{rg}</option>)}</select></div>
                          
                          <div className="form-group"><label>Performance *</label><select name="performance"><option value="Standard">Standard</option><option value="Premium">Premium</option></select></div>
                          <div className="form-group"><label>Redundancy *</label><select name="redundancy"><option value="LRS">Locally-redundant storage (LRS)</option><option value="GRS">Geo-redundant storage (GRS)</option><option value="ZRS">Zone-redundant storage (ZRS)</option></select></div>
                          <div className="form-group"><label>Access tier *</label><select name="accessTier"><option value="Hot">Hot</option><option value="Cool">Cool</option></select></div>

                          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                            <button type="submit" className="azure-btn-primary">Review + create</button>
                            <button type="button" className="azure-btn-default" onClick={() => setShowCreateStorage(false)}>Cancel</button>
                          </div>
                        </form>
                      </div>
                    ) : (
                      <table className="azure-table azure-hover-table" style={{ marginTop: 20 }}>
                        <thead><tr><th>Name</th><th>Resource group</th><th>Location</th><th>Performance</th><th>Redundancy</th></tr></thead>
                        <tbody>
                          {Object.values(storageAccounts).map(sa => (
                            <tr key={sa.id}>
                              <td className="resource-name"><Database size={16} /> {sa.name}</td>
                              <td>{sa.resourceGroup}</td><td>{sa.location}</td><td>{sa.performance}</td><td>{sa.redundancy}</td>
                            </tr>
                          ))}
                          {Object.values(storageAccounts).length === 0 && (
                            <tr><td colSpan={5} style={{ textAlign: 'center', color: '#666' }}>No storage accounts to display.</td></tr>
                          )}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}

                {activeTab === 'dnsZones' && (
                  <div>
                    <div className="azure-content-header" style={{ paddingLeft: 0 }}>DNS zones</div>
                    <div className="azure-toolbar" style={{ paddingLeft: 0, borderBottom: 'none' }}>
                      <button className="azure-btn-primary" onClick={() => setShowCreateDns(true)}><Plus size={14} /> Create</button>
                    </div>
                    {showCreateDns ? (
                      <div className="azure-form-container" style={{ marginTop: 20 }}>
                        <form onSubmit={handleCreateDns} className="azure-form">
                          <div className="form-group"><label>Resource group *</label><select name="resourceGroup" required><option value="">Select</option>{Object.keys(resourceGroups).map(rg => <option key={rg} value={rg}>{rg}</option>)}</select></div>
                          <div className="form-group"><label>Name *</label><input type="text" name="name" required placeholder="e.g., contoso.com" /></div>
                          <div className="form-group"><label>Zone Type *</label><select name="zoneType" required><option value="Public">Public (Internet facing)</option><option value="Private">Private (Internal VNet resolution)</option></select></div>
                          <div className="form-group"><label>Link to Virtual network (Optional for Private)</label><select name="linkedVnet"><option value="">None</option>{Object.values(vnets).map(v => <option key={v.id} value={v.id}>{v.name}</option>)}</select></div>
                          
                          <div style={{ marginTop: 20, marginBottom: 10, fontWeight: 600 }}>Create initial A-Record (Optional)</div>
                          <div className="form-group"><label>Record Name</label><input type="text" name="aRecordName" placeholder="e.g., www" /></div>
                          <div className="form-group"><label>IP Address</label><input type="text" name="aRecordValue" placeholder="e.g., 10.0.0.4" /></div>

                          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                            <button type="submit" className="azure-btn-primary">Review + create</button>
                            <button type="button" className="azure-btn-default" onClick={() => setShowCreateDns(false)}>Cancel</button>
                          </div>
                        </form>
                      </div>
                    ) : (
                      <table className="azure-table azure-hover-table" style={{ marginTop: 20 }}>
                        <thead><tr><th>Name</th><th>Type</th><th>Resource group</th><th>Records</th></tr></thead>
                        <tbody>
                          {Object.values(dnsZones).map(z => (
                            <tr key={z.id}>
                              <td className="resource-name"><Globe size={16} /> {z.name}</td>
                              <td>{z.zoneType}</td><td>{z.resourceGroup}</td><td>{z.records.length} records</td>
                            </tr>
                          ))}
                          {Object.values(dnsZones).length === 0 && (
                            <tr><td colSpan={4} style={{ textAlign: 'center', color: '#666' }}>No DNS zones to display.</td></tr>
                          )}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}

                {activeTab === 'appServices' && (
                  <div>
                    <div className="azure-content-header" style={{ paddingLeft: 0 }}>App Services</div>
                    <div className="azure-toolbar" style={{ paddingLeft: 0, borderBottom: 'none' }}>
                      <button className="azure-btn-primary" onClick={() => setShowCreateApp(true)}><Plus size={14} /> Create</button>
                    </div>
                    {showCreateApp ? (
                      <div className="azure-form-container" style={{ marginTop: 20 }}>
                        <form onSubmit={handleCreateApp} className="azure-form">
                          <div className="form-group"><label>Resource group *</label><select name="resourceGroup" required><option value="">Select</option>{Object.keys(resourceGroups).map(rg => <option key={rg} value={rg}>{rg}</option>)}</select></div>
                          <div className="form-group"><label>Name *</label><input type="text" name="name" required placeholder="e.g., mywebapp" /></div>
                          <div className="form-group"><label>Publish *</label><select name="publish"><option value="Code">Code</option><option value="Docker">Docker Container</option></select></div>
                          <div className="form-group"><label>App service plan *</label><select name="appServicePlanId" required><option value="">Select</option>{Object.values(appServicePlans).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
                          <div className="form-group"><label>Runtime stack *</label><select name="runtimeStack"><option value="Node.js 18">Node.js 18</option><option value=".NET 7">.NET 7</option><option value="Python 3.10">Python 3.10</option><option value="Java 17">Java 17</option></select></div>
                          <div className="form-group"><label>Region *</label><select name="location"><option value="eastus">East US</option><option value="westus">West US</option></select></div>

                          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                            <button type="submit" className="azure-btn-primary">Review + create</button>
                            <button type="button" className="azure-btn-default" onClick={() => setShowCreateApp(false)}>Cancel</button>
                          </div>
                        </form>
                      </div>
                    ) : (
                      <table className="azure-table azure-hover-table" style={{ marginTop: 20 }}>
                        <thead><tr><th>Name</th><th>Resource group</th><th>App Service Plan</th><th>Status</th></tr></thead>
                        <tbody>
                          {Object.values(appServices).map(app => (
                            <tr key={app.id}>
                              <td className="resource-name"><AppWindow size={16} /> {app.name}</td>
                              <td>{app.resourceGroup}</td><td>{appServicePlans[app.appServicePlanId]?.name || 'Unknown'}</td><td>{app.status}</td>
                            </tr>
                          ))}
                          {Object.values(appServices).length === 0 && (
                            <tr><td colSpan={6} style={{ textAlign: 'center', color: '#666' }}>No App Services to display.</td></tr>
                          )}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}

                {activeTab === 'keyVaults' && (
                  <div>
                    <div className="azure-content-header" style={{ paddingLeft: 0 }}>Key vaults</div>
                    <div className="azure-toolbar" style={{ paddingLeft: 0, borderBottom: 'none' }}>
                      <button className="azure-btn-primary" onClick={() => setShowCreateKv(true)}><Plus size={14} /> Create</button>
                    </div>
                    {showCreateKv ? (
                      <div className="azure-form-container" style={{ marginTop: 20 }}>
                        <form onSubmit={handleCreateKv} className="azure-form">
                          <div className="form-group"><label>Resource group *</label><select name="resourceGroup" required><option value="">Select</option>{Object.keys(resourceGroups).map(rg => <option key={rg} value={rg}>{rg}</option>)}</select></div>
                          <div className="form-group"><label>Key vault name *</label><input type="text" name="name" required placeholder="e.g., myKeyVault123" /></div>
                          <div className="form-group"><label>Region *</label><select name="location"><option value="eastus">East US</option><option value="westus">West US</option></select></div>
                          <div className="form-group"><label>Pricing tier *</label><select name="sku"><option value="Standard">Standard</option><option value="Premium">Premium</option></select></div>
                          
                          <div className="form-group"><label>Purge protection *</label><select name="purgeProtectionEnabled"><option value="true">Enable purge protection</option><option value="false">Disable purge protection</option></select></div>

                          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                            <button type="submit" className="azure-btn-primary">Review + create</button>
                            <button type="button" className="azure-btn-default" onClick={() => setShowCreateKv(false)}>Cancel</button>
                          </div>
                        </form>
                      </div>
                    ) : (
                      <table className="azure-table azure-hover-table" style={{ marginTop: 20 }}>
                        <thead><tr><th>Name</th><th>Resource group</th><th>Location</th><th>Pricing Tier</th></tr></thead>
                        <tbody>
                          {Object.values(keyVaults).map(kv => (
                            <tr key={kv.id}>
                              <td className="resource-name"><Key size={16} /> {kv.name}</td>
                              <td>{kv.resourceGroup}</td><td>{kv.location}</td><td>{kv.sku}</td>
                            </tr>
                          ))}
                          {Object.values(keyVaults).length === 0 && (
                            <tr><td colSpan={4} style={{ textAlign: 'center', color: '#666' }}>No Key vaults to display.</td></tr>
                          )}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}

                {activeTab === 'aksClusters' && (
                  <div>
                    <div className="azure-content-header" style={{ paddingLeft: 0 }}>Kubernetes services</div>
                    <div className="azure-toolbar" style={{ paddingLeft: 0, borderBottom: 'none' }}>
                      <button className="azure-btn-primary" onClick={() => setShowCreateAks(true)}><Plus size={14} /> Create</button>
                    </div>
                    {showCreateAks ? (
                      <div className="azure-form-container" style={{ marginTop: 20 }}>
                        <form onSubmit={handleCreateAks} className="azure-form">
                          <div className="form-group"><label>Resource group *</label><select name="resourceGroup" required><option value="">Select</option>{Object.keys(resourceGroups).map(rg => <option key={rg} value={rg}>{rg}</option>)}</select></div>
                          <div className="form-group"><label>Kubernetes cluster name *</label><input type="text" name="name" required placeholder="e.g., myAKSCluster" /></div>
                          <div className="form-group"><label>Region *</label><select name="location"><option value="eastus">East US</option><option value="westus">West US</option></select></div>
                          <div className="form-group"><label>Kubernetes version *</label><select name="kubernetesVersion"><option value="1.28.5">1.28.5 (Default)</option><option value="1.29.0">1.29.0</option></select></div>
                          <div className="form-group"><label>Node count *</label><input type="number" name="nodeCount" defaultValue="3" min="1" max="100" /></div>
                          <div className="form-group"><label>Node size *</label><select name="nodeSize"><option value="Standard_DS2_v2">Standard_DS2_v2</option><option value="Standard_D4s_v3">Standard_D4s_v3</option></select></div>

                          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                            <button type="submit" className="azure-btn-primary">Review + create</button>
                            <button type="button" className="azure-btn-default" onClick={() => setShowCreateAks(false)}>Cancel</button>
                          </div>
                        </form>
                      </div>
                    ) : (
                      <table className="azure-table azure-hover-table" style={{ marginTop: 20 }}>
                        <thead><tr><th>Name</th><th>Resource group</th><th>Location</th><th>Kubernetes version</th><th>Node count</th></tr></thead>
                        <tbody>
                          {Object.values(aksClusters).map(aks => (
                            <tr key={aks.id}>
                              <td className="resource-name"><Box size={16} /> {aks.name}</td>
                              <td>{aks.resourceGroup}</td><td>{aks.location}</td><td>{aks.kubernetesVersion}</td><td>{aks.nodeCount}</td>
                            </tr>
                          ))}
                          {Object.values(aksClusters).length === 0 && (
                            <tr><td colSpan={5} style={{ textAlign: 'center', color: '#666' }}>No Kubernetes services to display.</td></tr>
                          )}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}

                {activeTab === 'vmss' && (
                  <div>
                    <div className="azure-content-header" style={{ paddingLeft: 0 }}>Virtual machine scale sets</div>
                    <div className="azure-toolbar" style={{ paddingLeft: 0, borderBottom: 'none' }}>
                      <button className="azure-btn-primary" onClick={() => setShowCreateVmss(true)}><Plus size={14} /> Create</button>
                    </div>
                    {showCreateVmss ? (
                      <div className="azure-form-container" style={{ marginTop: 20 }}>
                        <form onSubmit={handleCreateVmss} className="azure-form">
                          <div className="form-group"><label>Resource group *</label><select name="resourceGroup" required><option value="">Select</option>{Object.keys(resourceGroups).map(rg => <option key={rg} value={rg}>{rg}</option>)}</select></div>
                          <div className="form-group"><label>Virtual machine scale set name *</label><input type="text" name="name" required placeholder="e.g., myVMSS" /></div>
                          <div className="form-group"><label>Region *</label><select name="location"><option value="eastus">East US</option><option value="westus">West US</option></select></div>
                          <div className="form-group"><label>Virtual network / Subnet *</label><select name="subnetId" required><option value="">Select</option>{Object.values(vnets).flatMap(v => v.subnets.map(s => <option key={s.id} value={s.id}>{v.name} / {s.name}</option>))}</select></div>
                          <div className="form-group"><label>Operating system *</label><select name="os"><option value="Linux">Linux</option><option value="Windows">Windows</option></select></div>
                          <div className="form-group"><label>Size *</label><select name="sku"><option value="Standard_B2s">Standard_B2s</option><option value="Standard_D4s_v3">Standard_D4s_v3</option></select></div>
                          <div className="form-group"><label>Initial instance count *</label><input type="number" name="capacity" defaultValue="2" min="0" max="1000" /></div>

                          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                            <button type="submit" className="azure-btn-primary">Review + create</button>
                            <button type="button" className="azure-btn-default" onClick={() => setShowCreateVmss(false)}>Cancel</button>
                          </div>
                        </form>
                      </div>
                    ) : (
                      <table className="azure-table azure-hover-table" style={{ marginTop: 20 }}>
                        <thead><tr><th>Name</th><th>Resource group</th><th>Location</th><th>OS</th><th>Instances</th></tr></thead>
                        <tbody>
                          {Object.values(vmss).map(v => (
                            <tr key={v.id}>
                              <td className="resource-name"><Layers size={16} /> {v.name}</td>
                              <td>{v.resourceGroup}</td><td>{v.location}</td><td>{v.os}</td><td>{v.capacity}</td>
                            </tr>
                          ))}
                          {Object.values(vmss).length === 0 && (
                            <tr><td colSpan={5} style={{ textAlign: 'center', color: '#666' }}>No virtual machine scale sets to display.</td></tr>
                          )}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}

                {activeTab === 'recoveryVaults' && (
                  <div>
                    <div className="azure-content-header" style={{ paddingLeft: 0 }}>Recovery Services vaults</div>
                    <div className="azure-toolbar" style={{ paddingLeft: 0, borderBottom: 'none' }}>
                      <button className="azure-btn-primary" onClick={() => setShowCreateRv(true)}><Plus size={14} /> Create</button>
                    </div>
                    {showCreateRv ? (
                      <div className="azure-form-container" style={{ marginTop: 20 }}>
                        <form onSubmit={handleCreateRv} className="azure-form">
                          <div className="form-group"><label>Resource group *</label><select name="resourceGroup" required><option value="">Select</option>{Object.keys(resourceGroups).map(rg => <option key={rg} value={rg}>{rg}</option>)}</select></div>
                          <div className="form-group"><label>Vault name *</label><input type="text" name="name" required placeholder="e.g., myRecoveryVault" /></div>
                          <div className="form-group"><label>Region *</label><select name="location"><option value="eastus">East US</option><option value="westus">West US</option></select></div>
                          <div className="form-group"><label>Storage redundancy *</label><select name="storageRedundancy"><option value="GeoRedundant">Geo-redundant</option><option value="LocallyRedundant">Locally-redundant</option></select></div>

                          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                            <button type="submit" className="azure-btn-primary">Review + create</button>
                            <button type="button" className="azure-btn-default" onClick={() => setShowCreateRv(false)}>Cancel</button>
                          </div>
                        </form>
                      </div>
                    ) : (
                      <table className="azure-table azure-hover-table" style={{ marginTop: 20 }}>
                        <thead><tr><th>Name</th><th>Resource group</th><th>Location</th><th>Redundancy</th></tr></thead>
                        <tbody>
                          {Object.values(recoveryVaults).map(v => (
                            <tr key={v.id}>
                              <td className="resource-name"><Archive size={16} /> {v.name}</td>
                              <td>{v.resourceGroup}</td><td>{v.location}</td><td>{v.storageRedundancy}</td>
                            </tr>
                          ))}
                          {Object.values(recoveryVaults).length === 0 && (
                            <tr><td colSpan={4} style={{ textAlign: 'center', color: '#666' }}>No Recovery Services vaults to display.</td></tr>
                          )}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}

                {activeTab === 'sqlServers' && (
                  <div>
                    <div className="azure-content-header" style={{ paddingLeft: 0 }}>SQL servers</div>
                    <div className="azure-toolbar" style={{ paddingLeft: 0, borderBottom: 'none' }}>
                      <button className="azure-btn-primary" onClick={() => setShowCreateSqlSrv(true)}><Plus size={14} /> Create</button>
                    </div>
                    {showCreateSqlSrv ? (
                      <div className="azure-form-container" style={{ marginTop: 20 }}>
                        <form onSubmit={handleCreateSqlSrv} className="azure-form">
                          <div className="form-group"><label>Resource group *</label><select name="resourceGroup" required><option value="">Select</option>{Object.keys(resourceGroups).map(rg => <option key={rg} value={rg}>{rg}</option>)}</select></div>
                          <div className="form-group"><label>Server name *</label><input type="text" name="name" required placeholder="e.g., mysqlserver" /></div>
                          <div className="form-group"><label>Region *</label><select name="location"><option value="eastus">East US</option><option value="westus">West US</option></select></div>
                          <div className="form-group"><label>Server admin login *</label><input type="text" name="adminLogin" required placeholder="azureadmin" /></div>

                          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                            <button type="submit" className="azure-btn-primary">Review + create</button>
                            <button type="button" className="azure-btn-default" onClick={() => setShowCreateSqlSrv(false)}>Cancel</button>
                          </div>
                        </form>
                      </div>
                    ) : (
                      <table className="azure-table azure-hover-table" style={{ marginTop: 20 }}>
                        <thead><tr><th>Name</th><th>Resource group</th><th>Location</th><th>Admin Login</th></tr></thead>
                        <tbody>
                          {Object.values(sqlServers).map(s => (
                            <tr key={s.id}>
                              <td className="resource-name"><Server size={16} /> {s.name}</td>
                              <td>{s.resourceGroup}</td><td>{s.location}</td><td>{s.adminLogin}</td>
                            </tr>
                          ))}
                          {Object.values(sqlServers).length === 0 && (
                            <tr><td colSpan={4} style={{ textAlign: 'center', color: '#666' }}>No SQL servers to display.</td></tr>
                          )}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}

                {activeTab === 'sqlDatabases' && (
                  <div>
                    <div className="azure-content-header" style={{ paddingLeft: 0 }}>SQL databases</div>
                    <div className="azure-toolbar" style={{ paddingLeft: 0, borderBottom: 'none' }}>
                      <button className="azure-btn-primary" onClick={() => setShowCreateSqlDb(true)}><Plus size={14} /> Create</button>
                    </div>
                    {showCreateSqlDb ? (
                      <div className="azure-form-container" style={{ marginTop: 20 }}>
                        <form onSubmit={handleCreateSqlDb} className="azure-form">
                          <div className="form-group"><label>Resource group *</label><select name="resourceGroup" required><option value="">Select</option>{Object.keys(resourceGroups).map(rg => <option key={rg} value={rg}>{rg}</option>)}</select></div>
                          <div className="form-group"><label>Database name *</label><input type="text" name="name" required placeholder="e.g., myDatabase" /></div>
                          <div className="form-group"><label>Server *</label><select name="serverId" required><option value="">Select</option>{Object.values(sqlServers).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
                          <div className="form-group"><label>Region *</label><select name="location"><option value="eastus">East US</option><option value="westus">West US</option></select></div>
                          <div className="form-group"><label>Compute + storage (SKU) *</label><select name="sku"><option value="Standard">Standard</option><option value="Basic">Basic</option><option value="Premium">Premium</option></select></div>
                          <div className="form-group"><label>Max size (GB) *</label><input type="number" name="maxSizeGB" defaultValue="250" /></div>

                          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                            <button type="submit" className="azure-btn-primary">Review + create</button>
                            <button type="button" className="azure-btn-default" onClick={() => setShowCreateSqlDb(false)}>Cancel</button>
                          </div>
                        </form>
                      </div>
                    ) : (
                      <table className="azure-table azure-hover-table" style={{ marginTop: 20 }}>
                        <thead><tr><th>Name</th><th>Resource group</th><th>Location</th><th>Server</th><th>SKU</th></tr></thead>
                        <tbody>
                          {Object.values(sqlDatabases).map(d => {
                            const parentServer = sqlServers[d.serverId];
                            return (
                            <tr key={d.id}>
                              <td className="resource-name"><Database size={16} /> {d.name}</td>
                              <td>{d.resourceGroup}</td><td>{d.location}</td><td>{parentServer?.name || 'Unknown'}</td><td>{d.sku}</td>
                            </tr>
                          )})}
                          {Object.values(sqlDatabases).length === 0 && (
                            <tr><td colSpan={5} style={{ textAlign: 'center', color: '#666' }}>No SQL databases to display.</td></tr>
                          )}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}

                {activeTab === 'logWorkspaces' && (
                  <div>
                    <div className="azure-content-header" style={{ paddingLeft: 0 }}>Log Analytics workspaces</div>
                    <div className="azure-toolbar" style={{ paddingLeft: 0, borderBottom: 'none' }}>
                      <button className="azure-btn-primary" onClick={() => setShowCreateLaw(true)}><Plus size={14} /> Create</button>
                    </div>
                    {showCreateLaw ? (
                      <div className="azure-form-container" style={{ marginTop: 20 }}>
                        <form onSubmit={handleCreateLaw} className="azure-form">
                          <div className="form-group"><label>Resource group *</label><select name="resourceGroup" required><option value="">Select</option>{Object.keys(resourceGroups).map(rg => <option key={rg} value={rg}>{rg}</option>)}</select></div>
                          <div className="form-group"><label>Workspace name *</label><input type="text" name="name" required placeholder="e.g., myWorkspace" /></div>
                          <div className="form-group"><label>Region *</label><select name="location"><option value="eastus">East US</option><option value="westus">West US</option></select></div>
                          <div className="form-group"><label>Pricing tier *</label><select name="sku"><option value="PerGB2018">Pay-as-you-go (PerGB2018)</option><option value="Free">Free</option></select></div>
                          <div className="form-group"><label>Retention (days) *</label><input type="number" name="retentionInDays" defaultValue="30" /></div>

                          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                            <button type="submit" className="azure-btn-primary">Review + create</button>
                            <button type="button" className="azure-btn-default" onClick={() => setShowCreateLaw(false)}>Cancel</button>
                          </div>
                        </form>
                      </div>
                    ) : (
                      <table className="azure-table azure-hover-table" style={{ marginTop: 20 }}>
                        <thead><tr><th>Name</th><th>Resource group</th><th>Location</th><th>Pricing tier</th><th>Retention</th></tr></thead>
                        <tbody>
                          {Object.values(logWorkspaces).map(l => (
                            <tr key={l.id}>
                              <td className="resource-name"><Monitor size={16} /> {l.name}</td>
                              <td>{l.resourceGroup}</td><td>{l.location}</td><td>{l.sku}</td><td>{l.retentionInDays} days</td>
                            </tr>
                          ))}
                          {Object.values(logWorkspaces).length === 0 && (
                            <tr><td colSpan={5} style={{ textAlign: 'center', color: '#666' }}>No Log Analytics workspaces to display.</td></tr>
                          )}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}

                {activeTab === 'firewalls' && (
                  <div>
                    <div className="azure-content-header" style={{ paddingLeft: 0 }}>Firewalls</div>
                    <div className="azure-toolbar" style={{ paddingLeft: 0, borderBottom: 'none' }}>
                      <button className="azure-btn-primary" onClick={() => setShowCreateFw(true)}><Plus size={14} /> Create</button>
                    </div>
                    {showCreateFw ? (
                      <div className="azure-form-container" style={{ marginTop: 20 }}>
                        <form onSubmit={handleCreateFw} className="azure-form">
                          <div className="form-group"><label>Resource group *</label><select name="resourceGroup" required><option value="">Select</option>{Object.keys(resourceGroups).map(rg => <option key={rg} value={rg}>{rg}</option>)}</select></div>
                          <div className="form-group"><label>Firewall name *</label><input type="text" name="name" required placeholder="e.g., myFirewall" /></div>
                          <div className="form-group"><label>Region *</label><select name="location"><option value="eastus">East US</option><option value="westus">West US</option></select></div>
                          <div className="form-group"><label>Firewall SKU *</label><select name="sku"><option value="Standard">Standard</option><option value="Premium">Premium</option><option value="Basic">Basic</option></select></div>
                          <div className="form-group"><label>Threat intelligence mode *</label><select name="threatIntelMode"><option value="Alert">Alert only</option><option value="Deny">Alert and deny</option><option value="Off">Off</option></select></div>
                          <div className="form-group"><label>Virtual network *</label><select name="vnetId" required><option value="">Select</option>{Object.values(vnets).map(v => <option key={v.id} value={v.id}>{v.name}</option>)}</select></div>

                          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                            <button type="submit" className="azure-btn-primary">Review + create</button>
                            <button type="button" className="azure-btn-default" onClick={() => setShowCreateFw(false)}>Cancel</button>
                          </div>
                        </form>
                      </div>
                    ) : (
                      <table className="azure-table azure-hover-table" style={{ marginTop: 20 }}>
                        <thead><tr><th>Name</th><th>Resource group</th><th>Location</th><th>SKU</th><th>Virtual network</th></tr></thead>
                        <tbody>
                          {Object.values(firewalls).map(f => {
                            const parentVnet = vnets[f.vnetId];
                            return (
                            <tr key={f.id}>
                              <td className="resource-name"><Flame size={16} /> {f.name}</td>
                              <td>{f.resourceGroup}</td><td>{f.location}</td><td>{f.sku}</td><td>{parentVnet?.name || 'Unknown'}</td>
                            </tr>
                          )})}
                          {Object.values(firewalls).length === 0 && (
                            <tr><td colSpan={5} style={{ textAlign: 'center', color: '#666' }}>No Firewalls to display.</td></tr>
                          )}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}

                {activeTab === 'appGateways' && (
                  <div>
                    <div className="azure-content-header" style={{ paddingLeft: 0 }}>Application gateways</div>
                    <div className="azure-toolbar" style={{ paddingLeft: 0, borderBottom: 'none' }}>
                      <button className="azure-btn-primary" onClick={() => setShowCreateAgw(true)}><Plus size={14} /> Create</button>
                    </div>
                    {showCreateAgw ? (
                      <div className="azure-form-container" style={{ marginTop: 20 }}>
                        <form onSubmit={handleCreateAgw} className="azure-form">
                          <div className="form-group"><label>Resource group *</label><select name="resourceGroup" required><option value="">Select</option>{Object.keys(resourceGroups).map(rg => <option key={rg} value={rg}>{rg}</option>)}</select></div>
                          <div className="form-group"><label>Application gateway name *</label><input type="text" name="name" required placeholder="e.g., myAppGateway" /></div>
                          <div className="form-group"><label>Region *</label><select name="location"><option value="eastus">East US</option><option value="westus">West US</option></select></div>
                          <div className="form-group"><label>Tier *</label><select name="sku"><option value="Standard_v2">Standard V2</option><option value="WAF_v2">WAF V2</option></select></div>
                          <div className="form-group"><label>Instance count *</label><input type="number" name="capacity" defaultValue="2" /></div>
                          <div className="form-group"><label>Virtual network *</label><select name="vnetId" required><option value="">Select</option>{Object.values(vnets).map(v => <option key={v.id} value={v.id}>{v.name}</option>)}</select></div>

                          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                            <button type="submit" className="azure-btn-primary">Review + create</button>
                            <button type="button" className="azure-btn-default" onClick={() => setShowCreateAgw(false)}>Cancel</button>
                          </div>
                        </form>
                      </div>
                    ) : (
                      <table className="azure-table azure-hover-table" style={{ marginTop: 20 }}>
                        <thead><tr><th>Name</th><th>Resource group</th><th>Location</th><th>Tier</th><th>Instances</th></tr></thead>
                        <tbody>
                          {Object.values(appGateways).map(a => (
                            <tr key={a.id}>
                              <td className="resource-name"><Split size={16} /> {a.name}</td>
                              <td>{a.resourceGroup}</td><td>{a.location}</td><td>{a.tier}</td><td>{a.capacity}</td>
                            </tr>
                          ))}
                          {Object.values(appGateways).length === 0 && (
                            <tr><td colSpan={5} style={{ textAlign: 'center', color: '#666' }}>No Application gateways to display.</td></tr>
                          )}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}

                {activeTab === 'publicIps' && (
                  <div>
                    <div className="azure-content-header" style={{ paddingLeft: 0 }}>Public IP addresses</div>
                    <div className="azure-toolbar" style={{ paddingLeft: 0, borderBottom: 'none' }}>
                      <button className="azure-btn-primary" onClick={() => setShowCreatePip(true)}><Plus size={14} /> Create</button>
                    </div>
                    {showCreatePip ? (
                      <div className="azure-form-container" style={{ marginTop: 20 }}>
                        <form onSubmit={handleCreatePip} className="azure-form">
                          <div className="form-group"><label>Resource group *</label><select name="resourceGroup" required><option value="">Select</option>{Object.keys(resourceGroups).map(rg => <option key={rg} value={rg}>{rg}</option>)}</select></div>
                          <div className="form-group"><label>Name *</label><input type="text" name="name" required placeholder="e.g., pip-web-01" /></div>
                          <div className="form-group"><label>Region *</label><select name="location"><option value="eastus">East US</option><option value="westus">West US</option></select></div>
                          <div className="form-group"><label>SKU *</label><select name="sku"><option value="Standard">Standard</option><option value="Basic">Basic</option></select></div>
                          <div className="form-group"><label>Allocation method *</label><select name="allocationMethod"><option value="Static">Static</option><option value="Dynamic">Dynamic</option></select></div>

                          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                            <button type="submit" className="azure-btn-primary">Review + create</button>
                            <button type="button" className="azure-btn-default" onClick={() => setShowCreatePip(false)}>Cancel</button>
                          </div>
                        </form>
                      </div>
                    ) : (
                      <table className="azure-table azure-hover-table" style={{ marginTop: 20 }}>
                        <thead><tr><th>Name</th><th>Resource group</th><th>Location</th><th>IP address</th><th>SKU</th></tr></thead>
                        <tbody>
                          {Object.values(publicIps).map(p => (
                            <tr key={p.id}>
                              <td className="resource-name"><Globe size={16} /> {p.name}</td>
                              <td>{p.resourceGroup}</td><td>{p.location}</td><td>{p.ipAddress || '--'}</td><td>{p.sku}</td>
                            </tr>
                          ))}
                          {Object.values(publicIps).length === 0 && (
                            <tr><td colSpan={5} style={{ textAlign: 'center', color: '#666' }}>No Public IPs to display.</td></tr>
                          )}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}

                {activeTab === 'nics' && (
                  <div>
                    <div className="azure-content-header" style={{ paddingLeft: 0 }}>Network interfaces</div>
                    <div className="azure-toolbar" style={{ paddingLeft: 0, borderBottom: 'none' }}>
                      <button className="azure-btn-primary" onClick={() => setShowCreateNic(true)}><Plus size={14} /> Create</button>
                    </div>
                    {showCreateNic ? (
                      <div className="azure-form-container" style={{ marginTop: 20 }}>
                        <form onSubmit={handleCreateNic} className="azure-form">
                          <div className="form-group"><label>Resource group *</label><select name="resourceGroup" required><option value="">Select</option>{Object.keys(resourceGroups).map(rg => <option key={rg} value={rg}>{rg}</option>)}</select></div>
                          <div className="form-group"><label>Name *</label><input type="text" name="name" required placeholder="e.g., nic-web-01" /></div>
                          <div className="form-group"><label>Region *</label><select name="location"><option value="eastus">East US</option><option value="westus">West US</option></select></div>
                          <div className="form-group"><label>Subnet *</label><select name="subnetId" required><option value="">Select</option>{Object.values(vnets).flatMap(v => v.subnets.map(s => <option key={s.id} value={s.id}>{v.name} / {s.name}</option>))}</select></div>
                          <div className="form-group"><label>Public IP address (Optional)</label><select name="publicIpAddressId"><option value="">None</option>{Object.values(publicIps).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
                          <div className="form-group"><label>Network security group (Optional)</label><select name="nsgId"><option value="">None</option>{Object.values(nsgs).map(n => <option key={n.id} value={n.id}>{n.name}</option>)}</select></div>

                          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                            <button type="submit" className="azure-btn-primary">Review + create</button>
                            <button type="button" className="azure-btn-default" onClick={() => setShowCreateNic(false)}>Cancel</button>
                          </div>
                        </form>
                      </div>
                    ) : (
                      <table className="azure-table azure-hover-table" style={{ marginTop: 20 }}>
                        <thead><tr><th>Name</th><th>Resource group</th><th>Location</th><th>Private IP</th><th>Public IP</th></tr></thead>
                        <tbody>
                          {Object.values(nics).map(n => {
                            const pip = n.publicIpAddressId ? publicIps[n.publicIpAddressId]?.ipAddress : '--';
                            return (
                            <tr key={n.id}>
                              <td className="resource-name"><Plug size={16} /> {n.name}</td>
                              <td>{n.resourceGroup}</td><td>{n.location}</td><td>{n.privateIpAddress}</td><td>{pip}</td>
                            </tr>
                          )})}
                          {Object.values(nics).length === 0 && (
                            <tr><td colSpan={5} style={{ textAlign: 'center', color: '#666' }}>No Network interfaces to display.</td></tr>
                          )}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}

                {activeTab === 'bastions' && (
                  <div>
                    <div className="azure-content-header" style={{ paddingLeft: 0 }}>Bastions</div>
                    <div className="azure-toolbar" style={{ paddingLeft: 0, borderBottom: 'none' }}>
                      <button className="azure-btn-primary" onClick={() => setShowCreateBastion(true)}><Plus size={14} /> Create</button>
                    </div>
                    {showCreateBastion ? (
                      <div className="azure-form-container" style={{ marginTop: 20 }}>
                        <form onSubmit={handleCreateBastion} className="azure-form">
                          <div className="form-group"><label>Resource group *</label><select name="resourceGroup" required><option value="">Select</option>{Object.keys(resourceGroups).map(rg => <option key={rg} value={rg}>{rg}</option>)}</select></div>
                          <div className="form-group"><label>Name *</label><input type="text" name="name" required placeholder="e.g., vnet-bastion" /></div>
                          <div className="form-group"><label>Region *</label><select name="location"><option value="eastus">East US</option><option value="westus">West US</option></select></div>
                          <div className="form-group"><label>Tier *</label><select name="sku"><option value="Basic">Basic</option><option value="Standard">Standard</option></select></div>
                          <div className="form-group"><label>Virtual network *</label><select name="vnetId" required><option value="">Select</option>{Object.values(vnets).map(v => <option key={v.id} value={v.id}>{v.name}</option>)}</select></div>
                          <div className="form-group"><label>Public IP address *</label><select name="publicIpAddressId" required><option value="">Select</option>{Object.values(publicIps).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>

                          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                            <button type="submit" className="azure-btn-primary">Review + create</button>
                            <button type="button" className="azure-btn-default" onClick={() => setShowCreateBastion(false)}>Cancel</button>
                          </div>
                        </form>
                      </div>
                    ) : (
                      <table className="azure-table azure-hover-table" style={{ marginTop: 20 }}>
                        <thead><tr><th>Name</th><th>Resource group</th><th>Location</th><th>Tier</th><th>Virtual network</th></tr></thead>
                        <tbody>
                          {Object.values(bastions).map(b => {
                            const vnet = vnets[b.vnetId]?.name || 'Unknown';
                            return (
                            <tr key={b.id}>
                              <td className="resource-name"><ShieldCheck size={16} /> {b.name}</td>
                              <td>{b.resourceGroup}</td><td>{b.location}</td><td>{b.sku}</td><td>{vnet}</td>
                            </tr>
                          )})}
                          {Object.values(bastions).length === 0 && (
                            <tr><td colSpan={5} style={{ textAlign: 'center', color: '#666' }}>No Bastions to display.</td></tr>
                          )}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}

              </div>
            )}

            {activeTab === 'entraGroups' && (
              <div className="azure-content-scroll">
                <div className="azure-content-header" style={{ paddingLeft: 0 }}>Groups | All groups</div>
                <div className="azure-toolbar" style={{ paddingLeft: 0, borderBottom: 'none' }}>
                  <button className="azure-btn-primary" onClick={() => setShowCreateEntraGroup(true)}><Plus size={14} /> New group</button>
                </div>
                {showCreateEntraGroup ? (
                  <div className="azure-form-container" style={{ marginTop: 20 }}>
                    <form onSubmit={handleCreateEntraGroup} className="azure-form">
                      <div className="form-group"><label>Group type *</label><select name="groupType"><option value="Security">Security</option><option value="Microsoft 365">Microsoft 365</option></select></div>
                      <div className="form-group"><label>Group name *</label><input type="text" name="displayName" required /></div>
                      <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                        <button type="submit" className="azure-btn-primary">Create</button>
                        <button type="button" className="azure-btn-default" onClick={() => setShowCreateEntraGroup(false)}>Cancel</button>
                      </div>
                    </form>
                  </div>
                ) : (
                  <table className="azure-table azure-hover-table" style={{ marginTop: 20 }}>
                    <thead><tr><th>Display name</th><th>Group type</th><th>Object ID</th></tr></thead>
                    <tbody>
                      {Object.values(entraGroups).map(g => (
                        <tr key={g.id}>
                          <td className="resource-name"><UsersRound size={16} /> {g.displayName}</td>
                          <td>{g.groupType}</td><td>{g.id}</td>
                        </tr>
                      ))}
                      {Object.values(entraGroups).length === 0 && (
                        <tr><td colSpan={3} style={{ textAlign: 'center', color: '#666' }}>No groups to display.</td></tr>
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {activeTab === 'appServicePlans' && (
              <div className="azure-content-scroll">
                <div className="azure-content-header" style={{ paddingLeft: 0 }}>App Service plans</div>
                <div className="azure-toolbar" style={{ paddingLeft: 0, borderBottom: 'none' }}>
                  <button className="azure-btn-primary" onClick={() => setShowCreateAsp(true)}><Plus size={14} /> Create</button>
                </div>
                {showCreateAsp ? (
                  <div className="azure-form-container" style={{ marginTop: 20 }}>
                    <form onSubmit={handleCreateAsp} className="azure-form">
                      <div className="form-group"><label>Resource group *</label><select name="resourceGroup" required><option value="">Select</option>{Object.keys(resourceGroups).map(rg => <option key={rg} value={rg}>{rg}</option>)}</select></div>
                      <div className="form-group"><label>Name *</label><input type="text" name="name" required /></div>
                      <div className="form-group"><label>Operating System *</label><select name="os"><option value="Linux">Linux</option><option value="Windows">Windows</option></select></div>
                      <div className="form-group"><label>Region *</label><select name="location"><option value="eastus">East US</option><option value="westus">West US</option></select></div>
                      <div className="form-group"><label>Pricing tier *</label><select name="sku"><option value="F1">F1 (Free)</option><option value="B1">B1 (Basic)</option><option value="S1">S1 (Standard)</option><option value="P1v2">P1v2 (Premium)</option></select></div>
                      <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                        <button type="submit" className="azure-btn-primary">Create</button>
                        <button type="button" className="azure-btn-default" onClick={() => setShowCreateAsp(false)}>Cancel</button>
                      </div>
                    </form>
                  </div>
                ) : (
                  <table className="azure-table azure-hover-table" style={{ marginTop: 20 }}>
                    <thead><tr><th>Name</th><th>Resource group</th><th>Location</th><th>SKU</th><th>OS</th></tr></thead>
                    <tbody>
                      {Object.values(appServicePlans).map(p => (
                        <tr key={p.id}>
                          <td className="resource-name"><Layers size={16} /> {p.name}</td>
                          <td>{p.resourceGroup}</td><td>{p.location}</td><td>{p.sku}</td><td>{p.os}</td>
                        </tr>
                      ))}
                      {Object.values(appServicePlans).length === 0 && (
                        <tr><td colSpan={5} style={{ textAlign: 'center', color: '#666' }}>No App Service plans to display.</td></tr>
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {activeTab === 'managedIdentities' && (
              <div className="azure-content-scroll">
                <div className="azure-content-header" style={{ paddingLeft: 0 }}>Managed Identities</div>
                <div className="azure-toolbar" style={{ paddingLeft: 0, borderBottom: 'none' }}>
                  <button className="azure-btn-primary" onClick={() => setShowCreateMi(true)}><Plus size={14} /> Create</button>
                </div>
                {showCreateMi ? (
                  <div className="azure-form-container" style={{ marginTop: 20 }}>
                    <form onSubmit={handleCreateMi} className="azure-form">
                      <div className="form-group"><label>Resource group *</label><select name="resourceGroup" required><option value="">Select</option>{Object.keys(resourceGroups).map(rg => <option key={rg} value={rg}>{rg}</option>)}</select></div>
                      <div className="form-group"><label>Name *</label><input type="text" name="name" required /></div>
                      <div className="form-group"><label>Region *</label><select name="location"><option value="eastus">East US</option><option value="westus">West US</option></select></div>
                      <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                        <button type="submit" className="azure-btn-primary">Create</button>
                        <button type="button" className="azure-btn-default" onClick={() => setShowCreateMi(false)}>Cancel</button>
                      </div>
                    </form>
                  </div>
                ) : (
                  <table className="azure-table azure-hover-table" style={{ marginTop: 20 }}>
                    <thead><tr><th>Name</th><th>Resource group</th><th>Location</th><th>Client ID</th></tr></thead>
                    <tbody>
                      {Object.values(managedIdentities).map(m => (
                        <tr key={m.id}>
                          <td className="resource-name"><Fingerprint size={16} /> {m.name}</td>
                          <td>{m.resourceGroup}</td><td>{m.location}</td><td>{m.clientId}</td>
                        </tr>
                      ))}
                      {Object.values(managedIdentities).length === 0 && (
                        <tr><td colSpan={4} style={{ textAlign: 'center', color: '#666' }}>No Managed Identities to display.</td></tr>
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {activeTab === 'advisor' && (
              <div className="azure-content-scroll">
                <div className="azure-content-header" style={{ paddingLeft: 0 }}>Advisor | Recommendations</div>
                <div className="azure-toolbar" style={{ paddingLeft: 0, borderBottom: 'none' }}>
                  <button className="azure-toolbar-btn" onClick={() => refreshAdvisor()}><Activity size={14} /> Refresh</button>
                </div>
                <div style={{ display: 'flex', gap: 20, marginTop: 20 }}>
                  <div className="azure-dash-card" style={{ flex: 1, borderTop: '4px solid #d13438' }}>
                    <h4 style={{ margin: 0 }}>High Impact</h4>
                    <div style={{ fontSize: 24, fontWeight: 600 }}>{recommendations.filter(r => r.impact === 'High').length}</div>
                  </div>
                  <div className="azure-dash-card" style={{ flex: 1, borderTop: '4px solid #ffaa44' }}>
                    <h4 style={{ margin: 0 }}>Medium Impact</h4>
                    <div style={{ fontSize: 24, fontWeight: 600 }}>{recommendations.filter(r => r.impact === 'Medium').length}</div>
                  </div>
                  <div className="azure-dash-card" style={{ flex: 1, borderTop: '4px solid #0078d4' }}>
                    <h4 style={{ margin: 0 }}>Low Impact</h4>
                    <div style={{ fontSize: 24, fontWeight: 600 }}>{recommendations.filter(r => r.impact === 'Low').length}</div>
                  </div>
                </div>
                <table className="azure-table" style={{ marginTop: 20 }}>
                  <thead><tr><th>Description</th><th>Category</th><th>Impact</th></tr></thead>
                  <tbody>
                    {recommendations.map(r => (
                      <tr key={r.id}>
                        <td>{r.description}</td>
                        <td>{r.category}</td>
                        <td style={{ color: r.impact === 'High' ? '#d13438' : r.impact === 'Medium' ? '#ffaa44' : '#0078d4', fontWeight: 600 }}>{r.impact}</td>
                      </tr>
                    ))}
                    {recommendations.length === 0 && (
                      <tr><td colSpan={3} style={{ textAlign: 'center', padding: 20 }}>No recommendations found. Great job!</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'policy' && (
              <div className="azure-content-scroll">
                <div className="azure-content-header" style={{ paddingLeft: 0 }}>Policy | Compliance</div>
                <div className="azure-toolbar" style={{ paddingLeft: 0, borderBottom: 'none' }}>
                  <button className="azure-toolbar-btn" onClick={() => refreshCompliance()}><Shield size={14} /> Refresh</button>
                </div>
                <table className="azure-table" style={{ marginTop: 20 }}>
                  <thead><tr><th>Resource</th><th>Policy</th><th>Compliance state</th></tr></thead>
                  <tbody>
                    {compliance.map((c, i) => {
                      const resName = allResources.find(r => (r as any).name === c.resourceId || (r as any).id === c.resourceId)?.name || c.resourceId;
                      return (
                        <tr key={i}>
                          <td>{resName}</td>
                          <td>{c.policyDefinitionName}</td>
                          <td style={{ color: c.complianceState === 'Compliant' ? '#107c10' : '#d13438', fontWeight: 600 }}>
                            {c.complianceState} {c.reason && <span style={{ fontWeight: 400, fontSize: 12, display: 'block', color: '#666' }}>{c.reason}</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'networkWatcher' && (
              <div className="azure-content-scroll">
                <NetworkWatcherBlade vms={Object.values(vms)} />
              </div>
            )}

            {activeTab === 'entraId' && (
              <div className="azure-content-scroll">
                <div className="azure-content-header" style={{ paddingLeft: 0, paddingRight: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Users size={24} color="#0078D4" /> Microsoft Entra ID
                  </div>
                </div>
                
                <div className="azure-toolbar" style={{ borderBottom: 'none', paddingLeft: 0 }}>
                  <button className="azure-btn-primary" onClick={() => setShowCreateUser(true)}><Plus size={14} /> New user</button>
                </div>

                {showCreateUser ? (
                  <div className="azure-form-container" style={{ marginTop: 20 }}>
                    <form onSubmit={handleCreateUser} className="azure-form">
                      <div className="form-group"><label>Display name *</label><input type="text" name="displayName" required placeholder="e.g., Jane Doe" /></div>
                      <div className="form-group"><label>User principal name *</label><input type="text" name="userPrincipalName" required placeholder="e.g., jane@contoso.com" /></div>
                      <div className="form-group"><label>Department</label><input type="text" name="department" placeholder="e.g., IT" /></div>
                      <div className="form-group"><label>Job title</label><input type="text" name="jobTitle" placeholder="e.g., Cloud Architect" /></div>

                      <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                        <button type="submit" className="azure-btn-primary">Create</button>
                        <button type="button" className="azure-btn-default" onClick={() => setShowCreateUser(false)}>Cancel</button>
                      </div>
                    </form>
                  </div>
                ) : (
                  <table className="azure-table azure-hover-table" style={{ marginTop: 20 }}>
                    <thead><tr><th>Display name</th><th>User principal name</th><th>Department</th><th>Job title</th></tr></thead>
                    <tbody>
                      {Object.values(entraUsers).map(user => (
                        <tr key={user.id}>
                          <td className="resource-name"><UserCircle size={16} /> {user.displayName}</td>
                          <td>{user.userPrincipalName}</td>
                          <td>{user.department || '-'}</td>
                          <td>{user.jobTitle || '-'}</td>
                        </tr>
                      ))}
                      {Object.values(entraUsers).length === 0 && (
                        <tr><td colSpan={4} style={{ textAlign: 'center', color: '#666' }}>No users found in this directory.</td></tr>
                      )}
                    </tbody>
                  </table>
                )}

                <div className="azure-content-header" style={{ paddingLeft: 0, paddingRight: 0, marginTop: 40 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Shield size={24} color="#0078D4" /> Role assignments (IAM)
                  </div>
                </div>
                
                <div className="azure-toolbar" style={{ borderBottom: 'none', paddingLeft: 0 }}>
                  <button className="azure-btn-primary" onClick={() => setShowCreateRole(true)}><Plus size={14} /> Add role assignment</button>
                </div>

                {showCreateRole ? (
                  <div className="azure-form-container" style={{ marginTop: 20 }}>
                    <form onSubmit={handleCreateRole} className="azure-form">
                      <div className="form-group"><label>Role *</label><select name="roleDefinition" required><option value="Owner">Owner</option><option value="Contributor">Contributor</option><option value="Reader">Reader</option></select></div>
                      <div className="form-group"><label>Assign access to (User) *</label><select name="principalId" required><option value="">Select a user</option>{Object.values(entraUsers).map(u => <option key={u.id} value={u.id}>{u.displayName} ({u.userPrincipalName})</option>)}</select></div>
                      <div className="form-group"><label>Scope (Resource Group) *</label><select name="scope" required><option value="Subscription">Entire Subscription</option>{Object.values(resourceGroups).map(rg => <option key={rg.name} value={rg.name}>{rg.name}</option>)}</select></div>

                      <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                        <button type="submit" className="azure-btn-primary">Review + assign</button>
                        <button type="button" className="azure-btn-default" onClick={() => setShowCreateRole(false)}>Cancel</button>
                      </div>
                    </form>
                  </div>
                ) : (
                  <table className="azure-table azure-hover-table" style={{ marginTop: 20 }}>
                    <thead><tr><th>User</th><th>Role</th><th>Scope</th></tr></thead>
                    <tbody>
                      {Object.values(roleAssignments).map(role => {
                        const user = entraUsers[role.principalId];
                        return (
                          <tr key={role.id}>
                            <td className="resource-name"><UserCircle size={16} /> {user?.displayName || 'Unknown User'}</td>
                            <td>{role.roleDefinition}</td>
                            <td>{role.scope}</td>
                          </tr>
                        );
                      })}
                      {Object.values(roleAssignments).length === 0 && (
                        <tr><td colSpan={3} style={{ textAlign: 'center', color: '#666' }}>No role assignments found.</td></tr>
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>
          </ErrorBoundary>
        </div>
        
        {/* Cloud Shell Overlay */}
        {showCloudShell && <AzureCloudShell onClose={() => setShowCloudShell(false)} />}
        
        {/* CLI Lab Selector */}
        {showCliLab && <CliLabSelector onClose={() => setShowCliLab(false)} onOpenShell={() => setShowCloudShell(true)} />}
      </div>
    </div>
  );
}
