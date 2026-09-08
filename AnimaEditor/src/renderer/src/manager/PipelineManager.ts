import { AnimaEditor } from "../editor/Editor";
import { simpleWebGPU } from "../util/simpleWebGPU";
import { Manager } from "./Manager";

interface ShaderSetting {
  topologyType?: string,
}

interface extractSettingReturn {
  setting: ShaderSetting,
  shaderCode: string
}

function extractSetting(shaderCode: string): extractSettingReturn {
  const regex = /ShaderSetting\s*\{([\s\S]*?)\}/m;
  const match = shaderCode.match(regex);

  let shaderSetting = {};
  let newShader = shaderCode;

  if (match) {
    const blockContent = match[1]; // { } 内の内容だけ
    newShader = shaderCode.replace(match[0], ""); // 元の文字列からブロック削除

    // ShaderSettingをObjectに
    blockContent.split(",").forEach((line) => {
      const parts = line.split(":").map((s) => s.trim());
      if (parts.length === 2) {
        if (parts[1] == "true") shaderSetting[parts[0]] = true;
        else if (parts[1] == "false") shaderSetting[parts[0]] = false;
        else shaderSetting[parts[0]] = parts[1];
      }
    });
  }
  return { setting: shaderSetting, shaderCode: newShader };
}

function extractBind(shaderCode) {
  const bindStrings = [];

  const newShaderCode = shaderCode.replace(/@bind\((.*?)\);/g, (_, p1) => {
    bindStrings.push(p1.trim());
    return "";
  });

  const result = bindStrings.map((bind) =>
    bind
      .split(/(\s*<\s*|\s*>\s*|\s*:\s*)/)
      .map((s) => s.trim())
      .filter(Boolean),
  );
  const bindsData = result.map((bindSplit) => {
    return {
      bindName: bindSplit[0] === "<" ? bindSplit[3] : bindSplit[0],
      struct: bindSplit[0] === "<" ? bindSplit[5] : bindSplit[2],
    };
  });
  return {
    shaderCode: newShaderCode,
    binds: bindsData,
    bindStrings: bindStrings,
  };
}

function generateBind(binds) {
  const shaderCode = binds
    .map((bind, index) => `@group(0) @binding(${index}) var ${bind};`)
    .join("\n");
  return { shaderCode: shaderCode };
}

function extractFlagmentOutputs(code: string): string[] {
  const regex = new RegExp(`struct\\s+FOutput\\s*\\{([\\s\\S]*?)\\}`, "m");

  const match = code.match(regex);
  if (!match) return [];

  return match[1]
    .split(",")
    .map((v) => v.trim())
    .filter((v) => v.length > 0)
    .map((x) => {
      const struct = x.match(/:\s*(.*)/)[1];
      if (struct == "vec4<f32>") {
        return simpleWebGPU.preferredCanvasFormat;
      } else if (struct == "u32") {
        return "r32uint";
      }
    });
}

function createPipeline(shader: GPUShaderModule, vertexInputs: [], flagmentOutputs: string[], shaderSetting: ShaderSetting) {
  const createPipelineObject: GPURenderPipelineDescriptor = {
    layout: "auto",
    vertex: {
      module: shader,
      entryPoint: "vmain",
      buffers: vertexInputs,
    },
    fragment: {
      module: shader,
      entryPoint: "fmain",
      targets: flagmentOutputs.map((format) => {
        if (format == "r32uint") {
          return {
            format: format,
          };
        } else {
          return {
            format: format,
            blend: {
              color: {
                srcFactor: "src-alpha",
                dstFactor: "one-minus-src-alpha",
                operation: "add",
              },
              alpha: {
                srcFactor: "src-alpha",
                dstFactor: "one-minus-src-alpha",
                operation: "add",
              },
            },
          };
        }
      }),
    },
    primitive: {
      topology:
        shaderSetting.topologyType === "list"
          ? "triangle-list"
          : "triangle-strip",
    },
  };
  console.log("パイプライン作成時のオブジェクト", createPipelineObject);
  return simpleWebGPU.device.createRenderPipeline(createPipelineObject);
}

/** inputの書き方
{
  vertexBuffers: [
    {location: 0, source: "VERTEX"},
    {location: 1, source: "TEXCOORD"},
  ],
}
 */
export class RenderPipeline {
  public vertexBuffers: any[];
  public shaderSetting: ShaderSetting;
  public shaderCode: string;
  public outputs: string[];
  public shaderModel: GPUShaderModule;
  public pipeline: GPURenderPipeline;
  public groupLayout: GPUBindGroupLayout;

  constructor(shader: string, input: {vertexBuffers: []} = { vertexBuffers: [] }) {
    this.vertexBuffers = input.vertexBuffers;

    const settingAnalysisResult = extractSetting(shader);
    this.shaderSetting = settingAnalysisResult.setting;
    const bindsAnalysisResult = extractBind(settingAnalysisResult.shaderCode);
    // this.materialProperties = bindsAnalysisResult.binds.map((bind) => bind);
    const generateBindResult = generateBind(bindsAnalysisResult.bindStrings);
    this.shaderCode = simpleWebGPU.importResolution(
      `${generateBindResult.shaderCode}\n${bindsAnalysisResult.shaderCode}`,
    );
    this.outputs = extractFlagmentOutputs(this.shaderCode);
    this.shaderModel = simpleWebGPU.createShaderModule(this.shaderCode);
    this.pipeline = createPipeline(
      this.shaderModel,
      this.vertexBuffers.map((vertexBuffer) => {
        let format = "";
        let byteSize = 0;
        if (vertexBuffer.source == "VERTEX") {
          format = "float32x2";
          byteSize = 2 * 4;
        } else if (vertexBuffer.source == "TEXCOORD") {
          format = "float32x2";
          byteSize = 2 * 4;
        }
        return {
          arrayStride: byteSize,
          attributes: [
            {
              shaderLocation: vertexBuffer.location,
              format: format,
              offset: 0,
            },
          ],
        };
      }),
      this.outputs,
      this.shaderSetting,
    );
    this.groupLayout = this.pipeline.getBindGroupLayout(0);
  }
}

export class PipelineManager extends Manager {
  private pipelines: Map<string, RenderPipeline>;
  constructor(editor: AnimaEditor) {
    super(editor);
    this.pipelines = new Map();
  }

  createRenderPipeline(shader, vertexInputs) {
    return new RenderPipeline(shader, vertexInputs);
  }

  getPipelineByID(id: string): RenderPipeline | null {
    const pipeline = this.pipelines.get(id);
    if (pipeline) return pipeline;
    else return null;
  }

  addPipeline(id: string, pipeline: RenderPipeline) {
    this.pipelines.set(id, pipeline);
    return id;
  }
}
