import {
	pointToSegmentDistance,
	checkLineCross,
	distance
} from './Math2d.js';
import {
	creatText,
	address,
	mix
} from './util.js';
import {
	SphereGeometry,
	MeshBasicMaterial,
	Mesh,
	Vector3,
	Vector2,
	Raycaster,
	AnimationMixer,
	SpriteMaterial,
	ShaderMaterial,
	MeshPhongMaterial,
	LoopOnce,
	Group,
	SkeletonHelper,
	BoxGeometry,
	CylinderGeometry,
	Sprite,
	Color
} from 'three';

export const personList = []

class gltfAnimations {

	constructor(animations, onceNameList, playerModel) {

		this.baseActions = {};
		this.nowActions = '';
		this.mixer = new AnimationMixer(playerModel);
		this.onceNameList = onceNameList ? onceNameList : [];
		this.greatActions(animations);
	}
	greatActions(animations) {
		for (let i = 0; i < animations.length; ++i) {

			const clip = animations[i];
			const name = clip.name;
			const action = this.mixer.clipAction(clip);
			action.enabled = true;
			action.setEffectiveTimeScale(1);
			if (this.onceNameList.indexOf(name) >= 0) {
				action.setEffectiveWeight = 0.5;
				action.setLoop(LoopOnce);
			}

			this.baseActions[name] = action;

		}
		this.loopActive("静态")
	}
	loopActive(newActions) {
		if (newActions == this.nowActions) return
		this.baseActions[newActions].time = 0;
		this.baseActions[newActions].play();
		this.baseActions[newActions].enabled = true;
		if (this.nowActions) {

			this.baseActions[this.nowActions].crossFadeTo(this.baseActions[newActions], 0.35);

		} else {

			this.baseActions[newActions].fadeIn(0.35);

		}

		this.nowActions = newActions;

	}
	onceActive(newActions) {

		this.baseActions[newActions].time = 0;
		this.baseActions[newActions].play();
		this.baseActions[newActions].enabled = true;

	}
	getActive(newActions) {

		return this.baseActions[newActions];

	}

}

