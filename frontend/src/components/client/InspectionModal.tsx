import React from 'react'
import { X } from 'lucide-react'

interface InspectionModalProps {
  vehicle: any
  onClose: () => void
}

export const InspectionModal: React.FC<InspectionModalProps> = ({ vehicle, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Inspección - {vehicle.license_plate}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded">
            <X size={24} />
          </button>
        </div>
        <p className="text-gray-600">Detalles de inspección próximamente...</p>
      </div>
    </div>
  )
}