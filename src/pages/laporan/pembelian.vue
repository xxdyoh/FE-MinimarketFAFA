<template>
  <div class="report-page">
    <!-- Header -->
    <!--
        <div class="report-header">
            <div class="header-left">
                <div class="header-icon">
                    <i class="pi pi-shopping-cart"></i>
                </div>
                <div class="header-text">
                    <h1>Laporan Pembelian By Nota</h1>
                  
                </div>
            </div>
            <div class="header-actions">
                <Button label="Export Excel" icon="pi pi-file-excel" severity="success" size="small" @click="exportExcel" />
                <Button label="Export PDF" icon="pi pi-file-pdf" severity="danger" size="small" @click="exportPDF" />
                <Button label="Export CSV" icon="pi pi-file" severity="info" size="small" @click="exportCSV" />
            </div>
        </div> 
		-->

    <!-- Export Dialog -->
    <Dialog
      v-model:visible="exportDialog"
      header="Export Laporan"
      :modal="true"
      :style="{ width: '420px' }"
    >
      <div class="export-dialog-content">
        <p class="export-dialog-text">
          Pilih tipe export untuk laporan pembelian:
        </p>
        <div class="export-options">
          <div
            class="export-option"
            :class="{ active: !exportWithDetail }"
            @click="exportWithDetail = false"
          >
            <div class="option-radio">
              <div
                class="radio-circle"
                :class="{ checked: !exportWithDetail }"
              ></div>
            </div>
            <div class="option-icon">
              <i class="pi pi-file"></i>
            </div>
            <div class="option-text">
              <strong>Header</strong>
              <!-- <small>Hanya data header (tanpa detail items)</small> -->
            </div>
          </div>
          <div
            class="export-option"
            :class="{ active: exportWithDetail }"
            @click="exportWithDetail = true"
          >
            <div class="option-radio">
              <div
                class="radio-circle"
                :class="{ checked: exportWithDetail }"
              ></div>
            </div>
            <div class="option-icon">
              <i class="pi pi-list"></i>
            </div>
            <div class="option-text">
              <strong>Dengan Detail</strong>
              <!-- <small>Header + semua detail items per nota</small> -->
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <Button label="Batal" text size="small" @click="exportDialog = false" />
        <Button
          label="Export"
          severity="primary"
          size="small"
          @click="proceedExport"
        />
      </template>
    </Dialog>

    <!-- Filter & Toolbar -->
    <div class="report-card">
      <!-- Toolbar -->
      <div class="browse-toolbar">
        <div class="toolbar-left">
          <IconField iconPosition="left">
            <InputIcon class="pi pi-search" />
            <InputText
              v-model="searchKeyword"
              placeholder="Cari semua kolom..."
              size="small"
              class="search-input"
              @input="onSearchInput"
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
          <Button
            label="Export Excel"
            icon="pi pi-file-excel"
            severity="success"
            size="small"
            @click="exportExcel"
          />
          <Button
            label="Export PDF"
            icon="pi pi-file-pdf"
            severity="danger"
            size="small"
            @click="exportPDF"
          />
          <Button
            label="Export CSV"
            icon="pi pi-file"
            severity="info"
            size="small"
            @click="exportCSV"
          />
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

      <!-- Text Filter Panel -->
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
              :placeholder="'Filter ' + col.header + '...'"
              size="small"
              class="w-full"
              @keydown.enter="applyTextFilters"
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

      <!-- DataTable -->
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
      >
        <template #empty>
          <div class="empty-state">
            <i class="pi pi-inbox"></i>
            <p>Klik refresh untuk menampilkan laporan</p>
          </div>
        </template>

        <Column expander style="width: 2.5rem" />

        <Column
          v-for="col in filterColumns"
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
                      >
                        <span>{{ opt.label }}</span>
                        <span class="option-count">({{ opt.count }})</span>
                      </label>
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
          <template v-if="col.type === 'currency'" #body="{ data }">
            <span class="currency-text">{{
              formatCurrency(data[col.field])
            }}</span>
          </template>
          <Column
            field="Status_Bayar"
            header="Status"
            style="width: 90px; text-align: center"
          >
            <template #body="{ data }">
              <span
                class="status-badge"
                :class="
                  data.Status_Bayar === 'Sudah'
                    ? 'status-sudah'
                    : 'status-belum'
                "
              >
                {{ data.Status_Bayar }}
              </span>
            </template>
          </Column>
        </Column>

        <!-- Detail Row -->
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
              <i class="pi pi-spinner pi-spin"></i>
              <span>Memuat detail...</span>
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
                style="min-width: 200px"
              />
              <Column
                field="Satuan"
                header="Satuan"
                style="width: 70px; text-align: center"
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
              >
                <template #body="{ data }">{{
                  formatCurrency(data.Harga)
                }}</template>
              </Column>
              <Column
                field="Disc"
                header="Disc%"
                style="width: 60px; text-align: center"
              />
              <Column
                field="Nilai"
                header="Nilai"
                style="width: 130px; text-align: right"
              >
                <template #body="{ data }"
                  ><span class="font-bold text-primary-600">{{
                    formatCurrency(data.Nilai)
                  }}</span></template
                >
              </Column>
            </DataTable>
          </div>
        </template>
      </DataTable>
    </div>
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

