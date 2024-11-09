import os
import shutil
import subprocess
import pathlib

CURRENT_PATH = pathlib.Path(__file__).parent.resolve()

GENERATED_PATH = "generated"

DECOMPILER = pathlib.Path(os.path.join(CURRENT_PATH, "mhegd")).resolve()
COMPILED_BINARY_PATH = pathlib.Path(os.path.join(GENERATED_PATH, "app")).resolve()
DECOMPILED_BINARY_PATH = pathlib.Path(os.path.join(GENERATED_PATH, "decompiled")).resolve()

def decompile():
    os.makedirs(DECOMPILED_BINARY_PATH, exist_ok=True)
    mappings = []
    for file in pathlib.Path(COMPILED_BINARY_PATH).rglob("*"):
        if file.name == "img":
            continue

        if file.name != "a":
            extension = file.name.split(".")[1]
            if extension == "png":
                continue

        without_name = file.name.split(".")[0]
        print(file.name)

        if file.name == "a":
            decompiled_file = os.path.join(DECOMPILED_BINARY_PATH, f"{without_name}")
        else:
            decompiled_file = os.path.join(DECOMPILED_BINARY_PATH, f"{without_name}.mhg")
        compiled_file = os.path.join(COMPILED_BINARY_PATH, file.name)
        subprocess.run(f"{DECOMPILER} -o {decompiled_file} {compiled_file}", shell=True)


    return " ".join(mappings)


decompile()
