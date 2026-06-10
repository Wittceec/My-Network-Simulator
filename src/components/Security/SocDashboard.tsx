import React, { useState } from 'react';
import { useSecurityStore } from '../../store/useSecurityStore';
import { ShieldAlert, Shield, Activity, Search, X, Lock, Unlock, ShieldCheck } from 'lucide-react';
import type { FirewallRule } from '../../types/security';
import { generateId } from '../../utils/helpers';

export default function SocDashboard({ onClose }: { onClose: () => void }) {
  const secStore = useSecurityStore();
  const [filter, setFilter] = useState('');
  const [activeTab, setActiveTab] = useState<'logs' | 'firewall'>('logs');

  const [newRule, setNewRule] = useState<Partial<FirewallRule>>({
    name: '',
    action: 'Deny',
    sourceIp: '',
    destinationIp: 'Any',
    destinationPort: 'Any',
    protocol: 'Any',
    priority: 100
  });

  const filteredLogs = secStore.logs.filter(log => 
    log.sourceIp.includes(filter) || 
    log.destinationIp.includes(filter) || 
    log.message.toLowerCase().includes(filter.toLowerCase()) ||
    log.action.toLowerCase().includes(filter.toLowerCase())
  );

  const handleAddRule = () => {
    if (!newRule.name || !newRule.sourceIp) return;
    secStore.addFirewallRule({
      id: generateId('rule_'),
      name: newRule.name,
      action: newRule.action as 'Allow'|'Deny',
      sourceIp: newRule.sourceIp,
      destinationIp: newRule.destinationIp || 'Any',
      destinationPort: newRule.destinationPort || 'Any',
      protocol: newRule.protocol as 'TCP'|'UDP'|'Any',
      priority: newRule.priority || 100
    });
    setNewRule({ ...newRule, name: '', sourceIp: '' });
  };

  const getLogColor = (severity: string) => {
    switch(severity) {
      case 'Critical': return '#ef4444'; // red
      case 'Error': return '#f97316'; // orange
      case 'Warning': return '#eab308'; // yellow
      default: return '#3b82f6'; // blue
    }
  };

  return (
    <div className="soc-dashboard" style={{
      position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
      background: '#0f172a', color: '#e2e8f0', zIndex: 10,
      display: 'flex', flexDirection: 'column', fontFamily: 'monospace'
    }}>
      {/* Header */}
      <div style={{ background: '#1e293b', borderBottom: '1px solid #334155', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <ShieldAlert size={28} color="#3b82f6" />
          <div>
            <h2 style={{ margin: 0, color: '#fff' }}>Security Operations Center (SOC)</h2>
            <div style={{ fontSize: 12, color: '#94a3b8' }}>Sentinel SIEM & Firewall Management</div>
          </div>
        </div>
        <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
          <X size={24} />
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #334155', background: '#1e293b' }}>
        <button 
          onClick={() => setActiveTab('logs')}
          style={{ flex: 1, padding: 16, background: activeTab === 'logs' ? '#0f172a' : 'transparent', border: 'none', color: activeTab === 'logs' ? '#3b82f6' : '#94a3b8', borderBottom: activeTab === 'logs' ? '2px solid #3b82f6' : 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
        >
          <Activity size={18} /> Raw Log Search
        </button>
        <button 
          onClick={() => setActiveTab('firewall')}
          style={{ flex: 1, padding: 16, background: activeTab === 'firewall' ? '#0f172a' : 'transparent', border: 'none', color: activeTab === 'firewall' ? '#3b82f6' : '#94a3b8', borderBottom: activeTab === 'firewall' ? '2px solid #3b82f6' : 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
        >
          <ShieldCheck size={18} /> Global Firewall (NSG)
        </button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', padding: 24 }}>
        
        {activeTab === 'logs' && (
          <>
            <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', background: '#1e293b', padding: '8px 16px', borderRadius: 6, border: '1px solid #334155' }}>
                <Search size={18} color="#64748b" style={{ marginRight: 12 }} />
                <input 
                  type="text" 
                  placeholder="Search by IP, Action, or Message..." 
                  value={filter}
                  onChange={e => setFilter(e.target.value)}
                  style={{ background: 'transparent', border: 'none', color: '#fff', width: '100%', outline: 'none' }}
                />
              </div>
              <div style={{ padding: '8px 16px', background: '#1e293b', border: '1px solid #334155', borderRadius: 6, display: 'flex', alignItems: 'center' }}>
                Logs: <strong style={{ color: '#fff', marginLeft: 8 }}>{filteredLogs.length}</strong>
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', background: '#1e293b', borderRadius: 6, border: '1px solid #334155' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead style={{ background: '#0f172a', position: 'sticky', top: 0 }}>
                  <tr>
                    <th style={{ padding: 12, textAlign: 'left', borderBottom: '1px solid #334155' }}>Time</th>
                    <th style={{ padding: 12, textAlign: 'left', borderBottom: '1px solid #334155' }}>Severity</th>
                    <th style={{ padding: 12, textAlign: 'left', borderBottom: '1px solid #334155' }}>Action</th>
                    <th style={{ padding: 12, textAlign: 'left', borderBottom: '1px solid #334155' }}>Source IP</th>
                    <th style={{ padding: 12, textAlign: 'left', borderBottom: '1px solid #334155' }}>Dest IP:Port</th>
                    <th style={{ padding: 12, textAlign: 'left', borderBottom: '1px solid #334155' }}>Message</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map(log => (
                    <tr key={log.id} style={{ borderBottom: '1px solid #334155', background: log.action === 'Denied' ? 'rgba(239, 68, 68, 0.05)' : 'transparent' }}>
                      <td style={{ padding: 12, color: '#94a3b8' }}>{new Date(log.timestamp).toLocaleTimeString()}</td>
                      <td style={{ padding: 12 }}>
                        <span style={{ color: getLogColor(log.severity), fontWeight: 'bold' }}>{log.severity}</span>
                      </td>
                      <td style={{ padding: 12 }}>{log.action}</td>
                      <td style={{ padding: 12, color: '#38bdf8' }}>{log.sourceIp}</td>
                      <td style={{ padding: 12, color: '#a78bfa' }}>{log.destinationIp}:{log.port}</td>
                      <td style={{ padding: 12 }}>{log.message}</td>
                    </tr>
                  ))}
                  {filteredLogs.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ padding: 24, textAlign: 'center', color: '#64748b' }}>No logs matched the filter.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {activeTab === 'firewall' && (
          <div style={{ display: 'flex', gap: 24, height: '100%' }}>
            {/* Rule List */}
            <div style={{ flex: 2, background: '#1e293b', borderRadius: 6, border: '1px solid #334155', display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: 16, borderBottom: '1px solid #334155', background: '#0f172a' }}>
                <h3 style={{ margin: 0 }}>Active Rules</h3>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {Object.values(secStore.firewallRules).sort((a,b) => a.priority - b.priority).map(rule => (
                  <div key={rule.id} style={{ background: '#0f172a', padding: 16, borderRadius: 6, borderLeft: `4px solid ${rule.action === 'Allow' ? '#10b981' : '#ef4444'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
                        {rule.action === 'Allow' ? <Unlock size={14} color="#10b981" /> : <Lock size={14} color="#ef4444" />}
                        {rule.name} (Priority {rule.priority})
                      </div>
                      <div style={{ color: '#94a3b8', fontSize: 13 }}>
                        Source: <span style={{ color: '#38bdf8' }}>{rule.sourceIp}</span> &rarr; 
                        Dest: <span style={{ color: '#a78bfa' }}>{rule.destinationIp}:{rule.destinationPort}</span> ({rule.protocol})
                      </div>
                    </div>
                    <button onClick={() => secStore.removeFirewallRule(rule.id)} style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '6px 12px', borderRadius: 4, cursor: 'pointer' }}>
                      Delete
                    </button>
                  </div>
                ))}
                {Object.keys(secStore.firewallRules).length === 0 && (
                  <div style={{ color: '#64748b', textAlign: 'center', padding: 32 }}>No custom firewall rules configured.</div>
                )}
              </div>
            </div>

            {/* Create Rule */}
            <div style={{ flex: 1, background: '#1e293b', borderRadius: 6, border: '1px solid #334155', padding: 24 }}>
              <h3 style={{ margin: '0 0 24px 0' }}>Create New Rule</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 8, fontSize: 13, color: '#94a3b8' }}>Rule Name</label>
                  <input type="text" value={newRule.name} onChange={e => setNewRule({...newRule, name: e.target.value})} placeholder="e.g. Block Malicious IP" style={{ width: '100%', padding: 10, background: '#0f172a', border: '1px solid #334155', color: '#fff', borderRadius: 4 }} />
                </div>
                
                <div style={{ display: 'flex', gap: 16 }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: 8, fontSize: 13, color: '#94a3b8' }}>Action</label>
                    <select value={newRule.action} onChange={e => setNewRule({...newRule, action: e.target.value as any})} style={{ width: '100%', padding: 10, background: '#0f172a', border: '1px solid #334155', color: '#fff', borderRadius: 4 }}>
                      <option>Deny</option>
                      <option>Allow</option>
                    </select>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: 8, fontSize: 13, color: '#94a3b8' }}>Priority</label>
                    <input type="number" value={newRule.priority} onChange={e => setNewRule({...newRule, priority: parseInt(e.target.value)})} style={{ width: '100%', padding: 10, background: '#0f172a', border: '1px solid #334155', color: '#fff', borderRadius: 4 }} />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: 8, fontSize: 13, color: '#94a3b8' }}>Source IP</label>
                  <input type="text" value={newRule.sourceIp} onChange={e => setNewRule({...newRule, sourceIp: e.target.value})} placeholder="e.g. 192.168.1.100 or Any" style={{ width: '100%', padding: 10, background: '#0f172a', border: '1px solid #334155', color: '#fff', borderRadius: 4 }} />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: 8, fontSize: 13, color: '#94a3b8' }}>Destination IP</label>
                  <input type="text" value={newRule.destinationIp} onChange={e => setNewRule({...newRule, destinationIp: e.target.value})} placeholder="Any" style={{ width: '100%', padding: 10, background: '#0f172a', border: '1px solid #334155', color: '#fff', borderRadius: 4 }} />
                </div>

                <div style={{ display: 'flex', gap: 16 }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: 8, fontSize: 13, color: '#94a3b8' }}>Protocol</label>
                    <select value={newRule.protocol} onChange={e => setNewRule({...newRule, protocol: e.target.value as any})} style={{ width: '100%', padding: 10, background: '#0f172a', border: '1px solid #334155', color: '#fff', borderRadius: 4 }}>
                      <option>Any</option>
                      <option>TCP</option>
                      <option>UDP</option>
                    </select>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: 8, fontSize: 13, color: '#94a3b8' }}>Dest Port</label>
                    <input type="text" value={newRule.destinationPort} onChange={e => setNewRule({...newRule, destinationPort: e.target.value})} placeholder="Any" style={{ width: '100%', padding: 10, background: '#0f172a', border: '1px solid #334155', color: '#fff', borderRadius: 4 }} />
                  </div>
                </div>

                <button 
                  onClick={handleAddRule}
                  style={{ marginTop: 16, padding: 12, background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 'bold' }}
                >
                  Apply Rule
                </button>

              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
