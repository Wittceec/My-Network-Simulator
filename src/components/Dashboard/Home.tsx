import React from 'react';
import { useNetworkStore } from '../../store/useNetworkStore';
import { useJobStore } from '../../store/useJobStore';
import { useAzureStore } from '../../store/useAzureStore';
import { useActiveDirectoryStore } from '../../store/useActiveDirectoryStore';
import { useServerStore } from '../../store/useServerStore';
import { Briefcase, Server, Cloud, Network, AlertTriangle, CheckCircle, HeadphonesIcon, Monitor, User } from 'lucide-react';
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
          </div>
        </div>

      </div>
    </div>
  );
}
