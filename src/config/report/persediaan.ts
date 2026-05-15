import type { ReportConfig } from '~/components/report/ReportTemplate.vue'

export const persediaanReportConfig: ReportConfig = {
    title: 'Laporan Persediaan Barang',
    subtitle: 'Stok barang per gudang dengan nilai inventori',
    icon: 'pi-box',
    endpoint: '/v1/report/persediaan',
    masterKey: 'Kode',
    masterColumns: [
        { field: 'Kode', header: 'Kode', width: '100px' },
        { field: 'Nama', header: 'Nama Barang', minWidth: '200px' },
        { field: 'Kategori', header: 'Kategori', width: '120px' },
        { field: 'Carton', header: 'Isi/Carton', width: '80px', align: 'center', type: 'number' },
        { field: 'Box_Rtg', header: 'Box/Rtg', width: '80px', align: 'center', type: 'number' },
        { field: 'Gudang', header: 'Gudang', width: '120px' },
        { field: 'Stok', header: 'Stok', width: '80px', align: 'right', type: 'number' },
        { field: 'HrgBeli', header: 'Hrg Beli', width: '120px', align: 'right', type: 'currency' },
        { field: 'Nilai', header: 'Nilai', width: '150px', align: 'right', type: 'currency' },
        { field: 'Produsen', header: 'Produsen', width: '150px' },
        { field: 'Min_Stok', header: 'Min Stok', width: '80px', align: 'center', type: 'number' },
    ],
    summaryColumns: [
        { field: 'Nilai', type: 'sum', align: 'right' },
    ]
}