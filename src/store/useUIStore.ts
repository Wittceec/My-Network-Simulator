import { create } from 'zustand';

interface UIState {
  openTerminals: string[];
  openTerminal: (id: string) => void;
  closeTerminal: (id: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
  openTerminals: [],
  openTerminal: (id) => set((state) => ({
    // Only add it if it isn't already open
    openTerminals: state.openTerminals.includes(id) 
      ? state.openTerminals 
      : [...state.openTerminals, id]
  })),
  closeTerminal: (id) => set((state) => ({
    // Remove the specific terminal from the array
    openTerminals: state.openTerminals.filter(terminalId => terminalId !== id)
  })),
}));