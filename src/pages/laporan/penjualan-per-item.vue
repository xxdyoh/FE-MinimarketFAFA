<template>
    <div class="report-page">
        <div class="main-card">
            <!-- Toolbar -->
            <div class="toolbar">
                <div class="search-box">
                    <i class="pi pi-search"></i>
                    <input v-model="searchKeyword" placeholder="Cari nota, customer..." class="search-input" />
                    <i v-if="searchKeyword" class="pi pi-times clear-btn" @click="searchKeyword = ''"></i>
                </div>

                <div class="filter-item">
                    <span class="filter-label">Periode</span>
                    <DatePicker v-model="startDate" dateFormat="yy-mm-dd" showIcon size="small" />
                    <span class="date-sep">s/d</span>
                    <DatePicker v-model="endDate" dateFormat="yy-mm-dd" showIcon size="small" />
                </div>

                <Button icon="pi pi-filter" severity="secondary" text rounded size="small" :class="{ 'filter-active': showTextFilter || activeFiltersCount > 0 }" @click="showTextFilter = !showTextFilter" v-tooltip.top="'Filter Teks'" />

                <div class="actions">
                    <Button icon="pi pi-refresh" text rounded size="small" :loading="loading" @click="loadData" v-tooltip.top="'Refresh'" />
                    <Button icon="pi pi-file-excel" text rounded size="small" severity="success" @click="exportExcel" v-tooltip.top="'Excel'" />
                    <Button icon="pi pi-print" text rounded size="small" @click="exportPDF" v-tooltip.top="'Print'" />
                </div>
            </div>

            <!-- Text Filter Panel -->
            <div v-if="showTextFilter" class="text-filter-panel">
                <div class="text-filter-grid">
                    <div v-for="col in filterableColumns" :key="col.field" class="text-filter-item">
                        <input v-model="textFilters[col.field]" :placeholder="col.header" class="text-filter-input" @keydown.enter="applyTextFilters" />
                    </div>
                </div>
                <div class="text-filter-actions">
                    <Button label="Reset" text size="small" @click="resetTextFilters" />
                    <Button label="Terapkan" severity="primary" size="small" @click="applyTextFilters" />
                </div>
            </div>

            <!-- Tab Buttons -->
            <div class="tab-buttons">
                <button :class="{ active: activeTab === 'grid' }" @click="activeTab = 'grid'"><i class="pi pi-table"></i> Grid</button>
                <button :class="{ active: activeTab === 'pivot' }" @click="activeTab = 'pivot'"><i class="pi pi-chart-bar"></i> Pivot</button>
            </div>

            <!-- GRID VIEW -->
            <div v-show="activeTab === 'grid'" class="table-area">
                <DataTable
                    :value="filteredData" :loading="loading" stripedRows size="small" showGridlines
                    paginator :rows="25" :rowsPerPageOptions="[10, 25, 50, 100]"
                    sortField="Tanggal" :sortOrder="-1"
                    scrollable scrollHeight="flex" scrollDirection="horizontal" responsiveLayout="scroll"
                    class="data-table"
                >
                    <template #empty>
                        <div class="table-empty"><i class="pi pi-inbox"></i><span>Tidak ada data</span></div>
                    </template>

                    <Column v-for="col in gridColumns" :key="col.field" :field="col.field" :sortable="true" :style="{ width: col.width, minWidth: col.minWidth || '60px', textAlign: col.align || 'left' }">
                        <template #header>
                            <div class="col-header">
                                <span class="col-title">{{ col.header }}</span>
                                <div class="col-icons">
                                    <button class="col-filter-btn" :class="{ 'active': hasColumnFilter(col.field) || numericFilters[col.field] }" @click.stop="openColumnFilter(col, $event)">
                                        <i class="pi pi-filter"></i>
                                    </button>
                                </div>
                                <OverlayPanel :ref="(el) => setFilterOverlayRef(col.field, el)" @hide="onFilterPanelHide(col.field)">
                                    <NumericFilter v-if="isNumericField(col)" :label="col.header" :currentFilter="numericFilters[col.field]" @apply="(f: any) => applyNumericFilter(col.field, f)" @close="closeFilterPanel(col.field)" />
                                    <div v-else class="mini-filter">
                                        <div class="mini-filter-head"><span>Filter {{ col.header }}</span><Button icon="pi pi-times" text rounded size="small" @click="closeFilterPanel(col.field)" /></div>
                                        <div class="mini-filter-search"><i class="pi pi-search"></i><input v-model="filterSearchTerms[col.field]" placeholder="Cari..." class="mini-filter-input" /></div>
                                        <div class="mini-filter-actions"><button @click="selectAll(col.field)">Pilih Semua</button><button @click="clearFilter(col.field)">Bersihkan</button></div>
                                        <div class="mini-filter-list">
                                            <label v-for="opt in getFilteredOptions(col.field)" :key="opt.value" class="mini-filter-opt"><input type="checkbox" :value="opt.value" v-model="tempColumnFilters[col.field]" /><span>{{ opt.label }}</span><small>{{ opt.count }}</small></label>
                                            <div v-if="getFilteredOptions(col.field).length === 0" class="mini-filter-empty">Tidak ada</div>
                                        </div>
                                        <div class="mini-filter-foot"><Button label="Terapkan" severity="primary" size="small" class="w-full" @click="applyColumnFilter(col.field)" /></div>
                                    </div>
                                </OverlayPanel>
                            </div>
                        </template>
                        <template v-if="isCurrencyField(col.field)" #body="{ data }"><span class="text-currency">{{ formatCurrency(data[col.field]) }}</span></template>
                        <template v-else-if="col.field === 'Qty'" #body="{ data }"><span class="text-number">{{ formatNumber(data[col.field]) }}</span></template>
                        <!-- Footer TOTAL -->
                        <template v-if="col.field === 'Nota'" #footer><span class="footer-label">TOTAL</span></template>
                        <template v-else-if="col.field === 'Qty'" #footer><span class="footer-value">{{ formatNumber(totalQty) }}</span></template>
                        <template v-else-if="col.field === 'Nilai'" #footer><span class="footer-value">{{ formatCurrency(totalNilai) }}</span></template>
                        <template v-else-if="isAdmin && col.field === 'Hpp'" #footer><span class="footer-value">{{ formatCurrency(totalHpp) }}</span></template>
                        <template v-else-if="isAdmin && col.field === 'Margin'" #footer><span class="footer-value">{{ formatCurrency(totalMargin) }}</span></template>
                    </Column>
                </DataTable>
            </div>

            <!-- PIVOT VIEW -->
            <div v-show="activeTab === 'pivot'" class="table-area">
                <div class="pivot-controls">
                    <div class="filter-item">
                        <span class="filter-label">Baris</span>
                        <Select v-model="pivotRow" :options="pivotFields" optionLabel="label" optionValue="value" size="small" class="pivot-select" @change="buildPivot" />
                    </div>
                    <div class="filter-item">
                        <span class="filter-label">Kolom</span>
                        <Select v-model="pivotCol" :options="pivotFields" optionLabel="label" optionValue="value" size="small" class="pivot-select" @change="buildPivot" />
                    </div>
                    <div class="filter-item">
                        <span class="filter-label">Data</span>
                        <Select v-model="pivotData" :options="pivotDataFields" optionLabel="label" optionValue="value" size="small" class="pivot-select" @change="buildPivot" />
                    </div>
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
        <Dialog v-model:visible="exportDialog" header="Export Laporan" :modal="true" :style="{ width: '400px' }" :breakpoints="{ '480px': '90vw' }">
            <div class="export-dialog-content">
                <p class="export-dialog-text">Pilih tampilan yang akan diexport:</p>
                <div class="export-option-card" :class="{ 'active': exportTarget === 'grid' }" @click="exportTarget = 'grid'">
                    <div class="export-option-icon"><i class="pi pi-table"></i></div>
                    <div class="export-option-info"><strong>Grid View</strong><small>Export data tabel</small></div>
                    <i class="pi pi-check-circle check-icon" v-if="exportTarget === 'grid'"></i>
                </div>
                <div class="export-option-card" :class="{ 'active': exportTarget === 'pivot' }" @click="exportTarget = 'pivot'">
                    <div class="export-option-icon"><i class="pi pi-chart-bar"></i></div>
                    <div class="export-option-info"><strong>Pivot</strong><small>Export hasil pivot</small></div>
                    <i class="pi pi-check-circle check-icon" v-if="exportTarget === 'pivot'"></i>
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
import { useAuthStore } from '~/stores/auth'
import NumericFilter from '~/components/report/NumericFilter.vue'

