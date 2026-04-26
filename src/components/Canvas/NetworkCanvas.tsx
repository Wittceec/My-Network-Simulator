import { useCallback, useRef, useEffect, useState } from 'react';
import { useUIStore } from '../../store/useUIStore';
import {
  ReactFlow,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  useReactFlow,
  addEdge,
  Panel,
  useOnSelectionChange,
  type Connection,
  type Node,
  type Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import DeviceNode from './DeviceNode';
import { useNetworkStore } from '../../store/useNetworkStore';
import type { DeviceType, Device } from '../../types/device';

const nodeTypes = {
  networkDevice: DeviceNode,
};

const initialNodes: Node[] = [];

export default function NetworkCanvas() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const { screenToFlowPosition } = useReactFlow();

  const addDeviceToStore = useNetworkStore((state) => state.addDevice);
  const removeDevice = useNetworkStore((state) => state.removeDevice);
  const addLinkToStore = useNetworkStore((state) => state.addLink);
  const removeLink = useNetworkStore((state) => state.removeLink);
  const openTerminal = useUIStore((state) => state.openTerminal);

  // --- NEW: Tracking Selected Items for Mobile Deletion ---
  const [selectedItems, setSelectedItems] = useState({ nodes: [] as string[], edges: [] as string[] });

  useOnSelectionChange({
    onChange: ({ nodes, edges }) => {
      setSelectedItems({
        nodes: nodes.map((n) => n.id),
        edges: edges.map((e) => e.id),
      });
    },
  });

  const handleDeleteSelected = () => {
    selectedItems.nodes.forEach((id) => removeDevice(id));
    selectedItems.edges.forEach((id) => removeLink(id));
    setSelectedItems({ nodes: [], edges: [] });
  };
  // --------------------------------------------------------

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const type = event.dataTransfer.getData('application/reactflow') as DeviceType;
      if (!type) return;

      const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });

      const idNumber = nodes.filter((n) => n.data.type === type).length + 1;
      const prefix = type === 'router' ? 'R' : type === 'switch' ? 'SW' : 'PC';
      const newId = `${prefix}${idNumber}`;

      const newLogicalDevice: Device = {
        id: newId, hostname: newId, type: type, interfaces: {},
        routingTable: [], macAddressTable: {}, arpTable: {}, vlans: {}, acls: {},
      };
      addDeviceToStore(newLogicalDevice);
    },
    [screenToFlowPosition, nodes, addDeviceToStore]
  );

  const onConnect = useCallback(
    (params: Connection) => {
      const linkId = `link-${params.source}-${params.target}`;
      addLinkToStore({
        id: linkId,
        sourceDeviceId: params.source || '',
        sourceInterfaceId: 'fastethernet0/0',
        targetDeviceId: params.target || '',
        targetInterfaceId: 'fastethernet0/0',
      });
    },
    [addLinkToStore]
  );

  const onNodesDelete = useCallback((deletedNodes: Node[]) => {
    deletedNodes.forEach((node) => removeDevice(node.id));
  }, [removeDevice]);

  const onEdgesDelete = useCallback((deletedEdges: Edge[]) => {
    deletedEdges.forEach((edge) => removeLink(edge.id));
  }, [removeLink]);

  const storeDevices = useNetworkStore((state) => state.devices);
  const storeLinks = useNetworkStore((state) => state.links);
  const activeLink = useNetworkStore((state) => state.activeLink);

  useEffect(() => {
    setNodes((currentNodes) => {
      return Object.values(storeDevices).map((dev, index) => {
        const existingNode = currentNodes.find(n => n.id === dev.id);
        return {
          id: dev.id,
          type: 'networkDevice',
          position: existingNode ? existingNode.position : { x: 100 + index * 150, y: 200 },
          data: { label: dev.hostname, type: dev.type },
        };
      });
    });

    setEdges(() => {
      return Object.values(storeLinks).map((link) => ({
        id: link.id,
        source: link.sourceDeviceId,
        target: link.targetDeviceId,
        animated: activeLink === link.id,
        style: {
          stroke: activeLink === link.id ? '#7dd44a' : '#3a3a45',
          strokeWidth: activeLink === link.id ? 3.5 : 1.75,
          transition: 'all 0.2s ease',
        },
      }));
    });
  }, [storeDevices, storeLinks, activeLink, setNodes, setEdges]);

  return (
    <div style={{ flexGrow: 1, height: '100%', background: '#08080b', position: 'relative' }} ref={reactFlowWrapper}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodesDelete={onNodesDelete} 
        onEdgesDelete={onEdgesDelete} 
        onDragOver={onDragOver}
        onDrop={onDrop}
        onConnect={onConnect}
        onNodeClick={(_, node) => openTerminal(node.id)}
        fitView
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={'dots' as any} color="#1c1c24" gap={24} size={1.5} />
        <Controls position="bottom-left" showInteractive={false} />
        
        {/* NEW: Floating Delete Button for Mobile (and Desktop) */}
        {(selectedItems.nodes.length > 0 || selectedItems.edges.length > 0) && (
          <Panel position="top-right">
            <button 
              className="btn" 
              onClick={handleDeleteSelected}
              style={{ 
                background: '#ef5350', 
                color: 'white', 
                borderColor: '#ef5350',
                boxShadow: '0 4px 12px rgba(239, 83, 80, 0.3)'
              }}
            >
              🗑️ Delete Selected
            </button>
          </Panel>
        )}
      </ReactFlow>
    </div>
  );
}