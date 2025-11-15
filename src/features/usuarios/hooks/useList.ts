import { useState, useEffect, useCallback, useMemo } from 'react';
import { UserService, Usuario } from '../services/userService';

export interface FiltrosUsuarios {
  rol: string;
  estado: string;
  busqueda: string;
}

export interface UseListReturn {
  usuarios: Usuario[];
  usuariosFiltrados: Usuario[];
  loading: boolean;
  refreshing: boolean;
  filtros: FiltrosUsuarios;
  setFiltros: (filtros: FiltrosUsuarios) => void;
  onRefresh: () => void;
  stats: {
    total: number;
    activos: number;
    admins: number;
    jugadores: number;
    entrenadores: number;
    apoderados: number;
  };
}

export function useList(): UseListReturn {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filtros, setFiltros] = useState<FiltrosUsuarios>({
    rol: 'todos',
    estado: 'todos',
    busqueda: '',
  });

  const cargarUsuarios = useCallback(async () => {
    try {
      setLoading(true);
      const data = await UserService.getAllUsers();
      setUsuarios(data);
    } catch (error) {
      console.error('Error cargando usuarios:', error);
      // TODO: Handle error (show alert)
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const aplicarFiltros = useCallback(() => {
    let filtrados = usuarios;

    if (filtros.rol !== 'todos') {
      filtrados = filtrados.filter(usuario => usuario.rol === filtros.rol);
    }

    if (filtros.estado !== 'todos') {
      const estadoBool = filtros.estado === 'activo';
      filtrados = filtrados.filter(usuario => usuario.estado_cuenta === estadoBool);
    }

    if (filtros.busqueda) {
      const busquedaLower = filtros.busqueda.toLowerCase();
      filtrados = filtrados.filter(usuario =>
        usuario.nombre.toLowerCase().includes(busquedaLower) ||
        usuario.apellido.toLowerCase().includes(busquedaLower) ||
        usuario.correo.toLowerCase().includes(busquedaLower)
      );
    }

    return filtrados;
  }, [usuarios, filtros]);

  const usuariosFiltrados = useMemo(() => aplicarFiltros(), [aplicarFiltros]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    cargarUsuarios();
  }, [cargarUsuarios]);

  useEffect(() => {
    cargarUsuarios();
  }, [cargarUsuarios]);

  const stats = useMemo(() => {
    const total = usuarios.length;
    const activos = usuarios.filter(u => u.estado_cuenta).length;
    const admins = usuarios.filter(u => u.rol === 'admin').length;
    const jugadoresCount = usuarios.filter(u => u.rol === 'jugador').length;
    const entrenadores = usuarios.filter(u => u.rol === 'entrenador').length;
    const apoderados = usuarios.filter(u => u.rol === 'apoderado').length;

    return { total, activos, admins, jugadores: jugadoresCount, entrenadores, apoderados };
  }, [usuarios]);

  return {
    usuarios,
    usuariosFiltrados,
    loading,
    refreshing,
    filtros,
    setFiltros,
    onRefresh,
    stats,
  };
}
