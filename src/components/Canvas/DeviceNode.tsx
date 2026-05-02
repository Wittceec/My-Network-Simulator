import { useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import type { DeviceType } from '../../types/device';
import { Server, Monitor, HardDrive, Power } from 'lucide-react';
import { useNetworkStore } from '../../store/useNetworkStore';

interface DeviceNodeProps {
  data: {
    id: string;
    label: string;
    type: DeviceType;
  };
}

const META: Record<DeviceType, { glyph: React.ReactNode; label: string }> = {
  router: { glyph: <Server size={28} strokeWidth={2} />, label: 'ROUTER' },
  switch: { glyph: <HardDrive size={28} strokeWidth={2} />, label: 'SWITCH' },
  pc:     { glyph: <Monitor size={28} strokeWidth={2} />, label: 'PC' },
};

export default function DeviceNode({ data }: DeviceNodeProps) {
  const meta = META[data.type] ?? { glyph: '◇', label: 'DEVICE' };
  const device = useNetworkStore((state) => state.devices[data.id]);
  const togglePower = useNetworkStore((state) => state.toggleDevicePower);
  
  const [isHovered, setIsHovered] = useState(false);
  
  if (!device) return null;
  const isPoweredOn = device.powerOn ?? true;

  const handlePowerToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    togglePower(device.id);
  };

  return (
    <div 
      className={`node ${data.type}`} 
      style={{ opacity: isPoweredOn ? 1 : 0.5, filter: isPoweredOn ? 'none' : 'grayscale(100%)', position: 'relative' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Handle type="target" position={Position.Top} />
      
      {/* Tooltip Overlay */}
      {isHovered && (
        <div style={{
          position: 'absolute', bottom: '110%', left: '50%', transform: 'translateX(-50%)',
          background: 'var(--surface)', backdropFilter: 'blur(12px)', border: '1px solid var(--border)',
          borderRadius: '8px', padding: '10px', width: '200px', zIndex: 100,
          boxShadow: '0 10px 30px rgba(0,0,0,0.5)', pointerEvents: 'none', textAlign: 'left'
        }}>
          <div style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase' }}>
            {device.hostname} Info
          </div>
          {Object.entries(device.interfaces).map(([name, intf]) => (
            <div key={name} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontFamily: 'var(--font-mono)', marginBottom: '4px' }}>
              <span style={{ color: intf.isUp ? 'var(--link-active)' : 'var(--link-down)' }}>{intf.id.substring(0,2)}{intf.id.match(/\d.*/)?.[0]}</span>
              <span style={{ color: 'var(--text)' }}>{intf.ipAddress || 'Unassigned'}</span>
            </div>
          ))}
          {Object.keys(device.interfaces).length === 0 && (
            <div style={{ fontSize: '10px', color: 'var(--text-dim)', fontStyle: 'italic' }}>No interfaces</div>
          )}
        </div>
      )}

      {/* Power Button */}
      <button 
        onClick={handlePowerToggle}
        style={{
          position: 'absolute', top: '-10px', right: '-10px', width: '24px', height: '24px',
          borderRadius: '50%', background: isPoweredOn ? 'var(--link-active)' : 'var(--link-down)',
          color: '#fff', border: '2px solid var(--bg)', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 0 10px ${isPoweredOn ? 'rgba(34, 197, 94, 0.5)' : 'rgba(239, 68, 68, 0.5)'}`
        }}
        title={isPoweredOn ? 'Power Off' : 'Power On'}
      >
        <Power size={12} strokeWidth={3} />
      </button>

      <div className="ntype">{meta.label}</div>
      <div className="nglyph">{meta.glyph}</div>
      <div className="nname">{data.label}</div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}
