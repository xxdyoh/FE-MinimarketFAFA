<template>
    <div class="kartu-stock-page">
        <div class="main-card">
            <!-- Toolbar -->
            <div class="toolbar">
                <div class="search-box">
                    <i class="pi pi-search"></i>
                    <input v-model="searchKeyword" placeholder="Cari kode, nama..." class="search-input" />
                    <i v-if="searchKeyword" class="pi pi-times clear-btn" @click="searchKeyword = ''"></i>
                </div>

                <div class="filter-item">
                    <span class="filter-label">Periode</span>
                    <DatePicker v-model="startDate" dateFormat="yy-mm-dd" showIcon size="small" />
                    <span class="date-sep">s/d</span>
                    <DatePicker v-model="endDate" dateFormat="yy-mm-dd" showIcon size="small" />
                </div>

                <div class="filter-item">
                    <span class="filter-label">Gudang</span>
                    <Select v-model="filterGudang" :options="gudangList" optionLabel="nama" optionValue="kode" placeholder="Semua" size="small" showClear class="gudang-select" @change="loadData" />
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
                    :value="filteredData"
                    :loading="loading"
                    stripedRows
                    size="small"
                    showGridlines
                    paginator
                    :rows="25"
                    :rowsPerPageOptions="[10, 25, 50, 100]"
                    sortField="Kode"
                    :sortOrder="1"
                    scrollable
                    scrollHeight="flex"
                    scrollDirection="horizontal"
                    responsiveLayout="scroll"
                    class="data-table"
                >
                    <template #empty>
                        <div class="table-empty">
                            <i class="pi pi-inbox"></i>
                            <span>Tidak ada data</span>
                        </div>
                    </template>

                    <Column 
                        v-for="col in gridColumns" 
                        :key="col.field" 
                        :field="col.field" 
                        :sortable="col.sortable !== false" 
                        :style="{ width: col.width, minWidth: col.minWidth || '60px', textAlign: col.align || 'left' }"
                    >
                        <template #header>
                            <div class="col-header">
                                <span class="col-title">{{ col.header }}</span>
                                <div class="col-icons">
                                    <button 
                                        class="col-filter-btn" 
                                        :class="{ 'active': hasColumnFilter(col.field) || numericFilters[col.field] }" 
                                        @click.stop="openColumnFilter(col, $event)"
                                    >
                                        <i class="pi pi-filter"></i>
                                    </button>
                                </div>
                                <OverlayPanel :ref="(el) => setFilterOverlayRef(col.field, el)" @hide="onFilterPanelHide(col.field)">
                                    <NumericFilter v-if="isNumericField(col)" :label="col.header" :currentFilter="numericFilters[col.field]" @apply="(f: any) => applyNumericFilter(col.field, f)" @close="closeFilterPanel(col.field)" />
                                    <div v-else class="mini-filter">
                                        <div class="mini-filter-head">
                                            <span>Filter {{ col.header }}</span>
                                            <Button icon="pi pi-times" text rounded size="small" @click="closeFilterPanel(col.field)" />
                                        </div>
                                        <div class="mini-filter-search">
                                            <i class="pi pi-search"></i>
                                            <input v-model="filterSearchTerms[col.field]" placeholder="Cari..." class="mini-filter-input" />
                                        </div>
                                        <div class="mini-filter-actions">
                                            <button @click="selectAll(col.field)">Pilih Semua</button>
                                            <button @click="clearFilter(col.field)">Bersihkan</button>
                                        </div>
                                        <div class="mini-filter-list">
                                            <label v-for="opt in getFilteredOptions(col.field)" :key="opt.value" class="mini-filter-opt">
                                                <input type="checkbox" :value="opt.value" v-model="tempColumnFilters[col.field]" />
                                                <span>{{ opt.label }}</span>
                                                <small>{{ opt.count }}</small>
                                            </label>
                                            <div v-if="getFilteredOptions(col.field).length === 0" class="mini-filter-empty">Tidak ada</div>
                                        </div>
                                        <div class="mini-filter-foot">
                                            <Button label="Terapkan" severity="primary" size="small" class="w-full" @click="applyColumnFilter(col.field)" />
                                        </div>
                                    </div>
                                </OverlayPanel>
                            </div>
                        </template>
                        
                        <template v-if="isCurrencyField(col.field)" #body="{ data }">
                            <span class="text-currency">{{ formatCurrency(data[col.field]) }}</span>
                        </template>
                        <template v-else-if="col.type === 'number'" #body="{ data }">
                            <span class="text-number">{{ formatNumber(data[col.field]) }}</span>
                        </template>
                        
                        <template v-if="col.field === 'Kode'" #footer>
                            <span class="footer-label">TOTAL</span>
                        </template>
                        <template v-else-if="col.field === 'Rp_Awal'" #footer>
                            <span class="footer-value">{{ formatNumber(totalRpAwal) }}</span>
                        </template>
                        <template v-else-if="col.field === 'Rp_Akhir'" #footer>
                            <span class="footer-value">{{ formatNumber(totalRpAkhir) }}</span>
                        </template>
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
const startDate = ref(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
const endDate = ref(new Date());
const filterGudang = ref(null);
const gudangList = ref<any[]>([]);
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

const gridColumns = [
    { field: "Kode", header: "Kode", width: "90px", minWidth: "80px" },
    { field: "Nama", header: "Nama Barang", width: "220px", minWidth: "180px" },
    { field: "Kategori", header: "Kategori", width: "120px", minWidth: "100px" },
    { field: "_Awal", header: "Stok Awal", width: "80px", minWidth: "70px", align: "right", type: "number" },
    { field: "Rp_Awal", header: "Rp Awal", width: "130px", minWidth: "110px", align: "right" },
    { field: "Penjualan", header: "Jual", width: "75px", minWidth: "65px", align: "right", type: "number" },
    { field: "Mutasi_in", header: "M-In", width: "70px", minWidth: "60px", align: "right", type: "number" },
    { field: "Mutasi_out", header: "M-Out", width: "70px", minWidth: "60px", align: "right", type: "number" },
    { field: "Penerimaan", header: "Terima", width: "75px", minWidth: "65px", align: "right", type: "number" },
    { field: "Koreksi", header: "Koreksi", width: "70px", minWidth: "60px", align: "right", type: "number" },
    { field: "Pemusnahan", header: "Musnah", width: "70px", minWidth: "60px", align: "right", type: "number" },
    { field: "Repacking", header: "Repack", width: "70px", minWidth: "60px", align: "right", type: "number" },
    { field: "Retur_Beli", header: "Retur", width: "70px", minWidth: "60px", align: "right", type: "number" },
    { field: "_Akhir", header: "Stok Akhir", width: "85px", minWidth: "75px", align: "right", type: "number" },
    { field: "Rp_Akhir", header: "Rp Akhir", width: "130px", minWidth: "110px", align: "right" },
];

const currencyFields = ["Rp_Awal", "Rp_Akhir"];
const isCurrencyField = (f: string) => currencyFields.includes(f);
const isNumericField = (col: any) => col.type === "number" || col.type === "currency" || isCurrencyField(col.field);
const filterableColumns = [
    { field: "Kode", header: "Kode" },
    { field: "Nama", header: "Nama" },
    { field: "Kategori", header: "Kategori" },
];

const activeFiltersCount = computed(() => {
    let count = 0;
    Object.keys(activeColumnFilters.value).forEach(k => { if (activeColumnFilters.value[k]?.length > 0) count++; });
    Object.keys(activeTextFilters.value).forEach(k => { if (activeTextFilters.value[k]?.trim()) count++; });
    Object.keys(numericFilters.value).forEach(k => { if (numericFilters.value[k]) count++; });
    return count;
});

const filteredData = computed(() => {
    let result = [...data.value];
    if (searchKeyword.value) {
        const kw = searchKeyword.value.toLowerCase();
        result = result.filter(row => Object.values(row).some(v => String(v).toLowerCase().includes(kw)));
    }
    Object.keys(activeColumnFilters.value).forEach(f => {
        const v = activeColumnFilters.value[f];
        if (v?.length > 0) result = result.filter(row => v.includes(String(row[f])));
    });
    Object.keys(activeTextFilters.value).forEach(f => {
        const v = activeTextFilters.value[f]?.toLowerCase();
        if (v) result = result.filter(row => String(row[f] || "").toLowerCase().includes(v));
    });
    Object.keys(numericFilters.value).forEach(field => {
        const filter = numericFilters.value[field];
        if (!filter) return;
        result = result.filter(row => {
            const val = parseFloat(row[field]) || 0;
            const v1 = parseFloat(filter.value1) || 0;
            const v2 = parseFloat(filter.value2) || 0;
            switch (filter.operator) {
                case "eq": return val === v1;
                case "neq": return val !== v1;
                case "gt": return val > v1;
                case "gte": return val >= v1;
                case "lt": return val < v1;
                case "lte": return val <= v1;
                case "between": return val >= v1 && val <= v2;
                default: return true;
            }
        });
    });
    return result;
});

const totalRpAwal = computed(() => filteredData.value.reduce((s, r) => s + (parseFloat(r.Rp_Awal) || 0), 0));
const totalRpAkhir = computed(() => filteredData.value.reduce((s, r) => s + (parseFloat(r.Rp_Akhir) || 0), 0));

const formatCurrency = (v: any) => { if (!v && v !== 0) return "-"; return "Rp " + Math.round(parseFloat(v)).toLocaleString("id-ID"); };
const formatNumber = (v: any) => { if (!v && v !== 0) return "-"; return Math.round(parseFloat(v)).toLocaleString("id-ID"); };
const formatDate = (d: Date): string => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const loadData = async () => {
    loading.value = true;
    try {
        const params: any = { start_date: formatDate(startDate.value), end_date: formatDate(endDate.value) };
        if (filterGudang.value) params.gudang = filterGudang.value;
        const res = await $api.get("/v1/report/kartu-stock", { params });
        if (res.data.success) { data.value = res.data.data; buildFilterOptions(); }
    } catch (e: any) {
        toast.add({ severity: "error", summary: "Gagal", detail: e.response?.data?.message || "Error", life: 3000 });
    } finally { loading.value = false; }
};

const loadGudang = async () => {
    try { const res = await $api.get("/gudang"); gudangList.value = res.data.data || []; } catch (e) { console.error(e); }
};

const resetTextFilters = () => { filterableColumns.forEach(c => textFilters.value[c.field] = ""); activeTextFilters.value = {}; };
const applyTextFilters = () => {
    activeTextFilters.value = {};
    filterableColumns.forEach(c => { if (textFilters.value[c.field]?.trim()) activeTextFilters.value[c.field] = textFilters.value[c.field].trim(); });
    showTextFilter.value = false;
};

const buildFilterOptions = () => {
    gridColumns.forEach(col => {
        if (isNumericField(col)) return;
        const vals = new Map<string, number>();
        data.value.forEach(r => { const v = String(r[col.field] || ""); if (v) vals.set(v, (vals.get(v) || 0) + 1); });
        filterOptionsCache.value[col.field] = Array.from(vals.entries()).map(([v, c]) => ({ value: v, label: v, count: c })).sort((a, b) => a.label.localeCompare(b.label));
    });
};
const setFilterOverlayRef = (f: string, el: any) => { if (el) filterOverlays.value[f] = el; };
const openColumnFilter = (col: any, event: Event) => {
    const overlay = filterOverlays.value[col.field];
    if (overlay) {
        if (!isNumericField(col) && !tempColumnFilters.value[col.field]) tempColumnFilters.value[col.field] = [...(activeColumnFilters.value[col.field] || [])];
        overlay.toggle(event);
    }
};
const closeFilterPanel = (f: string) => filterOverlays.value[f]?.hide();
const onFilterPanelHide = (f: string) => { tempColumnFilters.value[f] = [...(activeColumnFilters.value[f] || [])]; };
const getFilteredOptions = (f: string) => {
    const options = filterOptionsCache.value[f] || [];
    const term = filterSearchTerms.value[f]?.toLowerCase() || "";
    return term ? options.filter(opt => opt.label.toLowerCase().includes(term)) : options;
};
const selectAll = (f: string) => { tempColumnFilters.value[f] = (filterOptionsCache.value[f] || []).map(o => o.value); };
const clearFilter = (f: string) => { tempColumnFilters.value[f] = []; };
const hasColumnFilter = (f: string) => activeColumnFilters.value[f]?.length > 0;
const applyColumnFilter = (f: string) => { activeColumnFilters.value[f] = [...(tempColumnFilters.value[f] || [])]; closeFilterPanel(f); };
const applyNumericFilter = (field: string, filter: any) => { if (filter) numericFilters.value[field] = filter; else delete numericFilters.value[field]; closeFilterPanel(field); };

const exportExcel = async () => {
    const ExcelJS = await import("exceljs");
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Kartu Stock");
    const hs: any = { font: { bold: true, color: { argb: "FFFFFFFF" }, size: 10 }, fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FF10B981" } }, alignment: { horizontal: "center", vertical: "middle" } };
    const ds: any = { font: { size: 9 } };
    const ns: any = { ...ds, alignment: { horizontal: "right" }, numFmt: "#,##0" };
    ws.getRow(1).height = 22;
    gridColumns.forEach((c, i) => { const cell = ws.getRow(1).getCell(i + 1); cell.value = c.header; cell.style = hs; });
    filteredData.value.forEach((r, i) => {
        const dr = ws.getRow(2 + i);
        gridColumns.forEach((c, ci) => { const cell = dr.getCell(ci + 1); const isNum = isCurrencyField(c.field) || c.type === "number"; cell.value = isNum ? (parseFloat(r[c.field]) || 0) : String(r[c.field] ?? ""); cell.style = isNum ? ns : ds; });
    });
    const buf = await wb.xlsx.writeBuffer();
    const blob = new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a");
    a.href = url; a.download = `Kartu_Stock_${formatDate(new Date())}.xlsx`; a.click(); URL.revokeObjectURL(url);
    toast.add({ severity: "success", summary: "Excel", detail: "Berhasil", life: 2000 });
};

const exportPDF = () => {
    const period = `${startDate.value.toLocaleDateString("id-ID")} - ${endDate.value.toLocaleDateString("id-ID")}`;
    let html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>body{font-family:Arial;padding:12px;font-size:8px}h1{font-size:13px;text-align:center;color:#059669}table{width:100%;border-collapse:collapse}th{background:#10b981;color:#fff;padding:3px;border:1px solid #059669;font-size:6px}td{padding:2px 3px;border:1px solid #e5e7eb;font-size:7px}.r{text-align:right}.fb{font-weight:700;background:#fef3c7}</style></head><body><h1>Kartu Stock</h1><p style="text-align:center;color:#6b7280">${period}</p><table><thead><tr>${gridColumns.map(c => `<th>${c.header}</th>`).join("")}</tr></thead><tbody>`;
    filteredData.value.forEach(r => html += `<tr>${gridColumns.map(c => `<td class="${c.align === 'right' ? 'r' : ''}">${isCurrencyField(c.field) ? formatCurrency(r[c.field]) : c.type === 'number' ? formatNumber(r[c.field]) : r[c.field] || ''}</td>`).join("")}</tr>`);
    html += `<tr class="fb"><td colspan="3" style="text-align:right">TOTAL</td>${gridColumns.slice(3).map(c => `<td class="r">${c.field === 'Rp_Awal' ? formatNumber(totalRpAwal.value) : c.field === 'Rp_Akhir' ? formatNumber(totalRpAkhir.value) : ''}</td>`).join("")}</tr></tbody></table></body></html>`;
    const win = window.open("", "_blank", "width=1100,height=700");
    if (win) { win.document.write(html); win.document.close(); }
    toast.add({ severity: "success", summary: "Print", detail: "Gunakan Print > Save as PDF", life: 3000 });
};

onMounted(() => { loadGudang(); loadData(); resetTextFilters(); });
</script>

<style lang="scss" scoped>
.kartu-stock-page {
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.main-card {
    flex: 1;
    display: flex;
    flex-direction: column;
    background: var(--surface-card);
    border-radius: 0.5rem;
    border: 1px solid var(--surface-border);
    overflow: hidden;
    min-height: 0;
}

// ========== TOOLBAR ==========
.toolbar {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.45rem 0.65rem;
    border-bottom: 1px solid var(--surface-border);
    background: var(--surface-50);
    flex-shrink: 0;
    flex-wrap: wrap;

    @media (max-width: 900px) {
        gap: 0.35rem;
        padding: 0.35rem 0.5rem;
    }
}

.search-box {
    display: flex;
    align-items: center;
    background: var(--surface-0);
    border: 1px solid var(--surface-border);
    border-radius: 0.35rem;
    padding: 0 0.35rem;
    height: 1.85rem;
    width: 200px;
    flex-shrink: 0;

    i { font-size: 0.7rem; color: var(--text-color-secondary); }
    .clear-btn { cursor: pointer; margin-left: auto; }

    .search-input {
        flex: 1;
        border: none;
        background: transparent;
        padding: 0 0.3rem;
        font-size: 0.75rem;
        outline: none;
        color: var(--text-color);

        &::placeholder { color: var(--text-color-secondary); }
    }

    @media (max-width: 640px) { width: 100%; }
}

.filter-item {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    flex-shrink: 0;

    .filter-label { font-size: 0.68rem; font-weight: 600; color: var(--text-color-secondary); white-space: nowrap; }
    .date-sep { font-size: 0.68rem; color: var(--text-color-secondary); }

    :deep(.p-datepicker) {
        width: 125px;
        .p-datepicker-input { font-size: 0.73rem; height: 1.85rem; padding: 0 0.35rem; }
    }

    @media (max-width: 640px) { flex-wrap: wrap; .filter-label { width: 100%; } }
}

.gudang-select {
    width: 130px;
    :deep(.p-select) { height: 1.85rem; .p-select-label { font-size: 0.73rem; } }
    @media (max-width: 640px) { width: 100%; }
}

.filter-active { background: var(--primary-100) !important; color: var(--primary-700) !important; }

.actions {
    display: flex;
    gap: 0.1rem;
    margin-left: auto;
    flex-shrink: 0;
    align-items: center;

    :deep(.p-button) { width: 1.65rem !important; height: 1.65rem !important; }
}

// ========== TEXT FILTER PANEL ==========
.text-filter-panel {
    padding: 0.5rem 0.65rem;
    border-bottom: 1px solid var(--surface-border);
    background: var(--surface-0);
    display: flex;
    align-items: flex-end;
    gap: 0.5rem;
    flex-wrap: wrap;
    flex-shrink: 0;

    .text-filter-grid { display: flex; gap: 0.35rem; flex-wrap: wrap; flex: 1; }

    .text-filter-input {
        height: 1.75rem;
        padding: 0 0.4rem;
        border: 1px solid var(--surface-border);
        border-radius: 0.3rem;
        font-size: 0.72rem;
        outline: none;
        width: 140px;
    }

    .text-filter-actions { display: flex; gap: 0.25rem; flex-shrink: 0; }

    @media (max-width: 640px) { .text-filter-input { width: 100%; } }
}

// ========== TABLE AREA ==========
.table-area {
    flex: 1;
    overflow: hidden;
    min-height: 0;
    display: flex;
    flex-direction: column;
}

.data-table {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;

    :deep(.p-datatable-wrapper) {
        flex: 1;
        overflow: auto;
        min-height: 0;
    }

    :deep(.p-datatable-thead > tr > th) {
        background: var(--surface-50);
        font-size: 0.68rem;
        font-weight: 700;
        text-transform: uppercase;
        color: var(--text-color-secondary);
        padding: 0.35rem 0.45rem !important;
        border-bottom: 2px solid var(--surface-border);
        white-space: nowrap;
        letter-spacing: 0.03em;
        position: sticky;
        top: 0;
        z-index: 2;
    }

    :deep(.p-datatable-tbody > tr > td) {
        padding: 0.25rem 0.45rem;
        font-size: 0.75rem;
        white-space: nowrap;
    }

    :deep(.p-datatable-tbody > tr:hover) { background: var(--surface-50); }

    :deep(.p-datatable-tfoot > tr > td) {
        padding: 0.35rem 0.45rem;
        font-size: 0.72rem;
        font-weight: 700;
        background: var(--surface-100);
        border-top: 2px solid var(--primary-300);
        color: var(--primary-700);
        white-space: nowrap;
        position: sticky;
        bottom: 0;
        z-index: 2;
    }

    :deep(.p-paginator) {
        padding: 0.25rem 0.4rem;
        font-size: 0.7rem;
        border-top: 1px solid var(--surface-border);
        flex-shrink: 0;
        background: var(--surface-card);

        .p-paginator-page, .p-paginator-first, .p-paginator-prev,
        .p-paginator-next, .p-paginator-last {
            min-width: 1.5rem;
            height: 1.5rem;
            font-size: 0.7rem;
        }
    }

    :deep(.p-sortable-column-icon) {
        font-size: 0.6rem !important;
        width: 1.25rem;
        height: 1.25rem;
        display: inline-flex;
        align-items: center;
        justify-content: center;
    }

    @media (max-width: 768px) {
        :deep(.p-datatable-thead > tr > th) { font-size: 0.63rem; padding: 0.25rem 0.35rem !important; }
        :deep(.p-datatable-tbody > tr > td) { font-size: 0.7rem; padding: 0.2rem 0.35rem; }
    }
}

// ========== COLUMN HEADER ==========
.col-header {
    display: flex;
    align-items: center;
    width: 100%;

    .col-title { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .col-icons { display: flex; align-items: center; gap: 0.15rem; flex-shrink: 0; margin-left: auto; }
}

.col-filter-btn {
    width: 1.25rem;
    height: 1.25rem;
    border-radius: 0.2rem;
    border: none;
    background: transparent;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: all 0.12s;
    flex-shrink: 0;
    color: var(--text-color-secondary);

    i { font-size: 0.6rem; }

    &:hover { background: var(--surface-200); }

    &.active { opacity: 1; background: var(--primary-100); color: var(--primary-700); }
}

.col-header:hover .col-filter-btn { opacity: 1; }

// ========== CELLS ==========
.text-currency { font-weight: 600; color: var(--primary-600); }
.text-number { font-weight: 500; }
.footer-label { font-weight: 700; color: var(--primary-700); }
.footer-value { font-weight: 700; color: var(--primary-700); }

// ========== MINI FILTER ==========
.mini-filter {
    width: 230px;
    display: flex;
    flex-direction: column;

    .mini-filter-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0.45rem 0.65rem;
        border-bottom: 1px solid var(--surface-border);
        font-weight: 600;
        font-size: 0.76rem;
    }

    .mini-filter-search {
        position: relative;
        padding: 0.35rem 0.65rem;
        border-bottom: 1px solid var(--surface-border);

        i { position: absolute; left: 1.05rem; top: 50%; transform: translateY(-50%); font-size: 0.65rem; color: var(--text-color-secondary); }

        .mini-filter-input {
            width: 100%;
            height: 1.55rem;
            padding: 0 0.35rem 0 1.5rem;
            border: 1px solid var(--surface-border);
            border-radius: 0.25rem;
            font-size: 0.7rem;
            outline: none;
        }
    }

    .mini-filter-actions {
        display: flex;
        justify-content: space-between;
        padding: 0.25rem 0.65rem;
        border-bottom: 1px solid var(--surface-border);

        button { background: none; border: none; font-size: 0.65rem; color: var(--primary-600); cursor: pointer; font-weight: 500; }
    }

    .mini-filter-list { max-height: 160px; overflow-y: auto; padding: 0.15rem 0; }

    .mini-filter-opt {
        display: flex;
        align-items: center;
        gap: 0.35rem;
        padding: 0.25rem 0.65rem;
        cursor: pointer;
        font-size: 0.7rem;

        &:hover { background: var(--surface-50); }
        input[type="checkbox"] { width: 0.75rem; height: 0.75rem; accent-color: var(--primary-500); }
        span { flex: 1; }
        small { color: var(--text-color-secondary); font-size: 0.62rem; }
    }

    .mini-filter-empty { padding: 1.25rem; text-align: center; color: var(--text-color-secondary); font-size: 0.7rem; }
    .mini-filter-foot { padding: 0.35rem 0.65rem; border-top: 1px solid var(--surface-border); }
}

// ========== EMPTY ==========
.table-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 2.5rem;
    color: var(--text-color-secondary);
    gap: 0.5rem;

    i { font-size: 2rem; }
    span { font-size: 0.8rem; }
}
</style>