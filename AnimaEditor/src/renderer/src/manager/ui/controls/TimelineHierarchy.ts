import type { TimelineKind, TimelineTrack } from "../components/Timeline";

interface Node {
  id: string;
  label: string;
  kind: TimelineKind;
  children: Map<string, Node>;
  tracks: TimelineTrack[];
}
export interface TimelineRow {
  id: string;
  label: string;
  kind: TimelineKind;
  depth: number;
  parentID?: string;
  branch: boolean;
  track?: TimelineTrack;
}

export function timelineRows(tracks: readonly TimelineTrack[], collapsed: ReadonlySet<string>): TimelineRow[] {
  const roots = new Map<string, Node>();
  for (const track of tracks) {
    let children = roots;
    const prefix: string[] = [];
    if (track.group) {
      prefix.push(track.group.id);
      const id = JSON.stringify(["group", ...prefix]);
      if (!children.has(id)) children.set(id, { id, label: track.group.label, kind: track.kind, children: new Map(), tracks: [] });
      children = children.get(id)!.children;
    }
    const parts = track.path?.split(".").filter(Boolean);
    if (!parts?.length) {
      const id = JSON.stringify(["track", track.id]);
      children.set(id, { id, label: track.label, kind: track.kind, children: new Map(), tracks: [track] });
      continue;
    }
    let node: Node | undefined;
    for (const part of parts) {
      prefix.push(part);
      const id = JSON.stringify(["path", track.group?.id ?? null, ...prefix]);
      if (!children.has(id)) children.set(id, { id, label: part, kind: track.kind, children: new Map(), tracks: [] });
      node = children.get(id)!;
      children = node.children;
    }
    node!.tracks.push(track);
  }
  const rows: TimelineRow[] = [];
  const visit = (nodes: Map<string, Node>, depth: number, parentID?: string): void => {
    for (const node of nodes.values()) {
      const branch = node.children.size > 0 || node.tracks.length !== 1;
      rows.push({ id: node.id, label: node.label, kind: node.kind, depth, parentID, branch,
        track: branch ? undefined : node.tracks[0] });
      if (!branch || collapsed.has(node.id)) continue;
      for (const track of node.tracks) rows.push({
        id: JSON.stringify(["track", track.id]), label: track.label, kind: track.kind,
        depth: depth + 1, parentID: node.id, branch: false, track,
      });
      visit(node.children, depth + 1, node.id);
    }
  };
  visit(roots, 0);
  return rows;
}
