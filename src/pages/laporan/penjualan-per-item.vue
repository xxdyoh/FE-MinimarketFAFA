<template>
    <div class="report-page">
        <!-- Header -->
        <div class="report-header">
            <div class="header-left">
                <div class="header-icon"><i class="pi pi-list"></i></div>
                <div class="header-text">
                    <h1>Laporan Penjualan Per Item</h1>
                    <!-- <p>Detail penjualan per barang dengan pivot</p> -->
                </div>
            </div>
            <div class="header-actions">
                <Button label="Export Excel" icon="pi pi-file-excel" severity="success" size="small" @click="exportExcel" />
                <Button label="Export PDF" icon="pi pi-file-pdf" severity="danger" size="small" @click="exportPDF" />
                <Button label="Export CSV" icon="pi pi-file" severity="info" size="small" @click="exportCSV" />
            </div>
        </div>

        <div class="report-card">
            <!-- Toolbar -->
            <div class="browse-toolbar">
                <div class="toolbar-left">
                    <IconField iconPosition="left">
                        <InputIcon class="pi pi-search" />
                        <InputText v-model="searchKeyword" placeholder="Cari semua kolom..." size="small" class="search-input" />
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

            <!-- Text Filter -->
            <div v-if="showTextFilter" class="text-filter-panel">
                <div class="text-filter-grid">
                    <div v-for="col in filterableColumns" :key="col.field" class="text-filter-item">
                        <label>{{ col.header }}</label>
                        <InputText v-model="textFilters[col.field]" placeholder="Filter..." size="small" class="w-full" />
                    </div>
                </div>
                <div class="text-filter-footer">
                    <Button label="Reset" text size="small" @click="resetTextFilters" />
                    <Button label="Terapkan" severity="primary" size="small" @click="applyTextFilters" />
                </div>
            </div>

            <!-- Date Filter -->
            <div class="date-filter-row">
                <div class="date-item"><label>Tanggal Mulai</label><DatePicker v-model="startDate" dateFormat="yy-mm-dd" showIcon size="small" /></div>
                <div class="date-item"><label>Tanggal Akhir</label><DatePicker v-model="endDate" dateFormat="yy-mm-dd" showIcon size="small" /></div>
            </div>

            <!-- Tab -->
            <div class="tab-buttons">
                <button :class="{ active: activeTab === 'grid' }" @click="activeTab = 'grid'"><i class="pi pi-table"></i> Grid</button>
                <button :class="{ active: activeTab === 'pivot' }" @click="activeTab = 'pivot'"><i class="pi pi-chart-bar"></i> Pivot</button>
            </div>

            <!-- GRID -->
            <div v-show="activeTab === 'grid'">
                <DataTable 
    :value="filteredData" 
    :loading="loading" 
    class="report-table" 
    stripedRows 
    size="small" 
    showGridlines
    paginator 
    :rows="25" 
    :rowsPerPageOptions="[10,25,50,100]" 
    sortField="Tanggal" 
    :sortOrder="-1" 
    scrollable 
    scrollDirection="horizontal"
    :scrollHeight="'flex'"
    responsiveLayout="scroll"
