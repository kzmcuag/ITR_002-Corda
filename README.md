# Corda GitHub Pages 修正版

## GitHubへの配置

1. このフォルダーの中身をリポジトリ ITR_002-Corda のルートへ配置します。index.html、main.js、package.json、package-lock.json、vite.config.mjs は同じ階層です。
2. 既存のPages公開ワークフローがある場合は、それを同梱の .github/workflows/deploy.yml の内容に置き換えるか、Node.js 24、npm ci、npm run build、公開対象 ./dist となるよう修正してください。同じサイトを公開するワークフローを二重に残さないでください。
3. GitHubの Settings → Pages → Build and deployment → Source で GitHub Actions を選択します。
4. main ブランチへコミットすると公開されます。ブランチ名が違う場合は deploy.yml の branches を変更してください。
5. 公開URLは https://<GitHubユーザー名>.github.io/ITR_002-Corda/ です。

## ローカルで確認

Node.js 24 を使用してください。

    npm ci
    npm run dev

公開用の確認:

    npm run build
    npm run preview

表示されたローカルURLの /ITR_002-Corda/ を開いてください。
HTMLをファイルとして直接開くのではなく、Vite経由で利用します。
GitHub Pagesへ公開するのはソースそのものではなく、ビルドで生成した dist の内容です。

## 変更と検証

- 元の script type="module" 内部を、改行・空白を含めて main.js にそのまま移動しました。
- 元のscript要素を <script type="module" src="./main.js"></script> に置き換えました。
- その箇所以外のHTML/CSS/UIは変更していません。
- main.jsを元の位置へ戻すと、添付の元HTMLとバイト単位で完全一致することを確認しました。
- 既存のpackage.jsonが提供されていないため、今回取得したThree.jsとViteのバージョンを固定し、package-lock.jsonも同梱しています。
- npm run build の成功と、dist/index.html が /ITR_002-Corda/assets/ 内の生成済みJSを参照することを確認しました。
- GLBモデルでの操作・音声・描画の実機確認、およびGitHub上での実際の公開は未実施です。
- ビルド時の500kB超の警告はエラーではありません。既存コードを保持するため、コード分割などの変更は加えていません。

補足: Viteはインラインのmodule scriptにも対応しています。従来の未処理importが公開された原因は、このHTMLだけでは断定できません。本一式では、明示的なエントリー、ビルド手順、distの公開を揃えています。

参考: https://vite.dev/guide/static-deploy#github-pages
