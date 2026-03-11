import { useState, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  ScrollView,
} from "react-native";
import * as Clipboard from "expo-clipboard";

interface ExtractValuesProps {
  /** Optional: called with the extracted array when user clicks Extract */
  onExtracted?: (values: any[]) => void;
}

export function ExtractValues({ onExtracted }: ExtractValuesProps) {
  const { width } = useWindowDimensions();
  const isSmall = width < 768;

  const [rawInput, setRawInput] = useState("");
  const [parsedData, setParsedData] = useState<Record<string, any>[] | null>(null);
  const [parseError, setParseError] = useState("");
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [result, setResult] = useState<string>("");
  const [copied, setCopied] = useState(false);

  // All available keys from parsed data
  const availableKeys = useMemo(() => {
    if (!parsedData || parsedData.length === 0) return [];
    const keySet = new Set<string>();
    for (const item of parsedData) {
      for (const key of Object.keys(item)) {
        keySet.add(key);
      }
    }
    return Array.from(keySet);
  }, [parsedData]);

  // Detect value type for a key (for display hint)
  const keyTypeHint = useMemo(() => {
    if (!parsedData || !selectedKey) return "";
    const sample = parsedData.find((item) => item[selectedKey] !== undefined);
    if (!sample) return "";
    const val = sample[selectedKey];
    return typeof val;
  }, [parsedData, selectedKey]);

  const handleParse = () => {
    setParseError("");
    setParsedData(null);
    setSelectedKey(null);
    setResult("");

    let text = rawInput.trim();
    if (!text) {
      setParseError("Please paste an array of objects.");
      return;
    }

    // Try to fix common non-JSON formats:
    // - Unquoted keys:  { name: "ja" }  →  { "name": "ja" }
    // - Trailing commas
    // - Single quotes → double quotes
    try {
      // First try standard JSON parse
      const data = JSON.parse(text);
      if (!Array.isArray(data)) {
        setParseError("Input must be an array of objects.");
        return;
      }
      if (data.length === 0 || typeof data[0] !== "object" || data[0] === null) {
        setParseError("Array must contain objects.");
        return;
      }
      setParsedData(data);
      return;
    } catch {
      // Not valid JSON, try to fix common JS object syntax
    }

    try {
      // Remove trailing semicolons
      text = text.replace(/;\s*$/, "");
      // Wrap in parentheses for eval-like parsing via Function constructor
      // This handles unquoted keys, single quotes, trailing commas, etc.
      const fn = new Function(`return (${text})`);
      const data = fn();
      if (!Array.isArray(data)) {
        setParseError("Input must be an array of objects.");
        return;
      }
      if (data.length === 0 || typeof data[0] !== "object" || data[0] === null) {
        setParseError("Array must contain objects.");
        return;
      }
      setParsedData(data);
    } catch (e: any) {
      setParseError(`Parse error: ${e.message || "Invalid input"}`);
    }
  };

  const handleExtract = () => {
    if (!parsedData || !selectedKey) return;
    const values = parsedData
      .map((item) => item[selectedKey])
      .filter((v) => v !== undefined);
    const json = JSON.stringify(values);
    setResult(json);
    setCopied(false);
    onExtracted?.(values);
  };

  const handleCopy = async () => {
    if (!result) return;
    await Clipboard.setStringAsync(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    setRawInput("");
    setParsedData(null);
    setParseError("");
    setSelectedKey(null);
    setResult("");
    setCopied(false);
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
      <Text
        style={{
          fontSize: isSmall ? 14 : 15,
          fontWeight: "700",
          color: "#1e293b",
          marginBottom: isSmall ? 10 : 14,
          letterSpacing: -0.2,
        }}
      >
        Extract Values
      </Text>

      {/* Input area */}
      <TextInput
        value={rawInput}
        onChangeText={setRawInput}
        placeholder={'Paste array of objects, e.g.\n[{ name: "ja" }, { name: "zh" }]'}
        placeholderTextColor="#94a3b8"
        multiline
        style={{
          borderWidth: 0,
          borderRadius: 12,
          paddingVertical: isSmall ? 10 : 12,
          paddingHorizontal: isSmall ? 12 : 14,
          fontSize: fs,
          backgroundColor: "#f1f5f9",
          color: "#334155",
          minHeight: isSmall ? 90 : 110,
          textAlignVertical: "top",
          fontFamily: "monospace",
          marginBottom: isSmall ? 10 : 12,
        }}
      />

      {/* Parse + Clear buttons */}
      <View
        style={{
          flexDirection: "row",
          gap: 10,
          marginBottom: isSmall ? 10 : 12,
        }}
      >
        <TouchableOpacity
          onPress={handleParse}
          style={{
            paddingVertical: isSmall ? 9 : 10,
            paddingHorizontal: isSmall ? 20 : 24,
            borderRadius: 12,
            backgroundColor: "#7c3aed",
          }}
        >
          <Text style={{ color: "#fff", fontSize: fs, fontWeight: "600" }}>
            Parse
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleClear}
          style={{
            paddingVertical: isSmall ? 9 : 10,
            paddingHorizontal: isSmall ? 20 : 24,
            borderRadius: 12,
            backgroundColor: "#f1f5f9",
            borderWidth: 0,
          }}
        >
          <Text style={{ color: "#64748b", fontSize: fs, fontWeight: "600" }}>
            Clear
          </Text>
        </TouchableOpacity>
      </View>

      {/* Parse error */}
      {parseError ? (
        <Text
          style={{
            fontSize: fs,
            color: "#dc2626",
            marginBottom: isSmall ? 10 : 12,
            padding: 12,
            backgroundColor: "#fef2f2",
            borderRadius: 10,
            borderWidth: 0,
            fontWeight: "500",
          }}
        >
          {parseError}
        </Text>
      ) : null}

      {/* Field selection */}
      {parsedData && availableKeys.length > 0 ? (
        <View
          style={{
            backgroundColor: "#f8fafc",
            borderRadius: 14,
            padding: isSmall ? 12 : 16,
            borderWidth: 0,
            marginBottom: isSmall ? 10 : 12,
          }}
        >
          <Text
            style={{
              fontSize: fs,
              color: "#64748b",
              fontWeight: "600",
              marginBottom: isSmall ? 8 : 10,
            }}
          >
            Select a field ({parsedData.length} objects found)
          </Text>

          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: isSmall ? 8 : 10,
            }}
          >
            {availableKeys.map((key) => {
              const isSelected = selectedKey === key;
              return (
                <TouchableOpacity
                  key={key}
                  onPress={() => {
                    setSelectedKey(key);
                    setResult("");
                    setCopied(false);
                  }}
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
                    {key}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Extract button */}
          {selectedKey ? (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                marginTop: isSmall ? 12 : 14,
              }}
            >
              <TouchableOpacity
                onPress={handleExtract}
                style={{
                  paddingVertical: isSmall ? 9 : 10,
                  paddingHorizontal: isSmall ? 20 : 24,
                  borderRadius: 12,
                  backgroundColor: "#059669",
                }}
              >
                <Text
                  style={{ color: "#fff", fontSize: fs, fontWeight: "600" }}
                >
                  Extract &quot;{selectedKey}&quot;
                </Text>
              </TouchableOpacity>
              {keyTypeHint ? (
                <Text style={{ fontSize: fs, color: "#64748b", fontWeight: "500" }}>
                  type: {keyTypeHint}
                </Text>
              ) : null}
            </View>
          ) : null}
        </View>
      ) : null}

      {/* Result */}
      {result ? (
        <View
          style={{
            backgroundColor: "#ecfdf5",
            borderRadius: 14,
            padding: isSmall ? 12 : 16,
            borderWidth: 0,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: isSmall ? 8 : 10,
            }}
          >
            <Text
              style={{
                fontSize: fs,
                fontWeight: "700",
                color: "#059669",
              }}
            >
              Result
            </Text>
            <TouchableOpacity
              onPress={handleCopy}
              style={{
                paddingVertical: isSmall ? 6 : 7,
                paddingHorizontal: isSmall ? 12 : 16,
                borderRadius: 10,
                backgroundColor: copied ? "#059669" : "#ffffff",
                borderWidth: 0,
              }}
            >
              <Text
                style={{
                  color: copied ? "#fff" : "#059669",
                  fontSize: isSmall ? 11 : 12,
                  fontWeight: "600",
                }}
              >
                {copied ? "✓ Copied" : "Copy"}
              </Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal>
            <Text
              selectable
              style={{
                fontSize: fs,
                color: "#334155",
                fontFamily: "monospace",
              }}
            >
              {result}
            </Text>
          </ScrollView>
        </View>
      ) : null}
    </View>
  );
}
