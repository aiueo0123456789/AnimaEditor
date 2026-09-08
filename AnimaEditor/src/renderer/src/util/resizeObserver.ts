class HTMLElementResizeObserver {
  private _callbacks: WeakMap<Element, Function>;
  private _observer: ResizeObserver;
  constructor() {
    // WeakMap: 要素がDOMから消えれば自動でGC可能
    this._callbacks = new WeakMap();

    this._observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        this._callbacks.get(entry.target)?.(entry.target);
      }
    });
  }

  public add(htmlElement: Element, fn: Function): void {
    this._callbacks.set(htmlElement, fn);
    this._observer.observe(htmlElement);
  }

  public remove(htmlElement: Element): void {
    this._callbacks.delete(htmlElement);
    this._observer.unobserve(htmlElement);
  }

  public disconnect(): void {
    this._observer.disconnect();
  }
}

export const resizeObserver = new HTMLElementResizeObserver();
