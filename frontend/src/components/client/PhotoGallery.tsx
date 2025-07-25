import React from 'react'
import { X, Camera } from 'lucide-react'

interface PhotoGalleryProps {
  vehicle: any
  onClose: () => void
}

export const PhotoGallery: React.FC<PhotoGalleryProps> = ({ vehicle, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Fotos - {vehicle.license_plate}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded">
            <X size={24} />
          </button>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Camera className="mx-auto text-gray-400 mb-4" size={64} />
            <p className="text-gray-500">No hay fotos disponibles</p>
          </div>
        </div>
      </div>
    </div>
  )
}