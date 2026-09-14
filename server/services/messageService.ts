import prisma from '../db/prisma.js';
import { generateMessageId } from '../utils/messageIdGen.js';

export interface CreateMessageInput {
  universeId: string;
  senderId: string;
  content: string;
  type?: string;
  metadata?: Record<string, any> | string;
  replyToMessageId?: string;
}

export interface FetchMessagesInput {
  universeId: string;
  userId: string;
  cursor?: string;
  limit?: number;
  q?: string;
  direction?: 'before' | 'after';
}

export class MessageService {
  /**
   * Simple HTML/XSS Content Sanitizer & Validator
   */
  private sanitizeContent(content: string): string {
    if (!content) return '';
    return content
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
      .trim();
  }

  /**
   * Verifies if a user is a valid member of a Universe.
   */
  async isUniverseMember(universeId: string, userId: string): Promise<boolean> {
    const membership = await prisma.universeMember.findUnique({
      where: {
        universeId_userId: { universeId, userId }
      }
    });
    return !!membership;
  }

  /**
   * Creates and stores a new message inside a Shared Universe.
   */
  async createMessage(input: CreateMessageInput) {
    const { universeId, senderId, content, type = 'TEXT', metadata = {}, replyToMessageId } = input;

    // 1. Membership Validation
    const isMember = await this.isUniverseMember(universeId, senderId);
    if (!isMember) {
      throw new Error('UNAUTHORIZED_UNIVERSE_MEMBER: User is not a member of this Universe');
    }

    // 2. Content Validation & Sanitization
    const trimmed = content ? content.trim() : '';
    if (!trimmed) {
      throw new Error('INVALID_MESSAGE_CONTENT: Message content cannot be empty');
    }
    if (trimmed.length > 5000) {
      throw new Error('MESSAGE_TOO_LONG: Message content exceeds maximum 5000 character limit');
    }

    const sanitizedContent = this.sanitizeContent(trimmed);
    const messageId = generateMessageId();
    const metadataStr = typeof metadata === 'string' ? metadata : JSON.stringify(metadata);

    // 3. Reply Target Validation (if replyToMessageId provided)
    if (replyToMessageId) {
      const parentMsg = await prisma.message.findFirst({
        where: { id: replyToMessageId, universeId }
      });
      if (!parentMsg) {
        throw new Error('REPLY_TARGET_NOT_FOUND: Referenced reply message does not exist in this Universe');
      }
    }

    // 4. Create Message in Database
    const message = await prisma.message.create({
      data: {
        messageId,
        universeId,
        senderId,
        type,
        content: sanitizedContent,
        metadata: metadataStr,
        replyToMessageId: replyToMessageId || null,
        status: 'SENT'
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true
          }
        },
        reactions: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true
              }
            }
          }
        },
        readReceipts: {
          select: {
            userId: true,
            readAt: true
          }
        }
      }
    });

    return message;
  }

  /**
   * Edits an existing message.
   */
  async editMessage(messageId: string, userId: string, newContent: string) {
    const message = await prisma.message.findUnique({
      where: { id: messageId }
    });

    if (!message) {
      throw new Error('MESSAGE_NOT_FOUND: Message does not exist');
    }

    if (message.senderId !== userId) {
      throw new Error('UNAUTHORIZED_EDIT: Only the sender can edit this message');
    }

    if (message.status === 'DELETED' || message.deletedAt) {
      throw new Error('CANNOT_EDIT_DELETED: Deleted messages cannot be edited');
    }

    const trimmed = newContent ? newContent.trim() : '';
    if (!trimmed) {
      throw new Error('INVALID_MESSAGE_CONTENT: Message content cannot be empty');
    }
    if (trimmed.length > 5000) {
      throw new Error('MESSAGE_TOO_LONG: Message content exceeds maximum 5000 character limit');
    }

    const sanitized = this.sanitizeContent(trimmed);

    const updated = await prisma.message.update({
      where: { id: messageId },
      data: {
        content: sanitized,
        editedAt: new Date(),
        version: { increment: 1 }
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true
          }
        },
        reactions: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true
              }
            }
          }
        },
        readReceipts: {
          select: {
            userId: true,
            readAt: true
          }
        }
      }
    });

    return updated;
  }

  /**
   * Soft deletes a message.
   */
  async deleteMessage(messageId: string, userId: string) {
    const message = await prisma.message.findUnique({
      where: { id: messageId }
    });

    if (!message) {
      throw new Error('MESSAGE_NOT_FOUND: Message does not exist');
    }

    if (message.senderId !== userId) {
      throw new Error('UNAUTHORIZED_DELETE: Only the sender can delete this message');
    }

    const deleted = await prisma.message.update({
      where: { id: messageId },
      data: {
        content: 'This message was deleted.',
        status: 'DELETED',
        deletedAt: new Date()
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true
          }
        },
        reactions: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true
              }
            }
          }
        },
        readReceipts: {
          select: {
            userId: true,
            readAt: true
          }
        }
      }
    });

    return deleted;
  }

  /**
   * Fetches paginated message history inside a Universe.
   */
  async fetchMessages(input: FetchMessagesInput) {
    const { universeId, userId, cursor, limit = 30, q, direction = 'before' } = input;

    // Membership Check
    const isMember = await this.isUniverseMember(universeId, userId);
    if (!isMember) {
      throw new Error('UNAUTHORIZED_UNIVERSE_MEMBER: User is not a member of this Universe');
    }

    const takeLimit = Math.min(Math.max(limit, 1), 100);

    // Build filter conditions
    const where: any = { universeId };

    if (q && q.trim()) {
      where.content = {
        contains: q.trim()
      };
    }

    if (cursor) {
      const cursorMsg = await prisma.message.findUnique({ where: { id: cursor } });
      if (cursorMsg) {
        where.createdAt = direction === 'before'
          ? { lt: cursorMsg.createdAt }
          : { gt: cursorMsg.createdAt };
      }
    }

    const messages = await prisma.message.findMany({
      where,
      take: takeLimit + 1,
      orderBy: { createdAt: 'desc' },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true
          }
        },
        reactions: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true
              }
            }
          }
        },
        readReceipts: {
          select: {
            userId: true,
            readAt: true
          }
        }
      }
    });

    let hasMore = false;
    if (messages.length > takeLimit) {
      hasMore = true;
      messages.pop();
    }

    // Chronological order for frontend display (oldest to newest)
    const sorted = messages.reverse();
    const nextCursor = sorted.length > 0 ? sorted[0].id : null;

    return {
      messages: sorted,
      nextCursor,
      hasMore
    };
  }

  /**
   * Adds or updates a user reaction on a message.
   */
  async addReaction(messageId: string, userId: string, emoji: string) {
    const message = await prisma.message.findUnique({
      where: { id: messageId }
    });

    if (!message) {
      throw new Error('MESSAGE_NOT_FOUND: Message does not exist');
    }

    const isMember = await this.isUniverseMember(message.universeId, userId);
    if (!isMember) {
      throw new Error('UNAUTHORIZED_UNIVERSE_MEMBER: User is not a member of this Universe');
    }

    const reaction = await prisma.messageReaction.upsert({
      where: {
        messageId_userId: { messageId, userId }
      },
      update: {
        emoji,
        createdAt: new Date()
      },
      create: {
        messageId,
        userId,
        emoji
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true
          }
        }
      }
    });

    return { reaction, universeId: message.universeId };
  }

  /**
   * Removes a user reaction from a message.
   */
  async removeReaction(messageId: string, userId: string) {
    const message = await prisma.message.findUnique({
      where: { id: messageId }
    });

    if (!message) {
      throw new Error('MESSAGE_NOT_FOUND: Message does not exist');
    }

    await prisma.messageReaction.deleteMany({
      where: { messageId, userId }
    });

    return { messageId, userId, universeId: message.universeId };
  }

  /**
   * Marks unread messages as read for a user inside a Universe.
   */
  async markRead(universeId: string, userId: string, messageIds?: string[]) {
    const isMember = await this.isUniverseMember(universeId, userId);
    if (!isMember) {
      throw new Error('UNAUTHORIZED_UNIVERSE_MEMBER: User is not a member of this Universe');
    }

    // Target messages to mark read (excluding user's own sent messages)
    const whereCondition: any = {
      universeId,
      senderId: { not: userId }
    };

    if (messageIds && messageIds.length > 0) {
      whereCondition.id = { in: messageIds };
    }

    const targetMessages = await prisma.message.findMany({
      where: whereCondition,
      select: { id: true }
    });

    const readAt = new Date();
    const markedIds: string[] = [];

    for (const msg of targetMessages) {
      await prisma.readReceipt.upsert({
        where: {
          messageId_userId: { messageId: msg.id, userId }
        },
        update: { readAt },
        create: {
          messageId: msg.id,
          userId,
          readAt
        }
      });

      // Update status to READ
      await prisma.message.update({
        where: { id: msg.id },
        data: { status: 'READ' }
      });

      markedIds.push(msg.id);
    }

    return { universeId, userId, markedIds, readAt };
  }
}

export const messageService = new MessageService();
export default messageService;
