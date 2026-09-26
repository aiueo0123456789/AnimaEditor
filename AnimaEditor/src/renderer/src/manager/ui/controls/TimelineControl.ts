import type { TimelineData, TimelineKind, TimelineProps, TimelineViewState } from "../components/Timeline";
import { timelineRows } from "./TimelineHierarchy";
import { createSplitControl } from "./SplitControl";
import { configurePanelRegion } from "./PanelRegion";
import { Header } from "../components/Header";
import { Main } from "../components/Main";

let nextTimelineID = 0;

export function createTimelineControl(props: TimelineProps) {
  const controller = new AbortController();
  let trackController = new AbortController();
  const signal = controller.signal;
  const element = document.createElement("div");
  element.className = "ui-timeline";
  const header = document.createElement("header");
  header.className = "ui-timeline-header";
  configurePanelRegion(header, Header({ children: [] }));
  const settings = document.createElement("button");
  settings.type = "button";
  settings.className = "ui-timeline-settings-button";
  settings.textContent = "タイムライン設定";
  settings.setAttribute("aria-haspopup", "dialog");
  settings.setAttribute("aria-expanded", "false");
  const play = document.createElement("button");
  play.type = "button";
  const frame = document.createElement("output");
  frame.className = "ui-timeline-frame";
  frame.setAttribute("aria-label", "現在フレーム / 終了フレーム");
  header.append(settings, play, frame);
  const popup = document.createElement("div");
  popup.id = `timeline-settings-${nextTimelineID++}`;
  popup.className = "ui-timeline-settings ui-select-popup";
  popup.setAttribute("role", "dialog");
  popup.setAttribute("aria-label", "タイムライン設定");
  settings.setAttribute("aria-controls", popup.id);
  const heading = document.createElement("div");
  heading.textContent = "表示するアニメーション";
  heading.className = "ui-timeline-settings-title";
  popup.append(heading);
  const state: TimelineViewState = props.viewState ?? { visibleKinds: ["armature", "sprite", "other"], zoom: 12, trackRatio: .25 };
  const visible = new Set<TimelineKind>(state.visibleKinds);
  const checkboxes = new Map<TimelineKind, HTMLInputElement>();
  for (const [kind, title] of [["armature", "アーマチュア"], ["sprite", "スプライト"], ["other", "その他"]] as const) {
    const label = document.createElement("label");
    label.dataset.widget = "checkbox";
    const text = document.createElement("span");
    text.textContent = title;
    const input = document.createElement("input");
    input.type = "checkbox";
    input.checked = visible.has(kind);
    checkboxes.set(kind, input);
    label.append(text, input);
    popup.append(label);
    input.addEventListener("change", () => {
      if (input.checked) visible.add(kind); else visible.delete(kind);
      state.visibleKinds = [...visible];
      drawTracks();
    }, { signal });
  }
  const scroll = document.createElement("div");
  const split = createSplitControl({ ratio: state.trackRatio, onRatioChange: ratio => { state.trackRatio = ratio; }, minFirst: 80, minSecond: 120, label: "トラックとフレームの幅" });
  const labels = document.createElement("div");
  labels.className = "ui-timeline-labels";
  const labelContent = document.createElement("div");
  labelContent.setAttribute("role", "tree");
  labelContent.setAttribute("aria-label", "Animation tracks");
  labels.append(labelContent);
  split.childContainers[0].append(labels);
  split.childContainers[1].append(scroll);
  scroll.className = "ui-timeline-scroll";
  const grid = document.createElement("div");
  grid.className = "ui-timeline-grid";
  scroll.append(grid);
  const playhead = document.createElement("div");
  playhead.className = "ui-timeline-playhead";
  playhead.setAttribute("aria-hidden", "true");
  const main = document.createElement("div");
  configurePanelRegion(main, Main({ padding: 0, overflow: "hidden", children: [] }));
  main.append(split.element);
  element.append(header, main);
  let data: TimelineData | null = null;
  let signature = "";
  let zoom = state.zoom;
  let opened = false;
  let pointer: number | null = null;
  let disposed = false;
  let ruler: HTMLElement | null = null;

  function drawTicks(): void {
    if (!data || !ruler) return;
    const step = Math.max(1, 5 * Math.ceil(50 / (5 * zoom)));
    const first = Math.max(data.frameStart, data.frameStart + Math.floor(scroll.scrollLeft / zoom / step) * step);
    const end = Math.min(data.frameEnd, first + Math.ceil((scroll.clientWidth || 800) / zoom) + step);
    ruler.replaceChildren();
    for (let tick = first; tick <= end; tick += step) {
      const label = document.createElement("span");
      label.textContent = String(tick);
      label.style.left = `${(tick - data.frameStart) * zoom}px`;
      ruler.append(label);
    }
  }

  function closeSettings(restoreFocus = false): void {
    if (!opened) return;
    opened = false;
    popup.remove();
    settings.setAttribute("aria-expanded", "false");
    if (restoreFocus && !disposed) settings.focus();
  }
  settings.addEventListener("click", () => {
    if (opened) { closeSettings(true); return; }
    opened = true;
    document.body.append(popup);
    settings.setAttribute("aria-expanded", "true");
    const rect = settings.getBoundingClientRect();
    const width = Math.min(250, window.innerWidth - 12);
    popup.style.width = `${width}px`;
    popup.style.maxHeight = `${Math.max(40, window.innerHeight - 12)}px`;
    popup.style.left = `${Math.max(6, Math.min(rect.left, window.innerWidth - width - 6))}px`;
    popup.style.top = `${Math.max(6, Math.min(rect.bottom + 4, window.innerHeight - popup.offsetHeight - 6))}px`;
    popup.querySelector("input")?.focus();
  }, { signal });
  popup.addEventListener("keydown", event => {
    if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); closeSettings(true); }
  }, { signal });
  document.addEventListener("pointerdown", event => {
    if (!popup.contains(event.target as Node) && !settings.contains(event.target as Node)) closeSettings();
  }, { signal });
  document.addEventListener("focusin", event => {
    if (!popup.contains(event.target as Node) && !settings.contains(event.target as Node)) closeSettings();
  }, { signal });
  window.addEventListener("resize", () => closeSettings(), { signal });
  document.addEventListener("scroll", event => {
    if (!popup.contains(event.target as Node)) closeSettings();
  }, { signal, capture: true });
  play.addEventListener("click", () => { if (data) props.onPlay(!data.playing); }, { signal });

  function drawTracks(): void {
    if (!data) return;
    const hadFocus = grid.contains(document.activeElement);
    const focusedRow = labelContent.contains(document.activeElement) ? (document.activeElement as HTMLElement)?.dataset.rowId : undefined;
    const focusedLabel = document.activeElement?.getAttribute("aria-label");
    if (pointer !== null && ruler?.hasPointerCapture(pointer)) ruler.releasePointerCapture(pointer);
    pointer = null;
    trackController.abort();
    trackController = new AbortController();
    const trackSignal = trackController.signal;
    grid.replaceChildren();
    labelContent.replaceChildren();
    const width = Math.max(1, data.frameEnd - data.frameStart + 1) * zoom;
    grid.style.setProperty("--timeline-width", `${width}px`);
    const corner = document.createElement("div");
    corner.className = "ui-timeline-corner";
    corner.textContent = "アニメーション";
    labelContent.append(corner);
    const rulerElement = document.createElement("div");
    ruler = rulerElement;
    ruler.className = "ui-timeline-ruler";
    ruler.setAttribute("role", "slider");
    ruler.setAttribute("aria-label", "再生位置");
    ruler.setAttribute("aria-valuemin", String(data.frameStart));
    ruler.setAttribute("aria-valuemax", String(data.frameEnd));
    ruler.tabIndex = 0;
    const seek = (clientX: number): void => {
      if (!data) return;
      const value = Math.round(data.frameStart + (clientX - rulerElement.getBoundingClientRect().left) / zoom);
      props.onSeek(Math.max(data.frameStart, Math.min(data.frameEnd, value)));
    };
    ruler.addEventListener("pointerdown", event => {
      if (event.button !== 0) return;
      event.preventDefault();
      rulerElement.focus();
      pointer = event.pointerId;
      rulerElement.setPointerCapture(pointer);
      seek(event.clientX);
    }, { signal: trackSignal });
    ruler.addEventListener("pointermove", event => { if (pointer === event.pointerId) seek(event.clientX); }, { signal: trackSignal });
    const release = (): void => { pointer = null; };
    ruler.addEventListener("pointerup", release, { signal: trackSignal });
    ruler.addEventListener("pointercancel", release, { signal: trackSignal });
    ruler.addEventListener("lostpointercapture", release, { signal: trackSignal });
    ruler.addEventListener("keydown", event => {
      if (!data) return;
      const values: Record<string, number> = { ArrowLeft: data.currentFrame - 1, ArrowRight: data.currentFrame + 1, Home: data.frameStart, End: data.frameEnd };
      if (event.key in values) {
        event.preventDefault(); event.stopPropagation();
        props.onSeek(Math.max(data.frameStart, Math.min(data.frameEnd, values[event.key])));
      }
    }, { signal: trackSignal });
    grid.append(ruler);
    const tracks = data.tracks.filter(track => visible.has(track.kind));
    const collapsed = new Set(state.collapsedPaths ?? []);
    const rows = timelineRows(tracks, collapsed);
    const rowElements = new Map<string, HTMLElement>();
    for (const row of rows) {
      const track = row.track;
      const label = document.createElement("div");
      label.className = "ui-timeline-track-label";
      label.title = track?.label ?? row.label;
      label.dataset.kind = row.kind;
      label.dataset.rowId = row.id;
      label.setAttribute("role", "treeitem");
      label.setAttribute("aria-level", String(row.depth + 1));
      label.setAttribute("aria-label", row.label);
      label.tabIndex = -1;
      label.style.paddingLeft = `${8 + row.depth * 12}px`;
      const toggle = (): void => {
        if (collapsed.has(row.id)) collapsed.delete(row.id); else collapsed.add(row.id);
        state.collapsedPaths = [...collapsed];
        drawTracks();
        [...labelContent.querySelectorAll<HTMLElement>("[data-row-id]")].find(item => item.dataset.rowId === row.id)?.focus({ preventScroll: true });
      };
      const arrow = document.createElement("span");
      arrow.className = "ui-timeline-disclosure";
      arrow.setAttribute("aria-hidden", "true");
      if (row.branch) {
        label.setAttribute("aria-expanded", String(!collapsed.has(row.id)));
        arrow.textContent = collapsed.has(row.id) ? "▸" : "▾";
        label.classList.add("is-branch");
        label.addEventListener("click", toggle, { signal: trackSignal });
      }
      const caption = document.createElement("span");
      caption.className = "ui-timeline-row-caption";
      caption.textContent = row.label;
      label.append(arrow, caption);
      label.addEventListener("focus", () => {
        for (const item of rowElements.values()) item.tabIndex = item === label ? 0 : -1;
      }, { signal: trackSignal });
      label.addEventListener("keydown", event => {
        const index = rows.indexOf(row);
        let next: string | undefined;
        if (event.key === "ArrowDown") next = rows[index + 1]?.id;
        else if (event.key === "ArrowUp") next = rows[index - 1]?.id;
        else if (event.key === "Home") next = rows[0]?.id;
        else if (event.key === "End") next = rows.at(-1)?.id;
        else if (event.key === "ArrowRight") {
          if (row.branch && collapsed.has(row.id)) toggle();
          else if (row.branch) next = rows[index + 1]?.id;
        } else if (event.key === "ArrowLeft") {
          if (row.branch && !collapsed.has(row.id)) toggle(); else next = row.parentID;
        } else if ((event.key === "Enter" || event.key === " ") && row.branch) toggle();
        else return;
        event.preventDefault(); event.stopPropagation();
        if (next) rowElements.get(next)?.focus();
      }, { signal: trackSignal });
      rowElements.set(row.id, label);
      labelContent.append(label);
      const lane = document.createElement("div");
      lane.className = track ? "ui-timeline-lane" : "ui-timeline-lane ui-timeline-group-lane";
      if (track) lane.dataset.trackId = track.id;
      lane.dataset.rowId = row.id;
      for (const key of track?.keyframes ?? []) {
        if (key.frame < data.frameStart || key.frame > data.frameEnd) continue;
        const button = document.createElement("button");
        button.type = "button";
        button.className = "ui-timeline-key";
        button.style.left = `${(key.frame - data.frameStart) * zoom}px`;
        button.setAttribute("aria-label", `${track!.label}: ${key.frame}`);
        button.setAttribute("aria-pressed", String(key.selected));
        button.title = `${track!.label}: ${key.frame}`;
        button.addEventListener("click", event => props.onSelectKeyframe(track!.id, key.id, event.shiftKey || event.metaKey || event.ctrlKey), { signal: trackSignal });
        lane.append(button);
      }
      grid.append(lane);
    }
    const focused = (focusedRow ? rowElements.get(focusedRow) : undefined) ?? rowElements.values().next().value;
    if (focused) {
      focused.tabIndex = 0;
      if (focusedRow) focused.focus({ preventScroll: true });
    }
    labels.scrollTop = scroll.scrollTop;
    if (!tracks.length) {
      const empty = document.createElement("div");
      empty.className = "ui-timeline-empty";
      empty.textContent = "表示するアニメーションがありません";
      grid.append(empty);
    }
    grid.append(playhead);
    drawTicks();
    updateFrame();
    if (hadFocus) {
      const key = [...grid.querySelectorAll("button")].find(button => button.getAttribute("aria-label") === focusedLabel);
      (key ?? rulerElement).focus({ preventScroll: true });
    }
  }
  function updateFrame(): void {
    if (!data) return;
    const value = Number(data.currentFrame.toFixed(2));
    frame.textContent = `${value} / ${data.frameEnd}`;
    play.textContent = data.playing ? "停止" : "再生";
    play.disabled = data.frameEnd <= data.frameStart;
    play.setAttribute("aria-pressed", String(data.playing));
    playhead.style.left = `${(data.currentFrame - data.frameStart) * zoom}px`;
    playhead.hidden = data.currentFrame < data.frameStart || data.currentFrame > data.frameEnd;
    grid.querySelector('[role="slider"]')?.setAttribute("aria-valuenow", String(data.currentFrame));
  }
  scroll.addEventListener("scroll", () => {
    if (labels.scrollTop !== scroll.scrollTop) labels.scrollTop = scroll.scrollTop;
    drawTicks();
  }, { signal });
  labels.addEventListener("scroll", () => {
    if (scroll.scrollTop !== labels.scrollTop) scroll.scrollTop = labels.scrollTop;
  }, { signal });
  const resize = new ResizeObserver(() => {
    labelContent.style.paddingBottom = `${scroll.offsetHeight - scroll.clientHeight}px`;
    labels.scrollTop = scroll.scrollTop;
    drawTicks();
  });
  resize.observe(scroll);
  scroll.addEventListener("wheel", event => {
    if (!event.ctrlKey && !event.metaKey) return;
    event.preventDefault();
    const previous = zoom;
    zoom = Math.max(2, Math.min(64, zoom * (event.deltaY > 0 ? .9 : 1.1)));
    state.zoom = zoom;
    drawTracks();
    scroll.scrollLeft *= zoom / previous;
  }, { signal, passive: false });
  return {
    element,
    setData(value: TimelineData): void {
      data = value;
      visible.clear();
      for (const kind of state.visibleKinds) visible.add(kind);
      for (const [kind, input] of checkboxes) input.checked = visible.has(kind);
      zoom = Math.max(2, Math.min(64, state.zoom));
      split.setRatio(state.trackRatio);
      const next = JSON.stringify([value.frameStart, value.frameEnd, value.tracks, [...visible], zoom, state.collapsedPaths]);
      if (next !== signature) { signature = next; drawTracks(); }
      else updateFrame();
    },
    dispose(): void {
      disposed = true;
      closeSettings();
      controller.abort(); trackController.abort();
      resize.disconnect();
      split.dispose();
      pointer = null; data = null; signature = "";
      element.remove();
    },
  };
}
