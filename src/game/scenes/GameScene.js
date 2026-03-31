import Phaser from 'phaser'

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene')
  }

  preload() {
    this.load.image('handPen', 'images/hand-pen.png')
    this.load.audio('bgMusic', 'audio/bg-music.mp3')
  }

  create() {
    // ====== BACKGROUND ======
    this.cameras.main.setBackgroundColor('#f5f1e8')

    // ====== AUDIO ======
    this.bgMusic = this.sound.add('bgMusic', {
      loop: true,
      volume: 0.45,
      rate: 1
    })

    if (!this.bgMusic.isPlaying) {
      this.bgMusic.play()
    }

    // ====== STATE (遊戲核心數據) ======
    this.currentText = ''        // 玩家目前打的所有文字
    this.charCount = 0           // 字數
    this.maxChars = 1000         // 勝利條件
    this.timeLeft = 90           // 剩餘時間（秒）
    this.baseScore = 60          // 基本分
    this.bonusScore = 0          // 額外加分
    this.completedBonusCount = 0 // 成功打出的 bonus sentence 數量

    // Bonus sentence pool（之後可以自由改成你自己的10句）
    this.bonusSentences = [
      'The deadline is getting closer every minute.',
      'I need to finish this report before sunrise.',
      'My thoughts are running faster than my typing.',
      'Every sentence feels heavier after midnight.',
      'The screen is bright but my brain is fading.',
      'I keep rewriting the same paragraph again.',
      'Coffee can help but not fix everything tonight.',
      'This report has to make sense by the end.',
      'I am tired but I still need to keep typing.',
      'The night feels longer when the deadline is near.'
    ]
    this.currentBonusSentence = ''
    this.completedSentences = new Set()

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

    // Bonus sentence 顯示區（上方一次只顯示一句）
    this.bonusLabelText = this.add.text(640, 36, 'Reference sentence', {
      fontSize: '16px',
      color: '#555'
    }).setOrigin(0.5)

    this.bonusSentenceText = this.add.text(640, 62, '', {
      fontSize: '18px',
      color: '#8a3d1f',
      wordWrap: { width: 700, useAdvancedWrap: true },
      align: 'center'
    }).setOrigin(0.5, 0)

    this.bonusScoreText = this.add.text(40, 74, 'Bonus: +0', {
      fontSize: '20px',
      color: '#8a3d1f'
    })

    // 倒數時間（右上）
    this.timerText = this.add.text(1000, 40, '10 PM', {
      fontSize: '24px',
      color: '#222'
    })
    this.updateTimePhase()
    this.pickNextBonusSentence()
    // 視覺模糊效果計時器（依時間階段控制觸發頻率）
    this.blurIntervalEvent = null
    this.currentBlurPhase = ''

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

    // ====== BONUS SENTENCE TIMER（每20秒換一句） ======
    this.bonusSentenceTimer = this.time.addEvent({
      delay: 20000,
      loop: true,
      callback: () => {
        this.pickNextBonusSentence()
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
      this.checkBonusSentenceMatch()

      // ===== 勝利條件 =====
      if (this.charCount >= this.maxChars) {
        this.endGame(true)
      }
    })

    this.updateWritingDisplay()
  }

  // ====== PICK NEXT BONUS SENTENCE（隨機選下一句） ======
  pickNextBonusSentence() {
    const availableSentences = this.bonusSentences.filter(
      sentence => sentence !== this.currentBonusSentence
    )

    const pool = availableSentences.length > 0 ? availableSentences : this.bonusSentences
    const randomIndex = Phaser.Math.Between(0, pool.length - 1)
    this.currentBonusSentence = pool[randomIndex]

    this.bonusSentenceText.setText(this.currentBonusSentence)
  }

  // ====== CHECK BONUS SENTENCE MATCH（檢查是否打出 bonus sentence） ======
  checkBonusSentenceMatch() {
    if (!this.currentBonusSentence) return

    if (
      this.currentText.includes(this.currentBonusSentence) &&
      !this.completedSentences.has(this.currentBonusSentence)
    ) {
      this.completedSentences.add(this.currentBonusSentence)
      this.completedBonusCount++
      this.bonusScore = this.completedBonusCount * 10
      this.bonusScoreText.setText(`Bonus: +${this.bonusScore}`)

      this.pickNextBonusSentence()

      if (this.bonusSentenceTimer) {
        this.bonusSentenceTimer.reset({
          delay: 20000,
          loop: true,
          callback: () => {
            this.pickNextBonusSentence()
          }
        })
      }
    }
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

      if (this.bgMusic) {
        this.bgMusic.setRate(1)
      }

      this.setBlurPhase('10PM')
    }
    else if (this.timeLeft > 30) {
      this.timerText.setText('2 AM')
      this.cameras.main.setBackgroundColor('#dcd6c8')

      if (this.bgMusic) {
        this.bgMusic.setRate(1.5)
      }

      this.setBlurPhase('2AM')
    }
    else {
      this.timerText.setText('5 AM')
      this.cameras.main.setBackgroundColor('#c9c3b6')

      if (this.bgMusic) {
        this.bgMusic.setRate(2)
      }

      this.setBlurPhase('5AM')
    }
  }

  // ====== SET BLUR PHASE（依階段設定模糊觸發頻率） ======
  setBlurPhase(phase) {
    if (this.currentBlurPhase === phase) return

    this.currentBlurPhase = phase

    if (this.blurIntervalEvent) {
      this.blurIntervalEvent.remove()
      this.blurIntervalEvent = null
    }

    if (phase === '10PM') {
      return
    }

    const delay = phase === '2AM' ? 15000 : 10000

    this.blurIntervalEvent = this.time.addEvent({
      delay,
      loop: true,
      callback: () => {
        this.triggerBlurEffect()
      }
    })
  }

  // ====== TRIGGER BLUR EFFECT（短暫失焦感） ======
  triggerBlurEffect() {
    const camera = this.cameras.main
    const isLatePhase = this.currentBlurPhase === '5AM'

    // 更強的晃動（晚期更不穩）
    camera.shake(isLatePhase ? 360 : 300, isLatePhase ? 0.0048 : 0.003)

    // 更明顯的失焦（zoom 放大更多，持續更久）
    this.tweens.add({
      targets: camera,
      zoom: isLatePhase ? 1.04 : 1.03,
      duration: isLatePhase ? 320 : 260,
      yoyo: true,
      ease: 'Sine.easeInOut'
    })

    // 更明顯的視線暗掉（alpha 降低更多，持續更久）
    this.tweens.add({
      targets: camera,
      alpha: isLatePhase ? 0.78 : 0.84,
      duration: isLatePhase ? 300 : 240,
      yoyo: true,
      ease: 'Sine.easeInOut'
    })
  }

  // ====== END GAME（結束遊戲） ======
  endGame(success) {
    this.timer.remove()
    if (this.blurIntervalEvent) {
      this.blurIntervalEvent.remove()
    }

    if (this.bgMusic) {
      this.bgMusic.stop()
    }

    if (this.bonusSentenceTimer) {
      this.bonusSentenceTimer.remove()
    }

    if (success) {
      const totalScore = this.baseScore + this.bonusScore
      this.scene.start('EndScene', {
        result: 'success',
        score: totalScore
      })
    } else {
      this.scene.start('EndScene', { result: 'fail', score: 0 })
    }
  }
}
