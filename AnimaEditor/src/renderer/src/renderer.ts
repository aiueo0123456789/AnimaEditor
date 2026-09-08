
import { ModelNames } from "./core/project/Project";
import { AnimaEditor } from "./editor/Editor";
import { projectLoad } from "./editor/serialization/Load";

const app = new AnimaEditor();
app.start();

// app.addTexture({
//   modelName: ModelNames.Texture,
//   id: "aurora",
//   name: "カピバラ",
//   image: "/Users/shirakishunsuke/Downloads/Arcana Aurora.jpeg",
// });
// app.addTexture({
//   modelName: ModelNames.Texture,
//   id: "raiden",
//   name: "特別支援生徒",
//   image: "/Users/shirakishunsuke/Downloads/140222796_p0_master1200.jpg",
// });
// app.addTexture({
//   modelName: ModelNames.Texture,
//   id: "ireria",
//   name: "ニゲル",
//   image: "/Users/shirakishunsuke/Downloads/488086935_1074921201320372_4636242532316383732_n.jpg",
// });

// const armature0 = app.addArmature({
//   modelName: ModelNames.Aramature,
//   name: "アーマチュア",
//   id: "armature0",
//   bones: [
//     { head: [0, 0], tail: [0, 50], name: "ボーン0", id: "bone0" },
//     { head: [0, 50], tail: [0, 100], parentID: {aramatureID: "armature0", boneID: "bone0"}, name: "ボーン1", id: "bone1" },
//   ],
// });

// const animation0 = app.addAnimation({
//   modelName: ModelNames.Animation,
//   name: "bonePositionAnimation0",
//   targetID: {aramatureID: "armature0", boneID: "bone0"},
//   path: "animation.rotation",
//   keyframes: [
//     {frame: 0, value: 0},
//     {frame: 10, value: 1},
//   ],
// });

// const animation1 = app.addAnimation({
//   modelName: ModelNames.Animation,
//   name: "bonePositionAnimation1",
//   targetID: {aramatureID: "armature0", boneID: "bone1"},
//   // path: "animation.position.1",
//   path: "animation.rotation",
//   keyframes: [
//     {frame: 0, value: 0},
//     {frame: 10, value: 1}
//   ],
// });

// app.addSprite({
//   modelName: ModelNames.Sprite,
//   name: "テスト",
//   textureID: {modelID: "raiden"},
//   vertices: [
//     [-100, 100],
//     [100, 100],
//     [100, -100],
//     [-100, -100],
//     [0, 0],
//   ],
//   edges: [
//     [0, 1],
//     [1, 2],
//     [2, 3],
//     [3, 0],
//   ],
//   boneWeights: [
//     {
//       boneID: {
//         aramatureID: "armature0",
//         boneID: "bone0",
//       },
//       weights: [0, 0, 1, 1,  0.5],
//     },
//     {
//       boneID: {
//         aramatureID: "armature0",
//         boneID: "bone1",
//       },
//       weights: [1, 1, 0, 0, 0.5],
//     },
//   ],
//   textureRect: {
//     min: [-100, -100],
//     max: [100, 100],
//   },
// });

console.log(app)