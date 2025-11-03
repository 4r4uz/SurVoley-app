import React, { useState } from "react";
import { View, Text, Alert, StyleSheet } from "react-native";
import { Calendar } from "react-native-calendars";

export default function Calendario() {
  const [eventos, setEventos] = useState<{ [key: string]: any }>({});

  const onDayPress = (day: any) => {
    Alert.alert(
      "Nuevo evento",
      `Seleccionaste ${day.dateString}`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Entrenamiento",
          onPress: () => agregarEvento(day.dateString, "Entrenamiento"),
        },
        {
          text: "Partido",
          onPress: () => agregarEvento(day.dateString, "Partido"),
        },
      ]
    );
  };

  const agregarEvento = (fecha: string, tipo: string) => {
    setEventos({
      ...eventos,
      [fecha]: {
        marked: true,
        dotColor: tipo === "Entrenamiento" ? "#007AFF" : "#FF5733",
        selected: true,
        selectedColor: "#ccc",
        customText: tipo,
      },
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Calendario de Entrenamientos y Partidos</Text>
      <Calendar
        markedDates={eventos}
        onDayPress={onDayPress}
        theme={{
          selectedDayBackgroundColor: "#007AFF",
          todayTextColor: "#FF5733",
          arrowColor: "#007AFF",
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10 },
  title: { fontSize: 20, fontWeight: "bold", textAlign: "center", marginVertical: 10 },
});
