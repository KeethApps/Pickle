# Contributing to Pickle

Thanks for wanting to help. Bug reports, ideas, design feedback and pull requests are all welcome.

## Ways to help

- **⭐ Star the repo.** It genuinely helps other people find Pickle.
- **Report a bug.** Use the [bug report form](../../issues/new?template=bug_report.yml). Steps to reproduce help most.
- **Suggest a feature or a new card type.** Use the [feature request form](../../issues/new?template=feature_request.yml).
- **Improve the docs or the website.** The landing page lives in [`docs/`](docs/).
- **Send a pull request.** See below.

## Before you start

For anything bigger than a small fix, please **open an issue first** so we can agree on the direction before you spend time on it.

## Pull request checklist

1. Fork the repo and create a branch from `main`: `git checkout -b fix/short-description`
2. Keep the change focused. One idea per pull request.
3. Match the existing style of the code around it.
4. Test your change. <!-- EDIT: add your test command, e.g. `npm test` -->
5. Update the docs and [CHANGELOG.md](CHANGELOG.md) if behaviour changes.
6. Open the pull request and fill in the template.

## Commit messages

Short and in the present tense, for example `Add scalable servings to recipe detail`. Prefixes such as `fix:`, `feat:` and `docs:` are welcome but not required.

## Design principles

Pickle is meant to feel calm, so changes are judged against these:

- **Every card has the same shape.** Source, one badge, a title, one subtitle, up to two pills, one primary action. Anything else goes in the detail screen.
- **Behaviour follows the type, not the name.** Statuses can be renamed and recolored freely.
- **Saving is instant.** Sorting can always wait.

## Code of Conduct

By taking part you agree to follow the [Code of Conduct](CODE_OF_CONDUCT.md).
