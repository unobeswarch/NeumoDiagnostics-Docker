"use client"

import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { RadiographDetailHU7 } from '@/components/radiograph-detail-hu7'
import { PatientHeader } from '@/components/patient-header'

// HU7: Detailed view of a specific radiograph case
export default function RadiographDetailPage() {
  const params = useParams()
  const router = useRouter()
  const caseId = params.id as string

  return (
    <div className="min-h-screen bg-background">
      <PatientHeader />
      
      <main className="container mx-auto py-8">
        {/* Navigation */}
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al historial
          </Button>
          
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Detalle de Radiografía
            </h1>
            <p className="text-muted-foreground mt-2">
              Información completa de su radiografía y diagnóstico médico
            </p>
          </div>
        </div>

        {/* HU7 Component */}
        <RadiographDetailHU7 caseId={caseId} />
        
      </main>
    </div>
  )
}