import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, commonStyles, spacing } from "../constants/theme";

interface NextSession {
  fecha_hora: string;
  tipo_evento: string;
  lugar: string;
  titulo?: string;
  esEvento?: boolean;
}

interface NextSessionCardProps {
  nextSession: NextSession | null;
}

//Componente para mostrar la próxima sesión de entrenamiento/evento

export default function NextSessionCard({ nextSession }: NextSessionCardProps) {
  if (!nextSession) {
    return (
      <View style={styles.emptyCard}>
        <Ionicons name="calendar-outline" size={32} color={colors.text.tertiary} />
        <Text style={styles.emptyText}>No hay sesiones programadas</Text>
      </View>
    );
  }

  const sessionDate = new Date(nextSession.fecha_hora);
  const now = new Date();
  const timeDiff = sessionDate.getTime() - now.getTime();
  const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

  const getTimeUntil = () => {
    if (daysDiff === 0) return "Hoy";
    if (daysDiff === 1) return "Mañana";
    if (daysDiff < 7) return `En ${daysDiff} días`;
    return sessionDate.toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });
  };

  const getTimeString = () => {
    return sessionDate.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Ionicons
            name={nextSession.esEvento ? "trophy" : "basketball"}
            size={20}
            color={colors.text.inverse}
          />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.sessionType}>{nextSession.tipo_evento}</Text>
          <Text style={styles.timeUntil}>{getTimeUntil()}</Text>
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>
          {nextSession.titulo || nextSession.tipo_evento}
        </Text>
        <View style={styles.details}>
          <View style={styles.detailItem}>
            <Ionicons name="location" size={16} color={colors.text.secondary} />
            <Text style={styles.detailText}>{nextSession.lugar}</Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="time" size={16} color={colors.text.secondary} />
            <Text style={styles.detailText}>{getTimeString()}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    ...commonStyles.elevatedCard,
  },
  header: {
    ...commonStyles.cardHeader,
  },
  iconContainer: {
    ...commonStyles.iconContainer,
    backgroundColor: colors.primary,
    marginRight: spacing.md,
  },
  headerText: {
    flex: 1,
  },
  sessionType: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text.primary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  timeUntil: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: "500",
  },
  content: {
    ...commonStyles.cardContent,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text.primary,
    lineHeight: 24,
  },
  details: {
    gap: spacing.sm,
  },
  detailItem: {
    ...commonStyles.detailItem,
    gap: spacing.sm,
  },
  detailText: {
    fontSize: 14,
    color: colors.text.secondary,
    fontWeight: "500",
  },
  emptyCard: {
    ...commonStyles.emptyContainer,
    borderRadius: 16,
    padding: spacing.xxxl,
  },
  emptyText: {
    fontSize: 14,
    color: colors.text.tertiary,
    fontWeight: "500",
    marginTop: spacing.sm,
    textAlign: "center",
  },
});
