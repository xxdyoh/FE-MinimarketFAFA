<template>
    <div class="pos-page" @keydown="handleKeyDown">
        <!-- Header -->
        <div class="pos-header">
            <div class="header-left">
                <Button icon="pi pi-arrow-left" text rounded size="large" @click="goBack" />
                <div class="header-icon"><i class="pi pi-shopping-cart"></i></div>
                <div class="header-text">
                    <h1>POS (Kasir)</h1>
                    <p>{{ today }}</p>
                </div>
            </div>
            <div class="header-actions">
                <Button icon="pi pi-plus" severity="success" text rounded size="large" @click="bukaPembayaran" v-tooltip="'Bayar (+)'" />
                <Button icon="pi pi-pause" text rounded size="small" @click="pendingTransaction" v-tooltip="'Pending (Ctrl+P)'" />
                <Button icon="pi pi-list" text rounded size="small" @click="openPendingList" v-tooltip="'Daftar Pending (Ctrl+S)'" />
                <Button icon="pi pi-trash" text rounded size="small" severity="danger" @click="clearCart" v-tooltip="'Hapus Keranjang (ESC)'" />
            </div>
        </div>

        <div class="pos-content">
            <!-- LEFT: Scan & Cart -->
            <div class="pos-left">
                <div class="scan-section">
                    <div class="scan-input-wrapper">
                        <i class="pi pi-barcode scan-icon"></i>
                        <InputText ref="scanInputRef" v-model="scanBarcode" placeholder="Scan barcode / F2 cari barang..." class="scan-input" @keydown.enter="processBarcode" @keydown.f2.prevent="openProductModal" autofocus />
                        <kbd class="scan-hint">F2</kbd>
                    </div>
                </div>

                <div class="cart-section">
                    <DataTable :value="cartItems" class="cart-table" stripedRows size="small" scrollable scrollHeight="flex">
                        <template #empty>
                            <div class="cart-empty"><i class="pi pi-shopping-cart"></i><p>Scan barcode atau tekan F2</p></div>
                        </template>
                        <Column header="#" style="width: 35px; text-align: center">
                            <template #body="{ index }">{{ index + 1 }}</template>
                        </Column>
                        <Column field="Kode" header="SKU" style="width: 80px" />
                        <Column field="Nama" header="Nama Barang" style="min-width: 160px" />
                        <Column field="Qty" header="Qty" style="width: 75px; text-align: center">
                            <template #body="{ data, index }">
                                <InputNumber v-model="cartItems[index].Qty" :min="1" size="small" class="qty-input" @update:modelValue="updateCartItem(index)" :showButtons="true" buttonLayout="horizontal" />
                            </template>
                        </Column>
                        <Column field="Satuan" header="Sat" style="width: 60px; text-align: center" />
                        <Column field="Harga" header="Harga" style="width: 110px; text-align: right">
                            <template #body="{ data }">{{ formatCurrency(data.Harga) }}</template>
                        </Column>
                        <Column field="DiscPr" header="Disc%" style="width: 65px; text-align: center">
                            <template #body="{ data, index }">
                                <InputNumber v-model="cartItems[index].DiscPr" :min="0" :max="99" size="small" class="disc-input" @update:modelValue="updateCartItem(index)" />
                            </template>
                        </Column>
                        <Column field="DiscRp" header="Disc Rp" style="width: 95px; text-align: right">
                            <template #body="{ data, index }">
                                <InputNumber v-model="cartItems[index].DiscRp" :min="0" size="small" class="disc-input" @update:modelValue="updateCartItem(index)" mode="currency" currency="IDR" locale="id-ID" />
                            </template>
                        </Column>
                        <Column field="IsiCarton" header="Ctn" style="width: 50px; text-align: center" />
                        <Column field="IsiLusin" header="Lsn" style="width: 50px; text-align: center" />
                        <Column field="Total" header="Total" style="width: 120px; text-align: right">
                            <template #body="{ data }"><span class="font-bold text-primary-600">{{ formatCurrency(data.Total) }}</span></template>
                        </Column>
                        <Column header="✕" style="width: 35px; text-align: center">
                            <template #body="{ index }"><Button icon="pi pi-times" text rounded size="small" severity="danger" @click="removeItem(index)" /></template>
                        </Column>
                    </DataTable>
                </div>
            </div>

            <!-- RIGHT: Customer & Summary -->
            <div class="pos-right">
                <div class="customer-section">
                    <label class="section-label">Customer</label>
                    <div class="customer-input-row">
                        <InputText v-model="customerKode" placeholder="Kode (F2 cari)" class="customer-kode" @keydown.f2.prevent="openCustomerModal" readonly />
                        <Button icon="pi pi-search" size="small" @click="openCustomerModal" />
                    </div>
                    <div class="customer-name" v-if="customerNama"><i class="pi pi-user"></i><span>{{ customerNama }}</span></div>
                </div>

                <div class="summary-section">
                    <div class="summary-row"><span>Subtotal</span><span>{{ formatCurrency(subtotal) }}</span></div>
                    <div class="summary-row"><span>Diskon</span><span>-{{ formatCurrency(totalDisc) }}</span></div>
                    <div class="summary-row summary-total"><span>Grand Total</span><span>{{ formatCurrency(grandTotal) }}</span></div>
                </div>
            </div>
        </div>

        <!-- Product Modal -->
        <Dialog v-model:visible="productModal" header="Cari Barang" :modal="true" :style="{ width: '800px' }">
            <div class="modal-search"><IconField iconPosition="left"><InputIcon class="pi pi-search" /><InputText v-model="productSearch" placeholder="Cari kode, nama, barcode..." class="w-full" @keydown.enter="searchProduct" autofocus /></IconField></div>
            <DataTable :value="productList" :loading="productLoading" class="modal-table" stripedRows size="small" @row-dblclick="selectProduct" paginator :rows="10">
                <Column field="Kode" header="Kode" style="width: 90px" />
                <Column field="Barcode" header="Barcode" style="width: 110px" />
                <Column field="Nama" header="Nama" style="min-width: 180px" />
                <Column field="Stok" header="Stok" style="width: 60px; text-align: center" />
                <Column field="Harga_Pcs" header="Harga" style="width: 110px; text-align: right"><template #body="{ data }">{{ formatCurrency(data.Harga_Pcs) }}</template></Column>
            </DataTable>
        </Dialog>

        <!-- Customer Modal -->
        <Dialog v-model:visible="customerModal" header="Cari Customer" :modal="true" :style="{ width: '600px' }">
            <div class="modal-search"><IconField iconPosition="left"><InputIcon class="pi pi-search" /><InputText v-model="customerSearch" placeholder="Cari kode/nama..." class="w-full" @keydown.enter="searchCustomer" autofocus /></IconField></div>
            <DataTable :value="customerList" :loading="customerLoading" class="modal-table" stripedRows size="small" @row-dblclick="selectCustomer" paginator :rows="10">
                <Column field="Kode" header="Kode" style="width: 90px" />
                <Column field="Nama" header="Nama" style="min-width: 180px" />
                <Column field="Alamat" header="Alamat" style="min-width: 180px" />
                <Column field="Telp" header="Telp" style="width: 110px" />
            </DataTable>
        </Dialog>

        <!-- Pending List Modal -->
        <Dialog v-model:visible="pendingModal" header="Daftar Pending" :modal="true" :style="{ width: '600px' }">
            <DataTable :value="pendingList" :loading="pendingLoading" class="modal-table" stripedRows size="small" @row-dblclick="loadPending" paginator :rows="10">
                <Column field="no" header="No" style="width: 60px" />
                <Column field="tanggal" header="Tanggal" style="width: 150px" />
                <Column field="cus" header="Customer" style="min-width: 150px" />
                <Column field="total" header="Total" style="width: 130px; text-align: right"><template #body="{ data }">{{ formatCurrency(data.total) }}</template></Column>
            </DataTable>
        </Dialog>

        <!-- Dialog Pembayaran -->
        <Dialog v-model:visible="paymentDialog" header="Pembayaran" :modal="true" :style="{ width: '500px' }">
    <div class="payment-dialog">
        <!-- 🔥 No Bon & Total Belanja (1 row) -->
        <div class="payment-row two-col">
            <div class="field-group">
                <label>No Bon</label>
                <InputText :value="noBon" readonly class="no-bon-input" />
            </div>
            <div class="field-group">
                <label>Total Belanja</label>
                <InputNumber :modelValue="grandTotal" mode="currency" currency="IDR" locale="id-ID" readonly class="total-belanja-input" />
            </div>
        </div>
        
        <!-- 🔥 Ongkir & Potongan (1 row) -->
        <div class="payment-row two-col">
            <div class="field-group">
                <label>Ongkir</label>
                <InputNumber v-model="ongkir" mode="currency" currency="IDR" locale="id-ID" size="small" class="w-full" />
            </div>
            <div class="field-group">
                <label>Potongan</label>
                <InputNumber v-model="potongan" mode="currency" currency="IDR" locale="id-ID" size="small" class="w-full" />
            </div>
        </div>
        
        <Divider />
        <label class="section-label">Pembayaran</label>
        
        <!-- Cash -->
        <div class="payment-row">
            <label>Cash Rp</label>
            <InputNumber v-model="cash" mode="currency" currency="IDR" locale="id-ID" size="small" class="w-full" />
        </div>
        
        <!-- Voucher -->
        <div class="payment-row two-col">
            <div class="field-group"><label>Voucher Rp</label><InputNumber v-model="voucher" mode="currency" currency="IDR" locale="id-ID" size="small" class="w-full" /></div>
            <div class="field-group"><label>No Voucher</label><InputText v-model="noVoucher" size="small" class="w-full" /></div>
        </div>
        
        <!-- Card -->
        <div class="payment-row three-col">
            <div class="field-group"><label>Card Rp</label><InputNumber v-model="card" mode="currency" currency="IDR" locale="id-ID" size="small" class="w-full" /></div>
            <div class="field-group"><label>No Card</label><InputText v-model="noCard" size="small" class="w-full" /></div>
            <div class="field-group"><label>Bank</label><InputText v-model="bank" size="small" class="w-full" /></div>
        </div>
        
        <!-- Piutang -->
        <div class="payment-row">
            <label>Piutang Rp</label>
            <InputNumber v-model="piutang" mode="currency" currency="IDR" locale="id-ID" size="small" class="w-full" />
        </div>
        
        <Divider />
        
        <!-- Ringkasan -->
        <div class="payment-summary">
            <div class="summary-row"><span>Grand Total</span><span>{{ formatCurrency(grandTotalFinal) }}</span></div>
            <div class="summary-row"><span>Total Bayar</span><span>{{ formatCurrency(totalBayarReal) }}</span></div>
            <div class="summary-row kembalian-row" :class="{ 'kembalian-positif': kembalian >= 0, 'kembalian-negatif': kembalian < 0 }">
                <span><strong>Kembalian</strong></span><span><strong>{{ formatCurrency(Math.max(0, kembalian)) }}</strong></span>
            </div>
        </div>
    </div>
    <template #footer>
        <Button label="Batal" severity="secondary" text size="small" @click="paymentDialog = false" />
        <Button label="Bayar & Cetak" icon="pi pi-check" severity="primary" @click="simpanTransaksi" :loading="saving" :disabled="kembalian < 0" />
    </template>
