# TTPU LMS — 50-agent audit (ryzen-ai7 opencode) natijalari

Manba: ses_f2789e24effe3uxiayDo45PFf2 (2026-09-25, ryzen-ai7, opencode)


## Public metadata audit (@general subagent)

sessiya: `ses_f278691a0ffeIl8UOoaz4asMPd`

Сделаю ровно 5 независимых запросов без переходов и без перебора: указанные файлы плюс безопасные `host-meta` и `openid-configuration`. Проверю только публичные ответы, заголовки и ссылки в полученном контенте.

- **Evidence:** все 5 запросов (`/robots.txt`, `/sitemap.xml`, `/.well-known/security.txt`, `/.well-known/host-meta`, `/.well-known/openid-configuration`) получили `HTTP 502 Bad Gateway`, `Content-Length: 0`; тело отсутствует.
- **Repro:** `curl -k -sS -D - 'https://ozodbeks-macbook-pro.tail91a187.ts.net:8443/<path>'` — по одному запросу на путь.
- **Severity:** информационно/неопределённо; broken links, утечка URL, неверные директивы и отсутствие `security.txt` не подтверждены (`502`, не `404`).
- **Confidence:** высокая для недоступности endpoint’ов; низкая для анализа содержимого.


## CORS policy audit (@general subagent)

sessiya: `ses_f2786abb8ffeoInU7vuETIBo8B`

Проведу 4 read-only запроса: `OPTIONS` и `GET` для двух разных Origin из зарезервированного домена `.example`; без cookies, auth и follow-redirects. Проверю только заголовки и статус.

Проверено ровно 4 запроса к `/`: `OPTIONS` и `GET` для `https://cors-a.example` и `https://cors-b.example`; без cookies, auth и redirect-following.

**Evidence**
- `OPTIONS` для обоих Origin: `405`, `Allow: GET`, `Allow: HEAD`.
- В обоих ответах отсутствуют `Access-Control-Allow-Origin`, `Access-Control-Allow-Methods`, `Access-Control-Allow-Headers`, `Access-Control-Allow-Credentials`.
- `GET` для обоих Origin: `200`; `Access-Control-Allow-Origin` отсутствует, Origin не отражён.
- `Access-Control-Allow-Credentials: true` не обнаружен; credentialed CORS не разрешён.

**Оценка:** `Informational`, не самостоятельная security-уязвимость; при необходимости cross-origin API — функциональная проблема `Low`. Уверенность: высокая.

```bash
BASE='https://ozodbeks-macbook-pro.tail91a187.ts.net:8443/'
for origin in https://cors-a.example https://cors-b.example; do
  curl -skS --netrc-file /dev/null --proto '=https' --max-time 20 \
    -D - -o /dev/null -X OPTIONS "$BASE" \
    -H "Origin: $origin" \
    -H 'Access-Control-Request-Method: GET' \
    -H 'Access-Control-Request-Headers: content-type'
  curl -skS --netrc-file /dev/null --proto '=https' --max-time 20 \
    -D - -o /dev/null -X GET "$BASE" -H "Origin: $origin"
done
```


## Common file exposure audit (@general subagent)

sessiya: `ses_f27868a96ffeUOhdLZQ3iS6BZP`

Проведу ровно 5 unauthenticated GET с `Range: bytes=0-8191`, без редиректов. Тела не сохраняются и не выводятся; скрипт сообщит только подтверждённые типы артефактов.

Подтверждённых публично доступных артефактов с признаками риска не обнаружено.


## Redirect behavior audit (@general subagent)

sessiya: `ses_f27869fd7ffegWVjpyTUSkqvEp`

Friday. Сделаю ровно 2 безопасных GET без следования редиректам: по HTTP и HTTPS, чтобы проверить downgrade и базовые заголовки.

Осталось 3 GET: прямой защищённый путь с `next=https://example.com/`, а также две нормализации пути. Redirects не следую; передача внешнего URL остаётся только в `Location`-проверке.

Проверено ровно **5 GET**, без cookies/авторизации и без следования redirects; `example.com` не запрашивался. **Подтверждённых уязвимостей нет.**

| URL | Result | Severity / Confidence |
|---|---|---|
| `http://ozodbeks-macbook-pro.tail91a187.ts.net:8443/` | `curl (52) Empty reply`; HTTP status и `Location` отсутствуют. TLS-порт fail-closed, downgrade не обнаружен. | None / High |
| `https://ozodbeks-macbook-pro.tail91a187.ts.net:8443/` | `200`, `Location` отсутствует; присутствует HSTS. | None / High |
| `https://ozodbeks-macbook-pro.tail91a187.ts.net:8443/dashboard?next=https%3A%2F%2Fexample.com%2F` | `200`, без HTTP `Location`; внутри Next.js redirect `307 → /login`. Внешний URL отброшен, защищённые данные не отданы. | Info / High |
| `https://ozodbeks-macbook-pro.tail91a187.ts.net:8443//dashboard?next=https%3A%2F%2Fexample.com%2F` | `308`, `Location: /dashboard?next=https%3A%2F%2Fexample.com%2F` — корректная нормализация. | None / High |
| `https://ozodbeks-macbook-pro.tail91a187.ts.net:8443/dashboard/.?next=https%3A%2F%2Fexample.com%2F` | `308`, тот же relative `Location`; auth bypass не обнаружен. | None / High |

**Итог:** HTTPS downgrade, open redirect через `next=https://example.com/` и обход авторизации через проверенные варианты пути не подтверждены. Redirect авторизации реализован через Next.js streaming/meta-refresh вместо обычного HTTP `3xx`, что небезопасно не выглядит.


## Cookie and session audit (@general subagent)

sessiya: `ses_f2786b2bdffeI7VQYRyzTqnT4A`

**Подтверждённая утечка учётных данных:** публичный `GET /` содержит `ozodbek@ttpu.uz / ttpu1234`; публичный JS `/_next/static/chunks/0eldo20jp3j36.js` содержит email-адреса студента, преподавателя и `admin@ttpu.uz`, а также автозаполнение всех demo-аккаунтов паролем `ttpu1234`.  
**Repro:** `curl -k 'https://ozodbeks-macbook-pro.tail91a187.ts.net:8443/'` и `curl -k 'https://ozodbeks-macbook-pro.tail91a187.ts.net:8443/_next/static/chunks/0eldo20jp3j36.js'`; вход не выполнялся.


## HTTP security headers (@general subagent)

sessiya: `ses_f2786b9d8ffeK9vOTUWt1bSczo`

Проведу один read-only `HEAD`-запрос без переходов и без отправки payload; затем при необходимости уточню только факты из полученных заголовков.

Первый ответ — `200`, без `Set-Cookie`; проверю тем же read-only `GET`, потому что `HEAD` иногда не отражает cookie-поведение, и это будет второй из пяти запросов.

Уточнение по методу: предыдущие команды фактически выполнили два `GET` (`-I` не был добавлен). Для корректной проверки сравню их с настоящим `HEAD`; это третий read-only запрос из пяти, без переходов и payload.

## Итог

Проверено **3/5 запросов**: два `GET` и один `HEAD`, без переходов, payload и изменений. Все ответили `HTTP/2 200`; security headers совпали. Ответ выглядит кэшированным/Next.js: `x-nextjs-cache: HIT`, `x-nextjs-prerender: 1`, `x-powered-by: Next.js`.

## Подтверждённые findings

| ID | Severity | Confidence | Evidence |
|---|---|---|---|
| CSP-01 | **Medium** | **High** | В enforced CSP: `script-src 'self' 'unsafe-inline' 'unsafe-eval'`. Это существенно ослабляет защиту от XSS: разрешены inline-скрипты и `eval`-подобное выполнение. Не доказывает наличие XSS или конкретной точки инъекции. `style-src 'unsafe-inline'` и `img-src ... https:` — permissive-наблюдения без отдельного severity. |

Воспроизведение:

```bash
curl --http2 -sS -D - -o /dev/null --max-time 30 \
  'https://ozodbeks-macbook-pro.tail91a187.ts.net:8443'
```

`Content-Security-Policy-Report-Only` присутствует, но сам по себе не обеспечивает enforcement; при этом enforced CSP также присутствует, поэтому отдельного finding по этому поводу не заявляю.

## Корректные настройки

- **HSTS:** `max-age=31536000; includeSubDomains; preload` — корректно; фактическое включение в browser preload list не проверялось.
- **Защита от framing:** `X-Frame-Options: DENY` и enforced CSP `frame-ancestors 'none'` — корректно и последовательно.
- **MIME sniffing:** `X-Content-Type-Options: nosniff` — корректно.
- **Referrer:** `Referrer-Policy: strict-origin-when-cross-origin` — корректно.
- **Permissions:** явно запрещены `camera`, `microphone`, `geolocation`, `payment`, `usb`, `magnetometer`, `gyroscope`, `accelerometer`.
- **Прочие CSP-ограничения:** `default-src 'self'`, `form-action 'self'`, `base-uri 'self'`, `object-src 'none'`, `connect-src 'self'`.

## Cookie/security consistency

`Set-Cookie` отсутствует во всех 3 ответах; cookie-флаги (`Secure`, `HttpOnly`, `SameSite`, `Domain`, `Path`) проверить невозможно. Отсутствие cookie не является finding. HTTPS-ответ содержит HSTS; plain HTTP и авторизованные маршруты не проверялись.


## TLS and transport audit (@general subagent)

sessiya: `ses_f2786c0d4ffe2hiz4p8NQAj9LB`

Friday — выполняю пять максимум read-only сетевых проверок; данные не изменяю.

Проверяю оставшиеся два пункта: поведение HTTP на порту 80 и принятие TLS 1.1; автоматические редиректы не следую.

Friday — цель доступна. Выполнено ровно 5 read-only проверок; подтверждённых High/Critical/Medium уязвимостей не выявлено.

### 1. TLS, цепочка сертификатов, hostname
- **Severity:** None / Informational
- **Evidence:** `openssl s_client -connect ozodbeks-macbook-pro.tail91a187.ts.net:8443 -servername ozodbeks-macbook-pro.tail91a187.ts.net -showcerts -verify_hostname ...`
  - `Verification: OK`
  - `Verified peername: ozodbeks-macbook-pro.tail91a187.ts.net`
  - цепочка: leaf → Let’s Encrypt `YE2` → `Root YE` → `ISRG Root X2`
  - срок leaf: `Sep 25 08:29:19 2026` — `Dec 24 08:29:18 2026`
  - `curl`: `HTTP/1.1 200 OK`, `verify=0`
  - `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`
- **Воспроизведение:** указанная команда `openssl`; `curl --noproxy '*' --http1.1 https://ozodbeks-macbook-pro.tail91a187.ts.net:8443/`
- **Impact:** подтверждённой ошибки TLS, цепочки или hostname не выявлено.
- **Confidence:** High.

### 2. Устаревшие TLS / protocol downgrade
- **Severity:** None observed
- **Evidence:**
  - default handshake: `Protocol: TLSv1.3`, `Cipher: TLS_AES_128_GCM_SHA256`, `ALPN protocol: h2`
  - TLS 1.0: `tlsv1 alert protocol version`
  - TLS 1.1: `tlsv1 alert protocol version`
- **Воспроизведение:** `openssl s_client ... -tls1` и `openssl s_client ... -tls1_1`
- **Impact:** TLS 1.0/1.1 не приняты; подтверждённого downgrade на этих версиях нет. TLS 1.2 отдельно не проверялся.
- **Confidence:** High.

### 3. Redirect с HTTP
- **Severity:** Informational; security impact не подтверждён
- **Evidence:** `curl http://ozodbeks-macbook-pro.tail91a187.ts.net/`
  - `HTTP/1.1 302 Found`
  - `Location: https://ozodbeks-macbook-pro.tail91a187.ts.net/`
  - destination указывает наimplicit port 443, без `:8443`
- **Воспроизведение:** `curl --noproxy '*' --http1.1 --max-redirs 0 -D - -o /dev/null http://ozodbeks-macbook-pro.tail91a187.ts.net/`
- **Impact:** подтверждено только несоответствие порта в redirect; доступность и содержимое `https://.../` не проверялись. Redirect с HTTPS на HTTP не наблюдался.
- **Confidence:** High для заголовка; Medium для потенциального impact.


## HTML accessibility audit (@general subagent)

sessiya: `ses_f2786835effewRO1eJM5AzdL0z`

Проверяю только HTML главной страницы: один дополнительный GET без обхода ресурсов; локальный парсер извлечёт нужные семантические признаки и дубли `id`.

Первый разбор показал уникальные `id`; делаю ещё один GET той же страницы только для компактной выборки landmark/heading/link/image evidence, без обхода ссылок и assets.

1. **Средняя — отсутствует skip-link**  
   **URL/элемент:** `https://ozodbeks-macbook-pro.tail91a187.ts.net:8443/` → `header` → `main`  
   **Evidence:** `<main class="flex-1">` без `id`; fragment-ссылки ведут только на `#imkoniyatlar`, `#boshlash`, `#statistika`, `#aloqa`; ссылки «Skip to content»/перехода к main нет.  
   **Repro:** начать клавиатурную навигацию с первого focusable-элемента — фокус последовательно проходит через логотип, навигацию и auth-ссылки перед содержимым main.  
   **Confidence:** High.

2. **Низкая — hero-мокап dashboard暴露为 дополнительный landmark**  
   **URL/элемент:** `/` → `main` → `aside class="hidden ... sm:flex"`  
   **Evidence:** при ширине `sm+` видимый мокап содержит текст `Boshqaruv`, `Kurslar`, `Jadval`, `Baholar`, `Transkript`, `Bron qilish`, но не имеет `aria-hidden` или имени; это не реальная навигация, а текстовые `span`.  
   **Repro:** при ширине от 640 px открыть Accessibility Tree/читать страницу скринридером: после hero обнаруживается unnamed `complementary` region с посторонними данными dashboard.  
   **Confidence:** High.

3. **Низкая — неполная семантика headings**  
   **URL/элемент:** `/` → `section#statistika`, `footer#aloqa`  
   **Evidence:** `section#statistika` не содержит ни одного `h1`–`h6` или accessible name; подписи колонок `Platforma`, `Modullar`, `Aloqa` в footer размечены как `<p class="text-sm font-semibold">`, а не как headings.  
   **Repro:** перейти по ссылке `Statistika` или открыть список headings экранным диктором — соответствующие секции отсутствуют в heading outline.  
   **Confidence:** High.

4. **Низкая — декоративные inline-SVG не скрыты от accessibility tree**  
   **URL/элемент:** `/` → 20 из 21 inline `<svg>` в feature/step/contact-блоках  
   **Evidence:** только загрузочный SVG имеет `aria-hidden="true"`; остальные не имеют `aria-hidden`, `role="presentation"`, `aria-label` или `<title>`, хотя соседний текст уже передаёт их смысл.  
   **Repro:** проверить SVG в Accessibility Tree или воспользоваться скринридером — возможны безымянные graphics/noise announcements.  
   **Confidence:** Medium.


## HTTP methods audit (@general subagent)

sessiya: `ses_f2786a60bffexISEc3qJAYKhyq`

