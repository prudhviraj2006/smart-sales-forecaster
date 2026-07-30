"""
Deploy script: Upload all files from hf_deploy/ to the HuggingFace Space prudhvi17/smartsales-api
"""
import os
from huggingface_hub import HfApi

api = HfApi()
repo_id = "prudhvi17/smartsales-api"
deploy_dir = r"d:\SPIC7A27\web app\AISalesForecasterzip-2zip\hf_deploy"

# Collect all files to upload
files_to_upload = []
for root, dirs, files in os.walk(deploy_dir):
    # Skip hidden directories like .cache
    dirs[:] = [d for d in dirs if not d.startswith('.')]
    for f in files:
        local_path = os.path.join(root, f)
        # Path relative to deploy_dir (this becomes the path in the repo)
        rel_path = os.path.relpath(local_path, deploy_dir).replace("\\", "/")
        files_to_upload.append((local_path, rel_path))

print(f"Uploading {len(files_to_upload)} files to {repo_id}...")
for local, remote in files_to_upload:
    print(f"  {remote}")

# Delete all existing files first (clean deploy)
existing_files = api.list_repo_files(repo_id, repo_type="space")
# Filter out .gitattributes
existing_files = [f for f in existing_files if f != ".gitattributes"]

if existing_files:
    print(f"\nDeleting {len(existing_files)} old files...")
    operations = []
    from huggingface_hub import CommitOperationDelete, CommitOperationAdd
    for f in existing_files:
        operations.append(CommitOperationDelete(path_in_repo=f))
    
    # Add new files
    for local_path, rel_path in files_to_upload:
        operations.append(CommitOperationAdd(
            path_in_repo=rel_path,
            path_or_fileobj=local_path,
        ))
    
    api.create_commit(
        repo_id=repo_id,
        repo_type="space",
        operations=operations,
        commit_message="Deploy latest backend code with all routes, services, and TinyLlama chat"
    )
else:
    # Just upload
    api.upload_folder(
        folder_path=deploy_dir,
        repo_id=repo_id,
        repo_type="space",
        commit_message="Deploy latest backend code with all routes, services, and TinyLlama chat"
    )

print("\n✅ Deployment complete!")
print(f"🌐 Space URL: https://huggingface.co/spaces/{repo_id}")
print(f"🔗 API URL: https://prudhvi17-smartsales-api.hf.space")
