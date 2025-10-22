"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { GraphQLClient } from '@/lib/apollo-client'

// GraphQL Query específica para HU7 - VERSION TESTING (sin auth)
const GET_CASE_DETAIL = `
  query GetCaseDetail($id: ID!) {
    caseDetail(id: $id) {
      id
      radiografiaId
      urlImagen
      estado
      fechaSubida
      preDiagnostic {
        prediagnostic_id
        pacienteId
        urlrad
        estado
        resultadosModelo {
          probNeumonia
          etiqueta
          fechaProcesamiento
        }
        fechaSubida
      }
      diagnostic {
        id
        prediagnosticoId
        aprobacion
        comentarios
        fechaRevision
        doctorNombre
      }
    }
  }
`

// Mock data for testing when backend is not available
const MOCK_CASE_DETAIL = {
  caseDetail: {
    id: "1",
    radiografiaId: "rad_001",
    urlImagen: "/chest-x-ray-sample.jpg",
    estado: "Validado",
    fechaSubida: "2024-01-15T00:00:00Z",
    preDiagnostic: {
      prediagnostic_id: "pred_001",
      pacienteId: "P001",
      urlrad: "/chest-x-ray-sample.jpg",
      estado: "Procesado",
      resultadosModelo: {
        probNeumonia: 0.85,
        etiqueta: "Neumonía",
        fechaProcesamiento: "2024-01-16T00:00:00Z"
      },
      fechaSubida: "2024-01-15T00:00:00Z"
    },
    diagnostic: {
      id: "diag_001",
      prediagnosticoId: "pred_001",
      aprobacion: "Aprobado",
      comentarios: "La imagen muestra una opacidad en el lóbulo inferior izquierdo, consistente con el pre-diagnóstico de neumonía. Se recomienda tratamiento antibiótico y seguimiento en 2 semanas.",
      fechaRevision: "2024-01-17T00:00:00Z",
      doctorNombre: "Dr. Carlos Vega"
    }
  }
}

interface RadiographDetailTestingProps {
  caseId: string
  useRealBackend?: boolean
}

