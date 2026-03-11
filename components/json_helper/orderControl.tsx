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
          paddingVertical: isSmall ? 10 : 10,
          paddingHorizontal: isSmall ? 0 : 18,
          borderRadius: 12,
          backgroundColor: active ? "#059669" : "#f1f5f9",
          borderWidth: 0,
          alignItems: "center",
        }}
      >
        <Text style={{ color: active ? "#fff" : "#64748b", fontSize: fs, fontWeight: "600" }}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View
      style={{
        borderWidth: 0,
        borderRadius: 16,
        backgroundColor: "#ffffff",
        padding: isSmall ? 14 : 18,
        marginBottom: isSmall ? 14 : 18,
        shadowColor: "#64748b",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
      }}
    >
      <Text style={{ fontSize: isSmall ? 14 : 15, fontWeight: "700", color: "#1e293b", marginBottom: isSmall ? 10 : 14, letterSpacing: -0.2 }}>
        Sort
      </Text>

      {isSmall ? (
        <View>
          <TextInput
            value={orderKey}
            onChangeText={setOrderKey}
            placeholder="Enter sort key"
            placeholderTextColor="#94a3b8"
            style={{
              borderWidth: 0,
              borderRadius: 12,
              paddingVertical: 10,
              paddingHorizontal: 14,
              fontSize: fs,
              backgroundColor: "#f1f5f9",
              color: "#334155",
              marginBottom: 10,
            }}
          />
          <View style={{ flexDirection: "row", gap: 8 }}>
            {dirBtn("ASC", "↑ ASC")}
            {dirBtn("DESC", "↓ DESC")}
            <TouchableOpacity
              onPress={handleConfirm}
              style={{
                flex: 1,
                paddingVertical: 10,
                borderRadius: 12,
                backgroundColor: "#2563eb",
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#fff", fontSize: fs, fontWeight: "600" }}>Sort</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <TextInput
            value={orderKey}
            onChangeText={setOrderKey}
            placeholder="Enter sort key"
            placeholderTextColor="#94a3b8"
            style={{
              flex: 1,
              maxWidth: 200,
              borderWidth: 0,
              borderRadius: 12,
              paddingVertical: 10,
              paddingHorizontal: 14,
              fontSize: fs,
              backgroundColor: "#f1f5f9",
              color: "#334155",
            }}
          />
          {dirBtn("ASC", "↑ ASC")}
          {dirBtn("DESC", "↓ DESC")}
          <TouchableOpacity
            onPress={handleConfirm}
            style={{
              paddingVertical: 10,
              paddingHorizontal: 24,
              borderRadius: 12,
              backgroundColor: "#2563eb",
            }}
          >
            <Text style={{ color: "#fff", fontSize: fs, fontWeight: "600" }}>Sort</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
