"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/components/auth-context'
import { GraphQLClient } from '@/lib/apollo-client'

// GraphQL Query específica para HU7
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

// TypeScript interfaces for HU7 data
interface ResultadosModelo {
  probNeumonia: number
  etiqueta: string
  fechaProcesamiento: string
}

interface PreDiagnostic {
  prediagnostic_id: string
  pacienteId: string
  urlrad: string
  estado: string
  resultadosModelo: ResultadosModelo
  fechaSubida: string
}

interface Diagnostic {
  id: string
  prediagnosticoId: string
  aprobacion: string
  comentarios: string
  fechaRevision: string
  doctorNombre?: string
}

interface CaseDetail {
  id: string
  radiografiaId: string
  urlImagen: string
  estado: string
  fechaSubida: string
  preDiagnostic: PreDiagnostic
  diagnostic?: Diagnostic
}

interface GetCaseDetailResponse {
  caseDetail: CaseDetail
}

interface RadiographDetailHU7Props {
  caseId: string
}

export function RadiographDetailHU7({ caseId }: RadiographDetailHU7Props) {
  const { user } = useAuth()
  const [data, setData] = useState<GetCaseDetailResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchCaseDetail() {
      // Solo ejecutar si hay usuario autenticado y es paciente
      if (!user || user.role !== 'paciente') {
        setLoading(false)
        setError('Usuario no autorizado')
        return
      }

      try {
        setLoading(true)
        setError(null)
        
        const result = await GraphQLClient.query<GetCaseDetailResponse>(
          GET_CASE_DETAIL,
          { id: caseId }
        )
        
        setData(result)
      } catch (err) {
        console.error('Error fetching case detail:', err)
        setError(err instanceof Error ? err.message : 'Error desconocido')
      } finally {
        setLoading(false)
      }
    }

    fetchCaseDetail()
  }, [caseId, user])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Cargando detalles de la radiografía...</p>
        </div>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-red-50 p-8 rounded-lg border border-red-200 max-w-md">
          <div className="text-red-600 text-xl font-semibold mb-4">Error</div>
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    )
  }
  
  if (!data?.caseDetail) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-yellow-50 p-8 rounded-lg border border-yellow-200 max-w-md">
          <div className="text-yellow-600 text-xl font-semibold mb-4">No encontrado</div>
          <p className="text-yellow-700">Radiografía no encontrada</p>
        </div>
      </div>
    )
  }

  const { caseDetail } = data

  return (
    <div className="h-[80vh] bg-gray-50 overflow-hidden rounded-lg">
      {/* Main content - full width layout */}
      <div className="h-full w-full px-6 py-4">
        {/* Full width two column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 h-full">
          {/* Left Column - Radiograph Image (3/5 width) */}
          <div className="lg:col-span-3 h-full">
            <div className="bg-black rounded-xl overflow-hidden shadow-lg h-full">
              <div className="h-full bg-black flex items-center justify-center">
                {caseDetail.urlImagen ? (
                  <img 
                    src={caseDetail.urlImagen} 
                    alt="Radiografía pulmonar"
                    className="max-w-full max-h-full object-contain"
                    onError={(e) => {
                      console.error("❌ Failed to load HU7 image:", caseDetail.urlImagen);
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent) {
                        parent.innerHTML = `
                          <div class="w-full h-full flex items-center justify-center">
                            <div class="text-white/60 text-center">
                              <svg class="mx-auto h-16 w-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <p class="text-sm">Error cargando imagen</p>
                            </div>
                          </div>
                        `;
                      }
                    }}
                    onLoad={() => {
                      console.log("✅ HU7 Image loaded successfully:", caseDetail.urlImagen);
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-white/60 text-center">
                      <svg className="mx-auto h-16 w-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-sm">Imagen no disponible</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Patient Info and Results (2/5 width) */}
          <div className="lg:col-span-2 h-full overflow-y-auto">
            <div className="space-y-4 pr-2">
            {/* Patient Information */}
            <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Información del Paciente</h2>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Nombre</span>
                  <span className="text-sm font-medium text-gray-900">{user?.name || 'Paciente'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">ID Paciente</span>
                  <span className="text-sm font-medium text-gray-900">{caseDetail.preDiagnostic.pacienteId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Fecha de Nacimiento</span>
                  <span className="text-sm font-medium text-gray-900">25 de Agosto, 1985</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Sexo</span>
                  <span className="text-sm font-medium text-gray-900">Femenino</span>
                </div>
              </div>
            </div>

            {/* Diagnosis Details */}
            <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Detalles del Diagnóstico</h2>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Fecha de Radiografía</span>
                  <span className="text-sm font-medium text-gray-900">{formatDate(caseDetail.fechaSubida)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Fecha de Diagnóstico</span>
                  <span className="text-sm font-medium text-gray-900">
                    {caseDetail.diagnostic ? formatDate(caseDetail.diagnostic.fechaRevision) : 'Pendiente'}
                  </span>
                </div>
              </div>
            </div>

            {/* AI Analysis Results - matching mockup style */}
            <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Resultado</h2>
              
              <div className={`p-4 rounded-lg ${
                caseDetail.preDiagnostic.resultadosModelo.etiqueta === "No Pneumonia" 
                  ? "bg-green-50 border border-green-200" 
                  : "bg-blue-50 border border-blue-200"
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      caseDetail.preDiagnostic.resultadosModelo.etiqueta === "No Pneumonia"
                        ? "bg-green-100"
                        : "bg-blue-100"
                    }`}>
                      <svg className={`w-6 h-6 ${
                        caseDetail.preDiagnostic.resultadosModelo.etiqueta === "No Pneumonia"
                          ? "text-green-600"
                          : "text-blue-600"
                      }`} fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <h3 className={`text-lg font-bold ${
                        caseDetail.preDiagnostic.resultadosModelo.etiqueta === "No Pneumonia"
                          ? "text-green-700"
                          : "text-blue-700"
                      }`}>
                        {caseDetail.preDiagnostic.resultadosModelo.etiqueta === "No Pneumonia" ? "No Pneumonia" : "Neumonía"}
                      </h3>
                      <p className="text-sm text-gray-600">Confirmado por IA</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-3xl font-bold ${
                      caseDetail.preDiagnostic.resultadosModelo.etiqueta === "No Pneumonia"
                        ? "text-green-600"
                        : "text-blue-600"
                    }`}>
                      {Math.round((caseDetail.preDiagnostic.resultadosModelo.etiqueta === "No Pneumonia" ? 
                        (1 - caseDetail.preDiagnostic.resultadosModelo.probNeumonia) : 
                        caseDetail.preDiagnostic.resultadosModelo.probNeumonia) * 100)}%
                    </div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide">Probabilidad</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Medical Comments Section */}
            {caseDetail.diagnostic && (
              <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">Comentarios del Médico</h2>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <p className="text-gray-700 italic leading-relaxed text-sm mb-4">
                    "{caseDetail.diagnostic.comentarios}"
                  </p>
                  <div className="flex justify-between items-center text-xs text-gray-500 pt-3 border-t border-gray-200">
                    <span className="font-medium">- {caseDetail.diagnostic.doctorNombre || 'Dr. Carlos Vega'}</span>
                    <span>{formatDate(caseDetail.diagnostic.fechaRevision)}</span>
                  </div>
                </div>
              </div>
            )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Funciones helper (simplificadas para evitar problemas de tipos)  
function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long', 
    day: 'numeric'
  })
}