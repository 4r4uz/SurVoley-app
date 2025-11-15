import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, getRolColor, getRolIcon, typography } from "../constants/theme";

interface RoleBadgeProps {
  rol: string;
  size?: "sm" | "md" | "lg";
}

export default function RoleBadge({ rol, size = "md" }: RoleBadgeProps) {
  const rolColor = getRolColor(rol);
  const rolIcon = getRolIcon(rol);

  const getRoleDisplayName = (rol: string): string => {
    const roles: { [key: string]: string } = {
      admin: "Administrador",
      jugador: "Jugador",
      entrenador: "Entrenador",
      apoderado: "Apoderado",
    };
    return roles[rol] || "Usuario";
  };

  const getSizeStyles = () => {
    switch (size) {
      case "sm":
        return {
          paddingHorizontal: 2,
          paddingVertical: 2,
          iconSize: 10,
          fontSize: 9,
          gap: 2,
        };
      case "lg":
        return {
          paddingHorizontal: 4,
          paddingVertical: 4,
          iconSize: 16,
          fontSize: 14,
          gap: 6,
        };
      default: // md
        return {
          paddingHorizontal: 6,
          paddingVertical: 3,
          iconSize: 12,
          fontSize: 11,
          gap: 3,
        };
    }
  };

  const sizeStyles = getSizeStyles();

  return (
    <View style={[styles.badge, { backgroundColor: rolColor, gap: sizeStyles.gap }]}>
      <Ionicons
        name={rolIcon as any}
        size={sizeStyles.iconSize}
        color="#FFFFFF"
      />
      <Text style={[styles.text, { fontSize: sizeStyles.fontSize }]}>
        {getRoleDisplayName(rol)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    gap: 4,
  },
  text: {
    color: "#FFFFFF",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});
