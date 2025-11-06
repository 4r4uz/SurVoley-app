import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../types/use.auth";
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { colors } from "../../constants/theme";

interface CertificateType {
  id: string;
  title: string;
  icon: string;
  description: string;
  color: string;
}

const CertificateCard = React.memo(({ 
  certificate, 
  onGenerate,
  generating 
}: { 
  certificate: CertificateType;
  onGenerate: () => void;
  generating: boolean;
}) => {
  return (
    <TouchableOpacity
      style={styles.certificateCard}
      onPress={onGenerate}
      disabled={generating}
      activeOpacity={0.8}
    >
      <View style={styles.cardHeader}>
        <View style={[styles.iconContainer, { backgroundColor: certificate.color + "15" }]}>
          <Ionicons name={certificate.icon as any} size={28} color={certificate.color} />
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>{certificate.title}</Text>
          <Text style={styles.cardDescription}>{certificate.description}</Text>
        </View>
      </View>
      
      <View style={styles.cardFooter}>
        <View style={[styles.generateButton, { backgroundColor: certificate.color + "20" }]}>
          {generating ? (
            <ActivityIndicator size="small" color={certificate.color} />
          ) : (
            <Ionicons name="download" size={16} color={certificate.color} />
          )}
          <Text style={[styles.generateButtonText, { color: certificate.color }]}>
            {generating ? 'Generando...' : 'Descargar PDF'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
});

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
                font-family: 'Arial', sans-serif;
                margin: 0;
                padding: 40px;
                color: #1F2937;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
              }
              .certificate-container {
                background: white;
                border-radius: 20px;
                padding: 50px;
                box-shadow: 0 20px 40px rgba(0,0,0,0.1);
                border: 8px solid ${certificateType.color};
                position: relative;
                max-width: 800px;
                margin: 0 auto;
              }
              .header {
                text-align: center;
                margin-bottom: 40px;
              }
              .club-name {
                font-size: 32px;
                font-weight: bold;
                color: ${certificateType.color};
                margin-bottom: 10px;
              }
              .certificate-title {
                font-size: 28px;
                font-weight: 800;
                color: #1F2937;
                margin-bottom: 30px;
                text-transform: uppercase;
                letter-spacing: 2px;
              }
              .user-info {
                background: #F8FAFC;
                padding: 30px;
                border-radius: 15px;
                margin: 30px 0;
                border-left: 4px solid ${certificateType.color};
              }
              .user-name {
                font-size: 24px;
                font-weight: bold;
                color: #1F2937;
                margin-bottom: 10px;
              }
              .user-details {
                font-size: 16px;
                color: #6B7280;
                line-height: 1.6;
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
                margin-top: 60px;
                padding-top: 30px;
                border-top: 2px solid #E5E7EB;
              }
              .signature {
                text-align: center;
              }
              .signature-line {
                width: 200px;
                height: 1px;
                background: #D1D5DB;
                margin: 40px 0 10px;
              }
              .date {
                text-align: center;
                margin-top: 40px;
                color: #6B7280;
                font-style: italic;
              }
              .watermark {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%) rotate(-45deg);
                font-size: 80px;
                color: rgba(37, 99, 235, 0.1);
                font-weight: bold;
                pointer-events: none;
                white-space: nowrap;
              }
            </style>
          </head>
          <body>
            <div class="certificate-container">
              <div class="watermark">AFILIACIÓN</div>
              
              <div class="header">
                <div class="club-name">CLUB DEPORTIVO</div>
                <div class="certificate-title">${certificateType.title}</div>
              </div>

              <div class="user-info">
                <div class="user-name">${user?.nombre} ${user?.apellido}</div>
                <div class="user-details">
                  <strong>Email:</strong> ${user?.email || 'N/A'}<br>
                  <strong>Fecha de Afiliación:</strong> ${currentDate}
                </div>
              </div>

              <div class="certificate-content">
                Por medio del presente se certifica que <strong>${user?.nombre} ${user?.apellido}</strong>
                se encuentra oficialmente afiliado al Club Deportivo como jugador activo, 
                cumpliendo con todos los requisitos y normativas establecidas por la institución.
              </div>

              <div class="signatures">
                <div class="signature">
                  <div class="signature-line"></div>
                  <strong>Director Deportivo</strong><br>
                  Club Deportivo
                </div>
                <div class="signature">
                  <div class="signature-line"></div>
                  <strong>Coordinador General</strong><br>
                  Club Deportivo
                </div>
              </div>

              <div class="date">
                Emitido el ${currentDate}
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
                font-family: 'Arial', sans-serif;
                margin: 0;
                padding: 40px;
                color: #1F2937;
                background: linear-gradient(135deg, #10B981 0%, #059669 100%);
                min-height: 100vh;
              }
              .certificate-container {
                background: white;
                border-radius: 20px;
                padding: 50px;
                box-shadow: 0 20px 40px rgba(0,0,0,0.1);
                border: 8px solid ${certificateType.color};
                position: relative;
                max-width: 800px;
                margin: 0 auto;
              }
              .header {
                text-align: center;
                margin-bottom: 40px;
              }
              .club-name {
                font-size: 32px;
                font-weight: bold;
                color: ${certificateType.color};
                margin-bottom: 10px;
              }
              .certificate-title {
                font-size: 28px;
                font-weight: 800;
                color: #1F2937;
                margin-bottom: 30px;
                text-transform: uppercase;
                letter-spacing: 2px;
              }
              .user-info {
                background: #F0FDF4;
                padding: 30px;
                border-radius: 15px;
                margin: 30px 0;
                border-left: 4px solid ${certificateType.color};
              }
              .user-name {
                font-size: 24px;
                font-weight: bold;
                color: #1F2937;
                margin-bottom: 10px;
              }
              .user-details {
                font-size: 16px;
                color: #6B7280;
                line-height: 1.6;
              }
              .stats-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 20px;
                margin: 30px 0;
              }
              .stat-card {
                background: #F8FAFC;
                padding: 20px;
                border-radius: 12px;
                text-align: center;
                border: 2px solid #E5E7EB;
              }
              .stat-value {
                font-size: 24px;
                font-weight: bold;
                color: ${certificateType.color};
                margin-bottom: 8px;
              }
              .stat-label {
                font-size: 14px;
                color: #6B7280;
                font-weight: 600;
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
                margin-top: 60px;
                padding-top: 30px;
                border-top: 2px solid #E5E7EB;
              }
              .signature {
                text-align: center;
              }
              .signature-line {
                width: 200px;
                height: 1px;
                background: #D1D5DB;
                margin: 40px 0 10px;
              }
              .date {
                text-align: center;
                margin-top: 40px;
                color: #6B7280;
                font-style: italic;
              }
              .watermark {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%) rotate(-45deg);
                font-size: 80px;
                color: rgba(16, 185, 129, 0.1);
                font-weight: bold;
                pointer-events: none;
                white-space: nowrap;
              }
            </style>
          </head>
          <body>
            <div class="certificate-container">
              <div class="watermark">ASISTENCIA</div>
              
              <div class="header">
                <div class="club-name">CLUB DEPORTIVO</div>
                <div class="certificate-title">${certificateType.title}</div>
              </div>

              <div class="user-info">
                <div class="user-name">${user?.nombre} ${user?.apellido}</div>
                <div class="user-details">
                  <strong>Email:</strong> ${user?.email || 'N/A'}<br>
                  <strong>Fecha de Emisión:</strong> ${currentDate}
                </div>
              </div>

              <div class="stats-grid">
                <div class="stat-card">
                  <div class="stat-value">85%</div>
                  <div class="stat-label">Asistencia General</div>
                </div>
                <div class="stat-card">
                  <div class="stat-value">92%</div>
                  <div class="stat-label">Entrenamientos</div>
                </div>
                <div class="stat-card">
                  <div class="stat-value">78%</div>
                  <div class="stat-label">Competiciones</div>
                </div>
                <div class="stat-card">
                  <div class="stat-value">Excelente</div>
                  <div class="stat-label">Evaluación</div>
                </div>
              </div>

              <div class="certificate-content">
                Se certifica que <strong>${user?.nombre} ${user?.apellido}</strong> ha demostrado
                un excelente compromiso y participación durante la temporada actual,
                manteniendo una asistencia regular y actitud deportiva ejemplar.
              </div>

              <div class="signatures">
                <div class="signature">
                  <div class="signature-line"></div>
                  <strong>Entrenador Principal</strong><br>
                  Club Deportivo
                </div>
                <div class="signature">
                  <div class="signature-line"></div>
                  <strong>Coordinador Deportivo</strong><br>
                  Club Deportivo
                </div>
              </div>

              <div class="date">
                Emitido el ${currentDate}
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

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: `Guardar ${certificateType.title}`,
        });
      } else {
        Alert.alert(
          'PDF Generado',
          `El certificado se ha generado en: ${uri}`,
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
  certificateCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  iconContainer: {
    width: 54,
    height: 54,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 6,
  },
  cardDescription: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
  },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    paddingTop: 16,
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  generateButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DBEAFE',
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 4,
  },
  infoDescription: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
  },
  bottomSpacer: {
    height: 20,
  },
});