</Dialog>

        <!-- Dialog Ringkasan (setelah bayar) -->
        <Dialog v-model:visible="summaryDialog" :modal="true" :closable="false" :style="{ width: '360px' }">
    <div class="summary-dialog-content">
        <div class="summary-icon"><i class="pi pi-check-circle"></i></div>
        <h3>Transaksi Berhasil</h3>
        <div class="summary-rows">
            <!-- 🔥 Pakai lastPayment (nilai tersimpan sebelum reset) -->
            <div class="summary-row">
                <span>Grand Total</span>
                <span>{{ formatCurrency(lastPayment.grandTotal) }}</span>
            </div>
            <div class="summary-row" v-if="lastPayment.ongkir > 0">
                <span>  Ongkir</span>
                <span>{{ formatCurrency(lastPayment.ongkir) }}</span>
            </div>
            <div class="summary-row" v-if="lastPayment.potongan > 0">
                <span>  Potongan</span>
                <span>-{{ formatCurrency(lastPayment.potongan) }}</span>
            </div>
            <div class="summary-row" style="border-top:1px solid #e5e7eb; padding-top:8px;">
                <span>Total Bayar</span>
                <span>{{ formatCurrency(lastPayment.totalBayar) }}</span>
            </div>
            <div class="summary-row" v-if="lastPayment.cash > 0"><span>  Cash</span><span>{{ formatCurrency(lastPayment.cash) }}</span></div>
            <div class="summary-row" v-if="lastPayment.card > 0"><span>  Card</span><span>{{ formatCurrency(lastPayment.card) }}</span></div>
            <div class="summary-row" v-if="lastPayment.voucher > 0"><span>  Voucher</span><span>{{ formatCurrency(lastPayment.voucher) }}</span></div>
            <div class="summary-row" v-if="lastPayment.piutang > 0"><span>  Piutang</span><span>{{ formatCurrency(lastPayment.piutang) }}</span></div>
            <div class="summary-row kembalian-row">
                <span><strong>Kembalian</strong></span>
                <span><strong>{{ formatCurrency(Math.max(0, lastPayment.kembalian)) }}</strong></span>
            </div>
        </div>
    </div>
    <template #footer>
        <Button label="Cetak Struk" icon="pi pi-print" severity="primary" @click="printStruk()" />
        <Button label="Tutup" text size="small" @click="summaryDialog.value = false; nextTick(() => scanInputRef.value?.$el?.focus())" />
    </template>
