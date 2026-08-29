<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

function respond(int $status, bool $ok, string $message): never {
    http_response_code($status);
    echo json_encode(['ok' => $ok, 'message' => $message], JSON_UNESCAPED_SLASHES);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(405, false, 'Method not allowed.');
}

$configFile = __DIR__ . '/config.php';
if (!is_file($configFile)) {
    error_log('HeatPro form: config.php is missing.');
    respond(500, false, 'The enquiry service is not configured yet.');
}
$config = require $configFile;

// Honeypot: real users never fill this hidden field.
if (!empty($_POST['website'] ?? '')) {
    respond(200, true, 'Thank you. Your enquiry has been sent successfully.');
}

$name = trim((string)($_POST['name'] ?? ''));
$phone = trim((string)($_POST['phone'] ?? ''));
$email = trim((string)($_POST['email'] ?? ''));
$requirement = trim((string)($_POST['requirement'] ?? ''));

if ($name === '' || mb_strlen($name) > 120) {
    respond(422, false, 'Please enter your name.');
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL) || mb_strlen($email) > 254) {
    respond(422, false, 'Please enter a valid email address.');
}
if (mb_strlen($phone) > 40) {
    respond(422, false, 'Please enter a valid phone number.');
}
if ($requirement === '' || mb_strlen($requirement) > 4000) {
    respond(422, false, 'Please enter your requirement.');
}

// Prevent header injection.
$name = str_replace(["\r", "\n"], ' ', $name);
$email = str_replace(["\r", "\n"], '', $email);
$phone = str_replace(["\r", "\n"], ' ', $phone);

$timestamp = date('Y-m-d H:i:s T');
$ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';

$emailSubject = 'New HeatPro website enquiry - ' . $name;
$emailBody = "New website enquiry\n\n"
    . "Name: {$name}\n"
    . "Phone: " . ($phone !== '' ? $phone : 'Not provided') . "\n"
    . "Email: {$email}\n\n"
    . "Requirement:\n{$requirement}\n\n"
    . "Submitted: {$timestamp}\n"
    . "IP: {$ip}\n";

$headers = [
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'From: ' . ($config['email_from_name'] ?? 'HeatPro Website') . ' <' . $config['email_from'] . '>',
    'Reply-To: ' . $email,
    'X-Mailer: PHP/' . phpversion(),
];

$emailSent = @mail(
    (string)$config['email_to'],
    $emailSubject,
    $emailBody,
    implode("\r\n", $headers)
);

$smsBody = "HEATPRO ENQUIRY\n"
    . "Name: {$name}\n"
    . "Phone: " . ($phone !== '' ? $phone : 'Not provided') . "\n"
    . "Email: {$email}\n"
    . "Request: {$requirement}";

// Keep the SMS reasonably short. Twilio may split longer messages into segments.
if (mb_strlen($smsBody) > 900) {
    $smsBody = mb_substr($smsBody, 0, 897) . '...';
}

$smsSent = false;
$twilioError = '';
if (function_exists('curl_init')) {
    $sid = (string)($config['twilio_account_sid'] ?? '');
    $token = (string)($config['twilio_auth_token'] ?? '');
    $from = (string)($config['twilio_from_number'] ?? '');
    $to = (string)($config['owner_mobile'] ?? '');

    if ($sid !== '' && $token !== '' && $from !== '' && $to !== '') {
        $url = 'https://api.twilio.com/2010-04-01/Accounts/' . rawurlencode($sid) . '/Messages.json';
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 15,
            CURLOPT_USERPWD => $sid . ':' . $token,
            CURLOPT_POSTFIELDS => http_build_query([
                'To' => $to,
                'From' => $from,
                'Body' => $smsBody,
            ]),
        ]);
        $response = curl_exec($ch);
        $httpCode = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
        if ($response === false) {
            $twilioError = curl_error($ch);
        }
        curl_close($ch);
        $smsSent = $httpCode >= 200 && $httpCode < 300;
        if (!$smsSent && $twilioError === '') {
            $twilioError = 'Twilio HTTP ' . $httpCode . ': ' . (string)$response;
        }
    }
} else {
    $twilioError = 'PHP cURL extension is not enabled.';
}

if (!$emailSent) {
    error_log('HeatPro form: email delivery failed for ' . $email);
}
if (!$smsSent) {
    error_log('HeatPro form: SMS delivery failed. ' . $twilioError);
}

if ($emailSent && $smsSent) {
    respond(200, true, 'Thank you. Your enquiry has been sent successfully.');
}

if ($emailSent || $smsSent) {
    // Avoid losing a legitimate enquiry just because one notification channel failed.
    respond(200, true, 'Thank you. Your enquiry has been received.');
}

respond(500, false, 'We could not send your enquiry right now. Please try again shortly.');
