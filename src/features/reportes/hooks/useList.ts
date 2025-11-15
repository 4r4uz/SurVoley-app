import { useState, useEffect, useCallback } from 'react';
import { ReportesService } from '../services/reportesService';
import { Reportes } from '../schema/reportesSchema';

export const useReportesList = () => {
  const [reportes, setReportes] = useState<Reportes[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadReportes = useCallback(async () => {
    try {
      setError(null);
      const data = await ReportesService.getAll();
      setReportes(data);
    } catch (err: any) {
      setError(err.message || 'Error al cargar reportes');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await loadReportes();
  }, [loadReportes]);

  const deleteReporte = useCallback(async (id: string) => {
    try {
      await ReportesService.delete(id);
      setReportes(prev => prev.filter(r => r.id !== id));
    } catch (err: any) {
      setError(err.message || 'Error al eliminar reporte');
      throw err;
    }
  }, []);

  useEffect(() => {
    loadReportes();
  }, [loadReportes]);

  return {
    reportes,
    loading,
    error,
    refreshing,
    refresh,
    deleteReporte,
  };
};
