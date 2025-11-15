import { useState, useEffect, useCallback } from 'react';
import { UserService } from '../services';
import type { Usuario, UserRole } from '../types';

export interface UsuariosStats {
  total: number;
  activos: number;
  inactivos: number;
  porRol: {
    admin: number;
    jugador: number;
    apoderado: number;
    entrenador: number;
  };
}

export interface UseUsuariosConfig {
  role: UserRole;
  userId?: string;
}

export interface UseUsuariosReturn {
  usuarios: Usuario[];
  loading: boolean;
  error: string | null;
  stats: UsuariosStats;
  refresh: () => Promise<void>;
}

export function useUsuarios(config: UseUsuariosConfig): UseUsuariosReturn {
  const { role, userId } = config;

  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsuarios = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let data: Usuario[] = [];

      switch (role) {
        case 'admin':
          data = await UserService.getAllUsers();
          break;

        case 'jugador':
          // Jugador no ve lista de usuarios
          data = [];
          break;

        case 'apoderado':
          // Apoderado ve solo sus jugadores tutorados
          if (userId) {
            try {
              const apoderado = await UserService.getUserById(userId);
              if (apoderado?.apoderado?.id_jugador_tutorado) {
                const player = await UserService.getUserById(apoderado.apoderado.id_jugador_tutorado);
                if (player) {
                  data = [player];
                }
              }
            } catch (err) {
              console.error('Error obteniendo jugadores tutorados:', err);
            }
          }
          break;

        case 'entrenador':
          // Entrenador ve sus jugadores asignados
          data = [];
          break;
      }

      setUsuarios(data);
    } catch (err) {
      console.error('Error fetching usuarios:', err);
      setError('Error al cargar los usuarios');
      setUsuarios([]);
    } finally {
      setLoading(false);
    }
  }, [role, userId]);

  const calculateStats = useCallback((usuarios: Usuario[]): UsuariosStats => {
    const total = usuarios.length;
    const activos = usuarios.filter(u => u.estado_cuenta).length;
    const inactivos = usuarios.filter(u => !u.estado_cuenta).length;

    const porRol = {
      admin: usuarios.filter(u => u.rol === 'admin').length,
      jugador: usuarios.filter(u => u.rol === 'jugador').length,
      apoderado: usuarios.filter(u => u.rol === 'apoderado').length,
      entrenador: usuarios.filter(u => u.rol === 'entrenador').length,
    };

    return {
      total,
      activos,
      inactivos,
      porRol,
    };
  }, []);

  const refresh = useCallback(async () => {
    await fetchUsuarios();
  }, [fetchUsuarios]);

  useEffect(() => {
    fetchUsuarios();
  }, [fetchUsuarios]);

  const stats = calculateStats(usuarios);

  return {
    usuarios,
    loading,
    error,
    stats,
    refresh,
  };
}
