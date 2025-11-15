import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../core/auth/AuthContext";
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import CertificateCard from "../../shared/components/CertificateCard";
import { colors } from "../../shared/constants/theme";

interface CertificateType {
  id: string;
  title: string;
  icon: string;
  description: string;
  color: string;
}

export default function CertificadosScreen() {
  const { user } = useAuth();
  const [generating, setGenerating] = useState<string | null>(null);

  const certificateTypes: CertificateType[] = [
    {
      id: "afiliacion",
      title: "Certificado de Afiliación",
      icon: "person",
      description: "Certificado oficial de membresía en el club",
      color: colors.primary,
    },
    {
      id: "asistencia",
      title: "Certificado de Asistencia",
      icon: "calendar",
      description: "Control de participación en entrenamientos",
      color: "#10B981",
    },
  ];

  const generatePDF = async (certificateType: CertificateType) => {
    try {
      setGenerating(certificateType.id);

      const currentDate = new Date().toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      // Contenido HTML específico para cada tipo de certificado
      let htmlContent = '';

      if (certificateType.id === 'afiliacion') {
        htmlContent = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body {
                font-family: 'Times New Roman', serif;
                margin: 0;
                padding: 60px 40px;
                color: #1F2937;
                background: white;
                font-size: 14px;
                line-height: 1.6;
              }
              .certificate-container {
                border: 2px solid #374151;
                padding: 40px;
                max-width: 700px;
                margin: 0 auto;
                position: relative;
              }
              .header {
                text-align: center;
                margin-bottom: 50px;
                border-bottom: 1px solid #D1D5DB;
                padding-bottom: 20px;
              }
              .club-name {
                font-size: 24px;
                font-weight: bold;
                color: #1F2937;
                margin-bottom: 15px;
                text-transform: uppercase;
                letter-spacing: 1px;
              }
              .certificate-title {
                font-size: 20px;
                font-weight: bold;
                color: #374151;
                text-transform: uppercase;
                letter-spacing: 1px;
              }
              .certificate-subtitle {
                font-size: 16px;
                color: #6B7280;
                margin-top: 10px;
                font-style: italic;
              }
              .content {
                margin: 40px 0;
                text-align: justify;
              }
              .intro-text {
                margin-bottom: 30px;
                font-size: 16px;
              }
              .user-info {
                background: #F9FAFB;
                padding: 20px;
                margin: 30px 0;
                border-left: 3px solid #374151;
              }
              .user-name {
                font-size: 18px;
                font-weight: bold;
                color: #1F2937;
                margin-bottom: 10px;
              }
              .user-details {
                font-size: 14px;
                color: #6B7280;
                line-height: 1.8;
              }
              .certificate-text {
                font-size: 16px;
                line-height: 1.8;
                text-align: justify;
                margin: 30px 0;
              }
              .signatures {
                display: flex;
                justify-content: space-between;
                margin-top: 80px;
                padding-top: 40px;
                border-top: 1px solid #D1D5DB;
              }
              .signature {
                text-align: center;
                width: 200px;
              }
              .signature-line {
                width: 100%;
                height: 1px;
                background: #374151;
                margin: 40px 0 10px;
              }
              .signature-title {
                font-size: 14px;
                font-weight: bold;
                color: #374151;
              }
              .signature-subtitle {
                font-size: 12px;
                color: #6B7280;
                margin-top: 5px;
              }
              .date {
                text-align: center;
                margin-top: 60px;
                font-size: 14px;
                color: #6B7280;
                font-style: italic;
              }
              .footer {
                text-align: center;
                margin-top: 40px;
                font-size: 12px;
                color: #9CA3AF;
                border-top: 1px solid #F3F4F6;
                padding-top: 20px;
              }
            </style>
          </head>
          <body>
            <div class="certificate-container">
              <div class="header">
                <div class="club-name">CLUB DEPORTIVO SURVOLEY</div>
                <div class="certificate-title">CERTIFICADO DE AFILIACIÓN</div>
                <div class="certificate-subtitle">Documento Oficial de Membresía</div>
              </div>

              <div class="content">
                <div class="intro-text">
                  Por la presente, se certifica que:
                </div>

                <div class="user-info">
                  <div class="user-name">${user?.nombre} ${user?.apellido}</div>
                  <div class="user-details">
                    <strong>Identificación:</strong> ${user?.email || 'N/A'}<br>
                    <strong>Fecha de Afiliación:</strong> ${currentDate}
                  </div>
                </div>

                <div class="certificate-text">
                  Se encuentra oficialmente registrado como jugador activo del Club Deportivo Survoley,
                  habiendo cumplido con todos los requisitos establecidos en los estatutos y reglamentos
                  del club. Este certificado acredita su condición de miembro activo y le otorga todos
                  los derechos y beneficios correspondientes a su condición de socio.
                </div>
              </div>

              <div class="signatures">
                <div class="signature">
                  <div class="signature-line"></div>
                  <div class="signature-title">Director Deportivo</div>
                  <div class="signature-subtitle">Club Deportivo Survoley</div>
                </div>
                <div class="signature">
                  <div class="signature-line"></div>
                  <div class="signature-title">Presidente</div>
                  <div class="signature-subtitle">Club Deportivo Survoley</div>
                </div>
              </div>

              <div class="date">
                Emitido en Santiago de Chile, ${currentDate}
              </div>

              <div class="footer">
                Este documento tiene validez oficial y no requiere sello ni timbre adicional.
              </div>
            </div>
          </body>
          </html>
        `;
      } else if (certificateType.id === 'asistencia') {
        htmlContent = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body {
                font-family: 'Times New Roman', serif;
                margin: 0;
                padding: 60px 40px;
                color: #1F2937;
                background: white;
                font-size: 14px;
                line-height: 1.6;
              }
              .certificate-container {
                border: 2px solid #374151;
                padding: 40px;
                max-width: 700px;
                margin: 0 auto;
                position: relative;
              }
              .header {
                text-align: center;
                margin-bottom: 50px;
                border-bottom: 1px solid #D1D5DB;
                padding-bottom: 20px;
              }
              .club-name {
                font-size: 24px;
                font-weight: bold;
                color: #1F2937;
                margin-bottom: 15px;
                text-transform: uppercase;
                letter-spacing: 1px;
              }
              .certificate-title {
                font-size: 20px;
                font-weight: bold;
                color: #374151;
                text-transform: uppercase;
                letter-spacing: 1px;
              }
              .certificate-subtitle {
                font-size: 16px;
                color: #6B7280;
                margin-top: 10px;
                font-style: italic;
              }
              .content {
                margin: 40px 0;
                text-align: justify;
              }
              .intro-text {
                margin-bottom: 30px;
                font-size: 16px;
              }
              .user-info {
                background: #F9FAFB;
                padding: 20px;
                margin: 30px 0;
                border-left: 3px solid #374151;
              }
              .user-name {
                font-size: 18px;
                font-weight: bold;
                color: #1F2937;
                margin-bottom: 10px;
              }
              .user-details {
                font-size: 14px;
                color: #6B7280;
                line-height: 1.8;
              }
              .stats-section {
                margin: 40px 0;
              }
              .stats-title {
                font-size: 16px;
                font-weight: bold;
                color: #374151;
                margin-bottom: 20px;
                text-align: center;
              }
              .stats-grid {
                display: table;
                width: 100%;
                border-collapse: collapse;
                margin: 20px 0;
              }
              .stats-row {
                display: table-row;
              }
              .stats-cell {
                display: table-cell;
                padding: 12px;
                border: 1px solid #E5E7EB;
                text-align: center;
                font-size: 14px;
              }
              .stats-header {
                background: #F9FAFB;
                font-weight: bold;
                color: #374151;
              }
              .certificate-content {
                font-size: 18px;
                line-height: 1.8;
                color: #4B5563;
                text-align: center;
                margin: 30px 0;
              }
              .signatures {
                display: flex;
                justify-content: space-between;
                margin-top: 80px;
                padding-top: 40px;
                border-top: 1px solid #D1D5DB;
              }
              .signature {
                text-align: center;
                width: 200px;
              }
              .signature-line {
                width: 100%;
                height: 1px;
                background: #374151;
                margin: 40px 0 10px;
              }
              .signature-title {
                font-size: 14px;
                font-weight: bold;
                color: #374151;
              }
              .signature-subtitle {
                font-size: 12px;
                color: #6B7280;
                margin-top: 5px;
              }
              .date {
                text-align: center;
                margin-top: 60px;
                font-size: 14px;
                color: #6B7280;
                font-style: italic;
              }
              .footer {
                text-align: center;
                margin-top: 40px;
                font-size: 12px;
                color: #9CA3AF;
                border-top: 1px solid #F3F4F6;
                padding-top: 20px;
              }
            </style>
          </head>
          <body>
            <div class="certificate-container">
              <div class="header">
                <div class="club-name">CLUB DEPORTIVO SURVOLEY</div>
                <div class="certificate-title">CERTIFICADO DE ASISTENCIA</div>
                <div class="certificate-subtitle">Registro de Participación Deportiva</div>
              </div>

              <div class="content">
                <div class="intro-text">
                  Por la presente, se certifica que:
                </div>

                <div class="user-info">
                  <div class="user-name">${user?.nombre} ${user?.apellido}</div>
                  <div class="user-details">
                    <strong>Identificación:</strong> ${user?.email || 'N/A'}<br>
                    <strong>Fecha de Emisión:</strong> ${currentDate}
                  </div>
                </div>

                <div class="stats-section">
                  <div class="stats-title">REGISTRO DE ASISTENCIA</div>
                  <table class="stats-grid">
                    <tr class="stats-row">
                      <td class="stats-cell stats-header">Concepto</td>
                      <td class="stats-cell stats-header">Porcentaje</td>
                      <td class="stats-cell stats-header">Evaluación</td>
                    </tr>
                    <tr class="stats-row">
                      <td class="stats-cell">Asistencia General</td>
                      <td class="stats-cell">85%</td>
                      <td class="stats-cell">Excelente</td>
                    </tr>
                    <tr class="stats-row">
                      <td class="stats-cell">Entrenamientos</td>
                      <td class="stats-cell">92%</td>
                      <td class="stats-cell">Excelente</td>
                    </tr>
                    <tr class="stats-row">
                      <td class="stats-cell">Competiciones</td>
                      <td class="stats-cell">78%</td>
                      <td class="stats-cell">Muy Bueno</td>
                    </tr>
                  </table>
                </div>

                <div class="certificate-text">
                  Ha demostrado un excelente compromiso y participación durante la temporada actual,
                  manteniendo una asistencia regular y actitud deportiva ejemplar en los entrenamientos
                  y competiciones del club. Este certificado acredita su dedicación y constancia en
                  las actividades deportivas desarrolladas bajo la dirección técnica del Club Deportivo Survoley.
                </div>
              </div>

              <div class="signatures">
                <div class="signature">
                  <div class="signature-line"></div>
                  <div class="signature-title">Entrenador Principal</div>
                  <div class="signature-subtitle">Club Deportivo Survoley</div>
                </div>
                <div class="signature">
                  <div class="signature-line"></div>
                  <div class="signature-title">Coordinador Deportivo</div>
                  <div class="signature-subtitle">Club Deportivo Survoley</div>
                </div>
              </div>

              <div class="date">
                Emitido en Santiago de Chile, ${currentDate}
              </div>

              <div class="footer">
                Este documento tiene validez oficial para fines académicos y deportivos.
              </div>
            </div>
          </body>
          </html>
        `;
      }

      const { uri } = await Print.printToFileAsync({
        html: htmlContent,
        base64: false
      });

      // Abrir el PDF directamente después de generarlo
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: `Certificado de ${certificateType.title}`,
        });
      } else {
        Alert.alert(
          'PDF Generado',
          `El certificado se ha generado correctamente.\n\nArchivo disponible en:\n${uri}`,
          [{ text: 'OK' }]
        );
      }

    } catch (error) {
      console.error('Error generando PDF:', error);
      Alert.alert('Error', 'No se pudo generar el certificado. Intenta nuevamente.');
    } finally {
      setGenerating(null);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={colors.primaryDark} barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerTextContainer}>
            <Text style={styles.welcome}>Certificados</Text>
            <Text style={styles.subtitle}>
              Hola {user?.nombre}, genera tus certificados oficiales
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContentContainer}
      >
        {/* Sección de Certificados */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="document-text" size={20} color="#1F2937" />
              <Text style={styles.sectionTitle}>Certificados Disponibles</Text>
            </View>
          </View>

          <View style={styles.certificatesList}>
            {certificateTypes.map((certificate) => (
              <CertificateCard
                key={certificate.id}
                certificate={certificate}
                onGenerate={() => generatePDF(certificate)}
                generating={generating === certificate.id}
              />
            ))}
          </View>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
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
  scrollContentContainer: {
    paddingBottom: 20,
  },
  section: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
  },
  certificatesList: {
    gap: 16,
  },
  bottomSpacer: {
    height: 20,
  },
});
