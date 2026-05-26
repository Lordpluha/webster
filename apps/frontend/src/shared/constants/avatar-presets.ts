export const AVATAR_PRESET_IDS = [
  "preset-01",
  "preset-02",
  "preset-03",
  "preset-04",
  "preset-05",
  "preset-06",
  "preset-07",
  "preset-08",
  "preset-09",
  "preset-10",
  "preset-11",
  "preset-12",
  "preset-13",
  "preset-14",
  "preset-15",
  "preset-16",
  "preset-17",
  "preset-18",
  "preset-19",
  "preset-20",
] as const;

export function avatarPresetSrc(presetId: string): string {
  return `/avatars/${presetId}.svg`;
}
