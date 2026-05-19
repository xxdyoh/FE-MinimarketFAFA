<template>
    <div class="login-page">
        <!-- Animated Background Waves -->
        <div class="bg-waves">
            <svg class="waves" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320">
                <path class="wave wave-1" fill="#1e3a5f" fill-opacity="0.4" d="M0,192L48,197.3C96,203,192,213,288,229.3C384,245,480,267,576,250.7C672,235,768,181,864,181.3C960,181,1056,235,1152,234.7C1248,235,1344,181,1392,154.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
                <path class="wave wave-2" fill="#2563eb" fill-opacity="0.3" d="M0,224L48,213.3C96,203,192,181,288,181.3C384,181,480,203,576,224C672,245,768,267,864,261.3C960,256,1056,224,1152,208C1248,192,1344,192,1392,192L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
                <path class="wave wave-3" fill="#3b82f6" fill-opacity="0.2" d="M0,128L48,144C96,160,192,192,288,186.7C384,181,480,139,576,138.7C672,139,768,181,864,186.7C960,192,1056,160,1152,149.3C1248,139,1344,149,1392,154.7L1440,160L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
            </svg>
        </div>

        <!-- Floating Shapes -->
        <div class="floating-shapes">
            <div class="shape shape-hexagon" :style="shapeStyle(1)"></div>
            <div class="shape shape-circle" :style="shapeStyle(2)"></div>
            <div class="shape shape-triangle" :style="shapeStyle(3)"></div>
            <div class="shape shape-square" :style="shapeStyle(4)"></div>
            <div class="shape shape-diamond" :style="shapeStyle(5)"></div>
        </div>

        <div class="login-container">
            <div class="login-grid">
                <!-- Brand Panel (Left) -->
                <div class="login-brand-panel">
                    <div class="brand-inner">
                        <div class="brand-top">
                            <div class="brand-logo-wrapper">
                                <span class="brand-logo-text">FAFA</span>
                                <span class="brand-logo-sub">KOSMETIK</span>
                            </div>
                        </div>
                        <!-- <div class="brand-slogan">
                            <h1>
                                <span class="slogan-line">Beauty</span>
                                <span class="slogan-line slogan-highlight">Elegance</span>
                                <span class="slogan-line slogan-light">Confidence</span>
                            </h1>
                        </div> -->
                        <!-- <p class="brand-desc">Sistem manajemen toko kosmetik terpercaya</p> -->
                        <div class="brand-footer">
                            <span>&copy; 2026 FAFA Kosmetik</span>
                            <span class="brand-version">v2.0</span>
                        </div>
                    </div>
                </div>

                <!-- Login Form (Right) -->
                <div class="login-form-panel">
                    <div class="login-card" :class="{ 'is-ready': isReady }">
                        <!-- Mobile Brand -->
                        <div class="mobile-brand">
                            <div class="mobile-logo">FAFA</div>
                            <p>KOSMETIK</p>
                        </div>

                        <div class="login-header">
                            <div class="login-icon-wrapper" ref="iconRef">
                                <i class="pi pi-user"></i>
                            </div>
                            <h2>Selamat Datang</h2>
                            <p>Silakan masuk untuk melanjutkan</p>
                        </div>

                        <form @submit.prevent="handleLogin" class="login-form">
                            <!-- Username -->
                            <div class="form-field" :class="{ 'focused': focusedField === 'username', 'has-value': username }">
                                <div class="field-wrapper">
                                    <i class="pi pi-user field-icon"></i>
                                    <InputText 
                                        id="username" 
                                        v-model="username" 
                                        class="w-full"
                                        @focus="focusedField = 'username'"
                                        @blur="focusedField = null"
                                        autocomplete="username"
                                    />
                                    <label class="field-label">Username</label>
                                </div>
                                <div class="field-border"></div>
                            </div>

                            <!-- Password -->
                            <div class="form-field" :class="{ 'focused': focusedField === 'password', 'has-value': password }">
                                <div class="field-wrapper">
                                    <i class="pi pi-lock field-icon"></i>
                                    <Password 
                                        id="password" 
                                        v-model="password" 
                                        :toggleMask="true" 
                                        :feedback="false" 
                                        class="w-full"
                                        @focus="focusedField = 'password'"
                                        @blur="focusedField = null"
                                        autocomplete="current-password"
                                    />
                                    <label class="field-label">Password</label>
                                </div>
                                <div class="field-border"></div>
                            </div>

                            <!-- Login Button -->
                            <Button 
                                type="submit" 
                                :loading="isLoading" 
                                class="login-btn"
                                @mouseenter="btnHover = true"
                                @mouseleave="btnHover = false"
                            >
                                <span>Masuk</span>
                                <i class="pi pi-arrow-right" :class="{ 'icon-slide': btnHover }"></i>
                            </Button>
                        </form>
                    </div>
                </div>
            </div>
        </div>

        <Toast position="top-right" />
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

