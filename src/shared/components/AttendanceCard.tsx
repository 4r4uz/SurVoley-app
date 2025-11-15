import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../constants/theme";

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
}

interface AttendanceCardProps {
  item: AttendanceItem;
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return {
    day: date.getDate().toString(),
    month: date.toLocaleDateString("es-ES", { month: "short" }),
    weekday: date.toLocaleDateString("es-ES", { weekday: "short" }),
    time: date.toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    }),
  };
};

export default function AttendanceCard({ item }: AttendanceCardProps) {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case "Presente":
        return {
          icon: "checkmark-circle",
          color: colors.success,
          bg: "#F0FDF4",
          borderColor: colors.success,
          badgeText: "PRESENTE",
        };
      case "Ausente":
        return {
          icon: "close-circle",
          color: colors.error,
          bg: "#FEF2F2",
          borderColor: colors.error,
          badgeText: "AUSENTE",
        };
      case "Justificado":
        return {
          icon: "time",
          color: colors.warning,
          bg: "#FFFBEB",
          borderColor: colors.warning,
          badgeText: "JUSTIFICADO",
        };
      default:
        return {
          icon: "help-circle",
          color: "#6B7280",
          bg: "#F9FAFB",
          borderColor: "#6B7280",
          badgeText: "SIN REGISTRO",
        };
    }
  };

  const statusConfig = getStatusConfig(item.estado_asistencia);

  const dateInfo = item.fecha_asistencia
    ? formatDate(item.fecha_asistencia)
    : item.fecha_hora
    ? formatDate(item.fecha_hora)
    : {
        day: 0,
        month: "???",
        weekday: "---",
        time: "--:--",
      };

  return (
    <View
      style={[
        styles.attendanceCard,
        {
          backgroundColor: statusConfig.bg,
          borderColor: statusConfig.borderColor,
        },
      ]}
    >
      <View style={styles.cardHeader}>
        <View style={styles.dateSection}>
          <Text style={styles.dateDay}>{dateInfo.day}</Text>
          <Text style={styles.dateMonth}>{dateInfo.month}</Text>
          <Text style={styles.dateWeekday}>{dateInfo.weekday}</Text>
        </View>

        <View style={styles.cardContent}>
          <Text style={styles.sessionName}>
            {item.titulo || item.descripcion || item.tipo_evento || "Sesión de entrenamiento"}
          </Text>

          <View style={styles.sessionMeta}>
            <View style={styles.metaItem}>
              <Ionicons name="time" size={14} color="#6B7280" />
              <Text style={styles.metaText}>{dateInfo.time}</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="location" size={14} color="#6B7280" />
              <Text style={styles.metaText}>
                {item.lugar || item.ubicacion || "Lugar no especificado"}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons
                name={item.tipo_evento === "Entrenamiento" ? "basketball" : "trophy"}
                size={14}
                color="#6B7280"
              />
              <Text style={styles.metaText}>
                {item.tipo_evento || "Actividad"}
              </Text>
            </View>
          </View>
        </View>

        <View
          style={[styles.statusBadge, { backgroundColor: statusConfig.color }]}
        >
          <Ionicons name={statusConfig.icon as any} size={14} color="#FFFFFF" />
          <Text style={styles.statusBadgeText}>{statusConfig.badgeText}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  attendanceCard: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  dateSection: {
    alignItems: "center",
    marginRight: 16,
    minWidth: 50,
  },
  dateDay: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1F2937",
  },
  dateMonth: {
    fontSize: 11,
    color: "#6B7280",
    fontWeight: "700",
    textTransform: "uppercase",
    marginTop: 2,
  },
  dateWeekday: {
    fontSize: 10,
    color: "#9CA3AF",
    marginTop: 2,
  },
  cardContent: {
    flex: 1,
  },
  sessionName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 8,
  },
  sessionMeta: {
    gap: 6,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metaText: {
    fontSize: 13,
    color: "#6B7280",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  statusBadgeText: {
    fontSize: 10,
    color: "#FFFFFF",
    fontWeight: "700",
    textTransform: "uppercase",
  },
});
