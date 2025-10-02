"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileImage, Eye, Clock, CheckCircle } from "lucide-react"
import { PatientHeader } from "@/components/patient-header"
import { UploadRadiography } from "@/components/upload-radiography"
import { RadiographyHistory } from "@/components/radiography-history"
import { useAuth } from "@/components/auth-context"
import { GraphQLClient } from "@/lib/apollo-client"
import { mock } from "node:test"

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
/* const mockRecords: RadiographyRecord[] = [
  {
    id: "1",
    uploadDate: "2024-01-15",
    processedDate: "2024-01-16",
    validatedDate: "2024-01-17",
    status: "validated",
    patientId: "P001",
    imageUrl: "/chest-x-ray-radiography.jpg",
    doctorReport:
      "Normal chest X-ray. No signs of pneumonia or other abnormalities. Heart size and lung fields appear normal.",
    doctorName: "Dr. Sarah Johnson",
    aiDiagnosis: "No abnormalities detected",
  },
  {
    id: "2",
    uploadDate: "2024-01-10",
    processedDate: "2024-01-11",
    validatedDate: null,
    status: "processed",
    patientId: "P001",
    imageUrl: "/knee-x-ray-radiography.jpg",
    doctorReport: null,
    doctorName: null,
    aiDiagnosis: "Possible minor joint space narrowing",
  },
  {
    id: "3",
    uploadDate: "2024-01-08",
    processedDate: null,
    validatedDate: null,
    status: "uploaded",
    patientId: "P001",
    imageUrl: "/spine-x-ray-radiography.jpg",
    doctorReport: null,
    doctorName: null,
    aiDiagnosis: null,
  },
] */


// GraphQL Query to get patient cases
const GET_PATIENT_CASES = `
  query GetCases {
    getCases {
      id
      pacienteId
      pacienteNombre
      pacienteEmail
      fechaSubida
      estado
      urlRadiografia
      resultados {
        probNeumonia
        etiqueta
        fechaProcesamiento
      }
      doctorAsignado
    }
  }
`