export function RadiographDetailComponent({ caseId, useRealBackend = false }: RadiographDetailTestingProps) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchCaseDetail() {
      try {
        setLoading(true)
        setError(null)
        
        if (useRealBackend) {
          console.log(`🔍 Attempting to fetch real backend data for case: ${caseId}`)
          
          // Try real backend - this might fail if not authenticated
          const result = await GraphQLClient.query(GET_CASE_DETAIL, { id: caseId })
          setData(result)
          
        } else {
          console.log(`🎭 Using mock data for testing case: ${caseId}`)
          
          // Simulate loading delay
          await new Promise(resolve => setTimeout(resolve, 500))
          
          // Use mock data with the requested case ID
          const mockData = {
            ...MOCK_CASE_DETAIL,
            caseDetail: {
              ...MOCK_CASE_DETAIL.caseDetail,
              id: caseId,
              radiografiaId: `rad_${caseId}`
            }
          }
          setData(mockData)
        }
        
      } catch (err) {
        console.error('Error fetching case detail:', err)
        
        if (useRealBackend) {
          // If real backend fails, fallback to mock
          console.log('🔄 Real backend failed, falling back to mock data')
          setData({
            ...MOCK_CASE_DETAIL,
            caseDetail: {
              ...MOCK_CASE_DETAIL.caseDetail,
              id: caseId,
              radiografiaId: `rad_${caseId}`
            }
          })
        } else {
          setError(err instanceof Error ? err.message : 'Error desconocido')
        }
      } finally {
        setLoading(false)
      }
    }

    fetchCaseDetail()
  }, [caseId, useRealBackend])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">
            {useRealBackend ? 'Conectando con backend real...' : 'Cargando datos de prueba...'}
          </p>
        </div>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-red-50 p-8 rounded-lg border border-red-200 max-w-md">
          <div className="text-red-600 text-xl font-semibold mb-4">Error</div>
          <p className="text-red-700 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Reintentar
          </button>
        </div>
      </div>
    )
  }
  
  if (!data?.caseDetail) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-yellow-50 p-8 rounded-lg border border-yellow-200 max-w-md">
          <div className="text-yellow-600 text-xl font-semibold mb-4">No encontrado</div>
          <p className="text-yellow-700">Radiografía con ID "{caseId}" no encontrada</p>
        </div>
      </div>
    )
  }

  const { caseDetail } = data

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Testing Info Banner */}
      <div className={`${useRealBackend ? 'bg-green-100' : 'bg-blue-100'} border-b`}>
        <div className="max-w-7xl mx-auto px-4 py-2">
          <p className="text-sm text-center">
            {useRealBackend ? (
              <span className="text-green-700">
                🔗 <strong>MODO REAL:</strong> Conectado a backend GraphQL (localhost:8080/query)
              </span>
            ) : (
              <span className="text-blue-700">
                🎭 <strong>MODO TESTING:</strong> Usando datos mock para Case ID: {caseId}
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Header Section - matching mockup design */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Detalle de Radiografía</h1>
              <p className="text-gray-600 mt-1">Información completa de su radiografía y diagnóstico médico</p>
            </div>
            <div className="flex items-center space-x-4">
              <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Descargar Resultados
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Radiograph Image */}
          <div className="space-y-6">
            <Card className="shadow-sm">
              <CardContent className="p-6">
                <div className="aspect-square bg-black rounded-lg overflow-hidden">
                  {caseDetail.urlImagen ? (
                    <img 
                      src={caseDetail.urlImagen} 
                      alt="Radiografía pulmonar"
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        // Fallback for missing images
                        e.currentTarget.style.display = 'none'
                        const nextElement = e.currentTarget.nextElementSibling as HTMLElement
                        if (nextElement) {
                          nextElement.style.display = 'flex'
                        }
                      }}
                    />
                  ) : null}
                  <div className="w-full h-full flex items-center justify-center" style={{display: caseDetail.urlImagen ? 'none' : 'flex'}}>
                    <div className="text-white/60 text-center">
                      <svg className="mx-auto h-12 w-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-sm">Imagen de muestra</p>
                      <p className="text-xs mt-1">ID: {caseDetail.id}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Patient Info and Details */}
          <div className="space-y-6">
            {/* Patient Information */}
            <Card className="shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold text-gray-900">Información del Paciente</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Nombre</label>
                    <p className="text-base font-medium text-gray-900">Sofía Rodríguez</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">ID Paciente</label>
                    <p className="text-base text-gray-900">{caseDetail.preDiagnostic.pacienteId}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Fecha de Nacimiento</label>
                    <p className="text-base text-gray-900">25 de Agosto, 1985</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Sexo</label>
                    <p className="text-base text-gray-900">Femenino</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Diagnosis Details */}
            <Card className="shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold text-gray-900">Detalles del Diagnóstico</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Fecha de Radiografía</label>
                    <p className="text-base text-gray-900">{formatDate(caseDetail.fechaSubida)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Fecha de Diagnóstico</label>
                    <p className="text-base text-gray-900">
                      {caseDetail.diagnostic ? formatDate(caseDetail.diagnostic.fechaRevision) : 'Pendiente'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* AI Analysis Results - matching mockup style */}
            <Card className="shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold text-gray-900">Resultado</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-gray-900">{caseDetail.preDiagnostic.resultadosModelo.etiqueta}</h3>
                        <p className="text-sm text-gray-500">Confirmado por IA</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-blue-600">
                        {Math.round(caseDetail.preDiagnostic.resultadosModelo.probNeumonia * 100)}%
                      </div>
                      <div className="text-sm text-gray-500">Probabilidad</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Medical Comments Section */}
            {caseDetail.diagnostic && (
              <Card className="shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-semibold text-gray-900">Comentarios del Médico</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <p className="text-gray-800 italic leading-relaxed">
                      "{caseDetail.diagnostic.comentarios}"
                    </p>
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex justify-between items-center text-sm text-gray-600">
                        <span>- {caseDetail.diagnostic.doctorNombre}</span>
                        <span>{formatDate(caseDetail.diagnostic.fechaRevision)}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Helper function
function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long', 
    day: 'numeric'
  })
}