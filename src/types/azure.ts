export type AzureRegion = 'eastus' | 'westus' | 'northeurope' | 'westeurope' | 'southeastasia';

export interface AzureResource {
  id: string;
  name: string;
  type: string;
  location: AzureRegion;
  resourceGroup: string;
}

export interface ResourceGroup {
  name: string;
  location: AzureRegion;
}

export interface Subnet {
  id: string;
  name: string;
  addressPrefix: string;
  nsgId?: string;
  routeTableId?: string;
}

export interface VNetPeering {
  id: string;
  name: string;
  remoteVirtualNetworkId: string;
  allowVirtualNetworkAccess: boolean;
  allowForwardedTraffic: boolean;
  allowGatewayTransit: boolean;
  useRemoteGateways: boolean;
  peeringState: 'Initiated' | 'Connected' | 'Disconnected';
}

export interface VNet extends AzureResource {
  type: 'Microsoft.Network/virtualNetworks';
  addressSpace: string[];
  subnets: Subnet[];
  peerings: VNetPeering[];
}

export interface VM extends AzureResource {
  type: 'Microsoft.Compute/virtualMachines';
  size: string; // e.g., 'Standard_B1s'
  os: 'Windows' | 'Linux';
  subnetId: string;
  privateIpAddress?: string;
  publicIpAddress?: string;
  status: 'Running' | 'Stopped' | 'Deallocated';
}

export interface NSGRule {
  name: string;
  priority: number;
  direction: 'Inbound' | 'Outbound';
  access: 'Allow' | 'Deny';
  protocol: 'Tcp' | 'Udp' | 'Icmp' | 'Any';
  sourcePortRange: string;
  destinationPortRange: string;
  sourceAddressPrefix: string;
  destinationAddressPrefix: string;
}

export interface NSG extends AzureResource {
  type: 'Microsoft.Network/networkSecurityGroups';
  rules: NSGRule[];
}

export interface RouteTableRule {
  name: string;
  addressPrefix: string;
  nextHopType: 'VirtualNetworkGateway' | 'VnetLocal' | 'Internet' | 'VirtualAppliance' | 'None';
  nextHopIpAddress?: string;
}

export interface RouteTable extends AzureResource {
  type: 'Microsoft.Network/routeTables';
  routes: RouteTableRule[];
}

export interface VirtualNetworkGateway extends AzureResource {
  type: 'Microsoft.Network/virtualNetworkGateways';
  vnetId: string;
  gatewayType: 'Vpn' | 'ExpressRoute';
  vpnType: 'RouteBased' | 'PolicyBased';
  sku: 'Basic' | 'VpnGw1' | 'VpnGw2';
  bgpEnabled: boolean;
  publicIpAddress?: string;
  status: 'Provisioning' | 'Succeeded' | 'Failed';
}

export interface LoadBalancingRule {
  name: string;
  frontendPort: number;
  backendPort: number;
  protocol: 'Tcp' | 'Udp';
}

export interface LoadBalancer extends AzureResource {
  type: 'Microsoft.Network/loadBalancers';
  sku: 'Basic' | 'Standard';
  frontendIpAddress?: string;
  backendPool: string[]; // VM IDs
  rules: LoadBalancingRule[];
}

export interface StorageAccount extends AzureResource {
  type: 'Microsoft.Storage/storageAccounts';
  performance: 'Standard' | 'Premium';
  redundancy: 'LRS' | 'GRS' | 'ZRS' | 'RA-GRS';
  accessTier: 'Hot' | 'Cool';
}

export interface EntraUser {
  id: string;
  displayName: string;
  userPrincipalName: string;
  department?: string;
  jobTitle?: string;
}

export interface EntraGroup {
  id: string;
  displayName: string;
  groupType: 'Security' | 'Microsoft 365';
  members: string[]; // Array of EntraUser IDs
}

export interface RoleAssignment {
  id: string;
  principalId: string; // The User ID
  roleDefinition: 'Owner' | 'Contributor' | 'Reader';
  scope: string; // e.g. the name of the Resource Group, or 'Subscription'
}

export interface DnsRecord {
  id: string;
  name: string;
  recordType: 'A' | 'CNAME' | 'TXT' | 'MX';
  value: string;
  ttl: number;
}

