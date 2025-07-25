import React, { useState, useEffect } from 'react'
import { Camera, Mic, FileText, ChevronLeft, ChevronRight } from 'lucide-react'
import { FormConfig, FormSection, FormField } from '@/types/forms'
import { formTemplateService } from '@/services/formTemplateService'

interface FormPreviewProps {
  config: FormConfig
  mode: 'desktop' | 'mobile'
  onClose?: () => void
}

export const FormPreview: React.FC<FormPreviewProps> = ({ config, mode, onClose }) => {
  const [currentSection, setCurrentSection] = useState(0)
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Initialize with preview data
  useEffect(() => {
    const previewData = formTemplateService.generatePreviewData(config)
    setFormData(previewData)
  }, [config])

  // Form container classes based on mode
  const containerClass = mode === 'mobile' 
    ? 'w-[375px] h-[667px] mx-auto border-8 border-gray-800 rounded-[2.5rem] overflow-hidden bg-white'
    : 'w-full max-w-4xl mx-auto bg-white rounded-lg shadow-lg'

  // Handle field changes
  const handleFieldChange = (sectionId: string, fieldId: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [sectionId]: {
        ...prev[sectionId],
        [fieldId]: value
      }
    }))

    // Clear error when field is modified
    if (errors[`${sectionId}.${fieldId}`]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[`${sectionId}.${fieldId}`]
        return newErrors
      })
    }
  }

  // Validate current section
  const validateSection = (): boolean => {
    const section = config.sections[currentSection]
    const newErrors: Record<string, string> = {}
    let isValid = true

    section.fields.forEach(field => {
      if (field.required) {
        const value = formData[section.id]?.[field.id]
        if (!value || (Array.isArray(value) && value.length === 0)) {
          newErrors[`${section.id}.${field.id}`] = 'Este campo es requerido'
          isValid = false
        }
      }
    })

    setErrors(prev => ({ ...prev, ...newErrors }))
    return isValid
  }

  // Handle section navigation
  const handleNext = () => {
    if (validateSection() && currentSection < config.sections.length - 1) {
      setCurrentSection(prev => prev + 1)
    }
  }

  const handlePrevious = () => {
    if (currentSection > 0) {
      setCurrentSection(prev => prev - 1)
    }
  }

  // Render field based on type
  const renderField = (field: FormField, sectionId: string) => {
    const value = formData[sectionId]?.[field.id] || ''
    const error = errors[`${sectionId}.${field.id}`]
    const fieldKey = `${sectionId}-${field.id}`

    return (
      <div key={fieldKey} className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </label>

        {/* Text input */}
        {field.type === 'text' && (
          <input
            type="text"
            value={value}
            onChange={(e) => handleFieldChange(sectionId, field.id, e.target.value)}
            placeholder={field.placeholder}
            className={`w-full p-2 border rounded-lg ${error ? 'border-red-500' : 'border-gray-300'}`}
          />
        )}

        {/* Number input */}
        {field.type === 'number' && (
          <input
            type="number"
            value={value}
            onChange={(e) => handleFieldChange(sectionId, field.id, e.target.value)}
            placeholder={field.placeholder}
            className={`w-full p-2 border rounded-lg ${error ? 'border-red-500' : 'border-gray-300'}`}
          />
        )}

        {/* Select dropdown */}
        {field.type === 'select' && (
          <select
            value={value}
            onChange={(e) => handleFieldChange(sectionId, field.id, e.target.value)}
            className={`w-full p-2 border rounded-lg ${error ? 'border-red-500' : 'border-gray-300'}`}
          >
            <option value="">Seleccionar...</option>
            {field.options?.map((option, idx) => (
              <option key={idx} value={option}>{option}</option>
            ))}
          </select>
        )}

        {/* Checkbox */}
        {field.type === 'checkbox' && (
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={value || false}
              onChange={(e) => handleFieldChange(sectionId, field.id, e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-sm">{field.placeholder || 'Marcar'}</span>
          </label>
        )}

        {/* Radio buttons */}
        {field.type === 'radio' && (
          <div className="space-y-2">
            {field.options?.map((option, idx) => (
              <label key={idx} className="flex items-center gap-2">
                <input
                  type="radio"
                  name={fieldKey}
                  value={option}
                  checked={value === option}
                  onChange={(e) => handleFieldChange(sectionId, field.id, e.target.value)}
                />
                <span className="text-sm">{option}</span>
              </label>
            ))}
          </div>
        )}

        {/* Photo capture */}
        {field.type === 'photo' && (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
            <Camera className="mx-auto mb-2 text-gray-400" size={32} />
            <p className="text-sm text-gray-500">Capturar foto</p>
            {value && <p className="text-xs text-green-600 mt-1">Foto capturada</p>}
          </div>
        )}

        {/* Signature pad */}
        {field.type === 'signature' && (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
            <FileText className="mx-auto mb-2 text-gray-400" size={32} />
            <p className="text-sm text-gray-500">Firma digital</p>
            {value && <p className="text-xs text-green-600 mt-1">Firmado</p>}
          </div>
        )}

        {/* Date input */}
        {field.type === 'date' && (
          <input
            type="date"
            value={value}
            onChange={(e) => handleFieldChange(sectionId, field.id, e.target.value)}
            className={`w-full p-2 border rounded-lg ${error ? 'border-red-500' : 'border-gray-300'}`}
          />
        )}

        {/* Time input */}
        {field.type === 'time' && (
          <input
            type="time"
            value={value}
            onChange={(e) => handleFieldChange(sectionId, field.id, e.target.value)}
            className={`w-full p-2 border rounded-lg ${error ? 'border-red-500' : 'border-gray-300'}`}
          />
        )}

        {/* Error message */}
        {error && (
          <p className="text-sm text-red-500 mt-1">{error}</p>
        )}
      </div>
    )
  }

  const currentSectionData = config.sections[currentSection]

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className={containerClass}>
        <div className="h-full flex flex-col">
          {/* Header */}
          <header className="bg-blue-600 text-white p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Vista Previa del Formulario</h2>
              {onClose && (
                <button
                  onClick={onClose}
                  className="text-white hover:text-gray-200"
                >
                  ✕
                </button>
              )}
            </div>
            
            {/* Progress bar */}
            <div className="mt-3 bg-blue-500 rounded-full h-2">
              <div 
                className="bg-white h-full rounded-full transition-all duration-300"
                style={{ width: `${((currentSection + 1) / config.sections.length) * 100}%` }}
              />
            </div>

            {/* Section tabs */}
            <div className="mt-3 flex gap-2 overflow-x-auto">
              {config.sections.map((section, idx) => (
                <button
                  key={section.id}
                  onClick={() => setCurrentSection(idx)}
                  className={`px-3 py-1 rounded-full text-sm whitespace-nowrap ${
                    idx === currentSection 
                      ? 'bg-white text-blue-600' 
                      : 'bg-blue-500 text-blue-100'
                  }`}
                >
                  {section.icon} {section.name}
                </button>
              ))}
            </div>
          </header>

          {/* Form content */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="mb-4">
              <h3 className="text-xl font-semibold flex items-center gap-2">
                {currentSectionData.icon && <span>{currentSectionData.icon}</span>}
                {currentSectionData.name}
              </h3>
              {currentSectionData.required && (
                <p className="text-sm text-gray-500 mt-1">
                  * Todos los campos marcados son obligatorios
                </p>
              )}
            </div>

            {/* Fields */}
            <div>
              {currentSectionData.fields.map(field => renderField(field, currentSectionData.id))}
            </div>
          </div>

          {/* Navigation */}
          <div className="border-t p-4 bg-gray-50">
            <div className="flex justify-between">
              <button
                onClick={handlePrevious}
                disabled={currentSection === 0}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                  currentSection === 0 
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                    : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                }`}
              >
                <ChevronLeft size={20} />
                Anterior
              </button>

              <div className="text-sm text-gray-500">
                {currentSection + 1} de {config.sections.length}
              </div>

              {currentSection < config.sections.length - 1 ? (
                <button
                  onClick={handleNext}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Siguiente
                  <ChevronRight size={20} />
                </button>
              ) : (
                <button
                  onClick={() => alert('Formulario completado!')}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Completar
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}