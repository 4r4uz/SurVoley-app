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
  Alert,
  Share,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../types/use.auth";
import { supabase } from "../../supabase/supabaseClient";
import { StatsCard } from "../../components/StatsCard";
import { Modal as CustomModal } from "../../components/Modal";
import { formatDate, formatDateShort, formatearMonto } from "../../utils/dateHelpers";
import { colors, spacing, borderRadius, shadows, typography } from "../../constants/theme";

interface Reporte {
  id: string;
  titulo: string;
  descripcion: string;
  icono: string;
  color: string;
  tipo: 'asistencias' | 'pagos' | 'jugadores' | 'morosidad';
}

interface FiltrosReporte {
  fechaDesde: string;
  fechaHasta: string;
  categoria: string;
}

export default function ReportesScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [generandoReporte, setGenerandoReporte] = useState<string | null>(null);
  const [modalFiltrosVisible, setModalFiltrosVisible] = useState(false);
  const [reporteSeleccionado, setReporteSeleccionado] = useState<Reporte | null>(null);
  
  const [filtros, setFiltros] = useState<FiltrosReporte>({
    fechaDesde: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    fechaHasta: new Date().toISOString().split('T')[0],
    categoria: 'todos',
  });

  const [estadisticas, setEstadisticas] = useState({
    tasaAsistencia: 0,
    tasaPagos: 0,
    totalJugadores: 0,
    pendientes: 0,
    morosos: 0,
  });

  const reportes: Reporte[] = [
    {
      id: '1',
      titulo: 'Asistencias',
      descripcion: 'Reporte mensual de asistencias',
      icono: 'calendar',
      color: colors.primary,
      tipo: 'asistencias',
    },
    {
      id: '2',
      titulo: 'Pagos',
      descripcion: 'Estado de cuotas y pagos',
      icono: 'cash',
      color: colors.jugador,
      tipo: 'pagos',
    },
    {
      id: '3',
      titulo: 'Jugadores',
      descripcion: 'Listado completo de jugadores',
      icono: 'people',
      color: colors.apoderado,
      tipo: 'jugadores',
    },
    {
      id: '4',
      titulo: 'Morosidad',
      descripcion: 'Jugadores con pagos pendientes',
      icono: 'alert-circle',
      color: colors.error,
      tipo: 'morosidad',
    },
  ];

  const cargarEstadisticas = useCallback(async () => {
    try {
      setLoading(true);

      const { data: asistenciasData } = await supabase
        .from('Asistencia')
        .select('estado_asistencia')
        .gte('fecha_asistencia', filtros.fechaDesde)
        .lte('fecha_asistencia', filtros.fechaHasta);

      const totalAsistencias = asistenciasData?.length || 0;
      const presentes = asistenciasData?.filter(a => a.estado_asistencia === 'Presente').length || 0;
      const tasaAsistencia = totalAsistencias > 0 ? Math.round((presentes / totalAsistencias) * 100) : 0;

      const { data: mensualidadesData } = await supabase
        .from('Mensualidad')
        .select('estado_pago, monto')
        .gte('fecha_vencimiento', filtros.fechaDesde)
        .lte('fecha_vencimiento', filtros.fechaHasta);

      const totalMensualidades = mensualidadesData?.length || 0;
      const pagadas = mensualidadesData?.filter(m => m.estado_pago === 'Pagado').length || 0;
      const tasaPagos = totalMensualidades > 0 ? Math.round((pagadas / totalMensualidades) * 100) : 0;

      const { data: jugadoresData } = await supabase
        .from('Jugador')
        .select('id_jugador');

      const totalJugadores = jugadoresData?.length || 0;

      const { data: mensualidadesPendientes } = await supabase
        .from('Mensualidad')
        .select('id_mensualidad')
        .eq('estado_pago', 'Pendiente')
        .gte('fecha_vencimiento', filtros.fechaDesde)
        .lte('fecha_vencimiento', filtros.fechaHasta);

      const pendientes = mensualidadesPendientes?.length || 0;

      const { data: mensualidadesVencidas } = await supabase
        .from('Mensualidad')
        .select('id_mensualidad')
        .eq('estado_pago', 'Pendiente')
        .lt('fecha_vencimiento', new Date().toISOString().split('T')[0])
        .gte('fecha_vencimiento', filtros.fechaDesde)
        .lte('fecha_vencimiento', filtros.fechaHasta);

      const morosos = mensualidadesVencidas?.length || 0;

      setEstadisticas({
        tasaAsistencia,
        tasaPagos,
        totalJugadores,
        pendientes,
        morosos,
      });
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filtros]);

  const generarReporte = async (reporte: Reporte) => {
    setGenerandoReporte(reporte.id);
    try {
      let contenido = '';
      let titulo = `Reporte de ${reporte.titulo}\n`;
      titulo += `Período: ${formatDateShort(filtros.fechaDesde)} - ${formatDateShort(filtros.fechaHasta)}\n`;
      titulo += `Generado: ${formatDate(new Date())}\n\n`;

      switch (reporte.tipo) {
        case 'asistencias':
          contenido = await generarReporteAsistencias();
          break;
        case 'pagos':
          contenido = await generarReportePagos();
          break;
        case 'jugadores':
          contenido = await generarReporteJugadores();
          break;
        case 'morosidad':
          contenido = await generarReporteMorosidad();
          break;
      }

      const reporteCompleto = titulo + contenido;

      await Share.share({
        message: reporteCompleto,
        title: `Reporte de ${reporte.titulo}`,
      });

      Alert.alert('Éxito', 'Reporte generado y compartido correctamente');
    } catch (error: any) {
      console.error('Error generando reporte:', error);
      Alert.alert('Error', 'No se pudo generar el reporte');
    } finally {
      setGenerandoReporte(null);
      setModalFiltrosVisible(false);
    }
  };

  const generarReporteAsistencias = async (): Promise<string> => {
    const { data: asistenciasData } = await supabase
      .from('Asistencia')
      .select(`
        fecha_asistencia,
        estado_asistencia,
        Jugador(id_jugador, nombre, apellido, categoria),
        Entrenamiento(fecha_hora, lugar),
        Evento(fecha_hora, ubicacion, titulo)
      `)
      .gte('fecha_asistencia', filtros.fechaDesde)
      .lte('fecha_asistencia', filtros.fechaHasta)
      .order('fecha_asistencia', { ascending: false });

    let reporte = '=== ASISTENCIAS ===\n\n';
    reporte += `Total de registros: ${asistenciasData?.length || 0}\n\n`;

    const porEstado: Record<string, number> = {};
    asistenciasData?.forEach(a => {
      porEstado[a.estado_asistencia] = (porEstado[a.estado_asistencia] || 0) + 1;
    });

    reporte += 'Por Estado:\n';
    Object.entries(porEstado).forEach(([estado, cantidad]) => {
      reporte += `  ${estado}: ${cantidad}\n`;
    });

    reporte += '\nDetalle:\n';
    asistenciasData?.slice(0, 50).forEach(a => {
      const jugador = (a as any).Jugador;
      reporte += `\n${jugador?.nombre} ${jugador?.apellido} - ${formatDateShort(a.fecha_asistencia)} - ${a.estado_asistencia}\n`;
    });

    return reporte;
  };

  const generarReportePagos = async (): Promise<string> => {
    const { data: pagosData } = await supabase
      .from('Pago')
      .select(`
        fecha_pago,
        monto,
        metodo_pago,
        estado_pago,
        Mensualidad(id_mensualidad, mes_referencia, anio_referencia, Jugador(id_jugador, nombre, apellido))
      `)
      .gte('fecha_pago', filtros.fechaDesde)
      .lte('fecha_pago', filtros.fechaHasta)
      .order('fecha_pago', { ascending: false });

    let reporte = '=== PAGOS ===\n\n';
    reporte += `Total de pagos: ${pagosData?.length || 0}\n`;

    const totalRecaudado = pagosData?.reduce((sum, p) => sum + (p.monto || 0), 0) || 0;
    reporte += `Total recaudado: ${formatearMonto(totalRecaudado)}\n\n`;

    const porEstado: Record<string, number> = {};
    pagosData?.forEach(p => {
      porEstado[p.estado_pago] = (porEstado[p.estado_pago] || 0) + 1;
    });

    reporte += 'Por Estado:\n';
    Object.entries(porEstado).forEach(([estado, cantidad]) => {
      reporte += `  ${estado}: ${cantidad}\n`;
    });

    reporte += '\nDetalle:\n';
    pagosData?.slice(0, 50).forEach(p => {
      const mensualidad = (p as any).Mensualidad;
      const jugador = mensualidad?.Jugador;
      reporte += `\n${jugador?.nombre} ${jugador?.apellido} - ${formatearMonto(p.monto)} - ${formatDateShort(p.fecha_pago)}\n`;
    });

    return reporte;
  };

  const generarReporteJugadores = async (): Promise<string> => {
    const { data: jugadoresData } = await supabase
      .from('Jugador')
      .select(`
        id_jugador,
        rut,
        fecha_nacimiento,
        categoria,
        posicion,
        Usuario(id_usuario, nombre, apellido, correo, telefono, estado_cuenta)
      `)
      .order('nombre');

    let reporte = '=== JUGADORES ===\n\n';
    reporte += `Total de jugadores: ${jugadoresData?.length || 0}\n\n`;

    const porCategoria: Record<string, number> = {};
    jugadoresData?.forEach(j => {
      const categoria = j.categoria || 'Sin categoría';
      porCategoria[categoria] = (porCategoria[categoria] || 0) + 1;
    });

    reporte += 'Por Categoría:\n';
    Object.entries(porCategoria).forEach(([categoria, cantidad]) => {
      reporte += `  ${categoria}: ${cantidad}\n`;
    });

    reporte += '\nDetalle:\n';
    jugadoresData?.forEach(j => {
      const usuario = (j as any).Usuario;
      reporte += `\n${usuario?.nombre} ${usuario?.apellido}\n`;
      reporte += `  RUT: ${j.rut || 'N/A'}\n`;
      reporte += `  Categoría: ${j.categoria || 'N/A'}\n`;
      reporte += `  Posición: ${j.posicion || 'N/A'}\n`;
      reporte += `  Estado: ${usuario?.estado_cuenta ? 'Activo' : 'Inactivo'}\n`;
    });

    return reporte;
  };

  const generarReporteMorosidad = async (): Promise<string> => {
    const { data: mensualidadesData } = await supabase
      .from('Mensualidad')
      .select(`
        id_mensualidad,
        monto,
        fecha_vencimiento,
        mes_referencia,
        anio_referencia,
        Jugador(id_jugador, nombre, apellido, categoria, Usuario(id_usuario, correo, telefono))
      `)
      .eq('estado_pago', 'Pendiente')
      .lt('fecha_vencimiento', new Date().toISOString().split('T')[0])
      .order('fecha_vencimiento', { ascending: true });

    let reporte = '=== MOROSIDAD ===\n\n';
    reporte += `Total de mensualidades vencidas: ${mensualidadesData?.length || 0}\n`;

    const totalAdeudado = mensualidadesData?.reduce((sum, m) => sum + (m.monto || 0), 0) || 0;
    reporte += `Total adeudado: ${formatearMonto(totalAdeudado)}\n\n`;

    reporte += 'Detalle:\n';
    mensualidadesData?.forEach(m => {
      const jugador = (m as any).Jugador;
      const usuario = jugador?.Usuario;
      const diasVencidos = Math.floor((new Date().getTime() - new Date(m.fecha_vencimiento).getTime()) / (1000 * 60 * 60 * 24));
      
      reporte += `\n${jugador?.nombre} ${jugador?.apellido}\n`;
      reporte += `  Mes: ${m.mes_referencia}/${m.anio_referencia}\n`;
      reporte += `  Monto: ${formatearMonto(m.monto)}\n`;
      reporte += `  Vencimiento: ${formatDateShort(m.fecha_vencimiento)}\n`;
      reporte += `  Días vencidos: ${diasVencidos}\n`;
      reporte += `  Contacto: ${usuario?.correo || usuario?.telefono || 'N/A'}\n`;
    });

    return reporte;
  };

  const abrirModalFiltros = (reporte: Reporte) => {
    setReporteSeleccionado(reporte);
    setModalFiltrosVisible(true);
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    cargarEstadisticas();
  }, [cargarEstadisticas]);

  useEffect(() => {
    if (user) {
      cargarEstadisticas();
    }
  }, [user, cargarEstadisticas]);

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={colors.primaryDark} barStyle="light-content" />
      
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerTextContainer}>
            <Text style={styles.welcome}>Reportes</Text>
            <Text style={styles.subtitle}>Análisis y estadísticas del club</Text>
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
              icon="trending-up"
              value={`${estadisticas.tasaAsistencia}%`}
              label="Asistencia"
              color={colors.primary}
            />
            <StatsCard
              icon="cash"
              value={`${estadisticas.tasaPagos}%`}
              label="Pagos"
              color={colors.jugador}
            />
            <StatsCard
              icon="people"
              value={estadisticas.totalJugadores.toString()}
              label="Jugadores"
              color={colors.apoderado}
            />
            <StatsCard
              icon="alert-circle"
              value={estadisticas.pendientes.toString()}
              label="Pendientes"
              color={colors.error}
            />
            <StatsCard
              icon="warning"
              value={estadisticas.morosos.toString()}
              label="Morosos"
              color={colors.warning}
            />
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Reportes Disponibles</Text>
            <TouchableOpacity 
              style={styles.botonExportar}
              onPress={() => setModalFiltrosVisible(true)}
            >
              <Ionicons name="download" size={18} color={colors.text.inverse} />
              <Text style={styles.botonExportarTexto}>Filtros</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.gridReportes}>
            {reportes.map((reporte) => (
              <TouchableOpacity
                key={reporte.id}
                style={styles.reporteCard}
                onPress={() => abrirModalFiltros(reporte)}
                disabled={generandoReporte === reporte.id}
              >
                {generandoReporte === reporte.id ? (
                  <ActivityIndicator size="small" color={reporte.color} />
                ) : (
                  <View style={[styles.reporteIcon, { backgroundColor: `${reporte.color}15` }]}>
                    <Ionicons name={reporte.icono as any} size={24} color={reporte.color} />
                  </View>
                )}
                <Text style={styles.reporteTitulo}>{reporte.titulo}</Text>
                <Text style={styles.reporteDesc}>{reporte.descripcion}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <CustomModal
        visible={modalFiltrosVisible}
        onClose={() => setModalFiltrosVisible(false)}
        title={`Reporte de ${reporteSeleccionado?.titulo || ''}`}
      >
        <View style={styles.modalBody}>
          <Text style={styles.modalText}>
            Configura los filtros para generar el reporte:
          </Text>
          <Text style={styles.modalSubtext}>
            Período: {formatDateShort(filtros.fechaDesde)} - {formatDateShort(filtros.fechaHasta)}
          </Text>
          {reporteSeleccionado && (
            <TouchableOpacity
              style={styles.botonGenerar}
              onPress={() => generarReporte(reporteSeleccionado)}
              disabled={!!generandoReporte}
            >
              {generandoReporte === reporteSeleccionado.id ? (
                <ActivityIndicator size="small" color={colors.text.inverse} />
              ) : (
                <>
                  <Ionicons name="download" size={18} color={colors.text.inverse} />
                  <Text style={styles.botonGenerarTexto}>Generar y Compartir</Text>
                </>
              )}
            </TouchableOpacity>
          )}
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
  scrollContent: {
    flex: 1,
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
  gridReportes: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  reporteCard: {
    width: "48%",
    backgroundColor: colors.background,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    alignItems: "center",
    ...shadows.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  reporteIcon: {
    width: 50,
    height: 50,
    borderRadius: borderRadius.lg,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  reporteTitulo: {
    ...typography.h3,
    fontSize: 14,
    marginBottom: spacing.xs,
    textAlign: "center",
  },
  reporteDesc: {
    ...typography.body,
    fontSize: 12,
    color: colors.text.secondary,
    textAlign: "center",
    lineHeight: 16,
  },
  botonExportar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    gap: 6,
  },
  botonExportarTexto: {
    color: colors.text.inverse,
    fontWeight: '600',
    fontSize: 14,
  },
  bottomSpacer: {
    height: spacing.xl,
  },
  modalBody: {
    padding: spacing.xl,
    gap: spacing.lg,
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
  },
  botonGenerar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    padding: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.sm,
    marginTop: spacing.md,
  },
  botonGenerarTexto: {
    ...typography.label,
    fontSize: 16,
    color: colors.text.inverse,
  },
});
