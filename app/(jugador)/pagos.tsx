import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  RefreshControl,
  Dimensions,
} from "react-native";
import { supabase } from "../../supabase/supabaseClient";
import { useAuth } from "../../types/use.auth";
import { Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

interface Mensualidad {
  id_mensualidad: string;
  monto: number;
  fecha_vencimiento: string;
  fecha_pago: string | null;
  metodo_pago: string | null;
  estado_pago: string;
  mes_referencia: string;
  anio_referencia: number;
}

const StatsCard = ({ icon, value, label, color }: any) => (
  <View style={styles.statsCard}>
    <View style={[styles.statsIcon, { backgroundColor: color }]}>
      <Ionicons name={icon} size={20} color="#fff" />
    </View>
    <Text style={styles.statsValue}>{value}</Text>
    <Text style={styles.statsLabel}>{label}</Text>
  </View>
);

const PaymentCard = ({ item, onPay }: { item: Mensualidad; onPay: (item: Mensualidad) => void }) => {
  const formatearMonto = (monto: number) => {
    return `$${monto.toLocaleString("es-CL")}`;
  };

  const formatearFecha = (fechaString: string | null) => {
    if (!fechaString) return "Pendiente";
    try {
      const fecha = new Date(fechaString);
      return fecha.toLocaleDateString("es-ES");
    } catch {
      return "Fecha inválida";
    }
  };

  const obtenerNombreMes = (mes: string) => {
    const meses: { [key: string]: string } = {
      "01": "Enero", "02": "Febrero", "03": "Marzo", "04": "Abril",
      "05": "Mayo", "06": "Junio", "07": "Julio", "08": "Agosto",
      "09": "Septiembre", "10": "Octubre", "11": "Noviembre", "12": "Diciembre",
    };
    return meses[mes] || mes;
  };

  const getStatusColor = (estado: string) => {
    switch (estado) {
      case "Pagado": return { color: "#2ecc71", icon: "checkmark-circle" };
      case "Pendiente": return { color: "#e74c3c", icon: "time" };
      case "Cancelado": return { color: "#95a5a6", icon: "close-circle" };
      default: return { color: "#95a5a6", icon: "help-circle" };
    }
  };

  const statusInfo = getStatusColor(item.estado_pago);

  return (
    <View style={styles.paymentCard}>
      <View style={styles.cardHeader}>
        <View style={styles.dateContainer}>
          <Ionicons name="calendar" size={16} color="#3f3db8ff" />
          <Text style={styles.dateText}>
            {obtenerNombreMes(item.mes_referencia)} {item.anio_referencia}
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
            {item.estado_pago}
          </Text>
        </View>
      </View>

      <View style={styles.cardContent}>
        <View style={styles.paymentInfo}>
          <Ionicons name="cash" size={14} color="#666" />
          <Text style={styles.paymentText}>
            {formatearMonto(item.monto)}
          </Text>
        </View>
        <View style={styles.paymentInfo}>
          <Ionicons name="time" size={14} color="#666" />
          <Text style={styles.paymentText}>
            Vence: {formatearFecha(item.fecha_vencimiento)}
          </Text>
        </View>
        {item.fecha_pago && (
          <View style={styles.paymentInfo}>
            <Ionicons name="checkmark" size={14} color="#666" />
            <Text style={styles.paymentText}>
              Pagado: {formatearFecha(item.fecha_pago)}
            </Text>
          </View>
        )}
        {item.metodo_pago && (
          <View style={styles.paymentInfo}>
            <Ionicons name="card" size={14} color="#666" />
            <Text style={styles.paymentText}>
              {item.metodo_pago}
            </Text>
          </View>
        )}
      </View>

      {item.estado_pago === "Pendiente" && (
        <TouchableOpacity
          style={styles.payButton}
          onPress={() => onPay(item)}
        >
          <Ionicons name="card" size={16} color="#fff" />
          <Text style={styles.payButtonText}>Pagar Ahora</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const PagosScreen = () => {
  const [mensualidades, setMensualidades] = useState<Mensualidad[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const cargarMensualidades = async () => {
    try {
      setError(null);

      if (!user?.id) {
        setMensualidades([]);
        return;
      }

      const { data, error } = await supabase
        .from("Mensualidad")
        .select("*")
        .eq("id_jugador", user.id)
        .order("fecha_vencimiento", { ascending: false });

      if (error) {
        setError("No se pudieron cargar las mensualidades");
        return;
      }

      setMensualidades(data || []);
    } catch (error: any) {
      setError("Error al conectar con el servidor");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    cargarMensualidades();
  }, [user?.id]);

  const onRefresh = () => {
    setRefreshing(true);
    cargarMensualidades();
  };

  const procesarPago = async (mensualidad: Mensualidad) => {
    try {
      if (!user?.id) {
        Alert.alert("Error", "No hay usuario logueado");
        return;
      }

      Alert.alert(
        "Confirmar Pago",
        `¿Estás seguro que deseas pagar la mensualidad de ${mensualidad.mes_referencia}/${mensualidad.anio_referencia} por $${mensualidad.monto.toLocaleString("es-CL")}?`,
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Pagar",
            style: "default",
            onPress: async () => {
              try {
                const { error } = await supabase
                  .from("Mensualidad")
                  .update({
                    estado_pago: "Pagado",
                    fecha_pago: new Date().toISOString(),
                    metodo_pago: "Transferencia",
                  })
                  .eq("id_mensualidad", mensualidad.id_mensualidad);

                if (error) throw error;

                Alert.alert("Éxito", "Pago procesado correctamente");
                cargarMensualidades();
              } catch (error: any) {
                Alert.alert("Error", "No se pudo procesar el pago");
              }
            },
          },
        ]
      );
    } catch (error: any) {
      Alert.alert("Error", "No se pudo procesar el pago");
    }
  };

  const calcularResumen = () => {
    const total = mensualidades.length;
    const pagados = mensualidades.filter((m) => m.estado_pago === "Pagado").length;
    const pendientes = mensualidades.filter((m) => m.estado_pago === "Pendiente").length;
    const totalPagado = mensualidades
      .filter((m) => m.estado_pago === "Pagado")
      .reduce((sum, m) => sum + m.monto, 0);
    const totalPendiente = mensualidades
      .filter((m) => m.estado_pago === "Pendiente")
      .reduce((sum, m) => sum + m.monto, 0);

    return { total, pagados, pendientes, totalPagado, totalPendiente };
  };

  const resumen = calcularResumen();

  // Pantalla de carga completa
  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.welcome}>Mis Pagos</Text>
            <Text style={styles.subtitle}>Cargando tus mensualidades...</Text>
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

        <View style={styles.loadingContainer}>
          <View style={styles.loadingContent}>
            <Ionicons name="card" size={60} color="#3f3db8ff" />
            <Text style={styles.loadingText}>Cargando pagos...</Text>
            <ActivityIndicator size="large" color="#3f3db8ff" style={styles.loadingSpinner} />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.welcome}>Mis Pagos</Text>
          <Text style={styles.subtitle}>
            Hola {user?.nombre}, aquí está tu estado de pagos
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
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resumen de Pagos</Text>
          <View style={styles.statsGrid}>
            <StatsCard
              icon="document"
              value={resumen.total}
              label="Total"
              color="#3f3db8ff"
            />
            <StatsCard
              icon="checkmark-circle"
              value={resumen.pagados}
              label="Pagados"
              color="#2ecc71"
            />
            <StatsCard
              icon="time"
              value={resumen.pendientes}
              label="Pendientes"
              color="#e74c3c"
            />
          </View>
          
          <View style={styles.amountsContainer}>
            <View style={styles.amountItem}>
              <Ionicons name="trending-up" size={16} color="#2ecc71" />
              <Text style={styles.amountLabel}>Total pagado: </Text>
              <Text style={styles.amountValue}>
                ${resumen.totalPagado.toLocaleString("es-CL")}
              </Text>
            </View>
            <View style={styles.amountItem}>
              <Ionicons name="trending-down" size={16} color="#e74c3c" />
              <Text style={styles.amountLabel}>Total pendiente: </Text>
              <Text style={styles.amountValue}>
                ${resumen.totalPendiente.toLocaleString("es-CL")}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Historial de Mensualidades</Text>
            {mensualidades.length > 0 && (
              <Text style={styles.sessionCount}>
                {mensualidades.length} mensualidades
              </Text>
            )}
          </View>

          {mensualidades.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="card-outline" size={48} color="#ccc" />
              <Text style={styles.emptyStateText}>
                No hay mensualidades registradas
              </Text>
              <Text style={[styles.emptyStateText, { fontSize: 14, marginTop: 5 }]}>
                {user?.rol === "jugador" 
                  ? "Las mensualidades se generan automáticamente cada mes" 
                  : "No hay mensualidades asignadas a este usuario"
                }
              </Text>
            </View>
          ) : (
            mensualidades.map((item) => (
              <PaymentCard 
                key={item.id_mensualidad} 
                item={item} 
                onPay={procesarPago} 
              />
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    backgroundColor: "#3f3db8ff",
    padding: 25,
    paddingTop: 20,
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
  // Nuevos estilos para el loading
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
  },
  loadingContent: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginTop: 20,
    marginBottom: 20,
    textAlign: "center",
  },
  loadingSpinner: {
    marginTop: 10,
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
  progressLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  statsCard: {
    width: (width - 60) / 3,
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
  amountsContainer: {
    backgroundColor: "white",
    padding: 15,
    borderRadius: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  amountItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  amountLabel: {
    fontSize: 14,
    color: "#666",
    marginLeft: 8,
    flex: 1,
  },
  amountValue: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
  },
  paymentCard: {
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
    marginBottom: 12,
  },
  paymentInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  paymentText: {
    fontSize: 13,
    color: "#666",
    marginLeft: 6,
  },
  payButton: {
    backgroundColor: "#3f3db8ff",
    padding: 12,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  payButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
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

export default PagosScreen;