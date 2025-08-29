import {
  Platform,
  SafeAreaView,
  TextInput,
  Text,
  ScrollView,
  StyleSheet,
} from "react-native";
import React, { Suspense, useState } from "react";

const LazyReactJsonView = React.lazy(() => import("react-json-view-custom"));

type Props = {
  data: any;
  onToggleCollapsed?: (field: any) => boolean;
};

export const JsonViewer = ({ data, ...otherProps }: Props) => {
  if (Platform.OS === "web") {
    return (
      <Suspense fallback={<div>Loading JSON...</div>}>
        <div style={webStyles.viewerWrapper}>
          <LazyReactJsonView src={data} collapsed={2} {...otherProps} />
        </div>
      </Suspense>
    );
  }
  return null;
};

export default function TabTwoScreen() {
  const [raw, setRaw] = useState("");
  const [jsonData, setJsonData] = useState<any>(null);
  const [error, setError] = useState("");

  const handleChange = (text: string) => {
    setRaw(text);

    try {
      const obj = JSON.parse(text);
      setJsonData(obj);
      setError("");
    } catch (e) {
      setJsonData(null);
      setError("❌ Invalid JSON");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Paste JSON here"
        value={raw}
        onChangeText={handleChange}
        multiline
      />

      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : (
        <ScrollView style={styles.output}>
          <JsonViewer
            data={jsonData}
            onToggleCollapsed={(props) => {
              console.log(props);
              return true;
            }}
          />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f0f2f5",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 12,
    borderRadius: 10,
    minHeight: 120,
    fontSize: 14,
    marginBottom: 12,
    backgroundColor: "#fff",
    margin: 24,

    textAlignVertical: "top", // keeps text at top in Android
    overflow: "scroll",
    // 👇 this works on web only
    ...((Platform.OS === "web" ? { resize: "vertical" } : {}) as any), // 👈 fix TS
  },
  output: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    margin: 24,
  },
  errorText: {
    color: "red",
    fontSize: 14,
    marginTop: 8,
  },
});

const webStyles = {
  viewerWrapper: {
    fontFamily: "Menlo, Monaco, Consolas, monospace",
    fontSize: 14,
    lineHeight: 1.4,
    maxHeight: "70vh",
    overflow: "auto",
  } as React.CSSProperties,
};
