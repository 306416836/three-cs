class point {
	constructor(x, y) {
		this.x = x
		this.y = y
	}
}
// 计算点到线段的最短距离
export function pointToSegmentDistance(p, a, b) {
	const l2 = distanceSquared(a, b);
	if (l2 === 0) return distance(p, a);
	const t = Math.max(0, Math.min(1, dot(subtract(p, a), subtract(b, a)) / l2));
	const projection = add(a, multiply(subtract(b, a), t));
	return distance(p, projection);
}

function distanceSquared(a, b) {
	const dx = a.x - b.x;
	const dy = a.y - b.y;
	return dx * dx + dy * dy;
}

export function distance(a, b) {
	return Math.sqrt(distanceSquared(a, b));
}

function subtract(a, b) {
	return {
		x: a.x - b.x,
		y: a.y - b.y
	};
}

function add(a, b) {
	return {
		x: a.x + b.x,
		y: a.y + b.y
	};
}

function multiply(a, b) {
	return {
		x: a.x * b,
		y: a.y * b
	};
}

function dot(a, b) {
	return a.x * b.x + a.y * b.y;
}

//判断点是否在多边形内
export function getCrossing(point, lines) {

	let count = 0;
	for (let i = 0; i < lines.length; i += 1) {

		const {
			o,
			d
		} = lines[i];

		if ((o.y > point.y) ^ (d.y > point.y)) {

			// x = (y - y0) / k + x0
			const x = (point.y - o.y) * (d.x - o.x) / (d.y - o.y) + o.x;

			if (x > point.x) {

				count += 1;

			}

		}

	}

	return count % 2 > 0 ? 'in' : 'out';

}


function ccw(A, B, C) {

	return (C.y - A.y) * (B.x - A.x) > (B.y - A.y) * (C.x - A.x);

}

//这个算法使用了一个叫做“逆时针测试”的技术来判断两条线段是否相交。
export function checkLineCross(p1, p2, p3, p4) {

	return ccw(p1, p3, p4) != ccw(p2, p3, p4) && ccw(p1, p2, p3) != ccw(p1, p2, p4);

}