</Dialog>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useToast } from 'primevue/usetoast'

definePageMeta({ layout: 'pos' })

const { $api } = useNuxtApp()
const toast = useToast()
const router = useRouter()
const scanInputRef = ref<any>(null)
const userId = ref(1)

// Cart State
interface CartItem {
    Kode: string; Nama: string; Satuan: string; Qty: number; Harga: number;
    DiscPr: number; DiscRp: number; Total: number;
    IsiCarton?: number; IsiLusin?: number; FlagPpn?: number;
    Kategori?: string; HargaBeli?: number; Ppn?: number;
}
const cartItems = ref<CartItem[]>([])
const scanBarcode = ref('')
const customerKode = ref('')
const customerNama = ref('')

// Modal State
const productModal = ref(false); const customerModal = ref(false); const pendingModal = ref(false)
const productSearch = ref(''); const customerSearch = ref('')
const productList = ref<any[]>([]); const customerList = ref<any[]>([]); const pendingList = ref<any[]>([])
const productLoading = ref(false); const customerLoading = ref(false); const pendingLoading = ref(false)

// Payment State
const paymentDialog = ref(false); const summaryDialog = ref(false)
const noBon = ref(''); const ongkir = ref(0); const potongan = ref(0)
const cash = ref(0); const voucher = ref(0); const noVoucher = ref('')
const card = ref(0); const noCard = ref(''); const bank = ref('')
const piutang = ref(0); const saving = ref(false)
const lastStrukData = ref<any>(null)

