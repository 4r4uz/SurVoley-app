import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../types/use.auth";
import { supabase } from "../../supabase/supabaseClient";
import { StatsCard } from "../../components/StatsCard";
import { Modal as CustomModal } from "../../components/Modal";
import { formatDateShort, formatearMonto } from "../../utils/dateHelpers";
import { colors, spacing, borderRadius, shadows, typography } from "../../constants/theme";

interface Pago {
  id_pago: string;
  id_mensualidad: string;
  id_jugador: string;
  monto: number;
  fecha_pago: string;
  metodo_pago: string;
  estado_pago: string;
  observaciones?: string;
  jugador?: {
    nombre: string;
    apellido: string;
  };
  mensualidad?: {
    mes_referencia: string;
    anio_referencia: number;
    monto: number;
  };
}

interface Filtros {
  estado: string;
  metodo: string;
  busqueda: string;
  fechaDesde?: string;
  fechaHasta?: string;
}

interface FormularioPago {
  id_mensualidad: string;
  monto: number;
  fecha_pago: string;
  metodo_pago: string;
  observaciones: string;
}

export default function GestionPagosScreen() {
  const { user } = useAuth();
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [pagosFiltrados, setPagosFiltrados] = useState<Pago[]>([]);
  const [mensualidadesPendientes, setMensualidadesPendientes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filtros, setFiltros] = useState<Filtros>({
    estado: 'todos',
    metodo: 'todos',
    busqueda: '',
  });
  const [modalVisible, setModalVisible] = useState(false);
  const [modalNuevoPago, setModalNuevoPago] = useState(false);
  const [pagoSeleccionado, setPagoSeleccionado] = useState<Pago | null>(null);
  const [editando, setEditando] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const [formulario, setFormulario] = useState<FormularioPago>({
    id_mensualidad: '',
    monto: 0,
    fecha_pago: new Date().toISOString().split('T')[0],
    metodo_pago: 'Efectivo',
    observaciones: '',
  });

  const stats = useMemo(() => {
    const total = pagos.length;
    const pagados = pagos.filter(p => p.estado_pago === 'Pagado').length;
    const pendientes = pagos.filter(p => p.estado_pago === 'Pendiente').length;
    const totalRecaudado = pagos
      .filter(p => p.estado_pago === 'Pagado')
      .reduce((sum, p) => sum + p.monto, 0);
    const pendienteRecaudar = pagos
      .filter(p => p.estado_pago === 'Pendiente')
      .reduce((sum, p) => sum + p.monto, 0);

    return { total, pagados, pendientes, totalRecaudado, pendienteRecaudar };
  }, [pagos]);

  const cargarPagos = useCallback(async () => {
    try {
      setLoading(true);

      const { data: pagosData, error } = await supabase
        .from('Pago')
        .select(`
          *,
          Mensualidad(id_mensualidad, mes_referencia, anio_referencia, monto, id_jugador),
          Mensualidad!inner(id_jugador, Jugador(id_jugador, nombre, apellido))
        `)
        .order('fecha_pago', { ascending: false })
        .limit(100);

      if (error) throw error;

      const pagosConInfo = (pagosData || []).map((pago: any) => ({
        ...pago,
        mensualidad: pago.Mensualidad,
        jugador: pago.Mensualidad?.Jugador,
      }));

      setPagos(pagosConInfo);

      const { data: mensualidadesData } = await supabase
        .from('Mensualidad')
        .select(`
          *,
          Jugador(id_jugador, nombre, apellido)
        `)
        .eq('estado_pago', 'Pendiente')
        .order('fecha_vencimiento', { ascending: true })
        .limit(50);

      setMensualidadesPendientes(mensualidadesData || []);
    } catch (error) {
      console.error('Error cargando pagos:', error);
      Alert.alert('Error', 'No se pudieron cargar los pagos');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const aplicarFiltros = useCallback(() => {
    let filtrados = pagos;

    if (filtros.estado !== 'todos') {
      filtrados = filtrados.filter(p => p.estado_pago === filtros.estado);
    }

    if (filtros.metodo !== 'todos') {
      filtrados = filtrados.filter(p => p.metodo_pago === filtros.metodo);
    }

    if (filtros.busqueda) {
      const busquedaLower = filtros.busqueda.toLowerCase();
      filtrados = filtrados.filter(p =>
        p.jugador?.nombre?.toLowerCase().includes(busquedaLower) ||
        p.jugador?.apellido?.toLowerCase().includes(busquedaLower)
      );
    }

    setPagosFiltrados(filtrados);
  }, [pagos, filtros]);

  const guardarPago = async () => {
    if (!formulario.id_mensualidad || !formulario.monto || formulario.monto <= 0) {
      Alert.alert('Error', 'Complete todos los campos requeridos');
      return;
    }

    setGuardando(true);
    try {
      if (editando && pagoSeleccionado) {
        const { error } = await supabase
          .from('Pago')
          .update({
            monto: formulario.monto,
            fecha_pago: formulario.fecha_pago,
            metodo_pago: formulario.metodo_pago,
            observaciones: formulario.observaciones || null,
          })
          .eq('id_pago', pagoSeleccionado.id_pago);

        if (error) throw error;

        Alert.alert('Éxito', 'Pago actualizado correctamente');
        setModalVisible(false);
      } else {
        const { error: errorPago } = await supabase
          .from('Pago')
          .insert({
            id_mensualidad: formulario.id_mensualidad,
            monto: formulario.monto,
            fecha_pago: formulario.fecha_pago,
            metodo_pago: formulario.metodo_pago,
            observaciones: formulario.observaciones || null,
            estado_pago: 'Pagado',
          });

        if (errorPago) throw errorPago;

        const { error: errorMensualidad } = await supabase
          .from('Mensualidad')
          .update({
            estado_pago: 'Pagado',
            fecha_pago: formulario.fecha_pago,
            metodo_pago: formulario.metodo_pago,
          })
          .eq('id_mensualidad', formulario.id_mensualidad);

        if (errorMensualidad) throw errorMensualidad;

        Alert.alert('Éxito', 'Pago registrado correctamente');
        setModalNuevoPago(false);
      }
      cargarPagos();
    } catch (error: any) {
      console.error('Error guardando pago:', error);
      Alert.alert('Error', 'No se pudo guardar el pago');
    } finally {
      setGuardando(false);
    }
  };

  const eliminarPago = async (pago: Pago) => {
    Alert.alert(
      'Confirmar eliminación',
      `¿Estás seguro de eliminar este pago?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('Pago')
                .delete()
                .eq('id_pago', pago.id_pago);

              if (error) throw error;

              if (pago.id_mensualidad) {
                await supabase
                  .from('Mensualidad')
                  .update({ estado_pago: 'Pendiente', fecha_pago: null })
                  .eq('id_mensualidad', pago.id_mensualidad);
              }

              Alert.alert('Éxito', 'Pago eliminado correctamente');
              cargarPagos();
            } catch (error) {
              console.error('Error eliminando pago:', error);
              Alert.alert('Error', 'No se pudo eliminar el pago');
            }
          }
        }
      ]
    );
  };

  const abrirModalEdicion = (pago: Pago) => {
    setPagoSeleccionado(pago);
    setEditando(true);
    setFormulario({
      id_mensualidad: pago.id_mensualidad,
      monto: pago.monto,
      fecha_pago: pago.fecha_pago.split('T')[0],
      metodo_pago: pago.metodo_pago,
      observaciones: pago.observaciones || '',
    });
    setModalVisible(true);
  };

  const abrirModalNuevoPago = () => {
    setPagoSeleccionado(null);
    setEditando(false);
    setFormulario({
      id_mensualidad: '',
      monto: 0,
      fecha_pago: new Date().toISOString().split('T')[0],
      metodo_pago: 'Efectivo',
      observaciones: '',
    });
    setModalNuevoPago(true);
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    cargarPagos();
  }, [cargarPagos]);

  useEffect(() => {
    if (user) {
      cargarPagos();
    }
  }, [user, cargarPagos]);

  useEffect(() => {
    aplicarFiltros();
  }, [aplicarFiltros]);

  if (loading && pagos.length === 0) {
    return (
      <View style={styles.container}>
        <StatusBar backgroundColor={colors.primaryDark} barStyle="light-content" />
        <View style={styles.header}>
          <Text style={styles.welcome}>Gestión de Pagos</Text>
        </View>
        <View style={styles.loadingContent}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Cargando pagos...</Text>
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
            <Text style={styles.welcome}>Gestión de Pagos</Text>
            <Text style={styles.subtitle}>Administración de pagos y cuotas</Text>
          </View>
          <TouchableOpacity 
            style={styles.botonNuevo}
            onPress={abrirModalNuevoPago}
          >
            <Ionicons name="add" size={20} color={colors.text.inverse} />
            <Text style={styles.botonNuevoTexto}>Nuevo</Text>
          </TouchableOpacity>
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
              value={formatearMonto(stats.totalRecaudado)}
              label="Recaudado Mes"
              color={colors.jugador}
            />
            <StatsCard
              icon="alert-circle"
              value={formatearMonto(stats.pendienteRecaudar)}
              label="Pendiente"
              color={colors.error}
            />
            <StatsCard
              icon="document-text"
              value={stats.pagados.toString()}
              label="Pagados"
              color={colors.success}
            />
            <StatsCard
              icon="time"
              value={stats.pendientes.toString()}
              label="Pendientes"
              color={colors.warning}
            />
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.filtrosContainer}>
            <View style={styles.busquedaContainer}>
              <Ionicons name="search" size={20} color={colors.text.secondary} />
              <TextInput
                style={styles.busquedaInput}
                placeholder="Buscar por nombre..."
                value={filtros.busqueda}
                onChangeText={(text) => setFiltros(prev => ({ ...prev, busqueda: text }))}
                placeholderTextColor={colors.text.tertiary}
              />
            </View>

            <View style={styles.filtrosRow}>
              <View style={styles.filtroGroup}>
                <Text style={styles.filtroLabel}>Estado</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.filtrosChips}>
                    {['todos', 'Pagado', 'Pendiente'].map((estado) => (
                      <TouchableOpacity
                        key={estado}
                        style={[
                          styles.filtroChip,
                          filtros.estado === estado && styles.filtroChipActive
                        ]}
                        onPress={() => setFiltros(prev => ({ ...prev, estado }))}
                      >
                        <Text style={[
                          styles.filtroChipText,
                          filtros.estado === estado && styles.filtroChipTextActive
                        ]}>
                          {estado === 'todos' ? 'Todos' : estado}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>

              <View style={styles.filtroGroup}>
                <Text style={styles.filtroLabel}>Método</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.filtrosChips}>
                    {['todos', 'Efectivo', 'Transferencia', 'Otro'].map((metodo) => (
                      <TouchableOpacity
                        key={metodo}
                        style={[
                          styles.filtroChip,
                          filtros.metodo === metodo && styles.filtroChipActive
                        ]}
                        onPress={() => setFiltros(prev => ({ ...prev, metodo }))}
                      >
                        <Text style={[
                          styles.filtroChipText,
                          filtros.metodo === metodo && styles.filtroChipTextActive
                        ]}>
                          {metodo === 'todos' ? 'Todos' : metodo}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              Pagos ({pagosFiltrados.length})
            </Text>
          </View>

          {pagosFiltrados.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="cash-outline" size={48} color={colors.text.tertiary} />
              <Text style={styles.emptyTitle}>No se encontraron pagos</Text>
            </View>
          ) : (
            <View style={styles.pagosList}>
              {pagosFiltrados.map((pago) => (
                <View key={pago.id_pago} style={styles.pagoCard}>
                  <View style={styles.pagoHeader}>
                    <View style={styles.pagoInfo}>
                      <View style={styles.avatar}>
                        <Ionicons name="cash" size={24} color={colors.text.inverse} />
                      </View>
                      <View style={styles.pagoDetails}>
                        <Text style={styles.nombre}>
                          {pago.jugador?.nombre} {pago.jugador?.apellido}
                        </Text>
                        <Text style={styles.monto}>{formatearMonto(pago.monto)}</Text>
                        <Text style={styles.fecha}>
                          {formatDateShort(pago.fecha_pago)}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.estadoBadgeContainer}>
                      <View style={[
                        styles.estadoBadge,
                        { backgroundColor: pago.estado_pago === 'Pagado' ? colors.success : colors.warning }
                      ]}>
                        <Text style={styles.estadoText}>{pago.estado_pago}</Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.infoAdicional}>
                    <View style={styles.infoItem}>
                      <Ionicons name="card" size={14} color={colors.text.secondary} />
                      <Text style={styles.infoText}>{pago.metodo_pago}</Text>
                    </View>
                    {pago.mensualidad && (
                      <View style={styles.infoItem}>
                        <Ionicons name="calendar" size={14} color={colors.text.secondary} />
                        <Text style={styles.infoText}>
                          {pago.mensualidad.mes_referencia}/{pago.mensualidad.anio_referencia}
                        </Text>
                      </View>
                    )}
                  </View>
                  {pago.observaciones && (
                    <View style={styles.observacionesContainer}>
                      <Text style={styles.observacionesText}>{pago.observaciones}</Text>
                    </View>
                  )}
                  <View style={styles.pagoActions}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => abrirModalEdicion(pago)}
                    >
                      <Ionicons name="create-outline" size={18} color={colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => eliminarPago(pago)}
                    >
                      <Ionicons name="trash-outline" size={18} color={colors.error} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <CustomModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        title="Editar Pago"
      >
        <View style={styles.modalBody}>
            <View style={styles.campoContainer}>
              <Text style={styles.campoLabel}>Monto</Text>
              <TextInput
                style={styles.campoInput}
                value={formulario.monto.toString()}
                onChangeText={(text) => setFormulario(prev => ({ ...prev, monto: parseFloat(text) || 0 }))}
                keyboardType="numeric"
                placeholder="0"
              />
            </View>

            <View style={styles.campoContainer}>
              <Text style={styles.campoLabel}>Método de Pago</Text>
              <View style={styles.metodosGrid}>
                {['Efectivo', 'Transferencia', 'Otro'].map((metodo) => (
                  <TouchableOpacity
                    key={metodo}
                    style={[
                      styles.metodoOption,
                      formulario.metodo_pago === metodo && styles.metodoOptionActive
                    ]}
                    onPress={() => setFormulario(prev => ({ ...prev, metodo_pago: metodo }))}
                  >
                    <Text style={[
                      styles.metodoOptionText,
                      formulario.metodo_pago === metodo && styles.metodoOptionTextActive
                    ]}>
                      {metodo}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.campoContainer}>
              <Text style={styles.campoLabel}>Observaciones</Text>
              <TextInput
                style={[styles.campoInput, styles.campoTextArea]}
                value={formulario.observaciones}
                onChangeText={(text) => setFormulario(prev => ({ ...prev, observaciones: text }))}
                placeholder="Notas adicionales..."
                multiline
                numberOfLines={3}
                placeholderTextColor={colors.text.tertiary}
              />
            </View>
          </View>
        <View style={styles.botonesAccion}>
          <TouchableOpacity
            style={styles.botonCancelar}
            onPress={() => setModalVisible(false)}
          >
            <Text style={styles.botonCancelarTexto}>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.botonGuardar, guardando && styles.botonGuardarDisabled]}
            onPress={guardarPago}
            disabled={guardando}
          >
            {guardando ? (
              <ActivityIndicator size="small" color={colors.text.inverse} />
            ) : (
              <Text style={styles.botonGuardarTexto}>Guardar</Text>
            )}
          </TouchableOpacity>
        </View>
      </CustomModal>

      <CustomModal
        visible={modalNuevoPago}
        onClose={() => setModalNuevoPago(false)}
        title="Nuevo Pago"
      >
        <View style={styles.modalBody}>
            <View style={styles.campoContainer}>
              <Text style={styles.campoLabel}>Mensualidad</Text>
              <View style={styles.selector}>
                {mensualidadesPendientes.map((mensualidad) => (
                  <TouchableOpacity
                    key={mensualidad.id_mensualidad}
                    style={[
                      styles.opcionChip,
                      formulario.id_mensualidad === mensualidad.id_mensualidad && styles.opcionChipActive
                    ]}
                    onPress={() => setFormulario(prev => ({ 
                      ...prev, 
                      id_mensualidad: mensualidad.id_mensualidad,
                      monto: mensualidad.monto
                    }))}
                  >
                    <Text style={[
                      styles.opcionChipText,
                      formulario.id_mensualidad === mensualidad.id_mensualidad && styles.opcionChipTextActive
                    ]}>
                      {mensualidad.Jugador?.nombre} {mensualidad.Jugador?.apellido} - {formatearMonto(mensualidad.monto)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.campoContainer}>
              <Text style={styles.campoLabel}>Monto</Text>
              <TextInput
                style={styles.campoInput}
                value={formulario.monto.toString()}
                onChangeText={(text) => setFormulario(prev => ({ ...prev, monto: parseFloat(text) || 0 }))}
                keyboardType="numeric"
                placeholder="0"
              />
            </View>

            <View style={styles.campoContainer}>
              <Text style={styles.campoLabel}>Método de Pago</Text>
              <View style={styles.metodosGrid}>
                {['Efectivo', 'Transferencia', 'Otro'].map((metodo) => (
                  <TouchableOpacity
                    key={metodo}
                    style={[
                      styles.metodoOption,
                      formulario.metodo_pago === metodo && styles.metodoOptionActive
                    ]}
                    onPress={() => setFormulario(prev => ({ ...prev, metodo_pago: metodo }))}
                  >
                    <Text style={[
                      styles.metodoOptionText,
                      formulario.metodo_pago === metodo && styles.metodoOptionTextActive
                    ]}>
                      {metodo}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.campoContainer}>
              <Text style={styles.campoLabel}>Observaciones</Text>
              <TextInput
                style={[styles.campoInput, styles.campoTextArea]}
                value={formulario.observaciones}
                onChangeText={(text) => setFormulario(prev => ({ ...prev, observaciones: text }))}
                placeholder="Notas adicionales..."
                multiline
                numberOfLines={3}
                placeholderTextColor={colors.text.tertiary}
              />
            </View>
          </View>
        <View style={styles.botonesAccion}>
          <TouchableOpacity
            style={styles.botonCancelar}
            onPress={() => setModalNuevoPago(false)}
          >
            <Text style={styles.botonCancelarTexto}>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.botonGuardar, guardando && styles.botonGuardarDisabled]}
            onPress={guardarPago}
            disabled={guardando}
          >
            {guardando ? (
              <ActivityIndicator size="small" color={colors.text.inverse} />
            ) : (
              <Text style={styles.botonGuardarTexto}>Crear</Text>
            )}
          </TouchableOpacity>
        </View>
      </CustomModal>
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
    paddingHorizontal: spacing.xl,
    paddingTop: 25,
    paddingBottom: spacing.xl,
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
    ...typography.h1,
    fontSize: 24,
    color: colors.text.inverse,
    marginBottom: 4,
  },
  subtitle: {
    ...typography.body,
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
  },
  botonNuevo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.sm,
    gap: 6,
  },
  botonNuevoTexto: {
    color: colors.text.inverse,
    fontWeight: '600',
    fontSize: 14,
  },
  scrollContent: {
    flex: 1,
  },
  loadingContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xxl,
  },
  loadingText: {
    marginTop: spacing.lg,
    ...typography.body,
    color: colors.text.secondary,
  },
  section: {
    padding: spacing.lg,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.h3,
    fontSize: 18,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: spacing.lg,
  },
  filtrosContainer: {
    backgroundColor: colors.background,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    ...shadows.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  busquedaContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  busquedaInput: {
    flex: 1,
    marginLeft: spacing.sm,
    fontSize: 14,
    color: colors.text.primary,
  },
  filtrosRow: {
    gap: spacing.lg,
  },
  filtroGroup: {
    gap: spacing.sm,
  },
  filtroLabel: {
    ...typography.label,
    fontSize: 14,
  },
  filtrosChips: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  filtroChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filtroChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filtroChipText: {
    ...typography.label,
    fontSize: 12,
    color: colors.text.secondary,
  },
  filtroChipTextActive: {
    color: colors.text.inverse,
  },
  pagosList: {
    gap: spacing.md,
  },
  pagoCard: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    ...shadows.sm,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  pagoHeader: {
    padding: spacing.lg,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  pagoInfo: {
    flexDirection: "row",
    alignItems: "flex-start",
    flex: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.jugador,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.md,
  },
  pagoDetails: {
    flex: 1,
  },
  nombre: {
    ...typography.h3,
    fontSize: 16,
    marginBottom: 2,
  },
  monto: {
    ...typography.h3,
    fontSize: 18,
    color: colors.jugador,
    marginBottom: spacing.xs,
  },
  fecha: {
    ...typography.body,
    fontSize: 14,
    color: colors.text.secondary,
  },
  estadoBadgeContainer: {
    alignItems: "flex-end",
  },
  estadoBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  estadoText: {
    ...typography.label,
    fontSize: 10,
    color: colors.text.inverse,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  infoAdicional: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.md,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  infoText: {
    ...typography.body,
    fontSize: 12,
    color: colors.text.secondary,
  },
  observacionesContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  observacionesText: {
    ...typography.body,
    fontSize: 12,
    color: colors.text.secondary,
    fontStyle: 'italic',
  },
  pagoActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.md,
  },
  actionButton: {
    padding: spacing.sm,
  },
  emptyState: {
    backgroundColor: colors.background,
    padding: spacing.xxl,
    borderRadius: borderRadius.lg,
    alignItems: "center",
    ...shadows.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyTitle: {
    ...typography.h3,
    fontSize: 18,
    marginTop: spacing.lg,
  },
  bottomSpacer: {
    height: spacing.xl,
  },
  modalBody: {
    padding: spacing.xl,
    gap: spacing.lg,
  },
  campoContainer: {
    gap: spacing.sm,
  },
  campoLabel: {
    ...typography.label,
    fontSize: 14,
  },
  campoInput: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    padding: spacing.md,
    fontSize: 16,
    color: colors.text.primary,
    minHeight: 50,
  },
  campoTextArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  metodosGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  metodoOption: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  metodoOptionActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  metodoOptionText: {
    ...typography.label,
    fontSize: 14,
    color: colors.text.primary,
  },
  metodoOptionTextActive: {
    color: colors.text.inverse,
  },
  selector: {
    gap: spacing.sm,
  },
  opcionChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  opcionChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  opcionChipText: {
    ...typography.body,
    fontSize: 14,
    color: colors.text.primary,
  },
  opcionChipTextActive: {
    color: colors.text.inverse,
  },
  botonesAccion: {
    flexDirection: "row",
    gap: spacing.md,
    padding: spacing.xl,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  botonCancelar: {
    flex: 1,
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.sm,
    alignItems: "center",
  },
  botonCancelarTexto: {
    ...typography.label,
    fontSize: 16,
    color: colors.text.secondary,
  },
  botonGuardar: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    padding: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.sm,
  },
  botonGuardarDisabled: {
    opacity: 0.6,
  },
  botonGuardarTexto: {
    ...typography.label,
    fontSize: 16,
    color: colors.text.inverse,
  },
});
