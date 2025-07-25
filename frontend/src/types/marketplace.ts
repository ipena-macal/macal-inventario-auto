import { FormConfig } from './forms'

export interface MarketplaceTemplate {
  id: string
  templateId: string
  name: string
  description: string
  category: string
  tags: string[]
  icon: string
  screenshots: string[]
  config: FormConfig
  
  // Marketplace metadata
  downloads: number
  rating: number
  ratingCount: number
  isOfficial: boolean
  isFeatured: boolean
  
  // Publishing info
  publishedBy: string
  publisher?: {
    id: string
    name: string
    avatar?: string
  }
  publishedAt: string
  updatedAt: string
}

export interface PredefinedTemplate {
  id: string
  name: string
  description: string
  category: string
  icon: string
  tags: string[]
  screenshots: string[]
  config: FormConfig
}

export interface TemplateCategory {
  slug: string
  name: string
  description: string
  icon: string
  order: number
}

export interface TemplateRating {
  id: string
  templateId: string
  userId: string
  rating: number
  comment?: string
  isVerified: boolean
  createdAt: string
  updatedAt: string
  user?: {
    id: string
    name: string
    avatar?: string
  }
}

export interface TemplateFilters {
  category?: string
  tags?: string[]
  minRating?: number
  sortBy?: 'popular' | 'recent' | 'rating' | 'downloads'
  search?: string
}

export interface PublishTemplateRequest {
  name: string
  description: string
  category: string
  tags: string[]
  icon?: string
  screenshots?: string[]
}