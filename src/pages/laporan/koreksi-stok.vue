<template>
    <div class="report-page">
        <div class="main-card">
            <!-- Toolbar -->
            <div class="toolbar">
                <div class="search-box">
                    <i class="pi pi-search"></i>
                    <input v-model="searchKeyword" placeholder="Cari kode, nama, kategori..." class="search-input" @keydown.enter="onSearch" />
                    <i v-if="searchKeyword" class="pi pi-times clear-btn" @click="searchKeyword = ''; onSearch()"></i>
                </div>

                <div class="filter-item">
                    <span class="filter-label">Tgl Koreksi</span>
                    <DatePicker v-model="filterTanggal" dateFormat="yy-mm-dd" showIcon size="small" @date-select="onSearch" />
                </div>

                <Button icon="pi pi-filter" severity="secondary" text rounded size="small" :class="{ 'filter-active': activeFiltersCount > 0 }" @click="showTextFilter = !showTextFilter" v-tooltip.top="'Filter Teks'" />

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

            <!-- Summary Cards -->
            <div class="summary-cards">
                <div class="summary-card">
                    <div class="summary-card-icon" style="background: var(--blue-100);">
                        <i class="pi pi-database" style="color: var(--blue-600);"></i>
                    </div>
                    <div class="summary-card-text">
                        <span class="summary-card-label">Total Item</span>
                        <span class="summary-card-value">{{ summary.total_item }}</span>
                    </div>
                </div>
                <div class="summary-card">
                    <div class="summary-card-icon" style="background: var(--green-100);">
                        <i class="pi pi-check-circle" style="color: var(--green-600);"></i>
                    </div>
                    <div class="summary-card-text">
                        <span class="summary-card-label">Terkoreksi</span>
                        <span class="summary-card-value">{{ summary.total_dikoreksi }}</span>
                    </div>
                </div>
                <div class="summary-card">
                    <div class="summary-card-icon" style="background: var(--purple-100);">
                        <i class="pi pi-chart-pie" style="color: var(--purple-600);"></i>
                    </div>
                    <div class="summary-card-text">
                        <span class="summary-card-label">Persentase</span>
                        <span class="summary-card-value">{{ summary.persentase }}%</span>
                    </div>
                </div>
            </div>

            <!-- Table -->
            <div class="table-area">
                <DataTable
                    :value="filteredData" :loading="loading" stripedRows size="small" showGridlines
                    paginator :rows="pagination.perPage" :rowsPerPageOptions="[10, 25, 50, 100]"
                    :totalRecords="pagination.total" :first="(pagination.currentPage - 1) * pagination.perPage"
                    @page="onPage" @sort="onSort" :sortField="sortField" :sortOrder="sortOrder"
                    scrollable scrollHeight="flex" scrollDirection="horizontal" responsiveLayout="scroll"
                    lazy class="data-table"
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
                                    <!-- NUMERIC FILTER untuk Stok -->
                                    <NumericFilter 
                                        v-if="col.field === 'Stok'"
                                        :label="col.header"
                                        :currentFilter="numericFilters[col.field]"
                                        @apply="(f: any) => applyNumericFilter(col.field, f)"
                                        @close="closeFilterPanel(col.field)"
                                    />
                                    <!-- DATE FILTER untuk Tgl_Koreksi, Tgl_Beli, Tgl_Jual -->
                                    <NumericFilter 
                                        v-else-if="isDateField(col.field)"
                                        :label="col.header"
                                        :currentFilter="numericFilters[col.field]"
                                        :isDate="true"
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
                        <template v-if="col.field === 'Stok'" #body="{ data }"><span class="text-number">{{ formatNumber(data.Stok) }}</span></template>
                        <template v-else-if="isDateField(col.field)" #body="{ data }"><span>{{ formatDate(data[col.field]) }}</span></template>
                    </Column>
                </DataTable>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from "vue";
import { useToast } from "primevue/usetoast";
import OverlayPanel from "primevue/overlaypanel";
import NumericFilter from "~/components/report/NumericFilter.vue";

definePageMeta({ layout: "default" });

const { $api } = useNuxtApp();
const toast = useToast();

const loading = ref(false);
const data = ref<any[]>([]);
const searchKeyword = ref("");
const filterTanggal = ref(new Date(2026, 3, 19));
const sortField = ref("Kode");
const sortOrder = ref<1 | -1>(1);
const showTextFilter = ref(false);
const textFilters = ref<Record<string, string>>({});
const activeTextFilters = ref<Record<string, string>>({});
const filterOverlays = ref<Record<string, any>>({});
const tempColumnFilters = ref<Record<string, any[]>>({});
const activeColumnFilters = ref<Record<string, any[]>>({});
const filterSearchTerms = ref<Record<string, string>>({});
const filterOptionsCache = ref<Record<string, any[]>>({});
const numericFilters = ref<Record<string, any>>({});

