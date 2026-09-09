import copy
import json
from pathlib import Path
import tempfile
import unittest

from apply_native import ROOT, prepare, replace_once, transformations, validate


class NativeConfigurationTests(unittest.TestCase):
    def setUp(self):
        self.config = json.loads((ROOT / 'bluenav.native.json').read_text(encoding='utf-8'))

    def test_current_source_and_disabled_telemetry(self):
        outputs = prepare(ROOT, self.config)
        p3a = outputs['components/p3a/p3a_service.cc']
        self.assertNotIn('return local_state_->GetBoolean(kP3AEnabled);', p3a)
        self.assertIn('if (!IsP3AEnabled()) {\n    return;\n  }', p3a)
        self.assertNotIn('https://cr.brave.com', outputs['chromium_src/components/crash/core/app/crash_reporter_client.cc'])

    def test_upstream_drift_fails_before_writing(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            for name in transformations(self.config):
                target = root / name
                target.parent.mkdir(parents=True, exist_ok=True)
                target.write_text((ROOT / name).read_text(encoding='utf-8'), encoding='utf-8')
            last = root / 'browser/ui/color/brave_color_mixer.cc'
            last.write_text('changed upstream', encoding='utf-8')
            first = root / 'browser/ui/tabs/brave_tab_prefs.cc'
            original = first.read_bytes()
            with self.assertRaises(ValueError):
                prepare(root, self.config)
            self.assertEqual(first.read_bytes(), original)

    def test_ambiguous_replacement_rejected(self):
        with self.assertRaises(ValueError):
            replace_once('same same', 'same', 'new')

    def test_invalid_configuration_rejected(self):
        for key, value in [('sidebarWidth', 10000), ('darkFrame', '#FFF; code'), ('verticalTabs', 'true')]:
            config = copy.deepcopy(self.config)
            config['appearance'][key] = value
            with self.subTest(key=key), self.assertRaises(ValueError):
                validate(config)
        config = copy.deepcopy(self.config)
        config['privacy']['p3a'] = True
        with self.assertRaises(ValueError):
            validate(config)
        config = copy.deepcopy(self.config)
        config['build']['gnArgs']['enable_brave_stats_updater'] = True
        with self.assertRaises(ValueError):
            validate(config)


if __name__ == '__main__':
    unittest.main()
