<template>
    <div class="tab-view">
        <KeepAlive :max="10">
            <component 
                :is="currentComponent" 
                :key="tabsStore.activeTabId"
            />
        </KeepAlive>
    </div>
</template>

<script setup lang="ts">
import { defineAsyncComponent, shallowRef, watch } from 'vue'
import { useTabsStore } from '~/stores/tabs'
import { useRouter } from 'vue-router'

const tabsStore = useTabsStore()
const router = useRouter()

// Cache komponen yang sudah di-load
const componentCache = new Map<string, any>()

// Mapping path ke komponen
const getComponentForPath = (path: string) => {
    const basePath = path.split('?')[0]
    
    const componentMap: Record<string, any> = {
        '/': () => import('~/pages/index.vue'),
        '/dashboard': () => import('~/pages/dashboard/index.vue'),
        '/master/barang': () => import('~/pages/master/barang/index.vue'),
        '/master/barang/form': () => import('~/pages/master/barang/form.vue'),
        '/master/customer': () => import('~/pages/master/customer/index.vue'),
        '/master/customer/form': () => import('~/pages/master/customer/form.vue'),
        '/penjualan/do': () => import('~/pages/penjualan/do/index.vue'),
        '/penjualan/do/form': () => import('~/pages/penjualan/do/form.vue'),
        '/laporan/persediaan': () => import('~/pages/laporan/persediaan.vue'),
        '/laporan/pembelian': () => import('~/pages/laporan/pembelian.vue'),
        '/laporan/pembelian-per-item': () => import('~/pages/laporan/pembelian-per-item.vue'),
        '/laporan/penjualan': () => import('~/pages/laporan/penjualan.vue'),
        '/laporan/penjualan-per-item': () => import('~/pages/laporan/penjualan-per-item.vue'),
        '/laporan/kartu-stock': () => import('~/pages/laporan/kartu-stock.vue'),
        '/pos': () => import('~/pages/pos/index.vue'),
    }
    
    return componentMap[basePath] || (() => import('~/pages/index.vue'))
}

const currentComponent = shallowRef<any>(null)

// 🔥 Watch active tab - load komponen & cache
watch(() => tabsStore.activeTabId, async (newId) => {
    if (!newId) return
    
    const activeTab = tabsStore.activeTab
    if (!activeTab) return
    
    console.log('🔄 Switch to tab:', activeTab.title)
    
    // Cek cache dulu
    if (componentCache.has(newId)) {
        currentComponent.value = componentCache.get(newId)
        console.log('📦 From cache:', newId)
        return
    }
    
    // Load baru
    const loader = getComponentForPath(activeTab.path)
    const comp = defineAsyncComponent(loader)
    componentCache.set(newId, comp)
    currentComponent.value = comp
    console.log('🆕 New component:', newId)
    
    // Update URL
    const targetPath = activeTab.query && Object.keys(activeTab.query).length > 0
        ? { path: activeTab.path, query: activeTab.query }
        : activeTab.path
    router.push(targetPath).catch(() => {})
}, { immediate: true })

// 🔥 Saat tab di-close, hapus dari cache
watch(() => tabsStore.tabs.length, () => {
    const activeIds = new Set(tabsStore.tabs.map(t => t.id))
    
    // Hapus cache untuk tab yang sudah di-close
    for (const [id] of componentCache) {
        if (!activeIds.has(id)) {
            componentCache.delete(id)
            console.log('🗑️ Cache removed for closed tab:', id)
        }
    }
})
</script>

<style lang="scss" scoped>
.tab-view {
    flex: 1;
    overflow: hidden;
    height: 100%;
    display: flex;
    flex-direction: column;
}
</style>