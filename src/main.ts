import * as core from "@actions/core";
import * as github from "@actions/github";
import * as Webhooks from "@octokit/webhooks";
import * as fs from "fs";
import execa from "execa";

import createOrUpdateComment from "./createOrUpdateComment";

async function run(): Promise<void> {
  try {
    const githubToken = core.getInput("GH_TOKEN");
    const octokit = github.getOctokit(githubToken);
    const event = github.context
      .payload as Webhooks.EventPayloads.WebhookPayloadPullRequest;

    const primerSpecPreviewSecret = core.getInput("PRIMER_SPEC_PREVIEW_SECRET");
    core.setSecret(primerSpecPreviewSecret);

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

    core.startGroup("🗜 Compress site archive...");
    await execa("tar", [
      "-C",
      siteDirectory,
      "-czf",
      "_site.tar.gz",
      "--dereference",
      ".",
    ]);
    core.info("Created _site.tar.gz");
    core.endGroup();

    core.startGroup("🚀 Upload site preview...");
    await execa("curl", [
      `-F repo=${repo}`,
      `-F app_secret=${primerSpecPreviewSecret}`,
      `-F pr_number=${prNumber}`,
      "-F site=@_site.tar.gz",
    ]);
    core.info("Uploaded to Primer Spec Preview");
    core.endGroup();

    core.startGroup("💬 Comment on PR");
    await createOrUpdateComment(octokit, github.context.repo, prNumber);
    core.endGroup();
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
