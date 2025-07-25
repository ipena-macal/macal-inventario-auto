import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import { 
  Plus, Edit, Trash2, Key, Shield, Eye, EyeOff,
  Building, Mail, Phone, Calendar, Activity, Copy
} from 'lucide-react'
import { format } from 'date-fns'

// Components
import { ClientFormModal } from '@/components/admin/ClientFormModal'
import { PermissionsModal } from '@/components/admin/PermissionsModal'
import { AccessLogModal } from '@/components/admin/AccessLogModal'

// Services
import { clientManagementService } from '@/services/clientManagementService'

// Types
import { ClientOrganization } from '@/types/client'

export const ClientManagementPage: React.FC = () => {
  const queryClient = useQueryClient()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingClient, setEditingClient] = useState<ClientOrganization | null>(null)
  const [managingPermissions, setManagingPermissions] = useState<ClientOrganization | null>(null)
  const [viewingLogs, setViewingLogs] = useState<ClientOrganization | null>(null)
  const [showTokens, setShowTokens] = useState<Record<string, boolean>>({})

  // Fetch clients
  const { data: clients, isLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: () => clientManagementService.getClients()
  })

  // Create client mutation
  const createMutation = useMutation({
    mutationFn: clientManagementService.createClient,
    onSuccess: () => {
      toast.success('Cliente creado exitosamente')
      queryClient.invalidateQueries(['clients'])
      setShowCreateModal(false)
    },
    onError: () => {
      toast.error('Error al crear el cliente')
    }
  })

  // Update client mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      clientManagementService.updateClient(id, data),
    onSuccess: () => {
      toast.success('Cliente actualizado')
      queryClient.invalidateQueries(['clients'])
      setEditingClient(null)
    }
  })

  // Delete client mutation
  const deleteMutation = useMutation({
    mutationFn: clientManagementService.deleteClient,
    onSuccess: () => {
      toast.success('Cliente eliminado')
      queryClient.invalidateQueries(['clients'])
    }
  })

  // Regenerate token mutation
  const regenerateTokenMutation = useMutation({
    mutationFn: clientManagementService.regenerateToken,
    onSuccess: (data) => {
      toast.success('Token regenerado')
      queryClient.invalidateQueries(['clients'])
      // Show the new token
      navigator.clipboard.writeText(data.token)
      toast.success('Token copiado al portapapeles')
    }
  })

  const copyAccessUrl = (client: ClientOrganization) => {
    const url = `${window.location.origin}/client-portal?token=${client.accessToken}`
    navigator.clipboard.writeText(url)
    toast.success('URL de acceso copiada')
  }

  const toggleTokenVisibility = (clientId: string) => {
    setShowTokens(prev => ({ ...prev, [clientId]: !prev[clientId] }))
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Gestión de Clientes
            </h1>
            <p className="mt-2 text-gray-600">
              Administra el acceso de organizaciones externas al sistema
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus size={20} />
            Nuevo Cliente
          </button>
        </div>
      </div>

      {/* Clients list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : clients?.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <Building className="mx-auto text-gray-400 mb-4" size={48} />
          <p className="text-gray-500">No hay clientes registrados</p>
        </div>
      ) : (
        <div className="space-y-4">
          {clients?.map(client => (
            <div key={client.id} className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  {client.logo ? (
                    <img 
                      src={client.logo} 
                      alt={client.name}
                      className="w-16 h-16 object-contain rounded"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center">
                      <Building className="text-gray-400" size={24} />
                    </div>
                  )}
                  
                  <div>
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      {client.name}
                      {client.active ? (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                          Activo
                        </span>
                      ) : (
                        <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                          Inactivo
                        </span>
                      )}
                    </h3>
                    
                    <div className="mt-2 space-y-1 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Mail size={16} />
                        <span>{client.email}</span>
                      </div>
                      {client.phone && (
                        <div className="flex items-center gap-2">
                          <Phone size={16} />
                          <span>{client.phone}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Calendar size={16} />
                        <span>Creado: {format(new Date(client.createdAt), 'dd/MM/yyyy')}</span>
                      </div>
                      {client.validUntil && (
                        <div className="flex items-center gap-2">
                          <Calendar size={16} />
                          <span className="text-orange-600">
                            Válido hasta: {format(new Date(client.validUntil), 'dd/MM/yyyy')}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Access token */}
                    <div className="mt-3 p-3 bg-gray-50 rounded">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Token de acceso:</span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleTokenVisibility(client.id)}
                            className="text-gray-500 hover:text-gray-700"
                          >
                            {showTokens[client.id] ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                          <button
                            onClick={() => copyAccessUrl(client)}
                            className="text-blue-600 hover:text-blue-700"
                            title="Copiar URL de acceso"
                          >
                            <Copy size={16} />
                          </button>
                        </div>
                      </div>
                      <code className="text-xs bg-gray-100 p-2 rounded block overflow-hidden">
                        {showTokens[client.id] 
                          ? client.accessToken 
                          : '••••••••••••••••••••••••••••••••'}
                      </code>
                    </div>

                    {/* Stats */}
                    <div className="mt-3 flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <Activity size={16} className="text-gray-400" />
                        <span>{client.accessCount} accesos</span>
                      </div>
                      {client.lastAccess && (
                        <div className="flex items-center gap-1">
                          <Calendar size={16} className="text-gray-400" />
                          <span>
                            Último: {format(new Date(client.lastAccess), 'dd/MM HH:mm')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setManagingPermissions(client)}
                    className="p-2 text-purple-600 hover:bg-purple-50 rounded"
                    title="Gestionar permisos"
                  >
                    <Shield size={20} />
                  </button>
                  <button
                    onClick={() => regenerateTokenMutation.mutate(client.id)}
                    className="p-2 text-orange-600 hover:bg-orange-50 rounded"
                    title="Regenerar token"
                  >
                    <Key size={20} />
                  </button>
                  <button
                    onClick={() => setViewingLogs(client)}
                    className="p-2 text-green-600 hover:bg-green-50 rounded"
                    title="Ver logs de acceso"
                  >
                    <Activity size={20} />
                  </button>
                  <button
                    onClick={() => setEditingClient(client)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                    title="Editar"
                  >
                    <Edit size={20} />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`¿Eliminar cliente ${client.name}?`)) {
                        deleteMutation.mutate(client.id)
                      }
                    }}
                    className="p-2 text-red-600 hover:bg-red-50 rounded"
                    title="Eliminar"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {showCreateModal && (
        <ClientFormModal
          onSave={(data) => createMutation.mutate(data)}
          onClose={() => setShowCreateModal(false)}
        />
      )}

      {editingClient && (
        <ClientFormModal
          client={editingClient}
          onSave={(data) => updateMutation.mutate({ id: editingClient.id, data })}
          onClose={() => setEditingClient(null)}
        />
      )}

      {managingPermissions && (
        <PermissionsModal
          client={managingPermissions}
          onSave={(permissions) => {
            updateMutation.mutate({
              id: managingPermissions.id,
              data: { permissions }
            })
            setManagingPermissions(null)
          }}
          onClose={() => setManagingPermissions(null)}
        />
      )}

      {viewingLogs && (
        <AccessLogModal
          client={viewingLogs}
          onClose={() => setViewingLogs(null)}
        />
      )}
    </div>
  )
}