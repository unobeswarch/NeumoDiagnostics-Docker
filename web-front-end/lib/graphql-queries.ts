// Consulta GraphQL para obtener un prediagnóstico específico (estructura real del backend)
export const GET_PREDIAGNOSTIC = `
  query GetPreDiagnostic($id: ID!) {
    getPreDiagnostic(id: $id) {
      prediagnostic_id
      pacienteId
      estado
      urlrad
      resultadosModelo {
        probNeumonia
        etiqueta
      }
      fechaSubida
    }
  }
`;

// Consulta GraphQL para obtener detalles completos de un caso (HU7)
export const GET_CASE_DETAIL = `
  query GetCaseDetail($id: ID!) {
    caseDetail(id: $id) {
      id
      radiografiaId
      urlImagen
      estado
      fechaSubida
      preDiagnostic {
        prediagnostic_id
        pacienteId
        estado
        resultadosModelo {
          probNeumonia
          etiqueta
          fechaProcesamiento
        }
      }
      diagnostic {
        id
        aprobacion
        comentarios
        fechaRevision
        doctorNombre
      }
    }
  }
`;



// Tipos TypeScript para los datos reales del backend
export interface ResultadosModelo {
  probNeumonia: number;
  etiqueta: string;
  fechaProcesamiento?: string;
}

export interface PreDiagnostic {
  prediagnostic_id: string;
  pacienteId: string;
  estado: string; // "procesado", etc.
  urlrad?: string; // URL de la radiografía (legacy)
  fechaSubida: string;
  resultadosModelo: ResultadosModelo;
}

export interface Diagnostic {
  id: string;
  aprobacion: string;
  comentarios: string;
  fechaRevision: string;
  doctorNombre?: string;
}

export interface CaseDetail {
  id: string;
  radiografiaId: string;
  urlImagen: string; // URL completa de la imagen
  estado: string;
  fechaSubida: string;
  preDiagnostic: PreDiagnostic;
  diagnostic?: Diagnostic;
}

export interface GetPreDiagnosticResponse {
  getPreDiagnostic: PreDiagnostic;
}

export interface GetCaseDetailResponse {
  caseDetail: CaseDetail;
}

// Mutación para crear diagnóstico médico
export const CREATE_DIAGNOSTIC = `
  mutation CreateDiagnostic($id_prediagnostico: ID!, $input: DiagnosticInput!) {
    createDiagnostic(
      id_prediagnostico: $id_prediagnostico
      input: $input
    ) {
      message
      success
    }
  }
`;

// Tipos para el diagnóstico médico
export interface CreateDiagnosticResponse {
  createDiagnostic: {
    message: string;
    success: boolean;
  };
}
