export type DeviceType = 'router' | 'switch' | 'pc' | 'server';
export type PortMode = 'access' | 'trunk' | 'routed';
export type RouteProtocol = 'connected' | 'static' | 'ospf';

export interface IPv4Config {
  ip: string;
  mask: string; 
}

export interface Interface {
  id: string;          
  shortName: string;   
  isUp: boolean;       
  macAddress: string;
  ipv4?: IPv4Config;
  mode: PortMode;
  accessVlan: number; 
  trunkAllowedVlans?: number[]; 
  inboundAclId?: string;
  outboundAclId?: string;
  stpState?: 'forwarding' | 'blocking';
  // NEW: Port Security Tracker
  portSecurity?: { enabled: boolean; max: number; violation: 'shutdown' | 'restrict'; macs: string[] }; 
  description?: string;
}

export interface Route {
  network: string;
  mask: string;
  nextHopIp?: string;
  exitInterface?: string;
  protocol: RouteProtocol;
  metric: number;
}

export interface AclRule {
  sequence: number;
  action: 'permit' | 'deny';
  protocol: 'ip' | 'icmp' | 'tcp' | 'udp';
  sourceIp: string;
  sourceWildcard: string;
  destIp: string;
  destWildcard: string;
}

export interface ACL {
  id: string; 
  type: 'standard' | 'extended';
  rules: AclRule[];
}

export interface Device {
  id: string;
  hostname: string;
  type: DeviceType;
  position?: { x: number, y: number };
  interfaces: Record<string, Interface>;
  routingTable: Route[];
  macAddressTable: Record<string, any>;
  arpTable?: Record<string, string>;
  dhcpPools?: Record<string, any>; 
  vlans: Record<number, string>;
  powerOn?: boolean;
  acls: Record<string, any>;
  ospf?: { processId: string; networks: { network: string; wildcard: string; area: string }[] }; 
  isRootBridge?: boolean; 
  startupConfigSaved?: boolean;
  enableSecret?: string;
  enablePassword?: string;
  bannerMotd?: string;
  lines?: {
    console?: { password?: string; login?: boolean };
    vty?: { password?: string; login?: boolean };
  };
  domainJoined?: string; // e.g. "corp.local"
  os?: 'linux' | 'windows';
  fileSystem?: Record<string, string | Record<string, any>>; // Simplified mock filesystem
}

export interface Link {
  id: string;
  sourceDeviceId: string;
  sourceInterfaceId: string;
  targetDeviceId: string;
  targetInterfaceId: string;
}