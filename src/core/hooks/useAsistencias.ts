import { useState, useEffect, useCallback } from 'react';
import { AsistenciasService } from '../services';
import type { Asistencia, UserRole } from '../types';

export interface AsistenciasStats {
  total: number;
  presentes: number;
  ausentes: number;
  justificados: number;
}

export interface UseAsistenciasConfig {
  role: UserRole;
  userId?: string;
  associatedPlayers?: string[];
}

export interface UseAsistenciasReturn {
  asistencias: Asistencia[];
  loading: boolean;
  error: string | null;
  stats: AsistenciasStats;
  refresh: () => Promise<void>;
}

export function useAsistencias(config: UseAsistenciasConfig): UseAsistenciasReturn {
  const { role, userId, associatedPlayers = [] } = config;

  const [asistencias, setAsistencias] = useState<Asistencia[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAsistencias = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let data: Asistencia[] = [];

      switch (role) {
        case 'admin':
          data = await AsistenciasService.getAll();
          break;

        case 'jugador':
          if (userId) {
            data = await AsistenciasService.getByJugador(userId);
          }
          break;

        case 'apoderado':
        case 'entrenador':
          if (associatedPlayers.length > 0) {
            const allAsistencias: Asistencia[] = [];
            for (const playerId of associatedPlayers) {
              const playerAsistencias = await AsistenciasService.getByJugador(playerId);
              allAsistencias.push(...playerAsistencias);
            }
            data = allAsistencias;
          }
          break;
      }

      setAsistencias(data);
    } catch (err) {
      console.error('Error fetching asistencias:', err);
      setError('Error al cargar las asistencias');
      setAsistencias([]);
    } finally {
      setLoading(false);
    }
  }, [role, userId, associatedPlayers]);

  const calculateStats = useCallback((asistencias: Asistencia[]): AsistenciasStats => {
    return {
      total: asistencias.length,
      presentes: asistencias.filter(a => a.estado_asistencia === 'Presente').length,
      ausentes: asistencias.filter(a => a.estado_asistencia === 'Ausente').length,
      justificados: asistencias.filter(a => a.estado_asistencia === 'Justificado').length,
    };
  }, []);

  const refresh = useCallback(async () => {
    await fetchAsistencias();
  }, [fetchAsistencias]);

  useEffect(() => {
    fetchAsistencias();
  }, [fetchAsistencias]);

  const stats = calculateStats(asistencias);

  return {
    asistencias,
    loading,
    error,
    stats,
    refresh,
  };
}
