<script setup>
import { useLayout } from "~/layouts/composables/layout.js";
import AppConfigurator from "~/layouts/AppConfigurator.vue";
import { useMenu } from "~/layouts/composables/menu.js";
import { useAuthStore } from "~/stores/auth";
import { computed } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const { onMenuToggle, toggleDarkMode, isDarkTheme, layoutConfig } = useLayout();
const { model } = useMenu();
const authStore = useAuthStore();

const authPaths = ['/auth/login', '/auth/access', '/auth/error', '/landing']
const isAuthPage = computed(() => authPaths.includes(route.path))

// Fungsi logout
const handleLogout = async () => {
    await authStore.logout();
    navigateTo('/auth/login');
};
</script>

<template>
    <div class="layout-topbar">
        <!-- Left Section: Logo & Mobile Menu Button -->
        <div class="layout-topbar-left">
            <button 
                class="layout-menu-button layout-topbar-action" 
                @click="onMenuToggle" 
                v-show="layoutConfig.menuMode !== 'horizontal'"
            >
                <i class="pi pi-bars"></i>
            </button>
            
            <router-link to="/" class="layout-topbar-logo">
                <!-- <img src="/logo-bsm.svg" alt="Logo" class="logo-img" /> -->
                <span class="logo-text">FAFA KOSMETIK</span>
            </router-link>
        </div>

        <!-- Center Section: Horizontal Menu -->
        <div 
            class="layout-topbar-menu-wrapper" 
            v-if="layoutConfig.menuMode === 'horizontal'"
        >
            <Menubar :model="model" class="horizontal-menu">
                <template #item="{ item, props, hasSubmenu, root }">
                    <router-link 
                        v-if="item.to" 
                        v-slot="{ href, navigate }" 
                        :to="item.to" 
                        custom
                    >
                        <a 
                            :href="href" 
                            v-bind="props.action" 
                            @click="navigate"
                            class="menu-item-link"
                        >
                            <i :class="item.icon" v-if="item.icon"></i>
                            <span>{{ item.label }}</span>
                            <i v-if="hasSubmenu" class="pi pi-angle-down submenu-icon"></i>
                        </a>
                    </router-link>
                    
                    <a 
                        v-else-if="item.url" 
                        :href="item.url" 
                        :target="item.target" 
                        v-bind="props.action"
                        class="menu-item-link"
                    >
                        <i :class="item.icon" v-if="item.icon"></i>
                        <span>{{ item.label }}</span>
                        <i v-if="hasSubmenu" class="pi pi-angle-down submenu-icon"></i>
                    </a>
                    
                    <button 
                        v-else 
                        v-bind="props.action"
                        class="menu-item-link"
                    >
                        <i :class="item.icon" v-if="item.icon"></i>
                        <span>{{ item.label }}</span>
                        <i v-if="hasSubmenu" class="pi pi-angle-down submenu-icon"></i>
                    </button>
                </template>
            </Menubar>
        </div>

        <!-- Right Section: Actions -->
        <div class="layout-topbar-right">
            <!-- Dark Mode Toggle -->
            <button type="button" class="layout-topbar-action" @click="toggleDarkMode">
                <i :class="['pi', { 'pi-moon': isDarkTheme, 'pi-sun': !isDarkTheme }]"></i>
            </button>
            
            <!-- Theme Configurator -->
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
        type="button"
        class="theme-config-btn"
    >
        <i class="pi pi-palette"></i>
    </button>
    <AppConfigurator />
</div>
            
            <!-- User Menu -->
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
                    type="button"
                    class="layout-topbar-action user-menu-btn"
                >
                    <i class="pi pi-user"></i>
                    <span class="user-name">{{ authStore.user?.nama || 'User' }}</span>
                    <i class="pi pi-chevron-down user-arrow"></i>
                </button>
                
                <div class="user-menu-dropdown hidden absolute top-full right-0 mt-2 w-56 bg-surface-0 dark:bg-surface-900 rounded-lg shadow-lg border border-surface">
                    <div class="p-3 border-b border-surface">
                        <p class="text-sm font-semibold">{{ authStore.user?.nama }}</p>
                        <p class="text-xs text-muted-color">{{ authStore.user?.cabang_nama }}</p>
                    </div>
                    <div class="p-1">
                        <button class="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-surface-100 dark:hover:bg-surface-800 rounded-md transition-colors">
                            <i class="pi pi-user"></i>
                            <span>Profil</span>
                        </button>
                        <button class="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-surface-100 dark:hover:bg-surface-800 rounded-md transition-colors">
                            <i class="pi pi-cog"></i>
                            <span>Pengaturan</span>
                        </button>
                        <button 
                            @click="handleLogout"
                            class="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                        >
                            <i class="pi pi-sign-out"></i>
                            <span>Logout</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style lang="scss" scoped>
