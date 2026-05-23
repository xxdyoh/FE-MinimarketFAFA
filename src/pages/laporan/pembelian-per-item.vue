<template>
    <div class="report-page">
        <!-- Header -->
        <div class="report-header">
            <div class="header-left">
                <div class="header-icon">
                    <i class="pi pi-list"></i>
                </div>
                <div class="header-text">
                    <h1>Laporan Pembelian Per Item</h1>
                    <!-- <p>Detail pembelian per barang dengan pivot</p> -->
                </div>
            </div>
            <div class="header-actions">
                <Button label="Export Excel" icon="pi pi-file-excel" severity="success" size="small" @click="exportExcel" />
                <Button label="Export PDF" icon="pi pi-file-pdf" severity="danger" size="small" @click="exportPDF" />
                <Button label="Export CSV" icon="pi pi-file" severity="info" size="small" @click="exportCSV" />
            </div>
        </div>

        <!-- Export Dialog -->
        <Dialog v-model:visible="exportDialog" header="Export Laporan" :modal="true" :style="{ width: '420px' }">
            <div class="export-dialog-content">
                <p class="export-dialog-text">Pilih tampilan yang akan diexport:</p>
                <div class="export-options">
                    <div class="export-option" :class="{ 'active': exportTarget === 'grid' }" @click="exportTarget = 'grid'">
                        <div class="option-radio">
                            <div class="radio-circle" :class="{ 'checked': exportTarget === 'grid' }"></div>
                        </div>
                        <div class="option-icon">
                            <i class="pi pi-table"></i>
                        </div>
                        <div class="option-text">
                            <strong>Grid View</strong>
                            <small>Export data tabel (11 kolom)</small>
                        </div>
                    </div>
                    <div class="export-option" :class="{ 'active': exportTarget === 'pivot' }" @click="exportTarget = 'pivot'">
                        <div class="option-radio">
                            <div class="radio-circle" :class="{ 'checked': exportTarget === 'pivot' }"></div>
                        </div>
                        <div class="option-icon">
                            <i class="pi pi-chart-bar"></i>
                        </div>
                        <div class="option-text">
                            <strong>Pivot</strong>
                            <small>Export hasil pivot ({{ pivotRowLabel }} x {{ pivotCol }})</small>
                        </div>
                    </div>
                </div>
            </div>
            <template #footer>
                <Button label="Batal" text size="small" @click="exportDialog = false" />
                <Button label="Export" severity="primary" size="small" @click="proceedExport" />
            </template>
        </Dialog>

        <!-- Filter & Toolbar -->
        <div class="report-card">
            <!-- Toolbar -->
            <div class="browse-toolbar">
                <div class="toolbar-left">
                    <IconField iconPosition="left">
                        <InputIcon class="pi pi-search" />
                        <InputText v-model="searchKeyword" placeholder="Cari semua kolom..." size="small" class="search-input" @input="onSearchInput" />
                    </IconField>
                    <div v-if="activeFiltersCount > 0" class="active-filters">
                        <i class="pi pi-filter-fill"></i>
                        <span>{{ activeFiltersCount }} filter aktif</span>
                        <Button icon="pi pi-times" text rounded size="small" severity="secondary" @click="clearAllFilters" />
                    </div>
                </div>
                <div class="toolbar-right">
                    <Button icon="pi pi-refresh" severity="secondary" text size="small" :loading="loading" @click="loadData" />
                    <Button icon="pi pi-filter" severity="secondary" text size="small" :class="{ 'filter-active': showTextFilter }" @click="showTextFilter = !showTextFilter" />
                </div>
            </div>

            <!-- Text Filter Panel -->
            <div v-if="showTextFilter" class="text-filter-panel">
                <div class="text-filter-grid">
                    <div v-for="col in filterableColumns" :key="col.field" class="text-filter-item">
                        <label>{{ col.header }}</label>
                        <InputText v-model="textFilters[col.field]" :placeholder="'Filter ' + col.header + '...'" size="small" class="w-full" @keydown.enter="applyTextFilters" />
                    </div>
                </div>
                <div class="text-filter-footer">
                    <Button label="Reset" text size="small" @click="resetTextFilters" />
                    <Button label="Terapkan" severity="primary" size="small" @click="applyTextFilters" />
                </div>
            </div>

            <!-- Date Filter -->
            <div class="date-filter-row">
                <div class="date-item">
                    <label>Tanggal Mulai</label>
                    <DatePicker v-model="startDate" dateFormat="yy-mm-dd" showIcon size="small" />
                </div>
                <div class="date-item">
                    <label>Tanggal Akhir</label>
                    <DatePicker v-model="endDate" dateFormat="yy-mm-dd" showIcon size="small" />
                </div>
                <!-- <div class="date-item">
                    <label>Supplier</label>
                    <Select v-model="filterSupplier" :options="supplierList" optionLabel="nama" optionValue="kode" placeholder="Semua" size="small" showClear class="w-48" />
                </div> -->
            </div>

            <!-- Tab View: Grid | Pivot -->
            <div class="tab-buttons">
                <button :class="{ active: activeTab === 'grid' }" @click="activeTab = 'grid'">
                    <i class="pi pi-table"></i> Grid
                </button>
                <button :class="{ active: activeTab === 'pivot' }" @click="activeTab = 'pivot'">
                    <i class="pi pi-chart-bar"></i> Pivot
                </button>
            </div>

            <!-- GRID VIEW -->
            <div v-show="activeTab === 'grid'">
                <DataTable 
                    :value="filteredData"
                    :loading="loading"
                    class="report-table"
                    stripedRows size="small" showGridlines
                    paginator :rows="25" :rowsPerPageOptions="[10, 25, 50, 100]"
                    sortField="Tanggal" :sortOrder="-1"
                >
                    <template #empty>
                        <div class="empty-state">
                            <i class="pi pi-inbox"></i>
                            <p>Klik "Load Data" untuk menampilkan laporan</p>
                        </div>
                    </template>

                    <Column v-for="col in gridColumns" :key="col.field" :field="col.field" :sortable="true" :style="{ width: col.width || 'auto', textAlign: col.align || 'left' }">
                        <template #header>
                            <div class="column-header">
                                <span class="column-title">{{ col.header }}</span>
                                <Button icon="pi pi-filter" text rounded size="small" :class="{ 'filter-active': hasColumnFilter(col.field) }" @click.stop="toggleColumnFilter(col, $event)" />
                                <OverlayPanel :ref="(el) => setFilterOverlayRef(col.field, el)" @hide="onFilterPanelHide(col.field)">
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
                        <template v-if="col.field === 'Nilai' || col.field === 'Qty'" #body="{ data }">
                            <span class="currency-text">{{ col.field === 'Nilai' ? formatCurrency(data[col.field]) : formatNumber(data[col.field]) }}</span>
                        </template>
                    </Column>

                    <template #footer>
                        <div class="footer-summary-row">
                            <span></span><span></span><span></span><span></span><span></span>
                            <span></span><span></span><span></span><span></span>
                            <span class="footer-value">Qty: {{ formatNumber(totalQty) }}</span>
                            <span class="footer-value currency-text">Nilai: {{ formatCurrency(totalNilai) }}</span>
                        </div>
                    </template>
                </DataTable>
            </div>

            <!-- PIVOT VIEW -->
            <div v-show="activeTab === 'pivot'" class="pivot-container">
                <div class="pivot-controls">
                    <div class="pivot-control">
                        <label>Baris (Row)</label>
                        <Select v-model="pivotRow" :options="pivotFields" optionLabel="label" optionValue="value" size="small" class="w-40" @change="buildPivot" />
                    </div>
                    <div class="pivot-control">
                        <label>Kolom (Column)</label>
                        <Select v-model="pivotCol" :options="pivotFields" optionLabel="label" optionValue="value" size="small" class="w-40" @change="buildPivot" />
                    </div>
                    <div class="pivot-control">
                        <label>Data (Value)</label>
                        <Select v-model="pivotData" :options="pivotDataFields" optionLabel="label" optionValue="value" size="small" class="w-40" @change="buildPivot" />
                    </div>
                </div>
                <div class="pivot-table-wrapper">
                    <table class="pivot-table" v-if="pivotResult.rows.length > 0">
                        <thead>
                            <tr>
                                <th class="pivot-corner">{{ pivotRowLabel }}</th>
                                <th v-for="col in pivotResult.columns" :key="col" class="pivot-col-header">{{ col }}</th>
                                <th class="pivot-total-header">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="row in pivotResult.rows" :key="row.label">
                                <td class="pivot-row-header">{{ row.label }}</td>
                                <td v-for="col in pivotResult.columns" :key="col" class="pivot-cell">{{ formatPivotValue(row.values[col]) }}</td>
                                <td class="pivot-total-cell">{{ formatPivotValue(row.total) }}</td>
                            </tr>
                        </tbody>
                        <tfoot>
                            <tr>
                                <td class="pivot-total-header">Total</td>
                                <td v-for="col in pivotResult.columns" :key="col" class="pivot-total-cell">{{ formatPivotValue(pivotResult.columnTotals[col]) }}</td>
                                <td class="pivot-grand-total">{{ formatPivotValue(pivotResult.grandTotal) }}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import OverlayPanel from 'primevue/overlaypanel'
