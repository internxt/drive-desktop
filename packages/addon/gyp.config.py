import json
import os
import glob

def warn(message):
    print(f'\033[93m{message}\033[0m')

def info(message):
    print(f'\033[92m{message}\033[0m')

def gather_files(patterns, ignored_patterns, target_name, is_directory=False):
    all_paths = set()

    for pattern in patterns:
        if is_directory:
            matched_paths = [d[0].replace('\\', '/') for d in os.walk(pattern)]
        else:
            matched_paths = [path.replace('\\', '/') for path in glob.glob(pattern, recursive=True)]
        
        if not matched_paths:
            warn(f"No files or directories found for pattern: {pattern}. It will not be configured in the target '{target_name}'.")
        all_paths.update(matched_paths)

    ignored_paths = set()
    for pattern in ignored_patterns:
        if is_directory:
            matched_paths = [d[0].replace('\\', '/') for d in os.walk(pattern)]
        else:
            matched_paths = [path.replace('\\', '/') for path in glob.glob(pattern, recursive=True)]
        
        if not matched_paths:
            warn(f"No files or directories found for ignored pattern: {pattern}. It will not be configured in the target '{target_name}'.")
        ignored_paths.update(matched_paths)

    return sorted(list(all_paths - ignored_paths))

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

    gyp_data["targets"][0]["sources"] = gather_files(config["source_dirs"], config["ignored_source_dirs"], target_name)
    gyp_data["targets"][0]["include_dirs"] = gather_files(config["include_dirs"], config["ignored_include_dirs"], target_name, is_directory=True)

    with open(config["gyp_file"], 'w') as file:
        json.dump(gyp_data, file, indent=2)

    info(f"Updated {config['gyp_file']} successfully!")

if __name__ == "__main__":
    with open('gyp.config.json', 'r') as config_file:
        config_data = json.load(config_file)
        update_gyp_file(config_data)
