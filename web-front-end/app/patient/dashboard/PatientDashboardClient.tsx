"use client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useState, } from "react"
import { FileImage, Eye, Clock, CheckCircle } from "lucide-react"
import { PatientHeader } from "@/components/patient-header"
import { UploadRadiography } from "@/components/upload-radiography"
import { RadiographyHistory } from "@/components/radiography-history"
import { useRouter } from "next/navigation"


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

interface User {
  id: string
  name: string
  email: string
  role: "paciente" | "doctor"
  avatar?: string
}

interface PatientDashboardClientProps {
  currentUser: User
  records: RadiographyRecord[]
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

export default function PatientDashboardClient({ currentUser, records }: PatientDashboardClientProps) {
  const router = useRouter()
  
  // Sort records by upload date (most recent first)
  const sortedRecords = [...records].sort((a, b) => 
    new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()
  )
  
  const [localRecords, setLocalRecords] = useState<RadiographyRecord[]>(sortedRecords)

  // Helper function to convert status from English to Spanish
  const getSpanishStatus = (status: "uploaded" | "processed" | "validated"): "subido" | "procesado" | "validado" => {
    if (status === "validated") return "validado"
    if (status === "processed") return "procesado"
    return "subido"
  }

  const handleUploadSuccess = (newRecord: RadiographyRecord) => {
    const updatedRecords = [newRecord, ...localRecords]
    // Re-sort after adding new record to maintain chronological order
    const newSortedRecords = updatedRecords.sort((a, b) => 
      new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()
    )
    setLocalRecords(newSortedRecords)
  }

  const handleViewDetails = (id: string) => {
    router.push(`/patient/radiograph/${id}`)
  }

  return (
    <div className="min-h-screen bg-background">
      <PatientHeader 
        id={currentUser.id}
        name={currentUser.name}
        email={currentUser.email}
        role={currentUser.role}
        avatar={currentUser.avatar}
      />

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

            {/* Stats Cards */}
            {(
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-card border-border">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-card-foreground">Número de registros</CardTitle>
                    <FileImage className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-card-foreground">{sortedRecords.length}</div>
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
                      {sortedRecords.filter((r) => r.status === "validated").length}
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
                      {sortedRecords.filter((r) => r.status !== "validated").length}
                    </div>
                    <p className="text-xs text-muted-foreground">En espera de revisión</p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Recent Records */}
            {(
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-card-foreground">Registros recientes</CardTitle>
                  <CardDescription>Tus radiografías más recientes</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {sortedRecords.slice(0, 3).map((record) => (
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
                            {getSpanishStatus(record.status)}
                          </Badge>
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                    ))}
                    {sortedRecords.length === 0 && (
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
            {(
              <RadiographyHistory 
                records={sortedRecords.map(record => ({
                  radiografia_id: record.id,
                  fecha_subida: record.uploadDate,
                  estado: getSpanishStatus(record.status),
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
