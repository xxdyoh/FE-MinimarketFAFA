<template>
    <div class="report-page">
        <div class="main-card">
            <!-- Toolbar -->
            <div class="toolbar">
                <div class="search-box">
                    <i class="pi pi-search"></i>
                    <input v-model="searchKeyword" placeholder="Cari kode, nama..." class="search-input" />
                    <i v-if="searchKeyword" class="pi pi-times clear-btn" @click="searchKeyword = ''"></i>
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

            <!-- Table -->
            <div class="table-area">
                <DataTable
                    :value="filteredData" :loading="loading" stripedRows size="small" showGridlines
                    paginator :rows="25" :rowsPerPageOptions="[10, 25, 50, 100]"
                    sortField="Kode" :sortOrder="1"
                    scrollable scrollHeight="flex" scrollDirection="horizontal" responsiveLayout="scroll"
                    class="data-table"
                >
                    <template #empty>
                        <div class="table-empty"><i class="pi pi-inbox"></i><span>Tidak ada data</span></div>
                    </template>

                    <Column v-for="col in filterColumns" :key="col.field" :field="col.field" :sortable="col.sortable !== false" :style="{ width: col.width, minWidth: col.minWidth || '60px', textAlign: col.align || 'left' }">
                        <template #header>
                            <div class="col-header">
                                <span class="col-title">{{ col.header }}</span>
                                <div class="col-icons">
                                    <button class="col-filter-btn" :class="{ 'active': hasColumnFilter(col.field) || numericFilters[col.field] }" @click.stop="openColumnFilter(col, $event)">
                                        <i class="pi pi-filter"></i>
                                    </button>
                                </div>
                                <OverlayPanel :ref="(el) => setFilterOverlayRef(col.field, el)" @hide="onFilterPanelHide(col.field)">
                                    <!-- NUMERIC FILTER untuk number/currency -->
                                    <NumericFilter 
                                        v-if="isNumericField(col)"
                                        :label="col.header"
                                        :currentFilter="numericFilters[col.field]"
                                        @apply="(f: any) => applyNumericFilter(col.field, f)"
                                        @close="closeFilterPanel(col.field)"
                                    />
                                    <!-- MULTI-SELECT untuk text -->
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
                        <template v-if="col.type === 'currency'" #body="{ data }"><span class="text-currency">{{ formatCurrency(data[col.field]) }}</span></template>
                        <template v-else-if="col.type === 'number'" #body="{ data }"><span class="text-number">{{ formatNumber(data[col.field]) }}</span></template>
                        <!-- Footer TOTAL -->
                        <template v-if="col.field === 'Kode'" #footer><span class="footer-label">TOTAL</span></template>
                        <template v-else-if="col.field === 'Nilai'" #footer><span class="footer-value">{{ formatCurrency(totalNilai) }}</span></template>
                    </Column>
                </DataTable>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useToast } from "primevue/usetoast";
import OverlayPanel from "primevue/overlaypanel";
import NumericFilter from "~/components/report/NumericFilter.vue";

definePageMeta({ layout: "default" });

const { $api } = useNuxtApp();
const toast = useToast();

const loading = ref(false);
const data = ref<any[]>([]);
const searchKeyword = ref("");
const showTextFilter = ref(false);
const textFilters = ref<Record<string, string>>({});
const activeTextFilters = ref<Record<string, string>>({});
const filterOverlays = ref<Record<string, any>>({});
const tempColumnFilters = ref<Record<string, any[]>>({});
const activeColumnFilters = ref<Record<string, any[]>>({});
const filterSearchTerms = ref<Record<string, string>>({});
const filterOptionsCache = ref<Record<string, any[]>>({});
const numericFilters = ref<Record<string, any>>({});

