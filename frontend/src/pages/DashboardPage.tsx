import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Car, FileText, Camera, Users } from 'lucide-react'

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate()
  
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Vehículos</p>
              <p className="text-2xl font-bold">48</p>
            </div>
            <Car className="text-blue-600" size={32} />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Inspecciones Hoy</p>
              <p className="text-2xl font-bold">12</p>
            </div>
            <FileText className="text-green-600" size={32} />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Fotos Capturadas</p>
              <p className="text-2xl font-bold">384</p>
            </div>
            <Camera className="text-purple-600" size={32} />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Clientes Activos</p>
              <p className="text-2xl font-bold">23</p>
            </div>
            <Users className="text-orange-600" size={32} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Vehicles */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Vehículos Recientes</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <div>
                <p className="font-medium">GFKL-82</p>
                <p className="text-sm text-gray-600">Toyota Corolla 2022</p>
              </div>
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Completado</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <div>
                <p className="font-medium">HXRT-93</p>
                <p className="text-sm text-gray-600">Nissan Versa 2023</p>
              </div>
              <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">En Inspección</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <div>
                <p className="font-medium">JKLM-45</p>
                <p className="text-sm text-gray-600">Chevrolet Sail 2021</p>
              </div>
              <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">Pendiente</span>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Actividad Reciente</h2>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">Inspección completada</p>
                <p className="text-xs text-gray-600">GFKL-82 - Toyota Corolla • Hace 2 horas</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">Nuevo vehículo ingresado</p>
                <p className="text-xs text-gray-600">MNOP-67 - Hyundai Accent • Hace 4 horas</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">384 fotos capturadas</p>
                <p className="text-xs text-gray-600">Total acumulado del día • Hace 5 horas</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6 mt-6">
        <h2 className="text-xl font-semibold mb-4">Acciones Rápidas</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button 
            onClick={() => navigate('/vehicles')}
            className="p-4 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors">
            <Car className="mx-auto mb-2" size={24} />
            <span className="text-sm font-medium">Nuevo Vehículo</span>
          </button>
          <button 
            onClick={() => navigate('/inspections')}
            className="p-4 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors">
            <FileText className="mx-auto mb-2" size={24} />
            <span className="text-sm font-medium">Nueva Inspección</span>
          </button>
          <button 
            onClick={() => navigate('/vehicles')}
            className="p-4 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors">
            <Camera className="mx-auto mb-2" size={24} />
            <span className="text-sm font-medium">Capturar Fotos</span>
          </button>
          <button 
            onClick={() => navigate('/admin/clients')}
            className="p-4 bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 transition-colors">
            <Users className="mx-auto mb-2" size={24} />
            <span className="text-sm font-medium">Ver Clientes</span>
          </button>
        </div>
      </div>
    </div>
  )
}