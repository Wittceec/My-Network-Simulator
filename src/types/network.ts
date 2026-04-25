export interface Link {
  id: string; // UUID, ties to React Flow edge ID
  sourceDeviceId: string;
  sourceInterfaceId: string;
  targetDeviceId: string;
  targetInterfaceId: string;
}