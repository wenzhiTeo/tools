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
    <View style={{ marginBottom: isSmall ? 10 : 16 }}>
      <TouchableOpacity
        onPress={() => setExpanded((v) => !v)}
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingVertical: 6,
          gap: 6,
        }}
      >
        <Text style={{ fontSize: isSmall ? 13 : 15, fontWeight: "600", color: "#334155" }}>
          {expanded ? "▾" : "▸"} Viewer Settings
        </Text>
      </TouchableOpacity>

      {!expanded ? null : (
        <View
          style={{
            borderWidth: 1,
            borderColor: "#e2e8f0",
            borderRadius: 12,
            padding: isSmall ? 12 : 16,
            backgroundColor: "#fff",
            marginTop: 6,
          }}
        >
          {/* Boolean toggles */}
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: isSmall ? 6 : 8,
              marginBottom: isSmall ? 12 : 16,
            }}
          >
            {toggleItems.map(({ key, label }) => {
              const active = settings[key] as boolean;
              return (
                <TouchableOpacity
                  key={key}
                  onPress={() => update({ [key]: !active })}
                  style={{
                    paddingVertical: isSmall ? 5 : 6,
                    paddingHorizontal: isSmall ? 10 : 14,
                    borderRadius: 20,
                    backgroundColor: active ? "#22c55e" : "#f1f5f9",
                    borderWidth: 1,
                    borderColor: active ? "#16a34a" : "#e2e8f0",
                  }}
                >
                  <Text
                    style={{
                      color: active ? "#fff" : "#64748b",
                      fontSize: fs,
                      fontWeight: "500",
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
              borderWidth: 1,
              borderColor: "#e2e8f0",
              borderRadius: 10,
              borderStyle: "dashed",
              padding: isSmall ? 10 : 14,
              backgroundColor: "#f8fafc",
            }}
          >
            <Text style={{ fontSize: fs, color: "#94a3b8", marginBottom: isSmall ? 8 : 10, fontWeight: "500" }}>
              Changes below take effect on Apply
            </Text>
            <View
              style={{
                flexDirection: isSmall ? "column" : "row",
                gap: isSmall ? 10 : 16,
                flexWrap: "wrap",
                alignItems: isSmall ? "stretch" : "center",
              }}
            >
              {numberItems.map(({ key, label, placeholder }) => {
                const draftKey = key as keyof typeof draft;
                return (
                  <View
                    key={key}
                    style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
                  >
                    <Text style={{ fontSize: fs, color: "#475569", minWidth: isSmall ? 130 : 150 }}>
                      {label}
                    </Text>
                    <TextInput
                      value={draft[draftKey]}
                      placeholder={placeholder}
                      placeholderTextColor="#cbd5e1"
                      keyboardType="numeric"
                      onChangeText={(text) =>
                        setDraft((prev) => ({ ...prev, [draftKey]: text }))
                      }
                      style={{
                        borderWidth: 1,
                        borderColor: "#e2e8f0",
                        borderRadius: 8,
                        paddingVertical: 5,
                        paddingHorizontal: 10,
                        fontSize: fs,
                        width: isSmall ? 80 : 90,
                        backgroundColor: "#fff",
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
                marginTop: isSmall ? 10 : 12,
                paddingVertical: isSmall ? 6 : 7,
                paddingHorizontal: isSmall ? 16 : 20,
                borderRadius: 20,
                backgroundColor: "#3b82f6",
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
              marginTop: isSmall ? 12 : 14,
              paddingVertical: isSmall ? 6 : 7,
              paddingHorizontal: isSmall ? 14 : 18,
              borderRadius: 20,
              backgroundColor: "#fff",
              borderWidth: 1,
              borderColor: "#e2e8f0",
            }}
          >
            <Text style={{ color: "#64748b", fontSize: fs, fontWeight: "500" }}>
              ↺ Reset Defaults
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
