# Omarchy Mobile

Herdr on a phone, in the Omarchy look: one bar of thumb-sized square tiles at the top, the terminal filling the screen over an Omarchy wallpaper, and an AI usage strip at the bottom. Agents and spaces slide in as a drawer, Files and Changes replace the terminal while shown, and everything a desktop does with keys or a right-click is a big button in a sheet. It works best in omalauncher (Arch Linux inside an Android launcher), which supplies the key row, the keyboard button and the usage numbers.


## What you see

Top to bottom. Sizes are px at zoom 1; the layout is designed at zoom 1.5 on a 720px wide window (480 wide at that zoom). Colors are theme names; the default theme is `omarchy-retro-82`.

- **Top bar** (`m-top`, 62px, `chrome`, a 2px `accent` line under it). Tiles are 48px squares, radius 2, 6px apart:
  - **Views**: two tiles in a 1px `border` track: the drawer (panel icon) and Code (compare icon). An open one is filled `accent` with `accent_foreground` ink; otherwise `muted` on `chrome`.
  - **Attention tile** (only while an agent other than the one in front needs the person or has finished): a solid tile in `blocked` with a 22px bold `!`, or in `done` with a check; a count beside it when there are several. The `blocked` one pulses (opacity 0.6 to 1, 1100 ms).
  - **Tabs**: this space's tabs in a 1px `border` track that scrolls sideways. Each is its program's 24px icon (dimmed to 60% when not shown). The shown tab has a `selected` fill and a 2px `accent` frame and, while there is room, a 14px label of at most 132px saying what it works on. Working: a 13px spinner in the top right corner, and on tabs not shown a 2px `working` frame pulsing between 25% and 90%. Blocked or done: a 12px square badge in that color.
  - **`+`** and **`⌘`**: `raised` tiles with a 1px `border`, at the right end.
- **Body** (stack `m-body`):
  - **Terminal** (`term`): the shown tab over the theme's wallpaper, 12px padding. Panes are square, 2px `border` frame, 2px `accent` when focused, 8px gaps, opaque. A split tab's panes get a 46px header (`m-pane`): program icon, name, status, and 40px zoom and close buttons. A lone pane has no header.
  - **Code** (`code`): a 56px two-half switch (`m-seg`: Files / Changes, the active half `selected` with a 1px `accent` border) over the stack `code-body`: `m-files` (52px rows, 26px colored file icons, Git status colors) and `m-changes` (file list, diff, Fetch/Pull/Push/Stash row, commit box and button).
- **Usage strip** (`m-usage`, 78px, `chrome`, a 2px `accent` line above it): one column per provider (each Claude account, then Codex): a 3px color bar and the name in 12px bold uppercase, then a `5H` and a `7D` row, each a 6px square meter and its percent. The meter is the provider's color (Claude `#D97757`, further Claude accounts `#E8A55A` `#C0795F` `#B58DDB`, Codex `#5B9DFF`), `accent` from 70%, `blocked` from 90%, and `↻2h` appears from 70%. Numbers older than 20 minutes are `dim` with "old". 64px stay free at the right for omalauncher's keyboard button. Folded (34px): one line per provider, name then the 5h and 7d percents.
- **Drawer** (popup, half the window wide, between the top bar and the usage strip, at the left): `m-agents` over `m-spaces`, `chrome`, a 1px `border` divider.
- **Sheets** (dialogs, 90 to 96% wide): `m-menu` (54px buttons two to a row under `▌SECTION` labels), `m-new` (56px rows, a 36px icon tile each), `m-theme` (one 64px card per theme in its own colors over a 10px swatch row), `m-mods`. The long-press menu `m-pmenu` is a 330x520 popup of 54px rows.
- **Type**: CaskaydiaCove Nerd Font Mono for terminals (14px) and UI. Labels are uppercase; lists and titles keep their case.

## How it behaves

