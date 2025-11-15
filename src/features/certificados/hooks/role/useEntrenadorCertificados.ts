import { useList, UseListCertificadosReturn } from '../useList';
import { CertificadosService, Certificado } from '../../services/certificadosService';

export interface UseEntrenadorCertificadosReturn {
  list: UseListCertificadosReturn;
  // Entrenador has limited permissions for certificados - mainly read-only
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canViewAll: boolean;
  visibleColumns: string[];
}

export function useEntrenadorCertificados(): UseEntrenadorCertificadosReturn {
  const list = useList({
    fetchItems: CertificadosService.getAll, // Entrenador puede ver todos los certificados
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
    canCreate: false, // Entrenador no crea certificados
    canEdit: false,   // Solo puede ver los certificados
    canDelete: false,
    canViewAll: true, // Puede ver todos los certificados del club
    visibleColumns: ['jugador.nombre', 'jugador.apellido', 'tipo_certificado', 'fecha_emision', 'fecha_vencimiento'],
  };
}
