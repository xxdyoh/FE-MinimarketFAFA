<!-- components/common/TabBar.vue -->
<template>
    <div class="tab-bar">
        <!-- Tabs -->
        <div class="tabs-wrapper" ref="tabsWrapperRef">
            <div class="tabs-container">
                <div 
                    v-for="tab in tabsStore.tabs" 
                    :key="tab.id"
                    class="tab-item"
                    :class="{ 'active': tabsStore.activeTabId === tab.id }"
                    @click="navigateToTab(tab)"
                    @click.middle="closeTab(tab)"
                    :title="tab.title"
                    draggable="false"
                >
                    <i v-if="tab.icon" :class="['pi', tab.icon, 'tab-icon']"></i>
                    <span class="tab-title">{{ tab.title }}</span>
                    <button 
                        v-if="tab.closable"
                        class="tab-close"
                        @click.stop="closeTab(tab)"
                        tabindex="-1"
                    >
                        <i class="pi pi-times"></i>
                    </button>
                </div>
            </div>
        </div>
        
        <!-- Actions -->
        <div class="tab-actions">
            <Button 
                icon="pi pi-chevron-down" 
                text 
                rounded 
                size="small"
                @click="toggleMenu"
                v-tooltip.bottom="'Menu Tab'"
                class="action-btn"
            />
            <Menu ref="tabMenu" :model="menuItems" :popup="true" />
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useTabsStore } from '~/stores/tabs'

const router = useRouter()
const tabsStore = useTabsStore()
const tabMenu = ref()
const tabsWrapperRef = ref<HTMLElement | null>(null)

// Auto-scroll ke tab aktif
const scrollToActive = () => {
    if (!tabsWrapperRef.value) return
    
    const activeTab = tabsWrapperRef.value.querySelector('.tab-item.active')
    if (activeTab) {
        activeTab.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'nearest', 
            inline: 'center' 
        })
    }
}

onMounted(() => {
    scrollToActive()
})

watch(() => tabsStore.activeTabId, () => {
    setTimeout(scrollToActive, 50)
})

const navigateToTab = (tab: any) => {
    tabsStore.setActiveTab(tab.id)
    const route = tab.query && Object.keys(tab.query).length > 0
        ? { path: tab.path, query: tab.query }
        : tab.path
    router.push(route)
}

const closeTab = (tab: any) => {
    if (tab.closable) {
        tabsStore.closeTab(tab.id)
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
            if (tabsStore.activeTab?.closable) tabsStore.closeTab(tabsStore.activeTabId)
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
            const dashboardTab = tabsStore.tabs.find(t => !t.closable)
            if (dashboardTab) router.push(dashboardTab.path)
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
    height: 2.5rem;
    background: var(--surface-50);
    padding: 0 0.25rem;
    gap: 0;
    user-select: none;
    
    .tabs-wrapper {
        flex: 1;
        overflow: hidden;
        position: relative;
        
        // Fade edges
        &::before,
        &::after {
            content: '';
            position: absolute;
            top: 0;
            bottom: 0;
            width: 20px;
            z-index: 2;
            pointer-events: none;
        }
        
        &::before {
            left: 0;
            background: linear-gradient(to right, var(--surface-50), transparent);
        }
        
        &::after {
            right: 0;
            background: linear-gradient(to left, var(--surface-50), transparent);
        }
    }
    
    .tabs-container {
        display: flex;
        align-items: stretch;
        overflow-x: auto;
        overflow-y: hidden;
        scrollbar-width: none;
        -ms-overflow-style: none;
        height: 100%;
        gap: 0;
        
        &::-webkit-scrollbar { 
            display: none; 
        }
    }
    
    .tab-item {
        display: flex;
        align-items: center;
        gap: 0.375rem;
        padding: 0 0.75rem;
        height: 100%;
        cursor: pointer;
        transition: all 0.12s ease;
        white-space: nowrap;
        flex-shrink: 0;
        max-width: 180px;
        position: relative;
        color: var(--text-color-secondary);
        font-size: 0.78rem;
        font-weight: 400;
        
        // Garis bawah kayak Chrome
        &::after {
            content: '';
            position: absolute;
            bottom: 0;
            left: 0.75rem;
            right: 0.75rem;
            height: 2px;
            background: transparent;
            border-radius: 1px 1px 0 0;
            transition: background 0.15s;
        }
        
        .tab-icon {
            font-size: 0.85rem;
            flex-shrink: 0;
            opacity: 0.7;
        }
        
        .tab-title {
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        
        .tab-close {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 1.25rem;
            height: 1.25rem;
            border-radius: 50%;
            border: none;
            background: transparent;
            cursor: pointer;
            opacity: 0;
            transition: all 0.12s;
            flex-shrink: 0;
            padding: 0;
            color: var(--text-color-secondary);
            
            i { font-size: 0.6rem; }
            
            &:hover { 
                background: var(--surface-300);
                color: var(--text-color);
            }
        }
        
        &:hover {
            background: var(--surface-100);
            
            .tab-close { opacity: 1; }
        }
        
        &.active {
            color: var(--text-color);
            font-weight: 600;
            background: var(--surface-card);
            
            &::after {
                background: var(--primary-500);
            }
            
            .tab-icon {
                opacity: 1;
                color: var(--primary-600);
            }
            
            .tab-close { 
                opacity: 1;
                &:hover { background: var(--surface-200); }
            }
        }
    }
    
    .tab-actions {
        display: flex;
        align-items: center;
        flex-shrink: 0;
        padding-left: 0.25rem;
        
        .action-btn {
            width: 1.75rem !important;
            height: 1.75rem !important;
            
            :deep(.p-button-icon) {
                font-size: 0.8rem !important;
            }
        }
    }
    
    @media (max-width: 640px) {
        height: 2.25rem;
        
        .tab-item {
            max-width: 120px;
            padding: 0 0.625rem;
            font-size: 0.72rem;
            
            .tab-icon { font-size: 0.75rem; }
        }
    }
}
</style>