class player extends gltfAnimations {
	constructor(option) {
		super(option.animations, ['重伤', '射击', '跳跃'], option.playerGltf)
		this.playerModel = new Group()
		this.playerModel.add(option.playerGltf)
		this.playerModel.name = option.name;
		this.playerModel.isDel = false
		this.playerModel.kill = 0
		this.playerModel.children[0].scale.set(23, 23, 23);
		this.playerModel.position.copy(option.position);
		this.playerModel.uid = option.uid
		this.playerModel.camp = option.camp;
		this.playerModel.super = this
		this.soundList = option.soundList
		for (let key in this.soundList) {
			this.playerModel.add(this.soundList[key])
		}
		this.boundary = option.boundary;
		this.scene = option.scene;
		this.bulletGroup = option.bulletGroup
		this.bulletArray = []
		this.sight = new Vector3()
		this.moveSpeed = 2;
		this.time = 0;
		this.gun = option.gun.children[0];
		this.gun.children.forEach((item) => {
			item.player = this.playerModel
		})
		this.gunFire = new Group()
		this.gunFire.visible = false
		this.createCone(new Vector3(73, -0.5, 0.2), this.gunFire)
		this.gun.add(this.gunFire)
	}
	createShell() {
		const geometry = new CylinderGeometry(1, 1, 3, 5);
		const material = new MeshPhongMaterial({
			color: '#878000',
			shininess: 100
		});
		const cylinder = new Mesh(geometry, material);
		let position = this.gunFire.children[0].position
		cylinder.position.set(position.x - 25, position.y + 2, position.z + 2)
		this.gunFire.add(cylinder);
		this.bulletArray.push({
			mesh: cylinder,
			time: 0,
			type: 'shell',
		});
	}
	createCone(position, group) {

		const material = new ShaderMaterial({
			uniforms: {
				color: {
					value: new Color('#ffe30e')
				},
			},
			vertexShader: `
				varying vec3 vNormal; void main() { vNormal = normalize( normalMatrix * normal ); gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 ); }
			`,
			fragmentShader: `
				uniform vec3 color;
				varying vec3 vNormal; void main() {
				float intensity = pow( 0.6 - dot( vNormal, vec3(0,0,0.6) ), 16.2 ) ;
				gl_FragColor = vec4( color , 0.1 ) * intensity;
				}
			`,
			side: 1,
			blending: 2,
			transparent: true
		});

		const mesh = new Mesh(new SphereGeometry(5, 10, 10), material);
		mesh.position.copy(position)
		mesh.player = this.playerModel
		group.add(mesh);

	}
	greatRayMesh() {
		this.skeleton = new SkeletonHelper(this.playerModel);
		this.gunBone = this.skeleton.bones.find(bone => bone.name === 'mixamorigRightHand');
		this.skeleton.bones.forEach((item) => {
			if (item.name === 'mixamorigRightHand' && this.type != 'Use') {
				this.gun.position.set(2, 10, 8)
				this.gun.rotation.y = Math.PI / 2
				this.gun.rotation.x = Math.PI / 2
				this.gunBone = item
				this.gunBone.add(this.gun);
			} else if (item.name === 'mixamorigLeftHand' && this.type == 'Use') {
				this.gun.position.set(28, -18, 0)
				this.gun.rotation.y = Math.PI / 4 * 3.7
				this.gun.rotation.x = Math.PI / 3 * 3
				this.gun.rotation.z = -Math.PI / 8 * 2
				this.gunBone = item
				this.gunBone.add(this.gun);
			} else if (item.name === 'mixamorigJaw') {
				item.add(this.initMesh("头", 15, 25))
			} else if (item.name === 'mixamorigSpine1') {
				item.add(this.initMesh("身躯", 35, 55))
			} else if (item.name === 'mixamorigRightUpLeg' || item.name === 'mixamorigLeftUpLeg') {
				item.add(this.initMesh("大腿", 15, 35))
			} else if (item.name === 'mixamorigLeftLeg' || item.name === 'mixamorigRightLeg') {
				item.add(this.initMesh("小腿", 10, 40, 10))
			} else if (item.name === 'mixamorigRightToeBase' || item.name === 'mixamorigLeftToeBase') {
				item.add(this.initMesh("脚", 10, 20, 10))
			}
		})
	}
	greatBullet() {
		this.gunFire.visible = true
		this.gunFire.time = 10
		if (this.soundList['gun'].isPlaying) {
			this.soundList['gun'].stop()
		}
		this.soundList['gun'].play(0)
		this.createShell()
	}
	initMesh(name, w, h, x = 20) {
		const geometrys = new BoxGeometry(w, h, x);
		const material = new MeshBasicMaterial({
			color: '#ff0000'
		});
		const sphere = new Mesh(geometrys, material);
		sphere.name = name
		sphere.visible = false
		sphere.player = this.playerModel
		return sphere
	}
	init() {
		this.greatRayMesh()
		this.scene.add(this.playerModel);
	}
	update(mixerUpdateDelta) {
		this.gunFire.visible && this.gunFire.time--
		this.gunFire.children[0].rotation.x += 0.1
		this.gunFire.time <= 0 && (this.gunFire.visible = false)
		if (this.bulletArray.length > 0) {

			for (let i = 0; i < this.bulletArray.length; i++) {

				this.bulletArray[i].time++;
				if (this.bulletArray[i].type == 'blood') {
					this.bulletArray[i].mesh.position.addScalar(0.3)
				}
				if (this.bulletArray[i].type == 'shell') {
					this.bulletArray[i].mesh.position.add(new Vector3(0, 1, -0.8))
					this.bulletArray[i].mesh.rotation.x += 0.1
				}
				if (this.bulletArray[i].time > 30) {
					this.clearCache(this.bulletArray[i].mesh, this.bulletArray[i].type);
					this.bulletArray.shift();
					i--;
				}

			}

		}
		if (this.playerModel.blood <= 0) {
			this.time++
			this.playerModel.children[0].rotation.x -= 0.05;
			if (this.time > 20) {
				this.scene.remove(this.playerModel)
			}
		} else {
			this.mixer.update(mixerUpdateDelta);

		}
	}
	clearCache(item, type) {

		item.geometry.dispose();
		if (Array.isArray(item.material)) {

			item.material.forEach(function(item) {

				item.dispose();

			});

		} else {

			item.material.dispose();

		}
		type == 'shell' ? this.gunFire.remove(item) : this.bulletGroup.remove(item);

	}


}

