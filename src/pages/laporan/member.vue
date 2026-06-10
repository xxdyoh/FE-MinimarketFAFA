<template>
    <div class="report-page">
        <div class="main-card">
            <!-- Toolbar -->
            <div class="toolbar">
                <div class="search-box">
                    <i class="pi pi-search"></i>
                    <input v-model="searchKeyword" placeholder="Cari kode, nama, telepon..." class="search-input" @keydown.enter="onSearch" />
                    <i v-if="searchKeyword" class="pi pi-times clear-btn" @click="searchKeyword = ''; onSearch()"></i>
                </div>

                <div class="actions">
                    <Button icon="pi pi-refresh" text rounded size="small" :loading="loading" @click="loadData" v-tooltip.top="'Refresh'" />
                    <Button icon="pi pi-file-excel" text rounded size="small" severity="success" @click="exportExcel" v-tooltip.top="'Excel'" />
                    <Button icon="pi pi-print" text rounded size="small" @click="exportPDF" v-tooltip.top="'Print'" />
                </div>
            </div>

            <!-- Table -->
            <div class="table-area">
                <DataTable
                    :value="data"
                    :loading="loading"
                    stripedRows
                    size="small"
                    showGridlines
                    paginator
                    :rows="pagination.perPage"
                    :rowsPerPageOptions="[10, 25, 50, 100]"
                    :totalRecords="pagination.total"
                    :first="(pagination.currentPage - 1) * pagination.perPage"
                    @page="onPage"
                    @sort="onSort"
                    :sortField="sortField"
                    :sortOrder="sortOrder"
                    scrollable
                    scrollHeight="flex"
                    scrollDirection="horizontal"
                    responsiveLayout="scroll"
                    lazy
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
                                    <button class="col-filter-btn" :class="{ 'active': hasColumnFilter(col.field) }" @click.stop="openColumnFilter(col, $event)">
                                        <i class="pi pi-filter"></i>
                                    </button>
                                </div>
                                <OverlayPanel :ref="(el) => setFilterOverlayRef(col.field, el)" @hide="onFilterPanelHide(col.field)">
                                    <div class="mini-filter">
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
                        
                        <template v-if="col.field === 'Poin'" #body="{ data }">
                            <span class="poin-badge" :class="{ 'poin-tinggi': data.Poin >= 100 }">{{ formatNumber(data.Poin) }}</span>
                        </template>
                        <template v-else-if="col.field === 'Tgl_Daftar'" #body="{ data }">
                            <span class="text-muted">{{ formatDate(data.Tgl_Daftar) }}</span>
                        </template>
                        
                        <!-- Footer TOTAL -->
                        <template v-if="col.field === 'Kode'" #footer>
                            <span class="footer-label">TOTAL</span>
                        </template>
                        <template v-else-if="col.field === 'Poin'" #footer>
                            <span class="footer-value">{{ formatNumber(totalPoin) }}</span>
                        </template>
                    </Column>
                </DataTable>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { useToast } from "primevue/usetoast";
import OverlayPanel from "primevue/overlaypanel";

definePageMeta({ layout: "default" });

const { $api } = useNuxtApp();
const toast = useToast();

// State
const loading = ref(false);
const data = ref<any[]>([]);
const searchKeyword = ref("");
const sortField = ref("Kode");
const sortOrder = ref<1 | -1>(1);
const totalPoin = ref(0);

// Pagination
const pagination = reactive({
    currentPage: 1,
    perPage: 25,
    total: 0,
    lastPage: 1
});

// Column filter state
const filterOverlays = ref<Record<string, any>>({});
const tempColumnFilters = ref<Record<string, any[]>>({});
const activeColumnFilters = ref<Record<string, any[]>>({});
const filterSearchTerms = ref<Record<string, string>>({});
const filterOptionsCache = ref<Record<string, any[]>>({});

