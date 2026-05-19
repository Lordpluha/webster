import { useCallback, useState } from "react";
import { useMutation, useQuery } from "@apollo/client/react";

import {
  CREATE_VERSION_MUTATION,
  RESTORE_VERSION_MUTATION,
  VERSIONS_QUERY,
} from "@/graphql/projects.graphql";
import { useToastStore } from "@/shared/stores/toast.store";

import { useOptionalEditorWorkspace } from "./editor-workspace-context";

export type ProjectVersionItem = {
  id: string;
  label?: string | null;
  createdAt: string;
};

export function useProjectVersionHistory() {
  const workspace = useOptionalEditorWorkspace();
  const pushToast = useToastStore((state) => state.pushToast);
  const [busy, setBusy] = useState<"version" | "restore" | null>(null);

  const projectId = workspace?.projectId ?? null;

  const {
    data: versionsData,
    refetch: refetchVersions,
    loading: versionsLoading,
    error: versionsError,
  } = useQuery(VERSIONS_QUERY, {
    variables: { projectId: projectId ?? "" },
    skip: !projectId,
  });

  const [createVersion] = useMutation(CREATE_VERSION_MUTATION);
  const [restoreVersionMutation] = useMutation(RESTORE_VERSION_MUTATION);

  const versions =
    (versionsData as { versions?: ProjectVersionItem[] } | undefined)?.versions ?? [];

  const createSnapshot = useCallback(
    async (label: string) => {
      if (!projectId || !workspace) {
        return false;
      }
      setBusy("version");
      try {
        await workspace.saveNow();
        await createVersion({ variables: { projectId, label: label || undefined } });
        await refetchVersions();
        pushToast({ title: "Snapshot saved", tone: "success" });
        return true;
      } catch (e) {
        pushToast({
          title: "Snapshot failed",
          message: e instanceof Error ? e.message : "Failed to create version",
          tone: "error",
        });
        return false;
      } finally {
        setBusy(null);
      }
    },
    [createVersion, projectId, pushToast, refetchVersions, workspace],
  );

  const restoreVersion = useCallback(
    async (versionId: string) => {
      if (!projectId || !workspace) {
        return false;
      }
      setBusy("restore");
      try {
        const res = await restoreVersionMutation({ variables: { projectId, versionId } });
        const content = (res.data as { restoreVersion?: { content?: unknown } })?.restoreVersion?.content;
        workspace.applyProjectContent(content ?? null);
        await refetchVersions();
        pushToast({ title: "Version restored", tone: "success" });
        return true;
      } catch (e) {
        pushToast({
          title: "Restore failed",
          message: e instanceof Error ? e.message : "Restore failed",
          tone: "error",
        });
        return false;
      } finally {
        setBusy(null);
      }
    },
    [projectId, pushToast, refetchVersions, restoreVersionMutation, workspace],
  );

  return {
    projectId,
    versions,
    versionsLoading,
    versionsError,
    busy,
    createSnapshot,
    restoreVersion,
    refetchVersions,
  };
}
