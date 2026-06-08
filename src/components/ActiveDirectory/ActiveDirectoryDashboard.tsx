import React, { useState, useEffect } from 'react';
import { useActiveDirectoryStore } from '../../store/useActiveDirectoryStore';
import { Users, Server, HardDrive, Key, Lock, Unlock, X, Folder, Shield, UserPlus } from 'lucide-react';
import type { ADUser, ADComputer, ADOrganizationalUnit, ADGroup, ADDomain } from '../../types/ad';

interface ActiveDirectoryDashboardProps {
  onClose: () => void;
}

export default function ActiveDirectoryDashboard({ onClose }: ActiveDirectoryDashboardProps) {
  const adStore = useActiveDirectoryStore();
  const [selectedOuId, setSelectedOuId] = useState<string | null>(null);
  
  // Seed initial domain on load if none exists
  useEffect(() => {
    adStore.seedDefaultDomain();
  }, []);

  const domains = Object.values(adStore.domains);
  if (domains.length === 0) return null; // Waiting for seed

  const primaryDomain = domains[0];
  const ous = Object.values(adStore.ous);
  const users = Object.values(adStore.users);
  const computers = Object.values(adStore.computers);
  const groups = Object.values(adStore.groups);

  // Filter items by selected OU
  const filteredUsers = users.filter(u => u.parentOuId === selectedOuId);
  const filteredComputers = computers.filter(c => c.parentOuId === selectedOuId);
  const filteredGroups = groups.filter(g => g.parentOuId === selectedOuId);

  const handleUnlockUser = (userId: string) => {
    adStore.updateUser(userId, { lockedOut: false });
  };

  const handleResetPassword = (userId: string) => {
    // In simulation, reset means clearing lockedOut and passwordExpired
    adStore.updateUser(userId, { lockedOut: false, passwordExpired: false });
    alert(`Password reset for user ${userId}.`);
  };

  return (
    <div className="modal-backdrop" onClick={onClose} style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.5)', zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{
        background: '#e0e0e0', color: '#000',
        width: 1000, maxWidth: '95vw', height: 700, maxHeight: '95vh',
        borderRadius: 4, display: 'flex', flexDirection: 'column',
        boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
        border: '1px solid #999',
        fontFamily: 'Segoe UI, Tahoma, sans-serif' // Windows feel
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: 8, background: '#fff', borderBottom: '1px solid #ccc' }}>
          <h2 style={{ margin: 0, fontSize: 14, display: 'flex', alignItems: 'center', gap: 6, fontWeight: 'normal' }}>
            <Server size={16} color="#0078D4" /> 
            Active Directory Users and Computers [{primaryDomain.name}]
          </h2>
          <button className="btn btn-icon" onClick={onClose} style={{ color: '#000' }}><X size={16} /></button>
        </div>

        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* LEFT PANEL: Tree */}
          <div style={{ width: 250, borderRight: '1px solid #ccc', background: '#fff', overflowY: 'auto', padding: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', padding: 4, background: selectedOuId === null ? '#e5f3ff' : 'transparent' }} onClick={() => setSelectedOuId(null)}>
              <Server size={14} color="#f59e0b" />
              <span style={{ fontSize: 12 }}>{primaryDomain.name}</span>
            </div>
            {ous.map(ou => (
              <div 
                key={ou.id} 
                style={{ 
                  display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', padding: 4, paddingLeft: 24,
                  background: selectedOuId === ou.id ? '#e5f3ff' : 'transparent'
                }}
                onClick={() => setSelectedOuId(ou.id)}
              >
                <Folder size={14} color="#f59e0b" fill="#f59e0b" />
                <span style={{ fontSize: 12 }}>{ou.name}</span>
              </div>
            ))}
          </div>

          {/* RIGHT PANEL: Contents */}
          <div style={{ flex: 1, background: '#fff', padding: 0, overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead style={{ background: '#f0f0f0', borderBottom: '1px solid #ccc', textAlign: 'left' }}>
                <tr>
                  <th style={{ padding: '4px 8px', fontWeight: 'normal' }}>Name</th>
                  <th style={{ padding: '4px 8px', fontWeight: 'normal' }}>Type</th>
                  <th style={{ padding: '4px 8px', fontWeight: 'normal' }}>Description</th>
                  <th style={{ padding: '4px 8px', fontWeight: 'normal' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(u => (
                  <tr key={u.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '4px 8px', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Users size={14} color={u.enabled ? "#0078D4" : "#999"} /> 
                      {u.name} 
                      {u.lockedOut && <Lock size={12} color="#ef4444" />}
                    </td>
                    <td style={{ padding: '4px 8px' }}>User</td>
                    <td style={{ padding: '4px 8px' }}>{u.title || u.department || ''}</td>
                    <td style={{ padding: '4px 8px' }}>
                      {u.lockedOut && (
                        <button style={{ fontSize: 11, cursor: 'pointer', marginRight: 4 }} onClick={() => handleUnlockUser(u.id)}>Unlock</button>
                      )}
                      <button style={{ fontSize: 11, cursor: 'pointer' }} onClick={() => handleResetPassword(u.id)}>Reset PW</button>
                    </td>
                  </tr>
                ))}
                {filteredComputers.map(c => (
                  <tr key={c.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '4px 8px', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <HardDrive size={14} color="#0078D4" /> {c.name}
                    </td>
                    <td style={{ padding: '4px 8px' }}>Computer</td>
                    <td style={{ padding: '4px 8px' }}>{c.operatingSystem}</td>
                    <td style={{ padding: '4px 8px' }}></td>
                  </tr>
                ))}
                {filteredGroups.map(g => (
                  <tr key={g.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '4px 8px', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Shield size={14} color="#10b981" /> {g.name}
                    </td>
                    <td style={{ padding: '4px 8px' }}>Group</td>
                    <td style={{ padding: '4px 8px' }}>{g.groupScope} - {g.groupType}</td>
                    <td style={{ padding: '4px 8px' }}></td>
                  </tr>
                ))}
                {filteredUsers.length === 0 && filteredComputers.length === 0 && filteredGroups.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ padding: 16, textAlign: 'center', color: '#888' }}>
                      No items to display in this view.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
