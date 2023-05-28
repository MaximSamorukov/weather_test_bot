const { Markup, Telegraf } = require("telegraf");
const { config, parse } = require("dotenv");
const moment = require("moment-timezone");
const {
  getWeatherData,
  getCityDataByName,
  getWeatherDataByCoordinates,
} = require("./api/weather");
config().parsed;
const bot = new Telegraf(process.env.TOKEN, { polling: true });
const keyboard = Markup.inlineKeyboard([
  Markup.button.callback("Weather", "weather"),
  Markup.button.callback("Exchange rate", "exchange"),
]);
const citiesOptionsDict = {
  MOSCOW: "moscow",
  PETER: "petersburg",
  OTHER: "other",
};
const citiesNameDict = {
  [citiesOptionsDict.MOSCOW]: "Москва",
  [citiesOptionsDict.PETER]: "Санкт-Петербург",
};
const cities = Markup.inlineKeyboard([
  Markup.button.callback("Moscow", citiesOptionsDict.MOSCOW),
  Markup.button.callback("Saint Petersburg", citiesOptionsDict.PETER),
  Markup.button.callback("Other city", citiesOptionsDict.OTHER),
]);
bot.start((ctx) => {
  return ctx.reply("Hi!", keyboard);
});

bot.action("weather", (ctx) => {
  const {
    id,
    from: { id: user_id, username },
    message,
    data,
  } = ctx.callbackQuery;
  console.log(id, user_id, username, data);
  return ctx.reply("Погода в каком городе интересует?", cities);
});

bot.action("exchange", (ctx) => {
  const {
    id,
    from: { id: user_id, username },
    message,
    data,
  } = ctx.callbackQuery;
  console.log(id, user_id, username, data, message);
  return ctx.reply(`<i>Hello,</i><b>${username}</b>\n<i>${data}</i>`, {
    parse_mode: "HTML",
  });
});

bot.on("callback_query", (ctx) => {
  const choice = ctx.callbackQuery.data;
  if (choice.includes("city--")) {
    const [, latRow, longRow, nameRow] = choice.split("--");
    const [, lat] = latRow.split(":");
    const [, long] = longRow.split(":");
    const [, name] = nameRow.split(":");
    console.log(lat, long, name);
    getWeatherDataByCoordinates({ lat, long })
      .then((data) => {
        const { temperature, windspeed, time } = data.current_weather;
        const city = name;
        const localTime = moment
          .utc(time)
          .utcOffset(180)
          .format("YYYY-MM-DD HH-mm");
        const degCelsiusSign = "&#176;С";
        const string = `${city}. По состоянию на ${localTime} погода:\n<i>Темпратура:</i> ${temperature} ${degCelsiusSign};\n<i>Скорость ветра:</i> ${windspeed} м/с`;
        return ctx.reply(string, { parse_mode: "HTML" });
      })
      .catch((er) => {
        console.log(er);
      });
    return;
  }
  if ([citiesOptionsDict.MOSCOW, citiesOptionsDict.PETER].includes(choice)) {
    getWeatherData(choice)
      .then((data) => {
        const { temperature, windspeed, time } = data.current_weather;
        const city = citiesNameDict[choice];
        const localTime = moment
          .utc(time)
          .utcOffset(180)
          .format("YYYY-MM-DD HH-mm");
        const degCelsiusSign = "&#176;С";
        const string = `${city}. По состоянию на ${localTime} погода:\n<i>Темпратура:</i> ${temperature} ${degCelsiusSign};\n<i>Скорость ветра:</i> ${windspeed} м/с`;
        return ctx.reply(string, { parse_mode: "HTML" });
      })
      .catch((er) => {
        console.log(er);
      });
  } else {
    return ctx.replyWithHTML(
      "В ответ на это сообщение предоставьте <b>наименование населенного пункта</b>?"
    );
  }
});
bot.on("message", (ctx) => {
  //console.log(ctx.message);
  const cityName = ctx.message.text;

  getCityDataByName(cityName)
    .then(({ results }) => {
      const cityOptions = (results || [])
        .filter(
          ({ id, name, latitude, longitude, country }) =>
            id && name && latitude && longitude && country
        )
        .map(({ id, name, latitude, longitude, country, admin1 }) => [
          Markup.button.callback(
            `${name} (${country}, ${admin1 || "нет данных"})`,
            `city--lat:${latitude}--long:${longitude}--name:${name}`
          ),
        ]);

      if (!cityOptions.length) {
        return ctx.replyWithHTML(
          "В ответ на это сообщение предоставьте <b>наименование населенного пункта</b>?"
        );
      } else {
        return ctx.replyWithHTML(
          "Погода в каком городе интересует? Или введите <b>наименование населенного пункта</b> еще раз в ответ на это сообщение",
          Markup.inlineKeyboard(cityOptions)
        );
      }
    })
    .catch((error) => {
      ctx.reply(
        `Error: ${error?.response?.description || "a somewhat mistake"}`,
        { alert: true }
      );
      return ctx.replyWithHTML(
        "В ответ на это сообщение предоставьте <b>наименование населенного пункта</b>?"
      );
    });
});
bot.launch();
