const bcrypt = require("bcrypt");
const connection = require("../models/db.js");

exports.signup = (req, res) => {
  console.log("Empty input value check");
  console.log(req.body);
  const username = req.body.username;
  const email = req.body.email;
  const password = req.body.password;
  const errors = [];

  if (username === "") {
    errors.push("Username is empty");
  }

  if (email === "") {
    errors.push("Email is empty");
  }

  if (password === "") {
    errors.push("Password is empty");
  }

  if (errors.length > 0) {
    console.log("failed to register user");
  }
  console.log("Duplicate emails check");
  connection.query(
    "SELECT * FROM user WHERE email = ?",
    [email],
    (error, results) => {
      if (results.length > 0) {
        errors.push("Failed to register user");
      } else {
        console.log("Sign up");
        const currentDate = new Date();
        bcrypt.hash(password, 10, (error, hash) => {
          connection.query(
            "INSERT INTO user (username, name, email, password, role, date_created, image) VALUES (?, ?, ?, ?, 1, ?, 'default.jpg')",
            [username, username, email, hash, currentDate]
          );
        });
        // response success
        return res.status(200).json({
          message: "User successfully registered",
          data: {
            username: username,
            email: email,
          },
        });
      }
    }
  );
};

exports.login = (req, res) => {
  const { email, password } = req.body;

  connection.query(
    "SELECT password FROM user WHERE email = ?",
    [email],
    (error, results) => {
      if (error) {
        console.error("Error executing database query: " + error.stack);
        res.status(500).json({ error: "An error occurred" });
        return;
      }

      if (results.length > 0) {
        const hashedPassword = results[0].password;
        const idUser = results[0].id;

        // Compare the entered password with the stored hashed password
        bcrypt.compare(password, hashedPassword, (err, isMatch) => {
          if (err) {
            console.error("Error comparing passwords: " + err);
            res.status(500).json({ error: "An error occurred" });
            return;
          }

          if (isMatch) {
            // Login successful
            res.status(200).json({
              message: "Login successful",
              idUser: idUser,
              email: email,
            });
          } else {
            // Login failed
            res.status(401).json({ error: "Invalid credentials" });
          }
        });
      } else {
        // Login failed (no user found)
        res.status(401).json({ error: "Invalid credentials" });
      }
    }
  );
};

exports.getProfile = (req, res) => {
  const email = req.params.email;

  const query = `SELECT * FROM user WHERE email = ?`;

  connection.query(query, [email], (err, results) => {
    if (err) {
      console.error("Error retrieving user data:", err);
      res.status(500).json({ error: "Failed to retrieve user data" });
    } else {
      if (results.length === 0) {
        res.status(404).json({ message: "User not found" });
      } else {
        res.json(results[0]);
      }
    }
  });
};

exports.getFeeds = (req, res) => {
  const sql = "SELECT * FROM feeds";
  // Execute the query
  connection.query(sql, (err, results) => {
    if (err) {
      console.error("Error retrieving feed data:", err);
      res.status(500).json({ error: "Internal Server Error" });
      return;
    }
    // Return the retrieved data as a JSON response
    res.status(200).json(results);
  });
};
