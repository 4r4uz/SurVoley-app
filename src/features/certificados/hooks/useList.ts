import { useList as useBaseList, UseListReturn, UseListConfig } from '../../pagos/hooks/useList';
import { CertificadosService, Certificado } from '../services/certificadosService';

export interface FiltrosCertificados {
  busqueda: string;
  tipo_certificado: string;
  estado_vencimiento: string; // 'vigente' | 'por_vencer' | 'vencido' | 'todos'
}

export interface UseListCertificadosReturn extends UseListReturn<Certificado> {
  filtros: FiltrosCertificados;
}

export function useList(config?: Partial<UseListConfig<Certificado>>): UseListCertificadosReturn {
  const baseConfig: UseListConfig<Certificado> = {
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
    ...config,
  };

  const baseList = useBaseList<Certificado>(baseConfig);

  // Override filtros to use our custom type
  const filtros: FiltrosCertificados = {
    ...baseList.filtros,
    busqueda: baseList.filtros.busqueda || '',
    tipo_certificado: 'todos',
    estado_vencimiento: 'todos',
  };

  return {
    ...baseList,
    filtros,
  };
}
