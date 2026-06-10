<template>
    <div class="master-browse">
        <!-- Header Section -->
        <div class="browse-header">
            <div class="header-left">
                <div class="header-icon">
                    <i :class="['pi', config.icon || 'pi-database']"></i>
                </div>
                <div class="header-text">
                    <h1 class="header-title">{{ config.title }}</h1>
                    <p class="header-subtitle">{{ config.subtitle || `Kelola data master ${config.title.toLowerCase()}` }}</p>
                </div>
            </div>
            <div class="header-actions">
                <Button 
                    icon="pi pi-plus" 
                    label="Tambah" 
                    severity="primary" 
                    size="small"
                    @click="openAddForm" 
                />
            </div>
        </div>

        <!-- Card Content -->
        <div class="browse-card">
            <!-- Toolbar -->
            <div class="browse-toolbar">
                <div class="toolbar-left">
                    <!-- GLOBAL SEARCH (LIKE %keyword%) -->
                    <IconField iconPosition="left">
                        <InputIcon class="pi pi-search" />
                        <InputText 
                            v-model="searchKeyword" 
                            placeholder="Cari semua kolom..." 
                            size="small"
                            class="search-input"
                            @input="onSearchInput"
                        />
                    </IconField>
                    
                    <div v-if="selectedItems.length > 0" class="bulk-info">
                        <span>{{ selectedItems.length }} terpilih</span>
                        <Button 
                            icon="pi pi-trash" 
                            severity="danger" 
                            text 
                            size="small"
                            @click="confirmBulkDelete" 
                        />
                    </div>

                    <!-- Active Multi-Select Filters Indicator -->
                    <div v-if="activeMultiSelectFiltersCount > 0" class="active-filters">
                        <i class="pi pi-filter-fill"></i>
                        <span>{{ activeMultiSelectFiltersCount }} filter checklist</span>
                        <Button 
                            icon="pi pi-times" 
                            text 
                            rounded 
                            size="small"
                            severity="secondary"
                            @click="clearAllColumnFilters" 
                        />
                    </div>
                    
                    <!-- Active Text Filters Indicator -->
                    <div v-if="activeTextFiltersCount > 0" class="active-filters text-filters-active">
                        <i class="pi pi-pencil"></i>
                        <span>{{ activeTextFiltersCount }} filter teks</span>
                        <Button 
                            icon="pi pi-times" 
                            text 
                            rounded 
                            size="small"
                            severity="secondary"
                            @click="clearAllTextFilters" 
                        />
                    </div>
                </div>
                
                <div class="toolbar-right">
                    <Button 
                        icon="pi pi-refresh" 
                        severity="secondary" 
                        text 
                        size="small"
                        :loading="loading"
                        @click="fetchData" 
                    />
                    <Button 
                        icon="pi pi-pencil" 
                        severity="secondary" 
                        text 
                        size="small"
                        :class="{ 'filter-active': activeTextFiltersCount > 0 }"
                        @click="showTextFilterDrawer = true" 
                        v-tooltip="'Filter Teks Per Kolom'"
                    />
                </div>
            </div>

            <!-- DataTable -->
            <DataTable 
                v-model:selection="selectedItems"
                v-model:expandedRows="expandedRows"
                :value="items" 
                :dataKey="config.primaryKey"
                :loading="loading"
                :sortField="sortField"
                :sortOrder="sortOrder"
                @sort="onSort"
                @rowExpand="onRowExpand"
                @rowCollapse="onRowCollapse"
                stripedRows
                responsiveLayout="scroll"
                size="small"
                class="browse-table"
            >
                <template #empty>
                    <div class="empty-state">
                        <i class="pi pi-inbox"></i>
                        <p>Tidak ada data ditemukan</p>
                        <Button 
                            v-if="activeMultiSelectFiltersCount > 0 || activeTextFiltersCount > 0 || searchKeyword"
                            label="Reset Filter & Pencarian" 
                            text 
                            size="small"
                            @click="resetAllFiltersAndSearch" 
                        />
                    </div>
                </template>

                <template #loading>
                    <div class="loading-state">
                        <i class="pi pi-spinner pi-spin"></i>
                        <p>Memuat data...</p>
                    </div>
                </template>

                <!-- Column Expander (Conditional) -->
                <Column v-if="config.expansion?.enabled" expander style="width: 3rem" />
                
                <Column selectionMode="multiple" style="width: 3rem" />

                <Column 
                    v-for="col in visibleColumns" 
                    :key="col.field" 
                    :field="col.field" 
                    :sortable="col.sortable !== false"
                    :style="{ minWidth: col.minWidth || '120px', textAlign: col.align || 'left' }"
                >
                    <template #header>
                        <div class="column-header">
                            <span class="column-title">{{ col.header }}</span>
                            
                            <!-- Multi-Select Filter Icon -->
                            <Button 
                                icon="pi pi-filter" 
                                text 
                                rounded 
                                size="small"
                                :class="{ 'filter-active': hasColumnFilter(col.field) }"
                                @click.stop="toggleColumnFilter(col, $event)"
                            />
                            
                            <!-- OverlayPanel - Multi-select -->
                            <OverlayPanel 
                                :ref="(el) => setFilterOverlayRef(col.field, el)"
                                @hide="onFilterPanelHide(col.field)"
                            >
                                <div class="filter-panel">
                                    <div class="filter-panel-header">
                                        <span>Filter {{ col.header }}</span>
                                        <Button 
                                            icon="pi pi-times" 
                                            text 
                                            rounded 
                                            size="small"
                                            @click="closeFilterPanel(col.field)" 
                                        />
                                    </div>
                                    
                                    <!-- Search dalam filter -->
                                    <div class="filter-panel-search">
                                        <IconField iconPosition="left">
                                            <InputIcon class="pi pi-search" />
                                            <InputText 
                                                v-model="filterSearchTerms[col.field]" 
                                                placeholder="Cari nilai..." 
                                                size="small"
                                                class="w-full"
                                            />
                                        </IconField>
                                    </div>

                                    <!-- Actions -->
                                    <div class="filter-panel-actions">
                                        <Button 
                                            label="Pilih Semua" 
                                            text 
                                            size="small"
                                            @click="selectAllFilterOptions(col.field)" 
                                        />
                                        <Button 
                                            label="Bersihkan" 
                                            text 
                                            size="small"
                                            @click="clearFilterOptions(col.field)" 
                                        />
                                    </div>

                                    <!-- List Options -->
                                    <div class="filter-panel-list">
                                        <div v-if="filterOptionsLoading[col.field]" class="filter-loading">
                                            <i class="pi pi-spinner pi-spin"></i>
                                            <span>Memuat nilai filter...</span>
                                        </div>
                                        
                                        <div 
                                            v-else
                                            v-for="option in getFilteredOptions(col.field)" 
                                            :key="option.value"
                                            class="filter-option"
                                        >
                                            <Checkbox 
                                                v-model="tempFilters[col.field]"
                                                :value="option.value"
                                                :inputId="`filter-${col.field}-${option.value}`"
                                            />
                                            <label :for="`filter-${col.field}-${option.value}`" class="filter-label">
                                                <span>{{ option.label }}</span>
                                                <span class="option-count">({{ option.count }})</span>
                                            </label>
                                        </div>
                                        
                                        <div v-if="getFilteredOptions(col.field).length === 0 && !filterOptionsLoading[col.field]" class="filter-empty">
                                            Tidak ada nilai
                                        </div>
                                    </div>

                                    <!-- Footer -->
                                    <div class="filter-panel-footer">
                                        <Button 
                                            label="Terapkan" 
                                            severity="primary" 
                                            size="small"
                                            class="w-full"
                                            @click="applyColumnFilter(col.field)" 
                                        />
                                    </div>
                                </div>
                            </OverlayPanel>
                        </div>
                    </template>

                    <template #body="slotProps">
                        <!-- Boolean -->
                        <Tag 
                            v-if="col.type === 'boolean'"
                            :value="slotProps.data[col.field] ? (col.booleanLabels?.true || 'Ya') : (col.booleanLabels?.false || 'Tidak')"
                            :severity="slotProps.data[col.field] ? 'success' : 'secondary'"
                            size="small"
                        />

                        <!-- Currency -->
                        <span v-else-if="col.type === 'currency'" class="currency-text">
                            {{ formatCurrency(slotProps.data[col.field]) }}
                        </span>

                        <!-- Number -->
                        <span v-else-if="col.type === 'number'" class="number-text">
                            {{ slotProps.data[col.field]?.toLocaleString('id-ID') || '-' }}
                        </span>

                        <!-- Default -->
                        <span v-else>
                            {{ slotProps.data[col.field] || '-' }}
                        </span>
                    </template>
                </Column>

                <Column header="Aksi" style="width: 6rem; text-align: center">
                    <template #body="slotProps">
                        <div class="action-buttons">
                            <Button 
                                icon="pi pi-pencil" 
                                text 
                                rounded 
                                size="small"
                                severity="info"
                                @click="openEditForm(slotProps.data)" 
                            />
                            <Button 
                                icon="pi pi-trash" 
                                text 
                                rounded 
                                size="small"
                                severity="danger"
                                @click="confirmDelete(slotProps.data)" 
                            />
                        </div>
                    </template>
                </Column>

                <!-- Row Expansion Template (Conditional) -->
                <template v-if="config.expansion?.enabled" #expansion="slotProps">
                    <div class="expansion-content">
                        <div class="expansion-header">
                            <div class="expansion-header-left">
                                <i class="pi pi-info-circle"></i>
                                <span class="expansion-title">
                                    {{ config.expansion?.title || 'Detail' }} - {{ slotProps.data[config.primaryKey] }}
                                </span>
                                <Tag :value="slotProps.data.Nama" severity="info" size="small" />
                            </div>
                        </div>
                        
                        <!-- Loading state -->
                        <div v-if="detailLoading[slotProps.data[config.primaryKey]]" class="detail-loading">
                            <i class="pi pi-spinner pi-spin"></i>
                            <span>Memuat detail...</span>
                        </div>
                        
                        <!-- Detail Table -->
                        <DataTable 
                            v-else
                            :value="detailData[slotProps.data[config.primaryKey]] || []" 
                            size="small" 
                            class="expansion-table"
                            stripedRows
                        >
                            <template #empty>
                                <div class="detail-empty">
                                    <i class="pi pi-info-circle"></i>
                                    <span>Tidak ada data detail</span>
                                </div>
                            </template>
                            
                            <!-- Dynamic columns dari config -->
                            <Column 
                                v-for="col in config.expansion?.columns || []" 
                                :key="col.field"
                                :field="col.field"
                                :header="col.header"
                                :style="{ 
                                    width: col.width || 'auto', 
                                    minWidth: col.minWidth || '120px',
                                    textAlign: col.align || 'left'
                                }"
                            >
                                <template v-if="col.type === 'currency'" #body="{ data }">
                                    {{ formatCurrency(data[col.field]) }}
                                </template>
                                <template v-else-if="col.type === 'number'" #body="{ data }">
                                    {{ data[col.field]?.toLocaleString('id-ID') || '-' }}
                                </template>
                            </Column>
                        </DataTable>
                    </div>
                </template>
            </DataTable>

            <!-- Paginator -->
            <div class="browse-paginator">
                <div class="paginator-left">
                    <Select 
                        v-model="pagination.perPage" 
                        :options="[10, 15, 25, 50]" 
                        size="small"
                        class="perpage-select"
                        @update:modelValue="onPerPageChange"
                    />
                    <span class="paginator-info">per halaman</span>
                </div>

                <div class="paginator-center">
                    <Paginator 
                        :rows="pagination.perPage" 
                        :totalRecords="pagination.total"
                        :rowsPerPageOptions="[10, 15, 25, 50]"
                        @page="onPageChange"
                        template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink"
                        class="custom-paginator"
                    />
                </div>

                <div class="paginator-right">
                    <span class="total-info">{{ pagination.total }} total data</span>
                </div>
            </div>
        </div>

        <!-- Text Filter Drawer -->
        <Drawer 
            v-model:visible="showTextFilterDrawer" 
            position="right" 
            header="Filter Teks Per Kolom" 
            class="text-filter-drawer"
        >
            <div class="text-filter-content">
                <p class="text-filter-desc">
                    Isi kata kunci untuk mencari data di kolom tertentu. 
                    Filter ini menggunakan pencarian <strong>LIKE %kata%</strong>.
                </p>
                
                <div class="text-filter-grid">
                    <div v-for="col in visibleColumns" :key="col.field" class="text-filter-item">
                        <label :for="`text-filter-${col.field}`">
                            <i :class="['pi', col.icon || 'pi-circle', 'text-filter-icon']"></i>
                            {{ col.header }}
                        </label>
                        <InputText 
                            :id="`text-filter-${col.field}`"
                            v-model="tempTextFilters[col.field]"
                            :placeholder="`Cari ${col.header}...`"
                            size="small"
                            class="w-full"
                            @keydown.enter="applyTextFilters"
                        />
                    </div>
                </div>
            </div>

            <template #footer>
                <div class="text-filter-footer">
                    <Button 
                        label="Reset" 
                        text 
                        size="small"
                        icon="pi pi-times"
                        @click="resetTempTextFilters" 
                    />
                    <Button 
                        label="Terapkan" 
                        severity="primary" 
                        size="small"
                        icon="pi pi-check"
                        @click="applyTextFilters" 
                    />
                </div>
            </template>
        </Drawer>

        <!-- Delete Dialog -->
        <Dialog 
            v-model:visible="deleteVisible" 
            header="Konfirmasi Hapus" 
            :modal="true"
            :style="{ width: '400px' }"
        >
            <div class="delete-dialog">
                <i class="pi pi-exclamation-triangle"></i>
                <p>Yakin ingin menghapus data ini? Tindakan ini tidak dapat dibatalkan.</p>
            </div>
            <template #footer>
                <Button label="Batal" text size="small" @click="deleteVisible = false" />
                <Button label="Hapus" severity="danger" size="small" :loading="deleteLoading" @click="handleDelete" />
            </template>
        </Dialog>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import OverlayPanel from 'primevue/overlaypanel'
