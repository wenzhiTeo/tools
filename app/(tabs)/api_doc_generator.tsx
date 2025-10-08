import * as Clipboard from "expo-clipboard";
import React, { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface FormData {
  routePath: string;
  requestStruct: string;
  responseStruct: string;
  requestCode: string;
  responseCode: string;
  commonFilters: string;
}

const ApiDocGenerator: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    routePath: "",
    requestStruct: "",
    responseStruct: "",
    requestCode: "",
    responseCode: "",
    commonFilters: "",
  });

  const [generatedPrompt, setGeneratedPrompt] = useState<string>("");

  const handleInputChange = (field: keyof FormData, value: string): void => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const generatePrompt = (): void => {
    const commonFiltersSection = formData.commonFilters
      ? formData.commonFilters
      : "[如果有公共过滤器，添加引用链接]";

    const responseSection = formData.responseCode
      ? `**2. Response结构体定义：**
\`\`\`go
${formData.responseCode}
\`\`\``
      : "";

    const prompt = `请为以下Go Gin接口编写API文档，直接输出markdown格式的结果：

**接口信息：**
- 路由：${formData.routePath}
- 请求结构体：${formData.requestStruct}
- 响应结构体：${formData.responseStruct}

**输出要求：直接输出markdown格式的API文档，包含以下结构：**

# [接口名称]

[toc]

## 简要描述
[功能模块] - [具体功能描述]

## 请求URL
- {{domain}}/api/v1/opinion_pc/[接口路径]

## 请求方式
- POST

## Header
| 参数名       | 是否必须 | 类型   | 说明                       |
| :----------- | :------- | :----- | -------------------------- |
| Content-Type | 是       | string | 请求类型：application/json |

## 请求参数
| 参数名                          | 是否必须 | 类型 | 说明 |
| :------------------------------ | :------- | :--- | ---- |
| [根据request结构体填写所有参数] |          |      |      |

### 公共过滤器引用
${commonFiltersSection}

## 返回参数备注
\`\`\`json
{
  // 重要字段说明和缓存信息
  "field_name": "字段含义和说明"
}
\`\`\`

## 调用示例
\`\`\`json
{
  // 留空，用户自己填写
}
\`\`\`

## 返回示例
\`\`\`json
{
  "code": 0,
  "msg": "ok", 
  "data": {
    // 留空，用户自己填写
  },
  "req": null,
  "ext": null
}
\`\`\`

**分析要求：**
1. 仔细阅读request结构体，列出所有参数及其验证规则
2. 根据validate标签判断参数是否必须
3. 根据字段类型和注释生成准确的参数说明
4. 如果包含公共结构体（如Game、CommonPageFilter等），添加相应的引用链接
5. 调用示例和返回示例保持为空的JSON结构，用户自己填写
6. 特别注意时间格式、枚举值、数组类型等特殊参数
7. 如果有缓存设置，在返回参数备注中说明缓存时间
8. 直接输出markdown格式，不要包含代码块标记

**需要分析的接口代码：**

**1. Request结构体定义：**
\`\`\`go
${formData.requestCode}
\`\`\`

${responseSection}`;

    setGeneratedPrompt(prompt);
  };

  const copyToClipboard = async (): Promise<void> => {
    if (generatedPrompt) {
      await Clipboard.setStringAsync(generatedPrompt);
      Alert.alert("成功", "Prompt已复制到剪贴板");
    } else {
      Alert.alert("提示", "请先生成Prompt");
    }
  };

  const clearForm = (): void => {
    setFormData({
      routePath: "",
      requestStruct: "",
      responseStruct: "",
      requestCode: "",
      responseCode: "",
      commonFilters: "",
    });
    setGeneratedPrompt("");
  };

  const loadExample = (): void => {
    setFormData({
      routePath: "/real_time_streaming/live_list",
      requestStruct: "request.LiveRequest",
      responseStruct: "response.RealTimeLiveListResponse",
      requestCode: `type LiveRequest struct {
    Date                      
    Game                      
    CommonPageFilter         
    CommonSortFilter    

    SearchText            string   \`json:"search_text"\`             // 搜索指定 live_title 或 live_anchors
    OnlyLiveStreaming     bool     \`json:"only_live_streaming"\`     // true 取近 30分钟内 的直播 作为"正在直播"状态
    ShouldIncludeTimeline bool     \`json:"should_include_timeline"\` // true 查询时间线数据
    KolTypes              []string \`json:"kol_types"\`               // 可选项: featured, others， 空为全部
}`,
      responseCode: `type RealTimeLiveListResponse struct {
    List  []map[string]interface{} \`json:"list"\`
    Total int64                    \`json:"total"\`
    DateTime

    // 请求时间
    RequestDateTime string \`json:"request_datetime"\`
    // 对比排名的取值时间范围
    PreviousRankingDateTime DateTime \`json:"previous_ranking_datetime"\`
    // 当前排名的取值时间范围
    CurrentRankingDateTime DateTime \`json:"current_ranking_datetime"\`
}`,
      commonFilters: `- [过滤器CommonSortFilter](https://partner.coding.intlgame.com/p/ogdb-backend/wiki/9246)
- [过滤器CommonPageFilter](https://partner.coding.intlgame.com/p/ogdb-backend/wiki/9034)
- [游戏Game](https://partner.coding.intlgame.com/p/ogdb-backend/wiki/2884)
- [时间Date](https://partner.coding.intlgame.com/p/ogdb-backend/wiki/3407)`,
    });
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>API文档Prompt生成器</Text>

      {/* 基本信息 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>基本信息</Text>

        <Text style={styles.label}>路由路径 *</Text>
        <TextInput
          style={styles.input}
          value={formData.routePath}
          onChangeText={(value) => handleInputChange("routePath", value)}
          placeholder="例如: /real_time_streaming/live_list"
        />

        <Text style={styles.label}>请求结构体 *</Text>
        <TextInput
          style={styles.input}
          value={formData.requestStruct}
          onChangeText={(value) => handleInputChange("requestStruct", value)}
          placeholder="例如: request.LiveRequest"
        />

        <Text style={styles.label}>响应结构体</Text>
        <TextInput
          style={styles.input}
          value={formData.responseStruct}
          onChangeText={(value) => handleInputChange("responseStruct", value)}
          placeholder="例如: response.RealTimeLiveListResponse"
        />

        <Text style={styles.label}>公共过滤器引用</Text>
        <TextInput
          style={[styles.input, styles.filterInput]}
          value={formData.commonFilters}
          onChangeText={(value) => handleInputChange("commonFilters", value)}
          placeholder="例如:
- [过滤器CommonSortFilter](链接)
- [过滤器CommonPageFilter](链接)"
          multiline
          numberOfLines={4}
        />
      </View>

      {/* 代码输入 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>代码结构</Text>

        <Text style={styles.label}>Request结构体代码 *</Text>
        <TextInput
          style={[styles.input, styles.codeInput]}
          value={formData.requestCode}
          onChangeText={(value) => handleInputChange("requestCode", value)}
          placeholder="粘贴Request结构体的Go代码..."
          multiline
          numberOfLines={8}
        />

        <Text style={styles.label}>Response结构体代码</Text>
        <TextInput
          style={[styles.input, styles.codeInput]}
          value={formData.responseCode}
          onChangeText={(value) => handleInputChange("responseCode", value)}
          placeholder="粘贴Response结构体的Go代码..."
          multiline
          numberOfLines={6}
        />
      </View>

      {/* 操作按钮 */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.exampleButton} onPress={loadExample}>
          <Text style={styles.buttonText}>加载示例</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.generateButton}
          onPress={generatePrompt}
        >
          <Text style={styles.buttonText}>生成Prompt</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.clearButton} onPress={clearForm}>
          <Text style={styles.buttonText}>清空</Text>
        </TouchableOpacity>
      </View>

      {/* 生成的Prompt */}
      {generatedPrompt && (
        <View style={styles.section}>
          <View style={styles.resultHeader}>
            <Text style={styles.sectionTitle}>生成的Prompt</Text>
            <TouchableOpacity
              style={styles.copyButton}
              onPress={copyToClipboard}
            >
              <Text style={styles.copyButtonText}>复制</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.promptContainer} nestedScrollEnabled>
            <Text style={styles.promptText}>{generatedPrompt}</Text>
          </ScrollView>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
    color: "#333",
  },
  section: {
    backgroundColor: "white",
    padding: 15,
    marginBottom: 15,
    borderRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#333",
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 5,
    color: "#555",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 6,
    padding: 12,
    marginBottom: 15,
    fontSize: 14,
    backgroundColor: "#fff",
  },
  codeInput: {
    fontFamily: "monospace",
    minHeight: 120,
    textAlignVertical: "top",
  },
  filterInput: {
    fontFamily: "monospace",
    minHeight: 80,
    textAlignVertical: "top",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 20,
  },
  exampleButton: {
    backgroundColor: "#6c757d",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 6,
  },
  generateButton: {
    backgroundColor: "#007bff",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 6,
  },
  clearButton: {
    backgroundColor: "#dc3545",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 6,
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
  },
  resultHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  copyButton: {
    backgroundColor: "#28a745",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 4,
  },
  copyButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 12,
  },
  promptContainer: {
    maxHeight: 300,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 6,
    padding: 10,
    backgroundColor: "#f8f9fa",
  },
  promptText: {
    fontSize: 12,
    fontFamily: "monospace",
    color: "#333",
    lineHeight: 16,
  },
});

export default ApiDocGenerator;
