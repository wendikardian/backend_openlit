const bcrypt = require("bcrypt");
const connection = require("../models/db.js");
const req = require("express/lib/request.js");

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
exports.getProfileImage = (req, res) => {
  const { id } = req.params;
  const query = `SELECT image FROM user WHERE id = ?`;

  // execute query
  connection.query(query, [id], (err, results) => {
    if (err) {
      console.error("Error retrieving user data:", err);
      res.status(500).json({ error: "Failed to retrieve user data" });
    } else {
      if (results.length === 0) {
        res.status(404).json({ message: "User not found" });
      } else {
        console.log(results[0].image);
        // res.sendFile(__dirname + `./../../images/${results[0].image}`);
        // response by sending image
        // forbidden error
        console.log("Request comming");
        res.sendFile(__dirname + "/images/" + results[0].image);
        // res.sendFile(__dirname + `./../../images/default.jpg`);
        // res.sendFile(__dirname + `./../../images/not mirror.jpeg`);
      }
    }
  });
};

exports.getFeeds = (req, res) => {
  // select from table feeds joined by user table (id as primary) and using fk_user as foreign key
  const sql = `SELECT feeds.id, feeds.caption, feeds.date, feeds.fk_user, user.username, user.image FROM feeds INNER JOIN user ON feeds.fk_user = user.id ORDER BY feeds.id DESC`;
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

exports.getSpecifiedFeeds = (req, res) => {
  const id = req.params.id;
  // select from table feeds joined by user table (id as primary) and using fk_user as foreign key
  const sql = `SELECT feeds.id, feeds.caption, feeds.date, feeds.fk_user, user.username, user.image FROM feeds INNER JOIN user ON feeds.fk_user = user.id WHERE feeds.id = ? ORDER BY feeds.id DESC`;
  // Execute the query
  connection.query(sql, [id], (err, results) => {
    if (err) {
      console.error("Error retrieving feed data:", err);
      res.status(500).json({ error: "Internal Server Error" });
      return;
    }
    // Return the retrieved data as a JSON response
    res.status(200).json(results[0]);
  });
};

exports.getChatLog = (req, res) => {
  const userId = req.params.userId;

  const query = `SELECT * FROM chat_log WHERE user_id = ? order by id desc`;

  // Execute the query
  connection.query(query, [userId], (err, results) => {
    if (err) {
      console.error("Error retrieving feed data:", err);
      res.status(500).json({ error: "Internal Server Error" });
      return;
    }
    // Return the retrieved data as a JSON response
    res.status(200).json(results);
  });
};

exports.editProfile = (req, res) => {
  const { id } = req.params;
  const { username, name, email } = req.body;

  const query = `UPDATE user SET username = ?, name = ?, email = ? WHERE id = ?`;

  // Execute the query
  connection.query(query, [username, name, email, id], (err, results) => {
    if (err) {
      console.error("Error retrieving feed data:", err);
      res.status(500).json({ error: "Internal Server Error" });
      return;
    }
    // Return the retrieved data as a JSON response
    res.status(200).json(results);
  });
};

exports.editPassword = (req, res) => {
  const { id } = req.params;
  const { oldPassword, password } = req.body;
  console.log(oldPassword, password);
  const query = `SELECT password FROM user WHERE id = ?`;
  // compare old password with the stored hashed password
  connection.query(query, [id], (err, results) => {
    if (err) {
      console.error("Error retrieving feed data:", err);
      res.status(500).json({ error: "Internal Server Error" });
      return;
    }
    const hashedPassword = results[0].password;
    bcrypt.compare(oldPassword, hashedPassword, (err, isMatch) => {
      if (err) {
        console.error("Error comparing passwords: " + err);
        res.status(500).json({ error: "An error occurred" });
        return;
      }
      // if same update password with new password that already hashed
      if (isMatch) {
        bcrypt.hash(password, 10, (err, hash) => {
          if (err) {
            console.error("Error hashing password: " + err);
            res.status(500).json({ error: "An error occurred" });
            return;
          }
          const query = `UPDATE user SET password = ? WHERE id = ?`;
          connection.query(query, [hash, id], (err, results) => {
            if (err) {
              console.error("Error retrieving feed data:", err);
              res.status(500).json({ error: "Internal Server Error" });
              return;
            }
            // Return the retrieved data as a JSON response
            res.status(200).json(results);
          });
        });
      } else {
        res.status(401).json({ error: "Invalid credentials" });
      }
    });
  });
};

exports.addClass = (req, res) => {
  const { name, code, password, description, lecture_id } = req.body;
  console.log(name, code, password, description);
  const query = `INSERT INTO kelas (class_name, class_code, password, description, lecture_id, image) VALUES (?, ?, ?, ?, ?, 'class_default.jpg')`;
  connection.query(
    query,
    [name, code, password, description, lecture_id],
    (err, results) => {
      if (err) {
        console.error("Error retrieving feed data:", err);
        res.status(500).json({ error: "Internal Server Error" });
        return;
      }
      // Return the retrieved data as a JSON response
      res.status(200).json(results);
    }
  );
};

exports.getAllUsers = (req, res) => {
  // get all data from table user
  const query = `SELECT * FROM user`;
  connection.query(query, (err, results) => {
    if (err) {
      console.error("Error retrieving user data:", err);
      res.status(500).json({ error: "Failed to retrieve user data" });
    } else {
      res.json(results);
    }
  });
};

exports.getAllClasses = (req, res) => {
  // get all data from table user
  const query = `SELECT * FROM kelas`;
  connection.query(query, (err, results) => {
    if (err) {
      console.error("Error retrieving user data:", err);
      res.status(500).json({ error: "Failed to retrieve user data" });
    } else {
      // image field return as a blob
      // res send file

      res.json(results);
    }
  });
};

// get all classes image
exports.getClassImage = (req, res) => {
  const { id } = req.params;
  console.log(id);
  const query = `SELECT image FROM kelas WHERE class_code = ?`;
  connection.query(query, [id], (err, results) => {
    if (err) {
      console.error("Error retrieving user data:", err);
      res.status(500).json({ error: "Failed to retrieve user data" });
    } else {
      if (results.length === 0) {
        res.status(404).json({ message: "User not found" });
      } else {
        console.log(results[0].image);
        // res.sendFile(__dirname + `./../../images/${results[0].image}`);
        // response by sending image
        // forbidden error
        console.log("Request comming");
        res.sendFile(__dirname + "/images/" + results[0].image);
        // res.sendFile(__dirname + `./../../images/default.jpg`);
        // res.sendFile(__dirname + `./../../images/not mirror.jpeg`);
      }
    }
  });
};

exports.getSpecifiedClass = (req, res) => {
  const { id, user_id } = req.params;
  const query = `SELECT * FROM kelas WHERE id = ?`;
  connection.query(query, [id], (err, results) => {
    if (err) {
      console.error("Error retrieving user data:", err);
      res.status(500).json({ error: "Failed to retrieve user data" });
    } else {
      if (results.length === 0) {
        res.status(404).json({ message: "User not found" });
      } else {
        // check if user is enrolled
        const query = `SELECT * FROM kelas_member WHERE fk_user = ? AND fk_kelas = ?`;
        connection.query(query, [user_id, id], (err, results2) => {
          // if result more than one
          // console.log(results2);
          if (results2.length == 0) {
            console.log(err);
            // return result with new key is_enrolled false
            res.json({ ...results[0], is_enrolled: false });
          } else {
            // return result with new key is_enrolled true
            res.json({ ...results[0], is_enrolled: true });
          }
        });
      }
    }
  });
};

exports.getSpecifiedUser = (req, res) => {
  const { id } = req.params;
  console.log(id);
  const query = `SELECT * FROM user WHERE id = ?`;
  connection.query(query, [id], (err, results) => {
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

exports.isEnrolled = (req, res) => {
  const { user_id, class_id } = req.params;
  console.log(user_id, class_id);
  const query = `SELECT * FROM kelas_member WHERE fk_user = ? AND fk_kelas = ?`;
  connection.query(query, [user_id, class_id], (err, results) => {
    if (err) {
      console.error("Error retrieving user data:", err);
      res.status(500).json({ error: "Failed to retrieve user data" });
    } else {
      if (results.length === 0) {
        console.log(false);
        res.json({ isEnrolled: false });
      } else {
        console.log(true);
        res.json({ isEnrolled: true });
      }
    }
  });
};

exports.addPosting = (req, res) => {
  let { file } = req;
  // check if file null or undefined or not

  // if file undefined or null create a default value
  if (file === undefined || file === null) {
    file = {
      filename: "",
    };
  }
  const { data } = req.body;
  // Conver json stringify data to json
  const dataJson = JSON.parse(data);
  console.log(file, dataJson);
  // Insert data to table feeds
  const query = `INSERT INTO feeds (fk_user, date, caption, image) VALUES (?, ?, ?, ?)`;
  connection.query(
    query,
    [
      dataJson.fk_user,
      dataJson.date,
      dataJson.caption,
      file.filename ? file.filename : "",
    ],
    (err, results) => {
      if (err) {
        console.error("Error retrieving feed data:", err);
        res.status(500).json({ error: "Internal Server Error" });
        return;
      }
      // Return the retrieved data as a JSON response
      res.status(200).json(results);
    }
  );
};

exports.getImageFeeds = (req, res) => {
  const { id } = req.params;
  console.log(id);
  const query = `SELECT image FROM feeds WHERE id = ?`;
  connection.query(query, [id], (err, results) => {
    if (err) {
      console.error("Error retrieving user data:", err);
      res.status(500).json({ error: "Failed to retrieve user data" });
    } else {
      if (results.length === 0) {
        res.status(404).json({ message: "User not found" });
      } else {
        console.log(results[0].image);
        // res.sendFile(__dirname + `./../../images/${results[0].image}`);
        // response by sending image
        // forbidden error
        console.log("Request comming");
        res.sendFile(__dirname + "/images/" + results[0].image);
        // res.sendFile(__dirname + `./../../images/default.jpg`);
        // res.sendFile(__dirname + `./../../images/not mirror.jpeg`);
      }
    }
  });
};

exports.commentFeeds = (req, res) => {
  const { user_id, comment, feed_id, date } = req.body;
  console.log(date);
  const query = `INSERT INTO comment (fk_user, fk_feeds, comment, date) VALUES (?, ?, ?, ?)`;
  connection.query(query, [user_id, feed_id, comment, date], (err, results) => {
    if (err) {
      console.error("Error retrieving feed data:", err);
      res.status(500).json({ error: "Internal Server Error" });
      return;
    }
    // Return the retrieved data as a JSON response
    res.status(200).json(results);
  });
};

exports.getComment = (req, res) => {
  const { id } = req.params;
  // select from feeds join table user fk_user as foreign key (user.id primary)
  const query =
    "SELECT comment.id, comment.comment, comment.fk_feeds, comment.fk_user, user.username as username FROM comment JOIN user ON user.id = comment.fk_user WHERE comment.fk_feeds = ? order by id DESC ;";
  connection.query(query, [id], (err, results) => {
    if (err) {
      console.error("Error retrieving feed data:", err);
      res.status(500).json({ error: "Internal Server Error" });
      return;
    }
    // Return the retrieved data as a JSON response
    res.status(200).json(results);
  });
};

exports.deleteFeeds = (req, res) => {
  const { id } = req.params;
  const query = `DELETE FROM feeds WHERE id = ?`;
  connection.query(query, [id], (err, results) => {
    if (err) {
      console.error("Error retrieving feed data:", err);
      res.status(500).json({ error: "Internal Server Error" });
      return;
    }
    // Return the retrieved data as a JSON response
    res.status(200).json(results);
  });
};

exports.editFeeds = (req, res) => {
  const { id } = req.params;
  const { content } = req.body;
  const query = `UPDATE feeds SET caption = ? WHERE id = ?`;
  connection.query(query, [content, id], (err, results) => {
    if (err) {
      console.error("Error retrieving feed data:", err);
      res.status(500).json({ error: "Internal Server Error" });
      return;
    }
    // Return the retrieved data as a JSON response
    res.status(200).json(results);
  });
};

exports.enrollClass = (req, res) => {
  const { user_id, class_id } = req.body;
  const query = `INSERT INTO kelas_member (fk_user, fk_kelas) VALUES (?, ?)`;
  connection.query(query, [user_id, class_id], (err, results) => {
    if (err) {
      console.error("Error retrieving feed data:", err);
      res.status(500).json({ error: "Internal Server Error" });
      return;
    }
    // Return the retrieved data as a JSON response
    res.status(200).json(results);
  });
};

exports.addBook = (req, res) => {
  const { title, author, genre, imageLink, description } = req.body;
  const query = `INSERT INTO book (title, author, genre, image, description) VALUES (?, ?, ?, ?, ?)`;
  connection.query(
    query,
    [title, author, genre, imageLink, description],
    (err, results) => {
      if (err) {
        console.error("Error retrieving feed data:", err);
        res.status(500).json({ error: "Internal Server Error" });
        return;
      }
      // Return the retrieved data as a JSON response
      res.status(200).json(results);
    }
  );
};

exports.getBook = (req, res) => {
  const { id } = req.params;
  const query = `SELECT * FROM book WHERE id = ?`;
  connection.query(query, [id], (err, results) => {
    if (err) {
      console.error("Error retrieving feed data:", err);
      res.status(500).json({ error: "Internal Server Error" });
      return;
    }
    // Return the retrieved data as a JSON response
    res.status(200).json(results[0]);
  });
};

exports.getAllBook = (req, res) => {
  const query = `SELECT * FROM book order by id DESC`;
  connection.query(query, (err, results) => {
    if (err) {
      console.error("Error retrieving feed data:", err);
      res.status(500).json({ error: "Internal Server Error" });
      return;
    }
    // Return the retrieved data as a JSON response
    res.status(200).json(results);
  });
};

exports.addSubBook = (req, res) => {
  const { book_id, detail, title, question } = req.body;
  const query = `INSERT INTO sub_book (book_id, detail, title, question) VALUES (?, ?, ?, ?)`;
  connection.query(
    query,
    [book_id, detail, title, question],
    (err, results) => {
      if (err) {
        console.error("Error retrieving feed data:", err);
        res.status(500).json({ error: "Internal Server Error" });
        return;
      }
      // Return the retrieved data as a JSON response
      res.status(200).json(results);
    }
  );
};

exports.getSubBook = (req, res) => {
  const { id } = req.params;
  const query = `SELECT * FROM sub_book WHERE book_id = ?`;
  connection.query(query, [id], (err, results) => {
    if (err) {
      console.error("Error retrieving sub book data:", err);
      res.status(500).json({ error: "Internal Server Error" });
      return;
    }
    // Return the retrieved data as a JSON response
    console.log(results);
    res.status(200).json(results);
  });
};

exports.addAnswer = (req, res) => {
  const { subbook_id, user_id, answer, date } = req.body;
  console.log(subbook_id, user_id, answer, date);

  const query = `INSERT INTO answer (subbook_id, user_id, answer, date) VALUES (?, ?, ?, ?)`;
  connection.query(
    query,
    [subbook_id, user_id, answer, date],
    (err, results) => {
      if (err) {
        console.error("Error retrieving sub book data:", err);
        res.status(500).json({ error: "Internal Server Error" });
        return;
      }
      // Return the retrieved data as a JSON response

      res.status(200).json(results);
    }
  );
};

exports.getAnswer = (req, res) => {
  const { id } = req.params;
  const query = `SELECT * FROM answer WHERE subbook_id = ?`;
  connection.query(query, [id], (err, results) => {
    if (err) {
      console.error("Error retrieving sub book data:", err);
      res.status(500).json({ error: "Internal Server Error" });
      return;
    }
    // Return the retrieved data as a JSON response

    res.status(200).json(results);
  });
}
