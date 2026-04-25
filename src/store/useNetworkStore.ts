import { create } from 'zustand';
import type { Device } from '../types/device';
import type { Link } from '../types/network';

interface NetworkState {
  devices: Record<string, Device>;
  links: Record<string, Link>;
  
  // Actions
  addDevice: (device: Device) => void;
  updateDevice: (id: string, updater: (device: Device) => Device) => void;
  addLink: (link: Link) => void;
  removeLink: (id: string) => void;
  // This just defines the function signature
  loadLab: (devices: Record<string, Device>, links: Record<string, Link>) => void;
}

export const useNetworkStore = create<NetworkState>((set) => ({
  devices: {},
  links: {},

  addDevice: (device) => 
    set((state) => ({
      devices: { ...state.devices, [device.id]: device }
    })),

  updateDevice: (id, updater) =>
    set((state) => {
      const device = state.devices[id];
      if (!device) return state;
      return {
        devices: { ...state.devices, [id]: updater(device) }
      };
    }),

  addLink: (link) =>
    set((state) => ({
      links: { ...state.links, [link.id]: link }
    })),

  removeLink: (id) =>
    set((state) => {
      const newLinks = { ...state.links };
      delete newLinks[id];
      return { links: newLinks };
    }),

  // This is the actual implementation of the function
  loadLab: (devices, links) => set({ devices, links }),
}));