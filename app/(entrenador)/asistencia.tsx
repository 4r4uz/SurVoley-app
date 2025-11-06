import React, { useState } from "react";
import { View, Text, TouchableOpacity, FlatList, StyleSheet } from "react-native";
import { colors, spacing, borderRadius, shadows, typography } from "../../constants/theme";

const alumnosIniciales = [
  { id: "1", nombre: "Juan Pérez", asistencias: 8, total: 10 },
  { id: "2", nombre: "María Gómez", asistencias: 9, total: 10 },
  { id: "3", nombre: "Carlos López", asistencias: 7, total: 10 },
];

export default function Asistencia() {
  const [alumnos, setAlumnos] = useState(alumnosIniciales);

  const marcarAsistencia = (id: string) => {
    setAlumnos(prev =>
      prev.map(a =>
        a.id === id
          ? { ...a, asistencias: a.asistencias + 1, total: a.total + 1 }
          : { ...a, total: a.total + 1 }
      )
    );
  };

  const calcularPorcentaje = (a: any) => {
    const porcentaje = (a.asistencias / a.total) * 100;
    return porcentaje.toFixed(1) + "%";
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Control de Asistencia</Text>

      <FlatList
        data={alumnos}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.name}>{item.nombre}</Text>
            <Text>Asistencia: {item.asistencias}/{item.total}</Text>
            <Text>Porcentaje: {calcularPorcentaje(item)}</Text>
            <TouchableOpacity
              style={styles.btn}
              onPress={() => marcarAsistencia(item.id)}
            >
              <Text style={styles.btnText}>Marcar presente</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: spacing.xl, 
    backgroundColor: colors.surface,
  },
  title: { 
    ...typography.h2,
    marginBottom: spacing.lg, 
    textAlign: "center",
  },
  card: {
    backgroundColor: colors.background,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  name: { 
    ...typography.h3,
    fontSize: 16,
  },
  btn: {
    backgroundColor: colors.success,
    padding: spacing.md,
    borderRadius: borderRadius.sm,
    marginTop: spacing.sm,
    alignItems: "center",
  },
  btnText: { 
    color: colors.text.inverse, 
    fontWeight: "bold",
  },
});
