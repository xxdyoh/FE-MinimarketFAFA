<!-- layouts/AppLayout.vue -->
<template>
    <div class="layout-wrapper" :class="containerClass">
        <app-topbar />
        <app-sidebar />
        
        <div class="layout-main-container">
            <!-- Screen: Tab Bar + Content - Fixed, no scroll -->
            <div class="layout-screen" v-if="tabsStore.isReady && tabsStore.tabs.length > 0">
                <TabBar class="screen-tab-bar" />
                <div class="screen-content">
                     <NuxtPage :keepalive="{ max: 10 }" />
                </div>
            </div>
            
            <!-- Fallback -->
            <div class="layout-main" v-else>
                <NuxtPage />
            </div>
            
            <app-footer />
        </div>
    </div>
    <Toast />
</template>

<script setup>
import { computed, onMounted } from 'vue'
import AppFooter from './AppFooter.vue'
import AppSidebar from './AppSidebar.vue'
import AppTopbar from './AppTopbar.vue'
import TabBar from '~/components/common/TabBar.vue'
import { useLayout } from "~/layouts/composables/layout.js"
import { useTabsStore } from '~/stores/tabs'

const { layoutConfig, layoutState } = useLayout()
const tabsStore = useTabsStore()

onMounted(() => {
    tabsStore.initDefaultTabs()
})

const containerClass = computed(() => {
    return {
        'layout-overlay': layoutConfig.menuMode === 'overlay',
        'layout-static': layoutConfig.menuMode === 'static',
        'layout-horizontal': layoutConfig.menuMode === 'horizontal',
        'layout-static-inactive': layoutState.staticMenuDesktopInactive && layoutConfig.menuMode === 'static',
        'layout-overlay-active': layoutState.overlayMenuActive,
        'layout-mobile-active': layoutState.staticMenuMobileActive
    }
})
</script>

<style lang="scss" scoped>
.layout-wrapper {
    min-height: 100vh;
    max-height: 100vh;
    overflow: hidden;
    display: flex;
    flex-direction: column;
}

.layout-main-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
    padding: 4.5rem 1.5rem 0 1.5rem;
    transition: margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    overflow: hidden;

    @media (min-width: 992px) {
        .layout-wrapper.layout-static:not(.layout-static-inactive) & {
            margin-left: 17rem;
        }
    }

    @media (max-width: 991px) {
        margin-left: 0 !important;
        padding: 4.5rem 0.75rem 0 0.75rem;
    }
    
    @media (max-width: 480px) {
        padding: 4rem 0.375rem 0 0.375rem;
    }
}

// 🔥 SCREEN: Tab bar + Content jadi satu layar FIXED
.layout-screen {
    flex: 1;
    display: flex;
    flex-direction: column;
    background: var(--surface-card);
    border-radius: 0.75rem;
    border: 1px solid var(--surface-border);
    overflow: hidden;
    min-height: 0;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
    margin-bottom: 0.5rem;

    @media (max-width: 480px) {
        border-radius: 0.5rem;
        margin-bottom: 0.25rem;
    }
}

.screen-tab-bar {
    flex-shrink: 0;
}

// 🔥 CONTENT: Fixed, tidak scroll. Biarkan page yang handle scroll di dalamnya
.screen-content {
    flex: 1;
    min-height: 0;
    overflow: hidden;
    display: flex;
    flex-direction: column;
}

.layout-main {
    flex: 1 1 auto;
    padding-bottom: 1rem;
    overflow: auto;
    
    @media (max-width: 480px) {
        padding-bottom: 0.5rem;
    }
}
</style>