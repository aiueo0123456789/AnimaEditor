interface ObserverAddInput0 {
  object: any;
  property: string;
}

export interface ObserverAddReturns {
  target: {
    object: any;
    property: string;
  };
  updateFunction: Function;
}

export class Observer {
  private lastValues: WeakMap<object, Map<string, any>>;
  private targets: WeakMap<object, Map<string, Function[]>>;
  // イテレート用に弱参照だけを保持(オブジェクト自体の生存には影響しない)
  private trackedObjects: Set<WeakRef<object>>;
  // GC済みのWeakRefを掃除するためのFinalizationRegistry
  private registry: FinalizationRegistry<WeakRef<object>>;

  constructor() {
    this.lastValues = new WeakMap();
    this.targets = new WeakMap();
    this.trackedObjects = new Set();
    this.registry = new FinalizationRegistry((ref) => {
      this.trackedObjects.delete(ref);
    });
  }

  add(
    target: ObserverAddInput0,
    updateFunction: Function,
    isInitialized = false,
  ): ObserverAddReturns {
    if (!this.targets.has(target.object)) {
      this.targets.set(target.object, new Map());
      const ref = new WeakRef(target.object);
      this.trackedObjects.add(ref);
      this.registry.register(target.object, ref);
    }
    let propertyMap = this.targets.get(target.object);
    if (propertyMap === undefined) {
      propertyMap = new Map();
      this.targets.set(target.object, propertyMap);
    }

    let updateFunctions = propertyMap.get(target.property);
    if (updateFunctions === undefined) {
      updateFunctions = [];
      propertyMap.set(target.property, updateFunctions);
    }

    updateFunctions.push(updateFunction);

    if (isInitialized) updateFunction(target.object[target.property], null, true);
    return {
      target: { object: target.object, property: target.property },
      updateFunction: updateFunction,
    };
  }

  remove(data: ObserverAddReturns): boolean {
    if (this.targets.has(data.target.object)) {
      const propertyMap = this.targets.get(data.target.object);
      if (propertyMap !== undefined) {
        const updateFunctions = propertyMap.get(data.target.property);
        if (updateFunctions !== undefined) {
          if (updateFunctions.includes(data.updateFunction)) {
            updateFunctions.splice(updateFunctions.indexOf(data.updateFunction), 1);
            return true;
          }
        }
      }
    }
    return false;
  }

  update() {
    for (const ref of this.trackedObjects) {
      const object = ref.deref();
      if (object === undefined) {
        // GC済み: 集合からも削除(FinalizationRegistryでも遅延削除されるが即時反映したい場合はここでも消す)
        this.trackedObjects.delete(ref);
        continue;
      }

      const propertys = this.targets.get(object);
      if (propertys === undefined) continue;

      if (!this.lastValues.has(object)) {
        this.lastValues.set(object, new Map());
      }
      const lastValueMap = this.lastValues.get(object)!;

      for (const [propertyKey, updateFunctions] of propertys.entries()) {
        if (!lastValueMap.has(propertyKey)) {
          lastValueMap.set(propertyKey, null);
        }
        const currentValue = object[propertyKey];
        const lastValue = lastValueMap.get(propertyKey);
        const submit = () => {
          for (const updateFunction of updateFunctions) {
            updateFunction(object[propertyKey], lastValue, false);
          }
        };
        if (Array.isArray(lastValue) && Array.isArray(currentValue)) {
          if (lastValue.length !== currentValue.length) {
            submit();
          } else if (!lastValue.every((v, i) => v === currentValue[i])) {
            submit();
          }
          lastValueMap.set(propertyKey, [...currentValue]);
        } else if (lastValue !== currentValue) {
          submit();
          lastValueMap.set(propertyKey, currentValue);
        }
      }
    }
  }
}