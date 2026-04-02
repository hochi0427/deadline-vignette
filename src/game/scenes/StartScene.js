import Phaser from 'phaser'

export default class StartScene extends Phaser.Scene {
  constructor() {
    super('StartScene')
  }

  preload() {
    this.load.image('Write_Homework', 'images/Write_Homework.png')
  }

  create() {
    const homeworkTexture = 'Write_Homework'

    this.cameras.main.setBackgroundColor('#387dc7')

    this.add.text(640, 250, 'Deadline Simulator', {
      fontSize: '48px',
      color: '#ffffff'
    }).setOrigin(0.5)

    this.add.text(640, 350, 'Press SPACE to Start', {
      fontSize: '24px',
      color: '#aaaaaa'
    }).setOrigin(0.5)

    this.add.image(640, 150, homeworkTexture)
      .setScale(0.5)
      .setOrigin(0.4)

    // 👇 監聽 SPACE
    this.input.keyboard.once('keydown-SPACE', () => {
      this.scene.start('GameScene')
    })
  }
}
