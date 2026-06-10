export type LogSeverity = 'Info' | 'Warning' | 'Error' | 'Critical';

export interface SecurityLog {
  id: string;
  timestamp: number;
  sourceIp: string;
  destinationIp: string;
  action: 'Allowed' | 'Denied' | 'Failed Login' | 'Successful Login' | 'Malware Detected';
  protocol: 'TCP' | 'UDP' | 'ICMP' | 'HTTP' | 'HTTPS' | 'RDP' | 'SSH';
  port: number;
  severity: LogSeverity;
  message: string;
}

export interface FirewallRule {
  id: string;
  name: string;
  action: 'Allow' | 'Deny';
  sourceIp: string; // can be 'Any'
  destinationIp: string; // can be 'Any'
  destinationPort: string; // e.g. '80', '443', 'Any'
  protocol: 'TCP' | 'UDP' | 'Any';
  priority: number;
}

export interface SecurityState {
  logs: SecurityLog[];
  firewallRules: Record<string, FirewallRule>;
  
  addLog: (log: SecurityLog) => void;
  addLogs: (logs: SecurityLog[]) => void;
  clearLogs: () => void;
  
  addFirewallRule: (rule: FirewallRule) => void;
  removeFirewallRule: (id: string) => void;
  updateFirewallRule: (id: string, rule: Partial<FirewallRule>) => void;
}
