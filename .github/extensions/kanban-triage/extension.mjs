import { createServer } from "node:http";
import { CanvasError, createCanvas, joinSession } from "@github/copilot-sdk/extension";
import { ISSUES } from "./data.mjs";
import { renderPage } from "./render.mjs";

const servers = new Map();
const MAX_REQUEST_BODY_BYTES = 10_000;

function findIssue(number) {
    return ISSUES.find((issue) => issue.number === number);
}

function issuePrompt(issue) {
    const lines = [
        `Let's start working on issue #${issue.number}: ${issue.title}`,
        "",
        issue.summary,
    ];

    if (issue.justification) {
        lines.push("", `Why it is a priority right now: ${issue.justification}`);
    }

    return lines.join("\n");
}

function readRequestBody(request) {
    return new Promise((resolve, reject) => {
        let body = "";
        request.setEncoding("utf8");
        request.on("data", (chunk) => {
            body += chunk;
            if (body.length > MAX_REQUEST_BODY_BYTES) {
                reject(new Error("Request body is too large."));
                request.destroy();
            }
        });
        request.on("end", () => resolve(body));
        request.on("error", reject);
    });
}

function sendJson(response, statusCode, result) {
    response.statusCode = statusCode;
    response.setHeader("Content-Type", "application/json; charset=utf-8");
    response.end(JSON.stringify(result));
}

async function handleAddToContext(request, response, session) {
    try {
        const body = JSON.parse(await readRequestBody(request));
        const issue = findIssue(Number(body?.number));

        if (!issue) {
            sendJson(response, 404, { error: "Issue is not on this triage board." });
            return;
        }

        await session.send({ prompt: issuePrompt(issue) });
        sendJson(response, 200, { number: issue.number });
    } catch (error) {
        sendJson(response, 400, { error: String(error?.message ?? error) });
    }
}

async function startServer(session) {
    const server = createServer((request, response) => {
        if (request.method === "GET" && request.url === "/") {
            response.setHeader("Content-Type", "text/html; charset=utf-8");
            response.end(renderPage(ISSUES));
            return;
        }

        if (request.method === "POST" && request.url === "/add-to-context") {
            void handleAddToContext(request, response, session);
            return;
        }

        response.statusCode = 404;
        response.end("Not found");
    });

    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
    const address = server.address();
    const port = typeof address === "object" && address ? address.port : 0;
    return { server, url: `http://127.0.0.1:${port}/` };
}

const session = await joinSession({
    canvases: [
        createCanvas({
            id: "kanban-triage",
            displayName: "Triage board",
            description:
                "Kanban board of open issues, split into the three needing attention now and the remaining backlog. Cards can add their issue to the current session.",
            actions: [
                {
                    name: "add_issue_to_context",
                    description: "Add an issue from the board to the current session context.",
                    inputSchema: {
                        type: "object",
                        properties: {
                            number: { type: "number", description: "GitHub issue number" },
                        },
                        required: ["number"],
                    },
                    handler: async (context) => {
                        const issue = findIssue(context.input?.number);
                        if (!issue) {
                            throw new CanvasError(
                                "issue_not_found",
                                `No issue #${context.input?.number} is on the board.`,
                            );
                        }

                        await session.send({ prompt: issuePrompt(issue) });
                        return { number: issue.number };
                    },
                },
            ],
            open: async (context) => {
                let entry = servers.get(context.instanceId);
                if (!entry) {
                    entry = await startServer(session);
                    servers.set(context.instanceId, entry);
                }

                return { title: "Triage board", url: entry.url };
            },
            onClose: async (context) => {
                const entry = servers.get(context.instanceId);
                if (entry) {
                    servers.delete(context.instanceId);
                    await new Promise((resolve) => entry.server.close(resolve));
                }
            },
        }),
    ],
});
