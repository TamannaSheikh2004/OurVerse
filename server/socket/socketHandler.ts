import { Server, Socket } from 'socket.io';
import { socketAuthMiddleware, AuthenticatedSocket } from './socketAuth.js';
import messageService from '../services/messageService.js';
import presenceService from '../services/presenceService.js';
import universeService from '../services/universeService.js';
import { checkSocketRateLimit, cleanupSocketRateLimits } from './socketRateLimiter.js';

export function setupSocketHandlers(io: Server) {
  // Use JWT authentication middleware
  io.use(socketAuthMiddleware);

  io.on('connection', async (socket: Socket) => {
    const authSocket = socket as AuthenticatedSocket;
    const { userId, username } = authSocket.data.user;

    // 1. Presence tracking: Register session
    const transitionedOnline = presenceService.addSession(userId, socket.id);

    // Notify user's active Universes if they transitioned to online
    if (transitionedOnline) {
      try {
        const universes = await universeService.getUserUniverses(userId);
        for (const u of universes) {
          io.to(u.id).emit('user_online', {
            userId,
            username,
            universeId: u.id,
            timestamp: new Date()
          });
        }
      } catch (err) {
        // Silent catch for presence notify
      }
    }

    // 2. Client Event: join_universe
    socket.on('join_universe', async (data: { universeId: string }, callback?: Function) => {
      try {
        const { universeId } = data || {};
        if (!universeId) {
          if (callback) callback({ error: 'Universe ID required' });
          return;
        }

        const isMember = await messageService.isUniverseMember(universeId, userId);
        if (!isMember) {
          socket.emit('error', { message: 'UNAUTHORIZED_JOIN: You do not belong to this Universe' });
          if (callback) callback({ error: 'Unauthorized Universe join attempt' });
          return;
        }

        socket.join(universeId);

        // Mark pending unread messages as read/delivered
        const readResult = await messageService.markRead(universeId, userId);
        if (readResult.markedIds.length > 0) {
          io.to(universeId).emit('message_read', {
            universeId,
            userId,
            messageIds: readResult.markedIds,
            readAt: readResult.readAt
          });
        }

        if (callback) callback({ status: 'joined', universeId });
      } catch (err: any) {
        socket.emit('error', { message: err.message || 'Error joining Universe' });
        if (callback) callback({ error: err.message });
      }
    });

    // 3. Client Event: leave_universe
    socket.on('leave_universe', (data: { universeId: string }, callback?: Function) => {
      const { universeId } = data || {};
      if (universeId) {
        socket.leave(universeId);
        if (callback) callback({ status: 'left', universeId });
      }
    });

    // 4. Client Event: send_message
    socket.on('send_message', async (data: any, callback?: Function) => {
      try {
        if (!checkSocketRateLimit(socket.id, 'send_message', 15, 5000)) {
          const errMsg = 'RATE_LIMIT_EXCEEDED: Sending messages too quickly';
          socket.emit('error', { message: errMsg });
          if (callback) callback({ error: errMsg });
          return;
        }

        const { universeId, content, type, metadata, replyToMessageId } = data || {};
        const message = await messageService.createMessage({
          universeId,
          senderId: userId,
          content,
          type,
          metadata,
          replyToMessageId
        });

        // Broadcast created message to room
        io.to(universeId).emit('message_created', message);

        if (callback) callback({ status: 'success', message });
      } catch (err: any) {
        socket.emit('error', { message: err.message || 'Failed to send message' });
        if (callback) callback({ error: err.message });
      }
    });

    // 5. Client Event: edit_message
    socket.on('edit_message', async (data: { messageId: string; newContent: string }, callback?: Function) => {
      try {
        if (!checkSocketRateLimit(socket.id, 'edit_message', 10, 5000)) {
          const errMsg = 'RATE_LIMIT_EXCEEDED: Editing messages too quickly';
          socket.emit('error', { message: errMsg });
          if (callback) callback({ error: errMsg });
          return;
        }

        const { messageId, newContent } = data || {};
        const updatedMessage = await messageService.editMessage(messageId, userId, newContent);

        io.to(updatedMessage.universeId).emit('message_updated', updatedMessage);

        if (callback) callback({ status: 'success', message: updatedMessage });
      } catch (err: any) {
        socket.emit('error', { message: err.message || 'Failed to edit message' });
        if (callback) callback({ error: err.message });
      }
    });

    // 6. Client Event: delete_message
    socket.on('delete_message', async (data: { messageId: string }, callback?: Function) => {
      try {
        if (!checkSocketRateLimit(socket.id, 'delete_message', 10, 5000)) {
          const errMsg = 'RATE_LIMIT_EXCEEDED: Deleting messages too quickly';
          socket.emit('error', { message: errMsg });
          if (callback) callback({ error: errMsg });
          return;
        }

        const { messageId } = data || {};
        const deletedMessage = await messageService.deleteMessage(messageId, userId);

        io.to(deletedMessage.universeId).emit('message_deleted', deletedMessage);

        if (callback) callback({ status: 'success', message: deletedMessage });
      } catch (err: any) {
        socket.emit('error', { message: err.message || 'Failed to delete message' });
        if (callback) callback({ error: err.message });
      }
    });

    // 7. Client Event: typing_start
    socket.on('typing_start', async (data: { universeId: string }) => {
      try {
        const { universeId } = data || {};
        if (!universeId) return;
        const isMember = await messageService.isUniverseMember(universeId, userId);
        if (isMember) {
          socket.to(universeId).emit('typing_started', {
            universeId,
            userId,
            username
          });
        }
      } catch (err) {
        // Silent catch for typing events
      }
    });

    // 8. Client Event: typing_stop
    socket.on('typing_stop', async (data: { universeId: string }) => {
      try {
        const { universeId } = data || {};
        if (!universeId) return;
        const isMember = await messageService.isUniverseMember(universeId, userId);
        if (isMember) {
          socket.to(universeId).emit('typing_stopped', {
            universeId,
            userId,
            username
          });
        }
      } catch (err) {
        // Silent catch
      }
    });

    // 9. Client Event: mark_read
    socket.on('mark_read', async (data: { universeId: string; messageIds?: string[] }, callback?: Function) => {
      try {
        const { universeId, messageIds } = data || {};
        const result = await messageService.markRead(universeId, userId, messageIds);

        if (result.markedIds.length > 0) {
          io.to(universeId).emit('message_read', {
            universeId,
            userId,
            messageIds: result.markedIds,
            readAt: result.readAt
          });
        }

        if (callback) callback({ status: 'success', markedCount: result.markedIds.length });
      } catch (err: any) {
        socket.emit('error', { message: err.message || 'Failed to mark read' });
        if (callback) callback({ error: err.message });
      }
    });

    // 10. Client Event: add_reaction
    socket.on('add_reaction', async (data: { messageId: string; emoji: string }, callback?: Function) => {
      try {
        if (!checkSocketRateLimit(socket.id, 'add_reaction', 15, 5000)) {
          const errMsg = 'RATE_LIMIT_EXCEEDED: Adding reactions too quickly';
          socket.emit('error', { message: errMsg });
          if (callback) callback({ error: errMsg });
          return;
        }

        const { messageId, emoji } = data || {};
        const { reaction, universeId } = await messageService.addReaction(messageId, userId, emoji);

        io.to(universeId).emit('reaction_added', {
          messageId,
          reaction,
          universeId
        });

        if (callback) callback({ status: 'success', reaction });
      } catch (err: any) {
        socket.emit('error', { message: err.message || 'Failed to add reaction' });
        if (callback) callback({ error: err.message });
      }
    });

    // 11. Client Event: remove_reaction
    socket.on('remove_reaction', async (data: { messageId: string }, callback?: Function) => {
      try {
        if (!checkSocketRateLimit(socket.id, 'remove_reaction', 15, 5000)) {
          const errMsg = 'RATE_LIMIT_EXCEEDED: Removing reactions too quickly';
          socket.emit('error', { message: errMsg });
          if (callback) callback({ error: errMsg });
          return;
        }

        const { messageId } = data || {};
        const { universeId } = await messageService.removeReaction(messageId, userId);

        io.to(universeId).emit('reaction_removed', {
          messageId,
          userId,
          universeId
        });

        if (callback) callback({ status: 'success', messageId, userId });
      } catch (err: any) {
        socket.emit('error', { message: err.message || 'Failed to remove reaction' });
        if (callback) callback({ error: err.message });
      }
    });

    // 12. Handle Disconnect
    socket.on('disconnect', async () => {
      cleanupSocketRateLimits(socket.id);
      const transitionedOffline = presenceService.removeSession(userId, socket.id);
      if (transitionedOffline) {
        try {
          const universes = await universeService.getUserUniverses(userId);
          const lastSeen = presenceService.getLastSeen(userId);
          for (const u of universes) {
            io.to(u.id).emit('user_offline', {
              userId,
              username,
              universeId: u.id,
              lastSeen
            });
          }
        } catch (err) {
          // Silent catch
        }
      }
    });
  });
}
