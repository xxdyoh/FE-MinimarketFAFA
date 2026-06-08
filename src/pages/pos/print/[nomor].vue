<template>
    <div class="print-container" v-if="isReady">
        <!-- KOP -->
        <div class="center bold">{{ data.perusahaan?.PERUSH_NAMA || 'FAFA KOSMETIK' }}</div>
        <div class="center">{{ data.perusahaan?.PERUSH_ALAMAT || '' }}</div>
        <div class="center" v-if="data.perusahaan?.PERUSH_NOTELP">{{ data.perusahaan?.PERUSH_NOTELP }}</div>

        <!-- INFO HEADER -->
       <div>KASIR  : {{ namaKasir }}<span style="margin-left: 68px;">Tgl : {{ fmtDate(data.hdr.so_tanggal) }}</span></div>
<div>No Bon : {{ noBonShort }}<span style="margin-left: 30px;">Jam :    {{ fmtTime(data.hdr.so_tanggal) }}</span></div>
        <!-- Member -->
        <div v-if="data.customer && data.hdr.so_cus_kode !== '0000000001'">
            <div>{{ fmtRow('Member', data.hdr.so_cus_kode, 30) }}</div>
            <div>{{ fmtRow('', data.customer.cus_nama || '', 30) }}</div>
        </div>

        <div class="line"></div>

        <!-- ITEMS -->
        <div v-for="(item, i) in data.items" :key="i">
            <!-- Baris 1: Kode + Nama -->
            <div>{{ padRight(item.sod_brg_kode, 10) }}{{ item.brg_nama_singkat || item.sod_brg_kode }}</div>
            
            <!-- Baris 2: Qty x Harga = Total Kotor -->
            <div class="right">
                {{ padLeft(fmtNum(item.sod_qtykasir), 5) }} {{ padRight(item.sod_brg_satuan || 'PCS', 4) }} x {{ padLeft(fmtNum(item.sod_hargakasir), 9) }} = {{ padLeft(fmtNum(hitungTotalKotor(item)), 13) }}
            </div>
            
            <!-- Baris 3: Disc % (jika ada) -->
            <div v-if="parseFloat(item.sod_discpr) > 0" class="right">
                Disc {{ fmtNum(item.sod_discpr) }}% {{ padLeft('', 14) }}- {{ padLeft(fmtNum(discPrRp(item)), 11) }}
            </div>
            
            <!-- Baris 4: Disc Rp (jika ada) -->
            <div v-if="parseFloat(item.sod_discrp) > 0" class="right">
                Disc Rp {{ padLeft('', 16) }}- {{ padLeft(fmtNum(discRpNominal(item)), 11) }}
            </div>
        </div>

        <div class="line"></div>

        <!-- TOTAL -->
<div class="right pre">Total Belanja : {{ padLeft(fmtNum(data.hdr.so_amount), 9) }}</div>
<div v-if="data.hdr.so_ongkir > 0" class="right pre">Ongkir        : {{ padLeft(fmtNum(data.hdr.so_ongkir), 9) }}</div>
<div v-if="data.hdr.so_disc_faktur > 0" class="right pre">Potongan      : {{ padLeft(fmtNum(data.hdr.so_disc_faktur), 9) }}</div>
<div v-if="data.hdr.so_dp > 0" class="right pre">Tunai         : {{ padLeft(fmtNum(data.hdr.so_dp), 9) }}</div>
<div v-if="data.hdr.so_card > 0" class="right pre">Kartu         : {{ padLeft(fmtNum(data.hdr.so_card), 9) }}</div>
<div v-if="data.hdr.so_voucher > 0" class="right pre">Voucher       : {{ padLeft(fmtNum(data.hdr.so_voucher), 9) }}</div>
<div v-if="data.hdr.so_piutang > 0" class="right pre">Piutang       : {{ padLeft(fmtNum(data.hdr.so_piutang), 9) }}</div>
<div class="right pre">             : ---------</div>
<div class="right pre">Kembali     : {{ padLeft(fmtNum(data.hdr.so_kembali), 9) }}</div>

        <div class="center" style="margin-top: 12px;">TERIMA KASIH ATAS KEPERCAYAAN ANDA</div>

        <!-- POIN -->
        <div v-if="data.poin?.is_member" style="margin-top: 8px;">
            <div>{{ fmtRow('Tambah Poin', String(data.poin.tambah)) }}</div>
            <div>{{ fmtRow('Poin Anda', data.poin.total.toLocaleString('id-ID')) }}</div>
        </div>

        <div class="line"></div>
        <div class="center">Terima Kasih</div>
    </div>
    <div v-else class="center" style="padding: 20px;">Memuat...</div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'

definePageMeta({ layout: false, middleware: false })

const route = useRoute()
const nomor = route.params.nomor as string
const { $api } = useNuxtApp()
const data = ref<any>(null)
const isReady = ref(false)

// ========== COMPUTED ==========
const namaKasir = computed(() => data.value?.nama_kasir || data.value?.hdr?.so_user_kasir || 'ADMIN')
const noBonShort = computed(() => {
    const nobon = data.value?.hdr?.so_nomor || ''
    return nobon.length > 14 ? nobon.substring(5) : nobon
})

// ========== HELPERS ==========
const fmtNum = (v: any): string => {
    if (!v && v !== 0) return '0'
    return Math.round(parseFloat(v)).toLocaleString('id-ID')
}

const padRight = (str: string, len: number): string => {
    const s = String(str || '')
    return s.length >= len ? s.substring(0, len) : s + ' '.repeat(len - s.length)
}

const padLeft = (str: string, len: number): string => {
    const s = String(str || '')
    return s.length >= len ? s.substring(0, len) : ' '.repeat(len - s.length) + s
}

const fmtRow = (label: string, value: string, labelWidth: number = 14): string => {
    return padRight(label, labelWidth) + ': ' + value
}

const fmtDate = (val: string): string => {
    if (!val) return ''
    const d = new Date(val)
    return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`
}

const fmtTime = (val: string): string => {
    if (!val) return ''
    const d = new Date(val)
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`
}

// ========== ITEM CALCULATIONS ==========
const hitungTotalKotor = (item: any): number => {
    return parseFloat(item.sod_hargakasir || 0) * parseFloat(item.sod_qtykasir || 1)
}

const discPrRp = (item: any): number => {
    return (parseFloat(item.sod_discpr || 0) * parseFloat(item.sod_hargakasir || 0) / 100) * parseFloat(item.sod_qtykasir || 1)
}

const discRpNominal = (item: any): number => {
    return parseFloat(item.sod_discrp || 0) * parseFloat(item.sod_qtykasir || 1)
}

// ========== FETCH ==========
const fetchData = async () => {
    try {
        const res = await $api.get('/pos/struk', { params: { no_bon: nomor } })
        if (res.data.success) {
            data.value = res.data.struk
            isReady.value = true
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
    font-family: monospace;
    font-size: 13px;
    color: #000;
    line-height: 1.3;
    padding: 2mm;
    box-sizing: border-box;
}

.center { text-align: center; }
.right { text-align: right; }
.bold { font-weight: bold; }
.line { border-top: 1px dashed #000; margin: 4px 0; }
.pre {
    white-space: pre;
}
</style>