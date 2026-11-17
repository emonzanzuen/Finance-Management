import { Expo, type ExpoPushMessage } from 'expo-server-sdk';
import { prisma } from './prisma';

export type PushEvent = { userId: string; type: 'budget_warning' | 'budget_exceeded' | 'goal_completed' };

const expo = new Expo();

function messageFor(type: PushEvent['type'], locale: string): Pick<ExpoPushMessage, 'title' | 'body' | 'data'> {
  const english = locale === 'en';
  if (type === 'goal_completed') {
    return {
      title: english ? 'Savings goal completed' : 'Target tabungan tercapai',
      body: english ? 'You reached a savings goal.' : 'Anda telah mencapai target tabungan.',
      data: { targetScreen: 'savings' },
    };
  }
  return {
    title: english ? 'Budget update' : 'Pembaruan budget',
    body: type === 'budget_exceeded'
      ? (english ? 'A budget has exceeded its limit.' : 'Sebuah budget telah melewati batas.')
      : (english ? 'A budget is close to its limit.' : 'Penggunaan sebuah budget mendekati batas.'),
    data: { targetScreen: 'budget' },
  };
}

/** Best-effort delivery: callers invoke this only after the database transaction commits. */
export async function dispatchPushNotifications(events: PushEvent[]): Promise<void> {
  if (!events.length) return;
  try {
    const recipients = await prisma.deviceToken.findMany({
      where: { userId: { in: [...new Set(events.map((event) => event.userId))] } },
      select: { id: true, userId: true, expoPushToken: true, locale: true },
    });
    const messages: ExpoPushMessage[] = [];
    const recipientIds: string[] = [];
    for (const event of events) {
      for (const device of recipients) {
        if (device.userId !== event.userId || !Expo.isExpoPushToken(device.expoPushToken)) continue;
        messages.push({
          to: device.expoPushToken,
          sound: 'default',
          ...messageFor(event.type, device.locale),
        });
        recipientIds.push(device.id);
      }
    }
    for (const chunk of expo.chunkPushNotifications(messages)) {
      const tickets = await expo.sendPushNotificationsAsync(chunk);
      const start = messages.indexOf(chunk[0]!);
      for (let index = 0; index < tickets.length; index += 1) {
        const ticket = tickets[index];
        if (ticket?.status === 'error' && ticket.details?.error === 'DeviceNotRegistered') {
          const deviceId = recipientIds[start + index];
          if (deviceId) await prisma.deviceToken.deleteMany({ where: { id: deviceId } });
        }
      }
    }
  } catch {
    // Push delivery is deliberately best-effort and never affects a financial write.
  }
}

export function schedulePushNotifications(events: PushEvent[]): void {
  if (events.length) void dispatchPushNotifications(events);
}
