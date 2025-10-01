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



// Tipos TypeScript para los datos reales del backend
export interface ResultadosModelo {
  probNeumonia: number;
  etiqueta: string;
  // No hay fechaProcesamiento en el backend real
}

export interface PreDiagnostic {
  prediagnostic_id: string;
  pacienteId: string;
  estado: string; // "procesado", etc.
  urlrad: string; // URL de la radiografía
  fechaSubida: string;
  resultadosModelo: ResultadosModelo;
}
export interface GetPreDiagnosticResponse {
  getPreDiagnostic: PreDiagnostic;
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
