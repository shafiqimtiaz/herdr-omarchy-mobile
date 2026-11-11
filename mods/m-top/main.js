// Mobile bar, the only chrome: everything lives at the top, so nothing collides
// with the phone keyboard, omalauncher's key bar or its keyboard button below.
//   [drawer] [code] [needs you] [this space's tabs, scrolling] [+] [⌘]
// The shown tab is wide and says what it works on; the others are their icon.
// Tapping the tab you're on opens its actions (rename, split, close...): a phone
// has no right-click or double-click. Picking a space, tab or agent in a list
// brings you back to the terminal. When an agent elsewhere needs the person or
// has finished, one tile appears that goes straight to it.
//
// Nothing here redraws on a timer: a redraw of this bar redraws the whole
// window, and a bar that redraws while the finger is down loses the tap. The
// working mark is native (.spin, .loop).

import { View, div, svg, image } from "gpui-kit";
import { h_flex, ScrollHandle } from "gpui-base";
import { spaces, panes, agents, focused, run, shared, setShared, nextCommand, openOverlay, closeOverlay, theme, layout, settings, readTextFile, appHome } from "herdr";

function find(node, id) {
  if (node?.id === id) return node;
  for (const child of node?.children ?? []) { const f = find(child, id); if (f) return f; }
  return null;
}
const view = root => find(root, "m-body")?.active ?? "term";
const setView = child => run("layout.select", { stack: "m-body", child });

const IC = "mods/workspace-chrome/";
const VIEWS = [
  ["drawer", "Agents & spaces", IC + "panel-left.svg"],
  ["code", "Code", IC + "git-compare.svg"],
];
// Agents over spaces, sliding in as a half-screen panel at the left: the terminal
// keeps its size (a docked sidebar would squeeze and re-wrap it).
const DRAWER = {
  type: "column", id: "drawer", background: "chrome", ui_font: "CaskaydiaCove Nerd Font Mono", divider: { width: 1, color: "border" },
  children: [
    { id: "d-agents", type: "block", size: { weight: 1 }, min: 120, ui_font: "CaskaydiaCove Nerd Font Mono", content: { mod: "m-agents" } },
    { id: "d-spaces", type: "block", size: { weight: 1 }, min: 120, ui_font: "CaskaydiaCove Nerd Font Mono", content: { mod: "m-spaces" } },
    { id: "d-presence", type: "block", size: { px: 1 }, content: { mod: "m-dsentinel" } },
  ],
};

const TILE = 48, LABEL_MAX = 132;

// What a tab works on: the name someone gave it, else its agent's session
// title, else the folder. Never a program name: the icon says that.
const PROGRAM_NAMES = new Set(["claude code", "claude", "codex", "pi", "opencode", "shell", "bash", "zsh", "fish", "sh"]);
function folderName(cwd) {
  if (!cwd) return null;
  const homeDir = cwd.match(/^\/home\/[^/]+|^\/root|^\/Users\/[^/]+/)?.[0];
  return cwd === homeDir ? "~" : cwd.split("/").filter(Boolean).pop() ?? "/";
}
function tabLabel(c, lead) {
  if (c.named && !PROGRAM_NAMES.has(c.name.toLowerCase())) return c.name;
  // Agents prefix their title with a spinner or a mark while they work.
  const title = lead?.program?.agent ? (lead.title ?? "").replace(/^[^\p{L}\p{N}]+/u, "").trim() : "";
  if (title && !PROGRAM_NAMES.has(title.toLowerCase())) return title;
  return folderName(lead?.cwd) ?? lead?.branch ?? c.name;
}

export default class MobileTop extends View {
  init(_p, cx) {
    this.where = null; this.drawer = null;
    setShared("m.drawer", false); // popups never survive a restart
    // "m-top.drawer" (a key, a script) toggles the drawer too.
    cx.spawn(async cx => { for (;;) { if (await nextCommand() === "drawer") this.toggleDrawer(cx); } });
    this.scroll = ScrollHandle.new(); this.shownTab = null;
  }

  // Between the top bar and the usage bar: neither covered, nothing cut off.
  // The window's height comes from window.json (screen px), in app px at the zoom.
  async drawerSpot() {
    const px = id => { const n = find(layout(), id); return n && !n.hidden ? n.size?.px ?? 0 : 0; };
    const top = px("m-top"), bottom = px("m-usage");
    let h = null;
    try { h = JSON.parse(await readTextFile(`${appHome()}/window.json`) ?? "null")?.bounds?.[3] ?? null; } catch {}
    const zoom = Number(settings().zoom) || 1;
    // `at` is in screen px, `height` in app px (zoomed).
    const y = Math.ceil(top * zoom) + 2;
    const height = h ? Math.floor((h - y - bottom * zoom - 3) / zoom) : 0.82;
    return { at: { x: 0, y }, height };
  }

