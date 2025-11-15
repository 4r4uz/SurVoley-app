import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface CertificateType {
  id: string;
  title: string;
  icon: string;
  description: string;
  color: string;
}

interface CertificateCardProps {
  certificate: CertificateType;
  onGenerate: () => void;
  generating: boolean;
}

export default function CertificateCard({
  certificate,
  onGenerate,
  generating
}: CertificateCardProps) {
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
            <Ionicons name="refresh" size={16} color={certificate.color} />
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
}

const styles = StyleSheet.create({
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
});
