// mongo.js
const { MongoClient } = require("mongodb");

// 1) Укажите ваш URI (по умолчанию локально: mongodb://localhost:27017)
const uri = "mongodb://localhost:27017";

// 2) Название базы и коллекции, которые вы создали в Compass
const dbName = "auric";       // <-- ваше название базы
const collectionName = "words"; // <-- ваша коллекция

// 3) Создаём клиент
const client = new MongoClient(uri);

async function getDictionary() {
  try {
    // Подключаемся к Mongo
    await client.connect();

    // Берём базу
    const db = client.db(dbName);
    // Берём коллекцию
    const words = db.collection(collectionName);

    // Считываем все документы в массив
    const result = await words.find({}).toArray();
    // Вернём массив вида [{ ourWord: "...", keyword: "..." }, ...]
    return result;
  } catch (err) {
    console.error("Ошибка подключения к MongoDB:", err);
    return [];
  }
}

// Экспортируем функцию, чтобы вызывать её из другого файла
module.exports = {
  getDictionary,
};
