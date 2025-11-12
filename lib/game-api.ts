// Game API client functions for interacting with backend
import { db } from './firebase'
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore'

type Player = {
  id: string
  name: string
  score: number
  answers: { questionId: string; answeredAt: number; correct: boolean }[]
}

type GameState = {
  currentQuestionIndex: number
  questionStartTime: number
  status: "lobby" | "playing" | "finished"
  players: Player[]
  quiz?: any
}

export class GameAPI {
  private static async fetchAPI(endpoint: string, options?: RequestInit) {
    try {
      const response = await fetch(endpoint, {
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        ...options,
      })
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`)
      }
      
      return await response.json()
    } catch (error) {
      console.error('API request failed:', error)
      throw error
    }
  }

  // Direct Firestore operations (client-side)
  static async createGameFirestore(gamePin: string, quiz: any): Promise<{ success: boolean; gamePin: string }> {
    try {
      console.log(`Creating game in Firestore with PIN: ${gamePin}`)
      
      const gameState = {
        currentQuestionIndex: 0,
        questionStartTime: Date.now(),
        status: 'lobby' as const,
        players: [],
        quiz,
        createdAt: Date.now(),
      }
      
      console.log('Game state to be created:', gameState)
      
      await setDoc(doc(db, 'games', gamePin), gameState)
      
      // Verify the document was created by reading it back
      console.log('Verifying game creation...')
      const verification = await this.getGameFirestore(gamePin)
      if (!verification) {
        throw new Error('Game creation verification failed')
      }
      
      console.log('Game successfully created and verified in Firestore')
      return { success: true, gamePin }
    } catch (error) {
      console.error('Firestore create failed:', error)
      throw error
    }
  }

  static async getGameFirestore(gamePin: string): Promise<GameState | null> {
    try {
      console.log(`Fetching game from Firestore with PIN: ${gamePin}`)
      const docRef = doc(db, 'games', gamePin)
      const docSnap = await getDoc(docRef)
      
      console.log('Document exists:', docSnap.exists())
      if (docSnap.exists()) {
        const data = docSnap.data() as GameState
        console.log('Document data:', data)
        return data
      }
      console.log('Document does not exist')
      return null
    } catch (error) {
      console.error('Firestore get failed:', error)
      throw error
    }
  }

  static async joinGameFirestore(gamePin: string, playerName: string): Promise<{ success: boolean; playerId: string; player: Player }> {
    try {
      const playerId = Date.now().toString() + Math.random().toString(36).substr(2, 9)
      const newPlayer: Player = {
        id: playerId,
        name: playerName,
        score: 0,
        answers: [],
      }

      const gameRef = doc(db, 'games', gamePin)
      
      // First get the current game state
      const docSnap = await getDoc(gameRef)
      if (!docSnap.exists()) {
        throw new Error('Game not found')
      }
      
      const gameData = docSnap.data()
      const currentPlayers = gameData.players || []
      
      // Check if player already joined
      const existingPlayer = currentPlayers.find((p: Player) => p.name === playerName)
      if (existingPlayer) {
        return { success: true, playerId: existingPlayer.id, player: existingPlayer }
      }
      
      // Add new player to the array
      const updatedPlayers = [...currentPlayers, newPlayer]
      
      await updateDoc(gameRef, {
        players: updatedPlayers
      })

      return { success: true, playerId, player: newPlayer }
    } catch (error) {
      console.error('Firestore join failed:', error)
      throw error
    }
  }

  static async updateGameStateFirestore(
    gamePin: string,
    updates: { status?: string; currentQuestionIndex?: number; questionStartTime?: number }
  ): Promise<{ success: boolean }> {
    try {
      console.log(`Updating game state for PIN ${gamePin}:`, updates)
      const gameRef = doc(db, 'games', gamePin)
      
      const updateData = {
        ...updates,
        updatedAt: Date.now(),
      }
      
      console.log('Update data being sent to Firestore:', updateData)
      await updateDoc(gameRef, updateData)
      
      // Verify the update worked
      console.log('Verifying game state update...')
      const verification = await this.getGameFirestore(gamePin)
      console.log('Game state after update:', verification)
      
      return { success: true }
    } catch (error) {
      console.error('Firestore update failed:', error)
      throw error
    }
  }

  static async createGame(gamePin: string, quiz: any): Promise<{ success: boolean; gamePin: string }> {
    return await this.fetchAPI('/api/games', {
      method: 'POST',
      body: JSON.stringify({ gamePin, quiz }),
    })
  }

  static async getGame(gamePin: string): Promise<GameState> {
    return await this.fetchAPI(`/api/games?pin=${gamePin}`)
  }

  static async joinGame(gamePin: string, playerName: string): Promise<{ success: boolean; playerId: string; player: Player }> {
    return await this.fetchAPI('/api/players', {
      method: 'POST',
      body: JSON.stringify({ gamePin, player: { name: playerName } }),
    })
  }

  static async submitAnswer(gamePin: string, playerId: string, questionId: string, answer: number): Promise<{ success: boolean }> {
    return await this.fetchAPI('/api/players', {
      method: 'PATCH',
      body: JSON.stringify({ gamePin, playerId, questionId, answer }),
    })
  }

  static async updateGameState(
    gamePin: string,
    updates: { status?: string; currentQuestionIndex?: number; questionStartTime?: number }
  ): Promise<{ success: boolean }> {
    return await this.fetchAPI('/api/game-state', {
      method: 'PATCH',
      body: JSON.stringify({ gamePin, ...updates }),
    })
  }

  // Fallback methods for when API is not available
  static createGameLocal(gamePin: string, quiz: any) {
    const gameState = {
      currentQuestionIndex: 0,
      questionStartTime: Date.now(),
      status: "lobby" as const,
      players: [],
      quiz,
    }
    sessionStorage.setItem(`game_${gamePin}`, JSON.stringify(gameState))
    return { success: true, gamePin }
  }

  static getGameLocal(gamePin: string): GameState | null {
    const stored = sessionStorage.getItem(`game_${gamePin}`)
    return stored ? JSON.parse(stored) : null
  }

  static joinGameLocal(gamePin: string, playerName: string) {
    const gameState = this.getGameLocal(gamePin)
    if (!gameState) throw new Error('Game not found')

    const playerId = Date.now().toString() + Math.random().toString(36).substr(2, 9)
    const newPlayer: Player = {
      id: playerId,
      name: playerName,
      score: 0,
      answers: [],
    }

    gameState.players.push(newPlayer)
    sessionStorage.setItem(`game_${gamePin}`, JSON.stringify(gameState))
    
    return { success: true, playerId, player: newPlayer }
  }

  static updateGameStateLocal(gamePin: string, updates: Partial<GameState>) {
    const gameState = this.getGameLocal(gamePin)
    if (!gameState) throw new Error('Game not found')

    Object.assign(gameState, updates)
    sessionStorage.setItem(`game_${gamePin}`, JSON.stringify(gameState))
    
    return { success: true }
  }
}

// Enhanced quiz store with Firebase integration
export class EnhancedQuizStore {
  private useFirestore: boolean = true

  constructor() {
    // Check if we're in the browser and Firebase is available
    this.useFirestore = typeof window !== 'undefined'
  }

  async createGame(gamePin: string, quiz: any) {
    try {
      if (this.useFirestore) {
        // Try Firestore first
        return await GameAPI.createGameFirestore(gamePin, quiz)
      }
    } catch (error) {
      console.warn('Firestore unavailable, trying API fallback:', error)
      
      try {
        // Try API as fallback
        return await GameAPI.createGame(gamePin, quiz)
      } catch (apiError) {
        console.warn('API also unavailable, using local storage:', apiError)
        // Final fallback to local storage
        return GameAPI.createGameLocal(gamePin, quiz)
      }
    }
    
    return GameAPI.createGameLocal(gamePin, quiz)
  }

  async getGame(gamePin: string) {
    console.log(`EnhancedQuizStore.getGame called with PIN: ${gamePin}`)
    
    try {
      if (this.useFirestore) {
        console.log('Trying Firestore first...')
        // Try Firestore first
        const result = await GameAPI.getGameFirestore(gamePin)
        if (result) {
          console.log('Found game in Firestore:', result)
          return result
        }
        console.log('Game not found in Firestore, trying API fallback...')
      }
    } catch (error) {
      console.warn('Firestore unavailable, trying API fallback:', error)
    }

    try {
      // Try API as fallback
      console.log('Trying API fallback...')
      const result = await GameAPI.getGame(gamePin)
      console.log('API result:', result)
      return result
    } catch (apiError) {
      console.warn('API also unavailable, using local storage:', apiError)
      // Final fallback to local storage
      console.log('Trying local storage fallback...')
      const result = GameAPI.getGameLocal(gamePin)
      console.log('Local storage result:', result)
      return result
    }
  }

  async joinGame(gamePin: string, playerName: string) {
    try {
      if (this.useFirestore) {
        // Try Firestore first
        return await GameAPI.joinGameFirestore(gamePin, playerName)
      }
    } catch (error) {
      console.warn('Firestore unavailable, trying API fallback:', error)
      
      try {
        // Try API as fallback
        return await GameAPI.joinGame(gamePin, playerName)
      } catch (apiError) {
        console.warn('API also unavailable, using local storage:', apiError)
        // Final fallback to local storage
        return GameAPI.joinGameLocal(gamePin, playerName)
      }
    }
    
    return GameAPI.joinGameLocal(gamePin, playerName)
  }

  async updateGameState(gamePin: string, updates: any) {
    console.log(`EnhancedQuizStore.updateGameState called with PIN: ${gamePin}`, updates)
    
    try {
      if (this.useFirestore) {
        console.log('Trying Firestore update...')
        // Try Firestore first
        const result = await GameAPI.updateGameStateFirestore(gamePin, updates)
        console.log('Firestore update successful:', result)
        return result
      }
    } catch (error) {
      console.warn('Firestore unavailable, trying API fallback:', error)
      
      try {
        // Try API as fallback
        console.log('Trying API update...')
        const result = await GameAPI.updateGameState(gamePin, updates)
        console.log('API update successful:', result)
        return result
      } catch (apiError) {
        console.warn('API also unavailable, using local storage:', apiError)
        // Final fallback to local storage
        console.log('Using local storage update...')
        const result = GameAPI.updateGameStateLocal(gamePin, updates)
        console.log('Local storage update successful:', result)
        return result
      }
    }
    
    console.log('Fallback to local storage update...')
    const result = GameAPI.updateGameStateLocal(gamePin, updates)
    console.log('Local storage fallback successful:', result)
    return result
  }
}

export const enhancedQuizStore = new EnhancedQuizStore()