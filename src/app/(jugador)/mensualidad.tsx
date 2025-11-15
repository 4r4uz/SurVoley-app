import React, { useState, useEffect, useCallback } from "react";
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
  StatusBar,
} from "react-native";
import { supabase } from "../../core/supabase/supabaseClient";
import { useAuth } from "../../core/auth/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../shared/constants/theme";
import { StatsCard } from "../../shared/components/StatsCard";

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

interface PaymentMethod {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
}

const MONTO_FIJO = 20000;



const PaymentCard = React.memo(
  ({
    item,
    onPay,
    tipo,
  }: {
    item: Mensualidad;
    onPay: (item: Mensualidad) => void;
    tipo: "proximo" | "pendiente" | "pagado";
  }) => {
    const formatearFecha = (fechaString: string | null) => {
      if (!fechaString) return "";
      const date = new Date(fechaString);
      return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    };

    const formatearMonto = (monto: number) => {
      return `$${monto.toLocaleString("es-CL")}`;
    };

    const obtenerNombreMes = (mes: string) => {
      const meses = [
        "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
      ];
      return meses[parseInt(mes) - 1] || mes;
    };

    const getCardConfig = (tipo: string, isOverdue: boolean) => {
      switch (tipo) {
        case "proximo":
          return {
            borderColor: colors.primaryLight,
            backgroundColor: "#EFF6FF",
            icon: "calendar",
            iconColor: colors.primaryLight,
            badgeText: "PRÓXIMO",
            badgeColor: colors.primaryLight,
          };
        case "pendiente":
          return isOverdue
            ? {
                borderColor: colors.error,
                backgroundColor: "#FEF2F2",
                icon: "warning",
                iconColor: colors.error,
                badgeText: "VENCIDO",
                badgeColor: colors.error,
              }
            : {
                borderColor: colors.warning,
                backgroundColor: "#FFFBEB",
                icon: "time",
                iconColor: colors.warning,
                badgeText: "PENDIENTE",
                badgeColor: colors.warning,
              };
        case "pagado":
          return {
            borderColor: colors.success,
            backgroundColor: "#F0FDF4",
            icon: "checkmark-circle",
            iconColor: colors.success,
            badgeText: "PAGADO",
            badgeColor: colors.success,
          };
        default:
          return {
            borderColor: "#6B7280",
            backgroundColor: "#F9FAFB",
            icon: "help-circle",
            iconColor: "#6B7280",
            badgeText: "DESCONOCIDO",
            badgeColor: "#6B7280",
          };
      }
    };

    const isOverdue =
      new Date(item.fecha_vencimiento) < new Date() &&
      item.estado_pago === "Pendiente";
    const config = getCardConfig(tipo, isOverdue);

    return (
      <View
        style={[
          styles.paymentCard,
          {
            borderColor: config.borderColor,
            backgroundColor: config.backgroundColor,
          },
        ]}
      >
        <View style={styles.cardHeader}>
          <View style={styles.paymentInfo}>
            <View style={styles.monthContainer}>
              <Text style={styles.monthText}>
                {obtenerNombreMes(item.mes_referencia)} {item.anio_referencia}
              </Text>
              <Text style={styles.amountText}>
                {formatearMonto(item.monto)}
              </Text>
            </View>

            <View style={styles.dateInfo}>
              <Ionicons
                name={config.icon as any}
                size={16}
                color={config.iconColor}
              />
              <Text style={[styles.dateText, { color: config.iconColor }]}>
                {item.estado_pago === "Pagado"
                  ? `Pagado el ${formatearFecha(item.fecha_pago)}`
                  : `Vence ${formatearFecha(item.fecha_vencimiento)}`}
              </Text>
            </View>

            {item.metodo_pago && (
              <View style={styles.paymentMethodInfo}>
                <Ionicons name="card" size={14} color="#6B7280" />
                <Text style={styles.paymentMethodText}>{item.metodo_pago}</Text>
              </View>
            )}
          </View>

          <View
            style={[styles.statusBadge, { backgroundColor: config.badgeColor }]}
          >
            <Text style={styles.statusBadgeText}>{config.badgeText}</Text>
          </View>
        </View>

        {item.estado_pago === "Pendiente" && (
          <TouchableOpacity
            style={[styles.payButton, isOverdue && styles.payButtonUrgent]}
            onPress={() => onPay(item)}
          >
            <Ionicons name="lock-closed" size={16} color="#FFFFFF" />
            <Text style={styles.payButtonText}>
              {isOverdue ? "PAGAR URGENTE" : "PAGAR AHORA"}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }
);

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
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
    flex: 1,
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  paymentsList: {
    gap: 12,
  },
  paymentCard: {
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
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  paymentInfo: {
    flex: 1,
  },
  monthContainer: {
    marginBottom: 8,
  },
  monthText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 4,
  },
  amountText: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1F2937",
  },
  dateInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  dateText: {
    fontSize: 14,
    fontWeight: "500",
  },
  paymentMethodInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  paymentMethodText: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "500",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 10,
    color: "#FFFFFF",
    fontWeight: "700",
    textTransform: "uppercase",
  },
  payButton: {
    backgroundColor: "#2563EB",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  payButtonUrgent: {
    backgroundColor: "#EF4444",
  },
  payButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  pendingBadge: {
    backgroundColor: "#EF4444",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 24,
    alignItems: "center",
  },
  pendingBadgeText: {
    fontSize: 12,
    color: "#FFFFFF",
    fontWeight: "700",
  },
  showMoreText: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 8,
    fontStyle: "italic",
  },
  emptyState: {
    backgroundColor: "#FFFFFF",
    padding: 40,
    borderRadius: 16,
    alignItems: "center",
    margin: 16,
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
  bottomSpacer: {
    height: 20,
  },

  // Pestaña aparte para seleccionar metodo de pago
  paymentMethodContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  paymentMethodHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 16,
    backgroundColor: "#F8FAFC",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  backButton: {
    padding: 8,
  },
  paymentMethodTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
  },
  placeholder: {
    width: 40,
  },
  paymentSummary: {
    backgroundColor: "#FFFFFF",
    margin: 16,
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
  paymentSummaryTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
    marginBottom: 8,
  },
  paymentDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  paymentDescription: {
    fontSize: 16,
    fontWeight: "500",
    color: "#1F2937",
  },
  paymentAmount: {
    fontSize: 18,
    fontWeight: "800",
    color: "#2563EB",
  },
  methodsList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  methodsTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 12,
  },
  methodCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  methodIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  methodInfo: {
    flex: 1,
  },
  methodName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 4,
  },
  methodDescription: {
    fontSize: 12,
    color: "#6B7280",
  },
  securityNotice: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#10B98115",
    margin: 16,
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  securityText: {
    fontSize: 14,
    color: "#10B981",
    fontWeight: "500",
    flex: 1,
  },
});

