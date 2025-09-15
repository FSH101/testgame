<?php
header('Content-Type: application/json; charset=utf-8');

$apiKey = getenv('OPENAI_API_KEY');
$raw = file_get_contents('php://input');
$body = json_decode($raw, true) ?: [];
$topic = $body['topic'] ?? 'neutral';
$style = $body['style'] ?? 'short';
$count = max(1, min(10, intval($body['count'] ?? 5)));

if (!$apiKey) {
  http_response_code(503);
  echo json_encode(['error' => 'OPENAI_API_KEY not set']);
  exit;
}

$promptSystem = "Ты генератор коротких фраз. Отвечай ТОЛЬКО JSON вида {\"phrases\":[\"...\"]}. Стиль: лаконично, без эмодзи, без пояснений.";
$promptUser = "Тема: $topic. Стиль: $style. Кол-во: $count. Дай $count разных лаконичных фраз русским языком.";

$payload = [
  "model" => "gpt-4.1-mini",
  "input" => [
    ["role"=>"system","content"=>$promptSystem],
    ["role"=>"user","content"=>$promptUser]
  ],
  // Можем потребовать строгое соответствие JSON-схеме, но для простоты оставим так.
  "temperature" => 0.8,
  "max_output_tokens" => 300
];

$ch = curl_init('https://api.openai.com/v1/responses');
curl_setopt_array($ch, [
  CURLOPT_POST => true,
  CURLOPT_HTTPHEADER => [
    'Content-Type: application/json',
    'Authorization: Bearer '.$apiKey
  ],
  CURLOPT_POSTFIELDS => json_encode($payload),
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_TIMEOUT => 20
]);
$res = curl_exec($ch);
$code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
if ($res === false) {
  http_response_code(502);
  echo json_encode(['error'=>'Curl error']);
  exit;
}
curl_close($ch);

// Разбор ответа Responses API
$data = json_decode($res, true);
if (!is_array($data)) {
  http_response_code(502);
  echo json_encode(['error'=>'Bad JSON']);
  exit;
}

// Попробуем достать текст из output_text (упрощённо)
$phrases = [];
if (isset($data['output_text'])) {
  // Ожидаем, что модель вернёт JSON со списком фраз
  $maybe = json_decode($data['output_text'], true);
  if (isset($maybe['phrases']) && is_array($maybe['phrases'])) {
    $phrases = array_values(array_filter(array_map('trim', $maybe['phrases'])));
  }
}

// Если не получилось — мягко отфолбэчимся: попытаемся распарсить по строкам
if (!$phrases && isset($data['output_text'])) {
  $lines = preg_split('/\r?\n/', $data['output_text']);
  foreach ($lines as $line) {
    $line = trim($line, "-* \t\n\r\0\x0B");
    if ($line !== '') $phrases[] = $line;
  }
  // Обрежем до нужного количества
  $phrases = array_slice($phrases, 0, $count);
}

echo json_encode([
  "phrases" => $phrases,
  "source" => "openai"
], JSON_UNESCAPED_UNICODE);
