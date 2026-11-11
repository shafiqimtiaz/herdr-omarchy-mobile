// Pick one of Herdr's own themes, big and by touch: each card shows its
// colors and its name; the shown one is outlined. Tapping applies it at once.

import { View, div, svg } from "gpui-kit";
import { h_flex, v_flex } from "gpui-base";
import { themes, theme, settings, run, props, closeOverlay, readTextFile, writeTextFile, appHome } from "herdr";

// Each Omarchy theme brings its own wallpaper; the others get their plain chrome color.
const WALL = {"omarchy-catppuccin": "backgrounds/omarchy-catppuccin.webp", "omarchy-ethereal": "backgrounds/omarchy-ethereal.webp", "omarchy-everforest": "backgrounds/omarchy-everforest.webp", "omarchy-flexoki-light": "backgrounds/omarchy-flexoki-light.webp", "omarchy-gruvbox": "backgrounds/omarchy-gruvbox.jpg", "omarchy-hackerman": "backgrounds/omarchy-hackerman.jpg", "omarchy-kanagawa": "backgrounds/omarchy-kanagawa.jpg", "omarchy-last-horizon": "backgrounds/omarchy-last-horizon.webp", "omarchy-lumon": "backgrounds/omarchy-lumon.webp", "omarchy-lupine": "backgrounds/omarchy-lupine.webp", "omarchy-matte-black": "backgrounds/omarchy-matte-black.jpg", "omarchy-miasma": "backgrounds/omarchy-miasma.webp", "omarchy-nord": "backgrounds/omarchy-nord.jpg", "omarchy-osaka-jade": "backgrounds/omarchy-osaka-jade.webp", "omarchy-retro-82": "backgrounds/omarchy-retro-82.webp", "omarchy-ristretto": "backgrounds/omarchy-ristretto.webp", "omarchy-rose-pine": "backgrounds/omarchy-rose-pine.webp", "omarchy-solitude": "backgrounds/omarchy-solitude.webp", "omarchy-tokyo-night": "backgrounds/omarchy-tokyo-night.webp", "omarchy-vantablack": "backgrounds/omarchy-vantablack.webp", "omarchy-white": "backgrounds/omarchy-white.webp"};
async function setWallpaper(name) {
  try {
    const path = `${appHome()}/layouts/mobile.json`;
    const text = await readTextFile(path);
    if (!text) return;
    const d = JSON.parse(text);
    const bg = WALL[name] ? { image: WALL[name], fit: "cover" } : "chrome";
    // Only the terminal view shows it: the bars and lists cover the rest.
    const walk = (n) => { if (n.id === "term") n.background = bg; (n.children ?? []).forEach(walk); };
    walk(d);
    await writeTextFile(path, JSON.stringify(d, null, 2), text);
  } catch { /* keep the current one */ }
}

// Herdr's own: its presets and the theme files it ships. Layout-only themes
// (win98) and personal ones are left out.
const OMARCHY = ["omarchy-tokyo-night", "omarchy-catppuccin", "omarchy-catppuccin-latte", "omarchy-ethereal", "omarchy-everforest", "omarchy-flexoki-light", "omarchy-gruvbox", "omarchy-hackerman", "omarchy-jade-horse", "omarchy-kanagawa", "omarchy-last-horizon", "omarchy-lumon", "omarchy-lupine", "omarchy-matte-black", "omarchy-miasma", "omarchy-nord", "omarchy-retro-82", "omarchy-ristretto", "omarchy-rose-pine", "omarchy-solitude", "omarchy-starship", "omarchy-vantablack", "omarchy-white"];
const HERDR = [...OMARCHY, "graphite", "ink", "moss", "paper", "atom-one-dark"];
const LABEL = { "atom-one-dark": "Atom One Dark" };
const label = (n) => LABEL[n] ?? (n.startsWith("omarchy-") ? "Omarchy · " : "") + n.replace(/^omarchy-/, "").split("-").map((w) => w[0].toUpperCase() + w.slice(1)).join(" ");

export default class ThemePicker extends View {
  render() {
    const t = theme();
    const current = String(settings().theme ?? "");
    const list = themes().filter((x) => HERDR.includes(x.name))
      .sort((a, b) => HERDR.indexOf(a.name) - HERDR.indexOf(b.name));
    const close = () => closeOverlay(props()?.overlay);

    const card = (x) => {
      const c = x.colors, on = current === x.name;
      const sw = (k) => div().flex_1().h_full().bg(c[k] ?? c.background);
      return v_flex().id(`th-${x.name}`).w_full().flex_none().rounded(2).overflow_hidden().cursor_pointer()
        .border(on ? 3 : 1).border_color(on ? t.accent : t.border)
        .on_click(() => { run("app.theme", { name: x.name }); setWallpaper(x.name); })
        .child(h_flex().w_full().h(64).px(14).gap(10).items_center().bg(c.background ?? "#000")
          .child(div().text_size(16).font_semibold().text_color(c.ansi2 ?? c.foreground).child("❯"))
          .child(div().flex_1().truncate().text_size(17).font_semibold().text_color(c.foreground).child(label(x.name).toUpperCase()))
          .child(div().text_size(13).text_color(c.muted ?? c.foreground).child(x.light ? "LIGHT" : "DARK"))
          .when(on, (el) => el.child(div().text_size(16).text_color(c.accent ?? c.ansi4).child("[ ✓ ]"))))
        .child(h_flex().w_full().h(10)
          .child(sw("accent")).child(sw("ansi1")).child(sw("ansi2")).child(sw("ansi3")).child(sw("ansi4")).child(sw("ansi5")).child(sw("ansi6")));
    };

    return v_flex().id("m-theme").w_full().h(1100).min_h(0).p(16).gap(10).bg(t.popover)
      .child(h_flex().items_center()
        .child(v_flex().flex_1()
          .child(div().text_size(22).font_bold().text_color(t.foreground).child("Theme"))
          .child(div().text_size(15).text_color(t.muted).child("Omarchy themes first · applies at once")))
        .child(div().id("th-x").size(48).flex().items_center().justify_center().rounded(2).bg(t.raised).text_color(t.muted)
          .on_click(close).child(svg("mods/workspace-chrome/x.svg").size(20))))
      .child(v_flex().id("th-list").flex_1().min_h(0).gap(8).overflow_y_scroll().children(list.map(card)));
  }
}