// Grid columns
const gridColumns = [
    { field: "Kode", header: "Kode", width: "120px", minWidth: "100px" },
    { field: "Nama", header: "Nama", width: "200px", minWidth: "160px" },
    { field: "Alamat", header: "Alamat", width: "250px", minWidth: "200px" },
    { field: "Kota", header: "Kota", width: "120px", minWidth: "100px" },
    { field: "Telp", header: "Telepon", width: "130px", minWidth: "110px" },
    { field: "Fax", header: "Fax", width: "120px", minWidth: "100px" },
    { field: "Tgl_Daftar", header: "Tgl Daftar", width: "110px", minWidth: "95px" },
    { field: "Poin", header: "Poin", width: "80px", minWidth: "70px", align: "center" },
];

// Helpers
const formatNumber = (v: any) => { 
    if (!v && v !== 0) return "0"; 
    return Math.round(parseFloat(v)).toLocaleString("id-ID"); 
};

const formatDate = (v: string) => { 
    if (!v) return "-"; 
    const d = new Date(v); 
    return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`; 
};

// Build query params
const buildQueryParams = () => {
    const params: any = {
        page: pagination.currentPage,
        per_page: pagination.perPage,
    };
    if (searchKeyword.value) params.search = searchKeyword.value;
    if (sortField.value) params.sort_by = sortField.value;
    if (sortOrder.value) params.sort_order = sortOrder.value === 1 ? 'asc' : 'desc';
    return params;
};

// Load data
const loadData = async () => {
    loading.value = true;
    try {
        const params = buildQueryParams();
        const res = await $api.get("/v1/report/member", { params });
        if (res.data.success) {
            data.value = res.data.data;
            pagination.total = res.data.pagination?.total || 0;
            pagination.lastPage = res.data.pagination?.last_page || 1;
            pagination.currentPage = res.data.pagination?.current_page || 1;
            pagination.perPage = res.data.pagination?.per_page || 25;
            totalPoin.value = res.data.total_poin || 0;
            buildFilterOptions();
        }
    } catch (e: any) {
        toast.add({ severity: "error", summary: "Gagal", detail: e.response?.data?.message || "Error", life: 3000 });
    } finally { loading.value = false; }
};

// Search handler
let searchTimeout: any;
const onSearch = () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        pagination.currentPage = 1;
        loadData();
    }, 400);
};

// Server-side pagination
const onPage = (event: any) => {
    pagination.currentPage = event.page + 1;
    pagination.perPage = event.rows;
    loadData();
};

// Server-side sort
const onSort = (event: any) => {
    sortField.value = event.sortField;
    sortOrder.value = event.sortOrder === 1 ? 1 : -1;
    pagination.currentPage = 1;
    loadData();
};

// Column filters
const buildFilterOptions = () => {
    gridColumns.forEach(col => {
        const m = new Map<string, number>();
        data.value.forEach(r => {
            const v = String(r[col.field] || "");
            if (v) m.set(v, (m.get(v) || 0) + 1);
        });
        filterOptionsCache.value[col.field] = Array.from(m.entries())
            .map(([v, c]) => ({ value: v, label: v, count: c }))
            .sort((a, b) => a.label.localeCompare(b.label));
    });
};

const setFilterOverlayRef = (f: string, el: any) => { if (el) filterOverlays.value[f] = el; };

const openColumnFilter = (col: any, e: Event) => {
    const o = filterOverlays.value[col.field];
    if (o) {
        if (!tempColumnFilters.value[col.field]) {
            tempColumnFilters.value[col.field] = [...(activeColumnFilters.value[col.field] || [])];
        }
        o.toggle(e);
    }
};

const closeFilterPanel = (f: string) => filterOverlays.value[f]?.hide();

const onFilterPanelHide = (f: string) => {
    tempColumnFilters.value[f] = [...(activeColumnFilters.value[f] || [])];
};

const getFilteredOptions = (f: string) => {
    const o = filterOptionsCache.value[f] || [];
    const t = filterSearchTerms.value[f]?.toLowerCase() || "";
    return t ? o.filter(opt => opt.label.toLowerCase().includes(t)) : o;
};

const selectAll = (f: string) => { 
    tempColumnFilters.value[f] = (filterOptionsCache.value[f] || []).map(o => o.value); 
};

const clearFilter = (f: string) => { 
    tempColumnFilters.value[f] = []; 
};

const hasColumnFilter = (f: string) => activeColumnFilters.value[f]?.length > 0;

const applyColumnFilter = (f: string) => {
    activeColumnFilters.value[f] = [...(tempColumnFilters.value[f] || [])];
    closeFilterPanel(f);
};

// Export Excel - fetch all data
const exportExcel = async () => {
    try {
        toast.add({ severity: "info", summary: "Export", detail: "Mengambil semua data...", life: 2000 });
        const res = await $api.get("/v1/report/member", { params: { per_page: 9999 } });
        if (!res.data.success) return;
        
        const allData = res.data.data;
        const ExcelJS = await import("exceljs");
        const wb = new ExcelJS.Workbook();
        const ws = wb.addWorksheet("Member");
        
        const hs: any = { 
            font: { bold: true, color: { argb: "FFFFFFFF" }, size: 10 }, 
            fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FF10B981" } }, 
            alignment: { horizontal: "center", vertical: "middle" } 
        };
        const ds: any = { font: { size: 9 } };
        const ns: any = { ...ds, alignment: { horizontal: "right" }, numFmt: "#,##0" };
        
        ws.getRow(1).height = 22;
        gridColumns.forEach((c, i) => {
            const cell = ws.getRow(1).getCell(i + 1);
            cell.value = c.header;
            cell.style = hs;
        });
        
        allData.forEach((r: any, i: number) => {
            const dr = ws.getRow(2 + i);
            gridColumns.forEach((c, ci) => {
                const cell = dr.getCell(ci + 1);
                cell.value = c.field === 'Poin' ? (parseInt(r[c.field]) || 0) : String(r[c.field] ?? "");
                cell.style = c.field === 'Poin' ? ns : ds;
            });
        });
        
        ws.autoFilter = { from: "A1", to: `H${1 + allData.length}` };
        ws.views = [{ state: "frozen", ySplit: 1 }];
        
        const buf = await wb.xlsx.writeBuffer();
        const blob = new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `Member_${new Date().toISOString().split("T")[0]}.xlsx`;
        a.click();
        URL.revokeObjectURL(url);
        toast.add({ severity: "success", summary: "Excel", detail: `${allData.length} data berhasil diexport`, life: 2000 });
    } catch (e: any) {
        toast.add({ severity: "error", summary: "Gagal", detail: "Export gagal", life: 3000 });
    }
};

// Export PDF - fetch all data
const exportPDF = async () => {
    try {
        toast.add({ severity: "info", summary: "Export", detail: "Mengambil semua data...", life: 2000 });
        const res = await $api.get("/v1/report/member", { params: { per_page: 9999 } });
        if (!res.data.success) return;
        
        const allData = res.data.data;
        const totalSemua = allData.reduce((s: number, r: any) => s + (parseInt(r.Poin) || 0), 0);
        
        let html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
            body{font-family:Arial;padding:12px;font-size:8px}
            h1{font-size:13px;text-align:center;color:#059669;margin-bottom:4px}
            .sub{text-align:center;color:#6b7280;font-size:9px;margin-bottom:10px}
            table{width:100%;border-collapse:collapse}
            th{background:#10b981;color:#fff;padding:3px 4px;border:1px solid #059669;font-size:7px;text-transform:uppercase}
            td{padding:2px 4px;border:1px solid #e5e7eb;font-size:7px}
            .r{text-align:right}.c{text-align:center}
            .fb{font-weight:700;background:#fef3c7}
        </style></head><body>
        <h1>Laporan Member</h1>
        <div class="sub">Total: ${allData.length} member | Total Poin: ${formatNumber(totalSemua)}</div>
        <table><thead><tr>${gridColumns.map(c => `<th>${c.header}</th>`).join("")}</tr></thead><tbody>`;
        
        allData.forEach((r: any) => {
            html += `<tr>${gridColumns.map(c => 
                `<td class="${c.align === 'right' ? 'r' : c.align === 'center' ? 'c' : ''}">${
                    c.field === 'Poin' ? formatNumber(r.Poin) : 
                    c.field === 'Tgl_Daftar' ? formatDate(r.Tgl_Daftar) : 
                    r[c.field] || ''
                }</td>`
            ).join("")}</tr>`;
        });
        
        html += `<tr class="fb"><td colspan="7" style="text-align:right">TOTAL POIN</td><td class="r">${formatNumber(totalSemua)}</td></tr>`;
        html += `</tbody></table></body></html>`;
        
        const win = window.open("", "_blank", "width=1000,height=700");
        if (win) { win.document.write(html); win.document.close(); }
        toast.add({ severity: "success", summary: "Print", detail: "Gunakan Print > Save as PDF", life: 3000 });
    } catch (e: any) {
        toast.add({ severity: "error", summary: "Gagal", detail: "Export gagal", life: 3000 });
    }
};

