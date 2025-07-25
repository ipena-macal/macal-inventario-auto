import React, { useState } from 'react'
import { X, Copy, Star, Download, Share2, ChevronLeft, ChevronRight } from 'lucide-react'
import { FormPreview } from './FormPreview'
import { MarketplaceTemplate } from '@/types/marketplace'

interface TemplatePreviewModalProps {
  template: MarketplaceTemplate
  onClose: () => void
  onUse: () => void
}

export const TemplatePreviewModal: React.FC<TemplatePreviewModalProps> = ({
  template,
  onClose,
  onUse
}) => {
  const [showFormPreview, setShowFormPreview] = useState(false)
  const [currentScreenshot, setCurrentScreenshot] = useState(0)

  const screenshots = template.screenshots || [
    '/placeholder-form-1.png',
    '/placeholder-form-2.png',
    '/placeholder-form-3.png'
  ]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-4">
            <div className="text-4xl">{template.icon}</div>
            <div>
              <h2 className="text-2xl font-bold">{template.name}</h2>
              <p className="text-gray-600">{template.category}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto" style={{ maxHeight: 'calc(90vh - 200px)' }}>
          <div className="p-6">
            {/* Description */}
            <div className="mb-6">
              <h3 className="font-semibold mb-2">Descripción</h3>
              <p className="text-gray-600">{template.description}</p>
            </div>

            {/* Screenshots */}
            {screenshots.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold mb-2">Capturas de pantalla</h3>
                <div className="relative bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src={screenshots[currentScreenshot]}
                    alt={`Screenshot ${currentScreenshot + 1}`}
                    className="w-full h-96 object-contain"
                  />
                  
                  {/* Navigation */}
                  {screenshots.length > 1 && (
                    <>
                      <button
                        onClick={() => setCurrentScreenshot(prev => 
                          prev > 0 ? prev - 1 : screenshots.length - 1
                        )}
                        className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100"
                      >
                        <ChevronLeft size={20} />
                      </button>
                      <button
                        onClick={() => setCurrentScreenshot(prev => 
                          prev < screenshots.length - 1 ? prev + 1 : 0
                        )}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100"
                      >
                        <ChevronRight size={20} />
                      </button>
                    </>
                  )}
                  
                  {/* Indicators */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                    {screenshots.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentScreenshot(idx)}
                        className={`w-2 h-2 rounded-full transition-all ${
                          idx === currentScreenshot 
                            ? 'bg-blue-600 w-8' 
                            : 'bg-gray-400'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Features */}
            <div className="mb-6">
              <h3 className="font-semibold mb-2">Características</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm">{template.config.sections.length} secciones</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm">
                    {template.config.sections.reduce((acc, s) => acc + s.fields.length, 0)} campos
                  </span>
                </div>
                {template.config.settings.requireSignature && (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm">Requiere firma</span>
                  </div>
                )}
                {template.config.settings.requirePhotos && (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm">Incluye captura de fotos</span>
                  </div>
                )}
                {template.config.settings.allowVoiceNotes && (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm">Soporta notas de voz</span>
                  </div>
                )}
              </div>
            </div>

            {/* Tags */}
            <div className="mb-6">
              <h3 className="font-semibold mb-2">Etiquetas</h3>
              <div className="flex flex-wrap gap-2">
                {template.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Stats */}
            {template.downloads !== undefined && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="flex items-center justify-center gap-1 text-yellow-500 mb-1">
                      <Star size={20} fill="currentColor" />
                      <span className="text-2xl font-bold text-gray-900">
                        {template.rating.toFixed(1)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">Calificación</p>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900 mb-1">
                      {template.downloads}
                    </div>
                    <p className="text-sm text-gray-600">Descargas</p>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900 mb-1">
                      {template.ratingCount}
                    </div>
                    <p className="text-sm text-gray-600">Reseñas</p>
                  </div>
                </div>
              </div>
            )}

            {/* Publisher */}
            {template.publisher && (
              <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-200 rounded-full flex items-center justify-center">
                    <span className="text-xl font-bold text-blue-700">
                      {template.publisher.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold">{template.publisher.name}</p>
                    <p className="text-sm text-gray-600">
                      Publicado el {new Date(template.publishedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t p-6">
          <div className="flex gap-3">
            <button
              onClick={() => setShowFormPreview(true)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
            >
              Probar formulario
            </button>
            <button
              onClick={onUse}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              <Copy size={20} />
              Usar esta plantilla
            </button>
          </div>
        </div>
      </div>

      {/* Form Preview */}
      {showFormPreview && (
        <FormPreview
          config={template.config}
          mode="mobile"
          onClose={() => setShowFormPreview(false)}
        />
      )}
    </div>
  )
}