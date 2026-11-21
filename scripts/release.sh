#!/usr/bin/env bash
# Usage: scripts/release.sh 0.1.0
# Moves everything under "Unreleased" in CHANGELOG.md into a new version section,
# commits, tags and pushes. GitHub Actions then creates the release.
set -euo pipefail

VERSION="${1:-}"
[[ "$VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+(-[0-9A-Za-z.]+)?$ ]] || { echo "Usage: $0 X.Y.Z[-pre]"; exit 1; }
TAG="v$VERSION"
DATE="$(date +%Y-%m-%d)"
REPO="$(git config --get remote.origin.url | sed -E 's#(git@github.com:|https://github.com/)##; s#\.git$##')"

[[ -z "$(git status --porcelain)" ]] || { echo "Working tree is not clean. Commit or stash first."; exit 1; }
[[ "$(git rev-parse --abbrev-ref HEAD)" == "main" ]] || { echo "Switch to main first."; exit 1; }
git rev-parse "$TAG" >/dev/null 2>&1 && { echo "Tag $TAG already exists."; exit 1; }
grep -q '^## \[Unreleased\]' CHANGELOG.md || { echo "No [Unreleased] section in CHANGELOG.md"; exit 1; }

PREV="$(git describe --tags --abbrev=0 2>/dev/null || true)"

# 1. Turn [Unreleased] into the new version and add a fresh empty [Unreleased]
python3 - "$VERSION" "$DATE" "$REPO" "$PREV" <<'PY'
import re, sys
version, date, repo, prev = sys.argv[1:5]
p = "CHANGELOG.md"
s = open(p).read()
s = s.replace("## [Unreleased]", f"## [Unreleased]\n\n## [{version}] - {date}", 1)
# compare links at the bottom: Unreleased first, then newest to oldest
link = re.compile(r"^\[[^\]]+\]: \S+$", re.M)
old_links = [l for l in link.findall(s) if not l.startswith("[Unreleased]:")]
s = link.sub("", s).rstrip() + "\n\n"
new_link = (f"[{version}]: https://github.com/{repo}/compare/{prev}...v{version}" if prev
            else f"[{version}]: https://github.com/{repo}/releases/tag/v{version}")
s += "\n".join([f"[Unreleased]: https://github.com/{repo}/compare/v{version}...HEAD", new_link] + old_links) + "\n"
open(p, "w").write(s)
PY

echo "---- Release notes for $TAG ----"
awk -v v="$VERSION" '$0 ~ "^## \\[" v "\\]"{f=1;next} f&&(/^## \[/||/^\[[^]]+\]: /){exit} f' CHANGELOG.md
echo "--------------------------------"
read -r -p "Commit, tag $TAG and push? [y/N] " ok
[[ "$ok" =~ ^[Yy]$ ]] || { git checkout CHANGELOG.md; echo "Aborted."; exit 1; }

git add CHANGELOG.md
git commit -m "Release $TAG"
git tag -a "$TAG" -m "Pickle $TAG"
git push origin main "$TAG"
echo "Done. Watch the release appear at https://github.com/$REPO/releases"
