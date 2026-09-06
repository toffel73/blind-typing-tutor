export interface KeyboardTrainingLesson {
  id: number;
  title: string;
  newKeys: string[];
  reviewKeys: string[];
  exercises: string[];
  level?: LearningLevel;
}

export type LearningLevel = "beginner" | "advanced" | "professional" | "elite";

export const STRUCTURED_LESSON_COUNT = 45;
export const ELITE_LESSON_ID = STRUCTURED_LESSON_COUNT + 1;

export const learningLevelLabels: Record<LearningLevel, string> = {
  beginner: "Beginner",
  advanced: "Advanced",
  professional: "Professional",
  elite: "Elite-Training",
};

export const keyboardTrainingLessons: KeyboardTrainingLesson[] = [
  {
    id: 1,
    title: "F und J",
    newKeys: ["f", "j"],
    reviewKeys: [],
    exercises: [
      "fff jjj fff jjj",
      "fj fj fj fj",
      "fff jjj fj fj",
      "fjj fjf jff",
    ],
  },
  {
    id: 2,
    title: "D und K",
    newKeys: ["d", "k"],
    reviewKeys: ["f", "j"],
    exercises: [
      "ddd kkk ddd kkk",
      "dk dk dk dk",
      "fd jk fd jk",
      "df kd df kd",
    ],
  },
  {
    id: 3,
    title: "S und L",
    newKeys: ["s", "l"],
    reviewKeys: ["f", "j", "d", "k"],
    exercises: [
      "sss lll sss lll",
      "sl sl sl sl",
      "sd lk sd lk",
      "fs jl dk sl",
    ],
  },
  {
    id: 4,
    title: "A und Ö",
    newKeys: ["a", "ö"],
    reviewKeys: ["s", "d", "f", "j", "k", "l"],
    exercises: [
      "aaa ööö aaa ööö",
      "aö aö aö aö",
      "as öl as öl",
      "af ösd aj ök",
    ],
  },
  {
    id: 5,
    title: "Grundreihe",
    newKeys: ["a", "s", "d", "f", "j", "k", "l", "ö"],
    reviewKeys: [],
    exercises: [
      "asdf jklö asdf jklö",
      "fdsa ölkj fdsa ölkj",
      "as df jk lö as df jk lö",
      "a s d f j k l ö",
    ],
  },
  {
    id: 6,
    title: "E und I",
    newKeys: ["e", "i"],
    reviewKeys: ["a", "s", "d", "f", "j", "k", "l", "ö"],
    exercises: [
      "eee iii eee iii",
      "ei ie ei ie",
      "de ki se li",
      "asdf ei jklö ie",
    ],
  },
  {
    id: 7,
    title: "R und U",
    newKeys: ["r", "u"],
    reviewKeys: ["e", "i", "a", "s", "d", "f", "j", "k", "l", "ö"],
    exercises: [
      "rrr uuu rrr uuu",
      "ru ur ru ur",
      "er ui er ui",
      "asd fru jkl öui",
    ],
  },
  {
    id: 8,
    title: "T und Z",
    newKeys: ["t", "z"],
    reviewKeys: ["r", "u", "e", "i", "a", "s", "d", "f", "j", "k", "l", "ö"],
    exercises: [
      "ttt zzz ttt zzz",
      "tz zt tz zt",
      "tr zu tr zu",
      "asdf tzu jklö uzt",
    ],
  },
  {
    id: 9,
    title: "W und O",
    newKeys: ["w", "o"],
    reviewKeys: ["t", "z", "r", "u", "e", "i", "a", "s", "d", "f", "j", "k", "l", "ö"],
    exercises: [
      "www ooo www ooo",
      "wo ow wo ow",
      "we oi we oi",
      "asdf woe jklö iow",
    ],
  },
  {
    id: 10,
    title: "Q und P",
    newKeys: ["q", "p"],
    reviewKeys: ["w", "o", "t", "z", "r", "u", "e", "i", "a", "s", "d", "f", "j", "k", "l", "ö"],
    exercises: [
      "qqq ppp qqq ppp",
      "qp pq qp pq",
      "qw op qw op",
      "asdf qop jklö poq",
    ],
  },
  {
    id: 11,
    title: "C und M",
    newKeys: ["c", "m"],
    reviewKeys: ["q", "w", "e", "r", "t", "z", "u", "i", "o", "p", "a", "s", "d", "f", "j", "k", "l", "ö"],
    exercises: [
      "ccc mmm ccc mmm",
      "cm mc cm mc",
      "dc km sc lm",
      "asdf cm jklö mc",
    ],
  },
  {
    id: 12,
    title: "V und N",
    newKeys: ["v", "n"],
    reviewKeys: ["c", "m", "a", "s", "d", "f", "j", "k", "l", "ö"],
    exercises: [
      "vvv nnn vvv nnn",
      "vn nv vn nv",
      "dv kn sv ln",
      "asdf vn jklö nv",
    ],
  },
  {
    id: 13,
    title: "B",
    newKeys: ["b"],
    reviewKeys: ["v", "n", "c", "m", "a", "s", "d", "f", "j", "k", "l", "ö"],
    exercises: [
      "bbb bbb bbb bbb",
      "vb bn vb bn",
      "ab df jb kl",
      "asdf bvn jklö mcb",
    ],
  },
  {
    id: 14,
    title: "X und Y",
    newKeys: ["x", "y"],
    reviewKeys: ["q", "w", "e", "r", "t", "z", "u", "i", "o", "p", "a", "s", "d", "f", "j", "k", "l", "ö", "c", "v", "b", "n", "m"],
    exercises: [
      "xxx yyy xxx yyy",
      "xy yx xy yx",
      "ax sy dx fy",
      "qwer xyu asdf yxcv",
    ],
  },
  {
    id: 15,
    title: "Grundalphabet wiederholen",
    newKeys: [],
    reviewKeys: ["q", "w", "e", "r", "t", "z", "u", "i", "o", "p", "a", "s", "d", "f", "j", "k", "l", "ö", "y", "x", "c", "v", "b", "n", "m"],
    exercises: [
      "asdf jklö qwer tzui yxcv bnm",
      "qwer asdf yxcv tzui jklö bnm",
      "af sj dk fl öa jp qu wi er to",
      "qaz wsx edc rfv tgb zhn ujm iko plö",
    ],
  },
  ...[
    [16, "Großschreibung", ["Knie Patient Praxis", "Arzt Termin Befund", "Montag Dienstag Mittwoch"]],
    [17, "Umlaute und ß", ["Hüfte Füße Größe", "Übung äußere Gefäße", "mäßig häufig plötzlich"]],
    [18, "Punkt und Komma", ["Patient, Termin, Befund.", "Knie, Hüfte, Schulter.", "Heute, morgen, später."]],
    [19, "Doppelpunkt und Semikolon", ["Befund: stabil; Kontrolle: morgen", "Diagnose: Arthrose; Therapie: Übung"]],
    [20, "Bindestrich", ["Knick-Senkfuß O-Bein X-Bein", "Weber-B-Fraktur Pivot-Shift-Test"]],
    [21, "Zahlen", ["1 2 3 4 5 6 7 8 9 0", "10 20 30 40 50", "8 Wochen 12 Termine 3 Übungen"]],
    [22, "Datum und Uhrzeit", ["06.09.2026 08:30 Uhr", "Termin am 12.10.2026", "Kontrolle um 14:15 Uhr"]],
    [23, "Häufige Wörter", ["der die das und oder aber", "Patient kommt heute zur Kontrolle", "bitte wieder in der Praxis vorstellen"]],
    [24, "Kurze Sätze", ["Das Knie ist stabil.", "Die Wunde heilt reizlos.", "Der Patient hat Schmerzen."]],
    [25, "Rechte und linke Hand", ["rechte Schulter linke Schulter", "linkes Knie rechter Fuß", "beidseits frei beweglich"]],
    [26, "Schreibfluss", ["Die Untersuchung erfolgt in ruhigem Tempo.", "Genauigkeit kommt vor Geschwindigkeit."]],
    [27, "Wortwechsel", ["Arzt Praxis Termin Patient Befund", "Knie Hüfte Hand Fuß Schulter"]],
    [28, "Satzzeichen im Wechsel", ["Befund: stabil, reizlos, beweglich.", "Schmerz: 3 von 10; Verlauf: besser."]],
    [29, "Advanced-Training", ["Heute wurde die Beweglichkeit erneut überprüft.", "Der nächste Kontrolltermin ist in vier Wochen."]],
    [30, "Advanced-Abschluss", ["Sicheres Schreiben verbindet Tempo und Genauigkeit.", "Großschreibung, Zahlen und Satzzeichen sitzen sicher."]],
  ].map(([id, title, exercises]) => ({
    id: id as number,
    title: title as string,
    newKeys: [],
    reviewKeys: [],
    exercises: exercises as string[],
    level: "advanced" as const,
  })),
  ...[
    [31, "Anamnese", ["Der Patient berichtet über belastungsabhängige Schmerzen.", "Die Beschwerden bestehen seit ungefähr drei Wochen."]],
    [32, "Klinische Untersuchung", ["Durchblutung, Motorik und Sensibilität sind intakt.", "Es besteht ein lokaler Druckschmerz."]],
    [33, "Schulter und Ellenbogen", ["Die Rotatorenmanschette ist klinisch unauffällig.", "Am Ellenbogen zeigt sich eine Epicondylitis."]],
    [34, "Hand und Handgelenk", ["Verdacht auf eine distale Radiusfraktur.", "Das Karpaltunnelsyndrom wird weiter abgeklärt."]],
    [35, "Wirbelsäule", ["Es besteht eine degenerative Spinalkanalstenose.", "Die Lumboischialgie strahlt in das rechte Bein aus."]],
    [36, "Becken und Hüfte", ["Radiologisch zeigt sich eine fortgeschrittene Coxarthrose.", "Die Hüftbeweglichkeit ist schmerzhaft eingeschränkt."]],
    [37, "Kniegelenk", ["Der Lachman-Test ist deutlich positiv.", "Es besteht der Verdacht auf eine Kreuzbandruptur."]],
    [38, "Sprunggelenk und Fuß", ["Das Sprunggelenk ist mäßig geschwollen.", "Die Achillessehne ist durchgängig tastbar."]],
    [39, "Frakturen", ["Die Fraktur steht in regelrechter Stellung.", "Die knöcherne Konsolidierung schreitet voran."]],
    [40, "Bildgebung", ["Die Magnetresonanztomographie zeigt einen Gelenkerguss.", "Eine Röntgenkontrolle wurde veranlasst."]],
    [41, "Therapie", ["Physiotherapie und eigenständige Übungen werden empfohlen.", "Die Belastung darf schmerzadaptiert gesteigert werden."]],
    [42, "Nachbehandlung", ["Wiedervorstellung zur klinischen Verlaufskontrolle.", "Die Orthese soll weitere zwei Wochen getragen werden."]],
    [43, "Unfallchirurgie", ["Der Unfallmechanismus spricht für eine Distorsion.", "Eine operative Versorgung ist derzeit nicht erforderlich."]],
    [44, "Praxisdiktat", ["Vielen Dank für die freundliche Überweisung des Patienten.", "Wir bitten um Fortführung der krankengymnastischen Behandlung."]],
    [45, "Professional-Abschluss", ["Die klinische und radiologische Verlaufskontrolle zeigt eine regelrechte Frakturheilung.", "Der Patient kann die berufliche Tätigkeit schrittweise wieder aufnehmen."]],
  ].map(([id, title, exercises]) => ({
    id: id as number,
    title: title as string,
    newKeys: [],
    reviewKeys: [],
    exercises: exercises as string[],
    level: "professional" as const,
  })),
];

