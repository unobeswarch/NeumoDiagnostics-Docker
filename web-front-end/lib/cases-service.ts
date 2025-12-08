// Service for handling REST API calls to /businesslogic/cases endpoint
// Following the existing pattern from PreDiagnosticService but for REST instead of GraphQL

export interface Case {
  id: string
  patientId: string
  caseDate: string
  currentStatus: string
  // Additional fields that might come from the API
  patientName?: string
  aiDiagnosis?: string
  aiConfidence?: number
  urgency?: "routine" | "urgent"
  imageUrl?: string
}

export class CasesService {
  // API URL: Uses SERVER_API_URL in AWS (Cloud Map), falls back to reverse-proxy for docker-compose
  private static readonly BASE_URL = process.env.SERVER_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://reverse-proxy"

  /**
   * Fetches all pending cases from the backend
   * @returns Promise with array of cases
   */
  static async getCases(): Promise<Case[]> {
    console.log("🚀 Fetching cases from /businesslogic/cases...")
    console.log(`🔗 URL: ${this.BASE_URL}/businesslogic/cases`)

    try {
      const response = await fetch(`${this.BASE_URL}/businesslogic/cases`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        mode: "cors",
        credentials: "omit",
      })

      console.log(`📥 Response status: ${response.status}`)
      console.log(`📥 Response OK: ${response.ok}`)

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`❌ HTTP Error: ${response.status}`, errorText)
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      console.log("✅ Cases fetched successfully:", data)

      return data
    } catch (error) {
      console.error("❌ Error fetching cases:", error)

      // Network error details
      if (error instanceof TypeError && error.message.includes("fetch")) {
        console.error("🌐 Network error: Is the backend running on localhost:8080?")
      }

      throw new Error("No se pudieron obtener los casos. Verifica tu conexión.")
    }
  }

  /**
   * Debug method to test the connection to the cases endpoint
   * @returns Promise with debug information
   */
  static async debugConnection(): Promise<any> {
    console.log("🔍 DEBUG: Testing connection to /businesslogic/cases")
    console.log(`🔗 DEBUG: URL: ${this.BASE_URL}/businesslogic/cases`)

    try {
      const startTime = performance.now()

      const response = await fetch(`${this.BASE_URL}/businesslogic/cases`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        mode: "cors",
        credentials: "omit",
      })

      const endTime = performance.now()
      console.log(`⏱️ DEBUG: Response received in ${endTime - startTime}ms`)

      if (response.ok) {
        const data = await response.json()
        console.log("📦 DEBUG: Data received:", data)
        return { success: true, data, responseTime: endTime - startTime }
      } else {
        const errorText = await response.text()
        console.error("❌ DEBUG: HTTP Error:", response.status, errorText)
        return {
          success: false,
          error: `HTTP ${response.status}: ${errorText}`,
          responseTime: endTime - startTime,
        }
      }
    } catch (error) {
      console.error("❌ DEBUG: Connection error:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        fullError: error,
      }
    }
  }

  /**
   * Formats date for display in the UI
   * @param dateString - Date in string format
   * @returns Formatted date
   */
  static formatDate(dateString: string): string {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString("es-ES", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch (error) {
      return dateString
    }
  }

  /**
   * Determines urgency based on case data
   * @param caseData - Case object
   * @returns Urgency level
   */
  static getUrgencyLevel(caseData: Case): "routine" | "urgent" {
    // If urgency is already set, use it
    if (caseData.urgency) {
      return caseData.urgency
    }

    // Otherwise, determine based on AI confidence if available
    if (caseData.aiConfidence && caseData.aiConfidence > 0.7) {
      return "urgent"
    }

    return "routine"
  }
}
