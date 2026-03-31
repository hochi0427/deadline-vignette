import Phaser from 'phaser'

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene')
  }

  preload() {
    this.load.image('handPen', '/images/hand-pen.png')
  }

  create() {
    // ====== BACKGROUND ======
    this.cameras.main.setBackgroundColor('#f5f1e8')

    // ====== STATE (遊戲核心數據) ======
    this.currentText = ''        // 玩家目前打的所有文字
    this.charCount = 0           // 字數
    this.maxChars = 1000         // 勝利條件
    this.timeLeft = 90           // 剩餘時間（秒）

    // ====== UI ELEMENTS ======

    // 白紙（主要輸入區）
    this.paper = this.add.rectangle(640, 360, 700, 500, 0xffffff)
      .setStrokeStyle(3, 0x222222)

    // 手與筆（改成單一 PNG 圖片）
    this.handPen = this.add.image(980, 200, 'handPen')
      .setOrigin(0.15, 0.75)
      .setScale(0.6)
      .setDepth(10)

    // 手寫位置參數
    this.writeStartX = 320
    this.writeStartY = 180
    this.maxCharsPerLine = 42
    this.lineHeight = 28
    this.handBaseOffsetX = 12
    this.handBaseOffsetY = 10

    // 顯示玩家打的文字
    this.textDisplay = this.add.text(320, 180, '', {
      fontSize: '20px',
      color: '#222',
      wordWrap: { width: 600, useAdvancedWrap: true }
    }).setOrigin(0, 0)           // 從左上開始寫（像紙）

    // 字數計數器（左上）
    this.counterText = this.add.text(40, 40, '0 / 1000', {
      fontSize: '24px',
      color: '#222'
    })

    // 倒數時間（右上）
    this.timerText = this.add.text(1000, 40, '10 PM', {
      fontSize: '24px',
      color: '#222'
    })
    this.updateTimePhase()

    // ====== TIMER 系統 ======
    this.timer = this.time.addEvent({
      delay: 1000,   // 每秒觸發一次
      loop: true,
      callback: () => {
        this.timeLeft--
        this.updateTimePhase()

        // 時間到 → 失敗
        if (this.timeLeft <= 0) {
          this.endGame(false)
        }
      }
    })

    // ====== KEYBOARD INPUT（核心玩法） ======
    this.input.keyboard.on('keydown', (event) => {
      // 如果時間結束就不再接受輸入
      if (this.timeLeft <= 0) return

      // ===== Backspace（刪字） =====
      if (event.key === 'Backspace') {
        if (this.currentText.length > 0) {
          this.currentText = this.currentText.slice(0, -1)
          this.charCount--
        }
      }
      // ===== 合法輸入（字母、數字、標點） =====
      else if (/^[a-zA-Z0-9 .,!?]$/.test(event.key)) {
        if (this.charCount < this.maxChars) {
          this.currentText += event.key
          this.charCount++
        }
      }

      // ===== 更新畫面 =====
      this.updateWritingDisplay()
      this.counterText.setText(`${this.charCount} / ${this.maxChars}`)

      // ===== 勝利條件 =====
      if (this.charCount >= this.maxChars) {
        this.endGame(true)
      }
    })

    this.updateWritingDisplay()
  }

  // ====== UPDATE WRITING DISPLAY（更新紙面與手的位置） ======
  updateWritingDisplay() {
    this.textDisplay.setText(this.getVisibleDisplayText(this.currentText))
    this.updateHandPosition()
  }

  // ====== UPDATE HAND POSITION（讓手跟著目前輸入位置移動） ======
  updateHandPosition() {
    const lines = this.formatDisplayText(this.currentText)
    const visibleLines = lines.slice(-14)
    const currentLineText = visibleLines[visibleLines.length - 1] || ''
    const currentLineIndex = visibleLines.length - 1

    const handX = this.writeStartX + (currentLineText.length * 14) + this.handBaseOffsetX
    const handY = this.writeStartY + (currentLineIndex * this.lineHeight) + this.handBaseOffsetY

    this.tweens.killTweensOf(this.handPen)

    this.handPen.setPosition(handX, handY)

    // 每次打字時做一個小小的寫字抖動
    this.tweens.add({
      targets: this.handPen,
      x: handX + 2,
      y: handY + 5,
      yoyo: true,
      duration: 45,
      repeat: 1,
      ease: 'Sine.easeInOut'
    })
  }

  // ====== FORMAT DISPLAY TEXT（先切成多行） ======
  formatDisplayText(text) {
    const maxCharsPerLine = this.maxCharsPerLine
    const lines = []

    for (let i = 0; i < text.length; i += maxCharsPerLine) {
      lines.push(text.slice(i, i + maxCharsPerLine))
    }

    return lines
  }

  // ====== GET VISIBLE DISPLAY TEXT（只顯示最近幾行，避免超出白紙） ======
  getVisibleDisplayText(text) {
    const maxVisibleLines = 14
    const lines = this.formatDisplayText(text)
    const visibleLines = lines.slice(-maxVisibleLines)

    return visibleLines.join('\n')
  }

  updateTimePhase() {
    if (this.timeLeft > 60) {
      this.timerText.setText('10 PM')
      this.cameras.main.setBackgroundColor('#f5f1e8')
    } 
    else if (this.timeLeft > 30) {
      this.timerText.setText('2 AM')
      this.cameras.main.setBackgroundColor('#dcd6c8')
    } 
    else {
      this.timerText.setText('5 AM')
      this.cameras.main.setBackgroundColor('#c9c3b6')
    }
  }

  // ====== END GAME（結束遊戲） ======
  endGame(success) {
    this.timer.remove()

    if (success) {
      this.scene.start('EndScene', { result: 'success', score: 60 })
    } else {
      this.scene.start('EndScene', { result: 'fail', score: 0 })
    }
  }
}
