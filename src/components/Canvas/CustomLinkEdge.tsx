import { getBezierPath, type EdgeProps } from '@xyflow/react';
import { useNetworkStore } from '../../store/useNetworkStore';

export default function CustomLinkEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style,
  markerEnd,
}: EdgeProps) {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const link = useNetworkStore((state) => state.links[id]);
  const sourceDevice = useNetworkStore((state) => link ? state.devices[link.sourceDeviceId] : null);
  const targetDevice = useNetworkStore((state) => link ? state.devices[link.targetDeviceId] : null);

  const sourceUp = sourceDevice?.interfaces[link?.sourceInterfaceId || '']?.isUp ?? false;
  const targetUp = targetDevice?.interfaces[link?.targetInterfaceId || '']?.isUp ?? false;

  return (
    <>
      {/* Invisible thick path to make it easier to grab/click */}
      <path
        d={edgePath}
        fill="none"
        strokeOpacity={0}
        strokeWidth={20}
        className="react-flow__edge-interaction"
      />
      <path
        id={id}
        style={style}
        className="react-flow__edge-path"
        d={edgePath}
        markerEnd={markerEnd}
      />
      {/* Source Link Light */}
      <circle
        cx={sourceX}
        cy={sourceY}
        r={6}
        className={`link-light ${sourceUp ? 'up' : 'down'}`}
      />
      {/* Target Link Light */}
      <circle
        cx={targetX}
        cy={targetY}
        r={6}
        className={`link-light ${targetUp ? 'up' : 'down'}`}
      />
    </>
  );
}