export interface DnsZone extends AzureResource {
  type: 'Microsoft.Network/dnsZones' | 'Microsoft.Network/privateDnsZones';
  zoneType: 'Public' | 'Private';
  records: DnsRecord[];
  linkedVnetIds?: string[]; // Only for Private DNS Zones
}

export interface AppServicePlan extends AzureResource {
  type: 'Microsoft.Web/serverfarms';
  sku: 'F1' | 'B1' | 'S1' | 'P1v2';
  os: 'Linux' | 'Windows';
}

export interface AppService extends AzureResource {
  type: 'Microsoft.Web/sites';
  appServicePlanId: string;
  runtimeStack: string; // e.g. Node.js 18, .NET 7, Python 3.10
  status: 'Running' | 'Stopped';
}

export interface KeyVault extends AzureResource {
  type: 'Microsoft.KeyVault/vaults';
  sku: 'Standard' | 'Premium';
  softDeleteEnabled: boolean;
  purgeProtectionEnabled: boolean;
}

export interface KubernetesCluster extends AzureResource {
  type: 'Microsoft.ContainerService/managedClusters';
  kubernetesVersion: string;
  nodeCount: number;
  nodeSize: string; // e.g. Standard_DS2_v2
}

export interface VMScaleSet extends AzureResource {
  type: 'Microsoft.Compute/virtualMachineScaleSets';
  sku: string; // e.g. Standard_B2s
  capacity: number; // number of instances
  subnetId: string;
  os: 'Windows' | 'Linux';
}

export interface RecoveryServicesVault extends AzureResource {
  type: 'Microsoft.RecoveryServices/vaults';
  sku: 'Standard' | 'RS0';
  storageRedundancy: 'LocallyRedundant' | 'GeoRedundant';
}

export interface SqlServer extends AzureResource {
  type: 'Microsoft.Sql/servers';
  adminLogin: string;
}

export interface SqlDatabase extends AzureResource {
  type: 'Microsoft.Sql/servers/databases';
  serverId: string; // ID of the parent SqlServer
  sku: string; // e.g., Basic, Standard, Premium
  maxSizeBytes: number;
}

export interface LogAnalyticsWorkspace extends AzureResource {
  type: 'Microsoft.OperationalInsights/workspaces';
  sku: 'PerGB2018' | 'Free' | 'Standard';
  retentionInDays: number;
}

export interface AzureFirewall extends AzureResource {
  type: 'Microsoft.Network/azureFirewalls';
  sku: 'Standard' | 'Premium' | 'Basic';
  threatIntelMode: 'Alert' | 'Deny' | 'Off';
  vnetId: string;
}

export interface ApplicationGateway extends AzureResource {
  type: 'Microsoft.Network/applicationGateways';
  sku: 'Standard_v2' | 'WAF_v2';
  tier: 'Standard_v2' | 'WAF_v2';
  capacity: number;
  vnetId: string;
}

export interface PublicIpAddress extends AzureResource {
  type: 'Microsoft.Network/publicIPAddresses';
  sku: 'Basic' | 'Standard';
  allocationMethod: 'Static' | 'Dynamic';
  ipAddress?: string;
}

export interface NetworkInterface extends AzureResource {
  type: 'Microsoft.Network/networkInterfaces';
  subnetId: string;
  privateIpAddress: string;
  publicIpAddressId?: string;
  nsgId?: string;
}

export interface AzureBastion extends AzureResource {
  type: 'Microsoft.Network/bastionHosts';
  vnetId: string;
  publicIpAddressId: string;
  sku: 'Basic' | 'Standard';
}

export interface ManagedIdentity extends AzureResource {
  type: 'Microsoft.ManagedIdentity/userAssignedIdentities';
  clientId: string;
}

export interface AdvisorRecommendation {
  id: string;
  category: 'Cost' | 'Security' | 'High Availability' | 'Performance' | 'Operational Excellence';
  impact: 'High' | 'Medium' | 'Low';
  description: string;
  resourceId: string;
}

export interface PolicyCompliance {
  policyDefinitionName: string;
  resourceId: string;
  complianceState: 'Compliant' | 'Non-compliant';
  reason?: string;
}

export interface ConnectivityTest {
  sourceResourceId: string;
  destination: string; // IP or Resource ID
  destinationPort: number;
  protocol: 'Tcp' | 'Icmp';
  status: 'Reachable' | 'Unreachable';
  hops: string[];
  issues: string[];
}
