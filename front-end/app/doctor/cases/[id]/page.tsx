import { PreDiagnosticDetail } from "@/components/prediagnostic-detail"

interface CaseDetailPageProps {
  params: {
    id: string
  }
}

export default function CaseDetailPage({ params }: CaseDetailPageProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PreDiagnosticDetail prediagnosticId={params.id} />
      </div>
    </div>
  )
}
