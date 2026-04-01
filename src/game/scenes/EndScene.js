import Phaser from 'phaser'

export default class EndScene extends Phaser.Scene {
  constructor() {
    super('EndScene')
  }

  preload() {
    this.load.image('happyTeacher', 'images/happy-teacher.png')
    this.load.image('angryTeacher', 'images/angry-teacher.png')
  }

  init(data) {
    this.result = data.result || 'fail'
    this.score = data.score || 0
  }

  create() {
    const isSuccess = this.result === 'success'
    const teacherTexture = isSuccess ? 'happyTeacher' : 'angryTeacher'

    this.cameras.main.setBackgroundColor(isSuccess ? '#dff5e1' : '#e91818')

    this.add.image(640, 150, teacherTexture)
      .setScale(0.5)
      .setOrigin(0.4)

    this.add.text(640, 290, isSuccess ? 'Success' : 'Fail', {
      fontSize: '56px',
      color: isSuccess ? '#1f5c2f' : '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5)

    this.add.text(640, 380, `Score: ${this.score}`, {
      fontSize: '32px',
      color: isSuccess ? '#1f5c2f' : '#dddddd'
    }).setOrigin(0.5)

    const buttonWidth = 240
    const buttonHeight = 64
    const buttonX = 640
    const buttonY = 500

    const restartButton = this.add.rectangle(buttonX, buttonY, buttonWidth, buttonHeight, isSuccess ? 0x2f6f40 : 0x555555)
      .setStrokeStyle(2, 0xffffff)
      .setInteractive({ useHandCursor: true })

    const buttonText = this.add.text(buttonX, buttonY, 'Restart', {
      fontSize: '28px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5)

    restartButton.on('pointerover', () => {
      restartButton.setScale(1.05)
      buttonText.setScale(1.05)
    })

    restartButton.on('pointerout', () => {
      restartButton.setScale(1)
      buttonText.setScale(1)
    })

    restartButton.on('pointerdown', () => {
      this.scene.start('StartScene')
    })
  }
}
