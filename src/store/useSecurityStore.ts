import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SecurityState, SecurityLog, FirewallRule } from '../types/security';

export const useSecurityStore = create<SecurityState>()(
  persist(
    (set) => ({
      logs: [],
      firewallRules: {},

      addLog: (log: SecurityLog) => set((state) => ({
        logs: [log, ...state.logs].slice(0, 1000) // Keep max 1000 logs to prevent lag
      })),

      addLogs: (newLogs: SecurityLog[]) => set((state) => ({
        logs: [...newLogs, ...state.logs].slice(0, 1000)
      })),

      clearLogs: () => set({ logs: [] }),

      addFirewallRule: (rule: FirewallRule) => set((state) => ({
        firewallRules: { ...state.firewallRules, [rule.id]: rule }
      })),

      removeFirewallRule: (id: string) => set((state) => {
        const rules = { ...state.firewallRules };
        delete rules[id];
        return { firewallRules: rules };
      }),

      updateFirewallRule: (id: string, updates: Partial<FirewallRule>) => set((state) => {
        const rule = state.firewallRules[id];
        if (!rule) return state;
        return {
          firewallRules: {
            ...state.firewallRules,
            [id]: { ...rule, ...updates }
          }
        };
      })
    }),
    {
      name: 'network-sim-security-storage',
    }
  )
);
