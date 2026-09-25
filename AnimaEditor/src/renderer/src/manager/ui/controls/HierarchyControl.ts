import type { HierarchyItem, HierarchyProps } from "../components/Hierarchy";

export function createHierarchyControl(props: HierarchyProps) {
  const element = document.createElement("div");
  element.className = "ui-hierarchy";
  element.setAttribute("role", "tree");
  element.setAttribute("aria-label", props.label);
  let controller = new AbortController();
  let items: readonly HierarchyItem[] = [];
  let selected: string | null = null;
  let filter = "";
  let focused: string | null = null;
  let disposed = false;
  let itemSignature = "";
  const collapsed = new Set<string>();
  let rows: { item: HierarchyItem; node: HTMLElement; parent: string | null }[] = [];

  function focus(id: string): void {
    focused = id;
    for (const row of rows) row.node.tabIndex = row.item.id === id ? 0 : -1;
    rows.find(row => row.item.id === id)?.node.focus();
  }
  function rename(item: HierarchyItem, row: HTMLElement, caption: HTMLElement): void {
    if (!item.renamable || !props.onRename || row.querySelector("input")) return;
    const input = document.createElement("input");
    input.className = "ui-tree-rename";
    input.value = item.label;
    input.setAttribute("aria-label", item.label);
    caption.replaceWith(input);
    input.focus();
    input.select();
    let ended = false;
    const end = (commit: boolean): void => {
      if (ended || disposed) return;
      ended = true;
      input.replaceWith(caption);
      row.focus();
      if (commit && input.value !== item.label) props.onRename?.(item.id, input.value);
    };
    input.addEventListener("keydown", event => {
      event.stopPropagation();
      if (event.isComposing) return;
      if (event.key === "Enter") { event.preventDefault(); end(true); }
      if (event.key === "Escape") { event.preventDefault(); end(false); }
    }, { signal: controller.signal });
    input.addEventListener("blur", () => end(true), { signal: controller.signal });
    input.addEventListener("click", event => event.stopPropagation(), { signal: controller.signal });
  }
  function render(): void {
    const hadFocus = element.contains(document.activeElement);
    controller.abort();
    controller = new AbortController();
    element.replaceChildren();
    rows = [];
    const matches = (item: HierarchyItem): boolean => item.label.toLocaleLowerCase().includes(filter) || !!item.children?.some(matches);
    const append = (entries: readonly HierarchyItem[], host: HTMLElement, depth: number, parent: string | null): void => {
      for (const item of entries) {
        if (filter && !matches(item)) continue;
        const branch = item.children !== undefined;
        const expanded = !!filter || !collapsed.has(item.id);
        const node = document.createElement("div");
        node.setAttribute("role", "treeitem");
        node.setAttribute("aria-level", String(depth + 1));
        node.setAttribute("aria-label", item.label);
        node.dataset.id = item.id;
        if (branch) node.setAttribute("aria-expanded", String(expanded));
        if (item.selectable !== false) node.setAttribute("aria-selected", String(selected === item.id));
        const row = document.createElement("div");
        row.className = "ui-tree-row";
        row.style.paddingLeft = `${depth * 16 + 6}px`;
        const toggle = document.createElement("span");
        toggle.className = branch ? "ui-tree-toggle" : "ui-tree-leaf";
        toggle.setAttribute("aria-hidden", "true");
        const caption = document.createElement("span");
        caption.className = "ui-tree-label";
        caption.textContent = item.label;
        caption.title = item.label;
        row.append(toggle, caption);
        node.append(row);
        host.append(node);
        rows.push({ item, node, parent });
        node.addEventListener("focus", () => {
          focused = item.id;
          for (const entry of rows) entry.node.tabIndex = entry.node === node ? 0 : -1;
        }, { signal: controller.signal });
        const toggleBranch = (): void => {
          if (!branch || filter) return;
          if (collapsed.has(item.id)) collapsed.delete(item.id); else collapsed.add(item.id);
          focused = item.id;
          render();
          focus(item.id);
        };
        toggle.addEventListener("click", event => { event.stopPropagation(); toggleBranch(); }, { signal: controller.signal });
        row.addEventListener("click", event => {
          event.stopPropagation();
          focus(item.id);
          if (item.selectable !== false) props.onSelect(item.id); else toggleBranch();
        }, { signal: controller.signal });
        row.addEventListener("dblclick", event => { event.stopPropagation(); rename(item, node, caption); }, { signal: controller.signal });
        node.addEventListener("keydown", event => {
          if (event.target !== node) return;
          const index = rows.findIndex(entry => entry.node === node);
          const move = (i: number): void => { const target = rows[i]; if (target) focus(target.item.id); };
          if (!["ArrowDown", "ArrowUp", "ArrowRight", "ArrowLeft", "Home", "End", "Enter", " ", "F2"].includes(event.key)) return;
          event.preventDefault(); event.stopPropagation();
          if (event.key === "ArrowDown") move(index + 1);
          else if (event.key === "ArrowUp") move(index - 1);
          else if (event.key === "Home") move(0);
          else if (event.key === "End") move(rows.length - 1);
          else if (event.key === "ArrowRight" && branch) { if (!expanded) toggleBranch(); else if (item.children?.length) move(index + 1); }
          else if (event.key === "ArrowLeft") { if (branch && expanded && !filter) toggleBranch(); else if (parent) focus(parent); }
          else if (event.key === "F2") rename(item, node, caption);
          else if (event.key === "Enter" || event.key === " ") { if (item.selectable !== false) props.onSelect(item.id); else toggleBranch(); }
        }, { signal: controller.signal });
        if (branch && expanded) {
          const group = document.createElement("div");
          group.setAttribute("role", "group");
          node.append(group);
          append(item.children ?? [], group, depth + 1, item.id);
        }
      }
    };
    append(items, element, 0, null);
    if (!rows.length) {
      const empty = document.createElement("div");
      empty.className = "ui-tree-empty";
      empty.textContent = "項目なし";
      element.append(empty);
    }
    const target = rows.find(row => row.item.id === focused) ?? rows.find(row => row.item.id === selected) ?? rows[0];
    focused = target?.item.id ?? null;
    element.tabIndex = rows.length ? -1 : 0;
    for (const row of rows) row.node.tabIndex = row === target ? 0 : -1;
    if (hadFocus) target?.node.focus();
  }
  return {
    element,
    setItems(value: readonly HierarchyItem[]) {
      const signature = JSON.stringify(value);
      if (signature === itemSignature) return;
      itemSignature = signature;
      items = value;
      const ids = new Set<string>();
      const collect = (entries: readonly HierarchyItem[]): void => { for (const item of entries) { ids.add(item.id); collect(item.children ?? []); } };
      collect(items);
      for (const id of collapsed) if (!ids.has(id)) collapsed.delete(id);
      render();
    },
    setSelected(value: string | null) {
      selected = value;
      for (const row of rows) if (row.item.selectable !== false) row.node.setAttribute("aria-selected", String(row.item.id === value));
    },
    setFilter(value: string) { const next = value.trim().toLocaleLowerCase(); if (next !== filter) { filter = next; render(); } },
    dispose() { disposed = true; controller.abort(); items = []; rows = []; collapsed.clear(); element.remove(); },
  };
}
