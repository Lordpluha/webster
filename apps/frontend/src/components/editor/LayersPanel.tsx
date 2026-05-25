import type { FC } from "react";
import { useEffect, useMemo, useReducer, useState } from "react";
import { ChevronDown, Eye, EyeOff, Layers, Lock, Unlock, Unlink } from "lucide-react";

import type { SceneNode } from "@/shared/lib/canvas-engine";
import {
  canGroupSelection,
  canUngroupSelection,
  groupSelection,
  renameGroup,
  reorderNodeInPanel,
  setGroupHidden,
  setGroupLocked,
  ungroupSelection,
} from "@/shared/lib/editor/layer-groups";
import { useOptionalEditorWorkspace } from "./editor-workspace-context";

type LayerEntry = {
  id: string;
  node: SceneNode;
  groupId: string | null;
};

type GroupEntry = {
  id: string;
  label: string;
  items: LayerEntry[];
};

type DisplayRow =
  | { type: "group"; group: GroupEntry }
  | { type: "layer"; layer: LayerEntry };

function getNodeLabel(node: SceneNode): string {
  if (node.data?.label && typeof node.data.label === "string" && node.data.label.trim()) {
    return node.data.label.trim();
  }
  if (node.type === "text") {
    const text = typeof node.data?.text === "string" ? node.data.text.trim() : "";
    return text ? `Text: ${text.slice(0, 24)}` : "Text";
  }
  return node.type.charAt(0).toUpperCase() + node.type.slice(1);
}

function getGroupLabel(groupId: string, items: LayerEntry[]): string {
  const custom = items.find((item) => typeof item.node.data?.groupLabel === "string")?.node.data
    ?.groupLabel;
  if (custom && typeof custom === "string" && custom.trim()) {
    return custom.trim();
  }
  return `Group ${groupId.slice(-6)}`;
}

function groupIsHidden(items: LayerEntry[]): boolean {
  return items.length > 0 && items.every((item) => Boolean(item.node.data?.hidden));
}

function groupIsLocked(items: LayerEntry[]): boolean {
  return items.length > 0 && items.every((item) => Boolean(item.node.data?.locked));
}