// Computed
const today = computed(() => new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }))
const subtotal = computed(() => cartItems.value.reduce((s, i) => s + i.Harga * i.Qty, 0))
const totalDisc = computed(() => cartItems.value.reduce((s, i) => s + (i.Harga * i.Qty * i.DiscPr / 100) + i.DiscRp, 0))
const grandTotal = computed(() => subtotal.value - totalDisc.value)
const totalBayarReal = computed(() => cash.value + card.value + voucher.value + piutang.value)
const grandTotalFinal = computed(() => grandTotal.value + ongkir.value - potongan.value)
const kembalian = computed(() => totalBayarReal.value - grandTotalFinal.value)

// 🔥 Simpan nilai pembayaran sebelum di-reset (untuk summary)
const lastPayment = ref({
    grandTotal: 0,
    ongkir: 0,
    potongan: 0,
    cash: 0,
    card: 0,
    voucher: 0,
    piutang: 0,
    totalBayar: 0,
    kembalian: 0
})

// Helpers
const formatCurrency = (v: any) => { if (!v && v !== 0) return '0'; return 'Rp ' + Math.round(parseFloat(v)).toLocaleString('id-ID') }
const formatDate = (d: Date): string => { const y = d.getFullYear(); const m = String(d.getMonth() + 1).padStart(2, '0'); const day = String(d.getDate()).padStart(2, '0'); return `${y}-${m}-${day}` }
const recalcItem = (item: CartItem) => {
    const hargaSetelahDiskon = (item.Harga * (100 - item.DiscPr) / 100) - item.DiscRp
    if (item.FlagPpn === 1) { item.Ppn = 0.1 * item.Qty * hargaSetelahDiskon; item.Total = (item.Qty * hargaSetelahDiskon) + (item.Ppn || 0) }
    else { item.Ppn = 0; item.Total = item.Qty * hargaSetelahDiskon }
}
const hitungKembali = () => {}

// Cart CRUD
const loadCart = async () => {
    try {
        const res = await $api.get('/pos/cart', { params: { user_id: userId.value } })
        if (res.data.success && res.data.data) {
            cartItems.value = res.data.data.map((r: any) => {
                const qty = parseInt(r.a6) || 1; const harga = parseFloat(r.a7) || 0
                const discPr = parseFloat(r.a8) || 0; const discRp = parseFloat(r.a9) || 0
                const hargaSetelahDiskon = (harga * (100 - discPr) / 100) - discRp
                const flagPpn = parseInt(r.a12) || 2; let ppn = 0; let total = 0
                if (flagPpn === 1) { ppn = 0.1 * qty * hargaSetelahDiskon; total = (qty * hargaSetelahDiskon) + ppn }
                else { total = qty * hargaSetelahDiskon }
                return { Kode: r.a1 || '', Nama: r.a2 || '', Satuan: r.a5 || 'PCS', Qty: qty, Harga: harga, DiscPr: discPr, DiscRp: discRp, Total: total, IsiCarton: parseInt(r.a3) || 1, IsiLusin: parseInt(r.a4) || 1, FlagPpn: flagPpn, Kategori: r.a13 || '', HargaBeli: parseFloat(r.a15) || 0, Ppn: ppn }
            })
        }
    } catch (e) { console.error(e) }
}

const saveCartItem = async (item: CartItem) => {
    const idx = cartItems.value.findIndex(c => c.Kode === item.Kode)
    try {
        await $api.post('/pos/cart', {
            user_id: userId.value, a1: item.Kode, a2: item.Nama, a3: String(item.IsiCarton ?? 1), a4: String(item.IsiLusin ?? 1),
            a5: item.Satuan, a6: item.Qty, a7: item.Harga, a8: item.DiscPr, a9: item.DiscRp, a10: item.Ppn ?? 0, a11: item.Total,
            a12: String(item.FlagPpn ?? 2), a13: item.Kategori ?? '', a14: String(item.IsiCarton ?? 1), a15: item.HargaBeli ?? 0,
            a16: 0, a17: String(item.IsiLusin ?? 1), num_item: idx >= 0 ? idx + 1 : cartItems.value.length
        })
    } catch (e) { console.error(e) }
}

