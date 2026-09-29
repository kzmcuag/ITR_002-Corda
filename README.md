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

`index.html` を直接開かず、Vite経由で利用してください。モデルは画面へGLB/GLTFをドロップするか、ファイル選択で読み込みます。起動時には同梱のtest_plasticNumber.glbを読み込みます。緑色のReplaceから別のモデルへ変更でき、隣のSampleで既定モデルへ戻せます。UIはIBM Plex Mono、右下のInstrumentarium表記はInterです。Google Fontsの取得にはネットワーク接続が必要で、取得できない場合は端末の代替フォントを使います。

## 音色の操作

**SOUND**は初期状態では閉じています。開くと次の項目だけを表示します。

- **Sawtooth / Sine**：Pizz／Strum・Arco共通の波形切替。発音中の音と余韻にも反映します。
- **Cutoff / Resonance**：Sawtooth時のみ表示します。Cutoffの初期値は50（スライダー中央、約1.13 kHz）です。Sineでは追加フィルターをバイパスし、Sawtoothに戻すと前の設定を復元します。
- **Reverb / Delay**：共通の空間系ミックス。

エンベロープは固定で、ADSRの編集項目はありません。Arcoは元の立ち上がり・弓の動きへの音量応答・弦の長さに応じた0.9〜1.8秒の二段階リリースを使用します。Pizzは2 msで立ち上がり、約0.6秒で消える固定の減衰にしています。連打時の過大出力を抑えるため、音量の余裕と最終出力のコンプレッサーを設けています。旧Pizzはノイズ式の弦モデルだったため、共通Saw／Sine音源では旧音声の減衰波形と完全一致するものではありません。

閉じても設定は維持され、再読み込みで初期値に戻ります。音声処理の検証は node --test tests/audio-controls.test.mjs で実行できます。模擬音声ノードによる検証のため、聴感確認は別途行ってください。

## v0.27.1のモデル・操作

- 既定モデルは public/models/test_plasticNumber.glb に同梱し、ビルドにも含めます。
- Replaceでファイル選択を開きます。キャンセル・読み込み失敗時には現在のモデルを保ちます。
- iPadOSでGLBが選択不可になるのを避けるため、ファイル選択画面では形式を絞り込みません。選択後に.glb／.gltfの拡張子とモデルの内容を確認します。
- EDGE RANGEの一本のトラック上にある2つのつまみで採用する線分長の百分位を指定します（0＝最短、100＝最長）。各モデルの読み込み時は5–100です。5–100は短い側の5パーセンタイル未満を除外する意味で、同じ長さの線分はまとめて採用します。スライダー変更時はカメラを保持し、演奏を停止して線分と音程基準を再計算します。範囲内に線分がない場合は無音になり、範囲を広げれば復帰します。
- 音程基準は中央値の線分長を初期値294 Hz（D）とします。Pitchで110〜440 Hzに変更でき、発音中の音も滑らかに追従します。Sampleでも範囲は5–100に戻ります。
- スマートフォン／タブレットでは、キャンバス上の1本指でPizz／Strum、2本指の間の線を弓にしてArcoを演奏します。弓を動かすと発音し、止めると音量が下がります。
- 3本以上の指や画面非表示時には演奏を停止します。タッチ端末では右上のPlay／Viewを切り替えます。初期値Playでは演奏、Viewでは1本指ドラッグでOrbit、2本指ドラッグでPan、ピンチでZoomです。モード切替時は演奏接触と進行中のナビゲーションを解除し、新しいタッチから操作します。PCは右ドラッグで回転、中央（ホイール）ボタンドラッグでPan、ホイールでズームできます。
- モバイル表示では左上の情報・設定を初期状態で隠し、[setting]で開きます。[close]で演奏画面に戻ります。
- 実機のスマートフォン／タブレットでの聴感・操作感は別途確認してください。自動テストでは指の増減、キャンセル、マウスとの分離を検証します。

PCと同じWi-Fiのスマートフォンでローカル確認する場合は、PCで npm run dev -- --host 0.0.0.0 を実行し、表示されたNetwork URLの /ITR_002-Corda/ を端末で開きます。

検証コマンド: node --test tests/*.test.mjs。実際のWeb Audioによる64音の連打・同時発音のピーク検証は、開発サーバーの /ITR_002-Corda/tests/audio-render.html を開きます（無音のオフラインレンダリング）。

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

## 初期セットアップ時の環境確認（2026-09-28）

- Windows、Node.js v24.21.0、npm 11.19.0で依存関係を導入しました。
- Three.js 0.186.1、Vite 8.3.1のインストール、`node --check main.js`、`npm run build` が成功しました。
- 開発サーバーと公開用プレビューを起動し、HTMLとJavaScriptのHTTP応答、ブラウザーでの初期画面を確認しました。確認時のブラウザーログに警告・エラーはありませんでした。
- モデルを使った操作・音の実機確認は未実施です。
- アプリのコード、依存関係のバージョン、公開ワークフローは変更していません。GitHubへの送信・公開も行っていません。
