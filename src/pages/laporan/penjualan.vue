<template>
    <div class="report-page">
        <div class="main-card">
            <!-- Toolbar -->
            <div class="toolbar">
                <div class="search-box">
                    <i class="pi pi-search"></i>
                    <input v-model="searchKeyword" placeholder="Cari nomor, customer..." class="search-input" />
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

            <!-- Table -->
            <div class="table-area">
                <DataTable
                    v-model:expandedRows="expandedRows"
                    :value="filteredData" :loading="loading" stripedRows size="small" showGridlines
                    dataKey="Nomor" @rowExpand="onRowExpand"
                    paginator :rows="25" :rowsPerPageOptions="[10, 25, 50, 100]"
                    sortField="Tanggal" :sortOrder="-1"
                    scrollable scrollHeight="flex" scrollDirection="horizontal" responsiveLayout="scroll"
                    class="data-table"
                >
                    <template #empty>
                        <div class="table-empty"><i class="pi pi-inbox"></i><span>Tidak ada data</span></div>
                    </template>

                    <Column expander style="width: 2.5rem; minWidth: 2.5rem;" />

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
                                    <NumericFilter 
                                        v-if="isNumericField(col) || col.field === 'Tanggal'"
                                        :label="col.header"
                                        :currentFilter="numericFilters[col.field]"
                                        :isDate="col.field === 'Tanggal'"
                                        @apply="(f: any) => applyNumericFilter(col.field, f)"
                                        @close="closeFilterPanel(col.field)"
                                    />
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
                        <template v-if="col.field === 'Nomor'" #footer><span class="footer-label">TOTAL</span></template>
                        <template v-else-if="col.field === 'Total'" #footer><span class="footer-value">{{ formatCurrency(totalAll) }}</span></template>
                        <template v-else-if="col.field === 'Cash'" #footer><span class="footer-value">{{ formatCurrency(totalCash) }}</span></template>
                        <template v-else-if="col.field === 'Card'" #footer><span class="footer-value">{{ formatCurrency(totalCard) }}</span></template>
                        <template v-else-if="col.field === 'Voucher'" #footer><span class="footer-value">{{ formatCurrency(totalVoucher) }}</span></template>
                        <template v-else-if="col.field === 'Piutang'" #footer><span class="footer-value">{{ formatCurrency(totalPiutang) }}</span></template>
                        <template v-else-if="col.field === 'Potongan'" #footer><span class="footer-value">{{ formatCurrency(totalPotongan) }}</span></template>
                        <template v-else-if="col.field === 'Ongkir'" #footer><span class="footer-value">{{ formatCurrency(totalOngkir) }}</span></template>
                    </Column>

                    <template #expansion="slotProps">
                        <div class="detail-content">
                            <div class="detail-header"><i class="pi pi-list"></i><span>Detail Items - {{ slotProps.data.Nomor }}</span></div>
                            <div v-if="detailLoading[slotProps.data.Nomor]" class="detail-loading"><i class="pi pi-spinner pi-spin"></i> Memuat...</div>
                            <DataTable v-else :value="detailData[slotProps.data.Nomor] || []" class="detail-table" size="small">
                                <Column field="Kode" header="Kode" style="width: 80px" />
                                <Column field="Nama" header="Nama Barang" style="min-width: 180px" />
                                <Column field="Satuan" header="Sat" style="width: 60px; text-align: center" />
                                <Column field="Jumlah" header="Qty" style="width: 55px; text-align: center" />
                                <Column field="Harga" header="Harga" style="width: 100px; text-align: right"><template #body="{ data }">{{ formatCurrency(data.Harga) }}</template></Column>
                                <Column field="Disc" header="Disc%" style="width: 55px; text-align: center" />
                                <Column field="DiscRp" header="DiscRp" style="width: 100px; text-align: right"><template #body="{ data }">{{ formatCurrency(data.DiscRp) }}</template></Column>
                                <Column field="Nilai" header="Nilai" style="width: 110px; text-align: right"><template #body="{ data }"><span class="text-currency">{{ formatCurrency(data.Nilai) }}</span></template></Column>
                            </DataTable>
                        </div>
                    </template>
                </DataTable>
            </div>
        </div>

        <!-- Export Dialog -->
        <Dialog v-model:visible="exportDialog" header="Export Laporan" :modal="true" :style="{ width: '400px' }" :breakpoints="{ '480px': '90vw' }">
            <div class="export-dialog-content">
                <p class="export-dialog-text">Pilih tipe export:</p>
                <div class="export-option-card" :class="{ 'active': !exportWithDetail }" @click="exportWithDetail = false">
                    <div class="export-option-icon"><i class="pi pi-file"></i></div>
                    <div class="export-option-info"><strong>Ringkasan</strong><small>Hanya data header</small></div>
                    <i class="pi pi-check-circle check-icon" v-if="!exportWithDetail"></i>
                </div>
                <div class="export-option-card" :class="{ 'active': exportWithDetail }" @click="exportWithDetail = true">
                    <div class="export-option-icon"><i class="pi pi-list"></i></div>
                    <div class="export-option-info"><strong>Dengan Detail</strong><small>Header + detail per nota</small></div>
                    <i class="pi pi-check-circle check-icon" v-if="exportWithDetail"></i>
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
import { ref, computed, onMounted } from "vue";
import { useToast } from "primevue/usetoast";
import OverlayPanel from "primevue/overlaypanel";
import NumericFilter from "~/components/report/NumericFilter.vue";

