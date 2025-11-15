import React from "react";
import { View, StyleSheet, Animated } from "react-native";

interface SkeletonLoaderProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

//Componente de carga esqueleto con animación

export const SkeletonLoader = React.memo(({
  width = "100%",
  height = 20,
  borderRadius = 4,
  style
}: SkeletonLoaderProps) => {
  const animatedValue = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const startAnimation = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(animatedValue, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(animatedValue, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    startAnimation();
  }, [animatedValue]);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
          opacity,
        },
        style,
      ]}
    />
  );
});

SkeletonLoader.displayName = "SkeletonLoader";

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: "#E5E7EB",
  },
  skeletonCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  skeletonHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  skeletonText: {
    marginLeft: 12,
    flex: 1,
  },
  skeletonFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
});

// Componente para listas de skeleton
export const SkeletonList = React.memo(({ count = 3, cardHeight = 80 }: { count?: number; cardHeight?: number }) => {
  return (
    <>
      {Array.from({ length: count }, (_, index) => (
        <View key={index} style={[styles.skeletonCard, { height: cardHeight }]}>
          <View style={styles.skeletonHeader}>
            <SkeletonLoader width={40} height={40} borderRadius={20} />
            <View style={styles.skeletonText}>
              <SkeletonLoader width="60%" height={16} style={{ marginBottom: 4 }} />
              <SkeletonLoader width="40%" height={12} />
            </View>
          </View>
          <View style={styles.skeletonFooter}>
            <SkeletonLoader width={80} height={20} borderRadius={10} />
            <SkeletonLoader width={60} height={16} borderRadius={8} />
          </View>
        </View>
      ))}
    </>
  );
});

SkeletonList.displayName = "SkeletonList";
