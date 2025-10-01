"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { FileImage, Search, Calendar, Eye } from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"

interface RadiographyRecord {
  radiografia_id: string
  fecha_subida: string
  estado: "subido" | "procesado" | "validado"
  resultado_preliminar?: string | null
}

interface RadiographyHistoryProps {
  records: RadiographyRecord[]
  onSelectRecord: (record: RadiographyRecord) => void
}

export function RadiographyHistory({ records, onSelectRecord }: RadiographyHistoryProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const router = useRouter()

  const filteredRecords = records.filter(
    (record) =>
      record.radiografia_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.estado.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const getStatusColor = (estado: string) => {
    switch (estado) {
      case "validado":
        return "default"
      case "procesado":
        return "secondary"
      case "subido":
        return "outline"
      default:
        return "outline"
    }
  }

  const getStatusIcon = (estado: string) => {
    switch (estado) {
      case "validado":
        return "✓"
      case "procesado":
        return "⏳"
      case "subido":
        return "📤"
      default:
        return "?"
    }
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-card-foreground">Historial de radiografías</CardTitle>
        <CardDescription>Consulta todas tus radiografías y su estado actual</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar radiografía..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-background border-border text-foreground"
          />
        </div>

        {/* Tabla de radiografías */}
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-left">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-2">ID</th>
                <th className="px-4 py-2">Fecha de subida</th>
                <th className="px-4 py-2">Estado</th>
                <th className="px-4 py-2">Resultado preliminar</th>
                <th className="px-4 py-2">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8">
                    <FileImage className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No se encontraron radiografías</p>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record) => (
                  <tr
                    key={record.radiografia_id}
                    className="border-b border-border hover:bg-accent cursor-pointer transition-colors"
                    onClick={() => onSelectRecord(record)}
                  >
                    <td className="px-4 py-2 font-medium text-card-foreground">{record.radiografia_id}</td>
                    <td className="px-4 py-2">{new Date(record.fecha_subida).toLocaleDateString()}</td>
                    <td className="px-4 py-2">
                      <Badge variant={getStatusColor(record.estado)}>
                        {getStatusIcon(record.estado)} {record.estado}
                      </Badge>
                    </td>
                    <td className="px-4 py-2">
                      {record.resultado_preliminar ? record.resultado_preliminar : <span className="text-muted-foreground">-</span>}
                    </td>
                    <td className="px-4 py-2">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
