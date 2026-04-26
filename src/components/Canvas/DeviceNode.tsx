import { Handle, Position } from '@xyflow/react';
import type { DeviceType } from '../../types/device';

interface DeviceNodeProps {
  data: {
    label: string;
    type: DeviceType;
  };
}

const META: Record<DeviceType, { glyph: string; label: string }> = {
  router: { glyph: '◉', label: 'ROUTER' },
  switch: { glyph: '▦', label: 'SWITCH' },
  pc:     { glyph: '▭', label: 'PC' },
};

export default function DeviceNode({ data }: DeviceNodeProps) {
  const meta = META[data.type] ?? { glyph: '◇', label: 'DEVICE' };

  return (
    <div className={`node ${data.type}`}>
      <Handle type="target" position={Position.Top} />
      <div className="ntype">{meta.label}</div>
      <div className="nglyph">{meta.glyph}</div>
      <div className="nname">{data.label}</div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}
