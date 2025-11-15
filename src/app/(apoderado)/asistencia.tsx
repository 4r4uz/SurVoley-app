import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { useAuth } from "../../core/auth/AuthContext";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../core/supabase/supabaseClient";
import { UserService } from "../../core/services";
import SafeLayout from "../../shared/components/SafeLayout";
import UserHeader from "../../shared/components/UserHeader";
import { colors } from "../../shared/constants/theme";

const { width } = Dimensions.get("window");

interface Asistencia {
  id_asistencia: string;
  fecha_asistencia: string;
  estado_asistencia: string;
  observaciones: string | null;
  entrenamiento?: {
    fecha_hora: string;
    lugar: string;
    descripcion: string;
  };
  jugador?: {
    nombre: string;
    apellido: string;
  };
}

export default function ApoderadoAsistenciaScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [asistencias, setAsistencias] = useState<Asistencia[]>([]);
  const [loading, setLoading] = useState(true);
  const [mesSeleccionado, setMesSeleccionado] = useState(new Date().getMonth());
  const [anioSeleccionado, setAnioSeleccionado] = useState(new Date().getFullYear());

  const cargarAsistencias = async () => {
    try {
      setLoading(true);

      if (!user?.id) {
        setAsistencias([]);
        return;
      }

      // Obtener directamente el id_jugador_tutorado del apoderado
      const { data: apoderadoData, error: apoderadoError } = await supabase
        .from('Apoderado')
        .select('id_jugador_tutorado')
        .eq('id_apoderado', user.id)
        .single();

      if (apoderadoError || !apoderadoData?.id_jugador_tutorado) {
        setAsistencias([]);
        return;
      }

      const idJugadorTutorado = apoderadoData.id_jugador_tutorado;

      // Obtener información del jugador tutorado
      const { data: jugadorData, error: jugadorError } = await supabase
        .from("Usuarios")
        .select("nombre, apellido")
        .eq("id_usuario", idJugadorTutorado)
        .single();

      if (jugadorError) throw jugadorError;

      // Obtener asistencias del jugador tutorado
      const { data: asistenciasData, error } = await supabase
        .from("Asistencia")
        .select("*")
        .eq("id_jugador", idJugadorTutorado)
        .order("fecha_asistencia", { ascending: false })
        .limit(20);

      if (error) throw error;

      // Si hay asistencias, obtener datos adicionales
      if (asistenciasData && asistenciasData.length > 0) {
        const asistenciasConDatos = await Promise.all(
          asistenciasData.map(async (asistencia) => {
            // Obtener datos del entrenamiento si existe
            let entrenamiento = null;
            if (asistencia.id_entrenamiento) {
              const { data: entData } = await supabase
                .from("Entrenamiento")
                .select("fecha_hora, lugar, descripcion")
                .eq("id_entrenamiento", asistencia.id_entrenamiento)
                .single();
              entrenamiento = entData;
            }

            // Obtener datos del evento si existe
            let evento = null;
            if (asistencia.id_evento) {
              const { data: evtData } = await supabase
                .from("Evento")
                .select("titulo, tipo_evento, fecha_hora, ubicacion")
                .eq("id_evento", asistencia.id_evento)
                .single();
              evento = evtData;
            }

            return {
              ...asistencia,
              jugador: jugadorData,
              entrenamiento,
              evento,
            };
          })
        );
        setAsistencias(asistenciasConDatos);
      } else {
        setAsistencias([]);
      }
    } catch (error) {
      console.error("Error cargando asistencias:", error);
      Alert.alert("Error", "No se pudieron cargar las asistencias");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      cargarAsistencias();
    }
  }, [user?.id]);

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case "Presente": return "#059669";
      case "Ausente": return "#DC2626";
      case "Justificado": return "#D97706";
      default: return "#6B7280";
    }
  };

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case "Presente": return "checkmark-circle";
      case "Ausente": return "close-circle";
      case "Justificado": return "alert-circle";
      default: return "help-circle";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const calcularEstadisticas = () => {
    // Filtrar asistencias por mes seleccionado
    const asistenciasFiltradas = asistencias.filter(asistencia => {
      const fechaAsistencia = new Date(asistencia.fecha_asistencia);
      return fechaAsistencia.getMonth() === mesSeleccionado &&
             fechaAsistencia.getFullYear() === anioSeleccionado;
    });

    const total = asistenciasFiltradas.length;
    const presentes = asistenciasFiltradas.filter(a => a.estado_asistencia === "Presente").length;
    const ausentes = asistenciasFiltradas.filter(a => a.estado_asistencia === "Ausente").length;
    const justificados = asistenciasFiltradas.filter(a => a.estado_asistencia === "Justificado").length;

    return { total, presentes, ausentes, justificados };
  };

  const estadisticas = calcularEstadisticas();

  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const cambiarMes = (incremento: number) => {
    let nuevoMes = mesSeleccionado + incremento;
    let nuevoAnio = anioSeleccionado;

    if (nuevoMes > 11) {
      nuevoMes = 0;
      nuevoAnio += 1;
    } else if (nuevoMes < 0) {
      nuevoMes = 11;
      nuevoAnio -= 1;
    }

    setMesSeleccionado(nuevoMes);
    setAnioSeleccionado(nuevoAnio);
  };

  if (loading) {
    return (
      <SafeLayout>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.apoderado} />
          <Text style={styles.loadingText}>Cargando asistencias...</Text>
        </View>
      </SafeLayout>
    );
  }

  return (
    <SafeLayout>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <UserHeader
          user={user}
          greeting="Control de Asistencias"
          avatarColor={colors.apoderado}
          roleText="Apoderado"
        />

        {/* Selector de Mes */}
        <View style={styles.monthSelector}>
          <TouchableOpacity
            style={styles.monthButton}
            onPress={() => cambiarMes(-1)}
          >
            <Ionicons name="chevron-back" size={20} color={colors.apoderado} />
          </TouchableOpacity>
          <View style={styles.monthDisplay}>
            <Text style={styles.monthText}>
              {meses[mesSeleccionado]} {anioSeleccionado}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.monthButton}
            onPress={() => cambiarMes(1)}
          >
            <Ionicons name="chevron-forward" size={20} color={colors.apoderado} />
          </TouchableOpacity>
        </View>

        <View style={styles.stats}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{estadisticas.total}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={[styles.statCard, styles.statPositive]}>
            <Text style={styles.statNumber}>{estadisticas.presentes}</Text>
            <Text style={styles.statLabel}>Presentes</Text>
          </View>
          <View style={[styles.statCard, styles.statWarning]}>
            <Text style={styles.statNumber}>{estadisticas.ausentes}</Text>
            <Text style={styles.statLabel}>Ausentes</Text>
          </View>
          <View style={[styles.statCard, styles.statInfo]}>
            <Text style={styles.statNumber}>{estadisticas.justificados}</Text>
            <Text style={styles.statLabel}>Justificados</Text>
          </View>
        </View>

        <View style={styles.asistenciasList}>
          <View style={styles.listHeader}>
            <Text style={styles.listTitle}>Asistencias Recientes</Text>
            <TouchableOpacity style={styles.refreshButton} onPress={cargarAsistencias}>
              <Ionicons name="refresh" size={16} color={colors.apoderado} />
            </TouchableOpacity>
          </View>

          {asistencias
            .filter(asistencia => {
              const fechaAsistencia = new Date(asistencia.fecha_asistencia);
              return fechaAsistencia.getMonth() === mesSeleccionado &&
                     fechaAsistencia.getFullYear() === anioSeleccionado;
            })
            .map((asistencia) => (
              <View key={asistencia.id_asistencia} style={styles.asistenciaCard}>
                <View style={styles.asistenciaHeader}>
                  <View style={styles.jugadorInfo}>
                    <Text style={styles.jugadorName}>
                      {asistencia.jugador?.nombre} {asistencia.jugador?.apellido}
                    </Text>
                    <Text style={styles.entrenamientoText}>
                      {asistencia.entrenamiento?.descripcion || "Entrenamiento"}
                    </Text>
                  </View>
                  <View style={[styles.estadoBadge, { backgroundColor: getEstadoColor(asistencia.estado_asistencia) }]}>
                    <Ionicons name={getEstadoIcon(asistencia.estado_asistencia) as any} size={12} color="#FFFFFF" />
                    <Text style={styles.estadoText}>{asistencia.estado_asistencia}</Text>
                  </View>
                </View>

                <View style={styles.asistenciaContent}>
                  <View style={styles.fechaInfo}>
                    <Ionicons name="calendar" size={14} color="#6B7280" />
                    <Text style={styles.fechaText}>
                      {formatDate(asistencia.fecha_asistencia)}
                    </Text>
                  </View>
                  {asistencia.entrenamiento?.lugar && (
                    <View style={styles.lugarInfo}>
                      <Ionicons name="location" size={14} color="#6B7280" />
                      <Text style={styles.lugarText}>{asistencia.entrenamiento.lugar}</Text>
                    </View>
                  )}
                </View>

                {asistencia.observaciones && (
                  <View style={styles.observacionContainer}>
                    <Ionicons name="chatbubble" size={14} color="#6B7280" />
                    <Text style={styles.observacionText} numberOfLines={2}>
                      {asistencia.observaciones}
                    </Text>
                  </View>
                )}
              </View>
            ))}

          {asistencias
            .filter(asistencia => {
              const fechaAsistencia = new Date(asistencia.fecha_asistencia);
              return fechaAsistencia.getMonth() === mesSeleccionado &&
                     fechaAsistencia.getFullYear() === anioSeleccionado;
            })
            .length === 0 && (
            <View style={styles.emptyContainer}>
              <Ionicons name="calendar-outline" size={48} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>No hay asistencias</Text>
              <Text style={styles.emptyDescription}>
                No se encontraron registros de asistencia para {meses[mesSeleccionado].toLowerCase()} {anioSeleccionado}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#6B7280",
  },
  monthSelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: 16,
  },
  monthButton: {
    padding: 8,
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
  },
  monthDisplay: {
    flex: 1,
    alignItems: "center",
  },
  monthText: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.apoderado,
  },
  stats: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  statPositive: {
    borderLeftWidth: 4,
    borderLeftColor: "#059669",
  },
  statWarning: {
    borderLeftWidth: 4,
    borderLeftColor: "#D97706",
  },
  statInfo: {
    borderLeftWidth: 4,
    borderLeftColor: "#7C3AED",
  },
  statNumber: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1F2937",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
  },
  asistenciasList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
  },
  refreshButton: {
    padding: 8,
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
  },
  asistenciaCard: {
    backgroundColor: colors.background,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  asistenciaHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  jugadorInfo: {
    flex: 1,
  },
  jugadorName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 4,
  },
  entrenamientoText: {
    fontSize: 14,
    color: "#6B7280",
  },
  estadoBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  estadoText: {
    fontSize: 12,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  asistenciaContent: {
    gap: 8,
  },
  fechaInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  fechaText: {
    fontSize: 12,
    color: "#6B7280",
  },
  lugarInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  lugarText: {
    fontSize: 12,
    color: "#6B7280",
  },
  observacionContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  observacionText: {
    fontSize: 12,
    color: "#6B7280",
    flex: 1,
  },
  emptyContainer: {
    alignItems: "center",
    padding: 40,
  },
  emptyTitle: {
    fontSize: 18,
    color: "#374151",
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
  },
});
