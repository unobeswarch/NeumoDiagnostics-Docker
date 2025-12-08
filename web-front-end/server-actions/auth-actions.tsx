"use server"

interface User {
  id: string
  name: string
  email: string
  role: "paciente" | "doctor"
  avatar?: string
  age?: string | number
}

import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { headers } from "next/headers"

// API URL for server-side requests (Cloud Map in AWS, reverse-proxy in docker-compose)
const API_URL = process.env.SERVER_API_URL || "http://reverse-proxy"

export async function register(userData: any) {
    try {
      const responseRegister = await fetch(`${API_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
        cache: "no-store"
      })

    if (!responseRegister.ok) {
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

    return true

  } catch (error) {
    console.error("Error en registro:", error)
    return false
  }
}

export async function login(formData: FormData): Promise<void> {
  const correo = formData.get("email") as string
  const contrasena = formData.get("password") as string

  console.log(correo)
  console.log(contrasena)

  const h = headers()

  const realIp = h.get("x-real-ip") || h.get("x-forwarded-for") || null
  
  const userAgent = h.get("user-agent") || ""

  const response = await fetch(`${API_URL}/auth`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "X-Real-IP": realIp || "",
      "X-Forwarded-For": realIp || "",
      "User-Agent": userAgent,
    },
    body: JSON.stringify({ correo, contrasena }),
    cache: "no-store"
  })

  if (!response.ok) {
    throw new Error("Credenciales incorrectas")
  }

  const data = await response.json()

  console.log(data)

  console.log(data.token)
  console.log(data.rol)
  console.log(data.user_id)

  cookies().set("auth-token", data.token, { 
    path: "/",
    httpOnly: true,
    secure: true,
    sameSite: "strict",
   })
   
  cookies().set("user-role", data.rol, { 
    path: "/",
    httpOnly: true,
    secure: true,
    sameSite: "strict",
   })

  cookies().set("user-id", data.user_id, { 
    path: "/",
    httpOnly: true,
    secure: true,
    sameSite: "strict",
   })

  if (data.rol === "paciente") redirect("/patient/dashboard")
  if (data.rol === "doctor") redirect("/doctor/dashboard")
}

export async function logout(): Promise<void> {
  const cookieStore = cookies()
  cookieStore.delete("auth-token")
  cookieStore.delete("user-role")
  cookieStore.delete("user-id")

  redirect("/login")
}


export async function getUserFromToken() {
  const cookieStore = cookies()
  const token = cookieStore.get("auth-token")?.value
  const user_id = cookieStore.get("user-id")?.value

  if (!token || !user_id) return null;

  const h = headers()

  const realIp = h.get("x-real-ip") || h.get("x-forwarded-for") || null
  
  const userAgent = h.get("user-agent") || ""

  const res = await fetch(`${API_URL}/userInfo`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
      "X-Real-IP": realIp || "",
      "X-Forwarded-For": realIp || "",
      "User-Agent": userAgent,
    },
  });

  if (!res.ok) return null;

  const data = await res.json();

  console.log("📥 UserInfo response:", data);  // Debug log

  const avatarUrl = `${API_URL}/userImage?id=${user_id}`

  return {
    id: user_id,
    name: data.nombre,
    email: data.email,
    role: data.rol,
    avatar: avatarUrl,
    age: data.edad || data.age || undefined, // Intentar obtener la edad del backend
  };
}

export async function getProfilePhoto(url: string): Promise<string | undefined> {
  if (!url) return undefined

  const token = cookies().get("auth-token")?.value
  if (!token) return undefined

  try {
    const res = await fetch(url, {
      cache: "no-store",
    })

    if (!res.ok) return undefined

    const buffer = await res.arrayBuffer()
    const base64 = Buffer.from(buffer).toString("base64")
    return `data:image/jpeg;base64,${base64}`
  } catch (error) {
    console.error("Error obteniendo la imagen:", error)
    return undefined
  }
}