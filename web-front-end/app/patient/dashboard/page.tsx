import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useState, useEffect } from "react"
import { FileImage, Eye, Clock, CheckCircle } from "lucide-react"
import { PatientHeader } from "@/components/patient-header"
import { UploadRadiography } from "@/components/upload-radiography"
import { RadiographyHistory } from "@/components/radiography-history"
import { GraphQLClient } from "@/lib/apollo-client"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { getUserFromToken, getProfilePhoto } from "@/server-actions/auth-actions"
import PatientDashboardClient from "./PatientDashboardClient"


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

export default async function PatientDashboard() {
  let current_user = await getUserFromToken();
  const cookieStore = cookies();
  const token = cookieStore.get("auth-token")?.value;

  if (current_user?.avatar) {
    const base64Photo = await getProfilePhoto(current_user.avatar)
    if (base64Photo) {
      current_user = { ...current_user, avatar: base64Photo }
    }
  }

  console.log("////////////////////////////////////////")
  console.log(current_user?.avatar)
  console.log("////////////////////////////////////////")

  if (!current_user) {
    redirect("/login");
  }

  if (current_user.role == "doctor") {
    redirect("/doctor/dashboard");
  }


  // Function to convert backend case data to frontend RadiographyRecord format
  const convertCaseToRecord = (backendCase: any): RadiographyRecord => {
    console.log("🔄 Converting case:", backendCase)
    console.log("🖼️ Image URL from backend:", backendCase.urlRadiografia)
    
    // Properly type the status field
    const getStatus = (estado: string): "uploaded" | "processed" | "validated" => {
      const normalizedEstado = estado?.toLowerCase()
      if (normalizedEstado === "procesado") return "processed"
      if (normalizedEstado === "validado") return "validated"
      return "uploaded"
    }
    
    const record: RadiographyRecord = {
      id: backendCase.id || "unknown",
      uploadDate: backendCase.fechaSubida || new Date().toISOString(),
      processedDate: backendCase.resultados?.fechaProcesamiento || null,
      validatedDate: backendCase.estado?.toLowerCase() === "validado" ? backendCase.fechaSubida : null,
      status: getStatus(backendCase.estado || "uploaded"),
      patientId: backendCase.pacienteId || "unknown",
      imageUrl: backendCase.urlRadiografia || "/placeholder.jpg",
      doctorReport: null,
      doctorName: backendCase.doctorAsignado || null,
      aiDiagnosis: backendCase.resultados?.etiqueta || null,
    }
    
    console.log("✅ Converted record:", record)
    console.log("🔗 Final imageUrl:", record.imageUrl)
    return record
  }

  let records: RadiographyRecord[] = []
  try {
    const response = await GraphQLClient.query(GET_PATIENT_CASES, undefined, token)
    if (response?.getCases) {
      records = response.getCases.map((c: any) => convertCaseToRecord(c))
    }
  } catch (err) {
    console.error("Error fetching patient cases (SSR):", err)
  }



  return (
    <PatientDashboardClient
      currentUser={current_user}
      records={records}
    />
  )
}