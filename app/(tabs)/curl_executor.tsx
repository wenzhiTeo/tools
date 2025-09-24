import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";

export default function CurlExecutor() {
  const [curlCommand, setCurlCommand] = useState<string>("");
  const [response, setResponse] = useState<string>("");

  const runCurl = async () => {
    if (!curlCommand.trim()) {
      setResponse("⚠️ Please enter a curl command first.");
      return;
    }
    try {
      const { url, options } = parseCurl(curlCommand);
      const res = await fetch(url, options);
      const text = await res.text();

      // try pretty-print JSON
      try {
        const json = JSON.parse(text);
        setResponse(JSON.stringify(json, null, 2));
      } catch {
        setResponse(text);
      }
    } catch (err: any) {
      console.log(err);
      setResponse(`❌ Error: ${err.message}`);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Curl Executor</Text>

      <TextInput
        style={styles.input}
        placeholder="Paste your curl command here"
        multiline
        value={curlCommand}
        onChangeText={setCurlCommand}
      />

      <TouchableOpacity style={styles.button} onPress={runCurl}>
        <Text style={styles.buttonText}>Run Curl</Text>
      </TouchableOpacity>

      <ScrollView style={styles.responseBox}>
        <Text selectable style={styles.responseText}>
          {response || "Response will appear here"}
        </Text>
      </ScrollView>
    </View>
  );
}

// --- minimal curl parser (handles -X, -H, -d, URL) ---
function parseCurl(curl: string) {
  const parts = curl.trim().split(/\s+/);
  let url = "";
  const options: RequestInit = { method: "GET", headers: {} };

  for (let i = 0; i < parts.length; i++) {
    if (parts[i] === "curl") continue;
    if (parts[i].startsWith("http")) {
      url = parts[i].replace(/['"]/g, "");
    } else if (parts[i] === "-X" || parts[i] === "--request") {
      options.method = parts[i + 1].toUpperCase();
      i++;
    } else if (parts[i] === "-H" || parts[i] === "--header") {
      const header = parts[i + 1].replace(/['"]/g, "");
      const [key, ...val] = header.split(":");
      (options.headers as Record<string, string>)[key.trim()] = val
        .join(":")
        .trim();
      i++;
    } else if (parts[i] === "-d" || parts[i] === "--data") {
      options.body = parts[i + 1].replace(/['"]/g, "");
      if (options.method === "GET") options.method = "POST";
      i++;
    }
  }

  return { url, options };
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  title: { fontSize: 18, fontWeight: "bold", marginBottom: 12 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    minHeight: 100,
    marginBottom: 12,
    textAlignVertical: "top",
  },
  button: {
    backgroundColor: "#007AFF",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 16,
  },
  buttonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  responseBox: {
    flex: 1,
    backgroundColor: "#f4f4f4",
    borderRadius: 8,
    padding: 10,
  },
  responseText: { fontSize: 12, color: "#333", fontFamily: "monospace" },
});
