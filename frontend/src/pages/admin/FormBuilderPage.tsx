import React, { useState } from 'react'
import { DndProvider, useDrag, useDrop } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { Save, Plus, Trash2, Settings, Eye } from 'lucide-react'
import { toast } from 'react-hot-toast'

// Tipos de campos disponibles
const FIELD_TYPES = [
  { type: 'text', label: 'Texto', icon: '📝' },
  { type: 'number', label: 'Número', icon: '🔢' },
  { type: 'select', label: 'Selección', icon: '📋' },
  { type: 'checkbox', label: 'Checkbox', icon: '☑️' },
  { type: 'radio', label: 'Radio', icon: '⭕' },
  { type: 'photo', label: 'Foto', icon: '📷' },
  { type: 'signature', label: 'Firma', icon: '✍️' },
  { type: 'section', label: 'Sección', icon: '📁' },
]

// Componente de campo arrastrable
const DraggableField: React.FC<{ field: any }> = ({ field }) => {
  const [{ isDragging }, drag] = useDrag({
    type: 'field',
    item: field,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  })

  return (
    <div
      ref={drag}
      className={`p-3 bg-white border rounded-lg cursor-move transition-all ${
        isDragging ? 'opacity-50' : 'hover:shadow-md'
      }`}
    >
      <div className="flex items-center gap-2">
        <span className="text-2xl">{field.icon}</span>
        <span className="font-medium">{field.label}</span>
      </div>
    </div>
  )
}

