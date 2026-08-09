-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "recoveryKeyHash" TEXT NOT NULL,
    "displayName" TEXT,
    "avatarUrl" TEXT,
    "allowUniverseRequests" TEXT NOT NULL DEFAULT 'EVERYONE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReservedUsername" (
    "username" TEXT NOT NULL,
    "reservedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "originalUserId" TEXT,
    "reason" TEXT NOT NULL DEFAULT 'REGISTERED',

    CONSTRAINT "ReservedUsername_pkey" PRIMARY KEY ("username")
);

-- CreateTable
CREATE TABLE "Universe" (
    "id" TEXT NOT NULL,
    "universeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Universe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UniverseMember" (
    "id" TEXT NOT NULL,
    "universeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UniverseMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UniverseInvitation" (
    "id" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "receiverId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UniverseInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlockedUser" (
    "id" TEXT NOT NULL,
    "blockerId" TEXT NOT NULL,
    "blockedId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BlockedUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "universeId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'TEXT',
    "content" TEXT NOT NULL,
    "metadata" TEXT NOT NULL DEFAULT '{}',
    "replyToMessageId" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "editedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'SENT',

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MessageReaction" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MessageReaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReadReceipt" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "readAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReadReceipt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Guardian" (
    "id" TEXT NOT NULL,
    "guardianId" TEXT NOT NULL,
    "universeId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Guardian_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuardianEvent" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "universeId" TEXT NOT NULL,
    "messageId" TEXT,
    "payload" TEXT NOT NULL DEFAULT '{}',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "retryCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "GuardianEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuardianDailySummary" (
    "id" TEXT NOT NULL,
    "universeId" TEXT NOT NULL,
    "summaryDate" TIMESTAMP(3) NOT NULL,
    "messageCount" INTEGER NOT NULL DEFAULT 0,
    "content" TEXT NOT NULL,
    "metadata" TEXT NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GuardianDailySummary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuardianWeeklySummary" (
    "id" TEXT NOT NULL,
    "universeId" TEXT NOT NULL,
    "weekStartDate" TIMESTAMP(3) NOT NULL,
    "content" TEXT NOT NULL,
    "metadata" TEXT NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GuardianWeeklySummary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuardianMonthlySummary" (
    "id" TEXT NOT NULL,
    "universeId" TEXT NOT NULL,
    "monthStartDate" TIMESTAMP(3) NOT NULL,
    "content" TEXT NOT NULL,
    "metadata" TEXT NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GuardianMonthlySummary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuardianTimeline" (
    "id" TEXT NOT NULL,
    "universeId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "referenceId" TEXT,
    "description" TEXT NOT NULL,
    "metadata" TEXT NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GuardianTimeline_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuardianRelationshipProfile" (
    "id" TEXT NOT NULL,
    "universeId" TEXT NOT NULL,
    "learningStage" TEXT NOT NULL DEFAULT 'BASELINE_OBSERVATION',
    "messagesProcessed" INTEGER NOT NULL DEFAULT 0,
    "summariesGenerated" INTEGER NOT NULL DEFAULT 0,
    "timelineEntries" INTEGER NOT NULL DEFAULT 0,
    "processingStatus" TEXT NOT NULL DEFAULT 'IDLE',
    "workerHealth" TEXT NOT NULL DEFAULT 'HEALTHY',
    "metadata" TEXT NOT NULL DEFAULT '{}',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GuardianRelationshipProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuardianWorkerLog" (
    "id" TEXT NOT NULL,
    "workerName" TEXT NOT NULL,
    "universeId" TEXT,
    "status" TEXT NOT NULL,
    "durationMs" INTEGER NOT NULL,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GuardianWorkerLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuardianProcessingQueue" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "jobType" TEXT NOT NULL,
    "universeId" TEXT NOT NULL,
    "payload" TEXT NOT NULL DEFAULT '{}',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "maxRetries" INTEGER NOT NULL DEFAULT 3,
    "scheduledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GuardianProcessingQueue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE INDEX "User_username_idx" ON "User"("username");

-- CreateIndex
CREATE INDEX "ReservedUsername_username_idx" ON "ReservedUsername"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Universe_universeId_key" ON "Universe"("universeId");

-- CreateIndex
CREATE INDEX "Universe_universeId_idx" ON "Universe"("universeId");

-- CreateIndex
CREATE INDEX "UniverseMember_userId_idx" ON "UniverseMember"("userId");

-- CreateIndex
CREATE INDEX "UniverseMember_universeId_idx" ON "UniverseMember"("universeId");

-- CreateIndex
CREATE UNIQUE INDEX "UniverseMember_universeId_userId_key" ON "UniverseMember"("universeId", "userId");

-- CreateIndex
CREATE INDEX "UniverseInvitation_senderId_idx" ON "UniverseInvitation"("senderId");

-- CreateIndex
CREATE INDEX "UniverseInvitation_receiverId_idx" ON "UniverseInvitation"("receiverId");

-- CreateIndex
CREATE INDEX "UniverseInvitation_status_idx" ON "UniverseInvitation"("status");

-- CreateIndex
CREATE INDEX "BlockedUser_blockerId_idx" ON "BlockedUser"("blockerId");

-- CreateIndex
CREATE INDEX "BlockedUser_blockedId_idx" ON "BlockedUser"("blockedId");

-- CreateIndex
CREATE UNIQUE INDEX "BlockedUser_blockerId_blockedId_key" ON "BlockedUser"("blockerId", "blockedId");

-- CreateIndex
CREATE UNIQUE INDEX "Message_messageId_key" ON "Message"("messageId");

-- CreateIndex
CREATE INDEX "Message_universeId_createdAt_idx" ON "Message"("universeId", "createdAt");

-- CreateIndex
CREATE INDEX "Message_senderId_idx" ON "Message"("senderId");

-- CreateIndex
CREATE INDEX "Message_messageId_idx" ON "Message"("messageId");

-- CreateIndex
CREATE INDEX "MessageReaction_messageId_idx" ON "MessageReaction"("messageId");

-- CreateIndex
CREATE INDEX "MessageReaction_userId_idx" ON "MessageReaction"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "MessageReaction_messageId_userId_key" ON "MessageReaction"("messageId", "userId");

-- CreateIndex
CREATE INDEX "ReadReceipt_messageId_idx" ON "ReadReceipt"("messageId");

-- CreateIndex
CREATE INDEX "ReadReceipt_userId_idx" ON "ReadReceipt"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ReadReceipt_messageId_userId_key" ON "ReadReceipt"("messageId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "Guardian_guardianId_key" ON "Guardian"("guardianId");

-- CreateIndex
CREATE UNIQUE INDEX "Guardian_universeId_key" ON "Guardian"("universeId");

-- CreateIndex
CREATE INDEX "Guardian_universeId_idx" ON "Guardian"("universeId");

-- CreateIndex
CREATE INDEX "Guardian_guardianId_idx" ON "Guardian"("guardianId");

-- CreateIndex
CREATE UNIQUE INDEX "GuardianEvent_eventId_key" ON "GuardianEvent"("eventId");

-- CreateIndex
CREATE INDEX "GuardianEvent_universeId_idx" ON "GuardianEvent"("universeId");

-- CreateIndex
CREATE INDEX "GuardianEvent_eventType_idx" ON "GuardianEvent"("eventType");

-- CreateIndex
CREATE INDEX "GuardianEvent_status_idx" ON "GuardianEvent"("status");

-- CreateIndex
CREATE INDEX "GuardianEvent_createdAt_idx" ON "GuardianEvent"("createdAt");

-- CreateIndex
CREATE INDEX "GuardianDailySummary_universeId_idx" ON "GuardianDailySummary"("universeId");

-- CreateIndex
CREATE INDEX "GuardianDailySummary_summaryDate_idx" ON "GuardianDailySummary"("summaryDate");

-- CreateIndex
CREATE UNIQUE INDEX "GuardianDailySummary_universeId_summaryDate_key" ON "GuardianDailySummary"("universeId", "summaryDate");

-- CreateIndex
CREATE INDEX "GuardianWeeklySummary_universeId_idx" ON "GuardianWeeklySummary"("universeId");

-- CreateIndex
CREATE INDEX "GuardianWeeklySummary_weekStartDate_idx" ON "GuardianWeeklySummary"("weekStartDate");

-- CreateIndex
CREATE UNIQUE INDEX "GuardianWeeklySummary_universeId_weekStartDate_key" ON "GuardianWeeklySummary"("weekStartDate");

-- CreateIndex
CREATE INDEX "GuardianMonthlySummary_universeId_idx" ON "GuardianMonthlySummary"("universeId");

-- CreateIndex
CREATE INDEX "GuardianMonthlySummary_monthStartDate_idx" ON "GuardianMonthlySummary"("monthStartDate");

-- CreateIndex
CREATE UNIQUE INDEX "GuardianMonthlySummary_universeId_monthStartDate_key" ON "GuardianMonthlySummary"("universeId", "monthStartDate");

-- CreateIndex
CREATE INDEX "GuardianTimeline_universeId_createdAt_idx" ON "GuardianTimeline"("universeId", "createdAt");

-- CreateIndex
CREATE INDEX "GuardianTimeline_type_idx" ON "GuardianTimeline"("type");

-- CreateIndex
CREATE UNIQUE INDEX "GuardianRelationshipProfile_universeId_key" ON "GuardianRelationshipProfile"("universeId");

-- CreateIndex
CREATE INDEX "GuardianRelationshipProfile_universeId_idx" ON "GuardianRelationshipProfile"("universeId");

-- CreateIndex
CREATE INDEX "GuardianWorkerLog_workerName_idx" ON "GuardianWorkerLog"("workerName");

-- CreateIndex
CREATE INDEX "GuardianWorkerLog_universeId_idx" ON "GuardianWorkerLog"("universeId");

-- CreateIndex
CREATE INDEX "GuardianWorkerLog_createdAt_idx" ON "GuardianWorkerLog"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "GuardianProcessingQueue_jobId_key" ON "GuardianProcessingQueue"("jobId");

-- CreateIndex
CREATE INDEX "GuardianProcessingQueue_status_priority_scheduledAt_idx" ON "GuardianProcessingQueue"("status", "priority", "scheduledAt");

-- CreateIndex
CREATE INDEX "GuardianProcessingQueue_universeId_idx" ON "GuardianProcessingQueue"("universeId");

-- CreateIndex
CREATE INDEX "GuardianProcessingQueue_jobType_idx" ON "GuardianProcessingQueue"("jobType");

-- AddForeignKey
ALTER TABLE "UniverseMember" ADD CONSTRAINT "UniverseMember_universeId_fkey" FOREIGN KEY ("universeId") REFERENCES "Universe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UniverseMember" ADD CONSTRAINT "UniverseMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UniverseInvitation" ADD CONSTRAINT "UniverseInvitation_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UniverseInvitation" ADD CONSTRAINT "UniverseInvitation_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlockedUser" ADD CONSTRAINT "BlockedUser_blockerId_fkey" FOREIGN KEY ("blockerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlockedUser" ADD CONSTRAINT "BlockedUser_blockedId_fkey" FOREIGN KEY ("blockedId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_universeId_fkey" FOREIGN KEY ("universeId") REFERENCES "Universe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_replyToMessageId_fkey" FOREIGN KEY ("replyToMessageId") REFERENCES "Message"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageReaction" ADD CONSTRAINT "MessageReaction_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageReaction" ADD CONSTRAINT "MessageReaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReadReceipt" ADD CONSTRAINT "ReadReceipt_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReadReceipt" ADD CONSTRAINT "ReadReceipt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Guardian" ADD CONSTRAINT "Guardian_universeId_fkey" FOREIGN KEY ("universeId") REFERENCES "Universe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuardianEvent" ADD CONSTRAINT "GuardianEvent_universeId_fkey" FOREIGN KEY ("universeId") REFERENCES "Universe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuardianDailySummary" ADD CONSTRAINT "GuardianDailySummary_universeId_fkey" FOREIGN KEY ("universeId") REFERENCES "Universe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuardianWeeklySummary" ADD CONSTRAINT "GuardianWeeklySummary_universeId_fkey" FOREIGN KEY ("universeId") REFERENCES "Universe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuardianMonthlySummary" ADD CONSTRAINT "GuardianMonthlySummary_universeId_fkey" FOREIGN KEY ("universeId") REFERENCES "Universe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuardianTimeline" ADD CONSTRAINT "GuardianTimeline_universeId_fkey" FOREIGN KEY ("universeId") REFERENCES "Universe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuardianRelationshipProfile" ADD CONSTRAINT "GuardianRelationshipProfile_universeId_fkey" FOREIGN KEY ("universeId") REFERENCES "Universe"("id") ON DELETE CASCADE ON UPDATE CASCADE;
