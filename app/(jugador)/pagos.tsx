import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import { supabase } from "../../supabase/supabaseClient";
import { useAuth } from "../../types/use.auth";

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

const PagosScreen = () => {
  const [mensualidades, setMensualidades] = useState<Mensualidad[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const cargarMensualidades = async () => {
    try {
      setCargando(true);
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
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarMensualidades();
  }, [user?.id]);

  const formatearFecha = (fechaString: string | null) => {
    if (!fechaString) return "Pendiente";

    try {
      const fecha = new Date(fechaString);
      return fecha.toLocaleDateString("es-ES");
    } catch {
      return "Fecha inválida";
    }
  };

  const formatearMonto = (monto: number) => {
    return `$${monto.toLocaleString("es-CL")}`;
  };

  const obtenerNombreMes = (mes: string) => {
    const meses: { [key: string]: string } = {
      "01": "Enero",
      "02": "Febrero",
      "03": "Marzo",
      "04": "Abril",
      "05": "Mayo",
      "06": "Junio",
      "07": "Julio",
      "08": "Agosto",
      "09": "Septiembre",
      "10": "Octubre",
      "11": "Noviembre",
      "12": "Diciembre",
    };
    return meses[mes] || mes;
  };

  const procesarPago = async (mensualidad: Mensualidad) => {
    try {
      if (!user?.id) {
        Alert.alert("Error", "No hay usuario logueado");
        return;
      }

      Alert.alert(
        "Confirmar Pago",
        `¿Estás seguro que deseas pagar la mensualidad de ${obtenerNombreMes(
          mensualidad.mes_referencia
        )} ${mensualidad.anio_referencia} por ${formatearMonto(
          mensualidad.monto
        )}?`,
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
    const pagados = mensualidades.filter(
      (m) => m.estado_pago === "Pagado"
    ).length;
    const pendientes = mensualidades.filter(
      (m) => m.estado_pago === "Pendiente"
    ).length;
    const totalPagado = mensualidades
      .filter((m) => m.estado_pago === "Pagado")
      .reduce((sum, m) => sum + m.monto, 0);
    const totalPendiente = mensualidades
      .filter((m) => m.estado_pago === "Pendiente")
      .reduce((sum, m) => sum + m.monto, 0);

    return { total, pagados, pendientes, totalPagado, totalPendiente };
  };

  const resumen = calcularResumen();

  if (cargando) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#3f3db8ff" />
        <Text style={styles.loadingText}>Cargando mensualidades...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.errorText}>Error al cargar las mensualidades</Text>
        <Text style={styles.errorSubtext}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={cargarMensualidades}
        >
          <Text style={styles.retryButtonText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.userInfo}>
        <Text style={styles.userName}>
          {user?.nombre} {user?.apellido}
        </Text>
        <Text style={styles.userRole}>
          {user?.rol === "jugador"
            ? "Jugador"
            : user?.rol === "apoderado"
            ? "Apoderado"
            : "Usuario"}
        </Text>
      </View>

      <View style={styles.resumenContainer}>
        <Text style={styles.resumenTitle}>Resumen de Pagos</Text>
        <View style={styles.resumenGrid}>
          <View style={styles.resumenItem}>
            <Text style={styles.resumenNumber}>{resumen.total}</Text>
            <Text style={styles.resumenLabel}>Total</Text>
          </View>
          <View style={styles.resumenItem}>
            <Text style={[styles.resumenNumber, styles.pagado]}>
              {resumen.pagados}
            </Text>
            <Text style={styles.resumenLabel}>Pagados</Text>
          </View>
          <View style={styles.resumenItem}>
            <Text style={[styles.resumenNumber, styles.pendiente]}>
              {resumen.pendientes}
            </Text>
            <Text style={styles.resumenLabel}>Pendientes</Text>
          </View>
        </View>
        <View style={styles.resumenMontos}>
          <Text style={styles.resumenMontoLabel}>
            Total pagado:{" "}
            <Text style={styles.montoPagado}>
              {formatearMonto(resumen.totalPagado)}
            </Text>
          </Text>
          <Text style={styles.resumenMontoLabel}>
            Total pendiente:{" "}
            <Text style={styles.montoPendiente}>
              {formatearMonto(resumen.totalPendiente)}
            </Text>
          </Text>
        </View>
      </View>

      <View style={styles.listaContainer}>
        <Text style={styles.listaTitle}>Historial de Mensualidades</Text>

        {mensualidades.length === 0 ? (
          <View style={styles.noDataContainer}>
            <Text style={styles.noDataText}>
              No hay mensualidades registradas
            </Text>
            <Text style={styles.noDataSubtext}>
              {user?.rol === "jugador"
                ? "Las mensualidades se generan automáticamente cada mes"
                : "No hay mensualidades asignadas a este usuario"}
            </Text>
            <TouchableOpacity
              style={styles.infoButton}
              onPress={cargarMensualidades}
            >
              <Text style={styles.infoButtonText}>Actualizar</Text>
            </TouchableOpacity>
          </View>
        ) : (
          mensualidades.map((item) => (
            <View
              key={item.id_mensualidad}
              style={[
                styles.mensualidadCard,
                item.estado_pago === "Pagado" && styles.cardPagado,
                item.estado_pago === "Pendiente" && styles.cardPendiente,
              ]}
            >
              <View style={styles.mensualidadHeader}>
                <Text style={styles.mesText}>
                  {obtenerNombreMes(item.mes_referencia)} {item.anio_referencia}
                </Text>
                <Text
                  style={[
                    styles.estadoBadge,
                    item.estado_pago === "Pagado" && styles.estadoPagado,
                    item.estado_pago === "Pendiente" && styles.estadoPendiente,
                    item.estado_pago === "Cancelado" && styles.estadoCancelado,
                  ]}
                >
                  {item.estado_pago}
                </Text>
              </View>

              <View style={styles.mensualidadBody}>
                <View style={styles.mensualidadInfo}>
                  <Text style={styles.montoText}>
                    {formatearMonto(item.monto)}
                  </Text>
                  <Text style={styles.fechaText}>
                    Vence: {formatearFecha(item.fecha_vencimiento)}
                  </Text>
                  {item.fecha_pago && (
                    <Text style={styles.fechaText}>
                      Pagado: {formatearFecha(item.fecha_pago)}
                    </Text>
                  )}
                  {item.metodo_pago && (
                    <Text style={styles.metodoText}>
                      Método: {item.metodo_pago}
                    </Text>
                  )}
                </View>

                {item.estado_pago === "Pendiente" && (
                  <TouchableOpacity
                    style={styles.pagarButton}
                    onPress={() => procesarPago(item)}
                  >
                    <Text style={styles.pagarButtonText}>Pagar</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))
        )}
      </View>

      <TouchableOpacity
        style={styles.actualizarButton}
        onPress={cargarMensualidades}
      >
        <Text style={styles.actualizarButtonText}>Actualizar Lista</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    padding: 16,
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  userInfo: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userName: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    color: "#333",
  },
  userRole: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginTop: 4,
  },
  resumenContainer: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resumenTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#333",
  },
  resumenGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  resumenItem: {
    alignItems: "center",
  },
  resumenNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#3f3db8ff",
  },
  pagado: {
    color: "#4CAF50",
  },
  pendiente: {
    color: "#FF9800",
  },
  resumenLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  resumenMontos: {
    borderTopWidth: 1,
    borderTopColor: "#eee",
    paddingTop: 12,
  },
  resumenMontoLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  montoPagado: {
    color: "#4CAF50",
    fontWeight: "bold",
  },
  montoPendiente: {
    color: "#FF9800",
    fontWeight: "bold",
  },
  listaContainer: {
    marginBottom: 16,
  },
  listaTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#333",
  },
  noDataContainer: {
    backgroundColor: "#fff",
    padding: 32,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  noDataText: {
    fontSize: 16,
    color: "#666",
    marginBottom: 8,
    textAlign: "center",
  },
  noDataSubtext: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    marginBottom: 16,
  },
  infoButton: {
    backgroundColor: "#3f3db8ff",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  infoButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
  mensualidadCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardPagado: {
    borderLeftWidth: 4,
    borderLeftColor: "#4CAF50",
  },
  cardPendiente: {
    borderLeftWidth: 4,
    borderLeftColor: "#FF9800",
  },
  mensualidadHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  mesText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  estadoBadge: {
    fontSize: 12,
    fontWeight: "bold",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  estadoPagado: {
    backgroundColor: "#E8F5E8",
    color: "#4CAF50",
  },
  estadoPendiente: {
    backgroundColor: "#FFF3E0",
    color: "#FF9800",
  },
  estadoCancelado: {
    backgroundColor: "#FFEBEE",
    color: "#F44336",
  },
  mensualidadBody: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  mensualidadInfo: {
    flex: 1,
  },
  montoText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  fechaText: {
    fontSize: 12,
    color: "#666",
    marginBottom: 2,
  },
  metodoText: {
    fontSize: 12,
    color: "#666",
    fontStyle: "italic",
  },
  pagarButton: {
    backgroundColor: "#3f3db8ff",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  pagarButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
  actualizarButton: {
    backgroundColor: "#6c757d",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 32,
  },
  actualizarButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#3f3db8ff",
  },
  errorText: {
    color: "#F44336",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
  },
  errorSubtext: {
    color: "#666",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  retryButton: {
    backgroundColor: "#3f3db8ff",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
});

export default PagosScreen;
