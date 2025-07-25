import axios from '@/lib/axios'

export interface Vehicle {
  id: string
  license_plate: string
  vin?: string
  make: string
  model: string
  year: number
  color?: string
  mileage?: number
  status: 'pending' | 'inspecting' | 'completed' | 'delivered'
  check_in_date: string
  check_out_date?: string
  created_at: string
  updated_at: string
}

export const vehicleService = {
  async getVehicles(params?: { status?: string; search?: string }) {
    const response = await axios.get('/api/v1/vehicles', { params })
    return response.data
  },

  async getVehicle(id: string) {
    const response = await axios.get(`/api/v1/vehicles/${id}`)
    return response.data
  },

  async createVehicle(data: Partial<Vehicle>) {
    const response = await axios.post('/api/v1/vehicles', data)
    return response.data
  },

  async updateVehicle(id: string, data: Partial<Vehicle>) {
    const response = await axios.put(`/api/v1/vehicles/${id}`, data)
    return response.data
  }
}