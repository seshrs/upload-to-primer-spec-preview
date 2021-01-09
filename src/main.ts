import * as core from "@actions/core";
import * as github from "@actions/github";
import * as Webhooks from "@octokit/webhooks";
import * as fs from "fs";
import execa from "execa";

import createOrUpdateComment from "./createOrUpdateComment";

async function run(): Promise<void> {
  try {
    const githubToken = core.getInput("GITHUB_TOKEN", { required: true });
    const octokit = github.getOctokit(githubToken);
    const event = github.context
      .payload as Webhooks.EventPayloads.WebhookPayloadPullRequest;

    const primerSpecPreviewSecret = core.getInput(
      "PRIMER_SPEC_PREVIEW_SECRET",
      { required: true }
    );
    core.setSecret(primerSpecPreviewSecret);

    const repoString = `${github.context.repo.owner}/${github.context.repo.repo}`;
    const prNumber = event.number;
    const siteDirectory =
      core.getInput("site_directory_path", {
        required: false,
      }) || "_site";

    core.info(
      `Uploading site preview from ${siteDirectory} for PR #${prNumber} on repo ${repoString}`
    );

    if (!fs.lstatSync(siteDirectory).isDirectory()) {
      core.setFailed(`Site directory does not exist: ${siteDirectory}`);
      return Promise.resolve();
    }

    core.startGroup("🗜 Compress site archive...");
    const tarPromise = execa("tar", [
      "-C",
      siteDirectory,
      "-czf",
      "_site.tar.gz",
      "--dereference",
      ".",
    ]);
    tarPromise.stdout?.pipe(process.stdout);
    await tarPromise;
    core.info("Created _site.tar.gz");
    core.endGroup();

    core.startGroup("🚀 Upload site preview...");
    const curlPromise = execa("curl", [
      `-F repo="${repoString}"`,
      `-F app_secret="${primerSpecPreviewSecret}"`,
      `-F pr_number="${prNumber}"`,
      "-F site=@_site.tar.gz",
      "https://preview.seshrs.ml/upload-site-preview",
    ]);
    curlPromise.stdout?.pipe(process.stdout);
    await curlPromise;
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
