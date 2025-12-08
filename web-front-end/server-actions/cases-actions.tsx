"use server"

import { GraphQLClient } from '@/lib/apollo-client'
import { 
  GET_PREDIAGNOSTIC, 
  GetPreDiagnosticResponse, 
  PreDiagnostic,
  CREATE_DIAGNOSTIC,
  CreateDiagnosticResponse
} from '@/lib/graphql-queries';
import { DiagnosticPayload} from '@/lib/diagnostic-service';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getUserFromToken } from './auth-actions';
import { headers } from 'next/headers';

interface ResultadosModelo {
  probNeumonia: number
  etiqueta: string
  fechaProcesamiento: string
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

export async function getCaseDetail(id: string, token: string): Promise<GetCaseDetailResponse | null> {
  try {
    const result = await GraphQLClient.query<GetCaseDetailResponse>(
      GET_CASE_DETAIL,
      { id },
      token
    )
    return result || null
  } catch (err) {
    console.error('Error fetching case detail:', err)
    return null
  }
}

export async function getAllCases(){
  try {
    const response = await fetch("http://reverse-proxy/prediagnostic/cases")
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const pythonCases = await response.json()
    return pythonCases
  } catch (err) {
    console.error('Error fetching case detail:', err)
    return null
  }
}

export async function getPreDiagnostic(id: string): Promise<any> {
  try {
    const data = await GraphQLClient.query<GetPreDiagnosticResponse>(
      GET_PREDIAGNOSTIC,
      { id },
    );
      
    if (!data) {
      throw new Error('No se recibieron datos del servidor');
    }
      
    return data.getPreDiagnostic;
  } catch (error) {
    console.error('Error al obtener prediagnóstico:', error);
    throw new Error('No se pudo obtener el prediagnóstico. Verifica tu conexión.');
  }
}

export async function sendDiagnostic(prediagnosticId: string, diagnostic: DiagnosticPayload): Promise<CreateDiagnosticResponse> {
  const current_user = await getUserFromToken()
  const cookieStore = cookies()
  const token = cookieStore.get("auth-token")?.value
  
  if (!current_user) {
    redirect("/login")
  }

  try {
    const data = await GraphQLClient.query<CreateDiagnosticResponse>(
      CREATE_DIAGNOSTIC,
      {
        id_prediagnostico: prediagnosticId,
        input: {
          aprobacion: diagnostic.aprobacion,
          comentario: diagnostic.comentario
        }
      },
      token
    );
    return data
  } catch (error) {
    console.error('Error al enviar diagnóstico:', error);
    throw new Error('No se pudo obtener el prediagnóstico. Verifica tu conexión.');
  }
}

export async function UploadRadiographyImage(formData: FormData) {
  const current_user = await getUserFromToken();
  const cookieStore = cookies();
  const token = cookieStore.get("auth-token")?.value;
  
  if (!current_user) {
    redirect("/login");
  }

  const h = headers()
  
    const realIp = h.get("x-real-ip") || h.get("x-forwarded-for") || null
    
    const userAgent = h.get("user-agent") || ""

  try {
    const response = await fetch("http://reverse-proxy/query", {
      method: "POST",
      body: formData,
      headers: {
      "Authorization": `Bearer ${token}`,
      "X-Real-IP": realIp || "",
      "X-Forwarded-For": realIp || "",
      "User-Agent": userAgent,
    },
    })
    const result = await response.json()
    return result
    
  } catch (error) {
    console.error('Error al subir la radiografia:', error);
    throw new Error('No se pudo subir la radiografia. Verifica tu conexión.');
  }
  
}

export async function getDiagnostic(id:string) {
  const current_user = await getUserFromToken();
  const cookieStore = cookies();
  const token = cookieStore.get("auth-token")?.value;

  if (!current_user) {
    redirect("/login");
  }
  
  try {
    const response = await fetch(`http://reverse-proxy/prediagnostic/diagnostic/${id}`)
    const result = await response.json()
    return result
    
  } catch (error) {
    console.error('Error al obtener el diagnostico:', error);
    throw new Error('No se pudo obtener el diagnostico.');
  }
}

export async function getRadiographyImage(url: string): Promise<string | undefined> {
  if (!url) return undefined

  const token = cookies().get("auth-token")?.value
  if (!token) return undefined

  try {
    const res = await fetch(url, {
      cache: "no-store",
    })

    if (!res.ok) return undefined

    const buffer = await res.arrayBuffer()
    const base64 = Buffer.from(buffer).toString("base64")
    return `data:image/jpeg;base64,${base64}`
  } catch (error) {
    console.error("Error obteniendo la imagen:", error)
    return undefined
  }
}