>
                    <template #empty><div class="empty-state"><i class="pi pi-inbox"></i><p>Data tidak tersedia</p></div></template>
                    <Column v-for="col in gridColumns" :key="col.field" :field="col.field" :sortable="true" :style="{ width: col.width || 'auto', textAlign: col.align || 'left' }">
                        <template #header>
                            <div class="column-header">
                                <span class="column-title">{{ col.header }}</span>
                                <Button icon="pi pi-filter" text rounded size="small" :class="{ 'filter-active': hasColumnFilter(col.field) }" @click.stop="toggleColumnFilter(col, $event)" />
                                <OverlayPanel :ref="(el) => setFilterOverlayRef(col.field, el)" @hide="onFilterPanelHide(col.field)">
                                    <div class="filter-panel">
                                        <div class="filter-panel-header"><span>Filter {{ col.header }}</span><Button icon="pi pi-times" text rounded size="small" @click="closeFilterPanel(col.field)" /></div>
                                        <div class="filter-panel-search"><IconField iconPosition="left"><InputIcon class="pi pi-search" /><InputText v-model="filterSearchTerms[col.field]" placeholder="Cari..." size="small" class="w-full" /></IconField></div>
                                        <div class="filter-panel-actions"><Button label="Pilih Semua" text size="small" @click="selectAll(col.field)" /><Button label="Bersihkan" text size="small" @click="clearFilter(col.field)" /></div>
                                        <div class="filter-panel-list">
                                            <div v-for="opt in getFilteredOptions(col.field)" :key="opt.value" class="filter-option">
                                                <Checkbox v-model="tempColumnFilters[col.field]" :value="opt.value" :inputId="`f-${col.field}-${opt.value}`" />
                                                <label :for="`f-${col.field}-${opt.value}`" class="filter-label"><span>{{ opt.label }}</span><span class="option-count">({{ opt.count }})</span></label>
                                            </div>
                                        </div>
                                        <div class="filter-panel-footer"><Button label="Terapkan" severity="primary" size="small" class="w-full" @click="applyColumnFilter(col.field)" /></div>
                                    </div>
                                </OverlayPanel>
                            </div>
                        </template>
                        <template v-if="isCurrencyField(col.field)" #body="{ data }"><span class="currency-text">{{ formatCurrency(data[col.field]) }}</span></template>
                        <template v-else-if="col.field === 'Qty'" #body="{ data }"><span class="number-text">{{ formatNumber(data[col.field]) }}</span></template>
                    </Column>
                    <template #footer>
                        <div class="footer-summary-row">
                            <span class="footer-value">Qty: {{ formatNumber(totalQty) }}</span>
                            <span class="footer-value currency-text">Nilai: {{ formatCurrency(totalNilai) }}</span>
                            <span v-if="isAdmin" class="footer-value currency-text">HPP: {{ formatCurrency(totalHpp) }}</span>
                            <span v-if="isAdmin" class="footer-value currency-text">Margin: {{ formatCurrency(totalMargin) }}</span>
                        </div>
                    </template>
                </DataTable>
            </div>

            <!-- PIVOT -->
            <div v-show="activeTab === 'pivot'" class="pivot-container">
                <div class="pivot-controls">
                    <div class="pivot-control"><label>Baris</label><Select v-model="pivotRow" :options="pivotFields" optionLabel="label" optionValue="value" size="small" class="w-40" @change="buildPivot" /></div>
                    <div class="pivot-control"><label>Kolom</label><Select v-model="pivotCol" :options="pivotFields" optionLabel="label" optionValue="value" size="small" class="w-40" @change="buildPivot" /></div>
                    <div class="pivot-control"><label>Data</label><Select v-model="pivotData" :options="pivotDataFields" optionLabel="label" optionValue="value" size="small" class="w-40" @change="buildPivot" /></div>
                </div>
                <div class="pivot-table-wrapper">
                    <table class="pivot-table" v-if="pivotResult.rows.length > 0">
                        <thead><tr><th class="pivot-corner">{{ pivotRowLabel }}</th><th v-for="c in pivotResult.columns" :key="c" class="pivot-col-header">{{ c }}</th><th class="pivot-total-header">Total</th></tr></thead>
                        <tbody><tr v-for="r in pivotResult.rows" :key="r.label"><td class="pivot-row-header">{{ r.label }}</td><td v-for="c in pivotResult.columns" :key="c" class="pivot-cell">{{ formatPivotValue(r.values[c]) }}</td><td class="pivot-total-cell">{{ formatPivotValue(r.total) }}</td></tr></tbody>
                        <tfoot><tr><td class="pivot-total-header">Total</td><td v-for="c in pivotResult.columns" :key="c" class="pivot-total-cell">{{ formatPivotValue(pivotResult.columnTotals[c]) }}</td><td class="pivot-grand-total">{{ formatPivotValue(pivotResult.grandTotal) }}</td></tr></tfoot>
                    </table>
                </div>
            </div>
        </div>

        <!-- Export Dialog -->
        <Dialog v-model:visible="exportDialog" header="Export Laporan" :modal="true" :style="{ width: '420px' }">
            <div class="export-dialog-content">
                <p class="export-dialog-text">Pilih tampilan yang akan diexport:</p>
                <div class="export-options">
                    <div class="export-option" :class="{ 'active': exportTarget === 'grid' }" @click="exportTarget = 'grid'">
                        <div class="option-radio"><div class="radio-circle" :class="{ 'checked': exportTarget === 'grid' }"></div></div>
                        <div class="option-icon"><i class="pi pi-table"></i></div>
                        <div class="option-text"><strong>Grid View</strong><small>Export data tabel</small></div>
                    </div>
                    <div class="export-option" :class="{ 'active': exportTarget === 'pivot' }" @click="exportTarget = 'pivot'">
                        <div class="option-radio"><div class="radio-circle" :class="{ 'checked': exportTarget === 'pivot' }"></div></div>
                        <div class="option-icon"><i class="pi pi-chart-bar"></i></div>
                        <div class="option-text"><strong>Pivot</strong><small>Export hasil pivot</small></div>
                    </div>
                </div>
            </div>
            <template #footer>
                <Button label="Batal" text size="small" @click="exportDialog = false" />
                <Button label="Export" severity="primary" size="small" @click="proceedExport" />
            </template>
        </Dialog>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import OverlayPanel from 'primevue/overlaypanel'
