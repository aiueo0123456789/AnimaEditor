// interface ObserverAddInput0 {
//   object: any,
//   property: string
// }

// export interface ObserverAddReturns {
//   target: {
//     object: any,
//     property: string
//   },
//   updateFunction: Function
// }

// // 変更を監視したい
// export class Observer {
//   private lastValues: Map<string, any>;
//   private targets: Map<any, Map<string, Function[]>>;
//   constructor() {
//     this.lastValues = new Map();
//     /** @type {Map<any, Map<any, Function[]>>} */
//     this.targets = new Map();
//   }

//   add(target: ObserverAddInput0, updateFunction: Function, isInitialized = false): ObserverAddReturns {
//     if (!this.targets.has(target.object)) {
//       this.targets.set(target.object, new Map());
//     }
//     let propertyMap = this.targets.get(target.object);
//     if (propertyMap === undefined) {
//       propertyMap = new Map();
//       this.targets.set(target.object, propertyMap);
//     }

//     let updateFunctions = propertyMap.get(target.property);
//     if (updateFunctions === undefined) {
//       updateFunctions = [];
//       propertyMap.set(target.property, updateFunctions);
//     }

//     updateFunctions.push(updateFunction);

//     if (isInitialized)
//       updateFunction(target.object[target.property], null, true);
//     return {
//       target: { object: target.object, property: target.property },
//       updateFunction: updateFunction,
//     };
//   }

//   remove(data: ObserverAddReturns): boolean {
//     if (this.targets.has(data.target.object)) {
//       let propertyMap = this.targets.get(data.target.object);
//       if (propertyMap !== undefined) {
//         const updateFunctions = propertyMap.get(data.target.property);
//         if (updateFunctions !== undefined) {
//           if (updateFunctions.includes(data.updateFunction)) {
//             updateFunctions.splice(
//               updateFunctions.indexOf(data.updateFunction),
//               1,
//             );
//             return true;
//           }
//         }
//       }
//     }
//     return false;
//   }

//   update() {
//     for (const [object, propertys] of this.targets.entries()) {
//       if (!this.lastValues.has(object)) {
//         this.lastValues.set(object, new Map());
//       }
//       const lastValueMap = this.lastValues.get(object);
//       for (const [propertyKey, updateFunctions] of propertys.entries()) {
//         if (!lastValueMap.has(propertyKey)) {
//           lastValueMap.set(propertyKey, null);
//         }
//         const currentValue = object[propertyKey];
//         const lastValue = lastValueMap.get(propertyKey);
//         const submit = () => {
//           for (const updateFunction of updateFunctions) {
//             updateFunction(object[propertyKey], lastValue, false);
//           }
//         };
//         if (Array.isArray(lastValue) && Array.isArray(currentValue)) {
//           if (lastValue.length !== currentValue.length) {
//             // 数が違う
//             submit();
//           } else if (!lastValue.every((v, i) => v === currentValue[i])) {
//             // 順番または内容が違う
//             submit();
//           }
//           lastValueMap.set(propertyKey, [...currentValue]);
//         } else if (lastValue !== currentValue) {
//           // 更新があった場合
//           submit();
//           lastValueMap.set(propertyKey, currentValue);
//         }
//       }
//     }
//   }
// }