<template>
    <div class="pos-page" @keydown="handleKeyDown">
        <!-- Header -->
        <div class="pos-header">
            <div class="header-left">
                <Button icon="pi pi-arrow-left" text rounded size="large" @click="goBack" />
                <div class="header-icon">
                    <i class="pi pi-shopping-cart"></i>
                </div>
                <div class="header-text">
                    <h1>POS (Kasir)</h1>
                    <p>{{ today }}</p>
                </div>
            </div>
            <div class="header-actions">
    <Button 
        :icon="isFullscreen ? 'pi pi-compress' : 'pi pi-expand'" 
        text rounded size="small"
        @click="toggleFullscreen"
        v-tooltip="isFullscreen ? 'Keluar Fullscreen' : 'Fullscreen (F11)'"
    />
    <Button label="Tahan Transaksi" icon="pi pi-pause" severity="secondary" size="small" />
    <Button label="Hapus" icon="pi pi-trash" severity="danger" text size="small" @click="clearCart" />
</div>
        </div>

        <div class="pos-content">
            <!-- LEFT SIDE: Scan & Cart -->
            <div class="pos-left">
                <!-- Scan Barcode -->
                <div class="scan-section">
                    <div class="scan-input-wrapper">
                        <i class="pi pi-barcode scan-icon"></i>
                        <InputText 
                            ref="scanInputRef"
                            v-model="scanBarcode"
                            placeholder="Scan barcode atau ketik F2 untuk cari barang..."
                            class="scan-input"
                            @keydown.enter="processBarcode"
                            @keydown.f2.prevent="openProductModal"
                            autofocus
                        />
                        <kbd class="scan-hint">F2</kbd>
                    </div>
                </div>

                <!-- Cart Grid -->
                <div class="cart-section">
                    <DataTable 
                        :value="cartItems"
                        class="cart-table"
                        stripedRows size="small"
                        scrollable scrollHeight="calc(100vh - 320px)"
                    >
                        <template #empty>
                            <div class="cart-empty">
                                <i class="pi pi-shopping-cart"></i>
                                <p>Belum ada item. Scan barcode atau tekan F2 untuk cari barang.</p>
                            </div>
                        </template>

                        <Column header="#" style="width: 40px; text-align: center">
                            <template #body="{ index }">{{ index + 1 }}</template>
                        </Column>
                        <Column field="Kode" header="SKU" style="width: 100px" />
                        <Column field="Nama" header="Nama Barang" style="min-width: 180px" />
                        <Column field="Qty" header="Qty" style="width: 80px; text-align: center">
                            <template #body="{ data, index }">
                                <InputNumber 
                                    v-model="cartItems[index].Qty" 
                                    :min="1" 
                                    size="small" 
                                    class="qty-input"
                                    @update:modelValue="recalculate"
                                    :showButtons="true"
                                    buttonLayout="horizontal"
                                />
                            </template>
                        </Column>
                        <Column field="Harga" header="Harga" style="width: 120px; text-align: right">
                            <template #body="{ data }">{{ formatCurrency(data.Harga) }}</template>
                        </Column>
                        <Column field="Disc" header="Disc%" style="width: 70px; text-align: center">
                            <template #body="{ data, index }">
                                <InputNumber 
                                    v-model="cartItems[index].Disc" 
                                    :min="0" :max="99" 
                                    size="small" 
                                    class="disc-input"
                                    @update:modelValue="recalculate"
                                />
                            </template>
                        </Column>
                        <Column field="Total" header="Total" style="width: 130px; text-align: right">
                            <template #body="{ data }">
                                <span class="font-bold text-primary-600">{{ formatCurrency(data.Total) }}</span>
                            </template>
                        </Column>
                        <Column header="Aksi" style="width: 50px; text-align: center">
                            <template #body="{ index }">
                                <Button icon="pi pi-times" text rounded size="small" severity="danger" @click="removeItem(index)" />
                            </template>
                        </Column>
                    </DataTable>
                </div>
            </div>

            <!-- RIGHT SIDE: Customer & Summary -->
            <div class="pos-right">
                <!-- Customer -->
                <div class="customer-section">
                    <label class="section-label">Customer</label>
                    <div class="customer-input-row">
                        <InputText 
                            v-model="customerKode" 
                            placeholder="Kode customer (F2 cari)" 
                            class="customer-kode"
                            @keydown.f2.prevent="openCustomerModal"
                            readonly
                        />
                        <Button icon="pi pi-search" size="small" @click="openCustomerModal" />
                    </div>
                    <div class="customer-name" v-if="customerNama">
                        <i class="pi pi-user"></i>
                        <span>{{ customerNama }}</span>
                    </div>
                </div>

                <!-- Summary -->
                <div class="summary-section">
                    <div class="summary-row">
                        <span>Subtotal</span>
                        <span>{{ formatCurrency(subtotal) }}</span>
                    </div>
                    <div class="summary-row">
                        <span>Diskon (F3)</span>
                        <span>-{{ formatCurrency(totalDisc) }}</span>
                    </div>
                    <div class="summary-row summary-total">
                        <span>Grand Total</span>
                        <span>{{ formatCurrency(grandTotal) }}</span>
                    </div>
                </div>

                <!-- Payment Buttons -->
                <div class="payment-section">
                    <div class="payment-methods">
                        <Button label="TUNAI (F4)" icon="pi pi-money-bill" severity="success" size="large" class="payment-btn cash-btn" @click="processPayment('cash')" />
                        <Button label="CARD (F5)" icon="pi pi-credit-card" severity="info" size="large" class="payment-btn" @click="processPayment('card')" />
                    </div>
                    <div class="payment-methods">
                        <Button label="PIUTANG (F6)" icon="pi pi-book" severity="warning" size="large" class="payment-btn" @click="processPayment('piutang')" />
                        <Button label="VOUCHER (F7)" icon="pi pi-ticket" severity="secondary" size="large" class="payment-btn" @click="processPayment('voucher')" />
                    </div>
                </div>
            </div>
        </div>

        <!-- Product Search Modal -->
        <Dialog v-model:visible="productModal" header="Cari Barang" :modal="true" :style="{ width: '800px' }" @keydown.esc="productModal = false">
            <div class="modal-search">
                <IconField iconPosition="left">
                    <InputIcon class="pi pi-search" />
                    <InputText v-model="productSearch" placeholder="Cari kode, nama, atau barcode..." class="w-full" @keydown.enter="searchProduct" autofocus />
                </IconField>
            </div>
            <DataTable 
                :value="productList" 
                :loading="productLoading"
                class="modal-table"
                stripedRows size="small"
                @row-dblclick="selectProduct"
                selectionMode="single"
                paginator :rows="10"
            >
                <Column field="Kode" header="Kode" style="width: 100px" />
                <Column field="Barcode" header="Barcode" style="width: 120px" />
                <Column field="Nama" header="Nama Barang" style="min-width: 180px" />
                <Column field="Stok" header="Stok" style="width: 70px; text-align: center" />
                <Column field="Harga_Pcs" header="Harga Pcs" style="width: 110px; text-align: right">
                    <template #body="{ data }">{{ formatCurrency(data.Harga_Pcs) }}</template>
                </Column>
                <Column field="Harga_Slv" header="Harga Slv" style="width: 110px; text-align: right">
                    <template #body="{ data }">{{ formatCurrency(data.Harga_Slv) }}</template>
                </Column>
                <Column field="Harga_Crt" header="Harga Crt" style="width: 110px; text-align: right">
                    <template #body="{ data }">{{ formatCurrency(data.Harga_Crt) }}</template>
                </Column>
            </DataTable>
            <p class="modal-hint">Double-click untuk memilih | ESC untuk tutup</p>
        </Dialog>

        <!-- Customer Search Modal -->
        <Dialog v-model:visible="customerModal" header="Cari Customer" :modal="true" :style="{ width: '700px' }" @keydown.esc="customerModal = false">
            <div class="modal-search">
                <IconField iconPosition="left">
                    <InputIcon class="pi pi-search" />
                    <InputText v-model="customerSearch" placeholder="Cari kode atau nama customer..." class="w-full" @keydown.enter="searchCustomer" autofocus />
                </IconField>
            </div>
            <DataTable 
                :value="customerList" 
                :loading="customerLoading"
                class="modal-table"
                stripedRows size="small"
                @row-dblclick="selectCustomer"
                selectionMode="single"
                paginator :rows="10"
            >
                <Column field="Kode" header="Kode" style="width: 100px" />
                <Column field="Nama" header="Nama" style="min-width: 180px" />
                <Column field="Alamat" header="Alamat" style="min-width: 200px" />
                <Column field="Kota" header="Kota" style="width: 100px" />
                <Column field="Telp" header="Telp" style="width: 120px" />
            </DataTable>
            <p class="modal-hint">Double-click untuk memilih | ESC untuk tutup</p>
        </Dialog>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { useToast } from 'primevue/usetoast'