import Checkbox from 'primevue/checkbox'
import { useAuthStore } from '~/stores/auth'

definePageMeta({ layout: 'default' })

const { $api } = useNuxtApp()
const toast = useToast()
const authStore = useAuthStore()

const loading = ref(false)
const data = ref<any[]>([])
const startDate = ref(new Date(new Date().setDate(new Date().getDate() - 30)))
const endDate = ref(new Date())
const searchKeyword = ref('')
const showTextFilter = ref(false)
const textFilters = ref<Record<string, string>>({})
const activeTextFilters = ref<Record<string, string>>({})
const activeTab = ref<'grid' | 'pivot'>('grid')
const isAdmin = computed(() => authStore.user?.kode === 'ADMIN' || authStore.user?.role === 'admin')

const filterOverlays = ref<Record<string, any>>({})
const tempColumnFilters = ref<Record<string, any[]>>({})
const activeColumnFilters = ref<Record<string, any[]>>({})
const filterSearchTerms = ref<Record<string, string>>({})
const filterOptionsCache = ref<Record<string, any[]>>({})

const exportDialog = ref(false)
const exportTarget = ref<'grid' | 'pivot'>('grid')
const exportType = ref('excel')

const pivotRow = ref('Bulan')
const pivotCol = ref('Tahun')
const pivotData = ref('Nilai')
const pivotResult = ref<{ columns: string[], rows: any[], columnTotals: any, grandTotal: number }>({ columns: [], rows: [], columnTotals: {}, grandTotal: 0 })
const pivotFields = [{ label: 'Bulan', value: 'Bulan' },{ label: 'Tahun', value: 'Tahun' },{ label: 'Customer', value: 'Customer' },{ label: 'Kategori', value: 'Kategori' },{ label: 'Nama Barang', value: 'Nama' }]
const pivotDataFields = computed(() => {
    const f: any[] = [{ label: 'Qty', value: 'Qty' },{ label: 'Nilai', value: 'Nilai' },{ label: 'Disc', value: 'Disc' }]
    if (isAdmin.value) { f.push({ label: 'HPP', value: 'Hpp' },{ label: 'Margin', value: 'Margin' }) }
    return f
})
const pivotRowLabel = computed(() => pivotFields.find(f => f.value === pivotRow.value)?.label || '')

const gridColumns = computed(() => {
    const cols: any[] = [
        { field: 'Nota', header: 'Nota', width: '140px' },        // ✅ 120 → 140
        { field: 'Tanggal', header: 'Tanggal', width: '110px' },   // ✅ 100 → 110
        { field: 'Bulan', header: 'Bln', width: '55px', align: 'center' },
        { field: 'Tahun', header: 'Thn', width: '55px', align: 'center' },
        { field: 'Customer', header: 'Customer', width: '180px' }, // ✅ 160 → 180
        { field: 'Kode', header: 'Kode', width: '110px' },         // ✅ 100 → 110
        { field: 'Nama', header: 'Nama Barang', width: '220px' },  // ✅ 180 → 220
        { field: 'Satuan', header: 'Sat', width: '65px', align: 'center' },
        { field: 'Kategori', header: 'Kategori', width: '110px' }, // ✅ 100 → 110
        { field: 'Qty', header: 'Qty', width: '75px', align: 'right' },
        { field: 'Nilai', header: 'Nilai', width: '140px', align: 'right' }, // ✅ 130 → 140
        { field: 'Disc', header: 'Disc', width: '110px', align: 'right' },    // ✅ 100 → 110
    ]
    if (isAdmin.value) {
        cols.push({ field: 'Hpp', header: 'HPP', width: '130px', align: 'right' })
        cols.push({ field: 'Margin', header: 'Margin', width: '130px', align: 'right' })
    }
    return cols
})

