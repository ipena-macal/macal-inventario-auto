import React, { useState } from 'react'
import { Save, Plus, Trash2, Copy, Download, Upload } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface ConfigEditorProps {
  initialConfig: any
  onSave: (config: any) => Promise<void>
}

export const ConfigEditor: React.FC<ConfigEditorProps> = ({ initialConfig, onSave }) => {
  const [config, setConfig] = useState(initialConfig)
  const [selectedSection, setSelectedSection] = useState(0)
  const [isJsonMode, setIsJsonMode] = useState(false)

  // Modo Visual - Editor amigable
  const VisualEditor = () => (
    <div className="grid grid-cols-12 gap-6">
      {/* Lista de secciones */}
      <div className="col-span-3 bg-white rounded-lg p-4">
        <h3 className="font-semibold mb-4">Secciones</h3>
        <div className="space-y-2">
          {config.sections.map((section: any, index: number) => (
            <div
              key={section.id}
              onClick={() => setSelectedSection(index)}
              className={`p-3 rounded cursor-pointer transition-all ${
                selectedSection === index
                  ? 'bg-blue-50 border-blue-500 border'
                  : 'bg-gray-50 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span>{section.icon}</span>
                  <span className="font-medium">{section.name}</span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    removeSection(index)
                  }}
                  className="text-red-500 opacity-0 hover:opacity-100"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
          <button
            onClick={addSection}
            className="w-full p-3 border-2 border-dashed border-gray-300 rounded text-gray-500 hover:border-blue-500 hover:text-blue-500"
          >
            <Plus size={20} className="mx-auto" />
          </button>
        </div>
      </div>

      {/* Editor de campos */}
      <div className="col-span-9 bg-white rounded-lg p-6">
        {config.sections[selectedSection] && (
          <>
            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-4">
                Editar Sección: {config.sections[selectedSection].name}
              </h3>
              
              {/* Propiedades de la sección */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium mb-1">Nombre</label>
                  <input
                    type="text"
                    value={config.sections[selectedSection].name}
                    onChange={(e) => updateSection(selectedSection, 'name', e.target.value)}
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Ícono</label>
                  <input
                    type="text"
                    value={config.sections[selectedSection].icon}
                    onChange={(e) => updateSection(selectedSection, 'icon', e.target.value)}
                    className="w-full p-2 border rounded"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 mb-4">
                <input
                  type="checkbox"
                  checked={config.sections[selectedSection].required}
                  onChange={(e) => updateSection(selectedSection, 'required', e.target.checked)}
                />
                <span>Sección requerida</span>
              </label>
            </div>

            {/* Campos de la sección */}
            <div className="space-y-4">
              <h4 className="font-medium">Campos</h4>
              {config.sections[selectedSection].fields.map((field: any, fieldIndex: number) => (
                <div key={field.id} className="p-4 bg-gray-50 rounded-lg">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm">Etiqueta</label>
                      <input
                        type="text"
                        value={field.label}
                        onChange={(e) => updateField(selectedSection, fieldIndex, 'label', e.target.value)}
                        className="w-full p-2 border rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-sm">Tipo</label>
                      <select
                        value={field.type}
                        onChange={(e) => updateField(selectedSection, fieldIndex, 'type', e.target.value)}
                        className="w-full p-2 border rounded"
                      >
                        <option value="text">Texto</option>
                        <option value="select">Selección</option>
                        <option value="checkbox">Checkbox</option>
                        <option value="photo">Foto</option>
                        <option value="signature">Firma</option>
                      </select>
                    </div>
                    <div className="flex items-end gap-2">
                      <label className="flex items-center gap-1">
                        <input
                          type="checkbox"
                          checked={field.required}
                          onChange={(e) => updateField(selectedSection, fieldIndex, 'required', e.target.checked)}
                        />
                        <span className="text-sm">Requerido</span>
                      </label>
                      <button
                        onClick={() => removeField(selectedSection, fieldIndex)}
                        className="text-red-500 ml-auto"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Opciones para campos select */}
                  {field.type === 'select' && (
                    <div className="mt-3">
                      <label className="block text-sm mb-1">Opciones</label>
                      <div className="space-y-1">
                        {field.options?.map((option: string, optIndex: number) => (
                          <div key={optIndex} className="flex gap-2">
                            <input
                              type="text"
                              value={option}
                              onChange={(e) => updateOption(selectedSection, fieldIndex, optIndex, e.target.value)}
                              className="flex-1 p-1 border rounded text-sm"
                            />
                            <button
                              onClick={() => removeOption(selectedSection, fieldIndex, optIndex)}
                              className="text-red-500"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))}
                        <button
                          onClick={() => addOption(selectedSection, fieldIndex)}
                          className="text-sm text-blue-500"
                        >
                          + Agregar opción
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              <button
                onClick={() => addField(selectedSection)}
                className="w-full p-3 border-2 border-dashed border-gray-300 rounded text-gray-500 hover:border-blue-500 hover:text-blue-500"
              >
                + Agregar Campo
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )

  // Modo JSON - Para usuarios avanzados
  const JsonEditor = () => (
    <div className="bg-white rounded-lg p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold">Editor JSON</h3>
        <div className="flex gap-2">
          <button
            onClick={downloadConfig}
            className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded hover:bg-gray-200"
          >
            <Download size={16} />
            Descargar
          </button>
          <button
            onClick={copyConfig}
            className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded hover:bg-gray-200"
          >
            <Copy size={16} />
            Copiar
          </button>
        </div>
      </div>
      <textarea
        value={JSON.stringify(config, null, 2)}
        onChange={(e) => {
          try {
            setConfig(JSON.parse(e.target.value))
          } catch (error) {
            // Invalid JSON, don't update
          }
        }}
        className="w-full h-[600px] p-4 font-mono text-sm border rounded"
        spellCheck={false}
      />
    </div>
  )

  // Funciones de actualización
  const updateSection = (index: number, key: string, value: any) => {
    const newConfig = { ...config }
    newConfig.sections[index][key] = value
    setConfig(newConfig)
  }

  const updateField = (sectionIndex: number, fieldIndex: number, key: string, value: any) => {
    const newConfig = { ...config }
    newConfig.sections[sectionIndex].fields[fieldIndex][key] = value
    setConfig(newConfig)
  }

  const addSection = () => {
    const newSection = {
      id: `section_${Date.now()}`,
      name: 'Nueva Sección',
      icon: '📝',
      required: false,
      order: config.sections.length + 1,
      fields: []
    }
    setConfig({ ...config, sections: [...config.sections, newSection] })
  }

  const removeSection = (index: number) => {
    const newSections = config.sections.filter((_: any, i: number) => i !== index)
    setConfig({ ...config, sections: newSections })
  }

  const addField = (sectionIndex: number) => {
    const newField = {
      id: `field_${Date.now()}`,
      type: 'text',
      label: 'Nuevo Campo',
      required: false,
      order: config.sections[sectionIndex].fields.length + 1
    }
    const newConfig = { ...config }
    newConfig.sections[sectionIndex].fields.push(newField)
    setConfig(newConfig)
  }

  const removeField = (sectionIndex: number, fieldIndex: number) => {
    const newConfig = { ...config }
    newConfig.sections[sectionIndex].fields = newConfig.sections[sectionIndex].fields.filter(
      (_: any, i: number) => i !== fieldIndex
    )
    setConfig(newConfig)
  }

  const addOption = (sectionIndex: number, fieldIndex: number) => {
    const newConfig = { ...config }
    const field = newConfig.sections[sectionIndex].fields[fieldIndex]
    if (!field.options) field.options = []
    field.options.push(`Opción ${field.options.length + 1}`)
    setConfig(newConfig)
  }

  const updateOption = (sectionIndex: number, fieldIndex: number, optIndex: number, value: string) => {
    const newConfig = { ...config }
    newConfig.sections[sectionIndex].fields[fieldIndex].options[optIndex] = value
    setConfig(newConfig)
  }

  const removeOption = (sectionIndex: number, fieldIndex: number, optIndex: number) => {
    const newConfig = { ...config }
    newConfig.sections[sectionIndex].fields[fieldIndex].options = 
      newConfig.sections[sectionIndex].fields[fieldIndex].options.filter(
        (_: any, i: number) => i !== optIndex
      )
    setConfig(newConfig)
  }

  const downloadConfig = () => {
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'form-config.json'
    a.click()
  }

  const copyConfig = () => {
    navigator.clipboard.writeText(JSON.stringify(config, null, 2))
    toast.success('Configuración copiada al portapapeles')
  }

  const handleSave = async () => {
    try {
      await onSave(config)
      toast.success('Configuración guardada exitosamente')
    } catch (error) {
      toast.error('Error al guardar la configuración')
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header con toggle de modo */}
      <div className="bg-white shadow-sm mb-6">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold">Editor de Formularios</h2>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setIsJsonMode(false)}
                className={`px-3 py-1 rounded ${!isJsonMode ? 'bg-white shadow' : ''}`}
              >
                Visual
              </button>
              <button
                onClick={() => setIsJsonMode(true)}
                className={`px-3 py-1 rounded ${isJsonMode ? 'bg-white shadow' : ''}`}
              >
                JSON
              </button>
            </div>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Save size={20} />
              Guardar Cambios
            </button>
          </div>
        </div>
      </div>

      {/* Editor */}
      <div className="max-w-7xl mx-auto px-4">
        {isJsonMode ? <JsonEditor /> : <VisualEditor />}
      </div>
    </div>
  )
}