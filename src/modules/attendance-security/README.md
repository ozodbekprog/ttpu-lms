# attendance-security moduli

QR davomat xavfsizligi: dinamik token, joylashuv tekshiruvi, IP nazorati.

## Muammo

Hozirgi QR 6 belgili statik kod — talaba kodni boshqasiga yuborishi yoki
boshqa telefon bilan masofadan belgilanishi mumkin.

## Yechim

1. **Dinamik QR** — token har `QR_TOKEN_TTL_SECONDS` (10s) da yangilanadi.
   QR ichida token (imzolangan, `exp` bilan). Eski token grace bilan qabul qilinadi.
2. **Joylashuv** — token o'qituvchi joylashuvini olib yuradi; talaba skanerda
   mobil joylashuvini yuboradi; masofa `QR_GEO_RADIUS_M` dan katta bo'lsa — shubhali.
3. **IP nazorati** — IP o'zgargan / bir IP bir nechta talabada / IP-geo mobil-geo
   bilan mos emas / VPN-proxy belgisi — shubhali.

Shubhali belgilanish `Attendance.status = SUSPICIOUS` (yangi enum) va
`AuditLog` yozuvi (`action: "attendance.check-in"`, `meta` ichida sabablar).

## Fayllar va egalik

| Fayl | Egasi |
|---|---|
| `types.ts`, `config.ts`, `README.md` | Komp 1 (o'zgartirilmaydi) |
| `qr-token.ts` | Lane A |
| `verify.ts` | Lane B |
| `src/app/api/attendance/sessions/[id]/token/route.ts` | Lane A |
| `src/app/api/attendance/check-in/route.ts` | Lane B |
| `src/components/attendance/**`, `check-in` sahifa | Lane C |

## Interfeyslar (o'zgarmas)

```ts
signQrToken(input: { sessionId: string; courseId: string; location?: GeoPoint }): Promise<string>
verifyQrToken(token: string): Promise<QrTokenPayload | null>
checkInUrl(origin: string, token: string): string

haversineMeters(a: GeoPoint, b: GeoPoint): number
clientIpFromHeaders(headers: Headers): string | null
lookupIpGeo(ip: string): Promise<IpGeo | null>
evaluateCheckInRisk(input: CheckInRiskInput): Promise<RiskResult>
```

## Env sozlamalari (sukut qiymatlar)

| Env | Sukut | Ma'nosi |
|---|---|---|
| `QR_TOKEN_TTL_S` | 10 | Token umri (soniya) |
| `QR_TOKEN_GRACE_S` | 10 | Qo'shimcha grace (soniya) |
| `QR_GEO_RADIUS_M` | 200 | Ruxsat etilgan masofa (metr) |
| `QR_GEO_ACCURACY_M` | 300 | Mobil joylashuv aniqligi chegarasi |
| `QR_IP_GEO_MAX_KM` | 100 | IP-geo va mobil-geo orasidagi maksimal masofa |
| `QR_IP_LOOKUP_TIMEOUT_MS` | 3000 | IP-geo so'rovga kutish vaqti |
