<?php
/**
 * 2's Complement Web Sanctuary - PHP Guestbook
 * Designed for Apache HTTP Server + PHP.
 *
 * Stores messages in messages.json under the site root.
 * GET  -> returns JSON list of messages (newest first).
 * POST -> adds a new message after basic validation & XSS filtering.
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Cache-Control: no-cache, no-store, must-revalidate');

$messagesFile = __DIR__ . '/messages.json';
$maxMessages = 100;
$maxNameLength = 32;
$maxBodyLength = 500;

function readMessages($file) {
    if (!file_exists($file)) {
        return [];
    }
    $content = @file_get_contents($file);
    if ($content === false) {
        return [];
    }
    $data = json_decode($content, true);
    return is_array($data) ? $data : [];
}

function writeMessages($file, $messages) {
    $json = json_encode($messages, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    return @file_put_contents($file, $json, LOCK_EX) !== false;
}

function sanitize($str, $maxLen) {
    $str = trim($str);
    if (function_exists('mb_substr')) {
        $str = mb_substr($str, 0, $maxLen, 'UTF-8');
    } else {
        // Fallback: safe UTF-8 truncation using regex
        $str = preg_replace('/^(.*)[\x80-\xBF]*$/us', '$1', substr($str, 0, $maxLen * 3));
        // Further trim by byte length if still too long
        while (strlen($str) > $maxLen) {
            $str = preg_replace('/^(.*)[\x80-\xBF]*$/us', '$1', substr($str, 0, -1));
        }
    }
    return htmlspecialchars($str, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $messages = readMessages($messagesFile);
    echo json_encode([
        'status' => 'ok',
        'count' => count($messages),
        'messages' => $messages
    ]);
    exit;
}

if ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input) {
        $input = $_POST;
    }

    $name = isset($input['name']) ? sanitize($input['name'], $maxNameLength) : '匿名訪客';
    $body = isset($input['body']) ? sanitize($input['body'], $maxBodyLength) : '';
    $mood = isset($input['mood']) ? sanitize($input['mood'], 16) : '(*/ω＼*)';

    if ($name === '') {
        $name = '匿名訪客';
    }
    if ($body === '') {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'error' => '留言內容不能為空']);
        exit;
    }

    $messages = readMessages($messagesFile);

    $newMessage = [
        'id' => 'msg-' . date('YmdHis') . '-' . substr(uniqid(), -4),
        'name' => $name,
        'body' => $body,
        'mood' => $mood,
        'date' => date('Y-m-d H:i:s'),
        'ip_hash' => hash('sha256', $_SERVER['REMOTE_ADDR'] ?? 'unknown')
    ];

    array_unshift($messages, $newMessage);
    if (count($messages) > $maxMessages) {
        $messages = array_slice($messages, 0, $maxMessages);
    }

    if (writeMessages($messagesFile, $messages)) {
        echo json_encode([
            'status' => 'ok',
            'message' => $newMessage,
            'count' => count($messages)
        ]);
    } else {
        http_response_code(500);
        echo json_encode(['status' => 'error', 'error' => '無法寫入留言文件']);
    }
    exit;
}

http_response_code(405);
echo json_encode(['status' => 'error', 'error' => 'Method Not Allowed']);
