<template>
  <div class="game-page">
    <div ref="gameContainer" class="game-container"></div>
  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, ref } from 'vue'
import Phaser from 'phaser'
import StartScene from '../game/scenes/StartScene'
import GameScene from '../game/scenes/GameScene'
import EndScene from '../game/scenes/EndScene'

const gameContainer = ref(null)
let game = null

onMounted(() => {
  game = new Phaser.Game({
    type: Phaser.AUTO,
    width: 1280,
    height: 720,
    parent: gameContainer.value,
    backgroundColor: '#111111',
    scene: [StartScene, GameScene, EndScene],
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH
    }
  })
})

onBeforeUnmount(() => {
  if (game) {
    game.destroy(true)
    game = null
  }
})
</script>

<style scoped>
.game-page {
  width: 100vw;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
}

.game-container {
  width: 100%;
  height: 100%;
}
</style>