"""DataFrame analysis endpoint — structured data analysis with numpy."""

from fastapi import APIRouter
from pydantic import BaseModel, Field
import numpy as np

router = APIRouter()


class DataFrameRequest(BaseModel):
    """Request body for DataFrame analysis."""
    data: list[dict] = Field(..., description="Array of row objects [{col: val, ...}]")
    columns: list[str] = Field(..., description="Column names")
    operation: str = Field("describe", description="describe | sort | filter | aggregate")
    params: dict = Field(default_factory=dict, description="Operation-specific parameters")


class DescribeResult(BaseModel):
    """Statistical description of a column."""
    column: str
    dtype: str
    count: int
    null_count: int
    unique: int
    min_val: float | None = None
    max_val: float | None = None
    mean: float | None = None
    median: float | None = None
    std: float | None = None


class DataFrameResponse(BaseModel):
    """Response body for DataFrame analysis."""
    operation: str
    result: dict
    row_count: int
    column_count: int


def _extract_numeric(values: list) -> tuple[list[float], int]:
    """Extract numeric values from a column, returning (numbers, null_count)."""
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


def _describe_columns(data: list[dict], columns: list[str]) -> list[dict]:
    """Generate statistical descriptions for each column."""
    results = []
    for col in columns:
        values = [row.get(col) for row in data]
        non_null = [v for v in values if v is not None and v != "" and v != "-"]
        unique_count = len(set(str(v) for v in non_null))

        numbers, null_count = _extract_numeric(values)
        is_numeric = len(numbers) > len(non_null) * 0.5  # >50% parseable as number

        desc = {
            "column": col,
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
            desc["std"] = round(float(np.std(arr)), 4)

        results.append(desc)
    return results


def _sort_data(data: list[dict], params: dict) -> list[dict]:
    """Sort data by a column."""
    col = params.get("column", "")
    ascending = params.get("ascending", True)
    if not col:
        return data

    def sort_key(row):
        val = row.get(col, "")
        try:
            return (0, float(str(val).replace(",", "")))
        except (ValueError, TypeError):
            return (1, str(val))

    return sorted(data, key=sort_key, reverse=not ascending)


def _filter_data(data: list[dict], params: dict) -> list[dict]:
    """Filter data by column value conditions."""
    col = params.get("column", "")
    op = params.get("op", "eq")  # eq, ne, gt, lt, gte, lte, contains
    value = params.get("value", "")
    if not col:
        return data

    result = []
    for row in data:
        cell = row.get(col, "")
        cell_str = str(cell)

        try:
            cell_num = float(cell_str.replace(",", ""))
            val_num = float(str(value).replace(",", ""))
            is_numeric = True
        except (ValueError, TypeError):
            cell_num = 0
            val_num = 0
            is_numeric = False

        match = False
        if op == "eq":
            match = cell_str == str(value)
        elif op == "ne":
            match = cell_str != str(value)
        elif op == "contains":
            match = str(value).lower() in cell_str.lower()
        elif is_numeric:
            if op == "gt":
                match = cell_num > val_num
            elif op == "lt":
                match = cell_num < val_num
            elif op == "gte":
                match = cell_num >= val_num
            elif op == "lte":
                match = cell_num <= val_num

        if match:
            result.append(row)

    return result


def _aggregate_data(data: list[dict], params: dict) -> dict:
    """Aggregate data: group by a column and compute stats on another."""
    group_col = params.get("group_by", "")
    agg_col = params.get("column", "")
    agg_func = params.get("func", "count")  # count, sum, mean, min, max

    if not group_col:
        return {"error": "group_by column required"}

    groups: dict[str, list] = {}
    for row in data:
        key = str(row.get(group_col, ""))
        groups.setdefault(key, [])
        if agg_col:
            val = row.get(agg_col)
            try:
                groups[key].append(float(str(val).replace(",", "")))
            except (ValueError, TypeError):
                pass
        else:
            groups[key].append(1)

    result = {}
    for key, values in groups.items():
        if not values:
            result[key] = 0
            continue
        arr = np.array(values)
        if agg_func == "count":
            result[key] = len(values)
        elif agg_func == "sum":
            result[key] = round(float(np.sum(arr)), 4)
        elif agg_func == "mean":
            result[key] = round(float(np.mean(arr)), 4)
        elif agg_func == "min":
            result[key] = round(float(np.min(arr)), 4)
        elif agg_func == "max":
            result[key] = round(float(np.max(arr)), 4)

    return {"groups": result, "group_by": group_col, "func": agg_func}


@router.post("/dataframe/analyze")
async def analyze_dataframe(req: DataFrameRequest):
    """Analyze extracted table data with numpy-based operations."""
    data = req.data
    columns = req.columns
    operation = req.operation

    if operation == "describe":
        descriptions = _describe_columns(data, columns)
        return DataFrameResponse(
            operation="describe",
            result={"columns": descriptions},
            row_count=len(data),
            column_count=len(columns),
        )

    elif operation == "sort":
        sorted_data = _sort_data(data, req.params)
        return DataFrameResponse(
            operation="sort",
            result={"data": sorted_data},
            row_count=len(sorted_data),
            column_count=len(columns),
        )

    elif operation == "filter":
        filtered = _filter_data(data, req.params)
        return DataFrameResponse(
            operation="filter",
            result={"data": filtered, "matched": len(filtered)},
            row_count=len(filtered),
            column_count=len(columns),
        )

    elif operation == "aggregate":
        agg_result = _aggregate_data(data, req.params)
        return DataFrameResponse(
            operation="aggregate",
            result=agg_result,
            row_count=len(data),
            column_count=len(columns),
        )

    else:
        return DataFrameResponse(
            operation=operation,
            result={"error": f"Unknown operation: {operation}"},
            row_count=len(data),
            column_count=len(columns),
        )
