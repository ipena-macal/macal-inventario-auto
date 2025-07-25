import React from 'react'
import { X, Download } from 'lucide-react'

interface ExportModalProps {
  vehicles: any[]
  onClose: () => void
}

export const ExportModal: React.FC<ExportModalProps> = ({ vehicles, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Exportar Vehículos</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded">
            <X size={24} />
          </button>
        </div>
        <div className="space-y-3">
          <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
            <Download size={20} />
            Exportar a Excel
          </button>
          <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            <Download size={20} />
            Exportar a PDF
          </button>
        </div>
      </div>
    </div>
  )
}