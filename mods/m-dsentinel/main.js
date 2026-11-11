// Lives inside the mobile drawer and reports whether the drawer is shown, so
// the top bar's toggle stays right however the drawer closes (a tap beside
// it, Esc, the toggle, a layout switch).

import { View, div } from "gpui-kit";
import { setShared } from "herdr";

export default class DrawerPresence extends View {
  init() { setShared("m.drawer", true); }
  // When it went: a tap on the toggle closes the drawer (it lands outside it)
  // just before the toggle hears the press, and must still count as "open".
  async close() { setShared("m.drawer.closed_at", Date.now()); setShared("m.drawer", false); }
  render() { return div(); }
}
