import api from './api'
import type { Category, Zone } from '../types'

export const catalogService = {
  getZones: async (signal?: AbortSignal): Promise<Zone[]> => {
    const response = await api.get<Zone[]>('/zones', { signal })
    return response.data
  },

  getCategories: async (signal?: AbortSignal): Promise<Category[]> => {
    const response = await api.get<Category[]>('/categories', { signal })
    return response.data
  },
}