const filterColumns = [
    { field: "Kode", header: "Kode", width: "100px", minWidth: "85px" },
    { field: "Nama", header: "Nama Barang", width: "250px", minWidth: "200px" },
    { field: "Kategori", header: "Kategori", width: "110px", minWidth: "90px" },
    { field: "Gudang", header: "Gudang", width: "110px", minWidth: "90px" },
    { field: "Stok", header: "Stok", width: "70px", minWidth: "60px", align: "right", type: "number" },
    { field: "HrgBeli", header: "Hrg Beli", width: "110px", minWidth: "90px", align: "right", type: "currency" },
    { field: "Nilai", header: "Nilai", width: "120px", minWidth: "100px", align: "right", type: "currency" },
    { field: "Produsen", header: "Produsen", width: "130px", minWidth: "100px" },
    { field: "Min_Stok", header: "Min Stok", width: "75px", minWidth: "65px", align: "center", type: "number" },
];

const isNumericField = (col: any) => col.type === "number" || col.type === "currency";

const filterableColumns = [
    { field: "Kode", header: "Kode" }, { field: "Nama", header: "Nama" },
    { field: "Kategori", header: "Kategori" }, { field: "Gudang", header: "Gudang" },
    { field: "Produsen", header: "Produsen" },
];

const activeFiltersCount = computed(() => {
    let c = 0;
    Object.keys(activeColumnFilters.value).forEach(k => { if (activeColumnFilters.value[k]?.length > 0) c++; });
    Object.keys(activeTextFilters.value).forEach(k => { if (activeTextFilters.value[k]?.trim()) c++; });
    Object.keys(numericFilters.value).forEach(k => { if (numericFilters.value[k]) c++; });
    return c;
});

// Helper evaluasi kondisi
const evaluateCondition = (row: any, field: string, operator: string, val1: any, val2: any): boolean => {
    const rawVal = row[field];
    const v = parseFloat(rawVal) || 0;
    const v1 = parseFloat(val1) || 0;
    const v2 = parseFloat(val2) || 0;
    switch (operator) {
        case "eq": return v === v1;
        case "neq": return v !== v1;
        case "gt": return v > v1;
        case "gte": return v >= v1;
        case "lt": return v < v1;
        case "lte": return v <= v1;
        case "between": return v >= v1 && v <= v2;
        default: return true;
    }
};

const filteredData = computed(() => {
    let r = [...data.value];
    if (searchKeyword.value) { const kw = searchKeyword.value.toLowerCase(); r = r.filter(row => Object.values(row).some(v => String(v).toLowerCase().includes(kw))); }
    Object.keys(activeColumnFilters.value).forEach(f => { const v = activeColumnFilters.value[f]; if (v?.length > 0) r = r.filter(row => v.includes(String(row[f]))); });
    Object.keys(activeTextFilters.value).forEach(f => { const v = activeTextFilters.value[f]?.toLowerCase(); if (v) r = r.filter(row => String(row[f] || "").toLowerCase().includes(v)); });
    
    // Numeric filter dengan AND/OR
    Object.keys(numericFilters.value).forEach(field => {
        const filter = numericFilters.value[field]; if (!filter) return;
        
        r = r.filter(row => {
            const cond1 = evaluateCondition(row, field, filter.operator1, filter.value1, filter.value1b);
            
            if (!filter.operator2 || (filter.value2 === null || filter.value2 === undefined || filter.value2 === '')) {
                return cond1;
            }
            
            const cond2 = evaluateCondition(row, field, filter.operator2, filter.value2, filter.value2b);
            return filter.logic === 'or' ? (cond1 || cond2) : (cond1 && cond2);
        });
    });
    
    return r;
});

const totalNilai = computed(() => filteredData.value.reduce((s, r) => s + (parseFloat(r.Nilai) || 0), 0));

const formatCurrency = (v: any) => { if (!v && v !== 0) return "-"; return "Rp " + Math.round(parseFloat(v)).toLocaleString("id-ID"); };
const formatNumber = (v: any) => { if (!v && v !== 0) return "-"; return Math.round(parseFloat(v)).toLocaleString("id-ID"); };

const loadData = async () => {
    loading.value = true;
    try {
        const res = await $api.get("/v1/report/persediaan");
        if (res.data.success) { data.value = res.data.data; buildFilterOptions(); }
    } catch (e: any) { toast.add({ severity: "error", summary: "Gagal", detail: e.response?.data?.message || "Gagal", life: 3000 }); }
    finally { loading.value = false; }
};

