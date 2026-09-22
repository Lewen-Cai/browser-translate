<p align="center"><img src="./assets/banner.png" alt="BrowserTranslate — traducción con privacidad en el navegador" width="900"></p>
<h1 align="center">BrowserTranslate</h1>
<p align="center"><strong>Lee páginas y subtítulos con el modelo que tú elijas.</strong><br>Código abierto · Tu propia clave API · Sin servidor intermediario · Sin telemetría</p>
<p align="center">
  <a href="./README.md"><kbd>English</kbd></a>
  <a href="./README_zh-CN.md"><kbd>简体中文</kbd></a>
  <a href="./README_zh-TW.md"><kbd>繁體中文</kbd></a>
  <a href="./README_ja.md"><kbd>日本語</kbd></a>
  <a href="./README_ko.md"><kbd>한국어</kbd></a>
  <a href="./README_es.md"><kbd><b>Español</b></kbd></a>
  <a href="./README_fr.md"><kbd>Français</kbd></a><br>
  <a href="./README_de.md"><kbd>Deutsch</kbd></a>
  <a href="./README_pt-BR.md"><kbd>Português (Brasil)</kbd></a>
  <a href="./README_it.md"><kbd>Italiano</kbd></a>
  <a href="./README_ru.md"><kbd>Русский</kbd></a>
  <a href="./README_tr.md"><kbd>Türkçe</kbd></a>
  <a href="./README_vi.md"><kbd>Tiếng Việt</kbd></a>
  <a href="./README_id.md"><kbd>Bahasa Indonesia</kbd></a>
</p>
<p align="center"><a href="#installation">Instalación</a> · <a href="#configuration">Configuración</a> · <a href="./CHANGELOG.md">Cambios</a> · <a href="https://github.com/Lewen-Cai/browser-translate/issues">Incidencias</a></p>
<p align="center">
  <a href="https://github.com/Lewen-Cai/browser-translate/releases/latest"><img src="https://img.shields.io/github/v/release/Lewen-Cai/browser-translate?style=flat-square&amp;color=2563eb" alt="Última versión"></a>
  <a href="./LICENSE"><img src="https://img.shields.io/badge/license-GPL--3.0-2563eb?style=flat-square" alt="GPL-3.0"></a>
  <a href="https://github.com/Lewen-Cai/browser-translate/actions/workflows/ci.yml"><img src="https://github.com/Lewen-Cai/browser-translate/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://github.com/Lewen-Cai/browser-translate/stargazers"><img src="https://img.shields.io/github/stars/Lewen-Cai/browser-translate?style=flat-square" alt="GitHub stars"></a>
</p>

<a id="why"></a>
## ¿Por qué BrowserTranslate?

Usa tu proveedor preferido sin una suscripción obligatoria a esta extensión ni un servicio intermediario operado por nosotros.

- **Tu modelo y tu clave**: conecta un endpoint compatible con OpenAI o un entorno local. La compatibilidad depende del endpoint y del modelo.
- **Conexión directa**: el texto va del navegador al proveedor elegido. El proyecto no opera un servidor de retransmisión.
- **Sin telemetría**: la extensión no recopila estadísticas, informes remotos de errores ni registros remotos.
- **Prompt base editable**: consulta el predeterminado, crea plantillas y aplica una base común a todos los modos LLM. La extensión conserva las reglas internas de diccionario y formato.

<a id="features"></a>
## Funciones

