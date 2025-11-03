import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";

export default function Pagos() {
  const handlePago = () => {
    Alert.alert("Pago realizado", "Tu pago ha sido procesado correctamente ✅");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pago Mensual</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 20, fontWeight: "bold", marginBottom: 10 },
  text: { marginBottom: 20 },
});
