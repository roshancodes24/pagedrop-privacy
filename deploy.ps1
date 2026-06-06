# Deploy PageDrop privacy policy to GitHub Pages.
# Prerequisite: run `gh auth login` once and complete browser sign-in.

$ErrorActionPreference = 'Continue'
$RepoName = 'pagedrop-privacy'
$PagesBranch = 'main'

$gh = Get-Command gh -ErrorAction SilentlyContinue
if (-not $gh) {
  Write-Error 'GitHub CLI (gh) is not installed. Install it with: winget install GitHub.cli'
}

function Test-GhAuth {
  $prev = $ErrorActionPreference
  $ErrorActionPreference = 'Continue'
  gh auth status 2>$null | Out-Null
  $ok = $LASTEXITCODE -eq 0
  $ErrorActionPreference = $prev
  return $ok
}

if (-not (Test-GhAuth)) {
  Write-Host 'GitHub login required. Complete sign-in in your browser to continue.'
  gh auth login --hostname github.com --git-protocol https --web
  if (-not (Test-GhAuth)) {
    Write-Error 'GitHub login was not completed. Run this script again after signing in.'
  }
}

$owner = (gh api user --jq .login).Trim()
if (-not $owner) {
  Write-Error 'Could not determine GitHub username.'
}

Set-Location $PSScriptRoot

if (-not (Test-Path '.git')) {
  git init -b $PagesBranch
  git add index.html
  git commit -m 'Add PageDrop privacy policy.'
}

$remoteUrl = "https://github.com/$owner/$RepoName.git"
$hasOrigin = git remote | Select-String -Pattern '^origin$' -Quiet

if ($hasOrigin) {
  git remote set-url origin $remoteUrl
} else {
  git remote add origin $remoteUrl
}

$repoExists = gh repo view "$owner/$RepoName" 2>$null
if ($LASTEXITCODE -ne 0) {
  gh repo create $RepoName --public --description 'Privacy policy for the PageDrop Chrome extension.'
  if ($LASTEXITCODE -ne 0) {
    Write-Error 'Failed to create GitHub repository.'
  }
}

$localBranch = (git branch --show-current).Trim()
if (-not $localBranch) {
  Write-Error 'No local git branch found.'
}

git push -u origin "${localBranch}:${PagesBranch}"
if ($LASTEXITCODE -ne 0) {
  Write-Error 'Failed to push privacy policy to GitHub.'
}

gh api "repos/$owner/$RepoName/pages" -X POST -f "build_type=legacy" -f "source[branch]=$PagesBranch" -f "source[path]=/" 2>$null
if ($LASTEXITCODE -ne 0) {
  gh api "repos/$owner/$RepoName/pages" -X PUT -f "build_type=legacy" -f "source[branch]=$PagesBranch" -f "source[path]=/" 2>$null
}

$pagesUrl = "https://$owner.github.io/$RepoName/"
Write-Host ''
Write-Host 'Privacy policy deployed.' -ForegroundColor Green
Write-Host "Public URL: $pagesUrl"
Write-Host ''
Write-Host 'Paste this URL into the Chrome Web Store Privacy policy field.'
