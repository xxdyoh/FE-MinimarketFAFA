<template>
  <div class="report-page">
    <!--
        <div class="report-header">
            <div class="header-left">
                <div class="header-icon"><i class="pi pi-shopping-bag"></i></div>
                <div class="header-text">
                    <h1>Laporan Penjualan By Nota</h1>
                     <p>Laporan penjualan dengan detail per nota</p>
                </div>
            </div>
            <div class="header-actions">
                <Button label="Export Excel" icon="pi pi-file-excel" severity="success" size="small" @click="exportExcel" />
                <Button label="Export PDF" icon="pi pi-file-pdf" severity="danger" size="small" @click="exportPDF" />
                <Button label="Export CSV" icon="pi pi-file" severity="info" size="small" @click="exportCSV" />
            </div>
        </div>
 -->
    <div class="report-card">
      <div class="browse-toolbar">
        <div class="toolbar-left">
          <IconField iconPosition="left">
            <InputIcon class="pi pi-search" />
            <InputText
              v-model="searchKeyword"
              placeholder="Cari semua kolom..."
              size="small"
              class="search-input"
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
          <Button label="Export Excel" icon="pi pi-file-excel" severity="success" size="small" @click="exportExcel" />
    <Button label="Export PDF" icon="pi pi-file-pdf" severity="danger" size="small" @click="exportPDF" />
    <Button label="Export CSV" icon="pi pi-file" severity="info" size="small" @click="exportCSV" />

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
            :class="{ 'filter-active': showTextFilter }"
            @click="showTextFilter = !showTextFilter"
          />
        </div>
      </div>

      <div v-if="showTextFilter" class="text-filter-panel">
        <div class="text-filter-grid">
          <div
            v-for="col in filterableColumns"
            :key="col.field"
            class="text-filter-item"
          >
            <label>{{ col.header }}</label>
            <InputText
              v-model="textFilters[col.field]"
              placeholder="Filter..."
              size="small"
              class="w-full"
            />
          </div>
        </div>
        <div class="text-filter-footer">
          <Button label="Reset" text size="small" @click="resetTextFilters" />
          <Button
            label="Terapkan"
            severity="primary"
            size="small"
            @click="applyTextFilters"
          />
        </div>
      </div>

      <!-- Date Filter -->
      <div class="date-filter-row">
        <div class="date-item">
          <label>Tanggal Mulai</label>
          <DatePicker
            v-model="startDate"
            dateFormat="yy-mm-dd"
            showIcon
            size="small"
          />
        </div>
        <div class="date-item">
          <label>Tanggal Akhir</label>
          <DatePicker
            v-model="endDate"
            dateFormat="yy-mm-dd"
            showIcon
            size="small"
          />
        </div>
      </div>

      <DataTable
        v-model:expandedRows="expandedRows"
        :value="filteredData"
        :loading="loading"
        class="report-table"
        stripedRows
        size="small"
        showGridlines
        dataKey="Nomor"
        @rowExpand="onRowExpand"
        paginator
        :rows="25"
        :rowsPerPageOptions="[10, 25, 50, 100]"
        sortField="Tanggal"
        :sortOrder="-1"
        scrollable
        scrollDirection="horizontal"
        :scrollHeight="'flex'"
      >
        <template #empty>
          <div class="empty-state">
            <i class="pi pi-inbox"></i>
            <p>Data tidak tersedia</p>
          </div>
        </template>

        <Column expander style="width: 2.5rem" />

        <Column
          v-for="col in gridColumns"
          :key="col.field"
          :field="col.field"
          :sortable="true"
          :style="{
            width: col.width || 'auto',
            textAlign: col.align || 'left',
          }"
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
                    <Button
                      icon="pi pi-times"
                      text
                      rounded
                      size="small"
                      @click="closeFilterPanel(col.field)"
                    />
                  </div>
                  <div class="filter-panel-search">
                    <IconField iconPosition="left">
                      <InputIcon class="pi pi-search" />
                      <InputText
                        v-model="filterSearchTerms[col.field]"
                        placeholder="Cari nilai..."
                        size="small"
                        class="w-full"
                      />
                    </IconField>
                  </div>
                  <div class="filter-panel-actions">
                    <Button
                      label="Pilih Semua"
                      text
                      size="small"
                      @click="selectAll(col.field)"
                    />
                    <Button
                      label="Bersihkan"
                      text
                      size="small"
                      @click="clearFilter(col.field)"
                    />
                  </div>
                  <div class="filter-panel-list">
                    <div
                      v-for="opt in getFilteredOptions(col.field)"
                      :key="opt.value"
                      class="filter-option"
                    >
                      <Checkbox
                        v-model="tempColumnFilters[col.field]"
                        :value="opt.value"
                        :inputId="`f-${col.field}-${opt.value}`"
                      />
                      <label
                        :for="`f-${col.field}-${opt.value}`"
                        class="filter-label"
                        ><span>{{ opt.label }}</span
                        ><span class="option-count"
                          >({{ opt.count }})</span
                        ></label
                      >
                    </div>
                    <div
                      v-if="getFilteredOptions(col.field).length === 0"
                      class="filter-empty"
                    >
                      Tidak ada nilai
                    </div>
                  </div>
                  <div class="filter-panel-footer">
                    <Button
                      label="Terapkan"
                      severity="primary"
                      size="small"
                      class="w-full"
                      @click="applyColumnFilter(col.field)"
                    />
                  </div>
                </div>
              </OverlayPanel>
            </div>
          </template>
          <template v-if="isCurrencyField(col.field)" #body="{ data }">
            <span class="currency-text">{{
              formatCurrency(data[col.field])
            }}</span>
          </template>
        </Column>

        <template #expansion="slotProps">
          <div class="detail-content">
            <div class="detail-header">
              <i class="pi pi-list"></i>
              <span>Detail Items - {{ slotProps.data.Nomor }}</span>
            </div>
            <div
              v-if="detailLoading[slotProps.data.Nomor]"
              class="detail-loading"
            >
              <i class="pi pi-spinner pi-spin"></i> Memuat...
            </div>
            <DataTable
              v-else
              :value="detailData[slotProps.data.Nomor] || []"
              class="detail-table"
              size="small"
            >
              <Column field="Kode" header="Kode" style="width: 80px" />
              <Column
                field="Nama"
                header="Nama Barang"
                style="min-width: 180px"
              />
              <Column
                field="Satuan"
                header="Sat"
                style="width: 60px; text-align: center"
              />
              <Column
                field="Jumlah"
                header="Qty"
                style="width: 60px; text-align: center"
              />
              <Column
                field="Harga"
                header="Harga"
                style="width: 110px; text-align: right"
                ><template #body="{ data }">{{
                  formatCurrency(data.Harga)
                }}</template></Column
              >
              <Column
                field="Disc"
                header="Disc%"
                style="width: 60px; text-align: center"
              />
              <Column
                field="DiscRp"
                header="DiscRp"
                style="width: 100px; text-align: right"
                ><template #body="{ data }">{{
                  formatCurrency(data.DiscRp)
                }}</template></Column
              >
              <Column
                field="Nilai"
                header="Nilai"
                style="width: 120px; text-align: right"
                ><template #body="{ data }"
                  ><span class="font-bold text-primary-600">{{
                    formatCurrency(data.Nilai)
                  }}</span></template
                ></Column
              >
            </DataTable>
          </div>
        </template>
      </DataTable>
    </div>

    <!-- Export Dialog -->
