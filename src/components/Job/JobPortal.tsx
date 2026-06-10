import React, { useEffect, useState } from 'react';
import { useJobStore } from '../../store/useJobStore';
import { startTicketEngine, stopTicketEngine } from '../../core/simulators/TicketEngine';
import { Clock, Briefcase, CheckCircle, AlertTriangle, Info, X, Globe } from 'lucide-react';
import type { JobRole, Ticket } from '../../types/job';
import EnvironmentSetup from './EnvironmentSetup';

interface JobPortalProps {
  onClose: () => void;
}

const ROLES: JobRole[] = ['HelpDesk', 'SysAdmin', 'NetAdmin', 'CloudArchitect', 'SecOps', 'OneManArmy'];

export default function JobPortal({ onClose }: JobPortalProps) {
  const jobStore = useJobStore();
  const [selectedRole, setSelectedRole] = useState<JobRole>('HelpDesk');
  const [showSetup, setShowSetup] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (jobStore.isClockedIn) {
      startTicketEngine();
    } else {
      stopTicketEngine();
    }
    return () => stopTicketEngine();
  }, [jobStore.isClockedIn]);

  const handleClockIn = () => {
    jobStore.clockIn(selectedRole);
  };

  const handleClockOut = () => {
    jobStore.clockOut();
  };

  const openTickets = Object.values(jobStore.tickets)
    .filter(t => t.status === 'Open' || t.status === 'InProgress')
    .sort((a, b) => b.createdAt - a.createdAt);

  const resolvedTickets = Object.values(jobStore.tickets)
    .filter(t => t.status === 'Resolved' || t.status === 'Closed')
    .sort((a, b) => b.createdAt - a.createdAt);

  return (
    <div className="modal-backdrop" onClick={onClose} style={{
      position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.5)', zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{
        background: 'var(--panel-bg, #1e1e1e)', color: 'var(--text, #eee)',
        width: 800, maxWidth: '90vw', height: 600, maxHeight: '90vh',
        borderRadius: 8, display: 'flex', flexDirection: 'column',
        boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
        border: '1px solid var(--border, #333)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: 16, borderBottom: '1px solid var(--border, #333)' }}>
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Briefcase size={20} /> IT Service Desk Portal
          </h2>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            {!jobStore.isClockedIn && (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', background: '#3c3c3c', padding: '4px 8px', borderRadius: 6 }}>
                <span style={{ fontSize: 12 }}>Initialize World:</span>
                <button onClick={() => setShowSetup(true)} className="btn btn-ghost" style={{ fontSize: 12, padding: '4px 8px', display: 'flex', gap: 4 }}><Globe size={14}/> Setup Environment...</button>
              </div>
            )}
            <button className="btn btn-icon" onClick={onClose}><X size={20} /></button>
          </div>
        </div>

        {showSetup && <EnvironmentSetup onClose={() => setShowSetup(false)} />}

        <div style={{ padding: 16, display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* LEFT PANEL: Controls */}
          <div style={{ width: 250, borderRight: '1px solid var(--border, #333)', paddingRight: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {!jobStore.isClockedIn ? (
              <div style={{ background: '#252526', padding: 16, borderRadius: 6 }}>
                <h3 style={{ marginTop: 0, fontSize: 14 }}>Start Shift</h3>
                <label style={{ display: 'block', fontSize: 12, marginBottom: 8 }}>Select Role:</label>
                <select 
                  style={{ width: '100%', padding: 8, background: '#3c3c3c', color: '#fff', border: 'none', borderRadius: 4, marginBottom: 16 }}
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as JobRole)}
                >
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                <button 
                  className="btn btn-primary" 
                  style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: 8 }}
                  onClick={handleClockIn}
                >
                  <Clock size={16} /> Clock In
                </button>
              </div>
            ) : (
              <div style={{ background: '#252526', padding: 16, borderRadius: 6 }}>
                <h3 style={{ marginTop: 0, fontSize: 14, color: '#4ade80' }}>● Clocked In</h3>
                <div style={{ fontSize: 12, marginBottom: 4 }}><strong>Role:</strong> {jobStore.currentRole}</div>
                <div style={{ fontSize: 12, marginBottom: 16 }}>
                  <strong>Time:</strong> {Math.floor((now - (jobStore.shiftStartTime || now)) / 60000)} mins
                </div>
                <div style={{ fontSize: 12, marginBottom: 16 }}>
                  <strong>Tickets Resolved:</strong> {jobStore.completedTicketsCount}
                </div>
                <button 
                  className="btn btn-danger" 
                  style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: 8, background: '#ef4444', color: 'white', border: 'none', padding: 8, borderRadius: 4, cursor: 'pointer' }}
                  onClick={handleClockOut}
                >
                  <Clock size={16} /> Clock Out
                </button>
              </div>
            )}
            
            <div style={{ flex: 1, background: '#252526', padding: 16, borderRadius: 6, overflowY: 'auto' }}>
              <h3 style={{ marginTop: 0, fontSize: 14 }}>Recently Resolved</h3>
              {resolvedTickets.length === 0 ? (
                <div style={{ fontSize: 12, color: '#888' }}>No tickets resolved yet.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {resolvedTickets.slice(0, 5).map(t => (
                    <div key={t.id} style={{ fontSize: 11, padding: 8, background: '#1e1e1e', borderRadius: 4 }}>
                      <strong style={{ color: '#4ade80' }}>✓ {t.title}</strong>
                      <div style={{ color: '#888', marginTop: 4 }}>{t.resolutionNotes}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT PANEL: Tickets Queue */}
          <div style={{ flex: 1, paddingLeft: 16, overflowY: 'auto' }}>
            <h3 style={{ marginTop: 0 }}>Ticket Queue</h3>
            {!jobStore.isClockedIn ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>
                <Briefcase size={48} style={{ opacity: 0.5, marginBottom: 16 }} />
                <p>Clock in to start receiving tickets.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {openTickets.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>
                    <CheckCircle size={48} style={{ opacity: 0.5, marginBottom: 16 }} />
                    <p>No active tickets in queue. Great job!</p>
                  </div>
                ) : (
                  openTickets.map(ticket => (
                    <TicketCard key={ticket.id} ticket={ticket} />
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function TicketCard({ ticket }: { ticket: Ticket }) {
  const store = useJobStore();

  const handleStart = () => store.updateTicketStatus(ticket.id, 'InProgress');
  
  return (
    <div style={{ 
      background: '#252526', 
      borderLeft: `4px solid ${ticket.severity === 'Critical' ? '#ef4444' : ticket.severity === 'High' ? '#f97316' : ticket.severity === 'Medium' ? '#eab308' : '#3b82f6'}`,
      padding: 16, 
      borderRadius: '0 6px 6px 0' 
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <h4 style={{ margin: 0, fontSize: 16 }}>{ticket.title}</h4>
        <span style={{ fontSize: 11, background: '#3c3c3c', padding: '2px 6px', borderRadius: 10 }}>{ticket.id}</span>
      </div>
      <div style={{ fontSize: 13, color: '#ccc', marginBottom: 16 }}>
        {ticket.description}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 12, fontSize: 12, color: '#888' }}>
          <span><strong>Severity:</strong> {ticket.severity}</span>
          <span><strong>Status:</strong> {ticket.status}</span>
        </div>
        <div>
          {ticket.status === 'Open' && (
            <button className="btn btn-primary" style={{ padding: '4px 12px', fontSize: 12 }} onClick={handleStart}>
              Accept Ticket
            </button>
          )}
          {ticket.status === 'InProgress' && (
            <span style={{ fontSize: 12, color: '#eab308', display: 'flex', alignItems: 'center', gap: 4 }}>
              <AlertTriangle size={14} /> Auto-verifying...
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