const currencyFields = ['Nilai', 'Disc', 'Hpp', 'Margin']
const isCurrencyField = (f: string) => currencyFields.includes(f)
const filterableColumns = [{ field: 'Nota', header: 'Nota' },{ field: 'Customer', header: 'Customer' },{ field: 'Kode', header: 'Kode' },{ field: 'Nama', header: 'Nama' },{ field: 'Kategori', header: 'Kategori' }]

const activeFiltersCount = computed(() => Object.keys(activeColumnFilters.value).filter(k => activeColumnFilters.value[k]?.length > 0).length + Object.keys(activeTextFilters.value).filter(k => activeTextFilters.value[k]?.trim()).length)

const filteredData = computed(() => {
    let r = [...data.value]
    if (searchKeyword.value) { const kw = searchKeyword.value.toLowerCase(); r = r.filter(row => Object.values(row).some(v => String(v).toLowerCase().includes(kw))) }
    Object.keys(activeColumnFilters.value).forEach(f => { const v = activeColumnFilters.value[f]; if (v?.length > 0) r = r.filter(row => v.includes(String(row[f]))) })
    Object.keys(activeTextFilters.value).forEach(f => { const v = activeTextFilters.value[f]?.toLowerCase(); if (v) r = r.filter(row => String(row[f]||'').toLowerCase().includes(v)) })
    return r
})

const totalQty = computed(() => filteredData.value.reduce((s, r) => s + (parseFloat(r.Qty) || 0), 0))
const totalNilai = computed(() => filteredData.value.reduce((s, r) => s + (parseFloat(r.Nilai) || 0), 0))
const totalHpp = computed(() => filteredData.value.reduce((s, r) => s + (parseFloat(r.Hpp) || 0), 0))
const totalMargin = computed(() => filteredData.value.reduce((s, r) => s + (parseFloat(r.Margin) || 0), 0))

const formatCurrency = (v: any) => { if (!v && v !== 0) return '-'; return 'Rp ' + Math.round(parseFloat(v)).toLocaleString('id-ID') }
const formatNumber = (v: any) => { if (!v && v !== 0) return '-'; return Math.round(parseFloat(v)).toLocaleString('id-ID') }
const formatPivotValue = (v: any) => pivotData.value === 'Nilai' || pivotData.value === 'Disc' || pivotData.value === 'Hpp' || pivotData.value === 'Margin' ? formatCurrency(v) : formatNumber(v)
const formatDate = (d: Date) => d.toISOString().split('T')[0]

const loadData = async () => {
    loading.value = true
    try {
        const res = await $api.get('/v1/report/penjualan-per-item', { params: { start_date: formatDate(startDate.value), end_date: formatDate(endDate.value), is_admin: isAdmin.value } })
        if (res.data.success) { data.value = res.data.data; buildFilterOptions(); buildPivot() }
    } catch (e: any) { toast.add({ severity: 'error', summary: 'Gagal', detail: e.response?.data?.message || 'Gagal', life: 3000 }) }
    finally { loading.value = false }
}

const buildPivot = () => {
    const rows: Record<string, any> = {}; const colSet = new Set<string>(); let gt = 0
    filteredData.value.forEach(item => {
        const rv = String(item[pivotRow.value] || ''); const cv = String(item[pivotCol.value] || ''); const dv = parseFloat(item[pivotData.value]) || 0
        colSet.add(cv); if (!rows[rv]) rows[rv] = { label: rv, values: {}, total: 0 }; rows[rv].values[cv] = (rows[rv].values[cv] || 0) + dv; rows[rv].total += dv; gt += dv
    })
    const cols = Array.from(colSet).sort((a, b) => { const na = parseInt(a), nb = parseInt(b); return isNaN(na) || isNaN(nb) ? a.localeCompare(b) : na - nb })
    const colTotals: Record<string, number> = {}; cols.forEach(c => { colTotals[c] = Object.values(rows).reduce((s: number, r: any) => s + (r.values[c] || 0), 0) })
    pivotResult.value = { columns: cols, rows: Object.values(rows), columnTotals: colTotals, grandTotal: gt }
}

