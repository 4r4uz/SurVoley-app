import { View, Text, StyleSheet } from "react-native";

export default function Horarios() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Horarios de Entrenamiento</Text>
      <Text>• Lunes y Miércoles - 17:00 a 19:00</Text>
      <Text>• Sábado - 10:00 a 12:00</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 20, fontWeight: "bold", marginBottom: 10 },
});