import Checkbox from 'primevue/checkbox'
import { useMasterCrud, type MasterConfig } from '~/composables/useMasterCrud'
import { useToast } from 'primevue/usetoast'

const props = defineProps<{
    config: MasterConfig
}>()

const router = useRouter()
const toast = useToast()

const {
    items,
    selectedItems,
    loading,
    pagination,
    searchKeyword,
    tableFilters,
    dynamicFilterOptions,
    allDistinctValues,
    sortField,
    sortOrder,
    deleteVisible,
    deleteItem,
    deleteLoading,
    fetchData,
    fetchFilterOptions,
    fetchAllDistinctValues,
    handleDelete,
    formatCurrency,
    formatDate
} = useMasterCrud(props.config)

// UI State
const filterOverlays = ref<Record<string, any>>({})
const tempFilters = ref<Record<string, any[]>>({})
const filterSearchTerms = ref<Record<string, string>>({})
const activeColumnFilters = ref<Record<string, any[]>>({})
const filterOptionsLoading = ref<Record<string, boolean>>({})
const filterOptionsCache = ref<Record<string, any[]>>({})

// Text Filter State
const showTextFilterDrawer = ref(false)
const tempTextFilters = ref<Record<string, string>>({})
const activeTextFilters = ref<Record<string, string>>({})

