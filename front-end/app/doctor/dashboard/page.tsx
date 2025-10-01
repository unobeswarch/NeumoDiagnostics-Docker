"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FileImage, Clock, CheckCircle, AlertTriangle, ArrowRight, TrendingUp, Activity } from "lucide-react"
import { DoctorHeader } from "@/components/doctor-header"
import type { PreDiagnostic } from "@/lib/graphql-queries"
import Link from "next/link"

const mockCompletedCases: PreDiagnostic[] = [
  {
    prediagnostic_id: "b150e640-3aec-4c3c-80ef-caedcd150c18",
    pacienteId: "test_patient_001",
    estado: "completado", // Changed to completed status
    urlrad: "https://example.com/xrays/test_123.jpg",
    fechaSubida: "2025-09-26T15:47:02.558000",
    resultadosModelo: {
      probNeumonia: 0.87,
      etiqueta: "Viral Pneumonia",
    },
  },
  {
    prediagnostic_id: "da939374-aab5-40ab-9b78-0ec37b86d616",
    pacienteId: "P001",
    estado: "completado",
    urlrad: "https://via.placeholder.com/400x300/1f2937/ffffff?text=Mock+P001",
    fechaSubida: "2024-01-15T10:30:00Z",
    resultadosModelo: {
      probNeumonia: 0.85,
      etiqueta: "Neumonía",
    },
  },
  {
    prediagnostic_id: "12345678-1234-5678-9012-123456789012",
    pacienteId: "P002",
    estado: "completado",
    urlrad: "https://via.placeholder.com/400x300/065f46/ffffff?text=Mock+P002",
    fechaSubida: "2024-01-14T14:20:00Z",
    resultadosModelo: {
      probNeumonia: 0.25,
      etiqueta: "Normal",
    },
  },
]

const mockPendingStats = {
  total: 8,
  urgent: 3,
  routine: 5,
}

export default function DoctorDashboard() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const completedCases = mockCompletedCases

  // Verificar si hay un ID de prueba en la URL - redirigir a página de detalle
  useEffect(() => {
    const testId = searchParams.get("testId")
    if (testId) {
      console.log(`🧪 Redirigiendo a detalle del caso: ${testId}`)
      router.push(`/doctor/cases/${testId}`)
    }
  }, [searchParams, router])

  const completedUrgent = completedCases.filter((p) => p.resultadosModelo.probNeumonia > 0.7).length
  const completedRoutine = completedCases.filter((p) => p.resultadosModelo.probNeumonia <= 0.7).length

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

  const RecentCasesSummary = () => {
    const recentCases = completedCases.slice(0, 3)

    return (
      <div className="space-y-3">
        {recentCases.map((case_item) => (
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
                {case_item.resultadosModelo.etiqueta}
              </Badge>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <DoctorHeader />

      <main className="container mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard del Doctor</h1>
            <p className="text-muted-foreground">Resumen de casos completados y estadísticas generales</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => (window.location.href = "/connection-test")}
              className="flex items-center gap-2"
            >
              <AlertTriangle className="w-4 h-4" />
              Test Conexión
            </Button>
            <Badge variant="outline" className="text-blue-600 border-blue-600">
              🧪 Modo Desarrollo - Datos Mock
            </Badge>
          </div>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-card border-border">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-card-foreground">Casos Completados</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-card-foreground">{completedCases.length}</div>
                <p className="text-xs text-muted-foreground">Revisados por ti</p>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-card-foreground">Casos Pendientes</CardTitle>
                <Clock className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-500">{mockPendingStats.total}</div>
                <p className="text-xs text-muted-foreground">
                  <Link href="/doctor/casos-pendientes" className="text-blue-600 hover:underline">
                    Ver casos pendientes →
                  </Link>
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-card-foreground">Urgentes Pendientes</CardTitle>
                <AlertTriangle className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">{mockPendingStats.urgent}</div>
                <p className="text-xs text-muted-foreground">
                  <Link href="/doctor/casos-pendientes" className="text-blue-600 hover:underline">
                    Revisar urgentes →
                  </Link>
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-card-foreground">Eficiencia</CardTitle>
                <TrendingUp className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-500">92%</div>
                <p className="text-xs text-muted-foreground">Precisión diagnóstica</p>
              </CardContent>
            </Card>
          </div>

          {mockPendingStats.urgent > 0 && (
            <Card className="bg-destructive/5 border-destructive/20">
              <CardHeader>
                <CardTitle className="text-destructive flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Tienes {mockPendingStats.urgent} casos urgentes pendientes
                </CardTitle>
                <CardDescription>Hay casos marcados como urgentes que requieren tu atención inmediata</CardDescription>
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
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  Casos Completados Recientes
                </CardTitle>
                <CardDescription>Últimos casos que has revisado y completado</CardDescription>
              </CardHeader>
              <CardContent>
                <RecentCasesSummary />
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm text-muted-foreground text-center">
                    Total de casos completados: {completedCases.length}
                  </p>
                </div>
              </CardContent>
            </Card>

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
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>

                <Button variant="outline" className="w-full justify-between bg-transparent" disabled>
                  <span className="flex items-center gap-2">
                    <FileImage className="h-4 w-4" />
                    Subir nueva radiografía
                  </span>
                  <span className="text-xs text-muted-foreground">Próximamente</span>
                </Button>

                <Button variant="outline" className="w-full justify-between bg-transparent" disabled>
                  <span className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Ver estadísticas detalladas
                  </span>
                  <span className="text-xs text-muted-foreground">Próximamente</span>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
