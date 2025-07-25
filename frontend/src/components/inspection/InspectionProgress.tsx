import React from 'react'

interface InspectionProgressProps {
  current: number
  total: number
}

export const InspectionProgress: React.FC<InspectionProgressProps> = ({ current, total }) => {
  const percentage = (current / total) * 100

  return (
    <div className="w-full">
      <div className="flex justify-between text-sm mb-2">
        <span>Progreso</span>
        <span>{current} de {total}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}