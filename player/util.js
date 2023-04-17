import {
	CanvasTexture,
	SpriteMaterial,
	Sprite,
	Vector3
} from 'three';

export function creatText(text, color, size) {
	let canvas = document.createElement("canvas");
	const fontSize = size ? size : 20
	canvas.width = fontSize * (text.length);
	canvas.height = fontSize;
	let c = canvas.getContext('2d');
	c.fillStyle = color ? color : "#f00";
	c.font = `${fontSize}px Georgia`;
	c.fillText(text, 0, 20);
	let Texture = new CanvasTexture(canvas);
	const material = new SpriteMaterial({
		map: Texture
	});
	const sprite = new Sprite(material);
	sprite.scale.set(10, 5, 0)
	return sprite
}

export function address(type) {
	let x, z
	if (type == 'blue') {
		x = Math.random() * 200 + 270
		z = Math.random() * 500 - 250
	} else {
		x = -470 + Math.random() * 200
		z = Math.random() * 500 - 250
	}
	return new Vector3(x, 0, z)
}

export function mix(...mixins) { //用于对象的多继承 类似于vue里的Mixin
	class Mix {}

	for (let mixin of mixins) {
		copyProperties(Mix.prototype, mixin); // 拷贝实例属性
		copyProperties(Mix.prototype.__proto__, mixin.prototype); // 拷贝原型属性
	}

	return Mix;
}

function copyProperties(target, source) {
	for (let key of Reflect.ownKeys(source)) {
		if (key !== "constructor" && key !== "prototype" && key !== "name") {
			let desc = Object.getOwnPropertyDescriptor(source, key);
			Object.defineProperty(target, key, desc);
		}
	}
}