// Row Expansion State
const expandedRows = ref<Record<string, boolean>>({})
const detailData = ref<Record<string, any[]>>({})
const detailLoading = ref<Record<string, boolean>>({})

// Computed
const visibleColumns = computed(() => {
    return props.config.columns.filter(col => !col.hidden)
})

const activeMultiSelectFiltersCount = computed(() => {
    return Object.keys(activeColumnFilters.value).filter(key => 
        activeColumnFilters.value[key] && activeColumnFilters.value[key].length > 0
    ).length
})

const activeTextFiltersCount = computed(() => {
    return Object.keys(activeTextFilters.value).filter(key => 
        activeTextFilters.value[key] && activeTextFilters.value[key].trim() !== ''
    ).length
})

// ========== NAVIGATION METHODS ==========

const openAddForm = () => {
    const formRoute = props.config.formRoute
    if (formRoute) {
        router.push(formRoute)
    } else {
        console.warn('⚠️ No formRoute defined in config for:', props.config.title)
    }
}

const openEditForm = (item: any) => {
    const formRoute = props.config.formRoute
    const id = item[props.config.primaryKey]
    if (formRoute) {
        router.push(`${formRoute}?id=${id}`)
    } else {
        console.warn('⚠️ No formRoute defined in config for:', props.config.title)
    }
}

