<template>
    <div class="report-template">
        <!-- Header -->
        <div class="report-header">
            <div class="header-left">
                <div class="header-icon">
                    <i :class="['pi', config.icon || 'pi-file']"></i>
                </div>
                <div class="header-text">
                    <h1 class="header-title">{{ config.title }}</h1>
                    <p class="header-subtitle">{{ config.subtitle || 'Laporan' }}</p>
                </div>
            </div>
            <div class="header-actions">
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
            </div>
        </div>

        <!-- Filter Bar -->
        <div class="report-filter">
            <div class="filter-row">
                <div class="filter-item">
                    <label>Tanggal Mulai</label>
                    <DatePicker 
                        v-model="startDate" 
                        dateFormat="yy-mm-dd" 
                        showIcon 
                        size="small"
                        placeholder="DD/MM/YYYY"
                    />
                </div>
                <div class="filter-item">
                    <label>Tanggal Akhir</label>
                    <DatePicker 
                        v-model="endDate" 
                        dateFormat="yy-mm-dd" 
                        showIcon 
                        size="small"
                        placeholder="DD/MM/YYYY"
                    />
                </div>
                
                <!-- Additional Filters (Dynamic) -->
                <div 
                    v-for="filter in config.filters" 
                    :key="filter.field"
                    class="filter-item"
                >
                    <label>{{ filter.label }}</label>
                    <InputText 
                        v-if="filter.type === 'text'"
                        v-model="filterValues[filter.field]"
                        :placeholder="filter.placeholder"
                        size="small"
                    />
                    <Select 
                        v-else-if="filter.type === 'select'"
                        v-model="filterValues[filter.field]"
                        :options="filter.options"
                        optionLabel="label"
                        optionValue="value"
                        :placeholder="filter.placeholder"
                        size="small"
                        showClear
                    />
                </div>
                
                <div class="filter-actions">
                    <Button 
                        label="Load Data" 
                        icon="pi pi-search" 
                        severity="primary" 
                        size="small"
                        :loading="loading"
                        @click="loadData"
                    />
                    <Button 
                        label="Reset" 
                        icon="pi pi-refresh" 
                        severity="secondary" 
                        text 
                        size="small"
                        @click="resetFilter"
                    />
                </div>
            </div>
        </div>

        <!-- Master Table -->
        <div class="report-card">
            <div class="card-header">
                <i class="pi pi-list"></i>
                <span>{{ config.masterTitle || 'Data' }}</span>
                <span class="record-count" v-if="masterData.length > 0">
                    {{ masterData.length }} records
                </span>
            </div>
            
            <DataTable 
                v-model:expandedRows="expandedRows"
                :value="masterData"
                :loading="loading"
                :dataKey="config.masterKey"
                @rowExpand="onRowExpand"
                @rowCollapse="onRowCollapse"
                class="report-table"
                stripedRows
                size="small"
                showGridlines
            >
                <template #empty>
                    <div class="empty-state">
                        <i class="pi pi-search"></i>
                        <p>Klik "Load Data" untuk menampilkan laporan</p>
                    </div>
                </template>
                
                <template #loading>
                    <div class="loading-state">
                        <i class="pi pi-spinner pi-spin"></i>
                        <p>Memuat data...</p>
                    </div>
                </template>

                <!-- Expander Column (jika ada detail) -->
                <Column v-if="config.detailSQL" expander style="width: 3rem" />
                
                <!-- Master Columns -->
                <Column 
                    v-for="col in config.masterColumns" 
                    :key="col.field"
                    :field="col.field"
                    :header="col.header"
                    :sortable="col.sortable !== false"
                    :style="{ 
                        width: col.width || 'auto', 
                        minWidth: col.minWidth || '100px',
                        textAlign: col.align || 'left'
                    }"
                >
                    <template v-if="col.type === 'currency'" #body="{ data }">
                        {{ formatCurrency(data[col.field]) }}
                    </template>
                    <template v-else-if="col.type === 'number'" #body="{ data }">
                        {{ formatNumber(data[col.field]) }}
                    </template>
                </Column>

                <!-- Footer Summary -->
                <template #footer v-if="config.summaryColumns && config.summaryColumns.length > 0">
                    <div class="summary-row">
                        <span class="summary-label">TOTAL</span>
                        <span 
                            v-for="(sum, index) in config.summaryColumns" 
                            :key="index"
                            class="summary-value"
                            :style="{ textAlign: sum.align || 'right' }"
                        >
                            {{ calculateSummary(sum.field, sum.type) }}
                        </span>
                    </div>
                </template>

                <!-- Row Expansion Template (Detail) -->
                <template v-if="config.detailSQL" #expansion="slotProps">
                    <div class="detail-content">
                        <div class="detail-header">
                            <i class="pi pi-info-circle"></i>
                            <span>{{ config.detailTitle || 'Detail' }} - {{ slotProps.data[config.masterKey] }}</span>
                        </div>
                        
                        <div v-if="detailLoading[slotProps.data[config.masterKey]]" class="detail-loading">
                            <i class="pi pi-spinner pi-spin"></i>
                            <span>Memuat detail...</span>
                        </div>
                        
                        <DataTable 
                            v-else
                            :value="detailData[slotProps.data[config.masterKey]] || []"
                            class="detail-table"
                            size="small"
                            stripedRows
                            showGridlines
                        >
                            <template #empty>
                                <div class="detail-empty">Tidak ada detail</div>
                            </template>
                            
                            <Column 
                                v-for="col in config.detailColumns" 
                                :key="col.field"
                                :field="col.field"
                                :header="col.header"
                                :style="{ 
                                    width: col.width || 'auto', 
                                    minWidth: col.minWidth || '100px',
                                    textAlign: col.align || 'left'
                                }"
                            >
                                <template v-if="col.type === 'currency'" #body="{ data }">
                                    {{ formatCurrency(data[col.field]) }}
                                </template>
                                <template v-else-if="col.type === 'number'" #body="{ data }">
                                    {{ formatNumber(data[col.field]) }}
                                </template>
                            </Column>
                        </DataTable>
                    </div>
                </template>
            </DataTable>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'

