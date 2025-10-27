import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";

export default function Pagos() {
  const handlePago = () => {
    Alert.alert("Pago realizado", "Tu pago ha sido procesado correctamente ✅");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pago Mensual</Text>
      <Text style={styles.text}>Monto: $40.000</Text>
      <TouchableOpacity style={styles.payButton} onPress={handlePago}>
        <Text style={styles.payText}>Pagar ahora</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 20, fontWeight: "bold", marginBottom: 10 },
  text: { marginBottom: 20 },
  payButton: {
    backgroundColor: "#28a745",
    padding: 15,
    borderRadius: 10,
  },
  payText: {
    color: "#fff",
    fontWeight: "bold",
  },
});
