import { useState } from 'react';
import { Server, Activity, Network as NetworkIcon, Shield, Key } from 'lucide-react';
import type { VM } from '../../types/azure';
import { useAzureStore } from '../../store/useAzureStore';

interface AzureVMDetailsProps {
  vm: VM;
  onClose: () => void;
}

type Tab = 'overview' | 'networking' | 'connect';

export default function AzureVMDetails({ vm, onClose }: AzureVMDetailsProps) {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const vnets = useAzureStore(s => s.vnets);
  
  // Find which VNet and Subnet this VM belongs to
  let vnetName = 'Unknown';
  let subnetName = 'Unknown';
  for (const vnet of Object.values(vnets)) {
    const sub = vnet.subnets.find(s => s.id === vm.subnetId);
    if (sub) {
      vnetName = vnet.name;
      subnetName = sub.name;
    }
  }

  return (
    <div className="azure-details-blade">
      <div className="blade-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Server size={24} color="#0078D4" />
          <div>
            <h2 style={{ margin: 0 }}>{vm.name}</h2>
            <small style={{ color: '#605E5C' }}>Virtual machine</small>
          </div>
        </div>
        <button className="azure-btn-default" onClick={onClose}>Close</button>
      </div>

      <div className="blade-nav">
        <button className={activeTab === 'overview' ? 'active' : ''} onClick={() => setActiveTab('overview')}><Activity size={14}/> Overview</button>
        <button className={activeTab === 'networking' ? 'active' : ''} onClick={() => setActiveTab('networking')}><NetworkIcon size={14}/> Networking</button>
        <button className={activeTab === 'connect' ? 'active' : ''} onClick={() => setActiveTab('connect')}><Key size={14}/> Connect</button>
      </div>

      <div className="blade-content">
        {activeTab === 'overview' && (
          <div>
            <h3>Essentials</h3>
            <div className="essentials-grid">
              <div className="kv"><span className="k">Resource group</span><span className="v">{vm.resourceGroup}</span></div>
              <div className="kv"><span className="k">Status</span><span className="v">{vm.status}</span></div>
              <div className="kv"><span className="k">Location</span><span className="v">{vm.location}</span></div>
              <div className="kv"><span className="k">Subscription</span><span className="v">Free Trial</span></div>
              <div className="kv"><span className="k">Operating system</span><span className="v">{vm.os}</span></div>
              <div className="kv"><span className="k">Size</span><span className="v">{vm.size}</span></div>
              <div className="kv"><span className="k">Virtual network/subnet</span><span className="v">{vnetName}/{subnetName}</span></div>
            </div>
          </div>
        )}

        {activeTab === 'networking' && (
          <div>
            <h3>Networking Configuration</h3>
            <div className="azure-card" style={{ alignItems: 'flex-start' }}>
              <p><strong>Network Interface:</strong> {vm.name}-nic</p>
              <p><strong>Virtual Network:</strong> {vnetName}</p>
              <p><strong>Subnet:</strong> {subnetName}</p>
              
              <h4 style={{ marginTop: 20 }}>Inbound port rules</h4>
              <table className="azure-table">
                <thead>
                  <tr><th>Priority</th><th>Name</th><th>Port</th><th>Protocol</th><th>Action</th></tr>
                </thead>
                <tbody>
                  <tr><td>1000</td><td>default-allow-ssh</td><td>22</td><td>TCP</td><td style={{color:'green'}}>Allow</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'connect' && (
          <div>
            <h3>Connect to virtual machine</h3>
            <p>Connect to your VM using SSH or RDP.</p>
            <div className="azure-card" style={{ alignItems: 'flex-start' }}>
              <h4 style={{ margin: '0 0 10px 0' }}>Native SSH</h4>
              <p style={{ margin: 0, fontFamily: 'monospace', background: '#F3F2F1', padding: 8, borderRadius: 4, width: '100%' }}>
                ssh azureuser@{vm.name}.{vm.location}.cloudapp.azure.com
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
