import React from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import { colors } from "../constants/theme";

const { width, height } = Dimensions.get("window");

//Componente decorativo con círculos de fondo

export default function BackgroundDecorativo() {
  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      <View style={[styles.circle, styles.circle1]} />
      <View style={[styles.circle, styles.circle2]} />
      <View style={[styles.circle, styles.circle3]} />
      <View style={[styles.circle, styles.circle4]} />
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    position: "absolute",
    borderRadius: 500,
    backgroundColor: colors.surface,
    opacity: 0.7,
  },
  circle1: {
    width: width * 0.8,
    height: width * 0.8,
    top: -width * 0.4,
    right: -width * 0.2,
  },
  circle2: {
    width: width * 0.6,
    height: width * 0.6,
    bottom: -width * 0.3,
    left: -width * 0.2,
  },
  circle3: {
    width: width * 0.4,
    height: width * 0.4,
    top: height * 0.3,
    left: -width * 0.15,
  },
  circle4: {
    width: width * 0.3,
    height: width * 0.3,
    bottom: height * 0.1,
    right: -width * 0.1,
  },
});
