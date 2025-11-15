import { useState, useEffect, useRef, useCallback } from "react";
import * as SecureStore from 'expo-secure-store';
import {
  User,
  UseAuthReturn,
  validateUser,
  USER_ROLES
} from "./types";
import { generarMensualidadesAutomaticas } from "../services";

const USER_STORAGE_KEY = "currentUser";
const SESSION_CHECK_KEY = "sessionChecked";
const REMEMBER_ME_KEY = "rememberMe";

let globalSessionChecked = false;
let cachedUser: User | null = null;
let mensualidadesGeneradas = false;

export const useAuth = (): UseAuthReturn => {
  const [authState, setAuthState] = useState({
    user: null as User | null,
    loading: true,
    isAuthenticated: false,
  });

  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;

    if (globalSessionChecked && cachedUser) {
      if (isMounted.current) {
        setAuthState({
          user: cachedUser,
          loading: false,
          isAuthenticated: true,
        });
      }
      return;
    }

    checkSession();

    return () => {
      isMounted.current = false;
    };
  }, []);

  const shouldRememberMe = async (): Promise<boolean> => {
    try {
      const rememberMe = await SecureStore.getItemAsync(REMEMBER_ME_KEY);
      return rememberMe === "true";
    } catch (error) {
      console.error("Error verificando recordarme:", error);
      return false;
    }
  };

  const storeUserSecurely = async (user: User, rememberMe: boolean = false): Promise<void> => {
    try {
      if (rememberMe) {
        await SecureStore.setItemAsync(USER_STORAGE_KEY, JSON.stringify(user));
        await SecureStore.setItemAsync(REMEMBER_ME_KEY, "true");
      } else {
        await SecureStore.setItemAsync(REMEMBER_ME_KEY, "false");
        await SecureStore.deleteItemAsync(USER_STORAGE_KEY);
      }
      await SecureStore.setItemAsync(SESSION_CHECK_KEY, "true");
    } catch (error) {
      console.error("Error almacenando usuario:", error);
      throw new Error("No se pudo guardar la sesiรณn de forma segura");
    }
  };

  const getStoredUser = async (): Promise<User | null> => {
    try {
      const rememberMe = await shouldRememberMe();
      if (!rememberMe) {
        return null;
      }

      const userJson = await SecureStore.getItemAsync(USER_STORAGE_KEY);
      if (userJson) {
        return JSON.parse(userJson);
      }
      return null;
    } catch (error) {
      console.error("Error obteniendo usuario almacenado:", error);
      return null;
    }
  };

  const checkSession = async (): Promise<void> => {
    if (globalSessionChecked) {
      if (isMounted.current) {
        setAuthState(prev => ({ ...prev, loading: false }));
      }
      return;
    }

    try {
      // Verificar usuario almacenado en SecureStore
      const user = await getStoredUser();

      if (user) {
        console.log("Usuario encontrado en SecureStore:", user.email);

        if (validateUser(user)) {
          cachedUser = user;
          globalSessionChecked = true;

          if (isMounted.current) {
            setAuthState({
              user,
              loading: false,
              isAuthenticated: true,
            });
          }
        } else {
          await clearStorage();
          throw new Error("Datos de usuario corruptos o inválidos");
        }
      } else {
        console.log("No hay sesión guardada");
        globalSessionChecked = true;
        if (isMounted.current) {
          setAuthState({
            user: null,
            loading: false,
            isAuthenticated: false,
          });
        }
      }
    } catch (error) {
      console.error("Error checking session:", error);
      await clearStorage();
      globalSessionChecked = true;
      if (isMounted.current) {
        setAuthState({
          user: null,
          loading: false,
          isAuthenticated: false,
        });
      }
    }
  };

  const clearStorage = async (): Promise<void> => {
    try {
      await SecureStore.deleteItemAsync(USER_STORAGE_KEY);
      await SecureStore.deleteItemAsync(SESSION_CHECK_KEY);
      await SecureStore.deleteItemAsync(REMEMBER_ME_KEY);
      cachedUser = null;
      globalSessionChecked = false;
    } catch (error) {
      console.error("Error limpiando almacenamiento:", error);
    }
  };

  const ejecutarGeneracionAutomatica = useCallback(async () => {
    if (mensualidadesGeneradas) {
      return;
    }

    try {
      mensualidadesGeneradas = true;
      await generarMensualidadesAutomaticas();
    } catch (error) {
      console.error("Error en generaciรณn automรกtica de mensualidades:", error);
      mensualidadesGeneradas = false; // Reset para permitir reintento
    }
  }, []);

  const setUser = useCallback(async (
    user: User,
    rememberMe: boolean = false
  ): Promise<void> => {
    try {
      if (!validateUser(user)) {
        throw new Error("Estructura de usuario invรกlida");
      }

      await storeUserSecurely(user, rememberMe);

      cachedUser = user;
      globalSessionChecked = true;

      if (isMounted.current) {
        setAuthState({
          user,
          loading: false,
          isAuthenticated: true,
        });
      }

      // Ejecutar generaciรณn automรกtica de mensualidades despuรฉs de login exitoso
      ejecutarGeneracionAutomatica();
    } catch (error) {
      console.error("Error setting user:", error);
      throw error;
    }
  }, [ejecutarGeneracionAutomatica]);

  const updateUser = useCallback(async (userUpdates: Partial<User>): Promise<void> => {
    try {
      if (!authState.user) {
        throw new Error("No hay usuario autenticado");
      }

      const updatedUser = { ...authState.user, ...userUpdates };

      if (!validateUser(updatedUser)) {
        throw new Error("Datos de usuario invรกlidos");
      }

      // Actualizar en SecureStore si estรก activado
      const rememberMe = await shouldRememberMe();
      if (rememberMe) {
        await storeUserSecurely(updatedUser, true);
      }

      cachedUser = updatedUser;

      if (isMounted.current) {
        setAuthState(prev => ({
          ...prev,
          user: updatedUser,
        }));
      }

      console.log("Usuario actualizado correctamente");
    } catch (error) {
      console.error("Error actualizando usuario:", error);
      throw error;
    }
  }, [authState.user]);

  const signOut = useCallback(async (): Promise<void> => {
    try {
      // Limpiar almacenamiento local
      await clearStorage();

      if (isMounted.current) {
        setAuthState({
          user: null,
          loading: false,
          isAuthenticated: false,
        });
      }

      console.log("Sesión cerrada correctamente");
    } catch (error) {
      console.error("Error en cerrar sesión:", error);
      throw error;
    }
  }, []);

  return {
    ...authState,
    signOut,
    setUser,
    updateUser,
  };
};
