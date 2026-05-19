<template>
    <div class="report-page">
        <!-- Header -->
        <div class="report-header">
            <div class="header-left">
                <div class="header-icon">
                    <i class="pi pi-box"></i>
                </div>
                <div class="header-text">
                    <h1>Laporan Persediaan Barang</h1>
                    <!-- <p>Stok barang per gudang dengan nilai inventori</p> -->
                </div>
            </div>
            <div class="header-actions">
                <Button label="Export Excel" icon="pi pi-file-excel" severity="success" size="small" @click="exportExcel" />
                <Button label="Export PDF" icon="pi pi-file-pdf" severity="danger" size="small" @click="exportPDF" />
                <Button label="Export CSV" icon="pi pi-file" severity="info" size="small" @click="exportCSV" />
            </div>
        </div>

        <!-- Filter & Toolbar (Seperti MasterBrowse) -->
        <div class="report-card">
            <!-- Toolbar -->
            <div class="browse-toolbar">
                <div class="toolbar-left">
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

                    <div v-if="activeFiltersCount > 0" class="active-filters">
                        <i class="pi pi-filter-fill"></i>
                        <span>{{ activeFiltersCount }} filter aktif</span>
                        <Button 
                            icon="pi pi-times" 
                            text 
                            rounded 
                            size="small"
                            severity="secondary"
                            @click="clearAllFilters" 
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
                        @click="loadData" 
                    />
                    <Button 
                        icon="pi pi-filter" 
                        severity="secondary" 
                        text 
                        size="small"
                        :class="{ 'filter-active': activeFiltersCount > 0 }"
                        @click="showTextFilter = !showTextFilter" 
                    />
                </div>
            </div>

            <!-- Text Filter Panel (Seperti MasterBrowse) -->
            <div v-if="showTextFilter" class="text-filter-panel">
                <div class="text-filter-grid">
                    <div v-for="col in filterableColumns" :key="col.field" class="text-filter-item">
                        <label>{{ col.header }}</label>
                        <InputText 
                            v-model="textFilters[col.field]"
                            :placeholder="'Filter ' + col.header + '...'"
                            size="small"
                            class="w-full"
                            @keydown.enter="applyTextFilters"
                        />
                    </div>
                </div>
                <div class="text-filter-footer">
                    <Button label="Reset" text size="small" @click="resetTextFilters" />
                    <Button label="Terapkan" severity="primary" size="small" @click="applyTextFilters" />
                </div>
            </div>

            <!-- DataTable -->
            <DataTable 
                :value="filteredData"
                :loading="loading"
                class="report-table"
                stripedRows
                size="small"
                showGridlines
                paginator
                :rows="25"
                :rowsPerPageOptions="[10, 25, 50, 100]"
                v-model:filters="primeFilters"
                filterDisplay="menu"
            >
                <template #empty>
                    <div class="empty-state">
                        <i class="pi pi-inbox"></i>
                        <p>Klik "Load Data" untuk menampilkan laporan</p>
                    </div>
                </template>

                <!-- Multi-Select Filter Columns -->
                <Column 
    v-for="col in filterColumns" 
    :key="col.field"
    :field="col.field"
    :sortable="col.sortable !== false"
    :style="{ width: col.width || 'auto', minWidth: col.minWidth || '120px', textAlign: col.align || 'left' }"
