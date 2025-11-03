import React, { useEffect, useRef, useState } from "react";
import { StatusBar } from "expo-status-bar";
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Modal,
  Animated,
  Easing,
  StyleSheet,
  Alert,
  Platform,
} from "react-native";
import * as Speech from "expo-speech";
import AsyncStorage from "@react-native-async-storage/async-storage";

// --- Types -----------------------------------------------------------------
type ScriptName = "hiragana" | "katakana" | "";

type Kana = {
  kana: string;
  romaji: string;
};

type ProgressItem = {
  interval: number;
  streak: number;
  lastReviewed?: number;
  totalCorrect: number;
  totalWrong: number;
};

type ProgressStore = Record<string, ProgressItem>;

// --- Data ------------------------------------------------------------------
const HIRAGANA: Kana[] = [
  { kana: "あ", romaji: "a" },
  { kana: "い", romaji: "i" },
  { kana: "う", romaji: "u" },
  { kana: "え", romaji: "e" },
  { kana: "お", romaji: "o" },
  { kana: "か", romaji: "ka" },
  { kana: "き", romaji: "ki" },
  { kana: "く", romaji: "ku" },
  { kana: "け", romaji: "ke" },
  { kana: "こ", romaji: "ko" },
  { kana: "さ", romaji: "sa" },
  { kana: "し", romaji: "shi" },
  { kana: "す", romaji: "su" },
  { kana: "せ", romaji: "se" },
  { kana: "そ", romaji: "so" },
  { kana: "た", romaji: "ta" },
  { kana: "ち", romaji: "chi" },
  { kana: "つ", romaji: "tsu" },
  { kana: "て", romaji: "te" },
  { kana: "と", romaji: "to" },
  { kana: "な", romaji: "na" },
  { kana: "に", romaji: "ni" },
  { kana: "ぬ", romaji: "nu" },
  { kana: "ね", romaji: "ne" },
  { kana: "の", romaji: "no" },
  { kana: "は", romaji: "ha" },
  { kana: "ひ", romaji: "hi" },
  { kana: "ふ", romaji: "fu" },
  { kana: "へ", romaji: "he" },
  { kana: "ほ", romaji: "ho" },
  { kana: "ま", romaji: "ma" },
  { kana: "み", romaji: "mi" },
  { kana: "む", romaji: "mu" },
  { kana: "め", romaji: "me" },
  { kana: "も", romaji: "mo" },
  { kana: "や", romaji: "ya" },
  { kana: "ゆ", romaji: "yu" },
  { kana: "よ", romaji: "yo" },
  { kana: "ら", romaji: "ra" },
  { kana: "り", romaji: "ri" },
  { kana: "る", romaji: "ru" },
  { kana: "れ", romaji: "re" },
  { kana: "ろ", romaji: "ro" },
  { kana: "わ", romaji: "wa" },
  { kana: "を", romaji: "wo" },
  { kana: "ん", romaji: "n" },
];

const KATAKANA: Kana[] = [
  { kana: "ア", romaji: "a" },
  { kana: "イ", romaji: "i" },
  { kana: "ウ", romaji: "u" },
  { kana: "エ", romaji: "e" },
  { kana: "オ", romaji: "o" },
  { kana: "カ", romaji: "ka" },
  { kana: "キ", romaji: "ki" },
  { kana: "ク", romaji: "ku" },
  { kana: "ケ", romaji: "ke" },
  { kana: "コ", romaji: "ko" },
  { kana: "サ", romaji: "sa" },
  { kana: "シ", romaji: "shi" },
  { kana: "ス", romaji: "su" },
  { kana: "セ", romaji: "se" },
  { kana: "ソ", romaji: "so" },
  { kana: "タ", romaji: "ta" },
  { kana: "チ", romaji: "chi" },
  { kana: "ツ", romaji: "tsu" },
  { kana: "テ", romaji: "te" },
  { kana: "ト", romaji: "to" },
  { kana: "ナ", romaji: "na" },
  { kana: "ニ", romaji: "ni" },
  { kana: "ヌ", romaji: "nu" },
  { kana: "ネ", romaji: "ne" },
  { kana: "ノ", romaji: "no" },
  { kana: "ハ", romaji: "ha" },
  { kana: "ヒ", romaji: "hi" },
  { kana: "フ", romaji: "fu" },
  { kana: "ヘ", romaji: "he" },
  { kana: "ホ", romaji: "ho" },
  { kana: "マ", romaji: "ma" },
  { kana: "ミ", romaji: "mi" },
  { kana: "ム", romaji: "mu" },
  { kana: "メ", romaji: "me" },
  { kana: "モ", romaji: "mo" },
  { kana: "ヤ", romaji: "ya" },
  { kana: "ユ", romaji: "yu" },
  { kana: "ヨ", romaji: "yo" },
  { kana: "ラ", romaji: "ra" },
  { kana: "リ", romaji: "ri" },
  { kana: "ル", romaji: "ru" },
  { kana: "レ", romaji: "re" },
  { kana: "ロ", romaji: "ro" },
  { kana: "ワ", romaji: "wa" },
  { kana: "ヲ", romaji: "wo" },
  { kana: "ン", romaji: "n" },
];

