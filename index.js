const { Configuration, OpenAIApi } = require("openai");
const connection = require("./app/models/db.js");
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const {
  signup,
  login,
  getProfile,
  getFeeds,
  getChatLog,
  getProfileImage,
  editProfile,
  editPassword,
  addClass,
  getAllUsers,
  getAllClasses,
  getClassImage,
  getSpecifiedClass,
  getSpecifiedUser
} = require("./app/controllers/controller.js");
const axios = require("axios");
const multer = require("multer");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "app/controllers/images/");
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});

const upload = multer({ storage: storage });

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

app.post("/image/:id", upload.single("file"), function (req, res) {
  // get file name
  const { file } = req;
  console.log(file);
  $query = "UPDATE user SET image = ? WHERE id = ?";
  connection.query(
    $query,
    [file.originalname, req.params.id],
    (err, result) => {
      if (err) {
        console.error("Error inserting data:", err);
        res.status(500).json({ error: "Internal Server Error" });
        return;
      }
      res.status(200).json({ message: "Image uploaded successfully" });
    }
  );
});

app.get("/image_profile/:id", getProfileImage);

app.post("/user", signup);
app.post("/login", login);
app.put("/profile/:id", editProfile);
app.put("/edit_password/:id", editPassword);
app.get("/profile/:email", getProfile);
app.get("/chatlog/:userId", getChatLog);
app.get("/feeds", getFeeds);
app.post("/class", addClass);
app.get("/all_users", getAllUsers);
app.get("/all_classes", getAllClasses);
app.get("/class_image/:id", getClassImage);
app.get("/class/:id", getSpecifiedClass);
app.get("/user/:id", getSpecifiedUser);

app.post("/chat", async (req, res) => {
  const { message, user_id, date } = req.body;
  console.log(message, user_id, date);
  const response = await openai.createCompletion({
    model: "text-davinci-003",
    prompt: `${message}`,
    max_tokens: 1000,
    temperature: 0.5,
  });
  const sql =
    "INSERT INTO chat_log (user_id, message, date, is_from_user) VALUES (?, ?, ?, 1)";

  // Execute the query with the provided data
  connection.query(sql, [user_id, message, date], (err, result) => {
    if (err) {
      console.error("Error inserting data:", err);
      res.status(500).json({ error: "Internal Server Error" });
      return;
    }
  });

  const sqlResponse =
    "INSERT INTO chat_log (user_id, message, date, is_from_user) VALUES (?, ?, ?, 0)";
  connection.query(
    sqlResponse,
    [user_id, response.data.choices[0].text, date],
    (err, result) => {
      if (err) {
        console.error("Error inserting data:", err);
        res.status(500).json({ error: "Internal Server Error" });
        return;
      }
    }
  );

  //   console.log(response.data.choices[0].text);
  res.json({
    message: response.data.choices[0].text,
  });
});
app.post("/resume", async (req, res) => {
  const { book } = req.body;
  console.log(book);
  const response = await openai.createCompletion({
    model: "text-davinci-003",
    prompt: `Bisakah kamu buatkan summary secara lengkap singkat dan padat terkait buku ${book} minimal 500 kata !`,
    max_tokens: 2000,
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