const resetTextFilters = () => { filterableColumns.forEach(c => textFilters.value[c.field] = ''); activeTextFilters.value = {} }
const applyTextFilters = () => { activeTextFilters.value = {}; filterableColumns.forEach(c => { if (textFilters.value[c.field]?.trim()) activeTextFilters.value[c.field] = textFilters.value[c.field].trim() }) }
const clearAllFilters = () => { searchKeyword.value = ''; activeColumnFilters.value = {}; activeTextFilters.value = {}; textFilters.value = {}; tempColumnFilters.value = {} }
const buildFilterOptions = () => { filterableColumns.forEach(col => { const vals = new Map<string, number>(); data.value.forEach(r => { const v = String(r[col.field] || ''); if (v) vals.set(v, (vals.get(v) || 0) + 1) }); filterOptionsCache.value[col.field] = Array.from(vals.entries()).map(([v, c]) => ({ value: v, label: v, count: c })).sort((a, b) => a.label.localeCompare(b.label)) }) }
const setFilterOverlayRef = (f: string, el: any) => { if (el) filterOverlays.value[f] = el }
const toggleColumnFilter = (col: any, e: Event) => { const o = filterOverlays.value[col.field]; if (o) { if (!tempColumnFilters.value[col.field]) tempColumnFilters.value[col.field] = [...(activeColumnFilters.value[col.field] || [])]; o.toggle(e) } }
const closeFilterPanel = (f: string) => filterOverlays.value[f]?.hide()
const onFilterPanelHide = (f: string) => { tempColumnFilters.value[f] = [...(activeColumnFilters.value[f] || [])] }
const getFilteredOptions = (f: string) => { const o = filterOptionsCache.value[f] || []; const t = filterSearchTerms.value[f]?.toLowerCase() || ''; return t ? o.filter(opt => opt.label.toLowerCase().includes(t)) : o }
const selectAll = (f: string) => { tempColumnFilters.value[f] = (filterOptionsCache.value[f] || []).map(o => o.value) }
const clearFilter = (f: string) => { tempColumnFilters.value[f] = [] }
const hasColumnFilter = (f: string) => activeColumnFilters.value[f]?.length > 0
const applyColumnFilter = (f: string) => { activeColumnFilters.value[f] = [...(tempColumnFilters.value[f] || [])]; closeFilterPanel(f) }

// ========== EXPORT ==========
const exportExcel = () => { exportType.value = 'excel'; exportDialog.value = true }
const exportPDF = () => { exportType.value = 'pdf'; exportDialog.value = true }
const exportCSV = () => { exportType.value = 'csv'; exportDialog.value = true }

const proceedExport = async () => {
    exportDialog.value = false
    if (exportType.value === 'excel') await doExportExcel()
    else if (exportType.value === 'pdf') doExportPDF()
    else doExportCSV()
}

const doExportCSV = () => {
    let csv = '\uFEFF'
    const exportData = [...filteredData.value]
    
    if (exportTarget.value === 'grid') {
        const cols = gridColumns.value.map(c => c.field)
        csv += gridColumns.value.map(c => `"${c.header}"`).join(',') + '\n'
        exportData.forEach(r => csv += cols.map(c => `"${String(r[c] || '').replace(/"/g, '""')}"`).join(',') + '\n')
    } else {
        csv += `"${pivotRowLabel.value}","${pivotResult.value.columns.join('","')}","Total"\n`
        pivotResult.value.rows.forEach(r => csv += `"${r.label}","${pivotResult.value.columns.map((c: string) => r.values[c] || 0).join('","')}","${r.total}"\n`)
    }
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob); const a = document.createElement('a')
    a.href = url; a.download = `Laporan_Penjualan_Per_Item_${formatDate(new Date())}.csv`; a.click(); URL.revokeObjectURL(url)
    toast.add({ severity: 'success', summary: 'Export CSV', detail: 'Berhasil', life: 2000 })
}

