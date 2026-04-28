import { useState, type KeyboardEvent, useRef, useEffect } from 'react';
import { useUIStore } from '../../store/useUIStore';
import { useNetworkStore } from '../../store/useNetworkStore';
import { executeCommand, getTabCompletion, getQuestionMarkHelp, type CliMode } from '../../core/parser/cliParser';
import { executePcCommand } from '../../core/parser/pcParser';

interface Props {
  deviceId: string;
  index: number;
}

// Added Tab and ? to the mobile quick keys!
const QUICK_KEYS_ROUTER = ['Tab', '?', 'enable', 'config t', 'show ip int br', 'show ip route', 'exit'];
const QUICK_KEYS_PC = ['ipconfig', 'ping ', 'arp -a', 'tracert ', 'cls'];

export default function TerminalWindow({ deviceId, index }: Props) {
  const closeTerminal = useUIStore((state) => state.closeTerminal);
  const device = useNetworkStore((state) => state.devices[deviceId]);

  const isMobile = typeof window !== 'undefined' && window.matchMedia('(max-width: 720px)').matches;

  const [position, setPosition] = useState({ x: 60 + index * 36, y: 80 + index * 36 });
  const [size] = useState({ w: 520, h: 360 });
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isMobile) return;
    setIsDragging(true);
    dragOffset.current = { x: e.clientX - position.x, y: e.clientY - position.y };
  };

  useEffect(() => {
    if (isMobile) return;
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
    };
  }, [isDragging, isMobile]);

  const [history, setHistory] = useState<string[]>([]);
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<CliMode>('user');
  const [context, setContext] = useState('');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const endOfHistoryRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => endOfHistoryRef.current?.scrollIntoView({ behavior: 'smooth' }), [history]);

  if (!device) return null;

  const isPC = device.type === 'pc';

  const promptStr = (() => {
    if (isPC) return `C:\\Users\\${device.hostname}>`;
    let suffix = '>';
    if (mode === 'privilege') suffix = '#';
    if (mode === 'global') suffix = '(config)#';
    if (mode === 'interface') suffix = '(config-if)#';
    if (mode === 'dhcp') suffix = '(dhcp-config)#';
    if (mode === 'router') suffix = '(config-router)#'; // NEW!
    return `${device.hostname}${suffix}`;
  })();

  const submit = (raw: string) => {
    const text = raw;
    if (text.trim() === '') {
      setHistory((prev) => [...prev, promptStr]);
    } else {
      setCommandHistory((prev) => [...prev, text]);
      setHistoryIndex(-1);
      const newHistory = [...history, `${promptStr} ${text}`];
      if (isPC) {
        const pcOutput = executePcCommand(text, device);
        newHistory.push(...pcOutput);
      } else {
        const result = executeCommand(text, mode, context, device);
        if (result.output.length > 0) newHistory.push(...result.output);
        setMode(result.newMode);
        setContext(result.newContext);
      }
      setHistory(newHistory);
    }
    setInput('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      submit(input);
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
    } else if (e.key === 'Tab') {
      e.preventDefault();
      if (!isPC) setInput(getTabCompletion(input, mode));
    } else if (e.key === '?') {
      e.preventDefault();
      if (!isPC) {
        const helpText = getQuestionMarkHelp(input, mode);
        // We print the history but LEAVE the input intact, just like real Cisco!
        setHistory((prev) => [...prev, `${promptStr} ${input}?`, ...helpText]);
      } else {
        setInput(prev => prev + '?');
      }
    }
  };

  const insertQuick = (k: string) => {
    if (k === 'Tab') {
      if (!isPC) setInput(getTabCompletion(input, mode));
    } else if (k === '?') {
      if (!isPC) {
        const helpText = getQuestionMarkHelp(input, mode);
        setHistory((prev) => [...prev, `${promptStr} ${input}?`, ...helpText]);
      }
    } else {
      setInput((prev) => prev + k);
    }
    inputRef.current?.focus();
  };

  const promptCls = isPC ? 'term-prompt-pc' : 'term-prompt-r';
  const subtitle = isPC ? 'Command Prompt' : 'Console';
  const modeLabel = isPC ? 'PC' : mode.toUpperCase();
  const quickKeys = isPC ? QUICK_KEYS_PC : QUICK_KEYS_ROUTER;

  const positionStyle: React.CSSProperties = isMobile
    ? { left: 0, top: 0, right: 0, bottom: 0, width: '100%', height: '100%' }
    : { left: `${position.x}px`, top: `${position.y}px`, width: `${size.w}px`, height: `${size.h}px` };

  return (
    <div className="term" style={positionStyle}>
      <div className="term-head" onMouseDown={handleMouseDown} style={{ cursor: isMobile ? 'default' : isDragging ? 'grabbing' : 'grab' }}>
        <div className="term-dots">
          <span
            className="dot close"
            onMouseDown={(e) => e.stopPropagation()}
            onTouchEnd={(e) => { e.stopPropagation(); closeTerminal(deviceId); }}
            onClick={() => closeTerminal(deviceId)}
            title="Close"
          ></span>
          <span className="dot min"></span>
          <span className="dot max"></span>
        </div>
        <div className="term-title">
          <span className="host">{device.hostname}</span>
          <span className="sep">·</span>
          <span>{subtitle}</span>
        </div>
        <div className="term-mode">{modeLabel}</div>
      </div>

      <div className={`term-body ${isPC ? 'pc' : ''}`} onClick={() => inputRef.current?.focus()}>
        {history.map((line, i) => <div key={i} className="term-line">{line}</div>)}
        <div className="term-prompt-row" ref={endOfHistoryRef}>
          <span className={promptCls}>{promptStr}</span>
          <input
            ref={inputRef} type="text" value={input} onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown} autoCapitalize="none" autoComplete="off" autoCorrect="off" spellCheck={false} autoFocus
            className="term-input"
          />
        </div>
      </div>

      {isMobile && (
        <div style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)', padding: '8px 10px', display: 'flex', gap: 6, overflowX: 'auto' }}>
          <button className="btn" style={{ padding: '6px 10px', fontSize: 11, fontFamily: 'var(--font-mono)', flexShrink: 0, color: '#ef5350', borderColor: '#ef5350' }} onClick={() => closeTerminal(deviceId)}>
            Close
          </button>
          
          {quickKeys.map((k) => (
            <button key={k} className="btn" style={{ padding: '6px 10px', fontSize: 11, fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap', flexShrink: 0 }} onClick={() => insertQuick(k)}>
              {k}
            </button>
          ))}
          <button className="btn" style={{ padding: '6px 10px', fontSize: 11, fontFamily: 'var(--font-mono)', flexShrink: 0 }} onClick={() => {
            if (commandHistory.length > 0) {
              const newIndex = historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1);
              setHistoryIndex(newIndex); setInput(commandHistory[newIndex]);
            }
          }}>↑</button>
          <button className="btn" style={{ padding: '6px 10px', fontSize: 11, fontFamily: 'var(--font-mono)', flexShrink: 0 }} onClick={() => submit(input)}>↵</button>
        </div>
      )}
    </div>
  );
}