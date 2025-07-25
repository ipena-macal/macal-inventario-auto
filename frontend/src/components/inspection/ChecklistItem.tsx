import React from 'react'

interface ChecklistItemProps {
  item: any
  onChange: (value: any) => void
}

export const ChecklistItem: React.FC<ChecklistItemProps> = ({ item, onChange }) => {
  return (
    <div className="p-4 border rounded">
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          onChange={(e) => onChange(e.target.checked)}
          className="rounded"
        />
        <span>{item.label || 'Checklist Item'}</span>
      </label>
    </div>
  )
}