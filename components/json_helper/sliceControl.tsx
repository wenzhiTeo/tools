import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, useWindowDimensions } from "react-native";

interface SliceControlProps {
  data: any;
  onSliced: (newData: any) => void;
}

export function SliceControl({
  data,
  onSliced,
}: SliceControlProps) {
  const { width } = useWindowDimensions();
  const isSmall = width < 768;

  const [sliceCount, setSliceCount] = useState<string>("");

  if (!Array.isArray(data)) return null;

  const handleConfirm = () => {
    const count = parseInt(sliceCount, 10);
    if (isNaN(count) || count <= 0) {
      Alert.alert("Invalid Input", "Please enter a valid positive number.");
      return;
    }
    const sliced = data.slice(0, count);
    onSliced(sliced);
  };

  const fs = isSmall ? 12 : 13;

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
        Slice Array (Total length: {data.length})
      </Text>

      {isSmall ? (
        <View>
          <TextInput
            value={sliceCount}
            onChangeText={setSliceCount}
            placeholder="Keep first N items"
            placeholderTextColor="#94a3b8"
            keyboardType="numeric"
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
          <TouchableOpacity
            onPress={handleConfirm}
            style={{
              paddingVertical: 10,
              borderRadius: 12,
              backgroundColor: "#2563eb",
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#fff", fontSize: fs, fontWeight: "600" }}>Slice</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <TextInput
            value={sliceCount}
            onChangeText={setSliceCount}
            placeholder="Keep first N items"
            placeholderTextColor="#94a3b8"
            keyboardType="numeric"
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
          <TouchableOpacity
            onPress={handleConfirm}
            style={{
              paddingVertical: 10,
              paddingHorizontal: 24,
              borderRadius: 12,
              backgroundColor: "#2563eb",
            }}
          >
            <Text style={{ color: "#fff", fontSize: fs, fontWeight: "600" }}>Slice</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
