import {
  Platform,
  SafeAreaView,
  TextInput,
  Text,
  ScrollView,
  StyleSheet,
} from "react-native";
import React, { Suspense, useState } from "react";

const LazyReactJsonView = React.lazy(() => import("react-json-view"));

type Props = {
  data: any;
};

export const JsonViewer = ({ data }: Props) => {
  if (Platform.OS === "web") {
    return (
      <Suspense fallback={<div>Loading JSON...</div>}>
        <LazyReactJsonView src={data} collapsed={2} />
      </Suspense>
    );
  }
};

export default function TabTwoScreen() {
  const [raw, setRaw] = useState("");
  const [jsonData, setJsonData] = useState("");

  const handleChange = (text: string) => {
    setRaw(text);

    try {
      const obj = JSON.parse(text);
      setJsonData(JSON.stringify(obj, null, 2)); // pretty print
    } catch (e) {
      setJsonData("❌ Invalid JSON");
    }
  };

  return (
    <>
      <SafeAreaView style={styles.container}>
        <TextInput
          style={styles.input}
          placeholder="Paste JSON here"
          value={raw}
          onChangeText={handleChange}
          multiline
        />

        <ScrollView style={styles.output}>
          <JsonViewer data={jsonData}></JsonViewer>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#fff",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    borderRadius: 8,
    minHeight: 120,
    fontSize: 14,
    marginBottom: 16,
  },
  output: {
    flex: 1,
    backgroundColor: "#f6f8fa",
    borderRadius: 8,
    padding: 10,
  },
  jsonText: {
    fontFamily: Platform.select({ ios: "Courier", android: "monospace" }),
    fontSize: 14,
  },
});
