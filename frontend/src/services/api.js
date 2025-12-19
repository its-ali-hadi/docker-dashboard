import axios from 'axios'

// Create axios instance
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '/api',
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json'
    }
})

// Request interceptor - add auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token')
        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        }
        return config
    },
    (error) => {
        return Promise.reject(error)
    }
)

// Response interceptor - handle auth errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401 || error.response?.status === 403) {
            localStorage.removeItem('token')
            localStorage.removeItem('user')
            window.location.href = '/login'
        }
        return Promise.reject(error)
    }
)

// API methods
export const composeApi = {
    // Get all compose files
    getFiles(refresh = false) {
        return api.get(`/compose/files${refresh ? '?refresh=true' : ''}`)
    },

    // Get file details
    getFileDetails(id) {
        return api.get(`/compose/files/${id}/details`)
    },

    // Execute command on a compose file
    executeCommand(id, command) {
        return api.post(`/compose/files/${id}/command`, { command })
    }
}

export default api
