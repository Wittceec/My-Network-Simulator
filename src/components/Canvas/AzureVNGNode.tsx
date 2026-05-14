import { Handle, Position } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import { Network } from 'lucide-react';

export default function AzureVNGNode({ data }: NodeProps) {
  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.95)',
      border: '2px solid #0078D4',
      borderRadius: '8px',
      padding: '10px 15px',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      minWidth: '150px',
      backdropFilter: 'blur(4px)'
    }}>
      <div style={{
        background: '#E5F1FB',
        borderRadius: '50%',
        padding: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Network size={24} color="#0078D4" />
      </div>
      <div>
        <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#323130' }}>
          {data.label as string}
        </div>
        <div style={{ fontSize: '11px', color: '#605E5C' }}>
          VPN Gateway
        </div>
      </div>
      
      {/* Target handle to connect TO Azure */}
      <Handle 
        type="target" 
        position={Position.Left} 
        style={{ width: '10px', height: '10px', background: '#0078D4', border: '2px solid white' }} 
      />
      
      {/* Source handle to connect FROM Azure */}
      <Handle 
        type="source" 
        position={Position.Right} 
        style={{ width: '10px', height: '10px', background: '#0078D4', border: '2px solid white' }} 
      />
    </div>
  );
}
