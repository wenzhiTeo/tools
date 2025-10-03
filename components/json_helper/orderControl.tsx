import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert } from "react-native";

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

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 20,
        width: 300,
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
