// plugins/axios.ts
import axios from 'axios'
import { useAuthStore } from '~/stores/auth'

export default defineNuxtPlugin(() => {
    const config = useRuntimeConfig()

    const api = axios.create({
        baseURL: config.public.apiBaseUrl,
        timeout: 30000,
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        }
    })

    // ❌ HAPUS INTERCEPTOR CABANG
    // Tidak perlu kirim header X-Cabang-Database

    return {
        provide: { api }
    }
})