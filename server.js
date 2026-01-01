const express = require("express");
const app = express();

console.log("start");
app.use(express.static("public"));

app.get("/shows/schedule", (request, response) => {
  response.sendFile(__dirname + "/views/live.json"); // change to schedule when not active
});

app.get("/shows/now", (request, response) => {
  response.sendFile(__dirname + "/views/shows.json");
});

app.get("/config", (request, response) => {
  response.sendFile(__dirname + "/views/config.json");
});

app.get("/opt-in", (request, response) => {
  response.sendFile(__dirname + "/views/opt-in.json");
});

app.get("/offair-trivia/*", (request, response) => {
  response.sendFile(__dirname + "/views/offair.json");
});

app.get("/users/me/payouts", (request, response) => {
  response.sendFile(__dirname + "/views/payouts.json");
});

app.get("/users/me", (request, response) => {
  response.sendFile(__dirname + "/views/me.json");
});

app.get("/store/products", (request, response) => {
  response.sendFile(__dirname + "/views/store.json");
});

app.get("/achievements/v2/me", (request, response) => {
  response.sendFile(__dirname + "/views/achievements.json");
});

app.get("/show-referrals", (request, response) => {
  response.sendFile(__dirname + "/views/referrals.json");
});

app.get("/friends/requests/incoming", (request, response) => {
  response.sendFile(__dirname + "/views/incoming.json");
});

app.get("/config/public", (request, response) => {
  response.sendFile(__dirname + "/views/configpublic.json");
});

app.get("/friends", (request, response) => {
  response.sendFile(__dirname + "/views/friends.json");
});

app.get("/contacts/players", (request, response) => {
  response.sendFile(__dirname + "/views/contacts/players.json");
});

app.get("/contacts/non-players", (request, response) => {
  response.sendFile(__dirname + "/views/contacts/non-players.json");
});

app.get("/users/leaderboard", (request, response) => {
  response.sendFile(__dirname + "/views/leaderboard.json");
});

app.get("/users/", (request, response) => {
  response.sendFile(__dirname + "/views/users.json");
});

app.get("/users/*", (request, response) => {
  response.sendFile(__dirname + "/views/userid.json");
});

app.get("/friends/*/status", (request, response) => {
  response.sendFile(__dirname + "/views/status.json");
});

app.get("/broadcasts/*/viewers/friends", (request, response) => {
  response.sendFile(__dirname + "/views/friendshow.json");
});

app.get("/broadcasts/*/viewers", (request, response) => {
  response.sendFile(__dirname + "/views/viewers.json");
});

app.get("/friends/me/all", (request, response) => {
  response.sendFile(__dirname + "/views/friendsmeall.json");
});
app.get("/wave/messages", (request, response) => {
  response.sendFile(__dirname + "/views/wave.json");
});
app.post("/offair-trivia/*/answers", (request, response) => {
  response.sendFile(__dirname + "/views/offair-answer.json");
});
app.get("/health", (request, response) => {
  response.json({ status: "ok" });
});
app.get("/ready", (request, response) => {
  response.json({ status: "ready" });
});

app.get("*", (request, response) => {
  console.warn("Unhandled GET: " + request._parsedOriginalUrl.href);
});

app.post("*", (request, response) => {
  console.log("Unhandled POST: " + request._parsedUrl.href);
});

//const wss = new WebSocket.Server({ port: 80 });

/* wss.on("connection", function connection(ws) {
  ws.on("message", function incoming(message) {
    console.log("received: %s", message);
  });
  setInterval(function() {
    ws.send('{"type":"questionSummary","ts":"NOW","questionId":1,"question":"HQApi testing websocket","answerCounts":[{"answerId":1,"answer":"Cool","correct":false,"count":1},{"answerId":2,"answer":"I like it!","correct":true,"count":2},{"answerId":3,"answer":"HQApi is the best","correct":false,"count":3}],"advancingPlayersCount":1,"eliminatedPlayersCount":-1,"nextCheckpointIn":8,"questionMedia":null,"yourAnswerId":0,"youGotItRight":false,"extraLivesRemaining":1,"savedByExtraLife":false,"pointsEarned":100,"seasonXp":{"previousPoints":0,"levels":[{"level":0,"minPoints":0,"maxPoints":499,"display":{"description":"Get to the next Level to unlock a *Free Pass* to Q1 in Trivia and Sports and *1 Bonus Strike* in Words this season","textColor":"#FFFFFF","accentColor":"#B2AFC5","textAccentColor":"#FED430","cardBackgroundImage":"https://d2xu1hdomh3nrx.cloudfront.net/static/levels/gfx_card_level_0@3x.png","backgroundColor":"#9591AF","backgroundImage":"https://d2xu1hdomh3nrx.cloudfront.net/static/levels/level0@3x.png?v=2"}}],"minimumRotationDegrees":15,"currentLevelNumber":0,"currentPoints":100,"name":"2019season4","remainingPoints":400},"wasJustInTheGame":true,"sent":"NOW"}');
  }, 3000);
}); */

// listen for requests :)
const listener = app.listen(8000, () => {
  console.log(
    JSON.stringify({
      level: "info",
      message: "backend_ready",
      url: `http://localhost:${listener.address().port}`,
    })
  );
});
