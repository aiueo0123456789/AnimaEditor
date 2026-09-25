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
again for future updates (a named factory can refer to itself). This is a full
reset, not keyed reconciliation: focus and local input state are discarded and
active edit sessions are cancelled. New descendants are initialized once.

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
popup. Popups are attached to document.body and removed on close/dispose.

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
