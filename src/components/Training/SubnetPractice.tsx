import React, { useState, useEffect } from 'react';
import { Calculator, CheckCircle, XCircle, RefreshCw } from 'lucide-react';

interface IP4Challenge {
  ip: string;
  cidr: number;
  answers: {
    network: string;
    broadcast: string;
    first: string;
    last: string;
    mask: string;
    hosts: string;
  };
}

interface IP6Challenge {
  ip: string;
  cidr: number;
  answers: {
    network: string;
  };
}

function intToIp(int: number): string {
  return [
    (int >>> 24) & 255,
    (int >>> 16) & 255,
    (int >>> 8) & 255,
    int & 255
  ].join('.');
}

function ipToInt(ip: string): number {
  return ip.split('.').reduce((int, octet) => (int << 8) + parseInt(octet, 10), 0) >>> 0;
}

function generateIPv4(): IP4Challenge {
  const first = Math.floor(Math.random() * 223) + 1;
  const ipStr = `${first === 127 ? 128 : first}.${Math.floor(Math.random()*256)}.${Math.floor(Math.random()*256)}.${Math.floor(Math.random()*256)}`;
  
  const cidr = Math.floor(Math.random() * (30 - 8 + 1)) + 8;
  
  const ip32 = ipToInt(ipStr);
  const mask32 = ~((1 << (32 - cidr)) - 1) >>> 0;
  const net32 = (ip32 & mask32) >>> 0;
  const bcast32 = (ip32 | ~mask32) >>> 0;
  
  return {
    ip: ipStr,
    cidr,
    answers: {
      network: intToIp(net32),
      broadcast: intToIp(bcast32),
      first: intToIp(net32 + 1),
      last: intToIp(bcast32 - 1),
      mask: intToIp(mask32),
      hosts: String(Math.pow(2, 32 - cidr) - 2)
    }
  };
}

function generateIPv6(): IP6Challenge {
  const blocks = Array.from({length: 8}, () => Math.floor(Math.random() * 65536).toString(16).padStart(4, '0'));
  
  const cidrs = [48, 56, 64];
  const cidr = cidrs[Math.floor(Math.random() * cidrs.length)];
  
  const ipStr = blocks.join(':');
  
  let netBlocks = [...blocks];
  if (cidr === 48) {
    netBlocks = [...blocks.slice(0,3), '0000', '0000', '0000', '0000', '0000'];
  } else if (cidr === 56) {
    const block4 = blocks[3];
    netBlocks = [...blocks.slice(0,3), block4.substring(0,2) + '00', '0000', '0000', '0000', '0000'];
  } else if (cidr === 64) {
    netBlocks = [...blocks.slice(0,4), '0000', '0000', '0000', '0000'];
  }

  const zeroesStartIndex = netBlocks.indexOf('0000');
  let networkAns = netBlocks.join(':');
  if (zeroesStartIndex !== -1 && zeroesStartIndex >= 3) {
    networkAns = netBlocks.slice(0, zeroesStartIndex).join(':') + '::';
  }

  const normalize = (ip: string) => ip.split(':').map(b => b === '' ? '' : parseInt(b, 16).toString(16)).join(':');

  return {
    ip: ipStr,
    cidr,
    answers: {
      network: normalize(networkAns)
    }
  };
}

