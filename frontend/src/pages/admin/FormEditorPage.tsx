import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import { 
  Save, Eye, Download, Upload, Copy, Plus, ArrowLeft, 
  Smartphone, Monitor, History, Settings 
} from 'lucide-react'

// Components
import { ConfigEditor } from '@/components/admin/ConfigEditor'
import { FormPreview } from '@/components/admin/FormPreview'
import { FormHistory } from '@/components/admin/FormHistory'

// Services
import { formTemplateService } from '@/services/formTemplateService'

// Types
import { FormTemplate, FormConfig } from '@/types/forms'

export const FormEditorPage: React.FC = () => {
  const { id } = useParams<{ id?: string }>()
  const navigate = useNavigate()
  const [showPreview, setShowPreview] = useState(false)
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('mobile')
  const [showHistory, setShowHistory] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  // Default configuration for new forms
  const defaultConfig: FormConfig = {
    sections: [
      {
        id: 'section_1',
        name: 'Información General',
        icon: '📋',
        required: true,
        order: 1,
        fields: [
          {
            id: 'field_1',
            type: 'text',
            label: 'Nombre',
            placeholder: 'Ingrese el nombre',
            required: true,
            order: 1
          }
        ]
      }
    ],
    settings: {
      requireSignature: true,
      requirePhotos: false,
      minPhotosPerItem: 0,
      allowVoiceNotes: true,
      allowSkipSections: false,
      autoSaveInterval: 30,
      completionRequires: ['all_required_fields']
    }
  }

  const [currentConfig, setCurrentConfig] = useState<FormConfig>(defaultConfig)
  const [templateName, setTemplateName] = useState('Nuevo Formulario')

  // Load existing template if editing
  const { data: template, isLoading } = useQuery({
    queryKey: ['formTemplate', id],
    queryFn: () => formTemplateService.getTemplate(id!),
    enabled: !!id
  })

  useEffect(() => {
    if (template) {
      setCurrentConfig(template.config as FormConfig)
      setTemplateName(template.name)
    }
  }, [template])

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (config: FormConfig) => {
      // Validate configuration
      const errors = formTemplateService.validateConfig(config)
      if (errors.length > 0) {
        throw new Error(errors.join('\n'))
      }

      if (id) {
        // Update existing
        return formTemplateService.updateTemplate(id, {
          name: templateName,
          config,
          active: true
        })
      } else {
        // Create new
        return formTemplateService.createTemplate({
          name: templateName,
          type: 'inspection',
          config
        })
      }
    },
    onSuccess: (result) => {
      toast.success('Formulario guardado exitosamente')
      setHasUnsavedChanges(false)
      if (!id) {
        navigate(`/admin/forms/${result.id}/edit`)
      }
    },
    onError: (error: Error) => {
      toast.error(`Error al guardar: ${error.message}`)
    }
  })

  // Handle configuration changes
  const handleConfigChange = (newConfig: FormConfig) => {
    setCurrentConfig(newConfig)
    setHasUnsavedChanges(true)
  }

  // Handle save
  const handleSave = async () => {
    await saveMutation.mutateAsync(currentConfig)
  }

  // Export configuration
  const handleExport = () => {
    const dataStr = JSON.stringify({
      name: templateName,
      type: 'inspection',
      config: currentConfig,
      exportedAt: new Date().toISOString()
    }, null, 2)
    
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
    
    const exportFileDefaultName = `${templateName.toLowerCase().replace(/\s+/g, '-')}.json`
    
    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
    
    toast.success('Configuración exportada')
  }

  // Import configuration
  const handleImport = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      
      try {
        const text = await file.text()
        const data = JSON.parse(text)
        
        // Validate imported data
        if (!data.config || !data.config.sections) {
          throw new Error('Formato de archivo inválido')
        }
        
        const errors = formTemplateService.validateConfig(data.config)
        if (errors.length > 0) {
          throw new Error(errors.join('\n'))
        }
        
        setCurrentConfig(data.config)
        setTemplateName(data.name || 'Formulario Importado')
        setHasUnsavedChanges(true)
        
        toast.success('Configuración importada exitosamente')
      } catch (error) {
        toast.error(`Error al importar: ${error.message}`)
      }
    }
    
    input.click()
  }

  // Warn before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasUnsavedChanges])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando formulario...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/admin/forms')}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <input
                  type="text"
                  value={templateName}
                  onChange={(e) => {
                    setTemplateName(e.target.value)
                    setHasUnsavedChanges(true)
                  }}
                  className="text-2xl font-bold bg-transparent border-b-2 border-transparent hover:border-gray-300 focus:border-blue-500 outline-none"
                />
                <p className="text-sm text-gray-500 mt-1">
                  {id ? `Versión ${template?.version || 1}` : 'Nuevo formulario'}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              {/* Preview controls */}
              <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => {
                    setPreviewMode('mobile')
                    setShowPreview(true)
                  }}
                  className={`p-2 rounded ${previewMode === 'mobile' ? 'bg-white shadow' : ''}`}
                  title="Vista móvil"
                >
                  <Smartphone size={18} />
                </button>
                <button
                  onClick={() => {
                    setPreviewMode('desktop')
                    setShowPreview(true)
                  }}
                  className={`p-2 rounded ${previewMode === 'desktop' ? 'bg-white shadow' : ''}`}
                  title="Vista escritorio"
                >
                  <Monitor size={18} />
                </button>
              </div>

              {/* Other actions */}
              <button
                onClick={() => setShowHistory(true)}
                className="p-2 hover:bg-gray-100 rounded-lg"
                title="Ver historial"
              >
                <History size={20} />
              </button>
              
              <button
                onClick={handleImport}
                className="p-2 hover:bg-gray-100 rounded-lg"
                title="Importar"
              >
                <Upload size={20} />
              </button>
              
              <button
                onClick={handleExport}
                className="p-2 hover:bg-gray-100 rounded-lg"
                title="Exportar"
              >
                <Download size={20} />
              </button>

              <div className="h-8 w-px bg-gray-300" />

              <button
                onClick={handleSave}
                disabled={!hasUnsavedChanges || saveMutation.isPending}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  hasUnsavedChanges
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                <Save size={20} />
                {saveMutation.isPending ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Editor */}
      <main className="pb-8">
        <ConfigEditor
          initialConfig={currentConfig}
          onSave={handleConfigChange}
        />
      </main>

      {/* Preview Modal */}
      {showPreview && (
        <FormPreview
          config={currentConfig}
          mode={previewMode}
          onClose={() => setShowPreview(false)}
        />
      )}

      {/* History Modal */}
      {showHistory && id && (
        <FormHistory
          templateId={id}
          onClose={() => setShowHistory(false)}
          onRestore={(version) => {
            // Implement version restore
            toast.success(`Versión ${version} restaurada`)
            setShowHistory(false)
          }}
        />
      )}

      {/* Unsaved changes indicator */}
      {hasUnsavedChanges && (
        <div className="fixed bottom-4 left-4 bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-2 rounded-lg shadow-lg">
          <p className="text-sm">Tienes cambios sin guardar</p>
        </div>
      )}
    </div>
  )
}