// Data
const loading = ref(false);
const data = ref<any[]>([]);
const detailData = ref<Record<string, any[]>>({});
const detailLoading = ref<Record<string, boolean>>({});
const expandedRows = ref<Record<string, boolean>>({});
const startDate = ref(
  new Date(new Date().getFullYear(), new Date().getMonth(), 1)
);
const endDate = ref(new Date());
const filterSupplier = ref(null);
const supplierList = ref<any[]>([]);
const searchKeyword = ref("");
const showTextFilter = ref(false);
const textFilters = ref<Record<string, string>>({});
const activeTextFilters = ref<Record<string, string>>({});

// Export Dialog
// const exportDialog = ref(false)
// const exportWithDetail = ref(true) // Default: dengan detail
// const exportType = ref<'excel' | 'pdf' | 'csv'>('excel')

// Column filter state
const filterOverlays = ref<Record<string, any>>({});
const tempColumnFilters = ref<Record<string, any[]>>({});
const activeColumnFilters = ref<Record<string, any[]>>({});
const filterSearchTerms = ref<Record<string, string>>({});
const filterOptionsCache = ref<Record<string, any[]>>({});

// Columns config
const filterColumns = [
  { field: "Nomor", header: "Nomor", width: "120px" },
  { field: "Tanggal", header: "Tanggal", width: "90px" },
  { field: "Supplier", header: "Supplier", width: "200px" },
  {
    field: "Total",
    header: "Total",
    width: "130px",
    align: "right",
    type: "currency",
  },
  {
    field: "Retur",
    header: "Retur",
    width: "110px",
    align: "right",
    type: "currency",
  },
  {
    field: "Bayar",
    header: "Bayar",
    width: "110px",
    align: "right",
    type: "currency",
  },
  { field: "Status_Bayar", header: "Status", width: "90px", align: "center" },
];

const filterableColumns = [
  { field: "Nomor", header: "Nomor" },
  { field: "Supplier", header: "Supplier" },
  { field: "Status_Bayar", header: "Status Bayar" },
];

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
    result = result.filter((row) =>
      Object.values(row).some((val) => String(val).toLowerCase().includes(kw))
    );
  }
  Object.keys(activeColumnFilters.value).forEach((field) => {
    const values = activeColumnFilters.value[field];
    if (values?.length > 0)
      result = result.filter((row) => values.includes(String(row[field])));
  });
  Object.keys(activeTextFilters.value).forEach((field) => {
    const val = activeTextFilters.value[field]?.toLowerCase();
    if (val)
      result = result.filter((row) =>
        String(row[field] || "")
          .toLowerCase()
          .includes(val)
      );
  });
  return result;
});

// Methods
const formatDate = (d: Date): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};
const formatCurrency = (val: any) => {
  if (!val && val !== 0) return "-";
  return "Rp " + Math.round(parseFloat(val)).toLocaleString("id-ID");
};

