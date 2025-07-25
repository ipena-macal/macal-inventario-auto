import React, { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { 
  Search, Filter, Download, Star, TrendingUp, 
  Award, Clock, Users, Plus, Eye, Copy 
} from 'lucide-react'

// Components
import { TemplateCard } from '@/components/admin/TemplateCard'
import { TemplatePreviewModal } from '@/components/admin/TemplatePreviewModal'
import { CategoryFilter } from '@/components/admin/CategoryFilter'

// Services
import { marketplaceService } from '@/services/marketplaceService'
import { formTemplateService } from '@/services/formTemplateService'

// Types
import { MarketplaceTemplate, TemplateCategory } from '@/types/marketplace'

export const TemplateMarketplacePage: React.FC = () => {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'popular' | 'recent' | 'rating'>('popular')
  const [showPreview, setShowPreview] = useState<MarketplaceTemplate | null>(null)
  const [activeTab, setActiveTab] = useState<'marketplace' | 'predefined'>('predefined')

  // Fetch marketplace templates
  const { data: marketplaceTemplates, isLoading: loadingMarketplace } = useQuery({
    queryKey: ['marketplace-templates', selectedCategory, sortBy],
    queryFn: () => marketplaceService.getTemplates({
      category: selectedCategory === 'all' ? undefined : selectedCategory,
      sortBy
    })
  })

  // Fetch predefined templates
  const { data: predefinedTemplates } = useQuery({
    queryKey: ['predefined-templates'],
    queryFn: () => marketplaceService.getPredefinedTemplates()
  })

  // Fetch categories
  const { data: categories } = useQuery({
    queryKey: ['template-categories'],
    queryFn: () => marketplaceService.getCategories()
  })

  // Use template mutation
  const useTemplateMutation = useMutation({
    mutationFn: async (template: any) => {
      // Create a new form template based on the marketplace template
      return formTemplateService.createTemplate({
        name: `${template.name} (Copy)`,
        type: 'inspection',
        config: template.config
      })
    },
    onSuccess: (result) => {
      toast.success('Plantilla importada exitosamente')
      navigate(`/admin/forms/${result.id}/edit`)
    },
    onError: () => {
      toast.error('Error al importar la plantilla')
    }
  })

  // Filter templates based on search
  const filteredTemplates = activeTab === 'marketplace' 
    ? marketplaceTemplates?.filter(t => 
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : predefinedTemplates?.filter(t => 
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      ).filter(t => selectedCategory === 'all' || t.category === selectedCategory)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Biblioteca de Plantillas
              </h1>
              <p className="mt-2 text-gray-600">
                Explora plantillas prediseñadas o comparte las tuyas con la comunidad
              </p>
            </div>
            <button
              onClick={() => navigate('/admin/forms/new')}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus size={20} />
              Crear desde cero
            </button>
          </div>

          {/* Stats */}
          <div className="mt-6 grid grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Award className="text-blue-600" size={24} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{predefinedTemplates?.length || 0}</p>
                  <p className="text-sm text-gray-600">Plantillas oficiales</p>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Users className="text-green-600" size={24} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{marketplaceTemplates?.length || 0}</p>
                  <p className="text-sm text-gray-600">De la comunidad</p>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Download className="text-purple-600" size={24} />
                </div>
                <div>
                  <p className="text-2xl font-bold">1,234</p>
                  <p className="text-sm text-gray-600">Descargas totales</p>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Star className="text-yellow-600" size={24} />
                </div>
                <div>
                  <p className="text-2xl font-bold">4.8</p>
                  <p className="text-sm text-gray-600">Calificación promedio</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Filters and Search */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Buscar plantillas..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setActiveTab('predefined')}
                className={`px-4 py-1.5 rounded ${
                  activeTab === 'predefined' 
                    ? 'bg-white shadow text-blue-600' 
                    : 'text-gray-600'
                }`}
              >
                Oficiales
              </button>
              <button
                onClick={() => setActiveTab('marketplace')}
                className={`px-4 py-1.5 rounded ${
                  activeTab === 'marketplace' 
                    ? 'bg-white shadow text-blue-600' 
                    : 'text-gray-600'
                }`}
              >
                Comunidad
              </button>
            </div>

            {/* Sort */}
            {activeTab === 'marketplace' && (
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-4 py-2 border rounded-lg"
              >
                <option value="popular">Más populares</option>
                <option value="recent">Más recientes</option>
                <option value="rating">Mejor calificados</option>
              </select>
            )}
          </div>

          {/* Categories */}
          <div className="mt-4 flex gap-2 overflow-x-auto">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-full whitespace-nowrap ${
                selectedCategory === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Todas
            </button>
            {categories?.map(cat => (
              <button
                key={cat.slug}
                onClick={() => setSelectedCategory(cat.slug)}
                className={`px-4 py-2 rounded-full whitespace-nowrap flex items-center gap-2 ${
                  selectedCategory === cat.slug
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="max-w-7xl mx-auto px-4 pb-8">
        {loadingMarketplace && activeTab === 'marketplace' ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredTemplates?.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No se encontraron plantillas</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates?.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                onPreview={() => setShowPreview(template)}
                onUse={() => useTemplateMutation.mutate(template)}
                isOfficial={activeTab === 'predefined'}
              />
            ))}
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <TemplatePreviewModal
          template={showPreview}
          onClose={() => setShowPreview(null)}
          onUse={() => {
            useTemplateMutation.mutate(showPreview)
            setShowPreview(null)
          }}
        />
      )}

      {/* Floating Action Button - Share Template */}
      <button
        onClick={() => navigate('/admin/forms/share')}
        className="fixed bottom-6 right-6 p-4 bg-green-600 text-white rounded-full shadow-lg hover:bg-green-700 transition-all hover:scale-110"
        title="Compartir tu plantilla"
      >
        <TrendingUp size={24} />
      </button>
    </div>
  )
}

// Template Card Component
const TemplateCard: React.FC<{
  template: any
  onPreview: () => void
  onUse: () => void
  isOfficial: boolean
}> = ({ template, onPreview, onUse, isOfficial }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm hover:shadow-lg transition-shadow p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="text-3xl">{template.icon}</div>
          <div>
            <h3 className="font-semibold text-lg">{template.name}</h3>
            {isOfficial && (
              <span className="inline-flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                <Award size={12} />
                Oficial
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Description */}
      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
        {template.description}
      </p>

      {/* Tags */}
      <div className="flex flex-wrap gap-2 mb-4">
        {template.tags.slice(0, 3).map((tag: string, idx: number) => (
          <span
            key={idx}
            className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded"
          >
            #{tag}
          </span>
        ))}
      </div>

      {/* Stats */}
      {!isOfficial && (
        <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
          <div className="flex items-center gap-1">
            <Download size={16} />
            <span>{template.downloads}</span>
          </div>
          <div className="flex items-center gap-1">
            <Star size={16} className="text-yellow-500" />
            <span>{template.rating.toFixed(1)}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock size={16} />
            <span>{template.updatedAt}</span>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={onPreview}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
        >
          <Eye size={16} />
          Vista previa
        </button>
        <button
          onClick={onUse}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Copy size={16} />
          Usar plantilla
        </button>
      </div>
    </div>
  )
}