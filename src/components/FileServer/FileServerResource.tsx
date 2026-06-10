import React, { useState, useEffect } from 'react';
import { useServerStore } from '../../store/useServerStore';
import { useActiveDirectoryStore } from '../../store/useActiveDirectoryStore';
import { Folder, X, Shield, Users, User } from 'lucide-react';

export default function FileServerResource({ onClose }: { onClose: () => void }) {
  const serverStore = useServerStore();
  const adStore = useActiveDirectoryStore();
  const [selectedShareId, setSelectedShareId] = useState<string | null>(null);
  const [newPrincipal, setNewPrincipal] = useState('');
  const [newPermission, setNewPermission] = useState<'Read' | 'Modify' | 'FullControl'>('Read');
  const [activeTab, setActiveTab] = useState<'Security' | 'Quota' | 'Screening' | 'EffectiveAccess'>('Security');

  useEffect(() => {
    serverStore.seedDefaultServers();
  }, []);

  const shares = Object.values(serverStore.shares);
  const selectedShare = selectedShareId ? serverStore.shares[selectedShareId] : null;

  const handleAddPermission = () => {
    if (!selectedShare || !newPrincipal.trim()) return;
    
    // Check if principal exists in AD (group or user) or is 'Administrators'/'Domain Users'
    const name = newPrincipal.trim();
    const isSpecial = name.toLowerCase() === 'administrators' || name.toLowerCase() === 'domain users';
    const isGroup = Object.values(adStore.groups).some(g => g.name.toLowerCase() === name.toLowerCase());
    const isUser = Object.values(adStore.users).some(u => u.name.toLowerCase() === name.toLowerCase() || u.userPrincipalName.toLowerCase() === name.toLowerCase());

    if (!isSpecial && !isGroup && !isUser) {
      alert(`The name "${name}" was not found in Active Directory.`);
      return;
    }

    serverStore.updateSharePermission(selectedShare.id, name, newPermission);
    setNewPrincipal('');
  };

  return (
    <div className="modal-backdrop" onClick={onClose} style={{
      position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
      zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{
        background: '#ece9d8', color: '#000',
        width: 700, maxWidth: '95vw', height: 500, maxHeight: '95vh',
        display: 'flex', flexDirection: 'column',
        boxShadow: '2px 2px 10px rgba(0,0,0,0.5)', border: '1px solid #0054e3',
        fontFamily: '"Tahoma", "Segoe UI", sans-serif'
      }}>
        <div style={{ 
          background: 'linear-gradient(to right, #0058e6, #3a93ff)', color: 'white', padding: '4px 8px', 
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #0054e3', fontSize: 13, fontWeight: 'bold'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Folder size={14} color="#fff" /> File Server Resource Manager
          </div>
          <button style={{ background: '#e81123', color: '#fff', border: 'none', width: 24, height: 20, cursor: 'pointer' }} onClick={onClose}>
            <X size={14} />
          </button>
        </div>

        <div style={{ display: 'flex', flex: 1, overflow: 'hidden', background: '#fff', margin: 2, border: '1px solid #7f9db9' }}>
          
          {/* LEFT LIST */}
          <div style={{ width: 250, borderRight: '1px solid #ccc', overflowY: 'auto' }}>
            <div style={{ background: '#ece9d8', padding: '4px 8px', borderBottom: '1px solid #ccc', fontWeight: 'bold', fontSize: 12 }}>
              Shared Folders
            </div>
            {shares.map(share => (
              <div 
                key={share.id} 
                style={{ 
                  display: 'flex', alignItems: 'center', gap: 6, padding: '4px 8px', cursor: 'pointer', fontSize: 12,
                  background: selectedShareId === share.id ? '#316ac5' : 'transparent', 
                  color: selectedShareId === share.id ? '#fff' : '#000'
                }}
                onClick={() => setSelectedShareId(share.id)}
              >
                <Folder size={16} color={selectedShareId === share.id ? '#fff' : '#f59e0b'} fill={selectedShareId === share.id ? 'transparent' : '#f59e0b'} /> 
                {share.name} <span style={{ color: selectedShareId === share.id ? '#ddd' : '#666', fontSize: 10 }}>({share.path})</span>
              </div>
            ))}
          </div>

          {/* RIGHT PERMISSIONS */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 16, fontSize: 12, display: 'flex', flexDirection: 'column' }}>
            {!selectedShare ? (
              <div style={{ textAlign: 'center', color: '#666', marginTop: 100 }}>Select a share to manage permissions.</div>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <Shield size={32} color="#3b82f6" />
                  <div>
                    <h3 style={{ margin: 0, fontSize: 16 }}>{selectedShare.name} Properties</h3>
                    <div style={{ color: '#666' }}>NTFS Security & Permissions</div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 16, borderBottom: '1px solid #ccc', marginBottom: 16 }}>
                  {['Security', 'Quota', 'Screening', 'EffectiveAccess'].map(tab => (
                    <div 
                      key={tab}
                      onClick={() => setActiveTab(tab as any)}
                      style={{ 
                        padding: '4px 8px', cursor: 'pointer',
                        fontWeight: activeTab === tab ? 'bold' : 'normal',
                        borderBottom: activeTab === tab ? '2px solid #0054e3' : 'none',
                        color: activeTab === tab ? '#0054e3' : '#666'
                      }}
                    >
                      {tab === 'EffectiveAccess' ? 'Effective Access' : tab}
                    </div>
                  ))}
                </div>

                {activeTab === 'Security' && (
                  <div style={{ flex: 1 }}>
                    <strong>Group or user names:</strong>
                  <div style={{ border: '1px solid #ccc', height: 150, overflowY: 'auto', marginTop: 4, background: '#fff' }}>
                    {Object.entries(selectedShare.ntfsPermissions).map(([principal, perm]) => (
                      <div key={principal} style={{ padding: '4px 8px', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #eee' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          {principal.toLowerCase().includes('admin') || principal.toLowerCase().includes('group') || principal.toLowerCase().includes('users') || !principal.includes('@') ? (
                            <Users size={14} color="#666" />
                          ) : (
                            <User size={14} color="#666" />
                          )}
                          {principal}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                          <span style={{ color: '#666' }}>{perm}</span>
                          <button 
                            style={{ background: 'transparent', border: 'none', color: '#e81123', cursor: 'pointer', padding: 0 }}
                            onClick={() => serverStore.updateSharePermission(selectedShare.id, principal, 'Remove')}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={{ marginTop: 16, background: '#f5f5f5', padding: 12, border: '1px solid #ccc' }}>
                    <strong>Add Permissions</strong>
                    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                      <input 
                        value={newPrincipal}
                        onChange={e => setNewPrincipal(e.target.value)}
                        placeholder="Enter object name to select"
                        style={{ flex: 1, padding: '4px 8px', border: '1px solid #ccc' }}
                      />
                      <select 
                        value={newPermission} 
                        onChange={e => setNewPermission(e.target.value as any)}
                        style={{ padding: '4px 8px', border: '1px solid #ccc' }}
                      >
                        <option value="Read">Read</option>
                        <option value="Modify">Modify</option>
                        <option value="FullControl">Full Control</option>
                      </select>
                      <button 
                        onClick={handleAddPermission}
                        style={{ padding: '4px 16px', background: '#ece9d8', border: '1px solid #0054e3', cursor: 'pointer' }}
                      >
                        Add
                      </button>
                    </div>
                  </div>
                  </div>
                )}

                {activeTab === 'Quota' && (
                  <div style={{ flex: 1, padding: 8, border: '1px solid #ccc', background: '#f9f9f9' }}>
                    <div style={{ marginBottom: 16 }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <input type="checkbox" checked={selectedShare.quotaLimit !== undefined} onChange={(e) => {
                          serverStore.updateShare(selectedShare.id, { quotaLimit: e.target.checked ? 1024 : undefined });
                        }} />
                        Enable Quota Management
                      </label>
                    </div>
                    {selectedShare.quotaLimit !== undefined && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <label>Limit Space To (MB):</label>
                        <input 
                          type="number" 
                          value={selectedShare.quotaLimit} 
                          onChange={(e) => serverStore.updateShare(selectedShare.id, { quotaLimit: parseInt(e.target.value) || 0 })}
                          style={{ padding: '4px 8px', border: '1px solid #ccc', width: 150 }}
                        />
                        <div style={{ color: '#666', marginTop: 16 }}>
                          <p>Hard Quota: Prevents users from saving files after space limit is reached.</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'Screening' && (
                  <div style={{ flex: 1, padding: 8, border: '1px solid #ccc', background: '#f9f9f9' }}>
                    <div style={{ marginBottom: 16 }}>
                      <strong>File Screening Options</strong>
                      <p style={{ color: '#666', marginTop: 4 }}>Block specific file types from being saved on this share.</p>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <label>Blocked Extensions (comma separated):</label>
                      <input 
                        type="text" 
                        value={(selectedShare.fileScreening || []).join(', ')} 
                        onChange={(e) => serverStore.updateShare(selectedShare.id, { fileScreening: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                        placeholder="e.g. .mp3, .avi, .exe"
                        style={{ padding: '4px 8px', border: '1px solid #ccc', width: '100%' }}
                      />
                    </div>
                  </div>
                )}

                {activeTab === 'EffectiveAccess' && (
                  <div style={{ flex: 1, padding: 8, border: '1px solid #ccc', background: '#f9f9f9' }}>
                    <div style={{ marginBottom: 16 }}>
                      <strong>Effective Access Test</strong>
                      <p style={{ color: '#666', marginTop: 4 }}>Simulate the permissions a specific user will have.</p>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <input id="effectiveUserInput" placeholder="Enter user name..." style={{ padding: '4px 8px', border: '1px solid #ccc', flex: 1 }} />
                      <button onClick={() => {
                        const val = (document.getElementById('effectiveUserInput') as HTMLInputElement).value;
                        if (!val) return;
                        // Extremely simplified mock logic
                        const isDomainUser = Object.values(adStore.users).some(u => u.name.toLowerCase() === val.toLowerCase());
                        if (selectedShare.ntfsPermissions['Administrators'] === 'FullControl' && val.toLowerCase() === 'administrator') {
                           alert('Effective Access for ' + val + ': FullControl');
                        } else if (selectedShare.ntfsPermissions['Domain Users'] && isDomainUser) {
                           alert('Effective Access for ' + val + ': ' + selectedShare.ntfsPermissions['Domain Users']);
                        } else {
                           alert('Effective Access for ' + val + ': None');
                        }
                      }} style={{ padding: '4px 16px', background: '#ece9d8', border: '1px solid #0054e3', cursor: 'pointer' }}>
                        Calculate
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
