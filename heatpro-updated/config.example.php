<?php
// Copy this file to config.php and fill in the values below.
// IMPORTANT: Never put Twilio credentials in index.html or JavaScript.

return [
    // SMS destination. Use E.164 format, e.g. +919876543210
    'owner_mobile' => '+91XXXXXXXXXX',

    // Twilio credentials from https://console.twilio.com/
    'twilio_account_sid' => 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    'twilio_auth_token'  => 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    'twilio_from_number' => '+1XXXXXXXXXX',

    // Email destination requested by HeatPro.
    'email_to' => 'heatprosystems@gmail.com',

    // Use an address on your own domain for best deliverability.
    // Create this mailbox/forwarder in cPanel if needed.
    'email_from' => 'website@heat-pro-systems.com',
    'email_from_name' => 'HeatPro Website',
];
