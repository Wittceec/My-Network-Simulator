export type ShellEnvironment = 'Bash' | 'PowerShell' | 'AzureCLI' | 'Terraform' | 'Bicep' | 'Kubectl';

export interface CliStep {
  id: string;
  objective: string;
  expectedCommand: string | RegExp;
  hint: string;
  successMessage: string;
  // Optional simulated output if we don't want it to actually run logic
  simulatedOutput?: string | string[]; 
}

export interface CliQuest {
  id: string;
  title: string;
  description: string;
  category: ShellEnvironment;
  difficulty: 'Beginner' | 'Intermediate' | 'Expert';
  steps: CliStep[];
}

export interface CliLabState {
  quests: Record<string, CliQuest>;
  activeQuestId: string | null;
  currentStepIndex: number;
  completedQuests: string[];
  
  startQuest: (questId: string) => void;
  advanceStep: () => void;
  quitQuest: () => void;
  completeQuest: () => void;
}