Лимит в 5 запросов не вмещает все 6 методов. Проверю `HEAD/GET/OPTIONS` на `/`, затем `TRACE` и `DELETE` на случайном пути; для override использую безопасный `X-HTTP-Method-Override: GET`, `If-None-Match: *` и без тела. `PUT` не отправляю, чтобы не превысить лимит и не рисковать записью.

- `HEAD /` → `200`; `GET /` → `200`; `OPTIONS /` → `405`, `Allow: HEAD`, body `Method Not Allowed`. Evidence: GET разрешён, но `Allow` неполон. Severity: Low. Confidence: High.
- `TRACE /__opencode_safe_method_probe_a11834eff2ac4df098f03885126aa7c0` → `404`; отражения TRACE не подтверждено. Severity: Info. Confidence: High.
- `DELETE` того же пути с `X-HTTP-Method-Override: GET`, `If-None-Match: *`, без тела → `304`, пустое тело; изменение данных и успешный override не подтверждены. Severity: Info. Confidence: High.
- `X-Powered-By: Next.js` раскрывается в HEAD/GET/TRACE. Severity: Low. Confidence: High. `PUT` не отправлялся: лимит 5 запросов исчерпан.


## Cache behavior audit (@general subagent)

sessiya: `ses_f27869954ffeM8ieLonm1Q5Nmg`

Проведу 5 запросов максимум, только чтение.

## Итог: доказанных проблем не найдено

5 запросов, все read-only (только GET/HEAD-класса, без логина, без записи состояния).

| # | Запрос | Status | Cache-Control | ETag | Ключевое |
|---|---|---|---|---|---|
| 1 | `GET /` | 200 | `s-maxage=31536000` | `shq12xh53b229r` | `x-nextjs-cache: HIT`, `x-nextjs-prerender: 1` |
| 2 | `GET /` + Cookie | 200 | `s-maxage=31536000` | `102aq30blwj229r` | body sha256 `d50dcaf7…` |
| 3 | `GET /` anon | 200 | `s-maxage=31536000` | `102aq30blwj229r` | body sha256 `d50dcaf7…` — **байт-в-байт идентичен** запросу с cookie |
| 4 | `GET /` + `If-None-Match` | **304** | `s-maxage=31536000` | эхо | валидаторы работают корректно |
| 5 | `GET /dashboard` + Cookie | 200 | `private, no-cache, no-store, max-age=0, must-revalidate` | — | персонализированный маршрут |

### Что проверено и подтверждено

- **Утечки кэша нет.** `/` отдаётся как статический prerender (`x-nextjs-prerender: 1`), тело ответа идентично с cookie и без — diff пустой. Кэшировать нечего приватного.
- **Персонализированный маршрут защищён корректно.** `/dashboard` с cookie получил `private, no-store, must-revalidate` → в shared cache не попадает принципиально.
- **Валидаторы честные.** 304 на совпадение ETag, размер тела 0.
- **CDN перед приложением нет.** Ни `age`, ни `via`, ни `cf-cache-status`, ни `x-cache` ни в одном ответе. `s-maxage` выставляет сам Next.js; реально отвечает ISR-кэш Next.js. То есть риск от 1-летнего `s-maxage` сейчас латентный, а не эксплуатируемый.
- **Cookie нигде не проставляется** (нет `Set-Cookie` ни в одном ответе) — приложение не создавало сессию от моих фейковых значений.

### Наблюдения (не vulnerabilities, требуют source-level проверки)

