import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, useWindowDimensions } from "react-native";

type OrderDirection = "ASC" | "DESC";

interface OrderBoxProps<T extends Record<string, any>> {
  availableKeys: (keyof T)[];
  data: T[];
  onOrdered: (newData: T[]) => void;
}

export function OrderControl<T extends Record<string, any>>({
  availableKeys,
  data,
  onOrdered,
}: OrderBoxProps<T>) {
  const { width } = useWindowDimensions();
  const isSmall = width < 768;

  const [orderKey, setOrderKey] = useState<string>("");
  const [orderDirection, setOrderDirection] = useState<OrderDirection>("ASC");

  function reorder(src: T[], key: keyof T, direction: OrderDirection = "ASC"): T[] {
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

  const fs = isSmall ? 12 : 13;

  const dirBtn = (dir: OrderDirection, label: string) => {
    const active = orderDirection === dir;
    return (
      <TouchableOpacity
        onPress={() => setOrderDirection(dir)}
        style={{
          flex: isSmall ? 1 : undefined,
          paddingVertical: isSmall ? 7 : 8,
          paddingHorizontal: isSmall ? 0 : 16,
          borderRadius: 20,
          backgroundColor: active ? "#22c55e" : "#f1f5f9",
          borderWidth: 1,
          borderColor: active ? "#16a34a" : "#e2e8f0",
          alignItems: "center",
        }}
      >
        <Text style={{ color: active ? "#fff" : "#64748b", fontSize: fs, fontWeight: "500" }}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: "#e2e8f0",
        borderRadius: 12,
        backgroundColor: "#fff",
        padding: isSmall ? 12 : 16,
        marginBottom: isSmall ? 12 : 16,
      }}
    >
      <Text style={{ fontSize: isSmall ? 13 : 14, fontWeight: "600", color: "#334155", marginBottom: isSmall ? 8 : 12 }}>
        Sort
      </Text>

      {isSmall ? (
        <View>
          <TextInput
            value={orderKey}
            onChangeText={setOrderKey}
            placeholder="Enter sort key"
            placeholderTextColor="#cbd5e1"
            style={{
              borderWidth: 1,
              borderColor: "#e2e8f0",
              borderRadius: 8,
              paddingVertical: 7,
              paddingHorizontal: 10,
              fontSize: fs,
              backgroundColor: "#f8fafc",
              color: "#334155",
              marginBottom: 8,
            }}
          />
          <View style={{ flexDirection: "row", gap: 8 }}>
            {dirBtn("ASC", "↑ ASC")}
            {dirBtn("DESC", "↓ DESC")}
            <TouchableOpacity
              onPress={handleConfirm}
              style={{
                flex: 1,
                paddingVertical: 7,
                borderRadius: 20,
                backgroundColor: "#3b82f6",
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#fff", fontSize: fs, fontWeight: "600" }}>Sort</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <TextInput
            value={orderKey}
            onChangeText={setOrderKey}
            placeholder="Enter sort key"
            placeholderTextColor="#cbd5e1"
            style={{
              flex: 1,
              maxWidth: 180,
              borderWidth: 1,
              borderColor: "#e2e8f0",
              borderRadius: 8,
              paddingVertical: 7,
              paddingHorizontal: 10,
              fontSize: fs,
              backgroundColor: "#f8fafc",
              color: "#334155",
            }}
          />
          {dirBtn("ASC", "↑ ASC")}
          {dirBtn("DESC", "↓ DESC")}
          <TouchableOpacity
            onPress={handleConfirm}
            style={{
              paddingVertical: 8,
              paddingHorizontal: 20,
              borderRadius: 20,
              backgroundColor: "#3b82f6",
            }}
          >
            <Text style={{ color: "#fff", fontSize: fs, fontWeight: "600" }}>Sort</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