const loadData = async () => {
  loading.value = true;
  try {
    const params: any = {
      start_date: formatDate(startDate.value),
      end_date: formatDate(endDate.value),
    };
    if (filterSupplier.value) params.supplier = filterSupplier.value;

    const res = await $api.get("/v1/report/pembelian", { params });
    if (res.data.success) {
      data.value = res.data.data;
      buildFilterOptions();
      toast.add({
        severity: "success",
        summary: "Berhasil",
        detail: `${data.value.length} data`,
        life: 2000,
      });
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
      const res = await $api.get(`/v1/report/pembelian/${nomor}/detail`, {
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

// Search
let searchTimeout: any;
const onSearchInput = () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {}, 300);
};

// Text filters
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

// Column filters
const buildFilterOptions = () => {
  filterableColumns.forEach((col) => {
    const values = new Map<string, number>();
    data.value.forEach((row) => {
      const v = String(row[col.field] || "");
      if (v) values.set(v, (values.get(v) || 0) + 1);
    });
    filterOptionsCache.value[col.field] = Array.from(values.entries())
      .map(([v, c]) => ({ value: v, label: v, count: c }))
      .sort((a, b) => a.label.localeCompare(b.label));
  });
};
const setFilterOverlayRef = (f: string, el: any) => {
  if (el) filterOverlays.value[f] = el;
};
const toggleColumnFilter = (col: any, event: Event) => {
  const overlay = filterOverlays.value[col.field];
  if (overlay) {
    if (!tempColumnFilters.value[col.field])
      tempColumnFilters.value[col.field] = [
        ...(activeColumnFilters.value[col.field] || []),
      ];
    overlay.toggle(event);
  }
};
const closeFilterPanel = (f: string) => filterOverlays.value[f]?.hide();
const onFilterPanelHide = (f: string) => {
  tempColumnFilters.value[f] = [...(activeColumnFilters.value[f] || [])];
};
const getFilteredOptions = (f: string) => {
  const opts = filterOptionsCache.value[f] || [];
  const term = filterSearchTerms.value[f]?.toLowerCase() || "";
  return term ? opts.filter((o) => o.label.toLowerCase().includes(term)) : opts;
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

// EXPORTS
// Export Dialog
const exportDialog = ref(false);
const exportWithDetail = ref(true); // Default: dengan detail
const exportType = ref<"excel" | "pdf" | "csv">("excel");

// 🔥 OVERRIDE EXPORT BUTTONS
const exportExcel = () => {
  exportType.value = "excel";
  openExportDialog();
};
const exportPDF = () => {
  exportType.value = "pdf";
  openExportDialog();
};
const exportCSV = () => {
  exportType.value = "csv";
  openExportDialog();
};

const openExportDialog = () => {
  // Cek apakah ada detail yang perlu di-load
  if (filteredData.value.length === 0) {
    toast.add({
      severity: "warn",
      summary: "Peringatan",
      detail: "Tidak ada data",
      life: 2000,
    });
    return;
  }
  exportDialog.value = true;
};

// 🔥 LOAD ALL DETAILS (jika belum di-load)
const loadAllDetails = async (): Promise<Record<string, any[]>> => {
  const allDetails: Record<string, any[]> = {};
  const promises = filteredData.value.map(async (row) => {
    const nomor = row.Nomor;
    if (detailData.value[nomor]) {
      allDetails[nomor] = detailData.value[nomor];
    } else {
      try {
        const res = await $api.get(`/v1/report/pembelian/${nomor}/detail`, {
          params: {
            start_date: formatDate(startDate.value),
            end_date: formatDate(endDate.value),
          },
        });
        if (res.data.success) {
          allDetails[nomor] = res.data.data;
          detailData.value[nomor] = res.data.data; // Cache
        }
      } catch (e) {
        console.error(e);
      }
    }
  });
  await Promise.all(promises);
  return allDetails;
};

// 🔥 PROCEED EXPORT
const proceedExport = async () => {
  exportDialog.value = false;

  if (exportWithDetail.value) {
    toast.add({
      severity: "info",
      summary: "Memproses",
      detail: "Mengambil semua detail items...",
      life: 2000,
    });
    await loadAllDetails();
  }

  if (exportType.value === "excel") doExportExcel();
  else if (exportType.value === "pdf") doExportPDF();
  else if (exportType.value === "csv") doExportCSV();
};

// 🔥 EXPORT EXCEL (DENGAN DETAIL)
const doExportExcel = async () => {
  const ExcelJS = await import("exceljs");
  const wb = new ExcelJS.Workbook();

  // 🔥 STYLE DEFINITIONS
  const headerStyle: any = {
    font: { bold: true, color: { argb: "FFFFFFFF" }, size: 11 },
    fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FF10B981" } },
    alignment: { horizontal: "center", vertical: "middle", wrapText: true },
    border: {
      top: { style: "thin", color: { argb: "FF059669" } },
      bottom: { style: "thin", color: { argb: "FF059669" } },
      left: { style: "thin", color: { argb: "FF059669" } },
      right: { style: "thin", color: { argb: "FF059669" } },
    },
  };
  const dataStyle: any = {
    font: { size: 10, color: { argb: "FF1F2937" } },
    border: {
      top: { style: "thin", color: { argb: "FFD1D5DB" } },
      bottom: { style: "thin", color: { argb: "FFD1D5DB" } },
      left: { style: "thin", color: { argb: "FFD1D5DB" } },
      right: { style: "thin", color: { argb: "FFD1D5DB" } },
    },
    alignment: { vertical: "middle" },
  };
  const altRowStyle: any = {
    ...dataStyle,
    fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FFF9FAFB" } },
  };
  const numStyle: any = {
    ...dataStyle,
    alignment: { horizontal: "right", vertical: "middle" },
    numFmt: "#,##0",
  };
  const titleStyle: any = {
    font: { bold: true, size: 14, color: { argb: "FF1F2937" } },
  };
  const subtitleStyle: any = {
    font: { size: 10, color: { argb: "FF6B7280" } },
  };

  // ========================
  // SHEET 1: RINGKASAN
  // ========================
  const ws1 = wb.addWorksheet("Ringkasan");

  // Title
  ws1.mergeCells("A1:H1");
  ws1.getCell("A1").value = "LAPORAN PEMBELIAN BY NOTA";
  ws1.getCell("A1").style = titleStyle;
  ws1.getRow(1).height = 30;

  // Period
  ws1.mergeCells("A2:H2");
  ws1.getCell("A2").value = `Periode: ${startDate.value.toLocaleDateString(
    "id-ID"
  )} - ${endDate.value.toLocaleDateString("id-ID")}`;
  ws1.getCell("A2").style = subtitleStyle;
  ws1.getRow(2).height = 20;

  // Header (Row 4)
  const masterCols = filterColumns.filter((c) => c.field !== "expander");
  const headerRow = ws1.getRow(4);
  headerRow.height = 25;
  masterCols.forEach((col, idx) => {
    const cell = headerRow.getCell(idx + 1);
    cell.value = col.header;
    cell.style = headerStyle;
  });

  // Data (mulai Row 5)
  filteredData.value.forEach((row, i) => {
    const dataRow = ws1.getRow(5 + i);
    const isEven = i % 2 === 1;

    masterCols.forEach((col, idx) => {
      const cell = dataRow.getCell(idx + 1);
      let val = row[col.field];

      if (col.type === "currency") {
        cell.value = parseFloat(val) || 0;
        cell.style = numStyle;
      } else if (col.field === "Status_Bayar") {
        cell.value = val;
        cell.style = {
          ...dataStyle,
          font: {
            ...dataStyle.font,
            color: { argb: val === "Sudah" ? "FF059669" : "FFD97706" },
          },
          alignment: { horizontal: "center", vertical: "middle" },
        };
      } else {
        cell.value = val || "";
        cell.style = isEven ? altRowStyle : dataStyle;
      }
    });
  });

  // Column widths
  ws1.getColumn(1).width = 14; // Nomor
  ws1.getColumn(2).width = 12; // Tanggal
  ws1.getColumn(3).width = 30; // Supplier
  ws1.getColumn(4).width = 18; // Total
  ws1.getColumn(5).width = 16; // Retur
  ws1.getColumn(6).width = 16; // Bayar
  ws1.getColumn(7).width = 12; // Status
  ws1.getColumn(8).width = 0; // Hidden

  // Auto Filter
  ws1.autoFilter = {
    from: { row: 4, column: 1 },
    to: { row: 4 + filteredData.value.length, column: 7 },
  };
  ws1.views = [{ state: "frozen", ySplit: 4 }];

  // ========================
  // SHEET 2: DETAIL ITEMS (hanya jika dengan detail)
  // ========================
  if (exportWithDetail.value) {
    const ws2 = wb.addWorksheet("Detail Items");

    // Title
    ws2.mergeCells("A1:I1");
    ws2.getCell("A1").value = "DETAIL ITEMS PEMBELIAN";
    ws2.getCell("A1").style = titleStyle;
    ws2.getRow(1).height = 30;

    ws2.mergeCells("A2:I2");
    ws2.getCell("A2").value = `Periode: ${startDate.value.toLocaleDateString(
      "id-ID"
    )} - ${endDate.value.toLocaleDateString("id-ID")}`;
    ws2.getCell("A2").style = subtitleStyle;
    ws2.getRow(2).height = 20;

    // Header (Row 4)
    const detailHeaders = [
      "No. Nota",
      "Supplier",
      "Kode Brg",
      "Nama Barang",
      "Sat",
      "Qty",
      "Harga",
      "Disc%",
      "Nilai",
    ];
    const detailHeaderRow = ws2.getRow(4);
    detailHeaderRow.height = 25;
    detailHeaders.forEach((h, idx) => {
      const cell = detailHeaderRow.getCell(idx + 1);
      cell.value = h;
      cell.style = {
        ...headerStyle,
        fill: {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF3B82F6" },
        }, // Biru untuk detail
      };
    });

    // Data detail
    let rowNum = 5;
    filteredData.value.forEach((row, masterIdx) => {
      const details = detailData.value[row.Nomor] || [];

      if (details.length === 0) {
        // Tetap tulis header nota meski tidak ada detail
        const dr = ws2.getRow(rowNum);
        dr.getCell(1).value = row.Nomor;
        dr.getCell(2).value = row.Supplier;
        dr.getCell(3).value = "-";
        dr.getCell(4).value = "(Tidak ada detail)";
        dr.getCell(5).value = "";
        dr.getCell(6).value = "";
        dr.getCell(7).value = "";
        dr.getCell(8).value = "";
        dr.getCell(9).value = "";

        // Style header nota (bold, sedikit warna)
        for (let c = 1; c <= 9; c++) {
          dr.getCell(c).style = {
            ...dataStyle,
            font: { bold: true, size: 10 },
            fill: {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "FFFEF3C7" },
            },
          };
        }
        rowNum++;
      } else {
        // Tulis detail per item
        details.forEach((detail, detailIdx) => {
          const dr = ws2.getRow(rowNum);

          dr.getCell(1).value = detailIdx === 0 ? row.Nomor : "";
          dr.getCell(2).value = detailIdx === 0 ? row.Supplier : "";
          dr.getCell(3).value = detail.Kode || "";
          dr.getCell(4).value = detail.Nama || "";
          dr.getCell(5).value = detail.Satuan || "";
          dr.getCell(6).value = parseInt(detail.Jumlah) || 0;
          dr.getCell(7).value = parseFloat(detail.Harga) || 0;
          dr.getCell(8).value = parseInt(detail.Disc) || 0;
          dr.getCell(9).value = parseFloat(detail.Nilai) || 0;

          // Style
          for (let c = 1; c <= 9; c++) {
            const isNum = [6, 7, 9].includes(c);
            const isEven = rowNum % 2 === 0;

            if (detailIdx === 0) {
              // First row of group: bold for Nomor & Supplier
              dr.getCell(c).style = {
                ...(isNum ? numStyle : dataStyle),
                font: {
                  bold: [1, 2].includes(c),
                  size: 10,
                  color: { argb: "FF1F2937" },
                },
                fill: isEven
                  ? {
                      type: "pattern",
                      pattern: "solid",
                      fgColor: { argb: "FFF9FAFB" },
                    }
                  : undefined,
              };
            } else {
              dr.getCell(c).style = isNum
                ? numStyle
                : isEven
                ? altRowStyle
                : dataStyle;
            }
          }
          rowNum++;
        });
      }
    });

    // Column widths
    ws2.getColumn(1).width = 14;
    ws2.getColumn(2).width = 28;
    ws2.getColumn(3).width = 12;
    ws2.getColumn(4).width = 32;
    ws2.getColumn(5).width = 7;
    ws2.getColumn(6).width = 8;
    ws2.getColumn(7).width = 14;
    ws2.getColumn(8).width = 8;
    ws2.getColumn(9).width = 16;

    ws2.autoFilter = {
      from: { row: 4, column: 1 },
      to: { row: rowNum - 1, column: 9 },
    };
    ws2.views = [{ state: "frozen", ySplit: 4 }];
  }

  // Download
  const buf = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Laporan_Pembelian_${formatDate(new Date())}${
    exportWithDetail.value ? "_Lengkap" : ""
  }.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
  toast.add({
    severity: "success",
    summary: "Export Excel",
    detail: "Berhasil",
    life: 2000,
  });
};

// 🔥 EXPORT CSV (DENGAN DETAIL)
const doExportCSV = () => {
  let csv = "\uFEFF";

  if (exportWithDetail.value) {
    csv +=
      "Nomor,Tanggal,Supplier,Total,Retur,Bayar,Status,Kode Barang,Nama Barang,Satuan,Qty,Harga,Disc%,Nilai\n";
    filteredData.value.forEach((row) => {
      const details = detailData.value[row.Nomor] || [];
      if (details.length === 0) {
        csv += `${row.Nomor},${row.Tanggal},${row.Supplier},${row.Total},${row.Retur},${row.Bayar},${row.Status_Bayar},,,,,,\n`;
      } else {
        details.forEach((detail) => {
          csv += `${row.Nomor},${row.Tanggal},${row.Supplier},${row.Total},${row.Retur},${row.Bayar},${row.Status_Bayar},${detail.Kode},"${detail.Nama}",${detail.Satuan},${detail.Jumlah},${detail.Harga},${detail.Disc},${detail.Nilai}\n`;
        });
      }
    });
  } else {
    csv += "Nomor,Tanggal,Supplier,Total,Retur,Bayar,Status\n";
    filteredData.value.forEach((row) => {
      csv += `${row.Nomor},${row.Tanggal},"${row.Supplier}",${row.Total},${row.Retur},${row.Bayar},${row.Status_Bayar}\n`;
    });
  }

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Laporan_Pembelian_${formatDate(new Date())}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  toast.add({
    severity: "success",
    summary: "Export CSV",
    detail: "Berhasil",
    life: 2000,
  });
};

// 🔥 EXPORT PDF (DENGAN DETAIL)
const doExportPDF = () => {
  const today = new Date().toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  const period = `${startDate.value.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  })} - ${endDate.value.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  })}`;

  let html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Laporan Pembelian</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Arial, Helvetica, sans-serif; padding: 30px; color: #1f2937; }
        
        /* Cover / Title */
        .report-title { 
            text-align: center; 
            margin-bottom: 5px; 
            font-size: 18px; 
            font-weight: 700; 
            color: #059669; 
            text-transform: uppercase; 
            letter-spacing: 1px;
        }
        .report-subtitle { text-align: center; font-size: 14px; color: #6b7280; margin-bottom: 3px; }
        .report-period { text-align: center; font-size: 12px; color: #9ca3af; margin-bottom: 20px; }
        
        /* Summary Cards */
        .summary-cards {
            display: flex; gap: 15px; margin-bottom: 20px;
        }
        .summary-card {
            flex: 1; padding: 12px 15px; border-radius: 8px; border: 1px solid #e5e7eb;
        }
        .summary-card .label { font-size: 10px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.5px; }
        .summary-card .value { font-size: 18px; font-weight: 700; color: #1f2937; }
        .card-total { border-left: 4px solid #10b981; }
        .card-retur { border-left: 4px solid #ef4444; }
        .card-bayar { border-left: 4px solid #3b82f6; }
        
        /* Table */
        table { width: 100%; border-collapse: collapse; margin-bottom: 15px; font-size: 10px; }
        th { 
            background: #10b981; color: white; font-weight: 600; font-size: 9px;
            text-transform: uppercase; letter-spacing: 0.5px;
            padding: 8px 10px; border: 1px solid #059669; text-align: left;
        }
        td { padding: 6px 10px; border: 1px solid #e5e7eb; }
        tr:nth-child(even) td { background: #f9fafb; }
        
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        
        .status-sudah { color: #059669; font-weight: 600; }
        .status-belum { color: #d97706; font-weight: 600; }
        
        /* Detail Section */
        .nota-group {
            margin-bottom: 20px; border: 1px solid #e5e7eb; border-radius: 8px;
            overflow: hidden; page-break-inside: avoid;
        }
        .nota-header {
            background: #fef3c7; padding: 10px 15px;
            display: flex; justify-content: space-between; align-items: center;
            border-bottom: 1px solid #fcd34d;
        }
        .nota-header .nota-nomor { font-weight: 700; font-size: 12px; color: #1f2937; }
        .nota-header .nota-info { font-size: 10px; color: #6b7280; }
        
        .detail-table { width: 100%; border-collapse: collapse; font-size: 9px; }
        .detail-table th { background: #6b7280; font-size: 8px; padding: 5px 8px; border-color: #4b5563; }
        .detail-table td { padding: 4px 8px; font-size: 9px; }
        
        /* Footer */
        .report-footer {
            margin-top: 25px; padding-top: 10px; border-top: 1px solid #e5e7eb;
            display: flex; justify-content: space-between; font-size: 9px; color: #9ca3af;
        }
        
        /* Print Settings */
        @media print {
            body { padding: 15px; }
            .no-print { display: none; }
            @page { margin: 10mm; size: A4 landscape; }
        }
    </style>
</head>
<body>
    <!-- Print Button (will be hidden when printing) -->
    <div class="no-print" style="text-align: right; margin-bottom: 15px;">
        <button onclick="window.print()" style="
            padding: 10px 24px; background: #10b981; color: white; border: none;
            border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 600;
        ">
            🖨️ Print / Save as PDF
        </button>
    </div>
    
    <!-- Title -->
    <div class="report-title">Laporan Pembelian By Nota</div>
    <div class="report-period">Periode: ${period}</div>
    
    <!-- Summary -->
    <div class="summary-cards">
        <div class="summary-card card-total">
            <div class="label">Total Pembelian</div>
            <div class="value">${formatCurrency(
              filteredData.value.reduce(
                (s, r) => s + (parseFloat(r.Total) || 0),
                0
              )
            )}</div>
        </div>
        <div class="summary-card card-retur">
            <div class="label">Total Retur</div>
            <div class="value">${formatCurrency(
              filteredData.value.reduce(
                (s, r) => s + (parseFloat(r.Retur) || 0),
                0
              )
            )}</div>
        </div>
        <div class="summary-card card-bayar">
            <div class="label">Total Bayar</div>
            <div class="value">${formatCurrency(
              filteredData.value.reduce(
                (s, r) => s + (parseFloat(r.Bayar) || 0),
                0
              )
            )}</div>
        </div>
    </div>
`;

  if (exportWithDetail.value) {
    // 🔥 DETAIL MODE
    html += `<div style="font-size: 12px; font-weight: 600; color: #374151; margin-bottom: 10px;">📋 Detail Items Per Nota (${filteredData.value.length} nota)</div>`;

    filteredData.value.forEach((row, idx) => {
      const details = detailData.value[row.Nomor] || [];
      const totalDetailNilai = details.reduce(
        (s: number, d: any) => s + (parseFloat(d.Nilai) || 0),
        0
      );

      html += `
            <div class="nota-group">
                <div class="nota-header">
                    <div>
                        <span class="nota-nomor">📄 ${row.Nomor}</span>
                        <span style="margin-left: 10px; font-size: 10px; color: #6b7280;">| ${
                          row.Tanggal
                        }</span>
                    </div>
                    <div class="nota-info">
                        ${row.Supplier} | Total: ${formatCurrency(
        row.Total
      )} | Status: <span class="${
        row.Status_Bayar === "Sudah" ? "status-sudah" : "status-belum"
      }">${row.Status_Bayar}</span>
                    </div>
                </div>`;

      if (details.length > 0) {
        html += `
                <table class="detail-table">
                    <thead>
                        <tr>
                            <th>Kode</th>
                            <th>Nama Barang</th>
                            <th style="text-align:center">Sat</th>
                            <th style="text-align:center">Qty</th>
                            <th class="text-right">Harga</th>
                            <th style="text-align:center">Disc%</th>
                            <th class="text-right">Nilai</th>
                        </tr>
                    </thead>
                    <tbody>`;

        details.forEach((d: any) => {
          html += `
                        <tr>
                            <td>${d.Kode || "-"}</td>
                            <td>${d.Nama || "-"}</td>
                            <td style="text-align:center">${
                              d.Satuan || "-"
                            }</td>
                            <td style="text-align:center">${d.Jumlah || 0}</td>
                            <td class="text-right">${formatCurrency(
                              d.Harga
                            )}</td>
                            <td style="text-align:center">${d.Disc || 0}</td>
                            <td class="text-right">${formatCurrency(
                              d.Nilai
                            )}</td>
                        </tr>`;
        });

        html += `
                    </tbody>
                    <tfoot>
                        <tr style="background: #f3f4f6; font-weight: 600;">
                            <td colspan="6" style="text-align:right; padding:5px 8px;">Total Detail:</td>
                            <td class="text-right" style="padding:5px 8px;">${formatCurrency(
                              totalDetailNilai
                            )}</td>
                        </tr>
                    </tfoot>
                </table>`;
      } else {
        html += `<div style="padding: 15px; text-align: center; color: #9ca3af; font-size: 10px;">Tidak ada detail items</div>`;
      }

      html += `</div>`;
    });
  } else {
    // 🔥 RINGKASAN MODE
    html += `
        <table>
            <thead>
                <tr>
                    <th>No</th>
                    <th>Nomor</th>
                    <th>Tanggal</th>
                    <th>Supplier</th>
                    <th class="text-right">Total</th>
                    <th class="text-right">Retur</th>
                    <th class="text-right">Bayar</th>
                    <th class="text-center">Status</th>
                </tr>
            </thead>
            <tbody>`;

    filteredData.value.forEach((row, i) => {
      html += `
                <tr>
                    <td class="text-center">${i + 1}</td>
                    <td>${row.Nomor}</td>
                    <td>${row.Tanggal}</td>
                    <td>${row.Supplier}</td>
                    <td class="text-right">${formatCurrency(row.Total)}</td>
                    <td class="text-right">${formatCurrency(row.Retur)}</td>
                    <td class="text-right">${formatCurrency(row.Bayar)}</td>
                    <td class="text-center"><span class="${
                      row.Status_Bayar === "Sudah"
                        ? "status-sudah"
                        : "status-belum"
                    }">${row.Status_Bayar}</span></td>
                </tr>`;
    });

    // Footer total
    const totalAll = filteredData.value.reduce(
      (s, r) => s + (parseFloat(r.Total) || 0),
      0
    );
    const returAll = filteredData.value.reduce(
      (s, r) => s + (parseFloat(r.Retur) || 0),
      0
    );
    const bayarAll = filteredData.value.reduce(
      (s, r) => s + (parseFloat(r.Bayar) || 0),
      0
    );

    html += `
            </tbody>
            <tfoot>
                <tr style="background: #fef3c7; font-weight: 700;">
                    <td colspan="4" style="text-align:right; padding:8px 10px;">TOTAL</td>
                    <td class="text-right" style="padding:8px 10px;">${formatCurrency(
                      totalAll
                    )}</td>
                    <td class="text-right" style="padding:8px 10px;">${formatCurrency(
                      returAll
                    )}</td>
                    <td class="text-right" style="padding:8px 10px;">${formatCurrency(
                      bayarAll
                    )}</td>
                    <td></td>
                </tr>
            </tfoot>
        </table>`;
  }

  html +=
    `
    <!-- Footer -->
    <div class="report-footer">
        <span>Dicetak pada: ${today}</span>
        <span>Halaman 1</span>
    </div>
    
    <script>
        // Auto-print after load
        window.onload = function() {
            // Uncomment baris di bawah untuk auto-print
            // setTimeout(function() { window.print(); }, 300);
        }
    </` +
    `script>
</body>
</html>`;

  const win = window.open("", "_blank", "width=1100,height=750");
  if (win) {
    win.document.write(html);
    win.document.close();
    // Tidak auto-print, biarkan user klik tombol
  }
  toast.add({
    severity: "success",
    summary: "Preview PDF",
    detail: "Klik tombol Print/Save di halaman",
    life: 3000,
  });
};

// const exportCSV = () => {
//     if (!filteredData.value.length) { toast.add({ severity: 'warn', summary: 'Peringatan', detail: 'Tidak ada data', life: 2000 }); return }
//     const cols = filterColumns.map(c => c.field)
//     let csv = '\uFEFF' + filterColumns.map(c => `"${c.header}"`).join(',') + '\n'
//     filteredData.value.forEach(row => csv += cols.map(c => `"${String(row[c] || '').replace(/"/g, '""')}"`).join(',') + '\n')
//     const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
//     const url = URL.createObjectURL(blob); const a = document.createElement('a')
//     a.href = url; a.download = `Laporan_Pembelian_${formatDate(new Date())}.csv`; a.click(); URL.revokeObjectURL(url)
//     toast.add({ severity: 'success', summary: 'Export CSV', detail: 'Berhasil', life: 2000 })
// }

// const exportExcel = async () => {
//     if (!filteredData.value.length) { toast.add({ severity: 'warn', summary: 'Peringatan', detail: 'Tidak ada data', life: 2000 }); return }
//     const ExcelJS = await import('exceljs')
//     const wb = new ExcelJS.Workbook(); const ws = wb.addWorksheet('Pembelian')
//     const headerStyle = { font: { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 }, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF10B981' } }, alignment: { horizontal: 'center', vertical: 'middle', wrapText: true }, border: { top: { style: 'thin', color: { argb: 'FF000000' } }, bottom: { style: 'thin', color: { argb: 'FF000000' } }, left: { style: 'thin', color: { argb: 'FF000000' } }, right: { style: 'thin', color: { argb: 'FF000000' } } } }
//     const dataStyle = { font: { size: 10 }, border: { top: { style: 'thin', color: { argb: 'FFD1D5DB' } }, bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } }, left: { style: 'thin', color: { argb: 'FFD1D5DB' } }, right: { style: 'thin', color: { argb: 'FFD1D5DB' } } } }
//     const evenRowStyle = { ...dataStyle, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9FAFB' } } }
//     const numStyle = { ...dataStyle, alignment: { horizontal: 'right', vertical: 'middle' }, numFmt: '#,##0' }
//     ws.columns = filterColumns.map(c => ({ header: c.header, key: c.field, width: c.field === 'Supplier' ? 28 : c.field === 'Nomor' ? 16 : 15 }))
//     ws.getRow(1).height = 25; ws.getRow(1).eachCell(cell => { cell.style = headerStyle as any })
//     filteredData.value.forEach((row, i) => {
//         const dr = ws.addRow(row)
//         dr.eachCell((cell, cn) => {
//             const col = filterColumns[cn - 1]; const isEven = i % 2 === 1
//             cell.style = (col?.type === 'currency' ? { ...numStyle } : isEven ? evenRowStyle : dataStyle) as any
//             if (col?.type === 'currency') cell.value = parseFloat(cell.value as string) || 0
//         })
//     })
//     ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: filterColumns.length } }
//     ws.views = [{ state: 'frozen', ySplit: 1 }]
//     const buf = await wb.xlsx.writeBuffer(); const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
//     const url = URL.createObjectURL(blob); const a = document.createElement('a')
//     a.href = url; a.download = `Laporan_Pembelian_${formatDate(new Date())}.xlsx`; a.click(); URL.revokeObjectURL(url)
//     toast.add({ severity: 'success', summary: 'Export Excel', detail: 'Berhasil', life: 2000 })
// }

// const exportPDF = () => {
//     if (!filteredData.value.length) { toast.add({ severity: 'warn', summary: 'Peringatan', detail: 'Tidak ada data', life: 2000 }); return }
//     const cols = filterColumns.map(c => c.header); const rows = filteredData.value.map(r => filterColumns.map(c => r[c.field] || ''))
//     let html = `<html><head><title>Laporan Pembelian</title><style>body{font-family:Arial;padding:20px}h1{font-size:18px;text-align:center}table{width:100%;border-collapse:collapse;margin-top:10px}th{background:#f0f0f0;border:1px solid #ccc;padding:6px;font-size:11px}td{border:1px solid #ccc;padding:5px;font-size:10px}.tr{text-align:right}</style></head><body><h1>Laporan Pembelian By Nota</h1><p>Periode: ${startDate.value.toLocaleDateString('id-ID')} - ${endDate.value.toLocaleDateString('id-ID')}</p><table><thead><tr>${cols.map(c => `<th>${c}</th>`).join('')}</tr></thead><tbody>${rows.map(row => `<tr>${row.map((cell, i) => { const col = filterColumns[i]; return `<td class="${col.align === 'right' ? 'tr' : ''}">${cell}</td>` }).join('')}</tr>`).join('')}</tbody></table></body></html>`
//     const win = window.open('', '_blank', 'width=1000,height=700')
//     if (win) { win.document.write(html); win.document.close(); setTimeout(() => win.print(), 500) }
//     toast.add({ severity: 'success', summary: 'Export PDF', detail: 'Gunakan Print > Save as PDF', life: 3000 })
// }

// Init
onMounted(async () => {
  try {
    const res = await $api.get("/supplier");
    supplierList.value = res.data.data || [];
  } catch (e) {
    console.error(e);
  }
  resetTextFilters();
  loadData();
});
</script>

<style lang="scss" scoped>
// Status Badge (pengganti Tag, lebih kecil)
.status-badge {
  display: inline-block;
  padding: 0.15rem 0.5rem;
  border-radius: 1rem;
  font-size: 0.7rem;
  font-weight: 600;
  line-height: 1.2;

  &.status-sudah {
    background: #ecfdf5;
    color: #059669;
  }

  &.status-belum {
    background: #fffbeb;
    color: #d97706;
  }
}

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

.date-filter-row {
  display: flex;
  align-items: flex-end;
  gap: 1rem;
  padding: 0.75rem;
  border-bottom: 1px solid var(--surface-border);
  background: var(--surface-0);
  flex-wrap: wrap;
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
  .text-filter-item {
    label {
      display: block;
      font-size: 0.7rem;
      font-weight: 600;
      color: var(--text-color-secondary);
      margin-bottom: 0.2rem;
    }
  }
  .text-filter-footer {
    display: flex;
    justify-content: space-between;
  }
}

.report-table {
  // 🔥 HEADER KECIL (SAMA SEPERTI PERSEDIAAN)
  :deep(.p-datatable-thead > tr > th) {
    background: var(--surface-50);
    font-size: 0.7rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.025em;
    color: var(--text-color-secondary);
    padding: 0.35rem 0.5rem !important; // 🔥 KECIL
    height: 2rem !important; // 🔥 KECIL
    border-bottom: 2px solid var(--surface-border);
  }

  // 🔥 BODY CELL KECIL
  :deep(.p-datatable-tbody > tr > td) {
    padding: 0.25rem 0.5rem;
    font-size: 0.8rem;
  }

  // Sort icon kecil
  :deep(.p-sortable-column-icon) {
    font-size: 0.65rem;
    margin-left: 0.25rem;
  }

  // Expander column
  :deep(.p-datatable-tbody > tr > td:first-child) {
    padding: 0.25rem 0.35rem !important;
  }

  :deep(.p-datatable-row-expansion) {
    td {
      padding: 0 !important;
    }
  }
}

.column-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.25rem;

  .column-title {
    flex: 1;
    font-size: 0.7rem; // 🔥 SAMA DENGAN HEADER
  }

  .filter-active {
    background: var(--primary-100) !important;
    color: var(--primary-700) !important;
  }

  // Filter icon lebih kecil
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
      transition: background 0.2s;
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
.w-48 {
  width: 12rem;
}
.text-primary-600 {
  color: var(--primary-600);
}

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
            content: "";
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
  .text-filter-panel .text-filter-grid {
    grid-template-columns: 1fr;
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