const addToCart = async (item: any) => {
    const kode = item.Kode || item.brg_kode
    const existing = cartItems.value.find(c => c.Kode === kode)
    if (existing) { existing.Qty++; recalcItem(existing); await saveCartItem(existing); scanBarcode.value = ''; nextTick(() => scanInputRef.value?.$el?.focus()); return }
    try {
        const res = await $api.get('/pos/barang-detail', { params: { kode } })
        if (res.data.success) {
            const d = res.data.data
            const newItem: CartItem = { Kode: d.Kode, Nama: d.Nama, Satuan: d.Satuan, Qty: 1, Harga: d.Harga, DiscPr: d.DiscPr, DiscRp: d.DiscRp, Total: 0, IsiCarton: d.IsiCarton, IsiLusin: d.IsiLusin, FlagPpn: d.FlagPpn, Kategori: d.Kategori, HargaBeli: d.HargaBeli, Ppn: 0 }
            recalcItem(newItem); cartItems.value.push(newItem); await saveCartItem(newItem)
            scanBarcode.value = ''; nextTick(() => scanInputRef.value?.$el?.focus())
        }
    } catch (e) { console.error(e) }
}

const updateCartItem = async (index: number) => { const item = cartItems.value[index]; recalcItem(item); try { await $api.put('/pos/cart', { user_id: userId.value, kode: item.Kode, qty: item.Qty, disc_pr: item.DiscPr, disc_rp: item.DiscRp, a7: item.Harga, a10: item.Ppn, a11: item.Total }) } catch (e) { console.error(e) } }
const removeItem = async (index: number) => { const item = cartItems.value[index]; try { await $api.delete('/pos/cart', { data: { user_id: userId.value, kode: item.Kode } }) } catch (e) { console.error(e) }; cartItems.value.splice(index, 1) }
const clearCart = async () => { try { await $api.delete('/pos/cart/clear', { data: { user_id: userId.value } }) } catch (e) { console.error(e) }; cartItems.value = []; customerKode.value = ''; customerNama.value = '' }

// Barcode
const processBarcode = async () => { const code = scanBarcode.value.trim(); if (!code) return; try { const res = await $api.get('/barang/search', { params: { q: code } }); if (res.data.success && res.data.data) { addToCart(res.data.data) } else { toast.add({ severity: 'warn', summary: 'Tidak Ditemukan', detail: 'Barang tidak ditemukan', life: 2000 }) } } catch (e) { console.error(e) } }

