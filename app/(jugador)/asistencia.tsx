import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../types/use.auth";
import { supabase } from "../../supabase/supabaseClient";
import { StatsCard } from "../../components/StatsCard";
import { formatDate } from "../../utils/dateHelpers";
import { colors } from "../../constants/theme";

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


const NextSessionCard = React.memo(
  ({ nextSession }: { nextSession: NextSession | null }) => {
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
);

const AttendanceCard = React.memo(({ item }: { item: AttendanceItem }) => {
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
});

export default function MiAsistenciaScreen() {
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
    (item) => item.estado_asistencia === "Presente"
  ).length;
  const absentSessions = relevantAttendanceData.filter(
    (item) => item.estado_asistencia === "Ausente"
  ).length;
  const justifiedSessions = relevantAttendanceData.filter(
    (item) => item.estado_asistencia === "Justificado"
  ).length;

  const entrenamientosPresentes = entrenamientos.filter(
    item => item.estado_asistencia === "Presente"
  ).length;
  const torneosPresentes = torneos.filter(
    item => item.estado_asistencia === "Presente"
  ).length;
  const partidosPresentes = partidos.filter(
    item => item.estado_asistencia === "Presente"
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
  statsCard: {
    width: "48%",
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: "center",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  statsIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  statsValue: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1F2937",
    marginBottom: 4,
  },
  statsLabel: {
    fontSize: 11,
    color: "#6B7280",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    textAlign: "center",
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
  historyList: {
    gap: 12,
  },
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