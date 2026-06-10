import React, { useState, useEffect, useRef } from 'react';
import { useActiveDirectoryStore } from '../../store/useActiveDirectoryStore';
import { Users, Server, HardDrive, Shield, Lock, X, Folder, File, ChevronRight, ChevronDown, CheckSquare, Square } from 'lucide-react';
import type { ADUser, ADComputer, ADOrganizationalUnit, ADGroup, ADDomain } from '../../types/ad';

interface ActiveDirectoryDashboardProps {
  onClose: () => void;
}

export default function ActiveDirectoryDashboard({ onClose }: ActiveDirectoryDashboardProps) {
  const adStore = useActiveDirectoryStore();
  const [selectedOuId, setSelectedOuId] = useState<string | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({ root: true });
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, targetId: string | null, type: 'ou' | 'user' | 'root' | null } | null>(null);
  const [propertiesModal, setPropertiesModal] = useState<{ userId: string } | null>(null);

  useEffect(() => {
    adStore.seedDefaultDomain();
  }, []);

  const domains = Object.values(adStore.domains);
  if (domains.length === 0) return null;

  const primaryDomain = domains[0];
  const ous = Object.values(adStore.ous);
  const users = Object.values(adStore.users);
  const computers = Object.values(adStore.computers);
  const groups = Object.values(adStore.groups);

  const filteredUsers = users.filter(u => u.parentOuId === selectedOuId);
  const filteredComputers = computers.filter(c => c.parentOuId === selectedOuId);
  const filteredGroups = groups.filter(g => g.parentOuId === selectedOuId);

  const toggleNode = (id: string) => {
    setExpandedNodes(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleRightClick = (e: React.MouseEvent, targetId: string | null, type: 'ou' | 'user' | 'root') => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, targetId, type });
  };

  const closeMenu = () => setContextMenu(null);

  const handleCreateUser = () => {
    closeMenu();
    if (!selectedOuId && contextMenu?.type !== 'ou') {
      alert("Select an OU first.");
      return;
    }
    const targetOu = contextMenu?.type === 'ou' ? contextMenu.targetId : selectedOuId;
    const name = prompt("Enter new user's full name:");
    if (!name) return;
    
    const newId = `usr-${Math.random().toString(36).substr(2, 5)}`;
    const [firstName, ...lastNames] = name.split(' ');
    const sAM = name.replace(/\s+/g, '').toLowerCase();

    adStore.createUser({
      id: newId,
      name,
      type: 'User',
      distinguishedName: `CN=${name},OU=Unknown,DC=corp,DC=local`,
      firstName: firstName || '',
      lastName: lastNames.join(' '),
      displayName: name,
      sAMAccountName: sAM,
      userPrincipalName: `${sAM}@corp.local`,
      enabled: true,
      lockedOut: false,
      passwordExpired: false,
      groups: [],
      parentOuId: targetOu || 'ou-users'
    });
  };

  return (
    <div className="modal-backdrop" onClick={() => { onClose(); closeMenu(); }} style={{
      position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
      zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div className="modal-content" onClick={e => { e.stopPropagation(); closeMenu(); }} style={{
        background: '#ece9d8', // Classic Windows XP/2003 gray
        color: '#000',
        width: 900, maxWidth: '95vw', height: 600, maxHeight: '95vh',
        display: 'flex', flexDirection: 'column',
        boxShadow: '2px 2px 10px rgba(0,0,0,0.5)',
        border: '1px solid #0054e3',
        fontFamily: '"Tahoma", "Segoe UI", sans-serif'
      }}>
        {/* Title Bar */}
        <div style={{ 
          background: 'linear-gradient(to right, #0058e6, #3a93ff)', 
          color: 'white', padding: '4px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          borderBottom: '1px solid #0054e3', fontSize: 13, fontWeight: 'bold'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Server size={14} color="#fff" />
            Active Directory Users and Computers
          </div>
          <button style={{ background: '#e81123', color: '#fff', border: 'none', width: 24, height: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
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
                <div onClick={(e) => { e.stopPropagation(); toggleNode('root'); }} style={{ width: 12, display: 'flex', justifyContent: 'center' }}>
                  {expandedNodes['root'] ? <ChevronDown size={12}/> : <ChevronRight size={12}/>}
                </div>
                <div 
                  style={{ display: 'flex', alignItems: 'center', gap: 4, background: selectedOuId === null ? '#316ac5' : 'transparent', color: selectedOuId === null ? '#fff' : '#000', padding: '2px 4px', flex: 1 }}
                  onClick={() => setSelectedOuId(null)}
                  onContextMenu={(e) => handleRightClick(e, null, 'root')}
                >
                  <Server size={14} color={selectedOuId === null ? '#fff' : "#f59e0b"} />
                  Active Directory Users and Computers [{primaryDomain.name}]
                </div>
              </div>

              {expandedNodes['root'] && (
                <div style={{ paddingLeft: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', padding: 2 }}>
                    <div onClick={(e) => { e.stopPropagation(); toggleNode('dom'); }} style={{ width: 12, display: 'flex', justifyContent: 'center' }}>
                      {expandedNodes['dom'] ? <ChevronDown size={12}/> : <ChevronRight size={12}/>}
                    </div>
                    <div 
                      style={{ display: 'flex', alignItems: 'center', gap: 4, background: selectedOuId === 'dom' ? '#316ac5' : 'transparent', color: selectedOuId === 'dom' ? '#fff' : '#000', padding: '2px 4px', flex: 1 }}
                      onClick={() => setSelectedOuId('dom')}
                    >
                      <Folder size={14} color={selectedOuId === 'dom' ? '#fff' : "#f59e0b"} />
                      {primaryDomain.name}
                    </div>
                  </div>

                  {expandedNodes['dom'] && ous.map(ou => (
                    <div key={ou.id} style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', padding: 2, paddingLeft: 16 }}>
                      <div style={{ width: 12 }}></div>
                      <div 
                        style={{ display: 'flex', alignItems: 'center', gap: 4, background: selectedOuId === ou.id ? '#316ac5' : 'transparent', color: selectedOuId === ou.id ? '#fff' : '#000', padding: '2px 4px', flex: 1 }}
                        onClick={() => setSelectedOuId(ou.id)}
                        onContextMenu={(e) => handleRightClick(e, ou.id, 'ou')}
                      >
                        <Folder size={14} color={selectedOuId === ou.id ? '#fff' : "#f59e0b"} fill={selectedOuId === ou.id ? '#fff' : "#f59e0b"} />
                        {ou.name}
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
                  <th style={{ padding: '2px 6px', fontWeight: 'normal', borderRight: '1px solid #ccc' }}>Name</th>
                  <th style={{ padding: '2px 6px', fontWeight: 'normal', borderRight: '1px solid #ccc' }}>Type</th>
                  <th style={{ padding: '2px 6px', fontWeight: 'normal', borderRight: '1px solid #ccc' }}>Description</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(u => (
                  <tr key={u.id} 
                    onContextMenu={(e) => handleRightClick(e, u.id, 'user')}
                    onDoubleClick={() => setPropertiesModal({ userId: u.id })}
                    style={{ cursor: 'default' }}
                    className="ad-row"
                  >
                    <td style={{ padding: '2px 6px', display: 'flex', alignItems: 'center', gap: 6, position: 'relative' }}>
                      <Users size={14} color="#0054e3" /> 
                      {!u.enabled && <div style={{ position: 'absolute', left: 12, top: 8, background: '#fff', borderRadius: '50%' }}><ChevronDown size={10} color="#000" /></div>}
                      {u.name} 
                      {u.lockedOut && <Lock size={12} color="#e81123" title="Locked Out"/>}
                    </td>
                    <td style={{ padding: '2px 6px' }}>User</td>
                    <td style={{ padding: '2px 6px' }}>{u.description || u.title || ''}</td>
                  </tr>
                ))}
                {filteredComputers.map(c => (
                  <tr key={c.id}>
                    <td style={{ padding: '2px 6px', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <HardDrive size={14} color="#0054e3" /> {c.name}
                    </td>
                    <td style={{ padding: '2px 6px' }}>Computer</td>
                    <td style={{ padding: '2px 6px' }}></td>
                  </tr>
                ))}
                {filteredGroups.map(g => (
                  <tr key={g.id}>
                    <td style={{ padding: '2px 6px', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Shield size={14} color="#10b981" /> {g.name}
                    </td>
                    <td style={{ padding: '2px 6px' }}>Security Group</td>
                    <td style={{ padding: '2px 6px' }}></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Status Bar */}
        <div style={{ background: '#ece9d8', padding: '2px 8px', fontSize: 11, borderTop: '1px solid #ccc' }}>
          {filteredUsers.length + filteredComputers.length + filteredGroups.length} objects
        </div>
      </div>

      {/* CONTEXT MENU */}
      {contextMenu && (
        <div style={{
          position: 'absolute', top: contextMenu.y, left: contextMenu.x,
          background: '#ece9d8', border: '1px solid #999', boxShadow: '2px 2px 5px rgba(0,0,0,0.3)',
          padding: 2, zIndex: 10000, fontSize: 12, minWidth: 150, fontFamily: 'Tahoma'
        }} onClick={e => e.stopPropagation()}>
          {(contextMenu.type === 'ou' || contextMenu.type === 'root') && (
            <>
              <div className="menu-item" onClick={handleCreateUser} style={{ padding: '4px 24px', cursor: 'pointer' }}>New User...</div>
              <div className="menu-item" style={{ padding: '4px 24px', cursor: 'pointer' }}>New Group...</div>
            </>
          )}
          {contextMenu.type === 'user' && (
            <>
              <div className="menu-item" onClick={() => {
                adStore.updateUser(contextMenu.targetId!, { lockedOut: false, passwordExpired: false });
                alert("Password reset successfully.");
                closeMenu();
              }} style={{ padding: '4px 24px', cursor: 'pointer' }}>Reset Password...</div>
              
              <div className="menu-item" onClick={() => {
                const u = users.find(x => x.id === contextMenu.targetId);
                adStore.updateUser(contextMenu.targetId!, { enabled: !u?.enabled });
                closeMenu();
              }} style={{ padding: '4px 24px', cursor: 'pointer' }}>
                {users.find(x => x.id === contextMenu.targetId)?.enabled ? 'Disable Account' : 'Enable Account'}
              </div>

              <div style={{ borderTop: '1px solid #ccc', margin: '2px 0' }}></div>

              <div className="menu-item" onClick={() => {
                setPropertiesModal({ userId: contextMenu.targetId! });
                closeMenu();
              }} style={{ padding: '4px 24px', cursor: 'pointer', fontWeight: 'bold' }}>Properties</div>
            </>
          )}
        </div>
      )}

      {/* PROPERTIES MODAL */}
      {propertiesModal && (
        <PropertiesDialog 
          userId={propertiesModal.userId} 
          onClose={() => setPropertiesModal(null)} 
        />
      )}
      
      <style>{`
        .ad-row:hover { background: #e5f3ff; }
        .menu-item:hover { background: #316ac5; color: white; }
      `}</style>
    </div>
  );
}

function PropertiesDialog({ userId, onClose }: { userId: string, onClose: () => void }) {
  const adStore = useActiveDirectoryStore();
  const user = adStore.users[userId];
  const [activeTab, setActiveTab] = useState('General');

  // Local state for editing
  const [formData, setFormData] = useState<Partial<ADUser>>({ ...user });

  if (!user) return null;

  const handleSave = () => {
    adStore.updateUser(userId, formData);
    onClose();
  };

  const handleApply = () => {
    adStore.updateUser(userId, formData);
  };

  const tabs = ['General', 'Address', 'Account', 'Profile', 'Telephones', 'Organization', 'Member Of'];

  return (
    <div className="modal-backdrop" onClick={onClose} style={{
      position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
      zIndex: 10001, display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{
        background: '#ece9d8', color: '#000',
        width: 420, height: 480, display: 'flex', flexDirection: 'column',
        boxShadow: '2px 2px 10px rgba(0,0,0,0.5)', border: '1px solid #0054e3',
        fontFamily: '"Tahoma", "Segoe UI", sans-serif', fontSize: 12
      }}>
        <div style={{ 
          background: 'linear-gradient(to right, #0058e6, #3a93ff)', color: 'white', padding: '4px 8px', 
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, fontWeight: 'bold'
        }}>
          <span>{user.name} Properties</span>
          <button style={{ background: '#e81123', color: '#fff', border: 'none', width: 24, height: 20, cursor: 'pointer' }} onClick={onClose}><X size={14} /></button>
        </div>

        {/* TABS */}
        <div style={{ display: 'flex', padding: '8px 8px 0 8px', borderBottom: '1px solid #ccc', flexWrap: 'wrap' }}>
          {tabs.map(t => (
            <div key={t} onClick={() => setActiveTab(t)} style={{
              padding: '4px 8px', border: '1px solid #ccc', borderBottom: activeTab === t ? 'none' : '1px solid #ccc',
              background: activeTab === t ? '#fff' : '#f5f5f5', cursor: 'pointer',
              marginTop: activeTab === t ? 2 : 4, borderTopLeftRadius: 3, borderTopRightRadius: 3,
              position: 'relative', zIndex: activeTab === t ? 2 : 1, marginBottom: -1
            }}>
              {t}
            </div>
          ))}
        </div>

        {/* TAB CONTENT */}
        <div style={{ flex: 1, background: '#fff', border: '1px solid #ccc', borderTop: 'none', margin: '0 8px', padding: 16 }}>
          
          {activeTab === 'General' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <Users size={32} color="#0054e3" />
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: 4 }}>
                  <div style={{ display: 'flex' }}><span style={{ width: 80 }}>First name:</span><input className="ad-input" value={formData.firstName || ''} onChange={e => setFormData({...formData, firstName: e.target.value})} /></div>
                  <div style={{ display: 'flex' }}><span style={{ width: 80 }}>Last name:</span><input className="ad-input" value={formData.lastName || ''} onChange={e => setFormData({...formData, lastName: e.target.value})} /></div>
                  <div style={{ display: 'flex' }}><span style={{ width: 80 }}>Display name:</span><input className="ad-input" value={formData.displayName || ''} onChange={e => setFormData({...formData, displayName: e.target.value})} /></div>
                </div>
              </div>
              <hr style={{ borderTop: '1px solid #eee', width: '100%', margin: '8px 0' }}/>
              <div style={{ display: 'flex' }}><span style={{ width: 80 }}>Description:</span><input className="ad-input" value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})} /></div>
              <div style={{ display: 'flex' }}><span style={{ width: 80 }}>Office:</span><input className="ad-input" value={formData.office || ''} onChange={e => setFormData({...formData, office: e.target.value})} /></div>
              <div style={{ display: 'flex' }}><span style={{ width: 80 }}>Telephone:</span><input className="ad-input" value={formData.telephone || ''} onChange={e => setFormData({...formData, telephone: e.target.value})} /></div>
              <div style={{ display: 'flex' }}><span style={{ width: 80 }}>E-mail:</span><input className="ad-input" value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})} /></div>
            </div>
          )}

          {activeTab === 'Account' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center' }}><span style={{ width: 120 }}>User logon name:</span><input className="ad-input" style={{ width: 120 }} value={formData.sAMAccountName || ''} onChange={e => setFormData({...formData, sAMAccountName: e.target.value})} /> @corp.local</div>
              <div style={{ display: 'flex', alignItems: 'center' }}><span style={{ width: 120 }}>Pre-Windows 2000:</span>CORP\ <input className="ad-input" style={{ width: 120 }} value={formData.sAMAccountName || ''} disabled /></div>
              <hr style={{ borderTop: '1px solid #eee', width: '100%', margin: '8px 0' }}/>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn" style={{ fontSize: 11, padding: '2px 8px' }}>Logon Hours...</button>
                <button className="btn" style={{ fontSize: 11, padding: '2px 8px' }}>Log On To...</button>
              </div>
              <div>Account options:</div>
              <div style={{ border: '1px solid #ccc', height: 100, overflowY: 'auto', background: '#fff', padding: 4 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}><input type="checkbox" checked={formData.userCannotChangePassword} onChange={e => setFormData({...formData, userCannotChangePassword: e.target.checked})} /> User cannot change password</label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}><input type="checkbox" checked={formData.passwordNeverExpires} onChange={e => setFormData({...formData, passwordNeverExpires: e.target.checked})} /> Password never expires</label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}><input type="checkbox" checked={formData.userMustChangePassword} onChange={e => setFormData({...formData, userMustChangePassword: e.target.checked})} /> User must change password at next logon</label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}><input type="checkbox" checked={!formData.enabled} onChange={e => setFormData({...formData, enabled: !e.target.checked})} /> Account is disabled</label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}><input type="checkbox" checked={formData.lockedOut} onChange={e => setFormData({...formData, lockedOut: e.target.checked})} /> Account is locked out</label>
              </div>
              <hr style={{ borderTop: '1px solid #eee', width: '100%', margin: '8px 0' }}/>
              <div>Account expires:</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, paddingLeft: 8 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}><input type="radio" checked={formData.accountExpires === null || formData.accountExpires === undefined} onChange={() => setFormData({...formData, accountExpires: null})} /> Never</label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <input type="radio" checked={formData.accountExpires !== null && formData.accountExpires !== undefined} onChange={() => setFormData({...formData, accountExpires: Date.now()})} /> 
                  End of: <input type="date" className="ad-input" style={{ width: 120 }} value={formData.accountExpires ? new Date(formData.accountExpires).toISOString().split('T')[0] : ''} onChange={e => setFormData({...formData, accountExpires: new Date(e.target.value).getTime()})} disabled={formData.accountExpires === null || formData.accountExpires === undefined} />
                </label>
              </div>
            </div>
          )}

          {activeTab === 'Profile' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div>User profile</div>
              <div style={{ display: 'flex', alignItems: 'center', paddingLeft: 8 }}><span style={{ width: 120 }}>Profile path:</span><input className="ad-input" value={formData.profilePath || ''} onChange={e => setFormData({...formData, profilePath: e.target.value})} /></div>
              <div style={{ display: 'flex', alignItems: 'center', paddingLeft: 8 }}><span style={{ width: 120 }}>Logon script:</span><input className="ad-input" value={formData.logonScript || ''} onChange={e => setFormData({...formData, logonScript: e.target.value})} /></div>
              <hr style={{ borderTop: '1px solid #eee', width: '100%', margin: '8px 0' }}/>
              <div>Home folder</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, paddingLeft: 8 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}><input type="radio" checked={!formData.homeDirectory?.includes(':')} onChange={() => setFormData({...formData, homeDirectory: ''})} /> Local path: <input className="ad-input" style={{ flex: 1 }} value={!formData.homeDirectory?.includes(':') ? formData.homeDirectory || '' : ''} onChange={e => setFormData({...formData, homeDirectory: e.target.value})} disabled={formData.homeDirectory?.includes(':')} /></label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <input type="radio" checked={formData.homeDirectory?.includes(':')} onChange={() => setFormData({...formData, homeDirectory: 'Z:\\'})} /> Connect: 
                  <select className="ad-input" style={{ width: 50 }} disabled={!formData.homeDirectory?.includes(':')}>
                    <option>Z:</option><option>Y:</option><option>X:</option>
                  </select>
                  To: <input className="ad-input" style={{ flex: 1 }} value={formData.homeDirectory?.includes(':') ? formData.homeDirectory : ''} onChange={e => setFormData({...formData, homeDirectory: e.target.value})} disabled={!formData.homeDirectory?.includes(':')} />
                </label>
              </div>
            </div>
          )}

          {activeTab === 'Organization' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex' }}><span style={{ width: 80 }}>Title:</span><input className="ad-input" value={formData.title || ''} onChange={e => setFormData({...formData, title: e.target.value})} /></div>
              <div style={{ display: 'flex' }}><span style={{ width: 80 }}>Department:</span><input className="ad-input" value={formData.department || ''} onChange={e => setFormData({...formData, department: e.target.value})} /></div>
              <div style={{ display: 'flex' }}><span style={{ width: 80 }}>Company:</span><input className="ad-input" value={formData.company || ''} onChange={e => setFormData({...formData, company: e.target.value})} /></div>
              <hr style={{ borderTop: '1px solid #eee', width: '100%', margin: '8px 0' }}/>
              <div style={{ display: 'flex' }}><span style={{ width: 80 }}>Manager:</span><input className="ad-input" value={formData.manager || ''} onChange={e => setFormData({...formData, manager: e.target.value})} /></div>
            </div>
          )}

          {activeTab === 'Member Of' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, height: '100%' }}>
              <div>Member of:</div>
              <div style={{ flex: 1, border: '1px solid #ccc', background: '#fff', overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead style={{ background: '#f0f0f0' }}><tr><th style={{ textAlign: 'left', padding: '2px 4px', fontWeight: 'normal' }}>Name</th><th style={{ textAlign: 'left', padding: '2px 4px', fontWeight: 'normal' }}>Active Directory Folder</th></tr></thead>
                  <tbody>
                    {user.groups.map(gid => {
                      const g = adStore.groups[gid];
                      if (!g) return null;
                      return (
                        <tr key={gid}>
                          <td style={{ padding: '2px 4px', display: 'flex', alignItems: 'center', gap: 4 }}><Shield size={12} color="#10b981" /> {g.name}</td>
                          <td style={{ padding: '2px 4px' }}>corp.local/Users</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn" style={{ fontSize: 11, padding: '2px 12px' }}>Add...</button>
                <button className="btn" style={{ fontSize: 11, padding: '2px 12px' }}>Remove</button>
              </div>
            </div>
          )}

          {/* Placeholder for un-implemented tabs */}
          {!['General', 'Account', 'Organization', 'Member Of'].includes(activeTab) && (
            <div style={{ color: '#888', textAlign: 'center', marginTop: 40 }}>
              Tab '{activeTab}' is not populated in this simulation.
            </div>
          )}

        </div>

        {/* BUTTONS */}
        <div style={{ padding: 12, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button className="btn" style={{ width: 80, fontSize: 12, padding: '4px 0' }} onClick={handleSave}>OK</button>
          <button className="btn" style={{ width: 80, fontSize: 12, padding: '4px 0' }} onClick={onClose}>Cancel</button>
          <button className="btn" style={{ width: 80, fontSize: 12, padding: '4px 0' }} onClick={handleApply}>Apply</button>
        </div>
      </div>
      
      <style>{`
        .ad-input { border: 1px solid #7f9db9; padding: 2px 4px; flex: 1; outline: none; }
        .ad-input:focus { border-color: #316ac5; }
      `}</style>
    </div>
  );
}
