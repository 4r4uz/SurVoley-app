import { useList, UseListCertificadosReturn } from '../useList';
import { useForm, UseFormCertificadosReturn } from '../useForm';
import { CertificadosService, Certificado } from '../../services/certificadosService';

export interface UseJugadorCertificadosReturn {
  list: UseListCertificadosReturn;
  form: UseFormCertificadosReturn;
  // Jugador can view and generate their own certificates
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canViewAll: boolean;
  visibleColumns: string[];
  // Special function for generating certificates
  generarCertificado: (tipo: string) => Promise<void>;
}

export function useJugadorCertificados(userId?: string): UseJugadorCertificadosReturn {
  const list = useList({
    fetchItems: () => userId ? CertificadosService.getByJugador(userId) : Promise.resolve([]),
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
    searchFields: ['tipo_certificado'],
  });

  const form = useForm({
    onSuccess: () => {
      list.onRefresh();
    },
  });

  const generarCertificado = async (tipo: string) => {
    if (!userId) throw new Error('User ID is required');
    await CertificadosService.generarCertificado(tipo, userId);
    list.onRefresh();
  };

  return {
    list,
    form,
    canCreate: true, // Puede generar sus propios certificados
    canEdit: false,  // No puede editar certificados existentes
    canDelete: false,
    canViewAll: false, // Solo ve sus propios certificados
    visibleColumns: ['tipo_certificado', 'fecha_emision', 'fecha_vencimiento', 'url'],
    generarCertificado,
  };
}
