import { useList, UseListCertificadosReturn } from '../useList';
import { CertificadosService, Certificado } from '../../services/certificadosService';

export interface UseApoderadoCertificadosReturn {
  list: UseListCertificadosReturn;
  // Apoderado can view certificates of their associated players
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canViewAll: boolean;
  visibleColumns: string[];
}

export function useApoderadoCertificados(jugadoresAsociados: string[] = []): UseApoderadoCertificadosReturn {
  const list = useList({
    fetchItems: async () => {
      // Obtener certificados de todos los jugadores asociados
      const allCertificados: Certificado[] = [];
      for (const jugadorId of jugadoresAsociados) {
        const certificados = await CertificadosService.getByJugador(jugadorId);
        allCertificados.push(...certificados);
      }
      return allCertificados;
    },
    calculateStats: (certificados) => {
      const today = new Date();
      return {
        total: certificados.length,
        vigentes: certificados.filter(c => new Date(c.fecha_vencimiento) > today).length,
        porVencer: certificados.filter(c => {
          const vencimiento = new Date(c.fecha_vencimiento);
          const diffTime = vencimiento.getTime() - today.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          return diffDays <= 30 && diffDays > 0;
        }).length,
        vencidos: certificados.filter(c => new Date(c.fecha_vencimiento) < today).length,
      };
    },
    searchFields: ['jugador.nombre', 'jugador.apellido', 'tipo_certificado'],
  });

  return {
    list,
    canCreate: false, // Apoderado no puede crear certificados
    canEdit: false,   // Solo puede ver certificados de sus hijos
    canDelete: false,
    canViewAll: false, // Solo ve certificados de sus jugadores asociados
    visibleColumns: ['jugador.nombre', 'jugador.apellido', 'tipo_certificado', 'fecha_emision', 'fecha_vencimiento', 'url'],
  };
}