const resetTextFilters = () => { filterableColumns.forEach(c => textFilters.value[c.field] = ""); activeTextFilters.value = {}; };
const applyTextFilters = () => { activeTextFilters.value = {}; filterableColumns.forEach(c => { if (textFilters.value[c.field]?.trim()) activeTextFilters.value[c.field] = textFilters.value[c.field].trim(); }); showTextFilter.value = false; };

const buildFilterOptions = () => {
    filterColumns.forEach(col => {
        if (isNumericField(col)) return;
        const m = new Map<string, number>();
        data.value.forEach(r => { const v = String(r[col.field] || ""); if (v) m.set(v, (m.get(v) || 0) + 1); });
        filterOptionsCache.value[col.field] = Array.from(m.entries()).map(([v, c]) => ({ value: v, label: v, count: c })).sort((a, b) => a.label.localeCompare(b.label));
    });
};

const setFilterOverlayRef = (f: string, el: any) => { if (el) filterOverlays.value[f] = el; };
const openColumnFilter = (col: any, e: Event) => { 
    const o = filterOverlays.value[col.field]; 
    if (o) { 
        if (!isNumericField(col) && !tempColumnFilters.value[col.field]) tempColumnFilters.value[col.field] = [...(activeColumnFilters.value[col.field] || [])]; 
        o.toggle(e); 
    } 
};
const closeFilterPanel = (f: string) => filterOverlays.value[f]?.hide();
const onFilterPanelHide = (f: string) => { tempColumnFilters.value[f] = [...(activeColumnFilters.value[f] || [])]; };
const getFilteredOptions = (f: string) => { const o = filterOptionsCache.value[f] || [], t = filterSearchTerms.value[f]?.toLowerCase() || ""; return t ? o.filter(opt => opt.label.toLowerCase().includes(t)) : o; };
const selectAll = (f: string) => { tempColumnFilters.value[f] = (filterOptionsCache.value[f] || []).map(o => o.value); };
const clearFilter = (f: string) => { tempColumnFilters.value[f] = []; };
const hasColumnFilter = (f: string) => activeColumnFilters.value[f]?.length > 0;
const applyColumnFilter = (f: string) => { activeColumnFilters.value[f] = [...(tempColumnFilters.value[f] || [])]; closeFilterPanel(f); };
const applyNumericFilter = (field: string, filter: any) => { if (filter) numericFilters.value[field] = filter; else delete numericFilters.value[field]; closeFilterPanel(field); };

