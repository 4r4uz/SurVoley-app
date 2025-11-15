import { useState, useEffect, useCallback } from 'react';
import { MensualidadesService } from '../services';
import type { Mensualidad, UserRole } from '../types';

export interface MensualidadesStats {
  total: number;
  pagadas: number;
  pendientes: number;
  totalPagado: number;
  totalPendiente: number;
}

export interface UseMensualidadesConfig {
  role: UserRole;
  userId?: string;
  associatedPlayers?: string[];
}

export interface UseMensualidadesReturn {
  mensualidades: Mensualidad[];
  loading: boolean;
  error: string | null;
  stats: MensualidadesStats;
  refresh: () => Promise<void>;
}

export function useMensualidades(config: UseMensualidadesConfig): UseMensualidadesReturn {
  const { role, userId, associatedPlayers = [] } = config;

  const [mensualidades, setMensualidades] = useState<Mensualidad[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMensualidades = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let data: Mensualidad[] = [];

      switch (role) {
        case 'admin':
          data = await MensualidadesService.getAll();
          break;

        case 'jugador':
          if (userId) {
            data = await MensualidadesService.getByJugador(userId);
          }
          break;

        case 'apoderado':
        case 'entrenador':
          if (associatedPlayers.length > 0) {
            const allMensualidades: Mensualidad[] = [];
            for (const playerId of associatedPlayers) {
              const playerMensualidades = await MensualidadesService.getByJugador(playerId);
              allMensualidades.push(...playerMensualidades);
            }
            data = allMensualidades;
          }
          break;
      }

      setMensualidades(data);
    } catch (err) {
      console.error('Error fetching mensualidades:', err);
      setError('Error al cargar las mensualidades');
      setMensualidades([]);
    } finally {
      setLoading(false);
    }
  }, [role, userId, associatedPlayers]);

  const calculateStats = useCallback((mensualidades: Mensualidad[]): MensualidadesStats => {
    return {
      total: mensualidades.length,
      pagadas: mensualidades.filter(m => m.estado_pago === 'Pagado').length,
      pendientes: mensualidades.filter(m => m.estado_pago === 'Pendiente').length,
      totalPagado: mensualidades
        .filter(m => m.estado_pago === 'Pagado')
        .reduce((sum, m) => sum + m.monto, 0),
      totalPendiente: mensualidades
        .filter(m => m.estado_pago === 'Pendiente')
        .reduce((sum, m) => sum + m.monto, 0),
    };
  }, []);

  const refresh = useCallback(async () => {
    await fetchMensualidades();
  }, [fetchMensualidades]);

  useEffect(() => {
    fetchMensualidades();
  }, [fetchMensualidades]);

  const stats = calculateStats(mensualidades);

  return {
    mensualidades,
    loading,
    error,
    stats,
    refresh,
  };
}
