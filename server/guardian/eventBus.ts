import EventEmitter from 'events';
import prisma from '../db/prisma.js';
import { generateEventId } from './utils/guardianIdGen.js';
import { GuardianEventType, EventPayload } from './types.js';

export type EventSubscriber = (payload: EventPayload) => Promise<void> | void;

export class GuardianEventBus {
  private emitter: EventEmitter;
  private subscribers: Map<GuardianEventType, Set<EventSubscriber>>;

  constructor() {
    this.emitter = new EventEmitter();
    this.emitter.setMaxListeners(50);
    this.subscribers = new Map();
  }

  /**
   * Subscribes a handler function to a specific Guardian event type.
   */
  public subscribe(eventType: GuardianEventType, subscriber: EventSubscriber) {
    let subs = this.subscribers.get(eventType);
    if (!subs) {
      subs = new Set();
      this.subscribers.set(eventType, subs);
    }
    subs.add(subscriber);

    this.emitter.on(eventType, async (payload: EventPayload) => {
      try {
        await subscriber(payload);
      } catch (err) {
        console.error(`[EventBus] Subscriber error for event ${eventType}:`, err);
      }
    });
  }

  /**
   * Publishes an event to the internal bus asynchronously.
   * Stores GuardianEvent in database and notifies subscribers out-of-band.
   */
  public publish(eventType: GuardianEventType, payload: Omit<EventPayload, 'eventType'>): string {
    const eventId = generateEventId();
    const fullPayload: EventPayload = {
      eventId,
      eventType,
      ...payload
    };

    // Asynchronous database persistence & listener trigger
    setImmediate(async () => {
      try {
        const payloadStr = JSON.stringify(fullPayload.data || fullPayload);

        await prisma.guardianEvent.create({
          data: {
            eventId,
            eventType,
            universeId: payload.universeId,
            messageId: payload.messageId || null,
            payload: payloadStr,
            status: 'PENDING'
          }
        });

        // Trigger local listeners
        this.emitter.emit(eventType, fullPayload);
      } catch (err) {
        console.error(`[EventBus] Failed to persist event ${eventType} (${eventId}):`, err);
      }
    });

    return eventId;
  }
}

export const guardianEventBus = new GuardianEventBus();
export default guardianEventBus;
