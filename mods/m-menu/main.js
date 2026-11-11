// Mobile action sheet: what a desktop does with keys and right-clicks, as big
// buttons. With props().tab: that tab's actions first.

import { View, div, svg } from "gpui-kit";
import { h_flex, v_flex } from "gpui-base";
import { spaces, focused, run, props, openOverlay, closeOverlay, theme, shared } from "herdr";

const IC = "mods/workspace-chrome/";

export default class MobileMenu extends View {
  render() {
    const t = theme();
    const pr = props() ?? {};
    const close = () => closeOverlay(pr.overlay);
    const act = (name, args) => () => { close(); run(name, args); };
    const space = spaces().find(s => s.active);
    const tab = pr.tab ? space?.tabs.find(x => x.id === pr.tab) : null;
    const pane = focused()?.pane;

    const btn = (id, label, icon, onTap, danger) => h_flex().id(id).h(54).px(14).gap(12).items_center().rounded(2)
      .bg(t.raised).border(1).border_color(t.border).text_size(16).text_color(danger ? t.blocked : t.foreground)
      .on_click(onTap)
      .when(Boolean(icon), el => el.child(svg(icon).size(20).flex_none().text_color(danger ? t.blocked : t.dim)))
      .child(div().truncate().child(label));
    const grid = (title, items) => v_flex().gap(8)
      .child(div().text_size(13).font_semibold().text_color(t.dim).child("▌" + title.toUpperCase()))
      .children(pairs(items).map((row, i) => h_flex().gap(8).children(row.map(b => div().flex_1().min_w(0).child(b)))));

    const sections = [];
    if (tab) {
      sections.push(grid(`Tab ${tab.name}`, [
        btn("mm-rename", "Rename", IC + "square-pen.svg", act("tab.rename", { id: tab.id })),
        btn("mm-zoom", tab.zoomed ? "Show all panes" : "Zoom pane", "mods/pane/zoom.svg", act("pane.zoom", {})),
        btn("mm-sr", "Split right", "mods/pane/split-right.svg", act("pane.split", { direction: "right" })),
        btn("mm-sd", "Split down", "mods/pane/split-down.svg", act("pane.split", { direction: "down" })),
        btn("mm-settle", "Put away", IC + "archive.svg", act("tab.settle", { id: tab.id })),
        btn("mm-close", "Close tab", IC + "x.svg", act("tab.close", { id: tab.id }), true),
      ]));
      if (tab.panes > 1) sections.push(grid("Panes", [
        btn("mm-pl", "Focus ←", null, act("pane.go", { direction: "left" })),
        btn("mm-pr", "Focus →", null, act("pane.go", { direction: "right" })),
        btn("mm-pu", "Focus ↑", null, act("pane.go", { direction: "up" })),
        btn("mm-pd", "Focus ↓", null, act("pane.go", { direction: "down" })),
        btn("mm-pc", "Close pane", "mods/pane/close.svg", act("pane.close", pane ? { pane } : {}), true),
      ]));
    }
    // What a keyboard and a mouse wheel do on a desk.
    sections.push(grid("Terminal", [
      btn("mm-paste", "Paste", IC + "file-text.svg", act("terminal.paste", {})),
      btn("mm-copy", "Copy selection", IC + "files.svg", act("terminal.copy", {})),
      btn("mm-bottom", "Jump to latest", IC + "chevron-down.svg", act("terminal.scroll", { to: "bottom" })),
      btn("mm-search", "Find", IC + "search.svg", act("terminal.search", {})),
    ]));
    const settled = (space?.tabs ?? []).filter(x => x.settled);
    sections.push(grid("Workspace", [
      btn("mm-ns", "New space", IC + "folder-plus.svg", act("space.new", {})),
      btn("mm-nt", "New tab", IC + "terminal.svg", act("tab.new", {})),
      btn("mm-rs", "Rename space", IC + "square-pen.svg", act("space.rename", {})),
      btn("mm-pal", "Commands", "mods/terminals-bar/command.svg", act("app.palette", {})),
      btn("mm-find", "Jump to…", IC + "search.svg", act("mod.open", { name: "picker" })),
      ...settled.map(x => btn(`mm-un-${x.id}`, `Bring back ${x.name}`, IC + "archive.svg", act("tab.unsettle", { id: x.id }))),
    ]));
    sections.push(grid("App", [
      btn("mm-theme", "Theme", IC + "square.svg", () => { close(); openOverlay({ mod: "m-theme", kind: "dialog", width: 0.94 }); }),
      btn("mm-zi", "Bigger text", IC + "plus.svg", act("app.zoom_in", {})),
      btn("mm-zo", "Smaller text", IC + "minus.svg", act("app.zoom_out", {})),
      btn("mm-zr", "Normal size", null, act("app.zoom_reset", {})),
      btn("mm-set", "Settings", IC + "settings.svg", act("app.settings", {})),
      btn("mm-mods", "Mods", "mods/terminals-bar/stack.svg", () => { close(); openOverlay({ mod: "m-mods", kind: "dialog", width: 0.96, height: 0.9 }); }),
      btn("mm-desk", shared("layout") === "mobile" ? "Desktop layout" : "Mobile layout", IC + "monitor.svg",
        act("layout.switch", { name: shared("layout") === "mobile" ? "main" : "mobile" })),
      btn("mm-help", "Keys", null, act("app.help", {})),
    ]));

    return v_flex().id("mm").w_full().max_h(1300).p(14).gap(16).bg(t.popover).overflow_y_scroll()
      .child(h_flex().items_center().child(div().flex_1().text_size(18).font_semibold().text_color(t.foreground).child(space?.name ?? "Herdr"))
        .child(div().id("mm-x").size(48).flex().items_center().justify_center().rounded(2).bg(t.raised).text_color(t.muted)
          .on_click(close).child(svg(IC + "x.svg").size(18))))
      .children(sections);
  }
}

function pairs(a) {
  const out = [];
  for (let i = 0; i < a.length; i += 2) out.push(a.slice(i, i + 2));
  return out;
}