definePageMeta({
    layout: 'auth'
})

const router = useRouter();
const toast = useToast();
const { $api } = useNuxtApp();
const authStore = useAuthStore();

const username = ref('');
const password = ref('');
const isLoading = ref(false);
const isReady = ref(false);
const focusedField = ref<string | null>(null);
const btnHover = ref(false);
const iconRef = ref<HTMLElement | null>(null);

// Floating shapes
const shapeStyle = (index: number) => {
    const animations = ['float1', 'float2', 'float3', 'float4', 'float5']
    return {
        animation: `${animations[index - 1]} ${6 + index}s ease-in-out infinite`,
        animationDelay: `${index * 0.5}s`,
        left: `${10 + index * 18}%`,
        top: `${15 + index * 12}%`,
    }
}

onMounted(() => {
    authStore.restoreSession();
    
    if (authStore.isLoggedIn) {
        router.push('/dashboard');
        return;
    }
    
    setTimeout(() => {
        isReady.value = true;
    }, 300);

    // Mouse parallax effect on icon
    if (iconRef.value) {
        document.addEventListener('mousemove', (e) => {
            const { clientX, clientY } = e
            const { innerWidth, innerHeight } = window
            const x = (clientX / innerWidth - 0.5) * 10
            const y = (clientY / innerHeight - 0.5) * 10
            
            if (iconRef.value) {
                iconRef.value.style.transform = `translate(${x}px, ${y}px)`
            }
        })
    }
});

const handleLogin = async () => {
    if (!username.value || !password.value) {
        toast.add({ 
            severity: 'warn', 
            summary: 'Peringatan', 
            detail: 'Isi username dan password', 
            life: 3000 
        });
        return;
    }

    isLoading.value = true;
    
    try {
        const response = await $api.post('/login', {
            username: username.value,
            password: password.value
        });
        
        if (response.data.success) {
            authStore.setLoginData(response.data.data.user, response.data.token);
            
            toast.add({ 
                severity: 'success', 
                summary: 'Berhasil', 
                detail: `Selamat datang, ${response.data.data.user.nama}!`, 
                life: 3000 
            });
            
            setTimeout(() => {
                navigateTo('/dashboard');
            }, 500);
        }
    } catch (error: any) {
        // Shake animation on error
        const card = document.querySelector('.login-card')
        if (card) {
            card.classList.add('shake')
            setTimeout(() => card.classList.remove('shake'), 500)
        }
        
        toast.add({ 
            severity: 'error', 
            summary: 'Error', 
            detail: error.response?.data?.message || 'Login gagal', 
            life: 3000 
        });
    } finally {
        isLoading.value = false;
    }
};
</script>

<style scoped>
.login-page {
    min-height: 100vh;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #0f172a 0%, #1e293b 40%, #1e3a5f 70%, #1a365d 100%);
    position: relative;
    overflow: hidden;
    font-family: 'Inter', 'Segoe UI', sans-serif;
}

/* ========== WAVES ========== */
.bg-waves { position: absolute; bottom: 0; left: 0; width: 100%; pointer-events: none; z-index: 1; }
.waves { width: 100%; height: auto; }
.wave { animation: waveFloat 8s ease-in-out infinite; }
.wave-1 { animation-delay: 0s; }
.wave-2 { animation-delay: 3s; }
.wave-3 { animation-delay: 6s; }

@keyframes waveFloat {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-15px); }
}

