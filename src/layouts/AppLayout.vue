<!-- layouts/AppLayout.vue -->
<template>
    <div class="layout-wrapper" :class="containerClass">
        <app-topbar />
        <app-sidebar />
        
        <div class="layout-main-container">
            <TabBar v-if="tabsStore.isReady && tabsStore.tabs.length > 0" />
            <div class="layout-main">
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
}

.layout-main-container {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    justify-content: space-between;
    padding: 4.5rem 1.5rem 0 1.5rem;
    transition: margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1);

    // Desktop: Static mode dengan sidebar terbuka
    @media (min-width: 992px) {
        .layout-wrapper.layout-static:not(.layout-static-inactive) & {
            margin-left: 17rem;
        }
    }

    // Tablet & Mobile
    @media (max-width: 991px) {
        margin-left: 0 !important;
        padding: 4.5rem 1rem 0 1rem;
    }
}

.layout-main {
    flex: 1 1 auto;
    padding-bottom: 2rem;
}
</style>