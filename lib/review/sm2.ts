/** Lightweight SM-2–style scheduling (again / hard / good). */

export type ReviewGrade = "again" | "hard" | "good";

export type CardSchedule = {
  ease: number;
  intervalDays: number;
  repetitions: number;
  dueAt: number;
};

const MS_PER_DAY = 86400000;

export function initialSchedule(now = Date.now()): CardSchedule {
  return {
    ease: 2.5,
    intervalDays: 0,
    repetitions: 0,
    dueAt: now,
  };
}

export function applyReview(
  prev: Pick<CardSchedule, "ease" | "intervalDays" | "repetitions">,
  grade: ReviewGrade,
  now = Date.now()
): CardSchedule {
  let { ease, intervalDays, repetitions } = prev;

  if (grade === "again") {
    repetitions = 0;
    intervalDays = 0;
    ease = Math.max(1.3, ease - 0.2);
    return {
      ease,
      intervalDays,
      repetitions,
      dueAt: now + MS_PER_DAY * 0.25,
    };
  }

  if (grade === "hard") {
    ease = Math.max(1.3, ease - 0.15);
    intervalDays = repetitions === 0 ? 1 : Math.max(1, intervalDays * 1.2);
    repetitions += 1;
    return {
      ease,
      intervalDays,
      repetitions,
      dueAt: now + intervalDays * MS_PER_DAY,
    };
  }

  // good
  ease = Math.min(3, ease + 0.1);
  if (repetitions === 0) intervalDays = 1;
  else if (repetitions === 1) intervalDays = 3;
  else intervalDays = Math.round(intervalDays * ease);
  repetitions += 1;
  return {
    ease,
    intervalDays,
    repetitions,
    dueAt: now + intervalDays * MS_PER_DAY,
  };
}
