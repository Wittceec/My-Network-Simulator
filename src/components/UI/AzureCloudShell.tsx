import { useState, useRef, useEffect } from 'react';
import { X, Maximize2, Minimize2 } from 'lucide-react';
import { useAzureStore } from '../../store/useAzureStore';

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
  
  const { resourceGroups, vnets, vms } = useAzureStore();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleCommand = (cmd: string) => {
    const trimmed = cmd.trim();
    const newOutput = [...output.slice(0, output.length - 1)]; // Remove prompt
    newOutput.push(`PS /home/azureuser> ${cmd}`);

    if (trimmed === 'clear') {
      setOutput(['PS /home/azureuser> ']);
      return;
    }

    if (trimmed.startsWith('az ')) {
      const parts = trimmed.split(' ');
      if (parts[1] === 'group' && parts[2] === 'list') {
        newOutput.push(JSON.stringify(Object.values(resourceGroups), null, 2));
      } else if (parts[1] === 'network' && parts[2] === 'vnet' && parts[3] === 'list') {
        newOutput.push(JSON.stringify(Object.values(vnets), null, 2));
      } else if (parts[1] === 'vm' && parts[2] === 'list') {
        newOutput.push(JSON.stringify(Object.values(vms), null, 2));
      } else {
        newOutput.push(`ERROR: Command '${trimmed}' not found or implemented in simulator.`);
      }
    } else if (trimmed !== '') {
      newOutput.push(`${trimmed}: The term '${trimmed}' is not recognized as the name of a cmdlet.`);
    }

    newOutput.push('PS /home/azureuser> ');
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
      <div className="shell-body" onClick={() => inputRef.current?.focus()}>
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
          return <pre key={i} style={{ margin: 0, whiteSpace: 'pre-wrap', color: line.startsWith('ERROR') ? 'red' : '#fff' }}>{line}</pre>;
        })}
      </div>
    </div>
  );
}