const PaymentMethodScreen = ({
  mensualidad,
  onBack,
  onSuccess,
}: {
  mensualidad: Mensualidad;
  onBack: () => void;
  onSuccess: () => void;
}) => {
  const paymentMethods: PaymentMethod[] = [
    {
      id: "webpay",
      name: "WebPay",
      icon: "card",
      color: "#2563EB",
      description: "Pago seguro con tarjeta de crédito o débito",
    },
    {
      id: "transferencia",
      name: "Transferencia",
      icon: "business",
      color: "#10B981",
      description: "Transferencia bancaria directa",
    },
    {
      id: "mercadopago",
      name: "Mercado Pago",
      icon: "phone-portrait",
      color: "#00B2FF",
      description: "Pago rápido con Mercado Pago",
    },
  ];

  const formatearMonto = (monto: number) => {
    return `$${monto.toLocaleString("es-CL")}`;
  };

  const obtenerNombreMes = (mes: string) => {
    const meses = [
      "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
      "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];
    return meses[parseInt(mes) - 1] || mes;
  };

  const handlePayment = async (method: PaymentMethod) => {
    try {
      if (method.id === "webpay") {
        Alert.alert("WebPay", "Redirigiendo a WebPay...", [
          { text: "OK", onPress: onSuccess }
        ]);
      } else if (method.id === "transferencia") {
        Alert.alert(
          "Datos para Transferencia",
          `Banco: SURVOLEY BANK\nCuenta: 123456789\nRUT: 12.345.678-9\nMonto: ${formatearMonto(mensualidad.monto)}\n\nUna vez transferido, envíe el comprobante a pagos@survoley.cl`,
          [{ text: "Entendido", onPress: onSuccess }]
        );
      } else if (method.id === "mercadopago") {
        Alert.alert("Mercado Pago", "Redirigiendo a Mercado Pago...", [
          { text: "OK", onPress: onSuccess }
        ]);
      }
    } catch (error) {
      Alert.alert("Error", "No se pudo abrir el método de pago");
    }
  };

  return (
    <View style={styles.paymentMethodContainer}>
      <StatusBar backgroundColor="#F8FAFC" barStyle="dark-content" />
      <View style={styles.paymentMethodHeader}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.paymentMethodTitle}>Método de Pago</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.paymentSummary}>
        <Text style={styles.paymentSummaryTitle}>Resumen del Pago</Text>
        <View style={styles.paymentDetails}>
          <Text style={styles.paymentDescription}>
            Mensualidad {obtenerNombreMes(mensualidad.mes_referencia)}{" "}
            {mensualidad.anio_referencia}
          </Text>
          <Text style={styles.paymentAmount}>
            {formatearMonto(mensualidad.monto)}
          </Text>
        </View>
      </View>

      <ScrollView style={styles.methodsList}>
        <Text style={styles.methodsTitle}>Selecciona tu método de pago</Text>
        {paymentMethods.map((method) => (
          <TouchableOpacity
            key={method.id}
            style={styles.methodCard}
            onPress={() => handlePayment(method)}
          >
            <View
              style={[
                styles.methodIcon,
                { backgroundColor: method.color + "15" },
              ]}
            >
              <Ionicons
                name={method.icon as any}
                size={24}
                color={method.color}
              />
            </View>
            <View style={styles.methodInfo}>
              <Text style={styles.methodName}>{method.name}</Text>
              <Text style={styles.methodDescription}>{method.description}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.securityNotice}>
        <Ionicons name="shield-checkmark" size={24} color="#10B981" />
        <Text style={styles.securityText}>
          Tus pagos están protegidos 🤝
        </Text>
      </View>
    </View>
  );
};

export default function PagosScreen() {
  const [mensualidades, setMensualidades] = useState<Mensualidad[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Mensualidad | null>(
    null
  );
  const { user } = useAuth();

  const cargarMensualidades = useCallback(async () => {
    try {
      if (!user?.id) {
        setMensualidades([]);
        return;
      }

      const { data: jugadorData, error: jugadorError } = await supabase
        .from("Jugador")
        .select("id_jugador")
        .eq("id_jugador", user.id)
        .single();

      if (jugadorError || !jugadorData) {
        setMensualidades([]);
        return;
      }

      const idJugador = jugadorData.id_jugador;

      const { data, error } = await supabase
        .from("Mensualidad")
        .select("*")
        .eq("id_jugador", idJugador)
        .order("anio_referencia", { ascending: false })
        .order("mes_referencia", { ascending: false })
        .limit(12);

      if (error) throw error;

      setMensualidades(data || []);
    } catch (error) {
      console.error("Error cargando mensualidades:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user) {
      cargarMensualidades();
    }
  }, [user, cargarMensualidades]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    cargarMensualidades();
  }, [cargarMensualidades]);

  const handlePay = (mensualidad: Mensualidad) => {
    setSelectedPayment(mensualidad);
  };

  const handlePaymentSuccess = () => {
    setSelectedPayment(null);
    cargarMensualidades();
    Alert.alert(
      "Pago Procesado",
      "Tu pago está siendo verificado. Recibirás una confirmación por correo.",
      [{ text: "Entendido", style: "default" }]
    );
  };

  const clasificarMensualidades = () => {
    const ahora = new Date();
    const mesActual = ahora.getMonth() + 1;
    const anioActual = ahora.getFullYear();

    const proximas: Mensualidad[] = [];
    const pendientes: Mensualidad[] = [];
    const pagadas: Mensualidad[] = [];

    mensualidades.forEach((mensualidad) => {
      const mesRef = parseInt(mensualidad.mes_referencia);
      const anioRef = mensualidad.anio_referencia;

      if (mensualidad.estado_pago === "Pagado") {
        pagadas.push(mensualidad);
      } else if (mensualidad.estado_pago === "Pendiente") {
        if (
          anioRef > anioActual ||
          (anioRef === anioActual && mesRef > mesActual)
        ) {
          proximas.push(mensualidad);
        } else {
          pendientes.push(mensualidad);
        }
      }
    });

    return { proximas, pendientes, pagadas };
  };

  const { proximas, pendientes, pagadas } = clasificarMensualidades();

  const calcularResumen = () => {
    const total = mensualidades.length;
    const pagados = pagadas.length;
    const totalPendientes = pendientes.length + proximas.length;
    const totalPagado = pagadas.reduce((sum, m) => sum + m.monto, 0);
    const totalPendiente =
      pendientes.reduce((sum, m) => sum + m.monto, 0) +
      proximas.reduce((sum, m) => sum + m.monto, 0);

    return {
      total,
      pagados,
      totalPendientes,
      totalPagado,
      totalPendiente,
    };
  };

  const resumen = calcularResumen();

  if (selectedPayment) {
    return (
      <PaymentMethodScreen
        mensualidad={selectedPayment}
        onBack={() => setSelectedPayment(null)}
        onSuccess={handlePaymentSuccess}
      />
    );
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar backgroundColor={colors.primaryDark} barStyle="light-content" />
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.headerTextContainer}>
              <Text style={styles.welcome}>Gestión de Pagos</Text>
              <Text style={styles.subtitle}>Cargando tu información...</Text>
            </View>
          </View>
        </View>
        <View style={styles.loadingContent}>
          <Ionicons name="card" size={60} color="#2563EB" />
          <Text style={styles.loadingText}>Cargando tus mensualidades...</Text>
          <ActivityIndicator size="large" color="#2563EB" />
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
            <Text style={styles.welcome}>Mensualidad</Text>
            <Text style={styles.subtitle}>
              Hola {user?.nombre}, controla tus mensualidades
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
              icon="document-text"
              value={resumen.total.toString()}
              label="Total"
              color={colors.primary}
            />
            <StatsCard
              icon="checkmark-circle"
              value={resumen.pagados.toString()}
              label="Pagados"
              color={colors.success}
            />
            <StatsCard
              icon="time"
              value={resumen.totalPendientes.toString()}
              label="Pendientes"
              color={colors.warning}
            />
          </View>
        </View>

        {proximas.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="calendar" size={20} color={colors.primaryLight} />
              <Text style={styles.sectionTitle}>Próximas Mensualidades</Text>
            </View>
            <View style={styles.paymentsList}>
              {proximas.map((item) => (
                <PaymentCard
                  key={item.id_mensualidad}
                  item={item}
                  onPay={handlePay}
                  tipo="proximo"
                />
              ))}
            </View>
          </View>
        )}

        {pendientes.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="alert-circle" size={20} color="#EF4444" />
              <Text style={styles.sectionTitle}>Mensualidades Pendientes</Text>
              <View style={styles.pendingBadge}>
                <Text style={styles.pendingBadgeText}>{pendientes.length}</Text>
              </View>
            </View>
            <View style={styles.paymentsList}>
              {pendientes.map((item) => (
                <PaymentCard
                  key={item.id_mensualidad}
                  item={item}
                  onPay={handlePay}
                  tipo="pendiente"
                />
              ))}
            </View>
          </View>
        )}

        {pagadas.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="checkmark-circle" size={20} color="#10B981" />
              <Text style={styles.sectionTitle}>Historial de Pagos</Text>
            </View>
            <View style={styles.paymentsList}>
              {pagadas.slice(0, 6).map((item) => (
                <PaymentCard
                  key={item.id_mensualidad}
                  item={item}
                  onPay={handlePay}
                  tipo="pagado"
                />
              ))}
            </View>
            {pagadas.length > 6 && (
              <Text style={styles.showMoreText}>
                +{pagadas.length - 6} pagos anteriores
              </Text>
            )}
          </View>
        )}

        {mensualidades.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="card-outline" size={48} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>Sin mensualidades</Text>
            <Text style={styles.emptySubtitle}>
              No hay mensualidades registradas en tu cuenta
            </Text>
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}
