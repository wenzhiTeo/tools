import {
  Platform,
  TextInput,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import {
  Suspense,
  useEffect,
  useState,
  useRef,
  useCallback,
  lazy,
} from "react";

import { GlobalStyles, GlobalWebStyles } from "@styles/global";
import { OrderControl } from "@/components/json_helper/orderControl";
import { ViewerSettings, ViewerSettingsValues } from "@/components/json_helper/viewerSettings";
import { SumControl } from "@/components/json_helper/sumControl";

const LazyReactJsonView = lazy(() => import("react-json-view-custom"));

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
  viewerSettings?: Partial<ViewerSettingsValues>;
};

export const JsonViewer = ({ data, viewerSettings, ...otherProps }: Props) => {
  if (Platform.OS === "web") {
    return (
      <Suspense fallback={<div>Loading JSON...</div>}>
        <div style={webStyles.viewerWrapper}>
          <LazyReactJsonView
            src={data}
            collapsed={2}
            {...(viewerSettings || {})}
            {...otherProps}
          />
        </div>
      </Suspense>
    );
  }
  return null;
};

export default function JsonHelper() {
  const { width } = useWindowDimensions();
  const isSmallScreen = width < 768;

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
  const [viewerSettings, setViewerSettings] = useState<Partial<ViewerSettingsValues>>({});
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

  // 手机端使用更小的 padding
  const containerStyle = isSmallScreen 
    ? [commonStyleSheet.container, { padding: 12 }] 
    : commonStyleSheet.container;

  return (
    <ScrollView style={containerStyle}>
      <Text style={[commonStyleSheet.sectionTitle, isSmallScreen && styles.sectionTitleSmall]}>Json Helper</Text>
      <TextInput
        style={[styles.input, isSmallScreen && styles.inputSmall]}
        placeholder="Paste JSON here"
        value={raw}
        onChangeText={handleChange}
        multiline
      />

      <Text style={[commonStyleSheet.sectionTitle, isSmallScreen && styles.sectionTitleSmall]}>Formatted Result</Text>
      <ViewerSettings onChange={setViewerSettings} />
      <div style={isSmallScreen ? styles.resultContainerSmall : styles.resultContainer}>
        {error ? (
          <div style={styles.errorText}>{error}</div>
        ) : (
          <div style={isSmallScreen ? styles.leftPaneSmall : styles.leftPane}>
            <JsonViewer
              data={jsonData}
              viewerSettings={viewerSettings}
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

        <div style={isSmallScreen ? styles.rightPaneSmall : styles.rightPane}>
          <View style={{ ...styles.subPane, marginBottom: isSmallScreen ? 12 : 16 }}>
            <Text style={{ fontSize: isSmallScreen ? 13 : 14, fontWeight: "600", color: "#334155", marginBottom: isSmallScreen ? 8 : 12 }}>
              Choose Keys
            </Text>

            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: isSmallScreen ? 6 : 8 }}>
              {availableKeys.map((key) => {
                const isSelected = selectedKeys.includes(key);
                return (
                  <TouchableOpacity
                    key={key}
                    onPress={() => toggleKey(key)}
                    style={{
                      paddingVertical: isSmallScreen ? 5 : 6,
                      paddingHorizontal: isSmallScreen ? 10 : 14,
                      borderRadius: 20,
                      backgroundColor: isSelected ? "#3b82f6" : "#f1f5f9",
                      borderWidth: 1,
                      borderColor: isSelected ? "#2563eb" : "#e2e8f0",
                    }}
                  >
                    <Text style={{ color: isSelected ? "#fff" : "#64748b", fontSize: isSmallScreen ? 12 : 13, fontWeight: "500" }}>
                      {key}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {selectedKeys.length > 0 && (
              <Text style={{ fontSize: isSmallScreen ? 11 : 12, color: "#94a3b8", marginTop: isSmallScreen ? 8 : 10 }}>
                Selected: {selectedKeys.join(", ")}
              </Text>
            )}
          </View>

          <OrderControl
            availableKeys={availableKeys}
            data={
              secondExtractContent ? secondExtractContent : firstExtractContent
            }
            onOrdered={(newData) => setSecondExtractContent(newData)}
          />

          <SumControl
            availableKeys={availableKeys}
            data={
              secondExtractContent ? secondExtractContent : firstExtractContent
            }
          />

          <JsonViewer
            data={
              secondExtractContent ? secondExtractContent : firstExtractContent
            }
            viewerSettings={viewerSettings}
          />
        </div>
      </div>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  resultContainer: {
    display: "flex",
    flexDirection: "row",
    width: "100%",
    marginTop: 12,
    gap: 16,
  },
  resultContainerSmall: {
    display: "flex",
    flexDirection: "column",
    width: "100%",
    marginTop: 8,
    gap: 12,
    boxSizing: "border-box" as const,
  },
  leftPane: {
    ...((Platform.OS === "web" ? { resize: "horizontal" } : {}) as any),
    minWidth: "30%",
    maxWidth: "70%",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 16,
    borderRadius: 12,
    minHeight: 500,
    fontSize: 14,
    backgroundColor: "#fff",
    textAlignVertical: "top",
    overflow: "scroll",
    boxSizing: "border-box" as const,
  },
  leftPaneSmall: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 12,
    borderRadius: 12,
    minHeight: 250,
    maxHeight: 400,
    fontSize: 12,
    backgroundColor: "#fff",
    overflow: "scroll",
    boxSizing: "border-box" as const,
  },
  rightPane: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    minHeight: 500,
    fontSize: 14,
    backgroundColor: "#f8fafc",
    padding: 16,
    textAlignVertical: "top",
    overflow: "scroll",
  },
  rightPaneSmall: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    minHeight: 300,
    fontSize: 12,
    backgroundColor: "#f8fafc",
    padding: 12,
    overflow: "scroll",
    boxSizing: "border-box" as const,
  },
  subPane: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
  },
  sectionTitleSmall: {
    fontSize: 16,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 14,
    borderRadius: 12,
    minHeight: 120,
    fontSize: 14,
    marginBottom: 12,
    backgroundColor: "#fff",
    color: "#334155",
    textAlignVertical: "top",
    overflow: "scroll",
    boxSizing: "border-box" as const,
    ...((Platform.OS === "web" ? { resize: "vertical" } : {}) as any),
  },
  inputSmall: {
    padding: 10,
    borderRadius: 10,
    minHeight: 80,
    fontSize: 13,
    marginBottom: 10,
    boxSizing: "border-box" as const,
  },
  output: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    margin: 24,
  },
  errorText: {
    color: "#ef4444",
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
