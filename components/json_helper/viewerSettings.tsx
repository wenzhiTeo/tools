import { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  useWindowDimensions,
} from "react-native";

export interface ViewerSettingsValues {
  quotesOnKeys: boolean;
  sortKeys: boolean;
  displayDataTypes: boolean;
  displayObjectSize: boolean;
  indentWidth: number;
  collapseStringsAfterLength: number | false;
  groupArraysAfterLength: number;
}

const DEFAULT_SETTINGS: ViewerSettingsValues = {
  quotesOnKeys: true,
  sortKeys: false,
  displayDataTypes: true,
  displayObjectSize: true,
  indentWidth: 4,
  collapseStringsAfterLength: false,
  groupArraysAfterLength: 100,
};

interface Props {
  onChange: (settings: ViewerSettingsValues) => void;
}

export function ViewerSettings({ onChange }: Props) {
  const { width } = useWindowDimensions();
  const isSmall = width < 768;

  const [settings, setSettings] = useState<ViewerSettingsValues>(DEFAULT_SETTINGS);
  const [draft, setDraft] = useState({
    indentWidth: "4",
    collapseStringsAfterLength: "",
    groupArraysAfterLength: "100",
  });
  const [expanded, setExpanded] = useState(false);

  const update = useCallback(
    (patch: Partial<ViewerSettingsValues>) => {
      setSettings((prev) => {
        const next = { ...prev, ...patch };
        onChange(next);
        return next;
      });
    },
    [onChange]
  );

  const applyNumberSettings = () => {
    const indentWidth = parseInt(draft.indentWidth, 10);
    const groupArraysAfterLength = parseInt(draft.groupArraysAfterLength, 10);
    const collapseStr = draft.collapseStringsAfterLength.trim();
    const collapseStringsAfterLength =
      collapseStr === "" ? false : parseInt(collapseStr, 10);

    const patch: Partial<ViewerSettingsValues> = {};
    if (!isNaN(indentWidth) && indentWidth >= 0) patch.indentWidth = indentWidth;
    if (!isNaN(groupArraysAfterLength) && groupArraysAfterLength >= 0) patch.groupArraysAfterLength = groupArraysAfterLength;
    if (collapseStringsAfterLength === false) {
      patch.collapseStringsAfterLength = false;
    } else if (!isNaN(collapseStringsAfterLength) && collapseStringsAfterLength >= 0) {
      patch.collapseStringsAfterLength = collapseStringsAfterLength;
    }
    update(patch);
  };

  const toggleItems: { key: keyof ViewerSettingsValues; label: string }[] = [
    { key: "quotesOnKeys", label: "Quotes on Keys" },
    { key: "sortKeys", label: "Sort Keys" },
    { key: "displayDataTypes", label: "Data Types" },
    { key: "displayObjectSize", label: "Object Size" },
  ];

  const numberItems: {
    key: keyof ViewerSettingsValues;
    label: string;
    placeholder: string;
  }[] = [
    { key: "indentWidth", label: "Indent Width", placeholder: "4" },
    { key: "collapseStringsAfterLength", label: "Collapse Strings After", placeholder: "-" },
    { key: "groupArraysAfterLength", label: "Group Arrays After", placeholder: "100" },
  ];

  const fs = isSmall ? 12 : 13;

  return (
    <View style={{ marginBottom: isSmall ? 12 : 18 }}>
      <TouchableOpacity
        onPress={() => setExpanded((v) => !v)}
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingVertical: 8,
          gap: 8,
        }}
      >
        <Text style={{ fontSize: isSmall ? 14 : 16, fontWeight: "700", color: "#1e293b", letterSpacing: -0.2 }}>
          {expanded ? "▾" : "▸"} Viewer Settings
        </Text>
      </TouchableOpacity>

      {!expanded ? null : (
        <View
          style={{
            borderWidth: 0,
            borderRadius: 16,
            padding: isSmall ? 14 : 18,
            backgroundColor: "#ffffff",
            marginTop: 8,
            shadowColor: "#64748b",
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: 0.06,
            shadowRadius: 8,
            elevation: 2,
          }}
        >
          {/* Boolean toggles */}
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: isSmall ? 8 : 10,
              marginBottom: isSmall ? 14 : 18,
            }}
          >
            {toggleItems.map(({ key, label }) => {
              const active = settings[key] as boolean;
              return (
                <TouchableOpacity
                  key={key}
                  onPress={() => update({ [key]: !active })}
                  style={{
                    paddingVertical: isSmall ? 8 : 9,
                    paddingHorizontal: isSmall ? 14 : 18,
                    borderRadius: 12,
                    backgroundColor: active ? "#059669" : "#f1f5f9",
                    borderWidth: 0,
                  }}
                >
                  <Text
                    style={{
                      color: active ? "#fff" : "#64748b",
                      fontSize: fs,
                      fontWeight: "600",
                    }}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Number inputs */}
          <View
            style={{
              borderWidth: 0,
              borderRadius: 14,
              padding: isSmall ? 12 : 16,
              backgroundColor: "#f8fafc",
            }}
          >
            <Text style={{ fontSize: fs, color: "#64748b", marginBottom: isSmall ? 10 : 12, fontWeight: "600" }}>
              Changes below take effect on Apply
            </Text>
            <View
              style={{
                flexDirection: isSmall ? "column" : "row",
                gap: isSmall ? 12 : 20,
                flexWrap: "wrap",
                alignItems: isSmall ? "stretch" : "center",
              }}
            >
              {numberItems.map(({ key, label, placeholder }) => {
                const draftKey = key as keyof typeof draft;
                return (
                  <View
                    key={key}
                    style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
                  >
                    <Text style={{ fontSize: fs, color: "#475569", minWidth: isSmall ? 140 : 160, fontWeight: "500" }}>
                      {label}
                    </Text>
                    <TextInput
                      value={draft[draftKey]}
                      placeholder={placeholder}
                      placeholderTextColor="#94a3b8"
                      keyboardType="numeric"
                      onChangeText={(text) =>
                        setDraft((prev) => ({ ...prev, [draftKey]: text }))
                      }
                      style={{
                        borderWidth: 0,
                        borderRadius: 10,
                        paddingVertical: 8,
                        paddingHorizontal: 12,
                        fontSize: fs,
                        width: isSmall ? 80 : 100,
                        backgroundColor: "#ffffff",
                        color: "#334155",
                      }}
                    />
                  </View>
                );
              })}
            </View>

            <TouchableOpacity
              onPress={applyNumberSettings}
              style={{
                alignSelf: "flex-end",
                marginTop: isSmall ? 12 : 14,
                paddingVertical: isSmall ? 8 : 9,
                paddingHorizontal: isSmall ? 20 : 24,
                borderRadius: 12,
                backgroundColor: "#2563eb",
              }}
            >
              <Text style={{ color: "#fff", fontSize: fs, fontWeight: "600" }}>
                Apply
              </Text>
            </TouchableOpacity>
          </View>

          {/* Reset */}
          <TouchableOpacity
            onPress={() => {
              setSettings(DEFAULT_SETTINGS);
              setDraft({
                indentWidth: "4",
                collapseStringsAfterLength: "",
                groupArraysAfterLength: "100",
              });
              onChange(DEFAULT_SETTINGS);
            }}
            style={{
              alignSelf: "flex-start",
              marginTop: isSmall ? 14 : 16,
              paddingVertical: isSmall ? 8 : 9,
              paddingHorizontal: isSmall ? 16 : 20,
              borderRadius: 12,
              backgroundColor: "#f1f5f9",
              borderWidth: 0,
            }}
          >
            <Text style={{ color: "#64748b", fontSize: fs, fontWeight: "600" }}>
              ↺ Reset Defaults
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
