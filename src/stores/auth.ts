// stores/auth.ts
export const useAuthStore = defineStore('auth', {
    state: () => ({
        user: null,
        token: null,
        isLoggedIn: false
    }),

    actions: {
        setLoginData(user: any, token: string) {
            this.user = user
            this.token = token
            this.isLoggedIn = true

            if (process.client) {
                localStorage.setItem('auth_user', JSON.stringify(user))
                localStorage.setItem('auth_token', token)
                localStorage.setItem('isLoggedIn', 'true')
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

            if (process.client) {
                localStorage.removeItem('auth_user')
                localStorage.removeItem('auth_token')
                localStorage.removeItem('isLoggedIn')
            }
        },

        restoreSession() {
            if (process.client) {
                const user = localStorage.getItem('auth_user')
                const token = localStorage.getItem('auth_token')
                const isLoggedIn = localStorage.getItem('isLoggedIn')

                if (user && token && isLoggedIn === 'true') {
                    this.user = JSON.parse(user)
                    this.token = token
                    this.isLoggedIn = true
                    return true
                }
            }
            return false
        }
    }
})