- **Empieza sin clave API**: Microsoft y Google están habilitados de serie; una instalación nueva usa Microsoft en los tres modos. Son endpoints públicos no oficiales: lee el [aviso sobre servicios gratuitos](#free-engines).
- **Un motor para cada tarea**: selección, página completa y subtítulos pueden usar proveedores distintos. Guarda varias configuraciones y cambia sin volver a introducirlas.
- **Traducción de selecciones**: selecciona texto y pulsa el icono flotante, o utiliza el modo de atajos. La traducción normal se muestra en streaming, con el original encima. La tarjeta permite copiar, volver a traducir y cambiar proveedor o destino solo para esa tarjeta. No altera la configuración global; volver a traducir omite la caché.
- **Tarjeta estable y móvil**: ajusta sus dimensiones en General → Apariencia. Original y traducción se desplazan por separado; el original ocupa como máximo el 30% del cuerpo compartido. La espera tiene una vista compacta. Fija la tarjeta para mantenerla al desplazarte o pulsar fuera, y muévela con el asa.
- **Página bilingüe**: inserta traducciones bajo el texto original del contenido principal, normalmente excluyendo navegación, cabeceras y pies. Procesa progresivamente la zona visible y cercana al desplazarte. Usa Página actual → Traducción bilingüe en el popup, o **Alt+A** en modo de atajos.
- **Diccionario automático para selecciones cortas**: un modelo puede aportar traducción, pronunciación, categoría gramatical, acepciones y ejemplo. Los párrafos claros, varias líneas y selecciones similares a código solo se traducen. Los servicios convencionales no generan entradas de diccionario.
- **Texto multilingüe permitido**: detectar el mismo idioma de origen y destino no bloquea la petición. La adaptación regional depende del modelo o servicio.
- **Configuración y caché locales**: ajusta la caducidad en Ajustes → Datos. Exporta/importa configuración y prompts en JSON; no incluye la caché ni, por defecto, las claves API.
- **Interfaz compacta**: tema claro/oscuro automático o manual y cinco páginas: General, Traducción, Proveedores, Subtítulos y Datos. Fuentes del sistema para la interfaz y monoespaciadas para código y endpoints.

<a id="subtitles"></a>
### Subtítulos de vídeo

Traduce pistas existentes de **YouTube, grabaciones de Zoom en la nube, grabaciones de cursos de Canvas** y reproductores compatibles que expongan subtítulos mediante `<track>`/TextTrack. Depende del reproductor y del acceso a la pista; no se han probado todos los reproductores incrustados. **No transcribe audio.**

Pulsa el icono de traducción del reproductor y activa los subtítulos traducidos. Si no hay una barra adecuada, el botón aparece en una esquina del vídeo. En YouTube, activa primero los subtítulos nativos (CC) para cargar la pista; otros reproductores también pueden requerir activarla. Admite pistas del creador y subtítulos automáticos compatibles; los fragmentos ASR se agrupan en frases antes de traducirse.

Original y traducción se superponen al vídeo. El asa permite moverlos; la posición se recuerda también en pantalla completa y evita los controles visibles. Se prioriza la zona del cabezal de reproducción y se reorganiza el trabajo al buscar otra posición. Las etiquetas de hablante reconocidas se conservan sin traducir. La latencia depende del vídeo y del proveedor, sin tiempo de respuesta garantizado.

El menú del reproductor y **Ajustes → Subtítulos** permiten elegir vista bilingüe, solo original o solo traducción, orden, opacidad y tamaño, color, fuente y grosor de cada línea. Los ajustes ofrecen vista previa, valores exactos, paleta pequeña, entrada HEX y botón de restablecimiento.

<a id="languages"></a>
### Idiomas

Hay **56 destinos de traducción** independientes de los **14 idiomas de interfaz** enlazados arriba. La interfaz puede seguir al navegador. Busca en el popup, ajustes y tarjeta por nombre nativo, inglés, localizado, código o alias regional del inglés. Los nombres RTL mantienen su dirección sin desalinear las filas.

El inglés distingue **Estados Unidos, Reino Unido y Australia**; el antiguo `en` genérico se migra a inglés estadounidense. El chino distingue **simplificado y tradicional**. Los LLM reciben instrucciones regionales de ortografía y vocabulario. Si un servicio gratuito no admite la variedad, usa inglés genérico sin aviso ni cambio de proveedor.

<a id="architecture"></a>
## Arquitectura

<p align="center"><img src="./assets/framework.png" alt="Arquitectura de BrowserTranslate y conexiones directas" width="760"></p>

Las solicitudes LLM y de traducción automática se realizan en el **service worker de fondo**. El JavaScript del sitio no recibe tu clave API. Los scripts de contenido muestran resultados e integran páginas y reproductores; la obtención de subtítulos puede ejecutarse también en el contexto de contenido o de la página. No hay intermediario del proyecto.

<a id="installation"></a>
## Instalación

Para **navegadores de escritorio basados en Chromium**, incluidos Chrome, Edge, Brave y Arc. Firefox no está soportado actualmente.

1. Descarga el último `.zip` de [Releases](https://github.com/Lewen-Cai/browser-translate/releases).
2. Extráelo en una carpeta que vayas a conservar.
3. Abre `chrome://extensions` o la página de extensiones del navegador, activa **Modo de desarrollador**, elige **Cargar descomprimida** y selecciona la carpeta.

### Actualización manual

Las extensiones descomprimidas no se actualizan solas. Descarga el archivo nuevo, extráelo sobre la carpeta existente, pulsa **Recargar** y actualiza las páginas abiertas. En Windows/macOS, el mecanismo administrado de instalación de extensiones autoalojadas suele requerir políticas empresariales; cargar una carpeta descomprimida es otro procedimiento.

La cabecera de ajustes muestra la versión y una comprobación manual. Solo consulta GitHub al pulsarla y ofrece el archivo si hay una versión posterior. No instala automáticamente ni repite la versión en el popup.

<a id="configuration"></a>
## Configuración

Microsoft es la opción inicial para todos los modos. Para usar tu modelo:

1. Abre el popup y su icono de ajustes.
2. En **Proveedores**, activa el servicio e introduce endpoint, modelo y clave API; los entornos locales no requieren clave. Las filas activas muestran estado/latencia mediante una comprobación que contacta al proveedor.
3. En **Traducción → Motores de traducción**, asigna selección, página completa y subtítulos por separado.
4. Elige destino y selecciona texto en una página compatible. Para usar el teclado, activa el modo de atajos en **General**: **Alt+T** para selección y **Alt+A** para página completa. Ambos funcionan solo en ese modo.

El popup contiene destino, interruptor de página actual y motores. El modo de activación y los atajos están solo en ajustes. Las páginas no compatibles deshabilitan la traducción; si falta el script de contenido, se indica que recargues. Prompts y asignaciones están en Traducción; credenciales en Proveedores; apariencia de subtítulos en Subtítulos; caché e importación/exportación en Datos.

### Proveedores y razonamiento

Incluye **OpenAI, Claude, Gemini, DeepSeek, Moonshot, Zhipu, Qwen, SiliconFlow, OpenRouter, Mistral y opencode**. En local: **LM Studio, Ollama, llama.cpp y vLLM**. Otros servicios compatibles pueden usar un endpoint personalizado.

Los endpoints separan regiones y planes: opencode Zen/Go, o Qwen en Pekín, Singapur, Hong Kong y Virginia, además de Token Plan. Cuentas, claves y catálogos no son necesariamente intercambiables. Algunos proveedores permiten URLs específicas del espacio de trabajo.

Cuando se admite, la extensión solicita razonamiento desactivado por defecto y ofrece **Low / Medium / High / XHigh / Max**, traducidos a parámetros del proveedor. Para servidores locales/personalizados, elige el formato de parámetro o **No enviar nada**. Sin un control compatible, rige el valor del servidor. Soporte, latencia y facturación de tokens de razonamiento dependen del endpoint/modelo, no solo de la interfaz.

<a id="prompts"></a>
### Prompt base

En **Traducción → Prompt base**, la biblioteca y el editor aparecen lado a lado, o apilados en ventanas estrechas. El predeterminado es visible y de solo lectura. **Nueva** permite partir del predeterminado o de cero; la ayuda está dentro de la tarjeta. Seleccionar una plantilla solo la abre; la que está en uso se marca aparte.

- **Guardar y aplicar** guarda el borrador y lo usa inmediatamente.
- **Guardar cambios** actualiza el prompt ya en uso.
- **Aplicar prompt** utiliza una plantilla guardada; se deshabilita si ya se usa.
- **Cancelar** descarta la edición local.
- **Acciones de la plantilla** permite guardar sin aplicar, duplicar, sustituir el borrador por el texto predeterminado y eliminar. Las operaciones destructivas requieren confirmación; eliminar la activa vuelve a la predeterminada.

Tus instrucciones **sustituyen** la base, no se añaden a ella. La extensión conserva destino, convenciones regionales, selección de modo y formato; esos protocolos no son editables. Instrucciones contradictorias o modelos menos capaces pueden dar resultados imperfectos. `{{...}}` se conserva literalmente, sin sustitución de variables.

Hasta **20 plantillas**, con **12.000 caracteres** por prompt, guardadas localmente. Solo afectan a LLM, no a Microsoft/Google convencionales. Un prompt modificado usa otra caché. La exportación incluye plantillas y selección activa.

<a id="validation"></a>
### Validación de respuestas

Los pasajes evidentes no reciben instrucciones de diccionario. En selecciones cortas, la entrada debe corresponder a toda la selección, no a una palabra extraída. La salida estructurada sospechosa se retiene para validarla; la tarjeta recibe un tipo explícito en lugar de adivinarlo por `{`.

Una respuesta de selección inválida permite como máximo **una corrección en texto plano**. Un lote de página/subtítulos inválido pasa a **una petición en texto plano por segmento sin caché**. Puede consumir tokens adicionales; los reintentos de transporte son independientes. Los fallos persistentes muestran error, no JSON de protocolo, y no se almacenan.

Los IDs de lote deben ser únicos y completos; se recupera el orden de entrada y no se convierten objetos o números en traducciones. Las claves de caché versionadas y la validación de lectura aíslan resultados antiguos sin verificar. El contenido estructurado del propio original sigue pudiendo traducirse como texto.

**Validar el formato no garantiza exactitud semántica ni detecta todas las omisiones.** Las etiquetas de idioma son indicios locales, con una etiqueta conservadora para escritura mixta; no bloquean ni encaminan solicitudes.

<a id="free-engines"></a>
### Servicios gratuitos

Microsoft y Google usan `edge.microsoft.com` y `translate-pa.googleapis.com`.

- **No son APIs oficiales**: sirven a funciones web/del navegador de los proveedores y no tienen contrato público para esta extensión.
- **Sin afiliación ni respaldo**: el proyecto no está afiliado, patrocinado ni avalado por Microsoft o Google. Las marcas identifican el servicio elegido y pertenecen a sus titulares.
- **Disponibilidad no garantizada**: pueden cambiar o dejar de funcionar sin aviso. Puedes usar tu modelo, cuya disponibilidad depende de su proveedor.
- **El texto se envía al servicio**: se aplican sus términos y política de privacidad. Para contenido sensible, elige un endpoint propio adecuado.
- **Sin garantía**: se ofrecen tal cual y bajo tu responsabilidad. Para uso comercial o masivo, utiliza APIs oficiales con la licencia correspondiente.

Microsoft se usa inicialmente para que la extensión funcione desde el principio. Al asignar un modo a tu modelo, ese modo deja de usar estos endpoints públicos.

<a id="privacy"></a>
## Privacidad y datos locales

Sin intermediario ni telemetría **no significa procesamiento totalmente local**. Los proveedores en la nube reciben el texto solicitado; un entorno local puede mantener el procesamiento en tu equipo. Obtener subtítulos contacta al sitio de vídeo y comprobar actualizaciones contacta a GitHub. Estos servicios reciben metadatos de red normales, como la dirección IP.

Configuración, claves y caché se guardan en `chrome.storage.local`. **La extensión no cifra las claves API.** Exportarlas es opcional y genera un archivo en texto plano que debes proteger. La caché no se exporta y no existe un historial de traducciones navegable.

<a id="development"></a>
## Desarrollo

```bash
pnpm install
pnpm dev          # Compilación continua: .output/chrome-mv3-dev/
pnpm test         # Pruebas en modo observación
pnpm test:run     # Una ejecución de pruebas
pnpm typecheck    # Generación de tipos WXT + TypeScript
pnpm lint
pnpm build        # Producción: .output/chrome-mv3/
```

Carga la carpeta de salida como extensión descomprimida. Recarga extensión y páginas tras cambiar la compilación. Consulta [CHANGELOG.md](./CHANGELOG.md) y comunica problemas o sugerencias en [Issues](https://github.com/Lewen-Cai/browser-translate/issues), sin claves API ni contenido privado.

<a id="acknowledgements"></a>
## Agradecimientos

- [read-frog](https://github.com/mengxi-ream/read-frog) — GPL-3.0; un excelente proyecto del que aprendimos durante el desarrollo.
- [Lobe Icons](https://github.com/lobehub/lobe-icons) — MIT; logotipos de proveedores. Las marcas pertenecen a sus titulares y solo identifican servicios.

<a id="license"></a>
## Licencia

[GPL-3.0](./LICENSE). Las obras derivadas distribuidas deben cumplir sus obligaciones de código fuente y licencia. Los recursos de terceros conservan sus respectivas licencias.