const eliteTrainingLesson: KeyboardTrainingLesson = {
  id: ELITE_LESSON_ID,
  title: "Fortlaufendes Elite-Training",
  newKeys: [],
  reviewKeys: [],
  exercises: [
    "Präzision und Geschwindigkeit entwickeln sich durch regelmäßiges Training.",
    "Die klinische Verlaufskontrolle dokumentiert den aktuellen Heilungsfortschritt.",
    "Magnetresonanztomographie, Rotatorenmanschettenruptur und Spinalkanalstenose.",
  ],
  level: "elite",
};

const LAST_LESSON_ID = STRUCTURED_LESSON_COUNT;

export function getKeyboardLessonById(lessonId: number): KeyboardTrainingLesson {
  if (Math.floor(lessonId) >= ELITE_LESSON_ID) {
    return eliteTrainingLesson;
  }
  const clampedLessonId = Math.min(Math.max(Math.floor(lessonId || 1), 1), LAST_LESSON_ID);
  return keyboardTrainingLessons.find((lesson) => lesson.id === clampedLessonId) ?? keyboardTrainingLessons[0];
}

export function getLastKeyboardLessonId() {
  return LAST_LESSON_ID;
}

export function getLearningLevelForLesson(lessonId: number): LearningLevel {
  if (lessonId >= ELITE_LESSON_ID) return "elite";
  if (lessonId >= 31) return "professional";
  if (lessonId >= 16) return "advanced";
  return "beginner";
}