const exportExcel = async () => {
    const ExcelJS = await import("exceljs"); const wb = new ExcelJS.Workbook(); const ws = wb.addWorksheet("Persediaan");
    const hs: any = { font: { bold: true, color: { argb: "FFFFFFFF" }, size: 10 }, fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FF10B981" } }, alignment: { horizontal: "center", vertical: "middle" } };
    const ds: any = { font: { size: 9 } }, ns: any = { ...ds, alignment: { horizontal: "right" }, numFmt: "#,##0" };
    ws.getRow(1).height = 22; filterColumns.forEach((c, i) => { const cell = ws.getRow(1).getCell(i + 1); cell.value = c.header; cell.style = hs; });
    filteredData.value.forEach((r, i) => { const dr = ws.getRow(2 + i); filterColumns.forEach((c, ci) => { const cell = dr.getCell(ci + 1); cell.value = (c.type === "currency" || c.type === "number") ? (parseFloat(r[c.field]) || 0) : String(r[c.field] ?? ""); cell.style = (c.type === "currency" || c.type === "number") ? ns : ds; }); });
    ws.autoFilter = { from: "A1", to: `I${1 + filteredData.value.length}` }; ws.views = [{ state: "frozen", ySplit: 1 }];
    const buf = await wb.xlsx.writeBuffer(); const blob = new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `Persediaan_${new Date().toISOString().split("T")[0]}.xlsx`; a.click(); URL.revokeObjectURL(url);
    toast.add({ severity: "success", summary: "Excel", detail: "Berhasil", life: 2000 });
};

const exportPDF = () => {
    let html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>body{font-family:Arial;padding:12px;font-size:8px}h1{font-size:13px;text-align:center;color:#059669}table{width:100%;border-collapse:collapse}th{background:#10b981;color:#fff;padding:3px;border:1px solid #059669;font-size:6px}td{padding:2px 3px;border:1px solid #e5e7eb;font-size:7px}.r{text-align:right}</style></head><body><h1>Laporan Persediaan</h1><table><thead><tr>${filterColumns.map(c => `<th>${c.header}</th>`).join("")}</tr></thead><tbody>`;
    filteredData.value.forEach(r => html += `<tr>${filterColumns.map(c => `<td class="${c.align === 'right' ? 'r' : ''}">${c.type === 'currency' ? formatCurrency(r[c.field]) : c.type === 'number' ? formatNumber(r[c.field]) : r[c.field] || ''}</td>`).join("")}</tr>`);
    html += `</tbody></table></body></html>`;
    const win = window.open("", "_blank", "width=1000,height=700"); if (win) { win.document.write(html); win.document.close(); }
    toast.add({ severity: "success", summary: "Print", detail: "Gunakan Print > Save as PDF", life: 3000 });
};

onMounted(() => { resetTextFilters(); loadData(); });
</script>

<style lang="scss" scoped>
.report-page { height: 100%; display: flex; flex-direction: column; overflow: hidden; }
.main-card { flex: 1; display: flex; flex-direction: column; background: var(--surface-card); border-radius: 0.5rem; border: 1px solid var(--surface-border); overflow: hidden; min-height: 0; }

.toolbar { display: flex; align-items: center; gap: 0.5rem; padding: 0.45rem 0.65rem; border-bottom: 1px solid var(--surface-border); background: var(--surface-50); flex-shrink: 0; flex-wrap: wrap; }
.search-box { display: flex; align-items: center; background: var(--surface-0); border: 1px solid var(--surface-border); border-radius: 0.35rem; padding: 0 0.35rem; height: 1.85rem; width: 200px; flex-shrink: 0; i { font-size: 0.7rem; color: var(--text-color-secondary); } .clear-btn { cursor: pointer; margin-left: auto; } .search-input { flex: 1; border: none; background: transparent; padding: 0 0.3rem; font-size: 0.75rem; outline: none; color: var(--text-color); &::placeholder { color: var(--text-color-secondary); } } }
.filter-active { background: var(--primary-100) !important; color: var(--primary-700) !important; }
.actions { display: flex; gap: 0.1rem; margin-left: auto; flex-shrink: 0; align-items: center; :deep(.p-button) { width: 1.65rem !important; height: 1.65rem !important; } }

.text-filter-panel { padding: 0.5rem 0.65rem; border-bottom: 1px solid var(--surface-border); background: var(--surface-0); display: flex; align-items: flex-end; gap: 0.5rem; flex-wrap: wrap; flex-shrink: 0; .text-filter-grid { display: flex; gap: 0.35rem; flex-wrap: wrap; flex: 1; } .text-filter-input { height: 1.75rem; padding: 0 0.4rem; border: 1px solid var(--surface-border); border-radius: 0.3rem; font-size: 0.72rem; outline: none; width: 140px; } .text-filter-actions { display: flex; gap: 0.25rem; flex-shrink: 0; } }

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

.table-empty { display: flex; flex-direction: column; align-items: center; padding: 2.5rem; color: var(--text-color-secondary); gap: 0.5rem; i { font-size: 2rem; } span { font-size: 0.8rem; } }

@media (max-width: 900px) { .toolbar { gap: 0.35rem; padding: 0.35rem 0.5rem; } }
@media (max-width: 640px) { .search-box { width: 100%; } .text-filter-input { width: 100%; } }
@media (max-width: 768px) { .data-table { :deep(.p-datatable-thead > tr > th) { font-size: 0.63rem; padding: 0.25rem 0.35rem !important; } :deep(.p-datatable-tbody > tr > td) { font-size: 0.7rem; padding: 0.2rem 0.35rem; } } }
</style>