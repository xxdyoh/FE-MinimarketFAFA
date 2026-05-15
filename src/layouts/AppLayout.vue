<template>
    <div class="layout-wrapper" :class="containerClass">
        <app-topbar></app-topbar>
        <app-sidebar v-if="layoutConfig.menuMode !== 'horizontal'"></app-sidebar>
        <div class="layout-main-container">
            <!-- Tab Bar -->
            <TabBar v-if="tabsStore.isReady && tabsStore.tabs.length > 0" />
            
            <div class="layout-main">
                <!-- 🔥 NuxtPage dengan KeepAlive untuk caching -->
                <NuxtPage keepalive :keepalive-props="{ max: 10 }" />
            </div>
            <app-footer></app-footer>
        </div>
        <div class="layout-mask animate-fadein"></div>
    </div>
    <Toast />
</template>

<script setup>
import { computed, onMounted } from 'vue'
import AppFooter from './AppFooter.vue'
import AppSidebar from './AppSidebar.vue'
import AppTopbar from './AppTopbar.vue'
import TabBar from '~/components/common/TabBar.vue'
// ❌ HAPUS TabView import
import { useLayout } from "~/layouts/composables/layout.js"
import { useTabsStore } from '~/stores/tabs'

const { layoutConfig, layoutState, isSidebarActive, resetMenu } = useLayout()
const tabsStore = useTabsStore()

onMounted(() => {
    console.log('🎯 AppLayout mounted, initializing tabs...')
    tabsStore.initDefaultTabs()
})

// Container class
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

// ... methods
function bindOutsideClickListener() {}
function unbindOutsideClickListener() {}
function isOutsideClicked(event) { return false }
</script>

<style lang="scss" scoped>
.layout-main-container {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    justify-content: space-between;
    padding: 4.5rem 1.5rem 0 1.5rem;
    transition: margin-left var(--layout-section-transition-duration);
}

.layout-main {
    flex: 1 1 auto;
    padding-bottom: 2rem;
}
</style>