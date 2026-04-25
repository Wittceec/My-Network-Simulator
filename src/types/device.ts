export type DeviceType = 'router' | 'switch' | 'pc';
export type PortMode = 'access' | 'trunk' | 'routed';
export type RouteProtocol = 'connected' | 'static' | 'ospf';

export interface IPv4Config {
  ip: string;
  mask: string; 
}

export interface NetworkInterface {
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
  interfaces: Record<string, Interface>;
  routingTable: Route[];
  macAddressTable: Record<string, any>;
  arpTable?: Record<string, string>;
  dhcpPools?: Record<string, any>; // Add this line!
  vlans: Record<number, string>;
  acls: Record<string, any>;
}