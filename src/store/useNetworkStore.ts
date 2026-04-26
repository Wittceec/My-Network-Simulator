import { create } from 'zustand';
import type { Device, Link } from '../types/device';

interface NetworkState {
  devices: Record<string, Device>;
  links: Record<string, Link>;
  activeLink: string | null;
  addDevice: (device: Device) => void;
  updateDevice: (id: string, updater: (device: Device) => Device) => void;
  removeDevice: (id: string) => void; // NEW
  addLink: (link: Link) => void;
  removeLink: (id: string) => void;   // NEW
  loadLab: (devices: Record<string, Device>, links: Record<string, Link>) => void;
  setActiveLink: (linkId: string | null) => void;
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
  // NEW: Deletes the device AND any cables attached to it
  removeDevice: (id) => set((state) => {
    const newDevices = { ...state.devices };
    delete newDevices[id];
    
    const newLinks = { ...state.links };
    Object.keys(newLinks).forEach(linkId => {
      if (newLinks[linkId].sourceDeviceId === id || newLinks[linkId].targetDeviceId === id) {
        delete newLinks[linkId];
      }
    });
    return { devices: newDevices, links: newLinks };
  }),
  addLink: (link) => set((state) => ({ links: { ...state.links, [link.id]: link } })),
  // NEW: Deletes just the cable
  removeLink: (id) => set((state) => {
    const newLinks = { ...state.links };
    delete newLinks[id];
    return { links: newLinks };
  }),
  loadLab: (devices, links) => set({ devices, links }),
  setActiveLink: (linkId) => set({ activeLink: linkId }),
}));