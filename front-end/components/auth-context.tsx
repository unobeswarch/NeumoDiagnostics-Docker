"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

interface User {
  id: string
  name: string
  email: string
  role: "paciente" | "doctor"
  avatar?: string
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<User | null>
  register: (userData: any) => Promise<boolean>
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (user) return

    const hasToken = document.cookie.includes("auth-token")
    const userRole = document.cookie.includes("user-role=paciente")
      ? "paciente"
      : document.cookie.includes("user-role=doctor")
        ? "doctor"
        : null
    if (hasToken && userRole) {
      const token = document.cookie.split("; ").find(row => row.startsWith("auth-token="))?.split("=")[1]

       fetch("http://localhost:8080/validation", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })
        .then(res => {
          if (!res.ok) throw new Error("Token inválido o expirado")
          return res.json()
        })
        .then(data => {
          setUser({
            id: data.UserID,
            name: data.Name,
            email: data.Email,
            role: data.Role,
            avatar: data.Role === "paciente" ? "/patient-avatar.png" : "/doctor-avatar.png",
        })
      })
      .catch(err => {
        console.error(err)
      })    
    }
  }, [])

  const login = async (correo: string, contrasena: string): Promise<User | null> => {
    setIsLoading(true)

    try {
    const response = await fetch("http://localhost:8080/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ correo, contrasena }),
    })

    if (!response.ok) {
      setIsLoading(false)
      return null
    }

    const data = await response.json()
    console.log("🔍 Auth response data:", data)

      const userData = {
        id: data.id, // data.nombre contains the numeric user ID (3)
        email: correo,
        name: data.nombre.toString(), // Use a proper display name
        role: data.rol,
        avatar: data.rol === "paciente" ? "/patient-avatar.png" : "/doctor-avatar.png",
      }

      console.log("👤 Created user data:", userData)

      setUser(userData)

      document.cookie = `auth-token=${data.token}; path=/`
      document.cookie = `user-role=${data.rol}; path=/`

      setIsLoading(false)
      return userData

    } catch(error) {
      setIsLoading(false)
      return null
    }
  }

  const register = async (userData: any): Promise<boolean> => {
    setIsLoading(true)

    try {
      const responseRegister = await fetch("http://localhost:8080/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      })

    if (!responseRegister.ok) {
      setIsLoading(false)
      return false
    }

    const registerData = await responseRegister.json()

    const newUser = {
      id: registerData.id,
      name: registerData.nombre_completo,
      email: registerData.correo,
      role: registerData.rol,
      avatar: registerData.rol === "paciente" ? "/patient-avatar.png" : "/doctor-avatar.png",
    }

    setUser(newUser)

    setIsLoading(false)
    return true

  } catch (error) {
    console.error("Error en registro:", error)
    setIsLoading(false)
    return false
  }
}

  const logout = () => {
    setUser(null)
    document.cookie = "auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT"
    document.cookie = "user-role=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT"
    window.location.href = "/login"
  }

  return <AuthContext.Provider value={{ user, login, register, logout, isLoading }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
