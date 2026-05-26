import { useCliLabStore } from '../../store/useCliLabStore';
import { X, Play, Terminal, CheckCircle } from 'lucide-react';

interface CliLabSelectorProps {
  onClose: () => void;
  onOpenShell: () => void;
}

export default function CliLabSelector({ onClose, onOpenShell }: CliLabSelectorProps) {
  const { quests, startQuest, completedQuests } = useCliLabStore();

  const handleStart = (questId: string) => {
    startQuest(questId);
    onClose();
    onOpenShell();
  };

  return (
    <>
      <div className="scrim" onClick={onClose} style={{ zIndex: 10000 }} />
      <div 
        className="glass-card"
        style={{
          position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          width: '90%', maxWidth: '800px', maxHeight: '80vh', overflowY: 'auto',
          zIndex: 10001, padding: '24px', borderRadius: '16px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.1) inset'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ background: 'var(--accent-glow)', padding: '10px', borderRadius: '12px', color: 'var(--accent-light)' }}>
              <Terminal size={24} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700 }}>CLI Learning Labs</h2>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>Master Bash, PowerShell, Azure CLI, and IaC</p>
            </div>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={20} /></button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
          {Object.values(quests).map((quest) => {
            const isCompleted = completedQuests.includes(quest.id);
            return (
              <div 
                key={quest.id} 
                style={{
                  background: 'var(--bg-deeper)', border: '1px solid var(--border)', borderRadius: '12px',
                  padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px',
                  transition: 'transform 0.2s, border-color 0.2s', cursor: 'pointer',
                  position: 'relative'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                onClick={() => handleStart(quest.id)}
              >
                {isCompleted && (
                  <div style={{ position: 'absolute', top: 10, right: 10, color: '#107c10' }}>
                    <CheckCircle size={20} />
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>{quest.title}</h3>
                </div>
                
                <div style={{ display: 'flex', gap: 8 }}>
                  <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', background: '#333', color: '#fff', padding: '2px 6px', borderRadius: '4px' }}>{quest.category}</span>
                  <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', background: quest.difficulty === 'Beginner' ? '#107c1022' : '#ffaa4422', color: quest.difficulty === 'Beginner' ? '#107c10' : '#ffaa44', padding: '2px 6px', borderRadius: '4px' }}>{quest.difficulty}</span>
                </div>

                <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5, flex: 1 }}>
                  {quest.description}
                </p>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px', paddingTop: '12px', borderTop: '1px solid var(--border-accent)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                    {quest.steps.length} Steps
                  </div>
                  <button className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={(e) => { e.stopPropagation(); handleStart(quest.id); }}>
                    <Play size={14} /> Start Mission
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
