"use client"

import { useState, useTransition, useEffect } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { login } from "@/server-actions/auth-actions"
import { Loader2 } from "lucide-react"

export function LoginForm() {
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  useEffect(() => {
    // Mostrar mensaje de éxito si viene desde registro
    if (searchParams.get("registered") === "true") {
      setSuccessMessage("¡Cuenta creada exitosamente! Ahora puedes iniciar sesión.")
    }
  }, [searchParams])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSuccessMessage(null)

    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      try {
        await login(formData)
        // Si llega aquí sin error, la redirección se hará automáticamente
      } catch (err: any) {
        setError(err.message || "Credenciales incorrectas. Verifica tu correo y contraseña.")
        console.error("Error en login:", err)
      }
    })
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <img src="/logo_sin_nombre.svg" alt="Logo" className="h-20 w-20" />
            <span className="text-2xl font-bold text-foreground">NeumoDiagnostics</span>
          </Link>
          <h1 className="text-2xl font-bold text-foreground mb-2">Bienvenido</h1>
          <p className="text-muted-foreground">Inicia sesión para continuar</p>
        </div>

        {/* Login Form */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-card-foreground">Inicio de sesión</CardTitle>
          </CardHeader>
          <CardContent>
            {successMessage && (
              <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
                {successMessage}
              </div>
            )}

            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-card-foreground">
                  Correo electrónico
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="doctor@hospital.com"
                  required
                  disabled={isPending}
                  className="bg-background border-border text-foreground"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-card-foreground">
                  Contraseña
                </Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Ingrese su contraseña"
                  required
                  disabled={isPending}
                  className="bg-background border-border text-foreground"
                />
              </div>

              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Iniciando sesión...
                  </>
                ) : (
                  "Iniciar sesión"
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                ¿No tienes una cuenta?{" "}
                <Link href="/register" className="text-primary hover:underline">
                  Regístrate aquí
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

