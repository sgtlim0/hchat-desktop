"""Pydantic models for Confluence/Jira integration endpoints."""
import re
from typing import Literal, Optional
from pydantic import BaseModel, Field, field_validator


# ── Input Sanitizers ───────────────────────────────────────

def sanitize_query(query: str) -> str:
    """CQL/JQL injection prevention: remove dangerous characters."""
    sanitized = re.sub(r'["\\\;]', '', query)
    sanitized = re.sub(r'\s+', ' ', sanitized).strip()
    return sanitized[:200]


def sanitize_key(key: str) -> str:
    """Space key / Project key validation: alphanumeric + hyphen only."""
    if not re.match(r'^[A-Za-z0-9_-]+$', key):
        raise ValueError(f"Invalid key format: {key}")
    return key


def sanitize_page_id(page_id: str) -> str:
    """Page ID validation: digits only."""
    if not re.match(r'^\d+$', page_id):
        raise ValueError(f"Invalid page ID: {page_id}")
    return page_id


def sanitize_issue_key(issue_key: str) -> str:
    """Issue key validation: PROJECT-123 format only."""
    if not re.match(r'^[A-Z][A-Z0-9]+-\d+$', issue_key):
        raise ValueError(f"Invalid issue key: {issue_key}")
    return issue_key


# ── Credentials ────────────────────────────────────────────

class AtlassianCreds(BaseModel):
    domain: str = Field(..., min_length=10, max_length=200, description="https://company.atlassian.net")
    email: str = Field(..., max_length=254)
    api_token: str = Field(..., min_length=10, max_length=500)

    @field_validator("domain")
    @classmethod
    def validate_domain(cls, v: str) -> str:
        if not v.startswith("https://"):
            raise ValueError("Domain must start with https://")
        return v.rstrip("/")

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        if "@" not in v:
            raise ValueError("Invalid email format")
        return v


class BedrockCreds(BaseModel):
    aws_access_key_id: str
    aws_secret_access_key: str
    aws_region: str = "us-east-1"
    model_id: str = "us.anthropic.claude-haiku-4-5-20251001-v1:0"


# ── Verify ──────────────────────────────────────────────────

class AtlassianVerifyRequest(BaseModel):
    atlassian: AtlassianCreds


class BedrockVerifyRequest(BaseModel):
    bedrock: BedrockCreds


class VerifyResponse(BaseModel):
    valid: bool
    display_name: Optional[str] = None
    email: Optional[str] = None
    account_id: Optional[str] = None
    region: Optional[str] = None
    model_id: Optional[str] = None


# ── Confluence ───────────────────────────────────────────────

class ConfluenceSearchRequest(BaseModel):
    atlassian: AtlassianCreds
    bedrock: BedrockCreds
    query: str = Field(..., min_length=1, max_length=200)
    space_keys: list[str] = Field(default=[], max_length=10)
    page_ids: list[str] = Field(default=[], max_length=20)
    max_results: int = Field(default=8, ge=1, le=50)
    ai_summary: bool = True


class ConfluencePage(BaseModel):
    id: str
    title: str
    space: str
    space_key: str
    link: str
    excerpt: str
    last_modified: str
    source: Literal["direct", "search"]


class ConfluenceSearchResponse(BaseModel):
    query: str
    total: int
    results: list[ConfluencePage]
    ai_overview: Optional[str] = None


class PageSummarizeRequest(BaseModel):
    atlassian: AtlassianCreds
    bedrock: BedrockCreds
    page_id: str
    user_query: str = "이 문서의 핵심 내용을 구조화하여 요약해 주세요."


class PageSummaryResponse(BaseModel):
    page_id: str
    page_title: str
    space_name: str
    page_link: str
    version: str
    last_modified: str
    summary: str
    char_count: int


# ── Jira ─────────────────────────────────────────────────────

class JiraSearchRequest(BaseModel):
    atlassian: AtlassianCreds
    bedrock: BedrockCreds
    query: str = Field(..., min_length=1, max_length=200)
    project_keys: list[str] = Field(default=[], max_length=10)
    ticket_ids: list[str] = Field(default=[], max_length=20)
    max_results: int = Field(default=8, ge=1, le=50)
    ai_summary: bool = True


class JiraTicket(BaseModel):
    key: str
    id: str
    summary: str
    status: str
    status_category: str
    assignee: str
    priority: str
    issue_type: str
    project: str
    project_key: str
    updated: str
    labels: list[str]
    link: str
    source: Literal["direct", "search"]


class JiraSearchResponse(BaseModel):
    query: str
    total: int
    results: list[JiraTicket]
    ai_overview: Optional[str] = None


class TicketAnalyzeRequest(BaseModel):
    atlassian: AtlassianCreds
    bedrock: BedrockCreds
    issue_key: str
    user_query: str = "이 티켓의 현재 상황, 주요 논의 사항, 다음 액션 아이템을 정리해 주세요."


class TicketAnalysisResponse(BaseModel):
    issue_key: str
    summary: str
    status: str
    assignee: str
    reporter: str
    priority: str
    issue_type: str
    created: str
    updated: str
    labels: list[str]
    total_comments: int
    link: str
    ai_analysis: str