// ========== FILTER OPTIONS ==========

const getFilterOptionsFromAPI = async (field: string) => {
    const col = props.config.columns.find(c => c.field === field)
    
    // Boolean
    if (col?.type === 'boolean') {
        return [
            { value: 1, label: col.booleanLabels?.true || 'Ya', count: 0 },
            { value: 0, label: col.booleanLabels?.false || 'Tidak', count: 0 }
        ]
    }
    
    // Config filterOptions
    if (col?.filterOptions) {
        return col.filterOptions.map((opt: any) => ({
            value: opt.value,
            label: opt.label,
            count: opt.count || 0
        }))
    }
    
    // Dari API (dynamicFilterOptions) - untuk kolom dengan filterOptionsFrom
    if (col?.filterOptionsFrom) {
        const options = dynamicFilterOptions.value[col.filterOptionsFrom] || []
        return options.map((opt: any) => ({
            value: opt.value,
            label: opt.label,
            count: opt.count || 0
        }))
    }
    
    // Dari allDistinctValues (cache)
    if (allDistinctValues.value[field]) {
        return allDistinctValues.value[field]
    }
    
    // Fallback: distinct dari items (halaman aktif)
    return getDistinctValuesFromItems(field)
}

const getDistinctValuesFromItems = (field: string) => {
    const values = new Map<any, number>()
    const col = props.config.columns.find(c => c.field === field)
    
    items.value.forEach(item => {
        let value = item[field]
        if (value !== null && value !== undefined && value !== '') {
            const key = String(value)
            values.set(key, (values.get(key) || 0) + 1)
        }
    })
    
    return Array.from(values.entries())
        .map(([value, count]) => {
            let label = value
            if (col?.type === 'currency') {
                label = formatCurrency(parseFloat(value))
            }
            return { value, label, count }
        })
        .sort((a, b) => String(a.label).localeCompare(String(b.label)))
}