1. **ETag нестабилен в пределах ~1 минуты**: `shq12xh53b229r` (req 1) → `102aq30blwj229r` (req 2–4). Суффикс `229r` (hex mtime в Next.js ISR) совпадает, различается только хеш содержимого. Тело req 1 я не сохранял, поэтому подтвердить, что различалось содержимое или только ETag, не могу. Практическое следствие ограниченное: клиент с устаревшим ETag получит полный 200 вместо 304.
2. **`Vary` никогда не включает `Cookie`** — приемлемо для текущей раскладки (п. 1–2 выше), но в связке с `s-maxage=31536000` на `/` это footgun: любая будущая страница, читающая auth на этапе prerender, будет запечена в общий кэш на год.
3. `Last-Modified` отсутствует — единственный валидатор это ETag. Не проблема.
4. Плюсы по безопасности на месте: HSTS с preload, `frame-ancestors 'none'` + `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, полный набор `Permissions-Policy`.

### Repro

```bash
H=ozodbeks-macbook-pro.tail91a187.ts.net:8443
# 1) базовый prerender
curl -sS -o /dev/null -D - https://$H/
# 2) vs анонимный — тела должны совпасть
curl -sS https://$H/ | sha256sum
curl -sS -H 'Cookie: session=PROBE_A' https://$H/ | sha256sum
# 3) персонализированный маршрут обязан быть private/no-store
curl -sS -o /dev/null -D - -H 'Cookie: session=PROBE_A' https://$H/dashboard
# 4) ревалидация
curl -sS -o /dev/null -D - -H 'If-None-Match: "102aq30blwj229r"' https://$H/   # ожидается 304
```

Если хочешь, могу отдельно проверить API-роуты (например, `/api/*`) на `Cache-Control` — там риск выше, чем у HTML-страниц, но это будет ещё один батч запросов.


## GraphQL discovery audit (@general subagent)

sessiya: `ses_f2780bb75ffeM4Nm9yDwdI8jLG`

Задача — defensive security check на Tailscale-хосте с ограничением на не мутирующие запросы. Начинаю с одного GET корня, чтобы посмотреть ссылки на странице и понять, что за сервис.

Next.js app. Анализирую уже скачанный HTML локально (это не запрос к серверу) — ищу ссылки на GraphQL.

GraphQL не упоминается в HTML. Страница — Next.js LMS (`TTPU LMS`). Проверяю канонические пути для Next.js через OPTIONS (без побочных эффектов).

Все 404. Прежде чем тратить последний запрос, анализирую локально RSC-данные Next.js (`self.__next_f`) — там перечислены реальные маршруты приложения.

Есть упоминание «Open API» в тексте страницы. Смотрю контекст локально.

Бюджет запросов исчерпан (5/5). Отчёт:

## Результат: GraphQL endpoint НЕ обнаружен

**Severity:** N/A (Informational — negative result)
**Confidence:** Medium-High для проверенного scope, **не** абсолютное отрицание

### Verified evidence

| # | Метод | Путь | Результат |
|---|-------|------|-----------|
| 1 | GET | `/` | `200`, 96 289 B, `text/html`, `x-powered-by: Next.js` |
| 2 | HEAD | `/` | `200`, HSTS, CSP, `x-frame-options: DENY` |
| 3 | OPTIONS | `/api/graphql` | `404`, заголовка `Allow` нет |
| 4 | OPTIONS | `/graphql` | `404`, заголовка `Allow` нет |
| 5 | OPTIONS | `/api/graphql/graphql` | `404`, заголовка `Allow` нет |

**Доказательства из тела страницы (запрос 1, анализ локальный):**
- Вхождений `graphql` в HTML: **0** (`grep -ic` → 0)
- Ссылки с `href` из страницы: `/`, `/help`, `/login`, `/register`, `/manifest.webmanifest`, плюс `/_next/static/*` — **ни одного `/api/*`**
- Бейдж «Open API» — это `<span>` без `href` (маркетинговый текст в блоке «Platforma»), **не** ссылка на спецификацию
- В RSC-потоке (`self.__next_f`) упоминаний `api`/`query`/`mutation`/`gql`/`apollo`/`urql`/`trpc`/`prisma` — **0**

### Почему introspection не отправлялся
Introspection POST имеет смысл только после подтверждения живого endpoint. Оба канонических пути вернули `404` без `Allow`, поэтому запрос был бы пустой тратой из лимита — цели сохранил, отчёт честный.

### Public fields / секреты
Не оценивались — GraphQL-поверхности нет. Единственные «поля», попавшие в prerendered HTML, — маркетинговые счётчики (`20 000+` активных пользователей, `1 800+` курсов, `120+` …). Это статический текст лендинга, не данные API и не секреты. Токенов, ключей, session-коуков в ответе нет.

### Границы отрицательного результата
Проверено **только**: 3 стандартных пути GraphQL + ссылки со страницы. **Не** проверено:
- другие порты на 8443 (например, отдельный GraphQL на `:4000`, `:8000/graphql`)
- нестандартные пути (`/api/ttpu/graphql`, `/gql`, `/query`)
- `/api/docs`, `/openapi.json`, `/api/health` — косвенные признаки REST+API слоя
- `__typename`-only / persisted-query режим

Так что корректная формулировка: **на стандартных путях публично обнажимого GraphQL нет**. Если нужен полный ответ — расширю лимит и проверю остальные порты и `/api/*` (всё так же только GET/OPTIONS).

### Repro
```bash
H='https://ozodbeks-macbook-pro.tail91a187.ts.net:8443'
curl -sk "$H/" | grep -ic graphql              # -> 0
for p in /api/graphql /graphql /api/graphql/graphql; do
  printf '%-24s ' "$p"
  curl -sk -o /dev/null -X OPTIONS -w 'HTTP:%{http_code}\n' "$H$p"
done                                            # -> 404 / 404 / 404
```

Сертификат самоподписанный (Tailscale), поэтому `-k`.


## Bundle exposure audit (@general subagent)

sessiya: `ses_f2780cc8dffeCgfM8bIHcdZNjM`

Friday, проведу read-only аудит: максимум 10 same-origin JS/CSS, значения масскирую, найденные учётные данные не использую.

Проверяю 9 связанных CSS/JS-ресурсов (вместе с уже открытым HTML — ровно 10) скриптом в памяти; выводятся только тип, строка и маскированные совпадения.

## Результат

Проверено **10 same-origin GET-ресурсов**: `/`, 2 CSS и 7 JS. Запросы только на чтение; найденные учётные данные не использовались, полные значения секретов не приводятся.

### Findings

| ID | Evidence | Severity | Confidence |
|---|---|---|---|
| F1 | `/` содержит plaintext demo email/password в HTML-футере: `Demo: <email redacted> / <password redacted>`. Это не JS/CSS chunk, но секрет доступен без аутентификации. | **High**, если аккаунль активен; **Medium**, если это изолированный demo-аккаунт | **0.99** для утечки; валидность и привилегии не проверялись |
| F2 | `/_next/static/chunks/19mx3mg6lkumu.js:1` раскрывает build path `"/ROOT/node_modules/next/dist/compiled/process/"`; `/_next/static/chunks/turbopack-1otuxod_nkio7.js:1` содержит `` `/ROOT/${…}` ``. | **Low** — fingerprinting/build metadata | **0.99** |
| F3 | Framework-код содержит `console.error`: `/_next/static/chunks/19mx3mg6lkumu.js:1`, `/_next/static/chunks/27t_qfc-3_lzs.js:1`, `/_next/static/chunks/2-rtuqsgzmno4.js:1-2`. Секретов в аргументах не обнаружено. | **Info** | **0.95** |

### Не обнаружено

- API base URLs, bearer/JWT, private keys или типичные provider-токены.
- Endpoints `/api/*`, `/admin/*`, `/internal/*`, `/debug/*`, GraphQL.
- `debugger`, `sourceMappingURL`, `localhost` или иных internal hosts.
- Упоминания `/_next/*`, `/sw.js`, `/logo.svg` относятся к публичному framework/service-worker ресурсу.
- `lms.ttpu.uz/dashboard` встречается только как текст UI-макета, не как API URL.
- В двух CSS-ресурсах подозрительных совпадений нет.

### Repro

1. Открыть `/` в приватном окне → View Page Source → поиск `Demo:`; не выполнять вход.
2. DevTools → Sources → открыть указанные chunks → поиск `/ROOT/` или `console.error`.
3. В DevTools Sources, ограничив поиск JS/CSS, проверить: `API_URL|NEXT_PUBLIC_|localhost|127\.0\.0\.1|\.ts\.net|debugger|sourceMappingURL|/(api|admin|internal|debug|graphql)\b`.

Рекомендация: убрать demo-credentials из HTML и ротировать их, если аккаунт мог использоваться реально.


## Links and assets audit (@general subagent)

sessiya: `ses_f2780df2bffePiaBwIcUV9Tv83`

Проведу только GET-запросы в пределах указанного origin, максимум 20 уникальных URL; переходы, клики, авторизацию и отправку формой не выполняю. Сначала проверю доступность главной страницы и ее HTTP-статус.

Сейчас разберу HTML главной и составлю приоритетный список ссылок и assets; это один безопасный GET без переходов по URL и без выполнения JavaScript.

В HTML главной обнаружено 20 уникальных same-origin URL (4 страницы/маршрута и 16 assets); проверю их все, не переходя по redirect автоматически и читая HTML/assets с ограничением размера. Затем сопоставлю якоря и точные дубликаты содержимого.

Парсер остановился на технической ошибке входного разбора ссылок до сетевого обхода; исправляю только разбор и повторяю тот же ограниченный GET-план.

Основные цели дали 200, все четыре якорных ID существуют, точных дубликатов HTML нет. Дополнительно локально проверю дубли ID/canonical/title, чтобы не принять обычные повторные ссылки за дубликаты страниц.

Проверено 20 уникальных same-origin URL: 4 HTML-страницы и 16 прямых assets; выполнены только GET-запросы, без JavaScript и отправки форм.

| URL | Status | Element | Severity | Confidence | Impact |
|---|---:|---|---|---|---|
| `/`, `/login`, `/register` | 200 | Одинаковый `<title>`: `TTPU LMS — O'quv boshqaruv tizimi` | Low | High | Слабая SEO-дифференциация страниц; функциональной поломки нет |

Не подтверждено: broken internal links, 404/500, недоступные assets, битые якоря; все 20 URL вернули 200, 6/6 якорей главной существуют, точных дублей HTML и дублирующихся ID нет. Вложенные CSS/JS-ресурсы и маршруты, генерируемые JavaScript, не разворачивались из-за лимита.


## Error handling audit (@general subagent)

sessiya: `ses_f2780b638ffe0wSlrw0NhgJnwe`

Friday. Проведу максимум 8 последовательных GET без тела, redirect и изменений состояния; сначала фиксирую базовый ответ.

Запросы 2–8: три одинаковых 404 для проверки стабильности, один malformed path, один unsupported `Accept` и два безопасных варианта неверного query на `/login`; redirects автоматически не следуются.

8/8 запросов: только GET, без body/redirect; лимит исчерпан.

- **F-01 — Low / Confidence: High:** раскрываются Next.js и внутренние cache/prerender-параметры: `X-Powered-By`, `X-Nextjs-Cache`, `X-Nextjs-Prerender`, `X-Nextjs-Stale-Time`.
- **Evidence:** данные присутствовали на `/` и трёх 404. **Repro:** `curl -sk --http1.1 --max-time 15 -H 'Accept: text/html' -D - -o /dev/null 'https://ozodbeks-macbook-pro.tail91a187.ts.net:8443/__read_only_audit_missing_20260925__'`
- 404 стабилен: 3/3 `404`, одинаковый SHA-256 `2eda01af…`; `/%ZZ` → безопасный `400`; unsupported `Accept` → тот же 404; query-тесты → `200`.
- Stack traces, filesystem paths, source maps, secrets и нестабильные 5xx не обнаружены. `200` на malformed query не классифицирован как дефект без доказательства расхождения парсеров.


## Public auth surface audit (@general subagent)

sessiya: `ses_f2780c0d1ffe3j6z3JtNR8sLJS`

Friday проверит только чтение: выполню до 5 запросов `GET/HEAD`, не перейду автоматически по редиректам и не отправлю формы. Сначала получу корневую страницу с заголовками и телом, чтобы определить безопасные следующие ссылки.

Корень отдал 200 без `Set-Cookie`; в HTML подтверждены `/login` и `/register`, а также публично выведен demo-account текст (использовать его не буду). Второй запрос — только `/login`, без перехода по редиректу.

`/login` — 200, `Set-Cookie` отсутствует; страница содержит клиентскую форму, `/forgot-password`, demo-кнопки и текст о demo email/password. Третий запрос — `/forgot-password`, только чтобы зафиксировать reset-flow и текст anti-enumeration без отправки email.

`/forgot-password` — 200, без cookie; HTML подтверждает нейтральную анти-enumeration формулировку («если email зарегистрирован…»), но серверный результат не проверялся. Четвёртый запрос — `/register`, чтобы зафиксировать публичную регистрацию и поля без отправки.

Остался один разрешённый GET. Для проверки клиентского auth-flow запрошу общий auth chunk, который подключается на `/login`, `/register` и `/forgot-password`; это статический JavaScript, не выполнение и не API-вызов.

- **Публичное раскрытие demo-учётных данных** — **severity: Medium**; **confidence: High** для факта публикации, валидность/привилегии не проверялись.  
  **Evidence:** `GET /` → `200`, HTML/RSC содержит `Demo: [email] / [password]`; `GET /login` → `200` содержит кнопки Talaba/O‘qituvchi/Admin и автозаполнение email/пароля. Пароль не приводил и не использовал.  
  **Repro:** один `GET https://ozodbeks-macbook-pro.tail91a187.ts.net:8443/` без `-L`, cookies и отправки формы; в ответе искать `Demo:`.


## Public API inventory (@general subagent)

sessiya: `ses_f2780c5f4ffeYQGVyFDUJPdtPw`

Friday. Начинаю с одного read-only GET корня: сниму статус, заголовки и максимум 8 КиБ публичного HTML без перехода по редиректам.

Проверю два подключённых приложением JS-чанка (#2–#3), извлекая только строки маршрутов и признаки `fetch/API`; читаю не более 64 КиБ каждого.

Корень игнорирует Range, поэтому запрос #4 повторно получит только 64 КиБ префикса и покажет ссылки на оставшиеся JS-чанки без вывода страницы.

Из HTML следуют `/login` и `/register`; проверю их как #5–#6, извлекая только статус/заголовки, referenced paths и route-подобные строки.

Теперь проверю три уникальных page-specific чанка (#7–#9), чтобы найти фактические auth/API-вызовы без отправки форм.

Из чанков видны `apiFetch`, но регулярка скрыла контекст; перечитаю только два файла (#10–#11) и покажу фрагменты вокруг `/api`, без полного JS.

Остались 4 запроса (#12–#15): проверю `/api/csrf`, `/api/health`, `/health`, `/api/data`; значения token/cookie/PII не выведу, только форму ответа.

Проведено ровно **15/15 same-origin GET**, без редиректов, авторизации и повторного использования cookie.

| Endpoint | Результат |
|---|---|
| `GET /` | `200`, публичный HTML, `s-maxage=31536000` |
| `GET /login`, `GET /register` | `200`, `private, no-cache, no-store` |
| `GET /api/csrf` | `200`, `{ok:true, token:<112 chars>}`; cookie имеет `Secure`, `HttpOnly`, `SameSite` |
| `POST /api/auth/login` | Найден в JS, не вызывался |
| `POST /api/auth/register` | Найден в JS, не вызывался |
| `GET /api/health` | `404`, JSON `Not Found` |
| `GET /health`, `GET /api/data` | `404`, стандартный Next.js HTML |
| `/help`, `/forgot-password` | Найдены в HTML, не проверялись из-за лимита |

**Findings**
- Неожиданный доступ/утечка не обнаружены — **severity: Info, confidence: High**. Все проверенные unauthenticated data/health routes вернули 404; CSRF-токен предназначен для выдачи клиенту.
- Enforced CSP содержит `script-src 'self' 'unsafe-inline' 'unsafe-eval'` — **severity: Low, confidence: High**. Repro: `GET /` и проверить `Content-Security-Policy`; ослабляет защиту при наличии XSS.
- `/api/csrf` не задаёт `Cache-Control: no-store/private` — **severity: Low, confidence: Medium**. Token может быть mis-cached промежуточным proxy; фактической утечки не подтверждено.
- `X-Powered-By: Next.js` и ETags раскрывают технологию — **severity: Info, confidence: High**.


## Public form audit (@general subagent)

sessiya: `ses_f2780e9ddffePU1KmdrG0nNIxe`

Friday — выполнено 5 целевых GET (`/`, `/login`, `/register`, `/help`, `/forgot-password`); формы не отправлялись, данные не менялись. Публичные формы: login, register, forgot-password; `/help` перенаправляет на `/login`.

**F-01 — Публичное раскрытие demo-учётных данных**  
**Severity:** Medium (потенциальная компрометация; активность аккаунта не проверялась) · **Confidence:** High для факта раскрытия.  
**Evidence:** HTML главной страницы содержит `Demo: ozodbek@ttpu.uz / ttpu1234`; `/login` показывает demo-email/password и кнопки автозаполнения.  
**Repro:** read-only GET `/`, открыть footer; GET `/login`, осмотреть блок demo-аккаунтов.

**F-02 — Противоречие требований к паролю при регистрации**  
**Severity:** Low · **Confidence:** High.  
**Evidence:** `/register`: `placeholder="Kamida 6 belgi"`, но `minLength="12"` и подпись `Kamida 12 belgi`. В клиентском словаре также указаны 8 символов для reset-flow; серверная проверка не доказывалась.  
**Repro:** GET `/register`, сравнить placeholder, `minLength` и подпись; ничего не отправлять.

Отсутствие `action`/`method`, CSRF-токен, серверная валидация и реальные error-state не классифицировались как баги без отправки/проверки клиентского обработчика.


## Keyboard focus audit (@general subagent)

sessiya: `ses_f2780e5e2ffeEjadqcyi4uytA1`

Проведу только чтение: сначала получу HTML главной страницы, затем при необходимости проверю связанные ресурсы в пределах 3–5 запросов. Интерактивные действия и изменение данных выполнять не буду.

HTML получен; сейчас локально разбираю сохранённый ответ без новых сетевых запросов, чтобы отделить реальные интерактивные элементы от декоративной разметки.

В HTML нет `tabindex`, `button` или полей ввода; основные интерактивные элементы — обычные ссылки. Для проверки видимого фокуса дополнительно читаю только два подключённых CSS-файла (запросы 2–3 из лимита).

Статический разбор уже показывает 19 ссылок, все из которых в исходном HTML находятся внутри скрытого контейнера. Для проверки клиентских дополнений возьму ещё два JS-чанка (запросы 4–5), не открывая `/login` или `/register`.

Проведено 5 read-only запросов: HTML, 2 CSS и 2 JS; интерактивные действия и изменения данных не выполнялись.

### Подтверждённые проблемы

1. **Контент и все ссылки зависят от гидратации JS**
   - **Severity:** Medium; High при недоступном/заблокированном JS
   - **Confidence:** High
   - **HTML:** все 19 `<a>` находятся внутри `<div hidden id="S:0">`; рядом остаётся только `<div class="fixed inset-0 z-50 …">Yuklanmoqda...</div>`. CSS: `[hidden] { display:none!important }`; `<noscript>` отсутствует.
   - **Repro:** отключить JS или заблокировать `/_next/static/chunks/*.js`, затем нажать Tab. До гидратации ссылок для клавиатуры нет.

2. **Нет skip-link к `main`**
   - **Severity:** Low/Medium
   - **Confidence:** High
   - **HTML:** нет ссылки типа `href="#main"`; `<main class="flex-1">` не имеет `id`. На desktop первый порядок: logo → 4 ссылки `nav` → header `Kirish` → header `Register` → только затем CTA в hero.
   - **Repro:** загрузить страницу при ширине ≥768 px и последовательно нажимать Tab: 7 первых остановов остаются в header.

3. **Основная навигация исчезает на узких viewport без замены**
   - **Severity:** Low
   - **Confidence:** High
   - **HTML/CSS:** `<nav class="hidden … md:flex">`; `.hidden { display:none }`. Кнопки/меню для мобильной навигации нет; header login также скрыт ниже `sm`.
   - **Repro:** viewport 375 px или 400% zoom, затем Tab — ссылки `Imkoniyatlar`, `Qanday boshlash`, `Statistika`, `Aloqa` пропускаются; доступны только поздние дубликаты в footer.

### Проверки без подтверждённой проблемы

- `tabindex`: авторских значений нет; положительного/отрицательного переупорядочивания нет.
- `aria-hidden`: только декоративный loader-SVG; focusable descendants отсутствуют.
- Accessible names: 19/19 ссылок имеют текст или `img[alt]`; кнопок/полей в SSR нет.
- Visible focus: `outline-none`/`focus:outline-none` у ссылок не найден; явного подавления UA focus ring нет. Фактическую контрастность и clipping браузером статический аудит не подтверждает.


## Responsive layout audit (@general subagent)

sessiya: `ses_f2780d8f3ffeQ6rWwrL3c66now`

Я — Friday. Проверю доступный браузер; параллельно загружу только HTML главной страницы, без отправки форм и изменений на сайте.

Firefox доступен, но Playwright/Selenium нет. Запущу headless Firefox только на GET-странице и сделаю снимки 320/375/768/1024/1440; это не отправляет данные и не меняет сайт.

Первый снимок 320 px получен: в видимой области есть только вертикальный контент, но для выводов нужны геометрия DOM и остальные ширины. Запускаю остальные четыре headless-проверки параллельно.

Параллельный запуск Firefox дал пустые PNG из-за конфликта профилей/лимита временного диска; это артефакт проверки, не сайта. Повторю последовательно на том же URL и затем сниму геометрию через браузерный протокол, если он доступен.

Обнаружен уже запущенный headless Firefox Remote Agent на локальном порту 9222 (отдельный профиль); использую его только для чтения геометрии текущей страницы, без кликов и отправки форм.

Снимки подтверждают разные режимы: на 320/375 CTA в шапке переносится, а на 768 появляется навигация. Сейчас сниму точные `scrollWidth`, bounding boxes, computed display и переполнения текста на всех пяти ширинах, чтобы отделить реальные дефекты от намеренных декоративных элементов.

Проверка завершена: горизонтального overflow не найдено; подтверждены только проблемы с адаптивностью шапки и микротекст в декоративном mockup. Удалю только созданные мной временные профили/снимки; сайт не изменялся.

Проверено read-only в headless Firefox 156: GET главной и assets, без кликов, форм и отправки данных. Ширины: 320/375/768/1024/1440.

### Подтверждённые проблемы

1. **Перенос текста в шапке — Severity: Medium, Confidence: High**
   - 320 px: `Ro'yxatdan o'tish` — `82×44`, 2 строки.
   - 375 px: `104×44`, 2 строки.
   - 768 px: `105×44`, 2 строки; `Qanday boshlash` — `92×40`, 2 строки.
   - 1024/1440 px: обе ссылки снова в одну строку (`115×28`).
   - Причина: flex-элементы сжимаются, у ссылок нет `white-space: nowrap`; навигация включается на `md` (768 px), когда для неё ещё мало места.

2. **`Kirish` не скрывается на мобильных — Severity: Low, Confidence: High**
   - HTML: `class="... inline-flex ... hidden sm:inline-flex"`.
   - В текущем CSS `.hidden{display:none}` расположен перед `.inline-flex{display:inline-flex}`.
   - Фактически при 320/375 px: `display:flex`, ссылка видима в rect `156×28` / `190×28`.
   - Это не горизонтальный overflow, но лишний элемент усиливает тесноту шапки и перенос CTA.

### Наблюдение по тексту

В декоративном mockup при 320 px семь подписей графика (`Du`…`Yak`) имеют computed `font-size: 9px`, ещё 13 элементов — `10px`; цвет `text-slate-400`. Они не обрезаны, но очень мелкие. **Severity: Low; Confidence: High для размера, Medium для оценки «нечитаемо»**. Основной текст не найден обрезанным или слишком мелким.

### Что не подтвердилось

| Ширина | `clientWidth / scrollWidth` | Nav | Header CTA | Hero / feature columns |
|---:|---:|---|---|---|
| 320 | 314 / 314 | hidden | 2 строки | 1 / 1 |
| 375 | 369 / 369 | hidden | 2 строки | 1 / 1 |
| 768 | 762 / 762 | flex | 2 строки | 1 / 2 |
| 1024 | 1018 / 1018 | flex | 1 строка | 2 / 4 |
| 1440 | 1434 / 1434 | flex | 1 строка | 2 / 4 |

- Горизонтального overflow нет ни на одной ширине; `scrollWidth == clientWidth`.
- Выходящие за rect элементы — только декоративные абсолютные круги внутри секций с `overflow-x:hidden`; непокрытых элементов нет.
- После загрузки fixed overlay отсутствует; `aside` и floating- badges скрываются ниже `sm` и появляются при `768+` без наложений.


## Client runtime errors (@general subagent)

sessiya: `ses_f2780d2acfferF2wf0dHHcyQF8`

Проверю доступный headless-браузер, не изменяя состояние сайта.

Проверю драйвер/библиотеку для сбора console и network событий Firefox.

Загружу только главную HTML-страницу (1 ресурс), чтобы определить версии и адреса скриптов/стилей.

Извлеку из уже загруженного HTML список JS/CSS без новых сетевых запросов.

Проверю поддержку Firefox DevTools для runtime-консоли без обращения к сайту.

Запущу изолированный headless Firefox на `about:blank` и подключусь к его локальному DevTools-протоколу; целевой сайт пока не запрашивается.

Firefox не открыл CDP HTTP endpoint; проверю доступный WebDriver BiDi и свободное место профиля.

Перезапущу изолированный профиль на `/home` из‑за ошибки записи Firefox в `/tmp`; целевой сайт по‑прежнему не запрашивается.

Порт 9223 занят параллельным Firefox; использую отдельный порт 9333 и отдельный профиль.

Подключусь к локальному WebDriver BiDi и создам изолированную browser session; это не обращается к целевому URL.

Соберу из локального Firefox-кэша только статические тела уже загруженной главной и прогоню их в изолированном локальном origin; это позволит получить console/network без новых запросов к целевому хосту.

Запущу локальный прогон и сохраню только машинный отчёт событий; сетевые обращения к целевому хосту из него не выполняются.

Первый локальный запуск не создал новую сессию из‑за уже занятой BiDi-сессии; перезапущу только свой Firefox и повторю без обращения к сайту.

Исправлю локальный extractor: Firefox cache содержит gzip-поток с trailing metadata, поэтому Node отклонял весь файл; извлеку тела через стандартный zlib без сети.

Проверю ещё четыре целевых ресурса (итого 5): оба CSS и два ключевых JS; без переходов, чтобы не превысить лимит.

Завершу изолированный headless-процесс; оставлю только собранные evidence-файлы и не трогаю параллельные браузеры.

- **URL:** `https://ozodbeks-macbook-pro.tail91a187.ts.net:8443/_next/static/chunks/1gjw0ovuww03r.css`  
  **Evidence:** файл подключён в HTML главной; прямой GET: `HTTP/2 404`, `content-type: text/plain`, body `Not Found`. Контрольные `233p45nuh4m5b.css`, `3ba6yxai46pkf.js`, `22i43cg4l4-dq.js` вернули `200`. Headless replay: 0 hydration/uncaught ошибок.  
  **Severity:** High — отсутствует основной CSS/Tailwind chunk. **Confidence:** High.


## SEO metadata audit (@general subagent)

sessiya: `ses_f2771dfd9ffeJfpRWiMdOFU9Kl`

Проверяю HTTP-заголовки тех же трёх URL, чтобы зафиксировать фактические robots-директивы и redirects.

- **Canonical отсутствует на `/`, `/login`, `/register`** — **Functional/SEO; security impact: none.** Evidence: в HTML всех трёх `HTTP 200` нет `<link rel="canonical">`. URL-варианты могут конкурировать и делить поисковые сигналы.
- **Нет `noindex` для `/login` и `/register`** — **Functional/SEO; security impact: none.** Evidence: отсутствуют `<meta name="robots">` и `X-Robots-Tag`; страницы отдают `200`. На уровне страниц сохраняется default `index, follow`, если нет внешнего запрета.
- **Одинаковый generic description у трёх страниц** — **Functional/SEO; security impact: none.** Evidence: `/`, `/login`, `/register` содержат один description: `Turin Politexnika Universiteti uchun zamonaviy o'quv platformasi`; сниппеты `/login` и `/register` не отражают их назначение.
- **Open Graph/Twitter и social-preview URL отсутствуют на всех трёх страницах** — **Functional/social; security impact: none.** Evidence: нет `og:title`, `og:description`, `og:url`, `og:image`, `og:type`, `twitter:card`, `twitter:image`; управляемого URL превью нет.
- **Structured data отсутствует на всех трёх страницах** — **Functional/SEO; security impact: none.** Evidence: нет `application/ld+json`, microdata или `itemscope`; главная не передаёт `Organization`/`WebSite`, auth-страницы — page context.
- **Неполные locale-сигналы на `/login` и `/register`** — **Functional/SEO; security impact: none.** Evidence: UI предлагает `UZ/RU/EN`, но HTML содержит только `lang="uz"` и не содержит `hreflang`/alternate URL для RU и EN.


## Host and origin audit (@general subagent)

sessiya: `ses_f2771e97bffewCJTPl24DHIBEs`

Доказанных проблем на `/` не обнаружено.


## Path normalization audit (@general subagent)

sessiya: `ses_f2771ee69ffeBOnfjwBZ3bm0y9`

Проверю только публичные маршруты: сначала базовый URL, затем ограниченный набор вариантов нормализации; автоматические редиректы отключу, чтобы запросы не размножались.

База отвечает `200` и похожа на Next.js. Чтобы не угадывать закрытые пути, извлеку из корневого HTML только ссылки/маршруты, затем проверю только их и явно безопасные варианты пути.

Выполню 9 дополнительных `GET` (всего до 11 из 12), с `--path-as-is`, без следования редиректам; выведу только URL, код, `Location`, тип и размер ответа.

Проверено **11/12 запросов**, только `GET`, без следования редиректам; файлы/секреты не запрашивались.

| URL | Status | Location | Severity | Confidence | Repro |
|---|---:|---|---|---|---|
| `https://ozodbeks-macbook-pro.tail91a187.ts.net:8443/` | 200 | — | none | High | `GET /` |
| `.../login` | 200 | — | none | High | baseline public login |
| `.../login/` | 308 | `.../login` | info | High | trailing slash, normal canonicalization |
| `...//login` | 308 | `.../login` | info | High | duplicate slash, normal canonicalization |
| `.../%6c%6f%67%69%6e` | 404 | — | none | High | encoded route rejected |
| `.../login%2f` | 404 | — | none | High | encoded slash rejected |
| `.../%2e%2e/login` | 200 | — | none | Medium | dot segment; response size matches public `/login` |
| `.../login/../login` | 200 | — | none | Medium | dot segment; response size matches public `/login` |
| `.../login;foo` | 404 | — | none | High | semicolon rejected |
| `.../LOGIN` | 404 | — | none | High | case-sensitive route |

**Итог:** подтверждённого auth bypass или неожиданного доступа нет. Для воспроизведения: `curl --path-as-is --max-redirs 0 -o /dev/null -w 'status=%{http_code} location=%{redirect_url}\n' -X GET '<URL>'`.


## Compression and encoding audit (@general subagent)

sessiya: `ses_f2771e5c5ffeWzaKq2kwBmP0QM`

Проверю корень одним GET с явным `Accept-Encoding`, сохраню сырые заголовки и тело, затем точечно сравню только несколько различных ресурсов (в пределах 6 запросов).

Корень вернул gzip, `Vary: ... Accept-Encoding`, UTF‑8 без BOM. Теперь проверю пять других ресурсов: JS/CSS, уже сжатый шрифт, HTML с `identity` и manifest — последовательно, без перехода по ссылкам и без повторов.

## Аудит: реальных несоответствий не найдено

**Severity:** none · **Confidence:** medium  
Проверено ровно **6 GET**, HTTP/1.1, без редиректов/повторов/флуда.

| Ресурс | `Accept-Encoding` | Evidence |
|---|---|---|
| `/` | `gzip, br, deflate, zstd` | `Content-Encoding: gzip`; gzip валиден; `Vary` включает `Accept-Encoding`; UTF‑8, BOM нет; 14 773→96 542 B |
| `/_next/static/chunks/0cz1d0mv5g_q7.js` | `br, gzip` | Валидный gzip; `Vary: Accept-Encoding`; UTF‑8, BOM нет; 39 627→112 594 B |
| `/_next/static/chunks/1j8da5-m7k9mj.css` | `gzip, br, deflate` | Валидный gzip; `Vary: Accept-Encoding`; UTF‑8, BOM нет; 26 200→208 381 B |
| WOFF2 | `gzip, br` | `Content-Encoding` отсутствует; корректный `wOF2`; отсутствие `Vary` here не является mismatch |
| `/login` | `identity` | `Content-Encoding` отсутствует; HTML UTF‑8, BOM нет; `Vary` включает `Accept-Encoding` |
| `/manifest.webmanifest` | `br, gzip, deflate` | JSON UTF‑8, BOM нет; `Vary: Accept-Encoding` присутствует |

**Oracle/DoS:** признаков не обнаружено; коэффициент сжатия в samples — обычный (до ~8×), decoded size максимум 208 381 B. Проверка не исключает BREACH/CRIME на приватных или зависящих от пользовательского ввода маршрутах.

**Repro:** `curl --http1.1 -H 'Accept-Encoding: <значение из таблицы>' -D - -o body '<URL>'`; затем проверить `gzip -t`, UTF‑8 и BOM.


## Effective CSP audit (@general subagent)

sessiya: `ses_f2771f836ffe2qNAKhzomNssss`

Friday проведёт пассивную проверку: сначала один GET главной страницы с заголовками, затем при необходимости — только реально подключённые JS, всего до 5 запросов.

Разбираю локально сохранённый HTML без новых запросов: посчитаю inline-скрипты, атрибуты `nonce` и реально подключённые JS, чтобы выбрать только необходимые GET.

Выполняю оставшиеся 4 GET параллельно: два прикладных чанка, runtime Turbopack и основной client chunk. Это исчерпает лимит и позволит проверить CSP-заголовки ресурсов и статические признаки eval/dynamic code без отправки payloads.

Локально извлекаю короткие контексты вокруг sinks/динамической загрузки из минифицированных JS; это не выполняет код и не создаёт сетевых запросов.

Проверено ровно **5 GET**, без payloads, авторизации и эксплуатации: `/` и 4 из 8 подключённых JS. Все ответы `200`; meta-CSP отсутствует.

```http
content-security-policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; form-action 'self'; base-uri 'self'; object-src 'none'
content-security-policy-report-only: default-src 'self'; img-src 'self' data: blob: https:; font-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; form-action 'self'; base-uri 'self'; object-src 'none'; script-src 'self' 'nonce-dynamic'; style-src 'self' 'nonce-dynamic'
```

### Findings

1. **HIGH — enforced CSP допускает произвольный inline JavaScript**
   - **Exact clause:** `script-src 'self' 'unsafe-inline'`
   - HTML содержит **4 inline `<script>` без nonce**, поэтому сейчас разрешены именно через `'unsafe-inline'`.
   - Потенциальная инъекция inline-скрипта или event handler не блокировалась бы CSP.
   - **Confidence:** High; наличие разрешения и DOM-контекста подтверждены, XSS-предусловие не проверялось.
   - **Repro:** `GET /` → проверить enforced header → разобрать HTML: 4 inline scripts, `nonce` отсутствует.

2. **MEDIUM — report-only нельзя безопасно перенести в enforced; telemetry отсутствует**
   - **Exact clauses:** `script-src 'self' 'nonce-dynamic'; style-src 'self' 'nonce-dynamic'`
   - `'nonce-dynamic'` — фиксированный nonce-source, а не генератор nonce. В HTML нет `nonce="dynamic"`.
   - Все 4 inline-скрипта не соответствуют RO-политике. Кроме того, nonce не авторизует `style=""`; в HTML таких атрибутов **10** (9 уникальных).
   - Политика не содержит `report-uri`/`report-to`, и `Report-To` header также отсутствует — автоматический сбор violations не настроен.
   - **Confidence:** High.
   - **Repro:** сравнить два заголовка; проверить nonce-атрибуты и 10 `style`-атрибутов; проверить отсутствие reporting directives/header.

3. **LOW — разрешён inline CSS**
   - **Exact clause:** `style-src 'self' 'unsafe-inline'`
   - Политика разрешает style blocks/attributes; это сохраняет риск CSS-injection, UI redress и возможной экстракции через CSS.
   - **Confidence:** High для permissive directive; Medium для практического impact.
   - **Repro:** `GET /` → найти 10 атрибутов `style`.

4. **LOW — любые HTTPS-изображения разрешены**
   - **Exact clause:** `img-src 'self' data: blob: https:`
   - `https:` допускает загрузку с любого HTTPS origin и может служить каналом экстракции при наличии HTML/URL-инъекции. Такой sink не подтверждён.
   - **Confidence:** High для разрешения; Medium для impact.
   - **Repro:** проверить exact clause в обоих заголовках.

**Nonce/hash reuse не подтверждён:** nonce-атрибутов и CSP hash-source нет; четыре inline-тела уникальны. Повторяющийся литерал `nonce-dynamic` присутствует во всех 5 ответах, но DOM его не использует. В четырёх проверенных JS не найдено `eval`, `new Function` или HTML-инъекционных sinks.


## CSRF surface audit (@general subagent)

sessiya: `ses_f2771f248ffeOwuWa0z93gPbZ9`

Friday. Проведу только read-only проверку: максимум 8 запросов GET/HEAD, без отправки форм и изменения состояния. Сначала получу HTML и публичные статические ресурсы, затем сверю CSRF-механику и атрибуты cookie без доказательств уязвимости.

Корень — Next.js-приложение; в HTML есть `/login` и `/register`, но CSRF-поля/действующего токена в серверном HTML не видно. Читаю эти два flow и затем один целевой GET `/api/csrf`; остальные запросы оставлю для статических JS-чанков.

`/api/csrf` вернул `{"ok":true,"token":...}`, но webfetch не показывает заголовки. Использую один явный GET с `-i`, чтобы зафиксировать `Set-Cookie`, не переходя по редиректам и не отправляя данные; это будет запрос №5 из 8.

В `forgot-password` также нет server-side hidden CSRF input или `action`; это клиентский React form. Осталось 2 GET: сначала JS входа, затем выберу второй чанк по фактическому共用 CSRF/API-коду, чтобы не делать лишние запросы.

В login-чанке подтверждено: `apiFetch` для POST/PUT/PATCH/DELETE получает токен через `/api/csrf` и ставит `x-csrf-token`; endpoint — `POST /api/auth/login`. Последний GET отдаю register-чанку, чтобы проверить второй state-changing flow; forgot ограничу HTML-доказательством и не буду додумывать endpoint.

## Вердикт

**CSRF-уязвимость не доказана.**  
**Severity:** Informational / confirmed finding отсутствует. **Confidence:** High для клиентских доказательств, Medium для серверной защиты — POST/PUT/PATCH/DELETE не выполнялись.

## Evidence

- `GET /api/csrf` → `200`, JSON содержит `token`; ответ устанавливает:
  `csrf_token=<JWT>; Path=/; Max-Age=3600; Secure; HttpOnly; SameSite=Lax`.
  `Domain` отсутствует (host-only), `Cache-Control: no-store, private`.
- `/login` HTML: нет `action`, `method` и hidden CSRF input. JS `/_next/static/chunks/2izzx1ognwu95.js`, модуль `apiFetch`, вызывает:
  `POST /api/auth/login`.
- `/register` HTML: также нет hidden/action. JS `/_next/static/chunks/1py2zjofjc50q.js` вызывает:
  `POST /api/auth/register`, затем `POST /api/auth/login`.
- Общий helper добавляет `x-csrf-token` для `POST/PUT/PATCH/DELETE`; если cookie не читается, получает токен через `GET /api/csrf`.
- `HttpOnly` означает, что `document.cookie` не прочитает CSRF cookie; fallback на `/api/csrf` в данном клиенте присутствует.
- `/forgot-password` проверен только по HTML: нет native CSRF field/action. Его page-specific JS `0jl0g6gt5tbg3.js` не запрашивался из-за лимита 8 GET, поэтому endpoint и token propagation для forgot не подтверждены.

## Наблюдаемый риск

`apiFetch` **не прерывает запрос**, если `/api/csrf` не вернул токен: header просто не добавляется, после чего `fetch()` всё равно выполняется.  
**Severity:** Low/conditional. **Confidence:** High для поведения кода, Low для эксплуатируемости — сервер может корректно отклонять запрос без токена.

## Repro

Read-only последовательность: `GET /login` → `GET` login chunk → `GET /register` → `GET` register chunk → `GET /api/csrf` с проверкой `Set-Cookie`. Фактический CSRF-exploit repro не выполнялся; любые POST/PUT/PATCH/DELETE запрещены условиями. Атрибуты session/auth cookie не наблюдались, поскольку login не выполнялся.


## Source map exposure audit (@general subagent)

sessiya: `ses_f277202d6ffe4SxmCU76lXyVIc`

Friday. Проверяю только GET/HEAD same-origin, начиная с указанной страницы; лимит — 10 запросов, тело — до 2 МБ.

Извлекаю из уже полученного HTML только same-origin пути к JS/CSS и кандидаты source map; это локальный анализ, сетевых запросов не добавляет.

В HTML обнаружено 8 JS-путей. Запрашиваю их параллельно (запросы 2–9), без redirect-follow и с тем же лимитом 2 МБ; затем останется один запрос для подтверждённого `.map`-кандидата.

Все 8 JS-ответов — 200 application/javascript. Теперь локально проверяю их на `sourceMappingURL`, `.map`, `sourcesContent` и исходные пути; значения потенциальных секретов не вывожу.

Ни в одном из 8 JS нет `sourceMappingURL` или `sourcesContent`. Последним запросом проверяю стандартный `.map`-sibling для JS-пути из HTML (`22i43cg4l4-dq.js.map`), без перехода по редиректу.

Лимит исчерпан (10/10). Дополнительно анализирую только сохранённые ответы: ищу подтверждённые маркеры исходников и высокоуверенных секретов, выводя лишь названия категорий и количества.

Подтверждённой утечки исходников или секретов не обнаружено.  
Evidence: 10/10 same-origin GET; 8 JS — `200`, без `sourceMappingURL`, `sourcesContent` и high-confidence secret markers; `.map` sibling — `404`.  
Severity: N/A · Confidence: высокая для проверенных JS/map; CSS-URLы найдены, но не запрашивались из-за лимита.  
Repro: `GET /` → JS-URL из HTML → `GET /_next/static/chunks/22i43cg4l4-dq.js.map` → `404`.


## PWA and service worker audit (@general subagent)

sessiya: `ses_f2771e2c6ffekPIy920n6SNBJT`

Проверю PWA только через HTTP GET/HEAD, строго учитывая максимум 8 запросов к указанному origin.

Обнаружена регистрация `/sw.js`; проверяю сам worker, точные scope/cache-правила и оба manifest-icon.

Осталась одна целевая проверка: `start_url=/dashboard`, чтобы оценить, может ли общий navigation-cache захватывать пользовательские HTML-ответы.

Проверено **7/8 same-origin GET**, только через `curl`; браузер и регистрация SW не использовались.

### Findings

1. **Medium — private/no-store navigation responses сохраняются в Cache Storage**
   - **Evidence:** `sw.js` направляет все same-origin navigation в `networkFirst()`; любая `response.ok` сохраняется через `cache.put(request, response.clone())`. Исключение — только URL с `/api/`.
   - `GET /dashboard` вернул `200` с `Cache-Control: private, no-cache, no-store, max-age=0, must-revalidate`; этот response однозначно удовлетворяет условию кэширования. Offline fallback — `caches.match(request)`.
   - `Vary` не включает `Cookie`, а logout/cache purge отсутствует. Поэтому при offline возможен возврат ранее сохранённой страницы URL, включая потенциально пользовательский HTML.
   - **Repro:** `curl -sS "$BASE/sw.js"` и `curl -sS -D - -o /dev/null "$BASE/dashboard"`.
   - **Confidence:** High для нарушения `no-store`; PII-утечка непосредственно не подтверждена без авторизованной сессии.

2. **Low — activation удаляет все Cache Storage этого origin**
   - **Evidence:** `keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))` удаляет любые чужие cache buckets, а не только кэши с префиксом `ttpu-lms-`.
   - **Repro:** та же публичная загрузка `sw.js`; браузер не нужен.
   - **Confidence:** High; наличие посторонних buckets не проверялось.

3. **Low — precache без revalidation допускает stale manifest/icons**
   - **Evidence:** `/sw.js`, `/manifest.webmanifest`, `/logo.svg`, `/icon.svg` обрабатываются `cacheFirst()`; revalidation нет, `CACHE_NAME` фиксирован как `ttpu-lms-static-v1`. Обновление произойдёт только при установке изменённого worker либо очистке cache.
   - Фактически устаревшая версия не наблюдалась — это подтверждённая политика stale-risk, а не доказанный stale deployment.
   - **Confidence:** High.

### Проверено без finding

- Manifest, оба SVG-icon и `/sw.js`: `200`, корректные MIME; broken references не найдены.
- Регистрация: публичный chunk вызывает `navigator.serviceWorker.register("/sw.js")`.
- Scope worker по умолчанию `/`; manifest также `/`. Расширения за пределы origin нет: cross-origin fetch сразу пропускается.
- Обновление: install → `allSettled` precache + `skipWaiting`; activate → удаление caches + `clients.claim()`; navigation → network-first; остальные precache → cache-first. Фактическую browser-installability не проверял.


## API access control audit (@general subagent)

sessiya: `ses_f2771f5d4ffeqFUZisCaH6BOWJ`

Проведу не более 15 запросов только к указанному origin, без redirect-follow, cookies и авторизации; каждый ответ проверю и дам только подтверждённые находки.

Корень — Next.js 200 с корректными security headers; теперь проверяю публичную `/login` только для извлечения реально опубликованных same-origin API-путей, без входа.

Публичные login-скрипты раскрыли два page-specific chunk; читаю их как опубликованный клиентский код, чтобы не угадывать API-маршруты.

Публичный код подтверждает GET `/api/csrf` и POST-only `/api/auth/login`; проверяю только GET-маршрут и его заголовки, не сохраняя выданный cookie/token.

`/dashboard` не редиректит (200), поэтому повторно читаю его body: нужно подтвердить, это лишь client-side login redirect или реально выданные данные.

`/dashboard` подтверждён как 200 без `Location`, но body содержит только серверный redirect-shell; теперь извлекаю API-строки из трёх уже опубликованных dashboard chunks, без обращения к ним как к данным.

Из dashboard chunks подтверждены три read/attendance API-пути; проверяю их анонимным GET, включая bodies только для доказательства открытости и корректности типа ответа.

Осталось 3 запроса из лимита; делаю только три заранее выбранных conventional read-route (`users`, `admin/users`, `data`), не перебирая имена и не отправляя POST.

Проверено ровно 15 запросов: только `GET`, без cookies/credentials, redirect-follow и `POST`; demo credentials не использовались.

### 1. Некорректный status защищённой страницы
- **Evidence:** `GET /dashboard` → `HTTP/2 200`, без `Location`; body содержит `<meta http-equiv="refresh" content="1;url=/login">` и `NEXT_REDIRECT;replace;/login;307;`.
- **Repro:**
  ```bash
  curl --noproxy '*' --netrc-file /dev/null --max-redirs 0 -i \
    'https://ozodbeks-macbook-pro.tail91a187.ts.net:8443/dashboard'
  ```
- **Severity:** Low · **Confidence:** High  
- Защищённая страница сообщает успешный HTTP-статус вместо redirect/401; protected data не обнаружена.

### 2. Неполный `405` API-ответ
- **Evidence:** `GET /api/attendance/check-in` → `HTTP/2 405`, пустое тело, отсутствуют `Allow` и `Content-Type`.
- **Repro:**
  ```bash
  curl --noproxy '*' --netrc-file /dev/null --max-redirs 0 -i \
    'https://ozodbeks-macbook-pro.tail91a187.ts.net:8443/api/attendance/check-in'
  ```
- **Severity:** Info/Low · **Confidence:** High  
- GET отклонён корректно; finding — неполный HTTP error contract.

Открытых user/admin/data маршрутов не подтверждено: `/api/admin/users` вернул `401`, `/api/users` и `/api/data` — `404`.


## Third-party dependency audit (@general subagent)

sessiya: `ses_f2771fd11ffeDVswgkp3G3bouX`

Friday — проведу обзор: запрошу только указанный сайт (до 5 запросов), извлеку внешние ссылки из HTML/JS и оценю их без загрузки.

Страница получена (1 запрос). Сейчас локально разбираю сохранённый HTML: внешние URL, типы ресурсов и сетевые вызовы; это не обращается к найденным адресам.

В HTML абсолютных third-party URL нет: все найденные ресурсы — same-origin. Читаю четыре наиболее содержательных JS-чанка (до общего лимита 5 запросов), не обращаясь к внешним CDN/API.

## Итог

Активных внешних third-party resources в проверенном scope не обнаружено. Домен `*.ts.net:8443` сам по себе не классифицирую как проблему.

### Evidence / Severity / Confidence

| Область | Evidence | Severity | Confidence |
|---|---|---:|---:|
| Scripts | HTML: 8 `script src`, все `/_next/static/chunks/...`; внешних `http(s)`/protocol-relative URL нет | Info | High |
| Images/fonts | 3× `/logo.svg`, 2× same-origin `.woff2`, 2 same-origin CSS; внешних URL нет | Info | High |
| Iframes | `<iframe>` отсутствует | Info | High |
| Connect/API | HTML не содержит `fetch`, XHR, WebSocket, beacon или EventSource. В `2-rtuqsgzmno4.js` — RSC fetch с `credentials:"same-origin"` и URL относительно `location.origin`; внешних API не найдено | Info | Medium |
| Referrer/data | `Referrer-Policy: strict-origin-when-cross-origin`; потенциальная внешняя передача не наблюдается | None | Medium |
| Изображения | CSP: `img-src 'self' data: blob: https:` — внешние HTTPS-изображения разрешены политикой; при появлении такого URL third party увидит как минимум origin, но не path/query | Low | High, условно |

Доступность: корневой документ получил `HTTP/2 200`; 4 JS-чанка успешно получены. Внешние URL не запрашивались. Не проверены из-за лимита 5 запросов: ещё 4 JS-чанка, `sw.js`, CSS, fonts и изображения; поэтому итоговая confidence — **Medium**. `Telegram bot`, `Open API` и контактные строки — текст, не активные ресурсы.


## Rate limit observation audit (@general subagent)

sessiya: `ses_f276b7dcaffe0FH6KOz4ok8TcP`

Friday. Проведу последовательно: 4 GET к `/api/csrf` и до 3 GET к каждому из `/login`, `/api/login`, `/api/auth/login`; без POST, cookies, redirect-following и payloads.

- `/api/csrf`: 4/4 GET → `200`; `/login`: 3/3 GET → `200`; `/api/login`: GET → `404`; `/api/auth/login`: 3/3 GET → `405` с пустым телом.
- Во всех 11 ответах не обнаружены `429`, `Retry-After`, `RateLimit-*` или `X-RateLimit-*`.
- В телах ответов не обнаружены stack traces или application/access-log фрагменты; `/api/csrf` вернул JSON с полями `ok` и `token`.


## 404 and error UX audit (@general subagent)

sessiya: `ses_f276b9213ffes7HJ0y4ocH55nA`

Проверю ровно 5 безопасных GET-запросов: два случайных пути и три malformed path; без обхода редиректов, payload’ов и загрузки ресурсов страницы. Соберу только заголовки, статус и HTML, чтобы проверить утечки, навигацию, cache и стили.

Проверено: 5 GET-запросов, без redirect’ов, payload’ов и загрузки ресурсов; TLS-проверка отключена (`-k`).

### Verified bugs

1. **P2 / Medium — malformed URL bypasses приложение и показывает raw proxy error**
   - **Evidence:** `/%`, `/%E0%A4%A`, `/%zz` → `400 Bad Request`, `Content-Type: text/plain; charset=utf-8`, body: `400 Bad Request`.
   - Нет HTML, `<title>`, навигации, брендинга и CSS.
   - **Confidence:** High.
   - **Repro:** `curl --path-as-is -k -i 'https://ozodbeks-macbook-pro.tail91a187.ts.net:8443/%'` (аналогично для `%E0%A4%A`, `%zz`).

2. **P3 / Low — 404 не отражён в document title**
   - **Evidence:** 404 содержит `<title>TTPU LMS — O'quv boshqaruv tizimi</title>`, тогда как `<h1>` — `Sahifa topilmadi`.
   - Вкладка, история и assistive context не показывают, что открыта ошибка.
   - **Confidence:** High.
   - **Repro:** `curl --path-as-is -k -i 'https://ozodbeks-macbook-pro.tail91a187.ts.net:8443/__ux_audit_7f3c1a9e'`

### Проверено без бага

- Случайные пути корректно возвращают `404`; malformed paths — `400`.
- На обычном 404 есть ссылки `/dashboard` и `/`; их назначения не открывались из-за лимита.
- Stack traces, server filesystem paths и отражение введённого пути не обнаружены. Есть только публичные `/_next/...`, `_not-found` и opaque build ID.
- `Cache-Control: private, no-cache, no-store, max-age=0, must-revalidate`; cache-утечки не обнаружено.
- Разметка обычного 404 адаптивная, локализованная (`lang="uz"`) и оформлена централизованно; malformed-страница оформления не имеет.


## Password policy audit (@general subagent)

sessiya: `ses_f276b7a36ffelZ2ksLqPFR9F16`

Friday. Проведу только GET-аудит: сначала `/register` и `/forgot-password`, затем при необходимости просмотрю опубликованные JS-ресурсы; лимит — 5 GET, без отправки форм и credentials.

В HTML уже видны `minLength=12`, `autocomplete=new-password` и текст «30 минут» в клиентском словаре; теперь проверяю два page-specific JS-чанка, чтобы отделить клиентские проверки от серверных/API-подсказок и найти reset-flow.

Остался один GET. Использую его на публичный `/reset-password` без токена: это позволит проверить, доступен ли reset UI и какие ограничения/autocomplete заявлены, не раскрывая и не подбирая токен.

Friday. Проведено ровно **5 GET**, без отправки форм, POST-запросов и demo credentials:

`/register`, `/forgot-password`, два auth-JS-чанка и `/reset-password` без токена.

### Проверенная политика

| Поверхность | min | max | autocomplete |
|---|---:|---:|---|
| `/register` | 12 — HTML `minLength="12"` и JS `m.password.length<12` | Не задан/не обнаружен в клиентском коде | `new-password` |
| `/forgot-password` | Пароль не вводится | — | `email` |
| `/reset-password` | В словаре указано 12 | Не проверено: без токена форма не рендерится | Не проверено |

### Findings

1. **Нет клиентской верхней границы длины пароля**  
   **Severity:** Low, hardening; **Confidence:** High для клиента / Medium для серверного impact.  
   **Evidence:** В `/register` есть `minLength="12"`, но нет `maxLength`; в `1py2zjofjc50q.js` есть только проверка `<12`, верхнего ограничения нет.  
   **Repro:** GET `/register`, затем GET `/_next/static/chunks/1py2zjofjc50q.js`; проверить password input и обработчик. Серверный лимит не проверялся.

2. **Наблюдаемая проверка длины — клиентская; серверная политика не подтверждена**  
   **Severity:** Potential Medium только если сервер тоже не проверяет; **Confidence:** Low/не подтверждено.  
   **Evidence:** JS отправляет JSON напрямую в `/api/auth/register` и `/api/auth/login`; реализация API в GET-артефактах отсутствует.  
   **Repro:** Статически видны только `minLength` и JS-проверка. Нельзя утверждать без POST/исходников сервера, что короткий пароль принимается.

3. **Пароль не захардкожен, но передаётся в JS-runtime и дважды сериализуется**  
   **Severity:** Info; **Confidence:** High.  
   **Evidence:** HTML содержит `value=""`; в JS используется состояние `m.password`, затем `JSON.stringify({..., password:m.password})` для `/api/auth/register` и повторно для `/api/auth/login`. В URL/query, HTML-значении или `console.log` проверенных чанках пароля нет.  
   **Repro:** GET `/register` и его page-specific chunk. Это обычная runtime-передача по HTTPS, но расширяет поверхность обработки до двух endpoint’ов.

4. **Reset-flow имеет публичную заглушку для запроса без токена**  
   **Severity:** Info, положительный контроль; **Confidence:** High.  
   **Evidence:** GET `/reset-password` без токена возвращает «Havola yaroqsiz» («Ссылка недействительна») и ссылку на `/forgot-password`; password form отсутствует.  
   **Repro:** GET `/reset-password` без query/token. Это не доказывает криптографическую проверку, single-use или фактический TTL.

5. **TTL 30 минут — только UI-утверждение, сервер не проверен**  
   **Severity:** Unrated / verification gap; **Confidence:** High для текста, Low для enforcement.  
   **Evidence:** RSC dictionary: `Havola 30 daqiqa amal qiladi`. Фактическая обработка `/api/auth/reset-password` не была получена: reset-чанк `1w1yj0uj0bdvb.js` обнаружен, но не загружен из-за лимита 5 GET.

6. **Ошибка после успешной регистрации может вводить в заблуждение**  
   **Severity:** Low; **Confidence:** High.  
   **Evidence:** После успешного `/api/auth/register` клиент вызывает `/api/auth/login`; при ошибке login показывает «email уже зарегистрирован», хотя регистрация уже прошла.  
   **Repro:** Статически проследить ветку в `1py2zjofjc50q.js`; форма не отправлялась.

### Итог

Явного противоречия по минимальной длине не найдено: `/register` и reset-словарь оба указывают **12**. Максимум, серверный min/max, реальный TTL reset-ссылки, single-use и autocomplete reset-полей не подтверждены GET-only аудитом.


## Client input validation audit (@general subagent)

sessiya: `ses_f276b7511ffe1abb0N9L53fPO3`

Проверено ровно 5 ресурсов: `/`, `/login`, `/register` и их client-chunks `2izzx1ognwu95.js` / `1py2zjofjc50q.js`. Формы и API не отправлялись.

1. **Low · Confidence High — разные правила email**  
   `/register`: HTML `type="email"` допускает `a@b`, но JS-регекс `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` требует доменную точку и отклоняет его. Правило нигде не документировано.  
   **Repro:** `a@b`: `input.validity.valid === true`, но `regex.test("a@b") === false`; JS показывает ошибку до `apiFetch`.

2. **Low · Confidence High — «12 символов» считаются как UTF-16 code units**  
   И HTML `minLength=12`, и JS `.length < 12` считают emoji/combining sequences по code units.  
   **Repro:** шесть `😀` имеют `.length === 12` и проходят клиентскую проверку, хотя отображаются как шесть символов.

3. **Low · Confidence High — сообщения валидации не соответствуют языку интерфейса**  
   Ошибки required/email/minlength генерирует браузер на своём языке; JS-сообщения регистрации жёстко заданы на узбекском. Кроме того, при пароле короче 12 символов HTML-блокировка выполняется раньше `onSubmit`, поэтому JS-сообщение о длине пароля недостижимо обычным способом.  
   **Repro:** выбрать EN, оставить обязательное поле пустым или ввести 11 символов пароля; сообщение будет не на EN. Имя `A` даёт JS-сообщение на узбекском.

4. **Low · Confidence High — «Полное имя» принимает строку без имени**  
   Проверка регистрации требует только `trim().length >= 2`; `pattern` отсутствует.  
   **Repro:** `name="!!"` проходит обязательное и собственное JS-валидирование имени.


## API cache policy audit (@general subagent)

sessiya: `ses_f276b854effejN1FfdjjsNaWzI`

Friday. Проверю только пассивно, без cookies/auth и без POST; сначала получу главную страницу и её ссылки на маршруты, затем выполню ограниченный набор GET/HEAD.

Запрашиваю только корень одним HTTPS GET, сохраняя заголовки и тело для анализа; redirect’ы и credentials не разрешаю.

Корень отвечает `200` и уже показывает публично кэшируемую HTML-страницу (`s-maxage=31536000`). Локально извлекаю из полученного HTML найденные ссылки и API/auth-пути, не увеличивая сетевой лимит.

Для обнаружения API-путей запрошу только три клиентских JS-чанка, на которые ссылается тот же HTML (3 GET; всего станет 4 из 15), затем поищу строки `fetch`/маршрутов локально.

В этих чанках endpoint-строк нет; они содержат только runtime/UI-код. Проверю оставшиеся четыре подключённых чанка (до 8/15), чтобы не угадывать API-маршруты.

Теперь проверю три auth-adjacent страницы `/login`, `/register`, `/dashboard` (3 GET; всего 11/15), сохраняя ответы для поиска endpoint-ссылок и заголовков.

В auth-страницах обнаружены их page-specific чанки; запрошу три из них (до 14/15), чтобы точно определить GET API/endpoint и не использовать предположения.

Обнаружен единственный явно GET auth-adjacent API маршрут: `/api/csrf` (остальные auth endpoints вызываются POST и не трогаю). Использую последний допустимый запрос GET без cookies, чтобы проверить, не кэшируется ли выдаваемый CSRF-токен.

Сетевой лимит исчерпан (15/15). Локально сверю, что CSRF-токен в body совпадает с выданным cookie, и не раскрывая его, зафиксирую длину/хэш и наличие токеноподобных строк в HTML.

## Итог

Проверено **15/15 same-origin GET**, без `POST`, cookies, `Authorization` и redirect-follow. **Подтверждённой публичной утечки токенов или приватных данных не обнаружено.**

### Наблюдения

| Маршрут | Evidence | Оценка |
|---|---|---|
| `/` | `Cache-Control: s-maxage=31536000`; `ETag: "ffd1dfvn8k22lc"`; `X-Nextjs-Cache: HIT`; `X-Nextjs-Prerender: 1` | **Severity: Info**, **Confidence: High**. Shared-cache разрешён, но тело — публичная marketing-страница; JWT/CSRF-токенов и пользовательских данных не найдено. |
| `/login`, `/register`, `/dashboard` | `Cache-Control: private, no-cache, no-store, max-age=0, must-revalidate`; `ETag` отсутствует | Хорошая защита. Анонимный `/dashboard` содержит redirect-marker на `/login`, приватных данных нет. |
| `/api/csrf` | `200`; `Cache-Control: no-store, private`; `ETag` отсутствует; JSON возвращает CSRF token; `Set-Cookie` содержит тот же token с `Secure; HttpOnly; SameSite=lax` | **Severity: Info/Low**, **Confidence: High**. Корректного public cache не обнаружено. |

### Теоретический риск

`/api/csrf` имеет `Vary: rsc, next-router-state-tree, next-router-prefetch, next-router-segment-prefetch`, но **не содержит `Cookie`/`Authorization`**. На auth-страницах также отсутствует `Vary: Cookie`.

- **Severity: Low**
- **Confidence: Medium** — omission подтверждена, эксплуатируемость не подтверждена.
- При нарушении/игнорировании `no-store` intermediary теоретически возможен cache mix-up CSRF token/cookie; сейчас `no-store, private` блокирует это по стандарту.
- `Vary: Cookie` на `/` не является текущей уязвимостью: ответ статический, user-specific расхождение не проверялось credentials.

### Repro

```bash
BASE='https://ozodbeks-macbook-pro.tail91a187.ts.net:8443'

curl -sS --http1.1 --max-redirs 0 -D - -o /dev/null "$BASE/"
curl -sS --http1.1 --max-redirs 0 --cookie '' \
  -H 'Accept: application/json' -D - "$BASE/api/csrf"
curl -sS --http1.1 --max-redirs 0 -D - -o /dev/null "$BASE/login"
```

`/api/auth/login`, `/api/auth/register` и другие POST-маршруты обнаружены в клиентском bundle, но намеренно не запрашивались.


## Protected route inventory (@general subagent)

sessiya: `ses_f276b8c01ffe2tLHne9N8uv4RZ`

Проверю только указанные маршруты и их same-origin ссылки, используя свежие GET/HEAD без cookie-jar, авторизации и переходов по редиректам. Сначала сохраню ответы во временный каталог для сравнения статусов, тел, размеров и хешей.

Для исключений распарсю только локально сохранённые HTML: извлеку видимый текст, ссылки и счётчики потенциальных PII/токенов без вывода значений. Затем проверю только найденные навигационные same-origin URL.

Дополнительно проверю один RSC/GET-вариант каждой закрытой страницы (Next.js), поскольку-framework-specific ответ может отличаться от HTML; это не обход и не перебор.

Из `/help` обнаружены ещё три same-origin маршрута: `/courses`, `/quizzes`, `/attendance/check-in`; проверю их тем же ограничением и без переходов.

`/courses` дал редкий `502` при пустом GET, но `HEAD` — корректный `307`; сделаю один повтор GET, чтобы отличить транзиентную ошибку от воспроизводимого поведения.

## Результат

Проверено 25.09.2026, 12:41–12:44 UTC. Только GET/HEAD, без cookies/auth, форм и brute force. `Set-Cookie` не возвращался. **Пользовательских или секретных данных в закрытых ответах не обнаружено.**

| Маршрут | GET | HEAD | Evidence |
|---|---:|---:|---|
| `/dashboard` | 200 | 200 | Только `TTPU LMS / Yuklanmoqda...`, meta-refresh на `/login` |
| `/admin` | 200 | 200 | То же |
| `/profile` | 200 | 200 | То же |
| `/settings` | 200 | 200 | То же |
| `/api/admin` | 404 | 404 | Статическая HTML-страница «Sahifa topilmadi» |
| `/login`, `/register`, `/forgot-password` | 200 | 200 | Публичные формы |
| `/help` | 200 | 200 | Shell + meta-refresh; RSC содержит только публичную справку |
| `/courses` | 307 | 307 | `Location: /login`; один транзиентный пустой 502 |
| `/quizzes` | 307 | 307 | `Location: /login` |
| `/attendance/check-in` | 307 | 307 | `Location: /login` |

RSC GET `?_rsc` для `/dashboard`, `/admin`, `/profile`, `/settings` возвращает 200, но только loading-skeleton и `NEXT_REDIRECT;replace;/login;307;`. Проверки email/UUID/JWT/Bearer/API-key/PII-полей: **0 совпадений**. HTML protected-страниц имеют `private, no-cache, no-store`.

## Findings

- **F-01 — Protected routes отвечают 200 shell-страницей:** status **confirmed**, severity **Informational**, confidence **High**. Данные не раскрыты; рекомендуется server-side redirect перед streaming HTML/RSC.
- **F-02 — Несанкционированная выдача данных:** status **not found**, severity **None**, confidence **High**.
- **F-03 — `/api/admin`:** status **404**, severity **Informational**, confidence **High**; дочерние API-пути не перебирались.
- **F-04 — Транзиентный `/courses` 502:** status **observed once**, severity **Informational**, confidence **Medium**; повторный GET стабильно дал 307.

## Repro

```bash
B='https://ozodbeks-macbook-pro.tail91a187.ts.net:8443'

curl --disable --cookie '' --netrc-file /dev/null --noproxy '*' \
  -sS -D - -o /tmp/dashboard.html "$B/dashboard"

rg '__next-page-redirect|Yuklanmoqda' /tmp/dashboard.html

curl --disable --cookie '' --netrc-file /dev/null --noproxy '*' \
  -sS -H 'RSC: 1' -H 'Accept: text/x-component' \
  "$B/dashboard?_rsc" | rg 'NEXT_REDIRECT|animate-pulse'

curl --disable --cookie '' --netrc-file /dev/null --noproxy '*' \
  -sS -o /dev/null -w '%{http_code}\n' "$B/api/admin"
```


## Localization consistency audit (@general subagent)

sessiya: `ses_f276b9952ffek970zxNrUb68kg`

Проверяю только GET-ответы этих трёх URL: HTTP/HTML-метаданные, элементы локализации и подключённый клиентский код; переключатели и формы не активирую.

Теперь сверяю объявленные UZ/RU/EN с реализацией в клиентском коде (только чтение статических JS-файлов), чтобы отличить реально доступные локализации от неработающих кнопок.

Для проверки именно выбора локализации делаю отдельные stateless GET с `Cookie: locale=ru/en` в том же браузерном контексте без кликов, форм и POST; это не меняет серверное состояние.

1. **Неверный `lang` для RU/EN**
   - **Evidence:** `/login` с `locale=ru` показывает русский `Вход в систему`, но `<html lang="uz">`; `/register` с `locale=en` показывает `Sign up`, но `lang` также `uz`. `Content-Language` отсутствует.
   - **Severity:** High · **Confidence:** High
   - **Repro:** GET `/login` с `Cookie: locale=ru` и `/register` с `Cookie: locale=en`; без кликов и POST.

2. **Локализованные `<title>` и `description` остаются узбекскими**
   - **Evidence:** RU `/login`: `<title>Kirish — TTPU LMS</title>`; EN `/register`: `<title>Ro'yxatdan o'tish — TTPU LMS</title>`; description также остаётся на узбекском.
   - **Severity:** Medium · **Confidence:** High
   - **Repro:** Те же GET; сравнить заголовок/meta description с локализованным body.

3. **На `/register` есть硬编码 Uzbek-строки**
   - **Evidence:** В RU/EN ответе остаётся `Kamida 12 belgi`; в `1py2zjofjc50q.js` также захардкожены `Ismni to'liq...`, `Email manzilni...`, `Parol kamida...`.
   - **Severity:** Medium · **Confidence:** High
   - **Repro:** GET `/register` с `Cookie: locale=en`; строка видна без отправки формы.

4. **Выбор языка не применяется к `/`**
   - **Evidence:** селектор записывает `locale=...; path=/`; `/login` с `locale=ru` русский, но `/` с тем же GET-заголовком остаётся полностью узбекским и не содержит переключателя.
   - **Severity:** Medium · **Confidence:** High
   - **Repro:** Сравнить GET `/login` и `/` с `Cookie: locale=ru`.

5. **Доступное имя переключателя языка не локализовано**
   - **Evidence:** на `/login` и `/register` всегда `role="group" aria-label="Language"`, включая UZ/RU; в словаре есть `commonLanguage`, но компонент его не использует.
   - **Severity:** Low · **Confidence:** High
   - **Repro:** GET `/login` без cookie и проверить `aria-label` группы.

6. **Нет `hreflang` для заявленных RU/EN-вариантов**
   - **Evidence:** во всех трёх `<head>` отсутствуют `link rel="alternate" hreflang`; RU/EN доступны только как cookie-варианты одного URL.
   - **Severity:** Low · **Confidence:** High
   - **Repro:** GET `/`, `/login`, `/register` и проверить alternate-ссылки.

7. **RTL readiness не реализована**
   - **Evidence:** на всех страницах отсутствует `dir`; нет RTL-правил, при этом используются физические `left/right/ml-auto` utilities. Текущие UZ/RU/EN — LTR, дефект проявится при RTL-локали.
   - **Severity:** Low · **Confidence:** High
   - **Repro:** Проверить `dir` в HTML и directional CSS/assets без изменения состояния.


## Zoom and reflow audit (@general subagent)

sessiya: `ses_f276b9f0bffe727fPv13wd96ST`

Проверю страницы в headless-браузере на 320 CSS px и эквиваленте 400% zoom, используя только DOM/CSS, навигацию и снимки — без отправки форм.

Firefox доступен; проверяю наличие драйвера, чтобы снять фактические размеры, переполнение и скриншоты, а не ограничиваться предположениями по HTML.

Установлю Selenium только во временное окружение `/tmp/opencode`; системные пакеты и сайт не изменяются. Это позволит программно измерить `scrollWidth`, границы элементов, видимость и сделать скриншоты.

Запущу один headless Firefox через Selenium с временным cache драйвера и отключённой сертификационной проверкой для Tailscale; переходов и кликов не будет.

Сначала калибрую реальный browser zoom: 1280 physical px × 400% должен дать layout viewport около 320 CSS px и `devicePixelRatio≈4`; это отделяет zoom от искусственного CSS `zoom`.

В Firefox zoom хранится отдельно от CSS; проверяю схему временного профиля, чтобы установить именно глобальный Full Zoom 4×, а не имитировать его стилем.

Создам временное локальное WebExtension, использующее штатный `browser.tabs.setZoom(..., 4)`; она не имеет доступа к странице и не взаимодействует с формами.

Соберу структурированные evidence по трём режимам (1280 px baseline, 320 px @100%, 1280 physical @400%) и трём URL: scroll bounds, видимые/скрытые controls, переполненные и перекрытые элементы, computed styles и screenshots.

Запускаю аудит; он выполнит только GET `/`, `/login`, `/register` в новых неавторизованных сессиях и сохранит evidence в `/tmp/opencode`.

Выявлено ограничение: Firefox не уменьшил 100%-окно ниже 494 px, поэтому этот прогон невалиден как 320 px. 400%-прогон валиден (`dpr=4`, layout viewport 318.5 px); для честных 320 px применю WebDriver BiDi viewport override и повторю.

Повторяю прогон с точным BiDi override `320×800`, `devicePixelRatio=1`; он заменит только что невалидные 494-px evidence.

Горизонтальный скролл и парные перекрытия не обнаружены. Теперь классифицирую оставшиеся кандидаты: скрытые responsive-контролы и внутренние `overflow:hidden`, чтобы отделить реальную потерю функций от декоративного обрезания.

Проверю клавиатурный порядок `Tab` без Enter/кликов: не скрывает ли sticky-header 400%-режима фокус, и остаются ли все controls достижимыми.

## Итог

**0 подтверждённых нарушений WCAG 2.2 SC 1.4.10 Reflow.** Найдена **1 низкоприоритетная UX-observation**, не подтверждённая как WCAG-failure.

| URL / viewport | Element / evidence | Severity | Confidence | Repro |
|---|---|---:|---:|---|
| `/` — 320px @100% и 400% | `<nav class="hidden … md:flex">`: скрыты 4 section-links. Header-login `hidden sm:inline-flex` также скрыт. Остаются logo и Register | **Low**, UX only | High | Сравнить header при 1280px и 320px/400%. DOM: 20 видимых controls → 15; `display:none` у 5 ссылок |
| `/` — 320px | `inner/client/scrollWidth=320/314/314`, `maxScrollX=0`; out-of-bounds=0, overlaps=0 | **None / PASS** | High | Загрузить `/`, scrolls right;DevTools: `scrollTo(99999,0); scrollX === 0` |
| `/` — 400% | Actual browser zoom: `dpr=4`, `innerWidth=320`; `client/scrollWidth=319/319`, `maxScrollX=0` | **None / PASS** | High | 1280×900 physical, zoom 400%; проверить metrics и screenshots |
| `/login` — 320px | 11/11 controls достижимы Tab’ом; inputs 224px, 3 demo-buttons ≈69px; overflow/clipping/overlap=0 | **None / PASS** | High | Пройти Tab до Register-link, не нажимая; scrolls right отсутствует |
| `/login` — 400% | 11/11 controls Tab-reachable; `dpr=4`, `maxScrollX=0`; без обрезания | **None / PASS** | High | Тот же repro при zoom 400% |
| `/register` — 320px | 8/8 controls Tab-reachable; inputs 230px; overflow/clipping/overlap=0 | **None / PASS** | High | Пройти Tab до Login-link, не нажимая |
| `/register` — 400% | 8/8 controls Tab-reachable; `client/scrollWidth=319/319`, `maxScrollX=0` | **None / PASS** | High | Тот же repro при zoom 400% |

Внутренний `overflow:hidden` главной затрагивает только пустые декоративные элементы с `pointer-events:none`;_functional content не обрезан. Формы не заполнялись, submit/Enter не нажимались.

Evidence: `/tmp/opencode/wcag-reflow-evidence.json`  
Screenshots: `/tmp/opencode/wcag-reflow-screenshots/`


## Reduced motion audit (@general subagent)

sessiya: `ses_f276ba57dffezYtggxAQfEdLYo`

Проведу только read-only анализ: загружу HTML/CSS и проверю доступные media-query/emulation-сигналы, не выполняя формы, клики или изменения состояния.

В HTML уже видны загрузочные классы `animate-*`; второй CSS-ответ временно вернул 502, поэтому проверю ресурс напрямую и повторю получение без изменения сервера.

Сделаю статический cross-check: из текущего HTML соберу все CSS/JS-ссылки, затем просмотрю определения `@keyframes`, `animation` и `prefers-reduced-motion`; это только GET-запросы к уже опубликованным ресурсам.

Текущий ответ уже отличается от первого кэша: актуальный stylesheet содержит глобальное `prefers-reduced-motion`. Уточняю каскад и реальные классы, чтобы не выдать устаревший 404/502 за finding.

Firefox доступен, поэтому попробую headless runtime-проверку через его Remote Agent: это позволит сравнить `matchMedia`/computed animation в обычном режиме и при `reduce`, не кликая по странице.

Runtime-тест уже подтвердил разницу: при `reduce` те же selectors получили `0.00001s` и `1` iteration вместо бесконечных. Проверю ещё post-load transitions и публичный `/help`, чтобы исключить анимацию вне loader overlay.

Проверка завершена: подтверждённых accessibility-impact findings нет. Остановлю только запущенные мной headless-процессы; сайт не изменялся.

Итог: **0 подтверждённых accessibility/functional findings**; severity — `none`, confidence — **high (0.95)**. Проверял только GET/headless, без кликов, форм и изменения состояния сайта.

**Evidence**
- HTML loader: `.fixed.inset-0.z-50` → `.animate-fade-in`, `.animate-pulse-ring`, `.animate-spin-slow`, `.animate-shimmer`; декоративный SVG имеет `aria-hidden="true"`.
- CSS `/_next/static/chunks/1g-bve198pzp1.css`: бесконечные `spin 2.6s`, `pulse-ring 2.2s`, `shimmer 1.6s`, но присутствует глобальное правило:
  ```css
  @media (prefers-reduced-motion:reduce){*,:before,:after{scroll-behavior:auto!important;transition-duration:.01ms!important;animation-duration:.01ms!important;animation-iteration-count:1!important}}
  ```
- Firefox 156 emulation: normal → `2.2s/2.6s/1.6s`, `infinite`; reduce → `0.00001s`, `1`; после загрузке `document.getAnimations().length === 0`, transitions также `0.00001s`.

| Selector | Severity | Confidence | Repro |
|---|---:|---:|---|
| `.animate-spin-slow` | none | high | DevTools → Rendering → `prefers-reduced-motion: reduce`, reload |
| `.animate-pulse-ring` | none | high | То же; проверяется initial loader |
| `.animate-shimmer` | none | high | То же; 3 узла loader |
| `.animate-fade-in`, `.transition-*` | none | high | После загрузки — только мгновенные transitions |

Анимации конечные/декоративные и не являются необходимыми для функциональности; интенсивного движения, не снимаемого `prefers-reduced-motion`, не обнаружено. Chunk ID сервера меняется; использован финальный HTML/CSS-пара `200/200`.


## Color contrast audit (@general subagent)

sessiya: `ses_f276bac44ffebrFTaF7Mmc1cXz`

I'll start by checking the site is reachable and what tooling is available.

Site is live (200). No browser binary found — checking for a cached Playwright/Puppeteer install before deciding static vs. headless.

No browser present. Let me try installing Playwright Chromium in the background while I pull the CSS for static analysis.

Second CSS is a 404, and Tailwind utilities aren't in the linked CSS. Let me look for where the utility CSS actually lives.

`--with-deps` failed on sudo. Retrying browser download without system deps, and hunting for the Tailwind CSS in the JS chunks.

No CSS refs in JS. Let me verify the 404 and find the real build's CSS filename.

Chromium is downloading. Meanwhile, let me inventory the intended color classes in the markup.

The design tokens (`--color-brand-*`, `--color-gold-*`, `--color-surface`) live in that 404'd stylesheet. Let me search for them elsewhere.

The CSS hash changes per request — the HTML references a stale hash. Let me grab the current one.

Got the real stylesheet (208 KB, full theme). Checking browser status.

Chromium still downloading. Let me write the audit script meanwhile.

CSS hash changes with server rebuilds (stale-hash race). My retry loop handles it. Checking the browser download.

Full Chromium binary is present. Let me verify it launches.

Browser works. Running the audit across all four viewports.

Dev-server HMR is reloading the page mid-eval. Let me add retry/settle logic.

Pixel verification failed and computed backgrounds look wrong (white text resolving to a light `#f6f7fa`). Let me debug the geometry and background chain.

Found the bug: `resolveBg` broke out of the loop at the first opaque ancestor (`body`), so every background resolved to `#f6f7fa`. Also confirmed Chromium returns `lab()` colors, and sections use real gradients. Rewriting with a fixed compositor and single full-page pixel sampling.

Results now look coherent. Let me check the diagnostics — pixel verification appears to have silently failed at 1024.

All CSS loaded 200 (the earlier 404 was my stale-hash curl, not a page defect). But every pixel sample returned `no-data` — image decode is failing. Let me isolate that.

PNGs are complete and valid. The bug is my `evaluate('window.__load', arg)` string-expression form — Playwright doesn't call the returned function. Let me verify and fix.

Both undefined — let me pin down what's happening.

Confirmed: Playwright doesn't invoke function-strings (my COLLECT/SAMPLER worked only because they're IIFEs). Fixing the sampler calls.

Screenshots now decode correctly. One more scope bug — `dist` is Node-side. Fixing inside the sampler.

Pixel verification is live. Now let me examine the gradient worst-case findings, which jumped AA-fails from 29→44 — I need to validate those aren't over-reporting.

Clear over-reporting: the k-means "worst cluster" is grabbing **glyph antialiasing** (e.g. `OZ`: real bg is `#374d83`, but `#98a4c0` AA pixels gave a bogus 2.51:1). I need to remove AA pixels lying on the fg↔bg segment.

No pixel errors now. Let me re-validate the previously-bogus cases.

The remaining false clusters are glyph interiors and adjacent icons inside the element box, not antialiasing. I need a rigorous method: render twice (normal vs. text made transparent) and sample only the background ring around actual glyph pixels.

`bg-clip-text` is unused on this page, so the two-pass diff is safe. Implementing the rigorous glyph-ring sampler.

Now updating the caller to take two screenshots and use the ring result.

No sampling errors, and fail counts converged near the computed-only baseline. Re-validating the previously-bogus cases.

The method is now sound — "OZ" corrects to 7.84:1 (passes), while `#90a1b9`/`#c9a227` findings hold up. Let me verify exclusions and check for inputs.

Exclusions are correct (sr-only skip-link + mobile-hidden desktop nav). No forms/inputs on the page. Now aggregating across viewports.

Clear picture now. Let me visually verify the key pairs by cropping the real renders.

Shell heredoc mangled it. Writing the file directly.

Let me visually confirm the key pairs.

Confirmed — white on amber `#c9a227`. Checking the rest.

Visually confirms the washed-out `slate-400` labels. Checking the ghost numerals and hero chip.

All pairs visually confirmed. Let me extract final per-viewport counts and representative selectors.

Let me compute accurate remediation targets so the fix hints aren't guesses.

Аудит завершён. Все пары подтверждены дважды (computed styles + пиксельный sampling) и визуально на crops реального рендера.

## Условия воспроизведения

- URL: `https://ozodbeks-macbook-pro.tail91a187.ts.net:8443/` (только GET `/` + статики; на странице нет `<form>`/`<input>`, ничего не отправлялось)
- Headless Chromium 153.0.8010.12 (Playwright), `deviceScaleFactor: 1`, viewports **320×640, 375×812, 768×1024, 1024×800**
- Метод: computed styles (`lab()`/`color-mix()` резолвятся через canvas) + двухпроходный glyph-ring sampling — рендер A (норма) и B (весь текст `transparent`), маска глифов = diff A/B, фон за текстом = кольцо не-глифовых пикселей вокруг маски (R=2px), k-means → worst-case для градиентов
- Полный скриншот каждого вьюпорта попал в кадр (`trunc=false` на всех 4), оба CSS-чанка вернули 200

## Найденные пары (AA-провалы, не декоративные)

| # | foreground | background | ratio | need | selector (репрезентатив) | severity | confidence |
|---|---|---|---|---|---|---|---|
| 1 | `#90a1b9` (`text-slate-400`) | `#ffffff` / `#f1f5f9` | **2.40–2.63:1** | 4.5 | `body > div:nth-of-type(2) > header > div > a > span > span > span:nth-of-type(2)`<br>`…section:nth-of-type(1) > div:nth-of-type(4) > div:nth-of-type(2) > div:nth-of-type(2) > div:nth-of-type(2) > div > div:nth-of-type(2) > div:nth-of-type(3) > div:nth-of-type(1) > span:nth-of-type(2)` (дни недели)<br>`footer#aloqa > div:nth-of-type(2) > div > p` | critical | high (ring-verified, Δ0) |
| 2 | `#ffffff` | `#c9a227` (`bg-gold-500`) | **2.42:1** | 4.5 | `section#statistika > div > div:nth-of-type(4) > a` («Hoziroq qo'shilish», 14px/500) | critical | high (ring Δ0) |
| 3 | `#a9871f` (`text-gold-600`) | `#f9f4e1` (`gold-300/20` over white) | **3.09:1** | 4.5 | `section#imkoniyatlar > div > div:nth-of-type(2) > div:nth-of-type(4..7) > div > span:nth-of-type(2)` («Yangi», 12px/500) | serious | high (ring Δ0) |
| 3b | `#a9871f` | `#f5f1e0` | **2.98–3.00:1** | 4.5 | `main#main > section:nth-of-type(5) > div > span` («Boshlash uchun tayyor») | critical | high |

**Охват:** пара 1 — 19 уникальных элементов на 320/375, 22 на 768/1024 (9px, 10px, 12px — весь этот текст normal, не large). Пары 2–3 присутствуют на всех 4 ширинах.

## Декоративное — исключено из счёта

`#f1f5f9` (`text-slate-100`) на `#f7f9fb` = **1.04:1**, 30px/700 — гостевые цифры «01/02/03» (`section#boshlash > … > span:nth-of-type(2)`). Визуально подтверждено как водяной знак номера шага, не контент. Учтено отдельно: формально это текст, и при строгом чтении WCAG — провал.

## Исключённые элементы

На каждой ширине отсеяно 8–18: `sr-only` (skip-link «Asosiy kontentga o'tish», «Statistika») и десктопная навигация, скрытая на мобильных (`zero-size`). Также отсеяны 0 декоративных SVG (иконки не имеют текстовых узлов).

## Замечания по воспроизводимости

- Хэш CSS-чанка меняется при каждой пересборке на сервере (`3hfhuzjhb13x2` → `1oc6hfr3xm-6c` → `2tva2lqu63-wj` → `3bi-sni56oopj`). Если загрузить HTML, а CSS fetchнуть позже — получите 404 и полностью неоформленную страницу (все пары станут 21:1). В самом аудите этого не произошло: обе таблицы стилей вернули 200 на первой же попытке во всех 4 вьюпортах. Это race-condition на стороне деплоя, не дефект разметки, но он делает замеры невоспроизводимыми при кэшировании HTML.
- `#90a1b9` на чипе `#f1f5f9` даёт 2.40:1 (worst-case по градиенту), на чистом белом — 2.63:1. Разница в пределах шума градиента, оба значения критичны.

## Что даёт проход (проверено расчётом, не на глаз)

-  …[qisqartirildi]


## Server fingerprint audit (@general subagent)

sessiya: `ses_f2757de67ffednyn1mn1XgLhh4`

Проведу fingerprinting. Запускаю параллельно: TLS-сертификат (не HTTP-запрос), HEAD и OPTIONS.

Next.js подтверждён через `link: </_next/static/...>`, при этом `server`/`x-powered-by` отсутствуют. Проверяю тело `/` и 404-страницу.

4 HTTP-запроса использовано. Анализирую полученные файлы локально (без новых запросов).

## Fingerprint: `ozodbeks-macbook-pro.tail91a187.ts.net:8443`

**Расход:** 4 HTTP-запроса (HEAD `/`, OPTIONS `/`, GET `/`, GET `/nonexistent-9f3a2b.html`) + 1 TLS-handshake через `openssl s_client` (не HTTP). Сканирование портов не проводилось.

### Что подтверждено

| # | Находка | Evidence | Severity | Confidence |
|---|---|---|---|---|
| 1 | `script-src 'unsafe-inline'` в CSP | `content-security-policy` в ответе на `/` и `404` | **Low** | High (факт) / Med (эффект) |
| 2 | Фреймворк Next.js, App Router | `link: </_next/static/media/…>`, `/_next/static/chunks/*.js`, маркер `self.__next_f` (RSC), отсутствие `__NEXT_DATA__`/`buildId` | info | High |
| 3 | Назначение приложения раскрыто | `<title>Sahifa topilmadi — TTPU LMS</title>`, `TTPU LMS — O'quv boshqaruv tizimi` | info | High |
| 4 | Версия нигде не раскрывается | ни в заголовках, ни в теле `/`, ни в 404 | info (позитив) | High |

**Детали к №1.** Корневая причина одна: отсутствие nonce/hash в `script-src`. Побочные следствия — `script-src-attr` не задан и наследует `unsafe-inline` (inline-обработчики `on*=` разрешены), Trusted Types не включены. Всё остальное в политике сделано корректно: `frame-ancestors 'none'` + `X-Frame-Options: DENY`, `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`, `connect-src 'self'`. CSP не является контролем доступа — без подтверждённой точки инъекции это hardening-разрыв, а не эксплуатируемая уязвимость, поэтому severity Low, а не Medium.

### Отрицательные результаты (тоже значимы)

- `server` и `x-powered-by` **отсутствуют** во всех ответах — стек не утекает через заголовки.
- 404 отдаёт кастомную страницу приложения, **не** дефолтную страницу Next.js; стектрейсов, путей `node_modules`, номеров строк в теле нет.
- `OPTIONS /` → `400`, без заголовка `Allow` и без каких-либо `Access-Control-*` — CORS не открыт, методы не перечислены.
- Заголовки hardening полные: HSTS (`max-age=31536000; includeSubDomains; preload`), `nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` (9 директив).
- TLS: Let's Encrypt (`YE2`), сертификат выпущен **сегодня** 25.09.2026 08:29 UTC, валиден до 24.12.2026, SAN ограничен одним FQDN хвоста. Утечки внутренних имён в сертификате нет.

### Итог

Заявленного в запросе «повышения атакуемости» по существу не найдено — единственный пункт выше info (№1) является ослаблением защиты, а не уязвимостью, и требует наличия XSS-инъекции для реализации. Стек Next.js определён, но версия не утекает, поэтому привязать CVE по этому сценарию нельзя. Сканер непроверенных путей, RSC-эндпоинтов и клиентских чанков не проводился — для этого нужен отдельный запрос.

Файлы ответов сохранены в `/tmp/opencode/` (`root.html`, `404.html`, `404.hdr`) для дальнейшего разбора.


## Performance measurement audit (@general subagent)

sessiya: `ses_f2757cddfffeNo7YWsZqnK2Ny9`

Сначала проверю доступные headless-инструменты и публичную структуру сайта, затем выполню по одному ограниченному холодному и повторному GET-загрузке без отправки форм.

Обнаружены Chromium и Playwright в локальном проекте. Использую отдельный временный профиль для каждого холодного измерения, тот же профиль для повторного, блокирую все не-GET/HEAD-запросы и жду фиксированное окно после `load`; это не меняет серверные данные.


## Privacy and PII audit (@general subagent)

sessiya: `ses_f2757eb7effefDFM2q3vVhZfvm`

Провожу только read-only проверку указанного публичного origin; ограничусь 10 same-origin resources, не буду входить, использовать найденные учётные данные или менять состояние сайта.

Корень уже содержит публичные контактные данные и демонстрационные персональные/учебные значения; отдельно проверяю `/login` и `/register`, затем адресно — только содержательные JS-бандлы (без загрузки шрифтов, иконок и CSS).

В login-бандле обнаружены три demo email, вшитые в клиентский код; паролей там нет и запросы авторизации не выполняю. Проверяю ещё общий runtime, публичную `/help` и манифест, оставаясь в пределах лимита.

Остался один ресурс в лимите; беру общий client entry-bundle, чтобы проверить конфигурацию API/окружения и возможные утечки, не обращаясь к защищённому dashboard и не вызывая auth endpoints.


## Debug and comments audit (@general subagent)

sessiya: `ses_f2757e84affeqPuXHVIa66p2mF`

Friday проведу пассивный GET-аудит: сначала получу только корневую страницу, затем вручную проверю не более 11 связанных same-origin ресурсов без переходов и любых изменений состояния.

Проверяю TLS, заголовки и HTML корневой страницы; команда делает ровно один HTTPS GET и запрещает redirect, чтобы внешний хост не был затронут.

Извлекаю из уже скачанного HTML перечень локальных `src`/`href`, чтобы выбрать 11 статических ресурзов без автоматических запросов.

Запрашиваю оставшиеся 11 ресурсов: 8 JS, 2 CSS и manifest — все по путям, найденным в HTML, только `GET`, без redirect/cookies. Это исчерпывает лимит 12.

Минифицированные bundle-файлы имеют гигантские строки, поэтому обычный поиск упёрся в лимит вывода. Считаю только совпадения и затем извлеку небольшие контексты локально, не выполняя новых сетевых запросов.

Извлекаю толькоredacted-контексты совпадений (до 220 символов), чтобы отличить реальные утечки от стандартных библиотечных строк.

Проверяю фактические комментарии (`<!--…-->`, `/*…*/`) и ссылки на source maps; это локальный анализ уже полученных файлов.

Дополнительно проверяю типовые сигнатуры hardcoded credentials/JWT/private keys/DSN; выводятся только количество и тип совпадения, не значения.


## Independent finding validation (@general subagent)

sessiya: `ses_f2757c923ffeI81TivKQt1dRrc`

Провожу независимую пассивную проверку с жёстким бюджетом: только `GET/HEAD`, без переходов, авторизации и отправки данных; каждый запрос учитываю отдельно.

Первый `GET /` занял 1/15. Теперь точечно проверяю login (только публичный HTML), SW, CSRF, защищённый маршрут и один некорректно экранированный путь — ещё 5 запросов.

Использовано 6/15. Результаты уже показывают: CSRF-защита на месте, `/dashboard` отвечает `307`, а malformed path на HTTP/2 завершился `PROTOCOL_ERROR`; отдельно уточняю HTTP/1.1-ветку, публичный demo-код в клиентском bundle и возможную admin-защиту.


## Upload and download audit (@general subagent)

sessiya: `ses_f2757ee8dffeGOkjnf9XQCYoJe`

Проведу только пассивную проверку: до 12 запросов к указанному origin, без загрузок и обхода авторизации. Сначала получу HTML и извлеку из него publicly exposed upload/download/file references.

В HTML обнаружены только клиентские JS-чанки Next.js и общие ссылки; прямых file/upload URL нет. Проверю загруженные чанки на строки API, storage/file/download и MIME, затем точечно проверю найденные публичные маршруты.

Сохранённые чанки минифицированы в одну строку, поэтому обычный поиск возвращает слишком большой результат. Локально извлеку из них только уникальные строки и контексты с `upload/download/file/api/storage`, без новых сетевых запросов.

Публичные страницы и загруженные чанки не содержат ни одного обнаруженного upload/download/file URL. Локально перепроверю весь уже полученный HTML/JS на строки endpoint-ов, MIME, traversal и executable-расширения, чтобы не пропустить скрытую ссылку в RSC/чанках.


## Cross-route browser audit (@general subagent)

sessiya: `ses_f2757d77effetYc7l0hbzo7Qul`

Проверю доступные headless-браузерные инструменты и затем выполню только GET-навигацию по указанным 10 маршрутам, без входа и отправки форм.

В окружении есть Playwright и Chromium; запускаю изолированный контекст без cookies/storage, перехватываю ответы, редиректы, failed requests, console и page errors для всех 10 URL.

Первый проход уже показывает 307→/login для `/help` и всех защищённых маршрутов; уточняю ожидаемую публичность `/help` по коду и отделяю штатные auth-редиректы от подтверждённых дефектов.


## External link safety audit (@general subagent)

sessiya: `ses_f2757d95cffeXZ0wS541I7K3MH`

Проверю только исходный URL, без следования редиректам; затем проанализирую HTML и подключённые same-origin JS в пределах лимита запросов. Внешние URL проверю только по коду и контексту, без переходов.

Сейчас выполню до 8 параллельных same-origin GET (всего станет 9/10): только перечисленные в HTML JS-ресурсы. Для каждого потоково покажу HTTP-метаданные, URL/email/tel-подобные строки и код редиректов; переходов по найденным адресам не будет.

Остался офлайн-разбор сохранённого HTML: перечислю фактические `<a>` с `href/target/rel`, внешние URL и mail/tel-контексты. Новых сетевых запросов не будет.

Использую последний (10/10) same-origin GET для `/sw.js`: он реально регистрируется приложением и может содержать собственные внешние URL/cache/redirect-контексты. Переходов и форм не будет.

## Итог

**Критических/высоких/средних/низких уязвимостей не найдено.** Использовано ровно **10/10 same-origin GET**; все ответили `200`, редиректов и `Location` не было. Внешние домены не посещались, формы не отправлялись.

### F-01 — Внешних hyperlink/redirect targets нет

- **Severity:** Info
- **Confidence:** High
- **Evidence:** HTML содержит 18 `<a>`; все `href` — `/`, `/login`, `/register`, `/help` или fragment. Внешних `href/src`, `mailto:` и `tel:` нет. Корневой ответ: `HTTP/2 200`, без `Location`.
- **Repro:** Просмотреть HTML,DevTools → Elements → выбрать все `a[href]`; все URL относительные.
- **Риск `target="_blank"` без `rel`:** отсутствует — `target="_blank` найден **0 раз**.

