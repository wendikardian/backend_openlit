const { Configuration, OpenAIApi } = require("openai");
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const {signup, login} = require("./app/controllers/controller.js");

const configuration = new Configuration({
  organization: "org-u58nSOXtYQRjzYr7RTCzqKpn",
  apiKey: "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",
});
const openai = new OpenAIApi(configuration);

const app = express();
app.use(bodyParser.json());
app.use(cors());

const port = 3060;

app.get("/", (req, res) => {
  res.send("Hello, World!");
});

app.post("/user", signup);
app.post("/login", login);
app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});

