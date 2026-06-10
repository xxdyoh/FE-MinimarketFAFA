<script setup>
import { useLayout } from "~/layouts/composables/layout.js";
import AppConfigurator from "~/layouts/AppConfigurator.vue";
import { useMenu } from "~/layouts/composables/menu.js";
import { useAuthStore } from "~/stores/auth";
import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const { onMenuToggle, toggleDarkMode, isDarkTheme, layoutConfig } = useLayout();
const { model } = useMenu();
const authStore = useAuthStore();

const authPaths = ['/auth/login', '/auth/access', '/auth/error', '/landing']
const isAuthPage = computed(() => authPaths.includes(route.path))
const userMenuOpen = ref(false)

const handleLogout = async () => {
    userMenuOpen.value = false
    await authStore.logout();
    navigateTo('/auth/login');
};
</script>

<template>
    <div class="layout-topbar">
        <!-- Left Section -->
        <div class="topbar-left">
            <button 
                class="menu-toggle-btn" 
                @click="onMenuToggle" 
                v-show="layoutConfig.menuMode !== 'horizontal'"
                aria-label="Toggle menu"
            >
                <i class="pi pi-bars"></i>
            </button>
            
            <router-link to="/" class="topbar-brand">
                <div class="brand-logo">
                    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" class="brand-svg">
                        <rect width="40" height="40" rx="10" fill="currentColor" fill-opacity="0.15"/>
                        <path d="M12 28V14L20 10L28 14V28L20 32L12 28Z" stroke="currentColor" stroke-width="1.5" fill="none"/>
                        <circle cx="20" cy="21" r="4" fill="currentColor"/>
                    </svg>
                </div>
                <div class="brand-text">
                    <span class="brand-name">FAFA</span>
                    <span class="brand-sub">KOSMETIK</span>
                </div>
            </router-link>
        </div>

        <!-- Center: Horizontal Menu -->
        <div class="topbar-center" v-if="layoutConfig.menuMode === 'horizontal'">
            <nav class="horizontal-nav">
                <Menubar :model="model" class="nav-menubar">
                    <template #item="{ item, props, hasSubmenu, root }">
                        <router-link 
                            v-if="item.to" 
                            v-slot="{ href, navigate }" 
                            :to="item.to" 
                            custom
                        >
                            <a :href="href" v-bind="props.action" @click="navigate" class="nav-link">
                                <i :class="item.icon" v-if="item.icon"></i>
                                <span>{{ item.label }}</span>
                                <i v-if="hasSubmenu" class="pi pi-angle-down nav-arrow"></i>
                            </a>
                        </router-link>
                        <a v-else-if="item.url" :href="item.url" :target="item.target" v-bind="props.action" class="nav-link">
                            <i :class="item.icon" v-if="item.icon"></i>
                            <span>{{ item.label }}</span>
                            <i v-if="hasSubmenu" class="pi pi-angle-down nav-arrow"></i>
                        </a>
                        <button v-else v-bind="props.action" class="nav-link">
                            <i :class="item.icon" v-if="item.icon"></i>
                            <span>{{ item.label }}</span>
                            <i v-if="hasSubmenu" class="pi pi-angle-down nav-arrow"></i>
                        </button>
                    </template>
                </Menubar>
            </nav>
        </div>

        <!-- Right Section -->
        <div class="topbar-right">
            <button class="action-btn theme-btn" @click="toggleDarkMode" aria-label="Toggle theme">
                <div class="btn-icon-wrapper">
                    <i :class="['pi', isDarkTheme ? 'pi-sun' : 'pi-moon']"></i>
                </div>
            </button>
            
            <div class="relative">
                <button
                    v-styleclass="{ 
                        selector: '@next', 
                        enterFromClass: 'hidden', 
                        enterActiveClass: 'animate-scalein', 
                        leaveToClass: 'hidden', 
                        leaveActiveClass: 'animate-fadeout', 
                        hideOnOutsideClick: true 
                    }"
                    class="action-btn config-btn"
                    aria-label="Theme config"
                >
                    <div class="btn-icon-wrapper">
                        <i class="pi pi-palette"></i>
                    </div>
                </button>
                <AppConfigurator />
            </div>
            
            <div class="relative user-menu-wrapper">
                <button 
                    class="action-btn user-btn"
                    @click="userMenuOpen = !userMenuOpen"
                    aria-label="User menu"
                >
                    <div class="user-avatar">
                        <span>{{ (authStore.user?.nama || 'U')[0].toUpperCase() }}</span>
                    </div>
                    <span class="user-name">{{ authStore.user?.nama || 'User' }}</span>
                    <i class="pi pi-chevron-down user-arrow" :class="{ 'rotate': userMenuOpen }"></i>
                </button>
                
                <Transition name="dropdown">
                    <div v-if="userMenuOpen" class="user-dropdown">
                        <div class="dropdown-header">
                            <div class="dropdown-avatar">
                                <span>{{ (authStore.user?.nama || 'U')[0].toUpperCase() }}</span>
                            </div>
                            <div class="dropdown-user-info">
                                <p class="dropdown-user-name">{{ authStore.user?.nama || 'User' }}</p>
                                <p class="dropdown-user-role">{{ authStore.user?.cabang_nama || 'Administrator' }}</p>
                            </div>
                        </div>
                        <div class="dropdown-divider"></div>
                        <div class="dropdown-menu">
                            <button class="dropdown-item">
                                <i class="pi pi-user"></i>
                                <span>Profil Saya</span>
                            </button>
                            <button class="dropdown-item">
                                <i class="pi pi-cog"></i>
                                <span>Pengaturan</span>
                            </button>
                            <div class="dropdown-divider"></div>
                            <button class="dropdown-item dropdown-item-danger" @click="handleLogout">
                                <i class="pi pi-sign-out"></i>
                                <span>Keluar</span>
                            </button>
                        </div>
                    </div>
                </Transition>
            </div>
            
            <div v-if="userMenuOpen" class="dropdown-backdrop" @click="userMenuOpen = false"></div>
        </div>
    </div>
