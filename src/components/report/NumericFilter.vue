<template>
    <div class="numeric-filter">
        <div class="filter-header">
            <span>Filter {{ label }}</span>
            <Button icon="pi pi-times" text rounded size="small" @click="$emit('close')" />
        </div>
        
        <div class="filter-body">
            <div class="filter-row">
                <label>Operator</label>
                <Select v-model="selectedOperator" :options="operators" optionLabel="label" optionValue="value" size="small" class="w-full" @change="onChange" />
            </div>
            
            <div class="filter-row" v-if="selectedOperator !== 'between'">
                <label>Nilai</label>
                <InputNumber v-model="value1" mode="currency" currency="IDR" locale="id-ID" size="small" class="w-full" @update:modelValue="onChange" />
            </div>
            
            <div class="filter-row" v-if="selectedOperator === 'between'">
                <label>Dari</label>
                <InputNumber v-model="value1" mode="currency" currency="IDR" locale="id-ID" size="small" class="w-full" @update:modelValue="onChange" />
            </div>
            
            <div class="filter-row" v-if="selectedOperator === 'between'">
                <label>Sampai</label>
                <InputNumber v-model="value2" mode="currency" currency="IDR" locale="id-ID" size="small" class="w-full" @update:modelValue="onChange" />
            </div>
        </div>
        
        <div class="filter-footer">
            <Button label="Clear" text size="small" @click="clear" />
            <Button label="Apply" severity="primary" size="small" @click="apply" />
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
    label: string
    currentFilter?: any
}>()

const emit = defineEmits<{
    (e: 'apply', filter: any): void
    (e: 'close'): void
}>()

const operators = [
    { label: 'Equals (=)', value: 'eq' },
    { label: 'Not Equals (≠)', value: 'neq' },
    { label: 'Greater Than (>)', value: 'gt' },
    { label: 'Greater or Equal (≥)', value: 'gte' },
    { label: 'Less Than (<)', value: 'lt' },
    { label: 'Less or Equal (≤)', value: 'lte' },
    { label: 'Between', value: 'between' },
]

const selectedOperator = ref(props.currentFilter?.operator || 'eq')
const value1 = ref(props.currentFilter?.value1 || null)
const value2 = ref(props.currentFilter?.value2 || null)

const onChange = () => {
    // Auto-apply bisa ditambahkan
}

const clear = () => {
    selectedOperator.value = 'eq'
    value1.value = null
    value2.value = null
    emit('apply', null)
    emit('close')
}

const apply = () => {
    if (value1.value === null || value1.value === undefined) {
        emit('apply', null)
        emit('close')
        return
    }
    
    const filter: any = {
        operator: selectedOperator.value,
        value1: value1.value,
        field: props.label,
        type: 'numeric'
    }
    
    if (selectedOperator.value === 'between') {
        filter.value2 = value2.value || 0
    }
    
    emit('apply', filter)
    emit('close')
}
</script>

<style lang="scss" scoped>
.numeric-filter {
    width: 260px;
    padding: 0;
    
    .filter-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0.75rem 1rem;
        border-bottom: 1px solid var(--surface-border);
        font-weight: 600;
        font-size: 0.875rem;
    }
    
    .filter-body {
        padding: 1rem;
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
    }
    
    .filter-row {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        
        label {
            font-size: 0.7rem;
            font-weight: 600;
            color: var(--text-color-secondary);
            text-transform: uppercase;
        }
    }
    
    .filter-footer {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0.75rem 1rem;
        border-top: 1px solid var(--surface-border);
    }
}
</style>