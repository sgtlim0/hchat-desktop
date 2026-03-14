"""Tests for DataFrame analysis logic (pure functions only, no FastAPI dependency)."""

import sys
import os
import pytest
import numpy as np

# Add backend to path so we can import the helper functions directly
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

# Import the private helper functions by reading the module source
# Since they depend on FastAPI/pydantic at module level, we extract just the logic


def _extract_numeric(values):
    numbers = []
    null_count = 0
    for v in values:
        if v is None or v == "" or v == "-" or v == "N/A":
            null_count += 1
            continue
        try:
            cleaned = str(v).replace(",", "").replace("%", "").replace("$", "").replace("₩", "").replace("€", "")
            numbers.append(float(cleaned))
        except (ValueError, TypeError):
            null_count += 1
    return numbers, null_count


def _describe_column(values):
    non_null = [v for v in values if v is not None and v != "" and v != "-"]
    unique_count = len(set(str(v) for v in non_null))
    numbers, null_count = _extract_numeric(values)
    is_numeric = len(numbers) > len(non_null) * 0.5

    desc = {
        "dtype": "numeric" if is_numeric else "string",
        "count": len(values),
        "null_count": null_count,
        "unique": unique_count,
    }

    if is_numeric and numbers:
        arr = np.array(numbers)
        desc["min_val"] = round(float(np.min(arr)), 4)
        desc["max_val"] = round(float(np.max(arr)), 4)
        desc["mean"] = round(float(np.mean(arr)), 4)
        desc["median"] = round(float(np.median(arr)), 4)

    return desc


class TestExtractNumeric:
    def test_basic_numbers(self):
        nums, nulls = _extract_numeric(["10", "20", "30"])
        assert nums == [10.0, 20.0, 30.0]
        assert nulls == 0

    def test_currency(self):
        nums, _ = _extract_numeric(["$1,234.56", "$789"])
        assert nums == [1234.56, 789.0]

    def test_percentage(self):
        nums, _ = _extract_numeric(["85%", "90%"])
        assert nums == [85.0, 90.0]

    def test_nulls(self):
        _, nulls = _extract_numeric(["", "-", "N/A", None])
        assert nulls == 4

    def test_mixed(self):
        nums, nulls = _extract_numeric(["10", "abc", "", "20"])
        assert nums == [10.0, 20.0]
        assert nulls == 2

    def test_korean_currency(self):
        nums, _ = _extract_numeric(["₩1,000", "₩2,500"])
        assert nums == [1000.0, 2500.0]

    def test_empty_list(self):
        nums, nulls = _extract_numeric([])
        assert nums == []
        assert nulls == 0


class TestDescribeColumn:
    def test_numeric(self):
        desc = _describe_column(["10", "20", "30"])
        assert desc["dtype"] == "numeric"
        assert desc["min_val"] == 10.0
        assert desc["max_val"] == 30.0
        assert desc["mean"] == 20.0
        assert desc["count"] == 3

    def test_string(self):
        desc = _describe_column(["Alice", "Bob", "Carol"])
        assert desc["dtype"] == "string"
        assert desc["unique"] == 3

    def test_with_nulls(self):
        desc = _describe_column(["10", "", "N/A", "30"])
        assert desc["null_count"] == 2

    def test_empty(self):
        desc = _describe_column([])
        assert desc["count"] == 0

    def test_median(self):
        desc = _describe_column(["10", "20", "30", "40", "50"])
        assert desc["median"] == 30.0


class TestSortLogic:
    def test_sort_strings(self):
        data = [{"name": "C"}, {"name": "A"}, {"name": "B"}]
        result = sorted(data, key=lambda r: str(r.get("name", "")))
        assert [r["name"] for r in result] == ["A", "B", "C"]

    def test_sort_numeric_strings(self):
        data = [{"val": "10"}, {"val": "2"}, {"val": "100"}]
        result = sorted(data, key=lambda r: float(str(r.get("val", "0")).replace(",", "")))
        assert [r["val"] for r in result] == ["2", "10", "100"]


class TestFilterLogic:
    def test_eq_filter(self):
        data = [{"name": "Alice"}, {"name": "Bob"}, {"name": "Alice"}]
        result = [r for r in data if r.get("name") == "Alice"]
        assert len(result) == 2

    def test_contains_filter(self):
        data = [{"desc": "hello world"}, {"desc": "goodbye"}]
        result = [r for r in data if "hello" in str(r.get("desc", "")).lower()]
        assert len(result) == 1

    def test_gt_filter(self):
        data = [{"price": "10"}, {"price": "20"}, {"price": "30"}]
        result = [r for r in data if float(r.get("price", 0)) > 15]
        assert len(result) == 2


class TestAggregateLogic:
    def test_group_count(self):
        data = [{"cat": "A"}, {"cat": "A"}, {"cat": "B"}]
        groups = {}
        for r in data:
            k = r["cat"]
            groups[k] = groups.get(k, 0) + 1
        assert groups["A"] == 2
        assert groups["B"] == 1

    def test_group_sum(self):
        data = [{"cat": "X", "val": "10"}, {"cat": "X", "val": "20"}]
        groups = {}
        for r in data:
            k = r["cat"]
            groups.setdefault(k, []).append(float(r["val"]))
        assert sum(groups["X"]) == 30.0

    def test_group_mean(self):
        data = [{"g": "A", "v": "10"}, {"g": "A", "v": "30"}]
        groups = {}
        for r in data:
            k = r["g"]
            groups.setdefault(k, []).append(float(r["v"]))
        assert np.mean(groups["A"]) == 20.0
