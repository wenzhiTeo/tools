import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, useWindowDimensions } from "react-native";

type OrderDirection = "ASC" | "DESC";

interface OrderBoxProps<T extends Record<string, any>> {
  availableKeys: (keyof T)[];
  data: T[];
  onOrdered: (newData: T[]) => void; // callback with sorted array
}

export function OrderControl<T extends Record<string, any>>({
  availableKeys,
  data,
  onOrdered,
}: OrderBoxProps<T>) {
  const { width } = useWindowDimensions();
  const isSmallScreen = width < 768;

  const [orderKey, setOrderKey] = useState<string>("");
  const [orderDirection, setOrderDirection] = useState<OrderDirection>("ASC");

  function reorder(
    src: T[],
    key: keyof T,
    direction: OrderDirection = "ASC"
  ): T[] {
    const arr = JSON.parse(JSON.stringify(src)) as T[];

    return arr.sort((a, b) => {
      const valA = a[key];
      const valB = b[key];

      if (valA == null || valB == null) return 0;

      if (typeof valA === "number" && typeof valB === "number") {
        return direction === "ASC" ? valA - valB : valB - valA;
      }

      const strA = String(valA).toLowerCase();
      const strB = String(valB).toLowerCase();

      if (strA < strB) return direction === "ASC" ? -1 : 1;
      if (strA > strB) return direction === "ASC" ? 1 : -1;
      return 0;
    });
  }

  const handleConfirm = () => {
    if (!availableKeys.includes(orderKey as keyof T)) {
      Alert.alert("Invalid Key", `"${orderKey}" is not in available keys.`);
      return;
    }

    if (!Array.isArray(data)) return;

    const ordered = reorder(data, orderKey as keyof T, orderDirection);
    onOrdered(ordered);
  };

  if (isSmallScreen) {
    // 手机端：上下两行布局
    return (
      <View style={{ marginBottom: 12, width: "100%" }}>
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
          <TextInput
            value={orderKey}
            onChangeText={setOrderKey}
            placeholder="Sort by key"
            style={{
              flex: 1,
              borderWidth: 1,
              borderColor: "#ccc",
              borderRadius: 6,
              padding: 8,
              fontSize: 13,
            }}
          />
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <TouchableOpacity
            onPress={() => setOrderDirection("ASC")}
            style={{
              flex: 1,
              paddingVertical: 8,
              borderRadius: 6,
              backgroundColor: orderDirection === "ASC" ? "#4CAF50" : "#ddd",
              alignItems: "center",
            }}
          >
            <Text style={{ color: orderDirection === "ASC" ? "white" : "black", fontSize: 13 }}>
              ASC
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setOrderDirection("DESC")}
            style={{
              flex: 1,
              paddingVertical: 8,
              borderRadius: 6,
              backgroundColor: orderDirection === "DESC" ? "#4CAF50" : "#ddd",
              alignItems: "center",
            }}
          >
            <Text style={{ color: orderDirection === "DESC" ? "white" : "black", fontSize: 13 }}>
              DESC
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleConfirm}
            style={{
              flex: 1,
              paddingVertical: 8,
              borderRadius: 6,
              backgroundColor: "#2196F3",
              alignItems: "center",
            }}
          >
            <Text style={{ color: "white", fontSize: 13 }}>Sort</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // 电脑端：横向一行布局
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 20,
        maxWidth: 400,
      }}
    >
      <TextInput
        value={orderKey}
        onChangeText={setOrderKey}
        placeholder="Enter key"
        style={{
          flex: 1,
          borderWidth: 1,
          borderColor: "#ccc",
          borderRadius: 8,
          padding: 8,
          marginRight: 8,
        }}
      />

      {/* ASC button */}
      <TouchableOpacity
        onPress={() => setOrderDirection("ASC")}
        style={{
          paddingVertical: 8,
          paddingHorizontal: 12,
          borderRadius: 6,
          backgroundColor: orderDirection === "ASC" ? "#4CAF50" : "#ddd",
          marginRight: 8,
        }}
      >
        <Text style={{ color: orderDirection === "ASC" ? "white" : "black" }}>
          ASC
        </Text>
      </TouchableOpacity>

      {/* DESC button */}
      <TouchableOpacity
        onPress={() => setOrderDirection("DESC")}
        style={{
          paddingVertical: 8,
          paddingHorizontal: 12,
          borderRadius: 6,
          backgroundColor: orderDirection === "DESC" ? "#4CAF50" : "#ddd",
          marginRight: 8,
        }}
      >
        <Text style={{ color: orderDirection === "DESC" ? "white" : "black" }}>
          DESC
        </Text>
      </TouchableOpacity>

      {/* Confirm button */}
      <TouchableOpacity
        onPress={handleConfirm}
        style={{
          paddingVertical: 8,
          paddingHorizontal: 12,
          borderRadius: 6,
          backgroundColor: "#2196F3",
        }}
      >
        <Text style={{ color: "white" }}>Confirm</Text>
      </TouchableOpacity>
    </View>
  );
}