import Checkbox from 'primevue/checkbox'

definePageMeta({ layout: 'default' })

const { $api } = useNuxtApp()
const toast = useToast()

// Data
const loading = ref(false)
const data = ref<any[]>([])
const startDate = ref(new Date(new Date().getFullYear(), new Date().getMonth(), 1))
const endDate = ref(new Date())
const filterSupplier = ref(null)
const supplierList = ref<any[]>([])
const searchKeyword = ref('')
const showTextFilter = ref(false)
const textFilters = ref<Record<string, string>>({})
const activeTextFilters = ref<Record<string, string>>({})
const activeTab = ref<'grid' | 'pivot'>('grid')

// Column filter state
const filterOverlays = ref<Record<string, any>>({})
const tempColumnFilters = ref<Record<string, any[]>>({})
const activeColumnFilters = ref<Record<string, any[]>>({})
const filterSearchTerms = ref<Record<string, string>>({})
const filterOptionsCache = ref<Record<string, any[]>>({})

// Grid columns
const gridColumns = [
    { field: 'Bulan', header: 'Bln', width: '55px', align: 'center' },
    { field: 'Tahun', header: 'Thn', width: '55px', align: 'center' },
    { field: 'Nota', header: 'Nota', width: '110px' },
    { field: 'Tanggal', header: 'Tanggal', width: '90px' },
    { field: 'Supplier', header: 'Supplier', width: '180px' },
    { field: 'Kode', header: 'Kode', width: '90px' },
    { field: 'Nama', header: 'Nama Barang', width: '200px' },
    { field: 'Satuan', header: 'Sat', width: '60px', align: 'center' },
    { field: 'Kategori', header: 'Kategori', width: '100px' },
    { field: 'Qty', header: 'Qty', width: '70px', align: 'right' },
    { field: 'Nilai', header: 'Nilai', width: '130px', align: 'right' },
]

