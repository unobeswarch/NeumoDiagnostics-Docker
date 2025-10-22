"use client"

import React, { useState } from 'react'
import { RadiographDetailComponent } from './detail-component'
import { BackendCaseBrowser } from './backend-browser'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

/**
 * 🔬 HU7 Comprehensive Testing Suite
 * 
 * Consolidated testing interface for Historia de Usuario 7 (Radiograph Detail View)
 * This single folder contains all HU7 testing functionality:
 * 
 * 1. Mock Data Testing - Reliable UI testing with fake data
 * 2. Real Backend Testing - Connect to actual GraphQL + MongoDB
 * 3. Case Discovery - Browse real cases from database
 * 4. Custom Case Testing - Test with specific case IDs
 * 
 * File Structure:
 * - page.tsx: Main testing interface (this file)
 * - detail-component.tsx: HU7 detail view with mock/real toggle
 * - backend-browser.tsx: Real case discovery from GraphQL
 * - README.md: Documentation for this testing suite
 */
export default function HU7TestingPage() {
  const [selectedCaseId, setSelectedCaseId] = useState("1")
  const [useRealBackend, setUseRealBackend] = useState(false)
  const [customCaseId, setCustomCaseId] = useState("")
  const [activeTab, setActiveTab] = useState("testing")

  const mockCases = [
    { id: "1", status: "validated", uploadDate: "2024-01-15", description: "Complete case with medical diagnosis" },
    { id: "2", status: "processed", uploadDate: "2024-01-10", description: "AI analysis only" },  
    { id: "3", status: "uploaded", uploadDate: "2024-01-08", description: "Upload only, no processing" },
    { id: "507f1f77bcf86cd799439011", status: "test", uploadDate: "2024-01-20", description: "MongoDB ObjectId format" }
  ]

  const handleCaseSelectFromBrowser = (caseId: string) => {
    setSelectedCaseId(caseId)
    setUseRealBackend(true)
    setActiveTab("testing")
  }

  return (
    <div className="container mx-auto py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          🔬 HU7 - Testing Suite
        </h1>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-800 font-medium mb-2">
            Comprehensive testing interface for Historia de Usuario 7 (Radiograph Detail View)
          </p>
          <p className="text-blue-700 text-sm">
            This interface bypasses authentication and provides mock/real backend toggle for thorough testing.
            Perfect for UI development, backend integration testing, and case discovery.
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
          <TabsTrigger value="testing">🎭 Testing</TabsTrigger>
          <TabsTrigger value="discovery">🔍 Discovery</TabsTrigger>
          <TabsTrigger value="docs">📖 Docs</TabsTrigger>
        </TabsList>

        {/* Main Testing Interface */}
        <TabsContent value="testing" className="space-y-6">
          {/* Control Panel */}
          <Card>
            <CardHeader>
              <CardTitle>Testing Controls</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* Backend Mode Toggle */}
              <div className="flex items-center space-x-4">
                <label className="text-sm font-medium">Backend Mode:</label>
                <Button
                  variant={useRealBackend ? "secondary" : "default"}
                  size="sm"
                  onClick={() => setUseRealBackend(false)}
                >
                  🎭 Mock Data
                </Button>
                <Button
                  variant={useRealBackend ? "default" : "secondary"}
                  size="sm"
                  onClick={() => setUseRealBackend(true)}
                >
                  🔗 Real Backend
                </Button>
                <Badge variant={useRealBackend ? "default" : "secondary"}>
                  {useRealBackend ? "GraphQL localhost:8080" : "Testing Mode"}
                </Badge>
              </div>

              {/* Quick Case Selection */}
              <div>
                <label className="text-sm font-medium mb-2 block">Quick Test Cases:</label>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
                  {mockCases.map(testCase => (
                    <Button
                      key={testCase.id}
                      variant={selectedCaseId === testCase.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedCaseId(testCase.id)}
                      className="flex flex-col items-start h-auto p-3 text-left"
                    >
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-medium">Case {testCase.id}</span>
                        <Badge variant="secondary" className="text-xs">
                          {testCase.status}
                        </Badge>
                      </div>
                      <span className="text-xs text-gray-500">
                        {testCase.description}
                      </span>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Custom Case ID */}
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium">Custom Case ID:</label>
                <Input
                  value={customCaseId}
                  onChange={(e) => setCustomCaseId(e.target.value)}
                  placeholder="Enter case ID..."
                  className="w-64"
                />
                <Button
                  size="sm"
                  onClick={() => {
                    if (customCaseId.trim()) {
                      setSelectedCaseId(customCaseId.trim())
                    }
                  }}
                  disabled={!customCaseId.trim()}
                >
                  Test Custom ID
                </Button>
              </div>

              {/* Current Selection Info */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm">
                  <strong>Current Test:</strong> Case ID "{selectedCaseId}" using {' '}
                  <span className={useRealBackend ? "text-green-600" : "text-blue-600"}>
                    {useRealBackend ? "Real Backend" : "Mock Data"}
                  </span>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* HU7 Component */}
          <div className="border rounded-lg overflow-hidden">
            <RadiographDetailComponent 
              caseId={selectedCaseId}
              useRealBackend={useRealBackend}
            />
          </div>
        </TabsContent>

        {/* Case Discovery Interface */}
        <TabsContent value="discovery" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>🔍 Real Backend Case Discovery</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Connect to your actual GraphQL backend and browse real cases from MongoDB.
                Click any case to test it in the main interface.
              </p>
              
              <BackendCaseBrowser onCaseSelect={handleCaseSelectFromBrowser} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documentation */}
        <TabsContent value="docs" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Mock Mode Documentation */}
            <Card>
              <CardHeader>
                <CardTitle className="text-blue-600">🎭 Mock Mode</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-gray-600">
                  Uses hardcoded test data for reliable UI testing
                </p>
                <ul className="text-sm space-y-1 text-gray-600">
                  <li>• ✅ Always works regardless of backend status</li>
                  <li>• ✅ Perfect for UI testing and development</li>
                  <li>• ✅ Shows how the interface should look</li>
                  <li>• ✅ Consistent data for screenshot/demo purposes</li>
                </ul>
                <div className="p-3 bg-blue-50 rounded text-sm">
                  <strong>Best for:</strong> UI development, visual testing, demonstrations
                </div>
              </CardContent>
            </Card>

            {/* Real Backend Documentation */}
            <Card>
              <CardHeader>
                <CardTitle className="text-green-600">🔗 Real Backend Mode</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-gray-600">
                  Connects to actual GraphQL endpoint and MongoDB database
                </p>
                <ul className="text-sm space-y-1 text-gray-600">
                  <li>• ✅ Tests real integration with backend services</li>
                  <li>• ✅ Validates GraphQL queries and responses</li>
                  <li>• ✅ Tests with actual database data</li>
                  <li>• ✅ Falls back to mock if connection fails</li>
                </ul>
                <div className="p-3 bg-green-50 rounded text-sm">
                  <strong>Best for:</strong> Integration testing, backend validation, production readiness
                </div>
              </CardContent>
            </Card>

            {/* File Structure */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>📁 File Structure</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 p-4 rounded font-mono text-sm">
                  <div>app/hu7-testing/</div>
                  <div>├── page.tsx               # Main testing interface (this file)</div>
                  <div>├── detail-component.tsx  # HU7 detail view with mock/real toggle</div>
                  <div>├── backend-browser.tsx   # Real case discovery from GraphQL</div>
                  <div>└── README.md            # Documentation</div>
                </div>
                <p className="text-sm text-gray-600 mt-3">
                  All HU7 testing functionality is consolidated in this single folder for easy maintenance and discovery.
                </p>
              </CardContent>
            </Card>

            {/* URLs and Access */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>🌐 Access URLs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <code className="bg-gray-100 px-2 py-1 rounded text-sm">http://localhost:3001/hu7-testing</code>
                    <span className="text-sm text-gray-600">This testing suite</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <code className="bg-gray-100 px-2 py-1 rounded text-sm">http://localhost:3001/patient/dashboard</code>
                    <span className="text-sm text-gray-600">Production dashboard with eye icons</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <code className="bg-gray-100 px-2 py-1 rounded text-sm">http://localhost:8080/query</code>
                    <span className="text-sm text-gray-600">GraphQL backend endpoint</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
            <Button
              variant={useRealBackend ? "default" : "secondary"}
              size="sm"
              onClick={() => setUseRealBackend(true)}
            >
              🔗 Real Backend
            </Button>
            <Badge variant={useRealBackend ? "default" : "secondary"}>
              {useRealBackend ? "GraphQL localhost:8080" : "Testing Mode"}
            </Badge>
          </div>

          {/* Case Selection */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {mockCases.map(testCase => (
              <Button
                key={testCase.id}
                variant={selectedCaseId === testCase.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCaseId(testCase.id)}
                className="text-xs"
              >
                Case {testCase.id}
                <Badge variant="secondary" className="ml-1 text-xs">
                  {testCase.status}
                </Badge>
              </Button>
            ))}
          </div>

          {/* Custom Case ID */}
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium">Custom Case ID:</label>
            <Input
              value={customCaseId}
              onChange={(e) => setCustomCaseId(e.target.value)}
              placeholder="Enter case ID..."
              className="w-64"
            />
            <Button
              size="sm"
              onClick={() => {
                if (customCaseId.trim()) {
                  setSelectedCaseId(customCaseId.trim())
                }
              }}
              disabled={!customCaseId.trim()}
            >
              Test Custom ID
            </Button>
          </div>

          {/* Current Selection Info */}
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-sm">
              <strong>Current Test:</strong> Case ID "{selectedCaseId}" using {' '}
              <span className={useRealBackend ? "text-green-600" : "text-blue-600"}>
                {useRealBackend ? "Real Backend" : "Mock Data"}
              </span>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Testing Instructions */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>🎯 How to Test Without Mock Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Scenario 1: Mock Mode */}
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold text-blue-600 mb-2">🎭 Mock Mode (Current)</h3>
              <ul className="text-sm space-y-1 text-gray-600">
                <li>• Uses hardcoded test data</li>
                <li>• Always works regardless of backend status</li>
                <li>• Perfect for UI testing and development</li>
                <li>• Shows how the interface should look</li>
              </ul>
            </div>

            {/* Scenario 2: Real Backend */}
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold text-green-600 mb-2">🔗 Real Backend Mode</h3>
              <ul className="text-sm space-y-1 text-gray-600">
                <li>• Connects to GraphQL endpoint (localhost:8080)</li>
                <li>• Requires actual data in MongoDB</li>
                <li>• Needs JWT authentication for production</li>
                <li>• Falls back to mock if connection fails</li>
              </ul>
            </div>
          </div>

          {/* Search Strategy */}
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h3 className="font-semibold text-yellow-800 mb-2">🔍 How to Search Real Cases Without Mock Data</h3>
            <div className="text-sm text-yellow-700 space-y-2">
              <p><strong>Option 1:</strong> Use GraphQL query to get all cases first:</p>
              <code className="block bg-yellow-100 p-2 rounded text-xs">
                query &#123; getCases &#123; id pacienteNombre estado &#125; &#125;
              </code>
              
              <p><strong>Option 2:</strong> Check MongoDB directly for available case IDs:</p>
              <code className="block bg-yellow-100 p-2 rounded text-xs">
                db.prediagnosticos.find(&#123;&#125;, &#123;prediagnostico_id: 1&#125;)
              </code>

              <p><strong>Option 3:</strong> Replace dashboard mock data with real GraphQL query</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* HU7 Component */}
      <div className="border rounded-lg overflow-hidden">
        <RadiographDetailTesting 
          caseId={selectedCaseId}
          useRealBackend={useRealBackend}
        />
      </div>
    </div>
  )
}