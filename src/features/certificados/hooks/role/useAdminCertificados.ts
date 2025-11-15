import { useList, UseListCertificadosReturn } from '../useList';
import { useForm, UseFormCertificadosReturn } from '../useForm';
import { CertificadosService, Certificado } from '../../services/certificadosService';

export interface UseAdminCertificadosReturn {
  list: UseListCertificadosReturn;
  form: UseFormCertificadosReturn;
  // Admin has full permissions
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canViewAll: boolean;
  visibleColumns: string[];
}

export function useAdminCertificados(): UseAdminCertificadosReturn {
  const list = useList({
    fetchItems: CertificadosService.getAll,
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

  const form = useForm({
    onSuccess: () => {
      list.onRefresh();
    },
  });

  return {
    list,
    form,
    canCreate: true,
    canEdit: true,
    canDelete: true,
    canViewAll: true,
    visibleColumns: ['all'], // Show all columns
  };
}