export default function SubnetPractice() {
  const [mode, setMode] = useState<'IPv4' | 'IPv6'>('IPv4');
  
  const [v4Challenge, setV4Challenge] = useState<IP4Challenge | null>(null);
  const [v4Inputs, setV4Inputs] = useState<Record<string, string>>({
    network: '', broadcast: '', first: '', last: '', mask: '', hosts: ''
  });
  const [v4Results, setV4Results] = useState<Record<string, boolean | null>>({});

  const [v6Challenge, setV6Challenge] = useState<IP6Challenge | null>(null);
  const [v6Inputs, setV6Inputs] = useState<Record<string, string>>({ network: '' });
  const [v6Results, setV6Results] = useState<Record<string, boolean | null>>({});

  const [streak, setStreak] = useState(0);

  useEffect(() => {
    nextProblem();
  }, [mode]);

  const nextProblem = () => {
    if (mode === 'IPv4') {
      setV4Challenge(generateIPv4());
      setV4Inputs({ network: '', broadcast: '', first: '', last: '', mask: '', hosts: '' });
      setV4Results({});
    } else {
      setV6Challenge(generateIPv6());
      setV6Inputs({ network: '' });
      setV6Results({});
    }
  };

  const checkV4 = () => {
    if (!v4Challenge) return;
    let allCorrect = true;
    const res: Record<string, boolean> = {};
    Object.keys(v4Challenge.answers).forEach(key => {
      const isCorrect = v4Inputs[key].trim() === (v4Challenge.answers as any)[key];
      res[key] = isCorrect;
      if (!isCorrect) allCorrect = false;
    });
    setV4Results(res);
    
    if (allCorrect) setStreak(s => s + 1);
    else setStreak(0);
  };

  const checkV6 = () => {
    if (!v6Challenge) return;
    
    let userVal = v6Inputs.network.trim().toLowerCase();
    
    if (userVal.includes('::')) {
      const parts = userVal.split('::');
      const left = parts[0] ? parts[0].split(':') : [];
      const right = parts[1] ? parts[1].split(':') : [];
      const missing = 8 - (left.length + right.length);
      const zeroes = Array.from({length: Math.max(0, missing)}, () => '0');
      userVal = [...left, ...zeroes, ...right].join(':');
    }

    const expand = (ip: string) => {
       if (ip.includes('::')) {
          const parts = ip.split('::');
          const left = parts[0] ? parts[0].split(':') : [];
          const right = parts[1] ? parts[1].split(':') : [];
          const missing = 8 - (left.length + right.length);
          const zeroes = Array.from({length: Math.max(0, missing)}, () => '0');
          return [...left, ...zeroes, ...right].map(b => parseInt(b||'0', 16).toString(16).padStart(4, '0')).join(':');
       }
       return ip.split(':').map(b => parseInt(b||'0', 16).toString(16).padStart(4, '0')).join(':');
    };

    const isCorrect = expand(v6Inputs.network.trim().toLowerCase()) === expand(v6Challenge.answers.network);
    
    setV6Results({ network: isCorrect });
    if (isCorrect) setStreak(s => s + 1);
    else setStreak(0);
  };

  return (
    <div style={{ padding: 24, height: '100%', overflowY: 'auto', background: 'var(--bg, #111)', color: 'var(--text, #eee)' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Calculator size={32} color="#3b82f6" />
            <h1 style={{ margin: 0 }}>Subnetting Practice</h1>
          </div>
          <div style={{ background: '#252526', padding: '8px 16px', borderRadius: 8, border: '1px solid #333' }}>
            <span style={{ color: '#888', fontSize: 12 }}>STREAK</span>
            <div style={{ fontSize: 24, fontWeight: 'bold', color: streak > 0 ? '#10b981' : '#eee' }}>{streak} <span style={{fontSize: 16}}>🔥</span></div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 32, background: '#1e1e1e', padding: 4, borderRadius: 6, width: 'fit-content' }}>
          <button 
            onClick={() => setMode('IPv4')}
            style={{ 
              padding: '8px 24px', 
              background: mode === 'IPv4' ? '#3b82f6' : 'transparent', 
              color: '#fff', 
              border: 'none', 
              borderRadius: 4, 
              cursor: 'pointer',
              fontWeight: mode === 'IPv4' ? 'bold' : 'normal'
            }}
          >
            IPv4
          </button>
          <button 
            onClick={() => setMode('IPv6')}
            style={{ 
              padding: '8px 24px', 
              background: mode === 'IPv6' ? '#3b82f6' : 'transparent', 
              color: '#fff', 
              border: 'none', 
              borderRadius: 4, 
              cursor: 'pointer',
              fontWeight: mode === 'IPv6' ? 'bold' : 'normal'
            }}
          >
            IPv6
          </button>
        </div>

        <div style={{ background: '#1e1e1e', border: '1px solid #333', borderRadius: 8, padding: 32 }}>
          
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ fontSize: 14, color: '#888', marginBottom: 8 }}>Given the following IP and CIDR:</div>
            <div style={{ fontSize: 36, fontFamily: 'monospace', color: '#4ade80', letterSpacing: 1 }}>
              {mode === 'IPv4' ? `${v4Challenge?.ip} /${v4Challenge?.cidr}` : `${v6Challenge?.ip} /${v6Challenge?.cidr}`}
            </div>
          </div>

          {mode === 'IPv4' && v4Challenge && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              {[
                { key: 'network', label: 'Network Address' },
                { key: 'broadcast', label: 'Broadcast Address' },
                { key: 'first', label: 'First Usable IP' },
                { key: 'last', label: 'Last Usable IP' },
                { key: 'mask', label: 'Subnet Mask' },
                { key: 'hosts', label: 'Usable Hosts' }
              ].map(field => (
                <div key={field.key} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <label style={{ fontSize: 12, color: '#aaa', textTransform: 'uppercase', letterSpacing: 1 }}>{field.label}</label>
                  <div style={{ position: 'relative' }}>
                    <input 
                      type="text" 
                      value={v4Inputs[field.key]} 
                      onChange={e => setV4Inputs(prev => ({...prev, [field.key]: e.target.value}))}
                      style={{ 
                        width: '100%', 
                        padding: '12px 16px', 
                        background: '#111', 
                        border: `1px solid ${v4Results[field.key] === true ? '#10b981' : v4Results[field.key] === false ? '#ef4444' : '#333'}`, 
                        borderRadius: 6, 
                        color: '#fff',
                        fontFamily: 'monospace',
                        fontSize: 16
                      }}
                      placeholder={field.key === 'hosts' ? 'e.g. 62' : 'e.g. 192.168.1.0'}
                    />
                    {v4Results[field.key] === true && <CheckCircle size={20} color="#10b981" style={{ position: 'absolute', right: 12, top: 14 }} />}
                    {v4Results[field.key] === false && <XCircle size={20} color="#ef4444" style={{ position: 'absolute', right: 12, top: 14 }} />}
                  </div>
                  {v4Results[field.key] === false && (
                    <div style={{ fontSize: 12, color: '#ef4444', marginTop: 4 }}>
                      Correct: {(v4Challenge.answers as any)[field.key]}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {mode === 'IPv6' && v6Challenge && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={{ fontSize: 12, color: '#aaa', textTransform: 'uppercase', letterSpacing: 1 }}>Network Address (Abbreviated or Expanded)</label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type="text" 
                    value={v6Inputs.network} 
                    onChange={e => setV6Inputs({ network: e.target.value })}
                    style={{ 
                      width: '100%', 
                      padding: '12px 16px', 
                      background: '#111', 
                      border: `1px solid ${v6Results.network === true ? '#10b981' : v6Results.network === false ? '#ef4444' : '#333'}`, 
                      borderRadius: 6, 
                      color: '#fff',
                      fontFamily: 'monospace',
                      fontSize: 16
                    }}
                    placeholder="e.g. 2001:db8:abcd::"
                  />
                  {v6Results.network === true && <CheckCircle size={20} color="#10b981" style={{ position: 'absolute', right: 12, top: 14 }} />}
                  {v6Results.network === false && <XCircle size={20} color="#ef4444" style={{ position: 'absolute', right: 12, top: 14 }} />}
                </div>
                {v6Results.network === false && (
                  <div style={{ fontSize: 12, color: '#ef4444', marginTop: 4 }}>
                    Correct example: {v6Challenge.answers.network}
                  </div>
                )}
              </div>
              <div style={{ fontSize: 13, color: '#888', fontStyle: 'italic' }}>
                Note: In IPv6, subnets are typically routed on /48, /56, or /64 boundaries. Calculate the network prefix for the given CIDR.
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 40, paddingTop: 32, borderTop: '1px solid #333' }}>
            <button 
              onClick={mode === 'IPv4' ? checkV4 : checkV6} 
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 24px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 'bold' }}
            >
              <CheckCircle size={18} /> Check Answers
            </button>
            <button 
              onClick={nextProblem} 
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 24px', background: '#333', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}
            >
              <RefreshCw size={18} /> Next Problem
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
