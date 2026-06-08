import { create } from 'zustand';
import type { JobState, Ticket, JobRole, TicketStatus } from '../types/job';

export const useJobStore = create<JobState>((set, get) => ({
  isClockedIn: false,
  currentRole: null,
  shiftStartTime: null,
  tickets: {},
  completedTicketsCount: 0,

  clockIn: (role: JobRole) => set({
    isClockedIn: true,
    currentRole: role,
    shiftStartTime: Date.now(),
    tickets: {} // Reset tickets on new shift, or keep them if persisting
  }),

  clockOut: () => set({
    isClockedIn: false,
    currentRole: null,
    shiftStartTime: null
  }),

  addTicket: (ticket: Ticket) => set((state) => ({
    tickets: {
      ...state.tickets,
      [ticket.id]: ticket
    }
  })),

  updateTicketStatus: (id: string, status: TicketStatus, notes?: string) => set((state) => {
    const ticket = state.tickets[id];
    if (!ticket) return state;

    const updatedTicket = { ...ticket, status };
    if (notes) updatedTicket.resolutionNotes = notes;
    
    let additionalCount = 0;
    if (status === 'Resolved' && ticket.status !== 'Resolved') {
      additionalCount = 1;
    }

    return {
      tickets: {
        ...state.tickets,
        [id]: updatedTicket
      },
      completedTicketsCount: state.completedTicketsCount + additionalCount
    };
  }),

  verifyTicketResolution: (id: string, verifyLogic: () => boolean) => {
    const state = get();
    const ticket = state.tickets[id];
    if (!ticket) return false;

    const isResolved = verifyLogic();
    if (isResolved) {
      state.updateTicketStatus(id, 'Resolved', 'Auto-verified by system.');
      return true;
    }
    return false;
  }
}));
