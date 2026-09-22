<p align="center"><img src="../assets/banner.png" alt="BrowserTranslate — dịch trong trình duyệt, ưu tiên quyền riêng tư" width="900"></p>
<h1 align="center">BrowserTranslate</h1>
<p align="center"><strong>Đọc trang web và phụ đề bằng mô hình bạn lựa chọn.</strong><br>Mã nguồn mở · Khóa API của bạn · Không máy chủ trung gian · Không thu thập dữ liệu đo lường</p>
<p align="center">
  <a href="../README.md"><kbd>English</kbd></a>
  <a href="./zh-CN.md"><kbd>简体中文</kbd></a>
  <a href="./zh-TW.md"><kbd>繁體中文</kbd></a>
  <a href="./ja.md"><kbd>日本語</kbd></a>
  <a href="./ko.md"><kbd>한국어</kbd></a>
  <a href="./es.md"><kbd>Español</kbd></a>
  <a href="./fr.md"><kbd>Français</kbd></a><br>
  <a href="./de.md"><kbd>Deutsch</kbd></a>
  <a href="./pt-BR.md"><kbd>Português (Brasil)</kbd></a>
  <a href="./it.md"><kbd>Italiano</kbd></a>
  <a href="./ru.md"><kbd>Русский</kbd></a>
  <a href="./tr.md"><kbd>Türkçe</kbd></a>
  <a href="./vi.md"><kbd><b>Tiếng Việt</b></kbd></a>
  <a href="./id.md"><kbd>Bahasa Indonesia</kbd></a>
</p>
<p align="center"><a href="#installation">Cài đặt</a> · <a href="#configuration">Cấu hình</a> · <a href="../CHANGELOG.md">Nhật ký thay đổi</a> · <a href="https://github.com/Lewen-Cai/browser-translate/issues">Báo lỗi</a></p>
<p align="center">
  <a href="https://github.com/Lewen-Cai/browser-translate/releases/latest"><img src="https://img.shields.io/github/v/release/Lewen-Cai/browser-translate?style=flat-square&amp;color=2563eb" alt="Bản phát hành mới nhất"></a>
  <a href="../LICENSE"><img src="https://img.shields.io/badge/license-GPL--3.0-2563eb?style=flat-square" alt="GPL-3.0"></a>
  <a href="https://github.com/Lewen-Cai/browser-translate/actions/workflows/ci.yml"><img src="https://github.com/Lewen-Cai/browser-translate/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://github.com/Lewen-Cai/browser-translate/stargazers"><img src="https://img.shields.io/github/stars/Lewen-Cai/browser-translate?style=flat-square" alt="GitHub stars"></a>
</p>

<a id="why"></a>
## Vì sao chọn BrowserTranslate?

Dùng nhà cung cấp bạn muốn mà không phải đăng ký thuê bao bắt buộc cho tiện ích hoặc đi qua máy chủ trung gian do chúng tôi vận hành.

- **Mô hình và khóa của bạn:** kết nối điểm truy cập tương thích OpenAI hoặc môi trường chạy cục bộ. Khả năng tương thích phụ thuộc vào điểm truy cập và mô hình.
- **Kết nối trực tiếp:** văn bản đi từ trình duyệt tới nhà cung cấp đã chọn. Dự án không vận hành máy chủ chuyển tiếp.
- **Không đo lường từ xa:** tiện ích không thu thập phân tích sử dụng, báo lỗi từ xa hay nhật ký từ xa.
- **Prompt cơ sở có thể chỉnh sửa:** xem mẫu mặc định, tạo mẫu riêng và dùng một bộ hướng dẫn chung cho các chế độ LLM. Quy tắc từ điển và định dạng nội bộ vẫn do tiện ích quản lý.

<a id="features"></a>
## Tính năng

