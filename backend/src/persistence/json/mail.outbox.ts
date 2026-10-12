import { randomUUID } from 'node:crypto';
import { updateLocalData } from './local.store.js';

export async function saveLocalMail(kind: 'invite' | 'password-reset', email: string, url: string) {
  const message = { id: randomUUID(), kind, email, url, createdAt: new Date().toISOString() };

  await updateLocalData(data => {
    data.outbox.push(message);
  });

  return { success: true, data: { id: message.id } };
}