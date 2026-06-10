// stores/tabs.ts
import { defineStore } from 'pinia'

export interface TabItem {
    id: string
    title: string
    path: string
    query?: Record<string, any>
    icon?: string
    closable: boolean
    timestamp: number
    instanceKey: number  // 🔥 Key unik untuk force re-mount
}

export const useTabsStore = defineStore('tabs', {
    state: () => ({
        tabs: [] as TabItem[],
        activeTabId: '' as string,
        isReady: false,
        tabInstanceCounter: 0  // 🔥 Counter global
    }),

    getters: {
        activeTab: (state) => state.tabs.find(t => t.id === state.activeTabId),
    },

    actions: {
        generateTabId(path: string, query?: Record<string, any>): string {
            if (query?.id) return `${path}?id=${query.id}`
            return path
        },

        openTab(tab: Omit<TabItem, 'id' | 'timestamp' | 'instanceKey'>) {
            const id = this.generateTabId(tab.path, tab.query)
            const existingTab = this.tabs.find(t => t.id === id)

            if (existingTab) {
                // Tab sudah ada, jangan ubah instanceKey
                this.activeTabId = existingTab.id
            } else {
                // 🔥 Tab baru: kasih instanceKey unik
                this.tabInstanceCounter++
                const newTab: TabItem = {
                    ...tab,
                    id,
                    timestamp: Date.now(),
                    instanceKey: this.tabInstanceCounter,
                    closable: tab.closable ?? true
                }
                this.tabs.push(newTab)
                this.activeTabId = newTab.id

                // Batasi max 10 tab
                if (this.tabs.length > 10) {
                    const closableTabs = this.tabs.filter(t => t.closable)
                    if (closableTabs.length > 0) {
                        const oldest = closableTabs.sort((a, b) => a.timestamp - b.timestamp)[0]
                        this.closeTab(oldest.id)
                    }
                }
            }
        },

        closeTab(tabId: string) {
            const index = this.tabs.findIndex(t => t.id === tabId)
            if (index === -1) return

            const tab = this.tabs[index]
            if (!tab.closable) return

            this.tabs.splice(index, 1)

            if (this.activeTabId === tabId) {
                if (this.tabs.length > 0) {
                    const newActiveIndex = Math.min(index, this.tabs.length - 1)
                    this.activeTabId = this.tabs[newActiveIndex].id
                } else {
                    this.activeTabId = ''
                }
            }
        },

        closeAllTabs() {
            this.tabs = this.tabs.filter(t => !t.closable)
            if (this.tabs.length > 0) {
                this.activeTabId = this.tabs[0].id
            } else {
                this.activeTabId = ''
            }
        },

        closeOtherTabs(tabId: string) {
            const activeTab = this.tabs.find(t => t.id === tabId)
            if (!activeTab) return
            this.tabs = this.tabs.filter(t => !t.closable || t.id === tabId)
            this.activeTabId = tabId
        },

        setActiveTab(tabId: string) {
            const tab = this.tabs.find(t => t.id === tabId)
            if (tab) {
                this.activeTabId = tabId
            }
        },

        initDefaultTabs() {
            this.tabs = []
            this.tabInstanceCounter = 0
            this.openTab({
                title: 'Dashboard',
                path: '/dashboard',
                icon: 'pi pi-home',
                closable: false
            })
            this.isReady = true
        },

        resetTabs() {
            this.tabs = []
            this.activeTabId = ''
            this.isReady = false
            this.tabInstanceCounter = 0
        }
    }
})