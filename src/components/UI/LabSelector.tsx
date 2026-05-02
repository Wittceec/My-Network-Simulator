import { useNetworkStore } from '../../store/useNetworkStore';
import { PREMADE_LABS, type PremadeLab } from '../../data/premadeLabs';
import { runOSPF } from '../../core/logic/ospf';
import { X, Play, BookOpen, Layers } from 'lucide-react';

interface LabSelectorProps {
  onClose: () => void;
}

export default function LabSelector({ onClose }: LabSelectorProps) {
  const loadLab = useNetworkStore((state) => state.loadLab);

  const handleLoad = (lab: PremadeLab) => {
    // deep clone to avoid referencing the static data directly
    const devices = JSON.parse(JSON.stringify(lab.devices));
    const links = JSON.parse(JSON.stringify(lab.links));
    loadLab(devices, links);
    setTimeout(() => runOSPF(), 100);
    onClose();
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
              <BookOpen size={24} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700 }}>Lab Library</h2>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>Select a scenario to practice</p>
            </div>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={20} /></button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
          {PREMADE_LABS.map((lab) => {
            const isBeginner = lab.difficulty === 'Beginner';
            return (
              <div 
                key={lab.id} 
                style={{
                  background: 'var(--bg-deeper)', border: '1px solid var(--border)', borderRadius: '12px',
                  padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px',
                  transition: 'transform 0.2s, border-color 0.2s', cursor: 'pointer'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                onClick={() => handleLoad(lab)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>{lab.name}</h3>
                  <span style={{
                    fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px',
                    background: isBeginner ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                    color: isBeginner ? '#10b981' : '#ef4444', padding: '4px 8px', borderRadius: '6px'
                  }}>
                    {lab.difficulty}
                  </span>
                </div>
                
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5, flex: 1 }}>
                  {lab.description}
                </p>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px', paddingTop: '12px', borderTop: '1px solid var(--border-accent)' }}>
                  <div style={{ display: 'flex', gap: '12px', fontSize: '11px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Layers size={14} /> {Object.keys(lab.devices).length} Devices</span>
                  </div>
                  <button className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={(e) => { e.stopPropagation(); handleLoad(lab); }}>
                    <Play size={14} /> Launch
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
