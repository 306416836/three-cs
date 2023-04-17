const host = "ws://127.0.0.1"; //socket 网址
const url = "http://127.0.0.1"; //接口网址
const publicKey = `` // ras的公钥 jsencrypt.js
export function postFetch(path, param) {
	return fetch(url + path, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		mode: "cors",
		body: JSON.stringify(param)
	}).then(function(response) {
		if (response.status === 200) {
			return response.json();
		} else {
			return {}
		}
	});
}

export async function login() {
	let code = 'three' + Math.random()
	let encrypt = new JSEncrypt();
	encrypt.setPublicKey(publicKey);
	let encrypted = encrypt.encrypt(code);
	let res = await postFetch('initcode', {
		code,
		encrypted
	})
	return res.data
}


export function creatSocket(roomObj) {
	const socket = io(host, {
		query: {
			room: roomObj.room,
			userId: roomObj.userId,
			camp: roomObj.camp,
			name: roomObj.name,
		},
		transports: ['websocket'],
	});
	socket.userId = roomObj.userId
	// 系统事件
	socket.on('disconnect', (msg) => {
		console.log('#disconnect', msg);
	});

	socket.on('disconnecting', () => {
		console.log('#disconnecting');
	});

	socket.on('error', () => {
		console.log('#error');
	});

	return socket
}
