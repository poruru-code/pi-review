import assert from "node:assert/strict";
import test from "node:test";
import {
	extractPiReviewVerdict,
	parseEndReviewAction,
	parseReviewArgs,
} from "./review.ts";

test("extractPiReviewVerdict accepts the exact correct line", () => {
	assert.equal(extractPiReviewVerdict("Overall verdict: correct"), "correct");
});

test("extractPiReviewVerdict accepts the exact needs-attention line", () => {
	assert.equal(extractPiReviewVerdict("Overall verdict: needs attention"), "needs_attention");
});

test("extractPiReviewVerdict fails safe without an explicit verdict", () => {
	assert.equal(extractPiReviewVerdict("The change looks correct."), "unknown");
});

test("extractPiReviewVerdict fails safe when the response is unavailable", () => {
	assert.equal(extractPiReviewVerdict(undefined), "unknown");
});

test("extractPiReviewVerdict fails safe for contradictory verdicts", () => {
	assert.equal(
		extractPiReviewVerdict("Overall verdict: correct\nOverall verdict: needs attention"),
		"unknown",
	);
});

test("extractPiReviewVerdict requires exactly one explicit verdict", () => {
	assert.equal(
		extractPiReviewVerdict("Overall verdict: correct\nOverall verdict: correct"),
		"unknown",
	);
});

test("parseReviewArgs accepts --fresh", () => {
	assert.deepEqual(parseReviewArgs("commit abc123 --fresh"), {
		target: { type: "commit", sha: "abc123", title: undefined },
		mode: "fresh",
		extraInstruction: undefined,
	});
});

test("parseReviewArgs accepts --current", () => {
	assert.deepEqual(parseReviewArgs("folder src docs --current"), {
		target: { type: "folder", paths: ["src", "docs"] },
		mode: "current",
		extraInstruction: undefined,
	});
});

test("parseReviewArgs rejects --fresh with --current", () => {
	assert.deepEqual(parseReviewArgs("uncommitted --fresh --current"), {
		target: null,
		error: "--fresh and --current cannot be used together",
	});
});

test("parseReviewArgs combines an explicit mode with --extra", () => {
	assert.deepEqual(parseReviewArgs('branch main --fresh --extra "focus on concurrency"'), {
		target: { type: "baseBranch", branch: "main" },
		mode: "fresh",
		extraInstruction: "focus on concurrency",
	});
});

test("parseEndReviewAction maps supported programmatic actions", () => {
	assert.deepEqual(parseEndReviewAction("return"), { action: "return" });
	assert.deepEqual(parseEndReviewAction("summarize"), { action: "summarize" });
	assert.deepEqual(parseEndReviewAction("fix"), { action: "fix" });
});

test("parseEndReviewAction leaves an argument-free call interactive", () => {
	assert.deepEqual(parseEndReviewAction(undefined), {});
});

test("parseEndReviewAction rejects an unknown action", () => {
	assert.deepEqual(parseEndReviewAction("later"), {
		error: 'Unknown /end-review action "later". Expected return, summarize, or fix.',
	});
});
