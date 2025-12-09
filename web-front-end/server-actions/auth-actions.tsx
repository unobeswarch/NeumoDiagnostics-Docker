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
  const url = process.env.SERVER_API_URL || "http://reverse-proxy"
  console.log("=== AUTH_DEBUG: getApiUrl() returning:", url)
  console.log("=== AUTH_DEBUG: SERVER_API_URL env var:", process.env.SERVER_API_URL || "(not set)")
  return url
}

// Determine if cookies should be secure (HTTPS only)
// In AWS with HTTP ALB, we need to set this to false
function shouldUseSecureCookies(): boolean {
  // Explicit override via env var takes precedence
  if (process.env.USE_SECURE_COOKIES === 'false') return false;
  if (process.env.USE_SECURE_COOKIES === 'true') return true;
  // Default: secure in production unless using HTTP
  const serverUrl = process.env.SERVER_API_URL || '';
  if (serverUrl.startsWith('http://')) return false;
  return process.env.NODE_ENV === 'production';
}

export async function register(userData: any) {
    console.log("========================================")
    console.log("=== REGISTER START ===")
    console.log("========================================")
    
    const apiUrl = getApiUrl()
    console.log("=== REGISTER: API URL:", apiUrl)
    console.log("=== REGISTER: User data:", JSON.stringify(userData, null, 2))
    
    try {
      const url = `${apiUrl}/register`
      console.log("=== REGISTER: Fetching URL:", url)
      console.log("=== REGISTER: Request body:", JSON.stringify(userData))
      
      // Add timeout with AbortController
      const controller = new AbortController()
      const timeoutId = setTimeout(() => {
        console.log("=== REGISTER: TIMEOUT after 10 seconds!")
        controller.abort()
      }, 10000)
      
      console.log("=== REGISTER: Sending POST request...")
      const startTime = Date.now()
      
      const responseRegister = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
        cache: "no-store",
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      const elapsed = Date.now() - startTime
      console.log("=== REGISTER: Response received in", elapsed, "ms")
      console.log("=== REGISTER: Response status:", responseRegister.status)
      console.log("=== REGISTER: Response statusText:", responseRegister.statusText)
      console.log("=== REGISTER: Response headers:", JSON.stringify(Object.fromEntries(responseRegister.headers.entries())))

    if (!responseRegister.ok) {
      const errorText = await responseRegister.text()
      console.log("=== REGISTER: FAILED! Status:", responseRegister.status)
      console.log("=== REGISTER: Error body:", errorText)
      console.log("========================================")
      console.log("=== REGISTER END (FAILURE) ===")
      console.log("========================================")
      return false
    }

    const registerData = await responseRegister.json()
    console.log("=== REGISTER: SUCCESS! Response data:", JSON.stringify(registerData, null, 2))
    console.log("========================================")
    console.log("=== REGISTER END (SUCCESS) ===")
    console.log("========================================")

    return true

  } catch (error: any) {
    console.log("========================================")
    console.log("=== REGISTER EXCEPTION ===")
    console.log("=== Error name:", error?.name)
    console.log("=== Error message:", error?.message)
    console.log("=== Error cause:", error?.cause)
    console.log("=== Error stack:", error?.stack)
    console.log("========================================")
    console.log("=== REGISTER END (EXCEPTION) ===")
    console.log("========================================")
    return false
  }
}

export async function login(formData: FormData): Promise<void> {
  const correo = formData.get("email") as string
  const contrasena = formData.get("password") as string

  console.log("LOGIN_DEBUG: Attempting login for:", correo)

  const h = headers()

  const realIp = h.get("x-real-ip") || h.get("x-forwarded-for") || null
  
  const userAgent = h.get("user-agent") || ""

  const apiUrl = getApiUrl()
  console.log("LOGIN_DEBUG: API URL:", apiUrl)

  try {
    const response = await fetch(`${apiUrl}/auth`, {
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

    console.log("LOGIN_DEBUG: Response status:", response.status)

    if (!response.ok) {
      console.log("LOGIN_DEBUG: Login failed with status:", response.status)
      // Redirect to login page with error parameter instead of throwing
      redirect("/login?error=invalid_credentials")
    }

    const data = await response.json()

    console.log("LOGIN_DEBUG: Login successful, setting cookies")

    cookies().set("auth-token", data.token, { 
      path: "/",
      httpOnly: true,
      secure: shouldUseSecureCookies(),
      sameSite: "lax",
    })
    
    cookies().set("user-role", data.rol, { 
      path: "/",
      httpOnly: true,
      secure: shouldUseSecureCookies(),
      sameSite: "lax",
    })

    cookies().set("user-id", data.user_id, { 
      path: "/",
      httpOnly: true,
      secure: shouldUseSecureCookies(),
      sameSite: "lax",
    })

    if (data.rol === "paciente") redirect("/patient/dashboard")
    if (data.rol === "doctor") redirect("/doctor/dashboard")
    
  } catch (error: any) {
    console.log("LOGIN_DEBUG: Error during login:", error?.message)
    // If it's a redirect, let it through
    if (error?.digest?.includes("NEXT_REDIRECT")) {
      throw error
    }
    // Otherwise redirect to login with error
    redirect("/login?error=connection_error")
  }
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