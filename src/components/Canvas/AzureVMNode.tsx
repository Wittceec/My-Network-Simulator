import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Server } from 'lucide-react';

function AzureVMNode({ data, selected }: NodeProps) {
  return (
    <div style={{
      background: 'var(--card)',
      backdropFilter: 'blur(12px)',
      border: `1px solid ${selected ? '#0078D4' : 'var(--border)'}`,
      borderTop: '3px solid #0078D4',
      borderRadius: '12px',
      padding: '16px',
      minWidth: '120px',
      textAlign: 'center',
      boxShadow: selected ? '0 0 0 2px var(--bg), 0 0 0 4px #0078D4, 0 10px 30px rgba(0, 120, 212, 0.3)' : '0 4px 20px rgba(0,0,0,0.3)',
      transition: 'box-shadow 0.2s, border-color 0.2s'
    }}>
      <div style={{
        fontFamily: 'var(--font-display)',
        fontSize: '9px',
        fontWeight: 800,
        letterSpacing: '1.5px',
        textTransform: 'uppercase',
        marginBottom: '8px',
        opacity: 0.8,
        color: '#0078D4'
      }}>
        AZURE VM
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px', color: '#0078D4' }}>
        <Server size={32} strokeWidth={1.5} />
      </div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', fontWeight: 700, color: 'var(--text)' }}>
        {data.label as string}
      </div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
        {data.os as string}
      </div>

      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
    </div>
  );
}

export default memo(AzureVMNode);
