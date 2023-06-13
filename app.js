const express = require("express");
const app = express();
const port = 3000;
const bodyParser = require('body-parser');
const mongoose = require("mongoose");
const bcrypt = require('bcrypt');
const path = require('path');
const jwt = require('jsonwebtoken');

const cookieParser = require('cookie-parser');

app.use(cookieParser());

//middlewares
app.use(express.json());

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());



app.set('view engine', 'ejs');
app.set('views', './views');

//mongodb connection
mongoose.set('strictQuery', false);
const db = mongoose.connection;
mongoose.connect('mongodb+srv://rpbarmaiya:2y8QH9EQ6k1B0JZa@cluster0.ssbiz07.mongodb.net/?retryWrites=true&w=majority', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});
db.on('error', console.error.bind(console, 'connection error'));
db.once('open', () =>{
    console.log("database connected")
});

//schema

const subAdminSchema = new mongoose.Schema({
    username: {
      type: String,
      required: true
    },
    password: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true
    },
    address: {
      type: String,
      required: true
    },
    phoneNumber: {
      type: String,
      required: true
    }
  });

  
  
const SubAdmin = mongoose.model('SubAdmin', subAdminSchema);


// render-signup

app.get("/signup-page",async(req,res)=>{
  return res.render('signup')
})

//api to signup
app.post("/signup", async(req,res) =>{
    try{
        const {username, password, email, address, phoneNumber} = req.body;

         // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);


        // Check if username or email already exists
        const existingUser = await SubAdmin.findOne({
          $or: [{ username }, { email}] });
        if (existingUser) {
          return res.status(409).json({ message: 'Username or email already exists' });
        };

        
        // Create a new SubAdmin instance
        const subAdmin = new SubAdmin({
          username,
          password: hashedPassword,
          email,
          address,
          phoneNumber
        });
  
        // Save the subAdmin to the database
        await subAdmin.save();
        //res.status(201).json({ message: 'Sub-Admin signup successful' });
        res.redirect("/render-login");
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
      };
});


// render login
app.get("/render-login",async(req,res)=>{
  return res.render('login')
})

//api to login
app.post("/login", async(req, res) =>{
    try{
        const { username, password} = req.body; 
        
        // Check if the user exists in the database
        const user = await SubAdmin.findOne({ username });
        if (!user) {
          return res.status(404).json({ message: 'User not found' });
        }
    
        // Check if the provided password matches the stored password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
          return res.status(401).json({ message: 'Invalid password' });
        }
    
        const token = jwt.sign({ username: user.username }, 'mysecretkey', { expiresIn: '1h' });
        res.cookie('token', token, { maxAge: 3600000, httpOnly: true });

         res.redirect('/');

        
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
      };
    
});

// app.get("/login", (req, res) =>{
  
//     const filePath = path.join(__dirname, 'frontend/login.html');
//     res.sendFile(filePath);
// });

app.get("/", (req, res) =>{

  const token = req.cookies.token;
  console.log(token);


  jwt.verify(token, 'mysecretkey', (err, decodedToken) => {
    if (err) {
      console.log(err);
      return res.status(401).json({ message: 'token invalid' });
    }
    

    // const filePath = path.join(__dirname, 'frontend/signup.html');
    return res.render('home')
  })
});


//server listening
app.listen(port, () =>{
    console.log(`server is running at port no ${port}`);
});
