import { Keyboard } from "@raycast/api";

export const Shortcut = {
  New: Keyboard.Shortcut.Common.New,
  Copy: Keyboard.Shortcut.Common.Copy,
  Remove: Keyboard.Shortcut.Common.Remove,
  ToggleQuickLook: Keyboard.Shortcut.Common.ToggleQuickLook,
  UpdateModel: {
    macOS: { modifiers: ["cmd"], key: "u" },
    Windows: { modifiers: ["ctrl"], key: "u" },
  } satisfies Keyboard.Shortcut,
  OpenLibrary: {
    macOS: { modifiers: ["cmd"], key: "l" },
    Windows: { modifiers: ["ctrl"], key: "l" },
  } satisfies Keyboard.Shortcut,
} as const;
