// GraphQL query to get all cases for a patient
export const GET_CASES = `
  query GetCases {
    getCases {
      id
      pacienteId
      pacienteNombre
      pacienteEmail
      fechaSubida
      estado
      urlRadiografia
      resultados {
        probNeumonia
        etiqueta
        fechaProcesamiento
      }
      doctorAsignado
    }
  }
`;

export interface Resultados {
  probNeumonia: number;
  etiqueta: string;
  fechaProcesamiento: string;
}

export interface Case {
  id: string;
  pacienteId: string;
  pacienteNombre: string;
  pacienteEmail: string;
  fechaSubida: string;
  estado: string;
  urlRadiografia: string;
  resultados?: Resultados;
  doctorAsignado?: string;
}

export interface GetCasesResponse {
  getCases: Case[];
}