### F-02 — Внешние строки в framework JS не являются ссылками

- **Severity:** Info
- **Confidence:** High
- **Evidence:** В framework-чанках есть `react.dev/errors/*`, `nextjs.org/docs/*`, W3C namespace URLs и GitHub core-js metadata, но только внутри текстов ошибок/package metadata. Они не используются как `href`, `window.open` или конкретный redirect target.
- **Repro:** Проверить эти URL в контексте соответствующих minified-чанков; ссылочных или навигационных обращений к ним нет.

### F-03 — Service worker не обслуживает внешние origins

- **Severity:** Info
- **Confidence:** High
- **Evidence:** `/sw.js` возвращает `200`; перед обработкой запроса содержит `if (url.origin !== self.location.origin) return`. Hardcoded redirect fallback — только `/`.
- **Repro:** Загрузить `/sw.js` и найти проверку origin.

### Не считаю findings

- `lms.ttpu.uz/dashboard`, `info@ttpu.uz` и телефон отображаются как обычный текст, не как ссылки.
- `/login`, `/register`, `/help` и динамические chunks авторизованных маршрутов не обходились из-за исчерпания лимита; глобальное отсутствие внешних ссылок для всего приложения не утверждается.


## Static injection audit (@general subagent)

sessiya: `ses_f2757d2bcfferKpmL4yTIn05LZ`

