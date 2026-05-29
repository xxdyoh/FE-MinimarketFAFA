// stores/auth.ts
import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', {
    state: () => ({
        user: null,
        token: null,
        isLoggedIn: false,
        userId: null  // ✅ Tambahkan ini
    }),

    actions: {
        setLoginData(user: any, token: string) {
            this.user = user
            this.token = token
            this.isLoggedIn = true
            // ✅ Ambil userId dari data user
            this.userId = user?.id || user?.user_id || user?.kode || 1

            if (process.client) {
                localStorage.setItem('auth_user', JSON.stringify(user))
                localStorage.setItem('auth_token', token)
                localStorage.setItem('isLoggedIn', 'true')
                localStorage.setItem('auth_user_id', String(this.userId)) // ✅ Simpan
            }
        },

        async logout() {
            const { $api } = useNuxtApp()
            try {
                await $api.post('/logout')
            } catch (error) {
                console.error('Logout API error:', error)
            }

            this.user = null
            this.token = null
            this.isLoggedIn = false
            this.userId = null  // ✅ Reset

            if (process.client) {
                localStorage.removeItem('auth_user')
                localStorage.removeItem('auth_token')
                localStorage.removeItem('isLoggedIn')
                localStorage.removeItem('auth_user_id')  // ✅ Hapus
            }
        },

        restoreSession() {
            if (process.client) {
                const user = localStorage.getItem('auth_user')
                const token = localStorage.getItem('auth_token')
                const isLoggedIn = localStorage.getItem('isLoggedIn')
                const userId = localStorage.getItem('auth_user_id')  // ✅ Ambil

                if (user && token && isLoggedIn === 'true') {
                    this.user = JSON.parse(user)
                    this.token = token
                    this.isLoggedIn = true
                    this.userId = userId || JSON.parse(user)?.id || JSON.parse(user)?.user_id || 1  // ✅ Restore
                    return true
                }
            }
            return false
        }
    }
})