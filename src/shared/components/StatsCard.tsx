import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { commonStyles, colors, typography } from "../constants/theme";

interface StatsCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  value: string | number;
  label: string;
  color: string;
}

//Componente reutilizable para mostrar estadísticas con icono

export const StatsCard = React.memo(({ icon, value, label, color }: StatsCardProps) => {
  return (
    <View style={styles.statsCard}>
      <View style={[styles.statsIcon, { backgroundColor: color + "15" }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={styles.statsValue}>{value}</Text>
      <Text style={styles.statsLabel}>{label}</Text>
    </View>
  );
});

StatsCard.displayName = "StatsCard";

const styles = StyleSheet.create({
  statsCard: {
    ...commonStyles.whiteCard,
    alignItems: "center",
  },
  statsIcon: {
    ...commonStyles.iconContainer,
    marginBottom: 8,
  },
  statsValue: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.text.primary,
    marginBottom: 4,
  },
  statsLabel: {
    fontSize: 11,
    color: colors.text.secondary,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    textAlign: "center",
  },
});
