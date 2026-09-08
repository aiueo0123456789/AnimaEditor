import json
from turtle import mode
from pathlib import Path

def convert_json(json_path):
    json_path = Path(json_path)

    # JSONを読み込む
    with json_path.open("r", encoding="utf-8") as f:
        data = json.load(f)
    models = data["models"]
    for model in models:
        if "vertices" in model:
            vertices = model["vertices"]
            edges = model["edges"]
            for ei, edge in enumerate(edges):
                model["edges"][ei] = {"vertices": edge}

    output_path = json_path.parent / "修正セーブデータ.json"

    with output_path.open("w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f"出力しました: {output_path}")


data = convert_json("/Users/shirakishunsuke/Desktop/tyCapi/output.json")