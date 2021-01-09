import * as core from "@actions/core";
import github from "@actions/github";
import * as Webhooks from "@octokit/webhooks";

async function run(): Promise<void> {
  try {
    // const githubToken = core.getInput("GH_TOKEN");
    // const octokit = github.getOctokit(githubToken);
    const event = github.context
      .payload as Webhooks.EventPayloads.WebhookPayloadPullRequest;

    const repo = `${github.context.repo.owner}/${github.context.repo.repo}`;
    const prNumber = event.number;

    core.info(`PR #${prNumber} on repo ${repo}`);
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
