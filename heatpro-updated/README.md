# HeatPro Systems - Updated Website Package

This package contains the complete HeatPro website with the existing black/navy, white and orange colour combination preserved. The hero-side illustration has been replaced with an automatic product-photo slideshow featuring industrial heaters, temperature controllers, band heaters and cartridge heaters.

## Files

- `index.html` - complete responsive website and slideshow
- `assets/` - four slideshow images
- `send-enquiry.php` - enquiry endpoint that sends email + Twilio SMS
- `config.example.php` - safe configuration template

## Upload to cPanel

1. Upload all files/folders to the website's document root (normally `public_html`). Keep the `assets` folder beside `index.html`.
2. Rename `config.example.php` to `config.php`.
3. Edit `config.php` and set the owner's mobile number and Twilio credentials. The email recipient is `heatprosystems@gmail.com`.
4. Do not expose or publish your Twilio Auth Token anywhere inside `index.html`.
5. Make sure PHP is enabled on the hosting account.

## Slideshow behaviour

- Auto-advances every 4.5 seconds
- Previous/next buttons
- Slide dots
- Pauses while hovered/focused
- Swipe support on phones/tablets
- Respects reduced-motion accessibility settings

## Form

The form posts to `send-enquiry.php`. On successful configuration, the enquiry is sent by email and SMS.
