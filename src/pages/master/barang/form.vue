<template>
    <div class="barang-form-page">
        <!-- Compact Header -->
        <div class="form-header-compact">
            <div class="header-left">
                <Button 
                    icon="pi pi-arrow-left" 
                    text 
                    rounded 
                    size="large"
                    @click="navigateTo('/master/barang')"
                    class="back-btn"
                />
                <div class="header-icon-wrapper">
                    <i class="pi pi-box"></i>
                </div>
                <div class="header-text">
                    <h1 class="header-title">
                        {{ isEdit ? 'Edit Barang' : 'Tambah Barang' }}
                    </h1>
                    <div class="header-badge" v-if="isEdit">
                        <i class="pi pi-tag"></i>
                        <span>{{ formData.Kode }}</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Floating Quick Navigation -->
        <div class="floating-quick-nav">
            <div class="nav-trigger">
                <i class="pi pi-list"></i>
            </div>
            <div class="nav-menu">
                <a href="#section-dasar" class="nav-link" v-tooltip.left="'Informasi Dasar'">
                    <i class="pi pi-info-circle"></i>
                    <span>Informasi Dasar</span>
                </a>
                <a href="#section-harga" class="nav-link" v-tooltip.left="'Harga'">
                    <i class="pi pi-dollar"></i>
                    <span>Harga</span>
                </a>
            </div>
        </div>

        <!-- Form Content -->
        <div class="form-content-full">
            
            <!-- SECTION 1: INFORMASI DASAR -->
            <div id="section-dasar" class="form-section">
                <div class="section-header">
                    <i class="pi pi-info-circle"></i>
                    <h3>Informasi Dasar</h3>
                    <span class="required-badge">*Wajib</span>
                </div>
                
                <!-- Row 1: Tipe, Kode, Satuan -->
                <div class="form-row">
                    <div class="field-group" style="flex: 1.5;">
                        <label>Tipe Barang <span class="required">*</span></label>
                        <Select 
                            v-model="formData.Tipe"
                            :options="tipeOptions"
                            optionLabel="nama"
                            optionValue="kode"
                            placeholder="Pilih tipe"
                            class="w-full"
                            :class="{ 'p-invalid': !formData.Tipe && showValidation }"
                        />
                    </div>
                    <div class="field-group" style="flex: 1;">
                        <label>Kode Barang</label>
                        <InputText v-model="formData.Kode" placeholder="Otomatis" class="w-full" disabled readonly />
                    </div>
                    <div class="field-group" style="flex: 0.8;">
                        <label>Satuan <span class="required">*</span></label>
                        <InputText v-model="formData.Satuan" placeholder="PCS, UNIT" class="w-full" :class="{ 'p-invalid': !formData.Satuan && showValidation }" />
                    </div>
                </div>

                <!-- Row 2: Nama Barang -->
                <div class="form-row">
                    <div class="field-group" style="flex: 1;">
                        <label>Nama Barang <span class="required">*</span></label>
                        <InputText v-model="formData.Nama" placeholder="Masukkan nama lengkap barang" class="w-full" :class="{ 'p-invalid': !formData.Nama && showValidation }" />
                    </div>
                </div>

                <!-- Row 3: Kategori, Merk, Gudang -->
                <div class="form-row">
                    <div class="field-group" style="flex: 1;">
                        <label>Kategori</label>
                        <Select v-model="formData.Kategori" :options="kategoriOptions" optionLabel="nama" optionValue="kode" placeholder="Pilih kategori" class="w-full" showClear filter />
                    </div>
                    <div class="field-group" style="flex: 1;">
                        <label>Merk</label>
                        <InputText v-model="formData.Merk" placeholder="Merk barang" class="w-full" />
                    </div>
                    <div class="field-group" style="flex: 1;">
                        <label>Gudang Default</label>
                        <Select v-model="formData.Gudang" :options="gudangOptions" optionLabel="nama" optionValue="kode" placeholder="Pilih gudang" class="w-full" showClear />
                    </div>
                </div>

                <!-- Row 4: Pemasok & Status -->
                <div class="form-row">
                    <div class="field-group" style="flex: 1.5;">
                        <label>Pemasok Utama</label>
                        <Select v-model="formData.Pemasok" :options="supplierOptions" optionLabel="nama" optionValue="kode" placeholder="Pilih pemasok" class="w-full" showClear filter />
                    </div>
                    
                    <!-- Status Chips -->
                    <div class="status-wrapper" style="flex: 2;">
                        <label class="status-label">Status Barang</label>
                        <div class="status-chips">
                            <div class="status-chip" :class="{ 'active': formData.IsAktif }" @click="formData.IsAktif = !formData.IsAktif">
                                <i class="pi pi-check-circle"></i>
                                <span>Aktif</span>
                                <ToggleSwitch v-model="formData.IsAktif" @click.stop />
                            </div>
                            <div class="status-chip" :class="{ 'active': formData.IsStok }" @click="formData.IsStok = !formData.IsStok">
                                <i class="pi pi-box"></i>
                                <span>Kelola Stok</span>
                                <ToggleSwitch v-model="formData.IsStok" @click.stop />
                            </div>
                            <div class="status-chip" :class="{ 'active': formData.IsExpired }" @click="formData.IsExpired = !formData.IsExpired">
                                <i class="pi pi-calendar"></i>
                                <span>Expired</span>
                                <ToggleSwitch v-model="formData.IsExpired" @click.stop />
                            </div>
                            <div class="status-chip product-focus" :class="{ 'active': formData.ProductFocus }" @click="formData.ProductFocus = !formData.ProductFocus">
                                <i class="pi pi-star-fill"></i>
                                <span>Product Focus</span>
                                <ToggleSwitch v-model="formData.ProductFocus" @click.stop />
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Row 5: Min/Max Stok -->
                <div class="form-row">
                    <div class="stok-wrapper">
                        <label class="stok-label">Batas Stok</label>
                        <div class="stok-input-group">
                            <div class="field-group" style="width: 120px;">
                                <label>Minimum</label>
                                <InputNumber v-model="formData.MinStok" placeholder="0" class="w-full" />
                            </div>
                            <span class="stok-separator">—</span>
                            <div class="field-group" style="width: 120px;">
                                <label>Maximum</label>
                                <InputNumber v-model="formData.MaxStok" placeholder="0" class="w-full" />
                            </div>
                            <div class="stok-visual" v-if="formData.MinStok > 0 && formData.MaxStok > 0">
                                <div class="visual-bar-bg">
                                    <div class="visual-bar-fill" :style="{ width: `${Math.min((formData.MinStok / formData.MaxStok) * 100, 100)}%`, background: getStockBarColor() }"></div>
                                </div>
                                <span class="visual-text">{{ ((formData.MinStok / formData.MaxStok) * 100).toFixed(0) }}%</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- SECTION 2: HARGA -->
            <div id="section-harga" class="form-section">
                <div class="section-header">
                    <i class="pi pi-dollar"></i>
                    <h3>Harga</h3>
                </div>
                
                <!-- Row 1: Harga Beli, Jual, HET, Disc -->
                <div class="form-row">
                    <div class="field-group" style="flex: 1;">
                        <label>Harga Beli</label>
                        <InputNumber v-model="formData.HargaBeli" mode="currency" currency="IDR" locale="id-ID" placeholder="0" class="w-full" />
                    </div>
                    <div class="field-group" style="flex: 1;">
                        <label>Harga Jual <span class="required">*</span></label>
                        <InputNumber v-model="formData.HargaJual" mode="currency" currency="IDR" locale="id-ID" placeholder="0" class="w-full" :class="{ 'p-invalid': !formData.HargaJual && showValidation }" />
                    </div>
                    <div class="field-group" style="flex: 1;">
                        <label>Batas Harga (HET)</label>
                        <InputNumber v-model="formData.HET" mode="currency" currency="IDR" locale="id-ID" placeholder="0" class="w-full" :disabled="!canEditHET" />
                        <small class="field-hint" v-if="!canEditHET">Hanya Finance</small>
                    </div>
                    <div class="field-group" style="flex: 0.6;">
                        <label>Disc Salesman</label>
                        <div class="input-with-suffix">
                            <InputNumber v-model="formData.DiscSalesman" mode="decimal" :min="0" :max="100" placeholder="0" class="w-full" />
                            <span class="suffix">%</span>
                        </div>
                    </div>
                </div>

                <!-- Margin Info -->
                <div class="margin-row" v-if="formData.HargaBeli > 0 && formData.HargaJual > 0">
                    <div class="margin-card" :class="getMarginColor">
                        <i :class="getMarginIcon"></i>
                        <span class="margin-text">
                            Margin: <strong>{{ formatRupiah(formData.HargaJual - formData.HargaBeli) }}</strong> ({{ getMarginPercentage }}%)
                        </span>
                        <span class="margin-status">{{ getMarginMessage }}</span>
                    </div>
                </div>

                <!-- Harga Khusus Grid -->
                <div class="harga-khusus-wrapper">
                    <div class="subsection-header">
                        <i class="pi pi-users"></i>
                        <span>Harga Khusus per Jenis Customer</span>
                        <Tag v-if="customPriceCount > 0" :value="`${customPriceCount} custom`" severity="success" size="small" />
                    </div>
                    
                    <div class="grid-container">
                        <DataTable :value="hargaKhususGrid" class="harga-grid" size="small">
                            <Column header="#" style="width: 50px; text-align: center">
                                <template #body="{ index }">
                                    <span class="row-number">{{ index + 1 }}</span>
                                </template>
                            </Column>
                            <Column field="kode" header="Kode" style="width: 80px" />
                            <Column field="nama" header="Jenis Customer" />
                            <Column field="hargajual" header="Harga Khusus" style="width: 240px">
                                <template #body="{ data, index }">
                                    <InputNumber v-model="hargaKhususGrid[index].hargajual" mode="currency" currency="IDR" locale="id-ID" placeholder="Opsional" class="w-full" />
                                </template>
                            </Column>
                            <Column header="Status" style="width: 90px; text-align: center">
                                <template #body="{ data }">
                                    <Tag v-if="data.hargajual > 0" value="Custom" severity="success" size="small" />
                                    <Tag v-else value="Default" severity="secondary" size="small" />
                                </template>
                            </Column>
                        </DataTable>
                    </div>
                </div>
            </div>

        </div>

        <!-- Sticky Bottom Bar -->
        <div class="form-bottom-bar">
            <div class="bottom-bar-inner">
                <div class="validation-error" v-if="!isFormValid && showValidation">
                    <i class="pi pi-exclamation-circle"></i>
                    <span>Lengkapi field yang wajib diisi</span>
                </div>
                <div class="bottom-actions">
                    <Button label="Batal" severity="secondary" text @click="navigateTo('/master/barang')" />
                    <Button label="Simpan & Baru" severity="secondary" :loading="saving" @click="saveAndNew" />
                    <Button :label="isEdit ? 'Update Barang' : 'Simpan Barang'" severity="primary" :loading="saving" @click="saveAndClose" />
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
// ... script tetap sama ...
</script>

