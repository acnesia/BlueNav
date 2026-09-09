"""Apply native customization after Chromium synchronization."""

import argparse
import json
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[2]


def replace_once(text, before, after):
    if text.count(before) != 1:
        raise ValueError(f"Upstream changed; expected one occurrence: {before!r}")
    return text.replace(before, after, 1)


def validate(config):
    appearance = config["appearance"]
    if type(appearance["sidebarWidth"]) is not int or not 180 <= appearance["sidebarWidth"] <= 400:
        raise ValueError("sidebarWidth must be between 180 and 400")
    for key in ("verticalTabs", "showWindowTitle", "hideNewTabWidgets"):
        if type(appearance[key]) is not bool:
            raise ValueError(f"{key} must be boolean")
    for key in ("darkFrame", "darkSurface", "darkSelected", "darkText"):
        if not re.fullmatch(r"#[0-9a-fA-F]{6}", appearance[key]):
            raise ValueError(f"Invalid color: {key}")
    for key in ("p3a", "usagePing", "crashUpload", "webDiscovery"):
        if config["privacy"][key] is not False:
            raise ValueError(f"BlueNav requires {key}=false")
    for key in ("enable_brave_stats_updater", "enable_web_discovery_native", "enable_web_discovery"):
        if config["build"]["gnArgs"][key] is not False:
            raise ValueError(f"BlueNav requires GN {key}=false")


def transformations(config):
    validate(config)
    appearance = config["appearance"]
    boolean = lambda value: str(value).lower()
    changes = {}

    def change(file, before, after):
        changes.setdefault(file, []).append((before, after))

    tabs = "browser/ui/tabs/brave_tab_prefs.cc"
    change(tabs, "RegisterBooleanPref(kVerticalTabsEnabled, false)",
           f"RegisterBooleanPref(kVerticalTabsEnabled, {boolean(appearance['verticalTabs'])})")
    change(tabs, "RegisterIntegerPref(kVerticalTabsExpandedWidth, 220)",
           f"RegisterIntegerPref(kVerticalTabsExpandedWidth, {appearance['sidebarWidth']})")
    change(tabs, "RegisterBooleanPref(kVerticalTabsShowTitleOnWindow, true)",
           f"RegisterBooleanPref(kVerticalTabsShowTitleOnWindow, {boolean(appearance['showWindowTitle'])})")
    change("browser/brave_profile_prefs.cc", "RegisterBooleanPref(kNewTabPageHideAllWidgets, false)",
           f"RegisterBooleanPref(kNewTabPageHideAllWidgets, {boolean(appearance['hideNewTabWidgets'])})")
    change("browser/brave_local_state_prefs.cc", "RegisterBooleanPref(kStatsReportingEnabled, true)",
           "RegisterBooleanPref(kStatsReportingEnabled, false)")
    p3a = "components/p3a/p3a_service.cc"
    change(p3a, "!BUILDFLAG(IS_BRAVE_ORIGIN_BRANDED)", "false")
    change(p3a, "return local_state_->GetBoolean(kP3AEnabled);",
           "// BlueNav also disables P3A for migrated profiles.\n  return false;")
    change(p3a, "void P3AService::InitCallbacks() {",
           "void P3AService::InitCallbacks() {\n  if (!IsP3AEnabled()) {\n    return;\n  }")
    change(p3a, "  if (url_loader_factory) {",
           "  if (!IsP3AEnabled()) {\n    return;\n  }\n  if (url_loader_factory) {")
    change("chromium_src/components/crash/core/app/crash_reporter_client.cc",
           'return "https://cr.brave.com";', 'return std::string();')

    def color(key):
        return "SkColorSetRGB(" + ", ".join("0x" + appearance[key][i:i + 2] for i in (1, 3, 5)) + ")"

    theme = "\n  // Preserve custom themes and high-contrast accessibility colors.\n"
    theme += "  if (!key.custom_theme && !IsHighContrast() &&\n      key.color_mode == ui::ColorProviderKey::ColorMode::kDark) {\n"
    for token, key in {
        "ui::kColorFrameActive": "darkFrame",
        "ui::kColorFrameInactive": "darkFrame",
        "kColorToolbar": "darkSurface",
        "kColorToolbarButtonIcon": "darkText",
        "kColorBraveVerticalTabActiveBackground": "darkSelected",
        "kColorBraveVerticalTabHoveredBackground": "darkSelected",
        "kColorBraveVerticalTabInactiveBackground": "darkSurface",
    }.items():
        theme += f"    mixer[{token}] = {{{color(key)}}};\n"
    theme += "  }\n"
    change("browser/ui/color/brave_color_mixer.cc",
           "  // Other tab colors are handled in brave_tab_color_mixer.cc\n}",
           "  // Other tab colors are handled in brave_tab_color_mixer.cc\n" + theme + "}")
    return changes


def prepare(root, config):
    outputs = {}
    for name, replacements in transformations(config).items():
        source = (root / name).read_text(encoding="utf-8")
        for before, after in replacements:
            source = replace_once(source, before, after)
        outputs[name] = source
    return outputs


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    config = json.loads((ROOT / "bluenav.native.json").read_text(encoding="utf-8"))
    outputs = prepare(ROOT, config)
    if not args.check:
        for name, source in outputs.items():
            (ROOT / name).write_text(source, encoding="utf-8", newline="\n")
    print(f"BlueNav {config['version']}: {len(outputs)} native files "
          + ("validated; no files changed" if args.check else "customized"))


if __name__ == "__main__":
    main()
