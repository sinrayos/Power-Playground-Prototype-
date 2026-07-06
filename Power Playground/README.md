# Power Playground (Prototype)

A browser-based 3D sandbox game using Three.js for rendering and Cannon-es for physics.

## Run

Because the game is split into ES modules, run it from a local web server:

```powershell
python -m http.server 8000 --bind 127.0.0.1
```

Then open:

```text
http://127.0.0.1:8000/
```

## Project Structure

```text
index.html          Page shell and UI markup
src/styles.css      HUD, menu, and layout styles
src/config.js       Power Guy and map tuning data
src/sfx.js          Web Audio sound effects
src/main.js         Three.js scene, Cannon physics, player control, maps, powers
```
