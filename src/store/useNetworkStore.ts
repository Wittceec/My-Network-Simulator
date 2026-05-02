import { create } from 'zustand';
import type { Device, Link } from '../types/device';

interface NetworkState {
  devices: Record<string, Device>;
  links: Record<string, Link>;
  activeLinks: string[];
  addDevice: (device: Device) => void;
  updateDevice: (id: string, updater: (device: Device) => Device) => void;
  removeDevice: (id: string) => void; 
  addLink: (link: Link) => void;
  removeLink: (id: string) => void;   
  loadLab: (devices: Record<string, Device>, links: Record<string, Link>) => void;
  setActiveLinks: (linkIds: string[]) => void;
  toggleDevicePower: (id: string) => void;
}

export const useNetworkStore = create<NetworkState>((set) => ({
  devices: {},
  links: {},
  activeLinks: [],
  addDevice: (device) => set((state) => ({ devices: { ...state.devices, [device.id]: { ...device, powerOn: device.powerOn ?? true } } })),
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
  loadLab: (devices, links) => {
    // ensure lab devices default to powered on if not specified
    const poweredDevices = Object.fromEntries(Object.entries(devices).map(([k, v]) => [k, { ...v, powerOn: v.powerOn ?? true }]));
    set({ devices: poweredDevices, links });
  },
  setActiveLinks: (linkIds) => set({ activeLinks: linkIds }),
  toggleDevicePower: (id) => set((state) => {
    const device = state.devices[id];
    if (!device) return state;
    const isNowOn = !(device.powerOn ?? true);
    
    // If turning off, we should technically drop interface links, but setting powerOn=false handles it visually.
    return { devices: { ...state.devices, [id]: { ...device, powerOn: isNowOn } } };
  })
}));