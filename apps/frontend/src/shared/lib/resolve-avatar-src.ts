import { avatarPresetSrc } from "@/shared/constants/avatar-presets";
import { getApiOrigin } from "@/shared/lib/canvas-engine/utils/image-src";

/** Resolve avatar URL for display (presets, uploads, external). */
export function resolveAvatarSrc(avatarUrl?: string | null, avatarPresetId?: string | null): string | null {
  if (avatarUrl) {
    if (avatarUrl.startsWith("/avatars/")) {
      return avatarUrl;
    }
    if (avatarUrl.startsWith("/uploads/")) {
      const origin = getApiOrigin();
      return origin ? `${origin}${avatarUrl}` : avatarUrl;
    }
    if (avatarUrl.startsWith("http://") || avatarUrl.startsWith("https://")) {
      return avatarUrl;
    }
    return avatarUrl;
  }

  if (avatarPresetId) {
    return avatarPresetSrc(avatarPresetId);
  }

  return null;
}
