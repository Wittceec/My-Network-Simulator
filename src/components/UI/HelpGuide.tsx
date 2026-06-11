import React from 'react';
import { X, Terminal, Monitor, Server, Cloud } from 'lucide-react';

interface HelpGuideProps {
  onClose: () => void;
}

export default function HelpGuide({ onClose }: HelpGuideProps) {
  return (
    <div className="modal-backdrop" onClick={onClose} style={{
      position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.5)', zIndex: 99999,
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{
        background: 'var(--panel-bg, #1e1e1e)', color: 'var(--text, #eee)',
        width: 700, maxWidth: '90vw', height: 600, maxHeight: '90vh',
        borderRadius: 8, display: 'flex', flexDirection: 'column',
        boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
        border: '1px solid var(--border, #333)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: 16, borderBottom: '1px solid var(--border, #333)' }}>
          <h2 style={{ margin: 0, fontSize: 18 }}>Simulator Help & Tips</h2>
          <button className="btn btn-icon" onClick={onClose}><X size={20} /></button>
        </div>
        
        <div style={{ padding: 24, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
          
          <section>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 0, color: '#3b82f6' }}>
              <Monitor size={18} /> General Controls
            </h3>
            <ul style={{ paddingLeft: 20, margin: 0, lineHeight: '1.6', fontSize: 14 }}>
              <li><strong>Network Map:</strong> Drag and drop devices from the sidebar, or tap them on mobile.</li>
              <li><strong>Connections:</strong> Click and drag from the blue circle on a device to another device to connect them.</li>
              <li><strong>Terminal:</strong> Double-click any device on the canvas to open its virtual environment.</li>
              <li><strong>Virtual Desktop:</strong> PCs open into a full Virtual Desktop. Click the Terminal icon inside to access the command line.</li>
            </ul>
          </section>

          <section>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 0, color: '#f97316' }}>
              <Terminal size={18} /> Cisco IOS Commands (Routers & Switches)
            </h3>
            <div style={{ background: '#000', padding: 12, borderRadius: 4, fontFamily: 'monospace', fontSize: 12, color: '#ccc' }}>
              <div>enable                    <span style={{color:'#666'}}>// Enter privileged mode</span></div>
              <div>configure terminal        <span style={{color:'#666'}}>// Enter global config mode</span></div>
              <div>interface fa0/0           <span style={{color:'#666'}}>// Enter interface config</span></div>
              <div>ip address 10.0.0.1 255.255.255.0 <span style={{color:'#666'}}>// Set IP</span></div>
              <div>no shutdown               <span style={{color:'#666'}}>// Bring interface up</span></div>
              <div>show ip interface brief   <span style={{color:'#666'}}>// View interface status</span></div>
              <div>show ip route             <span style={{color:'#666'}}>// View routing table</span></div>
              <div>ping 10.0.0.2             <span style={{color:'#666'}}>// Test connectivity</span></div>
              <div>router ospf 1             <span style={{color:'#666'}}>// Configure OSPF</span></div>
              <div>switchport mode access    <span style={{color:'#666'}}>// Configure switch port</span></div>
            </div>
          </section>

          <section>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 0, color: '#10b981' }}>
              <Server size={18} /> Linux Server Commands
            </h3>
            <div style={{ background: '#000', padding: 12, borderRadius: 4, fontFamily: 'monospace', fontSize: 12, color: '#ccc' }}>
              <div>ls -la                    <span style={{color:'#666'}}>// List files</span></div>
              <div>cat /etc/passwd           <span style={{color:'#666'}}>// View file contents</span></div>
              <div>ifconfig                  <span style={{color:'#666'}}>// View network interfaces</span></div>
              <div>ping 8.8.8.8              <span style={{color:'#666'}}>// Test connectivity</span></div>
              <div>systemctl start nginx     <span style={{color:'#666'}}>// Manage services</span></div>
              <div>systemctl status nginx    <span style={{color:'#666'}}>// Check service status</span></div>
              <div>tail -f /var/log/syslog   <span style={{color:'#666'}}>// View live logs</span></div>
            </div>
          </section>

          <section>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 0, color: '#a855f7' }}>
              <Cloud size={18} /> Windows PC Commands
            </h3>
            <div style={{ background: '#000', padding: 12, borderRadius: 4, fontFamily: 'monospace', fontSize: 12, color: '#ccc' }}>
              <div>ipconfig /all             <span style={{color:'#666'}}>// View IP configuration</span></div>
              <div>ping dc01.corp.local      <span style={{color:'#666'}}>// Test connectivity</span></div>
              <div>nslookup google.com       <span style={{color:'#666'}}>// DNS query</span></div>
              <div>tracert 8.8.8.8           <span style={{color:'#666'}}>// Trace route</span></div>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