const doExportPDF = () => {
    const period = `${startDate.value.toLocaleDateString('id-ID')} - ${endDate.value.toLocaleDateString('id-ID')}`
    let html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Laporan Penjualan Per Item</title><style>body{font-family:Arial;padding:20px}h1{font-size:18px;text-align:center;color:#059669}.period{text-align:center;font-size:12px;color:#6b7280;margin-bottom:15px}table{width:100%;border-collapse:collapse;margin:10px 0;font-size:10px}th{background:#10b981;color:white;padding:6px 8px;border:1px solid #059669;font-size:9px}td{padding:5px 8px;border:1px solid #e5e7eb}.tr{text-align:right}</style></head><body><h1>Laporan Penjualan Per Item</h1><div class="period">Periode: ${period}</div>`
    
    if (exportTarget.value === 'grid') {
        html += `<table><thead><tr>${gridColumns.value.map(c => `<th>${c.header}</th>`).join('')}</tr></thead><tbody>`
        filteredData.value.forEach(r => html += `<tr>${gridColumns.value.map(c => `<td class="${c.align === 'right' ? 'tr' : ''}">${isCurrencyField(c.field) ? formatCurrency(r[c.field]) : (c.field === 'Qty' ? formatNumber(r[c.field]) : (r[c.field] || ''))}</td>`).join('')}</tr>`)
        html += `</tbody></table>`
    } else {
        html += `<table><thead><tr><th>${pivotRowLabel.value}</th>${pivotResult.value.columns.map((c: string) => `<th>${c}</th>`).join('')}<th>Total</th></tr></thead><tbody>`
        pivotResult.value.rows.forEach(r => html += `<tr><td><strong>${r.label}</strong></td>${pivotResult.value.columns.map((c: string) => `<td class="tr">${formatPivotValue(r.values[c])}</td>`).join('')}<td class="tr"><strong>${formatPivotValue(r.total)}</strong></td></tr>`)
        html += `<tr style="background:#fef3c7;font-weight:700"><td>TOTAL</td>${pivotResult.value.columns.map((c: string) => `<td class="tr">${formatPivotValue(pivotResult.value.columnTotals[c])}</td>`).join('')}<td class="tr">${formatPivotValue(pivotResult.value.grandTotal)}</td></tr></tbody></table>`
    }
    
    html += `<p style="text-align:right;font-size:9px;color:#9ca3af;margin-top:20px">Dicetak: ${new Date().toLocaleDateString('id-ID')}</p></body></html>`
    const win = window.open('', '_blank', 'width=1000,height=700')
    if (win) { win.document.write(html); win.document.close() }
    toast.add({ severity: 'success', summary: 'Preview PDF', detail: 'Gunakan Print > Save as PDF', life: 3000 })
}

const doExportExcel = async () => {
    const ExcelJS = await import('exceljs')
    const wb = new ExcelJS.Workbook()
    const hs: any = { font: { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 }, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF10B981' } }, alignment: { horizontal: 'center', vertical: 'middle' }, border: { top: { style: 'thin', color: { argb: 'FF059669' } }, bottom: { style: 'thin', color: { argb: 'FF059669' } }, left: { style: 'thin', color: { argb: 'FF059669' } }, right: { style: 'thin', color: { argb: 'FF059669' } } } }
    const ds: any = { font: { size: 10 }, border: { top: { style: 'thin', color: { argb: 'FFD1D5DB' } }, bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } }, left: { style: 'thin', color: { argb: 'FFD1D5DB' } }, right: { style: 'thin', color: { argb: 'FFD1D5DB' } } } }
    const ns: any = { ...ds, alignment: { horizontal: 'right', vertical: 'middle' }, numFmt: '#,##0' }
    
    if (exportTarget.value === 'grid') {
        const ws = wb.addWorksheet('Penjualan Per Item')
        ws.mergeCells('A1:L1'); ws.getCell('A1').value = 'LAPORAN PENJUALAN PER ITEM'; ws.getCell('A1').style = { font: { bold: true, size: 14 } }; ws.getRow(1).height = 30
        ws.mergeCells('A2:L2'); ws.getCell('A2').value = `Periode: ${startDate.value.toLocaleDateString('id-ID')} - ${endDate.value.toLocaleDateString('id-ID')}`; ws.getCell('A2').style = { font: { size: 10, color: { argb: 'FF6B7280' } } }
        ws.getRow(4).height = 25; gridColumns.value.forEach((c, i) => { const cell = ws.getRow(4).getCell(i + 1); cell.value = c.header; cell.style = hs })
        const exportData = [...filteredData.value]
        exportData.forEach((r, i) => {
            const dr = ws.getRow(5 + i)
            gridColumns.value.forEach((c, ci) => { const cell = dr.getCell(ci + 1); const isNum = isCurrencyField(c.field) || c.field === 'Qty'; cell.value = isNum ? (parseFloat(r[c.field]) || 0) : String(r[c.field] ?? ''); cell.style = isNum ? ns : ds })
        })
        ws.autoFilter = { from: { row: 4, column: 1 }, to: { row: 4 + exportData.length, column: gridColumns.value.length } }; ws.views = [{ state: 'frozen', ySplit: 4 }]
    } else {
        const ws = wb.addWorksheet('Pivot')
        ws.mergeCells('A1:E1'); ws.getCell('A1').value = `PIVOT: ${pivotRowLabel.value} x ${pivotCol.value} (${pivotData.value})`; ws.getCell('A1').style = { font: { bold: true, size: 14 } }; ws.getRow(1).height = 30
        const ph = ws.getRow(3); ph.getCell(1).value = pivotRowLabel.value; ph.getCell(1).style = hs
        pivotResult.value.columns.forEach((c, i) => { const cell = ph.getCell(i + 2); cell.value = c; cell.style = hs })
        ph.getCell(pivotResult.value.columns.length + 2).value = 'Total'; ph.getCell(pivotResult.value.columns.length + 2).style = hs
        pivotResult.value.rows.forEach((r, i) => {
            const dr = ws.getRow(4 + i); dr.getCell(1).value = r.label; dr.getCell(1).style = { ...ds, font: { bold: true } }
            pivotResult.value.columns.forEach((c, ci) => { const cell = dr.getCell(ci + 2); cell.value = r.values[c] || 0; cell.style = ns })
            dr.getCell(pivotResult.value.columns.length + 2).value = r.total; dr.getCell(pivotResult.value.columns.length + 2).style = { ...ns, font: { bold: true } }
        })
        ws.getColumn(1).width = 28
    }
    
    const buf = await wb.xlsx.writeBuffer(); const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = URL.createObjectURL(blob); const a = document.createElement('a')
    a.href = url; a.download = `Laporan_Penjualan_Per_Item_${formatDate(new Date())}.xlsx`; a.click(); URL.revokeObjectURL(url)
    toast.add({ severity: 'success', summary: 'Export Excel', detail: 'Berhasil', life: 2000 })
}

