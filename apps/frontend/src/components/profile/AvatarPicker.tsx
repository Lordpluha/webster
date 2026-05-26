import { useMutation, useQuery } from "@apollo/client/react";
import { useRef, useState } from "react";
import { Upload } from "lucide-react";

import { AVATAR_PRESETS_QUERY, UPDATE_PROFILE_MUTATION } from "@/graphql/auth.graphql";
import { AVATAR_PRESET_IDS, avatarPresetSrc } from "@/shared/constants/avatar-presets";
import { getApiOrigin } from "@/shared/lib/canvas-engine/utils/image-src";
import { resolveAvatarSrc } from "@/shared/lib/resolve-avatar-src";
import { useToastStore } from "@/shared/stores/toast.store";

import { UserAvatar } from "./UserAvatar";

type AvatarPickerProps = {
  avatarUrl?: string | null;
  avatarPresetId?: string | null;
  firstName: string;
  lastName: string;
  onUpdated?: () => void;
};

export function AvatarPicker({
  avatarUrl,
  avatarPresetId,
  firstName,
  lastName,
  onUpdated,
}: AvatarPickerProps) {
  const pushToast = useToastStore((s) => s.pushToast);
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const { data: presetsData } = useQuery(AVATAR_PRESETS_QUERY);
  const presets =
    (presetsData as { avatarPresets?: Array<{ id: string; url: string }> } | undefined)
      ?.avatarPresets ?? [];

  const [updateProfile, { loading: savingPreset }] = useMutation(UPDATE_PROFILE_MUTATION, {
    onCompleted: () => {
      pushToast({ title: "Avatar updated", tone: "success" });
      onUpdated?.();
    },
    onError: (err) => {
      pushToast({ title: "Avatar update failed", message: err.message, tone: "error" });
    },
  });

  const selectPreset = (presetId: string) => {
    void updateProfile({ variables: { input: { avatarPresetId: presetId } } });
  };

  const uploadCustom = async (file: File) => {
    setUploading(true);
    try {
      const origin = getApiOrigin() || "";
      const form = new FormData();
      form.append("file", file);

      const res = await fetch(`${origin}/upload/avatar`, {
        method: "POST",
        body: form,
        credentials: "include",
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Upload failed (${res.status})`);
      }

      const user = (await res.json()) as { avatarUrl?: string };
      if (!user.avatarUrl) {
        throw new Error("No avatar URL returned");
      }

      await updateProfile({ variables: { input: { avatarUrl: user.avatarUrl } } });
    } catch (e) {
      pushToast({
        title: "Upload failed",
        message: e instanceof Error ? e.message : "Could not upload avatar",
        tone: "error",
      });
    } finally {
      setUploading(false);
    }
  };

  const currentSrc = resolveAvatarSrc(avatarUrl, avatarPresetId);
  const busy = uploading || savingPreset;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <UserAvatar
          src={currentSrc}
          firstName={firstName}
          lastName={lastName}
          size="lg"
        />
        <div>
          <p className="text-sm font-medium text-white">Profile photo</p>
          <p className="mt-1 text-xs text-violet-200/70">Pick a preset or upload PNG, JPEG, or WebP (max 2 MB).</p>
          <button
            type="button"
            disabled={busy}
            onClick={() => fileRef.current?.click()}
            className="mt-3 inline-flex items-center gap-2 rounded-full border border-white/20 px-3 py-1.5 text-xs font-medium text-violet-100 hover:bg-white/10 disabled:opacity-50"
          >
            <Upload size={14} aria-hidden />
            {uploading ? "Uploading…" : "Upload your own"}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (file) void uploadCustom(file);
            }}
          />
        </div>
      </div>

      <div className="grid grid-cols-5 gap-2 sm:grid-cols-10">
        {(presets.length > 0 ? presets : AVATAR_PRESET_IDS.map((id) => ({ id, url: avatarPresetSrc(id) }))).map(
          (preset) => {
            const selected = avatarPresetId === preset.id;
            const src = preset.url.startsWith("http") ? preset.url : avatarPresetSrc(preset.id);
            return (
              <button
                key={preset.id}
                type="button"
                disabled={busy}
                title={preset.id}
                onClick={() => selectPreset(preset.id)}
                className={
                  "overflow-hidden rounded-full border-2 p-0.5 transition disabled:opacity-50 " +
                  (selected ? "border-cyan-400 ring-2 ring-cyan-400/40" : "border-transparent hover:border-white/30")
                }
              >
                <img src={src} alt="" className="h-10 w-10 rounded-full bg-slate-200 object-cover" />
              </button>
            );
          },
        )}
      </div>
    </div>
  );
}