  // Whether the drawer is shown, as the drawer itself reports (m-dsentinel).
  drawerShown() { return shared("m.drawer") === true; }
  // At a press: shown, or closed a moment ago by this very press landing outside it.
  takePress() { const v = this.pressOpen ?? this.drawerWasOpen(); this.pressOpen = null; return v; }
  drawerWasOpen() { return this.drawerShown() || Date.now() - (Number(shared("m.drawer.closed_at")) || 0) < 500; }

  // `wasOpen`: whether the drawer was shown when the press began. A tap on the
  // icon also lands outside the drawer, which closes it before the click
  // arrives, so asking afterwards would reopen it.
  toggleDrawer(cx, wasOpen = this.drawerShown()) {
    if (wasOpen) {
      if (this.drawer) closeOverlay(this.drawer); else if (this.drawerShown()) run("overlay.close");
      this.drawer = null; cx.notify();
      return;
    }
    cx.spawn(async cx => {
      if (this.drawer) closeOverlay(this.drawer); // never two at once
      this.drawer = openOverlay({ layout: DRAWER, kind: "popup", width: 0.5, ...(await this.drawerSpot()) });
      cx.notify();
    });
  }

  render() {
    const t = theme();
    const current = view(layout());
    const space = spaces().find(s => s.active);
    const tabs = (space?.tabs ?? []).filter(c => !c.settled || c.active);
    const stop = (_e, cx) => cx.stop_propagation();

    // A change of space, tab or focus while a list is shown means the person
    // picked something there: show it.
    const f = focused();
    const where = `${space?.id}/${space?.tabs.find(x => x.active)?.id}/${f?.terminal ?? f?.pane}`;
    if (this.where !== null && where !== this.where && this.drawerShown()) {
      // Picked something in the drawer: close it and show it.
      if (this.drawer) closeOverlay(this.drawer); this.drawer = null; setView("term");
    }
    this.where = where;

    const list = agents();
    const needs = list.filter(a => a.status === "blocked").length;
    const done = list.filter(a => a.status === "done").length;
    // Who to go to next: someone waiting for an answer first, then someone
    // finished; never the agent already in front of the person.
    const calls = list.filter(a => (a.status === "blocked" || a.status === "done") && !(a.focused && current === "term"))
      .sort((x, y) => (x.status === "blocked" ? 0 : 1) - (y.status === "blocked" ? 0 : 1) || y.seq - x.seq);
    const call = calls[0];

    // Each tab's lead pane (its agent, else its first terminal), found once.
    const lead = new Map();
    for (const p of panes()) {
      const cur = lead.get(p.tab);
      if (!cur || (p.program?.agent && !cur.program?.agent)) lead.set(p.tab, p);
    }

    // The shown tab stays in sight when the row scrolls.
    const shownAt = tabs.findIndex(c => c.active);
    const shownKey = `${tabs[shownAt]?.id}/${tabs.length}`;
    if (shownAt >= 0 && shownKey !== this.shownTab) { this.shownTab = shownKey; this.scroll.scroll_to_item(shownAt); }

    // The shown tab's words get the room the other tabs leave; with many
    // tabs it is its icon too, and the row scrolls.
    // on_size_change reports window px; this bar's own sizes are zoomed.
    const room = (this.width ?? 720) / (Number(settings().zoom) || 1) - 236 - (call ? TILE + 6 : 0) - (tabs.length - 1) * (TILE + 2) - 52;
    const labelW = Math.min(LABEL_MAX, room);

    const viewButton = ([id, label, icon]) => {
      const on = id === "drawer" ? this.drawerShown() : current === id;
      const count = id === "drawer" ? needs || done : 0;
      return div().id(`mv-${id}`).relative().size(TILE).flex_none().flex().items_center().justify_center().rounded(2)
        .bg(on ? t.accent : t.chrome).border(2).border_color(on ? t.accent : t.chrome)
        .text_color(on ? t.accent_foreground : t.muted)
        .on_mouse_down("left", (_e, cx) => { cx.stop_propagation(); if (id === "drawer") this.pressOpen = this.drawerWasOpen(); })
        .on_click((_e, cx) => id === "drawer" ? this.toggleDrawer(cx, this.takePress()) : setView(on ? "term" : id))
        .child(svg(icon).size(23))
        .when(count > 0 && !call, el => el.child(div().absolute().top(1).right(1).min_w(17).h(17).px(4).rounded(2)
          .flex().items_center().justify_center().bg(needs ? t.blocked : t.done).text_color(t.background)
          .text_size(11).font_semibold().child(String(count))));
    };

    // One tap to the agent that needs the person: a solid tile in its status
    // color, pulsing while someone waits for an answer.
    const callTile = () => {
      const color = t[call.status];
      return h_flex().id("mt-call").h(TILE).min_w(TILE).px(8).gap(5).flex_none().items_center().justify_center().rounded(2)
        .bg(color).text_color(t.background).text_size(22).font_bold()
        .when(call.status === "blocked", el => el.loop("opacity", { from: 0.6, to: 1, period: 1100 }))
        .on_mouse_down("left", stop)
        .on_click(() => { run("agent.focus", { terminal: call.address }); run("pane.focus", { pane: call.pane }); setView("term"); })
        .child(call.status === "blocked" ? "!" : svg(IC + "check.svg").size(20))
        .when(calls.length > 1, el => el.child(String(calls.length)));
    };

    // A tab is its program's icon in a track like the view switcher's. The
    // shown one is wider: a filled tile with an accent frame that also says
    // what it works on. Working: a spinner in the corner and a pulsing frame,
    // both native. Blocked or done: a square corner badge.
    const pill = c => {
      const p = lead.get(c.id), program = p?.program;
      const ink = c.active ? t.foreground : t.muted;
      const pic = (program?.icon
        ? (program.tint ? svg(program.icon).size(24).text_color(ink) : image(program.icon).size(24))
        : svg(IC + "terminal.svg").size(22).text_color(ink)).flex_none().opacity(c.active ? 1 : 0.6);
      const working = c.status === "working";
      const badge = working
        ? svg(IC + "spinner.svg").size(13).text_color(t.working).spin(900)
        : c.status === "blocked" || c.status === "done"
          ? div().size(12).rounded(2).bg(t[c.status]).border(2).border_color(c.active ? t.selected : t.chrome)
          : null;
      return h_flex().id(`mt-${c.id}`).relative().h(TILE).min_w(TILE).flex_none().items_center().justify_center().rounded(2)
        .when(c.active, el => el.bg(t.selected).border(2).border_color(t.accent))
        .when(c.active && labelW >= 44, el => el.px(10).gap(8))
        .when(working && !c.active, el => el.child(div().absolute().top(0).left(0).size_full().rounded(2)
          .border(2).border_color(t.working).loop("opacity", { from: 0.25, to: 0.9, period: 1400 })))
        .on_mouse_down("left", stop)
        .on_click(() => {
          // From Files or Changes, any tab takes you back to its terminal.
          if (current !== "term") { run("tab.select", { id: c.id }); setView("term"); }
          else if (c.active) openOverlay({ mod: "m-menu", kind: "dialog", width: 0.92, props: { tab: c.id, space: space.id } });
          else run("tab.select", { id: c.id });
        })
        .child(pic)
        .when(c.active && labelW >= 44, el => el.child(div().max_w(labelW).truncate().text_size(14).font_medium().text_color(t.foreground).child(tabLabel(c, p))))
        .when(Boolean(badge), el => el.child(div().absolute().top(2).right(2).child(badge)));
    };

    const square = (id, icon, action) => div().id(id).size(TILE).flex_none().flex().items_center().justify_center().rounded(2)
      .bg(t.raised).border(1).border_color(t.border).text_color(t.foreground)
      .on_mouse_down("left", stop).on_click(action).child(svg(icon).size(22));

    // Middle: the tabs on the terminal; elsewhere the view's name and space.
    // The tabs stay in the bar on every view (Files and Changes too).
    const middle = h_flex().flex_1().min_w(0).h_full().items_center()
      .child(h_flex().id("mt-scroll").min_w(0).flex_shrink_1().p(2).gap(2).items_center().rounded(2)
        .border(1).border_color(t.border).overflow_x_scroll().track_scroll(this.scroll).children(tabs.map(pill)));

    return h_flex().id("m-top").size_full().min_w(0).px(6).gap(6).items_center().bg(t.chrome).border_b(2).border_color(t.accent)
      .on_size_change((size, cx) => { if (size.width !== this.width) { this.width = size.width; cx.notify(); } })
      .child(h_flex().flex_none().p(2).gap(2).rounded(2).border(1).border_color(t.border).children(VIEWS.map(viewButton)))
      .when(Boolean(call), el => el.child(callTile()))
      .child(middle)
      .child(square("mt-new", IC + "plus.svg", () => openOverlay({ mod: "m-new", kind: "dialog", width: 0.9 })))
      .child(square("mt-more", "mods/terminals-bar/command.svg", () => openOverlay({ mod: "m-menu", kind: "dialog", width: 0.92, props: {} })));
  }
}
