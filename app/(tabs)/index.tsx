import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  ScrollView,
  Switch,
  StyleSheet,
} from "react-native";

export default function HomeScreen() {
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

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.sectionTitle}>Input Curl Command</Text>
      <TextInput
        value={curlInput}
        onChangeText={setCurlInput}
        multiline
        style={styles.textArea}
      />

      <Text style={styles.sectionTitle}>URL Replacement</Text>
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

      <Text style={styles.sectionTitle}>Disable Headers</Text>
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
          <Text style={styles.outputTitle}>Modified Curl</Text>
          <Text style={styles.outputText}>{output}</Text>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: "#f9f9f9",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    marginTop: 16,
    color: "#333",
  },
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
});
