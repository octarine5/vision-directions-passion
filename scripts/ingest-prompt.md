# Knowledge Base Ingestion Prompt

This prompt is used by the scheduled remote agent to update the knowledge base.

## Task

You are updating the Staff+ Career Knowledge Base. The data lives in `db/*.json` files and is rendered by `knowledge-base.html`.

## Data Schema

Each JSON file in `db/` follows this structure:

```json
{
  "metadata": {
    "category": "category-id",
    "display_name": "Display Name",
    "layout": "table" | "cards",
    "columns": ["col1", "col2"],   // only for table layout
    "last_updated": "YYYY-MM-DD"
  },
  "sections": [
    {
      "title": "Section Name",
      "items": [ ... ]
    }
  ]
}
```

### Item schemas by category:

**system-design.json & ml-systems.json:**
```json
{"topic": "...", "concepts": "...", "tags": ["infra","ml","data","biz","scale"], "resources": [{"title": "...", "url": "..."}], "added": "YYYY-MM-DD"}
```

**business-problems.json:**
```json
{"problem": "...", "enterprise": "...", "market_fit": "...", "tam": "$XB", "tags": [...], "added": "YYYY-MM-DD"}
```

**impact-axes.json:**
```json
{"axis": "...", "example": "...", "level": "Staff|Sr Staff|Principal: description", "added": "YYYY-MM-DD"}
```

**org-decisions.json:**
```json
{"topic": "...", "considerations": "...", "phase": "Discovery|Planning|Execution|Launch|Operate|Growth|Sunset|Cross-cutting", "added": "YYYY-MM-DD"}
```

**tech-talks.json:**
```json
{"title": "...", "url": "https://...", "speaker": "...", "venue": "...", "description": "...", "added": "YYYY-MM-DD"}
```

## Steps

1. Read all `db/*.json` files to understand current content and avoid duplicates.

2. Search the web for NEW content from the past 1-2 weeks in these areas:
   - **System Design**: New blog posts, case studies, or architectural deep-dives from major tech companies
   - **ML Systems**: New ML infrastructure papers, LLM serving advances, training breakthroughs, MLOps tools
   - **Business Problems**: New funded startups (Series A+), market shifts, enterprise AI adoption signals
   - **Impact Axes**: New examples of staff/principal-level impact from eng blogs or talks
   - **Tech Talks**: New conference talks, YouTube uploads from engineering channels
   - **Org Decisions**: New writings on engineering management, team scaling, project lifecycle

3. For each new item found:
   - Create the item object matching the schema above
   - Set `added` to today's date
   - Append to the appropriate section in the correct JSON file
   - Use existing tags taxonomy: infra, ml, data, biz, scale

4. Update `metadata.last_updated` in each modified JSON file.

5. Commit and push changes.

## Quality Standards

- Only add genuinely valuable, high-signal content
- Verify links are real and accessible via WebFetch
- No duplicates — check existing items before adding
- Aim to add 3-10 new items total across all files (don't force it)
- Do NOT remove existing content, only append new entries
- Do NOT modify knowledge-base.html — it reads from the JSON files dynamically