// Área de diseño del formulario
const FormCanvas: React.FC<{
  fields: any[]
  onFieldsChange: (fields: any[]) => void
}> = ({ fields, onFieldsChange }) => {
  const [selectedField, setSelectedField] = useState<number | null>(null)

  const [, drop] = useDrop({
    accept: 'field',
    drop: (item: any) => {
      const newField = {
        id: Date.now(),
        ...item,
        label: `${item.label} ${fields.length + 1}`,
        required: false,
        options: item.type === 'select' || item.type === 'radio' ? ['Opción 1', 'Opción 2'] : undefined,
      }
      onFieldsChange([...fields, newField])
    },
  })

  const updateField = (index: number, updates: any) => {
    const newFields = [...fields]
    newFields[index] = { ...newFields[index], ...updates }
    onFieldsChange(newFields)
  }

  const removeField = (index: number) => {
    onFieldsChange(fields.filter((_, i) => i !== index))
  }

  return (
    <div
      ref={drop}
      className="min-h-[500px] bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-4"
    >
      {fields.length === 0 ? (
        <div className="h-full flex items-center justify-center text-gray-400">
          <div className="text-center">
            <Plus size={48} className="mx-auto mb-4" />
            <p>Arrastra campos aquí para comenzar</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {fields.map((field, index) => (
            <div
              key={field.id}
              className={`bg-white p-4 rounded-lg border-2 transition-all ${
                selectedField === index ? 'border-blue-500' : 'border-gray-200'
              }`}
              onClick={() => setSelectedField(index)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <input
                    type="text"
                    value={field.label}
                    onChange={(e) => updateField(index, { label: e.target.value })}
                    className="text-lg font-medium bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-500 outline-none"
                  />
                  
                  {/* Vista previa del campo */}
                  <div className="mt-2">
                    {field.type === 'text' && (
                      <input type="text" placeholder="Texto de ejemplo" className="w-full p-2 border rounded" disabled />
                    )}
                    {field.type === 'select' && (
                      <select className="w-full p-2 border rounded" disabled>
                        {field.options?.map((opt: string, i: number) => (
                          <option key={i}>{opt}</option>
                        ))}
                      </select>
                    )}
                    {field.type === 'checkbox' && (
                      <label className="flex items-center gap-2">
                        <input type="checkbox" disabled />
                        <span>Opción de ejemplo</span>
                      </label>
                    )}
                    {field.type === 'photo' && (
                      <div className="p-4 bg-gray-100 rounded text-center text-gray-500">
                        📷 Captura de foto
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    removeField(index)
                  }}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 size={20} />
                </button>
              </div>

              {/* Configuración del campo */}
              {selectedField === index && (
                <div className="mt-4 p-3 bg-gray-50 rounded">
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={field.required}
                        onChange={(e) => updateField(index, { required: e.target.checked })}
                      />
                      <span className="text-sm">Requerido</span>
                    </label>
                  </div>

                  {/* Opciones para select/radio */}
                  {(field.type === 'select' || field.type === 'radio') && (
                    <div className="mt-3">
                      <label className="text-sm font-medium">Opciones:</label>
                      {field.options?.map((opt: string, i: number) => (
                        <div key={i} className="flex gap-2 mt-1">
                          <input
                            type="text"
                            value={opt}
                            onChange={(e) => {
                              const newOptions = [...field.options]
                              newOptions[i] = e.target.value
                              updateField(index, { options: newOptions })
                            }}
                            className="flex-1 p-1 border rounded text-sm"
                          />
                          <button
                            onClick={() => {
                              const newOptions = field.options.filter((_: any, oi: number) => oi !== i)
                              updateField(index, { options: newOptions })
                            }}
                            className="text-red-500"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => {
                          updateField(index, { options: [...field.options, `Opción ${field.options.length + 1}`] })
                        }}
                        className="mt-1 text-sm text-blue-500"
                      >
                        + Agregar opción
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export const FormBuilderPage: React.FC = () => {
  const [formName, setFormName] = useState('Nuevo Formulario de Inspección')
  const [fields, setFields] = useState<any[]>([])
  const [showPreview, setShowPreview] = useState(false)

  const saveForm = async () => {
    try {
      // Aquí guardarías el formulario en la base de datos
      const formConfig = {
        name: formName,
        fields: fields,
        createdAt: new Date(),
        version: 1,
      }
      
      console.log('Saving form:', formConfig)
      // await api.saveFormTemplate(formConfig)
      
      toast.success('Formulario guardado exitosamente')
    } catch (error) {
      toast.error('Error al guardar el formulario')
    }
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="min-h-screen bg-gray-100">
        {/* Header */}
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex-1">
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="text-2xl font-bold bg-transparent border-b-2 border-transparent hover:border-gray-300 focus:border-blue-500 outline-none"
              />
              <p className="text-sm text-gray-500 mt-1">
                Arrastra y suelta campos para diseñar tu formulario
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
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
        </header>

        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-12 gap-6">
            {/* Panel de campos */}
            <div className="col-span-3">
              <h3 className="font-semibold mb-4">Campos Disponibles</h3>
              <div className="space-y-3">
                {FIELD_TYPES.map((field) => (
                  <DraggableField key={field.type} field={field} />
                ))}
              </div>
            </div>

            {/* Área de diseño */}
            <div className="col-span-9">
              <h3 className="font-semibold mb-4">Diseño del Formulario</h3>
              <FormCanvas fields={fields} onFieldsChange={setFields} />
            </div>
          </div>
        </div>

        {/* Modal de vista previa */}
        {showPreview && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6">
              <h2 className="text-2xl font-bold mb-6">{formName}</h2>
              <div className="space-y-4">
                {fields.map((field) => (
                  <div key={field.id}>
                    <label className="block text-sm font-medium mb-1">
                      {field.label}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    {/* Renderizar campos según su tipo */}
                    {field.type === 'text' && (
                      <input type="text" className="w-full p-2 border rounded" />
                    )}
                    {field.type === 'select' && (
                      <select className="w-full p-2 border rounded">
                        <option>Seleccionar...</option>
                        {field.options?.map((opt: string, i: number) => (
                          <option key={i}>{opt}</option>
                        ))}
                      </select>
                    )}
                    {/* ... otros tipos de campos ... */}
                  </div>
                ))}
              </div>
              <button
                onClick={() => setShowPreview(false)}
                className="mt-6 w-full py-2 bg-gray-100 rounded hover:bg-gray-200"
              >
                Cerrar Vista Previa
              </button>
            </div>
          </div>
        )}
      </div>
    </DndProvider>
  )
}