export class aiplayer extends player {
	constructor(option) {
		super(option);
		this.playerModel.blood = 100;
		this.playerList = option.playerList
		this.choose = this.playerList[0].playerModel
		this.frequency = {
			time: 0,
			max: 20
		}
		this.route = option.wise
		this.panel = []
		this.panelIndex = 1
		this.type = 'AI'
		this.init()
	}
	greatPanel() {
		let inx = this.playerModel.position.x
		let inz = this.playerModel.position.z
		let vec3 = new Vector3(this.playerModel.position.x, 0, this.playerModel.position.z);
		this.panel.push(vec3);
		let num = 0
		while (num != 3) {
			vec3 = vec3.clone()
			if (vec3.x >= -1 * inx && Math.abs(vec3.z) < 350) {
				vec3.z += this.moveSpeed * this.route
				vec3.x = -1 * inx
			} else if (vec3.x <= inx && Math.abs(vec3.z) < 350) {
				vec3.z -= this.moveSpeed * this.route
				vec3.x = inx
			} else if (vec3.z >= 350 && vec3.x >= inx && vec3.x <= -1 * inx) {
				vec3.x -= this.moveSpeed * this.route
			} else if (vec3.z <= -350 && vec3.x >= inx && vec3.x <= -1 * inx) {
				vec3.x += this.moveSpeed * this.route
			} else {
				num++
				vec3.z = vec3.z > 350 ? vec3.z - this.moveSpeed : vec3.z + this.moveSpeed
			}
			if (Math.abs(vec3.z - inz) < 2 && num == 2) {
				num = 3
			}
			this.panel.push(vec3)
		}
	}
	planning(user) {
		const p1 = {
			x: this.playerModel.position.x,
			y: this.playerModel.position.z
		};
		const p2 = {
			x: user.position.x,
			y: user.position.z
		};
		for (let i = 3; i < this.boundary.length; i = i + 3) {
			if (this.boundary[i] == 0 || this.boundary[i - 3] == 0) continue
			const p3 = {
				x: this.boundary[i - 3],
				y: this.boundary[i - 1],
			};
			const p4 = {
				x: this.boundary[i],
				y: this.boundary[i + 2],
			};
			if (checkLineCross(p1, p2, p3, p4)) {
				this.panelIndex++
				if (this.panelIndex == this.panel.length) this.panelIndex = 1
				this.playerModel.position.copy(this.panel[this.panelIndex - 1])
				this.playerModel.lookAt(this.panel[this.panelIndex])
				this.loopActive("向前跑")
				return;
			}
		}
		this.playerModel.lookAt(user.position.x, 0, user.position.z)
		if (this.frequency.time == this.frequency.max) {
			this.greatBullet(user)
			this.loopActive("静态")
			this.frequency.time = 0
		}
		this.frequency.time++
	}
	greatBullet(user) {
		super.greatBullet()
		this.onceActive("射击")
		user.blood -= 10
	}
	update(mixerUpdateDelta) {
		super.update(mixerUpdateDelta);
		if (this.playerModel.blood > 0 && this.panel.length > 0) {
			this.planning(this.choose)
		}
		if (this.playerList[0].playerModel.kill == 4) {
			document.getElementById('over-layer').style.display = 'block'
			document.getElementById('win').innerText = 'You Win'
			document.getElementById('kill').innerText = this.playerList[0].playerModel.kill
			document.exitPointerLock()
		}
	}
}

