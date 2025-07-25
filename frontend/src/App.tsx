import React, { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
// import { registerSW } from 'virtual:pwa-register'

// Pages
import { LoginPage } from '@/pages/LoginPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { VehiclesPage } from '@/pages/VehiclesPage'
import { InspectionPage } from '@/pages/InspectionPage'
import { InspectionFlowPage } from '@/pages/InspectionFlowPage'
import { FormBuilderPage } from '@/pages/admin/FormBuilderPage'
import { ClientManagementPage } from '@/pages/admin/ClientManagementPage'

// Components
import { Layout } from '@/components/Layout'
import { ProtectedRoute } from '@/components/ProtectedRoute'

// Stores
import { useAuthStore } from '@/stores/authStore'

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
})

function App() {
  const { checkAuth } = useAuthStore()

  useEffect(() => {
    // Check authentication on app load
    checkAuth()

    // Register service worker for PWA - disabled for now
    // const updateSW = registerSW({
    //   onNeedRefresh() {
    //     if (confirm('New content available. Reload?')) {
    //       updateSW(true)
    //     }
    //   },
    //   onOfflineReady() {
    //     console.log('App ready to work offline')
    //   },
    // })
  }, [checkAuth])

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/vehicles" element={<VehiclesPage />} />
              <Route path="/vehicles/:id" element={<VehicleDetailPage />} />
              <Route path="/inspections" element={<InspectionsPage />} />
              <Route path="/inspections/:id" element={<InspectionPage />} />
              <Route path="/inspections/:id/flow" element={<InspectionFlowPage />} />
              <Route path="/admin/forms" element={<FormBuilderPage />} />
              <Route path="/admin/clients" element={<ClientManagementPage />} />
            </Route>
          </Route>
        </Routes>
      </Router>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
        }}
      />
    </QueryClientProvider>
  )
}

export default App

// Import vehicle detail page
import { VehicleDetailPage } from '@/pages/VehicleDetailPage'

// Import inspections page
import { InspectionsPage } from '@/pages/InspectionsPage'