import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Animated,
  Dimensions,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../types/use.auth";
import { supabase } from "../../supabase/supabaseClient";

const { width } = Dimensions.get("window");

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

const AttendanceProgress = ({ percentage }: { percentage: number }) => {
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(progressAnim, {
      toValue: percentage,
      useNativeDriver: false,
      tension: 50,
      friction: 7,
    }).start();
  }, [percentage]);

  const widthInterpolated = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ["0%", "100%"],
  });

  const getProgressColor = (percent: number) => {
    if (percent >= 80) return "#2ecc71";
    if (percent >= 60) return "#f39c12";
    return "#e74c3c";
  };

  return (
    <View style={styles.progressContainer}>
      <View style={styles.progressHeader}>
        <Text style={styles.progressLabel}>Tu progreso de asistencia</Text>
        <Text style={styles.progressPercentage}>{percentage}%</Text>
      </View>
      <View style={styles.progressBar}>
        <Animated.View
          style={[
            styles.progressFill,
            {
              width: widthInterpolated,
              backgroundColor: getProgressColor(percentage),
            },
          ]}
        />
      </View>
      <View style={styles.progressLegend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: "#e74c3c" }]} />
          <Text style={styles.legendText}>Baja</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: "#f39c12" }]} />
          <Text style={styles.legendText}>Media</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: "#2ecc71" }]} />
          <Text style={styles.legendText}>Alta</Text>
        </View>
      </View>
    </View>
  );
};

const AttendanceCard = ({ item }: { item: AttendanceItem }) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Presente":
        return { icon: "checkmark-circle", color: "#2ecc71" };
      case "Ausente":
        return { icon: "close-circle", color: "#e74c3c" };
      case "Justificado":
        return { icon: "time", color: "#f39c12" };
      case "Sin registro":
        return { icon: "help-circle", color: "#95a5a6" };
      default:
        return { icon: "help-circle", color: "#95a5a6" };
    }
  };

  const statusInfo = getStatusIcon(item.estado_asistencia);

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("es-ES", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return "Fecha no disponible";
    }
  };

  const formatTime = (dateTimeString: string) => {
    try {
      const date = new Date(dateTimeString);
      return date.toLocaleTimeString("es-ES", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Horario no especificado";
    }
  };

  return (
    <View style={styles.attendanceCard}>
      <View style={styles.cardHeader}>
        <View style={styles.dateContainer}>
          <Ionicons name="calendar" size={16} color="#3f3db8ff" />
          <Text style={styles.dateText}>
            {item.fecha_asistencia
              ? formatDate(item.fecha_asistencia)
              : item.fecha_hora
              ? formatDate(item.fecha_hora)
              : "Fecha no disponible"}
          </Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: `${statusInfo.color}20` },
          ]}
        >
          <Ionicons
            name={statusInfo.icon as any}
            size={14}
            color={statusInfo.color}
          />
          <Text style={[styles.statusText, { color: statusInfo.color }]}>
            {item.estado_asistencia}
          </Text>
        </View>
      </View>

      <View style={styles.cardContent}>
        <View style={styles.sessionInfo}>
          <Ionicons name="basketball" size={14} color="#666" />
          <Text style={styles.sessionText}>
            {item.titulo || item.tipo_evento || "Sesión"}
          </Text>
        </View>
        <View style={styles.sessionInfo}>
          <Ionicons name="time" size={14} color="#666" />
          <Text style={styles.sessionText}>
            {item.fecha_hora
              ? formatTime(item.fecha_hora)
              : "Horario no especificado"}
          </Text>
        </View>
        <View style={styles.sessionInfo}>
          <Ionicons name="location" size={14} color="#666" />
          <Text style={styles.sessionText}>
            {item.lugar || item.ubicacion || "Lugar no especificado"}
          </Text>
        </View>
      </View>

      {item.descripcion && (
        <View style={styles.notesContainer}>
          <Text style={styles.notesText}>{item.descripcion}</Text>
        </View>
      )}
    </View>
  );
};

