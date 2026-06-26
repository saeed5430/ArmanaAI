# API Documentation

## Webhook Endpoint

### `POST /webhook`

Receive messages from Eitaa.

#### Request Body (from Eitaa)

```json
{
  "update_id": 12345,
  "message": {
    "message_id": 1,
    "from": { "id": 123456, "is_bot": false, "first_name": "کاربر" },
    "chat": { "id": 123456, "type": "private" },
    "date": 1700000000,
    "text": "سلام، شال آبی موجوده؟"
  }
}
```

#### Response (Success)

```json
{ "ok": true }
```

#### Response (Cached)

```json
{ "ok": true, "cached": true }
```

#### Response (Blocked - Injection)

```json
{ "ok": true, "blocked": true }
```

#### Response (Rate Limited)

```json
{ "ok": true, "limited": true }
```

#### Response (Skipped - Non-text update)

```json
{ "ok": true, "skipped": true }
```

## Health Check

### `GET /health`

Check worker status.

#### Response

```json
{
  "status": "ok",
  "timestamp": "2025-01-01T00:00:00.000Z"
}
```

## Set Webhook

### `GET /set-webhook?url=<webhook_url>`

Set Eitaa webhook URL.

**Requires:** `ALLOW_SET_WEBHOOK=true` environment variable.

#### Response

```json
{
  "ok": true,
  "description": "Webhook was set"
}
```

## Error Responses

| Status | Description |
|--------|-------------|
| 400 | Invalid request (bad JSON, wrong content-type) |
| 403 | Webhook setup not allowed |
| 404 | Endpoint not found |
| 405 | Method not allowed |
| 500 | Internal server error / missing config |

## User-Facing Error Messages (in Persian)

| Scenario | Message |
|----------|---------|
| Empty message | لطفاً یک پیام ارسال کنید. |
| Too long | پیام شما بسیار طولانی است. لطفاً کوتاه‌تر بنویسید. |
| Rate limit | لطفاً کمی صبر کنید و سپس دوباره تلاش کنید. |
| Daily limit | شما به حداکثر تعداد درخواست‌های روزانه خود رسیده‌اید. فردا دوباره تلاش کنید. |
| Token limit | محدودیت توکن روزانه شما به پایان رسیده است. |
| Injection | متأسفانه نمی‌توانم به این درخواست پاسخ دهم. لطفاً سؤال خود را مرتبط با محصولات فروشگاه بپرسید. |
| Unsupported media | متأسفانه فقط می‌توانم پیام‌های متنی را پردازش کنم. |
| AI unavailable | متأسفانه سرویس هوش مصنوعی در حال حاضر در دسترس نیست. لطفاً بعداً تلاش کنید. |
| Timeout | مدت زمان پاسخ‌دهی به پایان رسید. لطفاً دوباره تلاش کنید. |
| Internal error | خطایی رخ داده است. لطفاً بعداً تلاش کنید. |
