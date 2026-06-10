import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface HyperVM {
  id: string;
  name: string;
  state: 'Running' | 'Off' | 'Saved' | 'Paused';
  cpuUsage: number;
  memoryAssigned: number;
  uptime: number;
  virtualSwitch?: string; // e.g. "External Virtual Switch"
  checkpoints?: string[]; // list of checkpoint names
}

export interface FileShare {
  id: string;
  name: string;
  path: string;
  ntfsPermissions: Record<string, 'Read' | 'Modify' | 'FullControl'>; // map of group/user name to permission
  quotaLimit?: number; // MB
  fileScreening?: string[]; // extensions like ".mp3"
}

interface ServerState {
  vms: Record<string, HyperVM>;
  shares: Record<string, FileShare>;
  
  createVM: (vm: HyperVM) => void;
  updateVMState: (id: string, state: HyperVM['state']) => void;
  updateVM: (id: string, updates: Partial<HyperVM>) => void;
  
  createShare: (share: FileShare) => void;
  updateSharePermission: (shareId: string, principal: string, permission: 'Read' | 'Modify' | 'FullControl' | 'Remove') => void;
  updateShare: (id: string, updates: Partial<FileShare>) => void;
  
  seedDefaultServers: () => void;
}

export const useServerStore = create<ServerState>()(
  persist(
    (set, get) => ({

  vms: {},
  shares: {},

  createVM: (vm) => set((state) => ({ vms: { ...state.vms, [vm.id]: vm } })),
  updateVMState: (id, vmState) => set((state) => {
    const vm = state.vms[id];
    if (!vm) return state;
    return { vms: { ...state.vms, [id]: { ...vm, state: vmState } } };
  }),
  updateVM: (id, updates: Partial<HyperVM>) => set((state) => {
    const vm = state.vms[id];
    if (!vm) return state;
    return { vms: { ...state.vms, [id]: { ...vm, ...updates } } };
  }),

  createShare: (share) => set((state) => ({ shares: { ...state.shares, [share.id]: share } })),
  updateShare: (id, updates: Partial<FileShare>) => set((state) => {
    const share = state.shares[id];
    if (!share) return state;
    return { shares: { ...state.shares, [id]: { ...share, ...updates } } };
  }),
  updateSharePermission: (shareId, principal, permission) => set((state) => {
    const share = state.shares[shareId];
    if (!share) return state;
    const newPerms = { ...share.ntfsPermissions };
    if (permission === 'Remove') {
      delete newPerms[principal];
    } else {
      newPerms[principal] = permission;
    }
    return { shares: { ...state.shares, [shareId]: { ...share, ntfsPermissions: newPerms } } };
  }),

  seedDefaultServers: () => {
    const state = get();
    if (Object.keys(state.vms).length > 0) return;

    set({
      vms: {
        'vm-file01': { id: 'vm-file01', name: 'FILE01', state: 'Running', cpuUsage: 12, memoryAssigned: 4096, uptime: 360000 },
        'vm-print01': { id: 'vm-print01', name: 'PRINT01', state: 'Running', cpuUsage: 2, memoryAssigned: 2048, uptime: 1200000 },
        'vm-app01': { id: 'vm-app01', name: 'APP-LEGACY', state: 'Off', cpuUsage: 0, memoryAssigned: 8192, uptime: 0 }
      },
      shares: {
        'share-public': { id: 'share-public', name: 'Public', path: 'C:\\Shares\\Public', ntfsPermissions: { 'Domain Users': 'Modify', 'Administrators': 'FullControl' } },
        'share-finance': { id: 'share-finance', name: 'Finance', path: 'D:\\Shares\\Finance', ntfsPermissions: { 'Finance': 'Modify', 'Administrators': 'FullControl' } },
        'share-hr': { id: 'share-hr', name: 'HR', path: 'D:\\Shares\\HR', ntfsPermissions: { 'Administrators': 'FullControl' } } // Missing HR group permission
      }
    });
  }

    }),
    {
      name: 'network-sim-useserverstore-storage',
    }
  )
);
