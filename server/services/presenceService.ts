/**
 * In-memory Presence & Socket Session Tracker for OurVerse
 * Tracks active socket sessions per user and online/offline status.
 */

class PresenceService {
  // Map of userId -> Set of active socket IDs
  private userSockets: Map<string, Set<string>> = new Map();
  // Map of userId -> Last seen timestamp
  private lastSeenMap: Map<string, Date> = new Map();

  /**
   * Adds a socket connection for a user.
   * Returns true if user transitioned from offline to online.
   */
  public addSession(userId: string, socketId: string): boolean {
    let sessions = this.userSockets.get(userId);
    const isNewOnline = !sessions || sessions.size === 0;

    if (!sessions) {
      sessions = new Set<string>();
      this.userSockets.set(userId, sessions);
    }
    sessions.add(socketId);
    return isNewOnline;
  }

  /**
   * Removes a socket connection for a user.
   * Returns true if user transitioned from online to offline.
   */
  public removeSession(userId: string, socketId: string): boolean {
    const sessions = this.userSockets.get(userId);
    if (!sessions) return false;

    sessions.delete(socketId);
    if (sessions.size === 0) {
      this.userSockets.delete(userId);
      this.lastSeenMap.set(userId, new Date());
      return true;
    }
    return false;
  }

  /**
   * Checks if a user is currently online.
   */
  public isUserOnline(userId: string): boolean {
    const sessions = this.userSockets.get(userId);
    return !!sessions && sessions.size > 0;
  }

  /**
   * Gets last seen timestamp for a user.
   */
  public getLastSeen(userId: string): Date | null {
    if (this.isUserOnline(userId)) {
      return new Date();
    }
    return this.lastSeenMap.get(userId) || null;
  }

  /**
   * Returns presence status object for a given user.
   */
  public getUserPresence(userId: string) {
    const isOnline = this.isUserOnline(userId);
    return {
      userId,
      isOnline,
      lastSeen: isOnline ? new Date() : (this.lastSeenMap.get(userId) || null)
    };
  }
}

export const presenceService = new PresenceService();
export default presenceService;
