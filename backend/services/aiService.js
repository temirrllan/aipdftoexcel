// backend/services/aiService.js
const OpenAI = require('openai');

// Инициализация клиента OpenAI
// Убедитесь, что в .env задан OPENAI_API_KEY
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Интерпретирует произвольную команду пользователя
 * и возвращает одно из действий:
 *   - remove_column     (удалить весь столбец)
 *   - remove_time       (убрать время, оставив дату)
 *   - rename_column     (переименовать столбец)
 *   - undo              (отменить последнее действие)
 *   - none              (нет распознанного действия)
 *
 * @param {string} message — текст пользователя
 * @param {string[]} headers — массив заголовков таблицы
 * @returns {Promise<{action: string, column?: string, new_name?: string}>}
 */
async function interpretCommand(message, headers) {
  const prompt = `
У тебя есть таблица с колонками: ${JSON.stringify(headers)}.
Пользовательская команда: "${message}".

Возможные действия:
1) remove_column — удалить целиком указанный столбец.
2) remove_time — убрать время из значений в указанной колонке, оставив только дату.
3) rename_column — переименовать столбец (тогда укажи в "new_name" новое имя).
4) - merge_columns — соединить два столбца в один; верни JSON 
  {"action":"merge_columns","columns":["<имя1>","<имя2>"],"new_name":"<новое имя>"}.
5) undo — отменить последнее действие.
6) none — нет подходящего действия.

⚠️ **ОЧЕНЬ ВАЖНО**:
- Любые фразы типа "удали время", "убери время", "удали дату" относятся к remove_time.
- Фразы "удали столбец", "удалить колонку", "удали колонку" — remove_column.
- Фразы "переименовать", "переименуй столбец X в Y" — rename_column (column: старое имя, new_name: новое).
- Фразы "верни", "отмени", "откатить", "undo" — undo.

Отвечай строго JSON без пояснений, в одном из форматов:
• {"action":"remove_column","column":"<Имя столбца>"}  
• {"action":"remove_time","column":"<Имя столбца>"}  
• {"action":"rename_column","column":"<Старое имя>","new_name":"<Новое имя>"}  
• {"action":"undo"}  
• {"action":"none"}  
`.trim();

  const resp = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      { role: "system", content: "Интерпретатор команд для таблицы" },
      { role: "user",   content: prompt }
    ],
    temperature: 0
  });

  const text = resp.choices[0].message.content.trim();
  try {
    return JSON.parse(text);
  } catch (err) {
    console.error("AIService: invalid JSON:", text);
    return { action: "none" };
  }
}

module.exports = { interpretCommand };