- **Bắt đầu không cần khóa API:** Microsoft và Google được bật sẵn; cài đặt mới dùng Microsoft cho cả ba chế độ. Đây là các điểm truy cập công khai không chính thức: hãy đọc [lưu ý dịch vụ miễn phí](#free-engines).
- **Mỗi tác vụ một công cụ:** thẻ chọn văn bản, toàn trang và phụ đề có thể dùng nhà cung cấp khác nhau. Lưu nhiều cấu hình để chuyển mà không nhập lại.
- **Dịch văn bản được chọn:** chọn văn bản rồi nhấn biểu tượng nổi, hoặc dùng chế độ phím tắt. Văn bản thông thường hiển thị theo luồng với bản gốc ở trên. Thẻ có sao chép, dịch lại và chọn tạm thời nhà cung cấp/ngôn ngữ. Các lựa chọn này không đổi cài đặt chung; dịch lại bỏ qua bộ nhớ đệm.
- **Thẻ ổn định và di chuyển được:** chỉnh kích thước ở Chung → Giao diện. Bản gốc và bản dịch cuộn riêng; bản gốc chiếm tối đa 30% vùng nội dung chung. Khi chờ chỉ hiện trạng thái tải gọn. Ghim để thẻ không đóng khi cuộn hoặc nhấn bên ngoài, và kéo tay nắm để di chuyển.
- **Dịch trang song ngữ:** chèn bản dịch dưới bản gốc trong nội dung chính, thường bỏ qua điều hướng, đầu và cuối trang. Xử lý dần vùng quanh khung nhìn khi cuộn. Dùng Trang hiện tại → Dịch song ngữ trong popup hoặc **Alt+A** ở chế độ phím tắt.
- **Từ điển cho lựa chọn ngắn:** mô hình có thể cung cấp bản dịch, phát âm, từ loại, nghĩa và ví dụ. Đoạn văn rõ ràng, nhiều dòng và nội dung dạng mã chỉ được dịch. Dịch vụ thông thường không tạo mục từ điển.
- **Cho phép ngôn ngữ trộn:** trùng ngôn ngữ nguồn và đích không chặn yêu cầu. Chuyển cách viết theo vùng phụ thuộc vào mô hình hoặc dịch vụ.
- **Cấu hình và bộ nhớ đệm cục bộ:** thời hạn được chỉnh tại Cài đặt → Dữ liệu. Nhập/xuất cấu hình và prompt bằng JSON; không gồm bộ nhớ đệm và mặc định không gồm khóa API.
- **Giao diện gọn:** sáng/tối theo hệ thống hoặc thủ công; năm trang Chung, Dịch, Nhà cung cấp, Phụ đề, Dữ liệu. Giao diện dùng phông hệ thống; mã và địa chỉ dùng phông đơn cách.

<a id="subtitles"></a>
### Phụ đề video

Dịch phụ đề có sẵn trên **YouTube**, **bản ghi Zoom trên đám mây**, **bản ghi khóa học Canvas** và trình phát tương thích cung cấp phụ đề qua `<track>`/TextTrack. Hỗ trợ tùy trình phát và khả năng truy cập phụ đề; không phải mọi trình phát nhúng đều đã thử nghiệm. **Không chuyển âm thanh thành văn bản.**

Nhấn biểu tượng dịch trên trình phát rồi bật dịch phụ đề. Nếu không có thanh điều khiển phù hợp, nút nằm ở góc video. Trên YouTube, bật phụ đề gốc (CC) trước để tải bản phụ đề; các trình phát khác cũng có thể cần bật phụ đề. Có thể dùng phụ đề của tác giả và phụ đề tự động được hỗ trợ; các mảnh ASR cuộn được ghép thành câu trước khi dịch.

Hai dòng được vẽ trên video và kéo bằng tay nắm. Vị trí được ghi nhớ cả khi toàn màn hình, đồng thời tránh các điều khiển đang hiện. Dịch ưu tiên phụ đề gần vị trí phát và sắp xếp lại sau khi tua. Nhãn người nói được nhận diện sẽ được giữ nguyên, không dịch. Độ trễ tùy nhà cung cấp và video, không bảo đảm thời gian cố định.

Menu trình phát và **Cài đặt → Phụ đề** cho phép chọn song ngữ/chỉ gốc/chỉ dịch, thứ tự dòng, độ đục nền, cùng kích thước, màu, phông và độ đậm từng dòng. Trang cài đặt có xem trước trực tiếp, số chính xác, bảng màu nhỏ, nhập HEX và nút đặt lại.

<a id="languages"></a>
### Ngôn ngữ

**56 đích dịch** độc lập với **14 ngôn ngữ giao diện** được liên kết ở trên. Giao diện có thể theo ngôn ngữ trình duyệt. Bộ chọn trong popup, cài đặt và thẻ tìm theo tên bản ngữ, tên tiếng Anh hoặc bản địa hóa, mã ngôn ngữ và tên vùng tiếng Anh. Tên RTL giữ hướng đọc mà không làm lệch cả hàng.

Tiếng Anh chia thành **Hoa Kỳ, Vương quốc Anh và Úc**; thiết lập `en` chung cũ chuyển sang tiếng Anh Mỹ. Tiếng Trung phân biệt **giản thể và phồn thể**. LLM nhận hướng dẫn chính tả và từ vựng theo vùng. Nếu dịch vụ miễn phí không hỗ trợ biến thể, nó âm thầm dùng tiếng Anh chung, không đổi nhà cung cấp.

<a id="architecture"></a>
## Kiến trúc

<p align="center"><img src="../assets/framework.png" alt="Kiến trúc BrowserTranslate và kết nối trực tiếp tới nhà cung cấp" width="760"></p>

Yêu cầu LLM và dịch máy được gửi từ **service worker nền**. JavaScript của website không nhận khóa API của bạn. Content script hiển thị kết quả và tích hợp trang/trình phát; việc lấy phụ đề theo từng website cũng có thể chạy trong ngữ cảnh nội dung hoặc trang. Dự án không có máy chủ trung gian.

<a id="installation"></a>
## Cài đặt

Dành cho **trình duyệt desktop dựa trên Chromium**, gồm Chrome, Edge, Brave và Arc. Hiện chưa hỗ trợ Firefox.

1. Tải `.zip` mới nhất từ [Releases](https://github.com/Lewen-Cai/browser-translate/releases).
2. Giải nén vào thư mục sẽ được giữ lâu dài.
3. Mở `chrome://extensions` hoặc trang quản lý tiện ích, bật **Chế độ dành cho nhà phát triển**, chọn **Tải tiện ích đã giải nén** và chỉ đến thư mục.

### Cập nhật thủ công

Tiện ích đã giải nén không tự cập nhật. Giải nén bản mới đè lên thư mục cũ, nhấn **Tải lại** trên trang tiện ích rồi làm mới các trang web đang mở. Trên Windows/macOS, cơ chế cài đặt được quản lý cho tiện ích tự lưu trữ thường cần chính sách doanh nghiệp; tải thư mục đã giải nén là quy trình khác.

Đầu trang cài đặt hiển thị phiên bản và nút kiểm tra thủ công. Chỉ khi nhấn mới hỏi GitHub; nếu có bản mới hơn sẽ cung cấp tệp, không tự cài. Popup không lặp lại số phiên bản.

<a id="configuration"></a>
## Cấu hình

Cài đặt mới dùng Microsoft cho mọi chế độ. Để dùng mô hình riêng:

1. Mở popup rồi nhấn biểu tượng cài đặt.
2. Trong **Nhà cung cấp**, bật dịch vụ và nhập điểm truy cập, mô hình, khóa API. Môi trường cục bộ không bắt buộc khóa. Dòng đang bật hiển thị trạng thái/độ trễ qua phép kiểm tra có liên hệ nhà cung cấp.
3. Tại **Dịch → Công cụ dịch**, gán riêng cho văn bản chọn, toàn trang và phụ đề.
4. Chọn ngôn ngữ đích và văn bản trên trang được hỗ trợ. Muốn dùng bàn phím, bật chế độ phím tắt ở **Chung**: **Alt+T** dịch lựa chọn, **Alt+A** dịch trang. Cả hai chỉ hoạt động ở chế độ này.

Popup giữ ngôn ngữ đích, công tắc trang hiện tại và công cụ dịch. Chế độ kích hoạt và phím tắt chỉ có trong cài đặt. Trang không hỗ trợ sẽ tắt chức năng dịch; khi thiếu content script sẽ có gợi ý tải lại. Prompt và phân công ở Dịch, thông tin xác thực ở Nhà cung cấp, giao diện phụ đề ở Phụ đề, bộ nhớ đệm và nhập/xuất ở Dữ liệu.

### Nhà cung cấp và suy luận

Có sẵn **OpenAI, Claude, Gemini, DeepSeek, Moonshot, Zhipu, Qwen, SiliconFlow, OpenRouter, Mistral, opencode**. Môi trường cục bộ gồm **LM Studio, Ollama, llama.cpp, vLLM**. Các dịch vụ tương thích khác dùng điểm truy cập tùy chỉnh.

Điểm truy cập phân biệt vùng và gói, như opencode Zen/Go; Qwen ở Bắc Kinh, Singapore, Hồng Kông, Virginia và Token Plan. Tài khoản, khóa và danh mục mô hình không nhất thiết dùng thay nhau. Nhà cung cấp được hỗ trợ cũng cho nhập URL riêng của workspace.

Khi có hỗ trợ, tiện ích mặc định yêu cầu tắt suy luận và cung cấp **Low / Medium / High / XHigh / Max**, ánh xạ sang tham số của nhà cung cấp. Với máy chủ tùy chỉnh/cục bộ, chọn dạng tham số hoặc **Không gửi**. Nếu không gửi điều khiển được hỗ trợ, mặc định máy chủ sẽ áp dụng. Khả năng hỗ trợ, độ trễ và phí token suy luận tùy endpoint/mô hình, không chỉ tùy giao diện.

<a id="prompts"></a>
### Prompt cơ sở

Ở **Dịch → Prompt cơ sở**, thư viện và trình soạn thảo nằm cạnh nhau, hoặc xếp dọc trong cửa sổ hẹp. Mẫu mặc định có thể xem nhưng chỉ đọc. **Tạo mới** cho phép bắt đầu từ mặc định hoặc trống; hướng dẫn nằm trong thẻ, dưới vùng soạn thảo. Chọn mẫu chỉ mở nó; prompt đang dùng được đánh dấu riêng.

- **Lưu và áp dụng** lưu bản nháp rồi dùng ngay.
- **Lưu thay đổi** cập nhật prompt đang dùng.
- **Áp dụng prompt** dùng mẫu đã lưu; bị vô hiệu hóa nếu đã dùng mẫu đó.
- **Hủy** bỏ sửa đổi cục bộ.
- **Thao tác với mẫu** gồm lưu chưa áp dụng, nhân bản, thay bản nháp bằng nội dung mặc định và xóa. Thay thế/xóa có tính phá hủy cần xác nhận; xóa mẫu đang dùng sẽ trở về mặc định.

Hướng dẫn tùy chỉnh **thay thế**, không nối thêm vào cơ sở mặc định. Tiện ích vẫn thêm ngôn ngữ đích, quy ước vùng, định tuyến và định dạng; giao thức nội bộ không chỉnh sửa được. Chỉ dẫn xung đột hoặc mô hình yếu hơn có thể cho kết quả chưa tốt. `{{...}}` giữ nguyên, không thay biến.

Lưu tối đa **20 mẫu**, mỗi mẫu **12.000 ký tự** hướng dẫn, trên máy. Chỉ tác động tới LLM, không tới Microsoft/Google thông thường. Prompt thay đổi dùng bộ nhớ đệm riêng; xuất cài đặt bao gồm mẫu và lựa chọn đang dùng.

<a id="validation"></a>
### Kiểm tra phản hồi

Đoạn văn rõ ràng không nhận hướng dẫn từ điển. Với lựa chọn ngắn, mục từ phải khớp toàn bộ lựa chọn, không chỉ một từ bị trích ra. Đầu ra cấu trúc đáng ngờ được giữ lại để kiểm tra; thẻ nhận loại kết quả rõ ràng thay vì đoán từ `{`.

Phản hồi lựa chọn sai định dạng được thêm tối đa **một yêu cầu sửa bằng văn bản thuần**. Lô trang/phụ đề sai chuyển sang **một yêu cầu văn bản cho mỗi đoạn chưa có trong bộ nhớ đệm**. Có thể tốn token thêm; lần thử lại do mạng tính riêng. Nếu tiếp tục sai sẽ hiện lỗi, không hiển thị JSON giao thức như bản dịch và không lưu kết quả lỗi.

ID của lô phải đầy đủ, duy nhất; kết quả được khôi phục đúng thứ tự đầu vào. Số và đối tượng không bị ép thành chuỗi dịch. Khóa bộ nhớ đệm theo giao thức cùng kiểm tra khi đọc cách ly kết quả LLM cũ chưa xác thực. Nội dung cấu trúc vốn có trong nguồn vẫn dịch được như văn bản.

**Kiểm tra định dạng không bảo đảm đúng nghĩa hoặc phát hiện mọi phần bị bỏ sót.** Nhãn ngôn ngữ là gợi ý hiển thị cục bộ, có đánh dấu thận trọng cho chữ viết trộn; không chặn hay định tuyến yêu cầu.

<a id="free-engines"></a>
### Dịch vụ miễn phí

Microsoft và Google dùng `edge.microsoft.com` và `translate-pa.googleapis.com`.

- **Không phải API chính thức:** phục vụ tính năng dịch web/trình duyệt của hãng, không có cam kết công khai dành cho tiện ích này.
- **Không liên kết hay bảo trợ:** dự án không trực thuộc, được tài trợ hoặc được Microsoft/Google phê chuẩn. Tên và nhãn hiệu thuộc chủ sở hữu, chỉ để nhận diện dịch vụ.
- **Không bảo đảm khả dụng:** có thể thay đổi hay ngừng hoạt động không báo trước. Bạn có thể chuyển sang mô hình riêng, nhưng nó cũng phụ thuộc vào nhà cung cấp.
- **Văn bản gửi tới dịch vụ:** áp dụng điều khoản và chính sách riêng tư của họ. Nội dung nhạy cảm nên dùng điểm truy cập riêng phù hợp.
- **Không bảo hành:** cung cấp nguyên trạng, người dùng tự chịu rủi ro. Sử dụng thương mại hoặc số lượng lớn nên chọn API chính thức được cấp phép.

Microsoft là mặc định để lần cài đầu có thể sử dụng ngay. Gán một chế độ sang mô hình riêng sẽ ngừng dùng các điểm dịch công khai đó cho chế độ ấy.

<a id="privacy"></a>
## Quyền riêng tư và dữ liệu cục bộ

Không trung gian và không đo lường **không đồng nghĩa mọi xử lý đều cục bộ**. Nhà cung cấp đám mây nhận văn bản được yêu cầu dịch; môi trường cục bộ có thể giữ xử lý mô hình trên máy. Việc lấy phụ đề liên hệ trang video, kiểm tra cập nhật thủ công liên hệ GitHub. Các dịch vụ nhận siêu dữ liệu mạng thông thường như địa chỉ IP.

Cài đặt, khóa API và bộ nhớ đệm nằm trong `chrome.storage.local`. **Tiện ích không mã hóa khóa API.** Xuất mặc định loại khóa ra; chọn bao gồm sẽ tạo tệp văn bản thuần cần giữ kín. Bộ nhớ đệm không được xuất và không có tính năng duyệt lịch sử dịch.

<a id="development"></a>
## Phát triển

```bash
pnpm install
pnpm dev          # Build theo dõi: .output/chrome-mv3-dev/
pnpm test         # Chạy kiểm thử ở chế độ theo dõi
pnpm test:run     # Chạy kiểm thử một lần
pnpm typecheck    # Sinh kiểu WXT + TypeScript
pnpm lint
pnpm build        # Bản sản xuất: .output/chrome-mv3/
```

Tải thư mục đầu ra như tiện ích đã giải nén. Khi đổi bản build, tải lại tiện ích và trang mục tiêu. Xem [CHANGELOG.md](../CHANGELOG.md), gửi lỗi hoặc đề xuất tại [Issues](https://github.com/Lewen-Cai/browser-translate/issues); loại bỏ khóa API và nội dung riêng tư khỏi báo cáo.

<a id="acknowledgements"></a>
## Lời cảm ơn

- [read-frog](https://github.com/mengxi-ream/read-frog) — GPL-3.0; dự án tuyệt vời mà chúng tôi đã học hỏi trong quá trình phát triển.
- [Lobe Icons](https://github.com/lobehub/lobe-icons) — MIT; biểu trưng nhà cung cấp. Nhãn hiệu thuộc chủ sở hữu tương ứng và chỉ dùng để nhận diện dịch vụ.

<a id="license"></a>
## Giấy phép

[GPL-3.0](../LICENSE). Tác phẩm phái sinh được phân phối phải tuân thủ nghĩa vụ về mã nguồn và giấy phép. Tài nguyên bên thứ ba giữ giấy phép riêng.
