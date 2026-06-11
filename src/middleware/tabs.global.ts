// middleware/tabs.global.ts
export default defineNuxtRouteMiddleware((to) => {
    const authPaths = ['/auth/login', '/auth/access', '/auth/error', '/landing']
    if (authPaths.includes(to.path)) {
        return
    }

    const tabsStore = useTabsStore()

    let title = 'Page'
    let icon = 'pi pi-file'
    let closable = true

    if (to.path.includes('/dashboard')) {
        title = 'Dashboard'
        icon = 'pi pi-home'
        closable = false
    } else if (to.path.includes('/master/barang')) {
        title = to.path.includes('/form') ? (to.query.id ? 'Edit Barang' : 'Tambah Barang') : 'Master Barang'
        icon = 'pi pi-box'
    } else if (to.path.includes('/master/customer')) {
        title = to.path.includes('/form') ? (to.query.id ? 'Edit Customer' : 'Tambah Customer') : 'Master Customer'
        icon = 'pi pi-users'
    } else if (to.path.includes('/penjualan/do')) {
        title = to.path.includes('/form') ? (to.query.id ? 'Edit DO' : 'Buat DO') : 'Delivery Order'
        icon = 'pi pi-truck'
    } else if (to.path.includes('/laporan/persediaan')) {
        title = 'Laporan Persediaan'
        icon = 'pi pi-box'
    } else if (to.path.includes('/laporan/pembelian')) {
        title = 'Laporan Pembelian'
        icon = 'pi pi-shopping-cart'
    } else if (to.path.includes('/laporan/penjualan')) {
        title = 'Laporan Penjualan'
        icon = 'pi pi-shopping-cart'
    } else if (to.path.includes('/laporan/penjualan-per-item')) {
        title = 'Laporan Penjualan Per Item'
        icon = 'pi pi-chart-bar'
    } else if (to.path.includes('/laporan/kartu-stock')) {
        title = 'Laporan Kartu Stock'
        icon = 'pi pi-chart-line'
    } else if (to.path.includes('/laporan/member')) {
        title = 'Member'
        icon = 'pi pi-users'
    } else if (to.path.includes('/laporan/koreksi-stok')) {
        title = 'Laporan Koreksi Stock'
        icon = 'pi pi-wrench'
    }

    tabsStore.openTab({
        title,
        path: to.path,
        query: to.query,
        icon,
        closable
    })
})