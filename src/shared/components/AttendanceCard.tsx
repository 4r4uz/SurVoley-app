import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, commonStyles, spacing } from "../constants/theme";

interface AttendanceItem {
  id: string;
  fecha_hora?: string;
  fecha_asistencia?: string;
  lugar?: string;
  ubicacion?: string;
  tipo_evento?: string;
  estado_asistencia: "Presente" | "Ausente" | "Justificado" | "Sin registro";
  descripcion?: string;
  titulo?: string;
  jugador?: {
    nombre: string;
    apellido: string;
  };
}

interface AttendanceCardProps {
  item: AttendanceItem;
}

//Componente para mostrar un registro individual de asistencia

export const AttendanceCard = React.memo(({ item }: AttendanceCardProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Presente":
        return colors.success;
      case "Ausente":
        return colors.error;
      case "Justificado":
        return colors.warning;
      default:
        return colors.text.tertiary;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Presente":
        return "checkmark-circle";
      case "Ausente":
        return "close-circle";
      case "Justificado":
        return "time";
      default:
        return "help-circle";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.statusContainer}>
          <View
            style={[
              styles.statusIcon,
              { backgroundColor: getStatusColor(item.estado_asistencia) + "20" }
            ]}
          >
            <Ionicons
              name={getStatusIcon(item.estado_asistencia) as any}
              size={16}
              color={getStatusColor(item.estado_asistencia)}
            />
          </View>
          <Text
            style={[
              styles.statusText,
              { color: getStatusColor(item.estado_asistencia) }
            ]}
          >
            {item.estado_asistencia}
          </Text>
        </View>
        <Text style={styles.date}>
          {item.fecha_asistencia ? formatDate(item.fecha_asistencia) : 'Sin fecha'}
        </Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>
          {item.titulo || item.tipo_evento || 'Actividad'}
        </Text>

        {item.descripcion && (
          <Text style={styles.description} numberOfLines={2}>
            {item.descripcion}
          </Text>
        )}

        <View style={styles.details}>
          {item.lugar && (
            <View style={styles.detailItem}>
              <Ionicons name="location" size={14} color={colors.text.secondary} />
              <Text style={styles.detailText}>{item.lugar}</Text>
            </View>
          )}

          {item.fecha_hora && (
            <View style={styles.detailItem}>
              <Ionicons name="time" size={14} color={colors.text.secondary} />
              <Text style={styles.detailText}>{formatTime(item.fecha_hora)}</Text>
            </View>
          )}

          {item.jugador && (
            <View style={styles.detailItem}>
              <Ionicons name="person" size={14} color={colors.text.secondary} />
              <Text style={styles.detailText}>
                {item.jugador.nombre} {item.jugador.apellido}
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
});

AttendanceCard.displayName = "AttendanceCard";

const styles = StyleSheet.create({
  card: {
    ...commonStyles.card,
    marginBottom: spacing.sm,
  },
  header: {
    ...commonStyles.cardHeader,
    justifyContent: "space-between",
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  statusIcon: {
    ...commonStyles.smallIconContainer,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  date: {
    fontSize: 12,
    color: colors.text.secondary,
    fontWeight: "500",
  },
  content: {
    ...commonStyles.cardContent,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text.primary,
    lineHeight: 20,
  },
  description: {
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 18,
  },
  details: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  detailItem: {
    ...commonStyles.detailItem,
  },
  detailText: {
    fontSize: 12,
    color: colors.text.secondary,
    fontWeight: "500",
  },
});
