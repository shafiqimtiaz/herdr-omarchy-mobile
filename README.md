<div align="center">

# Omarchy Mobile for Herdr

**A [Herdr](https://herdr.dev) layout for a phone, in the [Omarchy](https://github.com/basecamp/omarchy) look.**

[Highlights](#highlights) · [Install](#install) · [Using it](#using-it) · [What is inside](#what-is-inside) · [Development](#development)


</div>

Herdr on a phone, driven by a thumb. One bar at the top holds everything: your agents and spaces, your files and Git changes, this space's tabs and the menus. The terminal gets the rest of the screen, and a strip at the bottom shows how much AI quota is left. It is the phone-sized sibling of [herdr-omarchy](https://github.com/shafiqimtiaz/herdr-omarchy): flat, square, bordered tiles over an Omarchy wallpaper, in Omarchy's themes.

> [!NOTE]
> **Works best in [omalauncher](https://github.com/SimonSchubert/omalauncher)**, the Android launcher that runs Arch Linux without root. The layout is built around it: it has no key row of its own because omalauncher has one, it leaves room for omalauncher's keyboard button in the bottom right corner, and the usage strip reads the numbers omalauncher's Claude limits widget already keeps. It runs anywhere Herdr does; see [Outside omalauncher](#outside-omalauncher).

## Highlights

- **Everything is a thumb-sized tile.** 48px targets, no hover, no right-click, no double-click. What a desktop does with keys and a mouse is a button in a sheet.
- **Tabs that say what they do.** The tab you are on shows its agent's session title (or its folder) next to the icon. The others are their icon, with a spinner while working and a square badge when blocked or done.
- **One tap to the agent that needs you.** When an agent elsewhere waits for an answer, a red `!` tile appears in the bar; when one has finished, a green check. Tap it and you are there.
- **Agents and spaces in a drawer.** A half-width panel slides over the terminal, so the terminal never resizes or re-wraps.
- **Files and Git changes** with a diff, commit, push, pull and stash, in big rows.
- **AI usage at the bottom.** 5-hour and 7-day limits for every Claude account and Codex. Tap it to fold it to one line and give the terminal the room.
- **Easy on the battery.** Nothing redraws on a timer; every animation is native. Files and Changes only look at the disk while they are on screen.
- **Omarchy's themes and wallpapers.** 23 themes, 21 with their own wallpaper, picked from big touch cards.

## Install

Ask your agent in Herdr:

```text
Read ~/.config/herdr-app/AGENTS.md, then add the layout from github.com/shafiqimtiaz/herdr-omarchy-mobile.
```

The agent copies the layout, mods, themes and wallpapers into `~/.config/herdr-app`. Your own layout stays. Switch with the `⌘` menu's layout button, or `ctrl-shift-l` on a keyboard.

It is designed at Herdr zoom `1.5` on a 720px wide window (`"zoom": 1.5` in `settings.json`).

> [!NOTE]
> Some mods run programs or use the network:
> - `m-files`, `m-changes` and `m-spaces` run `git` (and `sh` to list folders) in your folders.
> - `m-usage` reads local JSON files only (see below). It calls no provider.
> - `m-mods` searches GitHub for mods and runs `git`, `gh` and `herdr-app check` to install them.

## Using it

| Where | Tap | What happens |
| --- | --- | --- |
| Top bar | panel icon | Opens or closes the agents and spaces drawer |
| Top bar | compare icon | Files and Changes; tap again for the terminal |
| Top bar | `!` or check tile | Goes to the agent that needs you or has finished |
| Top bar | another tab | Shows it |
| Top bar | the tab you are on | Its actions: rename, zoom, split, put away, close |
| Top bar | `+` | New terminal, agent, space or worktree |
| Top bar | `⌘` | Paste, copy, jump to latest, find, spaces, theme, text size, settings, mods |
| Terminal | long press | Paste, copy, jump to latest, split, zoom, close |
| Usage strip | anywhere | Folds to one line, or back to the meters |

## Outside omalauncher

It works, with two things to know:

- **AI usage** reads `~/.cache/claude-limits.json`, `~/.cache/claude-accounts/<id>.json` and `~/.cache/codex-limits.json`, with the account list in `~/.config/omalauncher/claude-accounts.json`. omalauncher's Claude limits widget writes them. Without them the strip shows dashes; set `"hidden": true` on `m-usage` in `layouts/mobile.json` to drop it.
- **The keyboard gap**: the usage strip keeps 64px free at its right end for omalauncher's keyboard button (`KEYBOARD_GAP` in `mods/m-usage/main.js`). Set it to `10` elsewhere.

The font is CaskaydiaCove Nerd Font Mono. Without it Herdr falls back to JetBrains Mono.

## What is inside

The repo has the same structure as a Herdr home folder:

| Path | Contents |
| --- | --- |
| `layouts/mobile.json` | The layout: bar, views, pane frames, usage strip |
| `mods/m-*` | One folder for each mod |
| `themes/` | The Omarchy color themes, as `omarchy-<name>.json` |
| `backgrounds/` | One wallpaper for each theme |
| `RECIPE.md` | The full brief. An agent can build the layout again from it. |

## Development

Check each mod that you change:

```sh
herdr-app check mods/m-top
```

| Change | File |
| --- | --- |
| Bar sizes, pane frames, wallpaper, fonts | `layouts/mobile.json` |
| Top bar: view buttons, tabs, attention tile, drawer | `mods/m-top/main.js` |
| `⌘` and tab action sheet | `mods/m-menu/main.js` |
| `+` sheet | `mods/m-new/main.js` |
| Long-press pane menu | `mods/m-pmenu/main.js` |
| Pane header (split tabs) | `mods/m-pane/main.js` |
| Agents and spaces lists | `mods/m-agents/main.js`, `mods/m-spaces/main.js` |
| Files / Changes switch and lists | `mods/m-seg/main.js`, `mods/m-files/main.js`, `mods/m-changes/main.js` |
| AI usage strip | `mods/m-usage/main.js` |
| Theme picker and its wallpapers | `mods/m-theme/main.js` |
| Mod manager | `mods/m-mods/main.js`, `mods/m-mods/core.js` |

> [!TIP]
> Your edits in this repo do not change the copy in `~/.config/herdr-app`. Copy the changed files there to see them in Herdr.

## Credits

Themes and wallpapers are Omarchy's (MIT, see `LICENSE-omarchy`). File icons in `m-files` and `m-changes` are Charmed icons (see `CHARMED-LICENSE.md` in each). `m-agents`, `m-spaces`, `m-new` and `m-pmenu` are touch-sized clones of Herdr's own `agents`, `spaces`, `new-menu` and `menu`.
