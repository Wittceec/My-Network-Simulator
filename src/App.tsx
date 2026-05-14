import React, { useState, useEffect } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import NetworkCanvas from './components/Canvas/NetworkCanvas';
import Sidebar, { SidebarSheet } from './components/UI/Sidebar';
import TerminalManager from './components/Terminal/TerminalManager';
import LabSelector from './components/UI/LabSelector';
import AzurePortal from './components/UI/AzurePortal';
import { useNetworkStore } from './store/useNetworkStore';
import { Menu, Plus, Hexagon, BookOpen, Cloud } from 'lucide-react';

class AppErrorBoundary extends React.Component<{children: any}, {error: any}> {
  constructor(props: any) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error: any) { return { error }; }
  render() { 
    if (this.state.error) return <div style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999999, background: 'red', color: 'white', padding: 20}}><h1>App Crash</h1><pre>{this.state.error.message}</pre><pre>{this.state.error.stack}</pre></div>;
    return this.props.children;
  }
}

function useIsMobile() {
  const [m, setM] = useState(
    typeof window !== 'undefined' && window.matchMedia('(max-width: 720px)').matches
  );
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 720px)');
    const handler = (e: MediaQueryListEvent) => setM(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return m;
}

interface TopbarProps {
  onMenu: () => void;
  onOpenLibrary: () => void;
  onOpenAzure: () => void;
}

function Topbar({ onMenu, onOpenLibrary, onOpenAzure }: TopbarProps) {
  const isMobile = useIsMobile();
  const deviceCount = useNetworkStore((s) => Object.keys(s.devices).length);

  return (
    <div className="topbar">
      {isMobile && (
        <button
          className="btn btn-icon btn-ghost"
          onClick={onMenu}
          aria-label="Open device menu"
        >
          <Menu size={20} />
        </button>
      )}
      <div className="brand">
        <span className="mark"><Hexagon size={18} fill="currentColor" /></span>
        <span className="name">NETSIM</span>
        <span className="ver mono">v1.0</span>
      </div>
      {!isMobile && (
        <>
          <div style={{ width: 1, height: 22, background: 'var(--border)' }}></div>
          <span
            className="lab-name mono"
            style={{ fontSize: 11, color: 'var(--text-muted)' }}
          >
            my_network_lab
          </span>
          <span className="lab-pill">
            {deviceCount === 0 ? 'EMPTY' : `${deviceCount} DEVICES`}
          </span>
          <button className="btn btn-ghost" onClick={onOpenLibrary} style={{ marginLeft: 16 }}>
            <BookOpen size={16} /> Library
          </button>
          <button className="btn btn-ghost" onClick={onOpenAzure} style={{ marginLeft: 8, color: '#0078D4' }}>
            <Cloud size={16} /> Azure Portal
          </button>
        </>
      )}
      <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
        {isMobile && (
          <button className="btn btn-primary btn-icon" onClick={onMenu} aria-label="Add device">
            <Plus size={20} />
          </button>
        )}
      </div>
    </div>
  );
}

function App() {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [azureOpen, setAzureOpen] = useState(false);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        background: 'var(--bg)',
      }}
    >
      <ReactFlowProvider>
        <Topbar onMenu={() => setSheetOpen(true)} onOpenLibrary={() => setLibraryOpen(true)} onOpenAzure={() => setAzureOpen(true)} />
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>
          <Sidebar />
          <NetworkCanvas />
          <TerminalManager />
        </div>
        {sheetOpen && <SidebarSheet onClose={() => setSheetOpen(false)} />}
        {libraryOpen && <LabSelector onClose={() => setLibraryOpen(false)} />}
        {azureOpen && <AppErrorBoundary><AzurePortal onClose={() => setAzureOpen(false)} /></AppErrorBoundary>}
      </ReactFlowProvider>
    </div>
  );
}

export default App;