export interface ReportColumn {
    field: string
    header: string
    width?: string
    minWidth?: string
    align?: 'left' | 'center' | 'right'
    type?: 'text' | 'currency' | 'number' | 'date'
    sortable?: boolean
}

export interface SummaryColumn {
    field: string
    type: 'sum' | 'count'
    align?: string
}

export interface FilterConfig {
    field: string
    label: string
    type: 'text' | 'select' | 'date'
    placeholder?: string
    options?: { label: string; value: any }[]
}

export interface ReportConfig {
    title: string
    subtitle?: string
    icon?: string
    endpoint: string
    masterKey: string
    masterTitle?: string
    masterColumns: ReportColumn[]
    detailSQL?: string
    detailEndpoint?: string
    detailTitle?: string
    detailColumns?: ReportColumn[]
    summaryColumns?: SummaryColumn[]
    filters?: FilterConfig[]
}

const props = defineProps<{
    config: ReportConfig
}>()

const { $api } = useNuxtApp()
const toast = useToast()

// State
const loading = ref(false)
const startDate = ref<Date>(new Date(new Date().setDate(new Date().getDate() - 30)))
const endDate = ref<Date>(new Date())
const filterValues = reactive<Record<string, any>>({})
const masterData = ref<any[]>([])
const expandedRows = ref<Record<string, boolean>>({})
const detailData = ref<Record<string, any[]>>({})
const detailLoading = ref<Record<string, boolean>>({})

// Methods
const formatDate = (date: Date): string => {
    return date.toISOString().split('T')[0]
}

const formatCurrency = (value: any): string => {
    if (value === null || value === undefined || value === '') return '-'
    const num = parseFloat(value) || 0
    return new Intl.NumberFormat('id-ID', { 
        style: 'currency', 
        currency: 'IDR', 
        minimumFractionDigits: 0 
    }).format(num)
}

const formatNumber = (value: any): string => {
    if (value === null || value === undefined || value === '') return '-'
    const num = parseFloat(value) || 0
    return num.toLocaleString('id-ID')
}

const loadData = async () => {
    loading.value = true
    console.log('📊 Loading report data...', props.config.endpoint)
    
    try {
        const params: any = {
            start_date: formatDate(startDate.value),
            end_date: formatDate(endDate.value),
            ...filterValues
        }
        
        console.log('📤 Params:', params)
        
        const response = await $api.get(props.config.endpoint, { params })
        console.log('📥 Response:', response.data)
        
        if (response.data.success) {
            masterData.value = response.data.data
            console.log('✅ Data loaded:', response.data.data.length)
        } else {
            console.error('❌ API error:', response.data.message)
        }
    } catch (error: any) {
        console.error('❌ Request failed:', error)
    } finally {
        loading.value = false
    }
}

const resetFilter = () => {
    startDate.value = new Date(new Date().setDate(new Date().getDate() - 30))
    endDate.value = new Date()
    Object.keys(filterValues).forEach(key => delete filterValues[key])
    masterData.value = []
    detailData.value = {}
}

const onRowExpand = async (event: any) => {
    if (!props.config.detailEndpoint) return
    
    const rowData = event.data
    const id = rowData[props.config.masterKey]
    
    if (!detailData.value[id]) {
        await fetchDetail(id)
    }
}

const onRowCollapse = (event: any) => {
    // Optional
}

const fetchDetail = async (id: string) => {
    if (!props.config.detailEndpoint) return
    
    detailLoading.value[id] = true
    try {
        const endpoint = props.config.detailEndpoint.replace('{id}', id)
        const params: any = {
            start_date: formatDate(startDate.value),
            end_date: formatDate(endDate.value),
            ...filterValues
        }
        
        const response = await $api.get(endpoint, { params })
        
        if (response.data.success) {
            detailData.value[id] = response.data.data
        }
    } catch (error) {
        console.error('Failed to fetch detail:', error)
    } finally {
        detailLoading.value[id] = false
    }
}