export class otherplayer extends player {
	constructor(option) {
		super(option);
		this.init()
		this.type = 'Other'
		this.baseActions['弯腰'].setEffectiveWeight(0.5);
		this.baseActions['弯腰'].play()
		this.playerModel.blood = 100
		option.socket.on("server", (res) => {
			if (res.uid == this.playerModel.uid) {
				this.playerModel.position.set(res.position.x, res.position.y - 35, res.position.z)
				this.baseActions['弯腰'].setEffectiveWeight(res.maxW);
				this.playerModel.rotation.y = res.rotationY + Math.PI;
				this.playerModel.blood = res.blood;
				this.playerModel.isDel = res.isDel;
				this.playerModel.kill = res.kill;
				this.loopActive(res.nowActions)
			}
		});
		option.socket.on("bullet", (res) => {
			if (res.uid == this.playerModel.uid) {
				res.revive ? this.revive() : this.greatBullet(res)
			}
			if (res.tagid) {
				for (let i = 0; i < personList.length; i++) {
					if (personList[i].playerModel.uid == res.tagid) {
						personList[i].playerModel.blood = res.blood
						personList[i].playerModel.isDel = res.isDel;
						personList[i].playerModel.kill = res.kill;
						return
					}
				}
			}
		});
	}
	revive() {
		this.playerModel.isDel = false
		this.playerModel.blood = 100
		this.playerModel.children[0].rotation.x = 0
		this.time = 0
		this.scene.add(this.playerModel)
	}
	join(uid, camp, name) {
		this.playerModel.uid = uid
		this.playerModel.camp = camp
		this.playerModel.name = name
		this.playerModel.isDel = false
		this.playerModel.blood = 100
		this.playerModel.kill = 0
		this.time = 0
		this.playerModel.position.copy(address(camp))
		this.playerModel.children[0].rotation.x = 0
		this.scene.add(this.playerModel)
	}
	leave() {
		this.playerModel.isDel = true
		this.playerModel.blood = 0
		this.scene.remove(this.playerModel)
	}
	greatBullet(res) {
		super.greatBullet()
		this.onceActive("射击")
		if (res.position) {
			const geometry = new SphereGeometry(0.5, 4, 2);
			const material = new MeshBasicMaterial({
				color: '#000'
			});
			const sphere = new Mesh(geometry, material);
			sphere.position.copy(res.position);
			this.bulletGroup.add(sphere);
			this.bulletArray.push({
				mesh: sphere,
				time: 0,
				type: 'bullet'
			});
		}
	}
}