const filterableColumns = [
    { field: 'Nota', header: 'Nota' },
    { field: 'Supplier', header: 'Supplier' },
    { field: 'Kode', header: 'Kode' },
    { field: 'Nama', header: 'Nama Barang' },
    { field: 'Kategori', header: 'Kategori' },
    { field: 'Bulan', header: 'Bulan' },
    { field: 'Tahun', header: 'Tahun' },
]

// Pivot state
const pivotRow = ref('Supplier')
const pivotCol = ref('Bulan')
const pivotData = ref('Nilai')
const pivotResult = ref<{ columns: string[], rows: any[], columnTotals: any, grandTotal: number }>({ columns: [], rows: [], columnTotals: {}, grandTotal: 0 })

const pivotFields = [
    { label: 'Bulan', value: 'Bulan' },
    { label: 'Tahun', value: 'Tahun' },
    { label: 'Supplier', value: 'Supplier' },
    { label: 'Kategori', value: 'Kategori' },
    { label: 'Nama Barang', value: 'Nama' },
]
const pivotDataFields = [
    { label: 'Qty', value: 'Qty' },
    { label: 'Nilai', value: 'Nilai' },
]
const pivotRowLabel = computed(() => pivotFields.find(f => f.value === pivotRow.value)?.label || '')

// Computed
const totalQty = computed(() => filteredData.value.reduce((s, r) => s + (parseFloat(r.Qty) || 0), 0))
const totalNilai = computed(() => filteredData.value.reduce((s, r) => s + (parseFloat(r.Nilai) || 0), 0))

const activeFiltersCount = computed(() => {
    return Object.keys(activeColumnFilters.value).filter(k => activeColumnFilters.value[k]?.length > 0).length +
           Object.keys(activeTextFilters.value).filter(k => activeTextFilters.value[k]?.trim()).length
})

const filteredData = computed(() => {
    let result = [...data.value]
    
    // Supplier filter (dropdown)
    if (filterSupplier.value) {
        const supplierName = supplierList.value.find((s: any) => s.kode === filterSupplier.value)?.nama
        if (supplierName) result = result.filter(r => r.Supplier === supplierName)
    }
    
    // Global search
    if (searchKeyword.value) {
        const kw = searchKeyword.value.toLowerCase()
        result = result.filter(row => Object.values(row).some(val => String(val).toLowerCase().includes(kw)))
    }
    
    // Column filters
    Object.keys(activeColumnFilters.value).forEach(field => {
        const values = activeColumnFilters.value[field]
        if (values?.length > 0) result = result.filter(row => values.includes(String(row[field])))
    })
    
    // Text filters
    Object.keys(activeTextFilters.value).forEach(field => {
        const val = activeTextFilters.value[field]?.toLowerCase()
        if (val) result = result.filter(row => String(row[field] || '').toLowerCase().includes(val))
    })
    
    return result
})

// Methods
const formatCurrency = (val: any) => { if (!val && val !== 0) return '-'; return 'Rp ' + Math.round(parseFloat(val)).toLocaleString('id-ID') }
const formatNumber = (val: any) => { if (!val && val !== 0) return '-'; return Math.round(parseFloat(val)).toLocaleString('id-ID') }
const formatPivotValue = (val: any) => pivotData.value === 'Nilai' ? formatCurrency(val) : formatNumber(val)
const formatDate = (d: Date): string => {
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
}

