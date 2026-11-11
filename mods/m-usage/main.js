// AI usage, full width at the bottom: one column per provider (every Claude
// account, then Codex), each with its 5-hour and 7-day limits as a meter, a
// percent and, once a limit gets tight, the time until it resets. It reads the
// numbers the omalauncher claude-limits widget keeps in ~/.cache (refreshed
// there every few minutes), so this adds no calls to any provider.
// Tap it to fold it to one line (name, 5h %, 7d %) and give the terminal the
// room; tap again for the meters. The choice is kept ("m.usage.compact").

import { View, div } from "gpui-kit";
import { h_flex, v_flex } from "gpui-base";
import { readTextFile, home, theme, shared, setShared, run } from "herdr";

// omalauncher draws its keyboard button over the bottom-right corner.
const KEYBOARD_GAP = 64;
const REFRESH_MS = 60000;
const FULL = 78, COMPACT = 34;
const STALE_S = 20 * 60;
const WARN = 70, CRIT = 90;
const BRAND = { claude: "#D97757", codex: "#5B9DFF" };
const TINTS = ["#D97757", "#E8A55A", "#C0795F", "#B58DDB"];

const WINDOWS = [["5H", "5h"], ["7D", "wk"]];

const readJson = async (path) => {
  try { return JSON.parse(await readTextFile(path) ?? "null"); }
  catch { return null; }
};

function left(s) {
  if (s <= 0) return "now";
  const d = Math.floor(s / 86400), h = Math.floor(s / 3600) % 24, m = Math.floor(s / 60) % 60;
  return d ? `${d}d` : h ? `${h}h` : `${m}m`;
}

// [{ key, name, color, data }]: every registered Claude account, then Codex.
async function load() {
  const h = home();
  const accounts = await readJson(`${h}/.config/omalauncher/claude-accounts.json`) ?? [{ id: "claude", name: "Claude" }];
  const out = [];
  for (const [i, a] of accounts.entries()) {
    const data = await readJson(`${h}/.cache/claude-accounts/${a.id}.json`)
      ?? (a.primary ? await readJson(`${h}/.cache/claude-limits.json`) : null);
    out.push({ key: a.id, name: a.name ?? a.id, color: i === 0 ? BRAND.claude : TINTS[i % TINTS.length], data });
  }
  out.push({ key: "codex", name: "Codex", color: BRAND.codex, data: await readJson(`${h}/.cache/codex-limits.json`) });
  return out;
}

export default class Usage extends View {
  init(_p, cx) {
    this.providers = [];
    cx.spawn(async (cx) => {
      for (;;) {
        // Redraw only when a number changed: a redraw repaints the whole window.
        const next = await load(), sig = JSON.stringify(next);
        if (sig !== this.sig) { this.sig = sig; this.providers = next; cx.notify(); }
        await cx.sleep(REFRESH_MS);
      }
    });
  }

  render() {
    const t = theme();
    const now = Date.now() / 1000;

    // One limit: window label, a square meter, the percent, and the reset time once it matters.
    const meter = (provider, [label, short], stale) => {
      const l = provider.data?.limits?.find((x) => x.short === short);
      const gone = l?.resets != null && l.resets <= now;
      const pct = l ? (gone ? 0 : Math.max(0, Math.min(100, l.pct))) : 0;
      const tone = stale ? t.dim : pct >= CRIT ? t.blocked : pct >= WARN ? t.accent : provider.color;
      return h_flex().w_full().gap(5).items_center().text_size(12)
        .child(div().w(17).flex_none().text_color(t.muted).child(label))
        .child(div().flex_1().min_w(0).h(6).bg(t.raised).border(1).border_color(t.border)
          .child(div().h_full().bg(tone).w(`${pct}%`)))
        .child(div().w(30).flex_none().text_right().font_semibold().text_color(l ? tone : t.dim).child(l ? `${pct}%` : "–"))
        .when(l?.resets != null && pct >= WARN, (e) => e.child(div().flex_none().text_color(t.muted).child(`↻${left(l.resets - now)}`)));
    };

    const column = (p) => {
      const stale = !p.data?.updated || now - p.data.updated > STALE_S;
      return v_flex().flex_1().min_w(0).gap(4).justify_center()
        .child(h_flex().gap(4).items_center().text_size(12).font_bold()
          .child(div().w(3).h(11).bg(p.color))
          .child(div().text_color(stale ? t.dim : t.foreground).child(p.name.toUpperCase()))
          .when(stale && Boolean(p.data), (e) => e.child(div().font_normal().text_color(t.dim).child("old"))))
        .children(WINDOWS.map((w) => meter(p, w, stale)));
    };

    const compact = shared("m.usage.compact") === true;
    const value = (p, short, stale) => {
      const l = p.data?.limits?.find((x) => x.short === short);
      const pct = l ? (l.resets != null && l.resets <= now ? 0 : Math.max(0, Math.min(100, l.pct))) : null;
      const tone = stale || pct == null ? t.dim : pct >= CRIT ? t.blocked : pct >= WARN ? t.accent : p.color;
      return div().flex_none().font_semibold().text_color(tone).child(pct == null ? "–" : `${pct}%`);
    };
    const line = (p) => {
      const stale = !p.data?.updated || now - p.data.updated > STALE_S;
      return h_flex().flex_1().min_w(0).gap(5).items_center().text_size(12)
        .child(div().w(3).h(11).flex_none().bg(p.color))
        .child(div().min_w(0).truncate().font_bold().text_color(stale ? t.dim : t.foreground).child(p.name.toUpperCase()))
        .child(value(p, "5h", stale)).child(value(p, "wk", stale));
    };

    return h_flex().id("m-usage").size_full().pl(10).pr(KEYBOARD_GAP).gap(12).items_center().bg(t.chrome).border_t(2).border_color(t.accent)
      .on_click(() => { setShared("m.usage.compact", !compact); run("layout.resize", { id: "m-usage", px: compact ? FULL : COMPACT }); })
      .when(this.providers.length === 0, (e) => e.child(div().text_size(13).text_color(t.muted).child("AI USAGE: LOADING…")))
      .children(this.providers.map(compact ? line : column));
  }
}
