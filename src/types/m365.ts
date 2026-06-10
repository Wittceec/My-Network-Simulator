export type M365License = 'Microsoft 365 E3' | 'Microsoft 365 E5' | 'Exchange Online Plan 1' | 'Unlicensed';

export interface M365User {
  id: string; // Links to AD or Entra ID
  displayName: string;
  userPrincipalName: string;
  license: M365License;
  mailboxEnabled: boolean;
  mailboxUsageMB: number;
  forwardingAddress?: string; // Optional email forwarding
}

export interface SharedMailbox {
  id: string;
  displayName: string;
  emailAddress: string;
  delegates: string[]; // List of user IDs who have access
}

export interface SharePointSite {
  id: string;
  name: string;
  url: string;
  storageQuotaGB: number;
  owners: string[]; // List of user IDs
}

export interface M365State {
  users: Record<string, M365User>;
  sharedMailboxes: Record<string, SharedMailbox>;
  sites: Record<string, SharePointSite>;

  updateUserLicense: (id: string, license: M365License) => void;
  enableMailbox: (id: string) => void;
  setForwarding: (id: string, forwardingAddress: string | undefined) => void;
  
  createSharedMailbox: (mailbox: SharedMailbox) => void;
  addDelegateToSharedMailbox: (mailboxId: string, userId: string) => void;
  
  createSite: (site: SharePointSite) => void;
}
