import { useList, UseListAsistenciasReturn } from '../useList';
import { useForm, UseFormAsistenciasReturn } from '../useForm';
import { AsistenciasService, Asistencia } from '../../services/asistenciasService';

export interface UseAdminAsistenciasReturn {
  list: UseListAsistenciasReturn;
  form: UseFormAsistenciasReturn;
  // Admin has full permissions
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canViewAll: boolean;
  visibleColumns: string[];
}

export function useAdminAsistencias(): UseAdminAsistenciasReturn {
  const list = useList({
    fetchItems: AsistenciasService.getAll,
    calculateStats: (asistencias) => ({
      total: asistencias.length,
      presentes: asistencias.filter(a => a.estado_asistencia === 'Presente').length,
      ausentes: asistencias.filter(a => a.estado_asistencia === 'Ausente').length,
      justificados: asistencias.filter(a => a.estado_asistencia === 'Justificado').length,
      sinRegistro: asistencias.filter(a => a.estado_asistencia === 'Sin registro').length,
    }),
    searchFields: ['jugador.nombre', 'jugador.apellido'],
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