// --- Storage key (per script, versioned) ---------------------------------
const STORAGE_PREFIX = "@jp50on_progress_v1";

// --- Helpers ---------------------------------------------------------------
function keyFor(script: ScriptName, kana: string): string {
  return `${script}:${kana}`;
}

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

function pickRandomRomajiExcept(
  list: Kana[],
  except: string,
  count: number
): string[] {
  const pool = list.map((k) => k.romaji).filter((r) => r !== except);
  return shuffle(pool).slice(0, count);
}

// --- App -------------------------------------------------------------------
export default function App(): React.JSX.Element {
  const [script, setScript] = useState<ScriptName>("hiragana");
  const [mode, setMode] = useState<"grid" | "card" | "quiz">("grid");
  const [selected, setSelected] = useState<Kana | null>(null);
  const [progress, setProgress] = useState<ProgressStore>({});
  const [modalVisible, setModalVisible] = useState<boolean>(false);

  // flip animation for card
  const flipAnim = useRef(new Animated.Value(0)).current;
  const [flipped, setFlipped] = useState<boolean>(false);

  // quiz state
  const [mixedMode, setMixedMode] = useState(false);
  const [quizOrder, setQuizOrder] = useState<string[]>([]);
  const [quizIndex, setQuizIndex] = useState<number>(0);
  const [quizScore, setQuizScore] = useState<{
    correct: number;
    wrong: number;
  }>({ correct: 0, wrong: 0 });
  const [lastAnswerCorrect, setLastAnswerCorrect] = useState<boolean | null>(
    null
  );
  const [quizOptions, setQuizOptions] = useState<string[]>([]);

  // feedback animation (background flash)
  const feedbackAnim = useRef(new Animated.Value(0)).current;

  const KANA_SET = mixedMode
    ? [...HIRAGANA, ...KATAKANA]
    : script === "hiragana"
    ? HIRAGANA
    : KATAKANA;

  useEffect(() => {
    loadProgress();
    // reset quiz when switching script
    setQuizOrder([]);
    setQuizIndex(0);
  }, [script]);

  useEffect(() => {
    // persist progress
    AsyncStorage.setItem(
      `${STORAGE_PREFIX}_${script}`,
      JSON.stringify(progress)
    ).catch(() => {});
  }, [progress, script]);

  useEffect(() => {
    // Only prepare options when in quiz mode and we have an order
    if (mode !== "quiz" || quizOrder.length === 0) {
      setQuizOptions([]);
      return;
    }

    const kana = quizOrder[quizIndex];
    const item = KANA_SET.find((x) => x.kana === kana);
    if (!item) {
      setQuizOptions([]);
      return;
    }

    // Generate and freeze options for this question
    setQuizOptions(makeOptions(item.romaji));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quizIndex, quizOrder, mode, script]);

  // --- storage -------------------------------------------------------------
  async function loadProgress(): Promise<void> {
    try {
      const raw = await AsyncStorage.getItem(`${STORAGE_PREFIX}_${script}`);
      if (raw) {
        const parsed = JSON.parse(raw) as ProgressStore;
        setProgress(parsed);
      } else {
        setProgress({});
      }
    } catch (e) {
      console.warn("load progress fail", e);
      setProgress({});
    }
  }

  async function clearProgress() {
    try {
      await AsyncStorage.clear(); // 💥 deletes ALL keys in AsyncStorage
      alert("Progress cleared!");
    } catch (e) {
      console.error("Failed to clear progress:", e);
    }
  }

  // --- actions -------------------------------------------------------------
  function speak(text: string): void {
    // prefer to speak kana (native) if possible; on some Android TTS may not support kana
    const toSpeak = text;
    const options = { language: "ja-JP" } as const;
    try {
      // expo-speech handles platform fallbacks
      Speech.speak(toSpeak, options);
    } catch (e) {
      console.warn("speech fail", e);
    }
  }

  function openCard(item: Kana): void {
    setSelected(item);
    setModalVisible(true);
    resetFlip();
    setLastAnswerCorrect(null);
  }

  function resetFlip(): void {
    flipAnim.setValue(0);
    setFlipped(false);
  }

  function flip(): void {
    const toValue = flipped ? 0 : 180;
    Animated.timing(flipAnim, {
      toValue,
      duration: 300,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start(() => setFlipped((v) => !v));
  }

  function recordResult(kanaKey: string, correct: boolean): void {
    setProgress((prev) => {
      const cur =
        prev[kanaKey] ??
        ({
          interval: 1,
          streak: 0,
          totalCorrect: 0,
          totalWrong: 0,
        } as ProgressItem);
      const next: ProgressItem = {
        interval: correct ? Math.min(cur.interval * 2, 30) : 1,
        streak: correct ? cur.streak + 1 : 0,
        lastReviewed: Date.now(),
        totalCorrect: cur.totalCorrect + (correct ? 1 : 0),
        totalWrong: cur.totalWrong + (correct ? 0 : 1),
      };
      return { ...prev, [kanaKey]: next };
    });
  }

  function startQuiz(): void {
    const order = shuffle(KANA_SET).map((k) => k.kana);
    setQuizOrder(order);
    setQuizIndex(0);
    setQuizScore({ correct: 0, wrong: 0 });
    setLastAnswerCorrect(null);
    setMode("quiz");
  }

  function makeOptions(correctRomaji: string): string[] {
    const opts = [
      correctRomaji,
      ...pickRandomRomajiExcept(KANA_SET, correctRomaji, 3),
    ];
    return shuffle(opts);
  }

  function pickRandomRomajiExcept(
    list: Kana[],
    except: string,
    count: number
  ): string[] {
    return pickRandomRomajiExceptHelper(list, except, count);
  }

  function pickRandomRomajiExceptHelper(
    list: Kana[],
    except: string,
    count: number
  ): string[] {
    const pool = list.map((k) => k.romaji).filter((r) => r !== except);
    return shuffle(pool).slice(0, count);
  }

  function showFeedback(correct: boolean): void {
    feedbackAnim.setValue(0);
    Animated.timing(feedbackAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: false,
    }).start(() => {
      // fade back
      Animated.timing(feedbackAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }).start();
    });
  }

  function answerQuiz(answer: string): void {
    const kana = quizOrder[quizIndex];
    const item = KANA_SET.find((x) => x.kana === kana);
    if (!item) return; // defensive

    const correct = item.romaji === answer;
    const kanaKey = keyFor(script, kana);
    recordResult(kanaKey, correct);

    setLastAnswerCorrect(correct);
    setQuizScore((s) => ({
      correct: s.correct + (correct ? 1 : 0),
      wrong: s.wrong + (!correct ? 1 : 0),
    }));

    showFeedback(correct);

    // after a short feedback delay move on or finish
    setTimeout(() => {
      if (quizIndex + 1 >= quizOrder.length) {
        Alert.alert(
          "Quiz finished",
          `Score: ${quizScore.correct + (correct ? 1 : 0)} / ${
            quizOrder.length
          }`,
          [
            { text: "再来一次", onPress: startQuiz },
            { text: "返回学习", onPress: () => setMode("grid") },
          ]
        );
      } else {
        setQuizIndex((i) => i + 1);
        setLastAnswerCorrect(null);
      }
    }, 700);
  }

  // --- interpolations -----------------------------------------------------
  const frontInterpolate = flipAnim.interpolate({
    inputRange: [0, 180],
    outputRange: ["0deg", "180deg"],
  });
  const backInterpolate = flipAnim.interpolate({
    inputRange: [0, 180],
    outputRange: ["180deg", "360deg"],
  });

  const feedbackBackground = feedbackAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [
      "transparent",
      lastAnswerCorrect ? "rgba(160,255,160,0.3)" : "rgba(255,160,160,0.3)",
    ],
  });

  // --- render helpers -----------------------------------------------------
  function renderGrid(): React.JSX.Element {
    return (
      <FlatList
        data={KANA_SET}
        keyExtractor={(item) => item.kana}
        numColumns={4}
        contentContainerStyle={{ padding: 12 }}
        renderItem={({ item }) => {
          const stat = progress[keyFor(script, item.kana)];
          return (
            <TouchableOpacity
              onPress={() => openCard(item)}
              style={styles.tile}
            >
              <Text style={styles.kana}>{item.kana}</Text>
              <Text style={styles.romaji}>{item.romaji}</Text>
              <Text style={styles.small}>
                ✓{stat?.totalCorrect ?? 0} ✕{stat?.totalWrong ?? 0}
              </Text>
            </TouchableOpacity>
          );
        }}
      />
    );
  }

  function renderCardModal(): React.JSX.Element | null {
    if (!selected) return null;
    const kanaKey = keyFor(script, selected.kana);
    return (
      <Modal
        visible={modalVisible}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={styles.modalWrap}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={styles.close}>Close</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.cardCenter}>
            <Animated.View
              style={[
                styles.cardFace,
                { transform: [{ rotateY: frontInterpolate }] },
              ]}
            >
              <Text style={styles.bigKana}>{selected.kana}</Text>
            </Animated.View>

            <Animated.View
              style={[
                styles.cardFace,
                styles.cardBack,
                { transform: [{ rotateY: backInterpolate }] },
              ]}
            >
              <Text style={styles.bigRomaji}>{selected.romaji}</Text>
            </Animated.View>
          </View>

          <View style={styles.cardControls}>
            <TouchableOpacity
              style={styles.btn}
              onPress={() => speak(selected.kana)}
            >
              <Text>Play</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.btn} onPress={flip}>
              <Text>Flip</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.btn}
              onPress={() => {
                recordResult(kanaKey, true);
                Alert.alert("Marked as known");
              }}
            >
              <Text>Known</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.btn}
              onPress={() => {
                recordResult(kanaKey, false);
                Alert.alert("Marked for review");
              }}
            >
              <Text>Again</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    );
  }

  function renderQuiz(): React.JSX.Element {
    const kana = quizOrder[quizIndex];
    const item = KANA_SET.find((x) => x.kana === kana) as Kana | undefined;

    if (!item)
      return (
        <View style={styles.quizWrap}>
          <Text>Loading...</Text>
        </View>
      );

    const options = quizOptions.length ? quizOptions : makeOptions(item.romaji);

    return (
      <Animated.View
        style={[
          styles.quizWrap,
          { backgroundColor: feedbackBackground as any },
        ]}
      >
        {mixedMode && (
          <Text style={{ fontSize: 14, color: "#888" }}>
            {HIRAGANA.some((h) => h.kana === item.kana) ? "平假名" : "片假名"}
          </Text>
        )}

        <Text style={styles.quizTitle}>
          What is this kana? ({quizIndex + 1}/{quizOrder.length})
        </Text>
        <Text style={styles.bigKana}>{item.kana}</Text>

        <View style={{ marginTop: 20 }}>
          {options.map((opt) => {
            const isCorrectOpt =
              lastAnswerCorrect !== null &&
              opt === item.romaji &&
              lastAnswerCorrect === true;
            const isWrongOpt =
              lastAnswerCorrect !== null &&
              opt === item.romaji &&
              lastAnswerCorrect === false;
            return (
              <TouchableOpacity
                key={opt}
                style={[
                  styles.quizOpt,
                  isCorrectOpt ? styles.correctOpt : null,
                  isWrongOpt ? styles.wrongOpt : null,
                ]}
                onPress={() => answerQuiz(opt)}
                disabled={lastAnswerCorrect !== null}
              >
                <Text style={styles.quizText}>{opt}</Text>
              </TouchableOpacity>
            );
          })}

          {lastAnswerCorrect !== null && (
            <View style={{ marginTop: 12, alignItems: "center" }}>
              <Text>{lastAnswerCorrect ? "Correct ✅" : "Wrong ❌"}</Text>
            </View>
          )}

          <View style={{ marginTop: 20, alignItems: "center" }}>
            <Text>
              Score: {quizScore.correct} / {quizScore.correct + quizScore.wrong}
            </Text>
          </View>
        </View>
      </Animated.View>
    );
  }

  // --- UI -----------------------------------------------------------------
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />

      <View style={styles.header}>
        <Text style={styles.title}>日语50音 — 学习卡</Text>

        <View style={styles.headerBtns}>
          <TouchableOpacity
            onPress={() => setMode("grid")}
            style={styles.smallBtn}
          >
            <Text>Grid</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setMode("card")}
            style={styles.smallBtn}
          >
            <Text>Flashcards</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={startQuiz} style={styles.smallBtn}>
            <Text>Quiz</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.smallBtn} onPress={clearProgress}>
            <Text>Clear Progress</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.headerBtns, { marginTop: 6 }]}>
          <TouchableOpacity
            onPress={() => {
              setMode("grid");
              setScript("hiragana");
              setMixedMode(false);
            }}
            style={[styles.smallBtn, script === "hiragana" && styles.activeBtn]}
          >
            <Text>平假名</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              setMode("grid");
              setScript("katakana");
              setMixedMode(false);
            }}
            style={[styles.smallBtn, script === "katakana" && styles.activeBtn]}
          >
            <Text>片假名</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              setMode("grid");
              setMixedMode(!mixedMode);
              setScript("");
            }}
            style={[styles.smallBtn, mixedMode && styles.activeBtn]}
          >
            <Text>混合</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={{ flex: 1 }}>
        {mode === "grid" && renderGrid()}
        {mode === "card" && (
          <View style={{ padding: 20 }}>
            <Text style={{ marginBottom: 12 }}>
              Tap a tile to open flashcard.
            </Text>
            {renderGrid()}
          </View>
        )}

        {mode === "quiz" && renderQuiz()}

        {renderCardModal()}
      </View>
    </SafeAreaView>
  );
}

