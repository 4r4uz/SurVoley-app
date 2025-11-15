import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../../../core/auth/useAuth';
import { useList, UseListReturn, FiltrosUsuarios } from '../useList';
import { useForm, UseFormReturn } from '../useForm';
import { UserService, Usuario } from '../../services/userService';

export interface UseApoderadoReturn {
  list: UseListReturn;
  form: UseFormReturn;
  // Apoderado permissions: can view tutored players
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canViewAll: boolean;
  visibleColumns: string[];
  tutoredPlayersOnly: boolean;
  tutoredPlayers: Usuario[];
}

export function useApoderado(): UseApoderadoReturn {
  const { user } = useAuth();
  const baseList = useList();
  const form = useForm(baseList.onRefresh);

  // Get tutored players
  const [tutoredPlayers, setTutoredPlayers] = useState<Usuario[]>([]);

  useEffect(() => {
    if (user?.id) {
      // Get apoderado info to find tutored players
      UserService.getUserById(user.id).then((apoderado) => {
        if (apoderado?.apoderado?.id_jugador_tutorado) {
          // Get the tutored player
          UserService.getUserById(apoderado.apoderado.id_jugador_tutorado)
            .then((player) => {
              if (player) setTutoredPlayers([player]);
            })
            .catch(console.error);
        }
      }).catch(console.error);
    }
  }, [user?.id]);

  // Override list to show only tutored players
  const apoderadoList: UseListReturn = {
    ...baseList,
    usuariosFiltrados: tutoredPlayers,
    filtros: { rol: 'todos', estado: 'todos', busqueda: '' },
    setFiltros: () => {}, // No filtering allowed
  };

  return {
    list: apoderadoList,
    form,
    canCreate: false,
    canEdit: false, // Cannot edit players
    canDelete: false,
    canViewAll: false,
    visibleColumns: ['basic', 'player'], // Limited columns
    tutoredPlayersOnly: true,
    tutoredPlayers,
  };
}
