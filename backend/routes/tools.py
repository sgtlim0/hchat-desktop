"""Atlassian Tools Integration Router"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import httpx
import base64
import json

router = APIRouter()


class AtlassianCredentials(BaseModel):
    """Atlassian API credentials"""
    base_url: str  # e.g., "https://yoursite.atlassian.net"
    email: str
    api_token: str


class ToolSearchRequest(BaseModel):
    """Tool search request"""
    query: str
    credentials: AtlassianCredentials
    targets: List[str] = ["confluence", "jira"]
    limit: int = 5


class TestConnectionRequest(BaseModel):
    """Test connection request"""
    type: str  # "confluence" or "jira"
    credentials: AtlassianCredentials


async def _search_confluence(
    client: httpx.AsyncClient,
    base_url: str,
    headers: Dict[str, str],
    query: str,
    limit: int
) -> List[Dict[str, Any]]:
    """Search Confluence using CQL"""
    results = []

    try:
        # Use CQL (Confluence Query Language) for search
        cql = f'text ~ "{query}" OR title ~ "{query}"'
        params = {
            "cql": cql,
            "limit": limit,
            "expand": "body.view,version"
        }

        response = await client.get(
            f"{base_url}/wiki/rest/api/content/search",
            headers=headers,
            params=params
        )

        if response.status_code == 200:
            data = response.json()
            for item in data.get("results", []):
                results.append({
                    "type": "confluence",
                    "id": item.get("id"),
                    "title": item.get("title"),
                    "url": f"{base_url}/wiki{item.get('_links', {}).get('webui', '')}",
                    "space": item.get("space", {}).get("key"),
                    "lastModified": item.get("version", {}).get("when"),
                    "excerpt": item.get("body", {}).get("view", {}).get("value", "")[:200]
                })
    except Exception as e:
        print(f"Confluence search error: {e}")

    return results


async def _search_jira(
    client: httpx.AsyncClient,
    base_url: str,
    headers: Dict[str, str],
    query: str,
    limit: int
) -> List[Dict[str, Any]]:
    """Search Jira using JQL"""
    results = []

    try:
        # Use JQL (Jira Query Language) for search
        jql = f'text ~ "{query}" OR summary ~ "{query}" OR description ~ "{query}"'
        params = {
            "jql": jql,
            "maxResults": limit,
            "fields": "summary,description,status,assignee,reporter,created,updated,issuetype,project"
        }

        response = await client.get(
            f"{base_url}/rest/api/3/search",
            headers=headers,
            params=params
        )

        if response.status_code == 200:
            data = response.json()
            for issue in data.get("issues", []):
                fields = issue.get("fields", {})
                results.append({
                    "type": "jira",
                    "id": issue.get("id"),
                    "key": issue.get("key"),
                    "title": fields.get("summary"),
                    "url": f"{base_url}/browse/{issue.get('key')}",
                    "status": fields.get("status", {}).get("name"),
                    "assignee": fields.get("assignee", {}).get("displayName") if fields.get("assignee") else None,
                    "reporter": fields.get("reporter", {}).get("displayName") if fields.get("reporter") else None,
                    "project": fields.get("project", {}).get("name"),
                    "issueType": fields.get("issuetype", {}).get("name"),
                    "created": fields.get("created"),
                    "updated": fields.get("updated"),
                    "description": (fields.get("description", "") or "")[:200]
                })
    except Exception as e:
        print(f"Jira search error: {e}")

    return results


@router.post("/tools/test-connection")
async def test_connection(req: TestConnectionRequest):
    """Test Atlassian API connection"""
    # Create Basic Auth header
    auth_string = f"{req.credentials.email}:{req.credentials.api_token}"
    auth_bytes = auth_string.encode("ascii")
    auth_b64 = base64.b64encode(auth_bytes).decode("ascii")

    headers = {
        "Authorization": f"Basic {auth_b64}",
        "Accept": "application/json",
        "Content-Type": "application/json"
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            if req.type == "confluence":
                # Test Confluence API by fetching spaces
                response = await client.get(
                    f"{req.credentials.base_url}/wiki/rest/api/space",
                    headers=headers,
                    params={"limit": 1}
                )
            elif req.type == "jira":
                # Test Jira API by fetching current user
                response = await client.get(
                    f"{req.credentials.base_url}/rest/api/3/myself",
                    headers=headers
                )
            else:
                return {
                    "success": False,
                    "error": f"Unknown tool type: {req.type}"
                }

            if response.status_code == 200:
                return {
                    "success": True,
                    "status": response.status_code,
                    "message": f"{req.type.capitalize()} connection successful"
                }
            elif response.status_code == 401:
                return {
                    "success": False,
                    "status": response.status_code,
                    "error": "Authentication failed. Please check your email and API token."
                }
            elif response.status_code == 404:
                return {
                    "success": False,
                    "status": response.status_code,
                    "error": "API endpoint not found. Please check your base URL."
                }
            else:
                return {
                    "success": False,
                    "status": response.status_code,
                    "error": f"Unexpected status code: {response.status_code}"
                }

    except httpx.TimeoutException:
        return {
            "success": False,
            "error": "Connection timeout. Please check your base URL and network connection."
        }
    except httpx.ConnectError as e:
        return {
            "success": False,
            "error": f"Connection failed: {str(e)}"
        }
    except Exception as e:
        return {
            "success": False,
            "error": f"Unexpected error: {str(e)}"
        }


@router.post("/tools/search")
async def tool_search(req: ToolSearchRequest):
    """Search across Confluence and Jira"""
    if not req.query:
        raise HTTPException(status_code=400, detail="Query is required")

    if not req.targets:
        raise HTTPException(status_code=400, detail="At least one target is required")

    # Create Basic Auth header
    auth_string = f"{req.credentials.email}:{req.credentials.api_token}"
    auth_bytes = auth_string.encode("ascii")
    auth_b64 = base64.b64encode(auth_bytes).decode("ascii")

    headers = {
        "Authorization": f"Basic {auth_b64}",
        "Accept": "application/json",
        "Content-Type": "application/json"
    }

    results = []
    errors = []

    async with httpx.AsyncClient(timeout=15.0) as client:
        # Search Confluence if requested
        if "confluence" in req.targets:
            try:
                confluence_results = await _search_confluence(
                    client,
                    req.credentials.base_url,
                    headers,
                    req.query,
                    req.limit
                )
                results.extend(confluence_results)
            except Exception as e:
                errors.append(f"Confluence search failed: {str(e)}")

        # Search Jira if requested
        if "jira" in req.targets:
            try:
                jira_results = await _search_jira(
                    client,
                    req.credentials.base_url,
                    headers,
                    req.query,
                    req.limit
                )
                results.extend(jira_results)
            except Exception as e:
                errors.append(f"Jira search failed: {str(e)}")

    # Sort results by relevance (you could implement a scoring algorithm here)
    # For now, just return them as-is

    return {
        "query": req.query,
        "results": results[:req.limit * len(req.targets)],  # Limit total results
        "totalResults": len(results),
        "errors": errors if errors else None
    }


@router.post("/tools/create-jira-issue")
async def create_jira_issue(
    credentials: AtlassianCredentials,
    project_key: str,
    issue_type: str,
    summary: str,
    description: Optional[str] = None
):
    """Create a new Jira issue"""
    auth_string = f"{credentials.email}:{credentials.api_token}"
    auth_bytes = auth_string.encode("ascii")
    auth_b64 = base64.b64encode(auth_bytes).decode("ascii")

    headers = {
        "Authorization": f"Basic {auth_b64}",
        "Accept": "application/json",
        "Content-Type": "application/json"
    }

    issue_data = {
        "fields": {
            "project": {"key": project_key},
            "summary": summary,
            "issuetype": {"name": issue_type}
        }
    }

    if description:
        issue_data["fields"]["description"] = {
            "type": "doc",
            "version": 1,
            "content": [
                {
                    "type": "paragraph",
                    "content": [
                        {
                            "type": "text",
                            "text": description
                        }
                    ]
                }
            ]
        }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                f"{credentials.base_url}/rest/api/3/issue",
                headers=headers,
                json=issue_data
            )

            if response.status_code == 201:
                data = response.json()
                return {
                    "success": True,
                    "key": data.get("key"),
                    "id": data.get("id"),
                    "url": f"{credentials.base_url}/browse/{data.get('key')}"
                }
            else:
                return {
                    "success": False,
                    "error": f"Failed to create issue: {response.text}"
                }
    except Exception as e:
        return {
            "success": False,
            "error": f"Error creating issue: {str(e)}"
        }