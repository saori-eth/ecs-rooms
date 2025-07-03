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
    this.playerAvatarSelect = document.getElementById('playerAvatar')
    
    this.initializeUI()
  }
  
  initializeUI() {
    const identity = this.identityManager.getIdentity()
    this.playerNameInput.value = identity.name
    this.playerAvatarSelect.value = identity.avatarId || 'BitcoinGuy'
    
    this.playButton.addEventListener('click', () => {
      const name = this.playerNameInput.value.trim() || `Player${Math.floor(Math.random() * 1000)}`
      const avatarId = this.playerAvatarSelect.value
      this.identityManager.saveIdentity(name, avatarId)
    })
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