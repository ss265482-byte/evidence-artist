# Smooth drag previews

## Goal
Keep library-object drag previews responsive at high zoom and in crowded scenes without changing placement or snapping behavior.

## Changes
- Move the live preview to its own non-interactive Konva layer so pointer updates do not redraw all scene objects.
- Update the preview nodes directly once per animation frame instead of triggering a full React render for every browser drag event.
- Cache the canvas bounds for the duration of a drag and skip duplicate snapped positions.
- Preserve the current footprint, crosshair, label, dimensions, night-mode colors, and final drop coordinates.
- Cancel queued work and hide the preview cleanly on drag leave, drop, or component unmount.

## Validation
- Confirm the app builds without errors.
- Exercise drag, snap, zoom, leave, and drop behavior in the preview at desktop and compact widths.

## Technical details
The preview layer will use stable Konva refs and `batchDraw()` behind `requestAnimationFrame`. This isolates frequent preview painting from the main layer containing every scene object.
