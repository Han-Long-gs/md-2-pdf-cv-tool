# Resume Creation Workflow

Use ChatGPT to tailor your resume content to each job, then use md2pdf-cv to
turn it into a PDF.

```
base resume + format guide + job description
  → ChatGPT tailors it → tailored .md
  → md2pdf-cv preview → your review → PDF
```

## 1. One-time: set up a ChatGPT Project

Create a ChatGPT Project (e.g. "Job Applications") and upload two files into "Sources" tab:

- **`RESUME_FORMAT_GUIDE.md`** (from this repo): the Markdown format the app
  expects, such as `### Company | Location` and `*Role* | Date` lines.
- **Your base resume** (e.g. `base-resume.md`): every experience, project,
  skill and metric you have. This is the source of truth, so keep it complete
  and accurate. Write it in the format guide's style.

## 2. For each job: start a new chat in the Project

Start a fresh chat for every application so earlier jobs don't leak in.
Paste this prompt with the job description:

> Read the resume format guide and my base resume from this Project. Tailor my
> resume to the job description below and give me the result as a downloadable
> `.md` file.
>
> Prioritize the experiences, projects, technologies and accomplishments most
> relevant to the job. Rewrite and reorder bullets where useful, but do not
> invent skills, experience, metrics or technologies that are not in my base
> resume.
>
> Follow the format guide exactly so the file renders correctly in md2pdf-cv.
>
> Job description:
> [PASTE JOB DESCRIPTION]

## 3. Review what ChatGPT wrote

Before you render it, check that:

- every claim is true and comes from your base resume
- your most relevant experience comes first
- the job's key terms appear naturally
- no tools or skills were added that you don't have

## 4. Render the PDF with md2pdf-cv

1. Launch the app: double-click your Desktop shortcut, or run
   `./run.command` from the project folder. (The README shows how to set up
   the shortcut.)
2. Drag the downloaded `.md` file onto **Drag .md file here**, or paste its
   contents into the editor. The title is filled in from the filename.
3. Check the preview. Dashed blue lines show page breaks. Use the font-size
   slider or trim content to fit the page count you want, and fix small
   wording directly in the editor.
4. Click **Accept → Save PDF**. The PDF is saved to your output folder
   (`~/Desktop/md2pdf-cv` by default; see the README to change it).
