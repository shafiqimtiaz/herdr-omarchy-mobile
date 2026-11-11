// Mobile pane header, shown when a tab is split: what runs there, and
// always-visible zoom and close buttons (a phone has no hover).

import { View, div, svg, image } from "gpui-kit";
import { h_flex } from "gpui-base";
import { panes, props, run, theme } from "herdr";

export default class MobilePane extends View {
  render() {
    const t = theme();
    const p = panes().find(x => x.pane === props()?.pane);
    if (!p) return div();
    const pane = p.pane;
    const name = ((p.program?.agent || p.program?.shell) && p.program.name) || p.title || p.program?.name || "shell";
    const btn = (id, icon, command) => div().id(id).size(40).flex_none().flex().items_center().justify_center().rounded(2)
      .text_color(t.muted).bg(t.raised)
      .on_mouse_down("left", (_e, cx) => cx.stop_propagation())
      .on_click((_e, cx) => { cx.stop_propagation(); run(command, { pane }); })
      .child(svg(`mods/pane/${icon}.svg`).size(19));
    const st = p.status;
    return h_flex().id(`mp-${pane}`).size_full().pl(12).pr(3).gap(9).items_center().text_size(15)
      .bg(p.focused ? t.raised : t.background).border_b(1).border_color(t.border)
      .on_click(() => run("pane.focus", { pane }))
      .when(Boolean(p.program?.icon), el => el.child(p.program.tint ? svg(p.program.icon).size(18).text_color(t.dim) : image(p.program.icon).size(18)))
      .child(div().flex_1().truncate().font_medium().text_color(p.focused ? t.foreground : t.muted).child(name))
      .when(st === "working", el => el.child(svg("mods/workspace-chrome/spinner.svg").size(13).flex_none().text_color(t.working).spin(900)))
      .when(st === "blocked", el => el.child(div().px(6).h(24).flex().items_center().rounded(2).bg(t.blocked + "26").text_size(13).font_semibold().text_color(t.blocked).child("Needs you")))
      .when(st === "done", el => el.child(div().size(8).rounded(2).bg(t.done)))
      .child(btn(`mp-z-${pane}`, p.zoomed ? "unzoom" : "zoom", "pane.zoom"))
      .child(btn(`mp-x-${pane}`, "close", "pane.close"));
  }
}