definePageMeta({ layout: 'default' })

const { $api } = useNuxtApp()
const toast = useToast()
const router = useRouter()

// Refs
const scanInputRef = ref<any>(null)

// State
const scanBarcode = ref('')
const customerKode = ref('')
const customerNama = ref('')
const productModal = ref(false)
const customerModal = ref(false)
const productSearch = ref('')
const customerSearch = ref('')
const productList = ref<any[]>([])
const customerList = ref<any[]>([])
const productLoading = ref(false)
const customerLoading = ref(false)

// Cart
interface CartItem {
    Kode: string
    Nama: string
    Qty: number
    Harga: number
    Disc: number
    Total: number
}

const cartItems = ref<CartItem[]>([])

const today = computed(() => new Date().toLocaleDateString('id-ID', { 
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
}))

const subtotal = computed(() => cartItems.value.reduce((s, item) => s + item.Harga * item.Qty, 0))
const totalDisc = computed(() => cartItems.value.reduce((s, item) => s + (item.Harga * item.Qty * item.Disc / 100), 0))
const grandTotal = computed(() => subtotal.value - totalDisc.value)

const formatCurrency = (val: any) => {
    if (!val && val !== 0) return '-'
    return 'Rp ' + Math.round(parseFloat(val)).toLocaleString('id-ID')
}

