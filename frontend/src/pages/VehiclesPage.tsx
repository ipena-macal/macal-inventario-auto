import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { 
  Car, Search, Plus, FileText, Eye, Clock, 
  CheckCircle, AlertCircle, Calendar, Gauge 
} from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { vehicleService } from '@/services/vehicleService'
import { useAuthStore } from '@/stores/authStore'

export const VehiclesPage: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const { data: vehicles, isLoading, error } = useQuery({
    queryKey: ['vehicles', statusFilter, searchQuery],
    queryFn: () => vehicleService.getVehicles({
      status: statusFilter === 'all' ? undefined : statusFilter,
      search: searchQuery || undefined
    })
  })

  const filteredVehicles = vehicles || []

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-gray-100 text-gray-800'
      case 'inspecting': return 'bg-yellow-100 text-yellow-800'
      case 'completed': return 'bg-green-100 text-green-800'
      case 'delivered': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendiente'
      case 'inspecting': return 'En Inspección'
      case 'completed': return 'Completado'
      case 'delivered': return 'Entregado'
      default: return status
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />
      case 'inspecting': return <AlertCircle className="w-4 h-4" />
      case 'completed': return <CheckCircle className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  const handleViewDetails = (vehicleId: string) => {
    navigate(`/vehicles/${vehicleId}`)
  }

  const handleInspect = (vehicleId: string) => {
    navigate(`/inspections/new?vehicleId=${vehicleId}`)
  }

  const handleNewVehicle = () => {
    navigate('/vehicles/new')
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">Error al cargar vehículos</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold">Vehículos</h1>
          {user?.permissions?.create_vehicles && (
            <button
              onClick={handleNewVehicle}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus size={20} />
              Nuevo Vehículo
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar por patente, marca, modelo..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todos los estados</option>
            <option value="pending">Pendiente</option>
            <option value="inspecting">En inspección</option>
            <option value="completed">Completado</option>
            <option value="delivered">Entregado</option>
          </select>
        </div>
      </div>

      {/* Vehicle Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : filteredVehicles.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Car className="mx-auto text-gray-400 mb-4" size={48} />
          <p className="text-gray-500">No se encontraron vehículos</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVehicles.map((vehicle: any) => (
            <div key={vehicle.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-semibold">
                      {vehicle.license_plate}
                    </h3>
                    <p className="text-gray-600">
                      {vehicle.make} {vehicle.model} {vehicle.year}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(vehicle.status)}`}>
                    {getStatusIcon(vehicle.status)}
                    {getStatusText(vehicle.status)}
                  </span>
                </div>

                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  <div className="flex items-center gap-2">
                    <Calendar size={16} />
                    <span>Ingreso: {vehicle.created_at ? format(new Date(vehicle.created_at), 'dd/MM/yyyy', { locale: es }) : 'N/A'}</span>
                  </div>
                  
                  {vehicle.mileage && (
                    <div className="flex items-center gap-2">
                      <Gauge size={16} />
                      <span>{vehicle.mileage.toLocaleString()} km</span>
                    </div>
                  )}

                  {vehicle.color && (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full border" style={{ backgroundColor: vehicle.color.toLowerCase() }}></div>
                      <span>{vehicle.color}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleViewDetails(vehicle.id)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                  >
                    <Eye size={16} />
                    Ver Detalle
                  </button>
                  
                  {user?.permissions?.create_inspections && vehicle.status === 'pending' && (
                    <button
                      onClick={() => handleInspect(vehicle.id)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      <FileText size={16} />
                      Inspeccionar
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}