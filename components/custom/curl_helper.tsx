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
  const [curlInput, setCurlInput] = useState(
    `curl "https://example.com/api/data" -H "Authorization: Bearer token123" -H "User-Agent: CustomAgent" -d "param=value"`
  );
  const [urlReplaceFrom, setUrlReplaceFrom] = useState("");
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

  // 当输入变化时自动提取 URL
  const handleCurlInputChange = (text: string) => {
    setCurlInput(text);
    // 只在 urlReplaceFrom 为空时自动填充
    if (!urlReplaceFrom) {
      const extracted = extractUrl(text);
      if (extracted) {
        setUrlReplaceFrom(extracted);
      }
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
        style={styles.textArea}
        placeholder="Paste your curl command here..."
      />

      <Text style={commonStyleSheet.sectionTitle}>URL Replacement</Text>
      <TextInput
        placeholder={getUrlPlaceholder()}
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

      <Text style={commonStyleSheet.sectionTitle}>Token Replacement</Text>
      <Text style={styles.hintText}>
        Enter a new token to replace the existing one. Leave empty to keep the original token.
      </Text>
      <TextInput
        placeholder="New token..."
        value={newToken}
        onChangeText={setNewToken}
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

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.actionBtn, styles.processBtn]}
          onPress={() => processCurl(false)}
        >
          <Text style={styles.actionBtnText}>Process Curl</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, styles.minimizeBtn]}
          onPress={() => processCurl(true)}
        >
          <Text style={styles.actionBtnText}>Minimize</Text>
        </TouchableOpacity>
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
  hintText: {
    fontSize: 13,
    color: "#666",
    marginBottom: 8,
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
  buttonRow: {
    flexDirection: "row",
    marginTop: 16,
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  processBtn: {
    backgroundColor: "#4CAF50",
  },
  minimizeBtn: {
    backgroundColor: "#FF9800",
  },
  actionBtnText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 15,
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