// 🔥 PROCESS BARCODE
const processBarcode = async () => {
    const code = scanBarcode.value.trim()
    if (!code) return
    
    try {
        // Cari barang by barcode atau kode
        const res = await $api.get('/barang/search', { params: { q: code } })
        if (res.data.success && res.data.data) {
            const item = res.data.data
            addToCart(item)
            scanBarcode.value = ''
            nextTick(() => scanInputRef.value?.$el?.focus())
        } else {
            toast.add({ severity: 'warn', summary: 'Tidak Ditemukan', detail: 'Barang tidak ditemukan', life: 2000 })
        }
    } catch (e) {
        console.error(e)
    }
}

// 🔥 ADD TO CART
const addToCart = (item: any) => {
    const existing = cartItems.value.find(c => c.Kode === item.Kode)
    if (existing) {
        existing.Qty++
        existing.Total = existing.Qty * existing.Harga * (100 - existing.Disc) / 100
    } else {
        cartItems.value.push({
            Kode: item.Kode,
            Nama: item.Nama || item.brg_nama_singkat,
            Qty: 1,
            Harga: item.Harga_Pcs || item.brg_hrgjualpcs || 0,
            Disc: 0,
            Total: item.Harga_Pcs || item.brg_hrgjualpcs || 0
        })
    }
}

const removeItem = (index: number) => cartItems.value.splice(index, 1)
const recalculate = () => {
    cartItems.value.forEach(item => {
        item.Total = item.Qty * item.Harga * (100 - item.Disc) / 100
    })
}
const clearCart = () => { cartItems.value = []; customerKode.value = ''; customerNama.value = '' }

// 🔥 PRODUCT MODAL
const openProductModal = () => { productModal.value = true; searchProduct() }
const searchProduct = async () => {
    productLoading.value = true
    try {
        const res = await $api.get('/barang/search-all', { params: { q: productSearch.value } })
        if (res.data.success) productList.value = res.data.data
    } catch (e) { console.error(e) } finally { productLoading.value = false }
}
const selectProduct = (event: any) => {
    if (event.data) {
        addToCart(event.data)
        productModal.value = false
        nextTick(() => scanInputRef.value?.$el?.focus())
    }
}