<Dialog v-model:visible="exportDialog" header="Export Laporan" :modal="true" :style="{ width: '420px' }">
    <div class="export-dialog-content">
        <p class="export-dialog-text">Pilih tipe export:</p>
        <div class="export-options">
            <div class="export-option" :class="{ 'active': !exportWithDetail }" @click="exportWithDetail = false">
                <div class="option-radio"><div class="radio-circle" :class="{ 'checked': !exportWithDetail }"></div></div>
                <div class="option-icon"><i class="pi pi-file"></i></div>
                <div class="option-text"><strong>Ringkasan Saja</strong><small>Hanya data header</small></div>
            </div>
            <div class="export-option" :class="{ 'active': exportWithDetail }" @click="exportWithDetail = true">
                <div class="option-radio"><div class="radio-circle" :class="{ 'checked': exportWithDetail }"></div></div>
                <div class="option-icon"><i class="pi pi-list"></i></div>
                <div class="option-text"><strong>Dengan Detail Items</strong><small>Header + detail per nota</small></div>
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
import { ref, computed, onMounted } from "vue";
import { useToast } from "primevue/usetoast";
import OverlayPanel from "primevue/overlaypanel";
import Checkbox from "primevue/checkbox";

definePageMeta({ layout: "default" });

const { $api } = useNuxtApp();
const toast = useToast();

const loading = ref(false);
const data = ref<any[]>([]);
const detailData = ref<Record<string, any[]>>({});
const detailLoading = ref<Record<string, boolean>>({});
const expandedRows = ref<Record<string, boolean>>({});
const startDate = ref(
  new Date(new Date().getFullYear(), new Date().getMonth(), 1)
);
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
const exportDialog = ref(false)
const exportWithDetail = ref(true)
const exportType = ref<'excel' | 'pdf' | 'csv'>('excel')

