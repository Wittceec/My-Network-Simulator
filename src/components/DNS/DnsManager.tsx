import React, { useState, useEffect } from 'react';
import { useDnsStore } from '../../store/useDnsStore';
import { Server, Folder, File, X, ChevronRight, ChevronDown, Database, Globe } from 'lucide-react';
import type { DnsZone, DnsRecord } from '../../store/useDnsStore';

export default function DnsManager({ onClose }: { onClose: () => void }) {
  const dnsStore = useDnsStore();
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({ server: true, fwd: true, rev: true });
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);

  useEffect(() => {
    dnsStore.seedDefaultDns();
  }, []);

  const zones = Object.values(dnsStore.zones);
  const fwdZones = zones.filter(z => z.type === 'Forward');
  const revZones = zones.filter(z => z.type === 'Reverse');
  
  const selectedZone = selectedZoneId ? dnsStore.zones[selectedZoneId] : null;
  const records = selectedZone ? Object.values(selectedZone.records) : [];

  const toggleNode = (id: string) => {
    setExpandedNodes(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="modal-backdrop" onClick={onClose} style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{
        background: '#ece9d8', color: '#000',
        width: 800, maxWidth: '95vw', height: 550, maxHeight: '95vh',
        display: 'flex', flexDirection: 'column',
        boxShadow: '2px 2px 10px rgba(0,0,0,0.5)', border: '1px solid #0054e3',
        fontFamily: '"Tahoma", "Segoe UI", sans-serif'
      }}>
        <div style={{ 
          background: 'linear-gradient(to right, #0058e6, #3a93ff)', color: 'white', padding: '4px 8px', 
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #0054e3', fontSize: 13, fontWeight: 'bold'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Server size={14} color="#fff" /> DNS Manager
          </div>
          <button style={{ background: '#e81123', color: '#fff', border: 'none', width: 24, height: 20, cursor: 'pointer' }} onClick={onClose}>
            <X size={14} />
          </button>
        </div>

        {/* Toolbar */}
        <div style={{ background: '#f5f5f5', borderBottom: '1px solid #ccc', padding: '4px 8px', display: 'flex', gap: 16, fontSize: 12 }}>
          <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}><File size={14}/> File</div>
          <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>Action</div>
          <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>View</div>
          <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>Help</div>
        </div>

        <div style={{ display: 'flex', flex: 1, overflow: 'hidden', background: '#fff', margin: 2, border: '1px solid #7f9db9' }}>
          
          {/* LEFT TREE */}
          <div style={{ width: 250, borderRight: '1px solid #ccc', overflowY: 'auto', padding: 4 }}>
            <div style={{ display: 'flex', flexDirection: 'column', fontSize: 12 }}>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', padding: 2 }}>
                <div onClick={() => toggleNode('server')} style={{ width: 12, display: 'flex', justifyContent: 'center' }}>
                  {expandedNodes['server'] ? <ChevronDown size={12}/> : <ChevronRight size={12}/>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '2px 4px', flex: 1 }}>
                  <Database size={14} color="#f59e0b" /> DC01
                </div>
              </div>

              {expandedNodes['server'] && (
                <div style={{ paddingLeft: 16 }}>
                  {/* Forward Lookup Zones */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', padding: 2 }}>
                    <div onClick={() => toggleNode('fwd')} style={{ width: 12, display: 'flex', justifyContent: 'center' }}>
                      {expandedNodes['fwd'] ? <ChevronDown size={12}/> : <ChevronRight size={12}/>}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '2px 4px', flex: 1 }}>
                      <Folder size={14} color="#f59e0b" fill="#f59e0b" /> Forward Lookup Zones
                    </div>
                  </div>
                  
                  {expandedNodes['fwd'] && fwdZones.map(z => (
                    <div key={z.id} style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', padding: 2, paddingLeft: 16 }}>
                      <div style={{ width: 12 }}></div>
                      <div 
                        style={{ display: 'flex', alignItems: 'center', gap: 4, background: selectedZoneId === z.id ? '#316ac5' : 'transparent', color: selectedZoneId === z.id ? '#fff' : '#000', padding: '2px 4px', flex: 1 }}
                        onClick={() => setSelectedZoneId(z.id)}
                      >
                        <Globe size={14} color={selectedZoneId === z.id ? '#fff' : '#9ca3af'} /> {z.name}
                      </div>
                    </div>
                  ))}

                  {/* Reverse Lookup Zones */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', padding: 2 }}>
                    <div onClick={() => toggleNode('rev')} style={{ width: 12, display: 'flex', justifyContent: 'center' }}>
                      {expandedNodes['rev'] ? <ChevronDown size={12}/> : <ChevronRight size={12}/>}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '2px 4px', flex: 1 }}>
                      <Folder size={14} color="#f59e0b" fill="#f59e0b" /> Reverse Lookup Zones
                    </div>
                  </div>
                  
                  {expandedNodes['rev'] && revZones.map(z => (
                    <div key={z.id} style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', padding: 2, paddingLeft: 16 }}>
                      <div style={{ width: 12 }}></div>
                      <div 
                        style={{ display: 'flex', alignItems: 'center', gap: 4, background: selectedZoneId === z.id ? '#316ac5' : 'transparent', color: selectedZoneId === z.id ? '#fff' : '#000', padding: '2px 4px', flex: 1 }}
                        onClick={() => setSelectedZoneId(z.id)}
                      >
                        <Globe size={14} color={selectedZoneId === z.id ? '#fff' : '#9ca3af'} /> {z.name}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT LIST */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead style={{ background: '#ece9d8', borderBottom: '1px solid #ccc', textAlign: 'left' }}>
                <tr>
                  <th style={{ padding: '2px 6px', fontWeight: 'normal', borderRight: '1px solid #ccc', width: 150 }}>Name</th>
                  <th style={{ padding: '2px 6px', fontWeight: 'normal', borderRight: '1px solid #ccc', width: 100 }}>Type</th>
                  <th style={{ padding: '2px 6px', fontWeight: 'normal', borderRight: '1px solid #ccc' }}>Data</th>
                </tr>
              </thead>
              <tbody>
                {!selectedZone && (
                  <tr>
                    <td colSpan={3} style={{ padding: 16, color: '#666', textAlign: 'center' }}>Select a zone to view records.</td>
                  </tr>
                )}
                {selectedZone && records.length === 0 && (
                  <tr>
                    <td colSpan={3} style={{ padding: 16, color: '#666', textAlign: 'center' }}>There are no items to show in this view.</td>
                  </tr>
                )}
                {selectedZone && records.map(r => (
                  <tr key={r.id} className="ad-row" style={{ cursor: 'default' }}>
                    <td style={{ padding: '2px 6px', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <File size={14} color="#9ca3af" />
                      {r.name === '@' ? '(same as parent folder)' : r.name}
                    </td>
                    <td style={{ padding: '2px 6px' }}>{r.type}</td>
                    <td style={{ padding: '2px 6px' }}>{r.data}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Status Bar */}
        <div style={{ background: '#ece9d8', padding: '2px 8px', fontSize: 11, borderTop: '1px solid #ccc' }}>
          {records.length} records
        </div>
      </div>
      <style>{`.ad-row:hover { background: #e5f3ff; }`}</style>
    </div>
  );
}
