export interface DemoUser {
  id: string;
  name: string;
  email: string;
}

export const DEMO_USERS: DemoUser[] = [
  { id: 'user_alice', name: 'Alice Developer', email: 'alice@cipherschools.practice' },
  { id: 'user_bob', name: 'Bob Systems', email: 'bob@cipherschools.practice' },
];
