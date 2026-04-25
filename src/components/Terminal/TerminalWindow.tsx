import { useState, KeyboardEvent, useRef, useEffect } from 'react';
import { useUIStore } from '../../store/useUIStore';
import { useNetworkStore } from '../../store/useNetworkStore';
import { executeCommand, type CliMode } from '../../core/parser/cliParser';
import { executePcCommand } from '../../core/parser/pcParser';

interface Props {
  deviceId: string;
  index: number;
}

export default function TerminalWindow({ deviceId, index }: Props) {
  const closeTerminal = useUIStore((state) => state.closeTerminal);
  const device = useNetworkStore((state) => state.devices[deviceId]);

  // --- DRAGGABLE WINDOW LOGIC ---
  // Cascade the windows slightly based on their index so they don't spawn directly on top of each other
  const [position, setPosition] = useState({ x: 50 + (index * 40), y: 50 + (index * 40) });
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragOffset.current = { x: e.clientX - position.x, y: e.clientY - position.y };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setPosition({ x: e.clientX - dragOffset.current.x, y: e.clientY - dragOffset.current.y });
      }
    };
    const handleMouseUp = () => setIsDragging(false);

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    }
  }, [isDragging]);
  // ------------------------------

  const [history, setHistory] = useState<string[]>([]);
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<CliMode>('user');
  const [context, setContext] = useState('');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const endOfHistoryRef = useRef<HTMLDivElement>(null);

  useEffect(() => endOfHistoryRef.current?.scrollIntoView({ behavior: 'smooth' }), [history]);

  if (!device) return null;

  const isPC = device.type === 'pc';
  const textColor = isPC ? '#e2e8f0' : '#16a34a'; 
  
  let prompt = '';
  if (isPC) {
    prompt = `C:\\Users\\${device.hostname}>`;
  } else {
    let promptSuffix = '>';
    if (mode === 'privilege') promptSuffix = '#';
    if (mode === 'global') promptSuffix = '(config)#';
    if (mode === 'interface') promptSuffix = `(config-if)#`;
    if (mode === 'dhcp') promptSuffix = `(dhcp-config)#`;
    prompt = `${device.hostname}${promptSuffix}`;
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (input.trim() === '') {
        setHistory((prev) => [...prev, prompt]);
      } else {
        setCommandHistory((prev) => [...prev, input]);
        setHistoryIndex(-1);
        const newHistory = [...history, `${prompt} ${input}`];

        if (isPC) {
          const pcOutput = executePcCommand(input, device);
          newHistory.push(...pcOutput);
        } else {
          const result = executeCommand(input, mode, context, device);
          if (result.output.length > 0) newHistory.push(...result.output);
          setMode(result.newMode);
          setContext(result.newContext);
        }
        setHistory(newHistory);
      }
      setInput(''); 
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const newIndex = historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1);
        setHistoryIndex(newIndex); setInput(commandHistory[newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex !== -1) {
        const newIndex = historyIndex + 1;
        if (newIndex >= commandHistory.length) {
          setHistoryIndex(-1); setInput('');
        } else {
          setHistoryIndex(newIndex); setInput(commandHistory[newIndex]);
        }
      }
    }
  };

  return (
    <div style={{
      position: 'absolute', left: `${position.x}px`, top: `${position.y}px`, 
      width: '500px', height: '350px', backgroundColor: '#000000', color: textColor, 
      fontFamily: 'monospace', fontSize: '14px', borderRadius: '8px', border: '1px solid #334155', 
      display: 'flex', flexDirection: 'column', boxShadow: '0 10px 40px rgba(0,0,0,0.8)', zIndex: 100
    }}>
      {/* DRAGGABLE HEADER */}
      <div 
        onMouseDown={handleMouseDown}
        style={{ 
          backgroundColor: '#1e293b', padding: '8px 12px', display: 'flex', 
          justifyContent: 'space-between', alignItems: 'center', cursor: isDragging ? 'grabbing' : 'grab',
          borderTopLeftRadius: '7px', borderTopRightRadius: '7px', userSelect: 'none'
      }}>
        <span style={{ color: 'white', fontWeight: 'bold' }}>{device.hostname} - {isPC ? 'Command Prompt' : 'Console'}</span>
        <button onMouseDown={(e) => e.stopPropagation()} onClick={() => closeTerminal(deviceId)} style={{ background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', padding: '2px 8px', fontWeight: 'bold' }}>X</button>
      </div>

      <div style={{ flexGrow: 1, padding: '12px', overflowY: 'auto' }}>
        {history.map((line, i) => <div key={i} style={{ marginBottom: '2px', whiteSpace: 'pre-wrap' }}>{line}</div>)}
        <div style={{ display: 'flex' }} ref={endOfHistoryRef}>
          <span style={{ marginRight: '8px' }}>{prompt}</span>
          <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown} autoCapitalize="none" autoComplete="off" autoCorrect="off" spellCheck={false} autoFocus
            style={{ background: 'transparent', color: textColor, border: 'none', outline: 'none', flexGrow: 1, fontFamily: 'monospace', fontSize: '14px' }}
          />
        </div>
      </div>
    </div>
  );
}