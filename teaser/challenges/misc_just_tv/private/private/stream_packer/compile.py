import os
import shutil
import subprocess
import pathlib

CURRENT_PATH = pathlib.Path(__file__).parent.resolve()

GENERATED_PATH = "generated"
APP_SRC_PATH = pathlib.Path(os.path.join(CURRENT_PATH, "../src")).resolve()
APP_MAIN_PATH =  os.path.join(APP_SRC_PATH, "a")

MHEG_TOOL_PATH = "mheg-tools"
COMPILER_PATH = pathlib.Path(os.path.join(MHEG_TOOL_PATH, "compiler.jar")).resolve()

SCENES = [
    "clock.mheg+",
    "extras.mheg+",
    "main_menu.mheg+",
    "splash_screen.mheg+",
    "tv_overlay.mheg+",
    "weather.mheg+"
]


def create_build_directory():
    if os.path.isdir(GENERATED_PATH):
        shutil.rmtree(GENERATED_PATH)
    os.makedirs(GENERATED_PATH)

def compile_sources(directory):
    source_path = pathlib.Path(os.path.join(GENERATED_PATH, "source")).resolve()
    print("Source compilation...")
    os.makedirs(source_path)

    scenes = " ".join(SCENES)
    subprocess.run(f"java -jar {COMPILER_PATH} -t -p -P -f {APP_MAIN_PATH} -d {source_path} {scenes}", cwd=APP_SRC_PATH, shell=True)

    return source_path

def compile_app(directory):
    target_path = pathlib.Path(os.path.join(GENERATED_PATH, "app")).resolve()
    print("Compilation...")
    os.makedirs(target_path)

    scenes = " ".join(SCENES)
    subprocess.run(f"java -jar {COMPILER_PATH} -a -p -P -f {APP_MAIN_PATH} -d {target_path} {scenes}", cwd=APP_SRC_PATH, shell=True)

    shutil.copytree(os.path.join(APP_SRC_PATH, "img"), os.path.join(target_path, "img"))

    return target_path


create_build_directory()

compile_sources(APP_SRC_PATH)
compile_app(APP_SRC_PATH)
