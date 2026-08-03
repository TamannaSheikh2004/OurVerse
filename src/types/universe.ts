export type RelationshipStatus = 'NONE' | 'INVITATION_SENT' | 'INVITATION_RECEIVED' | 'CONNECTED' | 'BLOCKED';

export type InvitationStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'BLOCKED' | 'EXPIRED';

export interface SearchUserResult {
  username: string;
  displayName: string;
  avatar: string | null;
  relationshipStatus: RelationshipStatus;
}

export interface PeerUser {
  username: string;
  displayName: string;
  avatar: string | null;
}

export interface ReceivedInvitation {
  id: string;
  status: InvitationStatus;
  createdAt: string;
  expiresAt: string;
  sender: PeerUser;
}

export interface SentInvitation {
  id: string;
  status: InvitationStatus;
  createdAt: string;
  expiresAt: string;
  receiver: PeerUser;
}

export interface InvitationsResponse {
  received: ReceivedInvitation[];
  sent: SentInvitation[];
}

export interface UniverseListItem {
  universeId: string;
  createdAt: string;
  peerUser: PeerUser;
}

export interface UniverseMemberInfo {
  username: string;
  displayName: string;
  avatar: string | null;
  joinedAt: string;
}

export interface UniverseDetails {
  id?: string;
  universeId: string;
  createdAt: string;
  members: UniverseMemberInfo[];
}