// Pending
const pendingTransaction = async () => { if (cartItems.value.length === 0) { toast.add({ severity: 'warn', summary: 'Keranjang Kosong', detail: 'Tidak ada item', life: 2000 }); return }; try { const res = await $api.post('/pos/pending', { user_id: userId.value, customer: customerKode.value }); if (res.data.success) { cartItems.value = []; customerKode.value = ''; customerNama.value = ''; toast.add({ severity: 'success', summary: 'Pending', detail: 'Transaksi dipending', life: 2000 }) } } catch (e: any) { toast.add({ severity: 'error', summary: 'Gagal', detail: e.response?.data?.message || 'Gagal', life: 2000 }) } }
const openPendingList = async () => { if (cartItems.value.length > 0) { toast.add({ severity: 'warn', summary: 'Keranjang Berisi', detail: 'Pending/clear keranjang terlebih dahulu', life: 2000 }); return }; pendingLoading.value = true; pendingModal.value = true; try { const res = await $api.get('/pos/pending', { params: { user_id: userId.value } }); if (res.data.success) pendingList.value = res.data.data } catch (e) { console.error(e) } finally { pendingLoading.value = false } }
const loadPending = async (event: any) => { if (!event.data) return; try { const res = await $api.post('/pos/pending/load', { user_id: userId.value, pending_id: event.data.no }); if (res.data.success) { pendingModal.value = false; customerKode.value = event.data.cus || ''; await loadCart(); toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Pending dimuat', life: 2000 }) } else { toast.add({ severity: 'warn', summary: 'Gagal', detail: res.data.message, life: 2000 }) } } catch (e: any) { toast.add({ severity: 'error', summary: 'Gagal', detail: e.response?.data?.message || 'Gagal', life: 2000 }) } }

// Modals
const openProductModal = () => { productModal.value = true; searchProduct() }
const searchProduct = async () => { productLoading.value = true; try { const res = await $api.get('/barang/search-all', { params: { q: productSearch.value } }); if (res.data.success) productList.value = res.data.data } catch (e) { console.error(e) } finally { productLoading.value = false } }
const selectProduct = (event: any) => { if (event.data) { addToCart(event.data); productModal.value = false; nextTick(() => scanInputRef.value?.$el?.focus()) } }
const openCustomerModal = () => { customerModal.value = true; searchCustomer() }
const searchCustomer = async () => { customerLoading.value = true; try { const res = await $api.get('/customer/search', { params: { q: customerSearch.value } }); if (res.data.success) customerList.value = res.data.data } catch (e) { console.error(e) } finally { customerLoading.value = false } }
const selectCustomer = (event: any) => { if (event.data) { customerKode.value = event.data.Kode; customerNama.value = event.data.Nama; customerModal.value = false } }

// Payment
const bukaPembayaran = async () => { if (cartItems.value.length === 0) { toast.add({ severity: 'warn', summary: 'Keranjang Kosong', detail: 'Tidak ada item', life: 2000 }); return }; ongkir.value = 0; potongan.value = 0; cash.value = 0; voucher.value = 0; noVoucher.value = ''; card.value = 0; noCard.value = ''; bank.value = ''; piutang.value = 0; try { const res = await $api.get('/pos/no-bon', { params: { user_id: userId.value } }); if (res.data.success) noBon.value = res.data.no_bon } catch (e) { console.error(e) }; paymentDialog.value = true }

const simpanTransaksi = async () => {
    const totalBayarRealVal = cash.value + card.value + voucher.value + piutang.value
    const grandTotalFinalVal = grandTotal.value + ongkir.value - potongan.value
    const kembalianFinal = totalBayarRealVal - grandTotalFinalVal
    
    if (kembalianFinal < 0) { 
        toast.add({ severity: 'warn', summary: 'Pembayaran Kurang', detail: 'Total bayar kurang', life: 2000 }); return 
    }
    
    saving.value = true
    try {
        const res = await $api.post('/pos/bayar', {
            user_id: userId.value, no_bon: noBon.value, customer_kode: customerKode.value,
            total: grandTotal.value, ppn: 0, ongkir: ongkir.value, potongan: potongan.value,
            cash: cash.value, voucher: voucher.value, no_voucher: noVoucher.value,
            card: card.value, no_card: noCard.value, bank: bank.value,
            piutang: piutang.value, kembali: Math.max(0, kembalianFinal), total_bayar: totalBayarRealVal
        })
        
        if (res.data.success) {
            // 🔥 SIMPAN NILAI SEBELUM RESET
            lastPayment.value = {
                grandTotal: grandTotalFinalVal,
                ongkir: ongkir.value,
                potongan: potongan.value,
                cash: cash.value,
                card: card.value,
                voucher: voucher.value,
                piutang: piutang.value,
                totalBayar: totalBayarRealVal,
                kembalian: kembalianFinal
            }
            
            paymentDialog.value = false
            lastStrukData.value = res.data.struk
            cartItems.value = []
            customerKode.value = ''
            customerNama.value = ''
            
            // Reset payment state
            ongkir.value = 0; potongan.value = 0; cash.value = 0; voucher.value = 0
            noVoucher.value = ''; card.value = 0; noCard.value = ''; bank.value = ''; piutang.value = 0
            
            summaryDialog.value = true
            toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Transaksi berhasil disimpan', life: 3000 })
        }
    } catch (e: any) {
        toast.add({ severity: 'error', summary: 'Gagal', detail: e.response?.data?.message || 'Gagal', life: 3000 })
    } finally { saving.value = false }
}

// Print
const printStruk = () => {
    const data = lastStrukData.value
    if (!data) return
    summaryDialog.value = false

    const lebar = '58mm'

    let html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Struk</title>
    <style>
        @page { size: ${lebar} 200mm; margin: 0; }
        body {
            font-family: 'Courier New', monospace;
            font-size: 10px;
            padding: 3mm;
            width: ${lebar};
            margin: 0 auto;
            box-sizing: border-box;
        }
        .center { text-align: center; }
        .right { text-align: right; }
        .line { border-top: 1px dashed #000; margin: 3px 0; }
        table { width: 100%; border-collapse: collapse; }
        td { padding: 1px 0; }
        .bold { font-weight: bold; }
        @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
    </style></head><body>
        <div class="center bold">${data.perusahaan?.perush_nama || 'FAFA KOSMETIK'}</div>
        <div class="center">${data.perusahaan?.perush_alamat || ''}</div>
        <div class="center">${data.perusahaan?.perush_kota || ''}</div>
        <div class="line"></div>
        <div>No : ${data.hdr.so_nomor}</div>
        <div>Tgl: ${new Date(data.hdr.so_tanggal).toLocaleDateString('id-ID')} ${new Date(data.hdr.so_tanggal).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</div>
        <div>Kasir: ${data.hdr.so_user_kasir}</div>`

    if (data.customer && data.hdr.so_cus_kode !== '0000000001') {
        html += `<div>Mbr: ${data.hdr.so_cus_kode} | ${data.customer.cus_nama || ''}</div>`
    }

    html += `<div class="line"></div><table>`

    data.items.forEach((item: any) => {
        const disc = (item.sod_discpr * item.sod_hargakasir / 100) + item.sod_discrp
        const subTotal = (item.sod_hargakasir - disc) * item.sod_qtykasir

        html += `<tr><td>${item.brg_nama_singkat || item.sod_brg_kode}</td></tr>
            <tr><td>${item.sod_qtykasir} x ${formatCurrency(item.sod_hargakasir)}</td><td class="right">${formatCurrency(subTotal)}</td></tr>`
        if (disc > 0) {
            html += `<tr><td>Disc</td><td class="right">-${formatCurrency(disc * item.sod_qtykasir)}</td></tr>`
        }
    })

    html += `</table><div class="line"></div><table>
        <tr><td>Grand Total</td><td class="right bold">${formatCurrency(data.hdr.so_amount)}</td></tr>
        ${data.hdr.so_ongkir > 0 ? `<tr><td>Ongkir</td><td class="right">${formatCurrency(data.hdr.so_ongkir)}</td></tr>` : ''}
        ${data.hdr.so_disc_faktur > 0 ? `<tr><td>Potongan</td><td class="right">-${formatCurrency(data.hdr.so_disc_faktur)}</td></tr>` : ''}
        ${data.hdr.so_card > 0 ? `<tr><td>  Card</td><td class="right">${formatCurrency(data.hdr.so_card)}</td></tr>` : ''}
        ${data.hdr.so_voucher > 0 ? `<tr><td>  Voucher</td><td class="right">${formatCurrency(data.hdr.so_voucher)}</td></tr>` : ''}
        ${data.hdr.so_piutang > 0 ? `<tr><td>  Piutang</td><td class="right">${formatCurrency(data.hdr.so_piutang)}</td></tr>` : ''}
        ${data.hdr.so_dp > 0 ? `<tr><td>  Cash</td><td class="right">${formatCurrency(data.hdr.so_dp)}</td></tr>` : ''}
    </table>
    <div class="line"></div>
    <table>
        <tr class="bold"><td>KEMBALI</td><td class="right bold">${formatCurrency(data.hdr.so_kembali)}</td></tr>
    </table>
    <div class="line"></div>
    <div class="center">TERIMA KASIH</div>
    <div class="center">ATAS KEPERCAYAAN ANDA</div>
    <script>window.onload=function(){window.print()}<\/script>
    </body></html>`

    const win = window.open('', '_blank', 'width=220,height=600')
    if (win) { win.document.write(html); win.document.close() }
}

// Keyboard
const handleKeyDown = (e: KeyboardEvent) => { if (productModal.value || customerModal.value || pendingModal.value || paymentDialog.value || summaryDialog.value) return; if (e.ctrlKey && e.key === 'p') { e.preventDefault(); pendingTransaction() } if (e.ctrlKey && e.key === 's') { e.preventDefault(); openPendingList() } if (e.key === 'F2') { e.preventDefault(); openProductModal() } if (e.key === 'Escape') { e.preventDefault(); clearCart() } if (e.key === '+') { e.preventDefault(); bukaPembayaran() } }

const goBack = () => router.push('/dashboard')

onMounted(() => { loadCart(); nextTick(() => scanInputRef.value?.$el?.focus()) })
</script>

<style lang="scss" scoped>
.pos-page { height: 100vh; width: 100vw; display: flex; flex-direction: column; background: #f8fafc; overflow: hidden; }
.pos-header { display: flex; align-items: center; justify-content: space-between; padding: 0.5rem 1rem; background: white; border-bottom: 1px solid #e2e8f0; flex-shrink: 0; .header-left { display: flex; align-items: center; gap: 0.75rem; } .header-icon { width: 2.25rem; height: 2.25rem; background: #ecfdf5; border-radius: 0.5rem; display: flex; align-items: center; justify-content: center; color: #10b981; font-size: 1.1rem; } h1 { font-size: 1.1rem; font-weight: 700; color: #0f172a; margin: 0; } p { font-size: 0.7rem; color: #64748b; margin: 0; } .header-actions { display: flex; gap: 0.25rem; } }
.pos-content { display: flex; flex: 1; overflow: hidden; }
.pos-left { flex: 1; display: flex; flex-direction: column; border-right: 1px solid #e2e8f0; overflow: hidden; }
.scan-section { padding: 0.75rem; background: white; border-bottom: 1px solid #e2e8f0; flex-shrink: 0; .scan-input-wrapper { position: relative; display: flex; align-items: center; .scan-icon { position: absolute; left: 0.75rem; color: #94a3b8; font-size: 1.1rem; z-index: 1; } .scan-input { width: 100%; height: 2.75rem; font-size: 1rem; padding-left: 2.5rem !important; padding-right: 3.5rem !important; border: 2px solid #e2e8f0; border-radius: 0.625rem; &:focus { border-color: #10b981; box-shadow: 0 0 0 3px rgba(16,185,129,0.1); } } .scan-hint { position: absolute; right: 0.75rem; padding: 0.15rem 0.4rem; background: #f1f5f9; border-radius: 0.3rem; font-size: 0.65rem; color: #64748b; } } }
.cart-section { flex: 1; overflow: hidden; background: white; }
.cart-table { :deep(.p-datatable-thead > tr > th) { background: #f8fafc; font-size: 0.65rem; font-weight: 700; text-transform: uppercase; padding: 0.4rem 0.5rem; } :deep(.p-datatable-tbody > tr > td) { padding: 0.3rem 0.5rem; font-size: 0.8rem; } .qty-input, .disc-input { :deep(.p-inputnumber-input) { width: 55px; text-align: center; font-size: 0.75rem; } } }
.cart-empty { display: flex; flex-direction: column; align-items: center; padding: 2rem; color: #94a3b8; i { font-size: 2.5rem; margin-bottom: 0.5rem; } p { font-size: 0.85rem; } }
.pos-right { width: 320px; display: flex; flex-direction: column; padding: 0.75rem; gap: 0.75rem; background: white; flex-shrink: 0; }
.customer-section { .section-label { font-size: 0.7rem; font-weight: 700; text-transform: uppercase; color: #64748b; margin-bottom: 0.4rem; display: block; } .customer-input-row { display: flex; gap: 0.4rem; } .customer-kode { flex: 1; } .customer-name { display: flex; align-items: center; gap: 0.4rem; margin-top: 0.4rem; padding: 0.4rem 0.6rem; background: #ecfdf5; border-radius: 0.4rem; font-size: 0.8rem; color: #065f46; i { color: #10b981; } } }
.summary-section { padding: 0.75rem; background: #f8fafc; border-radius: 0.6rem; .summary-row { display: flex; justify-content: space-between; padding: 0.35rem 0; font-size: 0.85rem; } .summary-total { border-top: 2px solid #e2e8f0; padding-top: 0.5rem; font-size: 1rem; font-weight: 700; color: #0f172a; } }
.modal-search { padding: 0.5rem 0 0.75rem 0; }
.modal-table { :deep(.p-datatable-tbody > tr) { cursor: pointer; &:hover { background: #ecfdf5; } } }

// Payment Dialog
.payment-dialog { display: flex; flex-direction: column; gap: 0.75rem; .payment-row { display: flex; flex-direction: column; gap: 0.25rem; label { font-size: 0.75rem; font-weight: 600; color: #64748b; } &.two-col { flex-direction: row; gap: 0.75rem; .field-group { flex: 1; } } &.three-col { flex-direction: row; gap: 0.5rem; .field-group { flex: 1; } } } .no-bon-input { background: #f1f5f9; font-weight: 600; color: #1e293b; } .total-belanja-input { :deep(.p-inputnumber-input) { background: #f1f5f9 !important; font-weight: 700 !important; font-size: 1.1rem !important; color: #1e293b !important; } } .section-label { font-size: 0.8rem; font-weight: 700; color: #374151; text-transform: uppercase; letter-spacing: 0.05em; } .payment-summary { display: flex; flex-direction: column; gap: 0.4rem; .summary-row { display: flex; justify-content: space-between; font-size: 0.9rem; } .kembalian-row { padding: 0.6rem 0.5rem !important; border-radius: 0.5rem; margin-top: 0.5rem; &.kembalian-positif { background: #ecfdf5; border: 1px solid #10b981; strong { color: #059669; } } &.kembalian-negatif { background: #fef2f2; border: 1px solid #ef4444; strong { color: #dc2626; } } } } }

// Summary Dialog
.summary-dialog-content {
    text-align: center;
    .summary-icon {
        width: 4rem; height: 4rem; margin: 0 auto 1rem;
        background: #ecfdf5; border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        i { font-size: 2.5rem; color: #10b981; }
    }
    h3 { font-size: 1.2rem; color: #065f46; margin: 0 0 1rem 0; }
    .summary-rows { display: flex; flex-direction: column; gap: 0.5rem; text-align: left; }
    .summary-row { display: flex; justify-content: space-between; font-size: 0.9rem; padding: 0.3rem 0; }
    .kembalian-row { 
        padding: 0.5rem 0 !important;
        border-top: 2px solid #e5e7eb;
        margin-top: 0.25rem;
        strong { color: #059669; }
    }
}
</style>