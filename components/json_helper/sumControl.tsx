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
        borderWidth: 0,
        backgroundColor: "#ffffff",
        padding: isSmall ? 14 : 18,
        borderRadius: 16,
        marginBottom: isSmall ? 14 : 18,
        shadowColor: "#64748b",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
      }}
    >
      <Text style={{ fontSize: isSmall ? 14 : 15, fontWeight: "700", color: "#1e293b", marginBottom: isSmall ? 10 : 14, letterSpacing: -0.2 }}>
        Aggregate
      </Text>

      {/* Numeric key pills */}
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: isSmall ? 8 : 10 }}>
        {numericKeys.map((key) => {
          const isSelected = selectedSumKeys.includes(key);
          return (
            <TouchableOpacity
              key={key}
              onPress={() => toggleSumKey(key)}
              style={{
                paddingVertical: isSmall ? 8 : 9,
                paddingHorizontal: isSmall ? 14 : 18,
                borderRadius: 12,
                backgroundColor: isSelected ? "#2563eb" : "#f1f5f9",
                borderWidth: 0,
              }}
            >
              <Text
                style={{
                  color: isSelected ? "#fff" : "#64748b",
                  fontSize: fs,
                  fontWeight: "600",
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
            marginTop: isSmall ? 12 : 16,
            backgroundColor: "#f8fafc",
            borderRadius: 14,
            padding: isSmall ? 12 : 16,
            borderWidth: 0,
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
                  gap: isSmall ? 6 : 24,
                  paddingVertical: isSmall ? 8 : 10,
                  borderBottomWidth: isLast ? 0 : 1,
                  borderBottomColor: "#e2e8f0",
                }}
              >
                <Text
                  style={{
                    fontWeight: "700",
                    fontSize: fs,
                    color: "#2563eb",
                    minWidth: isSmall ? undefined : 110,
                  }}
                >
                  {key}
                </Text>
                <View style={{ flexDirection: "row", gap: isSmall ? 16 : 28, flexWrap: "wrap" }}>
                  {[
                    { label: "SUM", value: r.sum },
                    { label: "AVG", value: r.avg },
                    { label: "COUNT", value: r.count },
                  ].map(({ label, value }) => (
                    <Text key={label} style={{ fontSize: fs, color: "#475569" }}>
                      <Text style={{ color: "#94a3b8", fontWeight: "600" }}>{label} </Text>
                      <Text style={{ fontWeight: "700", color: "#1e293b" }}>{value}</Text>
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
