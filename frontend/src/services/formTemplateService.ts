import axios from '@/lib/axios'
import { FormTemplate, FormConfig } from '@/types/forms'

export const formTemplateService = {
  // Get all form templates
  async getTemplates(type?: string): Promise<FormTemplate[]> {
    const params = type ? { type } : {}
    const response = await axios.get('/form-templates', { params })
    return response.data.templates
  },

  // Get a specific template
  async getTemplate(id: string): Promise<FormTemplate> {
    const response = await axios.get(`/form-templates/${id}`)
    return response.data
  },

  // Create a new template
  async createTemplate(data: {
    name: string
    type: string
    config: FormConfig
  }): Promise<FormTemplate> {
    const response = await axios.post('/form-templates', data)
    return response.data
  },

  // Update a template (creates new version)
  async updateTemplate(id: string, data: {
    name?: string
    config?: FormConfig
    active?: boolean
  }): Promise<FormTemplate> {
    const response = await axios.put(`/form-templates/${id}`, data)
    return response.data
  },

  // Delete a template (soft delete)
  async deleteTemplate(id: string): Promise<void> {
    await axios.delete(`/form-templates/${id}`)
  },

  // Clone a template
  async cloneTemplate(id: string, newName: string): Promise<FormTemplate> {
    const response = await axios.post(`/form-templates/${id}/clone`, { name: newName })
    return response.data
  },

  // Export template as JSON
  async exportTemplate(id: string): Promise<Blob> {
    const response = await axios.get(`/form-templates/${id}/export`, {
      responseType: 'blob'
    })
    return response.data
  },

  // Import template from JSON
  async importTemplate(data: any): Promise<FormTemplate> {
    const response = await axios.post('/form-templates/import', data)
    return response.data
  },

  // Validate form configuration
  validateConfig(config: FormConfig): string[] {
    const errors: string[] = []
    
    // Check for duplicate section IDs
    const sectionIds = new Set<string>()
    config.sections.forEach(section => {
      if (sectionIds.has(section.id)) {
        errors.push(`Duplicate section ID: ${section.id}`)
      }
      sectionIds.add(section.id)
      
      // Check for duplicate field IDs within section
      const fieldIds = new Set<string>()
      section.fields.forEach(field => {
        if (fieldIds.has(field.id)) {
          errors.push(`Duplicate field ID in section ${section.name}: ${field.id}`)
        }
        fieldIds.add(field.id)
        
        // Validate field types
        const validTypes = ['text', 'number', 'select', 'checkbox', 'radio', 'photo', 'signature', 'date', 'time']
        if (!validTypes.includes(field.type)) {
          errors.push(`Invalid field type: ${field.type}`)
        }
        
        // Check select/radio have options
        if ((field.type === 'select' || field.type === 'radio') && (!field.options || field.options.length === 0)) {
          errors.push(`Field ${field.label} requires options`)
        }
      })
    })
    
    return errors
  },

  // Generate preview data for testing
  generatePreviewData(config: FormConfig): Record<string, any> {
    const data: Record<string, any> = {}
    
    config.sections.forEach(section => {
      data[section.id] = {}
      section.fields.forEach(field => {
        switch (field.type) {
          case 'text':
            data[section.id][field.id] = 'Texto de ejemplo'
            break
          case 'number':
            data[section.id][field.id] = 123
            break
          case 'select':
          case 'radio':
            data[section.id][field.id] = field.options?.[0] || ''
            break
          case 'checkbox':
            data[section.id][field.id] = Math.random() > 0.5
            break
          case 'date':
            data[section.id][field.id] = new Date().toISOString().split('T')[0]
            break
          case 'time':
            data[section.id][field.id] = '14:30'
            break
          case 'photo':
            data[section.id][field.id] = '/placeholder-image.jpg'
            break
          case 'signature':
            data[section.id][field.id] = '/placeholder-signature.png'
            break
        }
      })
    })
    
    return data
  }
}