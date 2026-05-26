import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CliLabState, CliQuest } from '../types/cliLab';
import { CLI_QUESTS } from '../data/cliQuests';

export const useCliLabStore = create<CliLabState>()(
  persist(
    (set) => ({
      quests: CLI_QUESTS,
      activeQuestId: null,
      currentStepIndex: 0,
      completedQuests: [],

      startQuest: (questId: string) => set({ 
        activeQuestId: questId, 
        currentStepIndex: 0 
      }),

      advanceStep: () => set((state) => {
        if (!state.activeQuestId) return state;
        const quest = state.quests[state.activeQuestId];
        if (state.currentStepIndex + 1 >= quest.steps.length) {
          // Quest Complete!
          return {
            activeQuestId: null,
            currentStepIndex: 0,
            completedQuests: [...new Set([...state.completedQuests, state.activeQuestId])]
          };
        }
        return { currentStepIndex: state.currentStepIndex + 1 };
      }),

      quitQuest: () => set({ activeQuestId: null, currentStepIndex: 0 }),

      completeQuest: () => set((state) => {
        if (!state.activeQuestId) return state;
        return {
          activeQuestId: null,
          currentStepIndex: 0,
          completedQuests: [...new Set([...state.completedQuests, state.activeQuestId])]
        };
      })
    }),
    {
      name: 'azure-cli-lab-storage',
    }
  )
);
