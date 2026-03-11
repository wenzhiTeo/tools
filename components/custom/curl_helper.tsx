import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Switch,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  useWindowDimensions,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import { GlobalStyles, GlobalWebStyles } from "@styles/global";

// 非必要 headers，本地测试时可安全移除
const UNNECESSARY_HEADERS = [
  "Authorization",
  "User-Agent",
  "Accept",
  "Accept-Language",
  "Accept-Encoding",
  "Cache-Control",
  "Pragma",
  "Origin",
  "Referer",
  "Sec-Fetch-Dest",
  "Sec-Fetch-Mode",
  "Sec-Fetch-Site",
  "Sec-Ch-Ua",
  "Sec-Ch-Ua-Mobile",
  "Sec-Ch-Ua-Platform",
  "X-Requested-With",
  "DNT",
  "Connection",
  "Upgrade-Insecure-Requests",
  "Priority",
];

export default function CURLHelper() {
  const { width } = useWindowDimensions();
  const isSmallScreen = width < 600;

  const [curlInput, setCurlInput] = useState(
    `curl "https://example.com/api/data" -H "Authorization: Bearer token123" -H "User-Agent: CustomAgent" -d "param=value"`
  );
  const [urlReplaceFrom, setUrlReplaceFrom] = useState("https://example.com/api/data");
  const [urlReplaceTo, setUrlReplaceTo] = useState("http://127.0.0.1:6000");
  const [newToken, setNewToken] = useState("");
  const [disabledHeaders, setDisabledHeaders] = useState<
    Record<string, boolean>
  >({
    Authorization: false,
    "User-Agent": false,
  });
  const [output, setOutput] = useState("");

  // 从 curl 命令中提取 URL
  const extractUrl = (curl: string): string => {
    const cleaned = curl.replace(/\\\s*\n\s*/g, " ").trim();
    const match = cleaned.match(/^curl\s+["']?([^"'\s]+)["']?/);
    return match ? match[1] : "";
  };

  // 当输入变化时更新 curlInput
  const handleCurlInputChange = (text: string) => {
    setCurlInput(text);
  };

  // 手动提取 URL 按钮
  const handleExtractUrl = () => {
    const extracted = extractUrl(curlInput);
    if (extracted) {
      setUrlReplaceFrom(extracted);
    }
  };

  // 获取 placeholder 显示的 URL
  const getUrlPlaceholder = (): string => {
    const extracted = extractUrl(curlInput);
    return extracted || "Replace from...";
  };

  // 解析 curl 命令为 tokens
  const parseCurlTokens = (curl: string): string[] => {
    // 先清理换行续行符
    let formatted = curl.replace(/\\\s*\n\s*/g, " ").replace(/\s+/g, " ").trim();

    const tokens: string[] = [];
    let current = "";
    let inQuote: string | null = null;
    let escaped = false;

    for (let i = 0; i < formatted.length; i++) {
      const char = formatted[i];

      if (escaped) {
        current += char;
        escaped = false;
        continue;
      }

      if (char === "\\") {
        current += char;
        escaped = true;
        continue;
      }

      if (inQuote) {
        current += char;
        if (char === inQuote) {
          inQuote = null;
        }
        continue;
      }

      if (char === '"' || char === "'") {
        current += char;
        inQuote = char;
        continue;
      }

      if (char === " ") {
        if (current) {
          tokens.push(current);
          current = "";
        }
        continue;
      }

      current += char;
    }
    if (current) {
      tokens.push(current);
    }

    return tokens;
  };

  // 从 tokens 重建参数对（参数 + 值）
  const buildParamPairs = (tokens: string[]): { param: string; value?: string }[] => {
    const pairs: { param: string; value?: string }[] = [];
    let i = 0;

    while (i < tokens.length) {
      const token = tokens[i];
      if (token.startsWith("-")) {
        const nextToken = tokens[i + 1];
        // 检查下一个是否是值（不以 - 开头，或是引号开头的值）
        if (nextToken && (!nextToken.startsWith("-") || nextToken.startsWith("'") || nextToken.startsWith('"'))) {
          pairs.push({ param: token, value: nextToken });
          i += 2;
        } else {
          pairs.push({ param: token });
          i += 1;
        }
      } else {
        // URL 或独立值
        pairs.push({ param: token });
        i += 1;
      }
    }

    return pairs;
  };

  const processCurl = (minimize = false) => {
    const tokens = parseCurlTokens(curlInput);
    if (tokens.length < 2) {
      setOutput(curlInput);
      return;
    }

    const curlCmd = tokens[0]; // "curl"
    let url = tokens[1]; // URL

    // Replace URL（如果 urlReplaceFrom 为空，使用提取的 URL）
    const fromUrl = urlReplaceFrom || extractUrl(curlInput);
    if (fromUrl && urlReplaceTo) {
      url = url.replace(fromUrl, urlReplaceTo);
    }

    // 解析剩余参数
    const paramPairs = buildParamPairs(tokens.slice(2));

    // 过滤参数
    let filteredPairs = paramPairs;

    if (minimize) {
      // 极简模式：移除非必要 headers，不添加 token
      filteredPairs = paramPairs.filter(({ param, value }) => {
        if (param === "-H" && value) {
          const headerName = value.replace(/^["']/, "").split(":")[0].trim();
          return !UNNECESSARY_HEADERS.some(
            (h) => h.toLowerCase() === headerName.toLowerCase()
          );
        }
        // 移除 cookie（-b 或 --cookie），本地测试通常不需要
        if (param === "-b" || param === "--cookie") {
          return false;
        }
        if (param === "--compressed" || param === "-A") {
          return false;
        }
        return true;
      });
    } else {
      // 普通模式：只移除手动禁用的 headers
      filteredPairs = paramPairs.filter(({ param, value }) => {
        if (param === "-H" && value) {
          const headerName = value.replace(/^["']/, "").split(":")[0].trim();
          return !Object.entries(disabledHeaders).some(
            ([h, disabled]) => disabled && h.toLowerCase() === headerName.toLowerCase()
          );
        }
        return true;
      });

      // 替换/添加 Token（仅普通模式）
      if (newToken.trim()) {
        const newAuthHeader = `"Authorization: Bearer ${newToken.trim()}"`;
        let found = false;

        filteredPairs = filteredPairs.map(({ param, value }) => {
          if (param === "-H" && value) {
            const headerName = value.replace(/^["']/, "").split(":")[0].trim();
            if (headerName.toLowerCase() === "authorization") {
              found = true;
              return { param: "-H", value: newAuthHeader };
            }
          }
          return { param, value };
        });

        if (!found) {
          filteredPairs.unshift({ param: "-H", value: newAuthHeader });
        }
      }
    }

    // 格式化输出
    const indent = "  ";
    const paramStrings = filteredPairs.map(({ param, value }) =>
      value ? `${param} ${value}` : param
    );

    let output: string;
    if (paramStrings.length === 0) {
      output = `${curlCmd} ${url}`;
    } else {
      output = `${curlCmd} ${url} \\\n${indent}${paramStrings.join(` \\\n${indent}`)}`;
    }

    setOutput(output);
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
        onChangeText={handleCurlInputChange}
        multiline
        style={[styles.textArea, isSmallScreen && styles.textAreaSmall]}
        placeholder="Paste your curl command here..."
      />

      <Text style={commonStyleSheet.sectionTitle}>URL Replacement</Text>
      <View style={styles.urlRow}>
        <TextInput
          placeholder={getUrlPlaceholder()}
          value={urlReplaceFrom}
          onChangeText={setUrlReplaceFrom}
          style={[styles.input, styles.urlInput, isSmallScreen && styles.inputSmall]}
        />
        <TouchableOpacity onPress={handleExtractUrl} style={styles.extractBtn}>
          <Text style={styles.extractBtnText}>Extract</Text>
        </TouchableOpacity>
      </View>
      <TextInput
        placeholder="Replace to..."
        value={urlReplaceTo}
        onChangeText={setUrlReplaceTo}
        style={[styles.input, isSmallScreen && styles.inputSmall]}
      />

      <Text style={commonStyleSheet.sectionTitle}>Token Replacement</Text>
      <Text style={[styles.hintText, isSmallScreen && styles.hintTextSmall]}>
        Enter a new token to replace the existing one. Leave empty to keep the original token.
      </Text>
      <TextInput
        placeholder="New token..."
        value={newToken}
        onChangeText={setNewToken}
        style={[styles.input, isSmallScreen && styles.inputSmall]}
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
          <Text style={[styles.switchLabel, isSmallScreen && styles.switchLabelSmall]}>{header}</Text>
        </View>
      ))}

      <View style={[styles.buttonRow, isSmallScreen && styles.buttonRowSmall]}>
        <TouchableOpacity
          style={[styles.actionBtn, styles.processBtn, isSmallScreen && styles.actionBtnSmall]}
          onPress={() => processCurl(false)}
        >
          <Text style={[styles.actionBtnText, isSmallScreen && styles.actionBtnTextSmall]}>Process Curl</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, styles.minimizeBtn, isSmallScreen && styles.actionBtnSmall]}
          onPress={() => processCurl(true)}
        >
          <Text style={[styles.actionBtnText, isSmallScreen && styles.actionBtnTextSmall]}>Minimize</Text>
        </TouchableOpacity>
      </View>

      {output ? (
        <View style={[styles.outputBox, isSmallScreen && styles.outputBoxSmall]}>
          <View style={styles.headerRow}>
            <Text style={[styles.outputTitle, isSmallScreen && styles.outputTitleSmall]}>Modified Curl</Text>
            <TouchableOpacity onPress={copyToClipboard} style={styles.copyBtn}>
              <Text style={styles.copyBtnText}>Copy</Text>
            </TouchableOpacity>
          </View>
          <Text style={[styles.outputText, isSmallScreen && styles.outputTextSmall]}>{output}</Text>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  textArea: {
    borderWidth: 0,
    borderRadius: 16,
    padding: 16,
    minHeight: 140,
    backgroundColor: "#ffffff",
    textAlignVertical: "top",
    fontSize: 14,
    color: "#334155",
    shadowColor: "#64748b",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  textAreaSmall: {
    minHeight: 110,
    fontSize: 13,
    padding: 14,
    borderRadius: 14,
  },
  input: {
    borderWidth: 0,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    backgroundColor: "#ffffff",
    fontSize: 14,
    color: "#334155",
    shadowColor: "#64748b",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  inputSmall: {
    padding: 12,
    fontSize: 13,
    marginBottom: 10,
    borderRadius: 12,
  },
  hintText: {
    fontSize: 13,
    color: "#64748b",
    marginBottom: 10,
    fontWeight: "500",
  },
  hintTextSmall: {
    fontSize: 12,
    marginBottom: 8,
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    backgroundColor: "#ffffff",
    padding: 14,
    borderRadius: 14,
    shadowColor: "#64748b",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  switchLabel: {
    marginLeft: 12,
    fontSize: 14,
    color: "#334155",
    fontWeight: "500",
  },
  switchLabelSmall: {
    fontSize: 13,
  },
  urlRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 10,
  },
  urlInput: {
    flex: 1,
    marginBottom: 0,
  },
  extractBtn: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    backgroundColor: "#2563eb",
    borderRadius: 14,
    shadowColor: "#2563eb",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  extractBtnText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 14,
  },
  buttonRow: {
    flexDirection: "row",
    marginTop: 20,
    gap: 14,
  },
  buttonRowSmall: {
    marginTop: 14,
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    shadowColor: "#64748b",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  actionBtnSmall: {
    paddingVertical: 12,
    borderRadius: 12,
  },
  processBtn: {
    backgroundColor: "#059669",
  },
  minimizeBtn: {
    backgroundColor: "#ea580c",
  },
  actionBtnText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 15,
  },
  actionBtnTextSmall: {
    fontSize: 13,
  },

  outputBox: {
    marginTop: 28,
    backgroundColor: "#0f172a",
    padding: 18,
    borderRadius: 18,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 14,
    elevation: 6,
  },
  outputBoxSmall: {
    marginTop: 18,
    padding: 14,
    borderRadius: 14,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  outputTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#e2e8f0",
    marginBottom: 8,
  },
  outputTitleSmall: {
    fontSize: 14,
    marginBottom: 6,
  },
  outputText: {
    color: "#94a3b8",
    fontFamily: "monospace",
    lineHeight: 20,
  },
  outputTextSmall: {
    fontSize: 12,
  },

  copyBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: "#2563eb",
    borderRadius: 10,
  },
  copyBtnText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 13,
  },
});