const loadData = async () => {
    loading.value = true
    try {
        const res = await $api.get('/v1/report/pembelian-per-item', {
            params: { start_date: formatDate(startDate.value), end_date: formatDate(endDate.value) }
        })
        if (res.data.success) { 
            data.value = res.data.data
            buildFilterOptions()
            buildPivot()
            toast.add({ severity: 'success', summary: 'Berhasil', detail: `${data.value.length} data`, life: 2000 })
        }
    } catch (e: any) {
        toast.add({ severity: 'error', summary: 'Gagal', detail: e.response?.data?.message || 'Gagal', life: 3000 })
    } finally { loading.value = false }
}

// Search
let searchTimeout: any
const onSearchInput = () => { clearTimeout(searchTimeout); searchTimeout = setTimeout(() => {}, 300) }

// Text filters
const resetTextFilters = () => { filterableColumns.forEach(c => textFilters.value[c.field] = ''); activeTextFilters.value = {} }
const applyTextFilters = () => {
    activeTextFilters.value = {}
    filterableColumns.forEach(c => { if (textFilters.value[c.field]?.trim()) activeTextFilters.value[c.field] = textFilters.value[c.field].trim() })
}
const clearAllFilters = () => { searchKeyword.value = ''; activeColumnFilters.value = {}; activeTextFilters.value = {}; textFilters.value = {}; tempColumnFilters.value = {} }

// Column filters
const buildFilterOptions = () => {
    filterableColumns.forEach(col => {
        const values = new Map<string, number>()
        data.value.forEach(row => { const v = String(row[col.field] || ''); if (v) values.set(v, (values.get(v) || 0) + 1) })
        filterOptionsCache.value[col.field] = Array.from(values.entries()).map(([v, c]) => ({ value: v, label: v, count: c })).sort((a, b) => a.label.localeCompare(b.label))
    })
}
const setFilterOverlayRef = (f: string, el: any) => { if (el) filterOverlays.value[f] = el }
const toggleColumnFilter = (col: any, event: Event) => {
    const overlay = filterOverlays.value[col.field]
    if (overlay) {
        if (!tempColumnFilters.value[col.field]) tempColumnFilters.value[col.field] = [...(activeColumnFilters.value[col.field] || [])]
        overlay.toggle(event)
    }
}
const closeFilterPanel = (f: string) => filterOverlays.value[f]?.hide()
const onFilterPanelHide = (f: string) => { tempColumnFilters.value[f] = [...(activeColumnFilters.value[f] || [])] }
const getFilteredOptions = (f: string) => {
    const opts = filterOptionsCache.value[f] || []
    const term = filterSearchTerms.value[f]?.toLowerCase() || ''
    return term ? opts.filter(o => o.label.toLowerCase().includes(term)) : opts
}
const selectAll = (f: string) => { tempColumnFilters.value[f] = (filterOptionsCache.value[f] || []).map(o => o.value) }
const clearFilter = (f: string) => { tempColumnFilters.value[f] = [] }
const hasColumnFilter = (f: string) => activeColumnFilters.value[f]?.length > 0
const applyColumnFilter = (f: string) => { activeColumnFilters.value[f] = [...(tempColumnFilters.value[f] || [])]; closeFilterPanel(f) }

// PIVOT BUILDER
const buildPivot = () => {
    const rows: Record<string, any> = {}
    const colSet = new Set<string>()
    let grandTotal = 0
    
    filteredData.value.forEach(item => {
        const rv = String(item[pivotRow.value] || '')
        const cv = String(item[pivotCol.value] || '')
        const dv = parseFloat(item[pivotData.value]) || 0
        
        colSet.add(cv)
        if (!rows[rv]) rows[rv] = { label: rv, values: {}, total: 0 }
        rows[rv].values[cv] = (rows[rv].values[cv] || 0) + dv
        rows[rv].total += dv
        grandTotal += dv
    })
    
    const columns = Array.from(colSet).sort((a, b) => {
        const na = parseInt(a), nb = parseInt(b)
        return isNaN(na) || isNaN(nb) ? a.localeCompare(b) : na - nb
    })
    
    const columnTotals: Record<string, number> = {}
    columns.forEach(col => {
        columnTotals[col] = Object.values(rows).reduce((s: number, r: any) => s + (r.values[col] || 0), 0)
    })
    
    pivotResult.value = { columns, rows: Object.values(rows), columnTotals, grandTotal }
}

// EXPORTS
// Export Dialog state
const exportDialog = ref(false)
const exportTarget = ref<'grid' | 'pivot'>('grid')
const exportType = ref<'excel' | 'pdf' | 'csv'>('excel')

// Override export buttons
const exportExcel = () => { exportType.value = 'excel'; openExportDialog() }
const exportPDF = () => { exportType.value = 'pdf'; openExportDialog() }
const exportCSV = () => { exportType.value = 'csv'; openExportDialog() }

