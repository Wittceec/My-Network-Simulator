import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { JobState, Ticket, JobRole, TicketStatus } from '../types/job';

export const useJobStore = create<JobState>()(
  persist(
    (set, get) => ({
      isClockedIn: false,
      currentRole: null,
      shiftStartTime: null,
      tickets: {},
      completedTicketsCount: 0,
      xp: 0,
      level: 1,
      budget: 50000,

      clockIn: (role: JobRole) => set({
        isClockedIn: true,
        currentRole: role,
        shiftStartTime: Date.now(),
        // We do not reset tickets or budget here so they persist between sessions
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

      addTicketNote: (id: string, note: { author: string, timestamp: number, content: string }) => set((state) => {
        const t = state.tickets[id];
        if (!t) return state;
        return {
          tickets: {
            ...state.tickets,
            [id]: { ...t, notes: [...(t.notes || []), note] }
          }
        };
      }),

      updateTicketStatus: (id: string, status: TicketStatus, notes?: string) => set((state) => {
        const ticket = state.tickets[id];
        if (!ticket) return state;

        const updatedTicket = { ...ticket, status };
        if (notes) updatedTicket.resolutionNotes = notes;
        
        let additionalCount = 0;
        let xpReward = 0;
        let budgetReward = 0;
        let newLevel = state.level;

        if (status === 'Resolved' && ticket.status !== 'Resolved') {
          additionalCount = 1;
          
          // Determine rewards based on severity
          switch(ticket.severity) {
            case 'Critical': xpReward = 500; budgetReward = 2000; break;
            case 'High': xpReward = 250; budgetReward = 1000; break;
            case 'Medium': xpReward = 100; budgetReward = 500; break;
            case 'Low': xpReward = 50; budgetReward = 200; break;
          }

          // Level up logic: every 1000 XP is a level
          const totalXp = state.xp + xpReward;
          newLevel = Math.floor(totalXp / 1000) + 1;
        }

        return {
          tickets: {
            ...state.tickets,
            [id]: updatedTicket
          },
          completedTicketsCount: state.completedTicketsCount + additionalCount,
          xp: state.xp + xpReward,
          level: newLevel,
          budget: state.budget + budgetReward
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
    }),
    {
      name: 'network-sim-job-storage',
    }
  )
);
