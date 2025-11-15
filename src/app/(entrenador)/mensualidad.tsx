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
import SafeLayout from "../../shared/components/SafeLayout";
import UserHeader from "../../shared/components/UserHeader";
import { colors } from "../../shared/constants/theme";

const { width } = Dimensions.get("window");

interface Mensualidad {
  id_mensualidad: string;
  monto: number;
  estado_pago: string;
  fecha_vencimiento: string;
  fecha_pago: string | null;
  mes_referencia: string;
  anio_referencia: number;
  jugador?: {
    nombre: string;
    apellido: string;
  };
}

export default function EntrenadorMensualidadScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [mensualidades, setMensualidades] = useState<Mensualidad[]>([]);
  const [loading, setLoading] = useState(true);

  const cargarMensualidades = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("Mensualidad")
        .select(`
          *,
          jugador:Usuarios!Mensualidad_id_jugador_fkey (
            nombre,
            apellido
          )
        `)
        .order("fecha_vencimiento", { ascending: false });

      if (error) throw error;
      setMensualidades(data || []);
    } catch (error) {
      console.error("Error cargando mensualidades:", error);
      Alert.alert("Error", "No se pudieron cargar las mensualidades");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarMensualidades();
  }, []);

  const formatearMonto = (monto: number) => {
    return `$${monto.toLocaleString("es-CL")}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case "Pagado": return "#059669";
      case "Pendiente": return "#D97706";
      default: return "#6B7280";
    }
  };

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case "Pagado": return "checkmark-circle";
      case "Pendiente": return "time";
      default: return "help-circle";
    }
  };

  const calcularEstadisticas = () => {
    const total = mensualidades.length;
    const pagadas = mensualidades.filter(m => m.estado_pago === "Pagado").length;
    const pendientes = mensualidades.filter(m => m.estado_pago === "Pendiente").length;
    const totalRecaudado = mensualidades
      .filter(m => m.estado_pago === "Pagado")
      .reduce((sum, m) => sum + m.monto, 0);
    const totalPendiente = mensualidades
      .filter(m => m.estado_pago === "Pendiente")
      .reduce((sum, m) => sum + m.monto, 0);

    return { total, pagadas, pendientes, totalRecaudado, totalPendiente };
  };

  const estadisticas = calcularEstadisticas();

  const mensualidadesVencidas = mensualidades.filter(m =>
    m.estado_pago === "Pendiente" &&
    new Date(m.fecha_vencimiento) < new Date()
  );

  if (loading) {
    return (
      <SafeLayout>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.entrenador} />
          <Text style={styles.loadingText}>Cargando mensualidades...</Text>
        </View>
      </SafeLayout>
    );
  }

  return (
    <SafeLayout>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <UserHeader
          user={user}
          greeting="Estado de Pagos"
          avatarColor={colors.entrenador}
          roleText="Entrenador"
        />

        <View style={styles.stats}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{estadisticas.total}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={[styles.statCard, styles.statPositive]}>
            <Text style={styles.statNumber}>{estadisticas.pagadas}</Text>
            <Text style={styles.statLabel}>Pagadas</Text>
          </View>
          <View style={[styles.statCard, styles.statWarning]}>
            <Text style={styles.statNumber}>{estadisticas.pendientes}</Text>
            <Text style={styles.statLabel}>Pendientes</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {formatearMonto(estadisticas.totalRecaudado)}
            </Text>
            <Text style={styles.statLabel}>Recaudado</Text>
          </View>
        </View>

        {mensualidadesVencidas.length > 0 && (
          <View style={styles.alertContainer}>
            <View style={styles.alertCard}>
              <Ionicons name="warning" size={20} color="#D97706" />
              <View style={styles.alertContent}>
                <Text style={styles.alertTitle}>Mensualidades Vencidas</Text>
                <Text style={styles.alertText}>
                  Hay {mensualidadesVencidas.length} mensualidad(es) vencida(s)
                </Text>
              </View>
            </View>
          </View>
        )}

        <View style={styles.mensualidadesList}>
          <View style={styles.listHeader}>
            <Text style={styles.listTitle}>Control de Pagos</Text>
            <TouchableOpacity style={styles.refreshButton} onPress={cargarMensualidades}>
              <Ionicons name="refresh" size={16} color={colors.entrenador} />
            </TouchableOpacity>
          </View>

          {mensualidades.map((mensualidad) => (
            <View key={mensualidad.id_mensualidad} style={styles.mensualidadCard}>
              <View style={styles.mensualidadHeader}>
                <View style={styles.jugadorInfo}>
                  <Text style={styles.jugadorName}>
                    {mensualidad.jugador?.nombre} {mensualidad.jugador?.apellido}
                  </Text>
                  <Text style={styles.periodoText}>
                    {mensualidad.mes_referencia} {mensualidad.anio_referencia}
                  </Text>
                </View>
                <View style={[styles.estadoBadge, { backgroundColor: getEstadoColor(mensualidad.estado_pago) }]}>
                  <Ionicons name={getEstadoIcon(mensualidad.estado_pago) as any} size={12} color="#FFFFFF" />
                  <Text style={styles.estadoText}>{mensualidad.estado_pago}</Text>
                </View>
              </View>

              <View style={styles.mensualidadContent}>
                <View style={styles.montoContainer}>
                  <Text style={styles.montoText}>{formatearMonto(mensualidad.monto)}</Text>
                </View>

                <View style={styles.fechasInfo}>
                  <View style={styles.fechaItem}>
                    <Ionicons name="calendar" size={14} color="#6B7280" />
                    <Text style={styles.fechaText}>
                      Vence: {formatDate(mensualidad.fecha_vencimiento)}
                    </Text>
                  </View>
                  {mensualidad.fecha_pago && (
                    <View style={styles.fechaItem}>
                      <Ionicons name="checkmark-circle" size={14} color="#059669" />
                      <Text style={styles.fechaText}>
                        Pagado: {formatDate(mensualidad.fecha_pago)}
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              {mensualidad.estado_pago === "Pendiente" && (
                <View style={styles.pendingActions}>
                  <TouchableOpacity style={styles.reminderButton}>
                    <Ionicons name="mail" size={14} color="#FFFFFF" />
                    <Text style={styles.reminderButtonText}>Enviar Recordatorio</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))}

          {mensualidades.length === 0 && (
            <View style={styles.emptyContainer}>
              <Ionicons name="card-outline" size={48} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>No hay mensualidades</Text>
              <Text style={styles.emptyDescription}>
                No se encontraron registros de mensualidades
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
  statNumber: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1F2937",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
  },
  alertContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  alertCard: {
    backgroundColor: "#FEF3C7",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#F59E0B",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#92400E",
    marginBottom: 4,
  },
  alertText: {
    fontSize: 14,
    color: "#92400E",
  },
  mensualidadesList: {
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
  mensualidadCard: {
    backgroundColor: colors.background,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  mensualidadHeader: {
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
  periodoText: {
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
  mensualidadContent: {
    marginBottom: 12,
  },
  montoContainer: {
    alignItems: "center",
    marginBottom: 12,
  },
  montoText: {
    fontSize: 24,
    fontWeight: "800",
    color: "#1F2937",
  },
  fechasInfo: {
    gap: 8,
  },
  fechaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  fechaText: {
    fontSize: 12,
    color: "#6B7280",
  },
  pendingActions: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  reminderButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.entrenador,
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  reminderButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
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
