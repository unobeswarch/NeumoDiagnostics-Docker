import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity, Shield, Users, FileText } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img src="/logo_sin_nombre.svg" alt="Logo" className="h-16 w-16" />
              <h1 className="text-2xl font-bold text-foreground">NeumoDiagnostics</h1>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" asChild>
                <Link href="/login">Iniciar sesión</Link>
              </Button>
              <Button asChild>
                <Link href="/register">Registrarse</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-6 py-16">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-foreground mb-4 text-balance">
            Sistema de gestión y predicción de neumonía a partir de radiografías
          </h2>
          <p className="text-xl text-muted-foreground mb-8 text-pretty max-w-2xl mx-auto">
            Mejore su capacidad y velocidad de predicción de neumonia por medio de nuestro modelo de IA
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-6 mb-16">

          <Card className="bg-card border-border">
            <CardHeader>
              <Users className="h-12 w-12 text-primary mb-4" />
              <CardTitle className="text-card-foreground">Acceso para distintos roles</CardTitle>
              <CardDescription>
                Los pacientes podrán subir sus radiografias, mientras que los doctores, por medio de un modelo de IA, podrán realizar predicciones mucho mas precisas acerca de la existencia de neumonía
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <FileText className="h-12 w-12 text-primary mb-4" />
              <CardTitle className="text-card-foreground">Prediagnosticos realizados por IA</CardTitle>
              <CardDescription>Nuestro modelo de IA realizará prediagnosticos de las radiografías los cuales posteriormente deberán ser confirmados por un doctor</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </main>
    </div>
  )
}
