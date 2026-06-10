import { runOSPF } from '../../core/logic/ospf';
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
import CustomLinkEdge from './CustomLinkEdge';
import AzureVNetNode from './AzureVNetNode';
import AzureVMNode from './AzureVMNode';
import AzureVNGNode from './AzureVNGNode';
import { useNetworkStore } from '../../store/useNetworkStore';
import { useAzureStore } from '../../store/useAzureStore';
import { useActiveDirectoryStore } from '../../store/useActiveDirectoryStore';
import type { DeviceType, Device } from '../../types/device';

const nodeTypes = {
  networkDevice: DeviceNode,
  azureVNet: AzureVNetNode,
  azureVM: AzureVMNode,
  azureVNG: AzureVNGNode,
};

const edgeTypes = {
  customLink: CustomLinkEdge,
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

  // --- UI STATES ---
  const [selectedItems, setSelectedItems] = useState({ nodes: [] as string[], edges: [] as string[] });
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null); // NEW: Tracks "Connect Mode"

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
    setTimeout(() => runOSPF(), 50); // Recalculate routes after deletion!
  };

  // NEW: Puts the canvas into "Connect Mode"
  const handleStartConnect = () => {
    if (selectedItems.nodes.length === 1) {
      setConnectingFrom(selectedItems.nodes[0]);
      // Visually deselect the node so it's clear they are in a new mode
      setNodes((nds) => nds.map((n) => ({ ...n, selected: false })));
    }
  };

  // UPDATED: Intercepts clicks if we are in "Connect Mode"
  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      if (connectingFrom) {
        // If tapping a different node, draw the cable!
        if (connectingFrom !== node.id) {
          const linkId = `link-${connectingFrom}-${node.id}`;
          addLinkToStore({
            id: linkId,
            sourceDeviceId: connectingFrom,
            sourceInterfaceId: 'fastethernet0/0',
            targetDeviceId: node.id,
            targetInterfaceId: 'fastethernet0/0',
          });
        }
        // Always exit connect mode after tapping a node
        setConnectingFrom(null);
      } else {
        // Normal behavior: open the terminal
        openTerminal(node.id);
      }
    },
    [connectingFrom, addLinkToStore, openTerminal]
  );
  // -----------------

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

      // Add to Active Directory if it's a PC
      if (type === 'pc') {
        const adStore = useActiveDirectoryStore.getState();
        const workstationsOu = Object.values(adStore.ous).find(ou => ou.name === 'Workstations');
        if (workstationsOu) {
          adStore.createComputer({
            id: `comp-${newId.toLowerCase()}`, name: newId, type: 'Computer',
            distinguishedName: `CN=${newId},OU=Workstations,DC=corp,DC=local`,
            enabled: true, operatingSystem: 'Windows 11 Enterprise', operatingSystemVersion: '10.0',
            parentOuId: workstationsOu.id
          });
        }
      }
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
      setTimeout(() => runOSPF(), 50); // NEW
    },
    [addLinkToStore]
  );

  const onNodesDelete = useCallback((deletedNodes: Node[]) => {
    deletedNodes.forEach((node) => removeDevice(node.id));
  }, [removeDevice]);

  const onEdgesDelete = useCallback((deletedEdges: Edge[]) => {
    deletedEdges.forEach((edge) => removeLink(edge.id));
    setTimeout(() => runOSPF(), 50); // NEW
  }, [removeLink]);

  const storeDevices = useNetworkStore((state) => state.devices);
  const storeLinks = useNetworkStore((state) => state.links);
  const activeLinks = useNetworkStore((state) => state.activeLinks);
  const { vnets, vms, vngs } = useAzureStore();

  useEffect(() => {
    setNodes((currentNodes) => {
      const regularNodes: Node[] = Object.values(storeDevices).map((dev, index) => {
        const existingNode = currentNodes.find(n => n.id === dev.id);
        return {
          id: dev.id,
          type: 'networkDevice',
          position: existingNode ? existingNode.position : { x: 100 + index * 150, y: 200 },
          data: { id: dev.id, label: dev.hostname, type: dev.type },
        };
      });

      const azureNodes: Node[] = [];
      let vnetYOffset = 0;
      Object.values(vnets).forEach((vnet, index) => {
        const existingNode = currentNodes.find(n => n.id === vnet.id);
        const vnetNodeId = vnet.id;
        azureNodes.push({
          id: vnetNodeId,
          type: 'azureVNet',
          position: existingNode ? existingNode.position : { x: 600, y: 100 + vnetYOffset },
          data: { label: vnet.name, addressSpace: vnet.addressSpace[0] },
          style: { width: 400, height: 300, zIndex: -1 },
        });

        const vnetVms = Object.values(vms).filter(vm => {
          const subnet = vnet.subnets.find(s => s.id === vm.subnetId);
          return !!subnet;
        });

        vnetVms.forEach((vm, vmIndex) => {
          const existingVmNode = currentNodes.find(n => n.id === vm.id);
          azureNodes.push({
            id: vm.id,
            type: 'azureVM',
            position: existingVmNode ? existingVmNode.position : { x: 50, y: 50 + (vmIndex * 80) },
            data: { label: vm.name, status: vm.status, os: vm.os },
            parentId: vnetNodeId,
            extent: 'parent',
          });
        });

        const vnetVngs = Object.values(vngs).filter(vng => vng.vnetId === vnet.id);
        vnetVngs.forEach((vng, vngIndex) => {
          const existingVngNode = currentNodes.find(n => n.id === vng.id);
          azureNodes.push({
            id: vng.id,
            type: 'azureVNG',
            position: existingVngNode ? existingVngNode.position : { x: -75, y: 100 + (vngIndex * 100) },
            data: { label: vng.name },
            parentId: vnetNodeId,
          });
        });

        vnetYOffset += 350;
      });

      return [...regularNodes, ...azureNodes];
    });

    setEdges(() => {
      return Object.values(storeLinks).map((link) => {
        const isActive = activeLinks.includes(link.id);
        return {
          id: link.id,
          source: link.sourceDeviceId,
          target: link.targetDeviceId,
          type: 'customLink',
          animated: isActive,
          style: {
            stroke: isActive ? '#4ade80' : 'rgba(255,255,255,0.2)', // green for ping
            strokeWidth: isActive ? 4 : 2,
            transition: 'all 0.2s ease',
            filter: isActive ? 'drop-shadow(0 0 8px rgba(74, 222, 128, 0.8))' : 'none'
          },
        };
      });
    });
  }, [storeDevices, storeLinks, activeLinks, vnets, vms, vngs, setNodes, setEdges]);

  return (
    <div style={{ flexGrow: 1, height: '100%', background: '#08080b', position: 'relative' }} ref={reactFlowWrapper}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodesDelete={onNodesDelete} 
        onEdgesDelete={onEdgesDelete} 
        onDragOver={onDragOver}
        onDrop={onDrop}
        onConnect={onConnect}
        onNodeClick={handleNodeClick} // NEW HANDLER
        onPaneClick={() => setConnectingFrom(null)} // Cancel if user taps the background
        fitView
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={'dots' as any} color="#1c1c24" gap={24} size={1.5} />
        <Controls position="bottom-left" showInteractive={false} />
        
        {/* NEW: Dynamic Panels for Connecting and Deleting */}
        {connectingFrom ? (
          <Panel position="top-center" style={{ marginTop: '20px' }}>
            <div style={{
              background: '#4f8fff', color: '#0a0a0d', padding: '10px 20px',
              borderRadius: '30px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '12px',
              boxShadow: '0 6px 16px rgba(79, 143, 255, 0.4)'
            }}>
              <span>Tap target device to connect...</span>
              <button
                onClick={() => setConnectingFrom(null)}
                style={{ 
                  background: 'rgba(0,0,0,0.15)', border: 'none', color: '#0a0a0d', 
                  width: '26px', height: '26px', borderRadius: '50%', cursor: 'pointer', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' 
                }}
              >✕</button>
            </div>
          </Panel>
        ) : (
          (selectedItems.nodes.length > 0 || selectedItems.edges.length > 0) && (
            <Panel position="top-right" style={{ display: 'flex', gap: '10px', margin: '10px' }}>
              {selectedItems.nodes.length === 1 && selectedItems.edges.length === 0 && (
                <button 
                  className="btn" 
                  onClick={handleStartConnect}
                  style={{ 
                    background: '#4f8fff', 
                    color: '#0a0a0d', 
                    borderColor: '#4f8fff',
                    boxShadow: '0 4px 12px rgba(79, 143, 255, 0.3)'
                  }}
                >
                  🔗 Connect
                </button>
              )}
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
                🗑️ Delete
              </button>
            </Panel>
          )
        )}
      </ReactFlow>
    </div>
  );
}