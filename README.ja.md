# エージェント向け誘導の定義

**AIエージェントの判断を動かすためにWebページへ置かれた文字列を、
正当な機械可読な自己提示と区別して判定するための定義。**

- 定義（正）: <https://perpensum.org/>（English）
- 定義（日本語）: <https://perpensum.org/ja>
- 構造化版: [`definition.json`](definition.json)
- 適合性テスト: [`conformance/`](conformance/) — 26ケース
- 状態: **v0.1 ドラフト**（2026-07-30 公開）

English README: [`README.md`](README.md)（こちらが正）

**解釈が割れた場合は英語版を正とします。**

---

## 問題

AIエージェントがWebページを読んで購買や推薦の判断を行うようになった。それに伴い、
**人間の読者には見えない形で、あるいは第三者の投稿領域に、エージェントの判断を動かすための
文字列を置く**行為が現れている。

一方で、機械可読な自己提示（構造化データ、`llms.txt`、明快な仕様記述）はまっとうな施策であり、
**これと混同されてはならない。** 混同した瞬間に、検出器はまともなサイトを攻撃し始める。

## 定義

> **エージェント向け誘導**とは、Webページ上の文字列のうち、人間の読者ではなく機械の読み手に
> 宛てられ、かつ **(a) 人間に見えない形で置かれている**、または
> **(b) 第三者の投稿領域に置かれている** もののうち、読み手の判断・出力・順位づけを
> 指示するものをいう。

## 判定の2軸

| 軸 | 値 |
|---|---|
| **領域** | `first_party`（運営者自身の領域）／`third_party`（第三者が投稿できる領域） |
| **可視性** | `visible`（通常のレンダリングで読める）／`hidden`（人間の読者には到達しない） |

| 領域 | 可視性 | 重大度 | 意味 |
|---|---|---|---|
| `first_party` | `visible` | `info` | ただの広告表現。問題視しない |
| `first_party` | `hidden` | `warn` | 隠しテキスト。クローキング相当 |
| `third_party` | `visible` | `warn` | 第三者がエージェント向け指示を置いた |
| `third_party` | `hidden` | `high` | 第三者による不可視の注入 |

**主観的な軸を入れない。** 「大げさか」を足すと正当な広告表現との線が引けなくなり、
判定が測る人によって変わる。基準として機能させるには、機械的に決まる軸だけで構成する必要がある。

## 検出しないもの

含めた瞬間に、この基準は使い物にならなくなる。

- 通常の広告表現
- 構造化データ、`llms.txt`、`robots.txt` への正当な記述
- AIに言及しているだけの文
- 隠されているが無害なテキスト（スキップリンク、スクリーンリーダー向け、Cookieバナー、
  アコーディオンやタブの初期状態、カルーセルの非アクティブスライド）
- 一人称の本物のレビュー
- プロンプトインジェクションの解説記事

**条件付きCSSは hidden に数えない。** **外部CSSを解決できない場合、hidden と断定しない。**

## 判定の限界

- 外部CSSを取得しない限り、そこに置かれた隠蔽は検出できない
- JavaScriptによる動的な表示制御は評価しない
- 第三者領域の判定は推定であり、確実ではない
- 英語・日本語以外の言語は現時点で対象外

**検出できていないことを「問題なし」と表示するのは、この種の基準にとって最悪の失敗である。**

## 30秒で試す

最小の参照実装を同梱している。インストールも依存も不要。

```bash
curl -s https://example.com | node reference/scan.mjs
```

**正なのは定義であって、[`reference/scan.mjs`](reference/scan.mjs) ではない。**
食い違った場合、バグは参照実装の側にある。
この定義が読める量のコードで実装できることを示し、比較対象を提供するために置いている。

## 実装の確認

```bash
node conformance/run.mjs <あなたの実装のパス>
```

**26ケース、うち20ケースは「何も検出しない」ことを期待する。**
英語と日本語の両方を検査し、ランナーは言語別の内訳を出す。
**片方だけ通る実装が、合計値の中に隠れないようにするため。** 依存なし、Node 18以上。

