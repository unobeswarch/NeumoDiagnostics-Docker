"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clock, CheckCircle, AlertTriangle, ArrowRight, TrendingUp, Activity } from "lucide-react"
import { DoctorHeader } from "@/components/doctor-header"
import Link from "next/link"

// Interface for real case data from backend
interface RealCase {
  id: string
  paciente: string
  fecha: string
  estado: string
}

// Interface for case detail data
interface CaseDetail {
  prediagnostic_id: string
  pacienteId: string
  estado: string
  urlrad: string
  fechaSubida: string
  resultado_modelo: {
    prob_neumonia: number
    etiqueta: string
  }
}
interface User {
  id: string
  name: string
  email: string
  role: "paciente" | "doctor"
  avatar?: string
}

interface DoctorDashboardClientProps {
  currentUser: User
  convertedCases: RealCase[]
  completedCaseDetails: CaseDetail[]
}


export default function DoctorDashboardClient({currentUser, convertedCases, completedCaseDetails}: DoctorDashboardClientProps) {

  // Verificar si hay un ID de prueba en la URL - redirigir a página de detalle

  // Calculate statistics from real data
  console.log(convertedCases)
  console.log(completedCaseDetails)

  const pendingCases = convertedCases.filter(c => c.estado === "procesado")
  const validatedCases = convertedCases.filter(c => c.estado === "Validado")
  const urgentCases = completedCaseDetails.filter(c => c.resultado_modelo?.prob_neumonia > 0.7)
  const routineCases = completedCaseDetails.filter(c => c.resultado_modelo?.prob_neumonia <= 0.7)

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString("es-ES", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch (error) {
      return dateString
    }
  }

  const RecentCasesSummary = ({ CompletedCaseDetails }: { CompletedCaseDetails: CaseDetail[] }) => {

    const recentCases = CompletedCaseDetails.slice(0, 3)

    return (
      <div className="space-y-3">
        {recentCases.length > 0 ? (
          recentCases.map((case_item) => (
            <div
              key={case_item.prediagnostic_id}
              className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-sm">Paciente: {case_item.pacienteId}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(case_item.fechaSubida)}</p>
                </div>
              </div>
              <div className="text-right">
                <Badge variant="outline" className="text-xs">
                  {case_item.resultado_modelo?.etiqueta || 'N/A'}
                </Badge>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p>No hay casos recientes disponibles</p>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <DoctorHeader 
        id={currentUser.id}
        name={currentUser.name}
        email={currentUser.email}
        role={currentUser.role}
        avatar={currentUser.avatar}
      />

      <main className="container mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard del Doctor</h1>
            <p className="text-muted-foreground">Resumen de casos completados y estadísticas generales</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-card border-border">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-card-foreground">Casos Pendientes</CardTitle>
                <Clock className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-card-foreground">{pendingCases.length}</div>
                <p className="text-xs text-muted-foreground">Esperando revisión</p>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-card-foreground">Casos Completados</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-card-foreground">{validatedCases.length}</div>
                <p className="text-xs text-muted-foreground">Diagnósticos finalizados</p>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-card-foreground">Eficiencia</CardTitle>
                <TrendingUp className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-card-foreground">
                  {convertedCases.length > 0 ? Math.round((validatedCases.length / convertedCases.length) * 100) : 0}%
                </div>
                <p className="text-xs text-muted-foreground">Casos procesados</p>
              </CardContent>
            </Card>
          </div>

          {pendingCases.length > 0 && (
            <Card className="bg-destructive/5 border-destructive/20">
              <CardHeader>
                <CardTitle className="text-destructive flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Tienes {pendingCases.length} casos pendientes de revisión
                </CardTitle>
                <CardDescription>Hay casos esperando tu diagnóstico médico</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/doctor/casos-pendientes">
                  <Button className="flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Revisar casos pendientes
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-card-foreground flex items-center gap-2">
                  <Activity className="h-5 w-5 text-blue-500" />
                  Acciones Rápidas
                </CardTitle>
                <CardDescription>Accede rápidamente a las funciones principales</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/doctor/casos-pendientes">
                  <Button variant="outline" className="w-full justify-between bg-transparent">
                    <span className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Ver casos pendientes
                    </span>
                    <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs">
                      {pendingCases.length}
                    </span>
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}