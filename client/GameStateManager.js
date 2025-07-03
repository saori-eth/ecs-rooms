import { IdentityManager } from './IdentityManager.js'

export class GameStateManager {
  constructor() {
    this.currentState = 'menu'
    this.onStateChange = null
    this.identityManager = new IdentityManager()
    
    this.mainMenu = document.getElementById('mainMenu')
    this.info = document.getElementById('info')
    this.roomInfo = document.getElementById('roomInfo')
    this.playButton = document.getElementById('playButton')
    this.connectionStatus = document.getElementById('connectionStatus')
    this.roomIdSpan = document.getElementById('roomId')
    this.playerCountSpan = document.getElementById('playerCount')
    this.playerNameInput = document.getElementById('playerName')
    this.playerColorSelect = document.getElementById('playerColor')
    this.colorPreview = document.getElementById('colorPreview')
    
    this.initializeUI()
  }
  
  initializeUI() {
    const identity = this.identityManager.getIdentity()
    this.playerNameInput.value = identity.name
    this.playerColorSelect.value = identity.color
    this.updateColorPreview()
    
    this.playerColorSelect.addEventListener('change', () => {
      this.updateColorPreview()
    })
    
    this.playButton.addEventListener('click', () => {
      const name = this.playerNameInput.value.trim() || `Player${Math.floor(Math.random() * 1000)}`
      const color = this.playerColorSelect.value
      this.identityManager.saveIdentity(name, color)
    })
  }
  
  updateColorPreview() {
    this.colorPreview.style.backgroundColor = this.playerColorSelect.value
  }
  
  setState(newState) {
    this.currentState = newState
    
    switch (newState) {
      case 'menu':
        this.mainMenu.style.display = 'block'
        this.info.style.display = 'none'
        this.roomInfo.style.display = 'none'
        break
        
      case 'playing':
        this.mainMenu.style.display = 'none'
        this.info.style.display = 'block'
        this.roomInfo.style.display = 'block'
        break
    }
    
    if (this.onStateChange) {
      this.onStateChange(newState)
    }
  }
  
  setConnectionStatus(status) {
    this.connectionStatus.textContent = status
  }
  
  enablePlayButton(enabled) {
    this.playButton.disabled = !enabled
  }
  
  updateRoomInfo(roomId, playerCount, maxPlayers) {
    this.roomIdSpan.textContent = roomId || '-'
    this.playerCountSpan.textContent = `${playerCount}/${maxPlayers}`
  }
  
  getPlayerIdentity() {
    return this.identityManager.getIdentity()
  }
}