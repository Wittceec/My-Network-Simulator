import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Network } from 'lucide-react';

function AzureVNetNode({ data }: NodeProps) {
  return (
    <div style={{
      width: 400,
      height: 300,
      border: '2px dashed #0078D4',
      borderRadius: '8px',
      backgroundColor: 'rgba(0, 120, 212, 0.05)',
      position: 'relative',
      pointerEvents: 'none' // Let clicks pass through to children
    }}>
      <div style={{
        position: 'absolute',
        top: -12,
        left: 20,
        backgroundColor: '#0078D4',
        color: 'white',
        padding: '4px 12px',
        borderRadius: '4px',
        fontSize: '12px',
        fontWeight: 'bold',
        display: 'flex',
        alignItems: 'center',
        gap: '6px'
      }}>
        <Network size={14} />
        {data.label as string}
      </div>
      <div style={{
        position: 'absolute',
        top: 16,
        left: 20,
        fontSize: '10px',
        color: '#0078D4',
        fontFamily: 'monospace'
      }}>
        {data.addressSpace as string}
      </div>
      
      {/* Target handle for Peering/VPN connections */}
      <Handle type="target" position={Position.Left} style={{ opacity: 0 }} />
    </div>
  );
}

export default memo(AzureVNetNode);
