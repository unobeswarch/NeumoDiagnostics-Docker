"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Brain, User, AlertTriangle, CheckCircle, X } from "lucide-react"
import Image from "next/image"

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

interface CaseValidationProps {
  case: Case
  onBack: () => void
  onValidate: (caseId: string, validation: any) => void
}

export function CaseValidation({ case: caseData, onBack, onValidate }: CaseValidationProps) {
  const [aiAgreement, setAiAgreement] = useState<"agree" | "disagree" | "">("")
  const [doctorReport, setDoctorReport] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!aiAgreement || !doctorReport.trim()) return

    setIsSubmitting(true)

    // Simulate API call
    setTimeout(() => {
      onValidate(caseData.id, {
        aiAgreement,
        doctorReport,
        validatedDate: new Date().toISOString(),
        doctorName: "Dr. Sarah Johnson",
      })
      setIsSubmitting(false)
    }, 1000)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={onBack} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Cases
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-card-foreground">Case Validation</h1>
              <p className="text-muted-foreground">
                {caseData.patientName} - {caseData.bodyPart}
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Image and Patient Info */}
          <div className="space-y-6">
            {/* Patient Information */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-card-foreground flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Patient Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Name:</span>
                    <p className="font-medium text-card-foreground">{caseData.patientName}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Patient ID:</span>
                    <p className="font-medium text-card-foreground">{caseData.patientId}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Age:</span>
                    <p className="font-medium text-card-foreground">{caseData.patientAge} years</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Gender:</span>
                    <p className="font-medium text-card-foreground">{caseData.patientGender}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Body Part:</span>
                    <p className="font-medium text-card-foreground">{caseData.bodyPart}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Urgency:</span>
                    <Badge variant={caseData.urgency === "urgent" ? "destructive" : "secondary"}>
                      {caseData.urgency}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Radiography Image */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-card-foreground">Radiography Image</CardTitle>
                <CardDescription>
                  Uploaded: {new Date(caseData.uploadDate).toLocaleDateString()} • Processed:{" "}
                  {new Date(caseData.processedDate).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="aspect-square relative bg-muted rounded-lg overflow-hidden">
                  <Image
                    src={caseData.imageUrl || "/placeholder.svg"}
                    alt="Radiography"
                    fill
                    className="object-cover"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* AI Analysis and Validation Form */}
          <div className="space-y-6">
            {/* AI Analysis */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-card-foreground flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  AI Analysis
                </CardTitle>
                <CardDescription>
                  Confidence Level: {Math.round(caseData.aiConfidence * 100)}%
                  {caseData.urgency === "urgent" && (
                    <Badge variant="destructive" className="ml-2">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Urgent
                    </Badge>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-card-foreground leading-relaxed">{caseData.aiDiagnosis}</p>
              </CardContent>
            </Card>

            {/* Validation Form */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-card-foreground">Medical Validation</CardTitle>
                <CardDescription>Review the AI analysis and provide your professional assessment</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* AI Agreement */}
                  <div className="space-y-3">
                    <Label className="text-card-foreground font-medium">Do you agree with the AI diagnosis?</Label>
                    <RadioGroup value={aiAgreement} onValueChange={(value) => setAiAgreement(value as "agree" | "disagree" | "")}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="agree" id="agree" />
                        <Label htmlFor="agree" className="flex items-center gap-2 cursor-pointer">
                          <CheckCircle className="h-4 w-4 text-green-500" />I agree with the AI diagnosis
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="disagree" id="disagree" />
                        <Label htmlFor="disagree" className="flex items-center gap-2 cursor-pointer">
                          <X className="h-4 w-4 text-red-500" />I disagree with the AI diagnosis
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <Separator />

                  {/* Doctor Report */}
                  <div className="space-y-3">
                    <Label htmlFor="report" className="text-card-foreground font-medium">
                      Medical Report *
                    </Label>
                    <Textarea
                      id="report"
                      placeholder="Provide your detailed medical assessment, findings, and recommendations..."
                      value={doctorReport}
                      onChange={(e) => setDoctorReport(e.target.value)}
                      className="bg-background border-border text-foreground min-h-[120px]"
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Include your professional findings, any additional observations, and treatment recommendations.
                    </p>
                  </div>

                  {/* Submit Button */}
                  <div className="flex gap-3 pt-4">
                    <Button
                      type="submit"
                      disabled={!aiAgreement || !doctorReport.trim() || isSubmitting}
                      className="flex-1"
                    >
                      {isSubmitting ? "Validating..." : "Validate Case"}
                    </Button>
                    <Button type="button" variant="outline" onClick={onBack}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Validation Info */}
            <Card className="bg-muted/50 border-border">
              <CardContent className="pt-6">
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>• Your validation will be recorded and sent to the patient</p>
                  <p>• This case will be marked as completed after validation</p>
                  <p>• All validations are logged for quality assurance</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
