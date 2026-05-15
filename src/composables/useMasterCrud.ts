// composables/useMasterCrud.ts
import { ref, reactive, computed } from 'vue'
import { useToast } from 'primevue/usetoast'
import { FilterMatchMode, FilterOperator } from '@primevue/core/api'

export interface ColumnConfig {
    field: string
    header: string
    type?: 'text' | 'currency' | 'date' | 'number' | 'status' | 'boolean'
    sortable?: boolean
    width?: string
    minWidth?: string
    maxWidth?: string
    hidden?: boolean
    hideOnMobile?: boolean
    filterable?: boolean
    filterType?: 'text' | 'select' | 'date' | 'numeric'
    filterOptions?: any[]
    filterOptionsFrom?: string
    icon?: string
    description?: string
    booleanLabels?: { true: string; false: string }
    booleanSeverity?: { true: string; false: string }
    align?: 'left' | 'center' | 'right'
}

export interface FormFieldConfig {
    field: string
    label: string
    type: 'text' | 'textarea' | 'number' | 'currency' | 'date' | 'select' | 'boolean'
    required?: boolean
    placeholder?: string
    options?: { label: string; value: any }[]
    defaultValue?: any
    icon?: string
    fullWidth?: boolean
    helpText?: string
}

export interface ExpansionConfig {
    enabled: boolean
    endpoint: string
    title?: string
    columns?: ExpansionColumn[]
}

export interface ExpansionColumn {
    field: string
    header: stringMasterConfigf
    width?: string
    minWidth?: string
    align?: 'left' | 'center' | 'right'
    type?: 'text' | 'currency' | 'date' | 'number'
}

export interface MasterConfig {
    endpoint: string
    primaryKey: string
    title: string
    columns: ColumnConfig[]
    formFields: FormFieldConfig[]
    subtitle?: string
    icon?: string
    filterOptionsEndpoint?: string
    expansion?: ExpansionConfig
    formRoute?: string  // ✅ TAMBAHKAN - route ke halaman form
}

