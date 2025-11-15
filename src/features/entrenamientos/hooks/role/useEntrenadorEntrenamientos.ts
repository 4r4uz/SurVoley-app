import { useList, UseListEntrenamientosReturn } from '../useList';
import { useForm, UseFormEntrenamientosReturn } from '../useForm';
import { EntrenamientosService, Entrenamiento } from '../../services/entrenamientosService';

export interface UseEntrenadorEntrenamientosReturn {
  list: UseListEntrenamientosReturn;
  form: UseFormEntrenamientosReturn;
  // Entrenador can create trainings and view all trainings
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canViewAll: boolean;
  visibleColumns: string[];
  // Special functions for trainer
  crearEntrenamiento: (data: any) => Promise<void>;
  getMisEntrenamientos: () => Promise<Entrenamiento[]>;
}

export function useEntrenadorEntrenamientos(userId?: string): UseEntrenadorEntrenamientosReturn {
  const list = useList({
    fetchItems: EntrenamientosService.getAll, // Entrenador ve todos los entrenamientos
    calculateStats: (entrenamientos) => {
      const now = new Date();
      const misEntrenamientos = entrenamientos.filter(e => e.id_entrenador === userId);
      return {
        total: entrenamientos.length,
        proximos: entrenamientos.filter(e => new Date(e.fecha_hora) > now).length,
        pasados: entrenamientos.filter(e => new Date(e.fecha_hora) < now).length,
        enCurso: entrenamientos.filter(e => {
          const fechaHora = new Date(e.fecha_hora);
          const finEntrenamiento = new Date(fechaHora.getTime() + (e.duracion_minutos * 60000));
          return fechaHora <= now && finEntrenamiento >= now;
        }).length,
        misEntrenamientos: misEntrenamientos.length,
      };
    },
    searchFields: ['lugar', 'descripcion'],
  });

  const form = useForm({
    initialData: {
      fecha_hora: new Date(),
      lugar: '',
      id_entrenador: userId || '', // Pre-llenar con el entrenador actual
      duracion_minutos: 90,
      descripcion: '',
    },
    onSuccess: () => {
      list.onRefresh();
    },
  });

  const crearEntrenamiento = async (data: any) => {
    if (!userId) throw new Error('User ID is required');
    await EntrenamientosService.create({
      ...data,
      id_entrenador: userId, // Forzar que sea el entrenador actual
    });
    list.onRefresh();
  };

  const getMisEntrenamientos = async () => {
    if (!userId) return [];
    return await EntrenamientosService.getByEntrenador(userId);
  };

  return {
    list,
    form,
    canCreate: true, // Entrenador puede crear entrenamientos
    canEdit: true,   // Puede editar sus propios entrenamientos
    canDelete: false, // No puede eliminar entrenamientos
    canViewAll: true, // Puede ver todos los entrenamientos del club
    visibleColumns: ['fecha_hora', 'lugar', 'duracion_minutos', 'descripcion', 'entrenador.nombre'],
    crearEntrenamiento,
    getMisEntrenamientos,
  };
}
