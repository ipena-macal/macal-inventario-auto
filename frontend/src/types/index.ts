export interface Vehicle {
  id: string
  licensePlate: string
  vin?: string
  make: string
  model: string
  year: number
  color: string
  mileage: number
  status: string
  checkInDate: string
  checkOutDate?: string
  photos?: any[]
  inspections?: any[]
}

export interface Inspection {
  id: string
  vehicleId: string
  type: string
  status: string
  startedAt: string
  completedAt?: string
}