import React, { useState } from 'react';
import { useM365Store } from '../../store/useM365Store';
import { useActiveDirectoryStore } from '../../store/useActiveDirectoryStore';
import { useAzureStore } from '../../store/useAzureStore';
import { Cloud, Users, Mail, Settings, ShieldAlert, Key, Globe, Search, Plus, X } from 'lucide-react';
import type { M365License, SharedMailbox } from '../../types/m365';
import { generateId } from '../../utils/helpers';

export default function M365AdminCenter({ onClose }: { onClose: () => void }) {
  const m365Store = useM365Store();
  const adStore = useActiveDirectoryStore();
  const azureStore = useAzureStore();

  const [activeTab, setActiveTab] = useState<'users' | 'exchange' | 'sharepoint'>('users');
  const [filter, setFilter] = useState('');
  
  // Modals
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  
  // Shared Mailbox form
  const [newSharedMailbox, setNewSharedMailbox] = useState({ name: '', email: '' });

  // Compute combined users (AD synced + Cloud only)
  // For sim, let's treat any Entra user + local AD users as potential M365 users
  const entraUsers = Object.values(azureStore.entraUsers || {});
  
  const m365Users = Object.values(m365Store.users).filter(u => 
    u.displayName.toLowerCase().includes(filter.toLowerCase()) ||
    u.userPrincipalName.toLowerCase().includes(filter.toLowerCase())
  );

  const handleUpdateLicense = (id: string, license: M365License) => {
    m365Store.updateUserLicense(id, license);
  };

  const handleSetForwarding = (id: string, addr: string) => {
    m365Store.setForwarding(id, addr || undefined);
  };

  const handleCreateSharedMailbox = () => {
    if (!newSharedMailbox.name || !newSharedMailbox.email) return;
    m365Store.createSharedMailbox({
      id: generateId('smb'),
      displayName: newSharedMailbox.name,
      emailAddress: newSharedMailbox.email,
      delegates: []
    });
    setNewSharedMailbox({ name: '', email: '' });
  };

  const handleAddDelegate = (smbId: string, upn: string) => {
    // Find the user by UPN in M365 to get ID
    const user = Object.values(m365Store.users).find(u => u.userPrincipalName === upn);
    if (user) {
      m365Store.addDelegateToSharedMailbox(smbId, user.id);
    }
  };

  return (
    <div style={{
      position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
      background: '#f3f2f1', color: '#323130', zIndex: 10,
      display: 'flex', flexDirection: 'column', fontFamily: '"Segoe UI", "Segoe UI Web (West European)", "Segoe UI", -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif'
    }}>
      {/* Header */}
      <div style={{ background: '#0078d4', color: '#fff', padding: '0 24px', height: 48, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontWeight: 600, fontSize: 16 }}>
          <Cloud size={20} /> Microsoft 365 admin center
        </div>
        <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}>
          <X size={20} />
        </button>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Sidebar */}
        <div style={{ width: 250, background: '#fff', borderRight: '1px solid #edebe9', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '16px 20px', color: '#605e5c', fontSize: 12, fontWeight: 600, textTransform: 'uppercase' }}>Admin centers</div>
          <button 
            onClick={() => setActiveTab('users')}
            style={{ padding: '12px 20px', border: 'none', background: activeTab === 'users' ? '#f3f2f1' : '#fff', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', borderLeft: activeTab === 'users' ? '3px solid #0078d4' : '3px solid transparent' }}
          >
            <Users size={18} color="#0078d4" /> Active users
          </button>
          <button 
            onClick={() => setActiveTab('exchange')}
            style={{ padding: '12px 20px', border: 'none', background: activeTab === 'exchange' ? '#f3f2f1' : '#fff', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', borderLeft: activeTab === 'exchange' ? '3px solid #0078d4' : '3px solid transparent' }}
          >
            <Mail size={18} color="#0078d4" /> Exchange
          </button>
          <button 
            onClick={() => setActiveTab('sharepoint')}
            style={{ padding: '12px 20px', border: 'none', background: activeTab === 'sharepoint' ? '#f3f2f1' : '#fff', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', borderLeft: activeTab === 'sharepoint' ? '3px solid #0078d4' : '3px solid transparent' }}
          >
            <Globe size={18} color="#0078d4" /> SharePoint
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 32 }}>
          
          {activeTab === 'users' && (
            <div>
              <h2 style={{ margin: '0 0 24px 0', fontSize: 24, fontWeight: 600 }}>Active users</h2>
              
              <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', background: '#fff', padding: '0 12px', border: '1px solid #8a8886', borderRadius: 2 }}>
                  <Search size={16} color="#605e5c" style={{ marginRight: 8 }} />
                  <input 
                    type="text" 
                    placeholder="Search users..." 
                    value={filter}
                    onChange={e => setFilter(e.target.value)}
                    style={{ background: 'transparent', border: 'none', color: '#323130', width: '100%', outline: 'none', padding: '8px 0' }}
                  />
                </div>
              </div>

              <div style={{ background: '#fff', border: '1px solid #edebe9', borderRadius: 2 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                  <thead style={{ borderBottom: '1px solid #edebe9' }}>
                    <tr>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600 }}>Display name</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600 }}>Username</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600 }}>Licenses</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600 }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {m365Users.map(user => (
                      <tr key={user.id} style={{ borderBottom: '1px solid #edebe9' }}>
                        <td style={{ padding: '12px 16px' }}>{user.displayName}</td>
                        <td style={{ padding: '12px 16px' }}>{user.userPrincipalName}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ 
                            background: user.license === 'Unlicensed' ? '#fde7e9' : '#e6f2fa', 
                            color: user.license === 'Unlicensed' ? '#a4262c' : '#0078d4', 
                            padding: '4px 8px', borderRadius: 12, fontSize: 12 
                          }}>
                            {user.license}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <button 
                            onClick={() => setSelectedUserId(user.id === selectedUserId ? null : user.id)}
                            style={{ background: 'none', border: 'none', color: '#0078d4', cursor: 'pointer', fontWeight: 600 }}
                          >
                            Manage licenses
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {selectedUserId && (() => {
                const user = m365Store.users[selectedUserId];
                return (
                  <div style={{ marginTop: 24, padding: 24, background: '#fff', border: '1px solid #edebe9', borderRadius: 2 }}>
                    <h3 style={{ margin: '0 0 16px 0' }}>Manage licenses: {user.displayName}</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {['Microsoft 365 E5', 'Microsoft 365 E3', 'Exchange Online Plan 1', 'Unlicensed'].map(lic => (
                        <label key={lic} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                          <input 
                            type="radio" 
                            name="license" 
                            checked={user.license === lic} 
                            onChange={() => handleUpdateLicense(user.id, lic as M365License)} 
                          />
                          {lic}
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })()}

            </div>
          )}

          {activeTab === 'exchange' && (
            <div>
              <h2 style={{ margin: '0 0 24px 0', fontSize: 24, fontWeight: 600 }}>Exchange admin center</h2>
              
              <div style={{ display: 'flex', gap: 24 }}>
                {/* Shared Mailboxes */}
                <div style={{ flex: 1, background: '#fff', border: '1px solid #edebe9', borderRadius: 2, padding: 24 }}>
                  <h3 style={{ margin: '0 0 16px 0' }}>Shared mailboxes</h3>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
                    <input type="text" placeholder="Display Name (e.g. IT Support)" value={newSharedMailbox.name} onChange={e => setNewSharedMailbox({...newSharedMailbox, name: e.target.value})} style={{ padding: 8, border: '1px solid #8a8886' }} />
                    <input type="text" placeholder="Email Address (e.g. it@corp.local)" value={newSharedMailbox.email} onChange={e => setNewSharedMailbox({...newSharedMailbox, email: e.target.value})} style={{ padding: 8, border: '1px solid #8a8886' }} />
                    <button onClick={handleCreateSharedMailbox} style={{ background: '#0078d4', color: '#fff', border: 'none', padding: '8px 16px', cursor: 'pointer' }}>+ Add shared mailbox</button>
                  </div>

                  <div>
                    {Object.values(m365Store.sharedMailboxes).map(smb => (
                      <div key={smb.id} style={{ border: '1px solid #edebe9', padding: 12, marginBottom: 12 }}>
                        <div style={{ fontWeight: 600 }}>{smb.displayName}</div>
                        <div style={{ color: '#605e5c', fontSize: 12, marginBottom: 8 }}>{smb.emailAddress}</div>
                        <div style={{ fontSize: 12 }}>
                          <strong>Delegates:</strong> {smb.delegates.length > 0 ? smb.delegates.map(d => m365Store.users[d]?.displayName).join(', ') : 'None'}
                        </div>
                        <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                          <input type="text" placeholder="User UPN to add..." id={`del-${smb.id}`} style={{ padding: 4, fontSize: 12, flex: 1 }} />
                          <button onClick={() => {
                            const input = document.getElementById(`del-${smb.id}`) as HTMLInputElement;
                            handleAddDelegate(smb.id, input.value);
                            input.value = '';
                          }} style={{ padding: '4px 8px', fontSize: 12, cursor: 'pointer' }}>Add Delegate</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Mail Flow / Forwarding */}
                <div style={{ flex: 1, background: '#fff', border: '1px solid #edebe9', borderRadius: 2, padding: 24 }}>
                  <h3 style={{ margin: '0 0 16px 0' }}>Mail flow & Forwarding</h3>
                  <p style={{ fontSize: 14, color: '#605e5c' }}>Select a user to configure email forwarding rules.</p>
                  
                  <div style={{ maxHeight: 400, overflowY: 'auto' }}>
                    {m365Users.filter(u => u.license !== 'Unlicensed').map(user => (
                      <div key={user.id} style={{ borderBottom: '1px solid #edebe9', padding: '12px 0' }}>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{user.displayName}</div>
                        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                          <input 
                            type="text" 
                            placeholder="Forwarding address..." 
                            value={user.forwardingAddress || ''}
                            onChange={(e) => handleSetForwarding(user.id, e.target.value)}
                            style={{ padding: 4, fontSize: 12, flex: 1 }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'sharepoint' && (
            <div style={{ textAlign: 'center', padding: 64, color: '#605e5c' }}>
              <Globe size={64} style={{ marginBottom: 16, opacity: 0.5 }} />
              <h2>SharePoint admin center</h2>
              <p>SharePoint site creation and management is currently limited by the simulation tier.</p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