export default function PatientDashboard() {
  const router = useRouter()
  //const [records, setRecords] = useState<RadiographyRecord[]>(mockRecords)
  const { user } = useAuth()
  const [records, setRecords] = useState<RadiographyRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Function to convert backend case data to frontend RadiographyRecord format
  const convertCaseToRecord = (backendCase: any): RadiographyRecord => {
    console.log("🔄 Converting case:", backendCase)
    console.log("🖼️ Image URL from backend:", backendCase.urlRadiografia)
    
    // Properly type the status field
    const getStatus = (estado: string): "uploaded" | "processed" | "validated" => {
      if (estado === "procesado") return "processed"
      if (estado === "validado") return "validated"
      return "uploaded"
    }
    
    const record: RadiographyRecord = {
      id: backendCase.id || "unknown",
      uploadDate: backendCase.fechaSubida || new Date().toISOString(),
      processedDate: backendCase.resultados?.fechaProcesamiento || null,
      validatedDate: backendCase.estado === "validado" ? backendCase.fechaSubida : null,
      status: getStatus(backendCase.estado || "uploaded"),
      patientId: backendCase.pacienteId || "unknown",
      imageUrl: backendCase.urlRadiografia || "/placeholder.jpg",
      doctorReport: null, // This would come from diagnostic data
      doctorName: backendCase.doctorAsignado || null,
      aiDiagnosis: backendCase.resultados?.etiqueta || null,
    }
    
    console.log("✅ Converted record:", record)
    console.log("🔗 Final imageUrl:", record.imageUrl)
    return record
  }

  // Load patient cases on component mount
  useEffect(() => {
    const loadPatientCases = async () => {
      if (!user) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        console.log("🔍 Loading patient cases from GraphQL for user:", user.id)
        
        const response = await GraphQLClient.query(GET_PATIENT_CASES)
        console.log("✅ GraphQL Response:", response)
        console.log("� Response structure:", JSON.stringify(response, null, 2))
        console.log("📊 Response.data:", response.data)
        console.log("�📊 Raw cases data:", response.data?.getCases)

        if (response.data?.getCases || response.getCases) {
          console.log("🔧 Converting cases to records...")
          const convertedRecords = (response.data?.getCases || response.getCases).map((caseData: any, index: number) => {
            console.log(`📝 Processing case ${index}:`, caseData)
            return convertCaseToRecord(caseData)
          })
          setRecords(convertedRecords)
          console.log("✅ Converted records:", convertedRecords)
        } else {
          console.log("❌ No getCases data found in response")
          console.log("🔍 Available response.data keys:", Object.keys(response.data || {}))
          setRecords([])
        }
        setError(null) // Clear any previous errors
      } catch (err) {
        console.error("❌ Error loading patient cases:", err)
        setError("Error loading cases. Using offline mode.")
        // Don't set empty array on error, keep existing records
      } finally {
        setLoading(false)
      }
    }

    loadPatientCases()
  }, [user])

  const handleUploadSuccess = (newRecord: any) => {
    // Reload cases after successful upload
    window.location.reload()
  }

  // if (selectedRecord) {
    // return <RadiographyDetail record={selectedRecord} onBack={() => setSelectedRecord(null)} />

  // Función para navegar a HU7 - LA INTEGRACIÓN CLAVE
  const handleViewDetails = (caseId: string) => {
    router.push(`/patient/radiograph/${caseId}`)
  }

  return (
    <div className="min-h-screen bg-background">
      <PatientHeader />

      <main className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard del paciente</h1>
          <p className="text-muted-foreground">Gestione sus radiografias y resultados</p>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
            <TabsTrigger value="overview">General</TabsTrigger>
            <TabsTrigger value="upload">Subir radiografía</TabsTrigger>
            <TabsTrigger value="history">Historial</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Loading State */}
            {loading && (
              <div className="flex justify-center items-center py-8">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                  <p className="text-muted-foreground">Cargando datos...</p>
                </div>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <p className="text-yellow-800">{error}</p>
              </div>
            )}

            {/* Stats Cards */}
            {!loading && (
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
                    <CardTitle className="text-sm font-medium text-card-foreground">Registros validados</CardTitle>
                    <CheckCircle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-card-foreground">
                      {records.filter((r) => r.status === "validated").length}
                    </div>
                    <p className="text-xs text-muted-foreground">Aprobados por un doctor</p>
                  </CardContent>
                </Card>

                <Card className="bg-card border-border">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-card-foreground">Registros pendientes</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-card-foreground">
                      {records.filter((r) => r.status !== "validated").length}
                    </div>
                    <p className="text-xs text-muted-foreground">En espera de revisión</p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Recent Records */}
            {!loading && (
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-card-foreground">Registros recientes</CardTitle>
                  <CardDescription>Tus radiografías más recientes</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {records.slice(0, 3).map((record) => (
                      <div
                        key={record.id}
                       className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                        // onClick={() => setSelectedRecord(record)}
                        onClick={() => handleViewDetails(record.id)}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                            {record.imageUrl && record.imageUrl !== "/placeholder.jpg" ? (
                              <img 
                                src={record.imageUrl} 
                                alt={`Radiografía ${record.id}`}
                                className="w-full h-full object-cover rounded-lg"
                                onError={(e) => {
                                  console.error("❌ Failed to load image:", record.imageUrl);
                                  // Fallback to icon if image fails to load
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  target.nextElementSibling?.classList.remove('hidden');
                                }}
                                onLoad={() => {
                                  console.log("✅ Image loaded successfully:", record.imageUrl);
                                }}
                              />
                            ) : null}
                            <FileImage className={`h-6 w-6 text-muted-foreground ${record.imageUrl && record.imageUrl !== "/placeholder.jpg" ? 'hidden' : ''}`} />
                          </div>
                          <div>
                            <p className="font-medium text-card-foreground">Registro #{record.id}</p>
                            <p className="text-sm text-muted-foreground">
                              Subido {new Date(record.uploadDate).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge
                            variant={
                              record.status === "validated"
                                ? "default"
                                : record.status === "processed"
                                  ? "secondary"
                                  : "outline"
                            }
                          >
                            {record.status}
                          </Badge>
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                    ))}
                    {records.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        No hay registros disponibles
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="upload">
            <UploadRadiography onUploadSuccess={handleUploadSuccess} />
          </TabsContent>

          <TabsContent value="history">
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                  <p className="text-muted-foreground">Cargando historial...</p>
                </div>
              </div>
            ) : (
              <RadiographyHistory 
                records={records.map(record => ({
                  radiografia_id: record.id,
                  fecha_subida: record.uploadDate,
                  estado: record.status === "validated" ? "validado" : 
                         record.status === "processed" ? "procesado" : "subido",
                  resultado_preliminar: record.aiDiagnosis,
                  imageUrl: record.imageUrl
                }))} 
                onSelectRecord={(record) => handleViewDetails(record.radiografia_id)} 
              />
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