// --- styles ---------------------------------------------------------------
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: { padding: 14, borderBottomWidth: 1, borderBottomColor: "#eee" },
  title: { fontSize: 18, fontWeight: "700" },
  headerBtns: { flexDirection: "row", gap: 8, marginTop: 8 },
  smallBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#f2f2f2",
    marginRight: 8,
  },
  activeBtn: { backgroundColor: "#d6f5d6" },
  tile: {
    flex: 1,
    margin: 6,
    padding: 12,
    minWidth: 80,
    maxWidth: 80,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    backgroundColor: "#fafafa",
    elevation: 1,
  },
  kana: { fontSize: 28, fontWeight: "700" },
  romaji: { marginTop: 6, color: "#444" },
  small: { marginTop: 6, fontSize: 12, color: "#999" },
  modalWrap: { flex: 1 },
  modalHeader: { padding: 12, borderBottomWidth: 1, borderBottomColor: "#eee" },
  close: { color: "#007AFF" },
  cardCenter: { flex: 1, alignItems: "center", justifyContent: "center" },
  cardFace: {
    position: "absolute",
    width: 240,
    height: 200,
    alignItems: "center",
    justifyContent: "center",
    backfaceVisibility: "hidden",
  },
  cardBack: { backgroundColor: "#fff" },
  bigKana: { fontSize: 96, fontWeight: "700" },
  bigRomaji: { fontSize: 48, fontWeight: "600" },
  cardControls: {
    padding: 20,
    flexDirection: "row",
    justifyContent: "space-around",
  },
  btn: { padding: 12, borderRadius: 8, backgroundColor: "#f2f2f2" },
  quizWrap: { flex: 1, alignItems: "center", justifyContent: "center" },
  quizTitle: { fontSize: 16, marginBottom: 12 },
  quizOpt: {
    padding: 12,
    marginVertical: 6,
    width: 220,
    alignItems: "center",
    borderRadius: 8,
    backgroundColor: "#f5f5f5",
  },
  correctOpt: { backgroundColor: "#d4f7d4" },
  wrongOpt: { backgroundColor: "#f7d4d4" },
  quizText: { fontSize: 16 },
});
