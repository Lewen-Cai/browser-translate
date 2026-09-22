<p align="center"><img src="./assets/banner.png" alt="BrowserTranslate — 隱私優先的瀏覽器翻譯" width="900"></p>
<h1 align="center">BrowserTranslate</h1>
<p align="center"><strong>用你選擇的模型，閱讀網頁與影片字幕。</strong><br>開源瀏覽器翻譯 · 自備 API Key · 無中繼伺服器 · 零遙測</p>
<p align="center">
  <a href="./README.md"><kbd>English</kbd></a>
  <a href="./README_zh-CN.md"><kbd>简体中文</kbd></a>
  <a href="./README_zh-TW.md"><kbd><b>繁體中文</b></kbd></a>
  <a href="./README_ja.md"><kbd>日本語</kbd></a>
  <a href="./README_ko.md"><kbd>한국어</kbd></a>
  <a href="./README_es.md"><kbd>Español</kbd></a>
  <a href="./README_fr.md"><kbd>Français</kbd></a><br>
  <a href="./README_de.md"><kbd>Deutsch</kbd></a>
  <a href="./README_pt-BR.md"><kbd>Português (Brasil)</kbd></a>
  <a href="./README_it.md"><kbd>Italiano</kbd></a>
  <a href="./README_ru.md"><kbd>Русский</kbd></a>
  <a href="./README_tr.md"><kbd>Türkçe</kbd></a>
  <a href="./README_vi.md"><kbd>Tiếng Việt</kbd></a>
  <a href="./README_id.md"><kbd>Bahasa Indonesia</kbd></a>
</p>
<p align="center"><a href="#installation">安裝</a> · <a href="#configuration">設定</a> · <a href="./CHANGELOG.md">更新紀錄</a> · <a href="https://github.com/Lewen-Cai/browser-translate/issues">問題回報</a></p>
<p align="center">
  <a href="https://github.com/Lewen-Cai/browser-translate/releases/latest"><img src="https://img.shields.io/github/v/release/Lewen-Cai/browser-translate?style=flat-square&amp;color=2563eb" alt="最新發行版本"></a>
  <a href="./LICENSE"><img src="https://img.shields.io/badge/license-GPL--3.0-2563eb?style=flat-square" alt="GPL-3.0"></a>
  <a href="https://github.com/Lewen-Cai/browser-translate/actions/workflows/ci.yml"><img src="https://github.com/Lewen-Cai/browser-translate/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://github.com/Lewen-Cai/browser-translate/stargazers"><img src="https://img.shields.io/github/stars/Lewen-Cai/browser-translate?style=flat-square" alt="GitHub stars"></a>
</p>

<a id="why"></a>
## 為什麼選擇 BrowserTranslate？

使用你偏好的翻譯服務，不必訂閱本擴充功能，也不經過我們營運的中繼伺服器。

- **自己的模型與金鑰**：連接相容 OpenAI 的端點或本機執行環境；實際相容性取決於端點和模型。
- **直接連線**：待譯文字由瀏覽器直接傳送給選定供應商，本專案沒有中繼伺服器。
- **零遙測**：不收集使用分析，不進行遠端錯誤回報或遠端記錄。
- **可編輯的基礎 Prompt**：查看預設範本、建立自己的版本，所有 LLM 翻譯情境共用一套基礎指令。內部詞典與輸出格式規則由擴充功能管理。

<a id="features"></a>
## 功能

