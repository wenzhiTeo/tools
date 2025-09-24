import {
  Platform,
  TextInput,
  Text,
  ScrollView,
  StyleSheet,
} from "react-native";
import React, { Suspense, useState } from "react";

import { GlobalStyles } from "@styles/global";

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

export default function JsonHelper() {
  const exampleRawJson =
    '{"firstName":"John","lastName":"Doe","age":30,"isStudent":false,"courses":[{"title":"History 101","credits":3},{"title":"Math 202","credits":4}],"address":{"street":"123 Main St","city":"Anytown","zipCode":"12345"}}';

  const [raw, setRaw] = useState(
    JSON.stringify(JSON.parse(exampleRawJson), null, 4)
  );
  const [jsonData, setJsonData] = useState<any>(JSON.parse(exampleRawJson));
  const [error, setError] = useState("");
  const [clickedContent, setClickedContent] = useState<any>({});

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

  const handleClickContent = (src: any) => {
    // ⚠️ Important:
    // We intentionally delay the parent's setState with setTimeout(…, 0).
    //
    // Why?
    // - JsonViewer itself uses setState internally to toggle expand/collapse.
    // - If we update the parent's state (clickedContent) immediately inside
    //   onToggleCollapsed, React may re-render the parent before JsonViewer
    //   finishes its own state update.
    // - This race condition can "interrupt" or overwrite JsonViewer's default
    //   expand/collapse behavior.
    //
    // Solution:
    // - Use setTimeout(…, 0) to schedule our state update for the next event loop.
    // - This ensures JsonViewer completes its internal setState first, then the
    //   parent re-render happens safely afterwards.
    //
    // This pattern is common when both parent and child components call setState
    // in the same interaction.

    setTimeout(() => {
      try {
        // Safely clone the clicked node to avoid accidental mutations
        const cloned =
          typeof structuredClone === "function"
            ? structuredClone(src)
            : JSON.parse(JSON.stringify(src));
        setClickedContent(cloned);
      } catch (e) {
        console.error("clone clicked node failed", e);
        setClickedContent(null);
      }
    }, 0);
  };

  return (
    <ScrollView style={GlobalStyles.container}>
      <Text style={GlobalStyles.sectionTitle}>Json Helper</Text>
      <TextInput
        style={styles.input}
        placeholder="Paste JSON here"
        value={raw}
        onChangeText={handleChange}
        multiline
      />

      <div style={styles.resultContainer}>
        {error ? (
          <div style={styles.errorText}>{error}</div>
        ) : (
          <div style={styles.leftPane}>
            <JsonViewer
              data={jsonData}
              onToggleCollapsed={(props) => {
                try {
                  handleClickContent(props.src);
                } catch (e) {
                  console.error("handleClickContent error", e);
                }
                return true; // 一定要返回 true
              }}
            />
          </div>
        )}

        <div style={styles.rightPane}>
          <JsonViewer data={clickedContent} />
        </div>
      </div>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  resultContainer: {
    display: "flex",
    flexDirection: "row", // 左右排版
    width: "100%",
    height: "100%",
  },
  leftPane: {
    ...((Platform.OS === "web" ? { resize: "horizontal" } : {}) as any),
    minWidth: "30%",
    maxWidth: "70%",

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
  },
  rightPane: {
    flex: 1, // 自适应剩余空间

    borderWidth: 1,
    borderColor: "#ddd",
    padding: 12,
    borderRadius: 10,
    minHeight: 120,
    fontSize: 14,
    marginBottom: 12,
    backgroundColor: "#fff",
    margin: 24,
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