onMounted(() => { loadData(); });
</script>

<style lang="scss" scoped>
.report-page { height: 100%; display: flex; flex-direction: column; overflow: hidden; }
.main-card { flex: 1; display: flex; flex-direction: column; background: var(--surface-card); border-radius: 0.5rem; border: 1px solid var(--surface-border); overflow: hidden; min-height: 0; }

// Toolbar
.toolbar { 
    display: flex; align-items: center; gap: 0.5rem; padding: 0.45rem 0.65rem; 
    border-bottom: 1px solid var(--surface-border); background: var(--surface-50); 
    flex-shrink: 0; flex-wrap: wrap; 
}

.search-box { 
    display: flex; align-items: center; background: var(--surface-0); 
    border: 1px solid var(--surface-border); border-radius: 0.35rem; 
    padding: 0 0.35rem; height: 1.85rem; width: 220px; flex-shrink: 0; 
    
    i { font-size: 0.7rem; color: var(--text-color-secondary); } 
    .clear-btn { cursor: pointer; margin-left: auto; &:hover { color: var(--text-color); } } 
    
    .search-input { 
        flex: 1; border: none; background: transparent; padding: 0 0.3rem; 
        font-size: 0.75rem; outline: none; color: var(--text-color); 
        &::placeholder { color: var(--text-color-secondary); } 
    }
    
    @media (max-width: 640px) { width: 100%; }
}

