import { DoctorHeader } from "@/components/doctor-header"
import { DashboardCasosPendientes } from "@/components/dashboard-casos-pendientes"
import { getUserFromToken, getProfilePhoto } from "@/server-actions/auth-actions";
import { redirect } from "next/navigation";

export default async function CasosPendientesPage() {
  let current_user = await getUserFromToken();

  if (!current_user) redirect("/login")

  if (current_user?.avatar) {
    const base64Photo = await getProfilePhoto(current_user.avatar)
    if (base64Photo) {
      current_user = { ...current_user, avatar: base64Photo }
    }
  }

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
