import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../constants/theme";

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

export default function NextSessionCard({ nextSession }: NextSessionCardProps) {
  if (!nextSession) {
    return (
      <View style={[styles.nextSessionCard, styles.nextSessionEmpty]}>
        <View style={styles.nextSessionContent}>
          <View style={[styles.sessionIcon, { backgroundColor: "#F3F4F6" }]}>
            <Ionicons name="calendar-outline" size={24} color="#6B7280" />
          </View>
          <View style={styles.sessionInfo}>
            <Text style={styles.sessionTitle}>Próxima Sesión</Text>
            <Text style={styles.noSessionText}>
              No hay sesiones programadas
            </Text>
          </View>
        </View>
      </View>
    );
  }

  const dateInfo = formatDate(nextSession.fecha_hora);

  return (
    <View style={styles.nextSessionCard}>
      <View style={styles.nextSessionContent}>
        <View style={styles.sessionDate}>
          <Text style={styles.sessionDay}>{dateInfo.day}</Text>
          <Text style={styles.sessionMonth}>{dateInfo.month}</Text>
          <Text style={styles.sessionWeekday}>{dateInfo.weekday}</Text>
        </View>

        <View style={styles.sessionInfo}>
          <Text style={styles.sessionTitle}>
            {nextSession.titulo || nextSession.tipo_evento || "Sesión"}
          </Text>

          <View style={styles.sessionDetails}>
            <View style={styles.detailItem}>
              <Ionicons name="time" size={14} color="#6B7280" />
              <Text style={styles.detailText}>{dateInfo.time}</Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="location" size={14} color="#6B7280" />
              <Text style={styles.detailText}>
                {nextSession.lugar || "Por confirmar"}
              </Text>
            </View>
          </View>
        </View>

        <View style={[styles.sessionType, { backgroundColor: colors.primary }]}>
          <Ionicons
            name={nextSession.esEvento ? "trophy" : "basketball"}
            size={18}
            color="#FFFFFF"
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  nextSessionCard: {
    backgroundColor: "#EFF6FF",
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: "#3B82F6",
  },
  nextSessionEmpty: {
    backgroundColor: "#F9FAFB",
    borderColor: "#D1D5DB",
  },
  nextSessionContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  sessionDate: {
    alignItems: "center",
    marginRight: 16,
    minWidth: 50,
  },
  sessionDay: {
    fontSize: 24,
    fontWeight: "800",
    color: "#2563EB",
  },
  sessionMonth: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "600",
    textTransform: "uppercase",
    marginTop: 2,
  },
  sessionWeekday: {
    fontSize: 11,
    color: "#9CA3AF",
    marginTop: 2,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 8,
  },
  noSessionText: {
    fontSize: 14,
    color: "#6B7280",
  },
  sessionDetails: {
    gap: 6,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  detailText: {
    fontSize: 14,
    color: "#6B7280",
  },
  sessionType: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  sessionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
});
