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
    fontSize: 32,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: "#64748b",
    marginBottom: 28,
    fontWeight: "500",
  },
  cardsContainer: {
    gap: 18,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 24,
    shadowColor: "#64748b",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 0,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 10,
    letterSpacing: -0.2,
  },
  cardDescription: {
    fontSize: 15,
    color: "#64748b",
    lineHeight: 22,
    fontWeight: "400",
  },
});
