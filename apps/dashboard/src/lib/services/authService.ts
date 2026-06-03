import type { LoginRequest, LoginResponse } from '@whatsapp-bot/shared';
import { api } from '../api';

export const authService = {
  async login(data: LoginRequest): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>('/auth/login', data);
    return response.data;
  }
};
