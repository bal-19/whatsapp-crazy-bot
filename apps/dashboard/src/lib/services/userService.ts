import type { CreateUserRequest, UpdateUserRequest, User } from '@whatsapp-bot/shared';
import { api } from '../api';

export const userService = {
  async getAll(): Promise<User[]> {
    const response = await api.get<{ data: User[] }>('/users');
    return response.data.data;
  },
  async create(payload: CreateUserRequest): Promise<User> {
    const response = await api.post<User>('/users', payload);
    return response.data;
  },
  async update(userId: string, payload: UpdateUserRequest): Promise<User> {
    const response = await api.put<User>(`/users/${encodeURIComponent(userId)}`, payload);
    return response.data;
  },
  async remove(userId: string): Promise<void> {
    await api.delete(`/users/${encodeURIComponent(userId)}`);
  }
};
