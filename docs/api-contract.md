## Контракт REST API Payment Gateway

Документ описывает публичный REST‑контракт платёжного шлюза. Полная формальная спецификация представлена в файле `api/openapi.yaml` (формат OpenAPI 3.0.3). Ниже приведено человекочитаемое описание ресурсов и примеров запросов/ответов.

Версия API: **1.0.0**  
Базовый URL (пример): `https://api.example.com`

---

## Общие принципы

- **Формат данных**: все запросы и ответы — в формате JSON (`application/json`).
- **Коды ответа HTTP**:
  - `2xx` — успешные операции;
  - `4xx` — ошибки на стороне клиента (некорректный запрос, бизнес‑ошибка);
  - `5xx` — внутренние ошибки сервера.
- **Идентификаторы**:
  - `paymentId` — уникальный идентификатор платежа в шлюзе;
  - `orderId` — идентификатор заказа в системе интернет‑магазина;
  - `refundId` — идентификатор возврата.
- **Ошибки** возвращаются в едином формате `ErrorResponse` с полем `code` (машиночитаемый код) и `message` (описание на русском).

---

## Схемы данных

### PaymentCreate (тело запроса на создание платежа)

Обязательные поля:

- **`orderId`** (`string`) — идентификатор заказа в системе магазина;
- **`amount`** (`number`) — сумма платежа;
- **`currency`** (`string`) — код валюты в формате ISO 4217 (в MVP — только `EUR`);
- **`cardToken`** (`string`) — токенизированные данные банковской карты.

Пример:

```json
{
  "orderId": "ORD-100500",
  "amount": 149.90,
  "currency": "EUR",
  "cardToken": "tok_1234567890"
}
```

### Payment (ресурс платежа)

- **`paymentId`** (`string`) — идентификатор платежа в платёжном шлюзе;
- **`orderId`** (`string`) — идентификатор заказа;
- **`status`** (`string`, enum) — статус платежа:
  - `PENDING` — платёж создан, ожидает подтверждения/результата от провайдера;
  - `SUCCEEDED` — платёж успешно проведён;
  - `FAILED` — платёж не прошёл;
- **`amount`** (`number`) — сумма платежа;
- **`currency`** (`string`) — валюта платежа (в MVP — `EUR`);
- **`redirectUrl`** (`string`, nullable) — URL для перенаправления клиента на страницу провайдера (если используется redirect‑флоу).

Пример:

```json
{
  "paymentId": "pay_abc123",
  "orderId": "ORD-100500",
  "status": "PENDING",
  "amount": 149.90,
  "currency": "EUR",
  "redirectUrl": "https://pay.example-bank.com/redirect/abc123"
}
```

### RefundCreate (тело запроса на возврат)

- **`amount`** (`number`, required) — сумма возврата. Может быть как полной, так и частичной (но не больше оплаченной суммы).

Пример:

```json
{
  "amount": 49.90
}
```

### Refund (ресурс возврата)

- **`refundId`** (`string`) — идентификатор возврата;
- **`paymentId`** (`string`) — идентификатор исходного платежа;
- **`status`** (`string`, enum):
  - `REQUESTED` — возврат запрошен, ещё не завершён;
  - `REFUNDED` — возврат успешно выполнен;
  - `FAILED` — возврат не выполнен;
- **`amount`** (`number`) — сумма возврата.

Пример:

```json
{
  "refundId": "ref_777",
  "paymentId": "pay_abc123",
  "status": "REFUNDED",
  "amount": 49.90
}
```

### ErrorResponse (формат ошибки)

- **`code`** (`string`, enum) — машинный код ошибки;
- **`message`** (`string`) — человекочитаемое описание.

Возможные значения `code` (MVP):

- `INVALID_CARD` — недействительная карта;
- `INSUFFICIENT_FUNDS` — недостаточно средств;
- `CARD_DECLINED` — отказ банка;
- `EXPIRED_CARD` — истёк срок карты;
- `PAYMENT_EXPIRED` — истёк срок платежа или он больше не доступен;
- `REFUND_NOT_ALLOWED` — возврат по этому платежу невозможен;
- `INVALID_AMOUNT` — некорректная сумма (например, меньше нуля или больше суммы платежа);
- `DUPLICATE_ORDER` — попытка создать дубликат заказа.

Пример:

```json
{
  "code": "INVALID_CARD",
  "message": "Номер карты некорректен или недействителен"
}
```

---

## Endpoint: POST /payments — создание платежа

Создаёт новый платёж и возвращает его текущее состояние.