definePageMeta({ layout: 'default' })

const { $api } = useNuxtApp()
const toast = useToast()
const authStore = useAuthStore()

const loading = ref(false)
const data = ref<any[]>([])
const startDate = ref(new Date(new Date().getFullYear(), new Date().getMonth(), 1))
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
const numericFilters = ref<Record<string, any>>({})

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
    if (isAdmin.value) f.push({ label: 'HPP', value: 'Hpp' },{ label: 'Margin', value: 'Margin' })
    return f
})
const pivotRowLabel = computed(() => pivotFields.find(f => f.value === pivotRow.value)?.label || '')

const gridColumns = computed(() => {
    const cols: any[] = [
        { field: 'Nota', header: 'Nota', width: '130px', minWidth: '110px' },
        { field: 'Tanggal', header: 'Tanggal', width: '100px', minWidth: '85px' },
        { field: 'Bulan', header: 'Bln', width: '50px', minWidth: '45px', align: 'center' },
        { field: 'Tahun', header: 'Thn', width: '50px', minWidth: '45px', align: 'center' },
        { field: 'Customer', header: 'Customer', width: '170px', minWidth: '140px' },
        { field: 'Kode', header: 'Kode', width: '100px', minWidth: '85px' },
        { field: 'Nama', header: 'Nama Barang', width: '200px', minWidth: '160px' },
        { field: 'Satuan', header: 'Sat', width: '55px', minWidth: '50px', align: 'center' },
        { field: 'Kategori', header: 'Kategori', width: '100px', minWidth: '85px' },
        { field: 'Qty', header: 'Qty', width: '70px', minWidth: '60px', align: 'right', type: 'number' },
        { field: 'Nilai', header: 'Nilai', width: '130px', minWidth: '110px', align: 'right', type: 'currency' },
        { field: 'Disc', header: 'Disc', width: '100px', minWidth: '85px', align: 'right', type: 'currency' },
    ]
    if (isAdmin.value) { cols.push({ field: 'Hpp', header: 'HPP', width: '120px', minWidth: '100px', align: 'right', type: 'currency' },{ field: 'Margin', header: 'Margin', width: '120px', minWidth: '100px', align: 'right', type: 'currency' }) }
    return cols
})

