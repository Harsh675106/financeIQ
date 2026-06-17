const pool = require("../config/database");

async function listCopilotMessages(userId, limit = 20) {
  const result = await pool.query(
    `SELECT id, role, content, created_at
     FROM copilot_messages
     WHERE user_id = $1
     ORDER BY created_at ASC
     LIMIT $2`,
    [userId, limit],
  );

  return result.rows.map((row) => ({
    id: row.id,
    role: row.role,
    content: row.content,
    createdAt: row.created_at,
  }));
}

async function saveCopilotExchange(userId, question, answer) {
  await pool.query(
    `INSERT INTO copilot_messages (user_id, role, content)
     VALUES ($1, 'user', $2), ($1, 'assistant', $3)`,
    [userId, question, answer],
  );

  await pool.query(
    `DELETE FROM copilot_messages
     WHERE user_id = $1
       AND id NOT IN (
         SELECT id
         FROM copilot_messages
         WHERE user_id = $1
         ORDER BY created_at DESC, id DESC
         LIMIT 30
       )`,
    [userId],
  );
}

async function clearCopilotMessages(userId) {
  await pool.query("DELETE FROM copilot_messages WHERE user_id = $1", [userId]);
}

module.exports = {
  listCopilotMessages,
  saveCopilotExchange,
  clearCopilotMessages,
};
