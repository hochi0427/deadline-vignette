import Phaser from 'phaser'

export default class StartScene extends Phaser.Scene {
  constructor() {
    super('StartScene')
  }

  create() {
    this.cameras.main.setBackgroundColor('#111')

    this.add.text(640, 250, 'Deadline Simulator', {
      fontSize: '48px',
      color: '#ffffff'
    }).setOrigin(0.5)

    this.add.text(640, 350, 'Press SPACE to Start', {
      fontSize: '24px',
      color: '#aaaaaa'
    }).setOrigin(0.5)

    // 👇 監聽 SPACE
    this.input.keyboard.once('keydown-SPACE', () => {
      this.scene.start('GameScene')
    })
  }
}