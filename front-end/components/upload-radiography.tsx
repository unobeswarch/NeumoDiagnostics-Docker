"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Upload, FileImage, X } from "lucide-react"

interface UploadRadiographyProps {
  onUploadSuccess: (record: any) => void
}

export function UploadRadiography({ onUploadSuccess }: UploadRadiographyProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      if (file.type.startsWith("image/")) {
        setSelectedFile(file)
      }
    }
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0])
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    setIsUploading(true)

    const size = selectedFile.size / 1024 / 1024
    console.log(size)
    if (size > 10) {
      alert("El tamano de la imagen excede el limite")
    }

    try {
      const formData = new FormData()

      formData.append(
        "operations",
        JSON.stringify({
          query: `mutation uploadImage($file: Upload!) {
            uploadImage(imagen: $file)
          }`,
          variables: { file: null },
        })
      )

      formData.append("map", JSON.stringify({ "0": ["variables.file"] }))
      formData.append("0", selectedFile)

      const token = document.cookie.split("; ").find((row) => row.startsWith("auth-token="))?.split("=")[1]

      const response = await fetch("http://localhost:8080/query", {
        method: "POST",
        body: formData,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }) 

      const result = await response.json()

      if (result.data?.uploadImage) {
        alert("Tu radiografia ha sido subida")
      }
    } catch (error) {
      alert("La imagen no pudo ser subida")
    }
      setSelectedFile(null)
      setIsUploading(false)
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-card-foreground">Subir radiografía</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* File Upload Area */}
        <div
          className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive
              ? "border-primary bg-primary/5"
              : selectedFile
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50"
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          {selectedFile ? (
            <div className="space-y-4">
              <div className="flex items-center justify-center">
                <FileImage className="h-12 w-12 text-primary" />
              </div>
              <div>
                <p className="font-medium text-card-foreground">{selectedFile.name}</p>
                <p className="text-sm text-muted-foreground">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setSelectedFile(null)} className="gap-2">
                <X className="h-4 w-4" />
                Remove
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-center">
                <Upload className="h-12 w-12 text-muted-foreground" />
              </div>
              <div>
                <p className="text-lg font-medium text-card-foreground">Arrastra tu radiografía aquí</p>
                <p className="text-sm text-muted-foreground">o haz click en Buscar imagen</p>
              </div>
              <div>
                <Input type="file" accept="image/*" onChange={handleFileSelect} className="hidden" id="file-upload" />
                <Label htmlFor="file-upload">
                  <Button variant="outline" className="cursor-pointer bg-transparent" asChild>
                    <span>Buscar imagen</span>
                  </Button>
                </Label>
              </div>
            </div>
          )}
        </div>

        {/* Upload Button */}
        <Button onClick={handleUpload} disabled={!selectedFile || isUploading} className="w-full" size="lg">
          {isUploading ? "Uploading..." : "Upload Radiography"}
        </Button>

        {/* Info */}
        <div className="text-sm text-muted-foreground space-y-1">
          <p>• Formato necesario: JPG</p>
          <p>• Tamaño máximo del archivo: 10MB</p>
          <p>• Tus imagenes serán prediagnosticadas por un modelo de IA y luego serán validadas por un doctor</p>
        </div>
      </CardContent>
    </Card>
  )
}
