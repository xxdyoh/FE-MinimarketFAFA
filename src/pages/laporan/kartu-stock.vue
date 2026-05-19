<template>
    <div class="report-page">
        <!-- Header -->
        <div class="report-header">
            <div class="header-left">
                <div class="header-icon"><i class="pi pi-chart-line"></i></div>
                <div class="header-text">
                    <h1>Laporan Kartu Stock</h1>
                    <!-- <p>Rekap mutasi stok per barang</p> -->
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

            <!-- Date & Gudang Filter -->
            <div class="date-filter-row">
                <div class="date-item"><label>Tanggal Mulai</label><DatePicker v-model="startDate" dateFormat="yy-mm-dd" showIcon size="small" /></div>
                <div class="date-item"><label>Tanggal Akhir</label><DatePicker v-model="endDate" dateFormat="yy-mm-dd" showIcon size="small" /></div>
                <div class="date-item"><label>Gudang</label><Select v-model="filterGudang" :options="gudangList" optionLabel="nama" optionValue="kode" placeholder="Semua Gudang" size="small" showClear class="w-48" /></div>
            </div>

            <!-- DataTable -->
            <DataTable :value="filteredData" :loading="loading" class="report-table" stripedRows size="small" showGridlines
                paginator :rows="25" :rowsPerPageOptions="[10,25,50,100]" sortField="Kode" :sortOrder="1"
                scrollable scrollDirection="horizontal" responsiveLayout="scroll">
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
                    <template v-else-if="col.type === 'number'" #body="{ data }"><span class="number-text">{{ formatNumber(data[col.field]) }}</span></template>
                </Column>

                <template #footer>
                    <div class="footer-summary-row">
                        <span class="footer-value currency-text">Rp Awal: {{ formatCurrency(totalRpAwal) }}</span>
                        <span class="footer-value currency-text">Rp Akhir: {{ formatCurrency(totalRpAkhir) }}</span>
                    </div>
                </template>
            </DataTable>
        </div>

        <!-- Export Dialog -->
        <Dialog v-model:visible="exportDialog" header="Export Laporan" :modal="true" :style="{ width: '400px' }">
            <div class="export-dialog-content">
                <p class="export-dialog-text">Export laporan kartu stock:</p>
                <div class="export-options">
                    <div class="export-option active">
                        <div class="option-icon"><i class="pi pi-table"></i></div>
                        <div class="option-text"><strong>Grid View</strong><small>Export data tabel</small></div>
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

definePageMeta({ layout: 'default' })

const { $api } = useNuxtApp()
const toast = useToast()

const loading = ref(false)
const data = ref<any[]>([])
const startDate = ref(new Date(new Date().setDate(new Date().getDate() - 30)))
const endDate = ref(new Date())
const filterGudang = ref(null)
const gudangList = ref<any[]>([])
const searchKeyword = ref('')
const showTextFilter = ref(false)
const textFilters = ref<Record<string, string>>({})
const activeTextFilters = ref<Record<string, string>>({})

const filterOverlays = ref<Record<string, any>>({})
const tempColumnFilters = ref<Record<string, any[]>>({})
const activeColumnFilters = ref<Record<string, any[]>>({})
const filterSearchTerms = ref<Record<string, string>>({})
const filterOptionsCache = ref<Record<string, any[]>>({})

const exportDialog = ref(false)
const exportType = ref('excel')

const gridColumns = [
    { field: 'Kode', header: 'Kode', width: '90px' },
    { field: 'Nama', header: 'Nama Barang', width: '220px' },
    { field: 'Kategori', header: 'Kategori', width: '120px' },
    { field: '_Awal', header: 'Stok Awal', width: '80px', align: 'right', type: 'number' },
    { field: 'Rp_Awal', header: 'Rp Awal', width: '130px', align: 'right' },
    { field: 'Penjualan', header: 'Penjualan', width: '90px', align: 'right', type: 'number' },
    { field: 'Mutasi_in', header: 'Mutasi In', width: '80px', align: 'right', type: 'number' },
    { field: 'Mutasi_out', header: 'Mutasi Out', width: '80px', align: 'right', type: 'number' },
    { field: 'Penerimaan', header: 'Terima', width: '80px', align: 'right', type: 'number' },
    { field: 'Koreksi', header: 'Koreksi', width: '70px', align: 'right', type: 'number' },
    { field: 'Pemusnahan', header: 'Musnah', width: '70px', align: 'right', type: 'number' },
    { field: 'Repacking', header: 'Repack', width: '70px', align: 'right', type: 'number' },
    { field: 'Retur_Beli', header: 'Retur Beli', width: '80px', align: 'right', type: 'number' },
    { field: '_Akhir', header: 'Stok Akhir', width: '80px', align: 'right', type: 'number' },
    { field: 'Rp_Akhir', header: 'Rp Akhir', width: '130px', align: 'right' },
]

