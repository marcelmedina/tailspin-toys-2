// This curated snapshot keeps the initial board useful without requiring GitHub
// authentication from the extension process.
export const ISSUES = [
    {
        number: 9,
        title: "Add a Backer Concierge assistant for catalog questions",
        summary:
            "Adds a free-text assistant that recommends games using only catalog data and refuses to invent facts such as funding totals, prices, or release dates.",
        needsAttention: true,
        justification:
            "This is the largest and most ambiguous open issue. Its grounding, refusal, and clarification behavior needs scoping before implementation starts.",
    },
    {
        number: 7,
        title: "Allow users to filter games by category and publisher",
        summary:
            "Lets users combine category and publisher filters backed by new data-access helpers in src/lib/.",
        needsAttention: true,
        justification:
            "This touches the same game-list page and data helpers as search, sorting, and pagination, so sequencing it now will prevent overlapping work.",
    },
    {
        number: 6,
        title: "Implement pagination on the game list page",
        summary:
            "Adds pagination to the data-access helpers and accessible controls to the game list page.",
        needsAttention: true,
        justification:
            "Pagination changes the core data-fetching contract that search, sorting, and filtering will build on, so completing it first avoids rework.",
    },
    {
        number: 5,
        title: "Show a catalog summary on the home page",
        summary:
            "Displays the catalog's total game count and average rating with graceful empty-state handling.",
        needsAttention: false,
    },
    {
        number: 4,
        title: "Add a publisher page listing that publisher's games",
        summary:
            "Adds a prerendered page for each publisher that reuses the game card to list its games.",
        needsAttention: false,
    },
    {
        number: 3,
        title: "Show category and publisher descriptions on the game detail page",
        summary:
            "Surfaces existing category and publisher descriptions on game detail pages without schema changes.",
        needsAttention: false,
    },
    {
        number: 2,
        title: "Allow users to sort the game list",
        summary:
            "Adds title and star-rating sort options, including a documented order for unrated games.",
        needsAttention: false,
    },
    {
        number: 1,
        title: "Add a search box to find games by title",
        summary:
            "Adds case-insensitive title search with an accessible input and a clear no-results state.",
        needsAttention: false,
    },
];