const currencyFields = ['Nilai', 'Disc', 'Hpp', 'Margin']
const isCurrencyField = (f: string) => currencyFields.includes(f)
const isNumericField = (col: any) => col.type === 'number' || col.type === 'currency' || isCurrencyField(col.field)
const filterableColumns = [{ field: 'Nota', header: 'Nota' },{ field: 'Customer', header: 'Customer' },{ field: 'Kode', header: 'Kode' },{ field: 'Nama', header: 'Nama' },{ field: 'Kategori', header: 'Kategori' }]

const activeFiltersCount = computed(() => {
    let c = 0;
    Object.keys(activeColumnFilters.value).forEach(k => { if (activeColumnFilters.value[k]?.length > 0) c++; });
    Object.keys(activeTextFilters.value).forEach(k => { if (activeTextFilters.value[k]?.trim()) c++; });
    Object.keys(numericFilters.value).forEach(k => { if (numericFilters.value[k]) c++; });
    return c;
})

const filteredData = computed(() => {
    let r = [...data.value]
    if (searchKeyword.value) { const kw = searchKeyword.value.toLowerCase(); r = r.filter(row => Object.values(row).some(v => String(v).toLowerCase().includes(kw))) }
    Object.keys(activeColumnFilters.value).forEach(f => { const v = activeColumnFilters.value[f]; if (v?.length > 0) r = r.filter(row => v.includes(String(row[f]))) })
    Object.keys(activeTextFilters.value).forEach(f => { const v = activeTextFilters.value[f]?.toLowerCase(); if (v) r = r.filter(row => String(row[f]||'').toLowerCase().includes(v)) })
    Object.keys(numericFilters.value).forEach(field => {
        const filter = numericFilters.value[field]; if (!filter) return
        r = r.filter(row => {
            const val = parseFloat(row[field]) || 0; const v1 = parseFloat(filter.value1) || 0; const v2 = parseFloat(filter.value2) || 0
            switch (filter.operator) { case 'eq': return val === v1; case 'neq': return val !== v1; case 'gt': return val > v1; case 'gte': return val >= v1; case 'lt': return val < v1; case 'lte': return val <= v1; case 'between': return val >= v1 && val <= v2; default: return true; }
        })
    })
    return r
})

