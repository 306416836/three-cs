export class Nav {
	constructor(id) {
		this.navigation = document.getElementById(id)
		this.navigation.width = 1000;
		this.navigation.height = 1000;
		this.ctx = this.navigation.getContext('2d');
	}
	draw(personList) {
		this.ctx.clearRect(0, 0, this.navigation.width, this.navigation.height);
		personList.forEach((item) => {
			if (!item.playerModel.isDel) {
				this.ctx.fillStyle = item.playerModel.camp == personList[0].playerModel.camp ? '#175895' :
					'#ff0000';
				this.ctx.beginPath();
				this.ctx.arc(item.playerModel.position.x + this.navigation.width / 2, item.playerModel
					.position.z + this.navigation.height / 2, 20, 0, 2 * Math.PI, true);
				this.ctx.fill();
			}
		})
	}
}
