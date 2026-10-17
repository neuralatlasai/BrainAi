"""Create the editable Blender source from the deterministic closed ribbon.

Run after `node scripts/author-ribbon.mjs`:
  blender --background --python scripts/blender-author.py

The glTF import preserves vertex correspondence as named Blender shape keys.
The .blend contains the solid mesh, all poses, a studio camera, and lights.
"""
from pathlib import Path
import sys
import bpy
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "assets" / "source"
SOURCE.mkdir(parents=True, exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.context.preferences.filepaths.save_version = 0
bpy.ops.import_scene.gltf(filepath=str(ROOT / "public" / "models" / "ribbon.glb"))
ribbon = next(obj for obj in bpy.context.scene.objects if obj.type == "MESH")
ribbon.name = "Pearl ribbon · closed solid"
for polygon in ribbon.data.polygons:
    polygon.use_smooth = True
if ribbon.data.shape_keys:
    ribbon.data.shape_keys.name = "Authored corresponding poses"
    ribbon.data.shape_keys.key_blocks[0].name = "Hero · basis"
    for key in ribbon.data.shape_keys.key_blocks[1:]:
        key.value = 0
ribbon["topology"] = "Closed solid ribbon. Wave return remains behind the composition."
ribbon["regenerate"] = "node scripts/author-ribbon.mjs; blender --background --python scripts/blender-author.py"

material = bpy.data.materials.new("Pearl mineral · satin studio")
material.use_nodes = True
principled = material.node_tree.nodes.get("Principled BSDF")
principled.inputs["Base Color"].default_value = (0.64, 0.69, 0.70, 1)
principled.inputs["Roughness"].default_value = 0.36
principled.inputs["Metallic"].default_value = 0.24
anisotropy = principled.inputs.get("Anisotropic IOR Level") or principled.inputs.get("Anisotropic")
if anisotropy:
    anisotropy.default_value = 0
# Match the runtime's cool forward shoulder and warm reverse along the UVs.
nodes = material.node_tree.nodes
links = material.node_tree.links
texcoord = nodes.new("ShaderNodeTexCoord")
separate = nodes.new("ShaderNodeSeparateXYZ")
links.new(texcoord.outputs["UV"], separate.inputs["Vector"])
phase = nodes.new("ShaderNodeMath")
phase.operation = "MULTIPLY_ADD"
phase.inputs[1].default_value = 6.28318530718
phase.inputs[2].default_value = 1.02
links.new(separate.outputs["X"], phase.inputs[0])
sine = nodes.new("ShaderNodeMath")
sine.operation = "SINE"
links.new(phase.outputs[0], sine.inputs[0])
factor = nodes.new("ShaderNodeMath")
factor.operation = "MULTIPLY_ADD"
factor.inputs[1].default_value = 0.44
factor.inputs[2].default_value = 0.44
links.new(sine.outputs[0], factor.inputs[0])
pearl = nodes.new("ShaderNodeMixRGB")
pearl.blend_type = "MIX"
pearl.inputs[1].default_value = (0.73, 0.64, 0.52, 1)
pearl.inputs[2].default_value = (0.40, 0.52, 0.60, 1)
links.new(factor.outputs[0], pearl.inputs[0])
links.new(pearl.outputs[0], principled.inputs["Base Color"])
ribbon.data.materials.clear()
ribbon.data.materials.append(material)
reverse_material = material.copy()
reverse_material.name = "Warm pearl reverse face"
reverse_pearl = next(node for node in reverse_material.node_tree.nodes if node.type == "MIX_RGB")
reverse_pearl.inputs[1].default_value = (0.82, 0.72, 0.58, 1)
reverse_pearl.inputs[2].default_value = (0.72, 0.63, 0.51, 1)
ribbon.data.materials.append(reverse_material)
for polygon in ribbon.data.polygons:
    polygon.material_index = 1 if (polygon.index // 2) % 48 < 24 else 0

def point_at(obj, point):
    obj.rotation_euler = (Vector(point) - obj.location).to_track_quat("-Z", "Y").to_euler()

def from_y_up(point):
    return (point[0], -point[2], point[1])

bpy.ops.object.camera_add(location=from_y_up((0.2, 0.65, 12.8)))
camera = bpy.context.object
camera.name = "Hero · reference camera"
camera.data.lens = 46
point_at(camera, from_y_up((0, 0.1, 0)))
bpy.context.scene.camera = camera
for name, position, energy, size in [
    ("Broad warm key", (-4, 5, 5), 1200, 6),
    ("Cool fill", (5, 1, 4), 900, 5),
    ("Upper rim", (1, 5, -3), 1500, 5),
]:
    bpy.ops.object.light_add(type="AREA", location=from_y_up(position))
    light = bpy.context.object
    light.name = name
    light.data.energy = energy
    light.data.shape = "DISK"
    light.data.size = size
    point_at(light, (0, 0, 0))

world = bpy.data.worlds.new("Ivory studio")
world.use_nodes = True
world.node_tree.nodes["Background"].inputs[0].default_value = (0.86, 0.84, 0.79, 1)
world.node_tree.nodes["Background"].inputs[1].default_value = 0.5
bpy.context.scene.world = world
scene = bpy.context.scene
scene.render.engine = "CYCLES"
scene.cycles.samples = 32
scene.render.resolution_x = 1440
scene.render.resolution_y = 1000
scene.render.resolution_percentage = 100
scene.view_settings.view_transform = "AgX"
scene.render.image_settings.file_format = "PNG"
scene.render.filepath = str(SOURCE / "ribbon-hero.png")
bpy.ops.object.select_all(action="DESELECT")
ribbon.select_set(True)
bpy.context.view_layer.objects.active = ribbon
bpy.ops.wm.save_as_mainfile(filepath=str(SOURCE / "ribbon.blend"))
print("Saved editable ribbon with", len(ribbon.data.vertices), "vertices and", len(ribbon.data.shape_keys.key_blocks), "poses")
if "--render-preview" in sys.argv or "--render-closing-preview" in sys.argv or "--render-wave-preview" in sys.argv:
    if "--render-closing-preview" in sys.argv:
        ribbon.data.shape_keys.key_blocks["closing"].value = 1
        camera.location = from_y_up((0, 8, 14))
        point_at(camera, from_y_up((0, -0.5, 0)))
        camera.data.lens = 40
        bpy.ops.mesh.primitive_plane_add(size=200, location=(0, 0, -2.62))
        floor = bpy.context.object
        floor.name = "Preview floor · conceals intact return"
        floor_material = bpy.data.materials.new("Preview ivory floor")
        floor_material.diffuse_color = (0.86, 0.84, 0.79, 1)
        floor.data.materials.append(floor_material)
        scene.render.filepath = str(SOURCE / "ribbon-closing.png")
    elif "--render-wave-preview" in sys.argv:
        ribbon.data.shape_keys.key_blocks["wave"].value = 1
        camera.location = from_y_up((0, 3.5, 18))
        point_at(camera, from_y_up((0, -1.0, -1)))
        camera.data.lens = 26
        bpy.ops.mesh.primitive_plane_add(size=200, location=(0, 0, -2.62))
        floor = bpy.context.object
        floor.name = "Wave review floor"
        floor_material = bpy.data.materials.new("Wave ivory floor")
        floor_material.diffuse_color = (0.86, 0.84, 0.79, 1)
        floor.data.materials.append(floor_material)
        scene.render.filepath = str(SOURCE / "ribbon-wave.png")
    scene.render.resolution_x = 1080
    scene.render.resolution_y = 750
    scene.cycles.samples = 16
    scene.cycles.use_denoising = True
    bpy.ops.render.render(write_still=True)
if "--render-transition-preview" in sys.argv:
    bpy.ops.mesh.primitive_plane_add(size=200, location=(0, 0, -2.62))
    floor = bpy.context.object
    floor.name = "Transition review floor"
    floor_material = bpy.data.materials.new("Transition ivory floor")
    floor_material.diffuse_color = (0.86, 0.84, 0.79, 1)
    floor.data.materials.append(floor_material)
    scene.render.resolution_x = 1008
    scene.render.resolution_y = 700
    scene.cycles.samples = 12
    scene.cycles.use_denoising = True
    camera.data.lens = 46
    for fraction in (0.25, 0.5, 0.75):
        ribbon.data.shape_keys.key_blocks["wave"].value = fraction
        ribbon.scale = (0.92 + 0.2 * fraction,) * 3
        camera.location = from_y_up((0.7 * (1 - fraction), 1.15 + 1.25 * fraction, 20 - 6.6 * fraction))
        point_at(camera, from_y_up((0, 0.15 - 0.4 * fraction, 0)))
        scene.render.filepath = str(SOURCE / ("ribbon-transition-" + str(int(fraction * 100)) + ".png"))
        bpy.ops.render.render(write_still=True)
