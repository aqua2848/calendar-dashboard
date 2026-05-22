# Calendar Dashboard

古いiPadを卓上カレンダー兼時計として再利用するための、静的HTML/CSS/JavaScriptだけで動く軽量ダッシュボードです。横置きiPadで常時表示しやすいように、ダークでレトロな情報端末風の見た目にしています。

## ローカルで開く方法

`calendar-dashboard/index.html` をブラウザで直接開いてください。ビルドツール、npm、サーバーは不要です。

Google Fontsを読み込むため、フォントを反映するにはインターネット接続が必要です。オフライン時もシステムフォントにフォールバックして表示されます。

## GitHub Pagesで公開する方法

1. この `calendar-dashboard` フォルダをGitHubリポジトリに配置します。
2. GitHubのリポジトリ画面で `Settings` を開きます。
3. `Pages` を開き、公開元のブランチとフォルダを選びます。
4. 数分待って、表示されたGitHub PagesのURLにアクセスします。

リポジトリのルートにこの4ファイルを置く場合は、Pagesの公開フォルダをルートにしてください。サブフォルダで使う場合も相対パスだけで動作します。

## iPadで全画面表示する運用メモ

- SafariでGitHub PagesのURL、またはローカルで共有したURLを開きます。
- 共有メニューから「ホーム画面に追加」を選びます。
- ホーム画面のアイコンから起動すると、全画面に近い表示で使いやすくなります。
- 常時表示する場合は、必要に応じてiPadの自動ロック設定を調整してください。
- 画面焼き付き対策として、メイン表示は数分ごとにごく小さく位置をずらします。

## 表示モード

通常表示はそのままURLを開きます。リビングなどで家族が遠目から見る場合は、URLの末尾に `?view=family` を付けて開きます。

```text
https://example.github.io/calendar-dashboard/?view=family
```

家族用表示ではカレンダーを今月だけにして、天気と電車情報を大きく表示します。

## カスタマイズ方法

### 色

`style.css` の先頭にある `:root` のCSS変数を変更してください。

```css
:root {
  --bg: #14161c;
  --panel: #1d2028;
  --text: #e8e3d6;
  --accent-orange: #c06f45;
  --accent-blue: #7aa6ad;
  --accent-green: #6f9a72;
  --accent-pink: #c96f83;
}
```

### フォント

Google Fontsは `index.html` で読み込んでいます。実際に使うフォントは `style.css` の `--header-font`、`--display-font`、`--mono-font` を変更してください。

### 表示項目

表示構造は `index.html`、日付や進捗の計算は `app.js` に分けています。週番号、カレンダー、週/月/年の進捗表示を変更したい場合は `app.js` の小さな関数単位で調整できます。
