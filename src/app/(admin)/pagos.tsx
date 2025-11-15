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
  Modal,
  TextInput,
} from "react-native";
import { useAuth } from "../../core/auth/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../core/supabase/supabaseClient";
import SafeLayout from "../../shared/components/SafeLayout";
import { colors } from "../../shared/constants/theme";

const { width } = Dimensions.get("window");

interface Pago {
  id_mensualidad: string;
  monto: number;
  estado_pago: string;
  fecha_vencimiento: string;
  fecha_pago: string | null;
  metodo_pago?: string;
  mes_referencia: string;
  anio_referencia: number;
  jugador?: {
    nombre: string;
    apellido: string;
    correo: string;
  };
}

interface MesResumen {
  mes: string;
  anio: number;
  totalPagos: number;
  pagados: number;
  pendientes: number;
  totalMonto: number;
  montoRecaudado: number;
  pagos: Pago[];
}

interface Usuario {
  id_usuario: string;
  nombre: string;
  apellido: string;
  correo: string;
  rol: string;
}

export default function GestionPagosScreen() {
  const { user } = useAuth();
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [mesesResumen, setMesesResumen] = useState<MesResumen[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [mesSeleccionado, setMesSeleccionado] = useState<MesResumen | null>(null);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Pago | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("");
  const [cargoModalVisible, setCargoModalVisible] = useState(false);
  const [selectedJugador, setSelectedJugador] = useState<Usuario | null>(null);
  const [cargoMonto, setCargoMonto] = useState<string>("");
  const [cargoDescripcion, setCargoDescripcion] = useState<string>("");
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);

  const paymentMethods = [
    { id: "efectivo", label: "Efectivo", icon: "cash", color: "#16A34A" },
    { id: "transferencia", label: "Transferencia", icon: "swap-horizontal", color: "#0284C7" },
    { id: "tarjeta", label: "Tarjeta", icon: "card", color: "#9333EA" },
    { id: "cheque", label: "Cheque", icon: "document-text", color: "#D97706" },
    { id: "otro", label: "Otro", icon: "ellipsis-horizontal", color: "#6B7280" },
  ];

  const cargarPagos = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("Mensualidad")
        .select("*")
        .order("fecha_vencimiento", { ascending: false });

      if (error) throw error;

      // Obtener información de usuarios para cada mensualidad
      const pagosConUsuario = await Promise.all(
        (data || []).map(async (pago) => {
          const { data: usuario, error: errorUsuario } = await supabase
            .from("Usuarios")
            .select("nombre, apellido, correo")
            .eq("id_usuario", pago.id_jugador)
            .single();

          return {
            ...pago,
            jugador: usuario || { nombre: "Usuario", apellido: "Desconocido", correo: "" }
          };
        })
      );

      setPagos(pagosConUsuario);
    } catch (error) {
      console.error("Error cargando pagos:", error);
      Alert.alert("Error", "No se pudieron cargar los pagos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarPagos();
    cargarUsuarios();
  }, []);

  const cargarUsuarios = async () => {
    try {
      const { data, error } = await supabase
        .from("Usuarios")
        .select("id_usuario, nombre, apellido, correo, rol")
        .eq("rol", "jugador");

      if (error) throw error;
      setUsuarios(data || []);
    } catch (error) {
      console.error("Error cargando usuarios:", error);
    }
  };

  useEffect(() => {
    // Obtener años disponibles
    const years = [...new Set(pagos.map(p => p.anio_referencia))].sort((a, b) => b - a);
    setAvailableYears(years);

    // Agrupar pagos por mes y año
    const agrupados = pagos.reduce((acc, pago) => {
      const key = `${pago.mes_referencia}-${pago.anio_referencia}`;
      if (!acc[key]) {
        acc[key] = {
          mes: pago.mes_referencia,
          anio: pago.anio_referencia,
          pagos: [],
        };
      }
      acc[key].pagos.push(pago);
      return acc;
    }, {} as Record<string, { mes: string; anio: number; pagos: Pago[] }>);

    const resumenes: MesResumen[] = Object.values(agrupados).map((grupo) => {
      const totalPagos = grupo.pagos.length;
      const pagados = grupo.pagos.filter(p => p.estado_pago === "Pagado").length;
      const pendientes = grupo.pagos.filter(p => p.estado_pago === "Pendiente").length;
      const totalMonto = grupo.pagos.reduce((sum, p) => sum + p.monto, 0);
      const montoRecaudado = grupo.pagos
        .filter(p => p.estado_pago === "Pagado")
        .reduce((sum, p) => sum + p.monto, 0);

      return {
        mes: grupo.mes,
        anio: grupo.anio,
        totalPagos,
        pagados,
        pendientes,
        totalMonto,
        montoRecaudado,
        pagos: grupo.pagos,
      };
    });

    // Ordenar por año descendente, luego por mes
    resumenes.sort((a, b) => {
      if (a.anio !== b.anio) return b.anio - a.anio;
      const meses = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
      return meses.indexOf(b.mes.toLowerCase()) - meses.indexOf(a.mes.toLowerCase());
    });

    setMesesResumen(resumenes);
  }, [pagos]);

  const marcarComoPagado = async (pago: Pago, metodoPago: string) => {
    try {
      // Usar consulta SQL directa para evitar problemas con triggers
      const { data, error } = await supabase
        .from('Mensualidad')
        .update({
          estado_pago: "Pagado",
          fecha_pago: new Date().toISOString(),
          metodo_pago: metodoPago,
        })
        .eq('id_mensualidad', pago.id_mensualidad)
        .select();

      if (error) {
        console.error("Error en actualización:", error);
        throw error;
      }

      console.log("Actualización exitosa:", data);
      Alert.alert("Éxito", `Pago marcado como realizado (${metodoPago})`);
      cargarPagos();
      setPaymentModalVisible(false);
      setSelectedPayment(null);
      setSelectedPaymentMethod("");
    } catch (error) {
      console.error("Error marcando pago:", error);
      Alert.alert("Error", "No se pudo marcar el pago");
    }
  };

  const abrirModalPago = (pago: Pago) => {
    setSelectedPayment(pago);
    setSelectedPaymentMethod("");
    setPaymentModalVisible(true);
  };

  const crearCargo = async () => {
    if (!selectedJugador || !cargoMonto || !cargoDescripcion) {
      Alert.alert("Error", "Por favor complete todos los campos");
      return;
    }

    const monto = parseFloat(cargoMonto);
    if (isNaN(monto) || monto <= 0) {
      Alert.alert("Error", "El monto debe ser un número válido mayor a 0");
      return;
    }

    try {
      const fechaVencimiento = new Date();
      fechaVencimiento.setDate(fechaVencimiento.getDate() + 30); // Vence en 30 días

      const { error } = await supabase
        .from("Mensualidad")
        .insert({
          id_jugador: selectedJugador.id_usuario,
          monto: monto,
          estado_pago: "Pendiente",
          fecha_vencimiento: fechaVencimiento.toISOString(),
          mes_referencia: new Date().toLocaleString("es-ES", { month: "long" }),
          anio_referencia: new Date().getFullYear(),
          descripcion: cargoDescripcion,
        });

      if (error) throw error;

      Alert.alert("Éxito", `Cargo creado exitosamente para ${selectedJugador.nombre} ${selectedJugador.apellido}`);
      setCargoModalVisible(false);
      setSelectedJugador(null);
      setCargoMonto("");
      setCargoDescripcion("");
      cargarPagos();
    } catch (error) {
      console.error("Error creando cargo:", error);
      Alert.alert("Error", "No se pudo crear el cargo");
    }
  };

  const calcularEstadisticasAnio = () => {
    const pagosAnio = pagos.filter(p => p.anio_referencia === selectedYear);
    const total = pagosAnio.length;
    const pagados = pagosAnio.filter(p => p.estado_pago === "Pagado").length;
    const pendientes = pagosAnio.filter(p => p.estado_pago === "Pendiente").length;
    const totalRecaudado = pagosAnio
      .filter(p => p.estado_pago === "Pagado")
      .reduce((sum, p) => sum + p.monto, 0);

    return { total, pagados, pendientes, totalRecaudado };
  };

  const estadisticas = calcularEstadisticasAnio();

  // Filtrar meses por año seleccionado
  const mesesFiltrados = mesesResumen.filter(mes => mes.anio === selectedYear);

  const formatearMonto = (monto: number) => {
    return `$${monto.toLocaleString("es-CL")}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const obtenerNombreMes = (mes: string | number) => {
    // Si es un número, convertir a nombre de mes
    if (typeof mes === 'number') {
      const meses = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
      return meses[mes - 1] || mes.toString();
    }
    // Si ya es string, devolver tal cual (asumiendo que ya está en formato nombre)
    return mes;
  };

  const renderPago = ({ item }: { item: Pago }) => (
    <View style={styles.pagoCard}>
      <View style={styles.pagoHeader}>
        <View style={styles.jugadorInfo}>
          <Text style={styles.jugadorName}>
            {item.jugador?.nombre} {item.jugador?.apellido}
          </Text>
          <Text style={styles.jugadorEmail}>{item.jugador?.correo}</Text>
        </View>
        <View style={[styles.estadoBadge, {
          backgroundColor: item.estado_pago === "Pagado" ? "#059669" : "#D97706"
        }]}>
          <Text style={styles.estadoText}>{item.estado_pago}</Text>
        </View>
      </View>

      <View style={styles.pagoContent}>
        <View style={styles.pagoInfo}>
          <Text style={styles.montoText}>{formatearMonto(item.monto)}</Text>
          <Text style={styles.periodoText}>
            {item.mes_referencia} {item.anio_referencia}
          </Text>
        </View>

        <View style={styles.fechasInfo}>
          <View style={styles.fechaItem}>
            <Ionicons name="calendar" size={14} color="#6B7280" />
            <Text style={styles.fechaText}>
              Vence: {formatDate(item.fecha_vencimiento)}
            </Text>
          </View>
          {item.fecha_pago && (
            <View style={styles.fechaItem}>
              <Ionicons name="checkmark-circle" size={14} color="#059669" />
              <Text style={styles.fechaText}>
                Pagado: {formatDate(item.fecha_pago)}
              </Text>
            </View>
          )}
        </View>
      </View>

      {item.estado_pago === "Pendiente" && (
        <TouchableOpacity
          style={styles.pagarButton}
          onPress={() => abrirModalPago(item)}
        >
          <Ionicons name="card" size={16} color="#FFFFFF" />
          <Text style={styles.pagarButtonText}>Marcar como Pagado</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (loading) {
    return (
      <SafeLayout>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Cargando pagos...</Text>
        </View>
      </SafeLayout>
    );
  }

  return (
    <SafeLayout>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header Section */}
        <View style={styles.headerSection}>
          <View style={styles.header}>
            <View style={styles.titleContainer}>
              <Ionicons name="card" size={28} color="#3B82F6" />
              <View>
                <Text style={styles.title}>Gestión de Pagos</Text>
                <Text style={styles.subtitle}>
                  Administra todos los pagos y mensualidades del sistema
                </Text>
              </View>
            </View>
          </View>

          {/* Year Filter */}
          <View style={styles.yearFilterSection}>
            <Text style={styles.yearFilterTitle}>Año seleccionado: {selectedYear}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.yearFilters}>
              {availableYears.map((year) => (
                <TouchableOpacity
                  key={year}
                  style={[
                    styles.yearFilter,
                    selectedYear === year && styles.yearFilterActive
                  ]}
                  onPress={() => setSelectedYear(year)}
                >
                  <Text style={[
                    styles.yearFilterText,
                    selectedYear === year && styles.yearFilterTextActive
                  ]}>
                    {year}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Quick Stats */}
          <View style={styles.quickStats}>
            {/* Primera fila: Total y Recaudado */}
            <View style={styles.quickStatsRow}>
              <View style={[styles.quickStatCard, { backgroundColor: '#E0F2FE' }]}>
                <Ionicons name="document-text" size={24} color="#0284C7" />
                <Text style={[styles.quickStatNumber, { color: '#0284C7' }]}>{estadisticas.total}</Text>
                <Text style={[styles.quickStatLabel, { color: '#0369A1' }]}>Total este año</Text>
              </View>
              <View style={[styles.quickStatCard, { backgroundColor: '#F3E8FF' }]}>
                <Ionicons name="cash" size={24} color="#9333EA" />
                <Text style={[styles.quickStatNumber, { color: '#9333EA' }]}>{formatearMonto(estadisticas.totalRecaudado)}</Text>
                <Text style={[styles.quickStatLabel, { color: '#7C3AED' }]}>Recaudado este año</Text>
              </View>
            </View>

            {/* Segunda fila: Pagados y Pendientes */}
            <View style={styles.quickStatsRow}>
              <View style={[styles.quickStatCard, { backgroundColor: '#DCFCE7' }]}>
                <Ionicons name="checkmark-circle" size={24} color="#16A34A" />
                <Text style={[styles.quickStatNumber, { color: '#16A34A' }]}>{estadisticas.pagados}</Text>
                <Text style={[styles.quickStatLabel, { color: '#15803D' }]}>Pagados</Text>
              </View>
              <View style={[styles.quickStatCard, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="time" size={24} color="#D97706" />
                <Text style={[styles.quickStatNumber, { color: '#D97706' }]}>{estadisticas.pendientes}</Text>
                <Text style={[styles.quickStatLabel, { color: '#B45309' }]}>Pendientes</Text>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => setCargoModalVisible(true)}
            >
              <Ionicons name="add-circle" size={20} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Generar Cargo</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Months List */}
        <View style={styles.mesesSection}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <Ionicons name="calendar" size={20} color={colors.primary} />
              <Text style={styles.sectionTitle}>
                Mensualidades por Mes ({mesesFiltrados.length})
              </Text>
            </View>
            <TouchableOpacity style={styles.refreshButton} onPress={cargarPagos}>
              <Ionicons name="refresh" size={16} color={colors.primary} />
            </TouchableOpacity>
          </View>

          {mesesFiltrados.map((mes) => (
            <TouchableOpacity
              key={`${mes.mes}-${mes.anio}`}
              style={styles.mesCard}
              onPress={() => {
                setMesSeleccionado(mes);
                setModalVisible(true);
              }}
            >
              <View style={styles.mesHeader}>
                <View style={styles.mesInfo}>
                  <Text style={styles.mesTitle}>
                    {obtenerNombreMes(mes.mes)} {mes.anio}
                  </Text>
                  <Text style={styles.mesSubtitle}>
                    {mes.totalPagos} mensualidades
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#6B7280" />
              </View>

              <View style={styles.mesStats}>
                <View style={styles.mesStat}>
                  <Text style={styles.mesStatNumber}>{mes.pagados}</Text>
                  <Text style={styles.mesStatLabel}>Pagados</Text>
                </View>
                <View style={styles.mesStat}>
                  <Text style={styles.mesStatNumber}>{mes.pendientes}</Text>
                  <Text style={styles.mesStatLabel}>Pendientes</Text>
                </View>
                <View style={styles.mesStat}>
                  <Text style={styles.mesStatNumber}>
                    {formatearMonto(mes.montoRecaudado)}
                  </Text>
                  <Text style={styles.mesStatLabel}>Recaudado</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}

          {mesesFiltrados.length === 0 && (
            <View style={styles.emptyContainer}>
              <Ionicons name="calendar-outline" size={48} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>No hay mensualidades</Text>
              <Text style={styles.emptyDescription}>
                No se encontraron registros de mensualidades
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Modal de detalles del mes */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <View style={styles.modalTitleContainer}>
                  <Text style={styles.modalTitle}>
                    {mesSeleccionado ? `${obtenerNombreMes(mesSeleccionado.mes)} ${mesSeleccionado.anio}` : ""}
                  </Text>
                  <Text style={styles.modalSubtitle}>
                    Detalles de mensualidades
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setModalVisible(false)}
                >
                  <Ionicons name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                {mesSeleccionado && (
                  <>
                    <View style={styles.mesStatsModal}>
                      {/* Primera fila: Total y Recaudado */}
                      <View style={styles.mesStatsRow}>
                        <View style={[styles.mesStatModal, { backgroundColor: '#E0F2FE' }]}>
                          <Ionicons name="document-text" size={20} color="#0284C7" />
                          <Text style={[styles.mesStatNumberModal, { color: '#0284C7' }]}>{mesSeleccionado.totalPagos}</Text>
                          <Text style={[styles.mesStatLabelModal, { color: '#0369A1' }]}>Total</Text>
                        </View>
                        <View style={[styles.mesStatModal, { backgroundColor: '#F3E8FF' }]}>
                          <Ionicons name="cash" size={20} color="#9333EA" />
                          <Text style={[styles.mesStatNumberModal, { color: '#9333EA' }]}>
                            {formatearMonto(mesSeleccionado.montoRecaudado)}
                          </Text>
                          <Text style={[styles.mesStatLabelModal, { color: '#7C3AED' }]}>Recaudado</Text>
                        </View>
                      </View>

                      {/* Segunda fila: Pagados y Pendientes */}
                      <View style={styles.mesStatsRow}>
                        <View style={[styles.mesStatModal, { backgroundColor: '#DCFCE7' }]}>
                          <Ionicons name="checkmark-circle" size={20} color="#16A34A" />
                          <Text style={[styles.mesStatNumberModal, { color: '#16A34A' }]}>{mesSeleccionado.pagados}</Text>
                          <Text style={[styles.mesStatLabelModal, { color: '#15803D' }]}>Pagados</Text>
                        </View>
                        <View style={[styles.mesStatModal, { backgroundColor: '#FEF3C7' }]}>
                          <Ionicons name="time" size={20} color="#D97706" />
                          <Text style={[styles.mesStatNumberModal, { color: '#D97706' }]}>{mesSeleccionado.pendientes}</Text>
                          <Text style={[styles.mesStatLabelModal, { color: '#B45309' }]}>Pendientes</Text>
                        </View>
                      </View>
                    </View>

                    <View style={styles.pagosSection}>
                      <Text style={styles.sectionTitle}>Mensualidades</Text>
                      {mesSeleccionado.pagos.map((pago) => (
                        <View key={pago.id_mensualidad} style={styles.pagoCard}>
                          <View style={styles.pagoHeader}>
                            <View style={styles.jugadorInfo}>
                              <Text style={styles.jugadorName}>
                                {pago.jugador?.nombre} {pago.jugador?.apellido}
                              </Text>
                              <Text style={styles.jugadorEmail}>{pago.jugador?.correo}</Text>
                            </View>
                            <View style={[styles.estadoBadge, {
                              backgroundColor: pago.estado_pago === "Pagado" ? "#059669" : "#D97706"
                            }]}>
                              <Text style={styles.estadoText}>{pago.estado_pago}</Text>
                            </View>
                          </View>

                          <View style={styles.pagoContent}>
                            <View style={styles.pagoInfo}>
                              <Text style={styles.montoText}>{formatearMonto(pago.monto)}</Text>
                              <Text style={styles.periodoText}>
                                {obtenerNombreMes(pago.mes_referencia)} {pago.anio_referencia}
                              </Text>
                            </View>

                            <View style={styles.fechasInfo}>
                              <View style={styles.fechaItem}>
                                <Ionicons name="calendar" size={14} color="#6B7280" />
                                <Text style={styles.fechaText}>
                                  Vence: {formatDate(pago.fecha_vencimiento)}
                                </Text>
                              </View>
                              {pago.fecha_pago && (
                                <View style={styles.fechaItem}>
                                  <Ionicons name="checkmark-circle" size={14} color="#059669" />
                                  <Text style={styles.fechaText}>
                                    Pagado: {formatDate(pago.fecha_pago)}
                                  </Text>
                                </View>
                              )}
                            </View>
                          </View>

                          {pago.estado_pago === "Pendiente" && (
                            <TouchableOpacity
                              style={styles.pagarButton}
                              onPress={() => {
                                abrirModalPago(pago);
                              }}
                            >
                              <Ionicons name="card" size={16} color="#FFFFFF" />
                              <Text style={styles.pagarButtonText}>Marcar como Pagado</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      ))}
                    </View>
                  </>
                )}
              </ScrollView>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de selección de método de pago */}
      <Modal
        visible={paymentModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setPaymentModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.paymentModalContainer}>
            <View style={styles.paymentModalContent}>
              <View style={styles.paymentModalHeader}>
                <Text style={styles.paymentModalTitle}>Seleccionar Método de Pago</Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setPaymentModalVisible(false)}
                >
                  <Ionicons name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>

              <View style={styles.paymentModalBody}>
                {selectedPayment && (
                  <View style={styles.paymentInfo}>
                    <Text style={styles.paymentPlayerName}>
                      {selectedPayment.jugador?.nombre} {selectedPayment.jugador?.apellido}
                    </Text>
                    <Text style={styles.paymentAmount}>
                      {formatearMonto(selectedPayment.monto)}
                    </Text>
                    <Text style={styles.paymentPeriod}>
                      {obtenerNombreMes(selectedPayment.mes_referencia)} {selectedPayment.anio_referencia}
                    </Text>
                  </View>
                )}

                <Text style={styles.paymentMethodsTitle}>Método de pago:</Text>
                <View style={styles.paymentMethodsGrid}>
                  {paymentMethods.map((method) => (
                    <TouchableOpacity
                      key={method.id}
                      style={[
                        styles.paymentMethodCard,
                        selectedPaymentMethod === method.id && styles.paymentMethodCardSelected
                      ]}
                      onPress={() => setSelectedPaymentMethod(method.id)}
                    >
                      <Ionicons name={method.icon as any} size={24} color={selectedPaymentMethod === method.id ? "#FFFFFF" : method.color} />
                      <Text style={[
                        styles.paymentMethodLabel,
                        selectedPaymentMethod === method.id && styles.paymentMethodLabelSelected
                      ]}>
                        {method.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <TouchableOpacity
                  style={[
                    styles.confirmPaymentButton,
                    !selectedPaymentMethod && styles.confirmPaymentButtonDisabled
                  ]}
                  onPress={() => {
                    if (selectedPayment && selectedPaymentMethod) {
                      const methodLabel = paymentMethods.find(m => m.id === selectedPaymentMethod)?.label || selectedPaymentMethod;
                      marcarComoPagado(selectedPayment, methodLabel);
                    }
                  }}
                  disabled={!selectedPaymentMethod}
                >
                  <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                  <Text style={styles.confirmPaymentButtonText}>
                    Confirmar Pago ({selectedPaymentMethod ? paymentMethods.find(m => m.id === selectedPaymentMethod)?.label : ""})
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de generar cargo */}
      <Modal
        visible={cargoModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setCargoModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.cargoModalContainer}>
            <View style={styles.cargoModalContent}>
              <View style={styles.cargoModalHeader}>
                <Text style={styles.cargoModalTitle}>Generar Cargo Adicional</Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setCargoModalVisible(false)}
                >
                  <Ionicons name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.cargoModalBody} showsVerticalScrollIndicator={false}>
                <Text style={styles.cargoModalSubtitle}>
                  Crea un cargo adicional para cualquier jugador
                </Text>

                <View style={styles.cargoForm}>
                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Seleccionar Jugador</Text>
                    <ScrollView style={styles.jugadoresList} showsVerticalScrollIndicator={false}>
                      {usuarios.map((usuario) => (
                        <TouchableOpacity
                          key={usuario.id_usuario}
                          style={[
                            styles.jugadorOption,
                            selectedJugador?.id_usuario === usuario.id_usuario && styles.jugadorOptionSelected
                          ]}
                          onPress={() => setSelectedJugador(usuario)}
                        >
                          <View style={styles.jugadorOptionContent}>
                            <Text style={styles.jugadorOptionName}>
                              {usuario.nombre} {usuario.apellido}
                            </Text>
                            <Text style={styles.jugadorOptionEmail}>{usuario.correo}</Text>
                          </View>
                          {selectedJugador?.id_usuario === usuario.id_usuario && (
                            <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                          )}
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Monto del Cargo</Text>
                    <TextInput
                      style={styles.montoInput}
                      placeholder="Ej: 15000"
                      value={cargoMonto}
                      onChangeText={setCargoMonto}
                      keyboardType="numeric"
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Descripción del Cargo</Text>
                    <TextInput
                      style={styles.descripcionInput}
                      placeholder="Ej: Material deportivo, Torneo, etc."
                      value={cargoDescripcion}
                      onChangeText={setCargoDescripcion}
                      multiline
                      numberOfLines={3}
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>
                </View>

                <TouchableOpacity
                  style={[
                    styles.crearCargoButton,
                    (!selectedJugador || !cargoMonto || !cargoDescripcion) && styles.crearCargoButtonDisabled
                  ]}
                  onPress={crearCargo}
                  disabled={!selectedJugador || !cargoMonto || !cargoDescripcion}
                >
                  <Ionicons name="add-circle" size={20} color="#FFFFFF" />
                  <Text style={styles.crearCargoButtonText}>Crear Cargo</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </View>
      </Modal>
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
  // Header Section
  headerSection: {
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  header: {
    padding: 20,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#1F2937",
  },
  subtitle: {
    fontSize: 16,
    color: "#6B7280",
  },
  quickStats: {
    flexDirection: "column",
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 12,
  },
  quickStatsRow: {
    flexDirection: "row",
    gap: 12,
  },
  quickStatCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  quickStatNumber: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1F2937",
    marginBottom: 4,
  },
  quickStatLabel: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
  },
  // Year Filter Section
  yearFilterSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#F8FAFC",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  yearFilterTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 12,
  },
  yearFilters: {
    flexDirection: "row",
  },
  yearFilter: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    backgroundColor: "#FFFFFF",
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  yearFilterActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  yearFilterText: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },
  yearFilterTextActive: {
    color: "#FFFFFF",
  },
  // Months Section
  mesesSection: {
    flex: 1,
    padding: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  sectionTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
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
  mesesList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  mesCard: {
    backgroundColor: colors.background,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  mesHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  mesInfo: {
    flex: 1,
  },
  mesTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 4,
  },
  mesSubtitle: {
    fontSize: 14,
    color: "#6B7280",
  },
  mesStats: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  mesStat: {
    alignItems: "center",
    flex: 1,
  },
  mesStatNumber: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1F2937",
    marginBottom: 2,
  },
  mesStatLabel: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
  },
  pagosList: {
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
  pagoCard: {
    backgroundColor: colors.background,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  pagoHeader: {
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
  jugadorEmail: {
    fontSize: 14,
    color: "#6B7280",
  },
  estadoBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  estadoText: {
    fontSize: 12,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  pagoContent: {
    marginBottom: 12,
  },
  pagoInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  montoText: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1F2937",
  },
  periodoText: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "600",
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
  pagarButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  pagarButtonText: {
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "95%",
    minHeight: "90%",
  },
  modalHeader: {
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  modalTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1F2937",
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 2,
  },
  closeButton: {
    position: "absolute",
    top: 24,
    right: 24,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBody: {
    flex: 1,
    padding: 24,
  },
  mesStatsModal: {
    flexDirection: "column",
    paddingHorizontal: 0,
    marginBottom: 20,
    gap: 12,
  },
  mesStatsRow: {
    flexDirection: "row",
    gap: 12,
  },
  mesStatModal: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  mesStatNumberModal: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1F2937",
    marginBottom: 4,
  },
  mesStatLabelModal: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
  },
  pagosSection: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 16,
  },
  // Payment Modal Styles
  paymentModalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  paymentModalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    width: "100%",
    maxWidth: 400,
    maxHeight: "80%",
  },
  paymentModalHeader: {
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    alignItems: "center",
  },
  paymentModalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1F2937",
  },
  paymentModalBody: {
    padding: 24,
  },
  paymentInfo: {
    alignItems: "center",
    marginBottom: 24,
    padding: 16,
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
  },
  paymentPlayerName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 8,
  },
  paymentAmount: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.primary,
    marginBottom: 4,
  },
  paymentPeriod: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },
  paymentMethodsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 16,
  },
  paymentMethodsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 24,
  },
  paymentMethodCard: {
    flex: 1,
    minWidth: (width - 80) / 2 - 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    gap: 8,
  },
  paymentMethodCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  paymentMethodLabel: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
    textAlign: "center",
  },
  paymentMethodLabelSelected: {
    color: "#FFFFFF",
  },
  confirmPaymentButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  confirmPaymentButtonDisabled: {
    backgroundColor: "#D1D5DB",
  },
  confirmPaymentButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  // Action Buttons
  actionButtons: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  // Cargo Modal Styles
  cargoModalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  cargoModalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    width: "100%",
    maxWidth: 500,
    maxHeight: "90%",
  },
  cargoModalHeader: {
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    alignItems: "center",
  },
  cargoModalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1F2937",
  },
  cargoModalBody: {
    padding: 24,
  },
  cargoModalSubtitle: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 24,
  },
  cargoForm: {
    marginBottom: 24,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  jugadoresList: {
    maxHeight: 200,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
  },
  jugadorOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  jugadorOptionSelected: {
    backgroundColor: "#EEF2FF",
  },
  jugadorOptionContent: {
    flex: 1,
  },
  jugadorOptionName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 4,
  },
  jugadorOptionEmail: {
    fontSize: 14,
    color: "#6B7280",
  },
  montoInput: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    color: "#1F2937",
  },
  descripcionInput: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    color: "#1F2937",
    textAlignVertical: "top",
    minHeight: 80,
  },
  crearCargoButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  crearCargoButtonDisabled: {
    backgroundColor: "#D1D5DB",
  },
  crearCargoButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
