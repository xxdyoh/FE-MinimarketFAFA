<!-- layouts/AppSidebar.vue -->
<script setup>
import AppMenu from './AppMenu.vue';
import { useLayout } from "~/layouts/composables/layout.js";

const { layoutConfig, layoutState, isSidebarActive, resetMenu } = useLayout();
</script>

<template>
    <!-- Backdrop -->
    <Teleport to="body">
        <div 
            class="sidebar-backdrop"
            :class="{ 'show': isSidebarActive }"
            @click="resetMenu"
        />
    </Teleport>
    
    <!-- Sidebar -->
    <aside 
        class="app-sidebar"
        :class="{
            'show': layoutConfig.menuMode === 'overlay' 
                ? isSidebarActive 
                : layoutConfig.menuMode === 'static' && !layoutState.staticMenuDesktopInactive,
            'mobile-show': layoutState.staticMenuMobileActive
        }"
    >
        <!-- Header -->
        <div class="sidebar-head">
            <router-link to="/" class="sidebar-brand">
                <div class="brand-icon">
                    <i class="pi pi-box"></i>
                </div>
                <div class="brand-text">
                    <span class="brand-name">FAFA</span>
                    <span class="brand-sub">KOSMETIK</span>
                </div>
            </router-link>
            <button class="sidebar-close" @click="resetMenu">
                <i class="pi pi-times"></i>
            </button>
        </div>

        <!-- Divider -->
        <div class="sidebar-divider"></div>

        <!-- Menu -->
        <div class="sidebar-body">
            <app-menu></app-menu>
        </div>

        <!-- Footer -->
        <div class="sidebar-foot">
            <div class="user-mini" v-if="false">
                <div class="user-avatar">
                    <span>AD</span>
                </div>
                <div class="user-info">
                    <span class="user-name">Admin</span>
                    <span class="user-role">Administrator</span>
                </div>
            </div>
        </div>
    </aside>
</template>

<style lang="scss" scoped>
// Backdrop
.sidebar-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 998;
    opacity: 0;
    visibility: hidden;
    transition: all 0.3s ease;
    backdrop-filter: blur(2px);

    &.show {
        opacity: 1;
        visibility: visible;
    }
}

// Sidebar
.app-sidebar {
    position: fixed;
    top: 0;
    left: 0;
    width: 17rem;
    height: 100vh;
    height: 100dvh;
    z-index: 999;
    background: var(--surface-card);
    border-right: 1px solid var(--surface-border);
    display: flex;
    flex-direction: column;
    transform: translateX(-100%);
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: none;

    &.show,
    &.mobile-show {
        transform: translateX(0);
        box-shadow: 4px 0 20px rgba(0, 0, 0, 0.08);
    }

    // Desktop Static Mode
    @media (min-width: 992px) {
        .layout-wrapper.layout-static & {
            top: 4rem;
            height: calc(100vh - 4rem);
            height: calc(100dvh - 4rem);
            transform: translateX(0);
            box-shadow: none;
            border-right: 1px solid var(--surface-border);
        }

        .layout-wrapper.layout-static-inactive & {
            transform: translateX(-100%);
        }

        .layout-wrapper.layout-overlay & {
            top: 4rem;
            height: calc(100vh - 4rem);
            height: calc(100dvh - 4rem);
        }

        .layout-wrapper.layout-horizontal & {
            display: none !important;
        }
    }

    // Tablet & Mobile
    @media (max-width: 991px) {
        width: 17rem;
        
        &.mobile-show {
            box-shadow: 4px 0 25px rgba(0, 0, 0, 0.15);
        }
    }

    @media (max-width: 480px) {
        width: 85vw;
        max-width: 17rem;
    }
}

// Sidebar Header
.sidebar-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.875rem 1.25rem;
    height: 4rem;
    flex-shrink: 0;
    border-bottom: 1px solid var(--surface-border);
    background: var(--surface-card);

    @media (min-width: 992px) {
        .layout-wrapper.layout-static &,
        .layout-wrapper.layout-overlay & {
            display: none;
        }
    }
}