const openExportDialog = () => {
    if (data.value.length === 0) {
        toast.add({ severity: 'warn', summary: 'Peringatan', detail: 'Tidak ada data', life: 2000 })
        return
    }
    exportTarget.value = activeTab.value === 'pivot' ? 'pivot' : 'grid'
    exportDialog.value = true
}

const proceedExport = () => {
    exportDialog.value = false
    if (exportType.value === 'excel') doExportExcel()
    else if (exportType.value === 'pdf') doExportPDF()
    else if (exportType.value === 'csv') doExportCSV()
}

// ========== EXPORT EXCEL ==========
const doExportExcel = async () => {
    const ExcelJS = await import('exceljs')
    const wb = new ExcelJS.Workbook()
    
    const headerStyle: any = {
        font: { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF10B981' } },
        alignment: { horizontal: 'center', vertical: 'middle', wrapText: true },
        border: { top: { style: 'thin', color: { argb: 'FF059669' } }, bottom: { style: 'thin', color: { argb: 'FF059669' } }, left: { style: 'thin', color: { argb: 'FF059669' } }, right: { style: 'thin', color: { argb: 'FF059669' } } }
    }
    const dataStyle: any = { font: { size: 10 }, border: { top: { style: 'thin', color: { argb: 'FFD1D5DB' } }, bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } }, left: { style: 'thin', color: { argb: 'FFD1D5DB' } }, right: { style: 'thin', color: { argb: 'FFD1D5DB' } } }, alignment: { vertical: 'middle' } }
    const numStyle: any = { ...dataStyle, alignment: { horizontal: 'right', vertical: 'middle' }, numFmt: '#,##0' }
    
    if (exportTarget.value === 'grid') {
        // 🔥 GRID VIEW - Clone data untuk hindari circular reference
        const ws = wb.addWorksheet('Pembelian Per Item')
        
        ws.mergeCells('A1:K1')
        ws.getCell('A1').value = 'LAPORAN PEMBELIAN PER ITEM'
        ws.getCell('A1').style = { font: { bold: true, size: 14 } }
        ws.getRow(1).height = 30
        
        ws.mergeCells('A2:K2')
        ws.getCell('A2').value = `Periode: ${startDate.value.toLocaleDateString('id-ID')} - ${endDate.value.toLocaleDateString('id-ID')}`
        ws.getCell('A2').style = { font: { size: 10, color: { argb: 'FF6B7280' } } }
        
        const headerRow = ws.getRow(4)
        headerRow.height = 25
        gridColumns.forEach((col, idx) => {
            const cell = headerRow.getCell(idx + 1)
            cell.value = col.header
            cell.style = headerStyle
        })
        
        // 🔥 PAKAI filteredData.value (bukan computed langsung)
        const exportData = [...filteredData.value]
        exportData.forEach((row, i) => {
            const dr = ws.getRow(5 + i)
            gridColumns.forEach((col, idx) => {
                const cell = dr.getCell(idx + 1)
                // 🔥 Ambil value biasa (bukan computed)
                const val = row[col.field]
                if (col.field === 'Nilai' || col.field === 'Qty') {
                    cell.value = typeof val === 'number' ? val : (parseFloat(val) || 0)
                    cell.style = numStyle
                } else {
                    cell.value = String(val ?? '')
                    cell.style = dataStyle
                }
            })
        })
        
        ws.getColumn(1).width = 8; ws.getColumn(2).width = 8; ws.getColumn(3).width = 14
        ws.getColumn(4).width = 12; ws.getColumn(5).width = 28; ws.getColumn(6).width = 12
        ws.getColumn(7).width = 30; ws.getColumn(8).width = 8; ws.getColumn(9).width = 14
        ws.getColumn(10).width = 10; ws.getColumn(11).width = 16
        
        ws.autoFilter = { from: { row: 4, column: 1 }, to: { row: 4 + exportData.length, column: 11 } }
        ws.views = [{ state: 'frozen', ySplit: 4 }]
        
    } else {
        // 🔥 PIVOT VIEW
        const ws = wb.addWorksheet('Pivot')
        
        ws.mergeCells('A1:E1')
        ws.getCell('A1').value = `PIVOT: ${pivotRowLabel.value} x ${pivotCol.value} (${pivotData.value})`
        ws.getCell('A1').style = { font: { bold: true, size: 14 } }
        ws.getRow(1).height = 30
        
        const pivotHeaderRow = ws.getRow(3)
        pivotHeaderRow.getCell(1).value = pivotRowLabel.value
        pivotHeaderRow.getCell(1).style = headerStyle
        
        // 🔥 Clone columns
        const cols = [...pivotResult.value.columns]
        cols.forEach((col, idx) => {
            const cell = pivotHeaderRow.getCell(idx + 2)
            cell.value = String(col)
            cell.style = headerStyle
        })
        
        const totalCell = pivotHeaderRow.getCell(cols.length + 2)
        totalCell.value = 'Total'
        totalCell.style = headerStyle
        
        // 🔥 Clone rows
        const rows = [...pivotResult.value.rows]
        rows.forEach((row, i) => {
            const dr = ws.getRow(4 + i)
            dr.getCell(1).value = String(row.label)
            dr.getCell(1).style = { ...dataStyle, font: { bold: true } }
            
            cols.forEach((col, idx) => {
                const cell = dr.getCell(idx + 2)
                cell.value = Number(row.values[col]) || 0
                cell.style = numStyle
            })
            
            const totalC = dr.getCell(cols.length + 2)
            totalC.value = Number(row.total) || 0
            totalC.style = { ...numStyle, font: { bold: true } }
        })
        
        ws.getColumn(1).width = 28
    }
    
    const buf = await wb.xlsx.writeBuffer()
    const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Laporan_Pembelian_Per_Item_${formatDate(new Date())}${exportTarget.value === 'pivot' ? '_Pivot' : ''}.xlsx`
    a.click()
    URL.revokeObjectURL(url)
    toast.add({ severity: 'success', summary: 'Export Excel', detail: 'Berhasil', life: 2000 })
}

// ========== EXPORT CSV ==========
const doExportCSV = () => {
    let csv = '\uFEFF'
    
    if (exportTarget.value === 'grid') {
        const cols = gridColumns.map(c => c.field)
        csv += gridColumns.map(c => `"${c.header}"`).join(',') + '\n'
        filteredData.value.forEach(row => csv += cols.map(c => `"${String(row[c] || '').replace(/"/g, '""')}"`).join(',') + '\n')
    } else {
        csv += `"${pivotRowLabel}","${pivotResult.value.columns.join('","')}","Total"\n`
        pivotResult.value.rows.forEach(row => {
            csv += `"${row.label}","${pivotResult.value.columns.map((c: string) => row.values[c] || 0).join('","')}","${row.total}"\n`
        })
    }
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob); const a = document.createElement('a')
    a.href = url; a.download = `Laporan_Pembelian_Per_Item_${formatDate(new Date())}.csv`; a.click(); URL.revokeObjectURL(url)
    toast.add({ severity: 'success', summary: 'Export CSV', detail: 'Berhasil', life: 2000 })
}