const currencyFields = ['Rp_Awal', 'Rp_Akhir']
const isCurrencyField = (f: string) => currencyFields.includes(f)
const filterableColumns = [
    { field: 'Kode', header: 'Kode' },
    { field: 'Nama', header: 'Nama' },
    { field: 'Kategori', header: 'Kategori' },
]

const activeFiltersCount = computed(() => Object.keys(activeColumnFilters.value).filter(k => activeColumnFilters.value[k]?.length > 0).length + Object.keys(activeTextFilters.value).filter(k => activeTextFilters.value[k]?.trim()).length)

const filteredData = computed(() => {
    let r = [...data.value]
    if (searchKeyword.value) { const kw = searchKeyword.value.toLowerCase(); r = r.filter(row => Object.values(row).some(v => String(v).toLowerCase().includes(kw))) }
    Object.keys(activeColumnFilters.value).forEach(f => { const v = activeColumnFilters.value[f]; if (v?.length > 0) r = r.filter(row => v.includes(String(row[f]))) })
    Object.keys(activeTextFilters.value).forEach(f => { const v = activeTextFilters.value[f]?.toLowerCase(); if (v) r = r.filter(row => String(row[f]||'').toLowerCase().includes(v)) })
    return r
})

const totalRpAwal = computed(() => filteredData.value.reduce((s, r) => s + (parseFloat(r.Rp_Awal) || 0), 0))
const totalRpAkhir = computed(() => filteredData.value.reduce((s, r) => s + (parseFloat(r.Rp_Akhir) || 0), 0))

const formatCurrency = (v: any) => { if (!v && v !== 0) return '-'; return 'Rp ' + Math.round(parseFloat(v)).toLocaleString('id-ID') }
const formatNumber = (v: any) => { if (!v && v !== 0) return '-'; return Math.round(parseFloat(v)).toLocaleString('id-ID') }
const formatDate = (d: Date) => d.toISOString().split('T')[0]

const loadData = async () => {
    loading.value = true
    try {
        const params: any = { start_date: formatDate(startDate.value), end_date: formatDate(endDate.value) }
        if (filterGudang.value) params.gudang = filterGudang.value
        const res = await $api.get('/v1/report/kartu-stock', { params })
        if (res.data.success) { data.value = res.data.data; buildFilterOptions() }
    } catch (e: any) { toast.add({ severity: 'error', summary: 'Gagal', detail: e.response?.data?.message || 'Gagal', life: 3000 }) }
    finally { loading.value = false }
}

const loadGudang = async () => {
    try { const res = await $api.get('/gudang'); gudangList.value = res.data.data || [] } catch (e) { console.error(e) }
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

// Export
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
    let csv = '\uFEFF' + gridColumns.map(c => `"${c.header}"`).join(',') + '\n'
    const exportData = [...filteredData.value]
    exportData.forEach(r => csv += gridColumns.map(c => `"${String(r[c.field] || '').replace(/"/g, '""')}"`).join(',') + '\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' }); const url = URL.createObjectURL(blob); const a = document.createElement('a')
    a.href = url; a.download = `Kartu_Stock_${formatDate(new Date())}.csv`; a.click(); URL.revokeObjectURL(url)
    toast.add({ severity: 'success', summary: 'Export CSV', detail: 'Berhasil', life: 2000 })
}

