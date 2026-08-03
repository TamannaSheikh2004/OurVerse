/**
 * Event Types, Job Types, and Data Contracts for Sprint 5.0 Guardian Infrastructure
 */

export type GuardianEventType =
  | 'UniverseCreated'
  | 'UniverseDeleted'
  | 'MessageCreated'
  | 'MessageEdited'
  | 'MessageDeleted'
  | 'ReactionAdded'
  | 'ReactionRemoved'
  | 'MessageRead'
  | 'UniverseInvitationAccepted'
  | 'DailyBoundaryReached'
  | 'WeeklyBoundaryReached'
  | 'MonthlyBoundaryReached'
  | 'GuardianConversationStarted'
  | 'GuardianConversationEnded'
  | 'WorkerCompleted'
  | 'WorkerFailed'
  | 'MemoryPromotionRequested'
  | 'MemoryArchiveRequested'
  | 'RelationshipAnalysisRequested';

export type GuardianJobType =
  | 'PROCESS_MESSAGE_METADATA'
  | 'GENERATE_DAILY_SUMMARY'
  | 'GENERATE_WEEKLY_SUMMARY'
  | 'GENERATE_MONTHLY_SUMMARY'
  | 'UPDATE_TIMELINE'
  | 'UPDATE_RELATIONSHIP_PROFILE'
  | 'DETECT_HABIT'
  | 'DETECT_MILESTONE'
  | 'EXTRACT_INTERESTS'
  | 'DETECT_NICKNAME'
  | 'PROMOTE_MEMORY'
  | 'ARCHIVE_MEMORY'
  | 'RECALCULATE_STATISTICS';

export type GuardianEventStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'RETRYING';
export type GuardianQueueStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'RETRYING';

export interface EventPayload {
  eventId?: string;
  eventType: GuardianEventType;
  universeId: string;
  messageId?: string;
  senderId?: string;
  content?: string;
  timestamp?: string;
  data?: Record<string, any>;
}

export interface JobPayload {
  jobId: string;
  jobType: GuardianJobType;
  universeId: string;
  messageId?: string;
  data?: Record<string, any>;
}

export interface StandardizedMessageMetadata {
  language: string | null;
  guardian: {
    processingStatus: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
    summaryVersion: number;
    importance: 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';
    processedAt?: string;
  };
  reply: Record<string, any>;
  future: Record<string, any>;
}
