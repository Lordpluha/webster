import type { CanvasEngine, NodeId, SerializableSceneState } from "@/shared/lib/canvas-engine";

export function getGroupedNodeIds(scene: SerializableSceneState, nodeIds: NodeId[]): NodeId[] {
  const result = new Set<NodeId>();
  const groupIds = new Set<string>();

  for (const id of nodeIds) {
    const node = scene.nodes[id];
    if (!node) continue;
    result.add(id);
    if (node.data?.groupId) {
      groupIds.add(node.data.groupId);
    }
  }

  if (groupIds.size > 0) {
    for (const id of scene.nodeOrder) {
      const node = scene.nodes[id];
      if (node?.data?.groupId && groupIds.has(node.data.groupId)) {
        result.add(id);
      }
    }
  }

  return Array.from(result);
}

export function getGroupMemberIds(scene: SerializableSceneState, groupId: string): NodeId[] {
  return scene.nodeOrder.filter((id) => scene.nodes[id]?.data?.groupId === groupId);
}

export function canGroupSelection(scene: SerializableSceneState, nodeIds: NodeId[]): boolean {
  const eligible = nodeIds.filter((id) => !scene.nodes[id]?.data?.locked);
  return eligible.length >= 2;
}

export function canUngroupSelection(scene: SerializableSceneState, nodeIds: NodeId[]): boolean {
  return nodeIds.some((id) => Boolean(scene.nodes[id]?.data?.groupId));
}

export function groupSelection(engine: CanvasEngine, nodeIds: NodeId[], label?: string): string | null {
  const scene = engine.getSerializableState();
  const eligible = nodeIds.filter((id) => !scene.nodes[id]?.data?.locked);
  if (eligible.length < 2) {
    return null;
  }

  const groupId = `group-${Date.now()}`;
  engine.batchUpdate(
    ({ updateNode }) => {
      for (const nodeId of eligible) {
        updateNode(nodeId, (prevNode) => ({
          ...prevNode,
          data: {
            ...(prevNode.data ?? {}),
            groupId,
            ...(label ? { groupLabel: label } : {}),
          },
        }));
      }
    },
    { history: { label: "group", mergeKey: `group:${groupId}` } },
  );

  engine.setSelection(eligible);
  return groupId;
}

export function ungroupSelection(engine: CanvasEngine, nodeIds: NodeId[]): void {
  const scene = engine.getSerializableState();
  const groupIds = new Set<string>();

  for (const id of nodeIds) {
    const gid = scene.nodes[id]?.data?.groupId;
    if (gid) {
      groupIds.add(gid);
    }
  }

  if (groupIds.size === 0) {
    return;
  }

  const affected: NodeId[] = [];
  engine.batchUpdate(
    ({ updateNode }) => {
      for (const id of scene.nodeOrder) {
        const node = scene.nodes[id];
        const gid = node?.data?.groupId;
        if (!gid || !groupIds.has(gid)) {
          continue;
        }
        affected.push(id);
        updateNode(id, (prevNode) => {
          const nextData = { ...(prevNode.data ?? {}) };
          delete nextData.groupId;
          delete nextData.groupLabel;
          return { ...prevNode, data: nextData };
        });
      }
    },
    { history: { label: "ungroup" } },
  );

  if (affected.length > 0) {
    engine.setSelection(affected);
  }
}

export function renameGroup(
  engine: CanvasEngine,
  groupId: string,
  label: string,
): void {
  const scene = engine.getSerializableState();
  const trimmed = label.trim();
  if (!trimmed) {
    return;
  }

  engine.batchUpdate(
    ({ updateNode }) => {
      for (const id of getGroupMemberIds(scene, groupId)) {
        updateNode(id, (prev) => ({
          ...prev,
          data: { ...(prev.data ?? {}), groupLabel: trimmed },
        }));
      }
    },
    { history: { label: "rename-group", mergeKey: `group-label:${groupId}` } },
  );
}

export function setGroupHidden(engine: CanvasEngine, groupId: string, hidden: boolean): void {
  const scene = engine.getSerializableState();
  const memberIds = getGroupMemberIds(scene, groupId);

  engine.batchUpdate(({ updateNode }) => {
    for (const id of memberIds) {
      updateNode(id, (prev) => ({
        ...prev,
        data: { ...(prev.data ?? {}), hidden },
      }));
    }
  });

  if (hidden) {
    const selected = engine.getRuntimeSnapshot().selectedNodeIds;
    engine.setSelection(selected.filter((id) => !memberIds.includes(id)));
  }
}

export function setGroupLocked(engine: CanvasEngine, groupId: string, locked: boolean): void {
  const scene = engine.getSerializableState();
  const memberIds = getGroupMemberIds(scene, groupId);

  engine.batchUpdate(({ updateNode }) => {
    for (const id of memberIds) {
      updateNode(id, (prev) => ({
        ...prev,
        data: { ...(prev.data ?? {}), locked },
      }));
    }
  });

  if (locked) {
    const selected = engine.getRuntimeSnapshot().selectedNodeIds;
    engine.setSelection(selected.filter((id) => !memberIds.includes(id)));
  }
}

/** Reorder a node (and its group, if any) in the panel z-order. */
export function reorderNodeInPanel(
  engine: CanvasEngine,
  draggedId: NodeId,
  targetId: NodeId,
  position: "above" | "below",
  panelOrderIds: string[],
): void {
  const scene = engine.getSerializableState();
  const draggedNode = scene.nodes[draggedId];
  if (!draggedNode) {
    return;
  }

  const groupId = draggedNode.data?.groupId;
  const blockIds = groupId
    ? panelOrderIds.filter((id) => scene.nodes[id]?.data?.groupId === groupId)
    : [draggedId];

  const withoutBlock = panelOrderIds.filter((id) => !blockIds.includes(id));
  const targetIndex = withoutBlock.indexOf(targetId);
  if (targetIndex === -1) {
    return;
  }

  const insertAt = position === "below" ? targetIndex + 1 : targetIndex;
  const nextPanelOrder = [
    ...withoutBlock.slice(0, insertAt),
    ...blockIds,
    ...withoutBlock.slice(insertAt),
  ];

  const targetNodeOrder = [...nextPanelOrder].reverse();
  for (let targetIndex = targetNodeOrder.length - 1; targetIndex >= 0; targetIndex -= 1) {
    const id = targetNodeOrder[targetIndex];
    engine.reorderNode(id, targetIndex);
  }
}
