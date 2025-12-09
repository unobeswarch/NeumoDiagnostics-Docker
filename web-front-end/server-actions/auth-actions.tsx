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
// Using a function to ensure runtime evaluation
function getApiUrl() {
  return process.env.SERVER_API_URL || "http://reverse-proxy"
}

export async function register(userData: any) {
    const apiUrl = getApiUrl()
    console.log("REGISTER_DEBUG: Starting register with apiUrl:", apiUrl)
    console.log("REGISTER_DEBUG: userData:", JSON.stringify(userData))
    
    try {
      const url = `${apiUrl}/register`
      console.log("REGISTER_DEBUG: About to fetch:", url)
      
      // Add timeout with AbortController
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout
      
      const responseRegister = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
        cache: "no-store",
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      console.log("REGISTER_DEBUG: Response received, status:", responseRegister.status)

    if (!responseRegister.ok) {
      const errorText = await responseRegister.text()
      console.log("REGISTER_DEBUG: Request failed with status", responseRegister.status, "body:", errorText)
      return false
    }

    const registerData = await responseRegister.json()
    console.log("REGISTER_DEBUG: Success! Data:", JSON.stringify(registerData))

    const newUser = {
      id: registerData.id,
      name: registerData.nombre_completo,
      email: registerData.correo,
      role: registerData.rol,
      avatar: registerData.rol === "paciente" ? "/patient-avatar.png" : "/doctor-avatar.png",
    }

    return true

  } catch (error: any) {
    console.log("REGISTER_DEBUG: CAUGHT ERROR:", error?.name, error?.message, error?.cause)
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

  const response = await fetch(`${getApiUrl()}/auth`, {
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

  const res = await fetch(`${getApiUrl()}/userInfo`, {
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

  const avatarUrl = `${getApiUrl()}/userImage?id=${user_id}`

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