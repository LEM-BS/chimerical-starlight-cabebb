const path = require('path');
const { execFile } = require('child_process');
const util = require('util');
const execFileAsync = util.promisify(execFile);

test('index.html has no broken internal links', async () => {
  const indexModule = require.resolve('linkinator');
  const cli = path.join(path.dirname(indexModule), 'cli.js');
  const target = path.join(__dirname, '..', 'index.html');
  const { stdout } = await execFileAsync('node', [cli, target, '--silent', '--recurse=false', '--skip', '^https?://']);
  expect(stdout).not.toMatch(/BROKEN/);
});
