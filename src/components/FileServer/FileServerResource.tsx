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
        background: '#ffffff', color: '#000000',
        width: 800, maxWidth: '95vw', height: 600, maxHeight: '95vh',
        display: 'flex', flexDirection: 'column',
        boxShadow: '0 10px 30px rgba(0,0,0,0.2)', border: '1px solid #999', borderRadius: 8,
        fontFamily: '"Segoe UI", sans-serif', overflow: 'hidden'
      }}>
        <div style={{ 
          background: '#ffffff', color: '#000', padding: '8px 12px', 
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, userSelect: 'none'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Folder size={16} color="#eab308" fill="#eab308" style={{ opacity: 0.8 }} /> 
            <span>File Server Resource Manager</span>
          </div>
          <button style={{ background: 'none', color: '#e81123', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {/* Menu Bar */}
        <div style={{ background: '#ffffff', padding: '2px 8px', display: 'flex', gap: 16, fontSize: 12, borderBottom: '1px solid #e0e0e0', color: '#333' }}>
          <div style={{ cursor: 'pointer', padding: '4px 6px' }}>File</div>
          <div style={{ cursor: 'pointer', padding: '4px 6px' }}>Action</div>
          <div style={{ cursor: 'pointer', padding: '4px 6px' }}>View</div>
          <div style={{ cursor: 'pointer', padding: '4px 6px' }}>Help</div>
        </div>

        <div style={{ display: 'flex', flex: 1, overflow: 'hidden', background: '#ffffff' }}>
          
          {/* LEFT LIST */}
          <div style={{ width: 250, borderRight: '1px solid #e0e0e0', overflowY: 'auto' }}>
            <div style={{ background: '#f9fafb', padding: '8px 12px', borderBottom: '1px solid #e0e0e0', fontWeight: 'bold', fontSize: 12, color: '#4b5563' }}>
              Shared Folders
            </div>
            {shares.map(share => (
              <div 
                key={share.id} 
                style={{ 
                  display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 12,
                  background: selectedShareId === share.id ? '#e0f2fe' : 'transparent', 
                  color: selectedShareId === share.id ? '#0369a1' : '#111827',
                  borderLeft: selectedShareId === share.id ? '3px solid #0284c7' : '3px solid transparent'
                }}
                onClick={() => setSelectedShareId(share.id)}
              >
                <Folder size={16} color="#eab308" fill="#eab308" style={{ opacity: 0.8 }} /> 
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span>{share.name}</span>
                  <span style={{ color: selectedShareId === share.id ? '#0284c7' : '#6b7280', fontSize: 10 }}>{share.path}</span>
                </div>
              </div>
            ))}
          </div>

          {/* RIGHT PERMISSIONS */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px', fontSize: 12, display: 'flex', flexDirection: 'column', background: '#ffffff' }}>
            {!selectedShare ? (
              <div style={{ textAlign: 'center', color: '#6b7280', marginTop: 100, fontSize: 14 }}>Select a share to manage properties and permissions.</div>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                  <Shield size={40} color="#0078d4" fill="#e0f2fe" />
                  <div>
                    <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: '#111827' }}>{selectedShare.name} Properties</h3>
                    <div style={{ color: '#4b5563', marginTop: 2 }}>NTFS Security, Quotas & File Screening</div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid #d1d5db', marginBottom: 20 }}>
                  {['Security', 'Quota', 'Screening', 'EffectiveAccess'].map(tab => (
                    <div 
                      key={tab}
                      onClick={() => setActiveTab(tab as any)}
                      style={{ 
                        padding: '8px 16px', cursor: 'pointer',
                        fontWeight: activeTab === tab ? '600' : 'normal',
                        borderBottom: activeTab === tab ? '2px solid #0078d4' : '2px solid transparent',
                        color: activeTab === tab ? '#0078d4' : '#4b5563',
                        transition: 'all 0.2s'
                      }}
                    >
                      {tab === 'EffectiveAccess' ? 'Effective Access' : tab}
                    </div>
                  ))}
                </div>

                {activeTab === 'Security' && (
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div>
                      <strong style={{ color: '#111827', display: 'block', marginBottom: 8 }}>Group or user names:</strong>
                      <div style={{ border: '1px solid #d1d5db', height: 180, overflowY: 'auto', background: '#ffffff', borderRadius: 4 }}>
                        {Object.entries(selectedShare.ntfsPermissions).map(([principal, perm]) => (
                          <div key={principal} style={{ padding: '8px 12px', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f3f4f6', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#111827' }}>
                              {principal.toLowerCase().includes('admin') || principal.toLowerCase().includes('group') || principal.toLowerCase().includes('users') || !principal.includes('@') ? (
                                <Users size={16} color="#4b5563" />
                              ) : (
                                <User size={16} color="#4b5563" />
                              )}
                              <span>{principal}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                              <span style={{ color: '#4b5563', fontSize: 11, background: '#f3f4f6', padding: '2px 8px', borderRadius: 12 }}>{perm}</span>
                              <button 
                                style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}
                                onClick={() => serverStore.updateSharePermission(selectedShare.id, principal, 'Remove')}
                                title="Remove Permission"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div style={{ background: '#f9fafb', padding: 16, border: '1px solid #e5e7eb', borderRadius: 6 }}>
                      <strong style={{ color: '#111827' }}>Add Permissions</strong>
                      <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                        <input 
                          value={newPrincipal}
                          onChange={e => setNewPrincipal(e.target.value)}
                          placeholder="Enter object name (e.g. jdoe or Administrators)"
                          style={{ flex: 1, padding: '6px 10px', border: '1px solid #d1d5db', borderRadius: 4, outline: 'none' }}
                        />
                        <select 
                          value={newPermission} 
                          onChange={e => setNewPermission(e.target.value as any)}
                          style={{ padding: '6px 10px', border: '1px solid #d1d5db', borderRadius: 4, outline: 'none', background: '#fff' }}
                        >
                          <option value="Read">Read</option>
                          <option value="Modify">Modify</option>
                          <option value="FullControl">Full Control</option>
                        </select>
                        <button 
                          onClick={handleAddPermission}
                          style={{ padding: '6px 16px', background: '#0078d4', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 500 }}
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'Quota' && (
                  <div style={{ flex: 1, padding: 16, border: '1px solid #e5e7eb', background: '#f9fafb', borderRadius: 6 }}>
                    <div style={{ marginBottom: 20 }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 14, color: '#111827', cursor: 'pointer' }}>
                        <input type="checkbox" checked={selectedShare.quotaLimit !== undefined} onChange={(e) => {
                          serverStore.updateShare(selectedShare.id, { quotaLimit: e.target.checked ? 1024 : undefined });
                        }} style={{ width: 16, height: 16 }} />
                        Enable Quota Management
                      </label>
                    </div>
                    {selectedShare.quotaLimit !== undefined && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginLeft: 28 }}>
                        <label style={{ color: '#4b5563', fontWeight: 500 }}>Limit Space To (MB):</label>
                        <input 
                          type="number" 
                          value={selectedShare.quotaLimit} 
                          onChange={(e) => serverStore.updateShare(selectedShare.id, { quotaLimit: parseInt(e.target.value) || 0 })}
                          style={{ padding: '6px 10px', border: '1px solid #d1d5db', borderRadius: 4, width: 200, outline: 'none' }}
                        />
                        <div style={{ color: '#6b7280', marginTop: 12, fontSize: 11, background: '#e0f2fe', padding: 8, borderRadius: 4, color: '#0369a1' }}>
                          <p style={{ margin: 0 }}><strong>Hard Quota:</strong> Prevents users from saving files after space limit is reached.</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'Screening' && (
                  <div style={{ flex: 1, padding: 16, border: '1px solid #e5e7eb', background: '#f9fafb', borderRadius: 6 }}>
                    <div style={{ marginBottom: 20 }}>
                      <strong style={{ fontSize: 14, color: '#111827' }}>File Screening Options</strong>
                      <p style={{ color: '#4b5563', marginTop: 4 }}>Block specific file types from being saved on this share.</p>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <label style={{ color: '#4b5563', fontWeight: 500 }}>Blocked Extensions (comma separated):</label>
                      <input 
                        type="text" 
                        value={(selectedShare.fileScreening || []).join(', ')} 
                        onChange={(e) => serverStore.updateShare(selectedShare.id, { fileScreening: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                        placeholder="e.g. .mp3, .avi, .exe"
                        style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 4, width: '100%', outline: 'none' }}
                      />
                    </div>
                  </div>
                )}

                {activeTab === 'EffectiveAccess' && (
                  <div style={{ flex: 1, padding: 16, border: '1px solid #e5e7eb', background: '#f9fafb', borderRadius: 6 }}>
                    <div style={{ marginBottom: 20 }}>
                      <strong style={{ fontSize: 14, color: '#111827' }}>Effective Access Test</strong>
                      <p style={{ color: '#4b5563', marginTop: 4 }}>Simulate the permissions a specific user will have.</p>
                    </div>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      <input id="effectiveUserInput" placeholder="Enter user name..." style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 4, flex: 1, outline: 'none' }} />
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
                      }} style={{ padding: '8px 24px', background: '#0078d4', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 500 }}>
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
