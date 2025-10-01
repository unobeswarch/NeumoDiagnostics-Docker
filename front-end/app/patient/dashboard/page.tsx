"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileImage, Eye, Clock, CheckCircle } from "lucide-react"
import { PatientHeader } from "@/components/patient-header"
import { UploadRadiography } from "@/components/upload-radiography"
import { RadiographyHistory } from "@/components/radiography-history"
import { useEffect } from "react"
import { GraphQLClient } from "@/lib/apollo-client"
import { GET_CASES, Case } from "@/lib/get-cases-query"
import { useAuth } from "@/components/auth-context"
import { RadiographyDetail } from "@/components/radiography-detail"

// Type definition for radiography records
interface RadiographyRecord {
  id: string
  uploadDate: string
  processedDate: string | null
  validatedDate: string | null
  status: "uploaded" | "processed" | "validated"
  patientId: string
  imageUrl: string
  doctorReport: string | null
  doctorName: string | null
  aiDiagnosis: string | null
}

// Mock data for radiography records
// No mockRecords, se obtienen de la API

export default function PatientDashboard() {
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null)
  const [records, setRecords] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  useEffect(() => {
    const fetchCases = async () => {
      setLoading(true)
      setError(null)
      try {
        // Obtener JWT del paciente desde cookie
        const match = document.cookie.match(/auth-token=([^;]+)/)
        const jwt = match ? match[1] : null
        if (!jwt) {
          setError("No autenticado. Inicia sesión nuevamente.")
          setLoading(false)
          return
        }
        const response = await fetch("http://localhost:8080/query", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${jwt}`,
          },
          body: JSON.stringify({ query: GET_CASES }),
        })
        const result = await response.json()
        if (result.errors) {
          const msg = result.errors[0]?.message || "Error desconocido"
          if (msg.includes("sin radiografias")) {
            setRecords([])
            setError(null)
          } else {
            setError(msg)
          }
          setLoading(false)
          return
        }
        const cases: Case[] = result.data?.getCases || []
        const mapped = cases.map((c) => ({
          radiografia_id: c.id,
          fecha_subida: c.fechaSubida,
          estado:
            c.estado.toLowerCase().includes("valid")
              ? "validado"
              : c.estado.toLowerCase().includes("proces")
              ? "procesado"
              : "subido",
          resultado_preliminar: c.resultados?.etiqueta || null,
        }))
        setRecords(mapped)
      } catch (err: any) {
        setError(err.message || "No se pudieron recuperar los casos.")
      } finally {
        setLoading(false)
      }
    }
    fetchCases()
  }, [user])


  const handleUploadSuccess = (newRecord: any) => {
    setRecords([newRecord, ...records])
  }

  if (selectedRecord) {
    return <RadiographyDetail record={selectedRecord} onBack={() => setSelectedRecord(null)} />
  }

  return (
    <div className="min-h-screen bg-background">
      <PatientHeader />

      <main className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard del paciente</h1>
          <p className="text-muted-foreground">Gestione sus radiografias y resultados</p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">{error}</div>
        )}
        {loading ? (
          <div className="mb-4 p-4 text-muted-foreground">Cargando radiografías...</div>
        ) : null}

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
            <TabsTrigger value="overview">General</TabsTrigger>
            <TabsTrigger value="upload">Subir radiografía</TabsTrigger>
            <TabsTrigger value="history">Historial</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-card border-border">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-card-foreground">Número de registros</CardTitle>
                  <FileImage className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-card-foreground">{records.length}</div>
                  <p className="text-xs text-muted-foreground">Radiografías</p>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-card-foreground">Validadas</CardTitle>

                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-card-foreground">
                    {records.filter((r) => r.estado === "validado").length}
                  </div>
                  <p className="text-xs text-muted-foreground">Aprobadas por el doctor</p>

                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-card-foreground">Pendientes</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-card-foreground">
                    {records.filter((r) => r.estado !== "validado").length}
                  </div>
                  <p className="text-xs text-muted-foreground">En revisión</p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Records */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-card-foreground">Radiografías recientes</CardTitle>
                <CardDescription>Tus últimas radiografías subidas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {records.slice(0, 3).map((record) => (
                    <div
                      key={record.radiografia_id}
                      className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                      onClick={() => setSelectedRecord(record)}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                          <FileImage className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium text-card-foreground">Radiografía #{record.radiografia_id}</p>
                          <p className="text-sm text-muted-foreground">
                            Subida {new Date(record.fecha_subida).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge
                          variant={
                            record.estado === "validado"
                              ? "default"
                              : record.estado === "procesado"
                                ? "secondary"
                                : "outline"
                          }
                        >
                          {record.estado}
                        </Badge>
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  ))}
                  {records.length === 0 && !loading && !error && (
                    <div className="text-center py-8">
                      <FileImage className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">Aún no tienes radiografías subidas.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="upload">
            <UploadRadiography onUploadSuccess={handleUploadSuccess} />
          </TabsContent>

          <TabsContent value="history">
            <RadiographyHistory records={records} onSelectRecord={setSelectedRecord} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