.sidebar-brand {
    display: flex;
    align-items: center;
    gap: 0.625rem;
    text-decoration: none;

    .brand-icon {
        width: 2.25rem;
        height: 2.25rem;
        background: linear-gradient(135deg, var(--primary-500), var(--primary-600));
        border-radius: 0.5rem;
        display: flex;
        align-items: center;
        justify-content: center;

        i {
            color: white;
            font-size: 1.1rem;
        }
    }

    .brand-text {
        display: flex;
        flex-direction: column;
        line-height: 1.1;

        .brand-name {
            font-weight: 800;
            font-size: 1rem;
            color: var(--text-color);
            letter-spacing: 0.05em;
        }

        .brand-sub {
            font-size: 0.6rem;
            font-weight: 500;
            color: var(--text-color-secondary);
            letter-spacing: 0.2em;
        }
    }
}

.sidebar-close {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2.25rem;
    height: 2.25rem;
    border-radius: 50%;
    border: none;
    background: var(--surface-100);
    cursor: pointer;
    color: var(--text-color-secondary);
    transition: all 0.2s;

    i {
        font-size: 1rem;
    }

    &:hover {
        background: var(--surface-200);
        color: var(--text-color);
    }
}

.sidebar-divider {
    height: 1px;
    background: var(--surface-border);
    flex-shrink: 0;

    @media (min-width: 992px) {
        .layout-wrapper.layout-static &,
        .layout-wrapper.layout-overlay & {
            display: none;
        }
    }
}

// Sidebar Body
.sidebar-body {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    padding: 0.625rem 0.75rem;

    &::-webkit-scrollbar {
        width: 3px;
    }

    &::-webkit-scrollbar-track {
        background: transparent;
    }

    &::-webkit-scrollbar-thumb {
        background: var(--surface-300);
        border-radius: 10px;
    }

    // Styling menu items dari AppMenu
    :deep(.layout-menu) {
        .layout-root-menuitem {
            > .layout-menuitem-root-text {
                font-size: 0.7rem;
                text-transform: uppercase;
                font-weight: 700;
                color: var(--text-color-secondary);
                letter-spacing: 0.08em;
                padding: 0.625rem 0.75rem 0.375rem;
                margin: 0;
            }
        }

        a {
            padding: 0.6rem 0.75rem !important;
            border-radius: 0.5rem !important;
            font-size: 0.85rem !important;
            font-weight: 500;
            margin-bottom: 0.125rem;
            transition: all 0.15s ease;

            .layout-menuitem-icon {
                font-size: 1rem !important;
                width: 1.25rem;
                text-align: center;
                margin-right: 0.625rem !important;
                color: var(--text-color-secondary);
            }

            .layout-menuitem-text {
                flex: 1;
            }

            .layout-submenu-toggler {
                font-size: 0.7rem !important;
            }

            &.active-route {
                background: var(--primary-50) !important;
                color: var(--primary-700) !important;
                font-weight: 600 !important;

                .layout-menuitem-icon {
                    color: var(--primary-600) !important;
                }
            }

            &:hover {
                background: var(--surface-hover) !important;
            }
        }

        ul ul a {
            padding: 0.5rem 0.75rem !important;
            font-size: 0.8rem !important;
        }
    }
}

// Sidebar Footer
.sidebar-foot {
    padding: 0.75rem 1rem;
    border-top: 1px solid var(--surface-border);
    flex-shrink: 0;
}

.user-mini {
    display: flex;
    align-items: center;
    gap: 0.625rem;
}

.user-avatar {
    width: 2rem;
    height: 2rem;
    border-radius: 0.5rem;
    background: var(--primary-100);
    color: var(--primary-700);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.7rem;
    font-weight: 700;
    flex-shrink: 0;
}

.user-info {
    display: flex;
    flex-direction: column;
    overflow: hidden;

    .user-name {
        font-size: 0.8rem;
        font-weight: 600;
        color: var(--text-color);
    }

    .user-role {
        font-size: 0.65rem;
        color: var(--text-color-secondary);
    }
}
</style>