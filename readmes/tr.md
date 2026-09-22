<p align="center"><img src="../assets/banner.png" alt="BrowserTranslate — gizlilik odaklı tarayıcı çevirisi" width="900"></p>
<h1 align="center">BrowserTranslate</h1>
<p align="center"><strong>Web sayfalarını ve altyazıları seçtiğiniz modelle okuyun.</strong><br>Açık kaynak · Kendi API anahtarınız · Aracı sunucu yok · Telemetri yok</p>
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
  <a href="./tr.md"><kbd><b>Türkçe</b></kbd></a>
  <a href="./vi.md"><kbd>Tiếng Việt</kbd></a>
  <a href="./id.md"><kbd>Bahasa Indonesia</kbd></a>
</p>
<p align="center"><a href="#installation">Kurulum</a> · <a href="#configuration">Yapılandırma</a> · <a href="../CHANGELOG.md">Değişiklikler</a> · <a href="https://github.com/Lewen-Cai/browser-translate/issues">Sorun bildir</a></p>
<p align="center">
  <a href="https://github.com/Lewen-Cai/browser-translate/releases/latest"><img src="https://img.shields.io/github/v/release/Lewen-Cai/browser-translate?style=flat-square&amp;color=2563eb" alt="Son sürüm"></a>
  <a href="../LICENSE"><img src="https://img.shields.io/badge/license-GPL--3.0-2563eb?style=flat-square" alt="GPL-3.0"></a>
  <a href="https://github.com/Lewen-Cai/browser-translate/actions/workflows/ci.yml"><img src="https://github.com/Lewen-Cai/browser-translate/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://github.com/Lewen-Cai/browser-translate/stargazers"><img src="https://img.shields.io/github/stars/Lewen-Cai/browser-translate?style=flat-square" alt="GitHub stars"></a>
</p>

<a id="why"></a>
## Neden BrowserTranslate?

Uzantıya zorunlu abonelik veya projenin işlettiği bir aracı sunucu olmadan tercih ettiğiniz sağlayıcıyı kullanın.

- **Modeliniz, anahtarınız:** OpenAI uyumlu bir uç noktaya ya da yerel çalışma ortamına bağlanın. Uyumluluk uç noktaya ve modele bağlıdır.
- **Doğrudan bağlantı:** çevrilecek metin tarayıcıdan seçtiğiniz sağlayıcıya gider. Proje bir aktarma sunucusu işletmez.
- **Telemetri yok:** uzantı kullanım analizi, uzaktan hata raporu veya uzaktan günlük toplamaz.
- **Düzenlenebilir temel istem:** varsayılanı görüntüleyin, şablonlar oluşturun ve tüm LLM çevirilerinde ortak temel kullanın. Sözlük ve çıktı biçimi kuralları uzantı tarafından yönetilir.

<a id="features"></a>
## Özellikler

