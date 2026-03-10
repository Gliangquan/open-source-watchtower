import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const USER = 'Gliangquan';
const README_PATH = new URL('../README.md', import.meta.url);
const DATA_PATH = new URL('../data/watchtower.json', import.meta.url);

async function githubJson(url) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': `${USER}-watchtower`,
      'Accept': 'application/vnd.github+json'
    }
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub API ${res.status}: ${text.slice(0, 300)}`);
  }
  return res.json();
}

async function main() {
  const repos = await githubJson(`https://api.github.com/users/${USER}/repos?per_page=100&sort=updated`);
  const publicRepos = repos.filter((repo) => !repo.private && !repo.fork);
  const updatedAt = new Date().toISOString();
  const lines = [
    `Updated: ${updatedAt}`,
    '',
    `Public repositories: ${publicRepos.length}`,
    '',
    '| Repository | Stars | Open issues | Default branch | Updated | Status |',
    '|---|---:|---:|---|---|---|'
  ];

  for (const repo of publicRepos.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))) {
    lines.push(`| [${repo.name}](${repo.html_url}) | ${repo.stargazers_count} | ${repo.open_issues_count} | ${repo.default_branch} | ${repo.updated_at.slice(0, 10)} | ${repo.archived ? 'Archived' : 'Active'} |`);
  }

  mkdirSync(new URL('../data/', import.meta.url), { recursive: true });
  writeFileSync(DATA_PATH, JSON.stringify({ updatedAt, repos: publicRepos }, null, 2) + '\n');

  let readme = readFileSync(README_PATH, 'utf8');
  readme = readme.replace(/<!-- REPORT:START -->[\s\S]*<!-- REPORT:END -->/, `<!-- REPORT:START -->\n${lines.join('\n')}\n<!-- REPORT:END -->`);
  writeFileSync(README_PATH, readme);

  console.log(`Updated watchtower with ${publicRepos.length} repositories.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