const calculateSummary = (field: string, type: string): string => {
    if (type === 'sum') {
        const total = masterData.value.reduce((sum, row) => sum + (parseFloat(row[field]) || 0), 0)
        return formatCurrency(total)
    }
    if (type === 'count') {
        return masterData.value.length.toString()
    }
    return ''
}

// Export functions
const exportExcel = () => {
    toast.add({ severity: 'info', summary: 'Export Excel', detail: 'Fitur export Excel sedang dikembangkan', life: 2000 })
}

const exportPDF = () => {
    toast.add({ severity: 'info', summary: 'Export PDF', detail: 'Fitur export PDF sedang dikembangkan', life: 2000 })
}

const exportCSV = () => {
    if (masterData.value.length === 0) {
        toast.add({ severity: 'warn', summary: 'Peringatan', detail: 'Tidak ada data untuk diexport', life: 2000 })
        return
    }
    
    // Generate CSV
    const columns = props.config.masterColumns.map(col => col.header)
    const rows = masterData.value.map(row => 
        props.config.masterColumns.map(col => row[col.field] || '')
    )
    
    let csv = columns.join(',') + '\n'
    rows.forEach(row => {
        csv += row.join(',') + '\n'
    })
    
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${props.config.title.replace(/\s+/g, '_')}_${formatDate(startDate.value)}_${formatDate(endDate.value)}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
    
    toast.add({ severity: 'success', summary: 'Export CSV', detail: 'File CSV berhasil didownload', life: 2000 })
}
</script>

<style lang="scss" scoped>
.report-template {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 1rem;
}

// Header
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

    .header-title {
        font-size: 1.25rem;
        font-weight: 700;
        color: var(--text-color);
        margin: 0 0 0.25rem 0;
    }

    .header-subtitle {
        font-size: 0.813rem;
        color: var(--text-color-secondary);
        margin: 0;
    }

    .header-actions {
        display: flex;
        gap: 0.5rem;
    }
}

// Filter
.report-filter {
    background: var(--surface-card);
    border-radius: 0.75rem;
    border: 1px solid var(--surface-border);
    padding: 1rem 1.5rem;

    .filter-row {
        display: flex;
        align-items: flex-end;
        gap: 1rem;
        flex-wrap: wrap;
    }

    .filter-item {
        display: flex;
        flex-direction: column;
        gap: 0.375rem;

        label {
            font-size: 0.75rem;
            font-weight: 600;
            color: var(--text-color-secondary);
        }
    }

    .filter-actions {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-left: auto;
    }
}

// Card
.report-card {
    background: var(--surface-card);
    border-radius: 0.75rem;
    border: 1px solid var(--surface-border);
    overflow: hidden;

    .card-header {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.75rem 1.25rem;
        border-bottom: 1px solid var(--surface-border);
        font-weight: 600;
        color: var(--text-color);
        background: var(--surface-50);

        i { color: var(--primary-500); }

        .record-count {
            margin-left: auto;
            font-size: 0.75rem;
            color: var(--text-color-secondary);
            font-weight: 400;
        }
    }
}

.report-table {
    :deep(.p-datatable-thead > tr > th) {
        background: var(--surface-100);
        font-size: 0.75rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.025em;
        color: var(--text-color-secondary);
        padding: 0.625rem 0.75rem;
        border-bottom: 2px solid var(--surface-border);
    }

    :deep(.p-datatable-tbody > tr > td) {
        padding: 0.5rem 0.75rem;
        font-size: 0.813rem;
    }

    :deep(.p-datatable-tfoot > tr > td) {
        padding: 0.625rem 0.75rem;
        font-weight: 700;
        background: var(--surface-100);
        border-top: 2px solid var(--surface-border);
    }
}

.summary-row {
    display: flex;
    align-items: center;
    justify-content: space-around;
    width: 100%;

    .summary-label {
        font-weight: 700;
        color: var(--primary-700);
    }

    .summary-value {
        font-weight: 700;
        color: var(--primary-700);
    }
}

.empty-state,
.loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem;
    color: var(--text-color-secondary);

    i { font-size: 2.5rem; margin-bottom: 0.75rem; }
    p { margin: 0; font-size: 0.875rem; }
}

// Detail
.detail-content {
    padding: 1rem 1.5rem;
    background: var(--surface-50);
    border-top: 1px solid var(--surface-border);

    .detail-header {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 0.75rem;
        font-weight: 600;
        color: var(--text-color);

        i { color: var(--primary-500); }
    }
}

.detail-table {
    background: var(--surface-card);
    border-radius: 0.375rem;
    overflow: hidden;
    border: 1px solid var(--surface-border);

    :deep(.p-datatable-tbody > tr > td) {
        padding: 0.4rem 0.75rem;
        font-size: 0.75rem;
    }
}

.detail-loading,
.detail-empty {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    color: var(--text-color-secondary);
    font-size: 0.813rem;
}

// Dark mode
:global(.app-dark) {
    .report-card .card-header,
    .report-table :deep(.p-datatable-thead > tr > th),
    .report-table :deep(.p-datatable-tfoot > tr > td) {
        background: var(--surface-800);
    }
}
</style>