import type { EditorEvent } from "../../EventManager";

export interface Binding<T> {
  readonly kind: "binding";
  readonly observeEvents?: readonly EditorEvent[];
  readonly read: () => T;
}

export type Value<T> = T | Binding<T>;

export function bind<T>(options: Omit<Binding<T>, "kind">): Binding<T> {
  return Object.freeze({
    kind: "binding",
    read: options.read,
    observeEvents: Object.freeze([...(options.observeEvents ?? [])]),
  });
}

export function isBinding<T>(value: Value<T>): value is Binding<T> {
  return typeof value === "object" && value !== null && "kind" in value && value.kind === "binding";
}
