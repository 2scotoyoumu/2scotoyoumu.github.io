<?php
/**
 * 2's Complement Web Sanctuary - Apache Real Hit Counter
 * Designed for Apache HTTP Server + PHP.
 * Supports:
 *  - JSON API: GET counter.php -> {"count": 1338}
 *  - SVG Graphic Mode: GET counter.php?format=svg -> Retro 6-digit odometer SVG image
 *  - Plain text: GET counter.php?format=text -> "1338"
 *  - Read-only: GET counter.php?action=get -> Does not increment
 */

header('Cache-Control: no-cache, no-store, must-revalidate');
header('Pragma: no-cache');
header('Expires: 0');
header('Access-Control-Allow-Origin: *');

$counterFile = __DIR__ . '/counter.txt';
$defaultCount = 1337;

// 如果文件不存在則初始化
if (!file_exists($counterFile)) {
    @file_put_contents($counterFile, (string)$defaultCount);
}

$action = isset($_GET['action']) ? $_GET['action'] : 'hit';
$format = isset($_GET['format']) ? $_GET['format'] : 'json';

$count = $defaultCount;

// 打開文件並使用排他鎖 (LOCK_EX) 保證高併發下計數準確
$fp = @fopen($counterFile, 'c+');
if ($fp) {
    if (flock($fp, LOCK_EX)) {
        $content = fread($fp, 32);
        $count = (int)trim($content);
        if ($count <= 0) {
            $count = $defaultCount;
        }

        if ($action === 'hit') {
            $count++;
            ftruncate($fp, 0);
            rewind($fp);
            fwrite($fp, (string)$count);
            fflush($fp);
        }
        flock($fp, LOCK_UN);
    }
    fclose($fp);
} else {
    // 降級讀取
    $content = @file_get_contents($counterFile);
    if ($content !== false && (int)trim($content) > 0) {
        $count = (int)trim($content);
        if ($action === 'hit') {
            $count++;
            @file_put_contents($counterFile, (string)$count);
        }
    }
}

// 格式化為 6 位補零字符串
$padded = str_pad((string)$count, 6, '0', STR_PAD_LEFT);

if ($format === 'svg') {
    header('Content-Type: image/svg+xml; charset=utf-8');
    echo '<?xml version="1.0" encoding="UTF-8"?>';
    ?>
    <svg xmlns="http://www.w3.org/2000/svg" width="140" height="34" viewBox="0 0 140 34">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#000000"/>
          <stop offset="100%" stop-color="#111111"/>
        </linearGradient>
      </defs>
      <rect width="140" height="34" fill="url(#bg)" stroke="#7dffbf" stroke-width="2"/>
      <line x1="23" y1="0" x2="23" y2="34" stroke="#223322" stroke-width="1"/>
      <line x1="46" y1="0" x2="46" y2="34" stroke="#223322" stroke-width="1"/>
      <line x1="69" y1="0" x2="69" y2="34" stroke="#223322" stroke-width="1"/>
      <line x1="92" y1="0" x2="92" y2="34" stroke="#223322" stroke-width="1"/>
      <line x1="115" y1="0" x2="115" y2="34" stroke="#223322" stroke-width="1"/>
      <text x="70" y="24" fill="#7dffbf" font-family="Courier New, monospace" font-size="20" font-weight="bold" letter-spacing="9" text-anchor="middle"><?php echo htmlspecialchars($padded); ?></text>
    </svg>
    <?php
    exit;
} elseif ($format === 'text') {
    header('Content-Type: text/plain; charset=utf-8');
    echo $padded;
    exit;
} else {
    // 默認返回 JSON
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'status' => 'ok',
        'count' => $count,
        'padded' => $padded,
        'server' => 'Apache/PHP'
    ]);
    exit;
}
