function escapeHtml(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

function renderCard(issue) {
    const justification = issue.justification
        ? `<p class="justification"><strong>Why now:</strong> ${escapeHtml(issue.justification)}</p>`
        : "";

    return `
      <article class="card${issue.needsAttention ? " card--priority" : ""}" data-issue="${issue.number}">
        <header>
          <span class="issue-number">#${issue.number}</span>
          <h3>${escapeHtml(issue.title)}</h3>
        </header>
        <p class="summary">${escapeHtml(issue.summary)}</p>
        ${justification}
        <button
          type="button"
          class="add-button"
          data-issue="${issue.number}"
          data-testid="add-issue-${issue.number}"
          aria-label="Add issue ${issue.number} to the current session context"
        >
          Add to context
        </button>
      </article>`;
}

export function renderPage(issues) {
    const priorityIssues = issues.filter((issue) => issue.needsAttention);
    const backlogIssues = issues.filter((issue) => !issue.needsAttention);

    return `<!doctype html>
<html data-color-mode="auto">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Triage board</title>
    <style>
      :root {
        color-scheme: light dark;
        --canvas-surface: color-mix(in srgb, var(--background-color-default, #ffffff) 94%, var(--text-color-default, #1f2328) 6%);
        --priority-surface: color-mix(in srgb, var(--true-color-red-muted, #ffebe9) 60%, transparent);
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        background: var(--background-color-default, #ffffff);
        color: var(--text-color-default, #1f2328);
        font: var(--text-body-medium, 14px)/var(--leading-body-medium, 20px) var(--font-sans, system-ui, sans-serif);
      }
      main { margin: 0 auto; max-width: 1180px; padding: clamp(16px, 3vw, 32px); }
      h1 {
        font-family: var(--font-sans-display, var(--font-sans, system-ui, sans-serif));
        font-size: var(--text-title-large, 26px);
        line-height: var(--leading-title-large, 32px);
        margin: 0 0 4px;
      }
      h2 {
        font-size: var(--text-title-medium, 18px);
        margin: 28px 0 12px;
      }
      h3 { font-size: 15px; margin: 0; }
      .subtitle { color: var(--text-color-muted, #59636e); margin: 0; }
      .board {
        display: grid;
        gap: 16px;
        grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      }
      .card {
        background: var(--canvas-surface);
        border: 1px solid var(--border-color-default, #d0d7de);
        border-radius: 10px;
        display: flex;
        flex-direction: column;
        gap: 10px;
        padding: 16px;
      }
      .card--priority {
        border-color: var(--true-color-red, #cf222e);
        box-shadow: inset 0 3px 0 var(--true-color-red, #cf222e);
      }
      .card header { align-items: baseline; display: flex; gap: 8px; }
      .issue-number {
        color: var(--text-color-muted, #59636e);
        font: var(--text-code-inline, 12px) var(--font-mono, monospace);
      }
      .summary { margin: 0; }
      .justification {
        background: var(--priority-surface);
        border-radius: 6px;
        margin: 0;
        padding: 8px;
      }
      .add-button {
        align-self: flex-start;
        background: var(--true-color-blue, #0969da);
        border: 1px solid var(--true-color-blue, #0969da);
        border-radius: 7px;
        color: var(--color-white, #ffffff);
        cursor: pointer;
        font: inherit;
        font-weight: var(--font-weight-semibold, 600);
        margin-top: auto;
        min-height: 34px;
        padding: 6px 11px;
      }
      .add-button:hover:not(:disabled) { filter: brightness(0.92); }
      .add-button:focus-visible {
        outline: 2px solid var(--color-focus-outline, #0969da);
        outline-offset: 2px;
      }
      .add-button:disabled { cursor: default; opacity: 0.7; }
      #status {
        background: var(--canvas-surface);
        border: 1px solid var(--border-color-default, #d0d7de);
        border-radius: 7px;
        bottom: 16px;
        max-width: 340px;
        padding: 8px 12px;
        position: fixed;
        right: 16px;
      }
      @media (prefers-reduced-motion: reduce) {
        *, *::before, *::after { scroll-behavior: auto !important; transition-duration: 0.01ms !important; }
      }
    </style>
  </head>
  <body>
    <main>
      <h1>Issue triage</h1>
      <p class="subtitle">${issues.length} open issues; ${priorityIssues.length} need attention now</p>

      <section aria-labelledby="priority-heading">
        <h2 id="priority-heading">Needs attention now</h2>
        <div class="board">
          ${priorityIssues.map(renderCard).join("\n")}
        </div>
      </section>

      <section aria-labelledby="backlog-heading">
        <h2 id="backlog-heading">Backlog</h2>
        <div class="board">
          ${backlogIssues.map(renderCard).join("\n")}
        </div>
      </section>
    </main>

    <div id="status" role="status" aria-live="polite" hidden></div>

    <script>
      const status = document.querySelector("#status");
      let statusTimer;

      function showStatus(message) {
        status.textContent = message;
        status.hidden = false;
        clearTimeout(statusTimer);
        statusTimer = setTimeout(() => {
          status.hidden = true;
        }, 4000);
      }

      document.querySelectorAll(".add-button").forEach((button) => {
        button.addEventListener("click", async () => {
          const issueNumber = Number(button.dataset.issue);
          button.disabled = true;
          button.textContent = "Adding...";

          try {
            const response = await fetch("/add-to-context", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ number: issueNumber }),
            });
            const result = await response.json();

            if (!response.ok) {
              throw new Error(result.error ?? "Request failed.");
            }

            button.textContent = "Added";
            showStatus("Issue #" + issueNumber + " was added to the current session.");
          } catch (error) {
            button.disabled = false;
            button.textContent = "Add to context";
            showStatus("Could not add issue #" + issueNumber + ": " + error.message);
          }
        });
      });
    </script>
  </body>
</html>`;
}
