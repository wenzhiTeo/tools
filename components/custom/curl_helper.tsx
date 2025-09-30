import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  ScrollView,
  Switch,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import { GlobalStyles, GlobalWebStyles } from "@styles/global";

export default function CURLHelper() {
  const [curlInput, setCurlInput] = useState(
    `curl "https://example.com/api/data" -H "Authorization: Bearer token123" -H "User-Agent: CustomAgent" -d "param=value"`
  );
  const [urlReplaceFrom, setUrlReplaceFrom] = useState(
    "https://example.com/api/data"
  );
  const [urlReplaceTo, setUrlReplaceTo] = useState("http://127.0.0.1:6000");
  const [disabledHeaders, setDisabledHeaders] = useState<
    Record<string, boolean>
  >({
    Authorization: false,
    "User-Agent": false,
  });
  const [output, setOutput] = useState("");

  const processCurl = () => {
    let modified = curlInput;

    // Replace URL
    if (urlReplaceFrom && urlReplaceTo) {
      modified = modified.replace(urlReplaceFrom, urlReplaceTo);
    }

    // Remove disabled headers
    Object.entries(disabledHeaders).forEach(([header, disabled]) => {
      if (disabled) {
        const regex = new RegExp(`-H\\s+["']?${header}\\s*:[^"']*["']?`, "i");
        modified = modified.replace(regex, "");
      }
    });

    setOutput(modified.trim());
  };

  const copyToClipboard = async () => {
    await Clipboard.setStringAsync(output);
    Alert.alert("Copied!", "Output has been copied to clipboard.");
  };

  const commonStyleSheet =
    Platform.OS === "web" ? GlobalWebStyles : GlobalStyles;

  return (
    <ScrollView style={commonStyleSheet.container}>
      <Text style={GlobalStyles.sectionTitle}>Input Curl Command</Text>
      <TextInput
        value={curlInput}
        onChangeText={setCurlInput}
        multiline
        style={styles.textArea}
      />

      <Text style={commonStyleSheet.sectionTitle}>URL Replacement</Text>
      <TextInput
        placeholder="Replace from..."
        value={urlReplaceFrom}
        onChangeText={setUrlReplaceFrom}
        style={styles.input}
      />
      <TextInput
        placeholder="Replace to..."
        value={urlReplaceTo}
        onChangeText={setUrlReplaceTo}
        style={styles.input}
      />

      <Text style={GlobalStyles.sectionTitle}>Disable Headers</Text>
      {Object.keys(disabledHeaders).map((header) => (
        <View key={header} style={styles.switchRow}>
          <Switch
            value={disabledHeaders[header]}
            onValueChange={(val) =>
              setDisabledHeaders((prev) => ({ ...prev, [header]: val }))
            }
          />
          <Text style={styles.switchLabel}>{header}</Text>
        </View>
      ))}

      <View style={styles.buttonWrapper}>
        <Button title="Process Curl" onPress={processCurl} color="#4CAF50" />
      </View>

      {output ? (
        <View style={styles.outputBox}>
          <View style={styles.headerRow}>
            <Text style={styles.outputTitle}>Modified Curl</Text>
            <TouchableOpacity onPress={copyToClipboard} style={styles.copyBtn}>
              <Text style={styles.copyBtnText}>Copy</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.outputText}>{output}</Text>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  textArea: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    minHeight: 120,
    backgroundColor: "#fff",
    textAlignVertical: "top",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    backgroundColor: "#fff",
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  switchLabel: {
    marginLeft: 8,
    fontSize: 14,
    color: "#444",
  },
  buttonWrapper: {
    marginTop: 16,
    borderRadius: 8,
    overflow: "hidden",
  },

  outputBox: {
    marginTop: 24,
    backgroundColor: "#1e1e1e",
    padding: 12,
    borderRadius: 8,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  outputTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 8,
  },
  outputText: {
    color: "#f1f1f1",
    fontFamily: "monospace",
  },

  copyBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: "#007AFF",
    borderRadius: 6,
  },
  copyBtnText: {
    color: "#fff",
    fontWeight: "600",
  },
});
