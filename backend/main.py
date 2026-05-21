from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import io
import markdown2
from weasyprint import HTML, CSS

app = FastAPI(title="Resume Generator API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Models ---

class Experience(BaseModel):
    company: str
    role: str
    period: str
    bullets: str  # newline-separated

class Project(BaseModel):
    name: str
    url: str
    desc: str

class ResumeData(BaseModel):
    name: str
    title: str
    email: str
    github: str
    summary: str
    skills: str          # comma-separated
    experiences: List[Experience]
    projects: List[Project]


# --- Helpers ---

def build_markdown(d: ResumeData) -> str:
    skill_tags = " ".join(
        f"`{s.strip()}`"
        for s in d.skills.split(",")
        if s.strip()
    )

    exp_section = "\n\n".join(
        f"### {e.role} @ {e.company}\n*{e.period}*\n\n"
        + "\n".join(f"- {b}" for b in e.bullets.splitlines() if b)
        for e in d.experiences if e.company
    )

    proj_section = "\n\n".join(
        f"### [{p.name}]({p.url or '#'})\n{p.desc}"
        for p in d.projects if p.name
    )

    return f"""# {d.name}
### {d.title}

📧 {d.email} · 🐙 [{d.github}](https://github.com/{d.github})

---

## Summary
{d.summary}

---

## Skills
{skill_tags}

---

## Experience
{exp_section or '—'}

---

## Projects
{proj_section or '—'}
"""


PDF_CSS = CSS(string="""
    @import url('https://fonts.googleapis.com/css2?family=Lora:wght@400;600;700&family=JetBrains+Mono&display=swap');

    * { box-sizing: border-box; }

    body {
        font-family: 'Lora', Georgia, serif;
        font-size: 13px;
        line-height: 1.75;
        color: #1a1a1a;
        max-width: 800px;
        margin: 0 auto;
        padding: 48px 56px;
    }

    h1 {
        font-size: 32px;
        font-weight: 700;
        margin: 0 0 4px;
        letter-spacing: -0.5px;
    }

    h3:first-of-type {
        font-size: 14px;
        font-weight: 400;
        color: #555;
        margin: 0 0 12px;
        letter-spacing: 1px;
    }

    h2 {
        font-size: 11px;
        letter-spacing: 3px;
        text-transform: uppercase;
        color: #888;
        border-bottom: 1px solid #e0e0e0;
        padding-bottom: 4px;
        margin: 28px 0 14px;
    }

    h3 {
        font-size: 14px;
        font-weight: 600;
        margin: 16px 0 2px;
    }

    em { color: #666; font-style: normal; font-size: 12px; }

    ul { padding-left: 18px; margin: 6px 0; }
    li { margin-bottom: 3px; }

    code {
        font-family: 'JetBrains Mono', monospace;
        font-size: 11px;
        background: #f0f0f0;
        border-radius: 3px;
        padding: 1px 6px;
    }

    hr { border: none; border-top: 1px solid #e8e8e8; margin: 20px 0; }

    a { color: #1a1a1a; }
""")


# --- Routes ---

@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/api/markdown")
def get_markdown(data: ResumeData):
    """Return the generated Markdown as plain text."""
    return {"markdown": build_markdown(data)}


@app.post("/api/pdf")
def get_pdf(data: ResumeData):
    """Generate and return a PDF resume."""
    md_text = build_markdown(data)
    html_body = markdown2.markdown(md_text, extras=["fenced-code-blocks"])
    html_full = f"<html><body>{html_body}</body></html>"

    pdf_bytes = HTML(string=html_full).write_pdf(stylesheets=[PDF_CSS])
    filename = f"{data.name or 'resume'}.pdf".replace(" ", "_")

    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
