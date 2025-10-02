"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FileImage, Clock, CheckCircle, AlertTriangle, ArrowRight, TrendingUp, Activity } from "lucide-react"
import { DoctorHeader } from "@/components/doctor-header"
import Link from "next/link"
import { GraphQLClient } from '@/lib/apollo-client'
import { GET_CASES, Case, GetCasesResponse } from '@/lib/get-cases-query'

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

export default function DoctorDashboard() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [cases, setCases] = useState<RealCase[]>([])
  const [completedCases, setCompletedCases] = useState<CaseDetail[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch real cases from backend
  useEffect(() => {
    async function fetchCases() {
      try {
        setLoading(true)
        setError(null)

        // Fetch pending cases using GraphQL
        console.log("🚀 Fetching cases from GraphQL service...")
        const response = await GraphQLClient.query<GetCasesResponse>(GET_CASES)
        console.log("✅ Cases fetched:", response)
        
        const casesData = response.getCases || []
        
        // Convert GraphQL Case format to RealCase format for compatibility
        const convertedCases: RealCase[] = casesData.map(case_item => ({
          id: case_item.id,
          paciente: case_item.pacienteNombre,
          fecha: case_item.fechaSubida,
          estado: case_item.estado
        }))
        
        setCases(convertedCases)

        // Convert cases with results to CaseDetail format for statistics
        const completedCaseDetails: CaseDetail[] = casesData
          .filter(case_item => case_item.resultados)
          .slice(0, 5) // Limit to first 5 for performance
          .map(case_item => ({
            prediagnostic_id: case_item.id,
            pacienteId: case_item.pacienteId,
            estado: case_item.estado,
            urlrad: case_item.urlRadiografia,
            fechaSubida: case_item.fechaSubida,
            resultado_modelo: case_item.resultados ? {
              prob_neumonia: case_item.resultados.probNeumonia,
              etiqueta: case_item.resultados.etiqueta
            } : {
              prob_neumonia: 0,
              etiqueta: "No disponible"
            }
          }))
        
        setCompletedCases(completedCaseDetails)
        
      } catch (err) {
        console.error("❌ Error fetching cases:", err)
        setError(err instanceof Error ? err.message : 'Error desconocido')
      } finally {
        setLoading(false)
      }
    }

    fetchCases()
  }, [])

  // Verificar si hay un ID de prueba en la URL - redirigir a página de detalle
  useEffect(() => {
    const testId = searchParams.get("testId")
    if (testId) {
      console.log(`🧪 Redirigiendo a detalle del caso: ${testId}`)
      router.push(`/doctor/cases/${testId}`)
    }
  }, [searchParams, router])

  // Calculate statistics from real data
  const pendingCases = cases.filter(c => c.estado === "procesado")
  const validatedCases = cases.filter(c => c.estado === "validado")
  const urgentCases = completedCases.filter(c => c.resultado_modelo?.prob_neumonia > 0.7)
  const routineCases = completedCases.filter(c => c.resultado_modelo?.prob_neumonia <= 0.7)

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
    if (loading) {
      return (
        <div className="space-y-3">
          <div className="animate-pulse">
            <div className="h-16 bg-gray-200 rounded-lg"></div>
            <div className="h-16 bg-gray-200 rounded-lg mt-3"></div>
            <div className="h-16 bg-gray-200 rounded-lg mt-3"></div>
          </div>
        </div>
      )
    }

    const recentCases = completedCases.slice(0, 3)

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

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <DoctorHeader />
        <main className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-muted-foreground">Cargando casos...</p>
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <DoctorHeader />
        <main className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">Error cargando datos: {error}</p>
              <Button onClick={() => window.location.reload()}>
                Reintentar
              </Button>
            </div>
          </div>
        </main>
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
            <Badge variant="outline" className="text-green-600 border-green-600">
              🔄 Datos Reales - Backend Conectado
            </Badge>
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
                <CardTitle className="text-sm font-medium text-card-foreground">Casos Urgentes</CardTitle>
                <AlertTriangle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-card-foreground">{urgentCases.length}</div>
                <p className="text-xs text-muted-foreground">Prob. neumonía &gt; 70%</p>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-card-foreground">Eficiencia</CardTitle>
                <TrendingUp className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-card-foreground">
                  {cases.length > 0 ? Math.round((validatedCases.length / cases.length) * 100) : 0}%
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
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  Casos Completados Recientes
                </CardTitle>
                <CardDescription>Últimos casos que has revisado y completado</CardDescription>
              </CardHeader>
              <CardContent>
                <RecentCasesSummary />
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm text-muted-foreground text-center">
                    Total de casos completados: {validatedCases.length}
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
                    <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs">
                      {pendingCases.length}
                    </span>
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
