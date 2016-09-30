/*
* @Author: Administrator
* @Date:   2016-09-10 00:45:16
* @Last Modified by:   Administrator
* @Last Modified time: 2016-09-20 01:24:18
*/

// 'use strict';


//node server example
/*var http = require('http');
server = http.createServer(function(req,res){
	res.writeHead(200,{
		'Content-Type':'text/plai
		n'
	});
	res.write('hello world!');
	res.end();
})
//监听80端口
server.listen(80);
console.log('server started');



//正式创建一个服务
	server = http.createServer(function(req,res){
	res.writeHead(200,{
		'Content-Type':'text/html' //将返回类型有text/plain改为text/html
	});
	res.write('<h1>hello world!</h1>');
	res.end;
});*/

/*//引入express
//作用是根据请求的URL返回相应的HTML页面
var express = require('express');
app = express();
server = require('http').createServer(app);
app.use('/',express.static(__dirname + '/www'));
server.listen(80);*/

/*//服务器及页面响应部分
var express = require('express'),
	app = express(),
	server = require('http').createServer(app),
	io = require('socket.io').listen(server);
app.use('/',express.static(__dirname + '/www'));
server.listen(80);


//socket部分
io.on('connection',function(socket){
	//接收并处理客户端发送的foo时间
	socket.on('foo',function(data){
		//将消息输出到控制台
		console.log(data);
	});
})*/


// 实际项目开始
//服务器及页面响应部分
//逗号表示统一声明多个变量

var express = require('express'),
	app = express(),
	server = require('http').createServer(app),
	io = require('socket.io').listen(server),
	users = [];	//保存所有在线用户的昵称
app.use('',express.static(__dirname + '/www'));
server.listen(80);

//socket 部分

io.on('connection',function(socket){
	//昵称设置
	socket.on('login',function(nickname){
		if(users.indexOf(nickname) > -1){
			socket.emit('nickExisted');
		}else{
			socket.userIndex = users.length;
			socket.nickname = nickname;
			users.push(nickname);
			socket.emit('loginSuccess');
			io.sockets.emit('system',nickname,users.length,'login');	//向所有连接到服务器的客户端发送当前登录用户的昵称
		};
	});

	//断开连接事件
	socket.on('disconnect',function(){
		//将断开连接的用户从users中删除
		users.splice(socket.userIndex, 1);
		//通知除自己以外的所有人
		socket.broadcast.emit('system',socket.nickname,users.length,'logout');
	});

	//接收新消息
	socket.on('postMsg',function(msg,color){
		//将消息发送到除自己外的所有用户
		socket.broadcast.emit('newMsg',socket.nickname,msg,color);
	});

	//接收客户端发来的图片
	socket.on('img',function(imgData){
		socket.broadcast.emit('newImg',socket.nickname,imgData);
	});

	
	
});
	