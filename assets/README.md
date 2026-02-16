Inventory Template System

Place your PNG templates here:

- assets/templates/inventory_bleach.png
- assets/templates/inventory_jjk.png

Layout + text positions:

- assets/layouts/inventory-layout.json

Notes:

- The renderer draws only real values from the player database (Redis via getPlayer).
- If a template file is missing, it falls back to a plain background.
- You can move every text element by editing the JSON coordinates.
- Keep your template size equal to `width` and `height` in the layout JSON.

