import { useState, useEffect, useCallback, useMemo } from 'react';
import { useList, UseListReturn, FiltrosUsuarios } from '../useList';
import { useForm, UseFormReturn } from '../useForm';
import { UserService, Usuario } from '../../services/userService';

export interface UseEntrenadorReturn {
  list: UseListReturn;
  form: UseFormReturn;
  // Entrenador permissions: can view players, limited edit
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canViewAll: boolean;
  visibleColumns: string[];
  playersOnly: boolean;
}

export function useEntrenador(): UseEntrenadorReturn {
  // Custom list hook that filters to players only
  const baseList = useList();

  // Override the list to filter players
  const [entrenadorFiltros, setEntrenadorFiltros] = useState<FiltrosUsuarios>({
    rol: 'jugador', // Force filter to players
    estado: 'todos',
    busqueda: '',
  });

  const filteredUsuarios = useMemo(() => {
    return baseList.usuariosFiltrados.filter(u => u.rol === 'jugador');
  }, [baseList.usuariosFiltrados]);

  const entrenadorList: UseListReturn = {
    ...baseList,
    usuariosFiltrados: filteredUsuarios,
    filtros: entrenadorFiltros,
    setFiltros: (filtros: FiltrosUsuarios) => {
      // Only allow changing estado and busqueda, force rol to 'jugador'
      setEntrenadorFiltros({
        ...filtros,
        rol: 'jugador',
      });
    },
  };

  const form = useForm(baseList.onRefresh);

  return {
    list: entrenadorList,
    form,
    canCreate: false, // Entrenador cannot create users
    canEdit: false, // Limited edit permissions
    canDelete: false,
    canViewAll: false, // Only players
    visibleColumns: ['basic', 'player'], // Show basic and player-specific columns
    playersOnly: true,
  };
}
