import { randomUUID } from 'expo-crypto';

export type EntityId = string;

/** Client-generated UUID v4, so records created offline never collide after a future sync. */
export function createId(): EntityId {
  return randomUUID();
}
