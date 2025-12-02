import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { GlobalStyles, GlobalWebStyles } from "@styles/global";

interface ToolCard {
  title: string;
  description: string;
  route: string;
}

const tools: ToolCard[] = [
  {
    title: "CURL Helper",
    description: "Parse, modify and simplify curl commands for local testing",
    route: "/curl_helper",
  },
  {
    title: "JSON Helper",
    description: "Format, validate and transform JSON data",
    route: "/json_helper",
  },
  {
    title: "Japanese Learning",
    description: "Practice Japanese vocabulary and grammar",
    route: "/japanese_learning",
  },
];

export default function HomeScreen() {
  const router = useRouter();
  const commonStyleSheet =
    Platform.OS === "web" ? GlobalWebStyles : GlobalStyles;

  return (
    <ScrollView style={commonStyleSheet.container}>
      <Text style={styles.pageTitle}>Developer Tools</Text>
      <Text style={styles.subtitle}>Select a tool to get started</Text>

      <View style={styles.cardsContainer}>
        {tools.map((tool) => (
          <TouchableOpacity
            key={tool.route}
            style={styles.card}
            onPress={() => router.push(tool.route as any)}
          >
            <Text style={styles.cardTitle}>{tool.title}</Text>
            <Text style={styles.cardDescription}>{tool.description}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  pageTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 24,
  },
  cardsContainer: {
    gap: 16,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#eee",
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
});
