import React, { useState, useRef, useEffect } from "react";
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Animated } from "react-native";

const ToggleBoolean = ({ value, onChange }: any) => {
  // 0 = Ausente (false), 1 = Presente (true)
  const labels = ["Ausente", "Presente"];
  const colors = ["#e74c3c", "#2ecc71"];

  const anim = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(anim, {
      toValue: value ? 1 : 0,
      useNativeDriver: false,
    }).start();
  }, [value]);

  const handlePress = () => {
    const next = value ? false : true;
    onChange(next);
  };

  // mover bolita: izquierda (0) o derecha (1)
  const translateX = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 70], // 70px de diferencia entre posiciones
  });

  return (
    <TouchableOpacity activeOpacity={0.8} onPress={handlePress}>
      <View style={styles.toggleTrack}>
        {labels.map((label, i) => (
          <View key={i} style={styles.segment}>
            <Text style={{ fontSize: 10, color: colors[i] }}>{label}</Text>
          </View>
        ))}

        <Animated.View
          style={[
            styles.thumb,
            {
              transform: [{ translateX }],
              backgroundColor: value ? colors[1] : colors[0],
            },
          ]}
        />
      </View>
    </TouchableOpacity>
  );
};

export default function ASistenciaScreen() {
  const [players, setPlayers] = useState([
    { id: "1", name: "Nico", status: false },
    { id: "2", name: "Ana", status: false },
    { id: "3", name: "Juan", status: false },
    { id: "4", name: "Sofía", status: false },
  ]);

  const changeStatus = (id: string, newStatus: boolean) => {
    setPlayers((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: newStatus } : p))
    );
  };

  const renderItem = ({ item }: any) => (
    <View style={styles.row}>
      <Text style={styles.name}>{item.name}</Text>
      <ToggleBoolean
        value={item.status}
        onChange={(v: boolean) => changeStatus(item.id, v)}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Asistencia Jugadores</Text>
      <FlatList data={players} keyExtractor={(i) => i.id} renderItem={renderItem} />
    </View>
  );
}

const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        paddingTop: 50, 
        paddingHorizontal: 20, 
        backgroundColor: "#fff" 
    },
    title: { 
        fontSize: 22, 
        fontWeight: "bold", 
        marginBottom: 20, 
        textAlign: "center" 
    },
    row: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderColor: "#ddd",
    },
    name: { 
        fontSize: 18,
        paddingLeft: 10
    },
    toggleTrack: {
        width: 140,
        height: 40,
        borderRadius: 20,
        backgroundColor: "#f0f0f0",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 5,
        position: "relative",
    },
    segment: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    thumb: {
        position: "absolute",
        width: 70,
        height: 40,
        borderRadius: 20,
        top: 0,
    },
});
