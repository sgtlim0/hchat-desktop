"""Atlassian API service — Confluence/Jira helpers."""
import re
from bs4 import BeautifulSoup
from backend.models.atlassian_schemas import AtlassianCreds


def auth(creds: AtlassianCreds) -> tuple[str, str]:
    """httpx auth parameter: (email, api_token) tuple."""
    return (creds.email, creds.api_token)


# ── HTML / ADF parsers ──────────────────────────────────────

def clean_html(html: str) -> str:
    """Confluence HTML → LLM-friendly text."""
    if not html:
        return ""
    html = html[:100_000]
    soup = BeautifulSoup(html, "lxml")
    for tag in soup(["script", "style", "meta"]):
        tag.decompose()
    for row in soup.find_all("tr"):
        row.append("\n")
    for cell in soup.find_all(["th", "td"]):
        cell.append(" | ")
    for i, h in enumerate(["h1", "h2", "h3", "h4"]):
        for tag in soup.find_all(h):
            tag.insert_before("#" * (i + 1) + " ")
    text = soup.get_text(separator="\n", strip=True)
    return re.sub(r"\n{3,}", "\n\n", text)[:16000]


def parse_adf(nodes: list) -> str:
    """Atlassian Document Format → plain text (recursive)."""
    result = ""
    for node in nodes or []:
        t = node.get("type", "")
        if t == "text":
            result += node.get("text", "")
        elif t == "hardBreak":
            result += "\n"
        elif t == "codeBlock":
            result += f"\n```\n{parse_adf(node.get('content', []))}\n```\n"
        elif t in ("paragraph", "heading", "bulletList", "orderedList", "listItem", "blockquote"):
            result += parse_adf(node.get("content", [])) + "\n"
        else:
            result += parse_adf(node.get("content", []))
    return result


# ── Confluence search helpers ────────────────────────────────

def build_page(data: dict, domain: str, source: str) -> dict:
    """Map Confluence API response to standard dict."""
    return {
        "id": data["id"],
        "title": data.get("title", ""),
        "space": data.get("space", {}).get("name", ""),
        "space_key": data.get("space", {}).get("key", ""),
        "link": f"{domain}/wiki{data['_links']['webui']}",
        "excerpt": "",
        "last_modified": data.get("version", {}).get("when", ""),
        "source": source,
    }


# ── Jira search helpers ─────────────────────────────────────

def build_ticket(issue: dict, domain: str, source: str) -> dict:
    """Map Jira API response to standard dict."""
    f = issue.get("fields", {})
    return {
        "key": issue["key"],
        "id": issue["id"],
        "summary": f.get("summary", ""),
        "status": f.get("status", {}).get("name", ""),
        "status_category": f.get("status", {}).get("statusCategory", {}).get("name", ""),
        "assignee": (f.get("assignee") or {}).get("displayName", "미배정"),
        "priority": (f.get("priority") or {}).get("name", ""),
        "issue_type": (f.get("issuetype") or {}).get("name", ""),
        "project": f.get("project", {}).get("name", ""),
        "project_key": f.get("project", {}).get("key", ""),
        "updated": (f.get("updated") or "")[:10],
        "labels": f.get("labels", []),
        "link": f"{domain}/browse/{issue['key']}",
        "source": source,
    }
