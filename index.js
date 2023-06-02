
const { Configuration, OpenAIApi } = require("openai");
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");


const configuration = new Configuration({
    organization: "org-u58nSOXtYQRjzYr7RTCzqKpn",
    apiKey: "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",
  });
  const openai = new OpenAIApi(configuration);