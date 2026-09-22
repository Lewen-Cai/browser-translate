<p align="center"><img src="./assets/banner.png" alt="BrowserTranslate — tradução no navegador com foco em privacidade" width="900"></p>
<h1 align="center">BrowserTranslate</h1>
<p align="center"><strong>Leia páginas e legendas com o modelo que você escolher.</strong><br>Código aberto · Sua própria chave API · Sem servidor intermediário · Sem telemetria</p>
<p align="center">
  <a href="./README.md"><kbd>English</kbd></a>
  <a href="./README_zh-CN.md"><kbd>简体中文</kbd></a>
  <a href="./README_zh-TW.md"><kbd>繁體中文</kbd></a>
  <a href="./README_ja.md"><kbd>日本語</kbd></a>
  <a href="./README_ko.md"><kbd>한국어</kbd></a>
  <a href="./README_es.md"><kbd>Español</kbd></a>
  <a href="./README_fr.md"><kbd>Français</kbd></a><br>
  <a href="./README_de.md"><kbd>Deutsch</kbd></a>
  <a href="./README_pt-BR.md"><kbd><b>Português (Brasil)</b></kbd></a>
  <a href="./README_it.md"><kbd>Italiano</kbd></a>
  <a href="./README_ru.md"><kbd>Русский</kbd></a>
  <a href="./README_tr.md"><kbd>Türkçe</kbd></a>
  <a href="./README_vi.md"><kbd>Tiếng Việt</kbd></a>
  <a href="./README_id.md"><kbd>Bahasa Indonesia</kbd></a>
</p>
<p align="center"><a href="#installation">Instalar</a> · <a href="#configuration">Configurar</a> · <a href="./CHANGELOG.md">Alterações</a> · <a href="https://github.com/Lewen-Cai/browser-translate/issues">Relatar problemas</a></p>
<p align="center">
  <a href="https://github.com/Lewen-Cai/browser-translate/releases/latest"><img src="https://img.shields.io/github/v/release/Lewen-Cai/browser-translate?style=flat-square&amp;color=2563eb" alt="Versão mais recente"></a>
  <a href="./LICENSE"><img src="https://img.shields.io/badge/license-GPL--3.0-2563eb?style=flat-square" alt="GPL-3.0"></a>
  <a href="https://github.com/Lewen-Cai/browser-translate/actions/workflows/ci.yml"><img src="https://github.com/Lewen-Cai/browser-translate/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://github.com/Lewen-Cai/browser-translate/stargazers"><img src="https://img.shields.io/github/stars/Lewen-Cai/browser-translate?style=flat-square" alt="GitHub stars"></a>
</p>

<a id="why"></a>
## Por que BrowserTranslate?

Use seu provedor preferido sem assinatura obrigatória da extensão nem um servidor intermediário operado por nós.

- **Seu modelo, sua chave:** conecte um endpoint compatível com OpenAI ou um ambiente local. A compatibilidade depende do endpoint e do modelo.
- **Conexão direta:** o texto vai do navegador ao provedor escolhido. O projeto não mantém um servidor de retransmissão.
- **Sem telemetria:** a extensão não coleta análises de uso, relatórios remotos de erros ou logs remotos.
- **Prompt base editável:** consulte o padrão, crie modelos de prompt e use uma base comum em todos os modos LLM. As regras internas de dicionário e formato continuam sob controle da extensão.

<a id="features"></a>
## Recursos

