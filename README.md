# lampa-netflix-theme

Netflix-style theme plugin for [Lampa](https://github.com/yumata/lampa-source) smart TV app.

![preview](https://img.shields.io/badge/Lampa-plugin-red?style=flat-square)

## What it does

- Dark background `#141414`, Netflix red accent `#E50914`
- Card scale + gradient overlay with title, year and genre on focus
- Spotlight effect: unfocused cards dimmed to `brightness(0.85)`
- Row whoosh animation on screen transition (`activity:start`)
- Logo intro animation on app start
- Netflix-style fixed cursor: focused card stays near left edge while row scrolls
- Hides text title/year below cards (shown in overlay instead)

## Install

Add plugin URL in Lampa settings → Plugins:

```
https://stenHigh.github.io/lampa-netflix-theme/netflix.min.js
```

Or for local dev:
```html
<script src="/plugins/netflix/netflix.js"></script>
```

## Files

| File | Description |
|------|-------------|
| `netflix.js` | Source (requires build with `@@include`) |
| `netflix.min.js` | Ready-to-use compiled bundle |
| `style.scss` | SCSS source |

## Build

Part of [lampa-source](https://github.com/yumata/lampa-source). To compile:

```bash
npx gulp pack_plugins
```

## Compatibility

- Lampa v1.x / v2.x / v3.x
- WebOS 3+, Tizen 4+, Android TV
- Vanilla JS, no external dependencies