.actions { 
    display: flex; gap: 0.1rem; margin-left: auto; flex-shrink: 0; align-items: center; 
    :deep(.p-button) { width: 1.65rem !important; height: 1.65rem !important; } 
}

// Table area
.table-area { flex: 1; overflow: hidden; min-height: 0; display: flex; flex-direction: column; }

.data-table { 
    flex: 1; display: flex; flex-direction: column; min-height: 0;
    
    :deep(.p-datatable-wrapper) { flex: 1; overflow: auto; min-height: 0; }
    
    :deep(.p-datatable-thead > tr > th) { 
        background: var(--surface-50); font-size: 0.68rem; font-weight: 700; 
        text-transform: uppercase; color: var(--text-color-secondary); 
        padding: 0.35rem 0.45rem !important; border-bottom: 2px solid var(--surface-border); 
        white-space: nowrap; letter-spacing: 0.03em; position: sticky; top: 0; z-index: 2; 
    }
    
    :deep(.p-datatable-tbody > tr > td) { 
        padding: 0.25rem 0.45rem; font-size: 0.75rem; white-space: nowrap; 
    }
    
    :deep(.p-datatable-tbody > tr:hover) { background: var(--surface-50); }
    
    :deep(.p-datatable-tfoot > tr > td) { 
        padding: 0.35rem 0.45rem; font-size: 0.72rem; font-weight: 700; 
        background: var(--surface-100); border-top: 2px solid var(--primary-300); 
        color: var(--primary-700); position: sticky; bottom: 0; z-index: 2; 
    }
    
    :deep(.p-paginator) { 
        padding: 0.25rem 0.4rem; font-size: 0.7rem; border-top: 1px solid var(--surface-border); 
        flex-shrink: 0; background: var(--surface-card); 
        
        .p-paginator-page, .p-paginator-first, .p-paginator-prev, 
        .p-paginator-next, .p-paginator-last { 
            min-width: 1.5rem; height: 1.5rem; font-size: 0.7rem; 
        } 
    }
    
    :deep(.p-sortable-column-icon) { 
        font-size: 0.6rem !important; width: 1.25rem; height: 1.25rem; 
        display: inline-flex; align-items: center; justify-content: center; 
    }
    
    @media (max-width: 768px) {
        :deep(.p-datatable-thead > tr > th) { font-size: 0.63rem; padding: 0.25rem 0.35rem !important; }
        :deep(.p-datatable-tbody > tr > td) { font-size: 0.7rem; padding: 0.2rem 0.35rem; }
    }
}