- **Agent status**: working is `working` (spinner, pulsing frame), blocked is `blocked`, done is `done`, idle shows nothing. A tab's status is the most urgent of its agents.
- **Tab label**: the name someone gave the tab; else its agent's session title without the leading spinner or mark; else the folder (`~` at home); else the branch. Never a program name ("Claude Code", "Codex", a shell): the icon says that. The label takes the room the other tabs leave; under 44px it is dropped and the row scrolls, keeping the shown tab in sight.
- **Tapping a tab**: another tab shows it. The shown tab opens its actions (rename, zoom, split right/down, put away, close; pane focus arrows and close pane when split). From Code, any tab goes back to its terminal.
- **Attention tile**: goes to the first agent that waits for an answer, else the most recent one that finished, and back to the terminal view. While it shows, the drawer tile drops its count badge.
- **Drawer**: the panel tile toggles it; a tap beside it or picking a space, tab or agent closes it and shows what was picked.
- **Usage strip**: a tap folds it to 34px or back to 78px (`layout.resize`), remembered in `shared("m.usage.compact")`.
- **Long press on a terminal**: Paste, Copy selection, Jump to latest, Split right, Split down, Zoom, right-click routing, Close pane. Copy and paste focus the pressed pane first.
- **`⌘` sheet**: Terminal (Paste, Copy selection, Jump to latest, Find), Workspace (New space, New tab, Rename space, Commands, Jump to…, Bring back for tabs put away), App (Theme, Bigger/Smaller/Normal text, Settings, Mods, Desktop layout, Keys).
- **Theme**: picking a card applies it (`app.theme`) and rewrites the `term` block's background in `layouts/mobile.json` to that theme's wallpaper, or `chrome` when it has none.
- **Nothing redraws on a timer.** Spinners use `.spin(900)`, pulses `.loop("opacity", …)`.

## Built from

- **Layout** `layouts/mobile.json`: root `column` (`titlebar: "none"`, `movable: false`, `background: "chrome"`, `font` and `ui_font` CaskaydiaCove Nerd Font Mono, `font_size` 14, `terminal_padding` [10, 8], `terminal_opacity` 1, `terminal_menu: "m-pmenu"`, `theme: "omarchy-retro-82"`).
  - `m-top` block, 62px → `m-top`.
  - `m-body` stack: `term` (`{tab: "active"}`, padding 12, background image cover, pane: header `m-pane` 46px top always, `background`, border 2 `border`, focus 2 `accent`, radius 0, gap 8) and `code` column (`m-seg` 56px; stack `code-body`: `files` → `m-files`, `changes` → `m-changes`).
  - `m-usage` block, 78px → `m-usage`.
- **Mods** (all `"place": "none"`):
  - `m-top`: new. Views via `layout.select {stack: "m-body"}`. The drawer is `openOverlay({layout, kind: "popup", width: 0.5, at, height})` holding `m-agents`, `m-spaces` and a 1px `m-dsentinel`. `m-top.drawer` (through `nextCommand()`) toggles it too. A `ScrollHandle` keeps the shown tab in view. The attention tile runs `agent.focus {terminal}` then `pane.focus {pane}`.
  - `m-dsentinel`: new. Sets `shared("m.drawer")` true in `init` and false, with `m.drawer.closed_at`, in `close()`, so the toggle knows the drawer's state however it closed.
  - `m-menu`, `m-seg`, `m-pane`, `m-theme`, `m-usage`: new.
  - `m-agents`, `m-spaces`, `m-new`, `m-pmenu`: touch-sized clones of Herdr's `agents`, `spaces`, `new-menu` and `menu`.
  - `m-files`, `m-changes`: touch-sized colored Files and Changes (Charmed icons, see `CHARMED-LICENSE.md`). They refresh every 10 s and on `watchFolder` changes, but only while their view is the shown one (`m-body` on `code` and `code-body` on them), and once when they come back.
  - `m-mods`: a touch-sized mod manager (installed, marketplace, install, update, remove).