// ========== EXPORT PDF ==========
const doExportPDF = () => {
    const today = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })
    const period = `${startDate.value.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })} - ${endDate.value.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}`
    
    let html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Laporan</title>
    <style>
        body { font-family: Arial; padding: 20px; }
        h1 { font-size: 18px; text-align: center; color: #059669; }
        .period { text-align: center; font-size: 12px; color: #6b7280; margin-bottom: 15px; }
        table { width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 10px; }
        th { background: #10b981; color: white; padding: 6px 8px; border: 1px solid #059669; font-size: 9px; text-transform: uppercase; }
        td { padding: 5px 8px; border: 1px solid #e5e7eb; }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
    </style></head><body>
    <h1>Laporan Pembelian Per Item</h1>
    <div class="period">Periode: ${period}</div>`
    
    if (exportTarget.value === 'grid') {
        html += `<table><thead><tr>${gridColumns.map(c => `<th>${c.header}</th>`).join('')}</tr></thead><tbody>`
        filteredData.value.forEach(row => {
            html += `<tr>${gridColumns.map(c => {
                const val = row[c.field] || ''
                const align = c.align === 'right' ? 'text-right' : c.align === 'center' ? 'text-center' : ''
                return `<td class="${align}">${val}</td>`
            }).join('')}</tr>`
        })
        html += `</tbody></table>`
    } else {
        html += `<table><thead><tr><th>${pivotRowLabel}</th>${pivotResult.value.columns.map((c: string) => `<th>${c}</th>`).join('')}<th>Total</th></tr></thead><tbody>`
        pivotResult.value.rows.forEach(row => {
            html += `<tr><td><strong>${row.label}</strong></td>${pivotResult.value.columns.map((c: string) => `<td class="text-right">${formatPivotValue(row.values[c])}</td>`).join('')}<td class="text-right"><strong>${formatPivotValue(row.total)}</strong></td></tr>`
        })
        html += `<tr style="background:#fef3c7;font-weight:700"><td>TOTAL</td>${pivotResult.value.columns.map((c: string) => `<td class="text-right">${formatPivotValue(pivotResult.value.columnTotals[c])}</td>`).join('')}<td class="text-right">${formatPivotValue(pivotResult.value.grandTotal)}</td></tr>`
        html += `</tbody></table>`
    }
    
    html += `<p style="text-align:right;font-size:9px;color:#9ca3af;margin-top:20px">Dicetak: ${today}</p></body></html>`
    
    const win = window.open('', '_blank', 'width=1000,height=700')
    if (win) { win.document.write(html); win.document.close() }
    toast.add({ severity: 'success', summary: 'Preview PDF', detail: 'Gunakan Print > Save as PDF', life: 3000 })
}

// Auto-load on mount
onMounted(async () => {
    try { const res = await $api.get('/supplier'); supplierList.value = res.data.data || [] } catch (e) { console.error(e) }
    resetTextFilters()
    loadData() // ✅ Auto-load
})
</script>

<style lang="scss" scoped>
.report-page { padding: 1rem; display: flex; flex-direction: column; gap: 1rem; }

.report-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 1.25rem 1.5rem; background: var(--surface-card);
    border-radius: 0.75rem; border: 1px solid var(--surface-border);
    .header-left { display: flex; align-items: center; gap: 1rem; }
    .header-icon { width: 2.75rem; height: 2.75rem; background: var(--primary-50); border-radius: 0.625rem; display: flex; align-items: center; justify-content: center; color: var(--primary-600); font-size: 1.25rem; }
    h1 { font-size: 1.25rem; font-weight: 700; color: var(--text-color); margin: 0; }
    p { font-size: 0.813rem; color: var(--text-color-secondary); margin: 0.25rem 0 0 0; }
    .header-actions { display: flex; gap: 0.5rem; }
}

.report-card { background: var(--surface-card); border-radius: 0.75rem; border: 1px solid var(--surface-border); overflow: hidden; }

// Export Dialog
.export-dialog-content {
    .export-dialog-text {
        font-size: 0.9rem;
        color: var(--text-color-secondary);
        margin-bottom: 1.25rem;
    }
    
    .export-options {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
    }
    
    .export-option {
        display: flex;
        align-items: center;
        gap: 0.875rem;
        padding: 1rem 1.25rem;
        border: 2px solid var(--surface-border);
        border-radius: 0.75rem;
        cursor: pointer;
        transition: all 0.2s;
        
        .option-radio {
            flex-shrink: 0;
            
            .radio-circle {
                width: 1.25rem;
                height: 1.25rem;
                border-radius: 50%;
                border: 2px solid #cbd5e1;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s;
                
                &.checked {
                    border-color: var(--primary-500);
                    background: var(--primary-500);
                    position: relative;
                    
                    &::after {
                        content: '';
                        width: 0.5rem;
                        height: 0.5rem;
                        border-radius: 50%;
                        background: white;
                        position: absolute;
                    }
                }
            }
        }
        
        .option-icon {
            flex-shrink: 0;
            width: 2.5rem;
            height: 2.5rem;
            background: var(--surface-100);
            border-radius: 0.625rem;
            display: flex;
            align-items: center;
            justify-content: center;
            
            i {
                font-size: 1.25rem;
                color: var(--text-color-secondary);
            }
        }
        
        .option-text {
            flex: 1;
            
            strong {
                display: block;
                font-size: 0.9rem;
                color: var(--text-color);
                margin-bottom: 0.15rem;
            }
            
            small {
                font-size: 0.75rem;
                color: var(--text-color-secondary);
            }
        }
        
        &:hover {
            border-color: var(--primary-300);
            background: var(--primary-50);
            
            .option-icon {
                background: white;
            }
        }
        
        &.active {
            border-color: var(--primary-500);
            background: var(--primary-50);
            
            .option-icon {
                background: var(--primary-100);
                
                i {
                    color: var(--primary-600);
                }
            }
            
            .option-text strong {
                color: var(--primary-700);
            }
        }
    }
}

// Toolbar
.browse-toolbar {
    display: flex; align-items: center; justify-content: space-between;
    padding: 0.5rem 0.75rem; border-bottom: 1px solid var(--surface-border); background: var(--surface-50);
    .toolbar-left { display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; }
    .search-input { width: 260px; background: var(--surface-0); }
    .active-filters { display: flex; align-items: center; gap: 0.375rem; padding: 0.2rem 0.5rem 0.2rem 0.75rem; background: var(--surface-200); border-radius: 1rem; font-size: 0.75rem; color: var(--text-color-secondary); i { color: var(--primary-600); } }
    .toolbar-right { display: flex; align-items: center; gap: 0.25rem; }
    .filter-active { background: var(--primary-100) !important; color: var(--primary-700) !important; }
}

// Text filter panel
.text-filter-panel { padding: 0.75rem; border-bottom: 1px solid var(--surface-border); background: var(--surface-0); .text-filter-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 0.75rem; margin-bottom: 0.75rem; } .text-filter-item { label { display: block; font-size: 0.7rem; font-weight: 600; color: var(--text-color-secondary); margin-bottom: 0.2rem; } } .text-filter-footer { display: flex; justify-content: space-between; } }

// Date filter
.date-filter-row { display: flex; align-items: flex-end; gap: 1rem; padding: 0.75rem; border-bottom: 1px solid var(--surface-border); background: var(--surface-0); flex-wrap: wrap; .date-item { display: flex; flex-direction: column; gap: 0.25rem; label { font-size: 0.7rem; font-weight: 600; color: var(--text-color-secondary); text-transform: uppercase; } } .date-actions { display: flex; gap: 0.5rem; } .record-info { display: flex; align-items: center; gap: 0.5rem; margin-left: auto; font-size: 0.813rem; color: var(--text-color-secondary); } }

// Tab Buttons
.tab-buttons {
    display: flex; gap: 0; border-bottom: 2px solid var(--surface-border);
    button {
        padding: 0.6rem 1.5rem; border: none; background: transparent;
        font-size: 0.85rem; font-weight: 500; color: var(--text-color-secondary);
        cursor: pointer; transition: all 0.2s; border-bottom: 2px solid transparent; margin-bottom: -2px;
        i { margin-right: 0.5rem; }
        &:hover { color: var(--primary-600); }
        &.active { color: var(--primary-600); border-bottom-color: var(--primary-500); font-weight: 600; }
    }
}

// Grid Table
.report-table {
    :deep(.p-datatable-thead > tr > th) { background: var(--surface-50); font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.025em; color: var(--text-color-secondary); padding: 0.35rem 0.5rem !important; height: 2rem !important; border-bottom: 2px solid var(--surface-border); }
    :deep(.p-datatable-tbody > tr > td) { padding: 0.25rem 0.5rem; font-size: 0.8rem; }
}

// Column Header
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
        opacity: 1 !important;
        background: var(--primary-100) !important;
        color: var(--primary-700) !important;
    }

    :deep(.p-button) {
        width: 1.5rem !important;
        height: 1.5rem !important;
        flex-shrink: 0;
        margin-left: auto;
        opacity: 0;
        transition: opacity 0.15s;
        .pi { font-size: 0.75rem !important; }
    }

    &:hover :deep(.p-button) {
        opacity: 1;
    }
}

.currency-text { font-weight: 600; color: var(--primary-600); }

// Filter Panel
.filter-panel { width: 280px; max-height: 450px; display: flex; flex-direction: column; .filter-panel-header { display: flex; align-items: center; justify-content: space-between; padding: 0.75rem 1rem; border-bottom: 1px solid var(--surface-border); font-weight: 600; font-size: 0.875rem; } .filter-panel-search { padding: 0.75rem 1rem; border-bottom: 1px solid var(--surface-border); } .filter-panel-actions { display: flex; align-items: center; justify-content: space-between; padding: 0.5rem 1rem; border-bottom: 1px solid var(--surface-border); } .filter-panel-list { flex: 1; overflow-y: auto; max-height: 250px; padding: 0.5rem 0; .filter-option { display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 1rem; cursor: pointer; &:hover { background: var(--surface-50); } .filter-label { flex: 1; display: flex; align-items: center; justify-content: space-between; font-size: 0.813rem; cursor: pointer; margin: 0; .option-count { color: var(--text-color-secondary); font-size: 0.75rem; } } } .filter-empty { padding: 2rem 1rem; text-align: center; color: var(--text-color-secondary); font-size: 0.813rem; } } .filter-panel-footer { padding: 0.75rem 1rem; border-top: 1px solid var(--surface-border); } }

// Footer Summary
.footer-summary-row { display: flex; align-items: center; justify-content: flex-end; gap: 1rem; padding: 0.4rem 0.75rem; .footer-value { font-weight: 700; font-size: 0.8rem; } }

// Pivot
.pivot-container { padding: 1rem; }
.pivot-controls { display: flex; gap: 1rem; align-items: flex-end; margin-bottom: 1rem; flex-wrap: wrap; .pivot-control { display: flex; flex-direction: column; gap: 0.25rem; label { font-size: 0.7rem; font-weight: 600; color: var(--text-color-secondary); text-transform: uppercase; } } }
.pivot-table-wrapper { overflow-x: auto; }
.pivot-table { width: 100%; border-collapse: collapse; font-size: 0.8rem;
    th, td { padding: 0.5rem 0.75rem; border: 1px solid var(--surface-border); text-align: right; }
    .pivot-corner, .pivot-row-header { text-align: left; font-weight: 600; background: var(--surface-50); }
    .pivot-col-header { background: var(--primary-50); color: var(--primary-700); font-weight: 600; }
    .pivot-total-header, .pivot-total-cell { font-weight: 700; background: var(--surface-100); }
    .pivot-grand-total { font-weight: 700; background: var(--primary-100); color: var(--primary-700); font-size: 0.85rem; }
    .pivot-cell { color: var(--text-color); }
}

.empty-state { display: flex; flex-direction: column; align-items: center; padding: 3rem; color: var(--text-color-secondary); i { font-size: 2.5rem; margin-bottom: 0.75rem; } }
.w-40 { width: 10rem; }
.w-48 { width: 12rem; }

@media (max-width: 768px) {
    .report-header { flex-direction: column; align-items: flex-start; gap: 1rem; .header-actions { width: 100%; button { flex: 1; } } }
    .browse-toolbar { flex-direction: column; gap: 0.75rem; .search-input { width: 100%; } }
    .text-filter-panel .text-filter-grid { grid-template-columns: 1fr; }
}
</style>