const totalQty = computed(() => filteredData.value.reduce((s, r) => s + (parseFloat(r.Qty) || 0), 0))
const totalNilai = computed(() => filteredData.value.reduce((s, r) => s + (parseFloat(r.Nilai) || 0), 0))
const totalHpp = computed(() => filteredData.value.reduce((s, r) => s + (parseFloat(r.Hpp) || 0), 0))
const totalMargin = computed(() => filteredData.value.reduce((s, r) => s + (parseFloat(r.Margin) || 0), 0))

const formatCurrency = (v: any) => { if (!v && v !== 0) return '-'; return 'Rp ' + Math.round(parseFloat(v)).toLocaleString('id-ID') }
const formatNumber = (v: any) => { if (!v && v !== 0) return '-'; return Math.round(parseFloat(v)).toLocaleString('id-ID') }
const formatPivotValue = (v: any) => pivotData.value === 'Nilai' || pivotData.value === 'Disc' || pivotData.value === 'Hpp' || pivotData.value === 'Margin' ? formatCurrency(v) : formatNumber(v)
const formatDate = (d: Date): string => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`

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
const applyTextFilters = () => { activeTextFilters.value = {}; filterableColumns.forEach(c => { if (textFilters.value[c.field]?.trim()) activeTextFilters.value[c.field] = textFilters.value[c.field].trim() }); showTextFilter.value = false; }
const clearAllFilters = () => { searchKeyword.value = ''; activeColumnFilters.value = {}; activeTextFilters.value = {}; textFilters.value = {}; tempColumnFilters.value = {}; numericFilters.value = {} }
const buildFilterOptions = () => { filterableColumns.forEach(col => { const m = new Map<string, number>(); data.value.forEach(r => { const v = String(r[col.field] || ''); if (v) m.set(v, (m.get(v) || 0) + 1) }); filterOptionsCache.value[col.field] = Array.from(m.entries()).map(([v, c]) => ({ value: v, label: v, count: c })).sort((a, b) => a.label.localeCompare(b.label)) }) }
const setFilterOverlayRef = (f: string, el: any) => { if (el) filterOverlays.value[f] = el }
const openColumnFilter = (col: any, e: Event) => { const o = filterOverlays.value[col.field]; if (o) { if (!isNumericField(col) && !tempColumnFilters.value[col.field]) tempColumnFilters.value[col.field] = [...(activeColumnFilters.value[col.field] || [])]; o.toggle(e) } }
const closeFilterPanel = (f: string) => filterOverlays.value[f]?.hide()
const onFilterPanelHide = (f: string) => { tempColumnFilters.value[f] = [...(activeColumnFilters.value[f] || [])] }
const getFilteredOptions = (f: string) => { const o = filterOptionsCache.value[f] || []; const t = filterSearchTerms.value[f]?.toLowerCase() || ''; return t ? o.filter(opt => opt.label.toLowerCase().includes(t)) : o }
const selectAll = (f: string) => { tempColumnFilters.value[f] = (filterOptionsCache.value[f] || []).map(o => o.value) }
const clearFilter = (f: string) => { tempColumnFilters.value[f] = [] }
const hasColumnFilter = (f: string) => activeColumnFilters.value[f]?.length > 0
const applyColumnFilter = (f: string) => { activeColumnFilters.value[f] = [...(tempColumnFilters.value[f] || [])]; closeFilterPanel(f) }
const applyNumericFilter = (field: string, filter: any) => { if (filter) numericFilters.value[field] = filter; else delete numericFilters.value[field]; closeFilterPanel(field) }

const exportExcel = () => { exportType.value = 'excel'; exportDialog.value = true }
const exportPDF = () => { exportType.value = 'pdf'; exportDialog.value = true }
const exportCSV = () => { exportType.value = 'csv'; exportDialog.value = true }

const proceedExport = () => { exportDialog.value = false; if (exportType.value === 'excel') doExportExcel(); else if (exportType.value === 'pdf') doExportPDF(); else doExportCSV() }

const doExportCSV = () => {
    let csv = '\uFEFF'
    if (exportTarget.value === 'grid') { csv += gridColumns.value.map(c => `"${c.header}"`).join(',') + '\n'; filteredData.value.forEach(r => csv += gridColumns.value.map(c => `"${String(r[c.field] || '').replace(/"/g, '""')}"`).join(',') + '\n') }
    else { csv += `"${pivotRowLabel.value}","${pivotResult.value.columns.join('","')}","Total"\n`; pivotResult.value.rows.forEach(r => csv += `"${r.label}","${pivotResult.value.columns.map((c: string) => r.values[c] || 0).join('","')}","${r.total}"\n`) }
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `Penjualan_Per_Item_${formatDate(new Date())}.csv`; a.click(); URL.revokeObjectURL(url)
    toast.add({ severity: 'success', summary: 'CSV', detail: 'Berhasil', life: 2000 })
}

