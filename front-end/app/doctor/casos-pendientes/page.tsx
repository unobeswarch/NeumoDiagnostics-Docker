import { DoctorHeader } from "@/components/doctor-header"
import { DashboardCasosPendientes } from "@/components/dashboard-casos-pendientes"

export default function CasosPendientesPage() {
  return (
    <div className="min-h-screen bg-background">
      <DoctorHeader />

      <main className="container mx-auto px-6 py-8">
        <DashboardCasosPendientes />
      </main>
    </div>
  )
}
