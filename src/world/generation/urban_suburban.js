
export function generateUrbanSuburbanMap() {
    const objects = [];

    const MAP_SIZE = 2000;
    const HALF_SIZE = MAP_SIZE / 2;
    const DOWNTOWN_SIZE = 1200; // 1.2km center
    const DOWNTOWN_HALF = DOWNTOWN_SIZE / 2;

    const ARTERIAL_SPACING = 400;
    const STREET_SPACING = 100;
    const SUBURB_BLOCK_SIZE = 200;

    const ROADS_Y = 0.05;

    // Helper to track valid road segments to prevent floating intersection props
    // Keys: "v_X_Z" or "h_X_Z" where Z/X is the center of the 100m/200m block?
    // Let's store presence at specific coordinate points (intersections).
    // If a road covers (x,z), we add it.
    const activeRoadPoints = new Set();

    function addRoadPoint(x, z) {
        activeRoadPoints.add(`${x},${z}`);
    }

    function hasRoadPoint(x, z) {
        return activeRoadPoints.has(`${x},${z}`);
    }

    // Helper to check zones
    function getZone(x, z) {
        if (Math.abs(x) <= DOWNTOWN_HALF && Math.abs(z) <= DOWNTOWN_HALF) {
            return 'downtown';
        }
        return 'suburbs';
    }

    // --- 1. Road Network ---
    const verticalRoads = []; // x coords
    const horizontalRoads = []; // z coords

    // We generate a grid.
    // Downtown: Grid every 100m.
    // Suburbs: Grid every 200m (aligned with downtown grid).
    // Arterials: Every 400m (x and z).

    // Generate coordinates
    for (let x = -HALF_SIZE; x <= HALF_SIZE; x += 100) {
        // Filter: Keep if arterial, or if downtown, or if suburb block aligned
        const isArterial = (x % ARTERIAL_SPACING === 0);
        const isDowntown = Math.abs(x) <= DOWNTOWN_HALF;
        const isSuburbBlock = (x % SUBURB_BLOCK_SIZE === 0);

        if (isArterial || isDowntown || isSuburbBlock) {
            // We need to define the segment.
            // For simplicity, we create full length roads, but we vary width based on zone?
            // "Arterial_Road_Asset" (4 lanes) for main avenues.
            // "City_Street_Asset" (2 lanes) for cross streets.
            // If we make one long road, it has constant width.
            // So we should split roads into segments or use long roads if width is constant.
            // Arterials are constant width 22.
            if (isArterial) {
                // Full length arterial
                objects.push({
                    type: 'road',
                    params: { width: 22, length: MAP_SIZE },
                    position: { x: x, y: ROADS_Y, z: 0 },
                    rotation: { x: 0, y: 0, z: 0 }
                });
                verticalRoads.push({ x: x, type: 'arterial' });
            } else {
                // Secondary road.
                // Downtown: width 12.
                // Suburbs: width 10.
                // Since it spans both, we might need to split or just pick one.
                // Let's split at Downtown boundary for visual distinction?
                // Or just use 12 for continuity.
                // Prompt says: "Suburban Logic: ... Residential_Road_Asset".
                // Let's try to split segments to be precise.

                // Segments: -1000 to -600 (Suburb), -600 to 600 (Downtown), 600 to 1000 (Suburb).

                // If it is NOT an arterial, we check logic:
                // 1. If inside Downtown X-range:
                //    - Create 'city' road in center (Z: -600 to 600).
                //    - Create 'residential' roads in Suburb parts (Z < -600, Z > 600) ONLY if it aligns with Suburb grid?
                //      Actually prompt says "transition the grid into a looser layout".
                //      So let's extend the 100m grid into suburbs as 200m grid.
                //      Since x is multiple of 100.
                //      If x % 200 == 0, we can extend to suburbs.
                //      If x % 100 != 0 (wait loop is +=100), if not % 200, we only build in Downtown.

                const segments = [];

                if (Math.abs(x) <= DOWNTOWN_HALF) {
                    // Downtown part
                    segments.push({ z: 0, len: DOWNTOWN_SIZE, type: 'city' });

                    // Suburb extensions (Top/Bottom) if aligned to 200m grid
                    if (x % SUBURB_BLOCK_SIZE === 0) {
                        // Top (-1000 to -600, center -800, len 400)
                        // Break into 200m chunks for cul-de-sac randomness
                        // Range -1000 to -600. Blocks centers: -900, -700.
                        [-900, -700].forEach(z => {
                            if (Math.random() > 0.1) { // 10% chance to skip (cul-de-sac/gap)
                                segments.push({ z: z, len: 200, type: 'residential' });
                            }
                        });

                        // Bottom (600 to 1000, center 800, len 400)
                        // Centers: 700, 900
                        [700, 900].forEach(z => {
                            if (Math.random() > 0.1) {
                                segments.push({ z: z, len: 200, type: 'residential' });
                            }
                        });
                    }

                    verticalRoads.push({ x: x, type: 'mixed' });
                } else {
                    // Purely Suburb X-range
                    // Only build if aligned to 200m grid
                    if (x % SUBURB_BLOCK_SIZE === 0) {
                        // Break into 200m chunks across MAP_SIZE (-1000 to 1000)
                        for (let z = -MAP_SIZE/2 + 100; z < MAP_SIZE/2; z += 200) {
                            if (Math.random() > 0.15) { // 15% chance to skip
                                segments.push({ z: z, len: 200, type: 'residential' });
                            }
                        }
                        verticalRoads.push({ x: x, type: 'residential' });
                    }
                }

                segments.forEach(seg => {
                    const width = seg.type === 'city' ? 12 : 10;
                    objects.push({
                        type: 'road',
                        params: { width: width, length: seg.len },
                        position: { x: x, y: ROADS_Y, z: seg.z },
                        rotation: { x: 0, y: 0, z: 0 }
                    });

                    // Mark grid points covered by this segment
                    // seg.len is 200 or 400 or DOWNTOWN_SIZE (1200).
                    // We need to mark every 100m interval or just the intersection points?
                    // Intersections happen at grid nodes (multiples of 100).
                    const startZ = seg.z - seg.len/2;
                    const endZ = seg.z + seg.len/2;
                    for (let z = startZ; z <= endZ; z += 100) {
                        // Avoid double marking endpoints if they overlap? Set handles it.
                        // We check "is there a road at this intersection point?"
                        // Rounding to safe integers
                        const pz = Math.round(z);
                        // Range check inclusivity
                        if (pz >= startZ && pz <= endZ) {
                            addRoadPoint(x, pz);
                        }
                    }
                });
            }
        }
    }

    // Repeat for Horizontal (Z)
    for (let z = -HALF_SIZE; z <= HALF_SIZE; z += 100) {
        const isArterial = (z % ARTERIAL_SPACING === 0);
        const isDowntown = Math.abs(z) <= DOWNTOWN_HALF;
        const isSuburbBlock = (z % SUBURB_BLOCK_SIZE === 0);

        if (isArterial) {
            objects.push({
                type: 'road',
                params: { width: 22, length: MAP_SIZE },
                position: { x: 0, y: ROADS_Y, z: z },
                rotation: { x: 0, y: Math.PI / 2, z: 0 }
            });
            horizontalRoads.push({ z: z, type: 'arterial' });
        } else {
            if (Math.abs(z) <= DOWNTOWN_HALF || isSuburbBlock) {
                 const segments = [];
                 if (Math.abs(z) <= DOWNTOWN_HALF) {
                     segments.push({ x: 0, len: DOWNTOWN_SIZE, type: 'city' });

                     // Suburbs (Left/Right)
                     [-900, -700].forEach(x => {
                         if (Math.random() > 0.1) segments.push({ x: x, len: 200, type: 'residential' });
                     });
                     [700, 900].forEach(x => {
                         if (Math.random() > 0.1) segments.push({ x: x, len: 200, type: 'residential' });
                     });
                 } else {
                     if (z % SUBURB_BLOCK_SIZE === 0) {
                         // Full suburb horizontal strip
                         for (let x = -MAP_SIZE/2 + 100; x < MAP_SIZE/2; x += 200) {
                            if (Math.random() > 0.15) {
                                segments.push({ x: x, len: 200, type: 'residential' });
                            }
                        }
                     }
                 }

                 segments.forEach(seg => {
                    const width = seg.type === 'city' ? 12 : 10;
                    objects.push({
                        type: 'road',
                        params: { width: width, length: seg.len },
                        position: { x: seg.x, y: ROADS_Y, z: z },
                        rotation: { x: 0, y: Math.PI / 2, z: 0 }
                    });

                    // Mark grid points
                    const startX = seg.x - seg.len/2;
                    const endX = seg.x + seg.len/2;
                    for (let x = startX; x <= endX; x += 100) {
                        const px = Math.round(x);
                        if (px >= startX && px <= endX) {
                            addRoadPoint(px, z);
                        }
                    }
                });

                horizontalRoads.push({ z: z, type: Math.abs(z) <= DOWNTOWN_HALF ? 'mixed' : 'residential' });
            }
        }
    }

    // --- 2. Intersections & Infrastructure ---
    // Iterate all crossing points
    verticalRoads.forEach(v => {
        horizontalRoads.forEach(h => {
            const x = v.x;
            const z = h.z;

            // Check if BOTH roads exist at this intersection using tracked points
            // Note: Arterials (infinite length in logic above) might not be fully tracked by segments loop?
            // Wait, logic above: "if (isArterial) { ... params: { length: MAP_SIZE } ... }"
            // I need to add tracking for arterials too.
            // Actually, arterials are pushed to objects but NOT to segments list in previous code.
            // They are handled in the `if (isArterial)` block.

            // Checking logic in loop:
            // if (isArterial) { ... push object ... verticalRoads.push ... }
            // So they didn't call addRoadPoint.
            // I need to account for them.
            // Arterials span the whole map (-1000 to 1000).

            let vExists = hasRoadPoint(x, z);
            if (v.type === 'arterial') vExists = true; // Arterials span everything

            let hExists = hasRoadPoint(x, z);
            if (h.type === 'arterial') hExists = true;

            if (!vExists || !hExists) return;

            const zone = getZone(x, z);

            // Determine intersection type
            const vIsArt = (x % ARTERIAL_SPACING === 0);
            const hIsArt = (z % ARTERIAL_SPACING === 0);

            if (vIsArt && hIsArt) {
                // Traffic Light at 4-lane Intersections
                const offset = 14;
                objects.push({
                    type: 'trafficLight',
                    position: { x: x - offset, y: 0, z: z - offset },
                    rotation: { x: 0, y: 0, z: 0 }
                });
                objects.push({
                    type: 'trafficLight',
                    position: { x: x + offset, y: 0, z: z + offset },
                    rotation: { x: 0, y: Math.PI, z: 0 }
                });
                objects.push({
                    type: 'streetLight',
                    position: { x: x - offset, y: 0, z: z + offset },
                    rotation: { x: 0, y: Math.PI/2, z: 0 }
                });
                objects.push({
                    type: 'streetLight',
                    position: { x: x + offset, y: 0, z: z - offset },
                    rotation: { x: 0, y: -Math.PI/2, z: 0 }
                });

            } else {
                // Minor intersection (or mixed)
                // Calculate dynamic offset to avoid collision with wider road
                const vHalf = vIsArt ? 11 : (zone === 'downtown' ? 6 : 5);
                const hHalf = hIsArt ? 11 : (zone === 'downtown' ? 6 : 5);
                const offset = Math.max(vHalf, hHalf) + 3; // 3m margin

                // Request: "stop sign prefabs". Using ConstructionBarrier.
                objects.push({
                    type: 'constructionBarrier',
                    position: { x: x - offset, y: 0, z: z - offset },
                    rotation: { x: 0, y: 0, z: 0 }
                });
                objects.push({
                    type: 'constructionBarrier',
                    position: { x: x + offset, y: 0, z: z + offset },
                    rotation: { x: 0, y: Math.PI, z: 0 }
                });

                // Street Lamps at corners
                if (zone === 'downtown' || (zone === 'suburbs' && Math.random() > 0.5)) {
                   objects.push({ type: 'streetLight', position: { x: x - offset, y: 0, z: z + offset } });
                }
            }
        });
    });

    // Power Lines (Poles) along Arterials
    // Parallel to Arterial Roads.
    // Offset 15m from center.
    // Place every 40m.
    verticalRoads.forEach(v => {
        if (v.type === 'arterial') {
            for (let z = -HALF_SIZE; z < HALF_SIZE; z += 50) {
                 if (Math.abs(z % ARTERIAL_SPACING) < 20) continue; // Skip intersection area
                 objects.push({
                     type: 'powerPole',
                     position: { x: v.x + 16, y: 0, z: z },
                     rotation: { x: 0, y: 0, z: 0 } // Aligned with road
                 });
            }
        }
    });

    // Horizontal Arterials
    horizontalRoads.forEach(h => {
        if (h.type === 'arterial') {
            for (let x = -HALF_SIZE; x < HALF_SIZE; x += 50) {
                 if (Math.abs(x % ARTERIAL_SPACING) < 20) continue; // Skip intersection area
                 objects.push({
                     type: 'powerPole',
                     position: { x: x, y: 0, z: h.z + 16 },
                     rotation: { x: 0, y: Math.PI / 2, z: 0 } // Aligned with road
                 });
            }
        }
    });

    // --- 3. Buildings & Zoning ---
    // Iterate through the grid cells.
    // We can just iterate the map in blocks of 20x20 and decide what to place.

    // Better: Iterate generated blocks.
    // A block is defined by x, z, w, d.
    // But we have a grid.

    // Helper to add building
    const addBuilding = (type, x, z, w, h, d, rotY = 0) => {
         objects.push({
             type: type,
             params: { width: w, height: h, depth: d },
             position: { x: x, y: 0, z: z },
             rotation: { x: 0, y: rotY, z: 0 }
         });
    };

    // Iterate map in 20m increments for potential slots
    // This is expensive. Let's iterate the road network and build ALONG them.

    // Strategy: For each road segment, place buildings on left and right.
    // Avoid intersections.

    const placeBuildingsAlongRoad = (roadX, roadZ1, roadZ2, isVertical, roadType) => {
        const zone = getZone(roadX, (roadZ1 + roadZ2)/2); // Approx zone
        const roadWidth = (roadType === 'arterial' ? 22 : (roadType === 'city' ? 12 : 10));
        const setback = (zone === 'suburbs' ? 5 : 2); // 5m setback

        const start = Math.min(roadZ1, roadZ2) + 20; // Intersection buffer
        const end = Math.max(roadZ1, roadZ2) - 20;

        if (end <= start) return;

        const baseOffset = roadWidth / 2 + setback;

        // Step size depends on building width
        const density = zone === 'downtown' ? 25 : 30; // Spacing

        for (let pos = start; pos < end; pos += density) {
             // Determine building params first to calculate correct offset
             let w, h, d, type;

             if (zone === 'downtown') {
                 // Skyscrapers
                 h = 30 + Math.random() * 120; // 10-50 stories
                 type = Math.random() > 0.3 ? 'modern_tower' : 'office_park';
                 w = 20;
                 d = 20; // Assume square footprint for calculation

                 const dist = baseOffset + w / 2;

                 // Left side
                 const xL = isVertical ? roadX - dist : pos;
                 const zL = isVertical ? pos : roadX - dist;

                 addBuilding(type, xL, zL, w, h, d, isVertical ? Math.PI : -Math.PI/2);
                 if (h > 100 && Math.random() > 0.5) {
                     objects.push({ type: 'landingPad', position: { x: xL, y: h + 15, z: zL } });
                 }

                 // Right side
                 const xR = isVertical ? roadX + dist : pos;
                 const zR = isVertical ? pos : roadX + dist;

                 addBuilding(type, xR, zR, w, h, d, isVertical ? 0 : Math.PI/2);
                 if (h > 100 && Math.random() > 0.5) {
                     objects.push({ type: 'landingPad', position: { x: xR, y: h + 15, z: zR } });
                 }

             } else {
                 // Suburbs
                 type = Math.random() > 0.6 ? 'house_modern' : 'house_cottage';
                 w = 12;
                 h = 6 + Math.random() * 4;
                 d = 12;

                 const dist = baseOffset + w / 2;

                 // Left side
                 const xL = isVertical ? roadX - dist : pos;
                 const zL = isVertical ? pos : roadX - dist;
                 addBuilding(type, xL, zL, w, h, d, isVertical ? Math.PI/2 : Math.PI);

                 // Driveway Left
                 // Connects road edge to garage. Garage is usually on the side of the house.
                 // Let's place a small sidewalk strip from road to house front (offset).
                 // Road edge is at roadX - roadWidth/2. House front is at xL + d/2 (if facing right).
                 // Facing: Left houses face PI/2 (Positive X?). Wait.
                 // Vertical Road is at X.
                 // Left houses are at X - dist.
                 // They face Road (Positive X). Rotation PI/2?
                 // Box geometry default faces Z. Rotate Y PI/2 -> Faces X. Correct.
                 // House front is at xL + d/2.
                 // Road edge is at roadX - roadWidth/2.
                 // Gap is (roadX - roadWidth/2) - (xL + d/2) = setback.
                 // Driveway length = setback.
                 // Position: centered in gap.
                 const dwLen = setback;
                 const dwX = (roadX - roadWidth/2) - dwLen/2;
                 const dwZ = pos; // Center of lot

                 objects.push({
                     type: 'sidewalk',
                     params: { width: 3, length: dwLen }, // 3m wide driveway
                     position: { x: isVertical ? dwX : pos, y: 0.02, z: isVertical ? pos : dwX },
                     rotation: { x: 0, y: isVertical ? Math.PI/2 : 0, z: 0 }
                 });

                 // Right side
                 const xR = isVertical ? roadX + dist : pos;
                 const zR = isVertical ? pos : roadX + dist;
                 addBuilding(type, xR, zR, w, h, d, isVertical ? -Math.PI/2 : 0);

                 // Driveway Right
                 const dwXR = (roadX + roadWidth/2) + dwLen/2;
                 objects.push({
                     type: 'sidewalk',
                     params: { width: 3, length: dwLen },
                     position: { x: isVertical ? dwXR : pos, y: 0.02, z: isVertical ? pos : dwXR },
                     rotation: { x: 0, y: isVertical ? Math.PI/2 : 0, z: 0 }
                 });

                 // Trees (Placed in the setback area, closer to road)
                 // Offset from center = roadWidth/2 + 2m
                 const treeDist = roadWidth / 2 + 2;

                 // Increase density: Place 2 trees per lot? Or just use smaller step loop?
                 // Current loop step is 30m. Trees every 15m.
                 // Place one at pos + 8, another at pos - 8?
                 // Or just independent loop.
                 // Let's place two here for simplicity.

                 const treeOffsets = [0, 15]; // Relative to pos start? pos iterates by 30.
                 // Let's just place at pos and pos + 15

                 treeOffsets.forEach(offset => {
                     // Left
                     objects.push({
                         type: Math.random() > 0.5 ? 'oakTree' : 'pineTree',
                         position: {
                             x: isVertical ? roadX - treeDist : pos + offset,
                             y: 0,
                             z: isVertical ? pos + offset : roadX - treeDist
                         }
                     });
                     // Right
                     objects.push({
                         type: Math.random() > 0.5 ? 'oakTree' : 'pineTree',
                         position: {
                             x: isVertical ? roadX + treeDist : pos + offset,
                             y: 0,
                             z: isVertical ? pos + offset : roadX + treeDist
                         }
                     });
                 });
             }
        }
    };

    // We need to iterate segments.
    // Simplified: iterate our grid definitions again.

    // Vertical Roads
    verticalRoads.forEach(v => {
        // We treat the whole line, but skip intersections roughly by check in loop
        // Segments are handled by just iterating the range and skipping 'intersection zones'

        // Iterate Z from -1000 to 1000
        for (let z = -HALF_SIZE + 50; z < HALF_SIZE; z += 100) {
            // Check if this 100m block is an intersection
            // Intersection if z is close to a horizontal road
            const nearestH = Math.round(z / 100) * 100; // Snap to grid
            // If z is 50, nearest is 100.

            // Actually, let's just place per block (between intersections)
            const zStart = nearestH - 50; // e.g. -50
            const zEnd = nearestH + 50; // e.g. 50
            // But roads are at coords 0, 100, 200.
            // So blocks are 0..100, 100..200.
            // Center of block is 50, 150.

            // Let's place buildings in the middle of the block (between i*100 and (i+1)*100)
            const blockCenterZ = Math.floor(z / 100) * 100 + 50;
            // Check if this block exists (is there a road here?)
            // We know vertical road 'v' exists at v.x.
            // Does it span this z?

            // Check limits based on zone logic we used before.
            const inDowntown = Math.abs(v.x) <= DOWNTOWN_HALF && Math.abs(blockCenterZ) <= DOWNTOWN_HALF;
            const inSuburb = Math.abs(v.x) > DOWNTOWN_HALF || Math.abs(blockCenterZ) > DOWNTOWN_HALF;

            // Does this road exist here?
            let roadExists = false;
            if (v.type === 'arterial') roadExists = true;
            else if (inDowntown) roadExists = true;
            else if (inSuburb && (v.x % SUBURB_BLOCK_SIZE === 0)) roadExists = true;

            if (roadExists) {
                 // Place along this segment (v.x, blockCenterZ - 40) to (v.x, blockCenterZ + 40)
                 const rType = v.type === 'arterial' ? 'arterial' : (inDowntown ? 'city' : 'residential');
                 placeBuildingsAlongRoad(v.x, blockCenterZ - 45, blockCenterZ + 45, true, rType);
            }
        }
    });

    // Horizontal Roads
    horizontalRoads.forEach(h => {
        for (let x = -HALF_SIZE + 50; x < HALF_SIZE; x += 100) {
             const blockCenterX = Math.floor(x / 100) * 100 + 50;

             const inDowntown = Math.abs(blockCenterX) <= DOWNTOWN_HALF && Math.abs(h.z) <= DOWNTOWN_HALF;
             const inSuburb = Math.abs(blockCenterX) > DOWNTOWN_HALF || Math.abs(h.z) > DOWNTOWN_HALF;

             let roadExists = false;
             if (h.type === 'arterial') roadExists = true;
             else if (inDowntown) roadExists = true;
             else if (inSuburb && (h.z % SUBURB_BLOCK_SIZE === 0)) roadExists = true;

             if (roadExists) {
                 // Only place if NOT conflicting with vertical placement?
                 // Vertical placement puts buildings on X +/- offset.
                 // Horizontal puts on Z +/- offset.
                 // In the corner, they overlap.
                 // We should limit placement range to avoid corners.
                 // Use 30m margin from intersection instead of 20.

                 const rType = h.type === 'arterial' ? 'arterial' : (inDowntown ? 'city' : 'residential');
                 placeBuildingsAlongRoad(h.z, blockCenterX - 35, blockCenterX + 35, false, rType);
             }
        }
    });

    return { objects };
}
