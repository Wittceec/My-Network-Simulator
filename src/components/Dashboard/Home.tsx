import React from 'react';
import { useNetworkStore } from '../../store/useNetworkStore';
import { useJobStore } from '../../store/useJobStore';
import { useAzureStore } from '../../store/useAzureStore';
import { useActiveDirectoryStore } from '../../store/useActiveDirectoryStore';
import { useServerStore } from '../../store/useServerStore';
import { Briefcase, Server, Cloud, Network, AlertTriangle, CheckCircle, HeadphonesIcon, Monitor, User, Award, DollarSign, ShieldAlert } from 'lucide-react';
import './Dashboard.css';

interface HomeProps {
  onNavigate: (view: string) => void;
}

export default function Home({ onNavigate }: HomeProps) {
  const netStore = useNetworkStore();
  const jobStore = useJobStore();
  const azureStore = useAzureStore();
  const adStore = useActiveDirectoryStore();
  const serverStore = useServerStore();

  const deviceCount = Object.keys(netStore.devices).length;
  const linkCount = Object.keys(netStore.links).length;
  
  const azureResources = Object.keys(azureStore.vnets).length + Object.keys(azureStore.vms).length + Object.keys(azureStore.storageAccounts).length;
  
  const usersCount = Object.keys(adStore.users).length;
  const vmsCount = Object.keys(serverStore.vms).length;

  const openTickets = Object.values(jobStore.tickets).filter(t => t.status === 'Open' || t.status === 'In Progress');
  const criticalTickets = openTickets.filter(t => t.severity === 'Critical').length;
  
  const xpProgress = (jobStore.xp % 1000) / 1000 * 100;

  return (
    <div className="dashboard-home">
      <div className="dash-grid">
        
        {/* Welcome / Status Panel */}
        <div className="dash-card col-span-2 welcome-card">
          <div className="card-bg-glow"></div>
          <div className="welcome-content">
            <h1>Command Center</h1>
            <p>Your centralized IT operations dashboard.</p>
            
            <div className="status-banner">
              {jobStore.isClockedIn ? (
                <div className="status-item active">
                  <div className="pulse-indicator"></div>
                  <span>Clocked in as <strong>{jobStore.currentRole}</strong></span>
                </div>
              ) : (
                <div className="status-item idle">
                  <div className="idle-indicator"></div>
                  <span>Not clocked in. No active shift.</span>
                </div>
              )}
            </div>

            <div className="welcome-actions">
              {!jobStore.isClockedIn && (
                <button className="btn btn-primary" onClick={() => onNavigate('jobportal')}>
                  <Briefcase size={16} /> Open Job Portal
                </button>
              )}
              <button className="btn" onClick={() => onNavigate('network')}>
                <Network size={16} /> View Topology
              </button>
            </div>
          </div>
        </div>

        {/* Employee Profile & Stats */}
        <div className="dash-card profile-card">
          <div className="card-header">
            <h3><Award size={16} /> Employee Profile</h3>
          </div>
          <div className="card-body">
            <div className="metric-huge">
              <span className="value">Level {jobStore.level}</span>
              <span className="label">{jobStore.currentRole || 'Guest'}</span>
            </div>
            
            <div className="xp-container" style={{ marginTop: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px' }}>
                <span>XP: {jobStore.xp}</span>
                <span>Next: {(jobStore.level) * 1000}</span>
              </div>
              <div style={{ width: '100%', height: '8px', background: '#334155', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${xpProgress}%`, height: '100%', background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)', transition: 'width 0.5s ease' }}></div>
              </div>
            </div>

            <div className="stat-row" style={{ marginTop: '1.5rem', background: 'rgba(16, 185, 129, 0.1)', padding: '0.5rem', borderRadius: '4px' }}>
              <div className="stat-label text-green" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <DollarSign size={16} /> Company Budget
              </div>
              <div className="stat-value text-green" style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
                ${jobStore.budget.toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        {/* Tickets Widget */}
        <div className="dash-card tickets-card" onClick={() => onNavigate('servicedesk')}>
          <div className="card-header">
            <h3><HeadphonesIcon size={16} /> Service Queue</h3>
          </div>
          <div className="card-body">
            <div className="metric-huge">
              <span className="value">{openTickets.length}</span>
              <span className="label">Open Tickets</span>
            </div>
            {criticalTickets > 0 && (
              <div className="alert-row">
                <AlertTriangle size={14} className="text-red" />
                <span>{criticalTickets} Critical</span>
              </div>
            )}
            {openTickets.length === 0 && deviceCount > 0 && (
              <div className="alert-row ok">
                <CheckCircle size={14} className="text-green" />
                <span>All caught up!</span>
              </div>
            )}
          </div>
        </div>

        {/* Infrastructure Health */}
        <div className="dash-card infra-card">
          <div className="card-header">
            <h3>Infrastructure Health</h3>
          </div>
          <div className="card-body">
            <div className="stat-row">
              <div className="stat-label"><Network size={14} /> Network Nodes</div>
              <div className="stat-value">{deviceCount}</div>
            </div>
            <div className="stat-row">
              <div className="stat-label"><Network size={14} /> Links</div>
              <div className="stat-value">{linkCount}</div>
            </div>
            <div className="stat-row">
              <div className="stat-label"><Monitor size={14} /> Hyper-V VMs</div>
              <div className="stat-value">{vmsCount}</div>
            </div>
            <div className="stat-row">
              <div className="stat-label"><Cloud size={14} /> Azure Resources</div>
              <div className="stat-value">{azureResources}</div>
            </div>
            <div className="stat-row">
              <div className="stat-label"><User size={14} /> AD Users</div>
              <div className="stat-value">{usersCount}</div>
            </div>
          </div>
        </div>

        {/* Quick Launch Grid */}
        <div className="dash-card col-span-3 launch-card">
          <div className="card-header">
            <h3>Applications & Tools</h3>
          </div>
          <div className="launch-grid">
            <button className="launch-btn" onClick={() => onNavigate('ad')}>
              <div className="icon-wrapper ad"><Server size={24} /></div>
              <span>Active Directory</span>
            </button>
            <button className="launch-btn" onClick={() => onNavigate('hyperv')}>
              <div className="icon-wrapper hyperv"><Monitor size={24} /></div>
              <span>Hyper-V Manager</span>
            </button>
            <button className="launch-btn" onClick={() => onNavigate('azure')}>
              <div className="icon-wrapper azure"><Cloud size={24} /></div>
              <span>Azure Portal</span>
            </button>
            <button className="launch-btn" onClick={() => onNavigate('servicedesk')}>
              <div className="icon-wrapper desk"><HeadphonesIcon size={24} /></div>
              <span>Service Desk</span>
            </button>
            <button className="launch-btn" onClick={() => onNavigate('jobportal')}>
              <div className="icon-wrapper portal"><Briefcase size={24} /></div>
              <span>Job Portal</span>
            </button>
            <button className="launch-btn" onClick={() => onNavigate('soc')}>
              <div className="icon-wrapper" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}><ShieldAlert size={24} /></div>
              <span>SOC / SIEM</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
