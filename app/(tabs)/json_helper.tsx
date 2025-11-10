import {
  Platform,
  TextInput,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import React, {
  Suspense,
  useEffect,
  useState,
  useRef,
  useCallback,
} from "react";

import { GlobalStyles, GlobalWebStyles } from "@styles/global";
import { OrderControl } from "@/components/json_helper/orderControl";

const LazyReactJsonView = React.lazy(() => import("react-json-view-custom"));

function useDebouncedCallback<T extends (...args: any[]) => void>(
  cb: T,
  wait = 300
) {
  const timer = useRef<number | null>(null);
  return (...args: Parameters<T>) => {
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => cb(...args), wait);
  };
}

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
  const [firstExtractContent, setFirstExtractContent] = useState<any>({});
  const [secondExtractContent, setSecondExtractContent] = useState<any>({});

  const [availableKeys, setAvailableKeys] = useState<string[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const toggleKey = (key: string) => {
    setSelectedKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const getCustomJsonArray = useCallback(
    (arrOfObjects: Record<string, any>[], selectedKeys: string[]) => {
      if (!Array.isArray(arrOfObjects)) return null;
      if (!selectedKeys || selectedKeys.length === 0) {
        // return original shallow-cloned array to avoid mutation
        return arrOfObjects.map((o) => ({ ...o }));
      }
      return arrOfObjects.map((obj) => {
        const out: Record<string, any> = {};
        for (const key of selectedKeys) {
          if (key in obj) out[key] = obj[key];
        }
        return out;
      });
    },
    []
  );

  const checkIsArrayOfObjects = (obj: any) => {
    return (
      Array.isArray(obj) &&
      obj.length > 0 &&
      typeof obj[0] === "object" &&
      obj[0] !== null
    );
  };

  const debouncedHandleChange = useDebouncedCallback((text: string) => {
    try {
      const obj = JSON.parse(text);
      setJsonData(obj);
      setError("");
    } catch (e: any) {
      setJsonData(null);
      setError("❌ Invalid JSON: " + (e.message || "parse error"));
    }
  }, 350);

  const handleChange = (text: string) => {
    setRaw(text);
    debouncedHandleChange(text);
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

        const checkIsObjects =
          !Array.isArray(cloned) && typeof cloned === "object";

        if (checkIsArrayOfObjects(cloned) || checkIsObjects) {
          // array of objects logic
          const sampleObj = checkIsObjects ? cloned : cloned[0];

          const keys = Object.keys(sampleObj || {});
          // only keep up to 3 and filter falsy
          const defaultSelection = keys.slice(0, 3);
          setAvailableKeys(keys);
          setSelectedKeys(defaultSelection);

          const arrOfObjs = getCustomJsonArray(
            checkIsObjects ? [cloned] : cloned,
            keys
          );

          setFirstExtractContent(JSON.parse(JSON.stringify(arrOfObjs)));
        } else {
          // common logic
          setFirstExtractContent(cloned);
          setAvailableKeys([]);
          setSelectedKeys([]);
        }
      } catch (e) {
        console.error("clone clicked node failed", e);
        setFirstExtractContent(null);
      }
    }, 0);
  };

  useEffect(() => {
    try {
      const arr = getCustomJsonArray(firstExtractContent, selectedKeys);
      setSecondExtractContent(arr);
    } catch (e) {
      console.error("build second extract failed", e);
      setSecondExtractContent(null);
    }
  }, [firstExtractContent, selectedKeys, getCustomJsonArray]);

  const commonStyleSheet =
    Platform.OS === "web" ? GlobalWebStyles : GlobalStyles;

  return (
    <ScrollView style={commonStyleSheet.container}>
      <Text style={commonStyleSheet.sectionTitle}>Json Helper</Text>
      <TextInput
        style={styles.input}
        placeholder="Paste JSON here"
        value={raw}
        onChangeText={handleChange}
        multiline
      />

      <Text style={commonStyleSheet.sectionTitle}>Formatted Result</Text>
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
          <View style={{ ...styles.subPane, marginBottom: 20 }}>
            <Text style={{ fontSize: 16, marginBottom: 10 }}>Choose Keys:</Text>

            <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
              {availableKeys.map((key) => {
                const isSelected = selectedKeys.includes(key);
                return (
                  <TouchableOpacity
                    key={key}
                    onPress={() => toggleKey(key)}
                    style={{
                      paddingVertical: 8,
                      paddingHorizontal: 12,
                      margin: 5,
                      borderRadius: 20,
                      backgroundColor: isSelected ? "#4CAF50" : "#ddd",
                    }}
                  >
                    <Text style={{ color: isSelected ? "white" : "black" }}>
                      {key}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={{ fontSize: 16, marginBottom: 20, marginTop: 10 }}>
              Selected: {selectedKeys.join(", ") || "None"}
            </Text>
          </View>

          <OrderControl
            availableKeys={availableKeys}
            data={
              secondExtractContent ? secondExtractContent : firstExtractContent
            }
            onOrdered={(newData) => setSecondExtractContent(newData)}
          />

          <JsonViewer
            data={
              secondExtractContent ? secondExtractContent : firstExtractContent
            }
          />
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
    marginTop: 12,
  },
  leftPane: {
    ...((Platform.OS === "web" ? { resize: "horizontal" } : {}) as any),
    minWidth: "30%",
    maxWidth: "70%",

    borderWidth: 1,
    borderColor: "#ddd",
    padding: 12,
    borderRadius: 10,
    minHeight: 500,
    fontSize: 14,
    backgroundColor: "#fff",

    textAlignVertical: "top", // keeps text at top in Android
    overflow: "scroll",
  },
  rightPane: {
    flex: 1, // 自适应剩余空间

    borderWidth: 1,
    borderRadius: 10,
    minHeight: 500,
    fontSize: 14,
    marginLeft: 12,
    backgroundColor: "#fff",
    padding: 12,

    textAlignVertical: "top", // keeps text at top in Android
    overflow: "scroll",
  },

  subPane: {
    borderWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 10,
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
