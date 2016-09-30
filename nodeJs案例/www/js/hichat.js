window.onload = function(){
	//实例并初始化hichat程序
	var hichat = new HiChat();
	hichat.init();
}

//定义hichat类
var HiChat = function(){
	this.socket = null;
};

//向原型中添加业务方法
HiChat.prototype = {
	init: function(){	//此方法初始化程序
		var that = this;
		//建立服务器的socket连接
		this.socket = io.connect();
		//监听socket的connect时间,此事件表示连接已经建立
		this.socket.on('connect',function(){
			//	连接到服务器后，显示昵称输入框
			document.getElementById('info').textContent = 'get yourself a nickname:)';
			document.getElementById('nickWrapper').style.display = 'block';
			document.getElementById('nicknameInput').focus();
		});
		//昵称设置的确定按钮
		document.getElementById('loginBtn').addEventListener("click", function(){
			var nickName = document.getElementById('nicknameInput').value.trim();
			//检查昵称输入框是否为空
			//trim()方法不兼容，IE8及以下，此处暂不考虑兼容性问题
			if(nickName.length !=0){
				//不为空，则发起一个login事件并将输入的昵称发送到服务器
				that.socket.emit('login',nickName);
			}else{
				//否则输入框获得焦点
				document.getElementById('nicknameInput').focus();
				alert("Pls enter the correct username ！")
			}
		},false);

		this.socket.on('nickExisted',function(){
			//显示昵称被占用的提示
			document.getElementById('info').textContent = '!nickname is taken, choose another pls';
		});

		//如果昵称没有被注册，则返回一个成功提示，并且隐藏遮罩层显示聊天界面
		this.socket.on('loginSuccess',function(){
			document.title = 'hichat | ' + document.getElementById('nicknameInput').value;
			document.getElementById('loginWrapper').style.display = 'none';//隐藏遮罩层，显示聊天界面
			document.getElementById('messageInput').focus();//让消息输入框获得焦点
		});

		this.socket.on('system',function(nickName,userCount,type){
			//判断用户是在线还是离开以显示不同的信息
			var msg = nickName + (type == 'login' ? '进入房间':'离开房间！');
			//调用_displayNewMsg方法
			that._displayNewMsg('系统消息：',msg,'#666');
			var p = document.createElement('p');
			p.textContent = msg;
			// document.getElementById("historyMsg").appendChild(p);
			//将在线人数显示到页面顶部
			document.getElementById('status').textContent = (userCount >1?'users':'user') +"  " + 'online' + "(" + userCount + ")" ;
		});

		//添加发送消息
		document.getElementById('sendBtn').addEventListener("click",function(){
			var messageInput = document.getElementById('messageInput'),
				msg = messageInput.value,
				//获取颜色
				color = document.getElementById('colorStyle').value;
			messageInput.focus();
			if(msg.trim().length !=0){
				that.socket.emit('postMsg',msg,color);//把消息发送到服务器
				that._displayNewMsg('me',msg,color);//把自己的消息显示在自己的窗口
			}
			messageInput.value = '';	
		},false);

		//接收服务器返回的别人的消息并显示在页面
		this.socket.on('newMsg',function(user,msg,color){
			that._displayNewMsg(user,msg,color);
		});

		//添加发送图片功能
		document.getElementById('sendImage').addEventListener('change',function(){
			//检查是否有文件被选中
			if(this.files.length !=0){
				//获取文件并用FileReader进行读取
				var file = this.files[0],
					reader = new FileReader(),
					color = document.getElementById('colorStyle').value;
				if(!reader){
					that._displayNewMsg('system','!your browser doesn\' support fileReader','red');
					this.value = '';
					return;
				};
				reader.onload = function(e){
					//读取成功，显示到页面并发送到服务器
					console.log(2);
					this.value = '';
					//如果给这里和下边传color参数可以是设置用户名的颜色
					that.socket.emit('img',e.target.result);
					that._displayNewIMage('me',e.target.result);
				};
				reader.readAsDataURL(file);
			};
		},false);
		//如果给这里和上边传color参数可以是设置用户名的颜色
		this.socket.on('newImg',function(user,img){
			that._displayNewIMage(user,img);
		});

		//添加表情
		//鼠标点击emoji让emoji显示
		this._initialEmoji();
		document.getElementById('emoji').addEventListener('click',function(e){
			var emojiwrapper = document.getElementById('emojiWrapper');
			emojiwrapper.style.display = 'block';
			e.stopPropagation();	//组织事件冒泡
		},false);

		//鼠标前几emoji以外的地方让emoji隐藏
		document.body.addEventListener('click',function(e){
			var emojiWrapper = document.getElementById('emojiWrapper');
			if(e.target != emojiWrapper){
				emojiWrapper.style.display = 'none';
			}
		});

		document.getElementById('emojiWrapper').addEventListener('click',function(e){
			//获取被点击的表情
			var target = e.target;
			if(target.nodeName.toLowerCase() === 'img'){
				var messageInput = document.getElementById('messageInput');
				messageInput.focus();
				messageInput.value = messageInput.value + '[emoji:' + target.title + ']';
			};
		},false);

		//添加按键操作
		document.getElementById('nicknameInput').addEventListener('keyup',function(e){
			if(e.keyCode == 13){
				var nickName = document.getElementById('nicknameInput').value;
				if(nickName.trim().length !=0){
					that.socket.emit('login',nickName);
				};
			};
		},false);

		document.getElementById('messageInput').addEventListener('keydown',function(e){
			var massageInput = document.getElementById('messageInput'),
				msg = messageInput.value,
				color = document.getElementById('colorStyle').value;
				if(e.keyCode == 13 && msg.trim() != 0){
					messageInput.value = '';
					that.socket.emit('postMsg',msg,color);
					that._displayNewMsg('me',msg,color);
				};
		},false);

		//清屏
		document.getElementById('clearBtn').addEventListener('click',function(){
			document.getElementById('historyMsg').innerHTML = '';
		});
	},





	//发送消息部分并设置字体颜色
	_displayNewMsg: function(user,msg,color){
		var container = document.getElementById('historyMsg'),
		msgToDisplay = document.createElement('p'),
		date = new Date().toTimeString().substr(0,8),
		//将消息中的表情转换为图片
		msg = this._showEmoji(msg);
		msgToDisplay.style.color = color || '#000';
		msgToDisplay.innerHTML = '<span class="timespan">' + user + '&nbsp;&nbsp;' + date + ':</span><br>' + msg;		
		container.appendChild(msgToDisplay);
		container.scrollTop = container.scrollHeight;	

	},

	// 图片显示函数
	_displayNewIMage: function(user,imgData,color){
		var container = document.getElementById('historyMsg'),
		msgToDisplay = document.createElement('p'),
		date = new Date().toTimeString().substr(0,8);
		msgToDisplay.style.color = color || '#000';
		msgToDisplay.innerHTML = user + '<span class="timespan">(' 
			+ date + '):</span> <br>' 
			+ '<a href="' + imgData + '" target="_blank" ><img src="' + imgData 
			+ '"/></a>';		
		container.appendChild(msgToDisplay);
		container.scrollTop = container.scrollHeight;	
	},

	//显示全部表情的函数
	_initialEmoji:function(){
		var emojiContainer = document.getElementById('emojiWrapper'),
			docFragment = document.createDocumentFragment();
		for (var i = 69;i > 0; i--){
			var emojiItem = document.createElement('img');
			emojiItem.src = '../content/emoji/' + i + '.gif';
			emojiItem.title = i;
			docFragment.appendChild(emojiItem);
		};
		emojiContainer.appendChild(docFragment);
	},

	//把已选择的表情显示在对话框
	_showEmoji: function(msg){
		var match,result = msg,
			reg = /\[emoji:\d+\]/g,
			emojiIndex,
			totalEmojiNum = document.getElementById('emojiWrapper').children.length;
		while (match = reg.exec(msg)){
			emojiIndex = match[0].slice(7,-1);
			if(emojiIndex > totalEmojiNum){
				result = result.replace(match[0],'[x]');
			}else {
				result = result.replace(match[0],'<img class="emoji" src="../content/emoji/' + emojiIndex + '.gif"/>');
			};
		};
		return result;
	}
}