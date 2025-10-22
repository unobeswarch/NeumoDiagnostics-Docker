"use client"

import { redirect } from 'next/navigation'
import { getUserFromToken } from '@/server-actions/auth-actions'

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
  fechaProcesamiento?: string // Hacer opcional
}

interface PreDiagnostic {
  prediagnostic_id: string
  pacienteId: string
  urlrad?: string // Hacer opcional para evitar conflictos de tipos
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
  name: string
}

interface RadiographDetailHU7Props {
  diagnostic: any
  caseDetail: CaseDetail
  name: string
  userAge?: string | number  // Añadir age como prop opcional
}

export function RadiographDetailHU7({ diagnostic, caseDetail, name, userAge }: RadiographDetailHU7Props) {

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
                    src={caseDetail.urlImagen ? `http://localhost:8080/prediagnostic/image/${caseDetail.urlImagen.split('/').pop()}` : undefined}
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
                  <span className="text-sm font-medium text-gray-900">{name || 'Paciente'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">ID Paciente</span>
                  <span className="text-sm font-medium text-gray-900">{caseDetail.preDiagnostic.pacienteId}</span>
                </div>
              </div>
            </div>

            {/* Diagnosis Details */}
            <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Detalles del Diagnóstico</h2>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Fecha de Subida</span>
                  <span className="text-sm font-medium text-gray-900">{formatDate(caseDetail.fechaSubida)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Fecha de Diagnóstico</span>
                  <span className="text-sm font-medium text-gray-900">
                    {caseDetail.diagnostic?.fechaRevision ? 
                      formatDate(caseDetail.diagnostic.fechaRevision) : 
                      (caseDetail.preDiagnostic.estado?.toLowerCase() === 'validado' ? 
                        formatDate(caseDetail.preDiagnostic.resultadosModelo.fechaProcesamiento || caseDetail.fechaSubida) : 
                        'Pendiente')}
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

            {/* Doctor Diagnosis Information */}
            <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Diagnóstico Médico</h2>
              {diagnostic ? (
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Estado de Aprobación</span>
                    <span className={`text-sm font-medium ${
                      diagnostic.aprobacion === true
                        ? 'text-green-600'
                        : diagnostic.aprobacion === false
                        ? 'text-red-600'
                        : 'text-gray-900'
                    }`}>
                      {diagnostic.aprobacion === 'aprobado' || diagnostic.aprobacion === true
                        ? 'Aprobado' 
                        : diagnostic.aprobacion === 'rechazado' || diagnostic.aprobacion === false
                        ? 'No Aprobado'
                        : diagnostic.aprobacion || 'No especificado'}
                    </span>
                  </div>
                  <div className="pt-2">
                    <span className="text-sm text-gray-500 block mb-1">Comentarios</span>
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {diagnostic.comentarios || 'Sin comentarios adicionales'}
                      </p>
                    </div>
                  </div>
                </div>
              ) : caseDetail.preDiagnostic.estado?.toLowerCase() === 'validado' ? (
                <div className="space-y-3">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-3">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm font-medium text-green-800">Caso validado por un médico</span>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Estado</span>
                    <span className="text-sm font-medium text-green-600">Validado</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Fecha de Validación</span>
                    <span className="text-sm font-medium text-gray-900">
                      {formatDate(caseDetail.preDiagnostic.resultadosModelo.fechaProcesamiento || caseDetail.fechaSubida)}
                    </span>
                  </div>
                  <div className="pt-2">
                    <span className="text-sm text-gray-500 block mb-1">Información</span>
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                      <p className="text-sm text-gray-700 leading-relaxed">
                        Este caso ha sido revisado y validado por un médico. El diagnóstico por IA ha sido confirmado como correcto.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <div className="text-gray-400 mb-2">
                    <svg className="mx-auto h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-500">Diagnóstico médico pendiente</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Un doctor revisará este caso próximamente
                  </p>
                </div>
              )}
            </div>
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