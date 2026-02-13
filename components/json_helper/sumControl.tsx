import { useState, useEffect, useMemo } from "react";
import { View, Text, TouchableOpacity, useWindowDimensions } from "react-native";

interface SumControlProps {
  availableKeys: string[];
  data: Record<string, any>[] | null;
}

export function SumControl({ availableKeys, data }: SumControlProps) {
  const { width } = useWindowDimensions();
  const isSmall = width < 768;

  const [selectedSumKeys, setSelectedSumKeys] = useState<string[]>([]);

  const numericKeys = useMemo(() => {
    if (!Array.isArray(data) || data.length === 0) return [];
    return availableKeys.filter((key) =>
      data.some((row) => typeof row[key] === "number")
    );
  }, [availableKeys, data]);

  useEffect(() => {
    setSelectedSumKeys((prev) => prev.filter((k) => numericKeys.includes(k)));
  }, [numericKeys]);

  const sumResults = useMemo(() => {
    if (!Array.isArray(data) || selectedSumKeys.length === 0) return {};
    const results: Record<string, { sum: number; count: number; avg: number }> = {};
    for (const key of selectedSumKeys) {
      let sum = 0;
      let count = 0;
      for (const row of data) {
        if (typeof row[key] === "number") {
          sum += row[key];
          count++;
        }
      }
      const avg = count > 0 ? sum / count : 0;
      results[key] = {
        sum: Math.round(sum * 1e10) / 1e10,
        count,
        avg: Math.round(avg * 1e10) / 1e10,
      };
    }
    return results;
  }, [data, selectedSumKeys]);

  const toggleSumKey = (key: string) => {
    setSelectedSumKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  if (numericKeys.length === 0) return null;

  const fs = isSmall ? 12 : 13;

  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: "#e2e8f0",
        backgroundColor: "#fff",
        padding: isSmall ? 12 : 16,
        borderRadius: 12,
        marginBottom: isSmall ? 12 : 16,
      }}
    >
      <Text style={{ fontSize: isSmall ? 13 : 14, fontWeight: "600", color: "#334155", marginBottom: isSmall ? 8 : 12 }}>
        Aggregate
      </Text>

      {/* Numeric key pills */}
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: isSmall ? 6 : 8 }}>
        {numericKeys.map((key) => {
          const isSelected = selectedSumKeys.includes(key);
          return (
            <TouchableOpacity
              key={key}
              onPress={() => toggleSumKey(key)}
              style={{
                paddingVertical: isSmall ? 5 : 6,
                paddingHorizontal: isSmall ? 10 : 14,
                borderRadius: 20,
                backgroundColor: isSelected ? "#3b82f6" : "#f1f5f9",
                borderWidth: 1,
                borderColor: isSelected ? "#2563eb" : "#e2e8f0",
              }}
            >
              <Text
                style={{
                  color: isSelected ? "#fff" : "#64748b",
                  fontSize: fs,
                  fontWeight: "500",
                }}
              >
                Σ {key}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Results */}
      {selectedSumKeys.length > 0 && (
        <View
          style={{
            marginTop: isSmall ? 10 : 14,
            backgroundColor: "#f8fafc",
            borderRadius: 10,
            padding: isSmall ? 10 : 14,
            borderWidth: 1,
            borderColor: "#e2e8f0",
          }}
        >
          {selectedSumKeys.map((key, idx) => {
            const r = sumResults[key];
            if (!r) return null;
            const isLast = idx === selectedSumKeys.length - 1;
            return (
              <View
                key={key}
                style={{
                  flexDirection: isSmall ? "column" : "row",
                  alignItems: isSmall ? "flex-start" : "center",
                  gap: isSmall ? 4 : 20,
                  paddingVertical: isSmall ? 6 : 8,
                  borderBottomWidth: isLast ? 0 : 1,
                  borderBottomColor: "#e2e8f0",
                }}
              >
                <Text
                  style={{
                    fontWeight: "600",
                    fontSize: fs,
                    color: "#3b82f6",
                    minWidth: isSmall ? undefined : 100,
                  }}
                >
                  {key}
                </Text>
                <View style={{ flexDirection: "row", gap: isSmall ? 12 : 24, flexWrap: "wrap" }}>
                  {[
                    { label: "SUM", value: r.sum },
                    { label: "AVG", value: r.avg },
                    { label: "COUNT", value: r.count },
                  ].map(({ label, value }) => (
                    <Text key={label} style={{ fontSize: fs, color: "#475569" }}>
                      <Text style={{ color: "#94a3b8", fontWeight: "500" }}>{label} </Text>
                      <Text style={{ fontWeight: "600", color: "#334155" }}>{value}</Text>
                    </Text>
                  ))}
                </View>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}