const gridColumns = [
  { field: "Nomor", header: "Nomor", width: "120px" },
  { field: "Tanggal", header: "Tanggal", width: "100px" },
  { field: "Jam", header: "Jam", width: "80px", align: "center" },
  { field: "Customer", header: "Customer", width: "180px" },
  { field: "Total", header: "Total", width: "130px", align: "right" },
  { field: "Cash", header: "Cash", width: "110px", align: "right" },
  { field: "Card", header: "Card", width: "100px", align: "right" },
  { field: "No_Card", header: "No Card", width: "130px" },
  { field: "Bank", header: "Bank", width: "120px" },
  { field: "Voucher", header: "Voucher", width: "100px", align: "right" },
  { field: "No_Voucher", header: "No Voucher", width: "120px" },
  { field: "Piutang", header: "Piutang", width: "120px", align: "right" },
  {
    field: "Bayar_Piutang",
    header: "Bayar Piutang",
    width: "130px",
    align: "right",
  },
  { field: "Potongan", header: "Potongan", width: "110px", align: "right" },
  { field: "Ongkir", header: "Ongkir", width: "100px", align: "right" },
  { field: "IsPosting", header: "Posting", width: "80px", align: "center" },
  { field: "NoPosting", header: "No Posting", width: "120px" },
  // { field: 'Tgl_Posting', header: 'Tgl Posting', width: '110px' },
];

const filterableColumns = [
  { field: "Nomor", header: "Nomor" },
  { field: "Customer", header: "Customer" },
];

const currencyFields = [
  "Total",
  "Cash",
  "Card",
  "Voucher",
  "Piutang",
  "Bayar_Piutang",
  "Potongan",
  "Ongkir",
];

const isCurrencyField = (field: string) => currencyFields.includes(field);

const activeFiltersCount = computed(() => {
  return (
    Object.keys(activeColumnFilters.value).filter(
      (k) => activeColumnFilters.value[k]?.length > 0
    ).length +
    Object.keys(activeTextFilters.value).filter((k) =>
      activeTextFilters.value[k]?.trim()
    ).length
  );
});

const filteredData = computed(() => {
  let result = [...data.value];
  if (searchKeyword.value) {
    const kw = searchKeyword.value.toLowerCase();
    result = result.filter((r) =>
      Object.values(r).some((v) => String(v).toLowerCase().includes(kw))
    );
  }
  Object.keys(activeColumnFilters.value).forEach((f) => {
    const vals = activeColumnFilters.value[f];
    if (vals?.length > 0)
      result = result.filter((r) => vals.includes(String(r[f])));
  });
  Object.keys(activeTextFilters.value).forEach((f) => {
    const val = activeTextFilters.value[f]?.toLowerCase();
    if (val)
      result = result.filter((r) =>
        String(r[f] || "")
          .toLowerCase()
          .includes(val)
      );
  });
  return result;
});

const formatCurrency = (val: any) => {
  if (!val && val !== 0) return "-";
  return "Rp " + Math.round(parseFloat(val)).toLocaleString("id-ID");
};

const formatDate = (d: Date): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const loadData = async () => {
  loading.value = true;
  try {
    const res = await $api.get("/v1/report/penjualan", {
      params: {
        start_date: formatDate(startDate.value),
        end_date: formatDate(endDate.value),
      },
    });
    if (res.data.success) {
      data.value = res.data.data;
      buildFilterOptions();
    }
  } catch (e: any) {
    toast.add({
      severity: "error",
      summary: "Gagal",
      detail: e.response?.data?.message || "Gagal",
      life: 3000,
    });
  } finally {
    loading.value = false;
  }
};

const onRowExpand = async (event: any) => {
  const nomor = event.data.Nomor;
  if (!detailData.value[nomor]) {
    detailLoading.value[nomor] = true;
    try {
      const res = await $api.get(`/v1/report/penjualan/${nomor}/detail`, {
        params: {
          start_date: formatDate(startDate.value),
          end_date: formatDate(endDate.value),
        },
      });
      if (res.data.success) detailData.value[nomor] = res.data.data;
    } catch (e) {
      console.error(e);
    } finally {
      detailLoading.value[nomor] = false;
    }
  }
};

const resetTextFilters = () => {
  filterableColumns.forEach((c) => (textFilters.value[c.field] = ""));
  activeTextFilters.value = {};
};

