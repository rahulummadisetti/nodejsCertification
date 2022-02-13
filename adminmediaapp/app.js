import express from 'express';
import path from 'path';
import bodyParser from 'body-parser';
import iplocate  from 'node-iplocate';
const publicIp = require('public-ip');
import "babel-polyfill"
import session from 'express-session';
import  ConnectMongoDBSession  from 'connect-mongodb-session';
import  * as jwt from 'jsonwebtoken';

const MongoDBStore = ConnectMongoDBSession(session);

import axios from 'axios';
import bcrypt from 'bcryptjs';
let app = express();
const port = process.env.PORT || 3000;
const host = '0.0.0.0';


const news = require('./db/model/news');
const users = require('./db/model/users');
const queries = require('./db/model/queries');

const db = require('./db/db');

const config = require('./config');

const store = new MongoDBStore({
    uri: 'mongodb://mongo:27017/update24by7',
    collection : 'sessionstorage'
});

store.on('eror',function(error){
    console.log(error);
});

app.use(express.static(path.join(__dirname,'/public')));
app.set('view engine','ejs');
app.set('views','./views');

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.set('trust proxy',true); 

app.use(session({
    secret : 'sessionsecretkeycookie',
    resave : false , 
    saveUninitialized : false,
    store : store
}));


const isadmin = (req,res,next)=>{
    if(req.session.authenticationtoken){
        jwt.verify(req.session.authenticationtoken,config.secret,function(err,decoded){
            if(err) return  res.redirect('/admin/login');
            users.findOne({email : decoded.email},function(err,user){
                if(err) {
                    req.session.destroy();
                    res.redirect('/admin/login');
                    return;
                }
                
                next();
            })
        })
    }
    else{
        res.redirect('/admin/login');
    }
}

const isloggedin = (req,res,next)=>{
    if(req.session.authenticationtoken){
        res.redirect('/admin/newsForm');
    }
    else{
        next();
    }
}

app.get('/',(req,res)=>{
    res.redirect('/admin/login');
})

app.get('/admin/login',isloggedin,(req,res)=>{
    console.log(req.session);
    const data = {
        isadmin : true,
        loggedIn : false,
        error:''
    }
    res.render('template',{mode:"login",data:data})
})

app.post('/admin/register',(req,res)=>{
    const hashpassword = bcrypt.hashSync(req.body.password,8);
    users.create({
        name : req.body.name,
        email : req.body.email,
        password : hashpassword
    },function(err, user){
        if(err) return res.status(500).send(err.message);
        res.status(200).send(user);
    })
})

app.post('/admin/login',(req,res)=>{

    users.findOne({"email":req.body.email},function(err, user){
        if(err) {
            res.status(500).send("not a valid user");
        }
        if(bcrypt.compareSync(req.body.password,user.password)){

            req.session.authenticationtoken = jwt.sign({email:user.email},config.secret,{expiresIn : 86400});

            const data = {
                isadmin : true,
                loggedIn : false,
                error:''
            }

            res.redirect('/admin/newsForm');
        } else{
            res.redirect('/admin/login');
        }
    })
})

app.get('/admin/newsForm',isadmin,(req,res)=>{
    const data = {
        isadmin : true,
        loggedIn : true,
        error:''
    }
    res.render('template',{mode:"Add News",data:data})
})

app.post('/admin/newsForm',isadmin,(req,res)=>{
    news.create(req.body,function(err,user){
        if(err){
            const data = {
                isadmin : true,
                loggedIn : true,
                error:err
            }
            res.render('template',{mode:"Add News",data:data})
        }  
        res.redirect('/admin/newsForm');
    })
})

app.post('/admin/findnews',isadmin,(req,res)=>{
    news.findOne({"title":req.body.title},function(err,resultnews){
        if(err) return res.status(500).send(err.message);
        res.send(resultnews);
    })
})

app.get('/admin/editNews',isadmin,(req,res)=>{
    news.find(function(err,news){
        const data = {
            isadmin : true,
            loggedIn : true,
            error:'' ,
            news :[]
        }
        if(err){
            data.error = err.message;
        } else{
            data.news = news;
        }
        
        res.render('template',{mode:"Edit News",data:data})
    })
})

app.put('/admin/editNews',isadmin,(req,res)=>{
    news.findOneAndUpdate({'title':req.body.title},{
        $set :{
            title: req.body.title,
            description:req.body.description,
            url:req.body.url,
            urlToImage : req.body.urlToImage,
            publishedAt : req.body.publishedAt
        }},{upsert :true},function(err,data){
            if(err){
                res.status(500).send(err);
            }
            else{
                res.send(data);
            }
    })
});
    
app.delete('/admin/editNews',isadmin,(req,res)=>{
    
    news.findOneAndDelete({'title':req.body.title},function(err,news){
        if(err) res.status(500).send(err);
        else
         res.send('Deleted Successfully');
    })
})

app.post('/admin/logout',isadmin,(req,res)=>{
    req.session.destroy();
    res.send("logged out");
})


app.get('/getlatestnews',(req,res)=>{
    news.find({}).sort({publishedAt : -1}).limit(3).exec(function (err,topnews){
        if(err)return res.status(500).send('no latest news');
        res.send(topnews);
    })
})

app.post('/postquery',(req,res)=>{
    queries.create(req.body,function(err,query){
        if(err) res.status(500).send(err.message);
        res.send("query submitted successfully");
    })  
})

const server = app.listen(port,host,()=>{
    console.log(`express server listening on host ${host} port ${port}`);
});