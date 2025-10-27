import React, { useState } from "react";
import { View, Text, TouchableOpacity, FlatList, StyleSheet } from "react-native";

// Datos simulados (más adelante se pueden obtener desde Firebase)
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
              <Text style={styles.btnText}>MArcar Ausente</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#f9f9f9" },
  title: { fontSize: 20, fontWeight: "bold", marginBottom: 15, textAlign: "center" },
  card: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
    elevation: 3,
  },
  name: { fontWeight: "bold", fontSize: 16 },
  btn: {
    backgroundColor: "#28a745",
    padding: 10,
    borderRadius: 8,
    marginTop: 8,
    alignItems: "center",
  },
  btnText: { color: "#fff", fontWeight: "bold" },
});
