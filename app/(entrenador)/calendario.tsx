import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Alert,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from "react-native";
import { Calendar } from "react-native-calendars";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from "@react-native-community/datetimepicker";

export default function Calendario() {
  const [eventos, setEventos] = useState<{ [key: string]: any }>({});
  const [proximoEvento, setProximoEvento] = useState<string>("");

  // Horario permitido para asistencia
  const [horarioAsistencia, setHorarioAsistencia] = useState({ inicio: 9, fin: 12 });

  // Controladores de selección
  const [fechaSeleccionada, setFechaSeleccionada] = useState<string | null>(null);
  const [tipoEvento, setTipoEvento] = useState<string | null>(null);
  const [horaSeleccionada, setHoraSeleccionada] = useState<Date | null>(null);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [seleccionando, setSeleccionando] = useState<"inicio" | "fin" | null>(null);
  const [horaTemp, setHoraTemp] = useState(new Date());

  // Cuando se toca una fecha en el calendario
  const onDayPress = (day: any) => {
    setFechaSeleccionada(day.dateString);
    Alert.alert("Nuevo evento", `Seleccionaste ${day.dateString}`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Entrenamiento",
        onPress: () => {
          setTipoEvento("Entrenamiento");
          setPickerVisible(true);
        },
      },
      {
        text: "Partido",
        onPress: () => {
          setTipoEvento("Partido");
          setPickerVisible(true);
        },
      },
    ]);
  };

  // Selección de hora
  const onHoraSeleccionadaEvento = (_: any, selectedDate?: Date) => {
    if (selectedDate) {
      setHoraSeleccionada(selectedDate);
    }
    setPickerVisible(false);
  };

  // Confirmar evento con fecha y hora unificadas
  const confirmarEvento = async () => {
    if (!fechaSeleccionada || !horaSeleccionada || !tipoEvento) {
      Alert.alert("Faltan datos", "Selecciona una fecha, tipo y hora antes de confirmar.");
      return;
    }

    const fechaHora = `${fechaSeleccionada} ${horaSeleccionada
      .toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", hour12: false })
      .replace(".", ":")}`;

    setEventos((prev) => ({
      ...prev,
      [fechaSeleccionada]: {
        marked: true,
        dotColor: tipoEvento === "Entrenamiento" ? "#007AFF" : "#FF5733",
        selected: true,
        selectedColor: "#ccc",
        customText: `${tipoEvento} - ${fechaHora}`,
        tipo: tipoEvento,
        hora: fechaHora,
      },
    }));

    // Actualiza horario permitido (por ejemplo, de 18:00 a 20:00)
    const horaInicio = horaSeleccionada.getHours();
    const nuevoHorario = { inicio: horaInicio, fin: horaInicio + 2 };
    setHorarioAsistencia(nuevoHorario);
    await AsyncStorage.setItem("horarioAsistencia", JSON.stringify(nuevoHorario));

    Alert.alert("✅ Evento guardado", `${tipoEvento} confirmado para ${fechaHora}`);
    setTipoEvento(null);
    setHoraSeleccionada(null);
  };

  // Cargar horario almacenado
  useEffect(() => {
    const cargarHorario = async () => {
      const data = await AsyncStorage.getItem("horarioAsistencia");
      if (data) setHorarioAsistencia(JSON.parse(data));
    };
    cargarHorario();
  }, []);

  // Calcular próximo evento
  useEffect(() => {
    const fechas = Object.keys(eventos);
    if (fechas.length > 0) {
      const hoy = new Date();
      const proximas = fechas
        .map((f) => new Date(f))
        .filter((f) => f >= hoy)
        .sort((a, b) => a.getTime() - b.getTime());
      if (proximas.length > 0) {
        const fechaMasCercana = proximas[0].toISOString().split("T")[0];
        const evento = eventos[fechaMasCercana];
        setProximoEvento(`📅 Próximo ${evento.tipo}: ${evento.hora}`);
      } else setProximoEvento("No hay eventos próximos");
    } else setProximoEvento("No hay eventos agendados");
  }, [eventos]);

  // Selector de hora editable de asistencia
  const abrirSelector = (tipo: "inicio" | "fin") => {
    setSeleccionando(tipo);
    setHoraTemp(new Date());
    setPickerVisible(true);
  };

  const onHoraSeleccionadaAsistencia = async (_: any, selectedDate?: Date) => {
    if (selectedDate && seleccionando) {
      const hora = selectedDate.getHours();
      const nuevoHorario = {
        ...horarioAsistencia,
        [seleccionando]: hora,
      };
      setHorarioAsistencia(nuevoHorario);
      await AsyncStorage.setItem("horarioAsistencia", JSON.stringify(nuevoHorario));
    }
    setPickerVisible(false);
    setSeleccionando(null);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📆 Calendario de Entrenamientos y Partidos</Text>

      {proximoEvento !== "" && <Text style={styles.aviso}>{proximoEvento}</Text>}

      <Calendar
        markedDates={eventos}
        onDayPress={onDayPress}
        theme={{
          selectedDayBackgroundColor: "#007AFF",
          todayTextColor: "#FF5733",
          arrowColor: "#007AFF",
        }}
      />

      {fechaSeleccionada && tipoEvento && horaSeleccionada && (
        <View style={styles.confirmBox}>
          <Text style={styles.confirmText}>
            Confirmar {tipoEvento} el{" "}
            {`${fechaSeleccionada} ${horaSeleccionada
              .toLocaleTimeString("es-AR", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
              })
              .replace(".", ":")}`}
          </Text>

          <TouchableOpacity
            style={[styles.btn, { backgroundColor: "#007AFF" }]}
            onPress={confirmarEvento}
          >
            <Text style={styles.btnText}>Confirmar</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Sección editable del horario de asistencia */}
      <View style={styles.horarioBox}>
        <Text style={styles.horario}>
          🕒 Horario permitido: {horarioAsistencia.inicio}:00 - {horarioAsistencia.fin}:00
        </Text>
        <View style={styles.botonesBox}>
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: "#007AFF" }]}
            onPress={() => abrirSelector("inicio")}
          >
            <Text style={styles.btnText}>Cambiar inicio</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: "#28a745" }]}
            onPress={() => abrirSelector("fin")}
          >
            <Text style={styles.btnText}>Cambiar fin</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Selector de hora nativo */}
      {pickerVisible && !seleccionando && (
        <DateTimePicker
          value={new Date()}
          mode="time"
          is24Hour={true}
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={onHoraSeleccionadaEvento}
        />
      )}

      {pickerVisible && seleccionando && (
        <DateTimePicker
          value={horaTemp}
          mode="time"
          is24Hour={true}
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={onHoraSeleccionadaAsistencia}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10 },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginVertical: 10,
  },
  aviso: { textAlign: "center", fontSize: 16, color: "#333", marginVertical: 8 },
  confirmBox: {
    marginTop: 15,
    backgroundColor: "#eef6ff",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  confirmText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    textAlign: "center",
    marginBottom: 10,
  },
  horarioBox: {
    marginTop: 15,
    padding: 10,
    backgroundColor: "#eef",
    borderRadius: 10,
  },
  horario: { textAlign: "center", color: "#333", fontWeight: "600" },
  botonesBox: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    marginTop: 10,
  },
  btn: {
    padding: 10,
    borderRadius: 8,
    width: 140,
  },
  btnText: { color: "#fff", textAlign: "center", fontWeight: "bold" },
});
