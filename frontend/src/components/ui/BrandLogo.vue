<script setup lang="ts">
import logoMark from '@/assets/brand/kfupet-mark.png'
</script>

<template>
  <RouterLink class="brand" to="/#top" aria-label="KfuPet Hub 首页">
    <img class="brand-mark" :src="logoMark" alt="" />
    <span>KfuPet<em>HUB</em></span>
  </RouterLink>
</template>

<style scoped>
.brand {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-size: 19px;
  font-weight: 800;
  letter-spacing: -0.01em;
}

.brand-mark {
  width: 34px;
  height: 34px;
  border-radius: 11px;
  object-fit: cover;
  background: #fff;
  border: 1px solid rgba(234, 225, 213, 0.9);
  box-shadow: 0 6px 14px -8px rgba(29, 23, 38, 0.35);
}

.brand em {
  font-style: normal;
  font-size: 11px;
  letter-spacing: 0.16em;
  color: #a79c90;
  font-weight: 700;
  margin-left: 2px;
  transform: translateY(1px);
}

@media (max-width: 640px) {
  .brand {
    font-size: 17px;
  }
}
</style>
