export type UserRole = "admin" | "jugador" | "apoderado" | "entrenador";

export const USER_ROLES = {
  ADMIN: "admin" as const,
  JUGADOR: "jugador" as const,
  APODERADO: "apoderado" as const,
  ENTRENADOR: "entrenador" as const,
} as const;

export const ROLE_ROUTE_MAP: Record<UserRole, string> = {
  admin: "/(admin)",
  jugador: "/(jugador)",
  apoderado: "/(apoderado)",
  entrenador: "/(entrenador)",
};

export interface User {
  id: string;
  email: string;
  rol: UserRole;
  nombre: string;
  apellido?: string;
  telefono?: string;
  fecha_nacimiento?: string;
  direccion?: string;
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface UserValidation {
  isValid: boolean;
  errors: string[];
}

export interface UseAuthReturn extends AuthState {
  signIn?: (credentials: LoginCredentials) => Promise<void>;
  signOut: () => Promise<void>;
  setUser: (user: User, rememberMe?: boolean) => Promise<void>;
  updateUser: (user: Partial<User>) => Promise<void>;
}

// validar usuario
export function validateUser(user: unknown): user is User {
  if (!user || typeof user !== "object") return false;

  const u = user as Partial<User>;

  return !!(
    u.id &&
    typeof u.id === "string" &&
    u.email &&
    typeof u.email === "string" &&
    u.rol &&
    typeof u.rol === "string" &&
    Object.values(USER_ROLES).includes(u.rol as UserRole)
  );
}

export function getUserFullName(user: User | null): string {
  if (!user) return "";
  const name = user.nombre || "";
  const lastName = user.apellido || "";
  return lastName ? `${name} ${lastName}` : name;
}

export function getUserInitials(user: User | null): string {
  if (!user) return "";
  const firstInitial = user.nombre?.charAt(0)?.toUpperCase() || "";
  const lastInitial = user.apellido?.charAt(0)?.toUpperCase() || "";
  return firstInitial + lastInitial;
}
