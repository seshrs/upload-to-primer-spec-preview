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
  if (await findPreviousComment(octokit, repo, prNumber)) {
    core.info("Skipping since previous comment exists.");
    return;
  }

  const commentBody = `${HEADER_COMMENT}\nThe spec from this PR is available at https://preview.seshrs.ml/previews/${repo.owner}/${repo.repo}/${prNumber}/.`;
  await octokit.issues.createComment({
    ...repo,
    issue_number: prNumber,
    body: commentBody,
  });
  core.info(commentBody);
}

async function findPreviousComment(
  octokit: Octokit,
  repo: RepoType,
  issue_number: number
): Promise<boolean> {
  const { data: comments } = await octokit.issues.listComments({
    ...repo,
    issue_number,
  });
  return !!comments.find((comment) => comment.body?.includes(HEADER_COMMENT));
}