- **Shipped mods it borrows from**: icons of `workspace-chrome`, `pane`, `terminals-bar` and `icons/`; the dialogs `worktree` and `picker`.
- **Herdr API**: `spaces`, `panes`, `agents`, `terminals`, `focused`, `layout`, `theme`, `themes`, `settings`, `shared`/`setShared`, `openOverlay`/`closeOverlay`, `nextCommand`, `knownAgents`, `exec`, `readTextFile`/`writeTextFile`, `watchFolder`, `run` (`tab.*`, `space.*`, `pane.*`, `terminal.paste|copy|scroll|search`, `agent.focus`, `layout.select|resize|switch`, `app.*`, `mod.open`).
- **Usage data**: `m-usage` reads `~/.config/omalauncher/claude-accounts.json` (`[{id, name, primary?}]`, default one account "Claude"), `~/.cache/claude-accounts/<id>.json` (the primary account falls back to `~/.cache/claude-limits.json`) and `~/.cache/codex-limits.json`, each `{updated, limits: [{short: "5h" | "wk", pct, resets}]}` in unix seconds, once a minute. omalauncher's Claude limits widget writes them.
- **Themes**: `themes/omarchy-<name>.json`, 23 Omarchy palettes with explicit panel colors; `themes/omarchy.json` is Tokyo Night.
- **Art**: `backgrounds/omarchy-<theme>.webp|jpg`, one Omarchy wallpaper for 21 of the themes (MIT, see `LICENSE-omarchy`).

## Watch out

- **Never redraw on a timer.** A redraw of any mod redraws the whole window, and a bar that redraws while a finger is down loses the tap. An earlier build animated the working tab with `cx.notify()` every 33 ms; taps on the bar stopped working whenever an agent worked.
- **Sizes and zoom**: `on_size_change` reports window px, while a mod's own sizes are multiplied by the zoom. Divide by `settings().zoom` before comparing. A popup's `at` is in window px and its `height` in zoomed px.
- **Drawer toggle**: a tap on the toggle lands outside the drawer and closes it before the click arrives. Read the drawer's state on mouse down (or within 500 ms of `m.drawer.closed_at`), not in the click.
- **The drawer ignores the layout's `ui_font`** (an overlay layout), so its lists are in the default UI font.
- **No key row**: the layout has no Esc, Ctrl or arrow keys of its own, and the usage strip keeps 64px free for omalauncher's keyboard button (`KEYBOARD_GAP`). Elsewhere, bring a keyboard with those keys and set the gap to 10.
- **Without the usage files** the strip shows a "Claude" and a "Codex" column of dashes.
- **Wallpaper**: only the `term` block shows it; the theme picker rewrites the layout file, so a layout with another file name needs the path in `m-theme` changed. `app.theme` from a key or the CLI changes colors but not the wallpaper.
- **Opaque terminals**: `terminal_opacity` stays 1. Blending every terminal frame over an image costs a phone real battery.
- **Write `mod.json` before `main.js`** when adding a mod, or Herdr docks a copy into the shown layout.
- **Fonts**: CaskaydiaCove Nerd Font Mono must be installed; without it Herdr falls back to JetBrains Mono.

## Done when

- `herdr-app check mods/<name>` passes for all 14 `m-*` mods, and `herdr-app status` shows `"errors": []` with `layout: "mobile"`.
- With one Claude tab, the bar shows the drawer and Code tiles, one wide tab with the session title and a spinner while it works, then `+` and `⌘`. With four tabs, all four show as icons.
- `printf '\033]7501;state=blocked\033\\'; sleep 20` in a shell tab that is not shown puts a red `!` tile in the bar; tapping it shows that tab.
- A tap on the usage strip folds it to one line and the terminal grows; a second tap brings the meters back.
- With an agent editing files and the terminal shown, no `git status` runs from Files or Changes.
- Picking `Nord` in the theme sheet recolors every block and changes the wallpaper.