- **API anahtarı olmadan başlayın:** Microsoft ve Google varsayılan olarak açıktır; yeni kurulum üç modda da Microsoft kullanır. Bunlar resmi olmayan genel uç noktalardır; [ücretsiz hizmet uyarısını](#free-engines) okuyun.
- **Her iş için ayrı motor:** seçili metin, tüm sayfa ve video altyazıları farklı sağlayıcılar kullanabilir. Birden çok yapılandırma saklanır; geçişte yeniden giriş gerekmez.
- **Seçili metni çevirme:** metni seçip yüzen simgeye tıklayın veya kısayol modunu kullanın. Normal sonuçlar akış halinde gelir, özgün metin üstte gösterilir. Kartta kopyalama, yeniden çeviri ve geçici sağlayıcı/hedef seçimi vardır. Bunlar genel ayarları değiştirmez; yeniden çeviri önbelleği atlar.
- **Sabit boyutlu, taşınabilir kart:** boyutları Genel → Görünüm altında belirleyin. Kaynak ve çeviri ayrı kayar; kaynak, ortak gövdenin en fazla %30'unu kaplar. Beklerken küçük bir yüklenme görünümü vardır. Sabitleme, kaydırırken veya dışarı tıklarken açık kalmasını sağlar; tutamaktan taşıyabilirsiniz.
- **İki dilli sayfa:** ana içerikte çeviriyi özgün metnin altına ekler; gezinme, üstbilgi ve altbilgiyi genellikle dışarıda bırakır. İşlem, kaydırdıkça görünür alan çevresinde ilerler. Açılır pencerede Geçerli sayfa → İki dilli çeviri anahtarını veya kısayol modunda **Alt+A** kullanın.
- **Kısa seçimler için sözlük:** model çeviri, telaffuz, sözcük türü, anlamlar ve örnek sağlayabilir. Belirgin paragraflar, çok satırlı ve kod benzeri içerik yalnızca çevrilir. Geleneksel hizmetler sözlük girdisi üretmez.
- **Karışık dilli metin:** kaynak ve hedef dilin aynı olması isteği engellemez. Bölgesel yazım dönüşümü modele veya hizmete bağlıdır.
- **Yerel ayarlar ve önbellek:** süre Ayarlar → Veriler altında değişir. Ayarları ve istemleri JSON olarak içe/dışa aktarın; önbellek aktarılmaz, API anahtarları ise ancak açıkça seçilirse eklenir.
- **Kompakt arayüz:** açık/koyu tema otomatik veya elle; Genel, Çeviri, Sağlayıcılar, Altyazılar ve Veriler olmak üzere beş sayfa. Arayüz sistem yazı tipleri, kod ve uç noktalar eş aralıklı yazı tipi kullanır.

<a id="subtitles"></a>
### Video altyazıları

**YouTube**, **Zoom bulut kayıtları**, **Canvas ders kayıtları** ve standart `<track>`/TextTrack üzerinden erişilebilir altyazı sunan uyumlu oynatıcıların mevcut altyazılarını çevirir. Destek oynatıcıya ve parçaya bağlıdır; her gömülü oynatıcı test edilmemiştir. **Sesten metin çıkarımı yapılmaz.**

Oynatıcıdaki çeviri simgesini açıp altyazı çevirisini etkinleştirin. Uygun kontrol çubuğu yoksa düğme videonun köşesinde görünür. YouTube'da parçanın yüklenmesi için önce yerel altyazıları (CC) açın; başka oynatıcılarda da etkinleştirme gerekebilir. İçerik üreticisinin ve desteklenen otomatik altyazıların kullanımı mümkündür; kayan ASR parçaları çeviri öncesinde cümlelere birleştirilir.

Kaynak ve çeviri video üzerine çizilir ve tutamaktan taşınır. Konum tam ekranda da hatırlanır, görünür kontrollerden uzak tutulur. Çeviri oynatma konumuna yakın satırlara öncelik verir ve ileri/geri sarınca yeniden planlanır. Tanınan konuşmacı etiketleri çevrilmeden korunur. Gecikme videoya ve sağlayıcıya bağlıdır; sabit yanıt süresi garanti edilmez.

Oynatıcı menüsü ve **Ayarlar → Altyazılar**, iki dilli/yalnızca özgün/yalnızca çeviri görünümünü, sıralamayı, arka plan opaklığını ve her satırın boyutunu, rengini, yazı tipini ve kalınlığını düzenler. Ayarlarda canlı önizleme, kesin sayısal giriş, küçük palet, HEX girişi ve sıfırlama düğmesi bulunur.

<a id="languages"></a>
### Diller

**56 çeviri hedefi**, yukarıdaki **14 arayüz dilinden** bağımsızdır. Arayüz tarayıcı dilini izleyebilir. Açılır pencere, ayarlar ve kartta yerel/İngilizce/arayüz dilindeki ad, dil kodu ve İngilizce bölge adlarıyla arama yapılır. RTL adlar okuma yönünü korurken menü satırları hizalı kalır.

İngilizce **ABD, Birleşik Krallık ve Avustralya** olarak ayrılır; eski genel `en` ayarı ABD İngilizcesine taşınır. Çince **basitleştirilmiş ve geleneksel** olarak ayrılır. LLM'lere bölgesel yazım ve sözcük talimatları gönderilir. Ücretsiz hizmet bir çeşidi desteklemiyorsa sağlayıcı değiştirmeden ve uyarı vermeden genel İngilizce kullanır.

<a id="architecture"></a>
## Mimari

<p align="center"><img src="../assets/framework.png" alt="BrowserTranslate mimarisi ve sağlayıcılara doğrudan bağlantılar" width="760"></p>

LLM ve makine çevirisi istekleri **arka plan service worker** üzerinden yapılır. Web sitesi JavaScript'ine API anahtarınız verilmez. İçerik betikleri sonuçları gösterir ve sayfa/oynatıcıyla bütünleşir; siteye özgü altyazı alma işlemleri içerik veya sayfa bağlamında da çalışabilir. Projeye ait bir aracı sunucu yoktur.

<a id="installation"></a>
## Kurulum

Chrome, Edge, Brave ve Arc dahil **Chromium tabanlı masaüstü tarayıcılar** içindir. Firefox şu anda desteklenmez.

1. [Releases](https://github.com/Lewen-Cai/browser-translate/releases) bölümünden en yeni `.zip` dosyasını indirin.
2. Kalıcı olarak tutacağınız bir klasöre açın.
3. `chrome://extensions` veya tarayıcınızın uzantı sayfasında **Geliştirici modu**nu açın, **Paketlenmemiş öğe yükle**yi seçip klasörü gösterin.

### Elle güncelleme

Paketlenmemiş uzantılar otomatik güncellenmez. Yeni arşivi mevcut klasörün üzerine açın, uzantı sayfasında **Yeniden yükle**ye basın ve açık web sayfalarını yenileyin. Windows/macOS üzerinde kendi sunucunuzda barındırılan uzantıların yönetilen kurulumu genellikle kurumsal ilke gerektirir; klasörden yükleme farklı bir işlemdir.

Ayar başlığı kurulu sürümü ve elle güncelleme düğmesini gösterir. Yalnızca basıldığında GitHub'a sorar; yeni sürüm varsa arşivi sunar, otomatik kurmaz. Açılır pencerede sürüm tekrarlanmaz.

<a id="configuration"></a>
## Yapılandırma

Yeni kurulum bütün modlarda Microsoft kullanır. Kendi modeliniz için:

1. Açılır pencereyi ve ayarlar simgesini açın.
2. **Sağlayıcılar** altında hizmeti etkinleştirip uç nokta, model ve API anahtarını girin. Yerel ortamlar anahtar istemez. Etkin satırların durum/gecikme denetimi sağlayıcıyla iletişim kurar.
3. **Çeviri → Çeviri motorları** altında seçili metin, tüm sayfa ve altyazıları ayrı atayın.
4. Hedef dil seçip desteklenen bir sayfada metni işaretleyin. Klavye için **Genel** altında kısayol modunu açın: **Alt+T** seçim, **Alt+A** tüm sayfa içindir. İkisi de yalnızca bu modda çalışır.

Açılır pencere hedef dili, geçerli sayfa anahtarını ve motorları içerir. Tetikleme modu ve kısayollar yalnızca ayarlardadır. Desteklenmeyen sayfalarda çeviri kapatılır; içerik betiği yoksa yenileme önerilir. İstem ve atamalar Çeviri, kimlik bilgileri Sağlayıcılar, altyazı görünümü Altyazılar, önbellek/içe/dışa aktarma Veriler altındadır.

### Sağlayıcılar ve akıl yürütme

Ön ayarlar: **OpenAI, Claude, Gemini, DeepSeek, Moonshot, Zhipu, Qwen, SiliconFlow, OpenRouter, Mistral, opencode**. Yerel ortamlar: **LM Studio, Ollama, llama.cpp, vLLM**. Başka uyumlu hizmetler özel uç noktayla bağlanabilir.

Uç noktalar bölge ve planları ayırır: opencode Zen/Go; Qwen için Pekin, Singapur, Hong Kong, Virginia ve Token Plan gibi. Hesaplar, anahtarlar ve model katalogları birbirinin yerine geçmeyebilir. Destekleyen sağlayıcılarda çalışma alanına özel URL girilebilir.

Desteklendiğinde uzantı varsayılan olarak akıl yürütmenin kapatılmasını ister ve sağlayıcı parametrelerine eşlenen **Low / Medium / High / XHigh / Max** düzeylerini sunar. Özel/yerel sunucularda parametre biçimini seçin veya **Hiçbir şey gönderme** ayarını koruyun. Uyumlu denetim gönderilmezse sunucunun varsayılanı geçerlidir. Destek, gecikme ve akıl yürütme tokeni ücretleri yalnızca arayüze değil, uç noktaya/modele bağlıdır.

<a id="prompts"></a>
### Temel istem

**Çeviri → Temel istem** bölümünde kitaplık ve düzenleyici yan yanadır; dar pencerelerde üst üste gelir. Varsayılan görünür ama salt okunurdur. **Yeni** menüsünden varsayılandan veya sıfırdan oluşturun. Açıklama kartın içinde, düzenleyicinin altındadır. Şablon seçmek yalnızca onu açar; kullanımda olan ayrı işaretlenir.

- **Kaydet ve uygula** taslağı kaydeder ve hemen kullanır.
- **Değişiklikleri kaydet** kullanımda olan istemi günceller.
- **İstemi uygula** kayıtlı bir şablonu kullanır; zaten kullanılıyorsa devre dışıdır.
- **İptal** yerel değişiklikleri bırakır.
- **Şablon işlemleri** uygulamadan kaydetme, çoğaltma, taslağı varsayılan metinle değiştirme ve silmeyi içerir. Yıkıcı değiştirme/silme onay ister; etkin şablonu silmek varsayılana döndürür.

Özel talimatlar varsayılana eklenmez, onun **yerini alır**. Hedef dil, bölgesel kurallar, yönlendirme ve biçim uzantı tarafından eklenmeye devam eder; iç protokoller düzenlenmez. Çelişkili talimatlar veya zayıf modeller kusurlu sonuç verebilir. `{{...}}` değişken olarak işlenmez, düz metindir.

En fazla **20 özel şablon**, her birinde **12.000 karakter** talimat yerel olarak saklanır. Yalnızca LLM'leri etkiler, klasik Microsoft/Google çevirisini değil. Değişen istem ayrı önbellek kullanır; dışa aktarma şablonları ve etkin seçimi içerir.

<a id="validation"></a>
### Yanıt doğrulaması

Belirgin uzun metne sözlük talimatları gönderilmez. Kısa seçimde model karar verir, fakat sözlük girdisi içeriden alınmış tek sözcüğe değil bütün seçime karşılık gelmelidir. Şüpheli yapılandırılmış çıktı önce tutulup doğrulanır; kart `{` işaretinden tahmin etmek yerine açık sonuç türünü alır.

Geçersiz seçim yanıtı en fazla **bir düz metin düzeltme isteği** alır. Bozuk sayfa/altyazı grubu, **önbellekte olmayan her parça için bir düz metin isteğine** geri döner. Bu ek token harcayabilir; ağ yeniden denemeleri ayrıdır. Süren biçim hatası, ham protokol JSON'u yerine hata mesajı gösterir ve önbelleğe yazılmaz.

Grup kimlikleri tam ve benzersiz olmalıdır; sonuçlar giriş sırasına getirilir, sayı ve nesneler zorla çeviri metnine dönüştürülmez. Protokole bağlı önbellek anahtarları ve okuma denetimi eski doğrulanmamış yanıtları ayırır. Kaynağın kendi yapılandırılmış içeriği hâlâ metin olarak çevrilebilir.

**Biçim doğrulaması anlam doğruluğunu veya her eksikliğin tespitini garanti etmez.** Dil etiketleri karışık yazı için temkinli bir işaret de içeren yerel gösterim ipuçlarıdır; istekleri engellemez veya yönlendirmez.

<a id="free-engines"></a>
### Ücretsiz çeviri hizmetleri

Microsoft ve Google, `edge.microsoft.com` ve `translate-pa.googleapis.com` uç noktalarını kullanır.

- **Resmi API değildir:** şirketlerin web/tarayıcı çeviri işlevlerine hizmet eder, bu uzantı için yayımlanmış sözleşme yoktur.
- **Bağlantı veya onay yoktur:** proje Microsoft/Google'a bağlı, sponsorlu veya onlarca onaylanmış değildir. Marka ve adlar sahiplerine aittir; sadece seçili hizmeti belirtir.
- **Kullanılabilirlik garantisi yoktur:** habersiz değişebilir veya durabilir. Kendi modelinize geçebilirsiniz; onun kullanılabilirliği de sağlayıcısına bağlıdır.
- **Metin hizmete gönderilir:** hizmetin koşulları ve gizlilik politikası geçerlidir. Hassas içerik için uygun bir kendi uç noktanızı seçin.
- **Garanti verilmez:** olduğu gibi sunulur, risk size aittir. Ticari veya yüksek hacimli kullanımda lisanslı resmi API'leri tercih edin.

İlk kurulumun yararlı olması için Microsoft varsayılandır. Bir modu kendi modelinize atadığınızda o mod bu genel çeviri uç noktalarını kullanmaz.

<a id="privacy"></a>
## Gizlilik ve yerel veriler

Aracı ve telemetri olmaması, **her işlemin yerel olduğu anlamına gelmez**. Bulut sağlayıcıları gönderdiğiniz metni alır; yerel ortam model işlemesini bilgisayarınızda tutabilir. Altyazı alımı video sitesine, elle güncelleme denetimi GitHub'a bağlanır. Hizmetler IP adresi gibi olağan ağ meta verilerini alır.

Ayarlar, API anahtarları ve önbellek `chrome.storage.local` içinde saklanır. **Uzantı API anahtarlarını şifrelemez.** Dışa aktarma varsayılan olarak anahtarları dışlar; dahil etmek korunması gereken düz metin dosyası oluşturur. Önbellek aktarılmaz ve göz atılabilir çeviri geçmişi tutulmaz.

<a id="development"></a>
## Geliştirme

```bash
pnpm install
pnpm dev          # İzlemeli derleme: .output/chrome-mv3-dev/
pnpm test         # İzleme modunda test
pnpm test:run     # Tek test çalıştırması
pnpm typecheck    # WXT tür üretimi + TypeScript
pnpm lint
pnpm build        # Üretim: .output/chrome-mv3/
```

Çıktı klasörünü paketlenmemiş uzantı olarak yükleyin. Derleme değişince uzantıyı ve sayfaları yenileyin. Değişiklikler [CHANGELOG.md](../CHANGELOG.md), sorun ve istekler [Issues](https://github.com/Lewen-Cai/browser-translate/issues) üzerinden izlenir. Raporlardan anahtarları ve özel sayfa içeriğini çıkarın.

<a id="acknowledgements"></a>
## Teşekkürler

- [read-frog](https://github.com/mengxi-ream/read-frog) — GPL-3.0; geliştirme sırasında öğrendiğimiz çok şey olan değerli bir proje.
- [Lobe Icons](https://github.com/lobehub/lobe-icons) — MIT; sağlayıcı logoları. Markalar sahiplerine aittir ve yalnızca hizmetleri tanımlar.

<a id="license"></a>
## Lisans

[GPL-3.0](../LICENSE). Dağıtılan türev çalışmalar kaynak kod ve lisans yükümlülüklerine uymalıdır. Üçüncü taraf varlıklar kendi lisanslarını korur.
