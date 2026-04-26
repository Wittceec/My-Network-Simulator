import { useState } from 'react';
import { useNetworkStore } from '../../store/useNetworkStore';

const DEVICE_META = {
  router: { glyph: '◉', label: 'Router', sub: 'L3 · routing · DHCP' },
  switch: { glyph: '▦', label: 'Switch', sub: 'L2 · VLAN · trunking' },
  pc:     { glyph: '▭', label: 'PC',     sub: 'Host · ipconfig · ping' },
} as const;

type DevKind = keyof typeof DEVICE_META;

interface SidebarBodyProps {
  onAfterAction?: () => void;
}

function SidebarBody({ onAfterAction }: SidebarBodyProps) {
  const devices = useNetworkStore((s) => s.devices);
  const links = useNetworkStore((s) => s.links);
  const loadLab = useNetworkStore((s) => s.loadLab);

  const deviceCount = Object.keys(devices).length;
  const linkCount = Object.keys(links).length;
  const upCount = Object.values(devices).reduce(
    (acc, d) => acc + Object.values(d.interfaces).filter((i) => i.isUp).length,
    0
  );

  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  const handleImport = () => {
    const rawJson = prompt('Paste your Lab JSON here:');
    if (rawJson) {
      try {
        const data = JSON.parse(rawJson);
        loadLab(data.devices, data.links);
      } catch {
        alert('Invalid Lab Format!');
      }
    }
    onAfterAction?.();
  };

  const handleExport = () => {
    const state = useNetworkStore.getState();
    const labData = { devices: state.devices, links: state.links };
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify(labData, null, 2));
    const a = document.createElement('a');
    a.setAttribute('href', dataStr);
    a.setAttribute('download', 'my_network_lab.json');
    document.body.appendChild(a);
    a.click();
    a.remove();
    onAfterAction?.();
  };

  return (
    <>
      <div className="pad">
        <div className="group">
          <div className="group-head">
            <span className="section-label">Devices</span>
            <span className="count">DRAG ONTO CANVAS</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {(Object.keys(DEVICE_META) as DevKind[]).map((kind) => {
              const meta = DEVICE_META[kind];
              return (
                <div
                  key={kind}
                  className={`dev-chip ${kind}`}
                  onDragStart={(e) => onDragStart(e, kind)}
                  draggable
                >
                  <span className="glyph">{meta.glyph}</span>
                  <div className="col">
                    <span className="name">{meta.label}</span>
                    <span className="sub">{meta.sub}</span>
                  </div>
                  <span className="grab">⋮⋮</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="group">
          <div className="group-head">
            <span className="section-label">Topology</span>
          </div>
          <div className="stat-card">
            <div className="kv">
              <span className="k">Devices</span>
              <span className="v">{deviceCount.toString().padStart(2, '0')}</span>
            </div>
            <div className="kv">
              <span className="k">Links</span>
              <span className="v">{linkCount.toString().padStart(2, '0')}</span>
            </div>
            <div className="kv">
              <span className="k">Interfaces up</span>
              <span className="v ok">{upCount.toString().padStart(2, '0')}</span>
            </div>
          </div>
        </div>

        <div className="group">
          <div className="group-head">
            <span className="section-label">Legend</span>
          </div>
          <div className="legend-row">
            <span className="swatch" style={{ background: 'var(--router)' }}></span>Router · L3
          </div>
          <div className="legend-row">
            <span className="swatch" style={{ background: 'var(--switch)' }}></span>Switch · L2
          </div>
          <div className="legend-row">
            <span className="swatch" style={{ background: 'var(--pc)' }}></span>PC · Host
          </div>
          <div className="legend-row">
            <span className="swatch" style={{ background: 'var(--link-active)' }}></span>Active link
          </div>
        </div>
      </div>

      <div
        style={{
          borderTop: '1px solid var(--border)',
          padding: 12,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        <button className="btn" onClick={handleExport}>
          <span className="mono">↓</span>Export Lab
        </button>
        <button className="btn" onClick={handleImport}>
          <span className="mono">↑</span>Import Lab
        </button>
      </div>
    </>
  );
}

export default function Sidebar() {
  return (
    <aside className="sidebar desktop-only">
      <SidebarBody />
    </aside>
  );
}

export function SidebarSheet({ onClose }: { onClose: () => void }) {
  return (
    <>
      <div className="scrim" onClick={onClose} />
      <div className="sheet">
        <div className="sheet-handle" />
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 12,
          }}
        >
          <span className="section-label">Devices · Lab</span>
          <span
            className="mono"
            style={{ fontSize: 10, color: 'var(--text-dim)' }}
          >
            tap or drag onto canvas
          </span>
        </div>
        <SidebarBody onAfterAction={onClose} />
      </div>
    </>
  );
}

export { SidebarBody };

// hook for the topbar to open the sheet on mobile
export function useSheetState() {
  const [open, setOpen] = useState(false);
  return { open, openSheet: () => setOpen(true), closeSheet: () => setOpen(false) };
}
