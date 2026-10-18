<?php
/**
 * 2's Complement Web Sanctuary - BGM Folder Scanner
 * Designed for Apache HTTP Server + PHP.
 *
 * Scans the ./bgm/ directory and returns a JSON list of playable audio/MIDI files.
 * GET /bgm-list.php -> {"status":"ok","files":[{"name":"song.mp3","path":"./bgm/song.mp3","type":"audio"},...]}
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Cache-Control: no-cache, no-store, must-revalidate');

$bgmDir = __DIR__ . '/bgm';
$allowedExtensions = ['mp3', 'ogg', 'wav', 'flac', 'mid', 'midi', 'm4a', 'aac'];

$files = [];

if (is_dir($bgmDir)) {
    $iterator = new DirectoryIterator($bgmDir);
    foreach ($iterator as $fileInfo) {
        if ($fileInfo->isDot() || $fileInfo->isDir()) {
            continue;
        }

        $fileName = $fileInfo->getFilename();
        $ext = strtolower($fileInfo->getExtension());

        if (!in_array($ext, $allowedExtensions, true)) {
            continue;
        }

        $type = in_array($ext, ['mid', 'midi'], true) ? 'midi' : 'audio';

        $files[] = [
            'name' => $fileName,
            'path' => './bgm/' . rawurlencode($fileName),
            'display' => $fileInfo->getBasename('.' . $fileInfo->getExtension()),
            'type' => $type,
            'size' => $fileInfo->getSize(),
            'modified' => date('Y-m-d H:i:s', $fileInfo->getMTime())
        ];
    }
}

// Sort by file name
usort($files, function ($a, $b) {
    return strcasecmp($a['name'], $b['name']);
});

echo json_encode([
    'status' => 'ok',
    'count' => count($files),
    'directory' => './bgm/',
    'files' => $files
]);
