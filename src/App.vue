<template>
  <main>
    <GameView />
  </main>
</template>

<script setup>
import GameView from './views/GameView.vue'
</script>

<style>
html, body, #app {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
}

body {
  background: #111;
  font-family: Arial, sans-serif;
}
</style>