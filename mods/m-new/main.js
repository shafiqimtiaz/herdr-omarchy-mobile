import { View, div, svg, image } from "gpui-kit";
import { h_flex, v_flex } from "gpui-base";
import { theme, spaces, panes, knownAgents, run, openOverlay, closeOverlay, props, window, keys, shared, setShared } from "herdr";

// The last agents each machine reported, shown at once while knownAgents() checks again.
const KNOWN = "new-menu.agents";

function shortcut(name) {
  const k = keys().find(b => b.section === "global" && b.action === name);
  if (!k?.keys.trim()) return "";
  const mac = window()?.platform === "macos";
  const names = mac ? { ctrl: "⌃", alt: "⌥", shift: "⇧", cmd: "⌘", fn: "fn" } : { ctrl: "Ctrl", alt: "Alt", shift: "Shift", cmd: "Super", fn: "Fn" };
  const alias = { secondary: mac ? "cmd" : "ctrl", super: "cmd", win: "cmd" };
  return k.keys.trim().split(/\s+/).map(stroke => {
    const parts = stroke.split("-");
    let key = parts.pop();
    if (key === "") { key = "-"; parts.pop(); }
    const held = new Set(parts.map(m => alias[m.toLowerCase()] ?? m.toLowerCase()));
    if (/^[A-Z]$/.test(key)) held.add("shift");
    const label = key.length === 1 ? key.toUpperCase() : key[0].toUpperCase() + key.slice(1).toLowerCase();
    return [...Object.keys(names).filter(m => held.has(m)).map(m => names[m]), label].join(mac ? "" : "+");
  }).join(" ");
}

export default class NewMenu extends View {
  init(_props, cx) {
    this.cx = cx;
    const machine = spaces().find(s => s.active)?.machine;
    const where = machine ?? "";
    this.agents = shared(KNOWN)?.[where] ?? [];
    this.handle = cx.focus_handle();
    this.handle.focus();
    cx.spawn(async cx => {
      try {
        this.agents = await knownAgents({ on: machine });
        setShared(KNOWN, { ...shared(KNOWN), [where]: this.agents });
      }
      catch { this.failed = true; }
      cx.notify();
    });
  }
  row(id, icon, name, action, hint = "", enabled = true) {
    const t = theme();
    // Mobile: thumb-sized rows, the icon on its own tile; no key hints (no keyboard).
    return h_flex().id(id).h(56).px(10).gap(12).items_center().flex_none().text_size(15).border(1)
      .border_color(enabled ? t.border : t.raised).bg(t.popover).text_color(enabled ? t.foreground : t.dim)
      .when(enabled, el => el.hover(s => s.bg(t.selected)))
      .on_click(() => { if (enabled) this.start(action); })
      .child(div().size(36).flex_none().bg(t.raised).border(1).border_color(t.border).flex().items_center().justify_center().child(icon))
      .child(div().flex_1().truncate().font_semibold().child(String(name).toUpperCase()))
      .when(hint === "not installed", el => el.child(div().text_size(12).text_color(t.dim).child("[ N/A ]")))
      .when(hint !== "not installed" && enabled, el => el.child(div().text_color(t.muted).child(">")));
  }
  // Run the action, and show why when it fails instead of closing silently.
  start(action) {
    try { action(); closeOverlay(props().overlay); }
    catch (e) { this.error = String(e?.message ?? e); this.cx?.notify(); }
  }
  render() {
    const t = theme();
    const space = spaces().find(s => s.active);
    const installed = this.agents.filter(a => a.installed);
    const choices = [...installed, ...this.agents.filter(a => !a.installed).slice(0, 2)];
    return v_flex().min_h(0).w_full().h(Math.min(900, 360 + Math.max(1, choices.length) * 62 + (this.error ? 60 : 0))).bg(t.popover).p(10).gap(6).text_size(15)
      .id("new-menu").track_focus(this.handle)
      .on_key_down((e) => {
        if (e.modifiers.control || e.modifiers.platform || e.modifiers.alt) return;
        const agent = /^[1-9]$/.test(e.key) ? installed[Number(e.key) - 1] : null;
        if (!agent) return;
        closeOverlay(props().overlay);
        run("tab.new", { name: agent.name, space: space?.id, argv: agent.run });
      })
      .when(Boolean(this.error), el => el.child(div().px(10).py(8).border(1).border_color(t.danger ?? t.border).text_size(13).child("[ ERROR ] " + this.error)))
      .child(this.row("terminal", svg("icons/shell.svg").size(24), "Terminal", () => run("tab.new", { space: space?.id }), shortcut("tab.new")))
      .child(div().px(4).pt(10).pb(2).text_size(12).font_semibold().text_color(t.accent ?? t.muted).child("▌START AN AGENT"))
      .child(v_flex().flex_1().min_h(0).overflow_y_scrollbar()
        .children(choices.map((a, i) => this.row(a.key, a.tint ? svg(a.icon).size(26).text_color(t.foreground) : image(a.icon).size(26), a.name,
          () => run("tab.new", { name: a.name, space: space?.id, argv: a.run }), a.installed ? (i < 9 ? String(i + 1) : "") : "not installed", a.installed)))
        .when(this.agents.length === 0, el => el.child(div().px(10).py(10).text_size(16).text_color(t.dim).child(this.failed ? "[ COULD NOT LOAD AGENTS ]" : "CHECKING INSTALLED AGENTS…"))))
      .child(div().px(4).pt(10).pb(2).text_size(12).font_semibold().text_color(t.accent ?? t.muted).child("▌NEW"))
      .child(this.row("space", svg("mods/workspace-chrome/plus.svg").size(24).text_color(t.foreground), "New space", () => run("space.new"), shortcut("space.new")))
      .child(this.row("worktree", svg("mods/workspace-chrome/branch.svg").size(24).text_color(t.foreground), "New worktree…", () => openOverlay({ mod: "worktree", kind: "dialog", width: 0.94, height: 340, props: { space: space?.id, folder: panes().find(p => p.focused)?.cwd, action: "new" } }), "", Boolean(space)))
      .child(this.row("worktree-open", svg("mods/workspace-chrome/branch.svg").size(24).text_color(t.foreground), "Open worktree\u2026", () => openOverlay({ mod: "worktree", kind: "dialog", width: 0.94, height: 0.6, props: { space: space?.id, folder: panes().find(p => p.focused)?.cwd, action: "open" } }), "", Boolean(space)));
  }
}
