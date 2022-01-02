# Upload to Primer Spec Preview

This GitHub Action uploads and deploys a site preview build to the Primer Spec Preview service. It also adds a comment to the Pull Request with a link to the site preview.

Contact seshrs@umich.edu if you have questions.

## Usage with Jekyll Site

Create a new workflow file in your repo at `.github/workflows/spec_preview.yml`. Add the following contents. Don't forget to update the lines marked as with `TODO:` comments.

```yaml
# GitHub Actions workflow to generate and upload spec previews to
# Primer Spec Preview (https://github.com/seshrs/primer-spec-preview).
name: Generate spec preview

# Define conditions for when to run this action.
# We'll only generate spec previews on Pull Requests, and only when the
# `docs/` directory has been modified.
on:
  pull_request:
    paths:
      # TODO: Change this to the directory containing your Jekyll site
      - "docs/**"

# A workflow run is made up of one or more jobs. Each job has an id.
# This workflow has only one job that builds and uploads the spec preview.
jobs:
  build-and-upload-site:
    name: Build and upload spec preview
    # Run the job on an Ubuntu machine. For specifications, see
    # https://github.com/actions/virtual-environments
    runs-on: ubuntu-latest

    # Sequence of tasks for this job
    steps:
      # Check out latest code using a pre-existing GH action
      # Docs: https://github.com/actions/checkout
      - name: 📁 Checkout code
        uses: actions/checkout@v2

      # A Ruby environment is required to build Jekyll websites. Use the
      # official GH action provided by Ruby.
      # Docs: https://github.com/ruby/setup-ruby
      - name: 💎 Setup Ruby
        uses: ruby/setup-ruby@v1
        with:
          ruby-version: '3.0'

      # Build the Jekyll site. This GH action from the marketplace is
      # indirectly endorsed by Jekyll, and simply builds the Jekyll site
      # without deploying it. The Jekyll build output is placed in an `_site/`
      # directory.
      # Docs: https://github.com/limjh16/jekyll-action-ts
      - name: 🛠 Build Jekyll site
        uses: limjh16/jekyll-action-ts@v2
        with:
          enable_cache: true

      # Upload the site to Primer Spec Preview and comment on the PR.
      # TODO: Store the Primer Spec Preview secret as an encrypted repo or
      # organization secret named `PRIMER_SPEC_PREVIEW_SECRET`.
      # Docs: https://docs.github.com/en/free-pro-team@latest/actions/reference/encrypted-secrets#creating-encrypted-secrets-for-an-organization
      # Docs: https://github.com/seshrs/upload-to-primer-spec-preview
      - name: 🚀 Upload to Primer Spec Preview
        uses: seshrs/upload-to-primer-spec-preview@v1
        with:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          PRIMER_SPEC_PREVIEW_SECRET: ${{ secrets.PRIMER_SPEC_PREVIEW_SECRET }}
```

## Contributing

Install the dependencies  
```bash
$ npm install
```

Build the typescript and package it for distribution
```bash
$ npm run build && npm run package
```
