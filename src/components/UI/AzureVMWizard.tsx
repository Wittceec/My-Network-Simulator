import { useState } from 'react';
import { useAzureStore } from '../../store/useAzureStore';
import type { AzureRegion } from '../../types/azure';

interface AzureVMWizardProps {
  onCancel: () => void;
  onComplete: () => void;
}

type WizardStep = 'basics' | 'networking' | 'review';

export default function AzureVMWizard({ onCancel, onComplete }: AzureVMWizardProps) {
  const [step, setStep] = useState<WizardStep>('basics');
  const { resourceGroups, vnets, createVM } = useAzureStore();
  
  const [formData, setFormData] = useState({
    resourceGroup: '',
    name: '',
    location: 'eastus' as AzureRegion,
    os: 'Linux',
    size: 'Standard_B1s',
    vnetId: '',
    subnetId: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCreate = () => {
    const id = `vm-${Date.now()}`;
    let privateIpAddress = '10.0.0.4';
    
    // Auto-assign IP based on subnet
    const vnet = vnets[formData.vnetId];
    if (vnet) {
      const sub = vnet.subnets.find(s => s.id === formData.subnetId);
      if (sub) {
        const parts = sub.addressPrefix.split('/')[0].split('.');
        privateIpAddress = `${parts[0]}.${parts[1]}.${parts[2]}.${Math.floor(Math.random() * 200 + 4)}`;
      }
    }

    createVM({
      id,
      name: formData.name,
      type: 'Microsoft.Compute/virtualMachines',
      location: formData.location,
      resourceGroup: formData.resourceGroup,
      size: formData.size,
      os: formData.os as 'Windows' | 'Linux',
      subnetId: formData.subnetId,
      privateIpAddress,
      status: 'Running'
    });
    onComplete();
  };

  const renderTabs = () => (
    <div className="azure-wizard-tabs">
      <button className={step === 'basics' ? 'active' : ''} onClick={() => setStep('basics')}>Basics</button>
      <button className={step === 'networking' ? 'active' : ''} onClick={() => setStep('networking')}>Networking</button>
      <button className={step === 'review' ? 'active' : ''} onClick={() => setStep('review')}>Review + create</button>
    </div>
  );

  return (
    <div className="azure-wizard">
      <div className="azure-wizard-header">
        <h2>Create a virtual machine</h2>
      </div>
      {renderTabs()}
      
      <div className="azure-wizard-body">
        {step === 'basics' && (
          <div className="azure-form">
            <h3>Project details</h3>
            <div className="form-group row">
              <label>Subscription</label>
              <select disabled><option>Free Trial</option></select>
            </div>
            <div className="form-group row">
              <label>Resource group *</label>
              <select name="resourceGroup" value={formData.resourceGroup} onChange={handleChange} required>
                <option value="">(New) resource group</option>
                {Object.keys(resourceGroups).map(rg => <option key={rg} value={rg}>{rg}</option>)}
              </select>
            </div>
            <hr />
            <h3>Instance details</h3>
            <div className="form-group row">
              <label>Virtual machine name *</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} required placeholder="e.g., myVM" />
            </div>
            <div className="form-group row">
              <label>Region *</label>
              <select name="location" value={formData.location} onChange={handleChange} required>
                <option value="eastus">East US</option>
                <option value="westus">West US</option>
                <option value="northeurope">North Europe</option>
              </select>
            </div>
            <div className="form-group row">
              <label>Image *</label>
              <select name="os" value={formData.os} onChange={handleChange} required>
                <option value="Linux">Ubuntu Server 22.04 LTS - Gen2</option>
                <option value="Windows">Windows Server 2022 Datacenter - Gen2</option>
              </select>
            </div>
            <div className="form-group row">
              <label>Size *</label>
              <select name="size" value={formData.size} onChange={handleChange} required>
                <option value="Standard_B1s">Standard_B1s - 1 vcpu, 1 GiB memory ($7.59/month)</option>
                <option value="Standard_D2s_v3">Standard_D2s_v3 - 2 vcpus, 8 GiB memory ($70.08/month)</option>
              </select>
            </div>
            <div className="azure-wizard-footer">
              <button className="azure-btn-primary" onClick={() => setStep('networking')}>Next : Networking &gt;</button>
            </div>
          </div>
        )}

        {step === 'networking' && (
          <div className="azure-form">
            <h3>Network interface</h3>
            <div className="form-group row">
              <label>Virtual network *</label>
              <select name="vnetId" value={formData.vnetId} onChange={handleChange} required>
                <option value="">Select a virtual network</option>
                {Object.values(vnets).map(vnet => <option key={vnet.id} value={vnet.id}>{vnet.name}</option>)}
              </select>
            </div>
            <div className="form-group row">
              <label>Subnet *</label>
              <select name="subnetId" value={formData.subnetId} onChange={handleChange} required disabled={!formData.vnetId}>
                <option value="">Select a subnet</option>
                {formData.vnetId && vnets[formData.vnetId]?.subnets.map(sub => (
                  <option key={sub.id} value={sub.id}>{sub.name} ({sub.addressPrefix})</option>
                ))}
              </select>
            </div>
            <div className="form-group row">
              <label>Public IP</label>
              <select disabled><option>(new) {formData.name}-ip</option></select>
            </div>
            <div className="form-group row">
              <label>NIC network security group</label>
              <select disabled><option>Basic</option></select>
            </div>
            <div className="azure-wizard-footer">
              <button className="azure-btn-default" onClick={() => setStep('basics')}>&lt; Previous</button>
              <button className="azure-btn-primary" onClick={() => setStep('review')}>Review + create</button>
            </div>
          </div>
        )}

        {step === 'review' && (
          <div className="azure-form">
            <div className="azure-alert success">Validation passed</div>
            <h3>Basics</h3>
            <div className="review-grid">
              <div className="k">Subscription</div><div className="v">Free Trial</div>
              <div className="k">Resource group</div><div className="v">{formData.resourceGroup || '<missing>'}</div>
              <div className="k">Virtual machine name</div><div className="v">{formData.name || '<missing>'}</div>
              <div className="k">Region</div><div className="v">{formData.location}</div>
              <div className="k">Image</div><div className="v">{formData.os}</div>
              <div className="k">Size</div><div className="v">{formData.size}</div>
            </div>
            <h3>Networking</h3>
            <div className="review-grid">
              <div className="k">Virtual network</div><div className="v">{vnets[formData.vnetId]?.name || '<missing>'}</div>
              <div className="k">Subnet</div><div className="v">{formData.subnetId || '<missing>'}</div>
            </div>
            <div className="azure-wizard-footer">
              <button className="azure-btn-default" onClick={() => setStep('networking')}>&lt; Previous</button>
              <button className="azure-btn-primary" onClick={handleCreate} disabled={!formData.name || !formData.resourceGroup || !formData.subnetId}>Create</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
