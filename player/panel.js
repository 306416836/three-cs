import {
	address
} from './util.js';
import {
	creatSocket,
	postFetch,
	login
} from './socket.js';
import {
	aiplayer,
	useplayer,
	otherplayer,
	personList
} from './player.js';
import * as SkeletonUtils from './three/utils/SkeletonUtils.js';
import {
	Group,
	PositionalAudio
} from 'three';
import {
	Nav
} from './nav.js';
let gltf, gun, personGroup, bulletGroup, camera, io, audioList, listener, bloodMap;
let navs = new Nav('navigation')
const restart = document.getElementById('restart')
const play = document.getElementById('play')
const single = document.getElementById('single')
const multiple = document.getElementById('multiple')
const chat = document.getElementById('chat')
const chatlist = document.getElementById("chatList");
let boundaryArray = []
let leaveList = []
let enumType = {
	join: '加入',
	leave: '离开',
}
boundaryArray = boundaryArray
	.concat(495, 0, 495).concat(495, 0, 380).concat(250, 0, 380).concat(250, 0, 375).concat(495, 0, 375)
	.concat(495, 0, -375).concat(250, 0, -375).concat(250, 0, -380).concat(495, 0, -380).concat(495, 0, -495)
	.concat(-495, 0, -495).concat(-495, 0, -380).concat(-250, 0, -380).concat(-250, 0, -375).concat(-495, 0, -375)
	.concat(-495, 0, 375).concat(-250, 0, 375).concat(-250, 0, 380).concat(-495, 0, 380).concat(-495, 0, 495)
	.concat(495, 0, 495).concat(0, 0, 0)
	.concat(250, 0, 250).concat(250, 0, -250).concat(-250, 0, -250).concat(-250, 0, 250).concat(250, 0, 250);

export function initpanel(gltfs, guns, personGroups, bulletGroups, cameras, audioLists, listeners, bloodMaps) {
	gltf = gltfs, gun = guns, personGroup = personGroups, bulletGroup = bulletGroups, camera = cameras, audioList =
		audioLists, listener = listeners, bloodMap = bloodMaps;
	play.addEventListener('click', function() {
		document.getElementById('select-layer').style.display = 'flex'
		this.style.display = 'none'
	})
	single.addEventListener('click', function() {
		greatAi()
	})
	multiple.addEventListener('click', async function() {
		let userId = await login()
		let roomData = await postFetch('creatRooms', {
			name: 'cs111',
			userId
		})
		if (!roomData.data) {
			alert("渣渣服务器已满···先玩单人模式吧！！")
			return
		}
		greatRoom(roomData.data)
	})
	return {
		navs,
		personList
	}
}

function hidePanel(isMobile) {
	document.getElementById('init-layer').style.display = 'none';
	!isMobile && document.body.requestPointerLock();
	navs.navigation.style.display = 'block';
	!isMobile && document.body.addEventListener('click', function() {
		if (!personList[0].playerModel.isDel) {
			document.body.requestPointerLock(); //隐藏鼠标光标
		}
	})
}

function greatRoom(roomObj) {
	const socket = creatSocket(roomObj)
	chat.style.display = 'block'
	const para = document.createElement("div");
	const node = document.createTextNode('当前系统在线人数' + roomObj.list.length + '人');
	para.appendChild(node);
	chatlist.appendChild(para)
	roomObj.list.forEach((item) => {
		if (item.userId === roomObj.userId) {
			addUsePlayer(item.userId, item.camp, item.name, socket)
		} else {
			addOtherPlayer(item.userId, item.camp, item.name, socket)
		}
	})

	// 接收在线用户信息
	socket.on('online', (obj) => {
		if (obj.action == 'join') {
			if (leaveList.length > 0) {
				let person = leaveList.pop()
				person.join(obj.userId, obj.camp, obj.name)
			} else {
				addOtherPlayer(obj.userId, obj.camp, obj.name, socket)
			}
		}
		if (obj.action == 'leave') {
			let person = personList.find((item) => {
				return item.playerModel.uid == obj.userId
			})
			person.leave()
			leaveList.push(person)
		}
		const para = document.createElement("div");
		const node = document.createTextNode('有人' + enumType[obj.action] + '了游戏,当前共' + (personList.length -
			leaveList.length) + '人');
		para.appendChild(node);
		chatlist.appendChild(para)
		chatlist.scrollTop = chatlist.scrollHeight;
	});

	restart.addEventListener('click', function() {
		for (let i = 0; i < personList.length; i++) {
			if (personList[i].type == 'Use') {
				personList[i].restart(address(personList[i].playerModel.camp))
				return
			}
		}
	})

}

function greatAi() {
	addUsePlayer('player', 'blue')
	for (let i = 0; i < 4; i++) {
		addAiPlayer(i)
	}
	restart.addEventListener('click', function() {
		for (let i = 1; i < personList.length; i++) {
			personList[i].playerModel.blood = 100;
			personList[i].playerModel.position.copy(personList[i].panel[0])
			personList[i].playerModel.children[0].rotation.x = 0
			personList[i].playerModel.isDel = false
			personList[i].playerModel.kill = 0
			personList[i].panelIndex = 1
			personList[i].time = 0
			personList[i].scene.add(personList[i].playerModel);
		}
		personList[0].restart(address(personList[0].playerModel.camp))
	})
}

function greatSound() {
	const list = {}
	audioList.forEach((item) => {
		const sound = new PositionalAudio(listener);
		list[item.name] = sound.setBuffer(item)
	})
	return list
}

function addOtherPlayer(id, camp, name, socket) {
	const soundList = greatSound()
	const player = new otherplayer({
		playerGltf: SkeletonUtils.clone(gltf.scene),
		animations: gltf.animations,
		name: name,
		uid: id,
		position: address(camp),
		gun: gun.scene.clone(),
		scene: personGroup,
		bulletGroup: bulletGroup,
		boundary: boundaryArray,
		camp: camp,
		socket: socket,
		soundList: soundList,
		bloodMap: bloodMap
	})
	personList.push(player)
}

function addUsePlayer(id, camp, name, socket) {
	const soundList = greatSound()
	const isMobile = /Mobile|Android/i.test(navigator.userAgent)
	const player = new useplayer({
		playerGltf: SkeletonUtils.clone(gltf.scene),
		animations: gltf.animations,
		name: name,
		uid: id,
		position: address(camp),
		gun: gun.scene.clone(),
		scene: personGroup,
		bulletGroup: bulletGroup,
		boundary: boundaryArray,
		camp: camp,
		camera: camera,
		socket: socket,
		soundList: soundList,
		bloodMap: bloodMap,
		isMobile: isMobile
	})
	player.init()
	personList.push(player)
	hidePanel(isMobile)
}

function addAiPlayer(i) {
	const soundList = greatSound()
	const ai = new aiplayer({
		playerGltf: SkeletonUtils.clone(gltf.scene),
		animations: gltf.animations,
		name: 'ai' + i,
		position: address('red'),
		scene: personGroup,
		bulletGroup: bulletGroup,
		boundary: boundaryArray,
		playerList: [personList[0]],
		camp: 'red',
		gun: gun.scene.clone(),
		wise: i < 2 ? 1 : -1,
		soundList: soundList
	})
	ai.greatPanel()
	personList.push(ai)
}
