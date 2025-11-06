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
  Switch,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../types/use.auth";
import { supabase } from "../../supabase/supabaseClient";
import { StatsCard } from "../../components/StatsCard";
import { Modal as CustomModal } from "../../components/Modal";
import { formatDateShort, formatearMonto } from "../../utils/dateHelpers";
import { colors, spacing, borderRadius, shadows, typography } from "../../constants/theme";

interface Mensualidad {
  id_mensualidad: string;
  id_jugador: string;
  monto: number;
  fecha_vencimiento: string;
  fecha_pago: string | null;
  metodo_pago: string | null;
  estado_pago: string;
  mes_referencia: string;
  anio_referencia: number;
  jugador?: {
    nombre: string;
    apellido: string;
    categoria?: string;
  };
}

interface ConfiguracionCuota {
  categoria: string;
  monto: number;
}

interface Filtros {
  estado: string;
  categoria: string;
  busqueda: string;
  mes?: string;
  anio?: number;
}

interface FormularioConfiguracion {
  configuraciones: ConfiguracionCuota[];
  diasVencimiento: number;
}

export default function MensualidadesScreen() {
  const { user } = useAuth();
  const [mensualidades, setMensualidades] = useState<Mensualidad[]>([]);
  const [mensualidadesFiltradas, setMensualidadesFiltradas] = useState<Mensualidad[]>([]);
  const [jugadores, setJugadores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filtros, setFiltros] = useState<Filtros>({
    estado: 'todos',
    categoria: 'todos',
    busqueda: '',
    mes: new Date().toISOString().slice(5, 7),
    anio: new Date().getFullYear(),
  });
  const [modalVisible, setModalVisible] = useState(false);
  const [modalGenerar, setModalGenerar] = useState(false);
  const [generando, setGenerando] = useState(false);

  const [formulario, setFormulario] = useState<FormularioConfiguracion>({
    configuraciones: [
      { categoria: 'Sub-13', monto: 40000 },
      { categoria: 'Sub-15', monto: 45000 },
      { categoria: 'Sub-17', monto: 50000 },
      { categoria: 'Sub-19', monto: 55000 },
    ],
    diasVencimiento: 5,
  });

  const stats = useMemo(() => {
    const total = mensualidades.length;
    const pagadas = mensualidades.filter(m => m.estado_pago === 'Pagado').length;
    const pendientes = mensualidades.filter(m => m.estado_pago === 'Pendiente').length;
    const vencidas = mensualidades.filter(m => {
      if (m.estado_pago === 'Pagado') return false;
      return new Date(m.fecha_vencimiento) < new Date();
    }).length;
    const totalRecaudado = mensualidades
      .filter(m => m.estado_pago === 'Pagado')
      .reduce((sum, m) => sum + m.monto, 0);
    const pendienteRecaudar = mensualidades
      .filter(m => m.estado_pago === 'Pendiente')
      .reduce((sum, m) => sum + m.monto, 0);

    return { total, pagadas, pendientes, vencidas, totalRecaudado, pendienteRecaudar };
  }, [mensualidades]);

  const cargarMensualidades = useCallback(async () => {
    try {
      setLoading(true);

      const { data: mensualidadesData, error } = await supabase
        .from('Mensualidad')
        .select(`
          *,
          Jugador(id_jugador, nombre, apellido, categoria)
        `)
        .order('anio_referencia', { ascending: false })
        .order('mes_referencia', { ascending: false })
        .limit(200);

      if (error) throw error;

      const mensualidadesConInfo = (mensualidadesData || []).map((mensualidad: any) => ({
        ...mensualidad,
        jugador: mensualidad.Jugador,
      }));

      setMensualidades(mensualidadesConInfo);

      const { data: jugadoresData } = await supabase
        .from('Jugador')
        .select('id_jugador, nombre, apellido, categoria')
        .order('nombre');

      setJugadores(jugadoresData || []);
    } catch (error) {
      console.error('Error cargando mensualidades:', error);
      Alert.alert('Error', 'No se pudieron cargar las mensualidades');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const aplicarFiltros = useCallback(() => {
    let filtrados = mensualidades;

    if (filtros.estado !== 'todos') {
      filtrados = filtrados.filter(m => m.estado_pago === filtros.estado);
    }

    if (filtros.categoria !== 'todos') {
      filtrados = filtrados.filter(m => 
        m.jugador?.categoria?.toLowerCase() === filtros.categoria.toLowerCase()
      );
    }

    if (filtros.busqueda) {
      const busquedaLower = filtros.busqueda.toLowerCase();
      filtrados = filtrados.filter(m =>
        m.jugador?.nombre?.toLowerCase().includes(busquedaLower) ||
        m.jugador?.apellido?.toLowerCase().includes(busquedaLower)
      );
    }

    if (filtros.mes && filtros.anio) {
      filtrados = filtrados.filter(m => 
        m.mes_referencia === filtros.mes && m.anio_referencia === filtros.anio
      );
    }

    setMensualidadesFiltradas(filtrados);
  }, [mensualidades, filtros]);

  const generarMensualidades = async () => {
    const mes = new Date().toISOString().slice(5, 7);
    const anio = new Date().getFullYear();

    const mensualidadesExistentes = await supabase
      .from('Mensualidad')
      .select('id_jugador')
      .eq('mes_referencia', mes)
      .eq('anio_referencia', anio);

    if (mensualidadesExistentes.data && mensualidadesExistentes.data.length > 0) {
      Alert.alert(
        'Advertencia',
        'Ya existen mensualidades para este mes. ¿Desea generar de todas formas?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Generar', onPress: () => ejecutarGeneracion() }
        ]
      );
    } else {
      ejecutarGeneracion();
    }
  };

  const ejecutarGeneracion = async () => {
    setGenerando(true);
    try {
      const mes = new Date().toISOString().slice(5, 7);
      const anio = new Date().getFullYear();
      const fechaVencimiento = new Date(anio, parseInt(mes) - 1, formulario.diasVencimiento);
      
      const nuevasMensualidades = jugadores.map(jugador => {
        const config = formulario.configuraciones.find(c => c.categoria === jugador.categoria);
        const monto = config?.monto || 45000;

        return {
          id_jugador: jugador.id_jugador,
          monto,
          fecha_vencimiento: fechaVencimiento.toISOString().split('T')[0],
          fecha_pago: null,
          metodo_pago: null,
          estado_pago: 'Pendiente',
          mes_referencia: mes,
          anio_referencia: anio,
        };
      });

      const { error } = await supabase
        .from('Mensualidad')
        .insert(nuevasMensualidades);

      if (error) throw error;

      Alert.alert('Éxito', `Se generaron ${nuevasMensualidades.length} mensualidades`);
      setModalGenerar(false);
      cargarMensualidades();
    } catch (error: any) {
      console.error('Error generando mensualidades:', error);
      Alert.alert('Error', 'No se pudieron generar las mensualidades');
    } finally {
      setGenerando(false);
    }
  };

  const guardarConfiguracion = async () => {
    Alert.alert('Éxito', 'Configuración guardada correctamente');
    setModalVisible(false);
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    cargarMensualidades();
  }, [cargarMensualidades]);

  useEffect(() => {
    if (user) {
      cargarMensualidades();
    }
  }, [user, cargarMensualidades]);

  useEffect(() => {
    aplicarFiltros();
  }, [aplicarFiltros]);

  if (loading && mensualidades.length === 0) {
    return (
      <View style={styles.container}>
        <StatusBar backgroundColor={colors.primaryDark} barStyle="light-content" />
        <View style={styles.header}>
          <Text style={styles.welcome}>Mensualidades</Text>
        </View>
        <View style={styles.loadingContent}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Cargando mensualidades...</Text>
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
            <Text style={styles.welcome}>Mensualidades</Text>
            <Text style={styles.subtitle}>Configuración de cuotas mensuales</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity 
              style={styles.botonAccion}
              onPress={() => setModalVisible(true)}
            >
              <Ionicons name="settings" size={18} color={colors.text.inverse} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.botonNuevo}
              onPress={() => setModalGenerar(true)}
            >
              <Ionicons name="refresh" size={18} color={colors.text.inverse} />
              <Text style={styles.botonNuevoTexto}>Generar</Text>
            </TouchableOpacity>
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
              icon="cash"
              value={formatearMonto(formulario.configuraciones[1]?.monto || 45000)}
              label="Cuota Básica"
              color={colors.apoderado}
            />
            <StatsCard
              icon="calendar"
              value={formulario.diasVencimiento.toString()}
              label="Días Vencimiento"
              color={colors.jugador}
            />
            <StatsCard
              icon="checkmark-circle"
              value={stats.pagadas.toString()}
              label="Pagadas"
              color={colors.success}
            />
            <StatsCard
              icon="alert-circle"
              value={stats.vencidas.toString()}
              label="Vencidas"
              color={colors.error}
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
                <Text style={styles.filtroLabel}>Categoría</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.filtrosChips}>
                    {['todos', 'Sub-13', 'Sub-15', 'Sub-17', 'Sub-19'].map((categoria) => (
                      <TouchableOpacity
                        key={categoria}
                        style={[
                          styles.filtroChip,
                          filtros.categoria === categoria && styles.filtroChipActive
                        ]}
                        onPress={() => setFiltros(prev => ({ ...prev, categoria }))}
                      >
                        <Text style={[
                          styles.filtroChipText,
                          filtros.categoria === categoria && styles.filtroChipTextActive
                        ]}>
                          {categoria === 'todos' ? 'Todos' : categoria}
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
              Mensualidades ({mensualidadesFiltradas.length})
            </Text>
          </View>

          {mensualidadesFiltradas.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={48} color={colors.text.tertiary} />
              <Text style={styles.emptyTitle}>No se encontraron mensualidades</Text>
            </View>
          ) : (
            <View style={styles.mensualidadesList}>
              {mensualidadesFiltradas.map((mensualidad) => {
                const estaVencida = new Date(mensualidad.fecha_vencimiento) < new Date() && mensualidad.estado_pago === 'Pendiente';
                
                return (
                  <View key={mensualidad.id_mensualidad} style={[
                    styles.mensualidadCard,
                    estaVencida && styles.mensualidadCardVencida
                  ]}>
                    <View style={styles.mensualidadHeader}>
                      <View style={styles.mensualidadInfo}>
                        <View style={styles.avatar}>
                          <Text style={styles.avatarText}>
                            {mensualidad.jugador?.nombre?.charAt(0)}{mensualidad.jugador?.apellido?.charAt(0)}
                          </Text>
                        </View>
                        <View style={styles.mensualidadDetails}>
                          <Text style={styles.nombre}>
                            {mensualidad.jugador?.nombre} {mensualidad.jugador?.apellido}
                          </Text>
                          <Text style={styles.monto}>{formatearMonto(mensualidad.monto)}</Text>
                          <Text style={styles.fecha}>
                            {mensualidad.mes_referencia}/{mensualidad.anio_referencia}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.estadoBadgeContainer}>
                        <View style={[
                          styles.estadoBadge,
                          { 
                            backgroundColor: mensualidad.estado_pago === 'Pagado' 
                              ? colors.success 
                              : estaVencida 
                                ? colors.error 
                                : colors.warning 
                          }
                        ]}>
                          <Text style={styles.estadoText}>
                            {mensualidad.estado_pago}
                            {estaVencida ? ' (Vencida)' : ''}
                          </Text>
                        </View>
                      </View>
                    </View>
                    <View style={styles.infoAdicional}>
                      <View style={styles.infoItem}>
                        <Ionicons name="calendar" size={14} color={colors.text.secondary} />
                        <Text style={styles.infoText}>
                          Vence: {formatDateShort(mensualidad.fecha_vencimiento)}
                        </Text>
                      </View>
                      {mensualidad.fecha_pago && (
                        <View style={styles.infoItem}>
                          <Ionicons name="checkmark-circle" size={14} color={colors.success} />
                          <Text style={styles.infoText}>
                            Pagado: {formatDateShort(mensualidad.fecha_pago)}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <CustomModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        title="Configuración de Cuotas"
      >
        <View style={styles.modalBody}>
            <View style={styles.campoContainer}>
              <Text style={styles.campoLabel}>Días de Vencimiento</Text>
              <TextInput
                style={styles.campoInput}
                value={formulario.diasVencimiento.toString()}
                onChangeText={(text) => setFormulario(prev => ({ 
                  ...prev, 
                  diasVencimiento: parseInt(text) || 5 
                }))}
                keyboardType="numeric"
                placeholder="5"
              />
            </View>

            <Text style={styles.seccionTitulo}>Montos por Categoría</Text>
            {formulario.configuraciones.map((config, index) => (
              <View key={config.categoria} style={styles.campoContainer}>
                <Text style={styles.campoLabel}>{config.categoria}</Text>
                <TextInput
                  style={styles.campoInput}
                  value={config.monto.toString()}
                  onChangeText={(text) => {
                    const nuevasConfig = [...formulario.configuraciones];
                    nuevasConfig[index].monto = parseFloat(text) || 0;
                    setFormulario(prev => ({ ...prev, configuraciones: nuevasConfig }));
                  }}
                  keyboardType="numeric"
                  placeholder="0"
                />
              </View>
            ))}
          </View>
        <View style={styles.botonesAccion}>
          <TouchableOpacity
            style={styles.botonCancelar}
            onPress={() => setModalVisible(false)}
          >
            <Text style={styles.botonCancelarTexto}>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.botonGuardar}
            onPress={guardarConfiguracion}
          >
            <Text style={styles.botonGuardarTexto}>Guardar</Text>
          </TouchableOpacity>
        </View>
      </CustomModal>

      <CustomModal
        visible={modalGenerar}
        onClose={() => setModalGenerar(false)}
        title="Generar Mensualidades"
      >
        <View style={styles.modalBody}>
            <Text style={styles.modalText}>
              Se generarán mensualidades para {jugadores.length} jugadores del mes actual.
            </Text>
            <Text style={styles.modalSubtext}>
              Montos según categoría:
            </Text>
            {formulario.configuraciones.map(config => (
              <Text key={config.categoria} style={styles.modalListItem}>
                • {config.categoria}: {formatearMonto(config.monto)}
              </Text>
            ))}
            <Text style={styles.modalSubtext}>
              Fecha de vencimiento: día {formulario.diasVencimiento} del mes
            </Text>
          </View>
        <View style={styles.botonesAccion}>
          <TouchableOpacity
            style={styles.botonCancelar}
            onPress={() => setModalGenerar(false)}
          >
            <Text style={styles.botonCancelarTexto}>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.botonGuardar, generando && styles.botonGuardarDisabled]}
            onPress={generarMensualidades}
            disabled={generando}
          >
            {generando ? (
              <ActivityIndicator size="small" color={colors.text.inverse} />
            ) : (
              <Text style={styles.botonGuardarTexto}>Generar</Text>
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
  headerActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
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
  botonAccion: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: borderRadius.sm,
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
  mensualidadesList: {
    gap: spacing.md,
  },
  mensualidadCard: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    ...shadows.sm,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  mensualidadCardVencida: {
    borderColor: colors.error,
    borderWidth: 2,
  },
  mensualidadHeader: {
    padding: spacing.lg,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  mensualidadInfo: {
    flexDirection: "row",
    alignItems: "flex-start",
    flex: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.apoderado,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.md,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: "bold",
    color: colors.text.inverse,
  },
  mensualidadDetails: {
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
    color: colors.apoderado,
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
  seccionTitulo: {
    ...typography.h3,
    fontSize: 16,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  modalText: {
    ...typography.body,
    fontSize: 16,
    marginBottom: spacing.md,
  },
  modalSubtext: {
    ...typography.body,
    fontSize: 14,
    color: colors.text.secondary,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  modalListItem: {
    ...typography.body,
    fontSize: 14,
    color: colors.text.secondary,
    marginLeft: spacing.md,
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
