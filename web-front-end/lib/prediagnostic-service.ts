import { GraphQLClient } from './apollo-client';
import { 
  GET_PREDIAGNOSTIC, 
  GetPreDiagnosticResponse,
  PreDiagnostic 
} from './graphql-queries';
import { getPreDiagnostic } from '@/server-actions/cases-actions';

export class PreDiagnosticService {
  

  static async debugConnection(id: string): Promise<any> {
    console.log(`🔍 DEBUG: Intentando conectar con backend para ID: ${id}`);
    console.log(`🔗 DEBUG: URL del GraphQL Client:`, 'http://localhost:8080/query');
    
    try {
      console.log(`📝 DEBUG: Query que se enviará:`, GET_PREDIAGNOSTIC);
      console.log(`📋 DEBUG: Variables:`, { id });
      
      const startTime = performance.now();
      
      const data = await getPreDiagnostic(id)
      
      const endTime = performance.now();
      console.log(`⏱️ DEBUG: Respuesta recibida en ${endTime - startTime}ms`);
      console.log(`📦 DEBUG: Datos recibidos:`, data);
      
      return { success: true, data, responseTime: endTime - startTime };
    } catch (error) {
      console.error('❌ DEBUG: Error completo:', error);
      console.error('❌ DEBUG: Stack trace:', error instanceof Error ? error.stack : 'No stack');
      
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error desconocido',
        fullError: error
      };
    }
  }


  /**
   * Formatea la fecha para mostrar en la interfaz
   * @param fechaString - Fecha en formato string
   * @returns Fecha formateada
   */
  static formatDate(fechaString: string): string {
    try {
      const fecha = new Date(fechaString);
      return fecha.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return fechaString;
    }
  }

  /**
   * Determina la urgencia basada en la probabilidad de neumonía
   * @param probNeumonia - Probabilidad de neumonía (0-1)
   * @returns Nivel de urgencia
   */
  static getUrgencyLevel(probNeumonia: number): 'routine' | 'urgent' {
    return probNeumonia > 0.7 ? 'urgent' : 'routine';
  }

  /**
   * Obtiene el color del badge basado en la etiqueta
   * @param etiqueta - Etiqueta del diagnóstico
   * @returns Clase de color para el badge
   */
  static getBadgeColor(etiqueta: string): string {
    switch (etiqueta.toLowerCase()) {
      case 'neumonía':
      case 'neumonia':
        return 'bg-red-100 text-red-800';
      case 'normal':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  }
}
