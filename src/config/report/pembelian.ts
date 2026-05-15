import type { ReportConfig } from '~/components/report/ReportTemplate.vue'

export const pembelianReportConfig: ReportConfig = {
    title: 'Laporan Pembelian By Nota',
    subtitle: 'Laporan pembelian dengan detail per nota',
    icon: 'pi-shopping-cart',
    endpoint: '/v1/report/pembelian',
    masterKey: 'Nomor',
    masterColumns: [
        { field: 'Nomor', header: 'Nomor', width: '120px' },
        { field: 'Tanggal', header: 'Tanggal', width: '100px' },
        { field: 'Supplier', header: 'Supplier', minWidth: '200px' },
        { field: 'Total', header: 'Total', width: '150px', align: 'right', type: 'currency' },
        { field: 'Retur', header: 'Retur', width: '120px', align: 'right', type: 'currency' },
        { field: 'Bayar', header: 'Bayar', width: '120px', align: 'right', type: 'currency' },
        { field: 'Status_Bayar', header: 'Status', width: '100px', align: 'center' },
    ],
    summaryColumns: [
        { field: 'Total', type: 'sum', align: 'right' },
        { field: 'Retur', type: 'sum', align: 'right' },
        { field: 'Bayar', type: 'sum', align: 'right' },
    ],
    detailEndpoint: '/v1/report/pembelian/{id}/detail',
    detailColumns: [
        { field: 'Nomor', header: 'Nomor', width: '100px' },
        { field: 'Kode', header: 'Kode', width: '100px' },
        { field: 'Nama', header: 'Nama Barang', minWidth: '200px' },
        { field: 'Satuan', header: 'Satuan', width: '80px', align: 'center' },
        { field: 'Jumlah', header: 'Jumlah', width: '80px', align: 'center', type: 'number' },
        { field: 'Harga', header: 'Harga', width: '120px', align: 'right', type: 'currency' },
        { field: 'Disc', header: 'Disc', width: '70px', align: 'center', type: 'number' },
        { field: 'Nilai', header: 'Nilai', width: '150px', align: 'right', type: 'currency' },
    ]
}