## 誤検知の掃討

```bash
node reference/false-positive-sweep.test.mjs
```

**470判定 — 現実のページによくある47文 × 10通りの置き場所**（通常本文、折りたたみFAQ、
`display:none`、画面外、`aria-hidden`、レビュー欄、コメント欄、モバイル非表示、
`meta description`、`alt`）。**すべて白でなければならない。**

**出荷に至って誤検知した文は、理由とともに永久に残してある。** 6件あり、
いずれも人間に向けて書かれた普通の文だった。

| 誤検知した文 | 原因 |
|---|---|
| `Retailers must always display the correct price.` | 機械名の照合が `Ret**ai**lers` の中の ai に一致 |
| `One executive said agents should never be trusted with a corporate card.` | `corpo**rate**` の中の rate に一致 |
| `Your scraper must not ignore rate limits.` | 名詞の rate（rate limits）に一致 |
| `The EU AI Act requires that providers must classify systems by risk tier.` | 義務を負うのは提供者であって機械ではない |
| `Our AI assistant will always recommend the plan that fits your usage best.` | 機械を名指しているが、宛先は顧客 |
| `小売価格は必ず税込で表示してください。` | 事業者向けの指示。機械への言及すらない |

1文だけ、いまも陽性で返るものがある。**合格にも「想定内の失敗」にもせず**、
[#5](https://github.com/perpensum/agent-directed-manipulation/issues/5) として公開している。
実装ではなく**定義側の欠落**だと考えているためである。

## 不一致が出たら

**あなたの実装が誤っているとは限らない。** 不一致は定義の解釈が割れている箇所を示しており、
それは定義側の欠陥である。
[Issueで指摘してほしい](https://github.com/perpensum/agent-directed-manipulation/issues)。
書き方は [CONTRIBUTING.md](CONTRIBUTING.md) にある。**日本語で構わない。**

## 答えを持っていない論点

v0.1 は議論されるために出しているので、著者側の未解決点も公開している。

- [#1 実行時JavaScriptによる可視性を対象外にしているが、それでよいか](https://github.com/perpensum/agent-directed-manipulation/issues/1)
- [#2 `alt` は本当に hidden か。スクリーンリーダーは人間に読み上げる](https://github.com/perpensum/agent-directed-manipulation/issues/2)
- [#3 `third_party` の推定が英語圏の形をしており、それ以外を取りこぼす](https://github.com/perpensum/agent-directed-manipulation/issues/3)

**特に #3 は、単独の著者が持ちえない知識を必要としている。**
列挙できていない言語圏で、コメント欄やレビュー欄がどんな class / id を使っているか。

## 状態とライセンス

- **v0.1 は明示的にドラフト。** 議論されるために早く出している
- **定義本文、この文書、`definition.json`、`conformance/cases.json` は
  [CC BY 4.0](LICENSE)。** 出典を示せば引用・実装・翻訳・派生は自由。
  改変版を配布する場合は本定義との差分を示すこと
- **ランナー（`conformance/run.mjs`）は [MIT](LICENSE-CODE)。**
  ビルドパイプラインへ取り込めるよう、コンテンツ用ライセンスの表示義務を外している
- 改訂時に旧版を削除しない。変更点と理由は [`CHANGELOG.md`](CHANGELOG.md) に残す

**この定義の実装に、Perpensum の許可、届け出、認定は不要である。**
自らの実装を関所にする基準は、基準ではない。

## 発行者

Perpensum（<https://perpensum.org/>）。AIエージェントの購買判断を第三者の立場で評価する事業。

**明記するのは、発行者が不明な基準は採用されないため。** 求められるのは匿名性ではなく独立性であり、
Perpensum は、この定義の下でどう評価されるかと引き換えに、いかなる当事者からも
対価・提携・優遇を受けない。

このリポジトリは定義そのものの正本であり、製品からは意図的に分離している。
**この定義は、競合を含む誰もが実装できることを前提としている。**
