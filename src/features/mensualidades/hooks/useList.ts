import { useList as useBaseList, UseListReturn, UseListConfig } from '../../pagos/hooks/useList';
import { MensualidadesService, Mensualidad } from '../services/mensualidadesService';

export interface FiltrosMensualidades {
  busqueda: string;
  estado_pago: string;
  mes_referencia: string;
  anio_referencia: string;
}

export interface UseListMensualidadesReturn extends UseListReturn<Mensualidad> {
  filtros: FiltrosMensualidades;
}

export function useList(config?: Partial<UseListConfig<Mensualidad>>): UseListMensualidadesReturn {
  const baseConfig: UseListConfig<Mensualidad> = {
    fetchItems: MensualidadesService.getAll,
    calculateStats: (mensualidades) => ({
      total: mensualidades.length,
      pendientes: mensualidades.filter(m => m.estado_pago === 'Pendiente').length,
      pagadas: mensualidades.filter(m => m.estado_pago === 'Pagado').length,
      canceladas: mensualidades.filter(m => m.estado_pago === 'Cancelado').length,
      vencidas: mensualidades.filter(m => {
        const today = new Date();
        const vencimiento = new Date(m.fecha_vencimiento);
        return m.estado_pago === 'Pendiente' && vencimiento < today;
      }).length,
    }),
    searchFields: ['jugador.nombre', 'jugador.apellido', 'mes_referencia'],
    ...config,
  };

  const baseList = useBaseList<Mensualidad>(baseConfig);

  // Override filtros to use our custom type
  const filtros: FiltrosMensualidades = {
    ...baseList.filtros,
    busqueda: baseList.filtros.busqueda || '',
    estado_pago: 'todos',
    mes_referencia: 'todos',
    anio_referencia: 'todos',
  };

  return {
    ...baseList,
    filtros,
  };
}