</template>

<style lang="scss" scoped>
// ========== TOPBAR ==========
.layout-topbar {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: 4rem;
    z-index: 997;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 1.25rem;
    gap: 1rem;
    
    // 🔥 Gradient CERAH - biru langit
    background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 30%, #bfdbfe 60%, #e0e7ff 100%);
    border-bottom: 1px solid rgba(59, 130, 246, 0.12);
    box-shadow: 0 1px 3px rgba(59, 130, 246, 0.06);
    
    animation: topbarSlideIn 0.5s ease-out;
    
    @keyframes topbarSlideIn {
        from { transform: translateY(-100%); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
    }
    
    @media (max-width: 991px) {
        padding: 0 0.875rem;
    }
    
    @media (max-width: 480px) {
        padding: 0 0.625rem;
        height: 3.5rem;
    }
}

// ========== LEFT SECTION ==========
.topbar-left {
    display: flex;
    align-items: center;
    gap: 0.625rem;
    flex-shrink: 0;
}

.menu-toggle-btn {
    width: 2.25rem;
    height: 2.25rem;
    border-radius: 0.5rem;
    border: 1px solid rgba(59, 130, 246, 0.15);
    background: rgba(255, 255, 255, 0.6);
    color: #3b82f6;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    backdrop-filter: blur(8px);
    
    i { font-size: 1rem; }
    
    &:hover {
        background: white;
        border-color: #3b82f6;
        color: #2563eb;
        box-shadow: 0 2px 8px rgba(59, 130, 246, 0.15);
    }
    
    &:active { transform: scale(0.95); }
}

// Brand
.topbar-brand {
    display: flex;
    align-items: center;
    gap: 0.625rem;
    text-decoration: none;
    
    .brand-logo {
        width: 2.5rem;
        height: 2.5rem;
        
        .brand-svg {
            width: 100%;
            height: 100%;
            color: #3b82f6;
            filter: drop-shadow(0 2px 4px rgba(59, 130, 246, 0.2));
            transition: all 0.3s ease;
        }
        
        &:hover .brand-svg {
            color: #2563eb;
            transform: rotate(-5deg) scale(1.05);
        }
    }
    
    .brand-text {
        display: flex;
        flex-direction: column;
        line-height: 1.15;
        
        .brand-name {
            font-size: 1rem;
            font-weight: 800;
            color: #1e40af;
            letter-spacing: 0.05em;
        }
        
        .brand-sub {
            font-size: 0.55rem;
            font-weight: 600;
            color: #60a5fa;
            letter-spacing: 0.25em;
        }
    }
    
    @media (max-width: 480px) {
        .brand-logo { width: 2.25rem; height: 2.25rem; }
        .brand-name { font-size: 0.9rem; }
    }
}

// ========== CENTER: HORIZONTAL NAV ==========
.topbar-center {
    flex: 1;
    display: flex;
    justify-content: center;
    overflow: hidden;
    
    @media (max-width: 991px) { display: none; }
}

.horizontal-nav {
    .nav-menubar {
        background: transparent !important;
        border: none !important;
        padding: 0 !important;
        
        :deep(.p-menubar-root-list) {
            gap: 0.25rem;
            background: transparent;
        }
        
        :deep(.p-menuitem) {
            > .p-menuitem-content { background: transparent !important; }
        }
    }
}

.nav-link {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.45rem 0.875rem;
    border-radius: 0.5rem;
    color: #475569;
    text-decoration: none;
    transition: all 0.2s ease;
    font-size: 0.8rem;
    font-weight: 500;
    white-space: nowrap;
    border: 1px solid transparent;
    background: transparent;
    cursor: pointer;
    font-family: inherit;
    
    i {
        font-size: 0.9rem;
        color: #64748b;
        transition: color 0.2s;
    }
    
    .nav-arrow {
        margin-left: 0.15rem;
        font-size: 0.65rem;
    }
    
    &:hover {
        background: rgba(59, 130, 246, 0.08);
        color: #1e40af;
        border-color: rgba(59, 130, 246, 0.15);
        
        i { color: #3b82f6; }
    }
    
    &.router-link-active,
    &.active {
        background: rgba(59, 130, 246, 0.12);
        color: #1d4ed8;
        border-color: rgba(59, 130, 246, 0.25);
        font-weight: 600;
        
        i { color: #2563eb; }
    }
}

// ========== RIGHT SECTION ==========
.topbar-right {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    flex-shrink: 0;
}

.action-btn {
    width: 2.25rem;
    height: 2.25rem;
    border-radius: 0.5rem;
    border: 1px solid rgba(59, 130, 246, 0.12);
    background: rgba(255, 255, 255, 0.6);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    position: relative;
    overflow: hidden;
    backdrop-filter: blur(8px);
    
    .btn-icon-wrapper {
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
        
        i {
            font-size: 1rem;
            color: #475569;
            transition: all 0.2s ease;
        }
    }
    
    &::after {
        content: '';
        position: absolute;
        inset: 0;
        background: radial-gradient(circle, rgba(59,130,246,0.2) 0%, transparent 70%);
        opacity: 0;
        transition: opacity 0.3s;
    }
    
    &:hover {
        background: white;
        border-color: #3b82f6;
        transform: translateY(-1px);
        box-shadow: 0 2px 8px rgba(59, 130, 246, 0.12);
        
        &::after { opacity: 1; }
        
        .btn-icon-wrapper i { color: #2563eb; }
    }
    
    &:active { transform: scale(0.95); }
}

.theme-btn {
    .btn-icon-wrapper {
        animation: iconPulse 3s ease-in-out infinite;
    }
    
    @keyframes iconPulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.1); }
    }
}

.config-btn {
    .btn-icon-wrapper i {
        animation: iconSpin 8s linear infinite;
    }
    
    @keyframes iconSpin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
}

// User Button
.user-btn {
    width: auto;
    padding: 0.25rem 0.75rem 0.25rem 0.35rem;
    gap: 0.5rem;
    border-radius: 2rem;
    
    @media (max-width: 480px) {
        padding: 0.25rem 0.5rem 0.25rem 0.25rem;
        gap: 0.25rem;
    }
}

.user-avatar {
    width: 1.75rem;
    height: 1.75rem;
    border-radius: 50%;
    background: linear-gradient(135deg, #3b82f6, #2563eb);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    box-shadow: 0 2px 6px rgba(37, 99, 235, 0.3);
    
    span {
        font-size: 0.65rem;
        font-weight: 700;
        color: white;
    }
    
    @media (max-width: 480px) {
        width: 1.5rem;
        height: 1.5rem;
    }
}

.user-name {
    font-size: 0.78rem;
    font-weight: 500;
    color: #334155;
    max-width: 100px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    
    @media (max-width: 640px) { display: none; }
}

.user-arrow {
    font-size: 0.6rem;
    color: #64748b;
    transition: transform 0.2s ease;
    
    &.rotate { transform: rotate(180deg); }
}

// ========== USER DROPDOWN ==========
.user-menu-wrapper { position: relative; }

.user-dropdown {
    position: absolute;
    top: calc(100% + 0.5rem);
    right: 0;
    width: 260px;
    background: white;
    border-radius: 0.75rem;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(0, 0, 0, 0.04);
    overflow: hidden;
    z-index: 1000;
    
    .dropdown-header {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 1rem 1.25rem;
        background: #f8fafc;
    }
    
    .dropdown-avatar {
        width: 2.75rem;
        height: 2.75rem;
        border-radius: 0.75rem;
        background: linear-gradient(135deg, #3b82f6, #1d4ed8);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        
        span {
            font-size: 1rem;
            font-weight: 700;
            color: white;
        }
    }
    
    .dropdown-user-info {
        min-width: 0;
        
        .dropdown-user-name {
            font-size: 0.85rem;
            font-weight: 600;
            color: #1e293b;
            margin: 0;
        }
        
        .dropdown-user-role {
            font-size: 0.7rem;
            color: #64748b;
            margin: 0.15rem 0 0 0;
        }
    }
    
    .dropdown-divider {
        height: 1px;
        background: #e2e8f0;
    }
    
    .dropdown-menu { padding: 0.375rem; }
    
    .dropdown-item {
        display: flex;
        align-items: center;
        gap: 0.625rem;
        width: 100%;
        padding: 0.55rem 0.875rem;
        border: none;
        background: transparent;
        cursor: pointer;
        font-size: 0.8rem;
        color: #475569;
        border-radius: 0.5rem;
        transition: all 0.15s ease;
        font-family: inherit;
        text-align: left;
        
        i {
            font-size: 0.9rem;
            width: 1.25rem;
            text-align: center;
            color: #94a3b8;
        }
        
        &:hover {
            background: #eff6ff;
            color: #1e40af;
            i { color: #3b82f6; }
        }
        
        &.dropdown-item-danger {
            color: #dc2626;
            i { color: #ef4444; }
            
            &:hover {
                background: #fef2f2;
                color: #dc2626;
                i { color: #dc2626; }
            }
        }
    }
}

// Dropdown animation
.dropdown-enter-active { animation: dropdownIn 0.2s ease-out; }
.dropdown-leave-active { animation: dropdownOut 0.15s ease-in; }

@keyframes dropdownIn {
    from { opacity: 0; transform: translateY(-8px) scale(0.96); }
    to { opacity: 1; transform: translateY(0) scale(1); }
}
@keyframes dropdownOut {
    from { opacity: 1; transform: translateY(0) scale(1); }
    to { opacity: 0; transform: translateY(-4px) scale(0.98); }
}

.dropdown-backdrop { position: fixed; inset: 0; z-index: 999; }

// ========== RESPONSIVE ==========
@media (max-width: 991px) { .topbar-center { display: none; } }

@media (max-width: 480px) {
    .layout-topbar { height: 3.5rem; padding: 0 0.5rem; }
    
    .action-btn {
        width: 2rem; height: 2rem;
        .btn-icon-wrapper i { font-size: 0.9rem; }
    }
    
    .user-dropdown {
        width: 240px;
        right: -0.5rem;
    }
}
</style>