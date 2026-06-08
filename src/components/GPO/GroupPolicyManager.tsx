import React, { useState, useEffect } from 'react';
import { useGpoStore } from '../../store/useGpoStore';
import { Server, Folder, File, X, ChevronRight, ChevronDown, FileText, Settings } from 'lucide-react';

export default function GroupPolicyManager({ onClose }: { onClose: () => void }) {
  const gpoStore = useGpoStore();
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({
    root: true, domains: true, domain: true, gpos: true
  });
  const [selectedGpoId, setSelectedGpoId] = useState<string | null>(null);

  useEffect(() => {
    gpoStore.seedDefaultGpos();
  }, []);

  const gpos = Object.values(gpoStore.gpos);
  const selectedGpo = selectedGpoId ? gpoStore.gpos[selectedGpoId] : null;

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
            <FileText size={14} color="#fff" /> Group Policy Management
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
                <div onClick={() => toggleNode('root')} style={{ width: 12, display: 'flex', justifyContent: 'center' }}>
                  {expandedNodes['root'] ? <ChevronDown size={12}/> : <ChevronRight size={12}/>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '2px 4px', flex: 1 }}>
                  <Folder size={14} color="#f59e0b" fill="#f59e0b" /> Forest: corp.local
                </div>
              </div>

              {expandedNodes['root'] && (
                <div style={{ paddingLeft: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', padding: 2 }}>
                    <div onClick={() => toggleNode('domains')} style={{ width: 12, display: 'flex', justifyContent: 'center' }}>
                      {expandedNodes['domains'] ? <ChevronDown size={12}/> : <ChevronRight size={12}/>}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '2px 4px', flex: 1 }}>
                      <Folder size={14} color="#f59e0b" fill="#f59e0b" /> Domains
                    </div>
                  </div>
                  
                  {expandedNodes['domains'] && (
                    <div style={{ paddingLeft: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', padding: 2 }}>
                        <div onClick={() => toggleNode('domain')} style={{ width: 12, display: 'flex', justifyContent: 'center' }}>
                          {expandedNodes['domain'] ? <ChevronDown size={12}/> : <ChevronRight size={12}/>}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '2px 4px', flex: 1 }}>
                          <Server size={14} color="#3b82f6" /> corp.local
                        </div>
                      </div>

                      {expandedNodes['domain'] && (
                        <div style={{ paddingLeft: 16 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', padding: 2 }}>
                            <div onClick={() => toggleNode('gpos')} style={{ width: 12, display: 'flex', justifyContent: 'center' }}>
                              {expandedNodes['gpos'] ? <ChevronDown size={12}/> : <ChevronRight size={12}/>}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '2px 4px', flex: 1 }}>
                              <Folder size={14} color="#f59e0b" fill="#f59e0b" /> Group Policy Objects
                            </div>
                          </div>
                          
                          {expandedNodes['gpos'] && gpos.map(gpo => (
                            <div key={gpo.id} style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', padding: 2, paddingLeft: 16 }}>
                              <div style={{ width: 12 }}></div>
                              <div 
                                style={{ display: 'flex', alignItems: 'center', gap: 4, background: selectedGpoId === gpo.id ? '#316ac5' : 'transparent', color: selectedGpoId === gpo.id ? '#fff' : '#000', padding: '2px 4px', flex: 1 }}
                                onClick={() => setSelectedGpoId(gpo.id)}
                              >
                                <FileText size={14} color={selectedGpoId === gpo.id ? '#fff' : '#9ca3af'} /> {gpo.name}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT VIEW */}
          <div style={{ flex: 1, overflowY: 'auto', background: '#fff', display: 'flex', flexDirection: 'column' }}>
            {!selectedGpo ? (
              <div style={{ padding: 16, color: '#666', textAlign: 'center' }}>Select a Group Policy Object to view its details.</div>
            ) : (
              <div style={{ padding: 16 }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: 16 }}>{selectedGpo.name}</h3>
                
                <div style={{ background: '#ece9d8', padding: 8, border: '1px solid #ccc', marginBottom: 16 }}>
                  <strong>Status:</strong> {selectedGpo.status}
                </div>

                <h4 style={{ margin: '0 0 8px 0', fontSize: 13, borderBottom: '1px solid #ccc', paddingBottom: 4 }}>Links</h4>
                <ul style={{ margin: '0 0 16px 0', paddingLeft: 20, fontSize: 12 }}>
                  {selectedGpo.links.map((link, idx) => <li key={idx}>{link}</li>)}
                </ul>

                <h4 style={{ margin: '0 0 8px 0', fontSize: 13, borderBottom: '1px solid #ccc', paddingBottom: 4 }}>Settings</h4>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead style={{ background: '#f5f5f5', borderBottom: '1px solid #ccc', textAlign: 'left' }}>
                    <tr>
                      <th style={{ padding: '4px 8px', borderRight: '1px solid #ccc' }}>Category</th>
                      <th style={{ padding: '4px 8px', borderRight: '1px solid #ccc' }}>Policy</th>
                      <th style={{ padding: '4px 8px' }}>State</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.values(selectedGpo.settings).map(setting => (
                      <tr key={setting.id} style={{ borderBottom: '1px solid #eee' }}>
                        <td style={{ padding: '4px 8px', verticalAlign: 'top' }}>{setting.category}</td>
                        <td style={{ padding: '4px 8px' }}>
                          <div style={{ fontWeight: 'bold' }}>{setting.name}</div>
                          <div style={{ color: '#666', fontSize: 11 }}>{setting.path}</div>
                        </td>
                        <td style={{ padding: '4px 8px', verticalAlign: 'top', color: setting.state === 'Enabled' ? 'green' : 'black' }}>
                          {setting.state}
                        </td>
                      </tr>
                    ))}
                    {Object.keys(selectedGpo.settings).length === 0 && (
                      <tr><td colSpan={3} style={{ padding: 8, textAlign: 'center', color: '#666' }}>No settings configured.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