onMounted(() => { resetTextFilters(); loadData() })
</script>

<style lang="scss" scoped>
.report-page { padding: 1rem; display: flex; flex-direction: column; gap: 1rem; }
.report-header { display: flex; align-items: center; justify-content: space-between; padding: 1.25rem 1.5rem; background: var(--surface-card); border-radius: 0.75rem; border: 1px solid var(--surface-border); .header-left { display: flex; align-items: center; gap: 1rem; } .header-icon { width: 2.75rem; height: 2.75rem; background: var(--primary-50); border-radius: 0.625rem; display: flex; align-items: center; justify-content: center; color: var(--primary-600); font-size: 1.25rem; } h1 { font-size: 1.25rem; font-weight: 700; color: var(--text-color); margin: 0; } p { font-size: 0.813rem; color: var(--text-color-secondary); margin: 0.25rem 0 0 0; } .header-actions { display: flex; gap: 0.5rem; } }
.report-card { background: var(--surface-card); border-radius: 0.75rem; border: 1px solid var(--surface-border); overflow: hidden; }
.browse-toolbar { display: flex; align-items: center; justify-content: space-between; padding: 0.5rem 0.75rem; border-bottom: 1px solid var(--surface-border); background: var(--surface-50); .toolbar-left { display: flex; align-items: center; gap: 0.75rem; } .search-input { width: 260px; } .active-filters { display: flex; align-items: center; gap: 0.375rem; padding: 0.2rem 0.75rem; background: var(--surface-200); border-radius: 1rem; font-size: 0.75rem; } .toolbar-right { display: flex; align-items: center; gap: 0.25rem; } .filter-active { background: var(--primary-100) !important; color: var(--primary-700) !important; } }
.text-filter-panel { padding: 0.75rem; border-bottom: 1px solid var(--surface-border); .text-filter-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 0.75rem; margin-bottom: 0.75rem; } .text-filter-item label { display: block; font-size: 0.7rem; font-weight: 600; color: var(--text-color-secondary); } .text-filter-footer { display: flex; justify-content: space-between; } }
.date-filter-row { display: flex; align-items: flex-end; gap: 1rem; padding: 0.75rem; border-bottom: 1px solid var(--surface-border); .date-item { display: flex; flex-direction: column; gap: 0.25rem; label { font-size: 0.7rem; font-weight: 600; color: var(--text-color-secondary); text-transform: uppercase; } } }
.tab-buttons { display: flex; border-bottom: 2px solid var(--surface-border); button { padding: 0.6rem 1.5rem; border: none; background: transparent; font-size: 0.85rem; color: var(--text-color-secondary); cursor: pointer; border-bottom: 2px solid transparent; margin-bottom: -2px; i { margin-right: 0.5rem; } &.active { color: var(--primary-600); border-bottom-color: var(--primary-500); font-weight: 600; } } }
.report-table {
    // Container horizontal scroll
    :deep(.p-datatable-wrapper) {
        overflow-x: auto !important;
    }
    
    // Header
    :deep(.p-datatable-thead > tr > th) {
        background: var(--surface-50);
        font-size: 0.7rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.025em;
        color: var(--text-color-secondary);
        padding: 0.35rem 0.6rem !important;
        height: 2rem !important;
        border-bottom: 2px solid var(--surface-border);
        white-space: nowrap; // 🔥 Jangan wrap header
    }
    
    // Body cell
    :deep(.p-datatable-tbody > tr > td) {
        padding: 0.3rem 0.6rem;
        font-size: 0.8rem;
        white-space: nowrap; // 🔥 Jangan wrap (biar horizontal scroll)
    }
    
    // Table min-width biar horizontal scroll aktif
    :deep(.p-datatable-table) {
        min-width: 1200px; // 🔥 Paksa tabel lebih lebar dari container
    }
}

