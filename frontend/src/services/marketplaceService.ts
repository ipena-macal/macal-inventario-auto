import axios from '@/lib/axios'
import { MarketplaceTemplate, TemplateCategory, PredefinedTemplate } from '@/types/marketplace'

export const marketplaceService = {
  // Get marketplace templates
  async getTemplates(params?: {
    category?: string
    sortBy?: 'popular' | 'recent' | 'rating'
    search?: string
  }): Promise<MarketplaceTemplate[]> {
    const response = await axios.get('/marketplace/templates', { params })
    return response.data.templates
  },

  // Get predefined templates (no API call, returns static data)
  async getPredefinedTemplates(): Promise<PredefinedTemplate[]> {
    // In a real app, this could be an API call
    // For now, return static templates
    return [
      {
        id: 'inspection_basic',
        name: 'Inspección Básica',
        description: 'Inspección vehicular estándar con todos los puntos esenciales',
        category: 'inspection',
        icon: '🔍',
        tags: ['básico', 'rápido', 'esencial'],
        screenshots: [],
        config: {
          sections: [
            {
              id: 'exterior',
              name: 'Exterior',
              icon: '🚗',
              required: true,
              order: 1,
              fields: [
                {
                  id: 'body_condition',
                  type: 'select',
                  label: 'Condición Carrocería',
                  required: true,
                  options: ['Excelente', 'Buena', 'Regular', 'Mala'],
                  order: 1,
                },
                {
                  id: 'paint_condition',
                  type: 'select',
                  label: 'Estado Pintura',
                  required: true,
                  options: ['Original', 'Retocada', 'Repintada completa'],
                  order: 2,
                },
                {
                  id: 'exterior_photos',
                  type: 'photo',
                  label: 'Fotos Exterior (4 ángulos)',
                  validation: {
                    minPhotos: 4,
                  },
                  order: 3,
                  required: false,
                },
              ],
            },
            {
              id: 'interior',
              name: 'Interior',
              icon: '🪑',
              required: true,
              order: 2,
              fields: [
                {
                  id: 'seats_condition',
                  type: 'select',
                  label: 'Estado Asientos',
                  required: true,
                  options: ['Excelente', 'Bueno', 'Regular', 'Malo'],
                  order: 1,
                },
                {
                  id: 'odometer_reading',
                  type: 'number',
                  label: 'Kilometraje',
                  required: true,
                  order: 2,
                },
              ],
            },
          ],
          settings: {
            requireSignature: true,
            requirePhotos: true,
            minPhotosPerItem: 1,
            allowVoiceNotes: false,
            allowSkipSections: false,
            autoSaveInterval: 30,
            completionRequires: ['all_required_fields', 'signature'],
          },
        },
      },
      {
        id: 'quick_checkin',
        name: 'Check-in Rápido',
        description: 'Registro rápido de entrada de vehículos',
        category: 'checkin',
        icon: '⚡',
        tags: ['rápido', 'entrada', 'simple'],
        screenshots: [],
        config: {
          sections: [
            {
              id: 'vehicle_info',
              name: 'Información del Vehículo',
              icon: '🚙',
              required: true,
              order: 1,
              fields: [
                {
                  id: 'license_plate',
                  type: 'text',
                  label: 'Patente',
                  required: true,
                  placeholder: 'AA-BB-12',
                  order: 1,
                },
                {
                  id: 'entry_reason',
                  type: 'select',
                  label: 'Motivo de Ingreso',
                  required: true,
                  options: ['Mantención', 'Reparación', 'Inspección', 'Otro'],
                  order: 2,
                },
                {
                  id: 'entry_photos',
                  type: 'photo',
                  label: 'Foto de Ingreso',
                  validation: {
                    minPhotos: 1,
                    maxPhotos: 1,
                  },
                  order: 3,
                  required: false,
                },
              ],
            },
          ],
          settings: {
            requireSignature: false,
            requirePhotos: true,
            minPhotosPerItem: 1,
            allowVoiceNotes: false,
            allowSkipSections: false,
            autoSaveInterval: 30,
            completionRequires: ['all_required_fields'],
          },
        },
      },
      {
        id: 'damage_report',
        name: 'Reporte de Daños',
        description: 'Documentación detallada de daños con fotos y anotaciones',
        category: 'damage',
        icon: '🔧',
        tags: ['daños', 'seguro', 'evidencia'],
        screenshots: [],
        config: {
          sections: [
            {
              id: 'damage_details',
              name: 'Detalles del Daño',
              icon: '⚠️',
              required: true,
              order: 1,
              fields: [
                {
                  id: 'damage_type',
                  type: 'select',
                  label: 'Tipo de Daño',
                  required: true,
                  options: ['Colisión', 'Rayón', 'Abolladura', 'Rotura', 'Otro'],
                  order: 1,
                },
                {
                  id: 'damage_location',
                  type: 'select',
                  label: 'Ubicación',
                  required: true,
                  options: [
                    'Frontal', 'Trasero', 'Lateral Izquierdo', 
                    'Lateral Derecho', 'Techo', 'Capó', 'Maletero',
                  ],
                  order: 2,
                },
                {
                  id: 'damage_description',
                  type: 'text',
                  label: 'Descripción Detallada',
                  required: true,
                  placeholder: 'Describe el daño en detalle...',
                  order: 3,
                },
                {
                  id: 'damage_photos',
                  type: 'photo',
                  label: 'Fotos del Daño',
                  validation: {
                    minPhotos: 3,
                    maxPhotos: 10,
                  },
                  order: 4,
                  required: false,
                },
              ],
            },
          ],
          settings: {
            requireSignature: true,
            requirePhotos: true,
            minPhotosPerItem: 3,
            allowVoiceNotes: true,
            allowSkipSections: false,
            autoSaveInterval: 30,
            completionRequires: ['all_required_fields', 'signature', 'min_photos'],
          },
        },
      },
      {
        id: 'delivery_checklist',
        name: 'Checklist de Entrega',
        description: 'Verificación final antes de entregar el vehículo al cliente',
        category: 'delivery',
        icon: '✅',
        tags: ['entrega', 'final', 'cliente'],
        screenshots: [],
        config: {
          sections: [
            {
              id: 'final_checks',
              name: 'Verificaciones Finales',
              icon: '📋',
              required: true,
              order: 1,
              fields: [
                {
                  id: 'work_completed',
                  type: 'checkbox',
                  label: 'Todos los trabajos completados',
                  required: true,
                  order: 1,
                },
                {
                  id: 'test_drive',
                  type: 'checkbox',
                  label: 'Prueba de manejo realizada',
                  required: true,
                  order: 2,
                },
                {
                  id: 'cleaning',
                  type: 'checkbox',
                  label: 'Vehículo limpio interior y exterior',
                  required: true,
                  order: 3,
                },
                {
                  id: 'fuel_level',
                  type: 'select',
                  label: 'Nivel de combustible',
                  required: true,
                  options: ['Vacío', '1/4', '1/2', '3/4', 'Lleno'],
                  order: 4,
                },
                {
                  id: 'final_photos',
                  type: 'photo',
                  label: 'Fotos de entrega',
                  validation: {
                    minPhotos: 2,
                  },
                  order: 5,
                  required: false,
                },
              ],
            },
          ],
          settings: {
            requireSignature: true,
            requirePhotos: true,
            minPhotosPerItem: 1,
            allowVoiceNotes: false,
            allowSkipSections: false,
            autoSaveInterval: 30,
            completionRequires: ['all_required_fields', 'signature'],
          },
        },
      },
    ]
  },

  // Get template categories
  async getCategories(): Promise<TemplateCategory[]> {
    // Could be an API call
    return [
      {
        slug: 'inspection',
        name: 'Inspección',
        description: 'Formularios de inspección vehicular',
        icon: '🔍',
        order: 1,
      },
      {
        slug: 'checkin',
        name: 'Registro',
        description: 'Formularios de entrada y salida',
        icon: '📝',
        order: 2,
      },
      {
        slug: 'damage',
        name: 'Daños',
        description: 'Reportes y evaluación de daños',
        icon: '⚠️',
        order: 3,
      },
      {
        slug: 'delivery',
        name: 'Entrega',
        description: 'Checklists de entrega',
        icon: '✅',
        order: 4,
      },
      {
        slug: 'maintenance',
        name: 'Mantenimiento',
        description: 'Formularios de servicio',
        icon: '🔧',
        order: 5,
      },
      {
        slug: 'custom',
        name: 'Personalizado',
        description: 'Formularios personalizados',
        icon: '⚙️',
        order: 6,
      },
    ]
  },

  // Publish template to marketplace
  async publishTemplate(templateId: string, data: {
    name: string
    description: string
    category: string
    tags: string[]
    screenshots?: string[]
  }): Promise<MarketplaceTemplate> {
    const response = await axios.post(`/marketplace/templates/${templateId}/publish`, data)
    return response.data
  },

  // Rate a template
  async rateTemplate(templateId: string, rating: number, comment?: string): Promise<void> {
    await axios.post(`/marketplace/templates/${templateId}/rate`, {
      rating,
      comment
    })
  },

  // Get template ratings
  async getTemplateRatings(templateId: string): Promise<any[]> {
    const response = await axios.get(`/marketplace/templates/${templateId}/ratings`)
    return response.data.ratings
  },

  // Download/use template (increments counter)
  async useTemplate(templateId: string): Promise<void> {
    await axios.post(`/marketplace/templates/${templateId}/use`)
  }
}