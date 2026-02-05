# MADcolors

A comprehensive color library based on the **Munsell Color System**, featuring thousands of scientifically organized colors with an interactive web visualizer.

**[View Live Demo](https://laeh.github.io/MADcolors/)**

## Features

- **Munsell Color Wheel** — 40 hues across 10 hue families (R, YR, Y, GY, G, BG, B, PB, P, RP), each with 9 value levels and variable chroma
- **Named Munsell Colors** — 400+ colors with official Munsell notation, RGB, and hex values
- **Curated Palettes** — Cool Hex (100+ modern colors), Best CSS (42 named colors), iOS 7 palette
- **Interactive Explorer** — Search, filter, and inspect any color with hex/RGB/HSL values
- **Click to Copy** — One-click copy of any color value

## Project Structure

```
MADcolors/
├── index.html              # Main web app
├── css/
│   └── style.css           # Styles
├── js/
│   ├── color-data.js       # All color data (Munsell + palettes)
│   └── app.js              # Application logic
├── lua-legacy/             # Original Lua source code
│   ├── init.lua            # Lua module entry point
│   ├── palettes.lua        # Color palette definitions
│   ├── MADcolors.lua       # Compiled color data
│   ├── webMunsell.lua      # Munsell database (JSON in Lua)
│   ├── gitpush.lua         # Git automation utility
│   ├── madcolors-scm-1.rockspec
│   ├── munsellwheel.jpg
│   └── json/               # Raw JSON color data
│       ├── munsellColors.json
│       ├── munsell.json
│       ├── data.json
│       ├── colorHistograms.json
│       ├── params.json
│       ├── R2.json
│       └── 2R.json
└── .github/
    └── workflows/
        └── deploy.yml      # GitHub Pages deployment
```

## Color System

The Munsell Color System organizes colors in three dimensions:

- **Hue** — The color family (Red, Yellow-Red, Yellow, Green-Yellow, Green, Blue-Green, Blue, Purple-Blue, Purple, Red-Purple)
- **Value** — Lightness from dark (1) to light (9)
- **Chroma** — Saturation from neutral gray to fully saturated

Each of the 10 hue families has 4 sub-hues (2.5, 5, 7.5, 10), giving 40 total hue positions arranged in a wheel.

## Legacy Lua Library

The original Lua library is preserved in `lua-legacy/`. To use it:

```sh
luarocks install https://raw.githubusercontent.com/LAEH/MADcolors/master/lua-legacy/madcolors-scm-1.rockspec
```

```lua
mc = require 'madcolors'

-- Random color from a palette
color = mc.rdm(MADpalettes.coolhex)

-- Access Munsell color by code
red = mc.munsell.byCode({code='R', step=4, value=9})

-- Circular hue navigation
neighbor = mc.circular({value=5, degree=15})
```

## License

BSD
