import React from 'react';
import { useNetworkStore } from '../../store/useNetworkStore';
import { useJobStore } from '../../store/useJobStore';
import { Hexagon, Home, Briefcase, HeadphonesIcon, Server, Globe, FileText, Monitor, Folder, Cloud, Network, ShieldAlert, HelpCircle } from 'lucide-react';
import HelpGuide from './../UI/HelpGuide';
import './Dashboard.css';

interface LayoutProps {
  children: React.ReactNode;
  currentView: string;
  onNavigate: (view: string) => void;
}

export default function Layout({ children, currentView, onNavigate }: LayoutProps) {
  const [showHelp, setShowHelp] = React.useState(false);
  const deviceCount = useNetworkStore((s) => Object.keys(s.devices).length);
  const jobStore = useJobStore();
  const openTicketsCount = Object.values(jobStore.tickets).filter(t => t.status === 'Open').length;

  const navItems = [
    { id: 'home', icon: <Home size={20} />, label: 'Dashboard' },
    { id: 'jobportal', icon: <Briefcase size={20} />, label: 'Job Portal', highlight: jobStore.isClockedIn },
    { id: 'servicedesk', icon: <HeadphonesIcon size={20} />, label: 'Service Desk', badge: openTicketsCount },
    { id: 'ad', icon: <Server size={20} />, label: 'Active Directory' },
    { id: 'dns', icon: <Globe size={20} />, label: 'DNS Manager' },
    { id: 'gpo', icon: <FileText size={20} />, label: 'Group Policy' },
    { id: 'hyperv', icon: <Monitor size={20} />, label: 'Hyper-V' },
    { id: 'fs', icon: <Folder size={20} />, label: 'File Server' },
    { id: 'azure', icon: <Cloud size={20} />, label: 'Azure Portal' },
    { id: 'm365', icon: <Cloud size={20} />, label: 'Microsoft 365' },
    { id: 'soc', icon: <ShieldAlert size={20} />, label: 'SOC / SIEM' },
    { id: 'network', icon: <Network size={20} />, label: 'Network Map' },
  ];

  return (
    <div className="app-layout">
      {/* Global Sidebar Navigation */}
      <nav className="global-nav">
        <div className="nav-brand">
          <div className="nav-logo">
            <Hexagon size={24} fill="currentColor" />
          </div>
        </div>

        <div className="nav-links">
          {navItems.map(item => (
            <button
              key={item.id}
              className={`nav-item ${currentView === item.id ? 'active' : ''} ${item.highlight ? 'highlight' : ''}`}
              onClick={() => onNavigate(item.id)}
              title={item.label}
            >
              <div className="nav-icon">{item.icon}</div>
              {item.badge && item.badge > 0 && <span className="nav-badge">{item.badge}</span>}
            </button>
          ))}
        </div>

        <div className="nav-footer">
          <div className="nav-lab-status" title={`${deviceCount} Devices`}>
            <div className={`status-dot ${deviceCount > 0 ? 'online' : 'offline'}`}></div>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="main-content">
        {/* Top Header */}
        <header className="main-header">
          <div className="header-title">
            <h2>{navItems.find(n => n.id === currentView)?.label || 'Dashboard'}</h2>
            <span className="header-subtitle">my_network_lab • {deviceCount} Devices</span>
          </div>
          <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button className="btn btn-ghost" onClick={() => setShowHelp(true)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <HelpCircle size={18} />
              <span style={{ fontSize: 13 }}>Help & Tips</span>
            </button>
            {jobStore.isClockedIn && (
              <div className="clocked-in-badge">
                <div className="pulse-dot"></div>
                Clocked In: {jobStore.currentRole}
              </div>
            )}
          </div>
        </header>
        
        {/* View Container */}
        <div className="view-container">
          {children}
        </div>
      </main>

      {showHelp && <HelpGuide onClose={() => setShowHelp(false)} />}
    </div>
  );
}
