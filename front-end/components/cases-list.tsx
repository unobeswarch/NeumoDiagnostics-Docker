"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FileImage, Eye, Calendar, User, Brain } from "lucide-react"

interface Case {
  id: string
  patientId: string
  patientName: string
  uploadDate: string
  processedDate: string
  status: "processed"
  imageUrl: string
  aiDiagnosis: string
  aiConfidence: number
  bodyPart: string
  urgency: "routine" | "urgent"
  patientAge: number
  patientGender: string
}

interface CasesListProps {
  cases: Case[]
  onSelectCase: (case_: Case) => void
}

export function CasesList({ cases, onSelectCase }: CasesListProps) {
  if (cases.length === 0) {
    return (
      <div className="text-center py-8">
        <FileImage className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">No cases available</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {cases.map((case_) => (
        <div
          key={case_.id}
          className="border border-border rounded-lg p-4 hover:bg-accent cursor-pointer transition-colors"
          onClick={() => onSelectCase(case_)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                <FileImage className="h-6 w-6 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-card-foreground">
                    {case_.patientName} - {case_.bodyPart}
                  </p>
                  <Badge variant={case_.urgency === "urgent" ? "destructive" : "secondary"}>{case_.urgency}</Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    ID: {case_.patientId}
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(case_.uploadDate).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-1">
                    <Brain className="h-3 w-3" />
                    AI Confidence: {Math.round(case_.aiConfidence * 100)}%
                  </div>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">{case_.aiDiagnosis}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm">
                <Eye className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