definePageMeta({ layout: "default" });

const { $api } = useNuxtApp();
const toast = useToast();

const loading = ref(false);
const data = ref<any[]>([]);
const detailData = ref<Record<string, any[]>>({});
const detailLoading = ref<Record<string, boolean>>({});
const expandedRows = ref<Record<string, boolean>>({});
const startDate = ref(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
const endDate = ref(new Date());
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
const exportDialog = ref(false);
const exportWithDetail = ref(true);
const exportType = ref<'excel' | 'pdf' | 'csv'>('excel');

const gridColumns = [
    { field: "Nomor", header: "Nomor", width: "120px", minWidth: "100px" },
    { field: "Tanggal", header: "Tanggal", width: "100px", minWidth: "85px" },
    { field: "Jam", header: "Jam", width: "70px", minWidth: "60px", align: "center" },
    { field: "Customer", header: "Customer", width: "170px", minWidth: "140px" },
    { field: "Total", header: "Total", width: "120px", minWidth: "100px", align: "right" },
    { field: "Cash", header: "Cash", width: "100px", minWidth: "85px", align: "right" },
    { field: "Card", header: "Card", width: "90px", minWidth: "75px", align: "right" },
    { field: "No_Card", header: "No Card", width: "120px", minWidth: "100px" },
    { field: "Bank", header: "Bank", width: "110px", minWidth: "90px" },
    { field: "Voucher", header: "Voucher", width: "90px", minWidth: "75px", align: "right" },
    { field: "No_Voucher", header: "No Voucher", width: "110px", minWidth: "90px" },
    { field: "Piutang", header: "Piutang", width: "110px", minWidth: "90px", align: "right" },
    { field: "Bayar_Piutang", header: "Bayar Piutang", width: "120px", minWidth: "100px", align: "right" },
    { field: "Potongan", header: "Potongan", width: "100px", minWidth: "85px", align: "right" },
    { field: "Ongkir", header: "Ongkir", width: "90px", minWidth: "75px", align: "right" },
    { field: "IsPosting", header: "Posting", width: "70px", minWidth: "60px", align: "center" },
    { field: "NoPosting", header: "No Posting", width: "110px", minWidth: "90px" },
];

const filterableColumns = [
    { field: "Nomor", header: "Nomor" },
    { field: "Customer", header: "Customer" },
];

const currencyFields = ["Total", "Cash", "Card", "Voucher", "Piutang", "Bayar_Piutang", "Potongan", "Ongkir"];
const isCurrencyField = (f: string) => currencyFields.includes(f);
const isNumericField = (col: any) => currencyFields.includes(col.field) || col.field === 'Tanggal';

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

const totalAll = computed(() => filteredData.value.reduce((s, r) => s + (parseFloat(r.Total) || 0), 0));
const totalCash = computed(() => filteredData.value.reduce((s, r) => s + (parseFloat(r.Cash) || 0), 0));
const totalCard = computed(() => filteredData.value.reduce((s, r) => s + (parseFloat(r.Card) || 0), 0));
const totalVoucher = computed(() => filteredData.value.reduce((s, r) => s + (parseFloat(r.Voucher) || 0), 0));
const totalPiutang = computed(() => filteredData.value.reduce((s, r) => s + (parseFloat(r.Piutang) || 0), 0));
const totalPotongan = computed(() => filteredData.value.reduce((s, r) => s + (parseFloat(r.Potongan) || 0), 0));
const totalOngkir = computed(() => filteredData.value.reduce((s, r) => s + (parseFloat(r.Ongkir) || 0), 0));

const formatCurrency = (v: any) => { if (!v && v !== 0) return "-"; return "Rp " + Math.round(parseFloat(v)).toLocaleString("id-ID"); };
const formatDate = (d: Date): string => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const loadData = async () => {
    loading.value = true;
    try {
        const res = await $api.get("/v1/report/penjualan", { params: { start_date: formatDate(startDate.value), end_date: formatDate(endDate.value) } });
        if (res.data.success) { data.value = res.data.data; buildFilterOptions(); }
    } catch (e: any) { toast.add({ severity: "error", summary: "Gagal", detail: e.response?.data?.message || "Gagal", life: 3000 }); }
    finally { loading.value = false; }
};

const onRowExpand = async (event: any) => {
    const nomor = event.data.Nomor;
    if (!detailData.value[nomor]) {
        detailLoading.value[nomor] = true;
        try { const res = await $api.get(`/v1/report/penjualan/${nomor}/detail`, { params: { start_date: formatDate(startDate.value), end_date: formatDate(endDate.value) } }); if (res.data.success) detailData.value[nomor] = res.data.data; } catch (e) { console.error(e); }
        finally { detailLoading.value[nomor] = false; }
    }
};

const resetTextFilters = () => { filterableColumns.forEach(c => textFilters.value[c.field] = ""); activeTextFilters.value = {}; };
const applyTextFilters = () => { activeTextFilters.value = {}; filterableColumns.forEach(c => { if (textFilters.value[c.field]?.trim()) activeTextFilters.value[c.field] = textFilters.value[c.field].trim(); }); showTextFilter.value = false; };

const buildFilterOptions = () => { gridColumns.forEach(col => { if (isNumericField(col) || col.field === 'Tanggal') return; const m = new Map<string, number>(); data.value.forEach(r => { const v = String(r[col.field] || ""); if (v) m.set(v, (m.get(v) || 0) + 1); }); filterOptionsCache.value[col.field] = Array.from(m.entries()).map(([v, c]) => ({ value: v, label: v, count: c })).sort((a, b) => a.label.localeCompare(b.label)); }); };
const setFilterOverlayRef = (f: string, el: any) => { if (el) filterOverlays.value[f] = el; };
const openColumnFilter = (col: any, e: Event) => { const o = filterOverlays.value[col.field]; if (o) { const isNumOrDate = isNumericField(col) || col.field === 'Tanggal'; if (!isNumOrDate && !tempColumnFilters.value[col.field]) tempColumnFilters.value[col.field] = [...(activeColumnFilters.value[col.field] || [])]; o.toggle(e); } };
const closeFilterPanel = (f: string) => filterOverlays.value[f]?.hide();
const onFilterPanelHide = (f: string) => { tempColumnFilters.value[f] = [...(activeColumnFilters.value[f] || [])]; };
const getFilteredOptions = (f: string) => { const o = filterOptionsCache.value[f] || [], t = filterSearchTerms.value[f]?.toLowerCase() || ""; return t ? o.filter(opt => opt.label.toLowerCase().includes(t)) : o; };
const selectAll = (f: string) => { tempColumnFilters.value[f] = (filterOptionsCache.value[f] || []).map(o => o.value); };
const clearFilter = (f: string) => { tempColumnFilters.value[f] = []; };
const hasColumnFilter = (f: string) => activeColumnFilters.value[f]?.length > 0;
const applyColumnFilter = (f: string) => { activeColumnFilters.value[f] = [...(tempColumnFilters.value[f] || [])]; closeFilterPanel(f); };
const applyNumericFilter = (field: string, filter: any) => { if (filter) numericFilters.value[field] = filter; else delete numericFilters.value[field]; closeFilterPanel(field); };

const exportExcel = () => { exportType.value = 'excel'; exportDialog.value = true; };
const exportPDF = () => { exportType.value = 'pdf'; exportDialog.value = true; };
const exportCSV = () => { exportType.value = 'csv'; exportDialog.value = true; };
const loadAllDetails = async () => { await Promise.all(filteredData.value.map(async row => { if (!detailData.value[row.Nomor]) { try { const res = await $api.get(`/v1/report/penjualan/${row.Nomor}/detail`, { params: { start_date: formatDate(startDate.value), end_date: formatDate(endDate.value) } }); if (res.data.success) detailData.value[row.Nomor] = res.data.data; } catch (e) { console.error(e); } } })); };
const proceedExport = async () => { exportDialog.value = false; if (exportWithDetail.value) await loadAllDetails(); if (exportType.value === 'excel') doExportExcel(); else if (exportType.value === 'pdf') doExportPDF(); else doExportCSV(); };

const doExportExcel = async () => {
    const ExcelJS = await import('exceljs'); const wb = new ExcelJS.Workbook();
    const hs: any = { font: { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 }, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF10B981' } }, alignment: { horizontal: 'center', vertical: 'middle' } };
    const ds: any = { font: { size: 9 } }, ns: any = { ...ds, alignment: { horizontal: 'right' }, numFmt: '#,##0' };
    const ws1 = wb.addWorksheet('Ringkasan'); ws1.getRow(4).height = 22;
    gridColumns.forEach((c, i) => { const cell = ws1.getRow(4).getCell(i + 1); cell.value = c.header; cell.style = hs; });
    filteredData.value.forEach((r, i) => { const dr = ws1.getRow(5 + i); gridColumns.forEach((c, ci) => { const cell = dr.getCell(ci + 1); cell.value = isCurrencyField(c.field) ? (parseFloat(r[c.field]) || 0) : String(r[c.field] ?? ""); cell.style = isCurrencyField(c.field) ? ns : ds; }); });
    ws1.autoFilter = { from: 'A4', to: `Q${4 + filteredData.value.length}` }; ws1.views = [{ state: 'frozen', ySplit: 4 }];
    if (exportWithDetail.value) { const ws2 = wb.addWorksheet('Detail Items'); ws2.getRow(4).height = 22; ['No. Nota','Customer','Kode','Nama','Sat','Qty','Harga','Disc%','DiscRp','Nilai'].forEach((h,i)=>{const cell=ws2.getRow(4).getCell(i+1);cell.value=h;cell.style={...hs,fill:{type:'pattern',pattern:'solid',fgColor:{argb:'FF3B82F6'}}};}); let rn=5; filteredData.value.forEach(row=>{const d=detailData.value[row.Nomor]||[];if(d.length===0){const dr=ws2.getRow(rn);dr.getCell(1).value=row.Nomor;dr.getCell(2).value=row.Customer;dr.getCell(4).value='(Tidak ada detail)';rn++}else d.forEach((di,diIdx)=>{const dr=ws2.getRow(rn);dr.getCell(1).value=diIdx===0?row.Nomor:'';dr.getCell(2).value=diIdx===0?row.Customer:'';dr.getCell(3).value=di.Kode||'';dr.getCell(4).value=di.Nama||'';dr.getCell(5).value=di.Satuan||'';dr.getCell(6).value=parseInt(di.Jumlah)||0;dr.getCell(7).value=parseFloat(di.Harga)||0;dr.getCell(8).value=parseInt(di.Disc)||0;dr.getCell(9).value=parseFloat(di.DiscRp)||0;dr.getCell(10).value=parseFloat(di.Nilai)||0;[6,7,9,10].forEach(c=>dr.getCell(c).style=ns);rn++})}); ws2.autoFilter={from:'A4',to:`J${rn-1}`};ws2.views=[{state:'frozen',ySplit:4}]; }
    const buf=await wb.xlsx.writeBuffer();const blob=new Blob([buf],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`Penjualan_${formatDate(new Date())}${exportWithDetail.value?'_Lengkap':''}.xlsx`;a.click();URL.revokeObjectURL(url);toast.add({severity:'success',summary:'Excel',detail:'Berhasil',life:2000});
};
const doExportCSV = () => { let csv='\uFEFF'; if(exportWithDetail.value){csv+='Nomor,Tanggal,Customer,Total,Kode,Nama,Satuan,Qty,Harga,Disc%,DiscRp,Nilai\n';filteredData.value.forEach(r=>{const d=detailData.value[r.Nomor]||[];if(d.length===0)csv+=`${r.Nomor},${r.Tanggal},${r.Customer},${r.Total},,,,,,,\n`;else d.forEach(di=>csv+=`${r.Nomor},${r.Tanggal},${r.Customer},${r.Total},${di.Kode},"${di.Nama}",${di.Satuan},${di.Jumlah},${di.Harga},${di.Disc},${di.DiscRp},${di.Nilai}\n`)})} else{csv+=gridColumns.map(c=>`"${c.header}"`).join(',')+'\n';filteredData.value.forEach(r=>csv+=gridColumns.map(c=>`"${String(r[c.field]||'').replace(/"/g,'""')}"`).join(',')+'\n')} const blob=new Blob([csv],{type:'text/csv;charset=utf-8;'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`Penjualan_${formatDate(new Date())}.csv`;a.click();URL.revokeObjectURL(url);toast.add({severity:'success',summary:'CSV',detail:'Berhasil',life:2000}); };
const doExportPDF = () => { const period=`${startDate.value.toLocaleDateString('id-ID')} - ${endDate.value.toLocaleDateString('id-ID')}`; let html=`<!DOCTYPE html><html><head><meta charset="UTF-8"><style>body{font-family:Arial;padding:12px;font-size:8px}h1{font-size:13px;text-align:center;color:#059669}table{width:100%;border-collapse:collapse}th{background:#10b981;color:#fff;padding:3px;border:1px solid #059669;font-size:6px}td{padding:2px 3px;border:1px solid #e5e7eb;font-size:7px}.r{text-align:right}</style></head><body><h1>Penjualan By Nota</h1><p style="text-align:center;color:#6b7280">${period}</p>`; if(exportWithDetail.value){filteredData.value.forEach(r=>{const d=detailData.value[r.Nomor]||[];html+=`<table><tr><td><strong>${r.Nomor}</strong></td><td>${r.Tanggal}</td><td>${r.Customer}</td><td class="r">${formatCurrency(r.Total)}</td></tr></table>`;if(d.length>0){html+=`<table><tr><th>Kode</th><th>Nama</th><th>Sat</th><th>Qty</th><th class="r">Harga</th><th>Disc%</th><th class="r">DiscRp</th><th class="r">Nilai</th></tr>`;d.forEach(di=>html+=`<tr><td>${di.Kode}</td><td>${di.Nama}</td><td>${di.Satuan}</td><td>${di.Jumlah}</td><td class="r">${formatCurrency(di.Harga)}</td><td>${di.Disc}</td><td class="r">${formatCurrency(di.DiscRp)}</td><td class="r">${formatCurrency(di.Nilai)}</td></tr>`);html+=`</table>`}html+=`<br>`})} else{html+=`<table><thead><tr>${gridColumns.map(c=>`<th>${c.header}</th>`).join('')}</tr></thead><tbody>`;filteredData.value.forEach(r=>html+=`<tr>${gridColumns.map(c=>`<td class="${c.align==='right'?'r':''}">${isCurrencyField(c.field)?formatCurrency(r[c.field]):r[c.field]||''}</td>`).join('')}</tr>`);html+=`</tbody></table>`} html+=`</body></html>`; const win=window.open('','_blank','width=1100,height=700');if(win){win.document.write(html);win.document.close();} toast.add({severity:'success',summary:'Print',detail:'Gunakan Print > Save as PDF',life:3000}); };

onMounted(() => { resetTextFilters(); loadData(); });
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
.table-area { flex: 1; overflow: hidden; min-height: 0; display: flex; flex-direction: column; }
.data-table { flex: 1; display: flex; flex-direction: column; min-height: 0; :deep(.p-datatable-wrapper) { flex: 1; overflow: auto; min-height: 0; } :deep(.p-datatable-thead > tr > th) { background: var(--surface-50); font-size: 0.68rem; font-weight: 700; text-transform: uppercase; color: var(--text-color-secondary); padding: 0.35rem 0.45rem !important; border-bottom: 2px solid var(--surface-border); white-space: nowrap; letter-spacing: 0.03em; position: sticky; top: 0; z-index: 2; } :deep(.p-datatable-tbody > tr > td) { padding: 0.25rem 0.45rem; font-size: 0.75rem; white-space: nowrap; } :deep(.p-datatable-tbody > tr:hover) { background: var(--surface-50); } :deep(.p-datatable-tfoot > tr > td) { padding: 0.35rem 0.45rem; font-size: 0.72rem; font-weight: 700; background: var(--surface-100); border-top: 2px solid var(--primary-300); color: var(--primary-700); white-space: nowrap; position: sticky; bottom: 0; z-index: 2; } :deep(.p-paginator) { padding: 0.25rem 0.4rem; font-size: 0.7rem; border-top: 1px solid var(--surface-border); flex-shrink: 0; background: var(--surface-card); .p-paginator-page, .p-paginator-first, .p-paginator-prev, .p-paginator-next, .p-paginator-last { min-width: 1.5rem; height: 1.5rem; font-size: 0.7rem; } } :deep(.p-sortable-column-icon) { font-size: 0.6rem !important; width: 1.25rem; height: 1.25rem; display: inline-flex; align-items: center; justify-content: center; } }
.col-header { display: flex; align-items: center; width: 100%; .col-title { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; } .col-icons { display: flex; align-items: center; gap: 0.15rem; flex-shrink: 0; margin-left: auto; } }
.col-filter-btn { width: 1.25rem; height: 1.25rem; border-radius: 0.2rem; border: none; background: transparent; cursor: pointer; display: flex; align-items: center; justify-content: center; opacity: 0; transition: all 0.12s; flex-shrink: 0; color: var(--text-color-secondary); i { font-size: 0.6rem; } &:hover { background: var(--surface-200); } &.active { opacity: 1; background: var(--primary-100); color: var(--primary-700); } }
.col-header:hover .col-filter-btn { opacity: 1; }
.text-currency { font-weight: 600; color: var(--primary-600); }
.footer-label { font-weight: 700; color: var(--primary-700); }
.footer-value { font-weight: 700; color: var(--primary-700); }
.mini-filter { width: 230px; display: flex; flex-direction: column; .mini-filter-head { display: flex; align-items: center; justify-content: space-between; padding: 0.45rem 0.65rem; border-bottom: 1px solid var(--surface-border); font-weight: 600; font-size: 0.76rem; } .mini-filter-search { position: relative; padding: 0.35rem 0.65rem; border-bottom: 1px solid var(--surface-border); i { position: absolute; left: 1.05rem; top: 50%; transform: translateY(-50%); font-size: 0.65rem; } .mini-filter-input { width: 100%; height: 1.55rem; padding: 0 0.35rem 0 1.5rem; border: 1px solid var(--surface-border); border-radius: 0.25rem; font-size: 0.7rem; outline: none; } } .mini-filter-actions { display: flex; justify-content: space-between; padding: 0.25rem 0.65rem; border-bottom: 1px solid var(--surface-border); button { background: none; border: none; font-size: 0.65rem; color: var(--primary-600); cursor: pointer; font-weight: 500; } } .mini-filter-list { max-height: 160px; overflow-y: auto; padding: 0.15rem 0; } .mini-filter-opt { display: flex; align-items: center; gap: 0.35rem; padding: 0.25rem 0.65rem; cursor: pointer; font-size: 0.7rem; &:hover { background: var(--surface-50); } input[type="checkbox"] { width: 0.75rem; height: 0.75rem; accent-color: var(--primary-500); } span { flex: 1; } small { color: var(--text-color-secondary); font-size: 0.62rem; } } .mini-filter-empty { padding: 1.25rem; text-align: center; color: var(--text-color-secondary); font-size: 0.7rem; } .mini-filter-foot { padding: 0.35rem 0.65rem; border-top: 1px solid var(--surface-border); } }
.detail-content { padding: 0.5rem 0.75rem; background: var(--surface-50); .detail-header { display: flex; align-items: center; gap: 0.4rem; margin-bottom: 0.4rem; font-weight: 600; font-size: 0.75rem; i { color: var(--primary-500); font-size: 0.8rem; } } .detail-loading { display: flex; align-items: center; justify-content: center; gap: 0.4rem; padding: 1rem; color: var(--text-color-secondary); font-size: 0.75rem; } }
.detail-table { background: var(--surface-card); border-radius: 0.3rem; overflow: hidden; border: 1px solid var(--surface-border); :deep(.p-datatable-tbody > tr > td) { padding: 0.2rem 0.4rem !important; font-size: 0.7rem; } }
.export-option-card { display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem 1rem; border: 2px solid var(--surface-border); border-radius: 0.625rem; cursor: pointer; transition: all 0.15s; + .export-option-card { margin-top: 0.5rem; } .export-option-icon { width: 2.5rem; height: 2.5rem; border-radius: 0.5rem; display: flex; align-items: center; justify-content: center; flex-shrink: 0; background: var(--surface-100); i { font-size: 1.2rem; } } .export-option-info { flex: 1; strong { display: block; font-size: 0.85rem; } small { font-size: 0.7rem; color: var(--text-color-secondary); } } .check-icon { font-size: 1.2rem; color: var(--primary-500); opacity: 0; } &:hover { border-color: var(--primary-300); background: var(--primary-50); } &.active { border-color: var(--primary-500); background: var(--primary-50); .check-icon { opacity: 1; } } }
.table-empty { display: flex; flex-direction: column; align-items: center; padding: 2.5rem; color: var(--text-color-secondary); gap: 0.5rem; i { font-size: 2rem; } span { font-size: 0.8rem; } }
@media (max-width: 900px) { .toolbar { gap: 0.35rem; padding: 0.35rem 0.5rem; } }
@media (max-width: 640px) { .search-box { width: 100%; } .filter-item { flex-wrap: wrap; .filter-label { width: 100%; } } .text-filter-input { width: 100%; } }
@media (max-width: 768px) { .data-table { :deep(.p-datatable-thead > tr > th) { font-size: 0.63rem; padding: 0.25rem 0.35rem !important; } :deep(.p-datatable-tbody > tr > td) { font-size: 0.7rem; padding: 0.2rem 0.35rem; } } }
</style>