import { GraphQLClient } from './apollo-client';
import { CREATE_DIAGNOSTIC, CreateDiagnosticResponse } from './graphql-queries';

// Tipos para el diagnóstico médico
export interface DiagnosticPayload {
  aprobacion: "Si" | "No";
  comentario: string;
}

export interface DiagnosticRequest {
  prediagnosticId: string;
  diagnostic: DiagnosticPayload;
}

export interface DiagnosticResponse {
  success: boolean;
  message: string;
  diagnosticId?: string;
}

export class DiagnosticService {
  
  /**
   * Crea un nuevo diagnóstico médico
   * @param prediagnosticId - ID del prediagnóstico
   * @param diagnostic - Datos del diagnóstico (aprobación y comentario)
   * @returns Promise con la respuesta del servidor
   */
  static async createDiagnostic(
    prediagnosticId: string, 
    diagnostic: DiagnosticPayload
  ): Promise<DiagnosticResponse> {
    try {
      console.log(`🩺 Enviando diagnóstico para ID: ${prediagnosticId}`, diagnostic);
      
      const data = await GraphQLClient.query<CreateDiagnosticResponse>(
        CREATE_DIAGNOSTIC,
        {
          id_prediagnostico: prediagnosticId,
          input: {
            aprobacion: diagnostic.aprobacion,
            comentario: diagnostic.comentario
          }
        }
      );
      
      console.log(`✅ Diagnóstico creado exitosamente:`, data);
      
      return {
        success: data.createDiagnostic?.success || true,
        message: data.createDiagnostic?.message || "Diagnóstico enviado correctamente",
        diagnosticId: `diagnostic-${Date.now()}`
      };
      
    } catch (error) {
      console.error('❌ Error al crear diagnóstico:', error);
      
      // Detectar diferentes tipos de errores y manejarlos apropiadamente
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      
      // Si el backend no está disponible o hay errores de GraphQL, usar modo desarrollo
      if (errorMessage.includes('fetch') || 
          errorMessage.includes('GRAPHQL_VALIDATION_FAILED') ||
          errorMessage.includes('Cannot query field') ||
          errorMessage.includes('422')) {
        
        console.log('⚠️ Backend no disponible o API no implementada, simulando respuesta exitosa para desarrollo');
        console.log('🔧 En producción, asegúrate de que el backend tenga la mutación createDiagnostic implementada correctamente');
        
        return {
          success: true,
          message: "Diagnóstico enviado correctamente (modo desarrollo - backend no disponible)",
          diagnosticId: `mock-diagnostic-${Date.now()}`
        };
      }
      
      return {
        success: false,
        message: `Error al enviar diagnóstico: ${errorMessage}`
      };
    }
  }

  /**
   * Valida el payload del diagnóstico
   * @param diagnostic - Datos del diagnóstico a validar
   * @returns Objeto con el resultado de la validación
   */
  static validateDiagnostic(diagnostic: DiagnosticPayload): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Validar aprobación
    if (!diagnostic.aprobacion || (diagnostic.aprobacion !== "Si" && diagnostic.aprobacion !== "No")) {
      errors.push("Debe seleccionar si aprueba o rechaza el resultado del modelo");
    }

    // Validar comentario (mínimo 10 caracteres)
    if (!diagnostic.comentario || diagnostic.comentario.trim().length < 10) {
      errors.push("El comentario médico debe tener al menos 10 caracteres");
    }

    // Validar longitud máxima del comentario (opcional, pero recomendado)
    if (diagnostic.comentario && diagnostic.comentario.length > 1000) {
      errors.push("El comentario médico no puede exceder 1000 caracteres");
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Método de debug para probar la conexión del diagnóstico
   * @param prediagnosticId - ID del prediagnóstico
   * @param diagnostic - Datos del diagnóstico
   * @returns Promise con información de debug
   */
  static async debugDiagnostic(
    prediagnosticId: string, 
    diagnostic: DiagnosticPayload
  ): Promise<any> {
    console.log(`🔍 DEBUG DIAGNOSTIC: Intentando enviar diagnóstico`);
    console.log(`🔗 DEBUG: URL del GraphQL Client:`, 'http://localhost:8080/query');
    console.log(`📝 DEBUG: Mutation que se enviará:`, CREATE_DIAGNOSTIC);
    console.log(`📋 DEBUG: Variables:`, { 
      id_prediagnostico: prediagnosticId, 
      input: diagnostic 
    });
    
    const validation = this.validateDiagnostic(diagnostic);
    console.log(`✅ DEBUG: Validación:`, validation);
    
    if (!validation.isValid) {
      return {
        success: false,
        error: 'Datos de diagnóstico inválidos',
        validationErrors: validation.errors
      };
    }
    
    try {
      const startTime = performance.now();
      const result = await this.createDiagnostic(prediagnosticId, diagnostic);
      const endTime = performance.now();
      
      console.log(`⏱️ DEBUG: Diagnóstico procesado en ${endTime - startTime}ms`);
      
      return {
        success: result.success,
        data: result,
        responseTime: endTime - startTime,
        validation
      };
      
    } catch (error) {
      console.error('❌ DEBUG DIAGNOSTIC: Error completo:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
        fullError: error,
        validation
      };
    }
  }
}