.column-header { display: flex; align-items: center; justify-content: space-between; gap: 0.25rem; .column-title { flex: 1; font-size: 0.7rem; } .filter-active { background: var(--primary-100) !important; color: var(--primary-700) !important; } :deep(.p-button) { width: 1.5rem !important; height: 1.5rem !important; .pi { font-size: 0.75rem !important; } } }
.currency-text { font-weight: 600; color: var(--primary-600); }
.number-text { font-weight: 500; }
.footer-summary-row { display: flex; justify-content: flex-end; gap: 1rem; padding: 0.4rem 0.75rem; .footer-value { font-weight: 700; font-size: 0.8rem; } }
.pivot-container { padding: 1rem; }
.pivot-controls { display: flex; gap: 1rem; align-items: flex-end; margin-bottom: 1rem; .pivot-control { label { font-size: 0.7rem; font-weight: 600; color: var(--text-color-secondary); text-transform: uppercase; display: block; margin-bottom: 0.25rem; } } }
.pivot-table-wrapper { overflow-x: auto; }
.pivot-table { width: 100%; border-collapse: collapse; font-size: 0.8rem; th, td { padding: 0.5rem 0.75rem; border: 1px solid var(--surface-border); text-align: right; } .pivot-corner, .pivot-row-header { text-align: left; font-weight: 600; background: var(--surface-50); } .pivot-col-header { background: var(--primary-50); color: var(--primary-700); font-weight: 600; } .pivot-total-header, .pivot-total-cell { font-weight: 700; background: var(--surface-100); } .pivot-grand-total { font-weight: 700; background: var(--primary-100); color: var(--primary-700); font-size: 0.85rem; } }
.empty-state { display: flex; flex-direction: column; align-items: center; padding: 3rem; color: var(--text-color-secondary); i { font-size: 2.5rem; margin-bottom: 0.75rem; } }
.w-40 { width: 10rem; }
.export-dialog-content { .export-dialog-text { font-size: 0.9rem; color: var(--text-color-secondary); margin-bottom: 1.25rem; } .export-options { display: flex; flex-direction: column; gap: 0.75rem; } .export-option { display: flex; align-items: center; gap: 0.875rem; padding: 1rem 1.25rem; border: 2px solid var(--surface-border); border-radius: 0.75rem; cursor: pointer; transition: all 0.2s; .option-radio { .radio-circle { width: 1.25rem; height: 1.25rem; border-radius: 50%; border: 2px solid #cbd5e1; &.checked { border-color: var(--primary-500); background: var(--primary-500); position: relative; &::after { content: ''; width: 0.5rem; height: 0.5rem; border-radius: 50%; background: white; position: absolute; } } } } .option-icon { width: 2.5rem; height: 2.5rem; background: var(--surface-100); border-radius: 0.625rem; display: flex; align-items: center; justify-content: center; i { font-size: 1.25rem; } } .option-text { strong { display: block; font-size: 0.9rem; } small { font-size: 0.75rem; color: var(--text-color-secondary); } } &:hover { border-color: var(--primary-300); background: var(--primary-50); } &.active { border-color: var(--primary-500); background: var(--primary-50); } } }
@media (max-width: 768px) { .report-header { flex-direction: column; align-items: flex-start; gap: 1rem; .header-actions { width: 100%; button { flex: 1; } } } }
</style>