// config/master/barang.ts
import type { ColumnConfig, FormFieldConfig, MasterConfig } from '~/composables/useMasterCrud'

export const barangColumns: ColumnConfig[] = [
    {
        field: 'Kode',
        header: 'Kode',
        sortable: true,
        minWidth: '120px'
        // ✅ Sekarang otomatis jadi multi-select (fetch dari API distinct)
    },
    {
        field: 'Nama',
        header: 'Nama Barang',
        sortable: true,
        minWidth: '200px'
        // ✅ Otomatis multi-select
    },
    {
        field: 'Satuan',
        header: 'Satuan',
        sortable: true,
        minWidth: '80px',
        filterOptionsFrom: 'Satuan',  // ✅ Dari API filter-options
        align: 'center'
    },
    {
        field: 'Kategori',
        header: 'Kategori',
        sortable: true,
        minWidth: '120px',
        filterOptionsFrom: 'Kategori'  // ✅ Dari API filter-options
    },
    {
        field: 'Tipe',
        header: 'Tipe',
        sortable: true,
        minWidth: '120px',
        filterOptionsFrom: 'Tipe'  // ✅ Dari API filter-options
    },
    {
        field: 'HargaJual',
        header: 'Harga Jual',
        type: 'currency',
        sortable: true,
        minWidth: '140px',
        align: 'right'
        // ✅ Otomatis multi-select (fetch dari API distinct)
    },
    {
        field: 'Stok',
        header: 'Stok',
        type: 'number',
        sortable: true,
        minWidth: '80px',
        align: 'center'
        // ✅ Otomatis multi-select
    },
    {
        field: 'Merk',
        header: 'Merk',
        sortable: true,
        minWidth: '120px',
        filterOptionsFrom: 'Merk'  // ✅ Dari API filter-options
    },
    {
        field: 'Product_Focus',
        header: 'Focus',
        type: 'boolean',
        sortable: true,
        minWidth: '80px',
        align: 'center',
        filterOptionsFrom: 'Product_Focus',  // ✅ Dari API filter-options
        booleanLabels: { true: 'Ya', false: 'Tidak' },
        booleanSeverity: { true: 'success', false: 'secondary' }
    }
]

export const barangFormFields: FormFieldConfig[] = [
    {
        field: 'Kode',
        label: 'Kode Barang',
        type: 'text',
        required: true,
        placeholder: 'Masukkan kode unik'
    },
    {
        field: 'Nama',
        label: 'Nama Barang',
        type: 'text',
        required: true,
        placeholder: 'Masukkan nama barang'
    },
    {
        field: 'Satuan',
        label: 'Satuan',
        type: 'text',
        required: true,
        placeholder: 'Contoh: PCS, UNIT, BOX'
    },
    {
        field: 'Kategori',
        label: 'Kategori',
        type: 'text',
        placeholder: 'Kategori barang'
    },
    {
        field: 'Tipe',
        label: 'Tipe',
        type: 'text',
        placeholder: 'Tipe barang'
    },
    {
        field: 'HargaJual',
        label: 'Harga Jual',
        type: 'currency',
        placeholder: '0'
    },
    {
        field: 'Min',
        label: 'Minimum Stok',
        type: 'number',
        placeholder: '0',
        helpText: 'Peringatan jika stok di bawah nilai ini'
    },
    {
        field: 'Merk',
        label: 'Merk',
        type: 'text',
        placeholder: 'Merk barang'
    },
    {
        field: 'Product_Focus',
        label: 'Produk Fokus?',
        type: 'boolean',
        defaultValue: false
    }
]

export const barangMasterConfig: MasterConfig = {
    title: 'Master Barang',
    subtitle: 'Kelola data barang, stok, dan harga',
    icon: 'pi-box',
    endpoint: '/v1/barang',
    primaryKey: 'Kode',
    filterOptionsEndpoint: '/v1/barang/filter-options',
    formRoute: '/master/barang/form',
    columns: barangColumns,
    formFields: barangFormFields,
    expansion: {
        enabled: true,
        endpoint: '/v1/barang/{id}/detail-stok',
        title: 'Detail Stok',
        columns: [
            { field: 'KD_Gudang', header: 'Kode Gudang', width: '120px' },
            { field: 'Gudang', header: 'Nama Gudang', minWidth: '200px' },
            { field: 'Expired', header: 'Expired', width: '150px' },
            { field: 'Stok', header: 'Stok', width: '120px', align: 'right', type: 'number' }
        ]
    }
}