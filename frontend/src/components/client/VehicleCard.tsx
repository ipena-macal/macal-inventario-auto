import React from 'react'
import { FileText, Camera, Info, Calendar, Gauge } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

interface VehicleCardProps {
  vehicle: any
  permissions: any
  onViewDetails: () => void
  onViewInspection: () => void
  onViewPhotos: () => void
}

export const VehicleCard: React.FC<VehicleCardProps> = ({
  vehicle,
  permissions,
  onViewDetails,
  onViewInspection,
  onViewPhotos
}) => {
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

  return (
    <div className="bg-white rounded-lg shadow-sm hover:shadow-lg transition-shadow">
      {/* Vehicle image */}
      <div className="relative h-48 bg-gray-200 rounded-t-lg overflow-hidden">
        {vehicle.photos?.[0] ? (
          <img 
            src={vehicle.photos[0].thumbnail} 
            alt={`${vehicle.make} ${vehicle.model}`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <Camera className="text-gray-400" size={48} />
          </div>
        )}
        
        {/* Status badge */}
        <div className="absolute top-3 right-3">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(vehicle.status)}`}>
            {getStatusText(vehicle.status)}
          </span>
        </div>

        {/* License plate */}
        <div className="absolute bottom-3 left-3 bg-white px-3 py-1 rounded shadow">
          <p className="font-bold text-lg">{vehicle.licensePlate}</p>
        </div>
      </div>

      {/* Vehicle info */}
      <div className="p-4">
        <h3 className="text-lg font-semibold mb-2">
          {vehicle.make} {vehicle.model} {vehicle.year}
        </h3>

        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Calendar size={16} />
            <span>Ingreso: {format(parseISO(vehicle.checkInDate), 'dd/MM/yyyy', { locale: es })}</span>
          </div>
          
          {vehicle.mileage && (
            <div className="flex items-center gap-2">
              <Gauge size={16} />
              <span>{vehicle.mileage.toLocaleString()} km</span>
            </div>
          )}

          {vehicle.vin && (
            <div className="flex items-center gap-2">
              <Info size={16} />
              <span className="text-xs">VIN: {vehicle.vin}</span>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="mt-4 flex gap-2">
          <button
            onClick={onViewDetails}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-sm"
          >
            <Info size={16} />
            Detalles
          </button>
          
          {permissions?.canViewInspections && vehicle.inspections?.length > 0 && (
            <button
              onClick={onViewInspection}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-sm"
            >
              <FileText size={16} />
              Inspección
            </button>
          )}
          
          {permissions?.canViewPhotos && vehicle.photos?.length > 0 && (
            <button
              onClick={onViewPhotos}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-purple-100 text-purple-700 rounded hover:bg-purple-200 text-sm"
            >
              <Camera size={16} />
              Fotos
            </button>
          )}
        </div>
      </div>
    </div>
  )
}