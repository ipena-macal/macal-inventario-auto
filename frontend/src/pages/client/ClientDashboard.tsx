import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { 
  Car, Download, Search,
  CheckCircle, Clock, TrendingUp
} from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

// Components
import { VehicleCard } from '@/components/client/VehicleCard'
import { InspectionModal } from '@/components/client/InspectionModal'
import { PhotoGallery } from '@/components/client/PhotoGallery'
import { ExportModal } from '@/components/client/ExportModal'

// Services
import { clientService } from '@/services/clientService'

// Types
interface Vehicle {
  id: string
  licensePlate: string
  make: string
  model: string
  year: number
  status: string
}

export const ClientDashboard: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [dateRange, setDateRange] = useState({ from: '', to: '' })
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)
  const [showInspection, setShowInspection] = useState(false)
  const [showPhotos, setShowPhotos] = useState(false)
  const [showExport, setShowExport] = useState(false)

  // Fetch client info
  const { data: clientInfo } = useQuery({
    queryKey: ['client-info'],
    queryFn: () => clientService.getClientInfo()
  })

  // Fetch vehicles with filters
  const { data: vehicles, isLoading } = useQuery({
    queryKey: ['client-vehicles', statusFilter, dateRange],
    queryFn: () => clientService.getVehicles({
      status: statusFilter === 'all' ? undefined : statusFilter,
      dateFrom: dateRange.from || undefined,
      dateTo: dateRange.to || undefined
    })
  })

  // Fetch stats
  const { data: stats } = useQuery({
    queryKey: ['client-stats'],
    queryFn: () => clientService.getStats()
  })

  // Filter vehicles by search
  const filteredVehicles = vehicles?.filter((v: any) => 
    v.licensePlate?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.vin?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.make?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.model?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with client branding */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {clientInfo?.logo && (
                <img 
                  src={clientInfo.logo} 
                  alt={clientInfo.name}
                  className="h-12 w-auto"
                />
              )}
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Portal de Vehículos - {clientInfo?.name}
                </h1>
                <p className="text-sm text-gray-600">
                  Sistema de consulta de inventario vehicular MACAL
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500">
                Último acceso: {format(new Date(), 'dd/MM/yyyy HH:mm', { locale: es })}
              </span>
              {clientInfo?.permissions.canDownloadReports && (
                <button
                  onClick={() => setShowExport(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Download size={20} />
                  Exportar
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Stats */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Vehículos</p>
                <p className="text-2xl font-bold">{stats?.totalVehicles || 0}</p>
              </div>
              <Car className="text-blue-600" size={32} />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">En Inspección</p>
                <p className="text-2xl font-bold">{stats?.inInspection || 0}</p>
              </div>
              <Clock className="text-yellow-600" size={32} />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completados</p>
                <p className="text-2xl font-bold">{stats?.completed || 0}</p>
              </div>
              <CheckCircle className="text-green-600" size={32} />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Este Mes</p>
                <p className="text-2xl font-bold">{stats?.thisMonth || 0}</p>
              </div>
              <TrendingUp className="text-purple-600" size={32} />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 pb-6">
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Buscar por patente, VIN, marca..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg"
              />
            </div>

            {/* Status filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border rounded-lg"
            >
              <option value="all">Todos los estados</option>
              <option value="pending">Pendiente</option>
              <option value="inspecting">En inspección</option>
              <option value="completed">Completado</option>
              <option value="delivered">Entregado</option>
            </select>

            {/* Date from */}
            <input
              type="date"
              value={dateRange.from}
              onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
              className="px-4 py-2 border rounded-lg"
              placeholder="Desde"
            />

            {/* Date to */}
            <input
              type="date"
              value={dateRange.to}
              onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
              className="px-4 py-2 border rounded-lg"
              placeholder="Hasta"
            />
          </div>
        </div>
      </div>

      {/* Vehicle list */}
      <div className="max-w-7xl mx-auto px-4 pb-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredVehicles?.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Car className="mx-auto text-gray-400 mb-4" size={48} />
            <p className="text-gray-500">No se encontraron vehículos</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVehicles?.map((vehicle: any) => (
              <VehicleCard
                key={vehicle.id}
                vehicle={vehicle}
                permissions={clientInfo?.permissions}
                onViewDetails={() => setSelectedVehicle(vehicle)}
                onViewInspection={() => {
                  setSelectedVehicle(vehicle)
                  setShowInspection(true)
                }}
                onViewPhotos={() => {
                  setSelectedVehicle(vehicle)
                  setShowPhotos(true)
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {selectedVehicle && showInspection && (
        <InspectionModal
          vehicle={selectedVehicle}
          onClose={() => setShowInspection(false)}
        />
      )}

      {selectedVehicle && showPhotos && (
        <PhotoGallery
          vehicle={selectedVehicle}
          onClose={() => setShowPhotos(false)}
        />
      )}

      {showExport && (
        <ExportModal
          vehicles={filteredVehicles || []}
          onClose={() => setShowExport(false)}
        />
      )}
    </div>
  )
}