const doExportPDF = () => {
    const period = `${startDate.value.toLocaleDateString('id-ID')} - ${endDate.value.toLocaleDateString('id-ID')}`
    let html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>body{font-family:Arial;padding:12px;font-size:8px}h1{font-size:13px;text-align:center;color:#059669}table{width:100%;border-collapse:collapse}th{background:#10b981;color:#fff;padding:3px;border:1px solid #059669;font-size:6px}td{padding:2px 3px;border:1px solid #e5e7eb;font-size:7px}.r{text-align:right}</style></head><body><h1>Penjualan Per Item</h1><p style="text-align:center;color:#6b7280">${period}</p>`
    if (exportTarget.value === 'grid') { html += `<table><thead><tr>${gridColumns.value.map(c => `<th>${c.header}</th>`).join('')}</tr></thead><tbody>`; filteredData.value.forEach(r => html += `<tr>${gridColumns.value.map(c => `<td class="${c.align === 'right' ? 'r' : ''}">${isCurrencyField(c.field) ? formatCurrency(r[c.field]) : c.field === 'Qty' ? formatNumber(r[c.field]) : r[c.field] || ''}</td>`).join('')}</tr>`); html += `</tbody></table>` }
    else { html += `<table><thead><tr><th>${pivotRowLabel}</th>${pivotResult.value.columns.map(c => `<th>${c}</th>`).join('')}<th>Total</th></tr></thead><tbody>`; pivotResult.value.rows.forEach(r => html += `<tr><td>${r.label}</td>${pivotResult.value.columns.map(c => `<td class="r">${formatPivotValue(r.values[c])}</td>`).join('')}<td class="r"><strong>${formatPivotValue(r.total)}</strong></td></tr>`); html += `</tbody></table>` }
    html += `</body></html>`
    const win = window.open('', '_blank', 'width=1000,height=700'); if (win) { win.document.write(html); win.document.close() }
    toast.add({ severity: 'success', summary: 'Print', detail: 'Gunakan Print > Save as PDF', life: 3000 })
}

const doExportExcel = async () => {
    const ExcelJS = await import('exceljs'); const wb = new ExcelJS.Workbook()
    const hs: any = { font: { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 }, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF10B981' } }, alignment: { horizontal: 'center', vertical: 'middle' } }
    const ds: any = { font: { size: 9 } }; const ns: any = { ...ds, alignment: { horizontal: 'right' }, numFmt: '#,##0' }
    if (exportTarget.value === 'grid') {
        const ws = wb.addWorksheet('Penjualan Per Item'); ws.getRow(1).height = 22; ws.getRow(4).height = 22
        gridColumns.value.forEach((c, i) => { const cell = ws.getRow(4).getCell(i + 1); cell.value = c.header; cell.style = hs })
        filteredData.value.forEach((r, i) => { const dr = ws.getRow(5 + i); gridColumns.value.forEach((c, ci) => { const cell = dr.getCell(ci + 1); const isNum = isCurrencyField(c.field) || c.field === 'Qty'; cell.value = isNum ? (parseFloat(r[c.field]) || 0) : String(r[c.field] ?? ''); cell.style = isNum ? ns : ds }) })
        ws.autoFilter = { from: 'A4', to: `${String.fromCharCode(64 + gridColumns.value.length)}${4 + filteredData.value.length}` }; ws.views = [{ state: 'frozen', ySplit: 4 }]
    } else {
        const ws = wb.addWorksheet('Pivot'); ws.getRow(3).getCell(1).value = pivotRowLabel.value; ws.getRow(3).getCell(1).style = hs
        pivotResult.value.columns.forEach((c, i) => { const cell = ws.getRow(3).getCell(i + 2); cell.value = String(c); cell.style = hs })
        ws.getRow(3).getCell(pivotResult.value.columns.length + 2).value = 'Total'; ws.getRow(3).getCell(pivotResult.value.columns.length + 2).style = hs
        pivotResult.value.rows.forEach((r, i) => { const dr = ws.getRow(4 + i); dr.getCell(1).value = r.label; dr.getCell(1).style = { ...ds, font: { bold: true } }; pivotResult.value.columns.forEach((c, ci) => { dr.getCell(ci + 2).value = r.values[c] || 0; dr.getCell(ci + 2).style = ns }); dr.getCell(pivotResult.value.columns.length + 2).value = r.total; dr.getCell(pivotResult.value.columns.length + 2).style = { ...ns, font: { bold: true } } })
    }
    const buf = await wb.xlsx.writeBuffer(); const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `Penjualan_Per_Item_${formatDate(new Date())}.xlsx`; a.click(); URL.revokeObjectURL(url)
    toast.add({ severity: 'success', summary: 'Excel', detail: 'Berhasil', life: 2000 })
}

onMounted(() => { resetTextFilters(); loadData() })
</script>

<style lang="scss" scoped>
.report-page { height: 100%; display: flex; flex-direction: column; overflow: hidden; }
.main-card { flex: 1; display: flex; flex-direction: column; background: var(--surface-card); border-radius: 0.5rem; border: 1px solid var(--surface-border); overflow: hidden; min-height: 0; }

.toolbar { display: flex; align-items: center; gap: 0.5rem; padding: 0.45rem 0.65rem; border-bottom: 1px solid var(--surface-border); background: var(--surface-50); flex-shrink: 0; flex-wrap: wrap; }
.search-box { display: flex; align-items: center; background: var(--surface-0); border: 1px solid var(--surface-border); border-radius: 0.35rem; padding: 0 0.35rem; height: 1.85rem; width: 200px; flex-shrink: 0; i { font-size: 0.7rem; color: var(--text-color-secondary); } .clear-btn { cursor: pointer; margin-left: auto; } .search-input { flex: 1; border: none; background: transparent; padding: 0 0.3rem; font-size: 0.75rem; outline: none; color: var(--text-color); &::placeholder { color: var(--text-color-secondary); } } }
.filter-item { display: flex; align-items: center; gap: 0.35rem; flex-shrink: 0; .filter-label { font-size: 0.68rem; font-weight: 600; color: var(--text-color-secondary); white-space: nowrap; } .date-sep { font-size: 0.68rem; color: var(--text-color-secondary); } :deep(.p-datepicker) { width: 125px; .p-datepicker-input { font-size: 0.73rem; height: 1.85rem; padding: 0 0.35rem; } } }
.filter-active { background: var(--primary-100) !important; color: var(--primary-700) !important; }
.actions { display: flex; gap: 0.1rem; margin-left: auto; flex-shrink: 0; align-items: center; :deep(.p-button) { width: 1.65rem !important; height: 1.65rem !important; } }

.text-filter-panel { padding: 0.5rem 0.65rem; border-bottom: 1px solid var(--surface-border); background: var(--surface-0); display: flex; align-items: flex-end; gap: 0.5rem; flex-wrap: wrap; flex-shrink: 0; .text-filter-grid { display: flex; gap: 0.35rem; flex-wrap: wrap; flex: 1; } .text-filter-input { height: 1.75rem; padding: 0 0.4rem; border: 1px solid var(--surface-border); border-radius: 0.3rem; font-size: 0.72rem; outline: none; width: 140px; } .text-filter-actions { display: flex; gap: 0.25rem; flex-shrink: 0; } }

.tab-buttons { display: flex; border-bottom: 2px solid var(--surface-border); flex-shrink: 0; button { padding: 0.45rem 1.25rem; border: none; background: transparent; font-size: 0.78rem; font-weight: 500; color: var(--text-color-secondary); cursor: pointer; border-bottom: 2px solid transparent; margin-bottom: -2px; i { margin-right: 0.4rem; font-size: 0.8rem; } &:hover { color: var(--primary-600); } &.active { color: var(--primary-600); border-bottom-color: var(--primary-500); font-weight: 600; } } }

.table-area { flex: 1; overflow: hidden; min-height: 0; display: flex; flex-direction: column; }

.data-table { flex: 1; display: flex; flex-direction: column; min-height: 0;
    :deep(.p-datatable-wrapper) { flex: 1; overflow: auto; min-height: 0; }
    :deep(.p-datatable-thead > tr > th) { background: var(--surface-50); font-size: 0.68rem; font-weight: 700; text-transform: uppercase; color: var(--text-color-secondary); padding: 0.35rem 0.45rem !important; border-bottom: 2px solid var(--surface-border); white-space: nowrap; letter-spacing: 0.03em; position: sticky; top: 0; z-index: 2; }
    :deep(.p-datatable-tbody > tr > td) { padding: 0.25rem 0.45rem; font-size: 0.75rem; white-space: nowrap; }
    :deep(.p-datatable-tbody > tr:hover) { background: var(--surface-50); }
    :deep(.p-datatable-tfoot > tr > td) { padding: 0.35rem 0.45rem; font-size: 0.72rem; font-weight: 700; background: var(--surface-100); border-top: 2px solid var(--primary-300); color: var(--primary-700); white-space: nowrap; position: sticky; bottom: 0; z-index: 2; }
    :deep(.p-paginator) { padding: 0.25rem 0.4rem; font-size: 0.7rem; border-top: 1px solid var(--surface-border); flex-shrink: 0; background: var(--surface-card); .p-paginator-page, .p-paginator-first, .p-paginator-prev, .p-paginator-next, .p-paginator-last { min-width: 1.5rem; height: 1.5rem; font-size: 0.7rem; } }
    :deep(.p-sortable-column-icon) { font-size: 0.6rem !important; width: 1.25rem; height: 1.25rem; display: inline-flex; align-items: center; justify-content: center; }
}

.col-header { display: flex; align-items: center; width: 100%; .col-title { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; } .col-icons { display: flex; align-items: center; gap: 0.15rem; flex-shrink: 0; margin-left: auto; } }
.col-filter-btn { width: 1.25rem; height: 1.25rem; border-radius: 0.2rem; border: none; background: transparent; cursor: pointer; display: flex; align-items: center; justify-content: center; opacity: 0; transition: all 0.12s; flex-shrink: 0; color: var(--text-color-secondary); i { font-size: 0.6rem; } &:hover { background: var(--surface-200); } &.active { opacity: 1; background: var(--primary-100); color: var(--primary-700); } }
.col-header:hover .col-filter-btn { opacity: 1; }

.text-currency { font-weight: 600; color: var(--primary-600); }
.text-number { font-weight: 500; }
.footer-label { font-weight: 700; color: var(--primary-700); }
.footer-value { font-weight: 700; color: var(--primary-700); }

.mini-filter { width: 230px; display: flex; flex-direction: column; .mini-filter-head { display: flex; align-items: center; justify-content: space-between; padding: 0.45rem 0.65rem; border-bottom: 1px solid var(--surface-border); font-weight: 600; font-size: 0.76rem; } .mini-filter-search { position: relative; padding: 0.35rem 0.65rem; border-bottom: 1px solid var(--surface-border); i { position: absolute; left: 1.05rem; top: 50%; transform: translateY(-50%); font-size: 0.65rem; } .mini-filter-input { width: 100%; height: 1.55rem; padding: 0 0.35rem 0 1.5rem; border: 1px solid var(--surface-border); border-radius: 0.25rem; font-size: 0.7rem; outline: none; } } .mini-filter-actions { display: flex; justify-content: space-between; padding: 0.25rem 0.65rem; border-bottom: 1px solid var(--surface-border); button { background: none; border: none; font-size: 0.65rem; color: var(--primary-600); cursor: pointer; font-weight: 500; } } .mini-filter-list { max-height: 160px; overflow-y: auto; padding: 0.15rem 0; } .mini-filter-opt { display: flex; align-items: center; gap: 0.35rem; padding: 0.25rem 0.65rem; cursor: pointer; font-size: 0.7rem; &:hover { background: var(--surface-50); } input[type="checkbox"] { width: 0.75rem; height: 0.75rem; accent-color: var(--primary-500); } span { flex: 1; } small { color: var(--text-color-secondary); font-size: 0.62rem; } } .mini-filter-empty { padding: 1.25rem; text-align: center; color: var(--text-color-secondary); font-size: 0.7rem; } .mini-filter-foot { padding: 0.35rem 0.65rem; border-top: 1px solid var(--surface-border); } }

.pivot-select { width: 130px; :deep(.p-select) { height: 1.85rem; .p-select-label { font-size: 0.73rem; } } }
.pivot-controls { display: flex; gap: 0.5rem; padding: 0.5rem 0.65rem; border-bottom: 1px solid var(--surface-border); background: var(--surface-0); flex-shrink: 0; flex-wrap: wrap; }
.pivot-table-wrapper { flex: 1; overflow: auto; min-height: 0; padding: 0.5rem; }
.pivot-table { width: 100%; border-collapse: collapse; font-size: 0.75rem; th, td { padding: 0.35rem 0.5rem; border: 1px solid var(--surface-border); text-align: right; } .pivot-corner, .pivot-row-header { text-align: left; font-weight: 600; background: var(--surface-50); } .pivot-col-header { background: var(--primary-50); color: var(--primary-700); font-weight: 600; } .pivot-total-header, .pivot-total-cell { font-weight: 700; background: var(--surface-100); } .pivot-grand-total { font-weight: 700; background: var(--primary-100); color: var(--primary-700); } }

.export-option-card { display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem 1rem; border: 2px solid var(--surface-border); border-radius: 0.625rem; cursor: pointer; transition: all 0.15s; + .export-option-card { margin-top: 0.5rem; } .export-option-icon { width: 2.5rem; height: 2.5rem; border-radius: 0.5rem; display: flex; align-items: center; justify-content: center; flex-shrink: 0; background: var(--surface-100); i { font-size: 1.2rem; } } .export-option-info { flex: 1; strong { display: block; font-size: 0.85rem; } small { font-size: 0.7rem; color: var(--text-color-secondary); } } .check-icon { font-size: 1.2rem; color: var(--primary-500); opacity: 0; } &:hover { border-color: var(--primary-300); background: var(--primary-50); } &.active { border-color: var(--primary-500); background: var(--primary-50); .check-icon { opacity: 1; } } }

.table-empty { display: flex; flex-direction: column; align-items: center; padding: 2.5rem; color: var(--text-color-secondary); gap: 0.5rem; i { font-size: 2rem; } span { font-size: 0.8rem; } }

@media (max-width: 900px) { .toolbar { gap: 0.35rem; padding: 0.35rem 0.5rem; } }
@media (max-width: 640px) { .search-box { width: 100%; } .filter-item { flex-wrap: wrap; .filter-label { width: 100%; } } .text-filter-input { width: 100%; } }
@media (max-width: 768px) { .data-table { :deep(.p-datatable-thead > tr > th) { font-size: 0.63rem; padding: 0.25rem 0.35rem !important; } :deep(.p-datatable-tbody > tr > td) { font-size: 0.7rem; padding: 0.2rem 0.35rem; } } }
</style>