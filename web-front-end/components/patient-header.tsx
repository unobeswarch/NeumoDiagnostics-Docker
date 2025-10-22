import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { logout } from "@/server-actions/auth-actions"

interface PatientHeaderProps {
  id?: string
  name: string
  email: string
  role: "paciente" | "doctor"
  avatar?: string
}

export function PatientHeader({ id, name, email, role, avatar }: PatientHeaderProps) {


  return (
    <header className="border-b border-border bg-card">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/logo_sin_nombre.svg" alt="Logo" className="h-20 w-20" />
            <h1 className="text-2xl font-bold text-card-foreground">NeumoDiagnostics</h1>
            <span className="text-sm text-muted-foreground ml-2">Portal del paciente</span>
          </div>

          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={avatar} alt="Patient" />
                    <AvatarFallback>
                      {name && typeof name === 'string'
                        ? name.split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()
                        : "JP"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{name}</p>
                    <p className="text-xs leading-none text-muted-foreground">{email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuSeparator />
                <form action={logout}>
                  <Button type="submit" variant="ghost">
                    Cerrar sesión
                  </Button>
                </form>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  )
}
