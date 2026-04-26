import { useState, useEffect } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import NetworkCanvas from './components/Canvas/NetworkCanvas';
import Sidebar, { SidebarSheet } from './components/UI/Sidebar';
import TerminalManager from './components/Terminal/TerminalManager';
import { useNetworkStore } from './store/useNetworkStore';

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

function Topbar({ onMenu }: { onMenu: () => void }) {
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
          <span className="mono" style={{ fontSize: 18 }}>≡</span>
        </button>
      )}
      <div className="brand">
        <span className="mark mono">⬢</span>
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
        </>
      )}
      <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
        {isMobile && (
          <button className="btn btn-primary btn-icon" onClick={onMenu} aria-label="Add device">
            <span className="mono" style={{ fontSize: 20 }}>+</span>
          </button>
        )}
      </div>
    </div>
  );
}

function App() {
  const [sheetOpen, setSheetOpen] = useState(false);

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
        <Topbar onMenu={() => setSheetOpen(true)} />
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>
          <Sidebar />
          <NetworkCanvas />
          <TerminalManager />
        </div>
        {sheetOpen && <SidebarSheet onClose={() => setSheetOpen(false)} />}
      </ReactFlowProvider>
    </div>
  );
}

export default App;
