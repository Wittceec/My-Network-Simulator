import { useState, useEffect } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import NetworkCanvas from './components/Canvas/NetworkCanvas';
import Sidebar, { SidebarSheet } from './components/UI/Sidebar';
import TerminalManager from './components/Terminal/TerminalManager';
import LabSelector from './components/UI/LabSelector';
import { useNetworkStore } from './store/useNetworkStore';
import { Menu, Plus, Hexagon, BookOpen } from 'lucide-react';

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
}

function Topbar({ onMenu, onOpenLibrary }: TopbarProps) {
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
        <Topbar onMenu={() => setSheetOpen(true)} onOpenLibrary={() => setLibraryOpen(true)} />
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>
          <Sidebar />
          <NetworkCanvas />
          <TerminalManager />
        </div>
        {sheetOpen && <SidebarSheet onClose={() => setSheetOpen(false)} />}
        {libraryOpen && <LabSelector onClose={() => setLibraryOpen(false)} />}
      </ReactFlowProvider>
    </div>
  );
}

export default App;
