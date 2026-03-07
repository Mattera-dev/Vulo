<template>
  <div class="min-h-screen bg-background flex flex-col">
    <NavBar />
    <main class="flex-1 min-h-full">
      <RouterView />
    </main>
  </div>
</template>

<script setup lang="ts">
import { RouterView } from 'vue-router'
import NavBar from '@/components/navbar/NavBar.vue'
</script>
