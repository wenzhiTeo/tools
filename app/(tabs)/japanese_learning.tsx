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
  useWindowDimensions,
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

// --- App -------------------------------------------------------------------
export default function App(): React.JSX.Element {
  const [script, setScript] = useState<ScriptName>("hiragana");
  const [mode, setMode] = useState<"grid" | "card" | "quiz">("grid");
  const [selected, setSelected] = useState<Kana | null>(null);
  const [progress, setProgress] = useState<ProgressStore>({});
  const [modalVisible, setModalVisible] = useState<boolean>(false);

  // 响应式布局
  const { width: screenWidth } = useWindowDimensions();
  const isWideScreen = screenWidth > 768;
  // 手机端固定4列，电脑端根据宽度动态调整
  const numColumns = isWideScreen 
    ? Math.min(Math.floor(screenWidth / 120), 10) 
    : 4;

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
    // 手机端固定4列，计算合适的卡片尺寸
    const mobileTileSize = Math.floor((screenWidth - 24 - 3 * 10) / 4); // 24 padding, 3 gaps of 10px
    const tileSize = isWideScreen ? 100 : mobileTileSize;
    
    return (
      <FlatList
        data={KANA_SET}
        keyExtractor={(item) => item.kana}
        numColumns={numColumns}
        key={numColumns} // 强制重新渲染当列数变化时
        contentContainerStyle={[
          styles.gridContainer,
          isWideScreen && styles.gridContainerWide,
        ]}
        columnWrapperStyle={[
          styles.columnWrapperMobile,
          isWideScreen && styles.columnWrapper,
        ]}
        renderItem={({ item }) => {
          const stat = progress[keyFor(script, item.kana)];
          return (
            <TouchableOpacity
              onPress={() => openCard(item)}
              style={[
                styles.tile,
                isWideScreen && styles.tileWide,
                { width: tileSize, minWidth: tileSize, maxWidth: tileSize },
              ]}
            >
              <Text style={[styles.kana, isWideScreen && styles.kanaWide]}>
                {item.kana}
              </Text>
              <Text style={[styles.romaji, isWideScreen && styles.romajiWide]}>
                {item.romaji}
              </Text>
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
          isWideScreen && styles.quizWrapWide,
          { backgroundColor: feedbackBackground as any },
        ]}
      >
        {mixedMode && (
          <Text style={styles.quizHint}>
            {HIRAGANA.some((h) => h.kana === item.kana) ? "平假名" : "片假名"}
          </Text>
        )}

        <Text style={[styles.quizTitle, isWideScreen && styles.quizTitleWide]}>
          What is this kana? ({quizIndex + 1}/{quizOrder.length})
        </Text>
        <Text style={[styles.bigKana, isWideScreen && styles.bigKanaWide]}>
          {item.kana}
        </Text>

        <View style={[styles.optionsContainer, isWideScreen && styles.optionsContainerWide]}>
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
                  isWideScreen && styles.quizOptWide,
                  isCorrectOpt ? styles.correctOpt : null,
                  isWrongOpt ? styles.wrongOpt : null,
                ]}
                onPress={() => answerQuiz(opt)}
                disabled={lastAnswerCorrect !== null}
              >
                <Text style={[styles.quizText, isWideScreen && styles.quizTextWide]}>
                  {opt}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {lastAnswerCorrect !== null && (
          <View style={styles.feedbackContainer}>
            <Text style={styles.feedbackText}>
              {lastAnswerCorrect ? "Correct ✅" : "Wrong ❌"}
            </Text>
          </View>
        )}

        <View style={styles.scoreContainer}>
          <Text style={[styles.scoreText, isWideScreen && styles.scoreTextWide]}>
            Score: {quizScore.correct} / {quizScore.correct + quizScore.wrong}
          </Text>
        </View>
      </Animated.View>
    );
  }

  // --- UI -----------------------------------------------------------------
  return (
    <SafeAreaView style={[styles.container, isWideScreen && styles.containerWide]}>
      <StatusBar style="auto" />

      <View style={[styles.header, isWideScreen && styles.headerWide]}>
        <Text style={[styles.title, isWideScreen && styles.titleWide]}>
          日语50音 — 学习卡
        </Text>

        <View style={[styles.headerBtns, isWideScreen && styles.headerBtnsWide]}>
          <TouchableOpacity
            onPress={() => setMode("grid")}
            style={[styles.smallBtn, isWideScreen && styles.smallBtnWide]}
          >
            <Text style={isWideScreen ? styles.btnTextWide : undefined}>Grid</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setMode("card")}
            style={[styles.smallBtn, isWideScreen && styles.smallBtnWide]}
          >
            <Text style={isWideScreen ? styles.btnTextWide : undefined}>Flashcards</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={startQuiz}
            style={[styles.smallBtn, isWideScreen && styles.smallBtnWide]}
          >
            <Text style={isWideScreen ? styles.btnTextWide : undefined}>Quiz</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.smallBtn, isWideScreen && styles.smallBtnWide]}
            onPress={clearProgress}
          >
            <Text style={isWideScreen ? styles.btnTextWide : undefined}>Clear Progress</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.headerBtns, styles.headerBtnsSecond, isWideScreen && styles.headerBtnsWide]}>
          <TouchableOpacity
            onPress={() => {
              setMode("grid");
              setScript("hiragana");
              setMixedMode(false);
            }}
            style={[
              styles.smallBtn,
              isWideScreen && styles.smallBtnWide,
              script === "hiragana" && styles.activeBtn,
            ]}
          >
            <Text style={isWideScreen ? styles.btnTextWide : undefined}>平假名</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              setMode("grid");
              setScript("katakana");
              setMixedMode(false);
            }}
            style={[
              styles.smallBtn,
              isWideScreen && styles.smallBtnWide,
              script === "katakana" && styles.activeBtn,
            ]}
          >
            <Text style={isWideScreen ? styles.btnTextWide : undefined}>片假名</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              setMode("grid");
              setMixedMode(!mixedMode);
              setScript("");
            }}
            style={[
              styles.smallBtn,
              isWideScreen && styles.smallBtnWide,
              mixedMode && styles.activeBtn,
            ]}
          >
            <Text style={isWideScreen ? styles.btnTextWide : undefined}>混合</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.contentArea}>
        {mode === "grid" && renderGrid()}
        {mode === "card" && (
          <View style={[styles.cardModeHint, isWideScreen && styles.cardModeHintWide]}>
            <Text style={isWideScreen ? styles.hintTextWide : undefined}>
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
  // Container
  container: { flex: 1, backgroundColor: "#f0f4f8" },
  containerWide: {
    backgroundColor: "#f0f4f8",
  },

  // Header
  header: { padding: 14, paddingHorizontal: 16, backgroundColor: "#ffffff", borderBottomWidth: 0 },
  headerWide: {
    padding: 24,
    paddingHorizontal: 48,
    backgroundColor: "#ffffff",
    shadowColor: "#64748b",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  title: { fontSize: 18, fontWeight: "800", color: "#0f172a", letterSpacing: -0.3 },
  titleWide: { fontSize: 28, marginBottom: 6, letterSpacing: -0.5 },
  headerBtns: { flexDirection: "row", gap: 8, marginTop: 10, flexWrap: "wrap" },
  headerBtnsWide: { gap: 14 },
  headerBtnsSecond: { marginTop: 6 },

  // Buttons
  smallBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "#f1f5f9",
  },
  smallBtnWide: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    marginRight: 0,
  },
  btnTextWide: { fontSize: 15, fontWeight: "600" },
  activeBtn: { backgroundColor: "#dcfce7" },

  // Content area
  contentArea: { flex: 1 },

  // Grid
  gridContainer: { padding: 14, paddingBottom: 100 },
  gridContainerWide: {
    padding: 28,
    paddingHorizontal: 48,
    alignItems: "center",
  },
  columnWrapperMobile: {
    justifyContent: "center",
    gap: 8,
  },
  columnWrapper: {
    justifyContent: "center",
    gap: 10,
  },
  tile: {
    margin: 4,
    padding: 10,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: "#ffffff",
    shadowColor: "#64748b",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  tileWide: {
    margin: 8,
    padding: 16,
    borderRadius: 16,
    backgroundColor: "#ffffff",
    shadowColor: "#64748b",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  kana: { fontSize: 26, fontWeight: "800", color: "#0f172a" },
  kanaWide: { fontSize: 36 },
  romaji: { marginTop: 4, color: "#64748b", fontSize: 12, fontWeight: "600" },
  romajiWide: { fontSize: 15, marginTop: 8 },
  small: { marginTop: 4, fontSize: 10, color: "#94a3b8", fontWeight: "500" },

  // Card mode
  cardModeHint: { padding: 18 },
  cardModeHintWide: { padding: 28, paddingHorizontal: 48 },
  hintTextWide: { fontSize: 16, marginBottom: 16, color: "#64748b" },

  // Modal
  modalWrap: { flex: 1, backgroundColor: "#f0f4f8" },
  modalHeader: { padding: 16, backgroundColor: "#ffffff", borderBottomWidth: 0 },
  close: { color: "#2563eb", fontWeight: "600", fontSize: 15 },
  cardCenter: { flex: 1, alignItems: "center", justifyContent: "center" },
  cardFace: {
    position: "absolute",
    width: 260,
    height: 220,
    alignItems: "center",
    justifyContent: "center",
    backfaceVisibility: "hidden",
    backgroundColor: "#ffffff",
    borderRadius: 24,
    shadowColor: "#64748b",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 6,
  },
  cardBack: { backgroundColor: "#ffffff" },
  bigKana: { fontSize: 80, fontWeight: "800", color: "#0f172a" },
  bigKanaWide: { fontSize: 140 },
  bigRomaji: { fontSize: 42, fontWeight: "700", color: "#2563eb" },
  cardControls: {
    padding: 24,
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#ffffff",
  },
  btn: { padding: 14, paddingHorizontal: 20, borderRadius: 14, backgroundColor: "#f1f5f9" },

  // Quiz
  quizWrap: { flex: 1, alignItems: "center", justifyContent: "center", padding: 20, backgroundColor: "#f0f4f8" },
  quizWrapWide: {
    padding: 48,
    maxWidth: 640,
    alignSelf: "center",
    width: "100%",
  },
  quizHint: { fontSize: 13, color: "#64748b", marginBottom: 8, fontWeight: "500" },
  quizTitle: { fontSize: 15, marginBottom: 10, color: "#475569", fontWeight: "600" },
  quizTitleWide: { fontSize: 22, marginBottom: 20, color: "#1e293b" },
  optionsContainer: { marginTop: 20, width: "100%", alignItems: "center" },
  optionsContainerWide: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 14,
    marginTop: 36,
  },
  quizOpt: {
    padding: 14,
    marginVertical: 6,
    width: 200,
    alignItems: "center",
    borderRadius: 14,
    backgroundColor: "#ffffff",
    shadowColor: "#64748b",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  quizOptWide: {
    width: 150,
    padding: 18,
    borderRadius: 16,
    marginVertical: 0,
    backgroundColor: "#ffffff",
    shadowColor: "#64748b",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  correctOpt: { backgroundColor: "#dcfce7", borderWidth: 2, borderColor: "#22c55e" },
  wrongOpt: { backgroundColor: "#fee2e2", borderWidth: 2, borderColor: "#ef4444" },
  quizText: { fontSize: 16, fontWeight: "600", color: "#334155" },
  quizTextWide: { fontSize: 20, fontWeight: "700" },
  feedbackContainer: { marginTop: 16, alignItems: "center" },
  feedbackText: { fontSize: 15, fontWeight: "600" },
  scoreContainer: { marginTop: 20, alignItems: "center" },
  scoreText: { fontSize: 14, color: "#64748b", fontWeight: "600" },
  scoreTextWide: { fontSize: 20, color: "#334155" },
});
