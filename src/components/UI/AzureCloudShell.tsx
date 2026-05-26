import { useState, useRef, useEffect } from 'react';
import { X, Maximize2, Minimize2, Terminal, CheckCircle, Info } from 'lucide-react';
import { useAzureStore } from '../../store/useAzureStore';
import { useCliLabStore } from '../../store/useCliLabStore';

interface AzureCloudShellProps {
  onClose: () => void;
}

export default function AzureCloudShell({ onClose }: AzureCloudShellProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [output, setOutput] = useState<string[]>([
    'Requesting a Cloud Shell.Succeeded.',
    'Connecting terminal...',
    'Welcome to Azure Cloud Shell',
    '',
    'Type "az" to use Azure CLI',
    'Type "help" to learn about Cloud Shell',
    '',
    'PS /home/azureuser> '
  ]);
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  
  const { resourceGroups, vnets, vms, createResourceGroup, createVNet } = useAzureStore();
  const { quests, activeQuestId, currentStepIndex, advanceStep, quitQuest } = useCliLabStore();

  const activeQuest = activeQuestId ? quests[activeQuestId] : null;
  const currentStep = activeQuest ? activeQuest.steps[currentStepIndex] : null;

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleCommand = (cmd: string) => {
    const trimmed = cmd.trim();
    const newOutput = [...output.slice(0, output.length - 1)]; // Remove prompt
    const prompt = 'PS /home/azureuser> ';
    newOutput.push(`${prompt}${cmd}`);

    if (trimmed === 'clear') {
      setOutput([prompt]);
      return;
    }

    let commandHandled = false;

    // Quest Validation Intercept
    if (currentStep) {
      const isMatch = typeof currentStep.expectedCommand === 'string' 
        ? trimmed === currentStep.expectedCommand
        : currentStep.expectedCommand.test(trimmed);

      if (isMatch) {
        // Optional: Perform actual state mutation if it's an Azure CLI command
        if (trimmed.startsWith('az group create')) {
          const nameMatch = trimmed.match(/(?:--name|-n)\s+([^\s]+)/);
          const locMatch = trimmed.match(/(?:--location|-l)\s+([^\s]+)/);
          if (nameMatch && locMatch) {
            createResourceGroup({ name: nameMatch[1], location: locMatch[1] as any });
          }
        } else if (trimmed.startsWith('az network vnet create')) {
          const nameMatch = trimmed.match(/(?:--name|-n)\s+([^\s]+)/);
          const rgMatch = trimmed.match(/(?:--resource-group|-g)\s+([^\s]+)/);
          const prefixMatch = trimmed.match(/(?:--address-prefixes?)\s+([^\s]+)/);
          if (nameMatch && rgMatch && prefixMatch) {
            createVNet({ id: `vnet-${Date.now()}`, name: nameMatch[1], resourceGroup: rgMatch[1], location: 'eastus', addressSpace: [prefixMatch[1]], subnets: [], peerings: [] });
          }
        }

        newOutput.push(currentStep.successMessage);
        advanceStep();
        commandHandled = true;
      } else if (trimmed !== '') {
         // If they typed something wrong during a quest
         if (trimmed.startsWith('hint')) {
           newOutput.push(`HINT: ${currentStep.hint}`);
           commandHandled = true;
         }
      }
    }

    // Standard CLI Simulator
    if (!commandHandled) {
      if (trimmed.startsWith('az ')) {
        const parts = trimmed.split(' ');
        if (parts[1] === 'group' && parts[2] === 'list') {
          newOutput.push(JSON.stringify(Object.values(useAzureStore.getState().resourceGroups), null, 2));
        } else if (parts[1] === 'network' && parts[2] === 'vnet' && parts[3] === 'list') {
          newOutput.push(JSON.stringify(Object.values(useAzureStore.getState().vnets), null, 2));
        } else if (parts[1] === 'vm' && parts[2] === 'list') {
          newOutput.push(JSON.stringify(Object.values(useAzureStore.getState().vms), null, 2));
        } else {
          newOutput.push(`ERROR: Command '${trimmed}' not found or implemented in simulator.`);
        }
      } else if (trimmed.startsWith('ls') || trimmed.startsWith('pwd') || trimmed.startsWith('cd') || trimmed.startsWith('mkdir')) {
        // Provide basic dummy output for standard linux commands if not caught by quest
        newOutput.push(`(Simulated) Command executed successfully.`);
      } else if (trimmed.startsWith('terraform')) {
        newOutput.push(`(Simulated) Terraform command executed successfully.`);
      } else if (trimmed.startsWith('New-Az') || trimmed.startsWith('Get-Az') || trimmed.startsWith('Set-Az') || trimmed.startsWith('Remove-Az')) {
        newOutput.push(`(Simulated PowerShell) Azure cmdlet executed successfully.`);
      } else if (trimmed.startsWith('kubectl')) {
        newOutput.push(`(Simulated) kubectl command executed successfully.`);
      } else if (trimmed !== '') {
        newOutput.push(`${trimmed}: The term '${trimmed}' is not recognized as the name of a cmdlet.`);
      }
    }

    newOutput.push(prompt);
    setOutput(newOutput);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleCommand(input);
      setInput('');
    }
  };

  return (
    <div className={`azure-cloud-shell ${isExpanded ? 'expanded' : ''}`}>
      <div className="shell-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontWeight: 'bold', fontSize: 13 }}>Cloud Shell</span>
          <select style={{ background: 'transparent', color: 'white', border: 'none', outline: 'none', fontSize: 13 }}>
            <option>PowerShell</option>
            <option>Bash</option>
          </select>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => setIsExpanded(!isExpanded)}>
            {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
          <button onClick={onClose}><X size={16} /></button>
        </div>
      </div>
      <div className="shell-body" onClick={() => inputRef.current?.focus()} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 20 }}>
          {output.map((line, i) => {
            if (i === output.length - 1) {
              return (
                <div key={i} style={{ display: 'flex' }}>
                  <span style={{ color: '#00FF00', marginRight: 8 }}>{line}</span>
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#fff',
                      outline: 'none',
                      flex: 1,
                      fontFamily: 'monospace'
                    }}
                  />
                </div>
              );
            }
            return <pre key={i} style={{ margin: 0, whiteSpace: 'pre-wrap', color: line.startsWith('ERROR') ? '#ff5555' : '#fff' }}>{line}</pre>;
          })}
        </div>
        
        {/* Quest HUD */}
        {activeQuest && (
          <div style={{ 
            background: 'rgba(0, 0, 0, 0.5)', borderTop: '1px solid #333', padding: '10px 15px', 
            display: 'flex', justifyContent: 'space-between', alignItems: 'center' 
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#00a4ef', fontWeight: 'bold', marginBottom: 4 }}>
                <Terminal size={14} /> Quest: {activeQuest.title}
              </div>
              {currentStep ? (
                <div style={{ fontSize: 13, color: '#ccc' }}>
                  <span style={{ color: '#fff', fontWeight: 'bold' }}>Step {currentStepIndex + 1}/{activeQuest.steps.length}:</span> {currentStep.objective}
                  <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>Type 'hint' if you get stuck.</div>
                </div>
              ) : (
                <div style={{ fontSize: 13, color: '#00FF00', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <CheckCircle size={14} /> Quest Completed!
                </div>
              )}
            </div>
            <button onClick={quitQuest} style={{ background: '#333', border: 'none', color: '#fff', padding: '4px 8px', borderRadius: 4, cursor: 'pointer', fontSize: 11 }}>
              Quit Quest
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
