import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface GpoSetting {
  id: string;
  category: 'Computer' | 'User';
  path: string;
  name: string;
  state: 'Enabled' | 'Disabled' | 'Not Configured';
}

export interface GPO {
  id: string;
  name: string;
  status: 'Enabled' | 'AllSettingsDisabled' | 'ComputerConfigurationDisabled' | 'UserConfigurationDisabled';
  links: string[]; // OUs this is linked to
  enforcedLinks?: string[]; // OUs where this link is enforced
  securityFiltering?: string[]; // Group IDs this applies to
  settings: Record<string, GpoSetting>;
}

interface GpoState {
  gpos: Record<string, GPO>;
  createGpo: (gpo: GPO) => void;
  deleteGpo: (id: string) => void;
  updateSetting: (gpoId: string, settingId: string, state: GpoSetting['state']) => void;
  seedDefaultGpos: () => void;
}

export const useGpoStore = create<GpoState>()(
  persist(
    (set, get) => ({

  gpos: {},

  createGpo: (gpo) => set((state) => ({ gpos: { ...state.gpos, [gpo.id]: gpo } })),
  deleteGpo: (id) => set((state) => {
    const newGpos = { ...state.gpos };
    delete newGpos[id];
    return { gpos: newGpos };
  }),

  updateSetting: (gpoId, settingId, settingState) => set((state) => {
    const gpo = state.gpos[gpoId];
    if (!gpo) return state;
    const setting = gpo.settings[settingId];
    if (!setting) return state;
    return {
      gpos: {
        ...state.gpos,
        [gpoId]: {
          ...gpo,
          settings: {
            ...gpo.settings,
            [settingId]: { ...setting, state: settingState }
          }
        }
      }
    };
  }),

  seedDefaultGpos: () => {
    const state = get();
    if (Object.keys(state.gpos).length > 0) return;

    set({
      gpos: {
        'gpo-default-domain': {
          id: 'gpo-default-domain',
          name: 'Default Domain Policy',
          status: 'Enabled',
          links: ['corp.local'],
          enforcedLinks: [],
          securityFiltering: ['Authenticated Users'],
          settings: {
            'set-pwd-len': { id: 'set-pwd-len', category: 'Computer', path: 'Windows Settings/Security Settings/Account Policies/Password Policy', name: 'Minimum password length', state: 'Enabled' },
            'set-pwd-age': { id: 'set-pwd-age', category: 'Computer', path: 'Windows Settings/Security Settings/Account Policies/Password Policy', name: 'Maximum password age', state: 'Enabled' },
          }
        },
        'gpo-usb-block': {
          id: 'gpo-usb-block',
          name: 'Block USB Removable Storage',
          status: 'Enabled',
          links: ['corp.local/Workstations'],
          enforcedLinks: ['corp.local/Workstations'],
          securityFiltering: ['Authenticated Users'],
          settings: {
            'set-usb-deny': { id: 'set-usb-deny', category: 'Computer', path: 'Administrative Templates/System/Removable Storage Access', name: 'All Removable Storage classes: Deny all access', state: 'Enabled' }
          }
        }
      }
    });
  }

    }),
    {
      name: 'network-sim-usegpostore-storage',
    }
  )
);
