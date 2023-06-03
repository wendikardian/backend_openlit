const { Configuration, OpenAIApi } = require("openai");
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const {
  signup,
  login,
  getProfile,
  getFeeds,
} = require("./app/controllers/controller.js");
const axios = require("axios");

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
app.get("/profile/:email", getProfile);
app.get("/feeds", getFeeds);

app.post("/chat", async (req, res) => {
  const { message } = req.body;
  console.log(message);
  const response = await openai.createCompletion({
    model: "text-davinci-003",
    prompt: `${message}`,
    max_tokens: 1000,
    temperature: 0.5,
  });

  //   console.log(response.data.choices[0].text);
  res.json({
    message: response.data.choices[0].text,
  });
});

app.get("/check-token", async (req, res) => {
  const testPrompt = "Hello, world!"; // Test prompt to send to the OpenAI API
  const openaiApiKey = "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"; // Replace with your OpenAI API token

  try {
    const response = await axios.post(
      "https://api.openai.com/v1/engines/davinci-codex/completions",
      {
        prompt: testPrompt,
        max_tokens: 5,
      },
      {
        headers: {
          Authorization: `${openaiApiKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    // If the response is successful and there are no errors, the token is valid
    res.status(200).json({ valid: true });
  } catch (error) {
    console.log(error);
    // If there is an error or authentication issue, the token is invalid
    res.status(401).json({ valid: false });
  }
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
