import React, { useState } from 'react'
import { 
  Plus, Edit, Trash2, Key, Shield, Eye, EyeOff,
  Building, Mail, Phone, Calendar, Activity, Copy, Car
} from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { toast } from 'react-hot-toast'

export const ClientManagementPage: React.FC = () => {
  const [clients] = useState([
    {
      id: '1',
      name: 'Banco Santander',
      email: 'client@bank.cl',
      phone: '+56 2 2345 6789',
      active: true,
      vehicles: 15,
      lastAccess: new Date('2025-07-25T10:00:00'),
      permissions: {
        canViewInspections: true,
        canViewPhotos: true,
        canDownloadReports: true
      }
    },
    {
      id: '2',
      name: 'Seguros Falabella',
      email: 'contacto@seguros.cl',
      phone: '+56 2 3456 7890',
      active: true,
      vehicles: 8,
      lastAccess: new Date('2025-07-24T15:30:00'),
      permissions: {
        canViewInspections: true,
        canViewPhotos: false,
        canDownloadReports: false
      }
    }
  ])

  const [showNewClientModal, setShowNewClientModal] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [selectedClient, setSelectedClient] = useState<any>(null)

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%'
    let password = ''
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return password
  }

  const handleResetPassword = () => {
    const newPassword = generatePassword()
    navigator.clipboard.writeText(newPassword)
    toast.success(`Nueva contraseña generada y copiada: ${newPassword}`)
    setShowPasswordModal(false)
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Gestión de Clientes</h1>
          <p className="text-gray-600">Administra el acceso de clientes externos al sistema</p>
        </div>
        <button
          onClick={() => setShowNewClientModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus size={20} />
          Nuevo Cliente
        </button>
      </div>

      {/* Clients Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {clients.map((client) => (
          <div key={client.id} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Building className="text-blue-600" size={24} />
                </div>
                <div>
                  <h3 className="font-semibold">{client.name}</h3>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    client.active 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {client.active ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2 text-sm text-gray-600 mb-4">
              <div className="flex items-center gap-2">
                <Mail size={16} />
                <span>{client.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone size={16} />
                <span>{client.phone}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar size={16} />
                <span>Último acceso: {format(client.lastAccess, 'dd/MM/yyyy HH:mm', { locale: es })}</span>
              </div>
              <div className="flex items-center gap-2">
                <Car size={16} />
                <span>{client.vehicles} vehículos asignados</span>
              </div>
            </div>

            <div className="border-t pt-4">
              <p className="text-sm font-medium mb-2">Permisos:</p>
              <div className="flex flex-wrap gap-2">
                {client.permissions.canViewInspections && (
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    Ver Inspecciones
                  </span>
                )}
                {client.permissions.canViewPhotos && (
                  <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                    Ver Fotos
                  </span>
                )}
                {client.permissions.canDownloadReports && (
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                    Descargar Reportes
                  </span>
                )}
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <button
                onClick={() => {
                  setSelectedClient(client)
                  toast.success('Editando cliente')
                }}
                className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
              >
                <Edit size={16} />
                Editar
              </button>
              <button
                onClick={() => {
                  setSelectedClient(client)
                  setShowPasswordModal(true)
                }}
                className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
              >
                <Key size={16} />
                Contraseña
              </button>
              <button
                onClick={() => toast.error('¿Seguro que deseas eliminar este cliente?')}
                className="p-2 text-red-600 hover:bg-red-50 rounded"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Simple Modal for New Client */}
      {showNewClientModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Nuevo Cliente</h2>
            <form onSubmit={(e) => {
              e.preventDefault()
              toast.success('Cliente creado exitosamente')
              setShowNewClientModal(false)
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Nombre de la Empresa</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="Ej: Banco Estado"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input
                    type="email"
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="contacto@empresa.cl"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Teléfono</label>
                  <input
                    type="tel"
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="+56 2 1234 5678"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowNewClientModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Crear Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Password Reset Modal */}
      {showPasswordModal && selectedClient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Resetear Contraseña</h2>
            <p className="text-gray-600 mb-4">
              ¿Estás seguro de resetear la contraseña para <strong>{selectedClient.name}</strong>?
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Se generará una nueva contraseña que será copiada al portapapeles.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowPasswordModal(false)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Cancelar
              </button>
              <button
                onClick={handleResetPassword}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Generar Nueva Contraseña
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}