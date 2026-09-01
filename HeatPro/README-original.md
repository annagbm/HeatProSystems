# HeatPro website - email + SMS enquiry form

This version sends every valid enquiry to:

- Email: `heatprosystems@gmail.com`
- SMS: the owner's mobile number configured in `config.php`

## Setup on cPanel

1. Upload `index.html`, `send-enquiry.php`, and `config.example.php` into the website folder (usually `public_html`).
2. Rename `config.example.php` to `config.php`.
3. Edit `config.php` and enter:
   - owner's mobile in international E.164 format (`+91...` for India)
   - Twilio Account SID
   - Twilio Auth Token
   - Twilio SMS-enabled sender number
4. In cPanel, make sure PHP's `curl` extension is enabled.
5. Make sure PHP email (`mail()`) works on the hosting. Set `email_from` to a mailbox on `heat-pro-systems.com`, for example `website@heat-pro-systems.com`.
6. Submit a test enquiry from the live website.

## Twilio

Create a Twilio account, obtain an SMS-capable number, and copy the Account SID/Auth Token into `config.php`.

If the Twilio account is still in trial mode, Twilio may require the owner's destination number to be verified first.

## Security

Do not place `config.php` contents in HTML or JavaScript and do not publish the Twilio Auth Token.

For stronger protection on cPanel, move `config.php` one directory above `public_html` and update the path in `send-enquiry.php` accordingly.

## Email reliability

This package uses the hosting server's PHP `mail()` function to keep setup simple. If your host blocks `mail()` or Gmail marks messages as spam, switch the email side to authenticated SMTP (for example Gmail SMTP with an App Password) or a transactional provider. The SMS code does not need to change.
