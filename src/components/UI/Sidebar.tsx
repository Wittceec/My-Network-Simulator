import { useNetworkStore } from '../../store/useNetworkStore';

export default function Sidebar() {
  const loadLab = useNetworkStore(state => state.loadLab);

  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  const handleImport = () => {
    const rawJson = prompt("Paste your Lab JSON here:");
    if (rawJson) {
      try {
        const data = JSON.parse(rawJson);
        loadLab(data.devices, data.links);
      } catch (e) {
        alert("Invalid Lab Format!");
      }
    }
  };

  // NEW: Export Function
  const handleExport = () => {
    const state = useNetworkStore.getState();
    const labData = {
      devices: state.devices,
      links: state.links
    };
    
    // Create a downloadable JSON file
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(labData, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "my_network_lab.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const itemStyle = {
    padding: '12px', marginBottom: '10px', backgroundColor: '#1e293b',
    color: 'white', border: '1px solid #475569', borderRadius: '6px',
    cursor: 'grab', textAlign: 'center' as const, fontWeight: 'bold' as const
  };

  return (
    <aside style={{ 
      width: '260px', backgroundColor: '#0f172a', borderRight: '1px solid #334155', 
      padding: '20px', display: 'flex', flexDirection: 'column',
      height: '100%', boxSizing: 'border-box'
    }}>
      <h2 style={{ color: 'white', marginBottom: '20px', fontSize: '1.2rem' }}>Devices</h2>
      
      <div style={itemStyle} onDragStart={(e) => onDragStart(e, 'router')} draggable>🔵 Router</div>
      <div style={itemStyle} onDragStart={(e) => onDragStart(e, 'switch')} draggable>🟦 Switch</div>
      <div style={itemStyle} onDragStart={(e) => onDragStart(e, 'pc')} draggable>💻 PC</div>

      <div style={{ marginTop: 'auto', borderTop: '1px solid #334155', paddingTop: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <button onClick={handleExport} style={{ 
            width: '100%', padding: '12px', background: '#10b981', 
            color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' 
          }}>
          💾 Export Lab JSON
        </button>
        <button onClick={handleImport} style={{ 
            width: '100%', padding: '12px', background: '#3b82f6', 
            color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' 
          }}>
          📥 Import Lab JSON
        </button>
      </div>
    </aside>
  );
}