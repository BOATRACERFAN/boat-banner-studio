# 素材と依存関係のライセンス

背景60点・装飾100点は、このアプリ専用にSVGのパス・図形で作成したオリジナルです。ソースコードと共にMIT Licenseで提供します。第三者の画像、公式ロゴ、選手写真、既存キャラクターは含めていません。

## Google Fonts

フォントのバイナリは同梱せず、必要時にGoogle Fontsの公式配信元から読み込みます。以下の32書体について、公式 `OFL.txt` と提供CSSを確認しています。日本語30書体は「松田真実」のUnicode収録範囲も確認しています。確認時刻と正確な参照URLは `FONT_VERIFICATION.json` に記録しています。

ライセンス：**SIL Open Font License 1.1**。フォントの改変・再配布時には、各フォントの著作権表示・予約名・OFL本文を確認してください。書き出した画像への利用と、フォントファイル自体の再配布は条件が異なります。

公式情報：[Google Fonts FAQ](https://developers.google.com/fonts/faq) ・ [SIL OFL](https://openfontlicense.org/)

| 書体                | Google Fonts公式リポジトリ                                                         |
| ------------------- | ---------------------------------------------------------------------------------- |
| Noto Sans JP        | [notosansjp](https://github.com/google/fonts/tree/main/ofl/notosansjp)             |
| M PLUS 1p           | [mplus1p](https://github.com/google/fonts/tree/main/ofl/mplus1p)                   |
| Zen Kaku Gothic New | [zenkakugothicnew](https://github.com/google/fonts/tree/main/ofl/zenkakugothicnew) |
| BIZ UDPGothic       | [bizudpgothic](https://github.com/google/fonts/tree/main/ofl/bizudpgothic)         |
| Sawarabi Gothic     | [sawarabigothic](https://github.com/google/fonts/tree/main/ofl/sawarabigothic)     |
| M PLUS Rounded 1c   | [roundedmplus1c](https://github.com/google/fonts/tree/main/ofl/roundedmplus1c)     |
| Zen Maru Gothic     | [zenmarugothic](https://github.com/google/fonts/tree/main/ofl/zenmarugothic)       |
| Kiwi Maru           | [kiwimaru](https://github.com/google/fonts/tree/main/ofl/kiwimaru)                 |
| Noto Serif JP       | [notoserifjp](https://github.com/google/fonts/tree/main/ofl/notoserifjp)           |
| BIZ UDPMincho       | [bizudpmincho](https://github.com/google/fonts/tree/main/ofl/bizudpmincho)         |
| Kaisei Decol        | [kaiseidecol](https://github.com/google/fonts/tree/main/ofl/kaiseidecol)           |
| Kaisei Opti         | [kaiseiopti](https://github.com/google/fonts/tree/main/ofl/kaiseiopti)             |
| Zen Old Mincho      | [zenoldmincho](https://github.com/google/fonts/tree/main/ofl/zenoldmincho)         |
| Shippori Mincho     | [shipporimincho](https://github.com/google/fonts/tree/main/ofl/shipporimincho)     |
| Sawarabi Mincho     | [sawarabimincho](https://github.com/google/fonts/tree/main/ofl/sawarabimincho)     |
| Yuji Boku           | [yujiboku](https://github.com/google/fonts/tree/main/ofl/yujiboku)                 |
| Yuji Syuku          | [yujisyuku](https://github.com/google/fonts/tree/main/ofl/yujisyuku)               |
| New Tegomin         | [newtegomin](https://github.com/google/fonts/tree/main/ofl/newtegomin)             |
| Yusei Magic         | [yuseimagic](https://github.com/google/fonts/tree/main/ofl/yuseimagic)             |
| Hachi Maru Pop      | [hachimarupop](https://github.com/google/fonts/tree/main/ofl/hachimarupop)         |
| Mochiy Pop One      | [mochiypopone](https://github.com/google/fonts/tree/main/ofl/mochiypopone)         |
| Mochiy Pop P One    | [mochiypoppone](https://github.com/google/fonts/tree/main/ofl/mochiypoppone)       |
| DotGothic16         | [dotgothic16](https://github.com/google/fonts/tree/main/ofl/dotgothic16)           |
| Zen Antique         | [zenantique](https://github.com/google/fonts/tree/main/ofl/zenantique)             |
| Zen Antique Soft    | [zenantiquesoft](https://github.com/google/fonts/tree/main/ofl/zenantiquesoft)     |
| Dela Gothic One     | [delagothicone](https://github.com/google/fonts/tree/main/ofl/delagothicone)       |
| RocknRoll One       | [rocknrollone](https://github.com/google/fonts/tree/main/ofl/rocknrollone)         |
| Rampart One         | [rampartone](https://github.com/google/fonts/tree/main/ofl/rampartone)             |
| Reggae One          | [reggaeone](https://github.com/google/fonts/tree/main/ofl/reggaeone)               |
| Stick               | [stick](https://github.com/google/fonts/tree/main/ofl/stick)                       |
| Bebas Neue（英字）  | [bebasneue](https://github.com/google/fonts/tree/main/ofl/bebasneue)               |
| Orbitron（英字）    | [orbitron](https://github.com/google/fonts/tree/main/ofl/orbitron)                 |

## ランタイムの主な依存関係

| パッケージ        | ライセンス | 公式                                        |
| ----------------- | ---------- | ------------------------------------------- |
| React / React DOM | MIT        | https://github.com/facebook/react           |
| Konva             | MIT        | https://github.com/konvajs/konva            |
| react-konva       | MIT        | https://github.com/konvajs/react-konva      |
| Zustand           | MIT        | https://github.com/pmndrs/zustand           |
| Lucide React      | ISC        | https://github.com/lucide-icons/lucide      |
| Tailwind CSS      | MIT        | https://github.com/tailwindlabs/tailwindcss |

依存関係の正確なバージョンは `package-lock.json` に固定しています。配布時には各パッケージのライセンスを保持してください。利用者が追加する素材・フォントは利用者自身で権利状態をご確認ください。
