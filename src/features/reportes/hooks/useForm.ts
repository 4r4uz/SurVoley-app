import { useState, useCallback } from 'react';
import { ReportesService } from '../services/reportesService';
import { ReportesFormData } from '../schema/reportesSchema';

export const useReportesForm = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createReporte = useCallback(async (data: ReportesFormData) => {
    try {
      setLoading(true);
      setError(null);

      // Generar el reporte usando el servicio
      const reportData = await ReportesService.generateReport(
        data.tipo,
        data.fecha_inicio,
        data.fecha_fin
      );

      // Crear el registro del reporte
      const reporteData = {
        ...data,
        datos: reportData,
        estado: 'generado' as const,
        fecha_creacion: new Date().toISOString(),
      };

      const newReporte = await ReportesService.create(reporteData);
      return newReporte;
    } catch (err: any) {
      setError(err.message || 'Error al crear reporte');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateReporte = useCallback(async (id: string, data: Partial<ReportesFormData>) => {
    try {
      setLoading(true);
      setError(null);

      const updatedReporte = await ReportesService.update(id, data);
      return updatedReporte;
    } catch (err: any) {
      setError(err.message || 'Error al actualizar reporte');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    createReporte,
    updateReporte,
  };
};
