import { useList, UseListEntrenamientosReturn } from '../useList';
import { useForm, UseFormEntrenamientosReturn } from '../useForm';
import { EntrenamientosService, Entrenamiento } from '../../services/entrenamientosService';

export interface UseAdminEntrenamientosReturn {
  list: UseListEntrenamientosReturn;
  form: UseFormEntrenamientosReturn;
  // Admin has full permissions
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canViewAll: boolean;
  visibleColumns: string[];
}

export function useAdminEntrenamientos(): UseAdminEntrenamientosReturn {
  const list = useList({
    fetchItems: EntrenamientosService.getAll,
    calculateStats: (entrenamientos) => {
      const now = new Date();
      return {
        total: entrenamientos.length,
        proximos: entrenamientos.filter(e => new Date(e.fecha_hora) > now).length,
        pasados: entrenamientos.filter(e => new Date(e.fecha_hora) < now).length,
        enCurso: entrenamientos.filter(e => {
          const fechaHora = new Date(e.fecha_hora);
          const finEntrenamiento = new Date(fechaHora.getTime() + (e.duracion_minutos * 60000));
          return fechaHora <= now && finEntrenamiento >= now;
        }).length,
      };
    },
    searchFields: ['lugar', 'descripcion', 'entrenador.nombre', 'entrenador.apellido'],
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
