import type { Model } from "../../core/project/Model";
import type { Project } from "../../core/project/Project";
import type { Runtime } from "../../core/projectCache/Runtime";
import type { ProjectCache } from "../../core/projectCache/ProjectCache";
import type { AnimaEditor } from "../Editor";
import type { EditorState } from "../editorState/EditorState";
import type { State } from "../editorState/state/State";

// Events must originate at an editor-owned root, never an embedded vertex/bone.
export type PropertyRoot = Model | Runtime<Model> | State<Model> |
  AnimaEditor | Project | ProjectCache | EditorState;
