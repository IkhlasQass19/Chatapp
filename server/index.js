const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const app = express();
const PORT = 4000;
const http = require('http').Server(app);
const socketIO = require('socket.io')(http, {
    cors: {
        origin: ["http://localhost:3000", "http://localhost:3001", "http://localhost:3002", "http://localhost:3003", "http://localhost:3004"]
    }
});
const con = mysql.createConnection({
    user: "root",
    host: "localhost",
    password: "1234",
    database: "chat_application"
})

app.use(express.json());
app.use(cors());
let users = [];

con.connect((err) => {
    if (err) throw err;//console.log('Connected to database failed!');
    console.log('Connected to database!');
});



socketIO.on('connection', (socket) => {
    console.log(`⚡: ${socket.id} user just connected!`);
    socket.on('message', (data) => {
        socketIO.emit('messageResponse', data);
        console.log(data);
    })

    socket.on('tape un message', (data) => (
        socket.broadcast.emit('typingResponse', data)
      ))
    //console.log(data);
    //Listens when a new user joins the server
    socket.on('newUser', (data) => {
    //Adds the new user to the list of users
    users.push(data);
    console.log(users);
    console.log(data);
    //Sends the list of users to the client
    socketIO.emit('newUserResponse', users);
    })
    socket.on('disconnect', () => {
        console.log('🔥: Un utilisateur déconnecté');
        console.log(users);
        //Updates the list of users when a user disconnects from the server
        users = users.filter((user) => user.socketID !== socket.id);
        // console.log(users);
        //Sends the list of users to the client
        socketIO.emit('newUserResponse', users)
        socket.disconnect()
    });
});

app.post('/register', (req, res) => {
  const email = req.body.email;
  const username = req.body.username;
  const password = req.body.password;
  con.query(
    "SELECT COUNT(*) AS email_username_Count FROM users WHERE email = ? OR username = ?",
    [email, username],
    (error, results) => {
      if (error) {
        res.send({ message: "Internal server error" });
        return;
      }
      
      const count = results[0].email_username_Count;
  
      if (count > 0) {
        res.send({ message: "L'adresse e-mail ou le nom d'utilisateur existe déjà" });
        return;
      }
    }
  );
  con.query("INSERT INTO users (username, password, email) VALUES (?, ?, ?)", [username, password, email], 
      (result) => {
          if(result){
                res.send({message: "ENTRER CORRECTEMENT LES DÉTAILS DEMANDÉS!"});//res.send(result);
                return;
          }else{
                res.send({message: "COMPTE CRÉÉ AVEC SUCCÈS"});
                return;
          }
      }
  )
})

app.post("/login", (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    con.query("SELECT * FROM users WHERE username = ? AND password = ?", [username, password], 
        (err, result) => {
            if(err){
                res.send({message: "error"})//req.setEncoding({err: err});
            }else{
                if(result.length > 0){
                    res.send(result);
                }else{
                    res.send({message: "NOM D'UTILISATEUR OU MOT DE PASSE ERRONÉ !"})
                }
            }
        }
    )
})

http.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});