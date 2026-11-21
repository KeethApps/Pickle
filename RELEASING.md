# Releasing Pickle

Releases are cut with one command. GitHub Actions does the rest.

## How versions work

Pickle follows [Semantic Versioning](https://semver.org/): `MAJOR.MINOR.PATCH`.

| Bump | When | Example |
|------|------|---------|
| **Patch** | Bug fixes only | `0.1.0` → `0.1.1` |
| **Minor** | New features, new card types | `0.1.1` → `0.2.0` |
| **Major** | Breaking changes, such as a data format change | `0.9.0` → `1.0.0` |

Pre-releases use a suffix: `0.2.0-beta.1`. They are marked as pre-releases on GitHub automatically.

## Day to day: keep the changelog current

Every pull request that changes something users can see should add a line under **`## [Unreleased]`** in [CHANGELOG.md](CHANGELOG.md), under the right heading (**Added**, **Changed**, **Fixed**, **Removed**, **Deprecated** or **Security**).

Good entries say what changed for the person using Pickle:

- ✅ `Recipe cards now show how many times you made them`
- ❌ `Refactor card component`

Also **label your pull requests** (`bug`, `enhancement`, `cards`, `design`, `documentation`, `breaking`). Labels are used to group GitHub's auto-generated notes (see [`.github/release.yml`](.github/release.yml)). Use `ignore-for-release` to leave something out.

## Cutting a release

1. Make sure everything is merged and you are on a clean `main`:
   ```bash
   git checkout main && git pull
   ```
2. Run the release script with the new version:
   ```bash
   scripts/release.sh 0.2.0
   ```
   It moves **Unreleased** into a dated `0.2.0` section, updates the compare links, shows you the notes, then (after you confirm) commits, tags `v0.2.0` and pushes.
3. The [Release workflow](.github/workflows/release.yml) starts on the new tag. It publishes a GitHub Release using that version's section of the changelog. If the section is empty it falls back to GitHub's auto-generated notes.
4. Open the [Releases page](../../releases), check it, and edit if you want to add screenshots or a short intro.

## Doing it by hand

```bash
# edit CHANGELOG.md: rename [Unreleased] to [0.2.0] - YYYY-MM-DD and add a new empty [Unreleased]
git commit -am "Release v0.2.0"
git tag -a v0.2.0 -m "Pickle v0.2.0"
git push origin main v0.2.0
```

## Writing a good release

- Lead with the one or two changes people will care about most.
- Add a screenshot or GIF for anything visual.
- Mention anything people need to do when updating.
- Thank contributors by `@username`.

## Release checklist

- [ ] `main` is green and up to date
- [ ] CHANGELOG has all user-facing changes under **Unreleased**
- [ ] Version number is right for the kind of change
- [ ] Run `scripts/release.sh X.Y.Z`
- [ ] Check the Release page and the website
- [ ] Announce it (optional)