/* ========== FLOATING SHAPES ========== */
.floating-shapes { position: absolute; inset: 0; pointer-events: none; z-index: 2; }
.shape { position: absolute; opacity: 0.06; }
.shape-hexagon { width: 60px; height: 60px; background: #3b82f6; clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%); }
.shape-circle { width: 40px; height: 40px; background: #6366f1; border-radius: 50%; }
.shape-triangle { width: 50px; height: 50px; background: #8b5cf6; clip-path: polygon(50% 0%, 0% 100%, 100% 100%); }
.shape-square { width: 35px; height: 35px; background: #60a5fa; border-radius: 8px; }
.shape-diamond { width: 45px; height: 45px; background: #3b82f6; clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%); }

@keyframes float1 { 0%,100%{transform:translate(0,0)rotate(0deg)}33%{transform:translate(30px,-40px)rotate(120deg)}66%{transform:translate(-20px,-20px)rotate(240deg)} }
@keyframes float2 { 0%,100%{transform:translate(0,0)rotate(0deg)}33%{transform:translate(-40px,-30px)rotate(-120deg)}66%{transform:translate(20px,-50px)rotate(-240deg)} }
@keyframes float3 { 0%,100%{transform:translate(0,0)rotate(0deg)}50%{transform:translate(50px,-20px)rotate(180deg)} }
@keyframes float4 { 0%,100%{transform:translate(0,0)rotate(0deg)}33%{transform:translate(-30px,-50px)rotate(90deg)}66%{transform:translate(40px,-10px)rotate(270deg)} }
@keyframes float5 { 0%,100%{transform:translate(0,0)scale(1)}50%{transform:translate(-20px,-30px)scale(1.2)} }

/* ========== CONTAINER ========== */
.login-container { position: relative; z-index: 10; width: 100%; max-width: 1000px; margin: 0 auto; padding: 1.5rem; }
.login-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0; border-radius: 1.5rem; overflow: hidden; box-shadow: 0 25px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05); }

/* ========== BRAND PANEL ========== */
.login-brand-panel { background: linear-gradient(160deg, #1e293b 0%, #1e3a5f 50%, #1a365d 100%); position: relative; display: none; overflow: hidden; }
.login-brand-panel::before { content: ''; position: absolute; inset: 0; background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E"); opacity: 0.5; }
@media (min-width: 992px) { .login-brand-panel { display: block; } }

.brand-inner { position: relative; z-index: 1; display: flex; flex-direction: column; justify-content: space-between; height: 100%; padding: 2.5rem; min-height: 480px; }
.brand-logo-wrapper { display: flex; flex-direction: column; gap: 0.25rem; }
.brand-logo-text { font-size: 3.5rem; font-weight: 900; color: white; letter-spacing: 0.3em; text-shadow: 0 4px 12px rgba(0,0,0,0.3); animation: fadeInDown 0.8s ease; }
.brand-logo-sub { font-size: 1rem; font-weight: 500; color: rgba(255,255,255,0.5); letter-spacing: 0.8em; animation: fadeInDown 0.8s ease 0.2s both; }
.brand-slogan { margin-top: auto; margin-bottom: 1.5rem; animation: fadeInUp 0.8s ease 0.4s both; }
.brand-slogan h1 { margin: 0; line-height: 1.2; }
.slogan-line { display: block; font-size: 2rem; font-weight: 300; color: rgba(255,255,255,0.7); letter-spacing: 0.1em; }
.slogan-highlight { font-weight: 600; color: #60a5fa; }
.slogan-light { font-weight: 300; color: rgba(255,255,255,0.4); }
.brand-desc { font-size: 0.85rem; color: rgba(255,255,255,0.4); margin: auto 0; animation: fadeInUp 0.8s ease 0.6s both; }
.brand-footer { display: flex; justify-content: space-between; font-size: 0.75rem; color: rgba(255,255,255,0.2); border-top: 1px solid rgba(255,255,255,0.06); padding-top: 1rem; margin-top: 1.5rem; }

@keyframes fadeInDown { from{opacity:0;transform:translateY(-20px)}to{opacity:1;transform:translateY(0)} }
@keyframes fadeInUp { from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)} }

/* ========== FORM PANEL ========== */
.login-form-panel { display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.98); padding: 2.5rem; }
.login-card { width: 100%; max-width: 360px; opacity: 0; transform: translateY(20px); transition: all 0.6s ease; }
.login-card.is-ready { opacity: 1; transform: translateY(0); }
.login-card.shake { animation: shake 0.5s ease; }

@keyframes shake { 0%,100%{transform:translateX(0)}20%{transform:translateX(-10px)}40%{transform:translateX(10px)}60%{transform:translateX(-5px)}80%{transform:translateX(5px)} }

.mobile-brand { display: flex; flex-direction: column; align-items: center; margin-bottom: 2rem; }
@media (min-width: 992px) { .mobile-brand { display: none; } }
.mobile-logo { font-size: 2.5rem; font-weight: 900; color: #1e3a5f; letter-spacing: 0.2em; }
.mobile-brand p { font-size: 0.7rem; color: #3b82f6; letter-spacing: 0.5em; margin: 0; }

.login-header { text-align: center; margin-bottom: 2.5rem; }
.login-icon-wrapper { width: 4rem; height: 4rem; margin: 0 auto 1rem; background: linear-gradient(135deg, #3b82f6, #1d4ed8); border-radius: 1.25rem; display: flex; align-items: center; justify-content: center; box-shadow: 0 8px 20px rgba(59,130,246,0.3); transition: transform 0.1s ease; }
.login-icon-wrapper i { font-size: 1.75rem; color: white; }
.login-header h2 { font-size: 1.5rem; font-weight: 700; color: #1e293b; margin: 0 0 0.5rem 0; }
.login-header p { font-size: 0.875rem; color: #64748b; margin: 0; }

/* ========== FORM FIELDS ========== */
.login-form { display: flex; flex-direction: column; gap: 1.5rem; }
.form-field { position: relative; }
.field-wrapper { position: relative; }

.field-icon { position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); color: #94a3b8; font-size: 1rem; z-index: 2; transition: color 0.3s ease; }
.form-field.focused .field-icon { color: #3b82f6; }

.field-label { position: absolute; left: 2.75rem; top: 50%; transform: translateY(-50%); font-size: 0.875rem; color: #94a3b8; transition: all 0.3s ease; pointer-events: none; background: transparent; padding: 0 0.25rem; z-index: 3; }
.form-field.focused .field-label,
.form-field.has-value .field-label { top: -0.5rem; left: 1rem; font-size: 0.7rem; color: #3b82f6; background: white; font-weight: 600; }

.field-border { position: absolute; bottom: 0; left: 0; right: 0; height: 2px; background: #3b82f6; transform: scaleX(0); transition: transform 0.3s ease; border-radius: 0 0 0.875rem 0.875rem; }
.form-field.focused .field-border { transform: scaleX(1); }

:deep(.p-inputtext) { padding-left: 2.75rem !important; padding-top: 0.5rem !important; height: 3.25rem !important; font-size: 0.9rem !important; border-radius: 0.875rem !important; border: 2px solid #e2e8f0 !important; background: #f8fafc !important; transition: all 0.3s ease !important; color: #1e293b !important; }
:deep(.p-inputtext:focus) { border-color: #3b82f6 !important; background: white !important; box-shadow: 0 0 0 4px rgba(59,130,246,0.1) !important; }
:deep(.p-inputtext::placeholder) { color: transparent !important; }
.form-field.has-value :deep(.p-inputtext::placeholder) { color: #94a3b8 !important; }
:deep(.p-password) { width: 100%; }
:deep(.p-password .p-password-input) { width: 100%; padding-left: 2.75rem !important; padding-right: 3rem !important; padding-top: 0.5rem !important; height: 3.25rem !important; font-size: 0.9rem !important; border-radius: 0.875rem !important; border: 2px solid #e2e8f0 !important; background: #f8fafc !important; color: #1e293b !important; }
:deep(.p-password .p-password-input::placeholder) { color: transparent !important; }

/* ========== LOGIN BUTTON ========== */
.login-btn { height: 3.25rem !important; font-size: 1rem !important; font-weight: 600 !important; border-radius: 0.875rem !important; border: none !important; background: linear-gradient(135deg, #3b82f6, #1d4ed8) !important; color: white !important; display: flex !important; align-items: center !important; justify-content: center !important; gap: 0.5rem !important; transition: all 0.3s ease !important; box-shadow: 0 4px 15px rgba(59,130,246,0.3); width: 100% !important; position: relative; overflow: hidden; }
.login-btn::after { content: ''; position: absolute; inset: 0; background: linear-gradient(135deg, transparent, rgba(255,255,255,0.2), transparent); transform: translateX(-100%); transition: transform 0.5s ease; }
.login-btn:hover::after { transform: translateX(100%); }
.login-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(59,130,246,0.4); }
.login-btn:active { transform: translateY(0); }
.icon-slide { transform: translateX(4px); transition: transform 0.3s ease; }

/* ========== RESPONSIVE ========== */
@media (max-width: 991px) {
    .login-grid { grid-template-columns: 1fr; }
    .login-form-panel { padding: 2rem 1.5rem; }
}
</style>