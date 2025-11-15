import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../core/auth/AuthContext";
import { supabase } from "../../core/supabase/supabaseClient";
import { StatsCard } from "../../shared/components/StatsCard";
import NextSessionCard from "../../shared/components/NextSessionCard";
import { AttendanceCard } from "../../shared/components/AttendanceCard";
import { colors } from "../../shared/constants/theme";

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

interface NextSession {
  fecha_hora: string;
  tipo_evento: string;
  lugar: string;
  titulo?: string;
  esEvento?: boolean;
}

export default function AsistenciasScreen() {
  const { user } = useAuth();
  const [attendanceData, setAttendanceData] = useState<AttendanceItem[]>([]);
  const [nextSession, setNextSession] = useState<NextSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAllRecords, setShowAllRecords] = useState(false);

  const fetchNextSession = useCallback(async () => {
    try {
      const now = new Date().toISOString();

      const [entrenamientosData, eventosData] = await Promise.all([
        supabase
          .from("Entrenamiento")
          .select("fecha_hora, lugar, descripcion")
          .gt("fecha_hora", now)
          .order("fecha_hora", { ascending: true })
          .limit(1)
          .single(),
        supabase
          .from("Evento")
          .select("fecha_hora, tipo_evento, ubicacion, titulo")
          .gt("fecha_hora", now)
          .order("fecha_hora", { ascending: true })
          .limit(1)
          .single(),
      ]);

      const sessions = [];

      if (entrenamientosData.data) {
        sessions.push({
          fecha_hora: entrenamientosData.data.fecha_hora,
          tipo_evento: "Entrenamiento",
          lugar: entrenamientosData.data.lugar,
          titulo: entrenamientosData.data.descripcion,
          esEvento: false,
        });
      }

      if (eventosData.data) {
        sessions.push({
          fecha_hora: eventosData.data.fecha_hora,
          tipo_evento: eventosData.data.tipo_evento,
          lugar: eventosData.data.ubicacion,
          titulo: eventosData.data.titulo,
          esEvento: true,
        });
      }

      setNextSession(sessions.length > 0 ? sessions[0] : null);
    } catch (error) {
      console.error("Error en fetchNextSession:", error);
      setNextSession(null);
    }
  }, []);

  const fetchUserData = useCallback(async () => {
    try {
      if (!user?.id) {
        setAttendanceData([]);
        setNextSession(null);
        return;
      }

      const { data: asistenciaData, error } = await supabase
        .from("Asistencia")
        .select(
          `
          id_asistencia,
          estado_asistencia,
          fecha_asistencia,
          id_entrenamiento,
          id_evento,
          Entrenamiento(fecha_hora, lugar, descripcion),
          Evento(fecha_hora, ubicacion, tipo_evento, titulo)
        `
        )
        .eq("id_jugador", user.id)
        .order("fecha_asistencia", { ascending: false })
        .limit(20);

      if (error) {
        console.error("Error cargando asistencias:", error);
        setAttendanceData([]);
      } else {
        const transformedData: AttendanceItem[] = (asistenciaData || []).map(
          (item: any) => {
            if (item.id_entrenamiento && item.Entrenamiento) {
              return {
                id: item.id_asistencia,
                fecha_asistencia: item.fecha_asistencia,
                fecha_hora: item.Entrenamiento.fecha_hora,
                lugar: item.Entrenamiento.lugar,
                tipo_evento: "Entrenamiento",
                estado_asistencia: item.estado_asistencia,
                descripcion: item.Entrenamiento.descripcion,
                titulo: "Entrenamiento",
              };
            } else if (item.id_evento && item.Evento) {
              return {
                id: item.id_asistencia,
                fecha_asistencia: item.fecha_asistencia,
                fecha_hora: item.Evento.fecha_hora,
                lugar: item.Evento.ubicacion,
                tipo_evento: item.Evento.tipo_evento,
                estado_asistencia: item.estado_asistencia,
                descripcion: item.Evento.titulo,
                titulo: item.Evento.titulo,
              };
            } else {
              return {
                id: item.id_asistencia,
                fecha_asistencia: item.fecha_asistencia,
                estado_asistencia: item.estado_asistencia,
                tipo_evento: "Sin información",
                titulo: "Registro de asistencia",
              };
            }
          }
        );

        setAttendanceData(transformedData);
      }

      await fetchNextSession();
    } catch (error) {
      console.error("Error en fetchUserData:", error);
      setAttendanceData([]);
      setNextSession(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, fetchNextSession]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchUserData();
  }, [fetchUserData]);

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user, fetchUserData]);

  const relevantAttendanceData = attendanceData.filter(
    (item) => item.estado_asistencia !== "Sin registro"
  );

  const entrenamientos = relevantAttendanceData.filter(
    item => item.tipo_evento === "Entrenamiento"
  );
  const torneos = relevantAttendanceData.filter(
    item => item.tipo_evento === "Torneo"
  );
  const partidos = relevantAttendanceData.filter(
    item => item.tipo_evento === "Partido"
  );
  const otrosEventos = relevantAttendanceData.filter(
    item => !["Entrenamiento", "Torneo", "Partido"].includes(item.tipo_evento || "")
  );

  const totalSessions = relevantAttendanceData.length;
  const presentSessions = relevantAttendanceData.filter(
    (item) => item.estado_asistencia === "Presente" || item.estado_asistencia === "Justificado"
  ).length;
  const absentSessions = relevantAttendanceData.filter(
    (item) => item.estado_asistencia === "Ausente"
  ).length;
  const justifiedSessions = relevantAttendanceData.filter(
    (item) => item.estado_asistencia === "Justificado"
  ).length;

  const entrenamientosPresentes = entrenamientos.filter(
    item => item.estado_asistencia === "Presente" || item.estado_asistencia === "Justificado"
  ).length;
  const torneosPresentes = torneos.filter(
    item => item.estado_asistencia === "Presente" || item.estado_asistencia === "Justificado"
  ).length;
  const partidosPresentes = partidos.filter(
    item => item.estado_asistencia === "Presente" || item.estado_asistencia === "Justificado"
  ).length;

  const attendanceRate =
    totalSessions > 0 ? Math.round((presentSessions / totalSessions) * 100) : 0;

  const entrenamientosRate = entrenamientos.length > 0 ?
    Math.round((entrenamientosPresentes / entrenamientos.length) * 100) : 0;

  const torneosRate = torneos.length > 0 ?
    Math.round((torneosPresentes / torneos.length) * 100) : 0;

  const partidosRate = partidos.length > 0 ?
    Math.round((partidosPresentes / partidos.length) * 100) : 0;

  const displayedRecords = showAllRecords
    ? relevantAttendanceData
    : relevantAttendanceData.slice(0, 5);

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar backgroundColor={colors.primaryDark} barStyle="light-content" />
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.headerTextContainer}>
              <Text style={styles.welcome}>Mi Asistencia</Text>
              <Text style={styles.subtitle}>Cargando tu información...</Text>
            </View>
          </View>
        </View>
        <View style={styles.loadingContent}>
          <Ionicons name="basketball" size={60} color={colors.primary} />
          <Text style={styles.loadingText}>Cargando asistencia...</Text>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={colors.primaryDark} barStyle="light-content" />
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerTextContainer}>
            <Text style={styles.welcome}>Mi Asistencia</Text>
            <Text style={styles.subtitle}>
              Hola {user?.nombre}, tu rendimiento en detalle
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        <View style={styles.section}>
          <View style={styles.statsGrid}>
            <StatsCard
              icon="checkmark-circle"
              value={presentSessions.toString()}
              label="Presente"
              color={colors.success}
            />
            <StatsCard
              icon="close-circle"
              value={absentSessions.toString()}
              label="Ausente"
              color={colors.error}
            />
            <StatsCard
              icon="time"
              value={justifiedSessions.toString()}
              label="Justificado"
              color={colors.warning}
            />
            <StatsCard
              icon="bar-chart"
              value={totalSessions.toString()}
              label="Total"
              color={colors.primary}
            />
          </View>

          <View style={styles.attendanceRate}>
            <View style={styles.rateHeader}>
              <Text style={styles.rateTitle}>Tu Asistencia General</Text>
              <Text style={styles.ratePercentage}>{attendanceRate}%</Text>
            </View>
            <View style={styles.rateBar}>
              <View
                style={[
                  styles.rateFill,
                  {
                    width: `${attendanceRate}%`,
                    backgroundColor:
                      attendanceRate >= 80
                        ? colors.success
                        : attendanceRate >= 60
                        ? colors.warning
                        : colors.error,
                  },
                ]}
              />
            </View>
          </View>

          <View style={styles.typeStats}>
            <Text style={styles.typeStatsTitle}>Asistencia por Tipo</Text>
            <View style={styles.typeStatsGrid}>
              <View style={styles.typeStat}>
                <View style={styles.typeStatHeader}>
                  <Ionicons name="basketball" size={16} color={colors.primary} />
                  <Text style={styles.typeStatLabel}>Entrenamientos</Text>
                </View>
                <Text style={styles.typeStatValue}>{entrenamientosRate}%</Text>
                <Text style={styles.typeStatCount}>({entrenamientosPresentes}/{entrenamientos.length})</Text>
              </View>

              <View style={styles.typeStat}>
                <View style={styles.typeStatHeader}>
                  <Ionicons name="trophy" size={16} color={colors.warning} />
                  <Text style={styles.typeStatLabel}>Torneos</Text>
                </View>
                <Text style={styles.typeStatValue}>{torneosRate}%</Text>
                <Text style={styles.typeStatCount}>({torneosPresentes}/{torneos.length})</Text>
              </View>

              <View style={styles.typeStat}>
                <View style={styles.typeStatHeader}>
                  <Ionicons name="flag" size={16} color={colors.error} />
                  <Text style={styles.typeStatLabel}>Partidos</Text>
                </View>
                <Text style={styles.typeStatValue}>{partidosRate}%</Text>
                <Text style={styles.typeStatCount}>({partidosPresentes}/{partidos.length})</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="calendar" size={20} color={colors.primary} />
            <Text style={styles.sectionTitle}>Próxima Sesión</Text>
          </View>
          <NextSessionCard nextSession={nextSession} />
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="list" size={20} color="#1F2937" />
              <Text style={styles.sectionTitle}>Historial de Asistencia</Text>
            </View>
            {relevantAttendanceData.length > 0 && (
              <TouchableOpacity
                style={styles.viewToggle}
                onPress={() => setShowAllRecords(!showAllRecords)}
              >
                <Text style={styles.viewToggleText}>
                  {showAllRecords
                    ? "Ver menos"
                    : `Ver todo (${relevantAttendanceData.length})`}
                </Text>
                <Ionicons
                  name={showAllRecords ? "chevron-up" : "chevron-down"}
                  size={16}
                  color="#2563EB"
                />
              </TouchableOpacity>
            )}
          </View>

          {relevantAttendanceData.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={48} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>Sin registros aún</Text>
              <Text style={styles.emptySubtitle}>
                No tienes registros de asistencia todavía
              </Text>
            </View>
          ) : (
            <View style={styles.historyList}>
              {displayedRecords.map((item) => (
                <AttendanceCard key={item.id} item={item} />
              ))}
            </View>
          )}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.primaryDark,
    paddingHorizontal: 20,
    paddingTop: 25,
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  headerTextContainer: {
    flex: 1,
  },
  welcome: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    fontWeight: "500",
  },
  scrollContent: {
    flex: 1,
  },
  loadingContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#6B7280",
    fontWeight: "500",
    textAlign: "center",
  },
  section: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  attendanceRate: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    marginBottom: 16,
  },
  rateHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  rateTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
  },
  ratePercentage: {
    fontSize: 20,
    fontWeight: "800",
    color: "#2563EB",
  },
  rateBar: {
    height: 8,
    backgroundColor: "#F3F4F6",
    borderRadius: 4,
    overflow: "hidden",
  },
  rateFill: {
    height: "100%",
    borderRadius: 4,
  },
  typeStats: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  typeStatsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 12,
  },
  typeStatsGrid: {
    gap: 12,
  },
  typeStat: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  typeStatHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  typeStatLabel: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },
  typeStatValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
    minWidth: 50,
    textAlign: "right",
  },
  typeStatCount: {
    fontSize: 12,
    color: "#9CA3AF",
    minWidth: 80,
    textAlign: "right",
  },
  historyList: {
    gap: 12,
  },
  emptyState: {
    backgroundColor: "#FFFFFF",
    padding: 40,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  emptyTitle: {
    fontSize: 18,
    color: "#374151",
    fontWeight: "600",
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 8,
    textAlign: "center",
    lineHeight: 20,
  },
  viewToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  viewToggleText: {
    fontSize: 14,
    color: "#2563EB",
    fontWeight: "600",
  },
  bottomSpacer: {
    height: 20,
  },
});
