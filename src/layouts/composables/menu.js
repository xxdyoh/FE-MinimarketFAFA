import { ref } from 'vue';

const model = ref([
    // {
    //     label: 'Home',
    //     items: [{ label: 'Dashboard', icon: 'pi pi-fw pi-home', to: '/' }]
    // },
    // {
    //     label: 'Master',
    //     icon: 'pi pi-database',
    //     items: [
    //         {
    //             label: 'Barang',
    //             icon: 'pi pi-box',
    //             to: '/master/barang'
    //         }
    //         // {
    //         //     label: 'Customer',
    //         //     icon: 'pi pi-users',
    //         //     to: '/master/customer'
    //         // },
    //         // {
    //         //     label: 'Group',
    //         //     icon: 'pi pi-tags',
    //         //     to: '/master/group'
    //         // }
    //     ]
    // },
    // {
    //     label: 'Persediaan',
    //     icon: 'pi pi-database',
    //     items: [
    //         { label: 'Barang', icon: 'pi pi-box', to: '/master/barang' },
    //         // { label: 'Customer', icon: 'pi pi-users', to: '/master/customer' },
    //         // { label: 'Test Laporan', icon: 'pi pi-chart-bar', to: '/master/laporan-test' }  // ✅ TEST
    //     ]
    // },
    {
        label: 'Laporan',
        icon: 'pi pi-chart-bar',
        items: [
            {
                label: 'Laporan Persediaan',
                icon: 'pi pi-box',
                to: '/laporan/persediaan'
            },
            {
                label: 'Member',
                icon: 'pi pi-users',
                to: '/laporan/member'
            },
            {
                label: 'Lap Pembelian by Nota',
                icon: 'pi pi-shopping-cart',
                to: '/laporan/pembelian'
            },
            { label: 'Lap Pembelian Per Item', icon: 'pi pi-list', to: '/laporan/pembelian-per-item' },
            { label: 'Lap Penjualan by Nota', icon: 'pi pi-shopping-bag', to: '/laporan/penjualan' },
            { label: 'Lap Penjualan Per Item', icon: 'pi pi-list', to: '/laporan/penjualan-per-item' },
            { label: 'Kartu Stock', icon: 'pi pi-chart-line', to: '/laporan/kartu-stock' },
            {
                label: 'Koreksi Stok',
                icon: 'pi pi-wrench',
                to: '/laporan/koreksi-stok'
            },
        ]
    },
    {
        label: 'POS(Kasir)',
        items: [{ label: 'POS', icon: 'pi pi-fw pi-home', to: '/pos' }]
    },
    // {
    //     label: 'Komisi',
    //     items: [
    //         {
    //             label: 'Salesman',
    //             icon: 'pi pi-fw pi-user',
    //             items: [
    //                 {
    //                     label: 'Setting Komisi',
    //                     icon: 'pi pi-fw pi-hashtag',
    //                     to: '/komisi/salesman/setting'
    //                 },
    //                 {
    //                     label: 'Komisi Salesman',
    //                     icon: 'pi pi-fw pi-dollar',
    //                     to: '/komisi/salesman/hitung'
    //                 }
    //             ]
    //         }
    //     ]
    // },
    // {
    //     label: 'UI Components',
    //     items: [
    //         { label: 'Form Layout', icon: 'pi pi-fw pi-id-card', to: '/uikit/formlayout' },
    //         { label: 'Input', icon: 'pi pi-fw pi-check-square', to: '/uikit/input' },
    //         { label: 'Button', icon: 'pi pi-fw pi-mobile', to: '/uikit/button', class: 'rotated-icon' },
    //         { label: 'Table', icon: 'pi pi-fw pi-table', to: '/uikit/table' },
    //         { label: 'List', icon: 'pi pi-fw pi-list', to: '/uikit/list' },
    //         { label: 'Tree', icon: 'pi pi-fw pi-share-alt', to: '/uikit/tree' },
    //         { label: 'Panel', icon: 'pi pi-fw pi-tablet', to: '/uikit/panel' },
    //         { label: 'Overlay', icon: 'pi pi-fw pi-clone', to: '/uikit/overlay' },
    //         { label: 'Media', icon: 'pi pi-fw pi-image', to: '/uikit/media' },
    //         { label: 'Menu', icon: 'pi pi-fw pi-bars', to: '/uikit/menu' },
    //         { label: 'Message', icon: 'pi pi-fw pi-comment', to: '/uikit/message' },
    //         { label: 'File', icon: 'pi pi-fw pi-file', to: '/uikit/file' },
    //         { label: 'Chart', icon: 'pi pi-fw pi-chart-bar', to: '/uikit/charts' },
    //         { label: 'Timeline', icon: 'pi pi-fw pi-calendar', to: '/uikit/timeline' },
    //         { label: 'Misc', icon: 'pi pi-fw pi-circle', to: '/uikit/misc' }
    //     ]
    // },
    // {
    //     label: 'Pages',
    //     icon: 'pi pi-fw pi-briefcase',
    //     to: '/pages',
    //     items: [
    //         {
    //             label: 'Landing',
    //             icon: 'pi pi-fw pi-globe',
    //             to: '/landing'
    //         },
    //         {
    //             label: 'Auth',
    //             icon: 'pi pi-fw pi-user',
    //             items: [
    //                 {
    //                     label: 'Login',
    //                     icon: 'pi pi-fw pi-sign-in',
    //                     to: '/auth/login'
    //                 },
    //                 {
    //                     label: 'Error',
    //                     icon: 'pi pi-fw pi-times-circle',
    //                     to: '/auth/error'
    //                 },
    //                 {
    //                     label: 'Access Denied',
    //                     icon: 'pi pi-fw pi-lock',
    //                     to: '/auth/access'
    //                 }
    //             ]
    //         },
    //         {
    //             label: 'Crud',
    //             icon: 'pi pi-fw pi-pencil',
    //             to: '/crud'
    //         },
    //         {
    //             label: 'Not Found',
    //             icon: 'pi pi-fw pi-exclamation-circle',
    //             to: '/notfound'
    //         },
    //         {
    //             label: 'Empty',
    //             icon: 'pi pi-fw pi-circle-off',
    //             to: '/empty'
    //         }
    //     ]
    // },
    // {
    //     label: 'Hierarchy',
    //     items: [
    //         {
    //             label: 'Submenu 1',
    //             icon: 'pi pi-fw pi-bookmark',
    //             items: [
    //                 {
    //                     label: 'Submenu 1.1',
    //                     icon: 'pi pi-fw pi-bookmark',
    //                     items: [
    //                         { label: 'Submenu 1.1.1', icon: 'pi pi-fw pi-bookmark' },
    //                         { label: 'Submenu 1.1.2', icon: 'pi pi-fw pi-bookmark' },
    //                         { label: 'Submenu 1.1.3', icon: 'pi pi-fw pi-bookmark' }
    //                     ]
    //                 },
    //                 {
    //                     label: 'Submenu 1.2',
    //                     icon: 'pi pi-fw pi-bookmark',
    //                     items: [{ label: 'Submenu 1.2.1', icon: 'pi pi-fw pi-bookmark' }]
    //                 }
    //             ]
    //         },
    //         {
    //             label: 'Submenu 2',
    //             icon: 'pi pi-fw pi-bookmark',
    //             items: [
    //                 {
    //                     label: 'Submenu 2.1',
    //                     icon: 'pi pi-fw pi-bookmark',
    //                     items: [
    //                         { label: 'Submenu 2.1.1', icon: 'pi pi-fw pi-bookmark' },
    //                         { label: 'Submenu 2.1.2', icon: 'pi pi-fw pi-bookmark' }
    //                     ]
    //                 },
    //                 {
    //                     label: 'Submenu 2.2',
    //                     icon: 'pi pi-fw pi-bookmark',
    //                     items: [{ label: 'Submenu 2.2.1', icon: 'pi pi-fw pi-bookmark' }]
    //                 }
    //             ]
    //         }
    //     ]
    // },
    // {
    //     label: 'Get Started',
    //     items: [
    //         {
    //             label: 'Documentation',
    //             icon: 'pi pi-fw pi-book',
    //             to: '/documentation'
    //         },
    //         {
    //             label: 'View Source',
    //             icon: 'pi pi-fw pi-github',
    //             url: 'https://github.com/suprimpoudel/sakai-nuxt',
    //             target: '_blank'
    //         }
    //     ]
    // }
]);

export function useMenu() {
    return { model };
}