>
    <template #header>
        <div class="column-header">
            <span class="column-title">{{ col.header }}</span>
            <Button 
                icon="pi pi-filter" 
                text 
                rounded 
                size="small"
                :class="{ 'filter-active': hasColumnFilter(col.field) }"
                @click.stop="toggleColumnFilter(col, $event)"
            />
            <OverlayPanel 
                :ref="(el) => setFilterOverlayRef(col.field, el)"
                @hide="onFilterPanelHide(col.field)"
            >
                <div class="filter-panel">
                    <div class="filter-panel-header">
                        <span>Filter {{ col.header }}</span>
                        <Button icon="pi pi-times" text rounded size="small" @click="closeFilterPanel(col.field)" />
                    </div>
                    <div class="filter-panel-search">
                        <IconField iconPosition="left">
                            <InputIcon class="pi pi-search" />
                            <InputText v-model="filterSearchTerms[col.field]" placeholder="Cari nilai..." size="small" class="w-full" />
                        </IconField>
                    </div>
                    <div class="filter-panel-actions">
                        <Button label="Pilih Semua" text size="small" @click="selectAll(col.field)" />
                        <Button label="Bersihkan" text size="small" @click="clearFilter(col.field)" />
                    </div>
                    <div class="filter-panel-list">
                        <div v-for="opt in getFilteredOptions(col.field)" :key="opt.value" class="filter-option">
                            <Checkbox v-model="tempColumnFilters[col.field]" :value="opt.value" :inputId="`f-${col.field}-${opt.value}`" />
                            <label :for="`f-${col.field}-${opt.value}`" class="filter-label">
                                <span>{{ opt.label }}</span>
                                <span class="option-count">({{ opt.count }})</span>
                            </label>
                        </div>
                        <div v-if="getFilteredOptions(col.field).length === 0" class="filter-empty">Tidak ada nilai</div>
                    </div>
                    <div class="filter-panel-footer">
                        <Button label="Terapkan" severity="primary" size="small" class="w-full" @click="applyColumnFilter(col.field)" />
                    </div>
                </div>
            </OverlayPanel>
        </div>
    </template>
    
    <template v-if="col.type === 'currency'" #body="{ data }">
        <span class="currency-text">{{ formatCurrency(data[col.field]) }}</span>
    </template>
    <template v-else-if="col.type === 'number'" #body="{ data }">
        <span class="number-text">{{ formatNumber(data[col.field]) }}</span>
    </template>
</Column>
            </DataTable>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useToast } from 'primevue/usetoast'
import OverlayPanel from 'primevue/overlaypanel'
import Checkbox from 'primevue/checkbox'
import { FilterMatchMode } from '@primevue/core/api'

definePageMeta({ layout: 'default' })

const { $api } = useNuxtApp()
const toast = useToast()

// Data
const loading = ref(false)
const data = ref<any[]>([])
const searchKeyword = ref('')
const showTextFilter = ref(false)
const textFilters = ref<Record<string, string>>({})
const activeTextFilters = ref<Record<string, string>>({})

// Column filter state
const filterOverlays = ref<Record<string, any>>({})
const tempColumnFilters = ref<Record<string, any[]>>({})
const activeColumnFilters = ref<Record<string, any[]>>({})
const filterSearchTerms = ref<Record<string, string>>({})
const filterOptionsCache = ref<Record<string, any[]>>({})
const primeFilters = ref<Record<string, any>>({})

// Columns config
const filterColumns = [
    { field: 'Kode', header: 'Kode', width: '30px' },           
    { field: 'Nama', header: 'Nama Barang', width: '300px' },  
    { field: 'Kategori', header: 'Kategori', width: '100px' },  
    { field: 'Gudang', header: 'Gudang', width: '100px' },     
    { field: 'Stok', header: 'Stok', width: '70px', align: 'right', type: 'number' },      
    { field: 'HrgBeli', header: 'Hrg Beli', width: '110px', align: 'right', type: 'currency' },
    { field: 'Nilai', header: 'Nilai', width: '120px', align: 'right', type: 'currency' },   
    { field: 'Produsen', header: 'Produsen', width: '120px' },  
    { field: 'Min_Stok', header: 'Min Stok', width: '70px', align: 'center', type: 'number' }, 
]

const filterableColumns = [
    { field: 'Kode', header: 'Kode' },
    { field: 'Nama', header: 'Nama Barang' },
    { field: 'Kategori', header: 'Kategori' },
    { field: 'Gudang', header: 'Gudang' },
    { field: 'Produsen', header: 'Produsen' },
]

const activeFiltersCount = computed(() => {
    return Object.keys(activeColumnFilters.value).filter(k => activeColumnFilters.value[k]?.length > 0).length +
           Object.keys(activeTextFilters.value).filter(k => activeTextFilters.value[k]?.trim()).length
})