// ========== FILTER PANEL ==========

const setFilterOverlayRef = (field: string, el: any) => {
    if (el) filterOverlays.value[field] = el
}

const toggleColumnFilter = async (col: any, event: Event) => {
    const overlay = filterOverlays.value[col.field]
    if (overlay) {
        // Initialize temp filters
        if (!tempFilters.value[col.field]) {
            tempFilters.value[col.field] = [...(activeColumnFilters.value[col.field] || [])]
        }
        
        // Load filter options jika belum ada
        if (!filterOptionsCache.value[col.field]) {
            filterOptionsLoading.value[col.field] = true
            filterOptionsCache.value[col.field] = await getFilterOptionsFromAPI(col.field)
            filterOptionsLoading.value[col.field] = false
        }
        
        overlay.toggle(event)
    }
}

const closeFilterPanel = (field: string) => {
    const overlay = filterOverlays.value[field]
    if (overlay) overlay.hide()
}

const onFilterPanelHide = (field: string) => {
    tempFilters.value[field] = [...(activeColumnFilters.value[field] || [])]
    filterSearchTerms.value[field] = ''
}

const getFilteredOptions = (field: string) => {
    const options = filterOptionsCache.value[field] || []
    const searchTerm = filterSearchTerms.value[field]?.toLowerCase() || ''
    
    if (!searchTerm) return options
    return options.filter(opt => String(opt.label).toLowerCase().includes(searchTerm))
}

const selectAllFilterOptions = (field: string) => {
    const options = filterOptionsCache.value[field] || []
    tempFilters.value[field] = options.map(opt => opt.value)
}

const clearFilterOptions = (field: string) => {
    tempFilters.value[field] = []
}

const hasColumnFilter = (field: string) => {
    return activeColumnFilters.value[field] && activeColumnFilters.value[field].length > 0
}

const applyColumnFilter = (field: string) => {
    activeColumnFilters.value[field] = [...(tempFilters.value[field] || [])]
    
    if (activeColumnFilters.value[field].length > 0) {
        tableFilters.value[field] = activeColumnFilters.value[field]
    } else {
        delete tableFilters.value[field]
    }
    
    closeFilterPanel(field)
    pagination.page = 1
    fetchData()
}

const clearAllColumnFilters = () => {
    activeColumnFilters.value = {}
    Object.keys(tableFilters.value).forEach(key => {
        if (Array.isArray(tableFilters.value[key])) {
            delete tableFilters.value[key]
        }
    })
    tempFilters.value = {}
    pagination.page = 1
    fetchData()
}

// ========== TEXT FILTERS ==========

const resetTempTextFilters = () => {
    visibleColumns.value.forEach(col => {
        tempTextFilters.value[col.field] = ''
    })
}

const clearAllTextFilters = () => {
    activeTextFilters.value = {}
    Object.keys(tableFilters.value).forEach(key => {
        if (typeof tableFilters.value[key] === 'string') {
            delete tableFilters.value[key]
        }
    })
    tempTextFilters.value = {}
    pagination.page = 1
    fetchData()
}

const applyTextFilters = () => {
    activeTextFilters.value = {}
    visibleColumns.value.forEach(col => {
        const value = tempTextFilters.value[col.field]?.trim()
        if (value) {
            activeTextFilters.value[col.field] = value
        }
    })
    
    Object.keys(activeTextFilters.value).forEach(field => {
        tableFilters.value[field] = activeTextFilters.value[field]
    })
    
    showTextFilterDrawer.value = false
    pagination.page = 1
    fetchData()
}

const resetAllFiltersAndSearch = () => {
    searchKeyword.value = ''
    clearAllColumnFilters()
    clearAllTextFilters()
}

// ========== ROW EXPANSION ==========

const onRowExpand = async (event: any) => {
    if (!props.config.expansion?.enabled) return
    
    const rowData = event.data
    const id = rowData[props.config.primaryKey]
    
    if (!detailData.value[id]) {
        await fetchDetailData(id)
    }
}

const onRowCollapse = (event: any) => {
    // Optional
}