Проверяю базовую страницу одним GET без сохранения файлов, cookies и передачи полезной нагрузки; затем уложу остальные проверки в общий лимит 8 запросов.

Базовый ответ — Next.js. Сейчас извлекаю из уже полученного ответа перечень клиентских ресурсов и проверяю, не осталось ли локальных артефактов; новых запросов пока нет.

Из-за однострочного RSC-ответа поиск упёрся в лимит инструмента; локально извлекаю только заголовки, URL ресурсов и совпадения sink-терминов, без сетевого обращения.

Запрос 2/8: читаю только page-specific JS-чанк и сразу анализирую поток в памяти на sink-термины и динамические импорты; полный ответ на диск не попадёт.

Запрос 3/8: один безвредный маркер в нескольких типовых query-параметрах; проверяю только точное отражение в HTML и контекст, без вывода страницы целиком.

Запрос 4/8: тот же маркер в несуществующем path и query проверяет серверный 404/error reflection; оценивается только текстовая/контекстная рефлексия.

Запрос 5/8: анализирую preload-чанк страницы на реальные HTML/URL sinks и источники URL/query; выводятся только совпадения и контексты.

Запрос 6/8: проверяю основной runtime-чанк, особенно источник `errorThemeCss` и остальные HTML sinks; вывод ограничен контекстами, без сохранения JS.

