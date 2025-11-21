import { Keyboard } from "@raycast/api";

export const Shortcut = {
  New: Keyboard.Shortcut.Common.New,
  Edit: Keyboard.Shortcut.Common.Edit,
  Remove: Keyboard.Shortcut.Common.Remove,
  ToggleQuickLook: Keyboard.Shortcut.Common.ToggleQuickLook,
} as const;
