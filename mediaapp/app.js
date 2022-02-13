import express from 'express';
import path from 'path';
import bodyParser from 'body-parser';
import iplocate  from 'node-iplocate';
const publicIp = require('public-ip');
import "babel-polyfill"

import axios from 'axios';
let app = express();
import http from 'http';

let io = require('socket.io');

const port = process.env.PORT || 3001;
const host = '0.0.0.0';

app.set('port', process.env.PORT||3001);
app.use(express.static(path.join(__dirname,'/public')));
app.set('view engine','ejs');
app.set('views','./views');

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.set('trust proxy',true); 

app.get('/',(req,res)=>{
    (async () => {    
        const ip = await publicIp.v4();
        axios.get(`https://www.iplocate.io/api/lookup/${ip}?apikey=a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5`).then(function(results){
            axios.get(`https://api.openweathermap.org/data/2.5/weather?q=${results.data.city}&mode=json&units=metric&cnt=5&appid=6f847a931472e325fb75016ca5453151`).then(response => {    
                axios.get('http://localhost:3000/getlatestnews').then(resnew=>{
                    const data = {
                        isadmin : false,
                        weather: response.data,
                        loggedIn : false,
                        topnews :  resnew.data
                    }
            
                    res.render('template',{mode:"home",data:data});
                }).catch((err)=>{
                     const data = {
                        isadmin : false,
                        weather: response.data,
                        loggedIn : false,
                        topnews :  null
                    }
            
                    res.render('template',{mode:"home",data:data});
                })
            })
        }).catch((err) => {
            console.log(err);
            res.send(err);
        });
    })();
})

app.get('/sports',(req,res)=>{
    (async () => {    
        const ip = await publicIp.v4();
        axios.get(`https://www.iplocate.io/api/lookup/${ip}?apikey=a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5`).then(function(results){
            axios.get(`https://newsapi.org/v2/top-headlines?country=${results.data.country_code}&category=sports&apiKey=19d55efb4edf4ac0aaf34a5ee66b5974`).then(response => {    
                const data = {
                    isadmin : false,
                    sports: response.data,
                    loggedIn : false
                }
                res.render('template',{mode:"sports",data:data});
            })
        }).catch((err) => {
            console.log(err);
            res.send(err);
        });
    })();
})

app.get('/contactus',(req,res)=>{
    const data = {
        isadmin : false,
        loggedIn : false,
        error:''
    }
    res.render('template',{mode:"contactus",data:data})
})

app.post('/contactus',(req,res)=>{
    axios.post('http://localhost:3000/postquery',req.body).then(response =>{
        res.send(response.data);
    }).catch(err => {
        res.status(500).send(err);
    })
})

app.get('/aboutus',(req,res)=>{
    const data = {
        isadmin : false,
        loggedIn : false,
        error:''
    }
    res.render('template',{mode:"aboutus",data:data})
})


let server = http.createServer(app).listen(app.get('port'),function(){
    console.log(`express server listening on host ${host} port ${port}`);
})

io = require('socket.io')(server);
var clients = [];

io.sockets.on('connection',(socket)=>{


    socket.on('name',(name)=>{
        socket.name = name.message;
        clients.push(socket.name);
        socket.emit('users',clients);  
        socket.broadcast.emit('users',clients);  
    })

    socket.on('chat',(data)=>{
        
        var name = socket.name ? socket.name : "anonymous";

        let message = {
            message : data.message,
            name : name,
            datetime :  new Date().toLocaleString()
        };

        socket.emit('chat',message);
        socket.broadcast.emit('chat',message);
    })
})