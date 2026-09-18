export type RatingEntry = {
  studentId: string;
  name: string;
  avatarUrl: string | null;
  percent: number;
  isMe: boolean;
};

export type RankedRating = RatingEntry & { rank: number };

export function rankRatings(entries: RatingEntry[]) {
  const sorted = [...entries].sort(
    (a, b) => b.percent - a.percent || a.name.localeCompare(b.name),
  );
  const ranked: RankedRating[] = [];
  let previousPercent: number | null = null;
  let previousRank = 0;
  sorted.forEach((entry, index) => {
    const rank = entry.percent === previousPercent ? previousRank : index + 1;
    previousPercent = entry.percent;
    previousRank = rank;
    ranked.push({ ...entry, rank });
  });
  return ranked;
}
