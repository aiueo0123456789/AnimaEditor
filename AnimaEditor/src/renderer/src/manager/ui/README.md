# Managed widget trees

UIManager owns widget lifetimes through WidgetTree. DOMRenderer creates one
element at a time and does not own editor subscriptions or child lifetimes.

Every widget accepts observeEvents: readonly EditorEvent[]. Binding-level
observeEvents are optional and use the same type. UIManager.submitEvent uses
its existing source/type/path matching, including SourceContext resolution and
the empty path wildcard, to mark elements dirty. At the end of updateLate,
dirty ancestors update before descendants, with each element updated once.
Parent refreshes propagate to all children regardless of their own conditions.

Normal refresh reads bindings into existing DOM, preserving active input drafts.
Use rebuild: () => Widget for structural changes: an update then disposes the
subtree and installs the returned definition. Return observeEvents and rebuild
again for future updates (a named factory can refer to itself). Focus and input
drafts are discarded and active edit sessions are cancelled. Scroll positions
and resizable List heights are restored for widgets with the same type and key;
unkeyed widgets match by their structural position. New descendants are
initialized once.

UIManager.mountWidget(parent, widget) returns an opaque handle containing no
element references. UIManager.invalidateWidget(handle) schedules a refresh.
UIManager.resetWidget(handle, optionalNewDefinition) immediately recreates the
subtree, preserving its handle and sibling order. UIManager.disposeWidget(handle)
permanently removes it. UIManager.disposeWidgets() releases all roots.

Disposal recursively removes DOM, listeners, binding refreshers, dirty entries,
and manager registrations. Removing DOM manually is not disposal. Dispose panels
when closing them and all roots when shutting down the UI. JTag is unchanged.

UI writes use onChange/onBegin/onCommit/onCancel callbacks to issue commands.
Capture targets on begin and undo previews on cancel. Text/number inputs preserve
IME and partial drafts. Icons are provided via DOMRendererOptions.createIcon.

## Hierarchy and Select

Hierarchy accepts items (id, label, optional children/selectable/renamable),
selected, and filter. All three can be bindings. IDs must be unique in a tree.
onSelect receives an ID; onRename receives the ID and committed name. Arrow
keys navigate/expand/collapse, Enter selects, and F2/double-click edits a name.
Item refresh preserves expansion and selection; resetting the widget does not.

Select renders a custom combobox/listbox, not native select/option elements.
Arrow keys, Home/End, and typeahead move the active option; Enter commits and
Escape cancels. Disabled options are skipped. Tab/outside click closes the
popup. Popups are attached to document.body (or their owning context menu)
and removed on close/dispose.

## Context Menus

Every widget accepts contextMenu, either a ContextMenu definition or a builder
receiving the MouseEvent. The closest configured child wins over its ancestors.
A builder returning null suppresses ancestor menus and leaves the native menu.
The renderer owns each manager and disposes it with the widget.

```ts
Section({ title: "Objects", children: [],
  contextMenu: event => ContextMenu({ children: [
    Button({ label: "Delete", onPress: () => deleteSelection() }),
    Submenu({ label: "Transform", children: [
      Button({ label: "Reset", onPress: () => resetTransform() }),
    ] }),
  ] }),
});
```

ContextMenu and Submenu accept ordinary WidgetChild children, including builders,
sections and inputs. Button actions dismiss the menu; inputs and Select do not.
Submenus open on hover/click or ArrowRight, and close with ArrowLeft/Escape.
Outside pointer/focus, Escape, window blur/resize, panel scrolling and disposal
dismiss the root menu. Only one manager can display a menu at a time.
Timeline also accepts hierarchyContextMenu and keyframesContextMenu for the
left tree and right frame area respectively. These override its contextMenu.
Builders can inspect event.target to determine the clicked row/keyframe.
Menu widgets are mounted through UIManager, so events, subtree rebuilding and
recursive cleanup use the same lifecycle as other widgets.

Styles are in assets/widgets.css and loaded after the legacy JTag styles.
For an isolated browser preview run Vite from the repository root and open
/tests/ui/widgets.html. tests/ui/widgets.test.cjs runs the Playwright regression
checks (requires Playwright, with optional CHROMIUM_PATH/UI_PREVIEW_URL).

## Timeline

Timeline is a managed widget with data/onPlay/onSeek/onSelectKeyframe props.
UIComponent_Timeline resolves animation target references into armature, sprite,
or other tracks and invalidates the widget through UIManager each frame, since
playback updates the runtime directly. The control only patches the frame and
playhead during playback; structural track changes rebuild its owned rows.
Legacy Observer subscriptions are no longer used by the timeline.

The settings popup filters those target kinds independently. Filters and zoom
persist while mounted. Ruler drag/arrow keys seek, Shift/Ctrl/Meta-click extends
keyframe selection, and Ctrl/Meta-wheel zooms. Popup, pointer listeners and resize
observers are released with the widget. Tests: tests/ui/timeline.test.cjs.
