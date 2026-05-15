<template>
    <div class="tab-bar">
        <div class="tab-bar-left">
            <div class="tabs-container" ref="tabsContainerRef">
                <div 
                    v-for="tab in tabsStore.tabs" 
                    :key="tab.id"
                    class="tab-item"
                    :class="{ 'active': tabsStore.activeTabId === tab.id }"
                    @click="navigateToTab(tab)"
                    @click.middle="closeTab(tab)"
                    :title="tab.title"
                >
                    <i v-if="tab.icon" :class="['pi', tab.icon]"></i>
                    <span class="tab-title">{{ tab.title }}</span>
                    <button 
                        v-if="tab.closable"
                        class="tab-close"
                        @click.stop="closeTab(tab)"
                    >
                        <i class="pi pi-times"></i>
                    </button>
                </div>
            </div>
        </div>
        
        <div class="tab-bar-right">
            <Button 
                icon="pi pi-times" 
                text 
                rounded 
                size="small"
                @click="tabsStore.closeAllTabs"
                v-tooltip="'Tutup Semua Tab'"
            />
            <Button 
                icon="pi pi-chevron-down" 
                text 
                rounded 
                size="small"
                @click="toggleMenu"
            />
            <Menu ref="tabMenu" :model="menuItems" :popup="true" />
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useTabsStore } from '~/stores/tabs'

const router = useRouter()
const tabsStore = useTabsStore()
const tabMenu = ref()

// 🔥 NAVIGASI KE TAB SAAT DIKLIK
const navigateToTab = (tab: any) => {
    tabsStore.setActiveTab(tab.id)
    
    // Navigasi ke route tab tersebut
    const route = tab.query && Object.keys(tab.query).length > 0
        ? { path: tab.path, query: tab.query }
        : tab.path
    
    router.push(route)
}

const closeTab = (tab: any) => {
    if (tab.closable) {
        tabsStore.closeTab(tab.id)
        
        // Jika tab yang ditutup adalah tab aktif, navigasi ke tab lain
        if (tabsStore.activeTabId) {
            const activeTab = tabsStore.activeTab
            if (activeTab) {
                const route = activeTab.query && Object.keys(activeTab.query).length > 0
                    ? { path: activeTab.path, query: activeTab.query }
                    : activeTab.path
                router.push(route)
            }
        }
    }
}

const menuItems = [
    {
        label: 'Tutup Tab Ini',
        icon: 'pi pi-times',
        command: () => {
            if (tabsStore.activeTab?.closable) {
                tabsStore.closeTab(tabsStore.activeTabId)
            }
        }
    },
    {
        label: 'Tutup Tab Lain',
        icon: 'pi pi-minus',
        command: () => tabsStore.closeOtherTabs(tabsStore.activeTabId)
    },
    {
        label: 'Tutup Semua Tab',
        icon: 'pi pi-times-circle',
        command: () => {
            tabsStore.closeAllTabs()
            // Navigasi ke dashboard
            const dashboardTab = tabsStore.tabs.find(t => !t.closable)
            if (dashboardTab) {
                router.push(dashboardTab.path)
            }
        }
    }
]

const toggleMenu = (event: Event) => {
    tabMenu.value?.toggle(event)
}
</script>

<style lang="scss" scoped>
.tab-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 2.5rem;
    background: var(--surface-card);
    border-bottom: 1px solid var(--surface-border);
    padding: 0 0.5rem;
    
    .tab-bar-left {
        flex: 1;
        overflow: hidden;
    }
    
    .tabs-container {
        display: flex;
        align-items: center;
        gap: 0.125rem;
        overflow-x: auto;
        scrollbar-width: thin;
        
        &::-webkit-scrollbar { height: 2px; }
    }
    
    .tab-item {
        display: flex;
        align-items: center;
        gap: 0.375rem;
        padding: 0.375rem 0.75rem;
        background: transparent;
        border-radius: 0.375rem;
        cursor: pointer;
        transition: all 0.15s;
        max-width: 180px;
        white-space: nowrap;
        border: 1px solid transparent;
        
        i { font-size: 0.875rem; color: var(--text-color-secondary); }
        
        .tab-title {
            font-size: 0.813rem;
            color: var(--text-color-secondary);
            overflow: hidden;
            text-overflow: ellipsis;
        }
        
        .tab-close {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 1.25rem;
            height: 1.25rem;
            border-radius: 0.25rem;
            border: none;
            background: transparent;
            cursor: pointer;
            opacity: 0;
            transition: all 0.15s;
            i { font-size: 0.75rem; }
            &:hover { background: var(--surface-200); }
        }
        
        &:hover {
            background: var(--surface-100);
            .tab-close { opacity: 1; }
        }
        
        &.active {
            background: var(--primary-50);
            border-color: var(--primary-200);
            .tab-title { color: var(--primary-700); font-weight: 500; }
            i { color: var(--primary-600); }
            .tab-close { opacity: 1; }
        }
    }
    
    .tab-bar-right {
        display: flex;
        align-items: center;
        gap: 0.125rem;
        padding-left: 0.5rem;
        border-left: 1px solid var(--surface-border);
        margin-left: 0.5rem;
    }
}
</style>