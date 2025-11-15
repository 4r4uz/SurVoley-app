import { Redirect } from "expo-router";
import { useAuth } from "../../core/auth/AuthContext";
import { ROLE_ROUTE_MAP } from "../../core/auth/types";
import LoginScreen from "./login";

export default function AuthLayout() {
  const { isAuthenticated, user } = useAuth();

  if (isAuthenticated && user?.rol) {
    return (
      <Redirect
        href={ROLE_ROUTE_MAP[user.rol] || ROLE_ROUTE_MAP.jugador}
      />
    );
  }

  return <LoginScreen />;
}