const applyTextFilters = () => {
  activeTextFilters.value = {};
  filterableColumns.forEach((c) => {
    if (textFilters.value[c.field]?.trim())
      activeTextFilters.value[c.field] = textFilters.value[c.field].trim();
  });
};

const clearAllFilters = () => {
  searchKeyword.value = "";
  activeColumnFilters.value = {};
  activeTextFilters.value = {};
  textFilters.value = {};
  tempColumnFilters.value = {};
};

const buildFilterOptions = () => {
  filterableColumns.forEach((col) => {
    const vals = new Map<string, number>();
    data.value.forEach((r) => {
      const v = String(r[col.field] || "");
      if (v) vals.set(v, (vals.get(v) || 0) + 1);
    });
    filterOptionsCache.value[col.field] = Array.from(vals.entries())
      .map(([v, c]) => ({ value: v, label: v, count: c }))
      .sort((a, b) => a.label.localeCompare(b.label));
  });
};

const setFilterOverlayRef = (f: string, el: any) => {
  if (el) filterOverlays.value[f] = el;
};
const toggleColumnFilter = (col: any, e: Event) => {
  const o = filterOverlays.value[col.field];
  if (o) {
    if (!tempColumnFilters.value[col.field])
      tempColumnFilters.value[col.field] = [
        ...(activeColumnFilters.value[col.field] || []),
      ];
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
  return t ? o.filter((opt) => opt.label.toLowerCase().includes(t)) : o;
};
const selectAll = (f: string) => {
  tempColumnFilters.value[f] = (filterOptionsCache.value[f] || []).map(
    (o) => o.value
  );
};
const clearFilter = (f: string) => {
  tempColumnFilters.value[f] = [];
};
const hasColumnFilter = (f: string) => activeColumnFilters.value[f]?.length > 0;
const applyColumnFilter = (f: string) => {
  activeColumnFilters.value[f] = [...(tempColumnFilters.value[f] || [])];
  closeFilterPanel(f);
};

// Exports
const exportExcel = () => { exportType.value = 'excel'; openExportDialog() }
const exportPDF = () => { exportType.value = 'pdf'; openExportDialog() }
const exportCSV = () => { exportType.value = 'csv'; openExportDialog() }

const openExportDialog = () => {
    if (!filteredData.value.length) {
        toast.add({ severity: 'warn', summary: 'Peringatan', detail: 'Tidak ada data', life: 2000 }); return
    }
    exportDialog.value = true
}

const loadAllDetails = async () => {
    const promises = filteredData.value.map(async (row: any) => {
        if (!detailData.value[row.Nomor]) {
            try {
                const res = await $api.get(`/v1/report/penjualan/${row.Nomor}/detail`, {
                    params: { start_date: formatDate(startDate.value), end_date: formatDate(endDate.value) }
                })
                if (res.data.success) detailData.value[row.Nomor] = res.data.data
            } catch (e) { console.error(e) }
        }
    })
    await Promise.all(promises)
}

const proceedExport = async () => {
    exportDialog.value = false
    if (exportWithDetail.value) {
        toast.add({ severity: 'info', summary: 'Memproses', detail: 'Mengambil detail...', life: 2000 })
        await loadAllDetails()
    }
    if (exportType.value === 'excel') await doExportExcel()
    else if (exportType.value === 'pdf') doExportPDF()
    else doExportCSV()
}

// ========== EXPORT EXCEL ==========
// 🔥 EXPORT EXCEL (2 SHEET - RINGKASAN & DETAIL)
const doExportExcel = async () => {
    const ExcelJS = await import('exceljs')
    const wb = new ExcelJS.Workbook()
    
    // 🔥 STYLE DEFINITIONS
    const headerStyle: any = {
        font: { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF10B981' } },
        alignment: { horizontal: 'center', vertical: 'middle', wrapText: true },
        border: { top: { style: 'thin', color: { argb: 'FF059669' } }, bottom: { style: 'thin', color: { argb: 'FF059669' } }, left: { style: 'thin', color: { argb: 'FF059669' } }, right: { style: 'thin', color: { argb: 'FF059669' } } }
    }
    const dataStyle: any = {
        font: { size: 10, color: { argb: 'FF1F2937' } },
        border: { top: { style: 'thin', color: { argb: 'FFD1D5DB' } }, bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } }, left: { style: 'thin', color: { argb: 'FFD1D5DB' } }, right: { style: 'thin', color: { argb: 'FFD1D5DB' } } },
        alignment: { vertical: 'middle' }
    }
    const altRowStyle: any = { ...dataStyle, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9FAFB' } } }
    const numStyle: any = { ...dataStyle, alignment: { horizontal: 'right', vertical: 'middle' }, numFmt: '#,##0' }
    const titleStyle: any = { font: { bold: true, size: 14, color: { argb: 'FF1F2937' } } }
    const subtitleStyle: any = { font: { size: 10, color: { argb: 'FF6B7280' } } }
    
    // ========================
    // SHEET 1: RINGKASAN
    // ========================
    const ws1 = wb.addWorksheet('Ringkasan')
    
    ws1.mergeCells('A1:K1')
    ws1.getCell('A1').value = 'LAPORAN PENJUALAN BY NOTA'
    ws1.getCell('A1').style = titleStyle
    ws1.getRow(1).height = 30
    
    ws1.mergeCells('A2:K2')
    ws1.getCell('A2').value = `Periode: ${startDate.value.toLocaleDateString('id-ID')} - ${endDate.value.toLocaleDateString('id-ID')}`
    ws1.getCell('A2').style = subtitleStyle
    ws1.getRow(2).height = 20
    
    // Header (Row 4)
    const headerRow = ws1.getRow(4)
    headerRow.height = 25
    gridColumns.forEach((col: any, idx: number) => {
        const cell = headerRow.getCell(idx + 1)
        cell.value = col.header
        cell.style = headerStyle
    })
    
    // Data (mulai Row 5)
    const exportData = [...filteredData.value]
    exportData.forEach((row: any, i: number) => {
        const dataRow = ws1.getRow(5 + i)
        
        gridColumns.forEach((col: any, idx: number) => {
            const cell = dataRow.getCell(idx + 1)
            let val = row[col.field]
            
            if (isCurrencyField(col.field)) {
                cell.value = parseFloat(val) || 0
                cell.style = numStyle
            } else {
                cell.value = val || ''
                cell.style = i % 2 === 1 ? altRowStyle : dataStyle
            }
        })
    })
    
    // Column widths
    ws1.getColumn(1).width = 14; ws1.getColumn(2).width = 12; ws1.getColumn(3).width = 10
    ws1.getColumn(4).width = 22; ws1.getColumn(5).width = 16; ws1.getColumn(6).width = 14
    ws1.getColumn(7).width = 12; ws1.getColumn(8).width = 14; ws1.getColumn(9).width = 14
    ws1.getColumn(10).width = 14; ws1.getColumn(11).width = 14
    
    ws1.autoFilter = { from: { row: 4, column: 1 }, to: { row: 4 + exportData.length, column: gridColumns.length } }
    ws1.views = [{ state: 'frozen', ySplit: 4 }]
    
    // ========================
    // SHEET 2: DETAIL ITEMS
    // ========================
    if (exportWithDetail.value) {
        const ws2 = wb.addWorksheet('Detail Items')
        
        ws2.mergeCells('A1:I1')
        ws2.getCell('A1').value = 'DETAIL ITEMS PENJUALAN'
        ws2.getCell('A1').style = titleStyle
        ws2.getRow(1).height = 30
        
        ws2.mergeCells('A2:I2')
        ws2.getCell('A2').value = `Periode: ${startDate.value.toLocaleDateString('id-ID')} - ${endDate.value.toLocaleDateString('id-ID')}`
        ws2.getCell('A2').style = subtitleStyle
        ws2.getRow(2).height = 20
        
        // Header (Row 4)
        const detailHeaders = ['No. Nota', 'Customer', 'Kode Brg', 'Nama Barang', 'Sat', 'Qty', 'Harga', 'Disc%', 'DiscRp', 'Nilai']
        const detailHeaderRow = ws2.getRow(4)
        detailHeaderRow.height = 25
        detailHeaders.forEach((h, idx) => {
            const cell = detailHeaderRow.getCell(idx + 1)
            cell.value = h
            cell.style = { ...headerStyle, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3B82F6' } } }
        })
        
        let rowNum = 5
        exportData.forEach((row: any) => {
            const details = detailData.value[row.Nomor] || []
            
            if (details.length === 0) {
                const dr = ws2.getRow(rowNum)
                dr.getCell(1).value = row.Nomor
                dr.getCell(2).value = row.Customer
                dr.getCell(3).value = '-'
                dr.getCell(4).value = '(Tidak ada detail)'
                for (let c = 5; c <= 10; c++) dr.getCell(c).value = ''
                for (let c = 1; c <= 10; c++) {
                    dr.getCell(c).style = { ...dataStyle, font: { bold: true, size: 10 }, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } } }
                }
                rowNum++
            } else {
                details.forEach((detail: any, detailIdx: number) => {
                    const dr = ws2.getRow(rowNum)
                    dr.getCell(1).value = detailIdx === 0 ? row.Nomor : ''
                    dr.getCell(2).value = detailIdx === 0 ? row.Customer : ''
                    dr.getCell(3).value = detail.Kode || ''
                    dr.getCell(4).value = detail.Nama || ''
                    dr.getCell(5).value = detail.Satuan || ''
                    dr.getCell(6).value = parseInt(detail.Jumlah) || 0
                    dr.getCell(7).value = parseFloat(detail.Harga) || 0
                    dr.getCell(8).value = parseInt(detail.Disc) || 0
                    dr.getCell(9).value = parseFloat(detail.DiscRp) || 0
                    dr.getCell(10).value = parseFloat(detail.Nilai) || 0
                    
                    const isNum = [6, 7, 9, 10]
                    const isEven = rowNum % 2 === 0
                    
                    for (let c = 1; c <= 10; c++) {
                        if (detailIdx === 0) {
                            dr.getCell(c).style = {
                                ...(isNum.includes(c) ? numStyle : dataStyle),
                                font: { bold: [1, 2].includes(c), size: 10, color: { argb: 'FF1F2937' } },
                                fill: isEven ? { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9FAFB' } } : undefined
                            }
                        } else {
                            dr.getCell(c).style = isNum.includes(c) ? numStyle : (isEven ? altRowStyle : dataStyle)
                        }
                    }
                    rowNum++
                })
            }
        })
        
        ws2.getColumn(1).width = 14; ws2.getColumn(2).width = 22; ws2.getColumn(3).width = 12
        ws2.getColumn(4).width = 32; ws2.getColumn(5).width = 7; ws2.getColumn(6).width = 8
        ws2.getColumn(7).width = 14; ws2.getColumn(8).width = 8; ws2.getColumn(9).width = 12
        ws2.getColumn(10).width = 16
        
        ws2.autoFilter = { from: { row: 4, column: 1 }, to: { row: rowNum - 1, column: 10 } }
        ws2.views = [{ state: 'frozen', ySplit: 4 }]
    }
    
    const buf = await wb.xlsx.writeBuffer()
    const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Laporan_Penjualan_${formatDate(new Date())}${exportWithDetail.value ? '_Lengkap' : ''}.xlsx`
    a.click()
    URL.revokeObjectURL(url)
    toast.add({ severity: 'success', summary: 'Export Excel', detail: 'Berhasil', life: 2000 })
}

// ========== EXPORT CSV ==========
const doExportCSV = () => {
    let csv = '\uFEFF'
    
    if (exportWithDetail.value) {
        csv += 'Nomor,Tanggal,Customer,Total,Kode,Nama,Satuan,Qty,Harga,Disc%,DiscRp,Nilai\n'
        filteredData.value.forEach(row => {
            const details = detailData.value[row.Nomor] || []
            if (details.length === 0) {
                csv += `${row.Nomor},${row.Tanggal},${row.Customer},${row.Total},,,,,,,\n`
            } else {
                details.forEach((d: any) => {
                    csv += `${row.Nomor},${row.Tanggal},${row.Customer},${row.Total},${d.Kode},"${d.Nama}",${d.Satuan},${d.Jumlah},${d.Harga},${d.Disc},${d.DiscRp},${d.Nilai}\n`
                })
            }
        })
    } else {
        csv += gridColumns.map(c => `"${c.header}"`).join(',') + '\n'
        filteredData.value.forEach(r => csv += gridColumns.map(c => `"${String(r[c.field] || '').replace(/"/g, '""')}"`).join(',') + '\n')
    }
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' }); const url = URL.createObjectURL(blob); const a = document.createElement('a')
    a.href = url; a.download = `Laporan_Penjualan_${formatDate(new Date())}.csv`; a.click(); URL.revokeObjectURL(url)
    toast.add({ severity: 'success', summary: 'Export CSV', detail: 'Berhasil', life: 2000 })
}

