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
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../types/use.auth";
import CustomModal from "../../components/Modal";
import { supabase } from "../../supabase/supabaseClient";
import { StatsCard } from "../../components/StatsCard";
import { formatDateShort, formatDateTime } from "../../utils/dateHelpers";
import {
  colors,
  spacing,
  borderRadius,
  shadows,
  typography,
} from "../../constants/theme";

const { width: screenWidth } = Dimensions.get("window");

interface Asistencia {
  id_asistencia: string;
  id_jugador: string;
  id_entrenamiento?: string;
  id_evento?: string;
  fecha_asistencia: string;
  estado_asistencia: "Presente" | "Ausente" | "Justificado" | "Sin registro";
  jugador?: {
    nombre: string;
    apellido: string;
    categoria?: string;
  };
  entrenamiento?: {
    id_entrenamiento: string;
    fecha_hora: string;
    lugar?: string;
    descripcion?: string;
  };
  evento?: {
    id_evento: string;
    fecha_hora: string;
    ubicacion?: string;
    titulo?: string;
    tipo_evento?: string;
  };
}

interface EventoConAsistencias {
  id: string;
  tipo: "entrenamiento" | "evento";
  titulo: string;
  fecha_hora: string;
  lugar?: string;
  descripcion?: string;
  tipo_evento?: string;
  asistencias: Asistencia[];
  estadisticas: {
    total: number;
    presentes: number;
    ausentes: number;
    justificados: number;
    tasaAsistencia: number;
  };
}

interface Jugador {
  id_jugador: string;
  nombre: string;
  apellido: string;
  categoria?: string;
  rut?: string;
  fecha_nacimiento?: string;
  posicion?: string;
}

interface Filtros {
  tipo: string;
  categoria: string;
  busqueda: string;
  fechaDesde?: string;
  fechaHasta?: string;
  estado: string;
}

