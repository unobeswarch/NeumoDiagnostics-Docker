// Example: How to replace dashboard mock data with real GraphQL query

// In app/patient/dashboard/page.tsx, replace mockRecords with:

const [records, setRecords] = useState<RadiographyRecord[]>([])
const [loading, setLoading] = useState(true)

useEffect(() => {
  async function fetchRealCases() {
    try {
      const result = await GraphQLClient.query(`
        query {
          getCases {
            id
            pacienteNombre
            estado
            fechaSubida
            urlRadiografia
          }
        }
      `)
      
      // Transform GraphQL data to RadiographyRecord format
      const transformedRecords = result.getCases.map(case_ => ({
        id: case_.id,
        uploadDate: case_.fechaSubida,
        processedDate: case_.estado === 'Procesado' ? case_.fechaSubida : null,
        validatedDate: case_.estado === 'Validado' ? case_.fechaSubida : null,
        status: case_.estado.toLowerCase(),
        patientId: "P001", // Would come from authenticated user
        imageUrl: case_.urlRadiografia,
        doctorReport: null, // Would need additional query
        doctorName: null,
        aiDiagnosis: null
      }))
      
      setRecords(transformedRecords)
    } catch (error) {
      console.error('Error fetching real cases:', error)
      // Fallback to mock data if real backend fails
      setRecords(mockRecords)
    } finally {
      setLoading(false)
    }
  }
  
  fetchRealCases()
}, [])