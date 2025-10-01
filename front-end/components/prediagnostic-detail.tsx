"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Download, FileImage, Clock, User, Calendar, Brain, AlertTriangle, CheckCircle, FileText, Stethoscope, Share, Send } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { PreDiagnosticService } from "@/lib/prediagnostic-service"
import { DiagnosticService, DiagnosticPayload } from "@/lib/diagnostic-service"

// Datos mock SIN fechaProcesamiento para evitar errores
const mockDetailData: Record<string, any> = {
  "da939374-aab5-40ab-9b78-0ec37b86d616": {
    prediagnostic_id: "da939374-aab5-40ab-9b78-0ec37b86d616",
    pacienteId: "P001",
    estado: "procesado",
    urlrad: "https://via.placeholder.com/400x300/1f2937/ffffff?text=Radiografia+Mock+P001",
    fechaSubida: "2024-01-15T10:30:00Z",
    resultadosModelo: {
      probNeumonia: 0.85,
      etiqueta: "Neumonía"
    },
    radiografia: {
      url: "https://via.placeholder.com/400x300/1f2937/ffffff?text=Radiografia+Torax+P001",
      fechaCaptura: "2024-01-15T09:00:00Z",
      observaciones: "Radiografía de tórax PA y lateral"
    },
    paciente: {
      nombre: "Juan Pérez",
      edad: 45,
      genero: "Masculino"
    }
  },
  "mock-2": {
    prediagnostic_id: "mock-2",
    pacienteId: "P002",
    estado: "procesado",
    urlrad: "https://via.placeholder.com/400x300/065f46/ffffff?text=Radiografia+Mock+P002",
    fechaSubida: "2024-01-14T14:20:00Z",
    resultadosModelo: {
      probNeumonia: 0.25,
      etiqueta: "Normal"
    },
    radiografia: {
      url: "https://via.placeholder.com/400x300/065f46/ffffff?text=Radiografia+Normal+P002",
      fechaCaptura: "2024-01-14T11:30:00Z",
      observaciones: "Radiografía de control - Sin anomalías"
    },
    paciente: {
      nombre: "María García",
      edad: 32,
      genero: "Femenino"
    }
  }
}

interface PreDiagnosticDetailProps {
  prediagnosticId: string
}

