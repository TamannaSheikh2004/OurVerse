import prisma from '../db/prisma.js';

export class UniverseService {
  /**
   * Returns all active Universes for a given user.
   */
  async getUserUniverses(userId: string) {
    const memberships = await prisma.universeMember.findMany({
      where: { userId },
      select: { universeId: true }
    });

    const universeIds = memberships.map((m: { universeId: string }) => m.universeId);

    const universes = await prisma.universe.findMany({
      where: { id: { in: universeIds } }
    });

    return universes;
  }
}

export const universeService = new UniverseService();
export default universeService;