- **Comece sem chave API:** Microsoft e Google vêm habilitados; uma instalação nova usa Microsoft nos três modos. São endpoints públicos não oficiais: leia o [aviso sobre serviços gratuitos](#free-engines).
- **Um mecanismo por tarefa:** seleção, página inteira e legendas podem usar provedores distintos. Mantenha várias configurações sem precisar preencher tudo novamente ao trocar.
- **Tradução de seleção:** selecione o texto e clique no ícone flutuante, ou use o modo de atalhos. O texto comum aparece em streaming, com o original acima. O cartão permite copiar, retraduzir e escolher provedor ou idioma apenas para aquela leitura. Isso não altera as configurações globais; retraduzir ignora o cache.
- **Cartão estável e móvel:** ajuste as dimensões em Geral → Aparência. Original e tradução rolam separadamente; o original ocupa no máximo 30% da área compartilhada. Durante a espera, a exibição é compacta. Fixe o cartão para mantê-lo aberto ao rolar ou clicar fora e arraste pela alça para movê-lo.
- **Página bilíngue:** insere a tradução abaixo do original no conteúdo principal, normalmente excluindo navegação, cabeçalhos e rodapés. O processamento acompanha a região visível durante a rolagem. Use Página atual → Tradução bilíngue no popup ou **Alt+A** no modo de atalhos.
- **Dicionário para seleções curtas:** o modelo pode fornecer tradução, pronúncia, classe gramatical, sentidos e exemplo. Parágrafos evidentes, múltiplas linhas e conteúdo semelhante a código recebem apenas instruções de tradução. Serviços convencionais não geram verbetes.
- **Texto em vários idiomas:** origem e destino iguais não bloqueiam pedidos. A adaptação regional depende do modelo ou serviço.
- **Configuração e cache locais:** validade ajustável em Configurações → Dados. Importe/exporte configurações e prompts em JSON, sem cache e sem chaves API por padrão.
- **Interface compacta:** tema claro/escuro automático ou manual; cinco páginas — Geral, Tradução, Provedores, Legendas e Dados. Fontes do sistema para a interface; monoespaçadas para código e endpoints.

<a id="subtitles"></a>
### Legendas de vídeo

Traduz legendas existentes no **YouTube**, em **gravações do Zoom na nuvem**, **gravações de cursos do Canvas** e players compatíveis que exponham legendas via `<track>`/TextTrack. Depende do player e do acesso à faixa; nem todo player incorporado foi testado. **Não faz transcrição de áudio.**

Clique no ícone de tradução do player e ative as legendas traduzidas. Sem uma barra de controles adequada, o botão aparece em um canto do vídeo. No YouTube, ative primeiro as legendas nativas (CC) para carregar a faixa; outros players também podem precisar dessa ativação. Faixas do criador e legendas automáticas compatíveis são aceitas; fragmentos de ASR são reunidos em frases antes da tradução.

As duas linhas aparecem sobre o player e podem ser arrastadas pela alça. A posição é lembrada, inclusive em tela cheia, e se ajusta para não cobrir os controles visíveis. O trabalho prioriza a posição atual de reprodução e é reorganizado após avançar ou voltar. Identificadores de falantes reconhecidos são preservados sem tradução. A latência depende do vídeo e do provedor; não há prazo fixo garantido.

O menu do player e **Configurações → Legendas** controlam exibição bilíngue/só original/só tradução, ordem das linhas, opacidade e tamanho, cor, fonte e peso de cada linha. A página de configurações tem prévia ao vivo, valores exatos, pequena paleta, entrada HEX e botão de redefinição.

<a id="languages"></a>
### Idiomas

São **56 destinos de tradução**, independentes dos **14 idiomas de interface** listados acima. A interface pode seguir o navegador. Popup, configurações e cartão permitem pesquisar nomes nativos, em inglês ou localizados, códigos e variantes regionais do inglês. Nomes RTL mantêm a direção de leitura sem desalinhamento das linhas.

O inglês distingue **Estados Unidos, Reino Unido e Austrália**; o antigo `en` genérico migra para inglês americano. O chinês distingue **simplificado e tradicional**. LLMs recebem instruções regionais de grafia e vocabulário. Serviços gratuitos sem suporte à variante usam inglês genérico silenciosamente, sem trocar de provedor.

<a id="architecture"></a>
## Arquitetura

<p align="center"><img src="./assets/framework.png" alt="Arquitetura do BrowserTranslate e conexão direta com provedores" width="760"></p>

Pedidos LLM e de tradução automática saem do **service worker em segundo plano**. O JavaScript do site não recebe sua chave API. Scripts de conteúdo exibem resultados e integram páginas/players; a busca de legendas específicas do site também pode ocorrer no contexto de conteúdo ou da página. O projeto não opera um intermediário.

<a id="installation"></a>
## Instalação

Para **navegadores de desktop baseados em Chromium**, incluindo Chrome, Edge, Brave e Arc. Firefox ainda não é suportado.

1. Baixe o `.zip` mais recente em [Releases](https://github.com/Lewen-Cai/browser-translate/releases).
2. Extraia em uma pasta que será mantida.
3. Abra `chrome://extensions` ou o gerenciador de extensões, ative o **Modo do desenvolvedor**, escolha **Carregar sem compactação** e selecione a pasta.

### Atualização manual

Extensões carregadas sem compactação não atualizam automaticamente. Extraia o novo arquivo sobre a pasta existente, clique em **Recarregar** e atualize as páginas abertas. No Windows/macOS, a instalação gerenciada de extensões auto-hospedadas geralmente exige política empresarial; carregar a pasta descompactada é outro procedimento.

O cabeçalho das configurações mostra a versão e a verificação manual. O GitHub só é consultado ao clicar; se houver versão mais nova, é oferecido o arquivo, sem instalação automática. O popup não repete o número da versão.

<a id="configuration"></a>
## Configuração

Uma instalação nova usa Microsoft em todos os modos. Para usar seu modelo:

1. Abra o popup e clique no ícone de configurações.
2. Em **Provedores**, habilite o serviço e informe endpoint, modelo e chave API. Ambientes locais não exigem chave. As linhas ativas mostram estado/latência por meio de uma verificação que contata o provedor.
3. Em **Tradução → Mecanismos de tradução**, atribua separadamente seleção, página inteira e legendas.
4. Escolha o idioma e selecione texto em uma página compatível. Para usar o teclado, ative o modo de atalhos em **Geral**: **Alt+T** para seleção e **Alt+A** para página inteira. Ambos só funcionam nesse modo.

O popup reúne destino, tradução da página atual e mecanismos. Modo de ativação e atalhos ficam apenas nas configurações. Páginas não suportadas desabilitam a tradução; se o script de conteúdo estiver ausente, é solicitada uma atualização da página. Prompts e atribuições ficam em Tradução, credenciais em Provedores, aparência de legendas em Legendas e cache/importação/exportação em Dados.

### Provedores e raciocínio

Predefinições: **OpenAI, Claude, Gemini, DeepSeek, Moonshot, Zhipu, Qwen, SiliconFlow, OpenRouter, Mistral e opencode**. Localmente: **LM Studio, Ollama, llama.cpp e vLLM**. Outros serviços compatíveis podem usar endpoint personalizado.

Endpoints separam regiões e planos: opencode Zen/Go, Qwen em Pequim, Singapura, Hong Kong e Virgínia, além do Token Plan. Contas, chaves e catálogos não são necessariamente intercambiáveis. Provedores compatíveis também permitem URLs específicas do espaço de trabalho.

Quando suportado, a extensão solicita raciocínio desligado por padrão e oferece **Low / Medium / High / XHigh / Max**, mapeados aos parâmetros do provedor. Para servidores personalizados/locais, escolha o formato do parâmetro ou **Não enviar**. Sem um controle compatível, vale o padrão do servidor. Suporte, latência e cobrança de tokens de raciocínio dependem do endpoint/modelo, não apenas da opção na interface.

<a id="prompts"></a>
### Prompt base

Em **Tradução → Prompt base**, a biblioteca fica ao lado do editor, ou acima em janelas estreitas. O padrão é visível e somente leitura. **Novo** cria a partir dele ou do zero; a orientação fica dentro do cartão, abaixo do editor. Selecionar um modelo de prompt apenas o abre; o ativo é identificado separadamente.

- **Salvar e aplicar** grava o rascunho e o utiliza imediatamente.
- **Salvar alterações** atualiza o prompt em uso.
- **Aplicar prompt** usa um modelo salvo; fica desabilitado se já estiver em uso.
- **Cancelar** descarta edições locais.
- **Ações do modelo** reúne salvar sem aplicar, duplicar, substituir o rascunho pelo texto padrão e excluir. Operações destrutivas exigem confirmação; excluir o ativo retorna ao padrão.

Suas instruções **substituem** a base, em vez de se somarem a ela. A extensão ainda fornece idioma, convenções regionais, roteamento e formato; os protocolos internos não são editáveis. Instruções conflitantes ou modelos menos capazes podem produzir resultados imperfeitos. `{{...}}` é literal, sem substituição de variáveis.

Até **20 modelos de prompt**, com **12.000 caracteres** cada, armazenados localmente. Afetam apenas LLMs, não a tradução convencional Microsoft/Google. Mudanças usam entradas de cache separadas; a exportação inclui modelos e seleção ativa.

<a id="validation"></a>
### Validação das respostas

Passagens evidentes não recebem instruções de dicionário. Para seleções curtas, o verbete deve corresponder à seleção inteira, não a uma palavra extraída. Saídas estruturadas suspeitas são retidas para validação; o cartão recebe um tipo explícito em vez de adivinhar por `{`.

Uma resposta de seleção inválida permite no máximo **uma correção em texto simples**. Um lote inválido de página/legenda recorre a **uma solicitação de texto por segmento sem cache**. Isso pode consumir tokens extras; tentativas de transporte são independentes. Falhas persistentes mostram erro, não JSON bruto do protocolo, e não entram no cache.

IDs do lote devem ser completos e únicos; os resultados voltam à ordem de entrada e números/objetos não são convertidos artificialmente em traduções. Chaves de cache por protocolo e validação na leitura isolam resultados antigos não verificados. Conteúdo estruturado do próprio original ainda pode ser traduzido como texto.

**Validar o formato não garante precisão semântica nem detecta todas as omissões.** Os rótulos de idioma são indícios locais, com marcação conservadora de escrita mista; não bloqueiam nem encaminham pedidos.

<a id="free-engines"></a>
### Serviços gratuitos

Microsoft e Google usam `edge.microsoft.com` e `translate-pa.googleapis.com`.

- **Não são APIs oficiais:** são endpoints de recursos web/do navegador das empresas, sem contrato público para esta extensão.
- **Sem vínculo ou endosso:** o projeto não é afiliado, patrocinado nem aprovado por Microsoft ou Google. Nomes e marcas identificam o serviço e pertencem aos titulares.
- **Disponibilidade não garantida:** podem mudar ou parar sem aviso. Você pode mudar para seu modelo, cuja disponibilidade depende de seu provedor.
- **O texto é enviado ao serviço:** aplicam-se os termos e a política de privacidade dele. Para conteúdo sensível, use um endpoint próprio adequado.
- **Sem garantia:** fornecidos como estão e por sua conta e risco. Para uso comercial ou em grande volume, escolha APIs oficiais devidamente licenciadas.

Microsoft é o padrão para que a primeira utilização funcione. Atribuir um modo ao seu modelo faz com que esse modo deixe de usar os endpoints públicos acima.

<a id="privacy"></a>
## Privacidade e dados locais

Não ter intermediário nem telemetria **não significa que tudo é processado localmente**. Provedores na nuvem recebem o texto solicitado; um ambiente local pode manter o processamento no computador. Buscar legendas contata o site de vídeo; a verificação manual contata o GitHub. Esses serviços recebem metadados de rede normais, como o endereço IP.

Configurações, chaves e cache ficam em `chrome.storage.local`. **A extensão não criptografa chaves API.** Exportá-las é opcional e cria um arquivo em texto simples que deve ser protegido. O cache não é exportado e não existe histórico de traduções navegável.

<a id="development"></a>
## Desenvolvimento

```bash
pnpm install
pnpm dev          # Compilação contínua: .output/chrome-mv3-dev/
pnpm test         # Testes em modo de observação
pnpm test:run     # Uma execução de testes
pnpm typecheck    # Tipos WXT + TypeScript
pnpm lint
pnpm build        # Produção: .output/chrome-mv3/
```

Carregue a pasta de saída como extensão sem compactação. Recarregue a extensão e as páginas após trocar a compilação. Consulte [CHANGELOG.md](./CHANGELOG.md) e use [Issues](https://github.com/Lewen-Cai/browser-translate/issues) para problemas e sugestões, removendo chaves e conteúdo privado dos relatos.

<a id="acknowledgements"></a>
## Agradecimentos

- [read-frog](https://github.com/mengxi-ream/read-frog) — GPL-3.0; excelente projeto com o qual aprendemos durante o desenvolvimento.
- [Lobe Icons](https://github.com/lobehub/lobe-icons) — MIT; logotipos dos provedores. Marcas permanecem com seus titulares e servem apenas à identificação.

<a id="license"></a>
## Licença

[GPL-3.0](./LICENSE). Obras derivadas distribuídas devem cumprir as obrigações de código-fonte e licenciamento. Recursos de terceiros mantêm suas respectivas licenças.
