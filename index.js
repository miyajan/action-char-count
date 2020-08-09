const core = require('@actions/core');
const github = require('@actions/github');
const glob = require('@actions/glob');
const fs = require('fs');
const path = require('path');

async function run() {
    try {
        // パラメータを取得
        const token = core.getInput("token");
        const files = core.getInput("patterns");

        // コンテキストから必要な情報を取得
        const owner = github.context.repo.owner;
        const repo = github.context.repo.repo;
        const issueNumber = github.context.issue.number;

        // パターンにマッチするファイルを取得
        const globber = await glob.create(files);
        const filePaths = await globber.glob();

        // ファイルの文字数を数えてコメントを生成
        const cwd = process.cwd();
        let total = 0;
        const rows = ["| File | Number of characters |", "| --- | ---: |"];
        for (const filePath of filePaths) {
            const stats = fs.statSync(filePath);
            if (!stats.isFile()) {
                core.info(`${filePath} is not a file`);
                continue;
            }
            const content = fs.readFileSync(filePath, "utf8");
            const relativePath = path.relative(cwd, filePath);
            const charCount = content.length;
            rows.push(`| ${relativePath} | ${charCount} |`);
            total += charCount;
        }
        rows.push(`| Total | ${total} |`);
        const body = rows.join("\n");

        // プルリクエストにコメント
        const octokit = github.getOctokit(token);
        await octokit.issues.createComment({
            owner,
            repo,
            issue_number: issueNumber,
            body,
        });
    } catch (error) {
        // エラーが発生したらステータスを失敗にして終了
        core.setFailed(error.message);
    }
}

run();