const StatsCard = ({ icon, value, label, color }: any) => (
  <View style={styles.statsCard}>
    <View style={[styles.statsIcon, { backgroundColor: color }]}>
      <Ionicons name={icon} size={20} color="#fff" />
    </View>
    <Text style={styles.statsValue}>{value}</Text>
    <Text style={styles.statsLabel}>{label}</Text>
  </View>
);

const NextSessionCard = ({
  nextSession,
}: {
  nextSession: NextSession | null;
}) => {
  if (!nextSession) {
    return (
      <View style={styles.nextSession}>
        <View style={styles.nextSessionHeader}>
          <Ionicons name="notifications" size={20} color="#95a5a6" />
          <Text style={styles.nextSessionTitle}>Próxima Sesión</Text>
        </View>
        <View style={styles.nextSessionContent}>
          <Text style={styles.noSessionText}>No hay sesiones programadas</Text>
        </View>
      </View>
    );
  }

  const formatNextSessionDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("es-ES", {
        weekday: "short",
        day: "numeric",
        month: "short",
      });
    } catch {
      return "Fecha no disponible";
    }
  };

  const formatNextSessionTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString("es-ES", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Horario no especificado";
    }
  };

  const getSessionIcon = () => {
    if (
      nextSession.tipo_evento === "Partido" ||
      nextSession.tipo_evento === "Torneo"
    ) {
      return "trophy";
    }
    return "basketball";
  };

  const getSessionTypeText = () => {
    if (nextSession.titulo) {
      return nextSession.titulo;
    }
    return nextSession.tipo_evento || "Sesión";
  };

  return (
    <View style={styles.nextSession}>
      <View style={styles.nextSessionHeader}>
        <Ionicons name="notifications" size={20} color="#3f3db8ff" />
        <Text style={styles.nextSessionTitle}>
          {nextSession.esEvento ? "Próximo Evento" : "Próxima Sesión"}
        </Text>
      </View>
      <View style={styles.nextSessionContent}>
        <View style={styles.sessionTypeRow}>
          <Ionicons name={getSessionIcon()} size={16} color="#3f3db8ff" />
          <Text style={styles.nextSessionType}>{getSessionTypeText()}</Text>
        </View>
        <Text style={styles.nextSessionDate}>
          {formatNextSessionDate(nextSession.fecha_hora)} •{" "}
          {formatNextSessionTime(nextSession.fecha_hora)}
        </Text>
        <Text style={styles.nextSessionLocation}>{nextSession.lugar}</Text>
      </View>
    </View>
  );
};

