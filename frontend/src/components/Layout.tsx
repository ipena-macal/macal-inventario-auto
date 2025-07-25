import React from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'
import { Car, LayoutDashboard, FileText, Settings, Users } from 'lucide-react'

export const Layout: React.FC = () => {
  const location = useLocation()

  const isActive = (path: string) => location.pathname.startsWith(path)

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 w-64 bg-gray-900">
        <div className="flex items-center justify-center h-16 bg-gray-800">
          <h1 className="text-white text-xl font-bold">MACAL Inventory</h1>
        </div>
        
        <nav className="mt-8">
          <Link
            to="/dashboard"
            className={`flex items-center gap-3 px-6 py-3 text-gray-300 hover:bg-gray-800 hover:text-white ${
              isActive('/dashboard') ? 'bg-gray-800 text-white' : ''
            }`}
          >
            <LayoutDashboard size={20} />
            Dashboard
          </Link>
          
          <Link
            to="/vehicles"
            className={`flex items-center gap-3 px-6 py-3 text-gray-300 hover:bg-gray-800 hover:text-white ${
              isActive('/vehicles') ? 'bg-gray-800 text-white' : ''
            }`}
          >
            <Car size={20} />
            Vehículos
          </Link>
          
          <Link
            to="/inspections"
            className={`flex items-center gap-3 px-6 py-3 text-gray-300 hover:bg-gray-800 hover:text-white ${
              isActive('/inspections') ? 'bg-gray-800 text-white' : ''
            }`}
          >
            <FileText size={20} />
            Inspecciones
          </Link>
          
          <Link
            to="/admin/forms"
            className={`flex items-center gap-3 px-6 py-3 text-gray-300 hover:bg-gray-800 hover:text-white ${
              isActive('/admin/forms') ? 'bg-gray-800 text-white' : ''
            }`}
          >
            <Settings size={20} />
            Formularios
          </Link>
          
          <Link
            to="/admin/clients"
            className={`flex items-center gap-3 px-6 py-3 text-gray-300 hover:bg-gray-800 hover:text-white ${
              isActive('/admin/clients') ? 'bg-gray-800 text-white' : ''
            }`}
          >
            <Users size={20} />
            Clientes
          </Link>
        </nav>
      </aside>

      {/* Main content */}
      <main className="ml-64 min-h-screen">
        <header className="bg-white shadow-sm h-16 flex items-center px-6">
          <h2 className="text-xl font-semibold">Sistema de Inventario</h2>
        </header>
        
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}