# Resume Format Guide

How to write a `.md` resume for md2pdf-cv so it renders correctly — both in
the app's live preview and in the exported PDF (they use the exact same
styling, so what you see in preview is what you get in the PDF).

## Header (name + contact line)

Start with an `# H1` for your name. The line *immediately* after it is
treated as your contact line and both get centered automatically:

```markdown
# Jane Doe
jane@example.com · (555) 555-1234 · City, State
```

Use `·` (or `|` if you don't need the split-line feature below) to separate
contact items — don't use a literal `|` here unless you specifically want
that line to split left/right instead of center (see next section).

## Section headers

Use `## H2` for section names (EDUCATION, EXPERIENCE, PROJECTS, SKILLS, ...).
These render uppercase with an underline:

```markdown
## Experience
```

## Entries: the "Left | Right" split-line format

Any line containing `Left text | Right text` (a literal pipe with a space on
each side) renders as two columns — left text flush to the left margin,
right text flush to the right margin. This works on heading lines and on
plain text lines:

```markdown
### Company Name | Location
*Job Title* | Date Range

- Accomplishment one
- Accomplishment two
```

Renders as:

```
Company Name                                              Location
Job Title                                              Date Range
  • Accomplishment one
  • Accomplishment two
```

Use `###` (H3) for the company/school line and a plain line for the
role/degree + dates line. A full entry looks like:

```markdown
### State University | City, ST
B.Sc. Computer Science | Sep 2022 – May 2026

### Acme Corp | City, ST
*Senior Software Engineer* | Jan 2022 – Present

- Led development of X, improving Y by Z%
- Mentored a team of 3 engineers
```

**Notes on the split-line format:**
- Each side is rendered independently, so `**bold**`, `*italic*`, and links
  work normally on either side.
- Bullet lines (`- ...`, `* ...`, `1. ...`), fenced code blocks, and
  Markdown tables are never treated as split-lines, even if they contain `|`.
- The right side is always de-emphasized (normal weight, non-italic, gray)
  regardless of formatting on the left, so dates/locations read as metadata.
- If a line only needs to be centered or plain (not split), just don't put
  a ` | ` in it.

### Adding a tech-stack / tools line

Add a plain line (no `|`) after the role/dates line and before the bullets —
it doesn't need any special syntax:

```markdown
### Acme Corp | City, ST
*Senior Software Engineer* | Jan 2022 – Present
Python, FastAPI, PostgreSQL, Docker, AWS

- Led development of X, improving Y by Z%
- Mentored a team of 3 engineers
```

Wrap it in `*italics*` if you want it visually de-emphasized like the role
line above it; plain text also works and renders in normal black.

### Projects entries (name + date, no separate location line)

A project usually only needs one split-line — name on the left, date on the
right — followed straight by an optional stack line and/or bullets:

```markdown
## Projects

### Resume Builder | Mar 2026
React, Node.js, MongoDB

- Built a tool to generate formatted resumes from Markdown
- Shipped a live preview with adjustable font size

### Portfolio Site | Jan 2025

- Designed and deployed a personal site with a static site generator
```

## Everything else is standard Markdown

- `**bold**`, `*italic*`
- `- item` or `* item` for bullet lists
- `[text](https://...)` for links
- `---` for a horizontal rule (renders as a black divider line)
- Tables (`| a | b |` / `| --- | --- |`) are supported and rendered with
  simple black borders

## Full example

```markdown
# Jane Doe
jane@example.com · (555) 555-1234 · City, State · github.com/janedoe

## Education

### State University | City, ST
B.Sc. Computer Science | Sep 2022 – May 2026

## Experience

### Acme Corp | City, ST
*Senior Software Engineer* | Jan 2022 – Present
Python, FastAPI, PostgreSQL, Docker, AWS

- Led development of the checkout redesign, improving conversion by 12%
- Mentored a team of 3 engineers and ran the on-call rotation

### Widgets Inc | Remote
*Software Engineer Intern* | May 2021 – Aug 2021

- Built an internal reporting dashboard used by 50+ employees

## Projects

### Resume Builder | Mar 2026
React, Node.js, MongoDB

- Built a tool to generate formatted resumes from Markdown
- Shipped a live preview with adjustable font size

## Skills

Python, TypeScript, React, PostgreSQL, Docker, AWS
```

## Styling controls (in the app, not the markdown)

- **Font size**: the slider in the app scales the whole document
  proportionally — it isn't something you set in the markdown.
- **Page size**: fixed at US Letter (8.5" × 11") with 0.6" margins.
- **Color**: the output is strictly black/white/grayscale — any color you
  reference (e.g. in HTML) will be ignored/overridden by the stylesheet.
