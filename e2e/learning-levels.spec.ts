import { expect, test } from "@playwright/test";
import {
  ELITE_LESSON_ID,
  STRUCTURED_LESSON_COUNT,
  getKeyboardLessonById,
  getLearningLevelForLesson,
  keyboardTrainingLessons,
} from "@/data/keyboardTraining";

test.describe("learning journey", () => {
  test("contains 45 structured lessons with unique consecutive ids", () => {
    expect(keyboardTrainingLessons).toHaveLength(STRUCTURED_LESSON_COUNT);
    expect(keyboardTrainingLessons.map((lesson) => lesson.id)).toEqual(
      Array.from({ length: STRUCTURED_LESSON_COUNT }, (_, index) => index + 1)
    );
  });

  test("maps lesson boundaries to the visible levels", () => {
    expect(getLearningLevelForLesson(1)).toBe("beginner");
    expect(getLearningLevelForLesson(15)).toBe("beginner");
    expect(getLearningLevelForLesson(16)).toBe("advanced");
    expect(getLearningLevelForLesson(30)).toBe("advanced");
    expect(getLearningLevelForLesson(31)).toBe("professional");
    expect(getLearningLevelForLesson(45)).toBe("professional");
    expect(getLearningLevelForLesson(ELITE_LESSON_ID)).toBe("elite");
  });

  test("provides a permanent elite lesson after the structured course", () => {
    const elite = getKeyboardLessonById(ELITE_LESSON_ID);
    expect(elite.level).toBe("elite");
    expect(elite.exercises.length).toBeGreaterThan(0);
  });
});
