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
    # Create invisible root window
    root = tk.Tk()
    root.withdraw() # Hide the main window
    root.attributes('-topmost', True) # Force dialog to front
    
    # 1. Select Input
    print("Waiting for user to select input file...")
    input_path = filedialog.askopenfilename(
        title="Select your Hunyuan .GLB file",
        filetypes=[("GLB files", "*.glb"), ("All files", "*.*")]
    )
    
    if not input_path:
        print("No input file selected. Exiting.")
        return None, None

    # 2. Select Output (Default to same folder, changing extension)
    default_dir = os.path.dirname(input_path)
    default_name = os.path.splitext(os.path.basename(input_path))[0] + ".fbx"
    
    print("Waiting for user to select output location...")
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
    # Clean up quotes if user copies as "Path"
    input_path = input("Paste full path to .glb file: ").strip('"').strip("'")
    
    if not os.path.exists(input_path):
        print(f"Error: File not found: {input_path}")
        return None, None
        
    # Auto-generate output path suggestion
    default_out = os.path.splitext(input_path)[0] + ".fbx"
    print(f"\nDefault output: {default_out}")
    use_default = input("Press ENTER to use default, or type new path: ").strip()
    
    if use_default == "":
        output_path = default_out
    else:
        output_path = use_default.strip('"').strip("'")
        
    return input_path, output_path

# --- Main Logic ---

# 1. Clean Scene
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete()

# 2. Get Paths
if HAS_UI:
    in_file, out_file = get_files_via_ui()
else:
    in_file, out_file = get_files_via_console()

if in_file and out_file:
    # 3. Import
    print(f"Importing: {in_file}")
    bpy.ops.import_scene.gltf(filepath=in_file)

    # 4. Join Meshes (Fixes Mixamo issues)
    print("Cleaning mesh...")
    bpy.ops.object.select_all(action='DESELECT')
    meshes = [obj for obj in bpy.context.view_layer.objects if obj.type == 'MESH']
    
    if meshes:
        bpy.context.view_layer.objects.active = meshes[0]
        for mesh in meshes:
            mesh.select_set(True)
        bpy.ops.object.join()
    
    # 5. Export
    print(f"Exporting to: {out_file}")
    bpy.ops.export_scene.fbx(
        filepath=out_file,
        path_mode='COPY',
        embed_textures=True,
        use_selection=True,
        add_leaf_bones=False
    )
    print("Done!")