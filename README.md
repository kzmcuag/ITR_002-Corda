# Corda

Three.jsとWeb Audioを使うブラウザーアプリです。Viteで開発・ビルドし、GitHub Pagesに静的ファイルとして公開する構成です。

## 開発環境

- Node.js 24（既存のGitHub Actionsと同じメジャーバージョン。package.jsonの指定は22.12.0以上）
- npm（Node.jsに同梱）
- WebGLとWeb Audioに対応するブラウザー

リポジトリのルートで実行します。

```sh
node --version
npm --version
npm ci
npm run dev
```

ターミナルに表示されたURLを開きます。通常は <http://localhost:5173/ITR_002-Corda/> です。ポートが使用中の場合は表示されたポートを使ってください。停止はターミナルで `Ctrl+C` です。

依存関係はpackage-lock.jsonで固定しています。通常のセットアップでは `npm ci` を使います。Windowsでnpmの標準キャッシュにアクセス権エラーが出る場合は、PowerShellで一時フォルダーのキャッシュを指定できます。

```powershell
npm ci --cache "$env:TEMP\corda-npm-cache"
```

`index.html` を直接開かず、Vite経由で利用してください。モデルは画面へGLB/GLTFをドロップするか、ファイル選択で読み込みます。モデルファイルは同梱していません。InterフォントはGoogle Fontsから取得するため、フォントの取得にはネットワーク接続が必要です。

## ビルドと公開前の確認

```sh
npm run build
npm run preview
```

ビルド結果は `dist/` に生成されます。通常のプレビューURLは <http://localhost:4173/ITR_002-Corda/> です。停止は `Ctrl+C` です。`npm run preview` はビルド結果のローカル確認用です。

現状は生成JSが500 kBを超える警告が出ますが、ビルドは成功します。既存の機能・音・UIを保つため、この警告を解消する目的でコード分割や設定変更は行っていません。

## GitHub Pagesへの公開

以下は公開を明示的に依頼された場合の手順です。GitHubへの送信や公開は通常のローカルセットアップには含みません。

1. GitHubの対象リポジトリで **Settings → Pages → Build and deployment → Source** を **GitHub Actions** に設定します。
2. ローカルで `npm ci`、`npm run build`、`npm run preview` を実行し、公開対象を確認します。
3. 公開の承認後に、対象の変更をコミットしてGitHubの `main` ブランチへpushします。既存の `.github/workflows/deploy.yml` が自動実行されます。GitHubにあるソースを再公開する場合は、Actionsから同ワークフローを手動実行することもできます。
4. Actionsのbuild/deployの成功と、Pagesに表示される公開URLを確認します。

既存ワークフローはNode.js 24で `npm ci` と `npm run build` を実行し、`dist/` を公開します。**mainへのpushは公開のトリガーになる**ため、送信前に公開の意図も確認してください。公開用ワークフローを重複して作成する必要はありません。

現在のリモート設定に対応する公開先は <https://kzmcuag.github.io/ITR_002-Corda/> です（実際の公開状態は今回未確認）。`vite.config.mjs` の `base` は `/ITR_002-Corda/` です。リポジトリ名や公開パスを変える場合は、この設定も合わせて見直してください。

## ファイル構成

- `index.html`: 画面のHTMLとCSS
- `main.js`: 描画、操作、モデル読み込み、音声処理
- `package.json` / `package-lock.json`: npmコマンドと固定した依存関係
- `vite.config.mjs`: 公開パスとビルド出力先
- `.github/workflows/deploy.yml`: GitHub Pagesへのビルド・公開
- `AGENTS.md`: 作業時の変更範囲、検証、送信・公開のルール

`node_modules/` と `dist/` はGitの管理対象外です。

## 今回の環境確認（2026-09-28）

- Windows、Node.js v24.21.0、npm 11.19.0で依存関係を導入しました。
- Three.js 0.186.1、Vite 8.3.1のインストール、`node --check main.js`、`npm run build` が成功しました。
- 開発サーバーと公開用プレビューを起動し、HTMLとJavaScriptのHTTP応答、ブラウザーでの初期画面を確認しました。確認時のブラウザーログに警告・エラーはありませんでした。
- モデルを使った操作・音の実機確認は未実施です。
- アプリのコード、依存関係のバージョン、公開ワークフローは変更していません。GitHubへの送信・公開も行っていません。
