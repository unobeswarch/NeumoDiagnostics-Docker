"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { register } from "@/server-actions/auth-actions"
import { Loader2 } from "lucide-react"

export function RegisterForm() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [termsAccepted, setTermsAccepted] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    const formData = new FormData(e.currentTarget)
    
    // Validar que las contraseñas coincidan
    const password = formData.get("password") as string
    const confirmPassword = formData.get("confirmPassword") as string
    
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden")
      return
    }

    if (!termsAccepted) {
      setError("Debes aceptar los términos y condiciones")
      return
    }

    const userData = {
      nombre_completo: formData.get("name"),
      edad: Number(formData.get("age")),
      rol: formData.get("role"),
      identificacion: formData.get("identification"),
      correo: formData.get("email"),
      contrasena: formData.get("password"),
      acepta_tratamiento_datos: true,
    }

    startTransition(async () => {
      try {
        const success = await register(userData)
        
        if (success) {
          router.push("/login?registered=true")
        } else {
          setError("Error al crear la cuenta. El correo podría estar en uso o los datos son inválidos.")
        }
      } catch (err) {
        setError("Error al conectar con el servidor. Intenta nuevamente.")
        console.error("Error en registro:", err)
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
          <h1 className="text-2xl font-bold text-foreground mb-2">Crear cuenta</h1>
        </div>

        {/* Registration Form */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-card-foreground">Registro</CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-card-foreground">
                  Nombre completo
                </Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Jorge Martinez"
                  required
                  disabled={isPending}
                  className="bg-background border-border text-foreground"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-card-foreground">
                  Correo electrónico
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="jorge@example.com"
                  required
                  disabled={isPending}
                  className="bg-background border-border text-foreground"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="role" className="text-card-foreground">
                    Rol
                  </Label>
                  <select
                    id="role"
                    name="role"
                    required
                    disabled={isPending}
                    className="bg-background border-border text-foreground w-full rounded-md px-3 py-2 border"
                  >
                    <option value="">Seleccione su rol</option>
                    <option value="paciente">Paciente</option>
                    <option value="doctor">Doctor</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="age" className="text-card-foreground">
                    Edad
                  </Label>
                  <Input
                    id="age"
                    name="age"
                    type="number"
                    placeholder="Ingrese su edad"
                    min={0}
                    max={120}
                    required
                    disabled={isPending}
                    className="bg-background border-border text-foreground"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="identification" className="text-card-foreground">
                  Identificación
                </Label>
                <Input
                  id="identification"
                  name="identification"
                  placeholder="Ingrese su identificación"
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
                  placeholder="Escriba su contraseña"
                  required
                  type="password"
                  disabled={isPending}
                  className="bg-background border-border text-foreground"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-card-foreground">
                  Confirmar contraseña
                </Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  placeholder="Escriba su contraseña nuevamente"
                  type="password"
                  required
                  disabled={isPending}
                  className="bg-background border-border text-foreground"
                />
              </div>

              <div className="flex items-start space-x-2">
                <Checkbox
                  id="terms"
                  checked={termsAccepted}
                  onCheckedChange={(checked) => setTermsAccepted(checked as boolean)}
                  disabled={isPending}
                />
                <Label htmlFor="terms" className="text-sm text-card-foreground leading-tight">
                  Acepto los{" "}
                  <Link href="/terms" className="text-primary hover:underline">
                    Términos de servicio
                  </Link>{" "}
                  y la{" "}
                  <Link href="/privacy" className="text-primary hover:underline">
                    Política de privacidad
                  </Link>
                </Label>
              </div>

              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creando cuenta...
                  </>
                ) : (
                  "Crear cuenta"
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                ¿Ya tienes una cuenta?{" "}
                <Link href="/login" className="text-primary hover:underline">
                  Inicia sesión aquí
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