export const LayersPanel: FC = () => {
  const workspace = useOptionalEditorWorkspace();
  const [revision, bump] = useReducer((n: number) => n + 1, 0);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dropInfo, setDropInfo] = useState<{ targetId: string; position: "above" | "below" } | null>(
    null,
  );
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [lastClickedIndex, setLastClickedIndex] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editGroupValue, setEditGroupValue] = useState("");

  useEffect(() => {
    if (!workspace) return;
    const { engine } = workspace;
    const offScene = engine.events.on("scene:changed", bump);
    const offSelection = engine.events.on("selection:changed", bump);
    return () => {
      offScene();
      offSelection();
    };
  }, [workspace]);

  const engine = workspace?.engine;
  const snapshot = engine?.getRuntimeSnapshot();
  const selectedIds = snapshot?.selectedNodeIds ?? [];

  const { rows, panelOrderIds, scene } = useMemo(() => {
    if (!engine) {
      return {
        rows: [] as DisplayRow[],
        panelOrderIds: [] as string[],
        scene: null as ReturnType<typeof engine.getSerializableState> | null,
      };
    }

    const currentScene = engine.getSerializableState();
    const entries: LayerEntry[] = currentScene.nodeOrder
      .map((id) => currentScene.nodes[id])
      .filter((node): node is SceneNode => Boolean(node))
      .map((node) => ({
        id: node.id,
        node,
        groupId: typeof node.data?.groupId === "string" ? node.data.groupId : null,
      }));

    const panelOrder = [...entries].reverse();
    const groupMap = new Map<string, LayerEntry[]>();

    for (const entry of panelOrder) {
      if (!entry.groupId) {
        continue;
      }
      if (!groupMap.has(entry.groupId)) {
        groupMap.set(entry.groupId, []);
      }
      groupMap.get(entry.groupId)?.push(entry);
    }

    const displayRows: DisplayRow[] = [];

    for (const entry of panelOrder) {
      if (entry.groupId && groupMap.has(entry.groupId)) {
        if (!displayRows.some((row) => row.type === "group" && row.group.id === entry.groupId)) {
          const groupItems = groupMap.get(entry.groupId) ?? [];
          displayRows.push({
            type: "group",
            group: {
              id: entry.groupId,
              label: getGroupLabel(entry.groupId, groupItems),
              items: groupItems,
            },
          });
        }
        continue;
      }
      displayRows.push({ type: "layer", layer: entry });
    }

    const orderIds: string[] = [];
    for (const row of displayRows) {
      if (row.type === "layer") {
        orderIds.push(row.layer.id);
        continue;
      }
      for (const item of row.group.items) {
        orderIds.push(item.id);
      }
    }

    return { rows: displayRows, panelOrderIds: orderIds, scene: currentScene };
  }, [engine, revision]);

  if (!workspace || !engine || !scene) {
    return null;
  }

  const canGroup = canGroupSelection(scene, selectedIds);
  const canUngroup = canUngroupSelection(scene, selectedIds);

  const handleToggleVisibility = (node: SceneNode) => {
    const nextHidden = !node.data?.hidden;
    engine.updateNode(node.id, (prev) => ({
      ...prev,
      data: { ...(prev.data ?? {}), hidden: nextHidden },
    }));

    if (nextHidden) {
      engine.setSelection(selectedIds.filter((id) => id !== node.id));
    }
  };

  const handleToggleLock = (node: SceneNode) => {
    const nextLocked = !node.data?.locked;
    engine.updateNode(node.id, (prev) => ({
      ...prev,
      data: { ...(prev.data ?? {}), locked: nextLocked },
    }));

    if (nextLocked) {
      engine.setSelection(selectedIds.filter((id) => id !== node.id));
    }
  };

  const handleGroupClick = (event: React.MouseEvent, group: GroupEntry) => {
    const memberIds = group.items.filter((item) => !item.node.data?.hidden).map((item) => item.id);
    if (memberIds.length === 0) {
      return;
    }

    const memberIndices = memberIds
      .map((id) => panelOrderIds.indexOf(id))
      .filter((index) => index >= 0);
    const anchorIndex = memberIndices.length > 0 ? Math.min(...memberIndices) : -1;

    if (event.shiftKey && lastClickedIndex !== null && anchorIndex >= 0) {
      const start = Math.min(lastClickedIndex, anchorIndex, ...memberIndices);
      const end = Math.max(lastClickedIndex, anchorIndex, ...memberIndices);
      engine.setSelection(panelOrderIds.slice(start, end + 1));
      setLastClickedIndex(anchorIndex);
      return;
    }

    if (event.metaKey || event.ctrlKey) {
      const allSelected = memberIds.every((id) => selectedIds.includes(id));
      if (allSelected) {
        engine.setSelection(selectedIds.filter((id) => !memberIds.includes(id)));
      } else {
        engine.setSelection([...new Set([...selectedIds, ...memberIds])]);
      }
      setLastClickedIndex(anchorIndex);
      return;
    }

    engine.setSelection(memberIds);
    setLastClickedIndex(anchorIndex);
  };

  const handleLayerClick = (event: React.MouseEvent, layerId: string) => {
    const node = scene.nodes[layerId];
    if (node?.data?.hidden) {
      return;
    }
    const panelIndex = panelOrderIds.indexOf(layerId);
    if (panelIndex === -1) {
      return;
    }

    if (event.shiftKey && lastClickedIndex !== null) {
      const start = Math.min(lastClickedIndex, panelIndex);
      const end = Math.max(lastClickedIndex, panelIndex);
      engine.setSelection(panelOrderIds.slice(start, end + 1));
      return;
    }

    if (event.metaKey || event.ctrlKey) {
      if (selectedIds.includes(layerId)) {
        engine.setSelection(selectedIds.filter((id) => id !== layerId));
      } else {
        engine.setSelection([...selectedIds, layerId]);
      }
      setLastClickedIndex(panelIndex);
      return;
    }

    engine.setSelection([layerId]);
    setLastClickedIndex(panelIndex);
  };

  const handleDragStart = (event: React.DragEvent, layerId: string) => {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", layerId);
    setDragId(layerId);
  };

  const handleDragOver = (event: React.DragEvent, targetId: string) => {
    event.preventDefault();
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const position = event.clientY < rect.top + rect.height / 2 ? "above" : "below";
    setDropInfo({ targetId, position });
  };

  const handleDrop = (event: React.DragEvent, targetId: string) => {
    event.preventDefault();
    const dragged = event.dataTransfer.getData("text/plain") || dragId;
    if (!dragged || dragged === targetId) {
      setDropInfo(null);
      setDragId(null);
      return;
    }

    const position = dropInfo?.targetId === targetId ? dropInfo.position : "above";
    reorderNodeInPanel(engine, dragged, targetId, position, panelOrderIds);
    setDropInfo(null);
    setDragId(null);
  };

  const beginRename = (node: SceneNode) => {
    setEditingId(node.id);
    setEditValue(getNodeLabel(node));
  };

  const commitRename = (node: SceneNode) => {
    const label = editValue.trim();
    engine.updateNode(node.id, (prev) => ({
      ...prev,
      data: { ...(prev.data ?? {}), label },
    }));
    setEditingId(null);
  };

  const beginGroupRename = (group: GroupEntry) => {
    setEditingGroupId(group.id);
    setEditGroupValue(group.label);
  };

  const commitGroupRename = (groupId: string) => {
    renameGroup(engine, groupId, editGroupValue);
    setEditingGroupId(null);
  };

  const renderLayerRow = (entry: LayerEntry, nested = false) => {
    const node = entry.node;
    const isSelected = selectedIds.includes(entry.id);
    const isHidden = Boolean(node.data?.hidden);
    const isLocked = Boolean(node.data?.locked);
    const isDragging = dragId === entry.id;
    const isDropTarget = dropInfo?.targetId === entry.id;

    return (
      <div
        key={entry.id}
        draggable
        onDragStart={(event) => handleDragStart(event, entry.id)}
        onDragOver={(event) => handleDragOver(event, entry.id)}
        onDrop={(event) => handleDrop(event, entry.id)}
        onDragEnd={() => {
          setDropInfo(null);
          setDragId(null);
        }}
        className={
          "flex items-center gap-2 rounded-md px-2 py-1.5 text-xs transition " +
          (isSelected ? "bg-blue-100 text-blue-900" : "hover:bg-slate-100") +
          (nested ? " ml-4" : "") +
          (isDragging ? " opacity-60" : "") +
          (isHidden ? " opacity-50" : "") +
          (isDropTarget
            ? dropInfo?.position === "above"
              ? " border-t-2 border-blue-500"
              : " border-b-2 border-blue-500"
            : "")
        }
        onClick={(event) => handleLayerClick(event, entry.id)}
        onDoubleClick={() => beginRename(node)}
      >
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            handleToggleVisibility(node);
          }}
          className="rounded p-1 text-slate-600 hover:bg-white"
          title={isHidden ? "Show" : "Hide"}
        >
          {isHidden ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>

        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            handleToggleLock(node);
          }}
          className="rounded p-1 text-slate-600 hover:bg-white"
          title={isLocked ? "Unlock" : "Lock"}
        >
          {isLocked ? <Lock size={14} /> : <Unlock size={14} />}
        </button>

        <div className="min-w-0 flex-1">
          {editingId === entry.id ? (
            <input
              value={editValue}
              onChange={(event) => setEditValue(event.target.value)}
              onBlur={() => commitRename(node)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  commitRename(node);
                }
                if (event.key === "Escape") {
                  setEditingId(null);
                }
              }}
              className="w-full rounded border border-slate-300 bg-white px-2 py-1 text-xs"
              autoFocus
            />
          ) : (
            <div className="truncate text-slate-700">
              {getNodeLabel(node)}
              {isLocked ? " (locked)" : ""}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <aside className="flex h-full w-72 flex-col border-r border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-3 py-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900">Layers</h3>
          <span className="text-xs text-slate-500">{panelOrderIds.length}</span>
        </div>
        <div className="mt-2 flex gap-1">
          <button
            type="button"
            disabled={!canGroup}
            onClick={() => groupSelection(engine, selectedIds)}
            className="inline-flex flex-1 items-center justify-center gap-1 rounded-md border border-slate-200 px-2 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            title="Group selection (Ctrl+G)"
          >
            <Layers size={14} aria-hidden />
            Group
          </button>
          <button
            type="button"
            disabled={!canUngroup}
            onClick={() => ungroupSelection(engine, selectedIds)}
            className="inline-flex flex-1 items-center justify-center gap-1 rounded-md border border-slate-200 px-2 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            title="Ungroup (Ctrl+Shift+G)"
          >
            <Unlink size={14} aria-hidden />
            Ungroup
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-2 py-2">
        {rows.length === 0 ? (
          <div className="px-2 py-4 text-xs text-slate-500">No layers yet.</div>
        ) : (
          rows.map((row) => {
            if (row.type === "layer") {
              return renderLayerRow(row.layer);
            }

            const isCollapsed = collapsedGroups[row.group.id];
            const groupMemberIds = row.group.items.map((item) => item.id);
            const isGroupSelected =
              groupMemberIds.length > 0 && groupMemberIds.every((id) => selectedIds.includes(id));
            const isGroupPartiallySelected =
              !isGroupSelected && groupMemberIds.some((id) => selectedIds.includes(id));
            const hidden = groupIsHidden(row.group.items);
            const locked = groupIsLocked(row.group.items);

            return (
              <div key={row.group.id} className="mb-2">
                <div
                  className={
                    "flex items-center gap-1 rounded-md text-xs font-semibold transition " +
                    (isGroupSelected
                      ? "bg-blue-100 text-blue-900"
                      : isGroupPartiallySelected
                        ? "bg-blue-50 text-blue-800"
                        : "text-slate-700 hover:bg-slate-100")
                  }
                >
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      setCollapsedGroups((prev) => ({
                        ...prev,
                        [row.group.id]: !prev[row.group.id],
                      }));
                    }}
                    className="rounded p-1.5 text-slate-600 hover:bg-white/80"
                    title={isCollapsed ? "Expand group" : "Collapse group"}
                  >
                    <ChevronDown
                      size={14}
                      className={"transition-transform " + (isCollapsed ? "-rotate-90" : "")}
                    />
                  </button>

                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      setGroupHidden(engine, row.group.id, !hidden);
                    }}
                    className="rounded p-1 text-slate-600 hover:bg-white/80"
                    title={hidden ? "Show group" : "Hide group"}
                  >
                    {hidden ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>

                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      setGroupLocked(engine, row.group.id, !locked);
                    }}
                    className="rounded p-1 text-slate-600 hover:bg-white/80"
                    title={locked ? "Unlock group" : "Lock group"}
                  >
                    {locked ? <Lock size={14} /> : <Unlock size={14} />}
                  </button>

                  {editingGroupId === row.group.id ? (
                    <input
                      value={editGroupValue}
                      onChange={(event) => setEditGroupValue(event.target.value)}
                      onBlur={() => commitGroupRename(row.group.id)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          commitGroupRename(row.group.id);
                        }
                        if (event.key === "Escape") {
                          setEditingGroupId(null);
                        }
                      }}
                      onClick={(event) => event.stopPropagation()}
                      className="min-w-0 flex-1 rounded border border-slate-300 bg-white px-2 py-1 text-xs"
                      autoFocus
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={(event) => handleGroupClick(event, row.group)}
                      onDoubleClick={(event) => {
                        event.stopPropagation();
                        beginGroupRename(row.group);
                      }}
                      className="min-w-0 flex-1 truncate px-1 py-1.5 text-left"
                      title="Select group · double-click to rename"
                    >
                      {row.group.label}
                      <span className="ml-1 font-normal text-slate-500">({row.group.items.length})</span>
                    </button>
                  )}
                </div>
                {!isCollapsed && row.group.items.map((item) => renderLayerRow(item, true))}
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
};