<style lang="scss" scoped>
.barang-form-page {
    min-height: 100vh;
    background: #f8fafc;
    padding-bottom: 4.5rem;
}

// Header
.form-header-compact {
    position: sticky;
    top: 0;
    z-index: 50;
    background: white;
    border-bottom: 1px solid #e2e8f0;
    padding: 0.75rem 2rem;
    display: flex;
    align-items: center;
    
    .header-left {
        display: flex;
        align-items: center;
        gap: 1rem;
        
        .header-icon-wrapper {
            width: 2.5rem;
            height: 2.5rem;
            background: linear-gradient(135deg, #10b981, #059669);
            border-radius: 0.625rem;
            display: flex;
            align-items: center;
            justify-content: center;
            
            i { font-size: 1.25rem; color: white; }
        }
        
        .header-text {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            
            .header-title {
                font-size: 1.25rem;
                font-weight: 700;
                color: #0f172a;
                margin: 0;
            }
            
            .header-badge {
                display: flex;
                align-items: center;
                gap: 0.25rem;
                padding: 0.25rem 0.625rem;
                background: #dbeafe;
                border-radius: 1rem;
                color: #1e40af;
                font-size: 0.75rem;
                font-weight: 600;
            }
        }
    }
}

// Floating Nav
.floating-quick-nav {
    position: fixed;
    right: 1.5rem;
    top: 50%;
    transform: translateY(-50%);
    z-index: 100;
    
    .nav-trigger {
        width: 2.5rem;
        height: 2.5rem;
        background: white;
        border-radius: 1.25rem;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s;
        border: 1px solid #e2e8f0;
        
        i { color: #10b981; font-size: 1.1rem; }
        
        &:hover {
            background: #10b981;
            i { color: white; }
        }
    }
    
    .nav-menu {
        position: absolute;
        right: 3rem;
        top: 50%;
        transform: translateY(-50%);
        background: white;
        border-radius: 0.75rem;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
        border: 1px solid #e2e8f0;
        padding: 0.5rem;
        display: flex;
        flex-direction: column;
        gap: 0.125rem;
        opacity: 0;
        visibility: hidden;
        transition: all 0.2s;
        min-width: 150px;
        
        .nav-link {
            display: flex;
            align-items: center;
            gap: 0.625rem;
            padding: 0.5rem 0.875rem;
            border-radius: 0.5rem;
            color: #475569;
            text-decoration: none;
            font-size: 0.8rem;
            font-weight: 500;
            
            i { width: 1.1rem; color: #94a3b8; }
            
            &:hover {
                background: #ecfdf5;
                color: #10b981;
                i { color: #10b981; }
            }
        }
    }
    
    &:hover .nav-menu {
        opacity: 1;
        visibility: visible;
        right: 3.25rem;
    }
}

// Form Content
.form-content-full {
    max-width: 1400px;
    margin: 0 auto;
    padding: 1.5rem 2rem;
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
}

// Sections
.form-section {
    background: white;
    border-radius: 0.875rem;
    padding: 1.5rem 1.75rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
    border: 1px solid #f1f5f9;
}

.section-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 1.25rem;
    padding-bottom: 0.75rem;
    border-bottom: 1px solid #f1f5f9;
    
    i { color: #10b981; font-size: 1.1rem; }
    
    h3 {
        font-size: 1rem;
        font-weight: 600;
        color: #0f172a;
        margin: 0;
    }
    
    .required-badge {
        margin-left: auto;
        font-size: 0.65rem;
        padding: 0.15rem 0.5rem;
        background: #fef2f2;
        color: #dc2626;
        border-radius: 0.75rem;
        font-weight: 600;
    }
}

// Form Row
.form-row {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    gap: 1rem 1.25rem;
    margin-bottom: 1rem;
    
    &:last-child {
        margin-bottom: 0;
    }
}

.field-group {
    flex: 1;
    min-width: 140px;
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    
    label {
        font-size: 0.7rem;
        font-weight: 600;
        color: #64748b;
        text-transform: uppercase;
        letter-spacing: 0.025em;
        
        .required { color: #dc2626; margin-left: 0.125rem; }
    }
    
    .field-hint {
        font-size: 0.6rem;
        color: #94a3b8;
    }
    
    :deep(.p-inputtext),
    :deep(.p-select),
    :deep(.p-inputnumber-input) {
        height: 2.35rem !important;
        font-size: 0.8rem !important;
        border-radius: 0.4rem !important;
        border: 1.5px solid #e2e8f0 !important;
        
        &:focus {
            border-color: #10b981 !important;
            box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1) !important;
        }
        
        &.p-invalid {
            border-color: #dc2626 !important;
        }
    }
}

.input-with-suffix {
    position: relative;
    
    .suffix {
        position: absolute;
        right: 0.75rem;
        top: 50%;
        transform: translateY(-50%);
        color: #64748b;
        font-weight: 600;
        font-size: 0.8rem;
        pointer-events: none;
    }
    
    :deep(.p-inputnumber-input) {
        padding-right: 2.25rem !important;
    }
}

// Status Wrapper
.status-wrapper {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    
    .status-label {
        font-size: 0.7rem;
        font-weight: 600;
        color: #64748b;
        text-transform: uppercase;
        letter-spacing: 0.025em;
    }
}

.status-chips {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.5rem;
}

.status-chip {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.4rem 0.875rem;
    background: #f8fafc;
    border: 1.5px solid #e2e8f0;
    border-radius: 2rem;
    cursor: pointer;
    transition: all 0.15s;
    
    i { color: #94a3b8; font-size: 0.8rem; }
    span { font-size: 0.75rem; font-weight: 500; color: #475569; }
    
    &:hover { background: #f1f5f9; }
    
    &.active {
        background: #ecfdf5;
        border-color: #10b981;
        i { color: #10b981; }
        span { color: #065f46; }
    }
    
    &.product-focus.active {
        background: #fef3c7;
        border-color: #f59e0b;
        i { color: #f59e0b; }
        span { color: #92400e; }
    }
}

// Stok Wrapper
.stok-wrapper {
    width: 100%;
    
    .stok-label {
        font-size: 0.7rem;
        font-weight: 600;
        color: #64748b;
        text-transform: uppercase;
        letter-spacing: 0.025em;
        margin-bottom: 0.3rem;
        display: block;
    }
}

.stok-input-group {
    display: flex;
    align-items: flex-end;
    gap: 1rem;
    flex-wrap: wrap;
    
    .stok-separator {
        color: #cbd5e1;
        font-size: 0.9rem;
        font-weight: 600;
        padding-bottom: 0.3rem;
    }
    
    .stok-visual {
        display: flex;
        align-items: center;
        gap: 0.625rem;
        margin-left: 0.5rem;
        padding-bottom: 0.3rem;
        
        .visual-bar-bg {
            width: 100px;
            height: 0.4rem;
            background: #e2e8f0;
            border-radius: 1rem;
            overflow: hidden;
            
            .visual-bar-fill {
                height: 100%;
                border-radius: 1rem;
                transition: width 0.3s;
            }
        }
        
        .visual-text {
            font-size: 0.7rem;
            font-weight: 600;
            color: #64748b;
        }
    }
}

// Margin
.margin-row {
    margin-top: 0.75rem;
}

.margin-card {
    display: inline-flex;
    align-items: center;
    gap: 0.625rem;
    padding: 0.5rem 1rem;
    border-radius: 2rem;
    font-size: 0.75rem;
    
    i { font-size: 0.875rem; }
    
    .margin-text strong {
        font-size: 0.875rem;
    }
    
    .margin-status {
        margin-left: 0.5rem;
        font-weight: 500;
    }
    
    &.danger {
        background: #fef2f2;
        color: #dc2626;
    }
    
    &.warning {
        background: #fffbeb;
        color: #d97706;
    }
    
    &.success {
        background: #ecfdf5;
        color: #065f46;
    }
}

// Harga Khusus
.harga-khusus-wrapper {
    margin-top: 1.25rem;
    padding-top: 1rem;
    border-top: 1px solid #f1f5f9;
}

.subsection-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.875rem;
    
    i { color: #10b981; font-size: 0.9rem; }
    span { font-size: 0.8rem; font-weight: 600; color: #475569; }
}

.grid-container {
    border-radius: 0.5rem;
    overflow: hidden;
    border: 1px solid #e2e8f0;
}

.harga-grid {
    :deep(.p-datatable-thead > tr > th) {
        background: #f8fafc;
        font-size: 0.7rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.025em;
        color: #64748b;
        padding: 0.625rem 0.75rem !important;
    }
    
    :deep(.p-datatable-tbody > tr > td) {
        padding: 0.625rem 0.75rem !important;
        font-size: 0.8rem;
    }
    
    .row-number {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 1.25rem;
        height: 1.25rem;
        background: #f1f5f9;
        border-radius: 0.25rem;
        font-size: 0.65rem;
        font-weight: 600;
        color: #64748b;
    }
}

// Bottom Bar
.form-bottom-bar {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: white;
    border-top: 1px solid #e2e8f0;
    box-shadow: 0 -1px 3px rgba(0, 0, 0, 0.03);
    z-index: 50;
    
    .bottom-bar-inner {
        max-width: 1400px;
        margin: 0 auto;
        padding: 0.75rem 2rem;
        display: flex;
        align-items: center;
        justify-content: space-between;
        
        .validation-error {
            display: flex;
            align-items: center;
            gap: 0.375rem;
            color: #dc2626;
            font-size: 0.75rem;
        }
        
        .bottom-actions {
            display: flex;
            gap: 0.625rem;
            margin-left: auto;
        }
    }
}

// Responsive
@media (max-width: 900px) {
    .form-header-compact {
        padding: 0.625rem 1rem;
    }
    
    .form-content-full {
        padding: 1rem;
    }
    
    .form-section {
        padding: 1rem 1.25rem;
    }
    
    .form-row {
        flex-direction: column;
        align-items: stretch;
        gap: 0.75rem;
    }
    
    .floating-quick-nav {
        right: 0.75rem;
    }
    
    .form-bottom-bar .bottom-bar-inner {
        flex-direction: column;
        gap: 0.625rem;
        padding: 0.75rem 1rem;
        
        .bottom-actions {
            width: 100%;
            
            button {
                flex: 1;
            }
        }
    }
}
</style>