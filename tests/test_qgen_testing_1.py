"""Tests for: testing_1"""

from qgen_features.testing_1 import FEATURE_KEY, FEATURE_TITLE, describe, is_enabled


def test_feature_enabled_by_default():
    assert is_enabled() is True


def test_feature_can_be_disabled_by_flag():
    assert is_enabled({FEATURE_KEY: False}) is False


def test_describe_reports_feature_metadata():
    info = describe()
    assert info["key"] == FEATURE_KEY
    assert info["title"] == FEATURE_TITLE
    assert info["enabled"] is True