// Column header
.col-header { 
    display: flex; align-items: center; width: 100%; 
    
    .col-title { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; } 
    .col-icons { display: flex; align-items: center; gap: 0.15rem; flex-shrink: 0; margin-left: auto; } 
}

.col-filter-btn { 
    width: 1.25rem; height: 1.25rem; border-radius: 0.2rem; border: none; 
    background: transparent; cursor: pointer; display: flex; align-items: center; 
    justify-content: center; opacity: 0; transition: all 0.12s; flex-shrink: 0; 
    color: var(--text-color-secondary); 
    
    i { font-size: 0.6rem; } 
    &:hover { background: var(--surface-200); } 
    &.active { opacity: 1; background: var(--primary-100); color: var(--primary-700); } 
}

.col-header:hover .col-filter-btn { opacity: 1; }

// Poin badge
.poin-badge { 
    display: inline-block; padding: 0.15rem 0.5rem; border-radius: 1rem; 
    font-weight: 600; font-size: 0.72rem; background: #f1f5f9; color: #64748b; 
    
    &.poin-tinggi { background: #fef3c7; color: #d97706; } 
}

// Footer
.footer-label { font-weight: 700; color: var(--primary-700); }
.footer-value { font-weight: 700; color: var(--primary-700); }

.text-muted { color: var(--text-color-secondary); }

// Mini filter panel
.mini-filter { 
    width: 230px; display: flex; flex-direction: column; 
    
    .mini-filter-head { 
        display: flex; align-items: center; justify-content: space-between; 
        padding: 0.45rem 0.65rem; border-bottom: 1px solid var(--surface-border); 
        font-weight: 600; font-size: 0.76rem; 
    }
    
    .mini-filter-search { 
        position: relative; padding: 0.35rem 0.65rem; border-bottom: 1px solid var(--surface-border); 
        
        i { position: absolute; left: 1.05rem; top: 50%; transform: translateY(-50%); font-size: 0.65rem; color: var(--text-color-secondary); } 
        
        .mini-filter-input { 
            width: 100%; height: 1.55rem; padding: 0 0.35rem 0 1.5rem; 
            border: 1px solid var(--surface-border); border-radius: 0.25rem; 
            font-size: 0.7rem; outline: none; 
        } 
    }
    
    .mini-filter-actions { 
        display: flex; justify-content: space-between; padding: 0.25rem 0.65rem; 
        border-bottom: 1px solid var(--surface-border); 
        
        button { background: none; border: none; font-size: 0.65rem; color: var(--primary-600); cursor: pointer; font-weight: 500; } 
    }
    
    .mini-filter-list { max-height: 160px; overflow-y: auto; padding: 0.15rem 0; }
    
    .mini-filter-opt { 
        display: flex; align-items: center; gap: 0.35rem; padding: 0.25rem 0.65rem; 
        cursor: pointer; font-size: 0.7rem; 
        
        &:hover { background: var(--surface-50); } 
        input[type="checkbox"] { width: 0.75rem; height: 0.75rem; accent-color: var(--primary-500); } 
        span { flex: 1; } 
        small { color: var(--text-color-secondary); font-size: 0.62rem; } 
    }
    
    .mini-filter-empty { padding: 1.25rem; text-align: center; color: var(--text-color-secondary); font-size: 0.7rem; } 
    .mini-filter-foot { padding: 0.35rem 0.65rem; border-top: 1px solid var(--surface-border); } 
}

// Empty state
.table-empty { 
    display: flex; flex-direction: column; align-items: center; padding: 2.5rem; 
    color: var(--text-color-secondary); gap: 0.5rem; 
    
    i { font-size: 2rem; } 
    span { font-size: 0.8rem; } 
}
</style>