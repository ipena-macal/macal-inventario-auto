import { create } from 'zustand'
import axios from '@/lib/axios'

interface AuthStore {
  user: any | null
  token: string | null
  isAuthenticated: boolean
  checkAuth: () => void
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  checkAuth: () => {
    const token = localStorage.getItem('token')
    const user = localStorage.getItem('user')
    if (token && user) {
      set({ 
        token, 
        user: JSON.parse(user), 
        isAuthenticated: true 
      })
    }
  },
  login: async (email: string, password: string) => {
    try {
      const response = await axios.post('/api/v1/auth/login', { email, password })
      const { token, user } = response.data
      
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(user))
      
      set({ 
        token, 
        user, 
        isAuthenticated: true 
      })
    } catch (error) {
      throw error
    }
  },
  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    set({ 
      token: null, 
      user: null, 
      isAuthenticated: false 
    })
  }
}))