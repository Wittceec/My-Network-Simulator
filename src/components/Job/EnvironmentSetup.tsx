import React, { useState } from 'react';
import { X, Server, Building, Globe } from 'lucide-react';
import { generateWorld } from '../../core/simulators/WorldGenerator';
import { useJobStore } from '../../store/useJobStore';

export default function EnvironmentSetup({ onClose }: { onClose: () => void }) {
  const [loading, setLoading] = useState(false);
  const [complete, setComplete] = useState(false);

  const handleGenerate = (size: 'Small' | 'Medium' | 'Large') => {
    setLoading(true);
    // Simulate generation time to make it feel impactful
    setTimeout(() => {
      generateWorld(size === 'Large' ? 'enterprise' : size.toLowerCase() as 'small' | 'medium');
      
      // Stop the ticket engine briefly so we start fresh, but only if they were clocked in
      const jobStore = useJobStore.getState();
      if (jobStore.isClockedIn) {
        // We will just let the engine generate new tickets on the new state
      }

      setLoading(false);
      setComplete(true);
      setTimeout(() => onClose(), 1500);
    }, 1500);
  };

  return (
    <div className="modal-backdrop" onClick={onClose} style={{
      position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
      zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{
        background: '#ece9d8', color: '#000',
        width: 500, display: 'flex', flexDirection: 'column',
        boxShadow: '2px 2px 10px rgba(0,0,0,0.5)', border: '1px solid #0054e3',
        fontFamily: '"Tahoma", "Segoe UI", sans-serif'
      }}>
        <div style={{ 
          background: 'linear-gradient(to right, #0058e6, #3a93ff)', color: 'white', padding: '4px 8px', 
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, fontWeight: 'bold'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Server size={14} color="#fff" /> Initialize Environment
          </div>
          <button style={{ background: '#e81123', color: '#fff', border: 'none', width: 24, height: 20, cursor: 'pointer' }} onClick={onClose}>
            <X size={14} />
          </button>
        </div>

        <div style={{ padding: 24, background: '#fff', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <p style={{ margin: 0, fontSize: 13 }}>
            Warning: This will <strong>destroy your current environment</strong> and replace it with a randomly generated company with populated servers, users, groups, domains, and policies.
          </p>

          {loading ? (
            <div style={{ textAlign: 'center', padding: 32 }}>
              <div style={{ fontSize: 16, fontWeight: 'bold', color: '#0054e3' }}>Generating Environment...</div>
              <div style={{ fontSize: 12, color: '#666', marginTop: 8 }}>Provisioning Domain Controllers, spinning up VMs, creating users...</div>
            </div>
          ) : complete ? (
            <div style={{ textAlign: 'center', padding: 32 }}>
              <div style={{ fontSize: 16, fontWeight: 'bold', color: '#10b981' }}>Environment Generated Successfully!</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <button 
                onClick={() => handleGenerate('Small')}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, border: '1px solid #ccc', background: '#f5f5f5', cursor: 'pointer', textAlign: 'left' }}
              >
                <Building size={24} color="#3b82f6" />
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: 14 }}>Small Business</div>
                  <div style={{ fontSize: 11, color: '#666' }}>~20 Users, 1 Domain, 2 Servers, basic Group Policies.</div>
                </div>
              </button>

              <button 
                onClick={() => handleGenerate('Medium')}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, border: '1px solid #ccc', background: '#f5f5f5', cursor: 'pointer', textAlign: 'left' }}
              >
                <Building size={24} color="#f59e0b" />
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: 14 }}>Medium Enterprise</div>
                  <div style={{ fontSize: 11, color: '#666' }}>~150 Users, multiple Departments, 10 Servers, complex permissions.</div>
                </div>
              </button>

              <button 
                onClick={() => handleGenerate('Large')}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, border: '1px solid #ccc', background: '#f5f5f5', cursor: 'pointer', textAlign: 'left' }}
              >
                <Globe size={24} color="#10b981" />
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: 14 }}>Large Corporation</div>
                  <div style={{ fontSize: 11, color: '#666' }}>~500 Users, deep OU structures, 25 Servers, enforced GPOs, strict Quotas.</div>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