// 🔥 CUSTOMER MODAL
const openCustomerModal = () => { customerModal.value = true; searchCustomer() }
const searchCustomer = async () => {
    customerLoading.value = true
    try {
        const res = await $api.get('/customer/search', { params: { q: customerSearch.value } })
        if (res.data.success) customerList.value = res.data.data
    } catch (e) { console.error(e) } finally { customerLoading.value = false }
}
const selectCustomer = (event: any) => {
    if (event.data) {
        customerKode.value = event.data.Kode
        customerNama.value = event.data.Nama
        customerModal.value = false
    }
}

// 🔥 PAYMENT
const processPayment = (method: string) => {
    if (cartItems.value.length === 0) {
        toast.add({ severity: 'warn', summary: 'Keranjang Kosong', detail: 'Tambahkan barang terlebih dahulu', life: 2000 })
        return
    }
    toast.add({ severity: 'success', summary: 'Pembayaran', detail: `Metode: ${method.toUpperCase()} - Total: ${formatCurrency(grandTotal.value)}`, life: 3000 })
    // TODO: Proses simpan transaksi
}

// 🔥 KEYBOARD SHORTCUTS
const handleKeyDown = (e: KeyboardEvent) => {
    // F11 = Toggle fullscreen
    if (e.key === 'F11') {
        e.preventDefault()
        toggleFullscreen()
        return
    }
    
    if (productModal.value || customerModal.value) return
    
    if (e.key === 'F2') { e.preventDefault(); openProductModal() }
    if (e.key === 'F4') { e.preventDefault(); processPayment('cash') }
    if (e.key === 'F5') { e.preventDefault(); processPayment('card') }
    if (e.key === 'F6') { e.preventDefault(); processPayment('piutang') }
    if (e.key === 'F7') { e.preventDefault(); processPayment('voucher') }
    if (e.key === 'Escape') { 
        e.preventDefault()
        if (isFullscreen.value) {
            exitFullscreen()
        } else {
            clearCart()
        }
    }
}

const goBack = () => {
    exitFullscreen()
    router.push('/dashboard')
}
// 🔥 FULL SCREEN
const isFullscreen = ref(false)

const enterFullscreen = async () => {
    try {
        const elem = document.documentElement
        if (elem.requestFullscreen) {
            await elem.requestFullscreen()
        } else if ((elem as any).webkitRequestFullscreen) {
            await (elem as any).webkitRequestFullscreen()
        } else if ((elem as any).msRequestFullscreen) {
            await (elem as any).msRequestFullscreen()
        }
        isFullscreen.value = true
    } catch (e) {
        console.error('Fullscreen failed:', e)
    }
}

const exitFullscreen = async () => {
    try {
        if (document.fullscreenElement) {
            await document.exitFullscreen()
        } else if ((document as any).webkitFullscreenElement) {
            await (document as any).webkitExitFullscreen()
        }
        isFullscreen.value = false
    } catch (e) {
        console.error('Exit fullscreen failed:', e)
    }
}

const toggleFullscreen = () => {
    if (isFullscreen.value) {
        exitFullscreen()
    } else {
        enterFullscreen()
    }
}

onMounted(() => {
    nextTick(() => {
        scanInputRef.value?.$el?.focus()
        enterFullscreen() // ✅ Auto fullscreen
    })
})

// 🔥 Exit fullscreen saat leave
onUnmounted(() => {
    exitFullscreen()
})

// 🔥 Listen for fullscreen change (user tekan ESC manual)
onMounted(() => {
    const onFullscreenChange = () => {
        isFullscreen.value = !!document.fullscreenElement
    }
    document.addEventListener('fullscreenchange', onFullscreenChange)
    document.addEventListener('webkitfullscreenchange', onFullscreenChange)
    
    // Cleanup
    onUnmounted(() => {
        document.removeEventListener('fullscreenchange', onFullscreenChange)
        document.removeEventListener('webkitfullscreenchange', onFullscreenChange)
    })
})

</script>

<style lang="scss" scoped>
.pos-page {
    height: 100vh;
    width: 100vw;
    display: flex;
    flex-direction: column;
    background: #f8fafc;
    overflow: hidden;
}

