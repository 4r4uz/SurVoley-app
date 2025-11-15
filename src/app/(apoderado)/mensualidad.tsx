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

export default function ApoderadoMensualidadScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [mensualidades, setMensualidades] = useState<Mensualidad[]>([]);
  const [loading, setLoading] = useState(true);
  const [mesSeleccionado, setMesSeleccionado] = useState(new Date().getMonth());
  const [anioSeleccionado, setAnioSeleccionado] = useState(new Date().getFullYear());
  const [selectedPayment, setSelectedPayment] = useState<Mensualidad | null>(null);

  const cargarMensualidades = async () => {
    try {
      setLoading(true);

      if (!user?.id) {
        setMensualidades([]);
        return;
      }

      // Obtener directamente el id_jugador_tutorado del apoderado
      const { data: apoderadoData, error: apoderadoError } = await supabase
        .from('Apoderado')
        .select('id_jugador_tutorado')
        .eq('id_apoderado', user.id)
        .single();

      if (apoderadoError || !apoderadoData?.id_jugador_tutorado) {
        setMensualidades([]);
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

      // Obtener mensualidades del jugador tutorado
      const { data: mensualidadesData, error } = await supabase
        .from("Mensualidad")
        .select("*")
        .eq("id_jugador", idJugadorTutorado)
        .order("fecha_vencimiento", { ascending: false });

      if (error) throw error;

      // Agregar información del jugador a cada mensualidad
      const mensualidadesConJugador = (mensualidadesData || []).map(mensualidad => ({
        ...mensualidad,
        jugador: jugadorData,
      }));

      setMensualidades(mensualidadesConJugador);
    } catch (error) {
      console.error("Error cargando mensualidades:", error);
      Alert.alert("Error", "No se pudieron cargar las mensualidades");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      cargarMensualidades();
    }
  }, [user?.id]);

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
    // Filtrar mensualidades por mes seleccionado
    const mensualidadesFiltradas = mensualidades.filter(mensualidad => {
      return mensualidad.anio_referencia === anioSeleccionado &&
             getMesNumero(mensualidad.mes_referencia) === mesSeleccionado;
    });

    const total = mensualidadesFiltradas.length;
    const pagadas = mensualidadesFiltradas.filter(m => m.estado_pago === "Pagado").length;
    const pendientes = mensualidadesFiltradas.filter(m => m.estado_pago === "Pendiente").length;
    const totalPagado = mensualidadesFiltradas
      .filter(m => m.estado_pago === "Pagado")
      .reduce((sum, m) => sum + m.monto, 0);
    const totalPendiente = mensualidadesFiltradas
      .filter(m => m.estado_pago === "Pendiente")
      .reduce((sum, m) => sum + m.monto, 0);

    return { total, pagadas, pendientes, totalPagado, totalPendiente };
  };

  const getMesNumero = (mesNombre: string) => {
    const meses = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return meses.indexOf(mesNombre);
  };

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

  const handlePay = (mensualidad: Mensualidad) => {
    setSelectedPayment(mensualidad);
  };

  const handlePaymentSuccess = () => {
    setSelectedPayment(null);
    cargarMensualidades();
    Alert.alert(
      "Pago Procesado",
      "El pago está siendo verificado. Recibirás una confirmación por correo.",
      [{ text: "Entendido", style: "default" }]
    );
  };

  const estadisticas = calcularEstadisticas();

  const mensualidadesVencidas = mensualidades.filter(m =>
    m.estado_pago === "Pendiente" &&
    new Date(m.fecha_vencimiento) < new Date()
  );

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
      <SafeLayout>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.apoderado} />
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
          greeting="Mensualidades"
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
            <Text style={styles.statNumber}>{estadisticas.pagadas}</Text>
            <Text style={styles.statLabel}>Pagadas</Text>
          </View>
          <View style={[styles.statCard, styles.statWarning]}>
            <Text style={styles.statNumber}>{estadisticas.pendientes}</Text>
            <Text style={styles.statLabel}>Pendientes</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {formatearMonto(estadisticas.totalPendiente)}
            </Text>
            <Text style={styles.statLabel}>Deuda Total</Text>
          </View>
        </View>

        {mensualidadesVencidas.length > 0 && (
          <View style={styles.alertContainer}>
            <View style={styles.alertCard}>
              <Ionicons name="warning" size={20} color="#D97706" />
              <View style={styles.alertContent}>
                <Text style={styles.alertTitle}>Mensualidades Vencidas</Text>
                <Text style={styles.alertText}>
                  Tienes {mensualidadesVencidas.length} mensualidad(es) vencida(s)
                </Text>
              </View>
            </View>
          </View>
        )}

        <View style={styles.mensualidadesList}>
          <View style={styles.listHeader}>
            <Text style={styles.listTitle}>Estado de Pagos</Text>
            <TouchableOpacity style={styles.refreshButton} onPress={cargarMensualidades}>
              <Ionicons name="refresh" size={16} color={colors.apoderado} />
            </TouchableOpacity>
          </View>

          {mensualidades
            .filter(mensualidad => {
              return mensualidad.anio_referencia === anioSeleccionado &&
                     getMesNumero(mensualidad.mes_referencia) === mesSeleccionado;
            })
            .map((mensualidad) => (
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
                    <TouchableOpacity
                      style={styles.payButton}
                      onPress={() => handlePay(mensualidad)}
                    >
                      <Ionicons name="card" size={16} color="#FFFFFF" />
                      <Text style={styles.payButtonText}>PAGAR AHORA</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))}

          {mensualidades
            .filter(mensualidad => {
              return mensualidad.anio_referencia === anioSeleccionado &&
                     getMesNumero(mensualidad.mes_referencia) === mesSeleccionado;
            })
            .length === 0 && (
            <View style={styles.emptyContainer}>
              <Ionicons name="card-outline" size={48} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>No hay mensualidades</Text>
              <Text style={styles.emptyDescription}>
                No se encontraron registros de mensualidades para {meses[mesSeleccionado].toLowerCase()} {anioSeleccionado}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeLayout>
  );
}

