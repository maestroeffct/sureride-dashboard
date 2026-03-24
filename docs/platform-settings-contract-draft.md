# Platform Settings API Contract (Draft)

Base: `/admin/platform/settings`
Auth: `Bearer <admin_token>`

## 1) List All Section Settings
- Method: `GET /admin/platform/settings`
- Response:
```json
{
  "items": [
    {
      "section": "mail-config",
      "payload": { "mailEnabled": true },
      "updatedAt": "2026-03-16T12:00:00.000Z"
    }
  ]
}
```

## 2) Upsert Section Settings
- Method: `PATCH /admin/platform/settings/:section`
- Path params:
  - `section` enum:
    - `sms-module`
    - `mail-config`
    - `map-apis`
    - `social-logins`
    - `firebase-otp`
    - `recaptcha`
    - `storage-connection`
- Body:
```json
{
  "payload": {}
}
```
- Response:
```json
{
  "section": "mail-config",
  "payload": {},
  "updatedAt": "2026-03-16T12:00:00.000Z"
}
```

## Payload Shapes

### sms-module
```json
{
  "twilioActive": true,
  "twilioSid": "",
  "twilioMessagingSid": "",
  "twilioToken": "",
  "twilioFrom": "",
  "twilioOtpTemplate": "",
  "twoFactorActive": false,
  "twoFactorApiKey": ""
}
```

### mail-config
```json
{
  "mailEnabled": true,
  "mailerName": "Sureride",
  "mailHost": "smtp.mailgun.org",
  "mailDriver": "smtp",
  "mailPort": "587",
  "mailUsername": "",
  "mailEmailId": "",
  "mailEncryption": "tls",
  "mailPassword": ""
}
```

### map-apis
```json
{
  "mapEnabled": true,
  "mapApiKey": "",
  "mapGeocodingApiKey": "",
  "mapPlacesApiKey": "",
  "mapDirectionsApiKey": ""
}
```

### social-logins
```json
{
  "socialGoogleEnabled": false,
  "socialGoogleCallbackUrl": "",
  "socialGoogleClientId": "",
  "socialGoogleClientSecret": "",
  "socialFacebookEnabled": false,
  "socialFacebookCallbackUrl": "",
  "socialFacebookClientId": "",
  "socialFacebookClientSecret": "",
  "socialAppleEnabled": false,
  "socialAppleClientId": "",
  "socialAppleClientSecret": ""
}
```

### firebase-otp
```json
{
  "firebaseEnabled": true,
  "firebaseApiKey": "",
  "firebaseProjectId": "",
  "firebaseAuthDomain": "",
  "firebaseAppId": "",
  "firebaseSenderId": ""
}
```

### recaptcha
```json
{
  "recaptchaEnabled": false,
  "recaptchaSiteKey": "",
  "recaptchaSecretKey": ""
}
```

### storage-connection
```json
{
  "storageLocalEnabled": true,
  "storageThirdPartyEnabled": false,
  "storageS3Key": "",
  "storageS3Secret": "",
  "storageS3Region": "",
  "storageS3Bucket": "",
  "storageS3Endpoint": ""
}
```

## Notes
- Secret fields should be encrypted at rest on backend.
- On read, backend can return only `hasValue` for secret fields if needed.
- Validate per-section payload by schema to avoid unsafe keys.
