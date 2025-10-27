import { ReactNode } from "react";
import { View, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface SafeLayoutProps {
  children: ReactNode;
  backgroundColor?: string;
  edges?: Array<"top" | "right" | "bottom" | "left">;
  headerBackgroundColor?: string; 
}

export default function SafeLayout({
  children,
  edges = ["top", "right", "bottom", "left"],
  headerBackgroundColor,
}: SafeLayoutProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      {headerBackgroundColor && (
        <View 
          style={[
            styles.absoluteHeader,
            { 
              height: insets.top + 100, 
            }
          ]} 
        />
      )}
      
      <View
        style={[
          styles.content,
          {
            paddingTop: edges.includes("top") ? insets.top : 0,
            paddingRight: edges.includes("right") ? insets.right : 0,
            paddingBottom: edges.includes("bottom") ? insets.bottom : 0,
            paddingLeft: edges.includes("left") ? insets.left : 0,
          },
        ]}
      >
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  absoluteHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
  },
  content: {
    flex: 1,
    zIndex: 2,
  },
});