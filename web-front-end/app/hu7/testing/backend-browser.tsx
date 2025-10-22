"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { GraphQLClient } from '@/lib/apollo-client'
import { RadiographDetailComponent } from './detail-component'

// GraphQL query to get all available cases
const GET_ALL_CASES = `
  query GetAllCases {
    getCases {
      id
      pacienteNombre
      pacienteEmail
      estado
      fechaSubida
      urlRadiografia
    }
  }
`

interface Case {
  id: string
  pacienteNombre: string
  pacienteEmail: string
  estado: string
  fechaSubida: string
  urlRadiografia: string
}

interface BackendCaseBrowserProps {
  onCaseSelect?: (caseId: string) => void
}

export function BackendCaseBrowser({ onCaseSelect }: BackendCaseBrowserProps) {
  const [cases, setCases] = useState<Case[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

  // Fetch real cases from backend
  const fetchRealCases = async () => {
    setLoading(true)
    setError(null)
    
    try {
      console.log('🔍 Fetching real cases from GraphQL backend...')
      const result = await GraphQLClient.query<{getCases: Case[]}>(GET_ALL_CASES)
      
      if (result.getCases && result.getCases.length > 0) {
        setCases(result.getCases)
        console.log(`✅ Found ${result.getCases.length} real cases`)
      } else {
        console.log('⚠️ No cases found in backend')
        setCases([])
      }
      
    } catch (err) {
      console.error('❌ Error fetching cases:', err)
      setError(err instanceof Error ? err.message : 'Error connecting to backend')
    } finally {
      setLoading(false)
    }
  }

  // Filter cases based on search term
  const filteredCases = cases.filter(case_ =>
    case_.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    case_.pacienteNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    case_.estado.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "validado":
      case "validated":
        return "default"
      case "procesado":
      case "processed":
        return "secondary"
      case "subido":
      case "uploaded":
        return "outline"
      default:
        return "outline"
    }
  }

  const handleCaseSelect = (caseId: string) => {
    if (onCaseSelect) {
      onCaseSelect(caseId)
    } else {
      setSelectedCaseId(caseId)
    }
  }

  // If a case is selected and no external handler, show the detail view
  if (selectedCaseId && !onCaseSelect) {
    return (
      <div>
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => setSelectedCaseId(null)}
            className="mb-4"
          >
            ← Volver a la lista de casos
          </Button>
        </div>
        
        <RadiographDetailComponent 
          caseId={selectedCaseId}
          useRealBackend={true}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Backend Cases
            <Badge variant={cases.length > 0 ? "default" : "secondary"}>
              {cases.length} cases found
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          
          {/* Fetch Button */}
          <div className="flex items-center space-x-4">
            <Button
              onClick={fetchRealCases}
              disabled={loading}
              className="flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Connecting...</span>
                </>
              ) : (
                <>
                  <span>🔄 Fetch Real Cases</span>
                </>
              )}
            </Button>
            
            <div className="text-sm text-gray-600">
              Connects to: <code className="bg-gray-100 px-2 py-1 rounded">localhost:8080/query</code>
            </div>
          </div>

          {/* Search */}
          {cases.length > 0 && (
            <div className="flex items-center space-x-2">
              <Input
                placeholder="Search by ID, patient name, or status..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-md"
              />
              <Badge variant="outline">
                {filteredCases.length} of {cases.length}
              </Badge>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <h3 className="font-semibold text-red-800 mb-2">❌ Backend Connection Error</h3>
              <p className="text-red-700 text-sm mb-3">{error}</p>
              <div className="text-red-600 text-sm">
                <p><strong>Possible solutions:</strong></p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Make sure BusinessLogic service is running on port 8080</li>
                  <li>Check if MongoDB has data in 'prediagnosticos' collection</li>
                  <li>Verify authentication/authorization if required</li>
                  <li>Check browser console for detailed errors</li>
                </ul>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cases List */}
      {cases.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Available Cases</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredCases.map((case_) => (
                <div 
                  key={case_.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleCaseSelect(case_.id)}
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-3">
                      <h3 className="font-medium">Case #{case_.id}</h3>
                      <Badge variant={getStatusColor(case_.estado)}>
                        {case_.estado}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">
                      Patient: {case_.pacienteNombre} ({case_.pacienteEmail})
                    </p>
                    <p className="text-sm text-gray-500">
                      Uploaded: {new Date(case_.fechaSubida).toLocaleDateString()}
                    </p>
                  </div>
                  
                  <Button variant="ghost" size="sm">
                    👁️ View Details
                  </Button>
                </div>
              ))}
              
              {filteredCases.length === 0 && searchTerm && (
                <div className="text-center py-8 text-gray-500">
                  No cases match your search "{searchTerm}"
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions when no cases */}
      {!loading && cases.length === 0 && !error && (
        <Card>
          <CardHeader>
            <CardTitle>No Cases Found</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 space-y-4">
              <p className="text-gray-600 mb-4">
                No cases found in backend. This could mean:
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold text-blue-600 mb-2">📝 Database is Empty</h3>
                  <ul className="text-sm space-y-1 text-gray-600">
                    <li>• No radiographs have been uploaded yet</li>
                    <li>• MongoDB 'prediagnosticos' collection is empty</li>
                    <li>• Try uploading a radiograph first (HU2)</li>
                  </ul>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold text-green-600 mb-2">🔧 Service Issues</h3>
                  <ul className="text-sm space-y-1 text-gray-600">
                    <li>• BusinessLogic service not running</li>
                    <li>• GraphQL endpoint not responding</li>
                    <li>• Database connection issues</li>
                  </ul>
                </div>
              </div>
              
              <Button onClick={fetchRealCases} className="mt-4">
                🔄 Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}