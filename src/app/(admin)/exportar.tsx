import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Share,
  Platform,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { supabase } from "../../core/supabase/supabaseClient";
import SafeLayout from "../../shared/components/SafeLayout";
import { colors } from "../../shared/constants/theme";

interface ExportOption {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  formats: string[];
}

export default function ExportarScreen() {
  const [selectedFormat, setSelectedFormat] = useState<string>("pdf");
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [customDateFrom, setCustomDateFrom] = useState<string>("");
  const [customDateTo, setCustomDateTo] = useState<string>("");
  const [exporting, setExporting] = useState(false);

  const exportOptions: ExportOption[] = [
    {
      id: "usuarios",
      title: "Reporte de Usuarios",
      description: "Lista completa de usuarios con roles y estado",
      icon: "people",
      color: colors.primary,
      formats: ["pdf", "excel", "csv"],
    },
    {
      id: "asistencias",
      title: "Reporte de Asistencias",
      description: "Estadísticas de asistencia por entrenamiento",
      icon: "calendar",
      color: "#059669",
      formats: ["pdf", "excel"],
    },
    {
      id: "pagos",
      title: "Reporte Financiero",
      description: "Pagos realizados y pendientes por período",
      icon: "card",
      color: "#DC2626",
      formats: ["pdf", "excel"],
    },
    {
      id: "entrenamientos",
      title: "Reporte de Entrenamientos",
      description: "Historial completo de entrenamientos programados",
      icon: "basketball",
      color: "#7C3AED",
      formats: ["pdf", "excel"],
    },
    {
      id: "completo",
      title: "Reporte Completo",
      description: "Análisis integral de todo el sistema",
      icon: "bar-chart",
      color: "#F59E0B",
      formats: ["pdf"],
    },
  ];

  const formatOptions = [
    { id: "pdf", label: "PDF", icon: "document-text", color: "#DC2626" },
    { id: "excel", label: "Excel", icon: "grid", color: "#16A34A" },
    { id: "csv", label: "CSV", icon: "list", color: "#7C3AED" },
  ];

  const generarDatosExportacion = async (tipo: string) => {
    try {
      let datos = {};

      // Determinar filtros de fecha
      let fechaFiltro = null;
      if (customDateFrom && customDateTo) {
        fechaFiltro = { desde: customDateFrom, hasta: customDateTo };
      } else if (selectedYear) {
        const year = parseInt(selectedYear);
        fechaFiltro = { desde: `${year}-01-01`, hasta: `${year}-12-31` };
      }

      switch (tipo) {
        case "usuarios":
          let usuariosQuery = supabase
            .from("Usuarios")
            .select("*")
            .order("fecha_registro", { ascending: false });

          if (fechaFiltro) {
            usuariosQuery = usuariosQuery
              .gte("fecha_registro", fechaFiltro.desde)
              .lte("fecha_registro", fechaFiltro.hasta);
          }

          const { data: usuarios } = await usuariosQuery;
          datos = { usuarios: usuarios || [] };
          break;

        case "asistencias":
          let asistenciasQuery = supabase
            .from("Asistencia")
            .select(`
              *,
              Usuarios!inner(nombre, apellido),
              Entrenamiento(fecha_hora, lugar)
            `)
            .order("fecha_asistencia", { ascending: false });

          if (fechaFiltro) {
            asistenciasQuery = asistenciasQuery
              .gte("fecha_asistencia", fechaFiltro.desde)
              .lte("fecha_asistencia", fechaFiltro.hasta);
          }

          const { data: asistencias } = await asistenciasQuery;
          datos = { asistencias: asistencias || [] };
          break;

        case "pagos":
          let pagosQuery = supabase
            .from("Mensualidad")
            .select(`
              *,
              Usuarios!inner(nombre, apellido)
            `)
            .order("fecha_vencimiento", { ascending: false });

          if (fechaFiltro) {
            pagosQuery = pagosQuery
              .gte("fecha_vencimiento", fechaFiltro.desde)
              .lte("fecha_vencimiento", fechaFiltro.hasta);
          }

          const { data: pagos } = await pagosQuery;
          datos = { pagos: pagos || [] };
          break;

        case "entrenamientos":
          let entrenamientosQuery = supabase
            .from("Entrenamiento")
            .select(`
              *,
              Usuarios!inner(nombre, apellido)
            `)
            .order("fecha_hora", { ascending: false });

          if (fechaFiltro) {
            entrenamientosQuery = entrenamientosQuery
              .gte("fecha_hora", fechaFiltro.desde)
              .lte("fecha_hora", fechaFiltro.hasta);
          }

          const { data: entrenamientos } = await entrenamientosQuery;
          datos = { entrenamientos: entrenamientos || [] };
          break;

        case "completo":
          const queries = [
            supabase.from("Usuarios").select("*"),
            supabase.from("Asistencia").select("*"),
            supabase.from("Mensualidad").select("*"),
            supabase.from("Entrenamiento").select("*"),
          ];

          // Aplicar filtros si existen
          if (fechaFiltro) {
            queries[0] = queries[0].gte("fecha_registro", fechaFiltro.desde).lte("fecha_registro", fechaFiltro.hasta);
            queries[1] = queries[1].gte("fecha_asistencia", fechaFiltro.desde).lte("fecha_asistencia", fechaFiltro.hasta);
            queries[2] = queries[2].gte("fecha_vencimiento", fechaFiltro.desde).lte("fecha_vencimiento", fechaFiltro.hasta);
            queries[3] = queries[3].gte("fecha_hora", fechaFiltro.desde).lte("fecha_hora", fechaFiltro.hasta);
          }

          const [usuariosData, asistenciasData, pagosData, entrenamientosData] = await Promise.all(queries);

          datos = {
            usuarios: usuariosData.data || [],
            asistencias: asistenciasData.data || [],
            pagos: pagosData.data || [],
            entrenamientos: entrenamientosData.data || [],
            estadisticas: {
              totalUsuarios: usuariosData.data?.length || 0,
              totalAsistencias: asistenciasData.data?.length || 0,
              totalPagos: pagosData.data?.length || 0,
              totalEntrenamientos: entrenamientosData.data?.length || 0,
            }
          };
          break;
      }

      return datos;
    } catch (error) {
      console.error("Error generando datos:", error);
      throw error;
    }
  };

  const convertirACSV = (datos: any, tipo: string): string => {
    let csv = "";

    switch (tipo) {
      case "usuarios":
        const usuarios = datos.usuarios || [];
        if (usuarios.length === 0) return "No hay datos disponibles";

        csv = "ID,Nombre,Apellido,Email,Rol,Estado Cuenta,Fecha Registro\n";
        usuarios.forEach((user: any) => {
          csv += `${user.id},"${user.nombre}","${user.apellido}","${user.email}","${user.rol}","${user.estado_cuenta ? 'Activo' : 'Inactivo'}","${user.fecha_registro || ''}"\n`;
        });
        break;

      case "asistencias":
        const asistencias = datos.asistencias || [];
        if (asistencias.length === 0) return "No hay datos disponibles";

        csv = "ID Usuario,Nombre Completo,Fecha Asistencia,Estado Asistencia,Entrenamiento,Lugar\n";
        asistencias.forEach((asistencia: any) => {
          const nombreCompleto = `${asistencia.Usuarios?.nombre || ''} ${asistencia.Usuarios?.apellido || ''}`.trim();
          csv += `${asistencia.id_usuario},"${nombreCompleto}","${asistencia.fecha_asistencia}","${asistencia.estado_asistencia}","${asistencia.Entrenamiento?.fecha_hora || ''}","${asistencia.Entrenamiento?.lugar || ''}"\n`;
        });
        break;

      case "pagos":
        const pagos = datos.pagos || [];
        if (pagos.length === 0) return "No hay datos disponibles";

        csv = "ID Usuario,Nombre Completo,Monto,Estado Pago,Fecha Vencimiento,Fecha Pago\n";
        pagos.forEach((pago: any) => {
          const nombreCompleto = `${pago.Usuarios?.nombre || ''} ${pago.Usuarios?.apellido || ''}`.trim();
          csv += `${pago.id_usuario},"${nombreCompleto}",${pago.monto},"${pago.estado_pago}","${pago.fecha_vencimiento}","${pago.fecha_pago || ''}"\n`;
        });
        break;

      case "entrenamientos":
        const entrenamientos = datos.entrenamientos || [];
        if (entrenamientos.length === 0) return "No hay datos disponibles";

        csv = "ID,Fecha y Hora,Lugar,Descripción,Entrenador\n";
        entrenamientos.forEach((entrenamiento: any) => {
          const nombreEntrenador = `${entrenamiento.Usuarios?.nombre || ''} ${entrenamiento.Usuarios?.apellido || ''}`.trim();
          csv += `${entrenamiento.id},"${entrenamiento.fecha_hora}","${entrenamiento.lugar}","${entrenamiento.descripcion || ''}","${nombreEntrenador}"\n`;
        });
        break;

      case "completo":
        csv = "REPORTE COMPLETO DEL SISTEMA\n\n";
        csv += "ESTADÍSTICAS GENERALES:\n";
        csv += `Total de Usuarios: ${datos.estadisticas?.totalUsuarios || 0}\n`;
        csv += `Total de Asistencias: ${datos.estadisticas?.totalAsistencias || 0}\n`;
        csv += `Total de Pagos: ${datos.estadisticas?.totalPagos || 0}\n`;
        csv += `Total de Entrenamientos: ${datos.estadisticas?.totalEntrenamientos || 0}\n\n`;

        csv += "USUARIOS:\n";
        csv += convertirACSV({ usuarios: datos.usuarios }, "usuarios");
        csv += "\n\nASISTENCIAS:\n";
        csv += convertirACSV({ asistencias: datos.asistencias }, "asistencias");
        csv += "\n\nPAGOS:\n";
        csv += convertirACSV({ pagos: datos.pagos }, "pagos");
        csv += "\n\nENTRENAMIENTOS:\n";
        csv += convertirACSV({ entrenamientos: datos.entrenamientos }, "entrenamientos");
        break;

      default:
        csv = "Tipo de reporte no reconocido";
    }

    return csv;
  };

  const generarHTMLParaPDF = (datos: any, tipo: string): string => {
    const csvData = convertirACSV(datos, tipo);
    const lineas = csvData.split('\n');

    let html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Reporte ${tipo}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #1f2937; text-align: center; margin-bottom: 30px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #e5e7eb; padding: 8px; text-align: left; }
            th { background-color: #f3f4f6; font-weight: bold; }
            tr:nth-child(even) { background-color: #f9fafb; }
            .header-info { margin-bottom: 20px; }
            .header-info p { margin: 5px 0; color: #6b7280; }
          </style>
        </head>
        <body>
          <h1>Reporte de ${tipo.charAt(0).toUpperCase() + tipo.slice(1)}</h1>
          <div class="header-info">
            <p><strong>Fecha de generación:</strong> ${new Date().toLocaleDateString('es-ES')}</p>
            <p><strong>Período:</strong> ${customDateFrom && customDateTo ? `${customDateFrom} - ${customDateTo}` : selectedYear || 'Completo'}</p>
          </div>
          <table>
    `;

    lineas.forEach((linea, index) => {
      if (linea.trim()) {
        const celdas = linea.split(',');
        html += '<tr>';
        celdas.forEach(celda => {
          const tag = index === 0 ? 'th' : 'td';
          // Limpiar comillas si existen
          const contenido = celda.replace(/^"|"$/g, '');
          html += `<${tag}>${contenido}</${tag}>`;
        });
        html += '</tr>';
      }
    });

    html += `
          </table>
        </body>
      </html>
    `;

    return html;
  };

  const exportarDatos = async (tipo: string) => {
    try {
      setExporting(true);

      const datos = await generarDatosExportacion(tipo);

      // Generar nombre del archivo
      const fechaFiltro = customDateFrom && customDateTo ?
        `${customDateFrom}_a_${customDateTo}` :
        selectedYear || 'completo';
      const baseFileName = `${tipo}_reporte_${fechaFiltro}_${new Date().toISOString().split('T')[0]}`;

      // Simular tiempo de procesamiento
      await new Promise(resolve => setTimeout(resolve, 1500));

      if (selectedFormat === "pdf") {
        // Generar PDF usando expo-print
        const htmlContent = generarHTMLParaPDF(datos, tipo);
        const { uri } = await Print.printToFileAsync({
          html: htmlContent,
          base64: false,
        });

        const fileName = `${baseFileName}.pdf`;

        if (Platform.OS === 'web') {
          // En web, descargar el archivo generado
          const response = await fetch(uri);
          const blob = await response.blob();
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = fileName;
          a.click();
          URL.revokeObjectURL(url);
        } else {
          // En móvil, compartir usando expo-sharing
          if (await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(uri, {
              mimeType: 'application/pdf',
              dialogTitle: `Compartir ${fileName}`,
            });
          } else {
            Alert.alert("Error", "No se puede compartir archivos en este dispositivo");
          }
        }
      } else {
        // Para CSV y Excel, generar archivo de texto
        const fileContent = convertirACSV(datos, tipo);
        const fileName = selectedFormat === "excel" ? `${baseFileName}.xlsx` : `${baseFileName}.csv`;
        const mimeType = selectedFormat === "excel" ?
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" :
          "text/csv;charset=utf-8;";

        if (Platform.OS === 'web') {
          // Para web, descargar archivo
          const blob = new Blob([fileContent], { type: mimeType });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = fileName;
          a.click();
          URL.revokeObjectURL(url);
        } else {
          // Para móvil, compartir contenido directamente
          try {
            await Share.share({
              message: fileContent,
              title: fileName,
            });
          } catch (shareError) {
            Alert.alert("Error", "No se puede compartir el archivo en este dispositivo");
          }
        }
      }

      Alert.alert(
        "Éxito",
        `El reporte "${tipo}" ha sido generado en formato ${selectedFormat.toUpperCase()}`
      );

    } catch (error) {
      console.error("Error exportando:", error);
      Alert.alert("Error", "No se pudo generar el reporte");
    } finally {
      setExporting(false);
    }
  };

  return (
    <SafeLayout>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Ionicons name="download" size={28} color="#EC4899" />
            <View>
              <Text style={styles.title}>Exportar Estadísticas</Text>
              <Text style={styles.subtitle}>
                Genera y descarga reportes detallados del sistema
              </Text>
            </View>
          </View>
        </View>



        {/* Year Selection */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="calendar-outline" size={20} color={colors.primary} />
            <Text style={styles.sectionTitle}>Año</Text>
          </View>

          <View style={styles.yearSelector}>
            {Array.from({ length: 5 }, (_, i) => {
              const year = new Date().getFullYear() - i;
              return (
                <TouchableOpacity
                  key={year}
                  style={[
                    styles.yearButton,
                    selectedYear === year.toString() && styles.yearButtonActive
                  ]}
                  onPress={() => setSelectedYear(year.toString())}
                >
                  <Text style={[
                    styles.yearButtonText,
                    selectedYear === year.toString() && styles.yearButtonTextActive
                  ]}>
                    {year}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Custom Date Range */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="calendar-number-outline" size={20} color={colors.primary} />
            <Text style={styles.sectionTitle}>Rango de Fechas Personalizado</Text>
          </View>

          <View style={styles.dateRangeContainer}>
            <View style={styles.dateInputContainer}>
              <Text style={styles.dateLabel}>Desde</Text>
              <TextInput
                style={styles.dateInput}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#9CA3AF"
                value={customDateFrom}
                onChangeText={setCustomDateFrom}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.dateInputContainer}>
              <Text style={styles.dateLabel}>Hasta</Text>
              <TextInput
                style={styles.dateInput}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#9CA3AF"
                value={customDateTo}
                onChangeText={setCustomDateTo}
                keyboardType="numeric"
              />
            </View>
          </View>

          <Text style={styles.dateHelpText}>
            Formato: YYYY-MM-DD (ejemplo: 2024-01-15)
          </Text>
        </View>

        {/* Format Selection */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="document-outline" size={20} color={colors.primary} />
            <Text style={styles.sectionTitle}>Formato de Exportación</Text>
          </View>

          <View style={styles.formatSelector}>
            {formatOptions.map((format) => (
              <TouchableOpacity
                key={format.id}
                style={[
                  styles.formatButton,
                  selectedFormat === format.id && styles.formatButtonActive
                ]}
                onPress={() => setSelectedFormat(format.id)}
              >
                <Ionicons name={format.icon as any} size={24} color={selectedFormat === format.id ? "#FFFFFF" : format.color} />
                <Text style={[
                  styles.formatButtonText,
                  selectedFormat === format.id && styles.formatButtonTextActive
                ]}>
                  {format.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Export Options */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="list-outline" size={20} color={colors.primary} />
            <Text style={styles.sectionTitle}>Tipos de Reporte</Text>
          </View>

          <View style={styles.exportOptions}>
            {exportOptions.map((option) => (
              <View key={option.id} style={styles.exportOption}>
                <View style={styles.optionHeader}>
                  <View style={[styles.optionIcon, { backgroundColor: option.color }]}>
                    <Ionicons name={option.icon as any} size={24} color="#FFFFFF" />
                  </View>
                  <View style={styles.optionInfo}>
                    <Text style={styles.optionTitle}>{option.title}</Text>
                    <Text style={styles.optionDescription}>{option.description}</Text>
                  </View>
                </View>

                <View style={styles.optionActions}>
                  {option.formats.includes(selectedFormat) ? (
                    <TouchableOpacity
                      style={[styles.exportButton, exporting && styles.exportButtonDisabled]}
                      onPress={() => exportarDatos(option.id)}
                      disabled={exporting}
                    >
                      {exporting ? (
                        <Ionicons name="hourglass" size={20} color="#FFFFFF" />
                      ) : (
                        <Ionicons name="download" size={20} color="#FFFFFF" />
                      )}
                      <Text style={styles.exportButtonText}>
                        {exporting ? "Generando..." : `Exportar ${selectedFormat.toUpperCase()}`}
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.formatNotAvailable}>
                      <Text style={styles.formatNotAvailableText}>
                        Formato no disponible
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Information */}
        <View style={styles.infoSection}>
          <View style={styles.infoCard}>
            <Ionicons name="information-circle" size={24} color={colors.primary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Información de Exportación</Text>
              <Text style={styles.infoText}>
                Los reportes incluyen datos del período seleccionado y se generan en tiempo real desde la base de datos.
              </Text>
              <Text style={styles.infoText}>
                • PDF: Ideal para presentaciones y archivos permanentes
              </Text>
              <Text style={styles.infoText}>
                • Excel: Perfecto para análisis y modificaciones
              </Text>
              <Text style={styles.infoText}>
                • CSV: Formato simple para importación en otras herramientas
              </Text>
            </View>
          </View>
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
  header: {
    padding: 20,
    backgroundColor: colors.background,
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
  section: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
  },
  periodSelector: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  periodButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  periodButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
  },
  periodButtonTextActive: {
    color: "#FFFFFF",
  },
  yearSelector: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  yearButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    minWidth: 80,
    alignItems: "center",
  },
  yearButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  yearButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
  },
  yearButtonTextActive: {
    color: "#FFFFFF",
  },
  dateRangeContainer: {
    flexDirection: "row",
    gap: 16,
  },
  dateInputContainer: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  dateInput: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#1F2937",
    backgroundColor: colors.background,
  },
  dateHelpText: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 8,
    fontStyle: "italic",
  },
  formatSelector: {
    flexDirection: "row",
    gap: 12,
  },
  formatButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: colors.background,
    borderWidth: 2,
    borderColor: "#E5E7EB",
    alignItems: "center",
    gap: 8,
  },
  formatButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  formatButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6B7280",
  },
  formatButtonTextActive: {
    color: "#FFFFFF",
  },
  exportOptions: {
    gap: 16,
  },
  exportOption: {
    backgroundColor: colors.background,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  optionHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 16,
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  optionInfo: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
  },
  optionActions: {
    alignItems: "flex-end",
  },
  exportButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  exportButtonDisabled: {
    backgroundColor: "#D1D5DB",
  },
  exportButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  formatNotAvailable: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
  },
  formatNotAvailableText: {
    fontSize: 14,
    color: "#6B7280",
    fontStyle: "italic",
  },
  infoSection: {
    padding: 20,
    paddingBottom: 40,
  },
  infoCard: {
    flexDirection: "row",
    backgroundColor: colors.background,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
    marginBottom: 4,
  },
});
