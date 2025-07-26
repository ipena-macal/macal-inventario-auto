import React, { useState } from 'react'
import { Save, Plus, Trash2, Settings, Eye } from 'lucide-react'
import { toast } from 'react-hot-toast'

export const FormBuilderPage: React.FC = () => {
  const [formName, setFormName] = useState('Nuevo Formulario')
  const [fields, setFields] = useState<any[]>([])

  const fieldTypes = [
    { type: 'text', label: 'Campo de Texto', icon: '📝' },
    { type: 'number', label: 'Número', icon: '🔢' },
    { type: 'select', label: 'Lista Desplegable', icon: '📋' },
    { type: 'checkbox', label: 'Casilla de verificación', icon: '☑️' },
    { type: 'photo', label: 'Captura de Foto', icon: '📷' },
    { type: 'signature', label: 'Firma Digital', icon: '✍️' },
  ]

  const addField = (fieldType: any) => {
    const newField = {
      id: Date.now(),
      type: fieldType.type,
      label: fieldType.label,
      required: false,
      options: fieldType.type === 'select' ? ['Opción 1', 'Opción 2'] : undefined
    }
    setFields([...fields, newField])
    toast.success('Campo agregado')
  }

  const removeField = (fieldId: number) => {
    setFields(fields.filter(f => f.id !== fieldId))
    toast.success('Campo eliminado')
  }

  const saveForm = () => {
    if (fields.length === 0) {
      toast.error('Agrega al menos un campo al formulario')
      return
    }
    toast.success('Formulario guardado exitosamente')
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Constructor de Formularios</h1>
          <p className="text-gray-600">Crea formularios personalizados para inspecciones</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
            <Eye size={20} />
            Vista Previa
          </button>
          <button
            onClick={saveForm}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Save size={20} />
            Guardar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Panel de campos disponibles */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Campos Disponibles</h2>
            <div className="space-y-3">
              {fieldTypes.map((fieldType) => (
                <button
                  key={fieldType.type}
                  onClick={() => addField(fieldType)}
                  className="w-full p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{fieldType.icon}</span>
                    <span className="font-medium">{fieldType.label}</span>
                    <Plus className="ml-auto text-gray-400" size={20} />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Área de diseño */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="mb-4">
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="text-xl font-semibold w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nombre del formulario"
              />
            </div>

            {fields.length === 0 ? (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
                <Plus className="mx-auto text-gray-400 mb-4" size={48} />
                <p className="text-gray-500">
                  Haz clic en los campos de la izquierda para agregarlos al formulario
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {fields.map((field) => (
                  <div
                    key={field.id}
                    className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <input
                          type="text"
                          value={field.label}
                          onChange={(e) => {
                            const updated = fields.map(f =>
                              f.id === field.id ? { ...f, label: e.target.value } : f
                            )
                            setFields(updated)
                          }}
                          className="font-medium mb-2 px-2 py-1 border rounded"
                          placeholder="Etiqueta del campo"
                        />
                        
                        {field.type === 'select' && (
                          <div className="mt-2 space-y-1">
                            {field.options.map((option: string, idx: number) => (
                              <input
                                key={idx}
                                type="text"
                                value={option}
                                onChange={(e) => {
                                  const newOptions = [...field.options]
                                  newOptions[idx] = e.target.value
                                  const updated = fields.map(f =>
                                    f.id === field.id ? { ...f, options: newOptions } : f
                                  )
                                  setFields(updated)
                                }}
                                className="text-sm px-2 py-1 border rounded mr-2"
                                placeholder={`Opción ${idx + 1}`}
                              />
                            ))}
                          </div>
                        )}

                        <label className="flex items-center gap-2 mt-2">
                          <input
                            type="checkbox"
                            checked={field.required}
                            onChange={(e) => {
                              const updated = fields.map(f =>
                                f.id === field.id ? { ...f, required: e.target.checked } : f
                              )
                              setFields(updated)
                            }}
                            className="rounded"
                          />
                          <span className="text-sm text-gray-600">Campo requerido</span>
                        </label>
                      </div>
                      
                      <div className="flex gap-2">
                        <button className="p-2 text-gray-500 hover:text-gray-700">
                          <Settings size={18} />
                        </button>
                        <button
                          onClick={() => removeField(field.id)}
                          className="p-2 text-red-500 hover:text-red-700"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}