const fetchDetailData = async (id: string) => {
    if (!props.config.expansion?.endpoint) return
    
    detailLoading.value[id] = true
    
    try {
        const { $api } = useNuxtApp()
        const endpoint = props.config.expansion.endpoint.replace('{id}', id)
        const response = await $api.get(endpoint)
        
        if (response.data.success) {
            detailData.value[id] = response.data.data
        } else {
            detailData.value[id] = []
        }
    } catch (error) {
        console.error(`❌ Failed to fetch detail for ${id}:`, error)
        detailData.value[id] = []
    } finally {
        detailLoading.value[id] = false
    }
}

// ========== SEARCH & SORT ==========

let searchTimeout: NodeJS.Timeout
const onSearchInput = () => {
    if (searchTimeout) clearTimeout(searchTimeout)
    searchTimeout = setTimeout(() => {
        pagination.page = 1
        fetchData()
    }, 300)
}

const onSort = (event: any) => {
    sortField.value = event.sortField
    sortOrder.value = event.sortOrder
    fetchData()
}

// ========== PAGINATION ==========

const onPageChange = (event: any) => {
    pagination.page = event.page + 1
    fetchData()
}

const onPerPageChange = () => {
    pagination.page = 1
    fetchData()
}

// ========== DELETE ==========

const confirmDelete = (item: any) => {
    deleteItem.value = item
    deleteVisible.value = true
}

const confirmBulkDelete = () => {
    toast.add({ severity: 'warn', summary: 'Info', detail: 'Fitur hapus massal segera hadir', life: 2000 })
}

// ========== LIFECYCLE ==========

onMounted(async () => {
    // Initialize text filters
    resetTempTextFilters()
    
    // Fetch filter options
    if (props.config.filterOptionsEndpoint) {
        await fetchFilterOptions()
    }
    await fetchAllDistinctValues()
    
    console.log('✅ MasterBrowse ready for:', props.config.title)
})
</script>

<style lang="scss" scoped>
.master-browse {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    
    @media (max-width: 640px) {
        gap: 0.5rem;
    }
}

// Header
.browse-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem 1.25rem;
    background: var(--surface-card);
    border-radius: 0.75rem;
    border: 1px solid var(--surface-border);
    gap: 1rem;
    flex-wrap: wrap;

    .header-left {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        flex: 1;
        min-width: 0;
    }

    .header-icon {
        width: 2.5rem;
        height: 2.5rem;
        background: var(--primary-50);
        border-radius: 0.625rem;
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--primary-600);
        font-size: 1.15rem;
        flex-shrink: 0;
    }

    .header-text {
        min-width: 0;
    }

    .header-title {
        font-size: 1.15rem;
        font-weight: 700;
        color: var(--text-color);
        margin: 0 0 0.15rem 0;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .header-subtitle {
        font-size: 0.75rem;
        color: var(--text-color-secondary);
        margin: 0;
        display: block;
    }

    .header-actions {
        flex-shrink: 0;
    }

    @media (max-width: 640px) {
        padding: 0.875rem 1rem;
        flex-direction: column;
        align-items: stretch;
        
        .header-left {
            gap: 0.625rem;
        }
        
        .header-icon {
            width: 2.25rem;
            height: 2.25rem;
            border-radius: 0.5rem;
            
            i {
                font-size: 1rem;
            }
        }
        
        .header-title {
            font-size: 1rem;
        }
        
        .header-subtitle {
            font-size: 0.7rem;
        }
        
        .header-actions {
            width: 100%;
            
            button {
                width: 100%;
                justify-content: center;
            }
        }
    }
}

// Card
.browse-card {
    background: var(--surface-card);
    border-radius: 0.75rem;
    border: 1px solid var(--surface-border);
    overflow: hidden;
    
    @media (max-width: 640px) {
        border-radius: 0.5rem;
    }
}

