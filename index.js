const express = require('express');
const session = require('express-session');
const {MongoClient} = require('mongodb');
const mongoose = require('mongoose');
const MongoStore = require('connect-mongo');
const User = require('./models/User');
const cookieParser = require('cookie-parser');

const app = express();


const mongoUri = "mongodb://localhost:27017/sessionDemo"

mongoose.connect(mongoUri)
    .then(()=> console.log("Connected to MONGODB"))
    .catch(err => console.log(err));

app.use(session({
    secret:"key that will sign cookie",
    resave:false, 
    saveUninitialized:false,
    store: MongoStore.create({
        mongoUrl:mongoUri ,
        dbName:"sessions"
    }),
    cookie:{
        // maxAge:10000,
    }
}))

app.set("view engine", "ejs");
app.use(express.urlencoded({extended:true}));
app.use(cookieParser());


app.get('/', (req, res) =>{
    // req.session.isAuth = true; 
    // console.log(req.session)
    
    console.log( JSON.stringify (req.cookies) ) 
    // console.log(req.session.id)
    res.send("Hello world");
})

app.get('/register', (req, res) =>{
    res.render("register");
})

app.post('/register', async(req, res) =>{
    const {name, email,password} = req.body; 

    let user = await User.findOne({email});
    if(user){
        return res.render('register');
    }
    user = new User({
        name, 
        email, 
        password 
    })
    await user.save();

    res.redirect('login');
})

app.get('/login', (req, res) =>{
    res.render("login");
})

const isAuth = (req, res, next) =>{
    if(req.session.isAuth){
        next();
    }else{
        return res.redirect("/login");
    }
}

app.post('/login', async(req, res) =>{
    const {email, password} = req.body;
    
    const user = await User.findOne({email});
    // console.log(password === user?.password);
    
    if(!user){
        console.log("no user found");
        return res.redirect("/login");
    }

    if(password !== user?.password) {
        // console.log(user.password);
        return res.redirect("/login");
    } 

      // read cookies
    //   console.log(req.cookies) 

      let options = {
          maxAge: 1000 * 60 * 15, // would expire after 15 minutes
          httpOnly: true, // The cookie only accessible by the web server
          signed: true // Indicates if the cookie should be signed
      }

    res.cookie('username', user.name)
    req.session.isAuth = true;
   return res.redirect("/dashboard");
})

app.get('/dashboard', isAuth,(req, res) =>{
    res.render("dashboard");
})

app.post('/logout', (req, res) =>{
    req.session.destroy(err => {
        if(err) throw err;
        res.redirect("/");
    })
})

app.listen(3000, () => console.log("Server started on port 3000..."));