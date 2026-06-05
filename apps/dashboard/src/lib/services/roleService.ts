import type { CreateRoleRequest, Role, UpdateRoleRequest } from '@whatsapp-bot/shared';
import { api } from '../api';

export const roleService = {
  async getAll(): Promise<Role[]> {
    const response = await api.get<{ data: Role[] }>('/roles');
    return response.data.data;
  },
  async create(payload: CreateRoleRequest): Promise<Role> {
    const response = await api.post<Role>('/roles', payload);
    return response.data;
  },
  async update(roleId: string, payload: UpdateRoleRequest): Promise<Role> {
    const response = await api.put<Role>(`/roles/${encodeURIComponent(roleId)}`, payload);
    return response.data;
  },
  async remove(roleId: string): Promise<void> {
    await api.delete(`/roles/${encodeURIComponent(roleId)}`);
  }
};
