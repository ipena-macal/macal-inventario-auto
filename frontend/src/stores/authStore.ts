import { create } from 'zustand'

interface AuthStore {
  user: any | null
  isAuthenticated: boolean
  checkAuth: () => void
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isAuthenticated: false,
  checkAuth: () => {
    // Check if user is authenticated
    const token = localStorage.getItem('access_token')
    if (token) {
      set({ isAuthenticated: true })
    }
  },
  login: async (email: string, password: string) => {
    // Mock login
    localStorage.setItem('access_token', 'mock-token')
    set({ isAuthenticated: true, user: { email } })
  },
  logout: () => {
    localStorage.removeItem('access_token')
    set({ isAuthenticated: false, user: null })
  }
}))