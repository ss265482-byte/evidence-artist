# Architecture rules

- Keep high-frequency library drag previews in a dedicated non-listening Konva layer and update them imperatively per animation frame, so crowded scene layers are not redrawn on every drag event.