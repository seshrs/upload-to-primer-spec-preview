import * as core from "@actions/core";
import github from "@actions/github";
import * as Webhooks from "@octokit/webhooks";
import fs from "fs";
import execa from "execa";

async function run(): Promise<void> {
  try {
    // const githubToken = core.getInput("GH_TOKEN");
    // const octokit = github.getOctokit(githubToken);
    const event = github.context
      .payload as Webhooks.EventPayloads.WebhookPayloadPullRequest;

    const repo = `${github.context.repo.owner}/${github.context.repo.repo}`;
    const prNumber = event.number;
    const siteDirectory = core.getInput("site_directory_path");

    core.info(
      `Uploading site preview from ${siteDirectory} for PR #${prNumber} on repo ${repo}`
    );

    if (!fs.lstatSync(siteDirectory).isDirectory()) {
      core.setFailed(`Site directory does not exist: ${siteDirectory}`);
      return Promise.resolve();
    }

    await execa("tar", [
      "-C",
      siteDirectory,
      "-czf",
      "_site.tar.gz",
      "--dereference",
      ".",
    ]);
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
