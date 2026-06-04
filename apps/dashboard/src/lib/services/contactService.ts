import type {
  Contact,
  CreateContactRequest,
  UpdateContactRequest
} from '@whatsapp-bot/shared';
import { api } from '../api';

export const contactService = {
  async getAll(): Promise<Contact[]> {
    const response = await api.get<{ data: Contact[] }>('/contacts');
    return response.data.data;
  },
  async getById(contactId: string): Promise<Contact> {
    const response = await api.get<Contact>(`/contacts/${encodeURIComponent(contactId)}`);
    return response.data;
  },
  async create(payload: CreateContactRequest): Promise<Contact> {
    const response = await api.post<Contact>('/contacts', payload);
    return response.data;
  },
  async update(contactId: string, payload: UpdateContactRequest): Promise<Contact> {
    const response = await api.put<Contact>(`/contacts/${encodeURIComponent(contactId)}`, payload);
    return response.data;
  },
  async remove(contactId: string): Promise<void> {
    await api.delete(`/contacts/${encodeURIComponent(contactId)}`);
  }
};
