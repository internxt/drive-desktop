import json
import os
import glob

def gather_files(patterns, target_name, is_directory=False):
    all_paths = set()

    for pattern in patterns:
        if is_directory:
            matched_paths = [d[0].replace('\\', '/') for d in os.walk(pattern)]
        else:
            matched_paths = [path.replace('\\', '/') for path in glob.glob(pattern, recursive=True)]
        
        all_paths.update(matched_paths)

    return sorted(all_paths)

def update_gyp_file(config):
    target_name = config.get("targets", [{}])[0].get("target_name", "addon")
    
    if not os.path.exists(config["gyp_file"]):
        gyp_data = {
            "targets": [{
                "target_name": target_name,
                "sources": [],
                "include_dirs": []
            }]
        }
    else:
        with open(config["gyp_file"], 'r') as file:
            gyp_data = json.load(file)

    gyp_data["targets"][0]["sources"] = gather_files(config["source_dirs"], target_name)
    gyp_data["targets"][0]["include_dirs"] = gather_files(config["include_dirs"], target_name, is_directory=True)

    with open(config["gyp_file"], 'w') as file:
        json.dump(gyp_data, file, indent=2)

if __name__ == "__main__":
    with open('gyp.config.json', 'r') as config_file:
        config_data = json.load(config_file)
        update_gyp_file(config_data)