- **HTTP метод**: `POST`
- **Путь**: `/payments`
- **Тело запроса**: `PaymentCreate`
- **Успешные ответы**:
  - `201 Created` — платёж создан, возвращается объект `Payment`.
- **Ошибки**:
  - `400 Bad Request` — ошибка валидации или бизнес‑ошибка, тело — `ErrorResponse`.

Пример запроса:

```http
POST /payments HTTP/1.1
Content-Type: application/json

{
  "orderId": "ORD-100500",
  "amount": 149.90,
  "currency": "EUR",
  "cardToken": "tok_1234567890"
}
```

Пример успешного ответа (`201`):

```json
{
  "paymentId": "pay_abc123",
  "orderId": "ORD-100500",
  "status": "PENDING",
  "amount": 149.90,
  "currency": "EUR",
  "redirectUrl": "https://pay.example-bank.com/redirect/abc123"
}
```

Пример ответа при ошибке карты (`400`):

```json
{
  "code": "INVALID_CARD",
  "message": "Номер карты некорректен или недействителен"
}
```

---

## Endpoint: GET /payments — получение истории платежей

Возвращает список платежей, отфильтрованных по `orderId` и/или `customerId`.

- **HTTP метод**: `GET`
- **Путь**: `/payments`
- **Параметры запроса**:
  - `orderId` (`string`, опциональный) — фильтрация по заказу;
  - `customerId` (`string`, опциональный) — фильтрация по клиенту (при наличии такой интеграции).
- **Успешные ответы**:
  - `200 OK` — массив объектов `Payment`.

Пример запроса:

```http
GET /payments?orderId=ORD-100500 HTTP/1.1
Accept: application/json
```

Пример ответа:

```json
[
  {
    "paymentId": "pay_abc123",
    "orderId": "ORD-100500",
    "status": "SUCCEEDED",
    "amount": 149.90,
    "currency": "EUR",
    "redirectUrl": null
  }
]
```

---

## Endpoint: GET /payments/{paymentId} — получение статуса платежа

Возвращает текущее состояние отдельного платежа.

- **HTTP метод**: `GET`
- **Путь**: `/payments/{paymentId}`
- **Параметры пути**:
  - `paymentId` (`string`, required) — идентификатор платежа.
- **Успешные ответы**:
  - `200 OK` — объект `Payment`.
- **Ошибки**:
  - `404 Not Found` — платёж не найден/истёк, тело — `ErrorResponse` с кодом `PAYMENT_EXPIRED` или аналогичным.

Пример запроса:

```http
GET /payments/pay_abc123 HTTP/1.1
Accept: application/json
```

Пример успешного ответа:

```json
{
  "paymentId": "pay_abc123",
  "orderId": "ORD-100500",
  "status": "SUCCEEDED",
  "amount": 149.90,
  "currency": "EUR",
  "redirectUrl": null
}
```

Пример ответа при отсутствии платежа:

```json
{
  "code": "PAYMENT_EXPIRED",
  "message": "Платеж с таким ID не найден или истёк"
}
```

---

## Endpoint: POST /payments/{paymentId}/refunds — создание возврата

Создаёт возврат по ранее проведённому платежу.

- **HTTP метод**: `POST`
- **Путь**: `/payments/{paymentId}/refunds`
- **Параметры пути**:
  - `paymentId` (`string`, required) — идентификатор исходного платежа;
- **Тело запроса**: `RefundCreate`.
- **Успешные ответы**:
  - `201 Created` — возврат создан, возвращается объект `Refund`.
- **Ошибки**:
  - `400 Bad Request` — бизнес‑ошибка или ошибка валидации, тело — `ErrorResponse` с кодами:
    - `REFUND_NOT_ALLOWED` — возврат для данного платежа невозможен;
    - `INVALID_AMOUNT` — некорректная сумма.

Пример запроса:

```http
POST /payments/pay_abc123/refunds HTTP/1.1
Content-Type: application/json

{
  "amount": 49.90
}
```

Пример успешного ответа (`201`):

```json
{
  "refundId": "ref_777",
  "paymentId": "pay_abc123",
  "status": "REQUESTED",
  "amount": 49.90
}
```

Пример ответа при ошибке (`400`):

```json
{
  "code": "REFUND_NOT_ALLOWED",
  "message": "Возврат по этому платежу невозможен"
}
```

---

## Итоги

Данный документ отражает ключевые аспекты REST‑контракта платёжного шлюза. Актуальным источником правды по схеме полей и деталям валидации является спецификация OpenAPI в файле `api/openapi.yaml`, на основе которой могут генерироваться клиенты и серверные заглушки.

