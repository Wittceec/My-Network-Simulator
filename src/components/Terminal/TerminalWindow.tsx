import { useState, type KeyboardEvent, useRef, useEffect } from 'react';
import { useUIStore } from '../../store/useUIStore';
import { useNetworkStore } from '../../store/useNetworkStore';
import { executeCommand, getTabCompletion, getQuestionMarkHelp, type CliMode } from '../../core/parser/cliParser';
import { executePcCommand } from '../../core/parser/pcParser';
import { executeLinuxCommand } from '../../core/parser/linuxParser';
import { Terminal as TerminalIcon, Globe, Mail, X, Folder, FileText } from 'lucide-react';

interface Props {
  deviceId: string;
  index: number;
}

// Added Tab and ? to the mobile quick keys!
const QUICK_KEYS_ROUTER = ['Tab', '?', 'enable', 'config t', 'show ip int br', 'show ip route', 'exit'];
const QUICK_KEYS_PC = ['ipconfig', 'ping ', 'arp -a', 'tracert ', 'cls'];
const QUICK_KEYS_SERVER = ['ls -la', 'pwd', 'ping ', 'ifconfig', 'systemctl status', 'cat ', 'clear'];

export default function TerminalWindow({ deviceId, index }: Props) {
  const closeTerminal = useUIStore((state) => state.closeTerminal);
  const activeTerminal = useUIStore((state) => state.activeTerminal);
  const focusTerminal = useUIStore((state) => state.focusTerminal);
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
  const [linuxCwd, setLinuxCwd] = useState('~');
  
  // NEW: Virtual PC State
  const [activeApp, setActiveApp] = useState<'none' | 'terminal' | 'browser' | 'email' | 'file-explorer'>('none');

  useEffect(() => {
    if (device?.type === 'pc') {
      setActiveApp('none');
    } else {
      setActiveApp('terminal');
    }
  }, [device?.type]);
  const [emailFolder, setEmailFolder] = useState<'inbox'|'sent'|'drafts'>('inbox');
  const [selectedEmail, setSelectedEmail] = useState<number | null>(1);
  const [explorerPath, setExplorerPath] = useState('C:\\Users\\Public\\Documents');

  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const endOfHistoryRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => endOfHistoryRef.current?.scrollIntoView({ behavior: 'smooth' }), [history]);

  if (!device) return null;

  const isPoweredOn = device.powerOn ?? true;
  const isPC = device.type === 'pc';
  const isServer = device.type === 'server' || device.os === 'linux';

  const promptStr = (() => {
    if (isPC) return `C:\\Users\\${device.hostname}>`;
    if (isServer) return `root@${device.hostname}:${linuxCwd}#`;
    let suffix = '>';
    if (mode === 'privilege') suffix = '#';
    if (mode === 'global') suffix = '(config)#';
    if (mode === 'interface') suffix = '(config-if)#';
    if (mode === 'dhcp') suffix = '(dhcp-config)#';
    if (mode === 'router') suffix = '(config-router)#';
    if (mode === 'line') suffix = '(config-line)#';
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
        if (text.toLowerCase() === 'cls') {
           setHistory([]);
           return;
        }
        const pcOutput = executePcCommand(text, device);
        newHistory.push(...pcOutput);
      } else if (isServer) {
        if (text.toLowerCase() === 'clear') {
           setHistory([]);
           return;
        }
        const result = executeLinuxCommand(text, device, linuxCwd);
        if (result.output.includes('___CLEAR___')) {
           setHistory([]);
           return;
        }
        if (result.output.length > 0) newHistory.push(...result.output);
        setLinuxCwd(result.newCwd);
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
    } else if (e.key === 'l' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      setHistory([]);
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
  const subtitle = isPC && activeApp === 'none' ? 'Virtual Desktop' : isPC ? 'Command Prompt' : 'Console';
  const modeLabel = isPC ? 'PC' : mode.toUpperCase();
  const currentQuickKeys = isPC ? QUICK_KEYS_PC : isServer ? QUICK_KEYS_SERVER : QUICK_KEYS_ROUTER;

  const positionStyle: React.CSSProperties = isMobile
    ? { left: 0, top: 0, right: 0, bottom: 0, width: '100%', height: '100%' }
    : { left: `${position.x}px`, top: `${position.y}px`, width: `${size.w}px`, height: `${size.h}px`, zIndex: activeTerminal === deviceId ? 1000 : 100 };

  return (
    <div className="term" style={positionStyle} onMouseDownCapture={() => focusTerminal(deviceId)}>
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

      <div className={`term-body ${isPC ? 'pc' : ''}`} style={isPC && activeApp !== 'terminal' ? { padding: 0, overflow: 'hidden' } : {}} onClick={() => { if (activeApp === 'terminal') inputRef.current?.focus(); }}>
        {!isPoweredOn ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-dim)', textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔌</div>
            <div style={{ fontSize: '16px', fontWeight: 'bold' }}>Device is powered off</div>
            <div style={{ fontSize: '12px', marginTop: '8px' }}>Press the power button on the canvas to turn it on.</div>
          </div>
        ) : isPC && activeApp === 'none' ? (
           <div className="pc-desktop" style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)', position: 'relative' }}>
              <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 20 }}>
                 <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 80, cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); setActiveApp('terminal'); }}>
                    <div style={{ background: 'rgba(0,0,0,0.3)', padding: 12, borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)' }}><TerminalIcon size={32} color="#fff" /></div>
                    <span style={{ color: '#fff', fontSize: 12, marginTop: 6, textShadow: '0 2px 4px rgba(0,0,0,0.5)', fontWeight: 500 }}>Terminal</span>
                 </div>
                 <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 80, cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); setActiveApp('browser'); }}>
                    <div style={{ background: 'rgba(0,0,0,0.3)', padding: 12, borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)' }}><Globe size={32} color="#fff" /></div>
                    <span style={{ color: '#fff', fontSize: 12, marginTop: 6, textShadow: '0 2px 4px rgba(0,0,0,0.5)', fontWeight: 500 }}>Browser</span>
                 </div>
                 <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 80, cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); setActiveApp('email'); }}>
                    <div style={{ background: 'rgba(0,0,0,0.3)', padding: 12, borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)' }}><Mail size={32} color="#fff" /></div>
                    <span style={{ color: '#fff', fontSize: 12, marginTop: 6, textShadow: '0 2px 4px rgba(0,0,0,0.5)', fontWeight: 500 }}>Email</span>
                 </div>
                 <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 80, cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); setActiveApp('file-explorer'); }}>
                    <div style={{ background: 'rgba(0,0,0,0.3)', padding: 12, borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)' }}><Folder size={32} color="#fff" /></div>
                    <span style={{ color: '#fff', fontSize: 12, marginTop: 6, textShadow: '0 2px 4px rgba(0,0,0,0.5)', fontWeight: 500 }}>Files</span>
                 </div>
              </div>
           </div>
        ) : isPC && activeApp === 'browser' ? (
           <div className="pc-browser" style={{ width: '100%', height: '100%', background: '#fff', display: 'flex', flexDirection: 'column', cursor: 'default' }} onClick={(e) => e.stopPropagation()}>
              <div style={{ background: '#f1f5f9', padding: '8px 12px', display: 'flex', gap: 12, alignItems: 'center', borderBottom: '1px solid #e2e8f0' }}>
                 <button onClick={() => setActiveApp('none')} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}><X size={16}/></button>
                 <input type="text" value="http://intranet.corp.local" readOnly style={{ flex: 1, padding: '6px 12px', borderRadius: 16, border: '1px solid #cbd5e1', fontSize: 13, color: '#334155', background: '#fff' }} />
              </div>
              <div style={{ padding: 32, color: '#334155', flex: 1, overflowY: 'auto' }}>
                 <h2 style={{ marginTop: 0, color: '#0f172a' }}>Corp Intranet</h2>
                 <p style={{ lineHeight: 1.6 }}>Welcome to the corporate intranet. No active announcements at this time.</p>
                 <div style={{ marginTop: 32, padding: 16, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                   <h4 style={{ margin: '0 0 8px 0', color: '#0f172a' }}>Quick Links</h4>
                   <ul style={{ margin: 0, paddingLeft: 20, color: '#2563eb' }}>
                     <li><span style={{ cursor: 'pointer', textDecoration: 'underline' }}>HR Portal</span></li>
                     <li><span style={{ cursor: 'pointer', textDecoration: 'underline' }}>IT Helpdesk</span></li>
                     <li><span style={{ cursor: 'pointer', textDecoration: 'underline' }}>Finance Documents</span></li>
                   </ul>
                 </div>
              </div>
           </div>
        ) : isPC && activeApp === 'email' ? (
           <div className="pc-email" style={{ width: '100%', height: '100%', background: '#fff', display: 'flex', flexDirection: 'column', cursor: 'default' }} onClick={(e) => e.stopPropagation()}>
              <div style={{ background: '#0078d4', padding: '10px 16px', display: 'flex', gap: 12, alignItems: 'center', color: '#fff' }}>
                 <button onClick={() => setActiveApp('none')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={18}/></button>
                 <span style={{ fontWeight: '600', fontSize: 15 }}>Outlook Web</span>
              </div>
              <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                 <div style={{ width: 140, borderRight: '1px solid #e2e8f0', padding: 12, background: '#f8fafc' }}>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, color: '#334155', fontSize: 13 }}>
                       <li onClick={() => { setEmailFolder('inbox'); setSelectedEmail(1); }} style={{ fontWeight: '600', padding: '8px 12px', background: emailFolder === 'inbox' ? '#e0f2fe' : 'transparent', borderRadius: 4, color: emailFolder === 'inbox' ? '#0369a1' : '#334155', cursor: 'pointer' }}>Inbox (1)</li>
                       <li onClick={() => { setEmailFolder('sent'); setSelectedEmail(null); }} style={{ padding: '8px 12px', cursor: 'pointer', background: emailFolder === 'sent' ? '#e0f2fe' : 'transparent', borderRadius: 4, color: emailFolder === 'sent' ? '#0369a1' : '#334155' }}>Sent Items</li>
                       <li onClick={() => { setEmailFolder('drafts'); setSelectedEmail(null); }} style={{ padding: '8px 12px', cursor: 'pointer', background: emailFolder === 'drafts' ? '#e0f2fe' : 'transparent', borderRadius: 4, color: emailFolder === 'drafts' ? '#0369a1' : '#334155' }}>Drafts</li>
                    </ul>
                 </div>
                 <div style={{ width: 200, borderRight: '1px solid #e2e8f0', overflowY: 'auto' }}>
                    {emailFolder === 'inbox' ? (
                       <div onClick={() => setSelectedEmail(1)} style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', cursor: 'pointer', background: selectedEmail === 1 ? '#f1f5f9' : '#fff' }}>
                          <div style={{ fontWeight: 600, fontSize: 13, color: '#334155' }}>IT Support</div>
                          <div style={{ fontSize: 12, color: '#0f172a', margin: '4px 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Action Required: Password Reset</div>
                          <div style={{ fontSize: 11, color: '#94a3b8' }}>8:00 AM</div>
                       </div>
                    ) : (
                       <div style={{ padding: 24, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>Folder is empty.</div>
                    )}
                 </div>
                 <div style={{ flex: 1, padding: 24, color: '#334155', overflowY: 'auto', background: '#fff' }}>
                    {selectedEmail === 1 ? (
                       <>
                          <h3 style={{ margin: '0 0 12px 0', fontSize: 18, color: '#0f172a' }}>Action Required: Password Reset</h3>
                          <div style={{ fontSize: 13, color: '#64748b', marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid #e2e8f0' }}>
                            <span style={{ fontWeight: 600, color: '#334155' }}>IT Support &lt;it@corp.local&gt;</span><br/>
                            Today at 8:00 AM
                          </div>
                          <div style={{ lineHeight: 1.6, fontSize: 14 }}>
                            <p>Hello,</p>
                            <p>Please remember to reset your password before it expires tomorrow. You can use the terminal command <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: 4, color: '#ef4444' }}>net user</code> to verify your account status.</p>
                            <p>Thank you,<br/>IT Services</p>
                          </div>
                       </>
                    ) : (
                       <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8', fontSize: 14 }}>Select an item to read</div>
                    )}
                 </div>
              </div>
           </div>
        ) : isPC && activeApp === 'file-explorer' ? (
           <div className="pc-explorer" style={{ width: '100%', height: '100%', background: '#fff', display: 'flex', flexDirection: 'column', cursor: 'default' }} onClick={(e) => e.stopPropagation()}>
              <div style={{ background: '#f8fafc', padding: '8px 12px', display: 'flex', gap: 12, alignItems: 'center', borderBottom: '1px solid #e2e8f0' }}>
                 <button onClick={() => setActiveApp('none')} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}><X size={16}/></button>
                 <div style={{ flex: 1, padding: '4px 12px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12, color: '#334155', background: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Folder size={14} color="#facc15" fill="#facc15" /> {explorerPath}
                 </div>
              </div>
              <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                 <div style={{ width: 140, borderRight: '1px solid #e2e8f0', padding: '16px 12px', background: '#fff' }}>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, color: '#334155', fontSize: 12 }}>
                       <li style={{ padding: '6px 8px', display: 'flex', alignItems: 'center', gap: 8 }}><Folder size={14} color="#facc15" fill="#facc15" /> Quick access</li>
                       <li style={{ padding: '6px 8px', display: 'flex', alignItems: 'center', gap: 8 }}><Folder size={14} color="#3b82f6" fill="#3b82f6" /> OneDrive</li>
                       <li style={{ padding: '6px 8px', display: 'flex', alignItems: 'center', gap: 8, background: '#e0f2fe', borderRadius: 4, color: '#0369a1', fontWeight: 600 }}><Folder size={14} color="#facc15" fill="#facc15" /> Documents</li>
                       <li style={{ padding: '6px 8px', display: 'flex', alignItems: 'center', gap: 8 }}><Folder size={14} color="#facc15" fill="#facc15" /> Downloads</li>
                    </ul>
                 </div>
                 <div style={{ flex: 1, padding: 16, background: '#fff', overflowY: 'auto' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: 16 }}>
                       <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, cursor: 'pointer', padding: 8, borderRadius: 4, hover: { background: '#f1f5f9' } }}>
                          <FileText size={32} color="#3b82f6" />
                          <span style={{ fontSize: 11, color: '#334155', textAlign: 'center' }}>Q3_Report.pdf</span>
                       </div>
                       <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, cursor: 'pointer', padding: 8, borderRadius: 4 }}>
                          <FileText size={32} color="#10b981" />
                          <span style={{ fontSize: 11, color: '#334155', textAlign: 'center' }}>Budget_FY26.xlsx</span>
                       </div>
                       <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, cursor: 'pointer', padding: 8, borderRadius: 4 }}>
                          <FileText size={32} color="#6366f1" />
                          <span style={{ fontSize: 11, color: '#334155', textAlign: 'center' }}>Project_Spec.docx</span>
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {isPC && (
              <div style={{ background: '#1e293b', padding: '6px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #334155' }}>
                <span style={{ fontSize: 12, color: '#94a3b8', fontFamily: 'sans-serif' }}>Command Prompt</span>
                <button onClick={(e) => { e.stopPropagation(); setActiveApp('none'); }} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={14}/></button>
              </div>
            )}
            <div style={{ flex: 1, padding: isPC ? 12 : 0, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
              {history.map((line, i) => <div key={i} className="term-line">{line}</div>)}
              <div className="term-prompt-row" ref={endOfHistoryRef}>
                <span className={promptCls}>{promptStr}</span>
                <input
                  ref={inputRef} type="text" value={input} onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown} autoCapitalize="none" autoComplete="off" autoCorrect="off" spellCheck={false} autoFocus={activeApp === 'terminal'}
                  className="term-input"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {isMobile && (
        <div style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)', padding: '8px 10px', display: 'flex', gap: 6, overflowX: 'auto' }}>
          <button className="btn" style={{ padding: '6px 10px', fontSize: 11, fontFamily: 'var(--font-mono)', flexShrink: 0, color: '#ef5350', borderColor: '#ef5350' }} onClick={() => closeTerminal(deviceId)}>
            Close
          </button>
          
          {currentQuickKeys.map((k) => (
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