// ===== Прослойка между сайтом и Telegram (Cloudflare Worker) =====
// Этот код НЕ лежит на сайте — его вставляют в Cloudflare Workers.
// Сайт отправляет сюда имя и телефон, а этот код пересылает их твоему боту.
// Токен бота и chat_id хранятся в настройках Cloudflare (секреты BOT_TOKEN и CHAT_ID),
// поэтому посетители сайта их не увидят.

export default {
  async fetch(request, env) {
    // Заголовки CORS — разрешают сайту с другого адреса обращаться к этому коду
    const cors = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    // Браузер перед отправкой формы сначала «спрашивает разрешения» запросом OPTIONS
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors });
    }

    if (request.method !== "POST") {
      return new Response("Только POST", { status: 405, headers: cors });
    }

    // Читаем данные, которые прислал сайт
    let data;
    try {
      data = await request.json();
    } catch {
      return new Response("Неверные данные", { status: 400, headers: cors });
    }

    // Скрытое поле-ловушка: человек его не видит, а спам-боты заполняют.
    // Делаем вид, что всё хорошо, но ничего не отправляем.
    if (data.website) {
      return new Response("ok", { headers: cors });
    }

    // Обрезаем слишком длинные значения и убираем пробелы по краям
    const name = String(data.name || "").trim().slice(0, 100);
    const phone = String(data.phone || "").trim().slice(0, 30);

    if (!name || !phone) {
      return new Response("Заполните имя и телефон", { status: 400, headers: cors });
    }

    // Текст сообщения, которое придёт в Telegram
    const text = `☕ Новая бронь столика\n\n👤 Имя: ${name}\n📞 Телефон: ${phone}`;

    // Отправляем сообщение через Telegram Bot API
    const telegram = await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: env.CHAT_ID, text }),
    });

    if (!telegram.ok) {
      return new Response("Не удалось отправить в Telegram", { status: 502, headers: cors });
    }

    return new Response("ok", { headers: cors });
  },
};
