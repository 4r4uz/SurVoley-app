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
import { colors, spacing, borderRadius, typography } from "../../constants/theme";

export default function Calendario() {
  const [eventos, setEventos] = useState<{ [key: string]: any }>({});
  const [proximoEvento, setProximoEvento] = useState<string>("");
  const [horarioAsistencia, setHorarioAsistencia] = useState({ inicio: 9, fin: 12 });
  const [fechaSeleccionada, setFechaSeleccionada] = useState<string | null>(null);
  const [tipoEvento, setTipoEvento] = useState<string | null>(null);
  const [horaSeleccionada, setHoraSeleccionada] = useState<Date | null>(null);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [seleccionando, setSeleccionando] = useState<"inicio" | "fin" | null>(null);
  const [horaTemp, setHoraTemp] = useState(new Date());

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

  // confirmar evento
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
        dotColor: tipoEvento === "Entrenamiento" ? colors.primary : colors.error,
        selected: true,
        selectedColor: colors.border,
        customText: `${tipoEvento} - ${fechaHora}`,
        tipo: tipoEvento,
        hora: fechaHora,
      },
    }));

    const horaInicio = horaSeleccionada.getHours();
    const nuevoHorario = { inicio: horaInicio, fin: horaInicio + 2 };
    setHorarioAsistencia(nuevoHorario);
    await AsyncStorage.setItem("horarioAsistencia", JSON.stringify(nuevoHorario));

    Alert.alert("✅ Evento guardado", `${tipoEvento} confirmado para ${fechaHora}`);
    setTipoEvento(null);
    setHoraSeleccionada(null);
  };

  useEffect(() => {
    const cargarHorario = async () => {
      const data = await AsyncStorage.getItem("horarioAsistencia");
      if (data) setHorarioAsistencia(JSON.parse(data));
    };
    cargarHorario();
  }, []);

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
          selectedDayBackgroundColor: colors.primary,
          todayTextColor: colors.error,
          arrowColor: colors.primary,
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
            style={[styles.btn, { backgroundColor: colors.primary }]}
            onPress={confirmarEvento}
          >
            <Text style={styles.btnText}>Confirmar</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.horarioBox}>
        <Text style={styles.horario}>
          🕒 Horario permitido: {horarioAsistencia.inicio}:00 - {horarioAsistencia.fin}:00
        </Text>
        <View style={styles.botonesBox}>
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: colors.primary }]}
            onPress={() => abrirSelector("inicio")}
          >
            <Text style={styles.btnText}>Cambiar inicio</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: colors.success }]}
            onPress={() => abrirSelector("fin")}
          >
            <Text style={styles.btnText}>Cambiar fin</Text>
          </TouchableOpacity>
        </View>
      </View>

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
  container: { 
    flex: 1, 
    padding: spacing.md,
    backgroundColor: colors.background,
  },
  title: {
    ...typography.h2,
    textAlign: "center",
    marginVertical: spacing.md,
  },
  aviso: { 
    textAlign: "center", 
    ...typography.body,
    color: colors.text.primary, 
    marginVertical: spacing.sm,
  },
  confirmBox: {
    marginTop: spacing.lg,
    backgroundColor: colors.bubble1,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    alignItems: "center",
  },
  confirmText: {
    ...typography.label,
    fontSize: 16,
    color: colors.text.primary,
    textAlign: "center",
    marginBottom: spacing.md,
  },
  horarioBox: {
    marginTop: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.bubble1,
    borderRadius: borderRadius.md,
  },
  horario: { 
    textAlign: "center", 
    color: colors.text.primary, 
    fontWeight: "600",
  },
  botonesBox: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    marginTop: spacing.md,
  },
  btn: {
    padding: spacing.md,
    borderRadius: borderRadius.sm,
    width: 140,
  },
  btnText: { 
    color: colors.text.inverse, 
    textAlign: "center", 
    fontWeight: "bold",
  },
});
