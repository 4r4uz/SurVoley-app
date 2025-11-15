import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../../../core/auth/useAuth';
import { useList, UseListReturn, FiltrosUsuarios } from '../useList';
import { useForm, UseFormReturn } from '../useForm';
import { UserService, Usuario } from '../../services/userService';

export interface UseJugadorReturn {
  list: UseListReturn;
  form: UseFormReturn;
  // Jugador permissions: very limited, can only view/edit own info
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canViewAll: boolean;
  visibleColumns: string[];
  ownProfileOnly: boolean;
  currentUser: Usuario | null;
}

export function useJugador(): UseJugadorReturn {
  const { user } = useAuth();
  const baseList = useList();
  const form = useForm(baseList.onRefresh);

  // Get current user's profile
  const [currentUser, setCurrentUser] = useState<Usuario | null>(null);

  useEffect(() => {
    if (user?.id) {
      UserService.getUserById(user.id).then(setCurrentUser).catch(console.error);
    }
  }, [user?.id]);

  // Override list to show only current user
  const jugadorList: UseListReturn = {
    ...baseList,
    usuariosFiltrados: currentUser ? [currentUser] : [],
    filtros: { rol: 'todos', estado: 'todos', busqueda: '' },
    setFiltros: () => {}, // No filtering allowed
  };

  return {
    list: jugadorList,
    form,
    canCreate: false,
    canEdit: true, // Can edit own profile
    canDelete: false,
    canViewAll: false,
    visibleColumns: ['basic', 'player'], // Limited columns
    ownProfileOnly: true,
    currentUser,
  };
}
