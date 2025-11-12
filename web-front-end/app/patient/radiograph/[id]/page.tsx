import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { RadiographDetailHU7 } from '@/components/radiograph-detail-hu7'
import { PatientHeader } from '@/components/patient-header'
import { getUserFromToken } from '@/server-actions/auth-actions'
import { redirect } from 'next/navigation'
import { getCaseDetail } from '@/server-actions/cases-actions'
import Link from 'next/link'
import { cookies } from 'next/headers'
import { getDiagnostic, getRadiographyImage } from '@/server-actions/cases-actions'
import { getProfilePhoto } from '@/server-actions/auth-actions'

interface RadiographDetailPageProps {
  params: { id: string }
  searchParams: URLSearchParams
}

// HU7: Detailed view of a specific radiograph case
export default async function RadiographDetailPage({ params }: RadiographDetailPageProps) {
  const caseId = params.id
  let currentUser = await getUserFromToken()
  const cookieStore = cookies();
  const token = cookieStore.get("auth-token")?.value;

  if (!currentUser) {
    redirect("/login");
  }

  if (!token) {
    redirect("/login")
  }

  if (currentUser?.avatar) {
    const base64Photo = await getProfilePhoto(currentUser.avatar)
    if (base64Photo) {
      currentUser = { ...currentUser, avatar: base64Photo }
    }
  }

  const response = await getCaseDetail(caseId, token)
  if (!response || !response.caseDetail) {
    redirect("/patient/dashboard")
  }

  const { caseDetail } = response 

  console.log("Detalle del caso: ", caseDetail)

  if (!caseDetail) {
    redirect("/patient/dashboard")
  }

  const diagnostic = await getDiagnostic(caseDetail.id)

  const url = `http://reverse-proxy/prediagnostic/image/${caseDetail.urlImagen.split('/').pop()}`

  const imageBase64 = await getRadiographyImage(url)

  return (
    <div className="min-h-screen bg-background">
      <PatientHeader  
        id={currentUser.id}
        name={currentUser.name}
        email={currentUser.email}
        role={currentUser.role}
        avatar={currentUser.avatar}
      />
      
      <main className="container mx-auto py-8">
        {/* Navigation */}
        <div className="mb-6">
          <Link href="/patient/dashboard">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver al historial
            </Button>
          </Link>
          
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
        <RadiographDetailHU7 
          diagnostic = {diagnostic}
          caseDetail={caseDetail} 
          caseImage={imageBase64}
          name={currentUser.name}
          userAge={currentUser.age || 'No disponible'}
        />
        
      </main>
    </div>
  )
}