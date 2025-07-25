export interface FormTemplate {
  id: string
  name: string
  type: string
  version: number
  active: boolean
  config: FormConfig
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface FormConfig {
  sections: FormSection[]
  settings: FormSettings
}

export interface FormSection {
  id: string
  name: string
  icon?: string
  fields: FormField[]
  required: boolean
  order: number
}

export interface FormField {
  id: string
  type: FieldType
  label: string
  placeholder?: string
  required: boolean
  options?: string[]
  validation?: FieldValidation
  defaultValue?: any
  conditional?: FieldCondition
  order: number
}

export type FieldType = 
  | 'text' 
  | 'number' 
  | 'select' 
  | 'checkbox' 
  | 'radio' 
  | 'photo' 
  | 'signature' 
  | 'date' 
  | 'time'

export interface FieldValidation {
  min?: number
  max?: number
  minLength?: number
  maxLength?: number
  pattern?: string
  minPhotos?: number
  maxPhotos?: number
}

export interface FieldCondition {
  field: string
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than'
  value: any
}

export interface FormSettings {
  requireSignature: boolean
  requirePhotos: boolean
  minPhotosPerItem: number
  allowVoiceNotes: boolean
  allowSkipSections: boolean
  autoSaveInterval: number
  completionRequires: string[]
}

// Form instance (filled form)
export interface FormInstance {
  id: string
  templateId: string
  templateVersion: number
  vehicleId: string
  inspectorId: string
  status: 'draft' | 'in_progress' | 'completed' | 'approved'
  data: Record<string, any>
  signature?: string
  completedAt?: string
  createdAt: string
  updatedAt: string
}

// Form validation result
export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
}

export interface ValidationError {
  field: string
  message: string
  section?: string
}