const pagination = reactive({ currentPage: 1, perPage: 25, total: 0, lastPage: 1 });
const summary = reactive({ total_item: 0, total_dikoreksi: 0, persentase: 0 });

const gridColumns = [
    { field: "Kode", header: "Kode", width: "100px", minWidth: "85px" },
    { field: "Nama", header: "Nama Barang", width: "220px", minWidth: "180px" },
    { field: "Kategori", header: "Kategori", width: "120px", minWidth: "100px" },
    { field: "Stok", header: "Stok", width: "80px", minWidth: "70px", align: "right" },
    { field: "Tgl_Koreksi", header: "Tgl Koreksi", width: "120px", minWidth: "100px" },
    { field: "Tgl_Beli", header: "Tgl Beli", width: "120px", minWidth: "100px" },
    { field: "Tgl_Jual", header: "Tgl Jual", width: "120px", minWidth: "100px" },
];

const filterableColumns = [
    { field: "Kode", header: "Kode" },
    { field: "Nama", header: "Nama" },
    { field: "Kategori", header: "Kategori" },
];

const isDateField = (f: string) => ["Tgl_Koreksi", "Tgl_Beli", "Tgl_Jual"].includes(f);

const activeFiltersCount = computed(() => {
    let c = 0;
    Object.keys(activeColumnFilters.value).forEach(k => { if (activeColumnFilters.value[k]?.length > 0) c++; });
    Object.keys(activeTextFilters.value).forEach(k => { if (activeTextFilters.value[k]?.trim()) c++; });
    Object.keys(numericFilters.value).forEach(k => { if (numericFilters.value[k]) c++; });
    return c;
});

const evaluateCondition = (row: any, field: string, operator: string, val1: any, val2: any, isDate: boolean): boolean => {
    const rawVal = row[field];
    if (isDate) {
        const v = String(rawVal || ''); const v1 = String(val1 || ''); const v2 = String(val2 || '');
        switch (operator) { case "eq": return v === v1; case "neq": return v !== v1; case "gt": return v > v1; case "gte": return v >= v1; case "lt": return v < v1; case "lte": return v <= v1; case "between": return v >= v1 && v <= v2; default: return true; }
    } else {
        const v = parseFloat(rawVal) || 0; const v1 = parseFloat(val1) || 0; const v2 = parseFloat(val2) || 0;
        switch (operator) { case "eq": return v === v1; case "neq": return v !== v1; case "gt": return v > v1; case "gte": return v >= v1; case "lt": return v < v1; case "lte": return v <= v1; case "between": return v >= v1 && v <= v2; default: return true; }
    }
};

const filteredData = computed(() => {
    let r = [...data.value];
    if (searchKeyword.value) { const kw = searchKeyword.value.toLowerCase(); r = r.filter(row => Object.values(row).some(v => String(v).toLowerCase().includes(kw))); }
    Object.keys(activeColumnFilters.value).forEach(f => { const v = activeColumnFilters.value[f]; if (v?.length > 0) r = r.filter(row => v.includes(String(row[f]))); });
    Object.keys(activeTextFilters.value).forEach(f => { const v = activeTextFilters.value[f]?.toLowerCase(); if (v) r = r.filter(row => String(row[f] || "").toLowerCase().includes(v)); });
    Object.keys(numericFilters.value).forEach(field => {
        const filter = numericFilters.value[field]; if (!filter) return;
        const isDate = filter.type === 'date';
        r = r.filter(row => {
            const cond1 = evaluateCondition(row, field, filter.operator1, filter.value1, filter.value1b, isDate);
            if (!filter.operator2 || (filter.value2 === null || filter.value2 === undefined || filter.value2 === '')) return cond1;
            const cond2 = evaluateCondition(row, field, filter.operator2, filter.value2, filter.value2b, isDate);
            return filter.logic === 'or' ? (cond1 || cond2) : (cond1 && cond2);
        });
    });
    return r;
});

const formatNumber = (v: any) => { if (!v && v !== 0) return "0"; return Math.round(parseFloat(v)).toLocaleString("id-ID"); };
const formatDate = (v: string) => { if (!v) return "-"; const d = new Date(v); return `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}/${d.getFullYear()}`; };
const formatParamDate = (d: Date): string => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;