// Filtered data
const filteredData = computed(() => {
    let result = [...data.value]
    
    // Global search
    if (searchKeyword.value) {
        const kw = searchKeyword.value.toLowerCase()
        result = result.filter(row => 
            Object.values(row).some(val => String(val).toLowerCase().includes(kw))
        )
    }
    
    // Column filters
    Object.keys(activeColumnFilters.value).forEach(field => {
        const values = activeColumnFilters.value[field]
        if (values?.length > 0) {
            result = result.filter(row => values.includes(String(row[field])))
        }
    })
    
    // Text filters
    Object.keys(activeTextFilters.value).forEach(field => {
        const val = activeTextFilters.value[field]?.toLowerCase()
        if (val) {
            result = result.filter(row => String(row[field] || '').toLowerCase().includes(val))
        }
    })
    
    return result
})

// Methods
const formatCurrency = (val: any) => {
    if (!val && val !== 0) return '-'
    return 'Rp ' + Math.round(parseFloat(val)).toLocaleString('id-ID')
}

const formatNumber = (val: any) => {
    if (!val && val !== 0) return '-'
    return Math.round(parseFloat(val)).toLocaleString('id-ID')
}

const loadData = async () => {
    loading.value = true
    try {
        const response = await $api.get('/v1/report/persediaan')
        if (response.data.success) {
            data.value = response.data.data
            // Build filter options cache
            buildFilterOptions()
            toast.add({ severity: 'success', summary: 'Berhasil', detail: `${data.value.length} data ditemukan`, life: 2000 })
        }
    } catch (error: any) {
        toast.add({ severity: 'error', summary: 'Gagal', detail: error.response?.data?.message || 'Gagal', life: 3000 })
    } finally { loading.value = false }
}

// Search
let searchTimeout: any
const onSearchInput = () => {
    clearTimeout(searchTimeout)
    searchTimeout = setTimeout(() => {}, 300)
}

// Text filters
const resetTextFilters = () => {
    filterableColumns.forEach(c => textFilters.value[c.field] = '')
    activeTextFilters.value = {}
}

const applyTextFilters = () => {
    activeTextFilters.value = {}
    filterableColumns.forEach(c => {
        if (textFilters.value[c.field]?.trim()) {
            activeTextFilters.value[c.field] = textFilters.value[c.field].trim()
        }
    })
}

const clearAllFilters = () => {
    searchKeyword.value = ''
    activeColumnFilters.value = {}
    activeTextFilters.value = {}
    textFilters.value = {}
    tempColumnFilters.value = {}
}

// Column filters
const buildFilterOptions = () => {
    filterableColumns.forEach(col => {
        const values = new Map<string, number>()
        data.value.forEach(row => {
            const v = String(row[col.field] || '')
            if (v) values.set(v, (values.get(v) || 0) + 1)
        })
        filterOptionsCache.value[col.field] = Array.from(values.entries())
            .map(([value, count]) => ({ value, label: value, count }))
            .sort((a, b) => a.label.localeCompare(b.label))
    })
}

const setFilterOverlayRef = (field: string, el: any) => { if (el) filterOverlays.value[field] = el }
const toggleColumnFilter = (col: any, event: Event) => {
    const overlay = filterOverlays.value[col.field]
    if (overlay) {
        if (!tempColumnFilters.value[col.field]) tempColumnFilters.value[col.field] = [...(activeColumnFilters.value[col.field] || [])]
        overlay.toggle(event)
    }
}
const closeFilterPanel = (field: string) => filterOverlays.value[field]?.hide()
const onFilterPanelHide = (field: string) => { tempColumnFilters.value[field] = [...(activeColumnFilters.value[field] || [])] }
const getFilteredOptions = (field: string) => {
    const options = filterOptionsCache.value[field] || []
    const term = filterSearchTerms.value[field]?.toLowerCase() || ''
    return term ? options.filter(o => o.label.toLowerCase().includes(term)) : options
}
const selectAll = (field: string) => { tempColumnFilters.value[field] = (filterOptionsCache.value[field] || []).map(o => o.value) }
const clearFilter = (field: string) => { tempColumnFilters.value[field] = [] }
const hasColumnFilter = (field: string) => activeColumnFilters.value[field]?.length > 0
const applyColumnFilter = (field: string) => {
    activeColumnFilters.value[field] = [...(tempColumnFilters.value[field] || [])]
    closeFilterPanel(field)
}

