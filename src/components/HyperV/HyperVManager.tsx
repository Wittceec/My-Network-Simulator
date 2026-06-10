import React, { useState, useEffect } from 'react';
import { useServerStore } from '../../store/useServerStore';
import { Server, Monitor, X, Play, Square, Pause, RotateCcw, Camera, Network } from 'lucide-react';

export default function HyperVManager({ onClose }: { onClose: () => void }) {
  const serverStore = useServerStore();
  const [selectedVmId, setSelectedVmId] = useState<string | null>(null);

  useEffect(() => {
    serverStore.seedDefaultServers();
  }, []);

  const vms = Object.values(serverStore.vms);
  const selectedVm = selectedVmId ? serverStore.vms[selectedVmId] : null;

  const handleStateChange = (state: 'Running' | 'Off' | 'Paused') => {
    if (selectedVm) {
      serverStore.updateVMState(selectedVm.id, state);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose} style={{
      position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
      zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{
        background: '#ece9d8', color: '#000',
        width: 800, maxWidth: '95vw', height: 550, maxHeight: '95vh',
        display: 'flex', flexDirection: 'column',
        boxShadow: '2px 2px 10px rgba(0,0,0,0.5)', border: '1px solid #0054e3',
        fontFamily: '"Tahoma", "Segoe UI", sans-serif'
      }}>
        <div style={{ 
          background: 'linear-gradient(to right, #0058e6, #3a93ff)', color: 'white', padding: '4px 8px', 
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #0054e3', fontSize: 13, fontWeight: 'bold'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Server size={14} color="#fff" /> Hyper-V Manager
          </div>
          <button style={{ background: '#e81123', color: '#fff', border: 'none', width: 24, height: 20, cursor: 'pointer' }} onClick={onClose}>
            <X size={14} />
          </button>
        </div>

        {/* Toolbar */}
        <div style={{ background: '#f5f5f5', borderBottom: '1px solid #ccc', padding: '4px 8px', display: 'flex', gap: 16, fontSize: 12 }}>
          <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>File</div>
          <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>Action</div>
          <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>View</div>
          <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>Help</div>
        </div>

        <div style={{ display: 'flex', flex: 1, overflow: 'hidden', background: '#fff', margin: 2, border: '1px solid #7f9db9' }}>
          
          {/* LEFT TREE */}
          <div style={{ width: 200, borderRight: '1px solid #ccc', overflowY: 'auto', padding: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', padding: 2, background: '#316ac5', color: '#fff' }}>
              <Server size={14} color="#fff" /> HYPERV-HOST
            </div>
          </div>

          {/* MIDDLE VIEW */}
          <div style={{ flex: 1, overflowY: 'auto', borderRight: '1px solid #ccc', display: 'flex', flexDirection: 'column' }}>
            <div style={{ flex: 1, borderBottom: '1px solid #ccc', display: 'flex', flexDirection: 'column' }}>
              <div style={{ background: '#ece9d8', padding: '4px 8px', borderBottom: '1px solid #ccc', fontWeight: 'bold', fontSize: 12 }}>
                Virtual Machines
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead style={{ background: '#f5f5f5', borderBottom: '1px solid #ccc', textAlign: 'left' }}>
                  <tr>
                    <th style={{ padding: '2px 6px', fontWeight: 'normal', borderRight: '1px solid #ccc' }}>Name</th>
                    <th style={{ padding: '2px 6px', fontWeight: 'normal', borderRight: '1px solid #ccc' }}>State</th>
                    <th style={{ padding: '2px 6px', fontWeight: 'normal', borderRight: '1px solid #ccc' }}>CPU Usage</th>
                    <th style={{ padding: '2px 6px', fontWeight: 'normal' }}>Assigned Memory</th>
                  </tr>
                </thead>
                <tbody>
                  {vms.map(vm => (
                    <tr 
                      key={vm.id} 
                      style={{ background: selectedVmId === vm.id ? '#316ac5' : 'transparent', color: selectedVmId === vm.id ? '#fff' : '#000', cursor: 'pointer' }}
                      onClick={() => setSelectedVmId(vm.id)}
                    >
                      <td style={{ padding: '2px 6px', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Monitor size={14} color={selectedVmId === vm.id ? '#fff' : '#000'} /> {vm.name}
                      </td>
                      <td style={{ padding: '2px 6px' }}>{vm.state}</td>
                      <td style={{ padding: '2px 6px' }}>{vm.state === 'Running' ? `${vm.cpuUsage}%` : ''}</td>
                      <td style={{ padding: '2px 6px' }}>{vm.state === 'Running' ? `${vm.memoryAssigned} MB` : ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* CHECKPOINTS VIEW */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ background: '#ece9d8', padding: '4px 8px', borderBottom: '1px solid #ccc', fontWeight: 'bold', fontSize: 12 }}>
                Checkpoints
              </div>
              <div style={{ padding: 8, fontSize: 12 }}>
                {!selectedVm ? (
                  <div style={{ color: '#666' }}>Select a virtual machine to view checkpoints.</div>
                ) : (
                  <div>
                    {(selectedVm.checkpoints || []).length === 0 ? (
                      <div style={{ color: '#666' }}>No checkpoints exist for this virtual machine.</div>
                    ) : (
                      <ul style={{ paddingLeft: 20, margin: 0 }}>
                        {selectedVm.checkpoints?.map((cp, idx) => (
                          <li key={idx} style={{ marginBottom: 4 }}>
                            <Camera size={12} style={{ marginRight: 6, display: 'inline-block', verticalAlign: 'middle' }} />
                            {cp}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT ACTIONS PANE */}
          <div style={{ width: 200, background: '#fcfcfc', overflowY: 'auto' }}>
            <div style={{ background: '#ece9d8', padding: '4px 8px', borderBottom: '1px solid #ccc', fontWeight: 'bold', fontSize: 12 }}>
              Actions
            </div>
            {selectedVm && (
              <div style={{ padding: 8, fontSize: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ fontWeight: 'bold', color: '#003399', borderBottom: '1px solid #ccc', paddingBottom: 4, marginBottom: 4 }}>
                  {selectedVm.name}
                </div>
                
                {selectedVm.state === 'Off' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', color: '#000' }} onClick={() => handleStateChange('Running')}>
                    <Play size={14} color="#10b981" /> Start
                  </div>
                )}
                {selectedVm.state === 'Running' && (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', color: '#000' }} onClick={() => handleStateChange('Off')}>
                      <Square size={14} color="#ef4444" /> Turn Off
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', color: '#000' }} onClick={() => handleStateChange('Off')}>
                      <Square size={14} color="#f59e0b" /> Shut Down
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', color: '#000' }} onClick={() => handleStateChange('Paused')}>
                      <Pause size={14} color="#3b82f6" /> Pause
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', color: '#000' }} onClick={() => { handleStateChange('Off'); setTimeout(() => handleStateChange('Running'), 1000) }}>
                      <RotateCcw size={14} color="#8b5cf6" /> Reset
                    </div>
                  </>
                )}
                {selectedVm.state === 'Paused' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', color: '#000' }} onClick={() => handleStateChange('Running')}>
                    <Play size={14} color="#10b981" /> Resume
                  </div>
                )}
                <div style={{ borderTop: '1px solid #ccc', margin: '4px 0' }}></div>
                <div 
                  style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', color: '#000' }} 
                  onClick={() => {
                    const name = prompt('Enter checkpoint name:');
                    if (name && selectedVmId) {
                      serverStore.updateVM(selectedVmId, {
                        checkpoints: [...(selectedVm.checkpoints || []), name]
                      });
                    }
                  }}
                >
                  <Camera size={14} color="#3b82f6" /> Checkpoint
                </div>
                {selectedVm.virtualSwitch && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', color: '#000' }}>
                    <Network size={14} color="#f59e0b" /> {selectedVm.virtualSwitch}
                  </div>
                )}
              </div>
            )}
            {!selectedVm && (
               <div style={{ padding: 8, fontSize: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                 <div style={{ fontWeight: 'bold', color: '#003399', borderBottom: '1px solid #ccc', paddingBottom: 4, marginBottom: 4 }}>
                   HYPERV-HOST
                 </div>
                 <div 
                   style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', color: '#000' }} 
                   onClick={() => alert('Virtual Switch Manager modal would open here.')}
                 >
                   <Network size={14} color="#f59e0b" /> Virtual Switch Manager...
                 </div>
               </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
