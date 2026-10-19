import { apiFetch } from './api';
import type { LoginInput, RegisterInput, User } from './types';

type UserResponse = { user: User };

export async function getMe(): Promise<User> {
  const { user } = await apiFetch<UserResponse>('/auth/me');
  return user;
}

export async function login(input: LoginInput): Promise<User> {
  const { user } = await apiFetch<UserResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return user;
}

export async function register(input: RegisterInput): Promise<User> {
  const { user } = await apiFetch<UserResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return user;
}

export async function logout(): Promise<void> {
  await apiFetch('/auth/logout', { method: 'POST' });
}