export default function GestionAsistenciasScreen() {
  const { user } = useAuth();
  const [asistencias, setAsistencias] = useState<Asistencia[]>([]);
  const [jugadores, setJugadores] = useState<Jugador[]>([]);
  const [eventosConAsistencias, setEventosConAsistencias] = useState<
    EventoConAsistencias[]
  >([]);
  const [eventosFuturos, setEventosFuturos] = useState<EventoConAsistencias[]>(
    []
  );
  const [eventosFiltrados, setEventosFiltrados] = useState<
    EventoConAsistencias[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filtros, setFiltros] = useState<Filtros>({
    tipo: "todos",
    categoria: "todos",
    busqueda: "",
    estado: "todos",
  });
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTomarAsistencia, setModalTomarAsistencia] = useState(false);
  const [modalDetalleEvento, setModalDetalleEvento] = useState(false);
  const [modalJugadores, setModalJugadores] = useState(false);
  const [eventoSeleccionado, setEventoSeleccionado] =
    useState<EventoConAsistencias | null>(null);
  const [asistenciaSeleccionada, setAsistenciaSeleccionada] =
    useState<Asistencia | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [activeTab, setActiveTab] = useState<"tomar" | "historial">("tomar");
  const [mostrarMasEventos, setMostrarMasEventos] = useState(false);
  const [mostrarMasHistorial, setMostrarMasHistorial] = useState(false);

  const LIMITE_EVENTOS = 3;
  const LIMITE_HISTORIAL = 5;

  // Estadísticas útiles para gestión de asistencias
  const stats = useMemo(() => {
    const eventosHoy = eventosConAsistencias.filter((evento) => {
      const eventoDate = new Date(evento.fecha_hora);
      const hoy = new Date();
      return eventoDate.toDateString() === hoy.toDateString();
    });

    const eventosSemana = eventosConAsistencias.filter((evento) => {
      const eventoDate = new Date(evento.fecha_hora);
      const hoy = new Date();
      const inicioSemana = new Date(hoy.setDate(hoy.getDate() - hoy.getDay()));
      return eventoDate >= inicioSemana;
    });

    const totalJugadores = jugadores.length;
    const jugadoresConAsistenciaHoy = new Set(
      asistencias
        .filter((a) => {
          const asistenciaDate = new Date(a.fecha_asistencia);
          const hoy = new Date();
          return asistenciaDate.toDateString() === hoy.toDateString();
        })
        .map((a) => a.id_jugador)
    ).size;

    return {
      eventosHoy: eventosHoy.length,
      eventosSemana: eventosSemana.length,
      totalJugadores,
      jugadoresConAsistenciaHoy,
    };
  }, [eventosConAsistencias, jugadores, asistencias]);

  const eventosMostrados = useMemo(
    () =>
      mostrarMasEventos
        ? eventosFuturos
        : eventosFuturos.slice(0, LIMITE_EVENTOS),
    [eventosFuturos, mostrarMasEventos]
  );

  const historialMostrado = useMemo(
    () =>
      mostrarMasHistorial
        ? eventosFiltrados
        : eventosFiltrados.slice(0, LIMITE_HISTORIAL),
    [eventosFiltrados, mostrarMasHistorial]
  );

  const cargarDatos = useCallback(async () => {
    try {
      setLoading(true);

      // Cargar jugadores
      const { data: jugadoresData, error: errorJugadores } = await supabase
        .from("Jugador")
        .select(
          `
          id_jugador,
          rut,
          fecha_nacimiento,
          categoria,
          posicion,
          Usuarios!Jugador_id_jugador_fkey (
            nombre,
            apellido,
            correo
          )
        `
        )
        .order("categoria");

      if (errorJugadores) throw errorJugadores;

      const jugadoresTransformados = (jugadoresData || []).map(
        (jugador: any) => ({
          id_jugador: jugador.id_jugador,
          nombre: jugador.Usuarios?.nombre || "Sin nombre",
          apellido: jugador.Usuarios?.apellido || "Sin apellido",
          categoria: jugador.categoria,
          rut: jugador.rut,
          fecha_nacimiento: jugador.fecha_nacimiento,
          posicion: jugador.posicion,
        })
      );

      setJugadores(jugadoresTransformados);

      // Cargar asistencias
      const { data: asistenciasData, error } = await supabase
        .from("Asistencia")
        .select(
          `
          *,
          Jugador:Jugador!Asistencia_id_jugador_fkey (
            id_jugador,
            rut,
            fecha_nacimiento,
            categoria,
            posicion,
            Usuarios!Jugador_id_jugador_fkey (
              nombre,
              apellido,
              correo
            )
          ),
          Entrenamiento:Entrenamiento!Asistencia_id_entrenamiento_fkey (
            id_entrenamiento,
            fecha_hora,
            lugar,
            descripcion
          ),
          Evento:Evento!Asistencia_id_evento_fkey (
            id_evento,
            fecha_hora,
            ubicacion,
            titulo,
            tipo_evento
          )
        `
        )
        .order("fecha_asistencia", { ascending: false });

      if (error) throw error;

      const asistenciasConInfo = (asistenciasData || []).map(
        (asistencia: any) => ({
          ...asistencia,
          jugador: {
            ...asistencia.Jugador,
            nombre: asistencia.Jugador?.Usuarios?.nombre || "Sin nombre",
            apellido: asistencia.Jugador?.Usuarios?.apellido || "Sin apellido",
            categoria: asistencia.Jugador?.categoria,
          },
          entrenamiento: asistencia.Entrenamiento,
          evento: asistencia.Evento,
        })
      );

      setAsistencias(asistenciasConInfo);

      // Cargar eventos futuros para tomar asistencia
      const hoy = new Date();

      // Cargar entrenamientos futuros
      const { data: entrenamientosFuturosData } = await supabase
        .from("Entrenamiento")
        .select("id_entrenamiento, fecha_hora, lugar, descripcion")
        .gte("fecha_hora", hoy.toISOString())
        .order("fecha_hora", { ascending: true });

      // Cargar eventos futuros
      const { data: eventosFuturosData } = await supabase
        .from("Evento")
        .select("id_evento, fecha_hora, ubicacion, titulo, tipo_evento")
        .gte("fecha_hora", hoy.toISOString())
        .order("fecha_hora", { ascending: true });

      // Procesar eventos futuros
      const eventosFuturosProcesados: EventoConAsistencias[] = [];

      if (entrenamientosFuturosData) {
        entrenamientosFuturosData.forEach((entrenamiento: any) => {
          // Verificar si ya existe en eventos futuros
          const existe = eventosFuturosProcesados.some(
            (evento) =>
              evento.id === entrenamiento.id_entrenamiento &&
              evento.tipo === "entrenamiento"
          );

          if (!existe) {
            eventosFuturosProcesados.push({
              id: entrenamiento.id_entrenamiento,
              tipo: "entrenamiento",
              titulo: `Entrenamiento - ${formatDateTime(
                entrenamiento.fecha_hora
              )}`,
              fecha_hora: entrenamiento.fecha_hora,
              lugar: entrenamiento.lugar,
              descripcion: entrenamiento.descripcion,
              asistencias: [],
              estadisticas: {
                total: 0,
                presentes: 0,
                ausentes: 0,
                justificados: 0,
                tasaAsistencia: 0,
              },
            });
          }
        });
      }

      if (eventosFuturosData) {
        eventosFuturosData.forEach((evento: any) => {
          // Verificar si ya existe en eventos futuros
          const existe = eventosFuturosProcesados.some(
            (ev) => ev.id === evento.id_evento && ev.tipo === "evento"
          );

          if (!existe) {
            eventosFuturosProcesados.push({
              id: evento.id_evento,
              tipo: "evento",
              titulo: `${evento.tipo_evento} - ${evento.titulo}`,
              fecha_hora: evento.fecha_hora,
              lugar: evento.ubicacion,
              descripcion: evento.titulo,
              tipo_evento: evento.tipo_evento,
              asistencias: [],
              estadisticas: {
                total: 0,
                presentes: 0,
                ausentes: 0,
                justificados: 0,
                tasaAsistencia: 0,
              },
            });
          }
        });
      }

      setEventosFuturos(eventosFuturosProcesados);

      // Procesar eventos pasados (historial) con asistencias
      const eventosMap = new Map();

      asistenciasConInfo.forEach((asistencia: Asistencia) => {
        // Verificar unicidad de asistencia por jugador y evento
        if (asistencia.id_entrenamiento && asistencia.entrenamiento) {
          const key = `entrenamiento-${asistencia.id_entrenamiento}`;
          if (!eventosMap.has(key)) {
            eventosMap.set(key, {
              id: asistencia.id_entrenamiento,
              tipo: "entrenamiento" as const,
              titulo: `Entrenamiento - ${formatDateTime(
                asistencia.entrenamiento.fecha_hora
              )}`,
              fecha_hora: asistencia.entrenamiento.fecha_hora,
              lugar: asistencia.entrenamiento.lugar,
              descripcion: asistencia.entrenamiento.descripcion,
              asistencias: [],
              estadisticas: {
                total: 0,
                presentes: 0,
                ausentes: 0,
                justificados: 0,
                tasaAsistencia: 0,
              },
            });
          }
          const evento = eventosMap.get(key);

          // Verificar que el jugador no esté duplicado en este evento
          const jugadorYaExiste = evento.asistencias.some(
            (a: Asistencia) => a.id_jugador === asistencia.id_jugador
          );

          if (!jugadorYaExiste) {
            evento.asistencias.push(asistencia);
          }
        } else if (asistencia.id_evento && asistencia.evento) {
          const key = `evento-${asistencia.id_evento}`;
          if (!eventosMap.has(key)) {
            eventosMap.set(key, {
              id: asistencia.id_evento,
              tipo: "evento" as const,
              titulo: `${asistencia.evento.tipo_evento} - ${asistencia.evento.titulo}`,
              fecha_hora: asistencia.evento.fecha_hora,
              lugar: asistencia.evento.ubicacion,
              descripcion: asistencia.evento.titulo,
              tipo_evento: asistencia.evento.tipo_evento,
              asistencias: [],
              estadisticas: {
                total: 0,
                presentes: 0,
                ausentes: 0,
                justificados: 0,
                tasaAsistencia: 0,
              },
            });
          }
          const evento = eventosMap.get(key);

          // Verificar que el jugador no esté duplicado en este evento
          const jugadorYaExiste = evento.asistencias.some(
            (a: Asistencia) => a.id_jugador === asistencia.id_jugador
          );

          if (!jugadorYaExiste) {
            evento.asistencias.push(asistencia);
          }
        }
      });

      const eventosConStats = Array.from(eventosMap.values()).map((evento) => {
        const total = evento.asistencias.length;
        const presentes = evento.asistencias.filter(
          (a: Asistencia) => a.estado_asistencia === "Presente"
        ).length;
        const ausentes = evento.asistencias.filter(
          (a: Asistencia) => a.estado_asistencia === "Ausente"
        ).length;
        const justificados = evento.asistencias.filter(
          (a: Asistencia) => a.estado_asistencia === "Justificado"
        ).length;
        const tasaAsistencia =
          total > 0 ? Math.round((presentes / total) * 100) : 0;

        return {
          ...evento,
          estadisticas: {
            total,
            presentes,
            ausentes,
            justificados,
            tasaAsistencia,
          },
        };
      });

      eventosConStats.sort(
        (a, b) =>
          new Date(b.fecha_hora).getTime() - new Date(a.fecha_hora).getTime()
      );
      setEventosConAsistencias(eventosConStats);
    } catch (error) {
      Alert.alert("Error", "No se pudieron cargar los datos");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const aplicarFiltros = useCallback(() => {
    let filtrados = eventosConAsistencias;

    if (filtros.tipo !== "todos") {
      filtrados = filtrados.filter((evento) => evento.tipo === filtros.tipo);
    }

    if (filtros.estado !== "todos") {
      filtrados = filtrados.filter((evento) => {
        const tasa = evento.estadisticas.tasaAsistencia;
        switch (filtros.estado) {
          case "alta":
            return tasa >= 80;
          case "media":
            return tasa >= 50 && tasa < 80;
          case "baja":
            return tasa < 50;
          default:
            return true;
        }
      });
    }

    if (filtros.busqueda) {
      const busquedaLower = filtros.busqueda.toLowerCase();
      filtrados = filtrados.filter(
        (evento) =>
          evento.titulo.toLowerCase().includes(busquedaLower) ||
          evento.lugar?.toLowerCase().includes(busquedaLower) ||
          evento.tipo_evento?.toLowerCase().includes(busquedaLower)
      );
    }

    setEventosFiltrados(filtrados);
  }, [eventosConAsistencias, filtros]);

  const tomarAsistencia = async (evento: EventoConAsistencias) => {
    setEventoSeleccionado(evento);
    setModalTomarAsistencia(true);
  };

  const verDetalleEvento = (evento: EventoConAsistencias) => {
    setEventoSeleccionado(evento);
    setModalDetalleEvento(true);
  };

  const verListaJugadores = () => {
    setModalJugadores(true);
  };

  const abrirEditarAsistencia = (asistencia: Asistencia) => {
    setAsistenciaSeleccionada(asistencia);
    setModalDetalleEvento(false); // Cerrar primero el modal de detalle
    setTimeout(() => {
      setModalVisible(true); // Abrir el modal de edición después de un breve delay
    }, 300);
  };

  const cerrarEditarAsistencia = () => {
    setModalVisible(false);
    // Volver a abrir el modal de detalle si existe un evento seleccionado
    if (eventoSeleccionado) {
      setTimeout(() => {
        setModalDetalleEvento(true);
      }, 300);
    }
  };

  const guardarAsistenciaMasiva = async (asistenciasJugadores: any[]) => {
    setGuardando(true);
    try {
      // Verificar que no existan asistencias duplicadas para este evento
      const { data: asistenciasExistentes, error: errorConsulta } =
        await supabase
          .from("Asistencia")
          .select("id_jugador")
          .or(
            `id_entrenamiento.eq.${eventoSeleccionado?.id},id_evento.eq.${eventoSeleccionado?.id}`
          );

      if (errorConsulta) throw errorConsulta;

      const jugadoresConAsistencia = new Set(
        asistenciasExistentes?.map((a) => a.id_jugador) || []
      );

      // Filtrar jugadores que ya tienen asistencia registrada
      const asistenciasNuevas = asistenciasJugadores
        .filter((jugador) => !jugadoresConAsistencia.has(jugador.id_jugador))
        .map((jugadorAsistencia) => ({
          id_jugador: jugadorAsistencia.id_jugador,
          [eventoSeleccionado?.tipo === "entrenamiento"
            ? "id_entrenamiento"
            : "id_evento"]: eventoSeleccionado?.id,
          fecha_asistencia: new Date().toISOString().split("T")[0],
          estado_asistencia: jugadorAsistencia.estado,
        }));

      if (asistenciasNuevas.length === 0) {
        Alert.alert(
          "Información",
          "Todos los jugadores ya tienen asistencia registrada para este evento"
        );
        setModalTomarAsistencia(false);
        return;
      }

      const { error } = await supabase
        .from("Asistencia")
        .insert(asistenciasNuevas);

      if (error) throw error;

      Alert.alert("Éxito", "Asistencias registradas correctamente");
      setModalTomarAsistencia(false);
      cargarDatos();
    } catch (error: any) {
      Alert.alert(
        "Error",
        error.message || "No se pudieron guardar las asistencias"
      );
    } finally {
      setGuardando(false);
    }
  };

  const actualizarAsistencia = async (
    asistencia: Asistencia,
    nuevoEstado: string
  ) => {
    try {
      const { error } = await supabase
        .from("Asistencia")
        .update({
          estado_asistencia: nuevoEstado,
        })
        .eq("id_asistencia", asistencia.id_asistencia);

      if (error) throw error;

      Alert.alert("Éxito", "Asistencia actualizada correctamente");
      cargarDatos();
      cerrarEditarAsistencia(); // Usar la nueva función para cerrar
    } catch (error: any) {
      Alert.alert(
        "Error",
        error.message || "No se pudo actualizar la asistencia"
      );
    }
  };

  const eliminarAsistencia = async (asistencia: Asistencia) => {
    Alert.alert(
      "Confirmar eliminación",
      `¿Estás seguro de eliminar esta asistencia?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              const { error } = await supabase
                .from("Asistencia")
                .delete()
                .eq("id_asistencia", asistencia.id_asistencia);

              if (error) throw error;

              Alert.alert("Éxito", "Asistencia eliminada correctamente");
              cargarDatos();
              cerrarEditarAsistencia(); // Usar la nueva función para cerrar
            } catch (error) {
              Alert.alert("Error", "No se pudo eliminar la asistencia");
            }
          },
        },
      ]
    );
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    cargarDatos();
  }, [cargarDatos]);

  useEffect(() => {
    if (user) {
      cargarDatos();
    }
  }, [user, cargarDatos]);

  useEffect(() => {
    aplicarFiltros();
  }, [aplicarFiltros]);

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case "Presente":
        return colors.success;
      case "Ausente":
        return colors.error;
      case "Justificado":
        return colors.warning;
      case "Sin registro":
        return colors.text.secondary;
      default:
        return colors.text.secondary;
    }
  };

  const getTasaColor = (tasa: number) => {
    if (tasa >= 80) return colors.success;
    if (tasa >= 50) return colors.warning;
    return colors.error;
  };

  const TomarAsistenciaModal = () => {
    const [asistenciasJugadores, setAsistenciasJugadores] = useState<any[]>([]);

    useEffect(() => {
      const cargarJugadores = async () => {
        const { data: jugadoresData } = await supabase
          .from("Jugador")
          .select(
            `
            id_jugador,
            categoria,
            Usuarios!Jugador_id_jugador_fkey (nombre, apellido)
          `
          )
          .order("categoria");

        if (jugadoresData) {
          const jugadoresTransformados = jugadoresData.map((jugador: any) => ({
            id_jugador: jugador.id_jugador,
            nombre: jugador.Usuarios?.nombre || "Sin nombre",
            apellido: jugador.Usuarios?.apellido || "Sin apellido",
            categoria: jugador.categoria,
            estado: "Presente",
          }));
          setAsistenciasJugadores(jugadoresTransformados);
        }
      };

      cargarJugadores();
    }, []);

    const cambiarEstadoJugador = (jugadorId: string, nuevoEstado: string) => {
      setAsistenciasJugadores((prev) =>
        prev.map((jugador) =>
          jugador.id_jugador === jugadorId
            ? { ...jugador, estado: nuevoEstado }
            : jugador
        )
      );
    };

    const guardar = () => {
      guardarAsistenciaMasiva(asistenciasJugadores);
    };

    return (
      <CustomModal
        visible={modalTomarAsistencia}
        onClose={() => setModalTomarAsistencia(false)}
        title={`Tomar Asistencia - ${eventoSeleccionado?.titulo}`}
      >
        <View style={styles.modalBody}>
          <View style={styles.eventoInfoCard}>
            <Ionicons
              name={
                eventoSeleccionado?.tipo === "entrenamiento"
                  ? "fitness"
                  : "trophy"
              }
              size={24}
              color={colors.primary}
            />
            <View style={styles.eventoInfoContent}>
              <Text style={styles.eventoInfoTitulo}>
                {eventoSeleccionado?.titulo}
              </Text>
              <Text style={styles.eventoInfoDetalle}>
                {eventoSeleccionado?.lugar && `${eventoSeleccionado.lugar}`}
              </Text>
              <Text style={styles.eventoInfoDetalle}>
                {eventoSeleccionado?.fecha_hora
                  ? `${formatDateTime(eventoSeleccionado.fecha_hora)}`
                  : ""}
              </Text>
            </View>
          </View>

          <View style={styles.campoContainer}>
            <Text style={styles.campoLabel}>Asistencia de Jugadores</Text>
            <ScrollView
              style={styles.selectorScroll}
              nestedScrollEnabled={true}
            >
              <View style={styles.selector}>
                {asistenciasJugadores.map((jugador) => (
                  <View
                    key={jugador.id_jugador}
                    style={styles.jugadorAsistenciaItem}
                  >
                    <View style={styles.jugadorInfo}>
                      <View style={styles.avatarSmall}>
                        <Text style={styles.avatarSmallText}>
                          {jugador.nombre?.charAt(0)}
                          {jugador.apellido?.charAt(0)}
                        </Text>
                      </View>
                      <View>
                        <Text style={styles.jugadorNombre}>
                          {jugador.nombre} {jugador.apellido}
                        </Text>
                        <Text style={styles.jugadorCategoria}>
                          {jugador.categoria}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.estadosJugador}>
                      {(["Presente", "Ausente", "Justificado"] as const).map(
                        (estado) => (
                          <TouchableOpacity
                            key={estado}
                            style={[
                              styles.estadoJugadorOption,
                              jugador.estado === estado &&
                                styles.estadoJugadorOptionActive,
                              { borderColor: getEstadoColor(estado) },
                            ]}
                            onPress={() =>
                              cambiarEstadoJugador(jugador.id_jugador, estado)
                            }
                          >
                            <Ionicons
                              name={
                                estado === "Presente"
                                  ? "checkmark"
                                  : estado === "Ausente"
                                  ? "close"
                                  : "time"
                              }
                              size={14}
                              color={
                                jugador.estado === estado
                                  ? colors.text.inverse
                                  : getEstadoColor(estado)
                              }
                            />
                          </TouchableOpacity>
                        )
                      )}
                    </View>
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
        <View style={styles.botonesAccion}>
          <TouchableOpacity
            style={styles.botonCancelar}
            onPress={() => setModalTomarAsistencia(false)}
          >
            <Text style={styles.botonCancelarTexto}>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.botonGuardar,
              guardando && styles.botonGuardarDisabled,
            ]}
            onPress={guardar}
            disabled={guardando}
          >
            {guardando ? (
              <ActivityIndicator size="small" color={colors.text.inverse} />
            ) : (
              <>
                <Ionicons
                  name="save-outline"
                  size={18}
                  color={colors.text.inverse}
                />
                <Text style={styles.botonGuardarTexto}>Guardar</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </CustomModal>
    );
  };

  const DetalleEventoModal = () => {
    if (!eventoSeleccionado) return null;

    return (
      <CustomModal
        visible={modalDetalleEvento}
        onClose={() => setModalDetalleEvento(false)}
        title={`Detalle - ${eventoSeleccionado.titulo}`}
      >
        <View style={styles.modalBody}>
          <View style={styles.eventoInfoCard}>
            <Ionicons
              name={
                eventoSeleccionado.tipo === "entrenamiento"
                  ? "fitness"
                  : "trophy"
              }
              size={24}
              color={colors.primary}
            />
            <View style={styles.eventoInfoContent}>
              <Text style={styles.eventoInfoTitulo}>
                {eventoSeleccionado.titulo}
              </Text>
              <Text style={styles.eventoInfoDetalle}>
                {eventoSeleccionado.lugar && `${eventoSeleccionado.lugar}`}
              </Text>
              <Text style={styles.eventoInfoDetalle}>
                {`${formatDateTime(eventoSeleccionado.fecha_hora)}`}
              </Text>
              {eventoSeleccionado.tipo_evento && (
                <Text style={styles.eventoInfoDetalle}>
                  {`${eventoSeleccionado.tipo_evento}`}
                </Text>
              )}
            </View>
          </View>

          <View style={styles.statsGridMini}>
            <View style={styles.statMiniCard}>
              <Text style={styles.statMiniValue}>
                {eventoSeleccionado.estadisticas.total}
              </Text>
              <Text style={styles.statMiniLabel}>Total</Text>
            </View>
            <View style={styles.statMiniCard}>
              <Text style={[styles.statMiniValue, { color: colors.success }]}>
                {eventoSeleccionado.estadisticas.presentes}
              </Text>
              <Text style={styles.statMiniLabel}>Presentes</Text>
            </View>
            <View style={styles.statMiniCard}>
              <Text style={[styles.statMiniValue, { color: colors.error }]}>
                {eventoSeleccionado.estadisticas.ausentes}
              </Text>
              <Text style={styles.statMiniLabel}>Ausentes</Text>
            </View>
            <View style={styles.statMiniCard}>
              <Text
                style={[
                  styles.statMiniValue,
                  {
                    color: getTasaColor(
                      eventoSeleccionado.estadisticas.tasaAsistencia
                    ),
                  },
                ]}
              >
                {eventoSeleccionado.estadisticas.tasaAsistencia}%
              </Text>
              <Text style={styles.statMiniLabel}>Asistencia</Text>
            </View>
          </View>

          <View style={styles.campoContainer}>
            <Text style={styles.campoLabel}>
              Asistencias ({eventoSeleccionado.asistencias.length})
            </Text>
            <ScrollView
              style={styles.selectorScroll}
              nestedScrollEnabled={true}
            >
              <View style={styles.selector}>
                {eventoSeleccionado.asistencias.map((asistencia) => (
                  <TouchableOpacity
                    key={asistencia.id_asistencia}
                    style={styles.jugadorAsistenciaItem}
                    onPress={() => abrirEditarAsistencia(asistencia)}
                  >
                    <View style={styles.jugadorInfo}>
                      <View style={styles.avatarSmall}>
                        <Text style={styles.avatarSmallText}>
                          {asistencia.jugador?.nombre?.charAt(0)}
                          {asistencia.jugador?.apellido?.charAt(0)}
                        </Text>
                      </View>
                      <View>
                        <Text style={styles.jugadorNombre}>
                          {asistencia.jugador?.nombre}{" "}
                          {asistencia.jugador?.apellido}
                        </Text>
                        <Text style={styles.jugadorCategoria}>
                          {asistencia.jugador?.categoria}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.estadoContainer}>
                      <View
                        style={[
                          styles.estadoBadge,
                          {
                            backgroundColor: getEstadoColor(
                              asistencia.estado_asistencia
                            ),
                          },
                        ]}
                      >
                        <Text style={styles.estadoText}>
                          {asistencia.estado_asistencia}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
        <View style={styles.botonesAccion}>
          <TouchableOpacity
            style={styles.botonCancelar}
            onPress={() => setModalDetalleEvento(false)}
          >
            <Text style={styles.botonCancelarTexto}>Cerrar</Text>
          </TouchableOpacity>
        </View>
      </CustomModal>
    );
  };

  const JugadoresModal = () => {
    return (
      <CustomModal
        visible={modalJugadores}
        onClose={() => setModalJugadores(false)}
        title="Lista de Jugadores"
      >
        <View style={styles.modalBody}>
          <View style={styles.campoContainer}>
            <Text style={styles.campoLabel}>
              Total de Jugadores: {jugadores.length}
            </Text>
            <ScrollView
              style={styles.selectorScroll}
              nestedScrollEnabled={true}
            >
              <View style={styles.selector}>
                {jugadores.map((jugador) => (
                  <View
                    key={jugador.id_jugador}
                    style={styles.jugadorAsistenciaItem}
                  >
                    <View style={styles.jugadorInfo}>
                      <View style={styles.avatarSmall}>
                        <Text style={styles.avatarSmallText}>
                          {jugador.nombre?.charAt(0)}
                          {jugador.apellido?.charAt(0)}
                        </Text>
                      </View>
                      <View style={styles.jugadorInfoText}>
                        <Text style={styles.jugadorNombre}>
                          {jugador.nombre} {jugador.apellido}
                        </Text>
                        <Text style={styles.jugadorCategoria}>
                          {jugador.categoria}{" "}
                          {jugador.posicion && `• ${jugador.posicion}`}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.estadoContainer}>
                      <Ionicons
                        name="person-outline"
                        size={20}
                        color={colors.text.tertiary}
                      />
                    </View>
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
        <View style={styles.botonesAccion}>
          <TouchableOpacity
            style={styles.botonCancelar}
            onPress={() => setModalJugadores(false)}
          >
            <Text style={styles.botonCancelarTexto}>Cerrar</Text>
          </TouchableOpacity>
        </View>
      </CustomModal>
    );
  };

  if (loading && asistencias.length === 0) {
    return (
      <View style={styles.container}>
        <StatusBar
          backgroundColor={colors.secondary}
          barStyle="light-content"
        />
        <View style={styles.header}>
          <Text style={styles.welcome}>Cargando...</Text>
        </View>
        <View style={styles.loadingContent}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Cargando asistencias...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={colors.secondary} barStyle="light-content" />

      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerTextContainer}>
            <Text style={styles.welcome}>Gestión de Asistencia</Text>
            <Text style={styles.subtitle}>Registro y control de asistencia</Text>
          </View>
        </View>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "tomar" && styles.tabActive]}
          onPress={() => setActiveTab("tomar")}
        >
          <Ionicons
            name="clipboard-outline"
            size={20}
            color={
              activeTab === "tomar" ? colors.primary : colors.text.secondary
            }
          />
          <Text
            style={[
              styles.tabText,
              activeTab === "tomar" && styles.tabTextActive,
            ]}
          >
            Tomar Asistencia
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "historial" && styles.tabActive]}
          onPress={() => setActiveTab("historial")}
        >
          <Ionicons
            name="time-outline"
            size={20}
            color={
              activeTab === "historial" ? colors.primary : colors.text.secondary
            }
          />
          <Text
            style={[
              styles.tabText,
              activeTab === "historial" && styles.tabTextActive,
            ]}
          >
            Historial
          </Text>
        </TouchableOpacity>
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
            <TouchableOpacity
              style={styles.statCard}
              onPress={verListaJugadores}
            >
              <View style={styles.statIconContainer}>
                <Ionicons name="people" size={24} color={colors.primary} />
              </View>
              <View style={styles.statContent}>
                <Text style={styles.statValue}>{stats.totalJugadores}</Text>
                <Text style={styles.statLabel}>Jugadores</Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={colors.text.tertiary}
              />
            </TouchableOpacity>

            <View style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <Ionicons name="today" size={24} color={colors.success} />
              </View>
              <View style={styles.statContent}>
                <Text style={styles.statValue}>{stats.eventosHoy}</Text>
                <Text style={styles.statLabel}>Eventos Hoy</Text>
              </View>
            </View>

            <View style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <Ionicons name="calendar" size={24} color={colors.warning} />
              </View>
              <View style={styles.statContent}>
                <Text style={styles.statValue}>{stats.eventosSemana}</Text>
                <Text style={styles.statLabel}>Esta Semana</Text>
              </View>
            </View>

            <View style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <Ionicons
                  name="checkmark-done"
                  size={24}
                  color={colors.jugador}
                />
              </View>
              <View style={styles.statContent}>
                <Text style={styles.statValue}>
                  {stats.jugadoresConAsistenciaHoy}
                </Text>
                <Text style={styles.statLabel}>Asistencias Hoy</Text>
              </View>
            </View>
          </View>
        </View>

        {activeTab === "tomar" ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Próximos Eventos</Text>
              <Text style={styles.sectionSubtitle}>
                Selecciona para tomar asistencia
              </Text>
            </View>
            <View style={styles.eventosContainer}>
              {eventosMostrados.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons
                    name="calendar-outline"
                    size={48}
                    color={colors.text.tertiary}
                  />
                  <Text style={styles.emptyTitle}>No hay eventos próximos</Text>
                  <Text style={styles.emptySubtitle}>
                    Los eventos futuros aparecerán aquí
                  </Text>
                </View>
              ) : (
                <>
                  {eventosMostrados.map((evento) => (
                    <TouchableOpacity
                      key={`${evento.tipo}-${evento.id}`}
                      style={styles.eventoCard}
                      onPress={() => tomarAsistencia(evento)}
                    >
                      <View style={styles.eventoIconContainer}>
                        <Ionicons
                          name={
                            evento.tipo === "entrenamiento"
                              ? "fitness"
                              : "trophy"
                          }
                          size={24}
                          color={colors.primary}
                        />
                      </View>
                      <View style={styles.eventoInfo}>
                        <Text style={styles.eventoTitulo}>{evento.titulo}</Text>
                        <View style={styles.eventoMeta}>
                          <View style={styles.eventoMetaItem}>
                            <Ionicons
                              name="time-outline"
                              size={12}
                              color={colors.text.secondary}
                            />
                            <Text style={styles.eventoMetaText}>
                              {formatDateTime(evento.fecha_hora)}
                            </Text>
                          </View>
                          {evento.lugar && (
                            <View style={styles.eventoMetaItem}>
                              <Ionicons
                                name="location-outline"
                                size={12}
                                color={colors.text.secondary}
                              />
                              <Text style={styles.eventoMetaText}>
                                {evento.lugar}
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>
                      <View style={styles.eventoAction}>
                        <Ionicons
                          name="chevron-forward"
                          size={20}
                          color={colors.text.tertiary}
                        />
                      </View>
                    </TouchableOpacity>
                  ))}
                  {eventosFuturos.length > LIMITE_EVENTOS && (
                    <TouchableOpacity
                      style={styles.botonMostrarMas}
                      onPress={() => setMostrarMasEventos(!mostrarMasEventos)}
                    >
                      <Text style={styles.botonMostrarMasTexto}>
                        {mostrarMasEventos
                          ? "Mostrar menos"
                          : `Mostrar más (${
                              eventosFuturos.length - LIMITE_EVENTOS
                            })`}
                      </Text>
                      <Ionicons
                        name={mostrarMasEventos ? "chevron-up" : "chevron-down"}
                        size={16}
                        color={colors.primary}
                      />
                    </TouchableOpacity>
                  )}
                </>
              )}
            </View>
          </View>
        ) : (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>Historial de Eventos</Text>
                <Text style={styles.sectionSubtitle}>
                  {eventosFiltrados.length} eventos registrados
                </Text>
              </View>
            </View>

            <View style={styles.filtrosContainer}>
              <View style={styles.busquedaContainer}>
                <Ionicons
                  name="search"
                  size={18}
                  color={colors.text.secondary}
                />
                <TextInput
                  style={styles.busquedaInput}
                  placeholder="Buscar evento..."
                  value={filtros.busqueda}
                  onChangeText={(text) =>
                    setFiltros((prev) => ({ ...prev, busqueda: text }))
                  }
                  placeholderTextColor={colors.text.tertiary}
                />
              </View>

              <View style={styles.filtrosGrid}>
                <View style={styles.filtroGroup}>
                  <Text style={styles.filtroLabel}>Tipo</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.filtrosChips}>
                      {["todos", "entrenamiento", "evento"].map((tipo) => (
                        <TouchableOpacity
                          key={tipo}
                          style={[
                            styles.filtroChip,
                            filtros.tipo === tipo && styles.filtroChipActive,
                          ]}
                          onPress={() =>
                            setFiltros((prev) => ({ ...prev, tipo }))
                          }
                        >
                          <Text
                            style={[
                              styles.filtroChipText,
                              filtros.tipo === tipo &&
                                styles.filtroChipTextActive,
                            ]}
                          >
                            {tipo === "todos" ? "Todos" : tipo}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                </View>

                <View style={styles.filtroGroup}>
                  <Text style={styles.filtroLabel}>Asistencia</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.filtrosChips}>
                      {["todos", "alta", "media", "baja"].map((estado) => (
                        <TouchableOpacity
                          key={estado}
                          style={[
                            styles.filtroChip,
                            filtros.estado === estado &&
                              styles.filtroChipActive,
                          ]}
                          onPress={() =>
                            setFiltros((prev) => ({ ...prev, estado }))
                          }
                        >
                          <Text
                            style={[
                              styles.filtroChipText,
                              filtros.estado === estado &&
                                styles.filtroChipTextActive,
                            ]}
                          >
                            {estado === "todos"
                              ? "Todas"
                              : estado === "alta"
                              ? "Alta ≥80%"
                              : estado === "media"
                              ? "Media 50-79%"
                              : "Baja <50%"}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                </View>
              </View>
            </View>

            {historialMostrado.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons
                  name="search-outline"
                  size={48}
                  color={colors.text.tertiary}
                />
                <Text style={styles.emptyTitle}>
                  {eventosConAsistencias.length === 0
                    ? "No hay eventos registrados"
                    : "No se encontraron eventos"}
                </Text>
                <Text style={styles.emptySubtitle}>
                  {eventosConAsistencias.length === 0
                    ? "Comienza tomando asistencia en un evento"
                    : "Intenta con otros filtros de búsqueda"}
                </Text>
              </View>
            ) : (
              <View style={styles.asistenciasList}>
                {historialMostrado.map((evento) => (
                  <TouchableOpacity
                    key={`${evento.tipo}-${evento.id}`}
                    style={styles.eventoCard}
                    onPress={() => verDetalleEvento(evento)}
                  >
                    <View style={styles.eventoIconContainer}>
                      <Ionicons
                        name={
                          evento.tipo === "entrenamiento" ? "fitness" : "trophy"
                        }
                        size={24}
                        color={colors.primary}
                      />
                    </View>
                    <View style={styles.eventoInfo}>
                      <Text style={styles.eventoTitulo}>{evento.titulo}</Text>
                      <View style={styles.eventoMeta}>
                        <View style={styles.eventoMetaItem}>
                          <Ionicons
                            name="time-outline"
                            size={12}
                            color={colors.text.secondary}
                          />
                          <Text style={styles.eventoMetaText}>
                            {formatDateTime(evento.fecha_hora)}
                          </Text>
                        </View>
                        {evento.lugar && (
                          <View style={styles.eventoMetaItem}>
                            <Ionicons
                              name="location-outline"
                              size={12}
                              color={colors.text.secondary}
                            />
                            <Text style={styles.eventoMetaText}>
                              {evento.lugar}
                            </Text>
                          </View>
                        )}
                      </View>
                      <View style={styles.eventoStats}>
                        <View style={styles.statItem}>
                          <Ionicons
                            name="checkmark"
                            size={12}
                            color={colors.success}
                          />
                          <Text style={styles.statText}>
                            {evento.estadisticas.presentes}
                          </Text>
                        </View>
                        <View style={styles.statItem}>
                          <Ionicons
                            name="close"
                            size={12}
                            color={colors.error}
                          />
                          <Text style={styles.statText}>
                            {evento.estadisticas.ausentes}
                          </Text>
                        </View>
                        <View style={styles.statItem}>
                          <Text
                            style={[
                              styles.tasaText,
                              {
                                color: getTasaColor(
                                  evento.estadisticas.tasaAsistencia
                                ),
                              },
                            ]}
                          >
                            {evento.estadisticas.tasaAsistencia}%
                          </Text>
                        </View>
                      </View>
                    </View>
                    <View style={styles.eventoAction}>
                      <Ionicons
                        name="chevron-forward"
                        size={20}
                        color={colors.text.tertiary}
                      />
                    </View>
                  </TouchableOpacity>
                ))}
                {eventosFiltrados.length > LIMITE_HISTORIAL && (
                  <TouchableOpacity
                    style={styles.botonMostrarMas}
                    onPress={() => setMostrarMasHistorial(!mostrarMasHistorial)}
                  >
                    <Text style={styles.botonMostrarMasTexto}>
                      {mostrarMasHistorial
                        ? "Mostrar menos"
                        : `Mostrar más (${
                            eventosFiltrados.length - LIMITE_HISTORIAL
                          })`}
                    </Text>
                    <Ionicons
                      name={mostrarMasHistorial ? "chevron-up" : "chevron-down"}
                      size={16}
                      color={colors.primary}
                    />
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <CustomModal
        visible={modalVisible}
        onClose={cerrarEditarAsistencia}
        title="Editar Asistencia"
      >
        <View style={styles.modalBody}>
          <View style={styles.campoContainer}>
            <Text style={styles.campoLabel}>Jugador</Text>
            <View style={styles.jugadorInfoModal}>
              <View style={styles.avatarSmall}>
                <Text style={styles.avatarSmallText}>
                  {asistenciaSeleccionada?.jugador?.nombre?.charAt(0)}
                  {asistenciaSeleccionada?.jugador?.apellido?.charAt(0)}
                </Text>
              </View>
              <View>
                <Text style={styles.jugadorNombreModal}>
                  {asistenciaSeleccionada?.jugador?.nombre}{" "}
                  {asistenciaSeleccionada?.jugador?.apellido}
                </Text>
                <Text style={styles.jugadorCategoriaModal}>
                  {asistenciaSeleccionada?.jugador?.categoria}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.campoContainer}>
            <Text style={styles.campoLabel}>Estado Actual</Text>
            <View style={styles.estadoActual}>
              <View
                style={[
                  styles.estadoBadge,
                  {
                    backgroundColor: getEstadoColor(
                      asistenciaSeleccionada?.estado_asistencia || ""
                    ),
                  },
                ]}
              >
                <Text style={styles.estadoText}>
                  {asistenciaSeleccionada?.estado_asistencia}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.campoContainer}>
            <Text style={styles.campoLabel}>Cambiar Estado</Text>
            <View style={styles.estadosGrid}>
              {(["Presente", "Ausente", "Justificado"] as const).map(
                (estado) => (
                  <TouchableOpacity
                    key={estado}
                    style={[
                      styles.estadoOption,
                      asistenciaSeleccionada?.estado_asistencia === estado &&
                        styles.estadoOptionActive,
                      { borderColor: getEstadoColor(estado) },
                    ]}
                    onPress={() => {
                      if (asistenciaSeleccionada) {
                        actualizarAsistencia(asistenciaSeleccionada, estado);
                      }
                    }}
                  >
                    <Ionicons
                      name={
                        estado === "Presente"
                          ? "checkmark-circle"
                          : estado === "Ausente"
                          ? "close-circle"
                          : "time"
                      }
                      size={20}
                      color={
                        asistenciaSeleccionada?.estado_asistencia === estado
                          ? colors.text.inverse
                          : getEstadoColor(estado)
                      }
                    />
                    <Text
                      style={[
                        styles.estadoOptionText,
                        asistenciaSeleccionada?.estado_asistencia === estado &&
                          styles.estadoOptionTextActive,
                      ]}
                    >
                      {estado}
                    </Text>
                  </TouchableOpacity>
                )
              )}
            </View>
          </View>
        </View>
        <View style={styles.botonesAccion}>
          <TouchableOpacity
            style={styles.botonCancelar}
            onPress={cerrarEditarAsistencia}
          >
            <Text style={styles.botonCancelarTexto}>Cerrar</Text>
          </TouchableOpacity>
        </View>
      </CustomModal>

      <TomarAsistenciaModal />
      <DetalleEventoModal />
      <JugadoresModal />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.secondary,
    paddingHorizontal: spacing.xl,
    paddingTop: 20,
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
  tabContainer: {
    flexDirection: "row",
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  tabText: {
    ...typography.label,
    fontSize: 14,
    color: colors.text.secondary,
  },
  tabTextActive: {
    color: colors.primary,
    fontWeight: "700",
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
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.h2,
    fontSize: 20,
    marginBottom: 4,
  },
  sectionSubtitle: {
    ...typography.body,
    color: colors.text.secondary,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    justifyContent: "space-between",
  },
  statCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    flex: 1,
    minWidth: "48%",
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary + "15",
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.md,
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    ...typography.h3,
    fontSize: 18,
    marginBottom: 2,
  },
  statLabel: {
    ...typography.label,
    fontSize: 12,
    color: colors.text.secondary,
  },
  statsGridMini: {
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "space-between",
  },
  statMiniCard: {
    flex: 1,
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  statMiniValue: {
    ...typography.h3,
    fontSize: 18,
    marginBottom: 4,
  },
  statMiniLabel: {
    ...typography.label,
    fontSize: 11,
    color: colors.text.secondary,
  },
  eventosContainer: {
    gap: spacing.md,
  },
  eventoCard: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    ...shadows.sm,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
  },
  eventoIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary + "15",
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.md,
  },
  eventoInfo: {
    flex: 1,
  },
  eventoTitulo: {
    ...typography.h3,
    fontSize: 16,
    marginBottom: 6,
  },
  eventoMeta: {
    gap: 4,
    marginBottom: 8,
  },
  eventoMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  eventoMetaText: {
    ...typography.bodySmall,
    fontSize: 12,
    color: colors.text.secondary,
  },
  eventoStats: {
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "center",
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statText: {
    ...typography.label,
    fontSize: 11,
    color: colors.text.secondary,
  },
  tasaText: {
    ...typography.label,
    fontSize: 12,
    fontWeight: "700",
  },
  eventoAction: {
    marginLeft: spacing.sm,
  },
  eventoInfoCard: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: "flex-start",
    gap: spacing.md,
  },
  eventoInfoContent: {
    flex: 1,
  },
  eventoInfoTitulo: {
    ...typography.h3,
    marginBottom: 6,
  },
  eventoInfoDetalle: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    marginBottom: 2,
  },
  filtrosContainer: {
    backgroundColor: colors.background,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    ...shadows.sm,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  filtrosGrid: {
    gap: spacing.lg,
  },
  busquedaContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  busquedaInput: {
    flex: 1,
    marginLeft: spacing.sm,
    fontSize: 16,
    color: colors.text.primary,
  },
  filtroGroup: {
    gap: spacing.sm,
  },
  filtroLabel: {
    ...typography.label,
    fontSize: 14,
    fontWeight: "600",
  },
  filtrosChips: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  filtroChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
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
    textTransform: "capitalize",
  },
  filtroChipTextActive: {
    color: colors.text.inverse,
  },
  asistenciasList: {
    gap: spacing.md,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.md,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: "bold",
    color: colors.text.inverse,
  },
  avatarSmall: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.md,
  },
  avatarSmallText: {
    fontSize: 12,
    fontWeight: "bold",
    color: colors.text.inverse,
  },
  estadoBadgeContainer: {
    alignItems: "flex-end",
  },
  estadoBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: borderRadius.sm,
    gap: 6,
  },
  estadoText: {
    ...typography.label,
    fontSize: 11,
    color: colors.text.inverse,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  asistenciaActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.lg,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    padding: spacing.sm,
  },
  actionButtonText: {
    ...typography.label,
    fontSize: 12,
    color: colors.primary,
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
    textAlign: "center",
  },
  emptySubtitle: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: "center",
    marginTop: spacing.sm,
  },
  bottomSpacer: {
    height: spacing.xxl,
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
    fontWeight: "600",
  },
  jugadorInfoModal: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  jugadorNombreModal: {
    ...typography.h3,
    fontSize: 16,
  },
  jugadorCategoriaModal: {
    ...typography.bodySmall,
    color: colors.text.secondary,
  },
  estadoActual: {
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
  },
  estadosGrid: {
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "space-between",
  },
  estadoOption: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    minHeight: 60,
  },
  estadoOptionActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  estadoOptionText: {
    ...typography.label,
    fontSize: 14,
    color: colors.text.primary,
  },
  estadoOptionTextActive: {
    color: colors.text.inverse,
  },
  selectorScroll: {
    maxHeight: 400,
  },
  selector: {
    gap: spacing.sm,
  },
  jugadorAsistenciaItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  jugadorInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  jugadorInfoText: {
    flex: 1,
  },
  jugadorNombre: {
    ...typography.body,
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 2,
  },
  jugadorCategoria: {
    ...typography.label,
    fontSize: 12,
    color: colors.text.tertiary,
  },
  estadosJugador: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  estadoJugadorOption: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  estadoJugadorOptionActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  estadoJugadorText: {
    ...typography.label,
    fontSize: 12,
    fontWeight: "bold",
    color: colors.text.primary,
  },
  estadoJugadorTextActive: {
    color: colors.text.inverse,
  },
  estadoContainer: {
    alignItems: "flex-end",
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
    borderRadius: borderRadius.md,
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
    borderRadius: borderRadius.md,
  },
  botonGuardarDisabled: {
    opacity: 0.6,
  },
  botonGuardarTexto: {
    ...typography.label,
    fontSize: 16,
    color: colors.text.inverse,
  },
  botonMostrarMas: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  botonMostrarMasTexto: {
    ...typography.label,
    fontSize: 14,
    color: colors.primary,
    fontWeight: "600",
  },
});