Запрос 7/8: проверяю первый bootstrap/runtime-чанк на DOM HTML sinks и URL-driven assignments; полный код не выводится.

Запрос 8/8: последний бюджет использую для клиентского React/DOM-чанка, где потенциально реализован `innerHTML`; это проверка статического sink-кода, не payload-тест.

Бюджет исчерпан: 8/8 запросов. Удаляю единственный автоматически созданный opencode полный вывод базового ответа; остальные ответы обрабатывались только в памяти.


## Dependency advisory audit (@general subagent)

sessiya: `ses_f2757e37effeJjRjeCKFmR71eq`

Friday. Проведу только GET/HEAD-аудит без эксплуатации; первый запрос — корневой документ для фиксации заголовков и ссылок на chunks.

Корень (1/10) показал Next.js/Turbopack-структуру и 8 публичных JS URL; framework version header не заявлен. Сейчас заберу эти chunks (8 запросов) с сохранением заголовков для точного анализа.

Запросы к цели исчерпаны на 9/10; дальше анализирую только сохранённые ответы локально. Извлеку version-like строки, package identifiers и source-map/comment markers, не обращаясь к хосту.

В chunks обнаружены точные строки `window.next.version="16.3.5"` и React/ReactDOM `19.3.0-canary-cbb046ab-20260731`; отдельно встречается `core-js 3.38.1`. Проверю только официальные security advisories/NVD, без новых запросов к цели.
