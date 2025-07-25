import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import { Camera, Mic, Save, Check, X, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react'
import io from 'socket.io-client'

// Components
import { PhotoCapture } from '@/components/inspection/PhotoCapture'
import { VoiceRecorder } from '@/components/inspection/VoiceRecorder'
import { ChecklistItem } from '@/components/inspection/ChecklistItem'
import { SignaturePad } from '@/components/inspection/SignaturePad'
import { OfflineIndicator } from '@/components/OfflineIndicator'

// Hooks
import { useRealtimeInspection } from '@/hooks/useRealtimeInspection'
import { useOfflineSync } from '@/hooks/useOfflineSync'

// Services
import { inspectionService } from '@/services/inspectionService'

// Types
import { InspectionSection, InspectionItemStatus } from '@/types/inspection'

const INSPECTION_SECTIONS = [
  { id: 'exterior', name: 'Exterior', icon: '🚗' },
  { id: 'interior', name: 'Interior', icon: '🪑' },
  { id: 'engine', name: 'Motor', icon: '⚙️' },
  { id: 'mechanical', name: 'Mecánica', icon: '🔧' },
  { id: 'electrical', name: 'Eléctrico', icon: '⚡' },
  { id: 'tires', name: 'Neumáticos', icon: '🛞' },
  { id: 'documents', name: 'Documentos', icon: '📄' },
  { id: 'summary', name: 'Resumen', icon: '📋' },
]

export const InspectionFlowPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [currentSection, setCurrentSection] = useState(0)
  const [showPhotoCapture, setShowPhotoCapture] = useState(false)
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false)
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)

  // Real-time inspection hook
  const {
    inspection,
    updateField,
    addPhoto,
    addVoiceNote,
    completeSection,
    isConnected,
    pendingUpdates,
  } = useRealtimeInspection(id!)

  // Offline sync
  const { isOnline, syncPending } = useOfflineSync()

  // Complete inspection mutation
  const completeMutation = useMutation({
    mutationFn: () => inspectionService.completeInspection(id!),
    onSuccess: () => {
      toast.success('Inspección completada exitosamente')
      navigate(`/inspections/${id}`)
    },
    onError: () => {
      toast.error('Error al completar la inspección')
    },
  })

  // Handle section navigation
  const handleNextSection = useCallback(() => {
    if (currentSection < INSPECTION_SECTIONS.length - 1) {
      // Mark current section as completed
      completeSection(INSPECTION_SECTIONS[currentSection].id)
      setCurrentSection(prev => prev + 1)
    }
  }, [currentSection, completeSection])

  const handlePrevSection = useCallback(() => {
    if (currentSection > 0) {
      setCurrentSection(prev => prev - 1)
    }
  }, [currentSection])

  // Handle item status update
  const handleItemStatusUpdate = useCallback(
    (itemId: string, status: InspectionItemStatus) => {
      const sectionId = INSPECTION_SECTIONS[currentSection].id
      updateField(`sections.${sectionId}.items.${itemId}.status`, status)
    },
    [currentSection, updateField]
  )

  // Handle photo capture
  const handlePhotoCapture = useCallback(
    async (photoData: Blob) => {
      if (!selectedItemId) return

      const sectionId = INSPECTION_SECTIONS[currentSection].id
      const formData = new FormData()
      formData.append('photo', photoData)
      formData.append('section', sectionId)
      formData.append('itemId', selectedItemId)

      try {
        await addPhoto(formData)
        toast.success('Foto agregada')
        setShowPhotoCapture(false)
      } catch (error) {
        toast.error('Error al subir la foto')
      }
    },
    [selectedItemId, currentSection, addPhoto]
  )

  // Handle voice note
  const handleVoiceNote = useCallback(
    async (audioBlob: Blob) => {
      if (!selectedItemId) return

      const sectionId = INSPECTION_SECTIONS[currentSection].id
      const formData = new FormData()
      formData.append('audio', audioBlob)
      formData.append('section', sectionId)
      formData.append('itemId', selectedItemId)

      try {
        await addVoiceNote(formData)
        toast.success('Nota de voz agregada')
        setShowVoiceRecorder(false)
      } catch (error) {
        toast.error('Error al guardar la nota de voz')
      }
    },
    [selectedItemId, currentSection, addVoiceNote]
  )

  // Render current section content
  const renderSectionContent = () => {
    const section = INSPECTION_SECTIONS[currentSection]
    
    if (section.id === 'summary') {
      return <InspectionSummary inspection={inspection} onComplete={completeMutation.mutate} />
    }

    const sectionData = inspection?.sections[section.id]
    if (!sectionData) return <div>Cargando sección...</div>

    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <span>{section.icon}</span>
          <span>{section.name}</span>
        </h2>

        <div className="space-y-3">
          {sectionData.items.map((item) => (
            <ChecklistItem
              key={item.id}
              item={item}
              onStatusChange={(status) => handleItemStatusUpdate(item.id, status)}
              onPhotoClick={() => {
                setSelectedItemId(item.id)
                setShowPhotoCapture(true)
              }}
              onVoiceClick={() => {
                setSelectedItemId(item.id)
                setShowVoiceRecorder(true)
              }}
              onNotesChange={(notes) =>
                updateField(`sections.${section.id}.items.${item.id}.notes`, notes)
              }
            />
          ))}
        </div>

        {/* Section notes */}
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notas de la sección
          </label>
          <textarea
            className="w-full p-3 border rounded-lg resize-none"
            rows={3}
            placeholder="Agregar observaciones generales..."
            value={sectionData.notes || ''}
            onChange={(e) =>
              updateField(`sections.${section.id}.notes`, e.target.value)
            }
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-semibold">
            Inspección #{inspection?.id.slice(0, 8)}
          </h1>
          <div className="flex items-center gap-3">
            <OfflineIndicator isOnline={isOnline} pendingSync={pendingUpdates} />
            {isConnected ? (
              <div className="flex items-center gap-1 text-green-600">
                <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse" />
                <span className="text-sm">Conectado</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-gray-500">
                <div className="w-2 h-2 bg-gray-500 rounded-full" />
                <span className="text-sm">Sin conexión</span>
              </div>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-gray-200">
          <div
            className="h-full bg-blue-600 transition-all duration-300"
            style={{ width: `${((currentSection + 1) / INSPECTION_SECTIONS.length) * 100}%` }}
          />
        </div>

        {/* Section tabs */}
        <div className="px-4 py-2 flex gap-2 overflow-x-auto">
          {INSPECTION_SECTIONS.map((section, index) => (
            <button
              key={section.id}
              onClick={() => setCurrentSection(index)}
              className={`px-3 py-1 rounded-full text-sm whitespace-nowrap transition-colors ${
                index === currentSection
                  ? 'bg-blue-600 text-white'
                  : index < currentSection
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {section.icon} {section.name}
            </button>
          ))}
        </div>
      </header>

      {/* Main content */}
      <main className="px-4 py-6 max-w-2xl mx-auto">
        {renderSectionContent()}
      </main>

      {/* Navigation buttons */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4">
        <div className="max-w-2xl mx-auto flex justify-between">
          <button
            onClick={handlePrevSection}
            disabled={currentSection === 0}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg disabled:opacity-50"
          >
            <ChevronLeft size={20} />
            Anterior
          </button>

          {currentSection < INSPECTION_SECTIONS.length - 1 ? (
            <button
              onClick={handleNextSection}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg"
            >
              Siguiente
              <ChevronRight size={20} />
            </button>
          ) : null}
        </div>
      </div>

      {/* Modals */}
      {showPhotoCapture && (
        <PhotoCapture
          onCapture={handlePhotoCapture}
          onClose={() => setShowPhotoCapture(false)}
        />
      )}

      {showVoiceRecorder && (
        <VoiceRecorder
          onRecord={handleVoiceNote}
          onClose={() => setShowVoiceRecorder(false)}
        />
      )}
    </div>
  )
}

// Summary component
const InspectionSummary: React.FC<{
  inspection: any
  onComplete: () => void
}> = ({ inspection, onComplete }) => {
  const [signature, setSignature] = useState<string>('')

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Resumen de Inspección</h2>

      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-green-600">
            {/* Count OK items */}
            12
          </div>
          <div className="text-sm text-green-700">Elementos OK</div>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-yellow-600">
            {/* Count warning items */}
            3
          </div>
          <div className="text-sm text-yellow-700">Advertencias</div>
        </div>
      </div>

      {/* Final notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Observaciones finales
        </label>
        <textarea
          className="w-full p-3 border rounded-lg resize-none"
          rows={4}
          placeholder="Resumen general del estado del vehículo..."
        />
      </div>

      {/* Signature */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Firma del inspector
        </label>
        <SignaturePad
          onSave={setSignature}
          className="border rounded-lg"
        />
      </div>

      {/* Complete button */}
      <button
        onClick={onComplete}
        disabled={!signature}
        className="w-full py-3 bg-green-600 text-white rounded-lg font-medium disabled:opacity-50"
      >
        Completar Inspección
      </button>
    </div>
  )
}