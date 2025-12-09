import type React from "react"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { login } from "@/server-actions/auth-actions"

export default function LoginPage({ searchParams }: { searchParams: { error?: string, registered?: string } }) {
  const errorMessage = searchParams.error === "invalid_credentials" 
    ? "Credenciales incorrectas. Por favor, verifica tu correo y contraseña."
    : searchParams.error === "connection_error"
    ? "Error de conexión. Por favor, intenta de nuevo."
    : null;
  
  const successMessage = searchParams.registered === "true"
    ? "¡Cuenta creada exitosamente! Ahora puedes iniciar sesión."
    : null;

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
          <p className="text-muted-foreground">Inicia sesion para continuar</p>
        </div>

        {/* Login Form */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-card-foreground">Inicio de sesion</CardTitle>
          </CardHeader>
          <CardContent>
            {successMessage && (
              <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
                {successMessage}
              </div>
            )}
            {errorMessage && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {errorMessage}
              </div>
            )}
            <form action={login} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-card-foreground">
                  Correo electronico
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="doctor@hospital.com"
                  required
                  className="bg-background border-border text-foreground"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-card-foreground">
                  Contraseña
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Ingrese su contraseña"
                    required
                    className="bg-background border-border text-foreground pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  >
                  </Button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
              >
                Iniciar sesion
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                ¿No tienes una cuenta?{" "}
                <Link href="/register" className="text-primary hover:underline">
                  Registrate aqui
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
