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
    const siteDirectory = core.getInput("site_directory_path") || "_site";
    const prNumber = event.number;

    let usingPrNumber, basename;
    const customBasename = core.getInput("custom_basename");
    if (customBasename) {
      if (customBasename.includes("/") || customBasename.length > 20) {
        throw new Error(`Invalid custom basename: ${customBasename}`);
      }
      usingPrNumber = false;
      basename = customBasename;
    } else {
      usingPrNumber = true;
      basename = prNumber.toString();
    }

    core.info(
      `Uploading site preview from ${siteDirectory} for basename #${basename} on repo ${repoString}`
    );

    if (!fs.lstatSync(siteDirectory).isDirectory()) {
      core.setFailed(`Site directory does not exist: ${siteDirectory}`);
      return Promise.resolve();
    }

    core.startGroup("🗜 Compress site archive...");
    const { stdout: tarOutput } = await execa("tar", [
      "-C",
      siteDirectory,
      "-czf",
      "_site.tar.gz",
      "--dereference",
      ".",
    ]);
    core.info(tarOutput);
    core.info("Created _site.tar.gz");
    core.endGroup();

    core.startGroup("🚀 Upload site preview...");
    const curlCommand = [
      "curl",
      `-F repo=${repoString}`,
      `-F app_secret=${primerSpecPreviewSecret}`,
      `-F pr_number=${basename}`,
      "-F site=@_site.tar.gz",
      "https://preview.seshrs.ml/upload-site-preview",
    ].join(" ");
    core.info(curlCommand);
    const { stdout: curlOutput, stderr: curlErr } = execa.commandSync(
      curlCommand
    );
    core.info(curlOutput);
    core.info(curlErr);
    core.info("Uploaded to Primer Spec Preview");
    core.endGroup();

    if (usingPrNumber) {
      core.startGroup("💬 Comment on PR");
      await createOrUpdateComment(octokit, github.context.repo, prNumber);
      core.endGroup();
    }
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