// EXPORT FUNCTIONS
const exportCSV = () => {
    if (!filteredData.value.length) {
        toast.add({ severity: 'warn', summary: 'Peringatan', detail: 'Tidak ada data', life: 2000 }); return
    }
    const cols = filterColumns.map(c => c.field)
    let csv = '\uFEFF' + filterColumns.map(c => c.header).join(',') + '\n'
    filteredData.value.forEach(row => {
        csv += cols.map(c => {
            let val = row[c] || ''
            if (typeof val === 'string' && val.includes(',')) val = `"${val}"`
            return val
        }).join(',') + '\n'
    })
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `Laporan_Persediaan_${new Date().toISOString().split('T')[0]}.csv`; a.click()
    URL.revokeObjectURL(url)
    toast.add({ severity: 'success', summary: 'Export CSV', detail: 'Berhasil', life: 2000 })
}

const exportExcel = async () => {
    if (!filteredData.value.length) {
        toast.add({ severity: 'warn', summary: 'Peringatan', detail: 'Tidak ada data', life: 2000 }); return
    }
    
    const ExcelJS = await import('exceljs')
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Laporan Persediaan')
    
    // 🔥 HEADER STYLE
    const headerStyle = {
        font: { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF10B981' } },
        alignment: { horizontal: 'center', vertical: 'middle', wrapText: true },
        border: {
            top: { style: 'thin', color: { argb: 'FF000000' } },
            bottom: { style: 'thin', color: { argb: 'FF000000' } },
            left: { style: 'thin', color: { argb: 'FF000000' } },
            right: { style: 'thin', color: { argb: 'FF000000' } }
        }
    }
    
    // 🔥 DATA STYLE (BIASA)
    const dataStyle = {
        font: { size: 10 },
        border: {
            top: { style: 'thin', color: { argb: 'FFD1D5DB' } },
            bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
            left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
            right: { style: 'thin', color: { argb: 'FFD1D5DB' } }
        }
    }
    
    // 🔥 NUMBER STYLE (RIGHT ALIGN)
    const numberStyle = {
        ...dataStyle,
        alignment: { horizontal: 'right', vertical: 'middle' },
        numFmt: '#,##0'
    }
    
    // 🔥 CURRENCY STYLE (RIGHT ALIGN)
    const currencyStyle = {
        ...dataStyle,
        alignment: { horizontal: 'right', vertical: 'middle' },
        numFmt: '#,##0'
    }
    
    // 🔥 ALTERNATING ROW COLOR
    const evenRowStyle = {
        ...dataStyle,
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9FAFB' } }
    }
    
    // SET COLUMNS
    worksheet.columns = filterColumns.map(col => ({
        header: col.header,
        key: col.field,
        width: col.field === 'Nama' ? 35 : 
               col.field === 'Produsen' ? 20 :
               col.field === 'Kategori' || col.field === 'Gudang' ? 18 :
               col.field === 'Nilai' || col.field === 'HrgBeli' ? 18 : 14
    }))
    
    // 🔥 APPLY HEADER STYLE
    const headerRow = worksheet.getRow(1)
    headerRow.height = 25
    headerRow.eachCell((cell) => {
        cell.style = headerStyle as any
    })
    
    // 🔥 ADD DATA & APPLY STYLE
    filteredData.value.forEach((row, index) => {
        const dataRow = worksheet.addRow(row)
        const rowNum = index + 2 // +2 karena row 1 adalah header
        
        dataRow.eachCell((cell, colNumber) => {
            const col = filterColumns[colNumber - 1]
            const isEven = index % 2 === 1
            
            // Pilih style berdasarkan tipe kolom
            if (col?.type === 'currency' || col?.type === 'number') {
                cell.style = (col.type === 'currency' ? currencyStyle : numberStyle) as any
                cell.value = parseFloat(cell.value as string) || 0
            } else {
                cell.style = (isEven ? evenRowStyle : dataStyle) as any
            }
        })
    })
    
    // 🔥 AUTO FILTER (biar ada dropdown filter di Excel)
    worksheet.autoFilter = {
        from: { row: 1, column: 1 },
        to: { row: 1, column: filterColumns.length }
    }
    
    // 🔥 FREEZE PANE (bekukan header)
    worksheet.views = [{ state: 'frozen', ySplit: 1 }]
    
    // 🔥 DOWNLOAD
    const today = new Date().toISOString().split('T')[0]
    const buffer = await workbook.xlsx.writeBuffer()
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Laporan_Persediaan_${today}.xlsx`
    a.click()
    URL.revokeObjectURL(url)
    
    toast.add({ severity: 'success', summary: 'Export Excel', detail: 'File Excel rapi berhasil didownload', life: 2000 })
}

const exportPDF = () => {
    if (!filteredData.value.length) {
        toast.add({ severity: 'warn', summary: 'Peringatan', detail: 'Tidak ada data', life: 2000 }); return
    }
    // Buka di tab baru untuk print
    const cols = filterColumns.map(c => c.header)
    const rows = filteredData.value.map(row => filterColumns.map(c => row[c.field] || ''))
    
    let html = `
        <html><head><title>Laporan Persediaan</title>
        <style>
            body { font-family: Arial; padding: 20px; }
            h1 { font-size: 18px; text-align: center; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th { background: #f0f0f0; border: 1px solid #ccc; padding: 8px; font-size: 12px; text-align: left; }
            td { border: 1px solid #ccc; padding: 6px; font-size: 11px; }
            .text-right { text-align: right; }
        </style></head><body>
        <h1>Laporan Persediaan Barang</h1>
        <p>Tanggal: ${new Date().toLocaleDateString('id-ID')}</p>
        <table><thead><tr>${cols.map(c => `<th>${c}</th>`).join('')}</tr></thead><tbody>
        ${rows.map(row => `<tr>${row.map((cell, i) => {
            const col = filterColumns[i]
            const align = col.align === 'right' ? 'text-right' : ''
            return `<td class="${align}">${cell}</td>`
        }).join('')}</tr>`).join('')}
        </tbody></table></body></html>
    `
    const win = window.open('', '_blank', 'width=1000,height=700')
    if (win) {
        win.document.write(html)
        win.document.close()
        setTimeout(() => win.print(), 500)
    }
    toast.add({ severity: 'success', summary: 'Export PDF', detail: 'Gunakan Print > Save as PDF', life: 3000 })
}

// Init
onMounted(() => {
    resetTextFilters()
    loadData()
})
</script>

<style lang="scss" scoped>
.report-page { padding: 1rem; display: flex; flex-direction: column; gap: 1rem; }

.report-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 1.25rem 1.5rem; background: var(--surface-card);
    border-radius: 0.75rem; border: 1px solid var(--surface-border);
    .header-left { display: flex; align-items: center; gap: 1rem; }
    .header-icon {
        width: 2.75rem; height: 2.75rem; background: var(--primary-50);
        border-radius: 0.625rem; display: flex; align-items: center; justify-content: center;
        color: var(--primary-600); font-size: 1.25rem;
    }
    h1 { font-size: 1.25rem; font-weight: 700; color: var(--text-color); margin: 0; }
    p { font-size: 0.813rem; color: var(--text-color-secondary); margin: 0.25rem 0 0 0; }
    .header-actions { display: flex; gap: 0.5rem; }
}

.report-card {
    background: var(--surface-card); border-radius: 0.75rem;
    border: 1px solid var(--surface-border); overflow: hidden;
}

// Toolbar (seperti MasterBrowse)
.browse-toolbar {
    display: flex; align-items: center; justify-content: space-between;
    padding: 0.75rem 1rem; border-bottom: 1px solid var(--surface-border);
    background: var(--surface-50);
    .toolbar-left { display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; }
    .search-input { width: 280px; background: var(--surface-0); }
    .active-filters {
        display: flex; align-items: center; gap: 0.375rem;
        padding: 0.25rem 0.5rem 0.25rem 0.75rem; background: var(--surface-200);
        border-radius: 1rem; font-size: 0.75rem; color: var(--text-color-secondary);
        i { color: var(--primary-600); }
    }
    .toolbar-right { display: flex; align-items: center; gap: 0.25rem; }
    .filter-active { background: var(--primary-100) !important; color: var(--primary-700) !important; }
}

// Text filter panel
.text-filter-panel {
    padding: 1rem; border-bottom: 1px solid var(--surface-border); background: var(--surface-0);
    .text-filter-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1rem; }
    .text-filter-item { label { display: block; font-size: 0.75rem; font-weight: 600; color: var(--text-color-secondary); margin-bottom: 0.25rem; } }
    .text-filter-footer { display: flex; justify-content: space-between; }
}

// Table
.report-table {
    // 🔥 HEADER LEBIH KECIL
    :deep(.p-datatable-thead > tr > th) {
        background: var(--surface-50);
        font-size: 0.7rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.025em;
        color: var(--text-color-secondary);
        padding: 0.35rem 0.5rem !important;  // 🔥 SUPER KECIL
        border-bottom: 2px solid var(--surface-border);
        height: 2rem !important;              // 🔥 HEIGHT FIX
    }
    
    // 🔥 BODY CELL JUGA LEBIH KECIL
    :deep(.p-datatable-tbody > tr > td) {
        padding: 0.35rem 0.5rem;
        font-size: 0.8rem;
    }
    
    // Sort icon kecil
    :deep(.p-sortable-column-icon) {
        font-size: 0.65rem;
        margin-left: 0.25rem;
    }
}

// Column header custom
.column-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.25rem;

    .column-title {
        flex: 1;
        font-size: 0.7rem;  // 🔥 SAMA DENGAN HEADER
    }

    .filter-active {
        background: var(--primary-100) !important;
        color: var(--primary-700) !important;
    }
    
    // Filter icon lebih kecil
    :deep(.p-button) {
        width: 1.5rem !important;
        height: 1.5rem !important;
        
        .pi {
            font-size: 0.75rem !important;
        }
    }
}

// Currency & Number Text
.currency-text {
    font-weight: 600;
    color: var(--primary-600);
}

.number-text {
    font-weight: 500;
}


// Sembunyikan double header (jika masih ada)
:deep(.p-datatable-thead > tr > th > .p-column-header-content) {
    // Biarkan sort icon bawaan tetap ada
}

// Filter Panel
.filter-panel {
    width: 280px;
    max-height: 450px;
    display: flex;
    flex-direction: column;

    .filter-panel-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0.75rem 1rem;
        border-bottom: 1px solid var(--surface-border);
        font-weight: 600;
        font-size: 0.875rem;
    }

    .filter-panel-search {
        padding: 0.75rem 1rem;
        border-bottom: 1px solid var(--surface-border);
    }

    .filter-panel-actions {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0.5rem 1rem;
        border-bottom: 1px solid var(--surface-border);
    }

    .filter-panel-list {
        flex: 1;
        overflow-y: auto;
        max-height: 250px;
        padding: 0.5rem 0;

        .filter-option {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.5rem 1rem;
            cursor: pointer;
            transition: background 0.2s;

            &:hover {
                background: var(--surface-50);
            }

            .filter-label {
                flex: 1;
                display: flex;
                align-items: center;
                justify-content: space-between;
                font-size: 0.813rem;
                cursor: pointer;
                margin: 0;

                .option-count {
                    color: var(--text-color-secondary);
                    font-size: 0.75rem;
                }
            }
        }

        .filter-empty {
            padding: 2rem 1rem;
            text-align: center;
            color: var(--text-color-secondary);
            font-size: 0.813rem;
        }
    }

    .filter-panel-footer {
        padding: 0.75rem 1rem;
        border-top: 1px solid var(--surface-border);
    }
}

.empty-state { display: flex; flex-direction: column; align-items: center; padding: 3rem; color: var(--text-color-secondary); i { font-size: 2.5rem; margin-bottom: 0.75rem; } }

@media (max-width: 768px) {
    .report-header { flex-direction: column; align-items: flex-start; gap: 1rem; .header-actions { width: 100%; button { flex: 1; } } }
    .browse-toolbar { flex-direction: column; gap: 0.75rem; .search-input { width: 100%; } }
    .text-filter-panel .text-filter-grid { grid-template-columns: 1fr; }
}
</style>