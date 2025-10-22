import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FileImage, Clock, CheckCircle, AlertTriangle, ArrowRight, TrendingUp, Activity } from "lucide-react"
import { DoctorHeader } from "@/components/doctor-header"
import Link from "next/link"
import { GraphQLClient } from '@/lib/apollo-client'
import { GET_CASES, Case, GetCasesResponse } from '@/lib/get-cases-query'
import { getUserFromToken } from "@/server-actions/auth-actions"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import DoctorDashboardClient from "./DoctorDashboardClient"

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

export default async function DoctorDashboard() {
  const current_user = await getUserFromToken();
  const cookieStore = cookies();
  const token = cookieStore.get("auth-token")?.value;
  
  if (!current_user) {
    redirect("/login");
  }

  const response = await GraphQLClient.query<GetCasesResponse>(GET_CASES, undefined, token)

  console.log(response)

  //cases => convertedCases
  //completedCases => CompletedCaseDetails
  console.log("datoooooooooooooos brutos")
  console.log(response)
  const casesData = response.getCases || []
  console.log("datoooooooooooooos")
  console.log(casesData)
  const convertedCases: RealCase[] = casesData.map(case_item => ({
    id: case_item.id,
    paciente: case_item.pacienteNombre,
    fecha: case_item.fechaSubida,
    estado: case_item.estado
  }))

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

  console.log("Converted Cases:", convertedCases)
  console.log("Completed Case Details:", completedCaseDetails)

  return (
    <DoctorDashboardClient
      currentUser={current_user}
      convertedCases={convertedCases}
      completedCaseDetails={completedCaseDetails}
    />
  )
}