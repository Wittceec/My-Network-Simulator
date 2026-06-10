import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type DnsRecordType = 'A' | 'AAAA' | 'CNAME' | 'MX' | 'TXT' | 'SRV' | 'NS' | 'SOA' | 'PTR';

export interface DnsRecord {
  id: string;
  name: string; // The hostname (e.g., 'www' or '@' for root)
  type: DnsRecordType;
  data: string; // IP address, target hostname, etc.
  ttl: number; // Time to live in seconds
}

export interface DnsZone {
  id: string;
  name: string; // The zone name (e.g., 'corp.local')
  type: 'Forward' | 'Reverse';
  records: Record<string, DnsRecord>;
}

interface DnsState {
  zones: Record<string, DnsZone>;
  createZone: (zone: DnsZone) => void;
  deleteZone: (id: string) => void;
  addRecord: (zoneId: string, record: DnsRecord) => void;
  updateRecord: (zoneId: string, recordId: string, data: Partial<DnsRecord>) => void;
  deleteRecord: (zoneId: string, recordId: string) => void;
  seedDefaultDns: () => void;
}

export const useDnsStore = create<DnsState>()(
  persist(
    (set, get) => ({

  zones: {},
  
  createZone: (zone) => set((state) => ({ zones: { ...state.zones, [zone.id]: zone } })),
  deleteZone: (id) => set((state) => {
    const newZones = { ...state.zones };
    delete newZones[id];
    return { zones: newZones };
  }),
  
  addRecord: (zoneId, record) => set((state) => {
    const zone = state.zones[zoneId];
    if (!zone) return state;
    return {
      zones: {
        ...state.zones,
        [zoneId]: { ...zone, records: { ...zone.records, [record.id]: record } }
      }
    };
  }),

  updateRecord: (zoneId, recordId, data) => set((state) => {
    const zone = state.zones[zoneId];
    if (!zone) return state;
    const record = zone.records[recordId];
    if (!record) return state;
    return {
      zones: {
        ...state.zones,
        [zoneId]: { ...zone, records: { ...zone.records, [recordId]: { ...record, ...data } } }
      }
    };
  }),

  deleteRecord: (zoneId, recordId) => set((state) => {
    const zone = state.zones[zoneId];
    if (!zone) return state;
    const newRecords = { ...zone.records };
    delete newRecords[recordId];
    return {
      zones: {
        ...state.zones,
        [zoneId]: { ...zone, records: newRecords }
      }
    };
  }),

  seedDefaultDns: () => {
    const state = get();
    if (Object.keys(state.zones).length > 0) return;

    set({
      zones: {
        'zone-corp': {
          id: 'zone-corp',
          name: 'corp.local',
          type: 'Forward',
          records: {
            'rec-soa': { id: 'rec-soa', name: '@', type: 'SOA', data: 'dc01.corp.local.', ttl: 3600 },
            'rec-ns1': { id: 'rec-ns1', name: '@', type: 'NS', data: 'dc01.corp.local.', ttl: 3600 },
            'rec-ns2': { id: 'rec-ns2', name: '@', type: 'NS', data: 'dc02.corp.local.', ttl: 3600 },
            'rec-dc01': { id: 'rec-dc01', name: 'dc01', type: 'A', data: '10.0.0.10', ttl: 3600 },
            'rec-dc02': { id: 'rec-dc02', name: 'dc02', type: 'A', data: '10.0.0.11', ttl: 3600 },
            'rec-intranet': { id: 'rec-intranet', name: 'intranet', type: 'A', data: '10.0.0.50', ttl: 3600 },
            'rec-mail': { id: 'rec-mail', name: 'mail', type: 'A', data: '10.0.0.60', ttl: 3600 },
            'rec-mx': { id: 'rec-mx', name: '@', type: 'MX', data: '10 mail.corp.local.', ttl: 3600 },
            'rec-www': { id: 'rec-www', name: 'www', type: 'CNAME', data: 'intranet.corp.local.', ttl: 3600 },
          }
        },
        'zone-rev': {
          id: 'zone-rev',
          name: '0.0.10.in-addr.arpa',
          type: 'Reverse',
          records: {
            'rec-soa-rev': { id: 'rec-soa-rev', name: '@', type: 'SOA', data: 'dc01.corp.local.', ttl: 3600 },
            'rec-ns-rev': { id: 'rec-ns-rev', name: '@', type: 'NS', data: 'dc01.corp.local.', ttl: 3600 },
            'rec-ptr10': { id: 'rec-ptr10', name: '10', type: 'PTR', data: 'dc01.corp.local.', ttl: 3600 },
          }
        }
      }
    });
  }

    }),
    {
      name: 'network-sim-usednsstore-storage',
    }
  )
);
