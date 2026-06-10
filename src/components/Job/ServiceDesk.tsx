import React, { useState } from 'react';
import { useJobStore } from '../../store/useJobStore';
import { X, Search, Clock, CheckCircle, AlertCircle, MessageSquare, Briefcase, Zap } from 'lucide-react';
import type { Ticket, TicketStatus } from '../../types/job';
import { forceGenerateTicket } from '../../core/simulators/TicketEngine';

export default function ServiceDesk({ onClose }: { onClose: () => void }) {
  const jobStore = useJobStore();
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [newNote, setNewNote] = useState('');

  const tickets = Object.values(jobStore.tickets).sort((a, b) => b.createdAt - a.createdAt);
  const selectedTicket = selectedTicketId ? jobStore.tickets[selectedTicketId] : null;

  const handleAddNote = () => {
    if (!selectedTicket || !newNote.trim()) return;
    jobStore.addTicketNote(selectedTicket.id, {
      author: 'System Admin (You)',
      timestamp: Date.now(),
      content: newNote.trim()
    });
    setNewNote('');
  };

  const statusColors: Record<TicketStatus, string> = {
    'Open': '#ef4444',
    'InProgress': '#eab308',
    'Resolved': '#22c55e',
    'Closed': '#6b7280'
  };

  return (
    <div className="modal-backdrop" onClick={onClose} style={{
      position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
      zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.5)'
    }}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{
        background: '#111827', color: '#fff',
        width: 1000, maxWidth: '95vw', height: 700, maxHeight: '95vh',
        display: 'flex', flexDirection: 'column',
        borderRadius: 8, overflow: 'hidden', border: '1px solid #374151',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
      }}>
        {/* Header */}
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #374151', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#1f2937' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Briefcase size={24} color="#3b82f6" />
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>IT Service Desk</h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button 
              onClick={forceGenerateTicket}
              style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#eab308', color: '#000', border: 'none', padding: '6px 12px', borderRadius: 4, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}
            >
              <Zap size={14} /> Simulate Incident
            </button>
            <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer' }}><X size={24} /></button>
          </div>
        </div>

        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Ticket List */}
          <div style={{ width: 350, borderRight: '1px solid #374151', display: 'flex', flexDirection: 'column', background: '#111827' }}>
            <div style={{ padding: 16, borderBottom: '1px solid #374151' }}>
              <div style={{ display: 'flex', alignItems: 'center', background: '#1f2937', padding: '8px 12px', borderRadius: 6, gap: 8 }}>
                <Search size={16} color="#9ca3af" />
                <input 
                  placeholder="Search tickets..." 
                  style={{ background: 'transparent', border: 'none', color: '#fff', outline: 'none', width: '100%' }}
                />
              </div>
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {tickets.length === 0 ? (
                <div style={{ padding: 24, textAlign: 'center', color: '#6b7280' }}>No tickets found.</div>
              ) : (
                tickets.map(ticket => (
                  <div 
                    key={ticket.id}
                    onClick={() => setSelectedTicketId(ticket.id)}
                    style={{ 
                      padding: '16px', borderBottom: '1px solid #374151', cursor: 'pointer',
                      background: selectedTicketId === ticket.id ? '#1f2937' : 'transparent',
                      borderLeft: `4px solid ${statusColors[ticket.status]}`
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ fontSize: 12, color: '#9ca3af', fontWeight: 500 }}>{ticket.id.toUpperCase()}</span>
                      <span style={{ fontSize: 12, padding: '2px 8px', borderRadius: 12, background: `${statusColors[ticket.status]}20`, color: statusColors[ticket.status] }}>
                        {ticket.status}
                      </span>
                    </div>
                    <div style={{ fontWeight: 500, fontSize: 14, marginBottom: 8, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {ticket.title}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#6b7280' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Clock size={12} /> {new Date(ticket.createdAt).toLocaleTimeString()}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <AlertCircle size={12} color={ticket.severity === 'Critical' ? '#ef4444' : '#9ca3af'}/> {ticket.severity}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Ticket Details */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#0f172a' }}>
            {selectedTicket ? (
              <>
                <div style={{ padding: 24, borderBottom: '1px solid #374151' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                    <div>
                      <h3 style={{ margin: '0 0 8px 0', fontSize: 24 }}>{selectedTicket.title}</h3>
                      <div style={{ display: 'flex', gap: 16, color: '#9ca3af', fontSize: 14 }}>
                        <span>Reported: {new Date(selectedTicket.createdAt).toLocaleString()}</span>
                        <span>Role: {selectedTicket.role}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {selectedTicket.status === 'Open' && (
                        <button onClick={() => jobStore.updateTicketStatus(selectedTicket.id, 'InProgress')} style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 6, cursor: 'pointer', fontWeight: 500 }}>
                          Take Ticket
                        </button>
                      )}
                      {selectedTicket.status === 'Resolved' && (
                        <button onClick={() => jobStore.updateTicketStatus(selectedTicket.id, 'Closed')} style={{ background: '#6b7280', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 6, cursor: 'pointer', fontWeight: 500 }}>
                          Close Ticket
                        </button>
                      )}
                      <span style={{ padding: '8px 16px', borderRadius: 6, background: `${statusColors[selectedTicket.status]}20`, color: statusColors[selectedTicket.status], fontWeight: 500 }}>
                        {selectedTicket.status}
                      </span>
                    </div>
                  </div>
                  
                  <div style={{ background: '#1e293b', padding: 16, borderRadius: 8, fontSize: 14, lineHeight: 1.6 }}>
                    {selectedTicket.description}
                  </div>
                </div>

                {/* Notes Section */}
                <div style={{ flex: 1, overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8, color: '#9ca3af' }}>
                    <MessageSquare size={16} /> Activity Log
                  </h4>
                  
                  {selectedTicket.notes?.map((note, idx) => (
                    <div key={idx} style={{ background: '#1e293b', padding: 16, borderRadius: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 12, color: '#9ca3af' }}>
                        <span style={{ fontWeight: 600, color: '#e2e8f0' }}>{note.author}</span>
                        <span>{new Date(note.timestamp).toLocaleString()}</span>
                      </div>
                      <div style={{ fontSize: 14 }}>{note.content}</div>
                    </div>
                  ))}
                  {(!selectedTicket.notes || selectedTicket.notes.length === 0) && (
                    <div style={{ color: '#6b7280', fontStyle: 'italic', fontSize: 14 }}>No activity yet.</div>
                  )}

                  {selectedTicket.status === 'Resolved' && (
                    <div style={{ background: '#064e3b', padding: 16, borderRadius: 8, border: '1px solid #059669', display: 'flex', alignItems: 'center', gap: 12 }}>
                      <CheckCircle size={24} color="#10b981" />
                      <div>
                        <div style={{ fontWeight: 600, color: '#34d399' }}>System Verification Complete</div>
                        <div style={{ fontSize: 14, color: '#a7f3d0' }}>The underlying issue has been verified as fixed by the Ticket Engine.</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Add Note Input */}
                <div style={{ padding: 24, borderTop: '1px solid #374151', background: '#111827' }}>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <input 
                      value={newNote}
                      onChange={e => setNewNote(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleAddNote()}
                      placeholder="Type a note or resolution summary..."
                      style={{ flex: 1, background: '#1e293b', border: '1px solid #475569', borderRadius: 6, padding: '12px 16px', color: '#fff', outline: 'none' }}
                    />
                    <button onClick={handleAddNote} style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '0 24px', borderRadius: 6, cursor: 'pointer', fontWeight: 500 }}>
                      Send
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280', flexDirection: 'column', gap: 16 }}>
                <Briefcase size={48} opacity={0.5} />
                <p>Select a ticket from the queue to view details.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
