import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { 
  ArrowLeft, Car, Calendar, Gauge, FileText, 
  Camera, Edit, Trash2, Clock, CheckCircle, 
  AlertCircle, User, MapPin, Hash
} from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { vehicleService } from '@/services/vehicleService'
import { useAuthStore } from '@/stores/authStore'
import toast from 'react-hot-toast'

export const VehicleDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()

  const { data: vehicle, isLoading, error } = useQuery({
    queryKey: ['vehicle', id],
    queryFn: () => vehicleService.getVehicle(id!),
    enabled: !!id
  })

  const handleInspect = () => {
    navigate(`/inspections/new?vehicleId=${id}`)
  }

  const handleEdit = () => {
    toast.success('Funcionalidad de edición próximamente')
  }

  const handleDelete = async () => {
    if (confirm('¿Estás seguro de eliminar este vehículo?')) {
      toast.error('Funcionalidad de eliminación próximamente')
    }
  }

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
      case 'pending': return <Clock className="w-5 h-5" />
      case 'inspecting': return <AlertCircle className="w-5 h-5" />
      case 'completed': return <CheckCircle className="w-5 h-5" />
      default: return <Clock className="w-5 h-5" />
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error || !vehicle) {
    return (
      <div className="p-6">
        <button
          onClick={() => navigate('/vehicles')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft size={20} />
          Volver a vehículos
        </button>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">Error al cargar vehículo</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/vehicles')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft size={20} />
          Volver a vehículos
        </button>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">{vehicle.license_plate}</h1>
            <p className="text-xl text-gray-600">
              {vehicle.make} {vehicle.model} {vehicle.year}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className={`px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 ${getStatusColor(vehicle.status)}`}>
              {getStatusIcon(vehicle.status)}
              {getStatusText(vehicle.status)}
            </span>

            <div className="flex gap-2">
              {user?.permissions?.edit_vehicles && (
                <button
                  onClick={handleEdit}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
                  title="Editar"
                >
                  <Edit size={20} />
                </button>
              )}
              {user?.permissions?.delete_vehicles && (
                <button
                  onClick={handleDelete}
                  className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded"
                  title="Eliminar"
                >
                  <Trash2 size={20} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Vehicle Details */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Car className="text-gray-600" size={20} />
              Información del Vehículo
            </h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Patente</p>
                <p className="font-medium">{vehicle.license_plate}</p>
              </div>
              {vehicle.vin && (
                <div>
                  <p className="text-sm text-gray-500">VIN</p>
                  <p className="font-medium">{vehicle.vin}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-500">Marca</p>
                <p className="font-medium">{vehicle.make}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Modelo</p>
                <p className="font-medium">{vehicle.model}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Año</p>
                <p className="font-medium">{vehicle.year}</p>
              </div>
              {vehicle.color && (
                <div>
                  <p className="text-sm text-gray-500">Color</p>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full border" style={{ backgroundColor: vehicle.color.toLowerCase() }}></div>
                    <p className="font-medium">{vehicle.color}</p>
                  </div>
                </div>
              )}
              {vehicle.mileage && (
                <div>
                  <p className="text-sm text-gray-500">Kilometraje</p>
                  <p className="font-medium">{vehicle.mileage.toLocaleString()} km</p>
                </div>
              )}
            </div>
          </div>

          {/* Dates */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Calendar className="text-gray-600" size={20} />
              Fechas
            </h2>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Fecha de ingreso:</span>
                <span className="font-medium">
                  {format(new Date(vehicle.check_in_date || vehicle.created_at), 'dd/MM/yyyy HH:mm', { locale: es })}
                </span>
              </div>
              {vehicle.check_out_date && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Fecha de salida:</span>
                  <span className="font-medium">
                    {format(new Date(vehicle.check_out_date), 'dd/MM/yyyy HH:mm', { locale: es })}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Última actualización:</span>
                <span className="font-medium">
                  {format(new Date(vehicle.updated_at), 'dd/MM/yyyy HH:mm', { locale: es })}
                </span>
              </div>
            </div>
          </div>

          {/* Photos Placeholder */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Camera className="text-gray-600" size={20} />
              Fotografías
            </h2>
            <div className="text-center py-8">
              <Camera className="mx-auto text-gray-400 mb-3" size={48} />
              <p className="text-gray-500">No hay fotos disponibles</p>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Actions */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Acciones</h2>
            <div className="space-y-3">
              {user?.permissions?.create_inspections && vehicle.status === 'pending' && (
                <button
                  onClick={handleInspect}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <FileText size={20} />
                  Iniciar Inspección
                </button>
              )}
              <button
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                <Camera size={20} />
                Ver Fotos
              </button>
              <button
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                <FileText size={20} />
                Generar Reporte
              </button>
            </div>
          </div>

          {/* Inspections History */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FileText className="text-gray-600" size={20} />
              Historial de Inspecciones
            </h2>
            <div className="text-center py-8">
              <FileText className="mx-auto text-gray-400 mb-3" size={48} />
              <p className="text-gray-500">No hay inspecciones registradas</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}