const doExportPDF = () => {
    const period = `${startDate.value.toLocaleDateString('id-ID')} - ${endDate.value.toLocaleDateString('id-ID')}`
    let html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Kartu Stock</title><style>body{font-family:Arial;padding:15px}h1{font-size:16px;text-align:center;color:#059669}.period{text-align:center;font-size:11px;color:#6b7280;margin-bottom:10px}table{width:100%;border-collapse:collapse;font-size:9px}th{background:#10b981;color:white;padding:5px 6px;border:1px solid #059669;font-size:8px}td{padding:4px 6px;border:1px solid #e5e7eb}.tr{text-align:right}</style></head><body><h1>Laporan Kartu Stock</h1><div class="period">Periode: ${period}</div><table><thead><tr>${gridColumns.map(c => `<th>${c.header}</th>`).join('')}</tr></thead><tbody>`
    filteredData.value.forEach(r => html += `<tr>${gridColumns.map(c => `<td class="${c.align === 'right' ? 'tr' : ''}">${isCurrencyField(c.field) ? formatCurrency(r[c.field]) : (c.type === 'number' ? formatNumber(r[c.field]) : (r[c.field] || ''))}</td>`).join('')}</tr>`)
    html += `</tbody></table><p style="text-align:right;font-size:8px;color:#9ca3af;margin-top:15px">Dicetak: ${new Date().toLocaleDateString('id-ID')}</p></body></html>`
    const win = window.open('', '_blank', 'width=1100,height=700')
    if (win) { win.document.write(html); win.document.close() }
    toast.add({ severity: 'success', summary: 'Preview PDF', detail: 'Gunakan Print > Save as PDF', life: 3000 })
}

const doExportExcel = async () => {
    const ExcelJS = await import('exceljs'); const wb = new ExcelJS.Workbook()
    const hs: any = { font: { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 }, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF10B981' } }, alignment: { horizontal: 'center', vertical: 'middle' }, border: { top: { style: 'thin', color: { argb: 'FF059669' } }, bottom: { style: 'thin', color: { argb: 'FF059669' } }, left: { style: 'thin', color: { argb: 'FF059669' } }, right: { style: 'thin', color: { argb: 'FF059669' } } } }
    const ds: any = { font: { size: 10 }, border: { top: { style: 'thin', color: { argb: 'FFD1D5DB' } }, bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } }, left: { style: 'thin', color: { argb: 'FFD1D5DB' } }, right: { style: 'thin', color: { argb: 'FFD1D5DB' } } } }
    const ns: any = { ...ds, alignment: { horizontal: 'right', vertical: 'middle' }, numFmt: '#,##0' }
    const ws = wb.addWorksheet('Kartu Stock')
    ws.mergeCells('A1:O1'); ws.getCell('A1').value = 'LAPORAN KARTU STOCK'; ws.getCell('A1').style = { font: { bold: true, size: 14 } }; ws.getRow(1).height = 30
    ws.mergeCells('A2:O2'); ws.getCell('A2').value = `Periode: ${startDate.value.toLocaleDateString('id-ID')} - ${endDate.value.toLocaleDateString('id-ID')}`; ws.getCell('A2').style = { font: { size: 10, color: { argb: 'FF6B7280' } } }
    ws.getRow(4).height = 25; gridColumns.forEach((c, i) => { const cell = ws.getRow(4).getCell(i + 1); cell.value = c.header; cell.style = hs })
    const exportData = [...filteredData.value]
    exportData.forEach((r, i) => {
        const dr = ws.getRow(5 + i)
        gridColumns.forEach((c, ci) => { const cell = dr.getCell(ci + 1); const isNum = isCurrencyField(c.field) || c.type === 'number'; cell.value = isNum ? (parseFloat(r[c.field]) || 0) : String(r[c.field] ?? ''); cell.style = isNum ? ns : ds })
    })
    ws.autoFilter = { from: { row: 4, column: 1 }, to: { row: 4 + exportData.length, column: gridColumns.length } }; ws.views = [{ state: 'frozen', ySplit: 4 }]
    const buf = await wb.xlsx.writeBuffer(); const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = URL.createObjectURL(blob); const a = document.createElement('a')
    a.href = url; a.download = `Kartu_Stock_${formatDate(new Date())}.xlsx`; a.click(); URL.revokeObjectURL(url)
    toast.add({ severity: 'success', summary: 'Export Excel', detail: 'Berhasil', life: 2000 })
}

onMounted(() => { resetTextFilters(); loadGudang(); loadData() })
</script>

