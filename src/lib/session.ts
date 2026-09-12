import { cookies } from 'next/headers';
import { RelationalDatabase } from '../adapters/db/database';
import { DEMO_USERS } from './constants';

export { DEMO_USERS };

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const userIdCookie = cookieStore.get('lld_demo_user_id')?.value;

  const currentUserId = userIdCookie || 'user_alice';
  const db = RelationalDatabase.getInstance();
  const user = db.getUserById(currentUserId);

  if (user) {
    return user;
  }

  return DEMO_USERS[0];
}

export function getCurrentUserSync(cookieUserId?: string) {
  const db = RelationalDatabase.getInstance();
  const targetId = cookieUserId || 'user_alice';
  const user = db.getUserById(targetId);
  return user || DEMO_USERS[0];
}
