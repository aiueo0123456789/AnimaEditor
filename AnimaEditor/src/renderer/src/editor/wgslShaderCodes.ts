import templatesStructViewCameraShader from './shader/templates/struct/ViewCamera.wgsl?raw';
import templatesFunctionUtilShader from './shader/templates/function/util.wgsl?raw';
import viewBackgroundGridShader from '../renderer/ui/view/shader/background/Grid.wgsl?raw';
import viewSceneSprite from '../renderer/ui/view/shader/scene/Sprite.wgsl?raw';
import viewOverlaySpriteVertex from '../renderer/ui/view/shader/overlay/SpriteVertex.wgsl?raw';
import viewOverlaySpriteEdge from '../renderer/ui/view/shader/overlay/SpriteEdge.wgsl?raw';
import viewOverlaySpriteIndices from '../renderer/ui/view/shader/overlay/SpriteIndices.wgsl?raw';
import viewOverlayArmature from '../renderer/ui/view/shader/overlay/Armature.wgsl?raw';
import viewOverlayArmatureVertex from '../renderer/ui/view/shader/overlay/ArmatureVertex.wgsl?raw';
import viewObjectIDSprite from '../renderer/ui/view/shader/objectID/Sprite.wgsl?raw';
import viewObjectIDArmature from '../renderer/ui/view/shader/objectID/Armature.wgsl?raw';
import viewToolRotationOverlay from '../renderer/ui/view/shader/tool/rotation/Overlay.wgsl?raw';
import viewToolTranslateOverlay from '../renderer/ui/view/shader/tool/translate/Overlay.wgsl?raw';

export const wgslShaderCodes = {
  "templates/struct/ViewCamera": templatesStructViewCameraShader,
  "templates/function/util": templatesFunctionUtilShader,
  "view/background/Grid": viewBackgroundGridShader,
  "view/scene/Sprite": viewSceneSprite,
  "view/overlay/SpriteVertex": viewOverlaySpriteVertex,
  "view/overlay/SpriteEdge": viewOverlaySpriteEdge,
  "view/overlay/SpriteIndices": viewOverlaySpriteIndices,
  "view/overlay/Armature": viewOverlayArmature,
  "view/overlay/ArmatureVertex": viewOverlayArmatureVertex,
  "view/objectID/Sprite": viewObjectIDSprite,
  "view/objectID/Armature": viewObjectIDArmature,
  "view/tool/rotation/Overlay": viewToolRotationOverlay,
  "view/tool/translate/Overlay": viewToolTranslateOverlay,
};