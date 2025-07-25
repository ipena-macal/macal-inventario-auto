import axios from 'axios'

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1'

const instance = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add auth token to requests
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Handle auth errors
instance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default instance