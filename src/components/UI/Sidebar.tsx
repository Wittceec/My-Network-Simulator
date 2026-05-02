import { useState } from 'react';
import { useNetworkStore } from '../../store/useNetworkStore';
import { Server, Monitor, HardDrive, Download, Upload, GripVertical } from 'lucide-react';

const DEVICE_META = {
  router: { glyph: <Server size={20} strokeWidth={2.5} />, label: 'Router', sub: 'L3 · routing · DHCP' },
  switch: { glyph: <HardDrive size={20} strokeWidth={2.5} />, label: 'Switch', sub: 'L2 · VLAN · trunking' },
  pc:     { glyph: <Monitor size={20} strokeWidth={2.5} />, label: 'PC',     sub: 'Host · ipconfig · ping' },
} as const;

type DevKind = keyof typeof DEVICE_META;

interface SidebarBodyProps {
  onAfterAction?: () => void;
}

function SidebarBody({ onAfterAction }: SidebarBodyProps) {
  const devices = useNetworkStore((s) => s.devices);
  const links = useNetworkStore((s) => s.links);
  const loadLab = useNetworkStore((s) => s.loadLab);
  const addDevice = useNetworkStore((s) => s.addDevice); // NEW

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

  // NEW: Allows tapping on mobile to spawn a device without dragging
  const handleDeviceTap = (type: DevKind) => {
    const typeArray = Object.values(devices).filter(d => d.type === type);
    const idNumber = typeArray.length + 1;
    const prefix = type === 'router' ? 'R' : type === 'switch' ? 'SW' : 'PC';
    const newId = `${prefix}${idNumber}`;

    addDevice({
      id: newId, hostname: newId, type: type, interfaces: {},
      routingTable: [], macAddressTable: {}, arpTable: {}, vlans: {}, acls: {},
    });
    
    if (onAfterAction) onAfterAction(); // Closes the mobile sheet
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
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(labData, null, 2));
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
            <span className="count">DRAG OR TAP</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {(Object.keys(DEVICE_META) as DevKind[]).map((kind) => {
              const meta = DEVICE_META[kind];
              return (
                <div
                  key={kind}
                  className={`dev-chip ${kind}`}
                  onDragStart={(e) => onDragStart(e, kind)}
                  onClick={() => handleDeviceTap(kind)} // NEW
                  draggable
                >
                  <span className="glyph">{meta.glyph}</span>
                  <div className="col">
                    <span className="name">{meta.label}</span>
                    <span className="sub">{meta.sub}</span>
                  </div>
                  <span className="grab"><GripVertical size={16} /></span>
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
          <div className="legend-row"><span className="swatch" style={{ background: 'var(--router)' }}></span>Router · L3</div>
          <div className="legend-row"><span className="swatch" style={{ background: 'var(--switch)' }}></span>Switch · L2</div>
          <div className="legend-row"><span className="swatch" style={{ background: 'var(--pc)' }}></span>PC · Host</div>
          <div className="legend-row"><span className="swatch" style={{ background: 'var(--link-active)' }}></span>Active link</div>
        </div>
      </div>

      <div style={{ borderTop: '1px solid var(--border)', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <button className="btn" onClick={handleExport}><Download size={16} />Export Lab</button>
        <button className="btn" onClick={handleImport}><Upload size={16} />Import Lab</button>
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <span className="section-label">Devices · Lab</span>
          <span className="mono" style={{ fontSize: 10, color: 'var(--text-dim)' }}>tap or drag onto canvas</span>
        </div>
        <SidebarBody onAfterAction={onClose} />
      </div>
    </>
  );
}

export { SidebarBody };

export function useSheetState() {
  const [open, setOpen] = useState(false);
  return { open, openSheet: () => setOpen(true), closeSheet: () => setOpen(false) };
}