import type { Device, Link } from '../types/device';

export interface PremadeLab {
  id: string;
  name: string;
  description: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  devices: Record<string, Device>;
  links: Record<string, Link>;
  azureState?: any; // To preload Azure resources
}

export const PREMADE_LABS: PremadeLab[] = [
  { id: 'empty', shortName: 'empty', mode: 'routed', accessVlan: 1, macAddress: '0000.0000.0000',
    name: 'Empty Lab',
    description: 'A completely blank canvas. Drag and drop devices from the sidebar to build your own network.',
    difficulty: 'Beginner',
    devices: {},
    links: {},
  },
  { id: 'ospf-basic', shortName: 'ospf-basic', mode: 'routed', accessVlan: 1, macAddress: '0000.0000.0000',
    name: 'Basic OSPF Setup',
    description: 'Three routers are connected in a triangle. Configure OSPF Area 0 on all interfaces to establish full routing.',
    difficulty: 'Intermediate',
    devices: {
      'R1': { id: 'R1', shortName: 'R1', mode: 'routed', accessVlan: 1, macAddress: '0000.0000.0000', hostname: 'R1', type: 'router',
        interfaces: {
          'fastethernet0/0': { id: 'fastethernet0/0', shortName: 'fa0/0', mode: 'routed', accessVlan: 1, macAddress: '0000.0000.0000', isUp: true, ipv4: { ip: '10.0.12.1', mask: '255.255.255.0' } },
          'fastethernet0/1': { id: 'fastethernet0/1', shortName: 'fa0/1', mode: 'routed', accessVlan: 1, macAddress: '0000.0000.0000', isUp: true, ipv4: { ip: '10.0.13.1', mask: '255.255.255.0' } },
        },
        routingTable: [], macAddressTable: {}, arpTable: {}, vlans: {}, acls: {}
      },
      'R2': { id: 'R2', shortName: 'R2', mode: 'routed', accessVlan: 1, macAddress: '0000.0000.0000', hostname: 'R2', type: 'router',
        interfaces: {
          'fastethernet0/0': { id: 'fastethernet0/0', shortName: 'fa0/0', mode: 'routed', accessVlan: 1, macAddress: '0000.0000.0000', isUp: true, ipv4: { ip: '10.0.12.2', mask: '255.255.255.0' } },
          'fastethernet0/1': { id: 'fastethernet0/1', shortName: 'fa0/1', mode: 'routed', accessVlan: 1, macAddress: '0000.0000.0000', isUp: true, ipv4: { ip: '10.0.23.2', mask: '255.255.255.0' } },
        },
        routingTable: [], macAddressTable: {}, arpTable: {}, vlans: {}, acls: {}
      },
      'R3': { id: 'R3', shortName: 'R3', mode: 'routed', accessVlan: 1, macAddress: '0000.0000.0000', hostname: 'R3', type: 'router',
        interfaces: {
          'fastethernet0/0': { id: 'fastethernet0/0', shortName: 'fa0/0', mode: 'routed', accessVlan: 1, macAddress: '0000.0000.0000', isUp: true, ipv4: { ip: '10.0.13.3', mask: '255.255.255.0' } },
          'fastethernet0/1': { id: 'fastethernet0/1', shortName: 'fa0/1', mode: 'routed', accessVlan: 1, macAddress: '0000.0000.0000', isUp: true, ipv4: { ip: '10.0.23.3', mask: '255.255.255.0' } },
        },
        routingTable: [], macAddressTable: {}, arpTable: {}, vlans: {}, acls: {}
      }
    },
    links: {
      'link-R1-R2': { id: 'link-R1-R2', shortName: 'link-R1-R2', mode: 'routed', accessVlan: 1, macAddress: '0000.0000.0000', sourceDeviceId: 'R1', targetDeviceId: 'R2', sourceInterfaceId: 'fastethernet0/0', targetInterfaceId: 'fastethernet0/0' },
      'link-R2-R3': { id: 'link-R2-R3', shortName: 'link-R2-R3', mode: 'routed', accessVlan: 1, macAddress: '0000.0000.0000', sourceDeviceId: 'R2', targetDeviceId: 'R3', sourceInterfaceId: 'fastethernet0/1', targetInterfaceId: 'fastethernet0/1' },
      'link-R3-R1': { id: 'link-R3-R1', shortName: 'link-R3-R1', mode: 'routed', accessVlan: 1, macAddress: '0000.0000.0000', sourceDeviceId: 'R3', targetDeviceId: 'R1', sourceInterfaceId: 'fastethernet0/0', targetInterfaceId: 'fastethernet0/1' }
    }
  },
  { id: 'vlan-trunk', shortName: 'vlan-trunk', mode: 'routed', accessVlan: 1, macAddress: '0000.0000.0000',
    name: 'VLAN Trunking',
    description: 'Two switches connect two PCs. Configure 802.1Q trunking on the switch link and assign access ports to VLAN 10 to allow PC pings.',
    difficulty: 'Beginner',
    devices: {
      'SW1': { id: 'SW1', shortName: 'SW1', mode: 'routed', accessVlan: 1, macAddress: '0000.0000.0000', hostname: 'SW1', type: 'switch',
        interfaces: {
          'fastethernet0/1': { id: 'fastethernet0/1', shortName: 'fa0/1', mode: 'routed', accessVlan: 1, macAddress: '0000.0000.0000', isUp: true, mode: 'access', accessVlan: 1 },
          'gigabitethernet0/1': { id: 'gigabitethernet0/1', shortName: 'gi0/1', mode: 'routed', accessVlan: 1, macAddress: '0000.0000.0000', isUp: true, mode: 'access', accessVlan: 1 },
        },
        routingTable: [], macAddressTable: {}, arpTable: {}, vlans: {}, acls: {}
      },
      'SW2': { id: 'SW2', shortName: 'SW2', mode: 'routed', accessVlan: 1, macAddress: '0000.0000.0000', hostname: 'SW2', type: 'switch',
        interfaces: {
          'fastethernet0/1': { id: 'fastethernet0/1', shortName: 'fa0/1', mode: 'routed', accessVlan: 1, macAddress: '0000.0000.0000', isUp: true, mode: 'access', accessVlan: 1 },
          'gigabitethernet0/1': { id: 'gigabitethernet0/1', shortName: 'gi0/1', mode: 'routed', accessVlan: 1, macAddress: '0000.0000.0000', isUp: true, mode: 'access', accessVlan: 1 },
        },
        routingTable: [], macAddressTable: {}, arpTable: {}, vlans: {}, acls: {}
      },
      'PC1': { id: 'PC1', shortName: 'PC1', mode: 'routed', accessVlan: 1, macAddress: '0000.0000.0000', hostname: 'PC1', type: 'pc',
        interfaces: {
          'eth0': { id: 'eth0', shortName: 'eth0', mode: 'routed', accessVlan: 1, macAddress: '0000.0000.0000', isUp: true, ipv4: { ip: '192.168.10.10', mask: '255.255.255.0' } },
        },
        routingTable: [], macAddressTable: {}, arpTable: {}, vlans: {}, acls: {}
      },
      'PC2': { id: 'PC2', shortName: 'PC2', mode: 'routed', accessVlan: 1, macAddress: '0000.0000.0000', hostname: 'PC2', type: 'pc',
        interfaces: {
          'eth0': { id: 'eth0', shortName: 'eth0', mode: 'routed', accessVlan: 1, macAddress: '0000.0000.0000', isUp: true, ipv4: { ip: '192.168.10.20', mask: '255.255.255.0' } },
        },
        routingTable: [], macAddressTable: {}, arpTable: {}, vlans: {}, acls: {}
      }
    },
    links: {
      'link-SW1-SW2': { id: 'link-SW1-SW2', shortName: 'link-SW1-SW2', mode: 'routed', accessVlan: 1, macAddress: '0000.0000.0000', sourceDeviceId: 'SW1', targetDeviceId: 'SW2', sourceInterfaceId: 'gigabitethernet0/1', targetInterfaceId: 'gigabitethernet0/1' },
      'link-PC1-SW1': { id: 'link-PC1-SW1', shortName: 'link-PC1-SW1', mode: 'routed', accessVlan: 1, macAddress: '0000.0000.0000', sourceDeviceId: 'PC1', targetDeviceId: 'SW1', sourceInterfaceId: 'eth0', targetInterfaceId: 'fastethernet0/1' },
      'link-PC2-SW2': { id: 'link-PC2-SW2', shortName: 'link-PC2-SW2', mode: 'routed', accessVlan: 1, macAddress: '0000.0000.0000', sourceDeviceId: 'PC2', targetDeviceId: 'SW2', sourceInterfaceId: 'eth0', targetInterfaceId: 'fastethernet0/1' }
    }
  },
  { id: 'device-security', shortName: 'device-security', mode: 'routed', accessVlan: 1, macAddress: '0000.0000.0000',
    name: 'Device Security Fundamentals',
    description: 'A single router ready for initial configuration. Set a hostname, enable secret, console password, and a MOTD banner.',
    difficulty: 'Beginner',
    devices: {
      'R1': { id: 'R1', shortName: 'R1', mode: 'routed', accessVlan: 1, macAddress: '0000.0000.0000', hostname: 'Router', type: 'router',
        interfaces: {
          'fastethernet0/0': { id: 'fastethernet0/0', shortName: 'fa0/0', mode: 'routed', accessVlan: 1, macAddress: '0000.0000.0000', isUp: false },
          'fastethernet0/1': { id: 'fastethernet0/1', shortName: 'fa0/1', mode: 'routed', accessVlan: 1, macAddress: '0000.0000.0000', isUp: false },
        },
        routingTable: [], macAddressTable: {}, arpTable: {}, vlans: {}, acls: {}
      }
    },
    links: {}
  },
  { id: 'dhcp-server', shortName: 'dhcp-server', mode: 'routed', accessVlan: 1, macAddress: '0000.0000.0000',
    name: 'DHCP Server Configuration',
    description: 'A router connected to a switch and two PCs. Configure a DHCP pool on the router so the PCs can receive IP addresses dynamically.',
    difficulty: 'Intermediate',
    devices: {
      'R1': { id: 'R1', shortName: 'R1', mode: 'routed', accessVlan: 1, macAddress: '0000.0000.0000', hostname: 'R1', type: 'router',
        interfaces: {
          'fastethernet0/0': { id: 'fastethernet0/0', shortName: 'fa0/0', mode: 'routed', accessVlan: 1, macAddress: '0000.0000.0000', isUp: true, ipv4: { ip: '192.168.1.1', mask: '255.255.255.0' } }
        },
        routingTable: [], macAddressTable: {}, arpTable: {}, vlans: {}, acls: {}
      },
      'SW1': { id: 'SW1', shortName: 'SW1', mode: 'routed', accessVlan: 1, macAddress: '0000.0000.0000', hostname: 'SW1', type: 'switch',
        interfaces: {
          'fastethernet0/1': { id: 'fastethernet0/1', shortName: 'fa0/1', mode: 'routed', accessVlan: 1, macAddress: '0000.0000.0000', isUp: true, mode: 'access', accessVlan: 1 },
          'fastethernet0/2': { id: 'fastethernet0/2', shortName: 'fa0/2', mode: 'routed', accessVlan: 1, macAddress: '0000.0000.0000', isUp: true, mode: 'access', accessVlan: 1 },
          'gigabitethernet0/1': { id: 'gigabitethernet0/1', shortName: 'gi0/1', mode: 'routed', accessVlan: 1, macAddress: '0000.0000.0000', isUp: true, mode: 'access', accessVlan: 1 }
        },
        routingTable: [], macAddressTable: {}, arpTable: {}, vlans: {}, acls: {}
      },
      'PC1': { id: 'PC1', shortName: 'PC1', mode: 'routed', accessVlan: 1, macAddress: '0000.0000.0000', hostname: 'PC1', type: 'pc',
        interfaces: { 'eth0': { id: 'eth0', shortName: 'eth0', mode: 'routed', accessVlan: 1, macAddress: '0000.0000.0000', isUp: true } },
        routingTable: [], macAddressTable: {}, arpTable: {}, vlans: {}, acls: {}
      },
      'PC2': { id: 'PC2', shortName: 'PC2', mode: 'routed', accessVlan: 1, macAddress: '0000.0000.0000', hostname: 'PC2', type: 'pc',
        interfaces: { 'eth0': { id: 'eth0', shortName: 'eth0', mode: 'routed', accessVlan: 1, macAddress: '0000.0000.0000', isUp: true } },
        routingTable: [], macAddressTable: {}, arpTable: {}, vlans: {}, acls: {}
      }
    },
    links: {
      'link-R1-SW1': { id: 'link-R1-SW1', shortName: 'link-R1-SW1', mode: 'routed', accessVlan: 1, macAddress: '0000.0000.0000', sourceDeviceId: 'R1', targetDeviceId: 'SW1', sourceInterfaceId: 'fastethernet0/0', targetInterfaceId: 'gigabitethernet0/1' },
      'link-PC1-SW1': { id: 'link-PC1-SW1', shortName: 'link-PC1-SW1', mode: 'routed', accessVlan: 1, macAddress: '0000.0000.0000', sourceDeviceId: 'PC1', targetDeviceId: 'SW1', sourceInterfaceId: 'eth0', targetInterfaceId: 'fastethernet0/1' },
      'link-PC2-SW1': { id: 'link-PC2-SW1', shortName: 'link-PC2-SW1', mode: 'routed', accessVlan: 1, macAddress: '0000.0000.0000', sourceDeviceId: 'PC2', targetDeviceId: 'SW1', sourceInterfaceId: 'eth0', targetInterfaceId: 'fastethernet0/2' }
    }
  },
  { id: 'ospf-advanced', shortName: 'ospf-advanced', mode: 'routed', accessVlan: 1, macAddress: '0000.0000.0000',
    name: 'Advanced OSPF Routing',
    description: 'Four routers arranged in a square topology. OSPF is pre-configured to establish full routing. Try shutting down a link to test redundancy!',
    difficulty: 'Advanced',
    devices: {
      'R1': { id: 'R1', shortName: 'R1', mode: 'routed', accessVlan: 1, macAddress: '0000.0000.0000', hostname: 'R1', type: 'router',
        interfaces: {
          'fastethernet0/0': { id: 'fastethernet0/0', shortName: 'fa0/0', mode: 'routed', accessVlan: 1, macAddress: '0000.0000.0000', isUp: true, ipv4: { ip: '10.0.12.1', mask: '255.255.255.0' } },
          'fastethernet0/1': { id: 'fastethernet0/1', shortName: 'fa0/1', mode: 'routed', accessVlan: 1, macAddress: '0000.0000.0000', isUp: true, ipv4: { ip: '10.0.14.1', mask: '255.255.255.0' } },
        },
        routingTable: [], macAddressTable: {}, arpTable: {}, vlans: {}, acls: {}, ospf: { processId: '1', networks: [{ network: '10.0.0.0', wildcard: '0.255.255.255', area: '0' }] }
      },
      'R2': { id: 'R2', shortName: 'R2', mode: 'routed', accessVlan: 1, macAddress: '0000.0000.0000', hostname: 'R2', type: 'router',
        interfaces: {
          'fastethernet0/0': { id: 'fastethernet0/0', shortName: 'fa0/0', mode: 'routed', accessVlan: 1, macAddress: '0000.0000.0000', isUp: true, ipv4: { ip: '10.0.12.2', mask: '255.255.255.0' } },
          'fastethernet0/1': { id: 'fastethernet0/1', shortName: 'fa0/1', mode: 'routed', accessVlan: 1, macAddress: '0000.0000.0000', isUp: true, ipv4: { ip: '10.0.23.2', mask: '255.255.255.0' } },
        },
        routingTable: [], macAddressTable: {}, arpTable: {}, vlans: {}, acls: {}, ospf: { processId: '1', networks: [{ network: '10.0.0.0', wildcard: '0.255.255.255', area: '0' }] }
      },
      'R3': { id: 'R3', shortName: 'R3', mode: 'routed', accessVlan: 1, macAddress: '0000.0000.0000', hostname: 'R3', type: 'router',
        interfaces: {
          'fastethernet0/0': { id: 'fastethernet0/0', shortName: 'fa0/0', mode: 'routed', accessVlan: 1, macAddress: '0000.0000.0000', isUp: true, ipv4: { ip: '10.0.34.3', mask: '255.255.255.0' } },
          'fastethernet0/1': { id: 'fastethernet0/1', shortName: 'fa0/1', mode: 'routed', accessVlan: 1, macAddress: '0000.0000.0000', isUp: true, ipv4: { ip: '10.0.23.3', mask: '255.255.255.0' } },
        },
        routingTable: [], macAddressTable: {}, arpTable: {}, vlans: {}, acls: {}, ospf: { processId: '1', networks: [{ network: '10.0.0.0', wildcard: '0.255.255.255', area: '0' }] }
      },
      'R4': { id: 'R4', shortName: 'R4', mode: 'routed', accessVlan: 1, macAddress: '0000.0000.0000', hostname: 'R4', type: 'router',
        interfaces: {
          'fastethernet0/0': { id: 'fastethernet0/0', shortName: 'fa0/0', mode: 'routed', accessVlan: 1, macAddress: '0000.0000.0000', isUp: true, ipv4: { ip: '10.0.34.4', mask: '255.255.255.0' } },
          'fastethernet0/1': { id: 'fastethernet0/1', shortName: 'fa0/1', mode: 'routed', accessVlan: 1, macAddress: '0000.0000.0000', isUp: true, ipv4: { ip: '10.0.14.4', mask: '255.255.255.0' } },
        },
        routingTable: [], macAddressTable: {}, arpTable: {}, vlans: {}, acls: {}, ospf: { processId: '1', networks: [{ network: '10.0.0.0', wildcard: '0.255.255.255', area: '0' }] }
      }
    },
    links: {
      'link-R1-R2': { id: 'link-R1-R2', shortName: 'link-R1-R2', mode: 'routed', accessVlan: 1, macAddress: '0000.0000.0000', sourceDeviceId: 'R1', targetDeviceId: 'R2', sourceInterfaceId: 'fastethernet0/0', targetInterfaceId: 'fastethernet0/0' },
      'link-R2-R3': { id: 'link-R2-R3', shortName: 'link-R2-R3', mode: 'routed', accessVlan: 1, macAddress: '0000.0000.0000', sourceDeviceId: 'R2', targetDeviceId: 'R3', sourceInterfaceId: 'fastethernet0/1', targetInterfaceId: 'fastethernet0/1' },
      'link-R3-R4': { id: 'link-R3-R4', shortName: 'link-R3-R4', mode: 'routed', accessVlan: 1, macAddress: '0000.0000.0000', sourceDeviceId: 'R3', targetDeviceId: 'R4', sourceInterfaceId: 'fastethernet0/0', targetInterfaceId: 'fastethernet0/0' },
      'link-R4-R1': { id: 'link-R4-R1', shortName: 'link-R4-R1', mode: 'routed', accessVlan: 1, macAddress: '0000.0000.0000', sourceDeviceId: 'R4', targetDeviceId: 'R1', sourceInterfaceId: 'fastethernet0/1', targetInterfaceId: 'fastethernet0/1' }
    }
  },
  {
    id: 'az104-hub-spoke', shortName: 'az-hub-spoke', mode: 'routed', accessVlan: 1, macAddress: '0000.0000.0000',
    name: 'AZ-104: Hub and Spoke Peering',
    description: 'A classic Azure topology. You have an on-premises router connected via VPN to a Hub VNet. The Hub is peered with a Spoke VNet. Can you ping the Spoke VM? Check the Peering transit settings and Route Tables!',
    difficulty: 'Intermediate',
    devices: {
      'OnPrem-Router': { id: 'OnPrem-Router', shortName: 'R1', mode: 'routed', accessVlan: 1, macAddress: '0000.0000.0000', hostname: 'OnPrem', type: 'router',
        interfaces: {
          'gigabitethernet0/0': { id: 'gigabitethernet0/0', shortName: 'gi0/0', mode: 'routed', accessVlan: 1, macAddress: '0000.0000.0000', isUp: true, ipv4: { ip: '192.168.1.1', mask: '255.255.255.0' } }
        },
        routingTable: [], macAddressTable: {}, arpTable: {}, vlans: {}, acls: {}
      }
    },
    links: {},
    azureState: {
      resourceGroups: {
        'rg-networking': { name: 'rg-networking', location: 'eastus' }
      },
      vnets: {
        'vnet-hub': {
          id: 'vnet-hub', name: 'vnet-hub', type: 'Microsoft.Network/virtualNetworks', location: 'eastus', resourceGroup: 'rg-networking',
          addressSpace: ['10.0.0.0/16'],
          subnets: [{ id: 'GatewaySubnet', name: 'GatewaySubnet', addressPrefix: '10.0.0.0/24' }],
          peerings: [{
            id: 'peer-hub-to-spoke', name: 'peer-hub-to-spoke', remoteVirtualNetworkId: 'vnet-spoke',
            allowVirtualNetworkAccess: true, allowForwardedTraffic: true, allowGatewayTransit: false, useRemoteGateways: false, peeringState: 'Connected'
          }]
        },
        'vnet-spoke': {
          id: 'vnet-spoke', name: 'vnet-spoke', type: 'Microsoft.Network/virtualNetworks', location: 'eastus', resourceGroup: 'rg-networking',
          addressSpace: ['10.1.0.0/16'],
          subnets: [{ id: 'sub-workload', name: 'sub-workload', addressPrefix: '10.1.1.0/24' }],
          peerings: [{
            id: 'peer-spoke-to-hub', name: 'peer-spoke-to-hub', remoteVirtualNetworkId: 'vnet-hub',
            allowVirtualNetworkAccess: true, allowForwardedTraffic: true, allowGatewayTransit: false, useRemoteGateways: false, peeringState: 'Connected'
          }]
        }
      },
      vngs: {
        'vng-hub': {
          id: 'vng-hub', name: 'vng-hub', type: 'Microsoft.Network/virtualNetworkGateways', location: 'eastus', resourceGroup: 'rg-networking',
          vnetId: 'vnet-hub', gatewayType: 'Vpn', vpnType: 'RouteBased', sku: 'VpnGw1', bgpEnabled: false, status: 'Succeeded', publicIpAddress: '20.50.100.1'
        }
      },
      vms: {
        'vm-spoke': {
          id: 'vm-spoke', name: 'vm-spoke', type: 'Microsoft.Compute/virtualMachines', location: 'eastus', resourceGroup: 'rg-networking',
          size: 'Standard_B2s', os: 'Linux', subnetId: 'sub-workload', privateIpAddress: '10.1.1.4', status: 'Running'
        }
      }
    }
  }
];
