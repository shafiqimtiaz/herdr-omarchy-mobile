// The Code view's switch: Files or Changes (the stack "code-body"), as one
// segmented control with full-width, thumb-sized halves.

import { View, svg } from "gpui-kit";
import { h_flex } from "gpui-base";
import { run, theme, layout } from "herdr";

function find(node, id) {
  if (node?.id === id) return node;
  for (const child of node?.children ?? []) { const f = find(child, id); if (f) return f; }
  return null;
}

export default class MobileSeg extends View {
  render() {
    const t = theme();
    const active = find(layout(), "code-body")?.active ?? "files";
    const half = (id, label, icon) => {
      const on = active === id;
      return h_flex().id(`ms-${id}`).flex_1().h_full().gap(8).items_center().justify_center().rounded(2)
        .text_size(15).font_medium()
        .bg(on ? t.selected : t.chrome).text_color(on ? t.foreground : t.muted)
        .border(1).border_color(on ? t.accent : t.chrome)
        .on_click(() => run("layout.select", { stack: "code-body", child: id }))
        .child(svg(icon).size(18)).child(label);
    };
    return h_flex().size_full().px(10).py(6).bg(t.chrome).border_b(1).border_color(t.border)
      .child(h_flex().size_full().p(3).gap(3).rounded(2).bg(t.chrome).border(1).border_color(t.border)
        .child(half("files", "Files", "mods/workspace-chrome/files.svg"))
        .child(half("changes", "Changes", "mods/workspace-chrome/git-compare.svg")));
  }
}