// ========== EXPORT PDF ==========
const doExportPDF = () => {
    const period = `${startDate.value.toLocaleDateString('id-ID')} - ${endDate.value.toLocaleDateString('id-ID')}`
    const today = new Date().toLocaleDateString('id-ID')
    
    let html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Laporan Penjualan</title>
    <style>
        body { font-family: Arial; padding: 20px; }
        h1 { font-size: 18px; text-align: center; color: #059669; }
        .period { text-align: center; font-size: 12px; color: #6b7280; margin-bottom: 15px; }
        table { width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 10px; }
        th { background: #10b981; color: white; padding: 6px 8px; border: 1px solid #059669; font-size: 9px; text-transform: uppercase; }
        td { padding: 5px 8px; border: 1px solid #e5e7eb; }
        .tr { text-align: right; }
        .nota-group { border: 1px solid #e5e7eb; border-radius: 8px; margin-bottom: 15px; page-break-inside: avoid; }
        .nota-header { background: #fef3c7; padding: 8px 12px; font-weight: 700; border-bottom: 1px solid #fcd34d; }
    </style></head><body>
    <h1>Laporan Penjualan By Nota</h1>
    <div class="period">Periode: ${period}</div>`
    
    if (exportWithDetail.value) {
        filteredData.value.forEach(row => {
            const details = detailData.value[row.Nomor] || []
            const totalNilai = details.reduce((s: number, d: any) => s + (parseFloat(d.Nilai) || 0), 0)
            
            html += `<div class="nota-group">
                <div class="nota-header">📄 ${row.Nomor} - ${row.Tanggal} | ${row.Customer} | Total: ${formatCurrency(row.Total)}</div>`
            
            if (details.length > 0) {
                html += `<table><tr><th>Kode</th><th>Nama</th><th>Sat</th><th>Qty</th><th>Harga</th><th>Disc%</th><th class="tr">DiscRp</th><th class="tr">Nilai</th></tr>`
                details.forEach((d: any) => html += `<tr><td>${d.Kode}</td><td>${d.Nama}</td><td>${d.Satuan}</td><td>${d.Jumlah}</td><td class="tr">${formatCurrency(d.Harga)}</td><td>${d.Disc}</td><td class="tr">${formatCurrency(d.DiscRp)}</td><td class="tr">${formatCurrency(d.Nilai)}</td></tr>`)
                html += `<tr style="background:#f3f4f6;font-weight:700"><td colspan="7" style="text-align:right">Total:</td><td class="tr">${formatCurrency(totalNilai)}</td></tr></table>`
            }
            html += `</div>`
        })
    } else {
        html += `<table><thead><tr>${gridColumns.map(c => `<th>${c.header}</th>`).join('')}</tr></thead><tbody>`
        filteredData.value.forEach(r => html += `<tr>${gridColumns.map(c => `<td class="${c.align === 'right' ? 'tr' : ''}">${currencyFields.includes(c.field) ? formatCurrency(r[c.field]) : (r[c.field] || '')}</td>`).join('')}</tr>`)
        html += `</tbody></table>`
    }
    
    html += `<p style="text-align:right;font-size:9px;color:#9ca3af;margin-top:20px">Dicetak: ${today}</p></body></html>`
    
    const win = window.open('', '_blank', 'width=1000,height=700')
    if (win) { win.document.write(html); win.document.close() }
    toast.add({ severity: 'success', summary: 'Preview PDF', detail: 'Gunakan Print > Save as PDF', life: 3000 })
}

onMounted(() => {
  resetTextFilters();
  loadData();
});
</script>

<style lang="scss" scoped>
.report-page {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.report-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  background: var(--surface-card);
  border-radius: 0.75rem;
  border: 1px solid var(--surface-border);
  .header-left {
    display: flex;
    align-items: center;
    gap: 1rem;
  }
  .header-icon {
    width: 2.75rem;
    height: 2.75rem;
    background: var(--primary-50);
    border-radius: 0.625rem;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--primary-600);
    font-size: 1.25rem;
  }
  h1 {
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--text-color);
    margin: 0;
  }
  p {
    font-size: 0.813rem;
    color: var(--text-color-secondary);
    margin: 0.25rem 0 0 0;
  }
  .header-actions {
    display: flex;
    gap: 0.5rem;
  }
}
.report-card {
  background: var(--surface-card);
  border-radius: 0.75rem;
  border: 1px solid var(--surface-border);
  overflow: hidden;
}
.browse-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0.75rem;
  border-bottom: 1px solid var(--surface-border);
  background: var(--surface-50);
  .toolbar-left {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
  }
  .search-input {
    width: 260px;
    background: var(--surface-0);
  }
  .active-filters {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.2rem 0.5rem 0.2rem 0.75rem;
    background: var(--surface-200);
    border-radius: 1rem;
    font-size: 0.75rem;
    color: var(--text-color-secondary);
    i {
      color: var(--primary-600);
    }
  }
  .toolbar-right {
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }
  .filter-active {
    background: var(--primary-100) !important;
    color: var(--primary-700) !important;
  }
}
.text-filter-panel {
  padding: 0.75rem;
  border-bottom: 1px solid var(--surface-border);
  background: var(--surface-0);
  .text-filter-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 0.75rem;
    margin-bottom: 0.75rem;
  }
  .text-filter-item label {
    display: block;
    font-size: 0.7rem;
    font-weight: 600;
    color: var(--text-color-secondary);
    margin-bottom: 0.2rem;
  }
  .text-filter-footer {
    display: flex;
    justify-content: space-between;
  }
}
.date-filter-row {
  display: flex;
  align-items: flex-end;
  gap: 1rem;
  padding: 0.75rem;
  border-bottom: 1px solid var(--surface-border);
  background: var(--surface-0);
}
.report-table {
  :deep(.p-datatable-wrapper) {
    overflow-x: auto;
  }

  :deep(.p-datatable-thead > tr > th) {
    background: var(--surface-50);
    font-size: 0.7rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.025em;
    color: var(--text-color-secondary);
    padding: 0.35rem 0.5rem !important;
    height: 2rem !important;
    border-bottom: 2px solid var(--surface-border);
    white-space: nowrap; // 🔥 Jangan wrap header
  }

  :deep(.p-datatable-tbody > tr > td) {
    padding: 0.25rem 0.5rem;
    font-size: 0.8rem;
    white-space: nowrap; // 🔥 Jangan wrap cell
  }
}
.column-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.25rem;
  .column-title {
    flex: 1;
    font-size: 0.7rem;
  }
  .filter-active {
    background: var(--primary-100) !important;
    color: var(--primary-700) !important;
  }
  :deep(.p-button) {
    width: 1.5rem !important;
    height: 1.5rem !important;
    .pi {
      font-size: 0.75rem !important;
    }
  }
}
.currency-text {
  font-weight: 600;
  color: var(--primary-600);
}
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
.detail-content {
  padding: 0.75rem 1rem;
  background: var(--surface-50);
  .detail-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
    font-weight: 600;
    font-size: 0.8rem;
    i {
      color: var(--primary-500);
    }
  }
  .detail-loading {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 1.5rem;
    color: var(--text-color-secondary);
  }
}
.detail-table {
  background: var(--surface-card);
  border-radius: 0.375rem;
  overflow: hidden;
  border: 1px solid var(--surface-border);
  :deep(.p-datatable-tbody > tr > td) {
    padding: 0.3rem 0.5rem !important;
    font-size: 0.75rem;
  }
}
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 3rem;
  color: var(--text-color-secondary);
  i {
    font-size: 2.5rem;
    margin-bottom: 0.75rem;
  }
}
.export-dialog-content {
    .export-dialog-text { font-size: 0.9rem; color: var(--text-color-secondary); margin-bottom: 1.25rem; }
    .export-options { display: flex; flex-direction: column; gap: 0.75rem; }
    .export-option {
        display: flex; align-items: center; gap: 0.875rem; padding: 1rem 1.25rem;
        border: 2px solid var(--surface-border); border-radius: 0.75rem;
        cursor: pointer; transition: all 0.2s;
        .option-radio {
            .radio-circle {
                width: 1.25rem; height: 1.25rem; border-radius: 50%;
                border: 2px solid #cbd5e1; display: flex; align-items: center; justify-content: center;
                &.checked { border-color: var(--primary-500); background: var(--primary-500); position: relative;
                    &::after { content: ''; width: 0.5rem; height: 0.5rem; border-radius: 50%; background: white; position: absolute; }
                }
            }
        }
        .option-icon { width: 2.5rem; height: 2.5rem; background: var(--surface-100); border-radius: 0.625rem; display: flex; align-items: center; justify-content: center; i { font-size: 1.25rem; } }
        .option-text { strong { display: block; font-size: 0.9rem; } small { font-size: 0.75rem; color: var(--text-color-secondary); } }
        &:hover { border-color: var(--primary-300); background: var(--primary-50); }
        &.active { border-color: var(--primary-500); background: var(--primary-50); }
    }
}
@media (max-width: 768px) {
  .report-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
    .header-actions {
      width: 100%;
      button {
        flex: 1;
      }
    }
  }
  .browse-toolbar {
    flex-direction: column;
    gap: 0.75rem;
    .search-input {
      width: 100%;
    }
  }
}
.date-filter-row {
  display: flex;
  align-items: center; /* ini yang bikin sejajar vertikal */
  gap: 16px;
}

.date-item {
  display: flex;
  align-items: center; /* label dan input sejajar */
  gap: 8px;
}

.date-item label {
  font-size: 0.7rem;
  white-space: nowrap; /* biar label tidak wrap ke bawah */
  font-weight: 600;
}
</style>
