import { useState, useEffect, useRef } from "react";
import * as SecureStore from 'expo-secure-store';
import { supabase } from "../supabase/supabaseClient";
import { User, UseAuthReturn } from "../types/auth.type";

// Constantes para las keys de almacenamiento
const USER_STORAGE_KEY = "currentUser";
const SESSION_CHECK_KEY = "sessionChecked";
const REMEMBER_ME_KEY = "rememberMe"; // Nueva key para recordar sesión

let globalSessionChecked = false;
let cachedUser: User | null = null;

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

  // Función para verificar si debe recordar la sesión
  const shouldRememberMe = async (): Promise<boolean> => {
    try {
      const rememberMe = await SecureStore.getItemAsync(REMEMBER_ME_KEY);
      return rememberMe === "true";
    } catch (error) {
      console.error("Error verificando recordarme:", error);
      return false;
    }
  };

  // Función segura para almacenar el usuario
  const storeUserSecurely = async (user: User, rememberMe: boolean = false): Promise<void> => {
    try {
      if (rememberMe) {
        // Si eligió recordar, guardamos el usuario
        await SecureStore.setItemAsync(USER_STORAGE_KEY, JSON.stringify(user));
        await SecureStore.setItemAsync(REMEMBER_ME_KEY, "true");
      } else {
        // Si no eligió recordar, solo guardamos la preferencia
        await SecureStore.setItemAsync(REMEMBER_ME_KEY, "false");
        // Limpiamos cualquier usuario previo
        await SecureStore.deleteItemAsync(USER_STORAGE_KEY);
      }
      await SecureStore.setItemAsync(SESSION_CHECK_KEY, "true");
    } catch (error) {
      console.error("Error almacenando usuario:", error);
      throw new Error("No se pudo guardar la sesión de forma segura");
    }
  };

  // Función segura para obtener el usuario
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
      const user = await getStoredUser();
      
      if (user) {
        console.log("Usuario encontrado en SecureStore (recordarme activado):", user);
        
        // Verificar que el usuario tenga la estructura correcta
        if (user.id && user.email && user.rol) {
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
          // Datos corruptos, limpiar almacenamiento
          await clearStorage();
          throw new Error("Datos de usuario corruptos");
        }
      } else {
        console.log("No hay sesión guardada o recordarme desactivado");
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

  const setUser = async (user: User, rememberMe: boolean = false): Promise<void> => {
    try {
      // Validar estructura del usuario antes de almacenar
      if (!user.id || !user.email || !user.rol) {
        throw new Error("Estructura de usuario inválida");
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
    } catch (error) {
      console.error("Error setting user:", error);
      throw error;
    }
  };

  const signOut = async (): Promise<void> => {
    try {
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
  };

  return {
    ...authState,
    signOut,
    setUser,
  };
};