const loadData = async () => {
    loading.value = true;
    try {
        const res = await $api.get("/v1/report/koreksi-stok", { params: { per_page: 9999, tanggal: formatParamDate(filterTanggal.value) } });
        if (res.data.success) {
            data.value = res.data.data;
            pagination.total = res.data.data?.length || 0;
            summary.total_item = res.data.summary?.total_item || 0;
            summary.total_dikoreksi = res.data.summary?.total_dikoreksi || 0;
            summary.persentase = res.data.summary?.persentase || 0;
            buildFilterOptions();
        }
    } catch (e: any) { toast.add({ severity: "error", summary: "Gagal", detail: e.response?.data?.message || "Error", life: 3000 }); }
    finally { loading.value = false; }
};

let searchTimeout: any;
const onSearch = () => { clearTimeout(searchTimeout); searchTimeout = setTimeout(() => { loadData(); }, 400); };
const onPage = (event: any) => { pagination.currentPage = event.page + 1; pagination.perPage = event.rows; };
const onSort = (event: any) => { sortField.value = event.sortField; sortOrder.value = event.sortOrder === 1 ? 1 : -1; };

const resetTextFilters = () => { filterableColumns.forEach(c => textFilters.value[c.field] = ""); activeTextFilters.value = {}; };
const applyTextFilters = () => { activeTextFilters.value = {}; filterableColumns.forEach(c => { if (textFilters.value[c.field]?.trim()) activeTextFilters.value[c.field] = textFilters.value[c.field].trim(); }); showTextFilter.value = false; };

const buildFilterOptions = () => {
    gridColumns.forEach(col => {
        if (col.field === 'Stok' || isDateField(col.field)) return;
        const m = new Map<string, number>();
        data.value.forEach(r => { const v = String(r[col.field] || ""); if (v) m.set(v, (m.get(v) || 0) + 1); });
        filterOptionsCache.value[col.field] = Array.from(m.entries()).map(([v, c]) => ({ value: v, label: v, count: c })).sort((a, b) => a.label.localeCompare(b.label));
    });
};
const setFilterOverlayRef = (f: string, el: any) => { if (el) filterOverlays.value[f] = el; };
const openColumnFilter = (col: any, e: Event) => { const o = filterOverlays.value[col.field]; if (o) { const isNumOrDate = col.field === 'Stok' || isDateField(col.field); if (!isNumOrDate && !tempColumnFilters.value[col.field]) tempColumnFilters.value[col.field] = [...(activeColumnFilters.value[col.field] || [])]; o.toggle(e); } };
const closeFilterPanel = (f: string) => filterOverlays.value[f]?.hide();
const onFilterPanelHide = (f: string) => { tempColumnFilters.value[f] = [...(activeColumnFilters.value[f] || [])]; };
const getFilteredOptions = (f: string) => { const o = filterOptionsCache.value[f] || [], t = filterSearchTerms.value[f]?.toLowerCase() || ""; return t ? o.filter(opt => opt.label.toLowerCase().includes(t)) : o; };
const selectAll = (f: string) => { tempColumnFilters.value[f] = (filterOptionsCache.value[f] || []).map(o => o.value); };
const clearFilter = (f: string) => { tempColumnFilters.value[f] = []; };
const hasColumnFilter = (f: string) => activeColumnFilters.value[f]?.length > 0;
const applyColumnFilter = (f: string) => { activeColumnFilters.value[f] = [...(tempColumnFilters.value[f] || [])]; closeFilterPanel(f); };
const applyNumericFilter = (field: string, filter: any) => { if (filter) numericFilters.value[field] = filter; else delete numericFilters.value[field]; closeFilterPanel(field); };

