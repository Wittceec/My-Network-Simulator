import React, { useState, useEffect } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import NetworkCanvas from './components/Canvas/NetworkCanvas';
import Sidebar, { SidebarSheet } from './components/UI/Sidebar';
import TerminalManager from './components/Terminal/TerminalManager';
import AzurePortal from './components/UI/AzurePortal';
import JobPortal from './components/Job/JobPortal';
import ServiceDesk from './components/Job/ServiceDesk';
import ActiveDirectoryDashboard from './components/ActiveDirectory/ActiveDirectoryDashboard';
import DnsManager from './components/DNS/DnsManager';
import GroupPolicyManager from './components/GPO/GroupPolicyManager';
import HyperVManager from './components/HyperV/HyperVManager';
import FileServerResource from './components/FileServer/FileServerResource';
import Layout from './components/Dashboard/Layout';
import Home from './components/Dashboard/Home';
import SocDashboard from './components/Security/SocDashboard';

class AppErrorBoundary extends React.Component<{children: any}, {error: any}> {
  constructor(props: any) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error: any) { return { error }; }
  render() { 
    if (this.state.error) return <div style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999999, background: 'red', color: 'white', padding: 20}}><h1>App Crash</h1><pre>{this.state.error.message}</pre><pre>{this.state.error.stack}</pre></div>;
    return this.props.children;
  }
}

function App() {
  const [currentView, setCurrentView] = useState<string>('home');

  // Network view needs the sidebar and terminal
  const renderNetworkView = () => (
    <div style={{ display: 'flex', flex: 1, width: '100%', height: '100%', overflow: 'hidden', position: 'relative' }}>
      <Sidebar />
      <NetworkCanvas />
      <TerminalManager />
    </div>
  );

  return (
    <ReactFlowProvider>
      <Layout currentView={currentView} onNavigate={setCurrentView}>
        {currentView === 'home' && <AppErrorBoundary><Home onNavigate={setCurrentView} /></AppErrorBoundary>}
        {currentView === 'network' && renderNetworkView()}
        {currentView === 'jobportal' && <AppErrorBoundary><div style={{width: '100%', height: '100%', position: 'relative'}}><JobPortal onClose={() => setCurrentView('home')} /></div></AppErrorBoundary>}
        {currentView === 'servicedesk' && <AppErrorBoundary><div style={{width: '100%', height: '100%', position: 'relative'}}><ServiceDesk onClose={() => setCurrentView('home')} /></div></AppErrorBoundary>}
        {currentView === 'ad' && <AppErrorBoundary><div style={{width: '100%', height: '100%', position: 'relative'}}><ActiveDirectoryDashboard onClose={() => setCurrentView('home')} /></div></AppErrorBoundary>}
        {currentView === 'dns' && <AppErrorBoundary><div style={{width: '100%', height: '100%', position: 'relative'}}><DnsManager onClose={() => setCurrentView('home')} /></div></AppErrorBoundary>}
        {currentView === 'gpo' && <AppErrorBoundary><div style={{width: '100%', height: '100%', position: 'relative'}}><GroupPolicyManager onClose={() => setCurrentView('home')} /></div></AppErrorBoundary>}
        {currentView === 'hyperv' && <AppErrorBoundary><div style={{width: '100%', height: '100%', position: 'relative'}}><HyperVManager onClose={() => setCurrentView('home')} /></div></AppErrorBoundary>}
        {currentView === 'fs' && <AppErrorBoundary><div style={{width: '100%', height: '100%', position: 'relative'}}><FileServerResource onClose={() => setCurrentView('home')} /></div></AppErrorBoundary>}
        {currentView === 'azure' && <AppErrorBoundary><div style={{width: '100%', height: '100%', position: 'relative'}}><AzurePortal onClose={() => setCurrentView('home')} /></div></AppErrorBoundary>}
        {currentView === 'soc' && <AppErrorBoundary><div style={{width: '100%', height: '100%', position: 'relative'}}><SocDashboard onClose={() => setCurrentView('home')} /></div></AppErrorBoundary>}
      </Layout>
    </ReactFlowProvider>
  );
}

export default App;
