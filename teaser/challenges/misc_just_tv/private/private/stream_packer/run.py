import os
import shutil
import subprocess
import pathlib

CURRENT_PATH = pathlib.Path(__file__).parent.resolve()

GENERATED_PATH = "generated"
APP_SRC_PATH = pathlib.Path(os.path.join(CURRENT_PATH, "../src")).resolve()
APP_MAIN_PATH =  os.path.join(APP_SRC_PATH, "a")

MHEG_TOOL_PATH = "mheg-tools"

if os.getenv("SANITY") == "1":
    COMPILED_SOURCE_PATH = pathlib.Path(os.path.join(GENERATED_PATH, "decompiled")).resolve()
else:
    COMPILED_SOURCE_PATH = pathlib.Path(os.path.join(GENERATED_PATH, "source")).resolve()

COMPILED_BINARY_PATH = pathlib.Path(os.path.join(GENERATED_PATH, "app")).resolve()

PLAYER_PATH = pathlib.Path(os.path.join(MHEG_TOOL_PATH, "player.jar")).resolve()

def create_ops():
    return f"-Ddfs-root-dir={COMPILED_BINARY_PATH} -Dmheg-source-root={COMPILED_SOURCE_PATH} -Dmheg.profile=uk.dtt"

def create_mapping():
    mappings = []
    for file in pathlib.Path(COMPILED_BINARY_PATH).rglob("*.asn"):
        without_extension = file.name.split(".")[0]
        mappings.append(f"-Dfile-mapping.//{without_extension}.asn={COMPILED_SOURCE_PATH}/{without_extension}.mhg")

        mappings.append(f"-Dfile-mapping.//a={COMPILED_SOURCE_PATH}/a")

    return " ".join(mappings)

options = create_ops()
mappings = create_mapping()

print(f"java -jar {options} {PLAYER_PATH} ")
subprocess.run(f"java {options} {mappings} -jar  {PLAYER_PATH} ", shell=True)