.layout-topbar {
    position: fixed;
    height: 4rem;
    z-index: 997;
    left: 0;
    top: 0;
    width: 100%;
    padding: 0 1.5rem;
    background-color: var(--surface-card);
    transition: left var(--layout-section-transition-duration);
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid var(--surface-border);
    
    .layout-topbar-left {
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }
    
    .layout-topbar-logo {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        color: var(--text-color);
        font-weight: 600;
        text-decoration: none;
        
        .logo-img {
            height: 2.5rem;
            width: auto;
        }
        
        .logo-text {
            font-size: 1.125rem;
            font-weight: 700;
            letter-spacing: 0.5px;
        }
    }
    
    .layout-topbar-menu-wrapper {
        flex: 1;
        display: flex;
        justify-content: center;
        margin: 0 2rem;
        
        .horizontal-menu {
            background: transparent;
            border: none;
            padding: 0;
            
            :deep(.p-menubar-root-list) {
                gap: 0.25rem;
            }
            
            :deep(.p-menuitem-link) {
                padding: 0.625rem 1rem;
                border-radius: 0.5rem;
                transition: all 0.15s;
                
                &:hover {
                    background: var(--surface-100);
                }
            }
            
            :deep(.p-menuitem.active) {
                .p-menuitem-link {
                    background: var(--primary-50);
                    color: var(--primary-700);
                }
            }
        }
    }
    
    .menu-item-link {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 0.875rem;
        border-radius: 0.5rem;
        color: var(--text-color);
        text-decoration: none;
        transition: all 0.15s;
        font-size: 0.875rem;
        font-weight: 500;
        white-space: nowrap;
        
        i {
            font-size: 1rem;
            color: var(--text-color-secondary);
        }
        
        .submenu-icon {
            margin-left: 0.25rem;
            font-size: 0.75rem;
        }
        
        &:hover {
            background: var(--surface-100);
        }
        
        &.router-link-active {
            background: var(--primary-50);
            color: var(--primary-700);
            
            i {
                color: var(--primary-600);
            }
        }
    }
    
    .layout-topbar-right {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }
    
    .layout-topbar-action {
        display: inline-flex;
        justify-content: center;
        align-items: center;
        color: var(--text-color);
        border-radius: 50%;
        width: 2.5rem;
        height: 2.5rem;
        transition: background-color var(--element-transition-duration);
        cursor: pointer;
        background: transparent;
        border: none;
        
        &:hover {
            background-color: var(--surface-100);
        }
        
        i {
            font-size: 1.25rem;
            color: var(--text-color); // ✅ Default icon color
        }
        
        // 🔥 THEME CONFIGURATOR BUTTON - FORCE COLOR
        &.layout-topbar-action-highlight {
            background: linear-gradient(135deg, var(--primary-500), var(--primary-600));
            
            i {
                color: #ffffff !important; // ✅ FORCE WHITE
                text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
            }
            
            &:hover {
                background: linear-gradient(135deg, var(--primary-600), var(--primary-700));
                
                i {
                    color: #ffffff !important;
                }
            }
        }
    }
    
    .user-menu-btn {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        width: auto;
        border-radius: 2rem;
        padding: 0 1rem;
        
        .user-name {
            font-size: 0.875rem;
            font-weight: 500;
            max-width: 120px;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        
        .user-arrow {
            font-size: 0.75rem;
            color: var(--text-color-secondary);
        }
    }
}

.theme-config-btn {
    display: inline-flex;
    justify-content: center;
    align-items: center;
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 50%;
    cursor: pointer;
    border: none;
    transition: all 0.2s ease;
    
    // Light theme default
    background: #f3f4f6;
    
    i {
        font-size: 1.25rem;
        color: #374151;
    }
    
    &:hover {
        background: #e5e7eb;
        
        i {
            color: #111827;
        }
    }
}


// Dark mode
:global(.app-dark) {
    .theme-config-btn {
        background: #374151;
        
        i {
            color: #e5e7eb;
        }
        
        &:hover {
            background: #4b5563;
            
            i {
                color: #ffffff;
            }
        }
    }
}

// Responsive
@media (max-width: 991px) {
    .layout-topbar {
        padding: 0 1rem;
        
        .layout-topbar-menu-wrapper {
            display: none;
        }
        
        .user-menu-btn .user-name {
            display: none;
        }
    }
}
</style>