interface PaymentMethod {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
}

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
    <View style={paymentStyles.paymentMethodContainer}>
      <View style={paymentStyles.paymentMethodHeader}>
        <TouchableOpacity style={paymentStyles.backButton} onPress={onBack}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={paymentStyles.paymentMethodTitle}>Método de Pago</Text>
        <View style={paymentStyles.placeholder} />
      </View>

      <View style={paymentStyles.paymentSummary}>
        <Text style={paymentStyles.paymentSummaryTitle}>Resumen del Pago</Text>
        <View style={paymentStyles.paymentDetails}>
          <Text style={paymentStyles.paymentDescription}>
            Mensualidad {mensualidad.mes_referencia} {mensualidad.anio_referencia}
          </Text>
          <Text style={paymentStyles.paymentAmount}>
            {formatearMonto(mensualidad.monto)}
          </Text>
        </View>
      </View>

      <ScrollView style={paymentStyles.methodsList}>
        <Text style={paymentStyles.methodsTitle}>Selecciona tu método de pago</Text>
        {paymentMethods.map((method) => (
          <TouchableOpacity
            key={method.id}
            style={paymentStyles.methodCard}
            onPress={() => handlePayment(method)}
          >
            <View
              style={[
                paymentStyles.methodIcon,
                { backgroundColor: method.color + "15" },
              ]}
            >
              <Ionicons
                name={method.icon as any}
                size={24}
                color={method.color}
              />
            </View>
            <View style={paymentStyles.methodInfo}>
              <Text style={paymentStyles.methodName}>{method.name}</Text>
              <Text style={paymentStyles.methodDescription}>{method.description}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={paymentStyles.securityNotice}>
        <Ionicons name="shield-checkmark" size={24} color="#10B981" />
        <Text style={paymentStyles.securityText}>
          Tus pagos están protegidos 🤝
        </Text>
      </View>
    </View>
  );
};

const paymentStyles = StyleSheet.create({
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
  contactButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.apoderado,
    padding: 12,
    borderRadius: 8,
    gap: 8,
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
  payButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  contactButtonText: {
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