- **不需要 API Key 即可開始**：Microsoft 和 Google 翻譯預設啟用，新安裝的三個翻譯情境都使用 Microsoft。這些是非官方公開端點，請先閱讀[免費服務說明](#free-engines)。
- **各情境獨立選擇引擎**：選取文字、整頁和影片字幕可分別指定供應商，並同時保留多個供應商設定，不必在切換時重填。
- **選取文字翻譯**：選取後點浮動圖示，或使用快速鍵模式。一般譯文串流顯示，原文在譯文上方；卡片提供複製、重新翻譯、供應商與目標語言選擇。卡片內的暫時選擇不改變全域設定，重新翻譯會略過快取。
- **固定大小、可移動的卡片**：在「通用 → 外觀」調整尺寸。原文與譯文各自捲動，原文最多占共享內文區的 30%；等待時只顯示精簡載入狀態。釘選後捲動或點擊其他位置不會關閉，可拖曳把手移動。
- **整頁雙語翻譯**：在網頁內文原地插入譯文，保留上方原文，通常排除導覽、頁首和頁尾。隨視窗捲動逐步處理。可用彈出視窗「目前頁面 → 雙語翻譯」開關，或在快速鍵模式按 **Alt+A**。
- **短選區自動查詞**：模型可顯示譯名、音標、詞性、釋義和例句；明顯段落、多行或程式碼類內容只進行翻譯。一般翻譯服務不產生詞典條目。
- **允許混合語言**：不因來源和目標語言相同而阻止請求；地區用語轉換的效果取決於模型或服務。
- **本機設定與快取**：在「設定 → 資料」調整快取期限，匯出／匯入 JSON 設定與自訂 Prompt。快取不匯出，API Key 預設排除，需主動勾選才包含。
- **精簡介面**：明暗主題可跟隨系統或手動指定；設定分為通用、翻譯、服務商、字幕和資料。介面使用系統字型，程式碼與端點欄位保留等寬字型。

<a id="subtitles"></a>
### 影片字幕

支援 **YouTube、Zoom 雲端錄影、Canvas 課程錄影**，以及透過標準 `<track>`／TextTrack 提供可存取字幕的相容播放器。能否使用取決於播放器與字幕軌；並非所有嵌入式播放器都已測試。**只翻譯現有字幕，不進行音訊轉錄。**

點播放器控制列的翻譯圖示，再開啟字幕翻譯。若沒有可用控制列，按鈕會出現在影片角落。YouTube 請先開啟原生字幕（CC）載入字幕軌；其他播放器也可能需要先啟動字幕。支援創作者提供的字幕及可用的自動字幕，滾動式 ASR 片段會先合併成句子。

原文與譯文疊加於播放器，可拖曳把手移動，位置會保留，全螢幕下亦然，並避開顯示中的控制列。翻譯優先處理播放位置附近的字幕，跳轉後重新安排任務。識別出的說話者標籤不參與翻譯，顯示時原樣還原。速度依供應商與影片而異，不保證固定回應時間。

播放器選單及**「設定 → 字幕」**可調整雙語／僅原文／僅譯文、上下順序、背景不透明度，以及每行的大小、顏色、字型和字重。設定頁有即時預覽、精確數值、小色盤、HEX 色碼與重設按鈕。

<a id="languages"></a>
### 語言

**56 個翻譯目標**與頁首列出的 **14 種介面語言**分開設定，介面可跟隨瀏覽器語系。彈出視窗、設定和卡片可依原生名稱、英文名稱、介面語言名稱、語言代碼及英語地區別名搜尋。RTL 名稱保留閱讀方向，選單列仍一致對齊。

英語區分**美國、英國、澳洲**，舊通用 `en` 設定會轉為美式英語；中文區分**簡體與繁體**。LLM 會收到地區拼字與用語指令；免費服務支援時使用相應變體，否則直接退回一般英語，不切換供應商。

<a id="architecture"></a>
## 架構

<p align="center"><img src="./assets/framework.png" alt="BrowserTranslate 架構與直接連接供應商的資料流" width="760"></p>

LLM 與機器翻譯請求由**背景 Service Worker**發起，不將 API Key 提供給網站 JavaScript。內容腳本負責顯示與頁面／播放器整合；特定站點的字幕擷取也可能在內容腳本或頁面環境執行。本專案沒有中繼服務。

<a id="installation"></a>
## 安裝

目前支援 **Chromium 桌面瀏覽器**，包含 Chrome、Edge、Brave、Arc，暫不支援 Firefox。

1. 從 [Releases](https://github.com/Lewen-Cai/browser-translate/releases) 下載最新 `.zip`。
2. 解壓縮至準備長期保留的資料夾。
3. 開啟 `chrome://extensions` 或瀏覽器擴充功能頁，啟用**開發人員模式**，選擇**載入未封裝項目**，指定該資料夾。

### 手動更新

未封裝擴充功能不會自動更新。下載新封存檔並覆蓋原資料夾，在擴充功能頁按**重新載入**，再重新整理已開啟的網頁。Windows／macOS 透過受管理機制安裝自託管擴充功能通常需要企業政策；載入未封裝項目是不同流程。

設定頁右上方顯示版本與手動更新檢查。只有按下按鈕才查詢 GitHub，有新版時提供下載，不會自動安裝；彈出視窗不重複顯示版本。

<a id="configuration"></a>
## 設定

新安裝預設皆使用 Microsoft。要使用自己的模型：

1. 開啟擴充功能彈出視窗，點設定圖示。
2. 在**「服務商」**啟用服務，填寫端點、模型及 API Key；本機執行環境不要求金鑰。啟用後顯示連線狀態／延遲，此檢查會聯絡供應商。
3. 在**「翻譯 → 翻譯引擎」**分別指定選取文字、整頁和字幕的供應商。
4. 選擇目標語言，在支援的網頁選取文字並點藍色圖示。快速鍵模式在**「通用」**開啟，預設 **Alt+T** 翻譯選區、**Alt+A** 翻譯整頁；兩者都僅在快速鍵模式生效。

彈出視窗保留目標語言、目前頁面雙語開關與引擎選擇，觸發方式和快速鍵僅在設定頁。受限頁面會停用翻譯，內容腳本不可用時提示重新整理。Prompt 與引擎策略在「翻譯」，憑證在「服務商」，字幕外觀在「字幕」，快取及匯入／匯出在「資料」。

### 服務商與思考控制

預設供應商有 **OpenAI、Claude、Gemini、DeepSeek、Moonshot、Zhipu、Qwen、SiliconFlow、OpenRouter、Mistral、opencode**；本機選項包含 **LM Studio、Ollama、llama.cpp、vLLM**。其他相容服務可設定自訂端點。

端點區分地區和方案，例如 opencode Zen／Go，及 Qwen 的北京、新加坡、香港、美國維吉尼亞與 Token Plan。帳號、金鑰和模型目錄不一定通用；支援的供應商也允許填寫工作區專屬網址。

支援控制時，擴充功能預設請求關閉思考，並提供 **Low／Medium／High／XHigh／Max** 五級，映射至供應商參數。自訂／本機服務可選參數格式，或保留「不傳送」。未傳送有效控制參數時，以伺服器預設為準。實際支援、延遲與推理 token 計費由端點及模型決定，不能只靠介面設定保證。

<a id="prompts"></a>
### 自訂基礎 Prompt

**「翻譯 → 基礎 Prompt」**的範本庫與編輯器左右排列，窄視窗改為上下。預設範本可查看但唯讀。**「新增」**可從預設或空白建立，說明位於卡片內編輯框下方。選擇範本只開啟編輯，使用中的 Prompt 另有標示。

- **儲存並套用**：儲存草稿並立即使用。
- **儲存變更**：更新使用中的 Prompt。
- **套用 Prompt**：套用已儲存範本，已在使用時停用。
- **取消**：放棄本機編輯。
- **範本操作**：僅儲存暫不套用、複製、以預設內容取代草稿、刪除。破壞性取代及刪除需確認；刪除使用中的範本會退回預設。

自訂指令**取代**預設基礎 Prompt，不是附加。目標語言、地區慣例、路由和輸出格式仍由擴充功能加入，內部協定不可編輯。指令衝突或模型能力不足仍可能影響結果。這是純文字編輯器，不會替換 `{{...}}`。

最多儲存 **20 套自訂範本**，每套最多 **12,000 字元**。只對 LLM 生效，不影響 Microsoft／Google 一般翻譯。修改 Prompt 使用獨立快取，設定匯出包含範本與使用中的選擇。

<a id="validation"></a>
### 回應驗證

明顯長文不接收查詞指令。短選區仍交由模型選擇模式，但詞條必須對應整個選區，不能僅抽出一個詞。疑似結構化輸出先暫存驗證，卡片依明確結果類型顯示，不靠 `{` 猜測。

選區格式錯誤最多增加**一次純文字修正請求**。整頁／字幕批次錯誤時，每個未快取段落最多退回**一次純文字請求**。可能增加 token 用量，網路重試另計。持續格式錯誤顯示錯誤訊息，不把原始協定 JSON 當譯文，也不快取失敗結果。

批次 ID 必須完整且唯一，結果依輸入順序還原；數字或物件不會被強制轉成譯文。協定快取鍵與讀取驗證隔離舊的未驗證結果。原文本身的結構化內容仍可當作文字翻譯。

**格式驗證不保證語義正確，也無法發現所有漏譯。** 來源語言只是本機顯示提示，對明顯混合文字採保守標示，不會阻止請求或決定其模式。

<a id="free-engines"></a>
### 關於免費翻譯服務

Microsoft 與 Google 使用 `edge.microsoft.com`、`translate-pa.googleapis.com` 的公開端點。

- **並非官方 API**：這些端點用於廠商自家網頁／瀏覽器翻譯，未對本擴充功能提供公開服務契約。
- **無隸屬或背書**：本專案未獲 Microsoft、Google 贊助或認可，也無隸屬關係；名稱與商標僅用來識別服務，歸原權利人所有。
- **不保證可用性**：端點可能隨時改變或停用。可切換自有模型，但其可用性仍取決於供應商。
- **文字會傳送給服務方**：適用其條款及隱私政策。敏感內容應使用適當的自有端點。
- **不提供擔保**：依現狀提供，風險自負；商業或大量使用應選擇正式授權的官方 API。

預設 Microsoft 是為了首次安裝即可使用。某個情境改用自己的模型後，該情境不再呼叫上述公開翻譯端點。

<a id="privacy"></a>
## 隱私與本機資料

本專案沒有中繼伺服器，也不收集遙測，但**不代表所有處理都在本機**。雲端供應商會收到你提交的待譯文字；本機執行環境可將模型處理留在電腦上。字幕擷取會聯絡影片站點，手動更新檢查會聯絡 GitHub；這些服務會收到 IP 位址等正常網路中繼資料。

設定、API Key 及翻譯快取存於 `chrome.storage.local`。**擴充功能不會加密 API Key。** 匯出預設不含金鑰，若選擇包含會產生明文檔案，請妥善保管。快取不匯出，也不提供可瀏覽的翻譯歷史功能。

<a id="development"></a>
## 開發

```bash
pnpm install
pnpm dev          # 監看建置：.output/chrome-mv3-dev/
pnpm test         # 監看模式測試
pnpm test:run     # 單次測試
pnpm typecheck    # WXT 型別產生 + TypeScript
pnpm lint
pnpm build        # 正式建置：.output/chrome-mv3/
```

將開發或正式輸出資料夾載入為未封裝擴充功能。更換建置後重新載入並重新整理網頁。[CHANGELOG.md](./CHANGELOG.md) 記錄版本變更，[Issues](https://github.com/Lewen-Cai/browser-translate/issues) 接收問題及建議。回報時請移除金鑰與私人網頁內容。

<a id="acknowledgements"></a>
## 致謝

- [read-frog](https://github.com/mengxi-ream/read-frog) — GPL-3.0；開發過程中參考與學習的優秀專案。
- [Lobe Icons](https://github.com/lobehub/lobe-icons) — MIT；提供供應商品牌圖示，商標屬於各自權利人，僅識別服務。

<a id="license"></a>
## 授權條款

[GPL-3.0](./LICENSE)。散布衍生作品時須遵守原始碼提供及授權義務；第三方素材保留各自授權條款。
