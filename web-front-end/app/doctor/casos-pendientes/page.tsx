import { DoctorHeader } from "@/components/doctor-header"
import { DashboardCasosPendientes } from "@/components/dashboard-casos-pendientes"
import { getUserFromToken } from "@/server-actions/auth-actions";
import { redirect } from "next/navigation";

export default async function CasosPendientesPage() {
  const current_user = await getUserFromToken();

  if (!current_user) redirect("/login")

  return (
    <div className="min-h-screen bg-background">
      <DoctorHeader 
        id={current_user.id}
        name={current_user.name}
        email={current_user.email}
        role={current_user.role}
        avatar={current_user.avatar}
      />

      <main className="container mx-auto px-6 py-8">
        <DashboardCasosPendientes />
      </main>
    </div>
  )
}