export class useplayer extends player {
	constructor(option) {
		option.playerGltf.children[0].position.set(0, -22 / 15, 0.5)
		option.playerGltf.children[0].rotation.z = Math.PI
		option.playerGltf.children[0].children[0].material.side = 0
		option.playerGltf.children[0].children[1].children[0].visible = false
		option.playerGltf.children[0].children[1].children[1].visible = false
		super(option);
		this.type = 'Use'
		this.socket = option.socket
		this.playerModel.bloods = 100;
		this.playerModel.wars = this.wars;
		this.keyStates = {};
		this.raycaster = new Raycaster();
		this.playerDirection = option.position;
		this.playerVelocity = new Vector3(option.position.x, 35, option.position.y);
		this.camera = option.camera;
		this.camera.position.copy(option.position);
		this.playerOnFloor = true;
		this.playerModel.progress = document.getElementById('progress');
		this.playerModel.heart = document.getElementById('heart');
		this.isMobile = option.isMobile
		this.maxW = 0
		this.sprite = ''
		this.greatBloods(option.bloodMap)
		Object.defineProperty(this.playerModel, 'blood', {
			get() {
				return this.bloods
			},
			set(val) {
				if (!this.isDel) {
					this.wars(val, this.bloods)
					this.bloods = val;
				}
			}
		})
	}
	greatBloods(bloodMap) {
		const material = new SpriteMaterial({
			map: bloodMap,
			depthWrite: false,
			side: 2,
			opacity: 0.2
		});
		this.sprite = new Group()
		this.sprite.add(new Sprite(material))
		this.sprite.children[0].position.set(-20, 0, -50)
		this.sprite.children[0].scale.set(100, 100, 0)
		this.sprite.visible = false
		this.bulletGroup.add(this.sprite);
	}
	wars(val) {
		let value = val < 0 ? 0 : val
		this.progress.style.width = value + '%';
		this.heart.style.left = value + '%';
		this.heart.innerText = value + '%';
		this.super.sprite.visible = true
		this.super.sprite.time = 10
		if (value == 0) {
			this.isDel = true
			document.getElementById('over-layer').style.display = 'block'
			document.getElementById('kill').innerText = this.kill
			document.getElementById('win').innerText = 'Game Over'
			document.exitPointerLock()
		}
	}
	init() {
		super.init(true)
		this.baseActions['弯腰'].setEffectiveWeight(0.5);
		this.baseActions['弯腰'].play()
		this.isMobile ? this.initPhone() : this.initWindow()
	}
	initPhone() {
		const canvas = document.querySelector('#phoneKeyset');
		canvas.style.display = 'block'
		const ctx = canvas.getContext('2d');
		let leftArc = {
			clientX: 100,
			clientY: window.innerHeight - 60,
			identifier: ''
		}
		let rightArc = {
			clientX: window.innerWidth - 100,
			clientY: window.innerHeight - 100,
			identifier: ''
		}
		canvas.width = window.innerWidth;
		canvas.height = window.innerHeight;
		let minWidth = window.innerWidth / 2
		this.keyStates = {
			'Space': false,
			'KeyA': false,
			'KeyW': false,
			'KeyS': false,
			'KeyD': false
		}
		const dawArc = (point) => {
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			ctx.beginPath();
			ctx.arc(leftArc.clientX, leftArc.clientY, 50, 0, 2 * Math.PI);
			ctx.stroke();
			ctx.beginPath();
			ctx.arc(rightArc.clientX, rightArc.clientY, 50, 0, 2 * Math.PI);
			ctx.stroke();
			for (let i = 0; i < point.length; i++) {
				ctx.beginPath();
				ctx.arc(point[i].clientX, point[i].clientY, 15, 0, 2 * Math.PI);
				ctx.stroke();
			}
		}
		const handleGestureEnd = (e) => {
			if (e.changedTouches[0].clientX > window.innerWidth / 2) {
				if (this.playerModel.blood > 0) {
					this.greatBullet();
					this.onceActive("射击")
				}
			}
			if (e.touches.length == 0) {
				this.keyStates = {
					'Space': false,
					'KeyA': false,
					'KeyW': false,
					'KeyS': false,
					'KeyD': false
				}
				this.loopActive('静态');
				ctx.clearRect(0, 0, canvas.width, canvas.height);
			}
		}
		const handleGestureMove = (e) => {
			for (let i = 0; i < e.touches.length; i++) {
				if (e.touches[i].clientX > minWidth) {
					sway(e.touches[i])
				} else {
					move(e.touches[i])
				}
			}
			dawArc(e.touches)
		}

		const sway = (point) => {
			this.camera.rotation.y -= (point.clientX - rightArc.clientX) / 1500;
			this.camera.rotation.x -= (point.clientY - rightArc.clientY) / 1500;
			if (this.camera.rotation.x < -0.4) {
				this.camera.rotation.x = -0.4
			}
			if (this.camera.rotation.x > 0.2) {
				this.camera.rotation.x = 0.2
			}
			this.maxW = 0.4 - (this.camera.rotation.x + 0.4) / 0.6 * 0.4
			this.playerModel.rotation.y = this.camera.rotation.y
			this.baseActions['弯腰'].setEffectiveWeight(this.maxW);
		}

		const move = (point) => {
			let disX = point.clientX - leftArc.clientX
			let disY = point.clientY - leftArc.clientY
			let choose = Math.abs(disX) - Math.abs(disY) > 0 ? 'broadwise' : 'vertical'
			const keyStates = {
				'Space': false,
				'KeyA': false,
				'KeyW': false,
				'KeyS': false,
				'KeyD': false
			}
			switch (choose) {
				case 'broadwise':
					if (disX < 0) {
						keyStates.KeyA = true;
					} else if (disX > 0) {
						keyStates.KeyD = true;
					}
					break;
				case 'vertical':
					if (disY > 0) {
						keyStates.KeyS = true;
					} else if (disY < 0) {
						keyStates.KeyW = true;
					}
					break;
				default:
					break;
			}
			this.keyStates = keyStates
		}
		document.addEventListener('touchmove', handleGestureMove);
		document.addEventListener('touchend', handleGestureEnd);
	}
	initWindow() {
		document.body.addEventListener('mousemove', (event) => {
			if (document.pointerLockElement === document.body) {
				this.camera.rotation.y -= event.movementX / 1000;
				this.camera.rotation.x -= event.movementY / 1000;
				if (this.camera.rotation.x < -0.4) {
					this.camera.rotation.x = -0.4
				}
				if (this.camera.rotation.x > 0.2) {
					this.camera.rotation.x = 0.2
				}
				this.maxW = 0.4 - (this.camera.rotation.x + 0.4) / 0.6 * 0.4
				this.playerModel.rotation.y = this.camera.rotation.y
				this.baseActions['弯腰'].setEffectiveWeight(this.maxW);
			}
		});

		document.addEventListener('keydown', (event) => {

			this.keyStates[event.code] = true;

		});


		document.addEventListener('keyup', (event) => {

			this.keyStates[event.code] = false;
			this.loopActive('静态');

		});


		document.addEventListener('mousedown', () => {
			if (this.playerModel.blood > 0) {
				this.greatBullet();
				this.onceActive("射击")
			}
		});
	}
	restart(vec3) {
		this.playerVelocity = new Vector3(vec3.x, 35, vec3.y);
		this.playerModel.position.copy(vec3);
		this.camera.position.copy(vec3);
		this.playerModel.isDel = false;
		this.playerModel.blood = 100;
		this.scene.add(this.playerModel);
		this.playerModel.children[0].rotation.x = 0
		this.playerModel.kill = 0
		this.time = 0
		document.getElementById('over-layer').style.display = 'none'
		this.socket && this.socket.emit("bullet", {
			revive: true,
			position: ''
		});
	}
	greatBullet() {
		super.greatBullet()
		this.camera.getWorldDirection(this.playerDirection);
		this.raycaster.setFromCamera(new Vector2(0, 0), this.camera);
		if (!this.isMobile) {
			this.camera.rotation.x += Math.sin(Math.random() * 10) / 100; //开枪后的鼠标浮动
			this.camera.rotation.y += Math.sin(Math.random() * 10) / 100;
		}
		const intersects = this.raycaster.intersectObject(this.scene, true);
		if (intersects.length) {
			if (intersects[0].object.player && intersects[0].object.player.camp != this.playerModel.camp) {
				let blood = intersects[0].object.name == "头" ? 100 : 10;
				let sprite = creatText(`-${blood}`, '#f00', 30)
				sprite.position.set(intersects[0].object.player.position.x, 30, intersects[0].object.player.position
					.z);
				this.bulletGroup.add(sprite)
				intersects[0].object.player.blood -= blood;
				intersects[0].object.player.super.onceActive("重伤")
				if (intersects[0].object.player.blood <= 0 && !intersects[0].object.player.isDel) {
					this.playerModel.kill++
					intersects[0].object.player.isDel = true
				}
				this.bulletArray.push({
					mesh: sprite,
					time: 0,
					type: 'blood'
				});
				this.socket && this.socket.emit("bullet", {
					tagid: intersects[0].object.player.uid,
					blood: intersects[0].object.player.blood,
					isDel: intersects[0].object.player.isDel,
					kill: intersects[0].object.player.kill,
					position: ''
				});
			} else {
				const geometry = new SphereGeometry(0.5, 4, 4);
				const material = new MeshBasicMaterial({
					color: '#000'
				});
				const sphere = new Mesh(geometry, material);
				sphere.position.copy(intersects[0].point);
				this.bulletGroup.add(sphere);
				this.bulletArray.push({
					mesh: sphere,
					time: 0,
					type: 'bullet'
				});
				this.socket && this.socket.emit("bullet", {
					position: intersects[0].point
				});
			}

		}
	}
	getForwardVector() {

		this.camera.getWorldDirection(this.playerDirection);
		this.playerDirection.y = 0;
		return this.playerDirection;

	}
	getSideVector() {

		this.camera.getWorldDirection(this.playerDirection);
		this.playerDirection.y = 0;
		this.playerDirection.cross(this.camera.up);
		return this.playerDirection;

	}
	planning(v3) {
		const p1 = {
			x: v3.x,
			y: v3.z
		};
		for (let i = 3; i < this.boundary.length; i = i + 3) {
			if (this.boundary[i] == 0 || this.boundary[i - 3] == 0) {
				continue
			}
			const p3 = {
				x: this.boundary[i - 3],
				y: this.boundary[i - 1],
			};
			const p4 = {
				x: this.boundary[i],
				y: this.boundary[i + 2],
			};
			const dis = pointToSegmentDistance(p1, p3, p4)
			if (dis < 10) {
				return true
			}
			for (let i = 0; i < personList.length; i++) {
				if (personList[i].playerModel.uid == this.playerModel.uid) continue
				if (distance(p1, {
						x: personList[i].playerModel.position.x,
						y: personList[i].playerModel.position.z
					}) < 10 && personList[i].playerModel.blood > 0) {
					return true
				}
			}
		}
		return false
	}
	update(mixerUpdateDelta) {
		super.update(mixerUpdateDelta)
		this.sprite.visible && this.sprite.time--
		this.sprite.time <= 0 && (this.sprite.visible = false)
		let move;
		let keyLoop = ''
		if (this.keyStates['KeyW']) {
			keyLoop = '向前跑'
			move = this.getForwardVector().multiplyScalar(this.moveSpeed);

		}

		if (this.keyStates['KeyS']) {
			keyLoop = '退后跑'
			move = this.getForwardVector().multiplyScalar(-this.moveSpeed);

		}

		if (this.keyStates['KeyA']) {
			keyLoop = '向左跑'
			move = this.getSideVector().multiplyScalar(-this.moveSpeed);

		}

		if (this.keyStates['KeyD']) {
			keyLoop = '向右跑'
			move = this.getSideVector().multiplyScalar(this.moveSpeed);
		}
		if (move) {
			!this.soundList['run'].isPlaying && this.soundList['run'].play()
			this.loopActive(keyLoop);
			this.playerVelocity.add(move);
			if (this.planning(this.playerVelocity)) {
				this.playerVelocity.sub(move);
			}
		} else {
			this.soundList['run'].isPlaying && this.soundList['run'].stop()
		}

		if (this.playerOnFloor) {

			if (this.keyStates['Space']) {
				this.playerVelocity.y = 45;
				this.playerOnFloor = false;
				this.onceActive('跳跃');
			}

		} else {

			this.playerVelocity.y -= 0.5;
			if (this.playerVelocity.y <= 35.0) {

				this.playerOnFloor = true;
				this.playerVelocity.y = 35;

			}

		}
		this.playerModel.position.copy(this.playerVelocity);
		this.camera.position.copy(this.playerVelocity);
		this.sprite.position.copy(this.playerVelocity);
		this.sprite.rotation.copy(this.camera.rotation);
		this.socket && this.socket.emit("server", {
			position: this.playerModel.position,
			maxW: this.maxW,
			nowActions: this.nowActions,
			rotationY: this.playerModel.rotation.y,
			blood: this.playerModel.blood,
			isDel: this.playerModel.isDel,
			kill: this.playerModel.kill,
		});
	}
}
