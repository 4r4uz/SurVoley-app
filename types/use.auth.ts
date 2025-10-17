import { useState, useEffect, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "../supabase/supabaseClient";
import { User, UseAuthReturn } from "../types/auth.type";

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

  const checkSession = async (): Promise<void> => {
    if (globalSessionChecked) {
      if (isMounted.current) {
        setAuthState(prev => ({ ...prev, loading: false }));
      }
      return;
    }

    try {
      const userJson = await AsyncStorage.getItem("currentUser");

      if (userJson) {
        const user = JSON.parse(userJson);
        console.log("Usuario encontrado en AsyncStorage:", user);
        
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
      globalSessionChecked = true;
      if (isMounted.current) {
        setAuthState(prev => ({ ...prev, loading: false }));
      }
    }
  };

  const setUser = async (user: User): Promise<void> => {
    try {
      await AsyncStorage.setItem("currentUser", JSON.stringify(user));
      
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
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      await AsyncStorage.removeItem("currentUser");

      cachedUser = null;
      globalSessionChecked = true;

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