// Toolbar
.browse-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.625rem 0.875rem;
    border-bottom: 1px solid var(--surface-border);
    background: var(--surface-50);
    gap: 0.5rem;
    flex-wrap: wrap;

    .toolbar-left {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        flex-wrap: wrap;
        flex: 1;
        min-width: 0;
    }

    .search-input {
        width: 240px;
        background: var(--surface-0);
    }

    .bulk-info {
        display: flex;
        align-items: center;
        gap: 0.375rem;
        padding: 0.2rem 0.625rem;
        background: var(--primary-50);
        border-radius: 1rem;
        font-size: 0.7rem;
        color: var(--primary-700);
        white-space: nowrap;
    }

    .active-filters {
        display: flex;
        align-items: center;
        gap: 0.3rem;
        padding: 0.2rem 0.5rem 0.2rem 0.625rem;
        background: var(--surface-200);
        border-radius: 1rem;
        font-size: 0.7rem;
        color: var(--text-color-secondary);
        white-space: nowrap;

        i { 
            font-size: 0.7rem; 
            color: var(--primary-600); 
        }
        
        &.text-filters-active {
            background: var(--blue-100);
            i { color: var(--blue-600); }
        }
    }

    .toolbar-right {
        display: flex;
        align-items: center;
        gap: 0.15rem;
        flex-shrink: 0;
    }

    @media (max-width: 640px) {
        padding: 0.5rem 0.625rem;
        flex-direction: column;
        align-items: stretch;
        
        .search-input {
            width: 100%;
        }
        
        .toolbar-left {
            flex-direction: column;
            align-items: stretch;
        }
        
        .toolbar-right {
            justify-content: flex-end;
        }
        
        .active-filters,
        .bulk-info {
            align-self: flex-start;
        }
    }
}

// Table
.browse-table {
    :deep(.p-datatable-thead > tr > th) {
        background: var(--surface-50);
        font-size: 0.7rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.025em;
        color: var(--text-color-secondary);
        padding: 0.5rem 0.625rem !important;
        border-bottom: 1px solid var(--surface-border);
        white-space: nowrap;
    }

    :deep(.p-datatable-tbody > tr > td) {
        padding: 0.4rem 0.625rem;
        font-size: 0.78rem;
    }

    :deep(.p-datatable-tbody > tr:hover) {
        background: var(--surface-50);
    }
    
    // Mobile: responsive table
    @media (max-width: 768px) {
        :deep(.p-datatable-wrapper) {
            overflow-x: auto;
        }
        
        :deep(.p-datatable-thead > tr > th),
        :deep(.p-datatable-tbody > tr > td) {
            padding: 0.35rem 0.5rem !important;
            font-size: 0.72rem;
        }
    }
}

.column-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.25rem;
    width: 100%;

    .column-title {
        flex: 1;
        font-size: 0.7rem;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .filter-active {
        background: var(--primary-100) !important;
        color: var(--primary-700) !important;
    }
    
    :deep(.p-button) {
        width: 1.5rem !important;
        height: 1.5rem !important;
        flex-shrink: 0;
        
        .pi {
            font-size: 0.7rem !important;
        }
    }
}

.currency-text {
    font-weight: 600;
    color: var(--primary-600);
    white-space: nowrap;
}

.number-text {
    font-weight: 500;
    white-space: nowrap;
}

.action-buttons {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.1rem;
    
    :deep(.p-button) {
        width: 1.75rem !important;
        height: 1.75rem !important;
    }
}

// Empty & Loading
.empty-state,
.loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 2.5rem 1rem;
    color: var(--text-color-secondary);
    text-align: center;

    i {
        font-size: 2rem;
        margin-bottom: 0.5rem;
    }

    p {
        margin: 0 0 0.75rem 0;
        font-size: 0.8rem;
    }
}

// Filter Panel - lebih kecil di mobile
.filter-panel {
    width: 280px;
    max-height: 400px;
    display: flex;
    flex-direction: column;

    @media (max-width: 480px) {
        width: 260px;
        max-height: 350px;
    }
    
    .filter-panel-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0.6rem 0.875rem;
        border-bottom: 1px solid var(--surface-border);
        font-weight: 600;
        font-size: 0.8rem;
    }

    .filter-panel-search {
        padding: 0.6rem 0.875rem;
        border-bottom: 1px solid var(--surface-border);
    }

    .filter-panel-actions {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0.4rem 0.875rem;
        border-bottom: 1px solid var(--surface-border);
    }

    .filter-panel-list {
        flex: 1;
        overflow-y: auto;
        max-height: 200px;
        padding: 0.375rem 0;

        .filter-option {
            display: flex;
            align-items: center;
            gap: 0.4rem;
            padding: 0.4rem 0.875rem;
            cursor: pointer;
            transition: background 0.15s;

            &:hover { 
                background: var(--surface-50); 
            }

            .filter-label {
                flex: 1;
                display: flex;
                align-items: center;
                justify-content: space-between;
                font-size: 0.75rem;
                cursor: pointer;
                margin: 0;

                .option-count {
                    color: var(--text-color-secondary);
                    font-size: 0.7rem;
                }
            }
        }

        .filter-empty,
        .filter-loading {
            padding: 1.5rem 1rem;
            text-align: center;
            color: var(--text-color-secondary);
            font-size: 0.75rem;
        }
    }

    .filter-panel-footer {
        padding: 0.6rem 0.875rem;
        border-top: 1px solid var(--surface-border);
    }
}

