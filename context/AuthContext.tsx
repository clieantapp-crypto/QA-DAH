"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { signInWithEmailAndPassword, signOut, onAuthStateChanged, type User as FirebaseUser } from "firebase/auth"
import { auth } from "@/lib/firebase"

interface AuthContextType {
  user: FirebaseUser | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth!, (user: any) => {
      setUser(user)
      setIsLoading(false)
    })

    return unsubscribe
  }, [])

  const login = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth!, email, password)
      return { success: true }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Login failed. Please check your credentials.",
      }
    }
  }

  const logout = async () => {
    await signOut(auth!)
  }

  return <AuthContext.Provider value={{ user, isLoading, login, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
