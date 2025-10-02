"use client"

import { useAuth } from "@/components/auth-context"
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
import { Activity, LogOut, Settings, User, Stethoscope, FileText } from "lucide-react"
import Link from "next/link"

export function DoctorHeader() {
  const { user, logout } = useAuth()

  const handleLogout = () => {
    logout()
  }

  return (
    <header className="border-b border-border bg-card">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/logo_sin_nombre.svg" alt="Logo" className="h-16 w-16" />
            <h1 className="text-2xl font-bold text-card-foreground">NeumoDiagnostics</h1>
            <span className="text-sm text-muted-foreground ml-2 flex items-center gap-1">
              <Stethoscope className="h-4 w-4" />
              Doctor Portal
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-4">
            <Button variant="ghost" asChild>
              <Link href="/doctor/dashboard" className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Dashboard
              </Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href="/doctor/casos-pendientes" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Casos Pendientes
              </Link>
            </Button>
          </nav>

          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.avatar || "/doctor-avatar.png"} alt="Doctor" />
                    <AvatarFallback>
                      {user?.name && typeof user.name === 'string'
                        ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase()
                        : "DR"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user?.name || "Dr. Sarah Johnson"}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email || "sarah.johnson@hospital.com"}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild className="md:hidden">
                  <Link href="/doctor/dashboard">
                    <Activity className="mr-2 h-4 w-4" />
                    <span>Dashboard</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="md:hidden">
                  <Link href="/doctor/casos-pendientes">
                    <FileText className="mr-2 h-4 w-4" />
                    <span>Casos Pendientes</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="md:hidden" />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  )
}
