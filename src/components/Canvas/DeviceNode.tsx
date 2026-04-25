import { Handle, Position } from '@xyflow/react';
import type { DeviceType } from '../../types/device';

interface DeviceNodeProps {
  data: {
    label: string;
    type: DeviceType;
  };
}

export default function DeviceNode({ data }: DeviceNodeProps) {
  const getIcon = () => {
    switch (data.type) {
      case 'router': return '🔵';
      case 'switch': return '🟦';
      case 'pc': return '💻';
      default: return '❓';
    }
  };

  return (
    <div style={{ 
      backgroundColor: '#1e293b', 
      border: '2px solid #475569', 
      borderRadius: '6px', 
      padding: '12px', 
      color: 'white', 
      textAlign: 'center', 
      minWidth: '80px' 
    }}>
      <Handle type="target" position={Position.Top} style={{ background: '#3b82f6' }} />
      
      <div style={{ fontSize: '24px', marginBottom: '4px' }}>{getIcon()}</div>
      <div style={{ fontSize: '12px', fontWeight: 'bold', fontFamily: 'monospace' }}>{data.label}</div>

      <Handle type="source" position={Position.Bottom} style={{ background: '#3b82f6' }} />
    </div>
  );
}