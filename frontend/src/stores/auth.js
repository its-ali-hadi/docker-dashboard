import { defineStore } from 'pinia'
import api from '../services/api'

export const useAuthStore = defineStore('auth', {
    state: () => ({
        token: localStorage.getItem('token') || null,
        user: JSON.parse(localStorage.getItem('user') || 'null'),
        loading: false,
        error: null
    }),

    getters: {
        isAuthenticated: (state) => !!state.token,
        getUser: (state) => state.user
    },

    actions: {
        async login(username, password) {
            this.loading = true
            this.error = null

            try {
                const response = await api.post('/auth/login', { username, password })
                const { token, user } = response.data

                this.token = token
                this.user = user

                localStorage.setItem('token', token)
                localStorage.setItem('user', JSON.stringify(user))

                return true
            } catch (err) {
                this.error = err.response?.data?.error || 'Login failed'
                return false
            } finally {
                this.loading = false
            }
        },

        logout() {
            this.token = null
            this.user = null
            localStorage.removeItem('token')
            localStorage.removeItem('user')
        },

        async verifyToken() {
            if (!this.token) return false

            try {
                const response = await api.get('/auth/verify')
                return response.data.valid
            } catch {
                this.logout()
                return false
            }
        }
    }
})