// Header
.pos-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem 1.5rem;
    background: white;
    border-bottom: 1px solid #e2e8f0;
    .header-left { display: flex; align-items: center; gap: 1rem; }
    .header-icon { width: 2.5rem; height: 2.5rem; background: #ecfdf5; border-radius: 0.625rem; display: flex; align-items: center; justify-content: center; color: #10b981; font-size: 1.25rem; }
    h1 { font-size: 1.25rem; font-weight: 700; color: #0f172a; margin: 0; }
    p { font-size: 0.75rem; color: #64748b; margin: 0; }
}

// Content
.pos-content {
    display: flex;
    flex: 1;
    overflow: hidden;
}

// Left Side
.pos-left {
    flex: 1;
    display: flex;
    flex-direction: column;
    border-right: 1px solid #e2e8f0;
}

.scan-section {
    padding: 1rem;
    background: white;
    border-bottom: 1px solid #e2e8f0;
    .scan-input-wrapper {
        position: relative;
        display: flex;
        align-items: center;
        .scan-icon { position: absolute; left: 1rem; color: #94a3b8; font-size: 1.25rem; z-index: 1; }
        .scan-input {
            width: 100%;
            height: 3rem;
            font-size: 1.1rem;
            padding-left: 2.75rem !important;
            padding-right: 4rem !important;
            border: 2px solid #e2e8f0;
            border-radius: 0.75rem;
            &:focus { border-color: #10b981; box-shadow: 0 0 0 3px rgba(16,185,129,0.1); }
        }
        .scan-hint {
            position: absolute;
            right: 1rem;
            padding: 0.2rem 0.5rem;
            background: #f1f5f9;
            border-radius: 0.375rem;
            font-size: 0.7rem;
            color: #64748b;
        }
    }
}

.cart-section {
    flex: 1;
    overflow: hidden;
    background: white;
}

.cart-table {
    :deep(.p-datatable-thead > tr > th) { background: #f8fafc; font-size: 0.7rem; font-weight: 700; text-transform: uppercase; padding: 0.5rem 0.75rem; }
    :deep(.p-datatable-tbody > tr > td) { padding: 0.4rem 0.75rem; font-size: 0.85rem; }
    .qty-input, .disc-input { :deep(.p-inputnumber-input) { width: 60px; text-align: center; } }
}

.cart-empty { display: flex; flex-direction: column; align-items: center; padding: 3rem; color: #94a3b8; i { font-size: 3rem; margin-bottom: 0.75rem; } }

// Right Side
.pos-right {
    width: 350px;
    display: flex;
    flex-direction: column;
    padding: 1rem;
    gap: 1rem;
    background: white;
}

.customer-section {
    .section-label { font-size: 0.75rem; font-weight: 700; text-transform: uppercase; color: #64748b; margin-bottom: 0.5rem; display: block; }
    .customer-input-row { display: flex; gap: 0.5rem; }
    .customer-kode { flex: 1; }
    .customer-name { display: flex; align-items: center; gap: 0.5rem; margin-top: 0.5rem; padding: 0.5rem; background: #ecfdf5; border-radius: 0.5rem; font-size: 0.85rem; color: #065f46; i { color: #10b981; } }
}

.summary-section {
    padding: 1rem;
    background: #f8fafc;
    border-radius: 0.75rem;
    .summary-row { display: flex; justify-content: space-between; padding: 0.5rem 0; font-size: 0.9rem; }
    .summary-total { border-top: 2px solid #e2e8f0; padding-top: 0.75rem; font-size: 1.1rem; font-weight: 700; color: #0f172a; }
}

.payment-section {
    margin-top: auto;
    .payment-methods { display: flex; gap: 0.5rem; margin-bottom: 0.5rem; }
    .payment-btn { flex: 1; height: 3.5rem; font-size: 1rem; font-weight: 700; }
    .cash-btn { background: #10b981 !important; border-color: #059669 !important; }
}

// Modal
.modal-search { padding: 0.5rem 0 1rem 0; }
.modal-table {
    :deep(.p-datatable-tbody > tr) { cursor: pointer; &:hover { background: #ecfdf5; } }
}
.modal-hint { font-size: 0.75rem; color: #94a3b8; text-align: center; margin-top: 0.5rem; }

// Full screen override
// :global(.layout-main-container) { padding: 0 !important; }
</style>