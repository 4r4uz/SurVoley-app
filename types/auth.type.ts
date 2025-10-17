export interface User {
  id: string;
  email: string;
  rol: string;
  nombre: string;
  apellido: string;
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export type UseAuthReturn = AuthState & { 
  signOut: () => Promise<void>;
  setUser?: (user: User) => Promise<void>;
};