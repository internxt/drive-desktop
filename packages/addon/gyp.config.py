import json
import os
import glob

gyp_file = "binding.gyp"

def gather_files(pattern, is_directory=False):
    all_paths = set()

    if is_directory:
        matched_paths = [d[0].replace('\\', '/') for d in os.walk(pattern)]
    else:
        matched_paths = [path.replace('\\', '/') for path in glob.glob(pattern, recursive=True)]
    
    all_paths.update(matched_paths)

    return sorted(all_paths)

def update_gyp_file():    
    with open(gyp_file, 'r') as file:
        gyp_data = json.load(file)

    gyp_data["targets"][0]["sources"] = gather_files("native-src/**/*.cpp")
    gyp_data["targets"][0]["include_dirs"] = gather_files("include", is_directory=True)

    with open(gyp_file, 'w') as file:
        json.dump(gyp_data, file, indent=2)

if __name__ == "__main__":
    update_gyp_file()
