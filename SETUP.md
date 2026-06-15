# Setup Guide

This document covers setup steps specific to this fork, focused on Linux Wayland support.

## GNOME Shell Extension (Wayland)

On Wayland, the `@miniben90/x-win` native addon requires a GNOME Shell extension to detect active windows.

### Installation

The app calls `installExtension()` and `enableExtension()` on startup when running on Linux Wayland. This copies the extension to:

```
~/.local/share/gnome-shell/extensions/x-win@miniben90.org/
```

### Activating the Extension

After the files are in place, you must restart GNOME Shell:

1. Press **Alt+F2**
2. Type `r`
3. Press **Enter**

Or log out and back in.

### Verifying

Check the extension status:

```bash
gnome-extensions info x-win@miniben90.org
```

Expected output:

```
x-win@miniben90.org
  Name: @mininben90/x-win extended
  Enabled: Yes
  State: ENABLED
```

If the state is `OUT OF DATE`, edit `metadata.json` in the extension directory to add your GNOME Shell version to the `shell-version` array.

## X11 (Xorg)

No extension is needed on X11 — window detection works out of the box.

## Known Limitations of @miniben90/x-win

- **GNOME Shell only** — the Wayland extension only works with GNOME Shell. Other Wayland compositors (KDE, Sway, Hyprland, etc.) are not supported.
- **GNOME Shell version compatibility** — the extension's `metadata.json` declares which shell versions it supports. If your GNOME Shell is newer, the extension will show `OUT OF DATE` and won't load until you add your version to `shell-version`.
- **No window detection without the extension** — on Wayland, if the extension isn't installed or enabled, `activeWindow()` and `openWindowsAsync()` fail gracefully but return nothing. The app logs a one-time warning.
- **No URL/browser tab detection on Linux** — unlike Windows and macOS, the `url` field on `WindowInfo` is always empty on Linux.
- **X11 deprecation** — many modern distros default to Wayland. If you're on X11, consider it a legacy path.

## Changes in this Fork

- Updated `@miniben90/x-win` from `^2.1.0` to `^3.5.0`
- Added `@miniben90/x-win-linux-x64-gnu` as optional dependency for Linux builds
- Added `asarUnpack: ["**/*.node"]` for native addon bundling
- Disabled auto-updater (points to upstream; fork should not auto-update)
- Fixed `subscribeActiveWindow` callback signature for v3.5.0
- Added GNOME extension installation at startup (`installExtension()` / `enableExtension()`)
- Suppressed repeated "extension not available" error spam
- Made `icon-promise` import dynamic (was crashing Linux builds due to missing `lodash`)
- Added Linux icon and category to build config
- Added RPM target to `electron-builder.json`

## Building

```bash
pnpm install
pnpm run build
```

Outputs in `release/`:

- `wakatime-linux-x86_64.AppImage`
- `wakatime-linux-arm64.AppImage`

To build RPM, install `rpm-build`:

```bash
sudo dnf install rpm-build
pnpm run build
```
