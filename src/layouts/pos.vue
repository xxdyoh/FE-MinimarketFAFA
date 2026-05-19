<template>
    <div class="pos-layout">
        <slot />
    </div>
    <Toast position="top-right" />
</template>

<style scoped>
.pos-layout {
    width: 100vw;
    height: 100vh;
    overflow: hidden;
    background: #f8fafc;
}
</style>