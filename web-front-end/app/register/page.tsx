import type React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { register } from "@/server-actions/auth-actions"

export default async function RegisterPage() {

  async function handleRegister(formData: FormData) {
    "use server"
    const userData = {
      nombre_completo: formData.get("name"),
      edad: Number(formData.get("age")),
      rol: formData.get("role"),
      identificacion: formData.get("identification"),
      correo: formData.get("email"),
      contrasena: formData.get("password"),
      acepta_tratamiento_datos: true,
    }

    const success = await register(userData)

    if (success) {
      redirect("/login")
    }
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
            <form action={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-card-foreground">
                    Nombre completo
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="Jorge Martinez"
                    required
                    className="bg-background border-border text-foreground"
                  />
                </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-card-foreground">
                  Correo electronico
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="jorge@example.com"
                  required
                  className="bg-background border-border text-foreground"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="role" className="text-card-foreground">
                      Rol
                    </Label>
                    <select id="role" name="role" required className="bg-background border-border text-foreground w-full rounded-md px-3 py-2">
                      <option value="">Seleccione su rol</option>
                      <option value="paciente">Paciente</option>
                      <option value="doctor">Doctor</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                  <Label htmlFor="email" className="text-card-foreground">
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
                    className="bg-background border-border text-foreground"
                  />
                </div>
              </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-card-foreground">
                    Identificacion
                  </Label>
                  <Input
                    id="identification"
                    name="identification"
                    placeholder="Ingrese su identificacion"
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
                    placeholder="Escriba su contraseña"
                    required
                    type="password"
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

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-card-foreground">
                  Confirmar contraseña
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    placeholder="Escriba su contraseña nuevamente"
                    type="password"
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

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="terms"
                  name="terms"
                />
                <Label htmlFor="terms" className="text-sm text-card-foreground">
                  Acepto los{" "}
                  <Link href="/terms" className="text-primary hover:underline">
                    Terminos de servicio
                  </Link>{" "}
                  y la{" "}
                  <Link href="/privacy" className="text-primary hover:underline">
                    Politica de privacidad
                  </Link>
                </Label>
              </div>

              <Button type="submit" className="w-full">
                Crear cuenta
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                ¿Ya tienes una cuenta?{" "}
                <Link href="/login" className="text-primary hover:underline">
                  Inicia sesion aqui
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
