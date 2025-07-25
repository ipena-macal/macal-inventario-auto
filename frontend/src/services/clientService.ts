import axios from '@/lib/axios'

export const clientService = {
  async getClientInfo() {
    const response = await axios.get('/api/v1/client/info')
    return response.data
  },

  async getVehicles(params?: any) {
    const response = await axios.get('/api/v1/vehicles', { params })
    return response.data
  },

  async getStats() {
    const response = await axios.get('/api/v1/client/stats')
    return response.data
  }
}