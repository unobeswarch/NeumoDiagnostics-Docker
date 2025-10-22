"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Calendar, User, FileText, Brain, Download } from "lucide-react"
import Image from "next/image"

interface RadiographyRecord {
  id: string
  uploadDate: string
  processedDate: string | null
  validatedDate: string | null
  status: "uploaded" | "processed" | "validated"
  patientId: string
  imageUrl: string
  doctorReport: string | null
  doctorName: string | null
  aiDiagnosis: string | null
}

interface RadiographyDetailProps {
  record: RadiographyRecord
  onBack: () => void
}

export function RadiographyDetail({ record, onBack }: RadiographyDetailProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "validated":
        return "default"
      case "processed":
        return "secondary"
      case "uploaded":
        return "outline"
      default:
        return "outline"
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={onBack} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-card-foreground">Record #{record.id}</h1>
              <p className="text-muted-foreground">Detailed view</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Image Section */}
          <Card className="bg-card border-border">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-card-foreground">Radiography Image</CardTitle>
                <Badge variant={getStatusColor(record.status)}>{record.status}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="aspect-square relative bg-muted rounded-lg overflow-hidden">
                <Image src={record.imageUrl || "/placeholder.svg"} alt="Radiography" fill className="object-cover" />
              </div>
              <div className="mt-4 flex gap-2">
                <Button variant="outline" className="flex-1 gap-2 bg-transparent">
                  <Download className="h-4 w-4" />
                  Download
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Details Section */}
          <div className="space-y-6">
            {/* Timeline */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-card-foreground">Timeline</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-card-foreground">Uploaded:</span>
                    <span className="text-muted-foreground">{new Date(record.uploadDate).toLocaleDateString()}</span>
                  </div>
                </div>

                {record.processedDate && (
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <div className="flex items-center gap-2 text-sm">
                      <Brain className="h-4 w-4 text-muted-foreground" />
                      <span className="text-card-foreground">AI Processed:</span>
                      <span className="text-muted-foreground">
                        {new Date(record.processedDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                )}

                {record.validatedDate && (
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-card-foreground">Doctor Validated:</span>
                      <span className="text-muted-foreground">
                        {new Date(record.validatedDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* AI Analysis */}
            {record.aiDiagnosis && (
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-card-foreground flex items-center gap-2">
                    <Brain className="h-5 w-5" />
                    AI Analysis
                  </CardTitle>
                  <CardDescription>Preliminary AI-powered diagnosis</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-card-foreground">{record.aiDiagnosis}</p>
                </CardContent>
              </Card>
            )}

            {/* Doctor Report */}
            {record.status === "validated" && record.doctorReport && (
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-card-foreground flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Doctor Report
                  </CardTitle>
                  <CardDescription>Validated by {record.doctorName}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-card-foreground leading-relaxed">{record.doctorReport}</p>
                  <Separator />
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="h-4 w-4" />
                    <span>Reviewed by {record.doctorName}</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Status Info */}
            {record.status !== "validated" && (
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-card-foreground">Status Information</CardTitle>
                </CardHeader>
                <CardContent>
                  {record.status === "uploaded" && (
                    <p className="text-muted-foreground">
                      Your radiography has been uploaded and is waiting to be processed by our AI system.
                    </p>
                  )}
                  {record.status === "processed" && (
                    <p className="text-muted-foreground">
                      AI analysis is complete. Your radiography is now waiting for doctor validation.
                    </p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
