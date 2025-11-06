import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getRolColor, getRolIcon, colors } from "../constants/theme";

interface RoleBadgeProps {
  rol: string;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
}

//Componente badge para mostrar roles de usuario

export default function RoleBadge({ 
  rol, 
  size = "md",
  showIcon = true 
}: RoleBadgeProps) {
  const rolColor = getRolColor(rol);
  const rolIcon = getRolIcon(rol);

  const sizeStyles = {
    sm: { paddingH: 8, paddingV: 4, fontSize: 10, iconSize: 10 },
    md: { paddingH: 10, paddingV: 6, fontSize: 11, iconSize: 12 },
    lg: { paddingH: 12, paddingV: 8, fontSize: 12, iconSize: 14 },
  };

  const currentSize = sizeStyles[size];

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: rolColor,
          paddingHorizontal: currentSize.paddingH,
          paddingVertical: currentSize.paddingV,
        },
      ]}
    >
      {showIcon && (
        <Ionicons
          name={rolIcon as any}
          size={currentSize.iconSize}
          color={colors.text.inverse}
        />
      )}
      <Text
        style={[
          styles.text,
          {
            fontSize: currentSize.fontSize,
          },
        ]}
      >
        {rol}
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
    alignSelf: "flex-start",
  },
  text: {
    color: colors.text.inverse,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});