<style lang="scss" scoped>
.report-page { padding: 1rem; display: flex; flex-direction: column; gap: 1rem; }
.report-header { display: flex; align-items: center; justify-content: space-between; padding: 1.25rem 1.5rem; background: var(--surface-card); border-radius: 0.75rem; border: 1px solid var(--surface-border); .header-left { display: flex; align-items: center; gap: 1rem; } .header-icon { width: 2.75rem; height: 2.75rem; background: var(--primary-50); border-radius: 0.625rem; display: flex; align-items: center; justify-content: center; color: var(--primary-600); font-size: 1.25rem; } h1 { font-size: 1.25rem; font-weight: 700; color: var(--text-color); margin: 0; } p { font-size: 0.813rem; color: var(--text-color-secondary); margin: 0.25rem 0 0 0; } .header-actions { display: flex; gap: 0.5rem; } }
.report-card { background: var(--surface-card); border-radius: 0.75rem; border: 1px solid var(--surface-border); overflow: hidden; }
.browse-toolbar { display: flex; align-items: center; justify-content: space-between; padding: 0.5rem 0.75rem; border-bottom: 1px solid var(--surface-border); background: var(--surface-50); .toolbar-left { display: flex; align-items: center; gap: 0.75rem; } .search-input { width: 260px; } .active-filters { display: flex; align-items: center; gap: 0.375rem; padding: 0.2rem 0.75rem; background: var(--surface-200); border-radius: 1rem; font-size: 0.75rem; } .toolbar-right { display: flex; align-items: center; gap: 0.25rem; } .filter-active { background: var(--primary-100) !important; color: var(--primary-700) !important; } }
.text-filter-panel { padding: 0.75rem; border-bottom: 1px solid var(--surface-border); .text-filter-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 0.75rem; margin-bottom: 0.75rem; } .text-filter-item label { display: block; font-size: 0.7rem; font-weight: 600; color: var(--text-color-secondary); } .text-filter-footer { display: flex; justify-content: space-between; } }
.date-filter-row { display: flex; align-items: flex-end; gap: 1rem; padding: 0.75rem; border-bottom: 1px solid var(--surface-border); .date-item { display: flex; flex-direction: column; gap: 0.25rem; label { font-size: 0.7rem; font-weight: 600; color: var(--text-color-secondary); text-transform: uppercase; } } }
.report-table { :deep(.p-datatable-thead > tr > th) { background: var(--surface-50); font-size: 0.7rem; font-weight: 700; text-transform: uppercase; padding: 0.35rem 0.5rem !important; height: 2rem !important; border-bottom: 2px solid var(--surface-border); white-space: nowrap; } :deep(.p-datatable-tbody > tr > td) { padding: 0.25rem 0.5rem; font-size: 0.78rem; white-space: nowrap; } :deep(.p-datatable-table) { min-width: 1400px; } }
.column-header { display: flex; align-items: center; justify-content: space-between; gap: 0.25rem; .column-title { flex: 1; font-size: 0.7rem; } .filter-active { background: var(--primary-100) !important; color: var(--primary-700) !important; } :deep(.p-button) { width: 1.5rem !important; height: 1.5rem !important; .pi { font-size: 0.75rem !important; } } }
.currency-text { font-weight: 600; color: var(--primary-600); }
.number-text { font-weight: 500; }
.footer-summary-row { display: flex; justify-content: flex-end; gap: 1.5rem; padding: 0.4rem 0.75rem; .footer-value { font-weight: 700; font-size: 0.8rem; } }
.empty-state { display: flex; flex-direction: column; align-items: center; padding: 3rem; color: var(--text-color-secondary); i { font-size: 2.5rem; margin-bottom: 0.75rem; } }
.w-48 { width: 12rem; }
.export-dialog-content { .export-dialog-text { font-size: 0.9rem; color: var(--text-color-secondary); margin-bottom: 1.25rem; } .export-options { display: flex; flex-direction: column; gap: 0.75rem; } .export-option { display: flex; align-items: center; gap: 0.875rem; padding: 1rem 1.25rem; border: 2px solid var(--surface-border); border-radius: 0.75rem; .option-icon { width: 2.5rem; height: 2.5rem; background: var(--surface-100); border-radius: 0.625rem; display: flex; align-items: center; justify-content: center; i { font-size: 1.25rem; } } .option-text { strong { display: block; font-size: 0.9rem; } small { font-size: 0.75rem; color: var(--text-color-secondary); } } &.active { border-color: var(--primary-500); background: var(--primary-50); } } }
@media (max-width: 768px) { .report-header { flex-direction: column; align-items: flex-start; gap: 1rem; .header-actions { width: 100%; button { flex: 1; } } } }
</style>