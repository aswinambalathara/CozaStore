require('dotenv').config()
require('mongoose')
require('./config/db')()
const express = require('express')
// const passport = require('passport')
const methodOverride = require('method-override')
const path = require('path')
const session = require('express-session')
const flash = require('connect-flash');
const app = express()
const nocache = require('nocache');

const authRouter = require('./routes/authRouter')
const shopRouter = require('./routes/shopRouter')
const adminRouter = require('./routes/adminRouter')

app.set('views',path.join(__dirname,'views'));
app.set('view engine','ejs');

app.use(express.json());
app.use(express.urlencoded({extended:false}));
app.use(express.static(path.join(__dirname,'public')));
app.use(flash())
app.use(methodOverride('_method'));
app.use( session ({

    resave : false,
    secret : process.env.SESSION_SECRET,
    saveUninitialized: false
    
}))
app.use(nocache())

// app.use(passport.initialize());
// app.use(passport.session());


//routeHandlers
app.use('/',authRouter); 
app.use('/',shopRouter); 
app.use('/admin',adminRouter); 
const PORT = process.env.PORT || 3000
app.listen(PORT,()=>{
    console.log(`Server is running on PORT : ${PORT}`)
})