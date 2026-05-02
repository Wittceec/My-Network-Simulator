import { create } from 'zustand';

interface UIState {
  openTerminals: string[];
  activeTerminal: string | null;
  openTerminal: (id: string) => void;
  closeTerminal: (id: string) => void;
  focusTerminal: (id: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
  openTerminals: [],
  activeTerminal: null,
  openTerminal: (id) => set((state) => ({
    openTerminals: state.openTerminals.includes(id) 
      ? state.openTerminals 
      : [...state.openTerminals, id],
    activeTerminal: id
  })),
  closeTerminal: (id) => set((state) => ({
    openTerminals: state.openTerminals.filter(terminalId => terminalId !== id),
    activeTerminal: state.activeTerminal === id ? (state.openTerminals.find(t => t !== id) || null) : state.activeTerminal
  })),
  focusTerminal: (id) => set(() => ({
    activeTerminal: id
  })),
}));