export function PreDiagnosticDetail({ prediagnosticId }: PreDiagnosticDetailProps) {
  const router = useRouter()
  const { toast } = useToast()
  
  // Estados para el diagnóstico médico
  const [approval, setApproval] = useState<"Si" | "No" | null>(null)
  const [medicalComment, setMedicalComment] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Estados para los datos del prediagnóstico
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isUsingMockData, setIsUsingMockData] = useState(false)
  
  // Estados de validación
  const [errors, setErrors] = useState<string[]>([])

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      
      try {
        // PRIMERO: Intentar obtener datos del backend real
        console.log(`🔍 Intentando obtener datos del backend para ID: ${prediagnosticId}`)
        
        const debugResult = await PreDiagnosticService.debugConnection(prediagnosticId)
        
        if (debugResult.success) {
          // Si llegamos aquí, el backend respondió correctamente
          console.log("✅ Datos obtenidos del backend:", debugResult.data)
          const backendData = debugResult.data.getPreDiagnostic
          
          setData({
            ...backendData,
            // Agregar datos adicionales para completar la vista
            radiografia: {
              url: backendData.urlrad || `https://via.placeholder.com/400x300/1f2937/ffffff?text=Radiografia+Real+${backendData.pacienteId}`,
              fechaCaptura: backendData.fechaSubida,
              observaciones: `Estado: ${backendData.estado}`
            },
            paciente: {
              nombre: `Paciente ${backendData.pacienteId}`,
              edad: 45,
              genero: "No especificado"
            }
          })
          setIsUsingMockData(false)
        } else {
          throw new Error(debugResult.error || 'Error de conexión')
        }
        
      } catch (error) {
        // FALLBACK: Si el backend falla, usar datos mock
        console.log("⚠️ Backend no disponible, usando datos mock:", error)
        const mockData = mockDetailData[prediagnosticId]
        
        if (mockData) {
          console.log("📝 Usando datos mock para ID:", prediagnosticId)
          setData(mockData)
          setIsUsingMockData(true)
        } else {
          console.log("❌ No hay datos mock para este ID")
          setData(null)
          setIsUsingMockData(true)
        }
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [prediagnosticId])

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-gray-300 rounded mb-4"></div>
          <div className="h-32 bg-gray-300 rounded"></div>
        </div>
      </div>
    )
  }

  // No data state  
  if (!data) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Prediagnóstico no encontrado
        </h3>
        <p className="text-gray-600">
          No se pudo encontrar el prediagnóstico con ID: {prediagnosticId}
        </p>
        <p className="text-sm text-gray-500 mt-2">
          Verifica que el ID sea correcto y que el backend esté disponible.
        </p>
      </div>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getProbabilityColor = (prob: number) => {
    if (prob >= 0.8) return "text-red-600"
    if (prob >= 0.5) return "text-yellow-600"
    return "text-green-600"
  }

  const getProbabilityBadgeVariant = (prob: number) => {
    if (prob >= 0.8) return "destructive"
    if (prob >= 0.5) return "outline"
    return "secondary"
  }

  // Función para validar y enviar el diagnóstico
  const handleSubmitDiagnostic = async () => {
    // Limpiar errores previos
    setErrors([])
    
    // Validar campos requeridos
    const validationErrors: string[] = []
    
    if (!approval) {
      validationErrors.push("Debe seleccionar si aprueba o rechaza el resultado del modelo")
    }
    
    if (!medicalComment.trim()) {
      validationErrors.push("El comentario médico es obligatorio")
    } else if (medicalComment.trim().length < 10) {
      validationErrors.push("El comentario médico debe tener al menos 10 caracteres")
    } else if (medicalComment.length > 1000) {
      validationErrors.push("El comentario médico no puede exceder 1000 caracteres")
    }
    
    if (validationErrors.length > 0) {
      setErrors(validationErrors)
      toast({
        title: "Errores de validación",
        description: validationErrors.join(", "),
        variant: "destructive"
      })
      return
    }
    
    // Construir payload
    const diagnostic: DiagnosticPayload = {
      aprobacion: approval!,
      comentario: medicalComment.trim()
    }
    
    setIsSubmitting(true)
    
    try {
      // Enviar diagnóstico al backend
      const result = await DiagnosticService.createDiagnostic(prediagnosticId, diagnostic)
      
      if (result.success) {
        // Mostrar notificación de éxito
        toast({
          title: "Diagnóstico enviado",
          description: result.message,
          variant: "default"
        })
        
        // Redirigir al dashboard de casos pendientes después de un breve delay
        setTimeout(() => {
          router.push('/doctor/casos-pendientes')
        }, 2000)
        
      } else {
        // Mostrar error
        toast({
          title: "Error al enviar diagnóstico",
          description: result.message,
          variant: "destructive"
        })
      }
      
    } catch (error) {
      console.error('Error al enviar diagnóstico:', error)
      toast({
        title: "Error inesperado",
        description: "No se pudo enviar el diagnóstico. Intente nuevamente.",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header con indicador de fuente de datos */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => router.push('/doctor/dashboard')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al Dashboard
          </Button>
        </div>
        <div className="flex items-center space-x-2">
          {isUsingMockData ? (
            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
              <AlertTriangle className="w-3 h-3 mr-1" />
              Datos Mock
            </Badge>
          ) : (
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              <CheckCircle className="w-3 h-3 mr-1" />
              Datos Backend
            </Badge>
          )}
        </div>
      </div>

      {/* Layout de dos columnas principales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* COLUMNA IZQUIERDA: Información del Paciente + Radiografía */}
        <div className="space-y-6">
          {/* Información del Paciente */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="w-5 h-5 mr-2 text-blue-600" />
                Información del Paciente
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4">
              <div>
                <p className="text-sm text-gray-500">Nombre</p>
                <p className="font-medium">{data.paciente?.nombre || `Paciente ${data.pacienteId}`}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Edad</p>
                  <p className="font-medium">{data.paciente?.edad || "No especificada"} años</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Género</p>
                  <p className="font-medium">{data.paciente?.genero || "No especificado"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Radiografía */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileImage className="w-5 h-5 mr-2 text-green-600" />
                Radiografía de Tórax
              </CardTitle>
              <CardDescription>
                Subida el {formatDate(data.fechaSubida)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="relative bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src={data.radiografia?.url || data.urlrad}
                    alt="Radiografía de tórax"
                    className="w-full h-80 object-contain"
                  />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Detalles de la Imagen</h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p><Calendar className="w-4 h-4 inline mr-2" />
                      Fecha: {formatDate(data.radiografia?.fechaCaptura || data.fechaSubida)}
                    </p>
                    <p><FileText className="w-4 h-4 inline mr-2" />
                      {data.radiografia?.observaciones || "Sin observaciones adicionales"}
                    </p>
                  </div>
                  <Button variant="outline" className="w-full mt-3">
                    <Download className="w-4 h-4 mr-2" />
                    Descargar Imagen
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* COLUMNA DERECHA: Resultados del Modelo + Validación Médica */}
        <div className="space-y-6">
          {/* Resultados del Modelo IA */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Brain className="w-5 h-5 mr-2 text-purple-600" />
                Resultados del Modelo IA
              </CardTitle>
              <CardDescription>
                Procesado el {formatDate(data.fechaSubida)}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Probabilidad de Neumonía</h4>
                <div className="flex items-center space-x-3">
                  <div className="flex-1 bg-gray-200 rounded-full h-3">
                    <div 
                      className={`h-3 rounded-full ${
                        data.resultadosModelo.probNeumonia >= 0.8 ? 'bg-red-500' :
                        data.resultadosModelo.probNeumonia >= 0.5 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${data.resultadosModelo.probNeumonia * 100}%` }}
                    />
                  </div>
                  <span className={`font-bold text-lg ${getProbabilityColor(data.resultadosModelo.probNeumonia)}`}>
                    {(data.resultadosModelo.probNeumonia * 100).toFixed(1)}%
                  </span>
                </div>
                <Badge 
                  variant={getProbabilityBadgeVariant(data.resultadosModelo.probNeumonia)}
                  className="mt-2"
                >
                  {data.resultadosModelo.etiqueta}
                </Badge>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Detalles del Procesamiento</h4>
                <div className="space-y-2 text-sm text-gray-600">
                  <p><Clock className="w-4 h-4 inline mr-2" />
                    Procesado: {formatDate(data.fechaSubida)}
                  </p>
                  <p><CheckCircle className="w-4 h-4 inline mr-2" />
                    Estado: {data.estado}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Diagnóstico Médico - HU5 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Stethoscope className="w-5 h-5 mr-2 text-red-600" />
                Diagnóstico Médico
              </CardTitle>
              <CardDescription>
                Registre su diagnóstico aprobando o rechazando el resultado del modelo IA
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Mostrar errores de validación */}
              {errors.length > 0 && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center mb-2">
                    <AlertTriangle className="w-4 h-4 text-red-600 mr-2" />
                    <p className="text-sm font-medium text-red-800">Errores de validación:</p>
                  </div>
                  <ul className="text-sm text-red-700 space-y-1">
                    {errors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Checkbox para aprobar o rechazar */}
              <div className="space-y-4">
                <Label className="text-sm font-medium text-gray-700">
                  Aprobación del resultado del modelo IA *
                </Label>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Checkbox 
                      id="approve"
                      checked={approval === "Si"}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setApproval("Si")
                          setErrors(errors.filter(e => !e.includes("seleccionar si aprueba")))
                        } else if (approval === "Si") {
                          setApproval(null)
                        }
                      }}
                      className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                    />
                    <Label htmlFor="approve" className="text-sm cursor-pointer">
                      ✅ <strong>Apruebo</strong> el diagnóstico del modelo IA
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Checkbox 
                      id="reject"
                      checked={approval === "No"}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setApproval("No")
                          setErrors(errors.filter(e => !e.includes("seleccionar si aprueba")))
                        } else if (approval === "No") {
                          setApproval(null)
                        }
                      }}
                      className="data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600"
                    />
                    <Label htmlFor="reject" className="text-sm cursor-pointer">
                      ❌ <strong>Rechazo</strong> el diagnóstico del modelo IA
                    </Label>
                  </div>
                </div>
                {approval && (
                  <div className="mt-2 p-3 rounded-lg bg-gray-50">
                    <p className="text-sm text-gray-700">
                      <strong>Seleccionado:</strong> {approval === "Si" ? "Aprobado" : "Rechazado"}
                    </p>
                  </div>
                )}
              </div>

              {/* Comentario médico */}
              <div>
                <Label htmlFor="medical-comment" className="text-sm font-medium text-gray-700">
                  Criterio médico * (mínimo 10 caracteres)
                </Label>
                <Textarea
                  id="medical-comment"
                  placeholder="Ingrese su criterio médico, observaciones clínicas, recomendaciones de tratamiento y justificación de su decisión diagnóstica..."
                  value={medicalComment}
                  onChange={(e) => {
                    setMedicalComment(e.target.value)
                    // Limpiar errores relacionados con el comentario
                    setErrors(errors.filter(e => !e.includes("comentario")))
                  }}
                  className={`mt-2 min-h-[120px] ${
                    errors.some(e => e.includes("comentario")) ? "border-red-500" : ""
                  }`}
                  maxLength={1000}
                />
                <div className="flex justify-between mt-1">
                  <p className="text-xs text-gray-500">
                    {medicalComment.length}/1000 caracteres
                  </p>
                  <p className="text-xs text-gray-500">
                    Mínimo: 10 caracteres
                  </p>
                </div>
              </div>

              {/* Botón de envío */}
              <div className="pt-4 border-t">
                <Button 
                  onClick={handleSubmitDiagnostic}
                  disabled={isSubmitting}
                  className="w-full"
                  size="lg"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Enviando diagnóstico...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Enviar Diagnóstico
                    </>
                  )}
                </Button>
                
                {/* Información adicional */}
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Al enviar el diagnóstico será redirigido al dashboard de casos pendientes
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
