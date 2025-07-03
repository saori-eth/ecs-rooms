export class GameStateManager {
  constructor() {
    this.currentState = 'menu'
    this.onStateChange = null
    
    this.mainMenu = document.getElementById('mainMenu')
    this.info = document.getElementById('info')
    this.roomInfo = document.getElementById('roomInfo')
    this.playButton = document.getElementById('playButton')
    this.connectionStatus = document.getElementById('connectionStatus')
    this.roomIdSpan = document.getElementById('roomId')
    this.playerCountSpan = document.getElementById('playerCount')
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
}