/** Alphabet consisting of alphanumeric characters */
export const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

/**
 * Title templates used to generate papers that are "found" by a fetcher, but do not exist in the
 * local database yet. The placeholder `$QUERY` is replaced by the search query.
 */
export const FETCHER_PAPER_TITLE_TEMPLATES = [
    "A Survey of $QUERY",
    "$QUERY: A Systematic Literature Review",
    "Towards a Better Understanding of $QUERY",
    "An Empirical Study on $QUERY",
    "Rethinking $QUERY in Practice",
];

/** Authors used for papers that are generated as results of a fetcher search. */
export const FETCHER_PAPER_AUTHORS = [
    { firstName: "Ada", lastName: "Lovelace" },
    { firstName: "Alan", lastName: "Turing" },
    { firstName: "Grace", lastName: "Hopper" },
    { firstName: "Edsger", lastName: "Dijkstra" },
    { firstName: "Barbara", lastName: "Liskov" },
];
