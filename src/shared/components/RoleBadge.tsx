import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, getRolColor, getRolIcon } from "../constants/theme";

interface RoleBadgeProps {
  rol: string;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
}

//Componente para mostrar el rol del usuario con icono y color

export default function RoleBadge({
  rol,
  size = "md",
  showIcon = true
}: RoleBadgeProps) {
  const rolColor = getRolColor(rol);
  const rolIcon = getRolIcon(rol);
  const displayRole = rol.charAt(0).toUpperCase() + rol.slice(1);

  const sizeStyles = {
    sm: {
      container: styles.containerSm,
      text: styles.textSm,
      icon: 12,
    },
    md: {
      container: styles.containerMd,
      text: styles.textMd,
      icon: 14,
    },
    lg: {
      container: styles.containerLg,
      text: styles.textLg,
      icon: 16,
    },
  };

  const currentSize = sizeStyles[size];

  return (
    <View style={[currentSize.container, { backgroundColor: rolColor }]}>
      {showIcon && (
        <Ionicons
          name={rolIcon as any}
          size={currentSize.icon}
          color="#FFFFFF"
          style={styles.icon}
        />
      )}
      <Text style={currentSize.text}>{displayRole}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  containerSm: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    alignSelf: "flex-start",
    gap: 4,
  },
  containerMd: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
    gap: 5,
  },
  containerLg: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    alignSelf: "flex-start",
    gap: 6,
  },
  textSm: {
    fontSize: 10,
    color: "#FFFFFF",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  textMd: {
    fontSize: 11,
    color: "#FFFFFF",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  textLg: {
    fontSize: 12,
    color: "#FFFFFF",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  icon: {
    marginTop: 1,
  },
});
