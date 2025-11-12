// Game API client functions for interacting with backend
import { db } from './firebase'
import { doc, setDoc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore'

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
      const gameState = {
        currentQuestionIndex: 0,
        questionStartTime: Date.now(),
        status: 'lobby' as const,
        players: [],
        quiz,
        createdAt: Date.now(),
      }
      
      await setDoc(doc(db, 'games', gamePin), gameState)
      return { success: true, gamePin }
    } catch (error) {
      console.error('Firestore create failed:', error)
      throw error
    }
  }

  static async getGameFirestore(gamePin: string): Promise<GameState | null> {
    try {
      const docRef = doc(db, 'games', gamePin)
      const docSnap = await getDoc(docRef)
      
      if (docSnap.exists()) {
        return docSnap.data() as GameState
      }
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
      await updateDoc(gameRef, {
        players: arrayUnion(newPlayer)
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
      const gameRef = doc(db, 'games', gamePin)
      await updateDoc(gameRef, {
        ...updates,
        updatedAt: Date.now(),
      })
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
    try {
      if (this.useFirestore) {
        // Try Firestore first
        const result = await GameAPI.getGameFirestore(gamePin)
        if (result) return result
      }
    } catch (error) {
      console.warn('Firestore unavailable, trying API fallback:', error)
    }

    try {
      // Try API as fallback
      return await GameAPI.getGame(gamePin)
    } catch (apiError) {
      console.warn('API also unavailable, using local storage:', apiError)
      // Final fallback to local storage
      return GameAPI.getGameLocal(gamePin)
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
    try {
      if (this.useFirestore) {
        // Try Firestore first
        return await GameAPI.updateGameStateFirestore(gamePin, updates)
      }
    } catch (error) {
      console.warn('Firestore unavailable, trying API fallback:', error)
      
      try {
        // Try API as fallback
        return await GameAPI.updateGameState(gamePin, updates)
      } catch (apiError) {
        console.warn('API also unavailable, using local storage:', apiError)
        // Final fallback to local storage
        return GameAPI.updateGameStateLocal(gamePin, updates)
      }
    }
    
    return GameAPI.updateGameStateLocal(gamePin, updates)
  }
}

export const enhancedQuizStore = new EnhancedQuizStore()