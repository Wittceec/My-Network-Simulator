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
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
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
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