export const useMasterCrud = (config: MasterConfig) => {
    const { $api } = useNuxtApp()
    const toast = useToast()

    // State
    const items = ref<any[]>([])
    const selectedItems = ref<any[]>([])
    const loading = ref(false)

    // Search & Filters
    const searchKeyword = ref('')
    const tableFilters = ref<Record<string, any>>({})
    const dynamicFilterOptions = ref<Record<string, any[]>>({})

    const allDistinctValues = ref<Record<string, any[]>>({})


    // Pagination
    const pagination = reactive({
        page: 1,
        perPage: 15,
        total: 0,
        lastPage: 1
    })

    // Sorting
    const sortField = ref('')
    const sortOrder = ref<1 | -1 | null>(null)

    // Form Dialog / Drawer
    // const formVisible = ref(false)
    // const formMode = ref<'add' | 'edit'>('add')
    // const formData = reactive<Record<string, any>>({})
    // const formLoading = ref(false)

    // Delete Dialog
    const deleteVisible = ref(false)
    const deleteItem = ref<any>(null)
    const deleteLoading = ref(false)

    // Computed
    const isEdit = computed(() => formMode.value === 'edit')
    const isAdd = computed(() => formMode.value === 'add')
    const dialogTitle = computed(() => isAdd.value ? `Tambah ${config.title}` : `Edit ${config.title}`)

    /** 
     * Initialize filters based on column config
     */
    const initFilters = () => {
        const filters: Record<string, any> = {}

        config.columns.forEach(col => {
            if (col.filterable === false) return

            // Untuk filter multi-select, kita simpan sebagai array kosong
            filters[col.field] = []
        })

        tableFilters.value = filters
    }

    /**
     * 🔥 TRANSFORM FILTERS: PrimeVue format → Simple format untuk backend
     */
    const transformFilters = (primevueFilters: Record<string, any>): Record<string, any> => {
        const simpleFilters: Record<string, any> = {}

        Object.keys(primevueFilters).forEach(field => {
            const filterValue = primevueFilters[field]

            // Skip jika null, undefined, atau array kosong
            if (filterValue === null || filterValue === undefined) return
            if (Array.isArray(filterValue) && filterValue.length === 0) return

            // Jika array, langsung pakai (untuk multi-select)
            if (Array.isArray(filterValue)) {
                simpleFilters[field] = filterValue
            }
            // Jika object PrimeVue filter (punya .value)
            else if (typeof filterValue === 'object' && filterValue.value !== undefined) {
                const value = filterValue.value
                if (Array.isArray(value) && value.length > 0) {
                    simpleFilters[field] = value
                } else if (value && !Array.isArray(value)) {
                    simpleFilters[field] = value
                }
            }
            // Jika string/number langsung
            else if (filterValue !== '') {
                simpleFilters[field] = filterValue
            }
        })

        return simpleFilters
    }

    /**
     * Build standard query params for backend
     */
    const buildQueryParams = () => {
        const params: any = {
            page: pagination.page,
            per_page: pagination.perPage
        }

        if (sortField.value && sortOrder.value) {
            params.sort_by = sortField.value
            params.sort_order = sortOrder.value === 1 ? 'asc' : 'desc'
        }

        if (searchKeyword.value) {
            params.search = searchKeyword.value
        }

        // 🔥 Transform filters ke format sederhana
        const simpleFilters = transformFilters(tableFilters.value)

        if (Object.keys(simpleFilters).length > 0) {
            params.filters = JSON.stringify(simpleFilters)
        }

        return params
    }

    /**
     * Fetch main data
     */
    const fetchData = async () => {
        loading.value = true
        try {
            const params = buildQueryParams()
            console.log('📤 Fetch with params:', params)

            const response = await $api.get(config.endpoint, { params })

            if (response.data.success) {
                items.value = response.data.data
                pagination.total = response.data.pagination.total
                pagination.lastPage = response.data.pagination.last_page
                pagination.perPage = response.data.pagination.per_page
            }
        } catch (error: any) {
            console.error('Fetch error:', error)
            toast.add({
                severity: 'error',
                summary: 'Gagal',
                detail: error.response?.data?.message || 'Gagal mengambil data',
                life: 3000
            })
        } finally {
            loading.value = false
        }
    }

    /**
     * Fetch filter options from backend
     */
    const fetchFilterOptions = async () => {
        if (!config.filterOptionsEndpoint) return

        try {
            const response = await $api.get(config.filterOptionsEndpoint)
            if (response.data.success) {
                dynamicFilterOptions.value = response.data.data
                console.log('✅ Filter options loaded:', Object.keys(response.data.data))
            } else {
                console.error('❌ Failed to load filter options:', response.data.message)
            }
        } catch (error) {
            console.error('❌ Filter options API error:', error)
            // Jangan fallback, biarkan kosong
            dynamicFilterOptions.value = {}
        }
    }

    const fetchAllDistinctValues = async () => {
        try {
            const response = await $api.get('/v1/barang/all-distinct-values')
            if (response.data.success) {
                allDistinctValues.value = response.data.data
                console.log('✅ All distinct values loaded:', Object.keys(response.data.data))
            }
        } catch (error) {
            console.error('❌ Failed to fetch all distinct values:', error)
        }
    }

    /**
     * Actions
     */
    const resetForm = () => {
        Object.keys(formData).forEach(key => delete formData[key])
        config.formFields.forEach(field => {
            formData[field.field] = field.defaultValue !== undefined ? field.defaultValue : null
        })
    }

    const openAdd = () => {
        formMode.value = 'add'
        resetForm()
        formVisible.value = true
    }

    const openEdit = (item: any) => {
        formMode.value = 'edit'
        resetForm()
        config.formFields.forEach(field => {
            formData[field.field] = item[field.field] ?? null
        })
        formVisible.value = true
    }

    const save = async () => {
        formLoading.value = true
        try {
            let res
            if (isAdd.value) {
                res = await $api.post(config.endpoint, formData)
            } else {
                const id = formData[config.primaryKey]
                res = await $api.put(`${config.endpoint}/${id}`, formData)
            }

            if (res.data.success) {
                toast.add({
                    severity: 'success',
                    summary: 'Berhasil',
                    detail: `Data ${config.title} berhasil ${isAdd.value ? 'disimpan' : 'diupdate'}`,
                    life: 3000
                })
                formVisible.value = false
                fetchData()
            }
        } catch (error: any) {
            toast.add({
                severity: 'error',
                summary: 'Gagal',
                detail: error.response?.data?.message || 'Gagal menyimpan data',
                life: 3000
            })
        } finally {
            formLoading.value = false
        }
    }

    const handleDelete = async () => {
        if (!deleteItem.value) return
        deleteLoading.value = true
        try {
            const id = deleteItem.value[config.primaryKey]
            const res = await $api.delete(`${config.endpoint}/${id}`)
            if (res.data.success) {
                toast.add({
                    severity: 'success',
                    summary: 'Berhasil',
                    detail: 'Data berhasil dihapus',
                    life: 3000
                })
                deleteVisible.value = false
                fetchData()
            }
        } catch (error: any) {
            toast.add({
                severity: 'error',
                summary: 'Gagal',
                detail: error.response?.data?.message || 'Gagal menghapus data',
                life: 3000
            })
        } finally {
            deleteLoading.value = false
        }
    }

    /** Helper to format currency */
    const formatCurrency = (value: number) => {
        if (!value && value !== 0) return '-'
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value)
    }

    /** Helper to format date */
    const formatDate = (value: string) => {
        if (!value) return '-'
        return new Date(value).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
    }

    // Initialize
    initFilters()
    fetchFilterOptions()
    fetchData()

    return {
        items,
        selectedItems,
        loading,
        pagination,
        searchKeyword,
        tableFilters,
        dynamicFilterOptions,
        allDistinctValues,
        sortField,
        sortOrder,
        deleteVisible,
        deleteItem,
        deleteLoading,
        fetchData,
        fetchFilterOptions,
        fetchAllDistinctValues,
        handleDelete,
        formatCurrency,
        formatDate
        // ❌ HAPUS: formVisible, formMode, formData, formLoading, isAdd, isEdit, dialogTitle, openAdd, openEdit, save, resetForm
    }
}