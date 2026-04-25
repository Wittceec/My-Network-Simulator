import { useCallback, useRef, useState, useEffect } from 'react';
import { useUIStore } from '../../store/useUIStore'; // This was missing!
import {
  ReactFlow,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  useReactFlow,
  addEdge,
  type Connection,
  type Node,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import DeviceNode from './DeviceNode';
import { useNetworkStore } from '../../store/useNetworkStore';
import type { DeviceType, Device } from '../../types/device';

const nodeTypes = {
  networkDevice: DeviceNode,
};

// We start with an empty canvas now!
const initialNodes: Node[] = [];

export default function NetworkCanvas() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const { screenToFlowPosition } = useReactFlow();
  
  // Bring in our central brain
  const addDeviceToStore = useNetworkStore((state) => state.addDevice);
  const addLinkToStore = useNetworkStore((state) => state.addLink); 
  const openTerminal = useUIStore((state) => state.openTerminal); 
  
  // Allow the canvas to be a drop zone
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow') as DeviceType;
      if (!type) return;

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const idNumber = nodes.filter((n) => n.data.type === type).length + 1;
      const prefix = type === 'router' ? 'R' : type === 'switch' ? 'SW' : 'PC';
      const newId = `${prefix}${idNumber}`;

      const newNode: Node = {
        id: newId,
        type: 'networkDevice',
        position,
        data: { label: newId, type: type },
      };
      setNodes((nds) => nds.concat(newNode));

      const newLogicalDevice: Device = {
        id: newId,
        hostname: newId,
        type: type,
        interfaces: {},
        routingTable: [],
        macAddressTable: {},
        arpTable: {},
        vlans: {},
        acls: {},
      };
      addDeviceToStore(newLogicalDevice);
    },
    [screenToFlowPosition, nodes, setNodes, addDeviceToStore]
  );

  // Fires when you connect two devices with a cable
  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) => addEdge({ ...params, animated: true }, eds));

      const linkId = `link-${params.source}-${params.target}`;
      addLinkToStore({
        id: linkId,
        sourceDeviceId: params.source || '',
        sourceInterfaceId: 'fastethernet0/0', 
        targetDeviceId: params.target || '',
        targetInterfaceId: 'fastethernet0/0', 
      });
    },
    [setEdges, addLinkToStore]
  );

  // Sync visual nodes/edges when the store is updated (e.g. via Import)
  const storeDevices = useNetworkStore((state) => state.devices);
  const storeLinks = useNetworkStore((state) => state.links);

  useEffect(() => {
    const newNodes: Node[] = Object.values(storeDevices).map((dev, index) => ({
      id: dev.id,
      type: 'networkDevice',
      position: { x: 100 + (index * 150), y: 200 }, 
      data: { label: dev.hostname, type: dev.type },
    }));

    const newEdges = Object.values(storeLinks).map((link) => ({
      id: link.id,
      source: link.sourceDeviceId,
      target: link.targetDeviceId,
      animated: true,
    }));

    setNodes(newNodes);
    setEdges(newEdges);
  }, [storeDevices, storeLinks, setNodes, setEdges]);

  return (
    <div style={{ flexGrow: 1, height: '100%', backgroundColor: '#020617' }} ref={reactFlowWrapper}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onConnect={onConnect}
        onNodeClick={(_, node) => openTerminal(node.id)} 
        fitView
      >
        <Background color="#334155" gap={20} size={2} />
        <Controls style={{ backgroundColor: 'white', color: 'black' }} />
      </ReactFlow>
    </div>
  );
}