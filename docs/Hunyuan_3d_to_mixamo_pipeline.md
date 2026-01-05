# Workflow: Hunyuan 3D to Mixamo Pipeline

**Status:** Stable
**Last Updated:** 2026-01-04
**Owner:** Drone Simulator Team

## 1. Overview
This workflow describes the process of converting raw AI-generated 3D models (from Hunyuan 3D / ComfyUI) into rigged, playable characters compatible with Mixamo animations.

**The Problem:**
* Hunyuan outputs `.glb` files.
* Mixamo often rejects `.glb` files or strips their textures upon upload.
* AI models are often composed of multiple disconnected meshes, confusing the auto-rigger.

**The Solution:**
We use a custom Blender Python script to automatedly:
1.  Import the `.glb`.
2.  **Join** all mesh parts into a single object (fixes rigging).
3.  **Embed** textures permanently.
4.  Export a clean `.fbx`.

---

## 2. Prerequisites
* **Blender** (Version 4.0 or higher recommended).
* **Python Script:** `scripts/convert_with_ui.py` (Code provided below).
* **PowerShell** (Terminal).

### The Script (`convert_with_ui.py`)
Save this code in your `scripts/` folder.

```python
import bpy
import sys
import os

# --- Try to import UI File Dialog libraries ---
try:
    import tkinter as tk
    from tkinter import filedialog
    HAS_UI = True
except ImportError:
    HAS_UI = False
    print("\n[!] Blender's Python is missing 'tkinter'. UI dialogs disabled.")
    print("[!] Falling back to terminal input.\n")

def get_files_via_ui():
    root = tk.Tk()
    root.withdraw() 
    root.attributes('-topmost', True) 
    
    print("Waiting for user to select input file...")
    input_path = filedialog.askopenfilename(
        title="Select your Hunyuan .GLB file",
        filetypes=[("GLB files", "*.glb"), ("All files", "*.*")]
    )
    
    if not input_path: return None, None

    default_dir = os.path.dirname(input_path)
    default_name = os.path.splitext(os.path.basename(input_path))[0] + ".fbx"
    
    output_path = filedialog.asksaveasfilename(
        title="Save FBX as...",
        initialdir=default_dir,
        initialfile=default_name,
        defaultextension=".fbx",
        filetypes=[("FBX files", "*.fbx")]
    )
    
    root.destroy()
    return input_path, output_path

def get_files_via_console():
    print("--- Manual Input Mode ---")
    input_path = input("Paste full path to .glb file: ").strip('"').strip("'")
    if not os.path.exists(input_path): return None, None
        
    default_out = os.path.splitext(input_path)[0] + ".fbx"
    use_default = input(f"Press ENTER for {default_out}: ").strip()
    output_path = default_out if use_default == "" else use_default.strip('"').strip("'")
    return input_path, output_path

# --- Execution ---
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete()

if HAS_UI: in_file, out_file = get_files_via_ui()
else: in_file, out_file = get_files_via_console()

if in_file and out_file:
    bpy.ops.import_scene.gltf(filepath=in_file)
    bpy.ops.object.select_all(action='DESELECT')
    meshes = [obj for obj in bpy.context.view_layer.objects if obj.type == 'MESH']
    if meshes:
        bpy.context.view_layer.objects.active = meshes[0]
        for mesh in meshes: mesh.select_set(True)
        bpy.ops.object.join()
    
    bpy.ops.export_scene.fbx(
        filepath=out_file,
        path_mode='COPY',
        embed_textures=True,
        use_selection=True,
        add_leaf_bones=False
    )