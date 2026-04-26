import { create } from 'zustand';
import type { Device, Link } from '../types/device';

interface NetworkState {
  devices: Record<string, Device>;
  links: Record<string, Link>;
  activeLink: string | null; // NEW: Tracks the glowing cable
  addDevice: (device: Device) => void;
  updateDevice: (id: string, updater: (device: Device) => Device) => void;
  addLink: (link: Link) => void;
  loadLab: (devices: Record<string, Device>, links: Record<string, Link>) => void;
  setActiveLink: (linkId: string | null) => void; // NEW: Function to turn the glow on/off
}

export const useNetworkStore = create<NetworkState>((set) => ({
  devices: {},
  links: {},
  activeLink: null,
  addDevice: (device) => set((state) => ({ devices: { ...state.devices, [device.id]: device } })),
  updateDevice: (id, updater) => set((state) => {
    const device = state.devices[id];
    if (!device) return state;
    return { devices: { ...state.devices, [id]: updater(device) } };
  }),
  addLink: (link) => set((state) => ({ links: { ...state.links, [link.id]: link } })),
  loadLab: (devices, links) => set({ devices, links }),
  setActiveLink: (linkId) => set({ activeLink: linkId }),
}));