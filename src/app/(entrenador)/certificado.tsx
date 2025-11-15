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

interface Certificado {
  id_certificado: string;
  titulo: string;
  descripcion: string;
  fecha_emision: string;
  tipo_certificado: string;
  archivo_url: string | null;
  id_jugador: string;
  jugador?: {
    nombre: string;
    apellido: string;
    correo: string;
  };
}

export default function EntrenadorCertificadoScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [certificados, setCertificados] = useState<Certificado[]>([]);
  const [loading, setLoading] = useState(true);

  const cargarCertificados = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("Certificado")
        .select(`
          *,
          jugador:Usuarios!Certificado_id_jugador_fkey (
            nombre,
            apellido,
            correo
          )
        `)
        .order("fecha_emision", { ascending: false });

      if (error) throw error;
      setCertificados(data || []);
    } catch (error) {
      console.error("Error cargando certificados:", error);
      Alert.alert("Error", "No se pudieron cargar los certificados");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarCertificados();
  }, []);

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case "participacion": return "#059669";
      case "logro": return "#D97706";
      case "asistencia": return "#7C3AED";
      case "reconocimiento": return "#DC2626";
      default: return colors.entrenador;
    }
  };

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case "participacion": return "trophy";
      case "logro": return "medal";
      case "asistencia": return "calendar";
      case "reconocimiento": return "star";
      default: return "document";
    }
  };

  const getTipoLabel = (tipo: string) => {
    switch (tipo) {
      case "participacion": return "Participación";
      case "logro": return "Logro";
      case "asistencia": return "Asistencia";
      case "reconocimiento": return "Reconocimiento";
      default: return tipo;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const descargarCertificado = async (certificado: Certificado) => {
    if (!certificado.archivo_url) {
      Alert.alert("No disponible", "Este certificado no tiene archivo adjunto");
      return;
    }
    Alert.alert("Descargar", "Funcionalidad de descarga próximamente");
  };

  if (loading) {
    return (
      <SafeLayout>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.entrenador} />
          <Text style={styles.loadingText}>Cargando certificados...</Text>
        </View>
      </SafeLayout>
    );
  }

  return (
    <SafeLayout>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <UserHeader
          user={user}
          greeting="Certificados"
          avatarColor={colors.entrenador}
          roleText="Entrenador"
        />

        <View style={styles.stats}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{certificados.length}</Text>
            <Text style={styles.statLabel}>Total Certificados</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {certificados.filter(c => c.tipo_certificado === "participacion").length}
            </Text>
            <Text style={styles.statLabel}>Participación</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {certificados.filter(c => c.tipo_certificado === "logro").length}
            </Text>
            <Text style={styles.statLabel}>Logros</Text>
          </View>
        </View>

        <View style={styles.certificadosList}>
          <View style={styles.listHeader}>
            <Text style={styles.listTitle}>Certificados Emitidos</Text>
            <TouchableOpacity style={styles.refreshButton} onPress={cargarCertificados}>
              <Ionicons name="refresh" size={16} color={colors.entrenador} />
            </TouchableOpacity>
          </View>

          {certificados.map((certificado) => (
            <View key={certificado.id_certificado} style={styles.certificadoCard}>
              <View style={styles.certificadoHeader}>
                <View style={styles.certificadoInfo}>
                  <Text style={styles.certificadoTitle}>{certificado.titulo}</Text>
                  <Text style={styles.jugadorName}>
                    {certificado.jugador?.nombre} {certificado.jugador?.apellido}
                  </Text>
                </View>
                <View style={[styles.tipoBadge, { backgroundColor: getTipoColor(certificado.tipo_certificado) }]}>
                  <Ionicons name={getTipoIcon(certificado.tipo_certificado) as any} size={12} color="#FFFFFF" />
                  <Text style={styles.tipoText}>
                    {getTipoLabel(certificado.tipo_certificado)}
                  </Text>
                </View>
              </View>

              <Text style={styles.certificadoDescription} numberOfLines={2}>
                {certificado.descripcion}
              </Text>

              <View style={styles.certificadoFooter}>
                <View style={styles.fechaInfo}>
                  <Ionicons name="calendar" size={14} color="#6B7280" />
                  <Text style={styles.fechaText}>
                    {formatDate(certificado.fecha_emision)}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.downloadButton}
                  onPress={() => descargarCertificado(certificado)}
                >
                  <Ionicons name="download" size={14} color="#FFFFFF" />
                  <Text style={styles.downloadButtonText}>Descargar</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}

          {certificados.length === 0 && (
            <View style={styles.emptyContainer}>
              <Ionicons name="document-outline" size={48} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>No hay certificados</Text>
              <Text style={styles.emptyDescription}>
                No se encontraron certificados emitidos
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
  certificadosList: {
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
  certificadoCard: {
    backgroundColor: colors.background,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  certificadoHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  certificadoInfo: {
    flex: 1,
  },
  certificadoTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 4,
  },
  jugadorName: {
    fontSize: 14,
    color: "#6B7280",
  },
  tipoBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  tipoText: {
    fontSize: 12,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  certificadoDescription: {
    fontSize: 14,
    color: "#374151",
    marginBottom: 12,
    lineHeight: 20,
  },
  certificadoFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  fechaInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  fechaText: {
    fontSize: 12,
    color: "#6B7280",
  },
  downloadButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.entrenador,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  downloadButtonText: {
    fontSize: 12,
    color: "#FFFFFF",
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
