require('dotenv').config();
const Twitter = require('twitter-v2');
const { Configuration, OpenAIApi } = require('openai');

// Конфигуриране на Twitter API клиента
const client = new Twitter({
  consumer_key: process.env.TWITTER_API_KEY,
  consumer_secret: process.env.TWITTER_API_KEY_SECRET,
  access_token_key: process.env.TWITTER_ACCESS_TOKEN,
  access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
});

// Конфигуриране на OpenAI API клиента
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

// Функция за генериране на отговор на туит с помощта на ChatGPT
async function generateReply(tweet_content) {
  const prompt = `Give me a funny response to this tweet: "${tweet_content}", that encourages people to click the link I send alongside it.`;

  try {
    const response = await openai.createCompletion({
      model: "text-davinci-003",
      prompt: prompt,
      max_tokens: 100,
    });

    return response.data.choices[0].text.trim();
  } catch (error) {
    console.error("Error generating reply:", error);
    return "Sorry, something went wrong!";
  }
}

// Функция за обхождане на нови туитове и отговаряне с интервал от 30 секунди
async function replyToTweets() {
  try {
    // Търсене на туитове с конкретен критерий
    const tweets = await client.get('tweets/search/recent', {
      query: 'your search query', // Задай твоята търсена фраза или критерии
      'tweet.fields': 'created_at',
    });

    if (tweets.data) {
      for (let tweet of tweets.data) {
        const reply = await generateReply(tweet.text);

        await client.post('statuses/update', {
          status: `@${tweet.author_id} ${reply}`,
          in_reply_to_status_id: tweet.id
        });

        console.log(`Replied to tweet ${tweet.id}`);

        // Изчакване за 30 секунди между всяка публикация
        await new Promise(resolve => setTimeout(resolve, 30000));
      }
    }
  } catch (error) {
    console.error("Error replying to tweets:", error);
  }

  // Изчакване 1 минута преди ново опресняване
  setTimeout(replyToTweets, 60000);
}

// Стартиране на цикъла
replyToTweets();
