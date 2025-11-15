import { useState, useCallback } from 'react';
import { useAuth } from '../../../../core/auth/useAuth';
import { ReportesService } from '../../services/reportesService';
import { Reportes } from '../../schema/reportesSchema';

export const useAdminReportes = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateReport = useCallback(async (
    type: string,
    startDate: string,
    endDate: string,
    title: string,
    description: string
  ): Promise<Reportes> => {
    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    try {
      setLoading(true);
      setError(null);

      // Generar los datos del reporte
      const reportData = await ReportesService.generateReport(type, startDate, endDate);

      // Crear el reporte en la base de datos
      const reporteData = {
        titulo: title,
        descripcion: description,
        tipo: type as any,
        fecha_inicio: startDate,
        fecha_fin: endDate,
        estado: 'generado' as const,
        datos: reportData,
        creado_por: user.id,
        fecha_creacion: new Date().toISOString(),
      };

      const newReporte = await ReportesService.create(reporteData);
      return newReporte;
    } catch (err: any) {
      setError(err.message || 'Error al generar reporte');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const getReportStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const allReportes = await ReportesService.getAll();

      const stats = {
        totalReportes: allReportes.length,
        reportesGenerados: allReportes.filter(r => r.estado === 'generado').length,
        reportesProcesando: allReportes.filter(r => r.estado === 'procesando').length,
        reportesError: allReportes.filter(r => r.estado === 'error').length,
        reportesPorTipo: {
          financiero: allReportes.filter(r => r.tipo === 'financiero').length,
          asistencias: allReportes.filter(r => r.tipo === 'asistencias').length,
          usuarios: allReportes.filter(r => r.tipo === 'usuarios').length,
          general: allReportes.filter(r => r.tipo === 'general').length,
        },
      };

      return stats;
    } catch (err: any) {
      setError(err.message || 'Error al obtener estadísticas');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    generateReport,
    getReportStats,
    loading,
    error,
  };
};
