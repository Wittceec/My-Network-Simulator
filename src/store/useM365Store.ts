import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { M365State, M365License, SharedMailbox, SharePointSite } from '../types/m365';

export const useM365Store = create<M365State>()(
  persist(
    (set) => ({
      users: {},
      sharedMailboxes: {},
      sites: {},

      updateUserLicense: (id: string, license: M365License) => set((state) => {
        const user = state.users[id];
        if (!user) return state;
        return {
          users: {
            ...state.users,
            [id]: { ...user, license }
          }
        };
      }),

      enableMailbox: (id: string) => set((state) => {
        const user = state.users[id];
        if (!user) return state;
        return {
          users: {
            ...state.users,
            [id]: { ...user, mailboxEnabled: true }
          }
        };
      }),

      setForwarding: (id: string, forwardingAddress: string | undefined) => set((state) => {
        const user = state.users[id];
        if (!user) return state;
        return {
          users: {
            ...state.users,
            [id]: { ...user, forwardingAddress }
          }
        };
      }),

      createSharedMailbox: (mailbox: SharedMailbox) => set((state) => ({
        sharedMailboxes: { ...state.sharedMailboxes, [mailbox.id]: mailbox }
      })),

      addDelegateToSharedMailbox: (mailboxId: string, userId: string) => set((state) => {
        const sm = state.sharedMailboxes[mailboxId];
        if (!sm) return state;
        if (sm.delegates.includes(userId)) return state;
        return {
          sharedMailboxes: {
            ...state.sharedMailboxes,
            [mailboxId]: { ...sm, delegates: [...sm.delegates, userId] }
          }
        };
      }),

      createSite: (site: SharePointSite) => set((state) => ({
        sites: { ...state.sites, [site.id]: site }
      }))
    }),
    {
      name: 'network-sim-m365-storage',
    }
  )
);
