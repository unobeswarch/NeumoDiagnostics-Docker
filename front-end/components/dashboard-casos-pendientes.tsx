"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  FileImage,
  Clock,
  User,
  Calendar,
  AlertTriangle,
  RefreshCw,
  CheckCircle,
  XCircle,
  Construction,
} from "lucide-react"
import { CasesService, type Case } from "@/lib/cases-service"

export function DashboardCasosPendientes() {
  const [cases, setCases] = useState<Case[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isUsingMockData, setIsUsingMockData] = useState(false)

  // Mock data for development when backend is not available
  const mockCases: Case[] = [
    {
      id: "case-001",
      patientId: "P001",
      caseDate: "2025-01-15T10:30:00Z",
      currentStatus: "procesado",
      patientName: "Juan Pérez",
      aiDiagnosis: "Neumonía",
      aiConfidence: 0.85,
      urgency: "urgent",
      imageUrl: "https://via.placeholder.com/400x300/1f2937/ffffff?text=Caso+P001",
    },
    {
      id: "case-002",
      patientId: "P002",
      caseDate: "2025-01-14T14:20:00Z",
      currentStatus: "procesado",
      patientName: "María García",
      aiDiagnosis: "Normal",
      aiConfidence: 0.25,
      urgency: "routine",
      imageUrl: "https://via.placeholder.com/400x300/065f46/ffffff?text=Caso+P002",
    },
    {
      id: "case-003",
      patientId: "P003",
      caseDate: "2025-01-13T09:15:00Z",
      currentStatus: "procesado",
      patientName: "Carlos López",
      aiDiagnosis: "Neumonía",
      aiConfidence: 0.72,
      urgency: "urgent",
      imageUrl: "https://via.placeholder.com/400x300/991b1b/ffffff?text=Caso+P003",
    },
  ]

  const fetchCases = async () => {
    setLoading(true)
    setError(null)

    try {
      console.log("🔍 Attempting to fetch cases from backend...")

      // Try to fetch from the real backend first
      const backendCases = await CasesService.getCases()

      console.log("✅ Cases fetched from backend:", backendCases)
      setCases(backendCases)
      setIsUsingMockData(false)
    } catch (error) {
      console.log("⚠️ Backend not available, using mock data:", error)

      // Fallback to mock data
      setCases(mockCases)
      setIsUsingMockData(true)
      setError("Backend no disponible - usando datos de prueba")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCases()
  }, [])

  const handleRefresh = () => {
    fetchCases()
  }

  const formatDate = (dateString: string): string => {
    return CasesService.formatDate(dateString)
  }

  const getBadgeColor = (status: string): string => {
    switch (status.toLowerCase()) {
      case "procesado":
        return "bg-green-100 text-green-800"
      case "pendiente":
        return "bg-yellow-100 text-yellow-800"
      case "error":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const availableCases = cases.filter((c) => CasesService.getUrgencyLevel(c) !== "urgent")
  const urgentCases = cases.filter((c) => CasesService.getUrgencyLevel(c) === "urgent")

  const CaseCard = ({ case: caseData }: { case: Case }) => {
    const isUrgent = CasesService.getUrgencyLevel(caseData) === "urgent"
    const badgeColor = getBadgeColor(caseData.currentStatus)

    return (
      <div className="flex items-center justify-between p-4 bg-background rounded-lg border border-border hover:bg-accent transition-colors cursor-pointer">
        <div className="flex items-center gap-4">
          <div
            className={`w-12 h-12 rounded-lg flex items-center justify-center ${
              isUrgent ? "bg-red-100" : "bg-blue-100"
            }`}
          >
            <FileImage className={`h-6 w-6 ${isUrgent ? "text-red-600" : "text-blue-600"}`} />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <User className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium text-foreground">Paciente: {caseData.patientId}</span>
              {caseData.patientName && <span className="text-sm text-muted-foreground">({caseData.patientName})</span>}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span>Fecha: {formatDate(caseData.caseDate)}</span>
            </div>
            {caseData.aiDiagnosis && (
              <div className="text-sm text-muted-foreground mt-1">Diagnóstico IA: {caseData.aiDiagnosis}</div>
            )}
          </div>
        </div>
        <div className="text-right space-y-2">
          <div className="flex gap-2">
            <Badge className={badgeColor}>{caseData.currentStatus}</Badge>
            <Badge variant={isUrgent ? "destructive" : "secondary"}>{isUrgent ? "Urgente" : "Rutina"}</Badge>
          </div>
          {caseData.aiConfidence && (
            <div className="text-sm text-muted-foreground">Confianza: {(caseData.aiConfidence * 100).toFixed(1)}%</div>
          )}
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-foreground">Casos Pendientes</h2>
          <div className="animate-pulse">
            <div className="h-10 w-32 bg-gray-300 rounded"></div>
          </div>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-20 bg-gray-300 rounded-lg"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Casos Pendientes</h2>
          <p className="text-muted-foreground">Lista de casos de pacientes para revisión médica</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center gap-2 bg-transparent"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Actualizar
          </Button>
          {isUsingMockData ? (
            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
              <AlertTriangle className="w-3 h-3 mr-1" />
              Datos Mock
            </Badge>
          ) : (
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              <CheckCircle className="w-3 h-3 mr-1" />
              Backend Conectado
            </Badge>
          )}
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Card className="bg-yellow-50 border-yellow-200">
          <CardHeader>
            <CardTitle className="text-yellow-800 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Aviso
            </CardTitle>
            <CardDescription className="text-yellow-700">{error}</CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-card-foreground">Total Casos</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-card-foreground">{cases.length}</div>
            <p className="text-xs text-muted-foreground">Pendientes de revisión</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-card-foreground">Urgentes</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {cases.filter((c) => CasesService.getUrgencyLevel(c) === "urgent").length}
            </div>
            <p className="text-xs text-muted-foreground">Requieren atención inmediata</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-card-foreground">Estado</CardTitle>
            {error ? <XCircle className="h-4 w-4 text-red-500" /> : <CheckCircle className="h-4 w-4 text-green-500" />}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${error ? "text-red-500" : "text-green-500"}`}>{error ? "!" : "✓"}</div>
            <p className="text-xs text-muted-foreground">{error ? "Con errores" : "Funcionando"}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-card-foreground flex items-center gap-2">
            <FileImage className="w-5 h-5" />
            Casos Disponibles
          </CardTitle>
          <CardDescription>Casos regulares pendientes de revisión médica</CardDescription>
        </CardHeader>
        <CardContent>
          {availableCases.length === 0 ? (
            <div className="text-center py-8">
              <FileImage className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No hay casos disponibles</p>
            </div>
          ) : (
            <div className="space-y-3">
              {availableCases.map((caseData) => (
                <CaseCard key={caseData.id} case={caseData} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-card border-border border-red-200">
        <CardHeader>
          <CardTitle className="text-card-foreground flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            Casos Urgentes
            <Badge variant="secondary" className="bg-orange-100 text-orange-800 ml-2">
              <Construction className="w-3 h-3 mr-1" />
              En Desarrollo
            </Badge>
          </CardTitle>
          <CardDescription>
            Casos que requieren atención médica inmediata
            <span className="block text-orange-600 text-sm mt-1">
              * La clasificación automática de urgencia está en desarrollo
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          {urgentCases.length === 0 ? (
            <div className="text-center py-8">
              <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No hay casos urgentes</p>
              <p className="text-sm text-orange-600 mt-2">La IA aún no clasifica casos como urgentes automáticamente</p>
            </div>
          ) : (
            <div className="space-y-3">
              {urgentCases.map((caseData) => (
                <CaseCard key={caseData.id} case={caseData} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
