import * as core from "@actions/core";
import { GitHub } from "@actions/github/lib/utils";

type Octokit = InstanceType<typeof GitHub>;
type RepoType = {
  owner: string;
  repo: string;
};

// This file's functionality was derived from:
// https://github.com/marocchino/sticky-pull-request-comment

const HEADER_COMMENT = "<!-- Primer Spec Preview PR Comment -->";

export default async function createOrUpdateComment(
  octokit: Octokit,
  repo: RepoType,
  prNumber: number
): Promise<void> {
  const commentBody = `${HEADER_COMMENT}\nThe spec from this PR is available at https://preview.seshrs.ml/previews/${
    repo.owner
  }/${
    repo.repo
  }/${prNumber}/.\n\n<sup>(Available until ${getExpiryDate()}.)</sup>`;
  core.info(`Using comment body:\n${commentBody}`);

  const previousCommentId = await findPreviousComment(octokit, repo, prNumber);
  if (previousCommentId) {
    core.info("Updating previous comment.");
    await octokit.issues.updateComment({
      ...repo,
      comment_id: previousCommentId,
      body: commentBody,
    });
  } else {
    core.info("Creating new comment.");
    await octokit.issues.createComment({
      ...repo,
      issue_number: prNumber,
      body: commentBody,
    });
  }
}

async function findPreviousComment(
  octokit: Octokit,
  repo: RepoType,
  issue_number: number
): Promise<number | null> {
  const { data: comments } = await octokit.issues.listComments({
    ...repo,
    issue_number,
  });
  return (
    comments.find((comment) => comment.body?.includes(HEADER_COMMENT))?.id ??
    null
  );
}

function getExpiryDate(): string {
  const date = new Date();
  date.setDate(date.getDate() + 30);
  return date.toDateString();
}
