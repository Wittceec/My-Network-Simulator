export type JobRole = 'HelpDesk' | 'SysAdmin' | 'NetAdmin' | 'CloudArchitect' | 'SecOps';

export type TicketSeverity = 'Low' | 'Medium' | 'High' | 'Critical';
export type TicketStatus = 'Open' | 'InProgress' | 'Resolved' | 'Closed';

export interface Ticket {
  id: string;
  title: string;
  description: string;
  role: JobRole;
  severity: TicketSeverity;
  status: TicketStatus;
  createdAt: number;
  assignedTo?: string; // e.g. the user playing
  resolutionNotes?: string;
  type: string; // The specific type of simulation event (e.g., 'ad_password_reset', 'azure_vm_deploy')
  targetResourceId?: string; // AD User ID, Azure VM ID, Network Device ID
  metadata?: any; // Additional data needed to verify auto-resolution
}

export interface JobState {
  isClockedIn: boolean;
  currentRole: JobRole | null;
  shiftStartTime: number | null;
  tickets: Record<string, Ticket>;
  completedTicketsCount: number;

  clockIn: (role: JobRole) => void;
  clockOut: () => void;
  addTicket: (ticket: Ticket) => void;
  updateTicketStatus: (id: string, status: TicketStatus, notes?: string) => void;
  verifyTicketResolution: (id: string, verifyLogic: () => boolean) => boolean;
}
