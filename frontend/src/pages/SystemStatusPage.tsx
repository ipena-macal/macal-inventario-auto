import React from 'react'
import { Activity, Server, Database, Cloud, Shield, Zap } from 'lucide-react'

export const SystemStatusPage: React.FC = () => {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-8">Estado del Sistema</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">API Backend</h3>
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Server size={20} />
            <span>Node.js + Express</span>
          </div>
          <p className="text-sm text-gray-500 mt-2">Tiempo de respuesta: 45ms</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Base de Datos</h3>
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Database size={20} />
            <span>PostgreSQL</span>
          </div>
          <p className="text-sm text-gray-500 mt-2">4 conexiones activas</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Tiempo Real</h3>
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Zap size={20} />
            <span>Redis + WebSocket</span>
          </div>
          <p className="text-sm text-gray-500 mt-2">12 clientes conectados</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Almacenamiento</h3>
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Cloud size={20} />
            <span>AWS S3</span>
          </div>
          <p className="text-sm text-gray-500 mt-2">2.3 GB utilizados</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Seguridad</h3>
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Shield size={20} />
            <span>SSL/TLS Activo</span>
          </div>
          <p className="text-sm text-gray-500 mt-2">Certificado válido</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Frontend</h3>
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Activity size={20} />
            <span>React + TypeScript</span>
          </div>
          <p className="text-sm text-gray-500 mt-2">CloudFront CDN activo</p>
        </div>
      </div>

      <div className="mt-8 bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Información del Sistema</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium mb-2">Versión</h3>
            <p className="text-gray-600">MACAL Inventory v2.0.0</p>
          </div>
          <div>
            <h3 className="font-medium mb-2">Última Actualización</h3>
            <p className="text-gray-600">25 de Julio, 2025</p>
          </div>
          <div>
            <h3 className="font-medium mb-2">Región AWS</h3>
            <p className="text-gray-600">US East (Ohio) - us-east-2</p>
          </div>
          <div>
            <h3 className="font-medium mb-2">Uptime</h3>
            <p className="text-gray-600">99.9% (últimos 30 días)</p>
          </div>
        </div>
      </div>
    </div>
  )
}