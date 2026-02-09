#!/usr/bin/env python3
"""Convert USER_GUIDE.md to a styled PDF using markdown + weasyprint."""

import markdown
from weasyprint import HTML

INPUT = "USER_GUIDE.md"
OUTPUT = "USER_GUIDE.pdf"

# Read markdown
with open(INPUT, "r", encoding="utf-8") as f:
    md_text = f.read()

# Convert to HTML
html_body = markdown.markdown(
    md_text,
    extensions=["tables", "fenced_code", "codehilite", "toc"],
)

# Wrap with full HTML + CSS styling
html_doc = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<style>
  @page {{
    size: A4;
    margin: 2cm 2.2cm;
    @top-center {{
      content: "MFI Clarity — User Guide";
      font-size: 9px;
      color: #94a3b8;
      font-family: 'Helvetica Neue', Arial, sans-serif;
    }}
    @bottom-center {{
      content: "Page " counter(page) " of " counter(pages);
      font-size: 9px;
      color: #94a3b8;
      font-family: 'Helvetica Neue', Arial, sans-serif;
    }}
  }}

  body {{
    font-family: 'Helvetica Neue', Arial, sans-serif;
    font-size: 11px;
    line-height: 1.6;
    color: #1e293b;
  }}

  h1 {{
    font-size: 28px;
    color: #1e40af;
    border-bottom: 3px solid #3b82f6;
    padding-bottom: 10px;
    margin-top: 30px;
  }}

  h2 {{
    font-size: 20px;
    color: #1e3a5f;
    border-bottom: 2px solid #93c5fd;
    padding-bottom: 6px;
    margin-top: 28px;
    page-break-after: avoid;
  }}

  h3 {{
    font-size: 15px;
    color: #1e40af;
    margin-top: 20px;
    page-break-after: avoid;
  }}

  h4 {{
    font-size: 13px;
    color: #334155;
    margin-top: 16px;
    page-break-after: avoid;
  }}

  p {{
    margin: 6px 0;
  }}

  blockquote {{
    border-left: 4px solid #3b82f6;
    background: #eff6ff;
    margin: 12px 0;
    padding: 10px 16px;
    border-radius: 0 6px 6px 0;
    color: #1e3a5f;
    font-style: italic;
  }}

  blockquote p {{
    margin: 4px 0;
  }}

  table {{
    width: 100%;
    border-collapse: collapse;
    margin: 12px 0;
    font-size: 10.5px;
    page-break-inside: avoid;
  }}

  thead {{
    background: linear-gradient(135deg, #1e40af, #3b82f6);
  }}

  th {{
    color: white;
    padding: 8px 12px;
    text-align: left;
    font-weight: 600;
    font-size: 10.5px;
  }}

  td {{
    padding: 7px 12px;
    border-bottom: 1px solid #e2e8f0;
  }}

  tr:nth-child(even) {{
    background-color: #f8fafc;
  }}

  tr:hover {{
    background-color: #eff6ff;
  }}

  code {{
    background: #f1f5f9;
    padding: 2px 5px;
    border-radius: 3px;
    font-family: 'Courier New', monospace;
    font-size: 10px;
    color: #be185d;
  }}

  pre {{
    background: #1e293b;
    color: #e2e8f0;
    padding: 14px 18px;
    border-radius: 8px;
    font-family: 'Courier New', monospace;
    font-size: 10px;
    line-height: 1.5;
    overflow-x: auto;
    page-break-inside: avoid;
    margin: 12px 0;
  }}

  pre code {{
    background: none;
    color: #e2e8f0;
    padding: 0;
  }}

  hr {{
    border: none;
    height: 2px;
    background: linear-gradient(to right, #3b82f6, #93c5fd, transparent);
    margin: 24px 0;
  }}

  ul, ol {{
    margin: 8px 0;
    padding-left: 24px;
  }}

  li {{
    margin: 3px 0;
  }}

  strong {{
    color: #1e3a5f;
  }}

  a {{
    color: #2563eb;
    text-decoration: none;
  }}

  /* Cover-like first heading */
  h1:first-child {{
    font-size: 36px;
    text-align: center;
    border-bottom: 4px solid #3b82f6;
    padding-bottom: 16px;
    margin-bottom: 8px;
  }}

  /* Emoji sizing */
  img.emoji {{
    height: 1em;
    width: 1em;
  }}
</style>
</head>
<body>
{html_body}
</body>
</html>"""

# Generate PDF
HTML(string=html_doc).write_pdf(OUTPUT)
print(f"PDF generated: {OUTPUT}")