// Paginator - responsive
.browse-paginator {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.5rem 0.875rem;
    border-top: 1px solid var(--surface-border);
    background: var(--surface-50);
    gap: 0.75rem;

    .paginator-left {
        display: flex;
        align-items: center;
        gap: 0.375rem;
    }

    .perpage-select {
        width: 65px;
    }

    .paginator-info {
        font-size: 0.7rem;
        color: var(--text-color-secondary);
        white-space: nowrap;
    }

    .custom-paginator {
        :deep(.p-paginator) {
            background: transparent;
            border: none;
            padding: 0;
            gap: 0;
        }

        :deep(.p-paginator-page),
        :deep(.p-paginator-first),
        :deep(.p-paginator-prev),
        :deep(.p-paginator-next),
        :deep(.p-paginator-last) {
            min-width: 1.75rem;
            height: 1.75rem;
            font-size: 0.7rem;
        }
        
        :deep(.p-paginator-pages) {
            gap: 0;
        }
    }

    .total-info {
        font-size: 0.7rem;
        color: var(--text-color-secondary);
        white-space: nowrap;
    }

    @media (max-width: 768px) {
        flex-direction: column;
        gap: 0.5rem;
        align-items: stretch;

        .paginator-left,
        .paginator-right {
            justify-content: center;
        }
        
        .paginator-center {
            order: -1;
            display: flex;
            justify-content: center;
        }
    }
}

// Delete Dialog
.delete-dialog {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 0.5rem 0;

    i {
        font-size: 2rem;
        color: var(--yellow-500);
        margin-bottom: 0.75rem;
    }

    p {
        margin: 0;
        color: var(--text-color-secondary);
        font-size: 0.8rem;
    }
}

// Text Filter Drawer
.text-filter-drawer {
    :deep(.p-drawer-content) {
        padding: 0;
    }
}

.text-filter-content {
    padding: 1.25rem;
    
    .text-filter-desc {
        font-size: 0.75rem;
        color: var(--text-color-secondary);
        margin-bottom: 1.25rem;
        padding-bottom: 1rem;
        border-bottom: 1px solid var(--surface-border);
    }
}

.text-filter-grid {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    
    .text-filter-item {
        display: flex;
        flex-direction: column;
        gap: 0.375rem;
        
        label {
            display: flex;
            align-items: center;
            gap: 0.4rem;
            font-size: 0.75rem;
            font-weight: 600;
            color: var(--text-color);
            
            .text-filter-icon {
                font-size: 0.8rem;
                color: var(--primary-500);
            }
        }
    }
}

.text-filter-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.875rem 1.25rem;
    border-top: 1px solid var(--surface-border);
}

// Row Expansion
.expansion-content {
    padding: 0.875rem 1rem;
    background: var(--surface-50);
    border-top: 1px solid var(--surface-border);
    border-bottom: 1px solid var(--surface-border);
    
    .expansion-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 0.75rem;
        padding-bottom: 0.5rem;
        border-bottom: 1px dashed var(--surface-border);
        gap: 0.5rem;
        
        .expansion-header-left {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            min-width: 0;
            
            i {
                font-size: 1rem;
                color: var(--primary-500);
                flex-shrink: 0;
            }
            
            .expansion-title {
                font-size: 0.8rem;
                font-weight: 600;
                color: var(--text-color);
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
        }
    }
    
    .detail-loading {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        padding: 1.5rem;
        color: var(--text-color-secondary);
        font-size: 0.8rem;
    }
    
    .expansion-table {
        background: var(--surface-card);
        border-radius: 0.375rem;
        overflow: hidden;
        border: 1px solid var(--surface-border);
    }
    
    .detail-empty {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.4rem;
        padding: 1.5rem;
        color: var(--text-color-secondary);
        font-size: 0.75rem;
    }
    
    @media (max-width: 640px) {
        padding: 0.625rem 0.75rem;
    }
}

// Dark mode
:global(.app-dark) {
    .browse-toolbar {
        background: var(--surface-800);
    }

    .browse-table :deep(.p-datatable-thead > tr > th) {
        background: var(--surface-800);
    }

    .browse-paginator {
        background: var(--surface-800);
    }

    .bulk-info {
        background: var(--primary-900) !important;
        color: var(--primary-300) !important;
    }

    .active-filters {
        background: var(--surface-700) !important;
        
        &.text-filters-active {
            background: var(--blue-900) !important;
        }
    }

    .filter-panel .filter-option:hover {
        background: var(--surface-800);
    }
    
    .expansion-content {
        background: var(--surface-800);
    }
}
</style>