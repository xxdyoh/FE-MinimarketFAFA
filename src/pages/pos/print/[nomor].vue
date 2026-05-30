<template>
    <div class="print-container" v-if="isReady">
        <!-- KOP -->
        <div class="center bold">{{ data.perusahaan?.perush_nama || 'FAFA KOSMETIK' }}</div>
        <div class="center">{{ data.perusahaan?.perush_alamat || '' }}</div>
        <div class="center">{{ data.perusahaan?.perush_kota || '' }}</div>
        <div class="line"></div>

        <!-- INFO -->
        <div>No : {{ data.hdr.so_nomor }}</div>
        <div>Tgl: {{ fmtDate(data.hdr.so_tanggal) }} {{ fmtTime(data.hdr.so_tanggal) }}</div>
        <div>Kasir: {{ data.nama_kasir || data.hdr.so_user_kasir }}</div>
        <div v-if="data.customer && data.hdr.so_cus_kode !== '0000000001'">
            <div>Member: {{ data.hdr.so_cus_kode }}</div>
            <div>        {{ data.customer.cus_nama || '' }}</div>
        </div>
        <div class="line"></div>

        <!-- ITEMS -->
        <table>
            <tr v-for="(item, i) in data.items" :key="i">
                <td colspan="2">{{ item.brg_nama_singkat || item.sod_brg_kode }}</td>
            </tr>
            <tr v-for="(item, i) in data.items" :key="'sub'+i">
                <td>{{ item.sod_qtykasir }} x {{ fmtCurrency(item.sod_hargakasir) }}</td>
                <td class="right">= {{ fmtCurrency((item.sod_hargakasir - ((item.sod_discpr * item.sod_hargakasir / 100) + item.sod_discrp)) * item.sod_qtykasir) }}</td>
            </tr>
        </table>
        <div class="line"></div>

        <!-- TOTAL -->
        <table>
            <tr><td>Grand Total</td><td class="right bold">{{ fmtCurrency(data.hdr.so_amount) }}</td></tr>
            <tr v-if="data.hdr.so_ongkir > 0"><td>Ongkir</td><td class="right">{{ fmtCurrency(data.hdr.so_ongkir) }}</td></tr>
            <tr v-if="data.hdr.so_disc_faktur > 0"><td>Potongan</td><td class="right">-{{ fmtCurrency(data.hdr.so_disc_faktur) }}</td></tr>
            <tr class="bold"><td>TOTAL BAYAR</td><td class="right">{{ fmtCurrency(data.hdr.so_bayar) }}</td></tr>
            <tr v-if="data.hdr.so_card > 0"><td>  Card</td><td class="right">{{ fmtCurrency(data.hdr.so_card) }}</td></tr>
            <tr v-if="data.hdr.so_voucher > 0"><td>  Voucher</td><td class="right">{{ fmtCurrency(data.hdr.so_voucher) }}</td></tr>
            <tr v-if="data.hdr.so_piutang > 0"><td>  Piutang</td><td class="right">{{ fmtCurrency(data.hdr.so_piutang) }}</td></tr>
            <tr v-if="data.hdr.so_dp > 0"><td>  Cash</td><td class="right">{{ fmtCurrency(data.hdr.so_dp) }}</td></tr>
        </table>
        <div class="line"></div>
        <table>
            <tr class="bold"><td>KEMBALI</td><td class="right bold">{{ fmtCurrency(data.hdr.so_kembali) }}</td></tr>
        </table>

        <!-- POIN -->
        <div v-if="data.poin?.is_member">
            <div class="line"></div>
            <div class="center">Tambah Poin : {{ data.poin.tambah }}</div>
            <div class="center bold">Poin Anda : {{ data.poin.total.toLocaleString('id-ID') }}</div>
        </div>

        <div class="line"></div>
        <div class="center">TERIMA KASIH</div>
        <div class="center">ATAS KEPERCAYAAN ANDA</div>
    </div>
    <div v-else class="center" style="padding: 20px;">Memuat...</div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'

definePageMeta({ layout: 'false', middleware: false })  // Layout kosong, tanpa navbar

const route = useRoute()
const nomor = route.params.nomor as string
const { $api } = useNuxtApp()
const data = ref<any>(null)
const isReady = ref(false)

const fmtCurrency = (v: any) => {
    if (!v && v !== 0) return '0'
    return 'Rp ' + Math.round(parseFloat(v)).toLocaleString('id-ID')
}

const fmtDate = (val: string) => {
    if (!val) return ''
    const d = new Date(val)
    return d.toLocaleDateString('id-ID')
}

const fmtTime = (val: string) => {
    if (!val) return ''
    const d = new Date(val)
    return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
}

const fetchData = async () => {
    try {
        const res = await $api.get('/pos/struk', { params: { no_bon: nomor } })
        if (res.data.success) {
            data.value = res.data.struk
            isReady.value = true
            // Auto print setelah render
            setTimeout(() => {
                window.print()
            }, 500)
        }
    } catch (e) {
        console.error(e)
    }
}

onMounted(() => {
    fetchData()
})
</script>

<style scoped>
@media print {
    @page {
        size: 80mm auto;
        margin: 0mm;
    }
    body {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
    }
}

.print-container {
    width: 80mm;
    margin: 0 auto;
    font-family: 'Courier New', monospace;
    font-size: 10px;
    color: #000;
    line-height: 1.3;
    padding: 2mm;
    box-sizing: border-box;
}

.center { text-align: center; }
.right { text-align: right; }
.line { border-top: 1px dashed #000; margin: 3px 0; }
table { width: 100%; border-collapse: collapse; }
td { padding: 1px 0; }
.bold { font-weight: bold; }
</style>