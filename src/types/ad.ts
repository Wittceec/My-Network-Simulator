export type ADObjectType = 'User' | 'Computer' | 'Group' | 'OU';
export type ADGroupScope = 'DomainLocal' | 'Global' | 'Universal';
export type ADGroupType = 'Security' | 'Distribution';

export interface ADObject {
  id: string;
  name: string;
  type: ADObjectType;
  distinguishedName: string;
  parentOuId?: string; // If undefined, resides in the root domain
}

export interface ADUser extends ADObject {
  type: 'User';
  firstName: string;
  lastName: string;
  displayName?: string;
  description?: string;
  office?: string;
  telephone?: string;
  email?: string;
  
  sAMAccountName: string;
  userPrincipalName: string;
  
  department?: string;
  title?: string;
  company?: string;
  manager?: string; // User ID
  
  enabled: boolean;
  lockedOut: boolean;
  passwordExpired: boolean;
  passwordNeverExpires?: boolean;
  userCannotChangePassword?: boolean;
  userMustChangePassword?: boolean;
  pwdLastSet?: number;
  badPwdCount?: number;
  accountExpires?: number | null; // Timestamp or null
  
  logonHours?: string; // e.g. 24x7 representation
  logonWorkstations?: string[]; // list of computer names
  
  profilePath?: string;
  logonScript?: string;
  homeDirectory?: string;

  groups: string[]; // Group IDs
}

export interface ADComputer extends ADObject {
  type: 'Computer';
  operatingSystem: string;
  operatingSystemVersion: string;
  enabled: boolean;
}

export interface ADGroup extends ADObject {
  type: 'Group';
  groupScope: ADGroupScope;
  groupType: ADGroupType;
  members: string[]; // User or Computer or Group IDs
}

export interface ADOrganizationalUnit extends ADObject {
  type: 'OU';
  description?: string;
  blockInheritance?: boolean;
}

export interface GPO {
  id: string;
  name: string;
  enabled: boolean;
  linkedOUs: string[]; // OU IDs
  enforcedLinks?: string[]; // OU IDs where this link is enforced
  securityFiltering?: string[]; // Group IDs (if undefined, applies to Authenticated Users)
  settings: Record<string, string>; // e.g. "PasswordPolicy.MinLength": "8"
}

export interface ADDomain {
  id: string;
  name: string; // e.g. "corp.local"
  netbiosName: string; // e.g. "CORP"
}