export default function MiAsistenciaScreen() {
  const { user } = useAuth();
  const [attendanceData, setAttendanceData] = useState<AttendanceItem[]>([]);
  const [nextSession, setNextSession] = useState<NextSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  const fetchUserData = async () => {
    try {
      setError(null);

      const { data: jugadorData, error: jugadorError } = await supabase
        .from("Jugador")
        .select("id_jugador")
        .eq("id_jugador", user?.id)
        .single();

      if (jugadorError || !jugadorData) {
        setAttendanceData([]);
        await fetchNextSession();
        return;
      }

      const idJugador = jugadorData.id_jugador;

      const { data: asistenciaData, error: asistenciaError } = await supabase
        .from("Asistencia")
        .select(
          `
          *,
          Entrenamiento (*)
        `
        )
        .eq("id_jugador", idJugador)
        .order("fecha_asistencia", { ascending: false });

      if (asistenciaError) {
        setAttendanceData([]);
      } else {
        const transformedData: AttendanceItem[] = (asistenciaData || []).map(
          (item: any) => ({
            id: item.id_asistencia,
            fecha_asistencia: item.fecha_asistencia,
            fecha_hora: item.Entrenamiento?.fecha_hora,
            lugar: item.Entrenamiento?.lugar,
            tipo_evento: "Entrenamiento",
            estado_asistencia: item.estado_asistencia,
            descripcion: item.Entrenamiento?.descripcion,
          })
        );
        setAttendanceData(transformedData);
      }

      await fetchNextSession();
    } catch (error) {
      setError("Error al cargar los datos");
      setAttendanceData([]);
      setNextSession(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchNextSession = async () => {
    try {
      const now = new Date().toISOString();

      const { data: entrenamientosData } = await supabase
        .from("Entrenamiento")
        .select("*")
        .gt("fecha_hora", now)
        .order("fecha_hora", { ascending: true })
        .limit(1);

      const { data: eventosData } = await supabase
        .from("Evento")
        .select("*")
        .gt("fecha_hora", now)
        .order("fecha_hora", { ascending: true })
        .limit(1);

      const upcomingSessions: NextSession[] = [];

      if (entrenamientosData && entrenamientosData.length > 0) {
        entrenamientosData.forEach((entrenamiento: any) => {
          upcomingSessions.push({
            fecha_hora: entrenamiento.fecha_hora,
            tipo_evento: "Entrenamiento",
            lugar: entrenamiento.lugar,
            titulo: entrenamiento.descripcion,
            esEvento: false,
          });
        });
      }

      if (eventosData && eventosData.length > 0) {
        eventosData.forEach((evento: any) => {
          upcomingSessions.push({
            fecha_hora: evento.fecha_hora,
            tipo_evento: evento.tipo_evento,
            lugar: evento.ubicacion,
            titulo: evento.titulo,
            esEvento: true,
          });
        });
      }

      if (upcomingSessions.length > 0) {
        const closestSession = upcomingSessions.sort(
          (a, b) =>
            new Date(a.fecha_hora).getTime() - new Date(b.fecha_hora).getTime()
        )[0];
        setNextSession(closestSession);
      } else {
        setNextSession(null);
      }
    } catch (error) {
      setNextSession(null);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchUserData();
  };

  const totalSessions = attendanceData.length;
  const presentSessions = attendanceData.filter(
    (item) => item.estado_asistencia === "Presente"
  ).length;
  const absentSessions = attendanceData.filter(
    (item) => item.estado_asistencia === "Ausente"
  ).length;
  const justifiedSessions = attendanceData.filter(
    (item) => item.estado_asistencia === "Justificado"
  ).length;
  const noRecordSessions = attendanceData.filter(
    (item) => item.estado_asistencia === "Sin registro"
  ).length;

  const attendanceRate =
    totalSessions > 0 ? Math.round((presentSessions / totalSessions) * 100) : 0;

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.welcome}>Mi Asistencia</Text>
            <Text style={styles.subtitle}>Cargando tu información...</Text>
          </View>
          <View style={styles.avatarContainer}>
            <View style={styles.userAvatar}>
              <Text style={styles.userAvatarText}>
                {user?.nombre?.charAt(0)}
                {user?.apellido?.charAt(0)}
              </Text>
            </View>
          </View>
        </View>

        <ScrollView
          style={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.section}>
            <View
              style={[
                styles.progressContainer,
                { alignItems: "center", justifyContent: "center" },
              ]}
            >
              <Ionicons name="refresh" size={40} color="#3f3db8ff" />
              <Text
                style={[
                  styles.progressLabel,
                  { textAlign: "center", marginTop: 10 },
                ]}
              >
                Cargando datos...
              </Text>
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.welcome}>Mi Asistencia</Text>
          <Text style={styles.subtitle}>
            Hola {user?.nombre}, aquí está tu historial
          </Text>
        </View>
        <View style={styles.avatarContainer}>
          <View style={styles.userAvatar}>
            <Text style={styles.userAvatarText}>
              {user?.nombre?.charAt(0)}
              {user?.apellido?.charAt(0)}
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
            colors={["#3f3db8ff"]}
            tintColor="#3f3db8ff"
          />
        }
      >
        {totalSessions > 0 ? (
          <View style={styles.section}>
            <AttendanceProgress percentage={attendanceRate} />
          </View>
        ) : (
          <View style={styles.section}>
            <View style={styles.progressContainer}>
              <Text style={[styles.progressPercentage, { color: "#9b9b9bff" }]}>
                Sin registros aún
              </Text>
            </View>
          </View>
        )}

        {totalSessions > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Mis Estadísticas</Text>
            <View style={styles.statsGrid}>
              <StatsCard
                icon="checkmark-circle"
                value={presentSessions}
                label="Presente"
                color="#2ecc71"
              />
              <StatsCard
                icon="close-circle"
                value={absentSessions}
                label="Ausente"
                color="#e74c3c"
              />
              <StatsCard
                icon="time"
                value={justifiedSessions}
                label="Justificado"
                color="#f39c12"
              />
              <StatsCard
                icon="document"
                value={noRecordSessions}
                label="Sin registro"
                color="#95a5a6"
              />
            </View>
          </View>
        )}

        <NextSessionCard nextSession={nextSession} />

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Mi Historial</Text>
            {totalSessions > 0 && (
              <Text style={styles.sessionCount}>{totalSessions} sesiones</Text>
            )}
          </View>

          {attendanceData.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={48} color="#ccc" />
              <Text style={styles.emptyStateText}>
                No hay registros de asistencia
              </Text>
              <Text
                style={[styles.emptyStateText, { fontSize: 14, marginTop: 5 }]}
              >
                Los registros aparecerán aquí después de tus primeras sesiones
              </Text>
            </View>
          ) : (
            attendanceData.map((item) => (
              <AttendanceCard key={item.id} item={item} />
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    backgroundColor: "#3f3db8ff",
    padding: 25,
    paddingTop: 60,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#3f3db8ff",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
  },
  headerContent: {
    flex: 1,
  },
  welcome: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
  },
  avatarContainer: {
    marginLeft: 15,
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.3)",
  },
  userAvatarText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
  },
  scrollContent: {
    flex: 1,
  },
  section: {
    padding: 20,
    paddingBottom: 0,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
  },
  sessionCount: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  progressContainer: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  progressLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  progressPercentage: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#3f3db8ff",
  },
  progressBar: {
    height: 12,
    backgroundColor: "#ecf0f1",
    borderRadius: 6,
    overflow: "hidden",
    marginBottom: 15,
  },
  progressFill: {
    height: "100%",
    borderRadius: 6,
  },
  progressLegend: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 5,
  },
  legendText: {
    fontSize: 10,
    color: "#666",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  statsCard: {
    width: (width - 60) / 2,
    backgroundColor: "white",
    padding: 15,
    borderRadius: 15,
    alignItems: "center",
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
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
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  statsLabel: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
  },
  nextSession: {
    backgroundColor: "white",
    margin: 20,
    marginVertical: 10,
    padding: 20,
    borderRadius: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  nextSessionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  nextSessionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginLeft: 8,
  },
  nextSessionContent: {
    gap: 8,
  },
  sessionTypeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  nextSessionType: {
    fontSize: 16,
    fontWeight: "600",
    color: "#3f3db8ff",
  },
  nextSessionDate: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  nextSessionLocation: {
    fontSize: 13,
    color: "#666",
  },
  noSessionText: {
    fontSize: 14,
    color: "#95a5a6",
    fontStyle: "italic",
    textAlign: "center",
  },
  attendanceCard: {
    backgroundColor: "white",
    padding: 15,
    borderRadius: 15,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  dateText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginLeft: 6,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  cardContent: {
    gap: 6,
  },
  sessionInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  sessionText: {
    fontSize: 13,
    color: "#666",
    marginLeft: 6,
  },
  notesContainer: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#ecf0f1",
  },
  notesText: {
    fontSize: 12,
    color: "#666",
    fontStyle: "italic",
  },
  emptyState: {
    backgroundColor: "white",
    padding: 40,
    borderRadius: 15,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyStateText: {
    fontSize: 16,
    color: "#666",
    marginTop: 10,
    textAlign: "center",
  },
});