const exportExcel = async () => {
    const ExcelJS = await import("exceljs"); const wb = new ExcelJS.Workbook(); const ws = wb.addWorksheet("Koreksi Stok");
    const hs: any = { font: { bold: true, color: { argb: "FFFFFFFF" }, size: 10 }, fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FF10B981" } }, alignment: { horizontal: "center", vertical: "middle" } };
    const ds: any = { font: { size: 9 } }, ns: any = { ...ds, alignment: { horizontal: "right" }, numFmt: "#,##0" };
    ws.getRow(1).height = 22; gridColumns.forEach((c,i) => { const cell = ws.getRow(1).getCell(i+1); cell.value = c.header; cell.style = hs; });
    filteredData.value.forEach((r,i) => { const dr = ws.getRow(2+i); gridColumns.forEach((c,ci) => { const cell = dr.getCell(ci+1); cell.value = c.field === 'Stok' ? (parseInt(r[c.field])||0) : String(r[c.field]??""); cell.style = c.field === 'Stok' ? ns : ds; }); });
    ws.autoFilter = { from: "A1", to: `G${1+filteredData.value.length}` }; ws.views = [{ state: "frozen", ySplit: 1 }];
    const buf = await wb.xlsx.writeBuffer(); const blob = new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `Koreksi_Stok_${formatParamDate(new Date())}.xlsx`; a.click(); URL.revokeObjectURL(url);
    toast.add({ severity: "success", summary: "Excel", detail: "Berhasil", life: 2000 });
};

const exportPDF = () => {
    let html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>body{font-family:Arial;padding:12px;font-size:8px}h1{font-size:13px;text-align:center;color:#059669}table{width:100%;border-collapse:collapse}th{background:#10b981;color:#fff;padding:3px;border:1px solid #059669;font-size:6px}td{padding:2px 3px;border:1px solid #e5e7eb;font-size:7px}.r{text-align:right}</style></head><body><h1>Koreksi Stok</h1><p style="text-align:center;color:#6b7280">Tgl: ${formatDate(formatParamDate(filterTanggal.value))} | Total: ${summary.total_item} | Koreksi: ${summary.total_dikoreksi} (${summary.persentase}%)</p><table><thead><tr>${gridColumns.map(c => `<th>${c.header}</th>`).join("")}</tr></thead><tbody>`;
    filteredData.value.forEach(r => html += `<tr>${gridColumns.map(c => `<td class="${c.align==='right'?'r':''}">${c.field==='Stok'?formatNumber(r.Stok):isDateField(c.field)?formatDate(r[c.field]):r[c.field]||''}</td>`).join("")}</tr>`);
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
.search-box { display: flex; align-items: center; background: var(--surface-0); border: 1px solid var(--surface-border); border-radius: 0.35rem; padding: 0 0.35rem; height: 1.85rem; width: 220px; flex-shrink: 0; i { font-size: 0.7rem; color: var(--text-color-secondary); } .clear-btn { cursor: pointer; margin-left: auto; } .search-input { flex: 1; border: none; background: transparent; padding: 0 0.3rem; font-size: 0.75rem; outline: none; color: var(--text-color); &::placeholder { color: var(--text-color-secondary); } } }
.filter-item { display: flex; align-items: center; gap: 0.35rem; flex-shrink: 0; .filter-label { font-size: 0.68rem; font-weight: 600; color: var(--text-color-secondary); white-space: nowrap; } :deep(.p-datepicker) { width: 140px; .p-datepicker-input { font-size: 0.73rem; height: 1.85rem; padding: 0 0.35rem; } } }
.filter-active { background: var(--primary-100) !important; color: var(--primary-700) !important; }
.actions { display: flex; gap: 0.1rem; margin-left: auto; flex-shrink: 0; align-items: center; :deep(.p-button) { width: 1.65rem !important; height: 1.65rem !important; } }

.text-filter-panel { padding: 0.5rem 0.65rem; border-bottom: 1px solid var(--surface-border); background: var(--surface-0); display: flex; align-items: flex-end; gap: 0.5rem; flex-wrap: wrap; flex-shrink: 0; .text-filter-grid { display: flex; gap: 0.35rem; flex-wrap: wrap; flex: 1; } .text-filter-input { height: 1.75rem; padding: 0 0.4rem; border: 1px solid var(--surface-border); border-radius: 0.3rem; font-size: 0.72rem; outline: none; width: 140px; } .text-filter-actions { display: flex; gap: 0.25rem; flex-shrink: 0; } }

.summary-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 0.5rem; padding: 0.5rem 0.65rem; border-bottom: 1px solid var(--surface-border); background: var(--surface-0); flex-shrink: 0; @media (max-width: 480px) { grid-template-columns: 1fr 1fr 1fr; } }
.summary-card { display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 0.65rem; background: var(--surface-card); border-radius: 0.4rem; border: 1px solid var(--surface-border); }
.summary-card-icon { width: 2rem; height: 2rem; border-radius: 0.4rem; display: flex; align-items: center; justify-content: center; flex-shrink: 0; i { font-size: 0.85rem; } }
.summary-card-text { display: flex; flex-direction: column; gap: 0.05rem; min-width: 0; }
.summary-card-label { font-size: 0.6rem; color: var(--text-color-secondary); text-transform: uppercase; letter-spacing: 0.03em; }
.summary-card-value { font-size: 0.9rem; font-weight: 700; color: var(--text-color); }

.table-area { flex: 1; overflow: hidden; min-height: 0; display: flex; flex-direction: column; }
.data-table { flex: 1; display: flex; flex-direction: column; min-height: 0;
    :deep(.p-datatable-wrapper) { flex: 1; overflow: auto; min-height: 0; }
    :deep(.p-datatable-thead > tr > th) { background: var(--surface-50); font-size: 0.68rem; font-weight: 700; text-transform: uppercase; color: var(--text-color-secondary); padding: 0.35rem 0.45rem !important; border-bottom: 2px solid var(--surface-border); white-space: nowrap; letter-spacing: 0.03em; position: sticky; top: 0; z-index: 2; }
    :deep(.p-datatable-tbody > tr > td) { padding: 0.25rem 0.45rem; font-size: 0.75rem; white-space: nowrap; }
    :deep(.p-datatable-tbody > tr:hover) { background: var(--surface-50); }
    :deep(.p-paginator) { padding: 0.25rem 0.4rem; font-size: 0.7rem; border-top: 1px solid var(--surface-border); flex-shrink: 0; background: var(--surface-card); .p-paginator-page, .p-paginator-first, .p-paginator-prev, .p-paginator-next, .p-paginator-last { min-width: 1.5rem; height: 1.5rem; font-size: 0.7rem; } }
    :deep(.p-sortable-column-icon) { font-size: 0.6rem !important; width: 1.25rem; height: 1.25rem; display: inline-flex; align-items: center; justify-content: center; }
}

.col-header { display: flex; align-items: center; width: 100%; .col-title { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; } .col-icons { display: flex; align-items: center; gap: 0.15rem; flex-shrink: 0; margin-left: auto; } }
.col-filter-btn { width: 1.25rem; height: 1.25rem; border-radius: 0.2rem; border: none; background: transparent; cursor: pointer; display: flex; align-items: center; justify-content: center; opacity: 0; transition: all 0.12s; flex-shrink: 0; color: var(--text-color-secondary); i { font-size: 0.6rem; } &:hover { background: var(--surface-200); } &.active { opacity: 1; background: var(--primary-100); color: var(--primary-700); } }
.col-header:hover .col-filter-btn { opacity: 1; }

.text-number { font-weight: 500; }

.mini-filter { width: 230px; display: flex; flex-direction: column; .mini-filter-head { display: flex; align-items: center; justify-content: space-between; padding: 0.45rem 0.65rem; border-bottom: 1px solid var(--surface-border); font-weight: 600; font-size: 0.76rem; } .mini-filter-search { position: relative; padding: 0.35rem 0.65rem; border-bottom: 1px solid var(--surface-border); i { position: absolute; left: 1.05rem; top: 50%; transform: translateY(-50%); font-size: 0.65rem; } .mini-filter-input { width: 100%; height: 1.55rem; padding: 0 0.35rem 0 1.5rem; border: 1px solid var(--surface-border); border-radius: 0.25rem; font-size: 0.7rem; outline: none; } } .mini-filter-actions { display: flex; justify-content: space-between; padding: 0.25rem 0.65rem; border-bottom: 1px solid var(--surface-border); button { background: none; border: none; font-size: 0.65rem; color: var(--primary-600); cursor: pointer; font-weight: 500; } } .mini-filter-list { max-height: 160px; overflow-y: auto; padding: 0.15rem 0; } .mini-filter-opt { display: flex; align-items: center; gap: 0.35rem; padding: 0.25rem 0.65rem; cursor: pointer; font-size: 0.7rem; &:hover { background: var(--surface-50); } input[type="checkbox"] { width: 0.75rem; height: 0.75rem; accent-color: var(--primary-500); } span { flex: 1; } small { color: var(--text-color-secondary); font-size: 0.62rem; } } .mini-filter-empty { padding: 1.25rem; text-align: center; color: var(--text-color-secondary); font-size: 0.7rem; } .mini-filter-foot { padding: 0.35rem 0.65rem; border-top: 1px solid var(--surface-border); } }

.table-empty { display: flex; flex-direction: column; align-items: center; padding: 2.5rem; color: var(--text-color-secondary); gap: 0.5rem; i { font-size: 2rem; } span { font-size: 0.8rem; } }

@media (max-width: 640px) { .search-box { width: 100%; } .text-filter-input { width: 100%; } }
@media (max-width: 768px) { .data-table { :deep(.p-datatable-thead > tr > th) { font-size: 0.63rem; padding: 0.25rem 0.35rem !important; } :deep(.p-datatable-tbody > tr > td) { font-size: 0.7rem; padding: 0.2rem 0.35rem; } } }
</style>