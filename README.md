[仓库地址](https://github.com/306416836/three-cs.git) https://github.com/306416836/three-cs.git

[体验网址](http://toupp.vip/example/cs) http://toupp.vip/example/cs


![游戏动画.gif](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/22b3f0c4e7074d259479974a0e123a6a~tplv-k3u1fbpfcp-watermark.image?)

> 当AI席卷全球的时候，我就在思考未来的方向~
> 产能过剩必将淘汰很多职业与个人，同时这将也是转机的开始······



我认为游戏行业是个不错的选择，AI可以帮我们去完成建模，ui等等，大大减少了创作成本，使得我们每个人都可以成为强大的个体。

## 话不多说，上教程 ~

为方便更多的人的学习使用 ~ 本项目用原生js与three.js编写

### 游戏规划
    
    
    本教程小游戏，共包含了三个类。
    
    角色类（电脑，主控，其他玩家）
    地图类（小地图）
    面板类（开始游戏等）
    
    该类型游戏可拓展的类有很多，比如枪类，手雷类，声音类等等。大家可以根据喜好自行添加。
    游戏是个可延展性的项目，在制作之初，需要先规划好小目标。 
    
    
#### 1. 骨骼模型的绑定与导入

    模型与动作来自网站：https://www.mixamo.com/
    下载好模型后，导入blender 进行模型的缩减与骨骼绑定。
    主要缩减的是模型面数和贴图的大小。
    
#### 2. 创建动作类，人物类
    
```
/*

动作类 gltfAnimations
主要控制动作的切换与播放，注意的是一次性动作和循环动作，需要加以区分
单次播放动作，既跳跃，射击，受伤等 需要设置 action.setLoop( THREE.LoopOnce );


*/

```

```
/*

人物类 player
主要控制人物的刷新，垃圾回收，主体动作，开枪，入场退厂，枪体绑定，受伤块绑定等。

由于three 引擎的限制，unity也有类似的限制，射线扫描时，无法扫描到骨骼动画中相应骨骼对应的SkinnedMesh，固我们需要自己在对应骨骼上添加受伤块。比如 该块是头部，那么可以被秒杀。

*/

greatRayMesh() {
    this.skeleton = new SkeletonHelper(this.playerModel);
    this.gunBone = this.skeleton.bones.find(bone => bone.name === 'mixamorigRightHand');
    this.skeleton.bones.forEach((item) => {
            if (item.name === 'mixamorigRightHand') {
                    this.gun.position.set(2, 10, 8)
                    this.gun.rotation.y = Math.PI / 2
                    this.gun.rotation.x = Math.PI / 2
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

/*
    垃圾回收
*/
clearCache(item, type) {
    item.geometry.dispose();
    if (Array.isArray(item.material)) {
        item.material.forEach(function (item) {
                item.dispose();
        });
    } else {
        item.material.dispose();
    }
    type == 'shell' ? this.gunFire.remove(item) : this.bulletGroup.remove(item);
}

```
    
#### 3. 创建主控
继承自player类

###### · 监听自己的血量
由于敌人在开枪时，会直接扫描到自己的模型，让模型受伤，但自己需要根据受伤显示相应的动作与面板，所以给自己添加一个新变量bloods当做自己的真实血量。
```
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
```
###### · 根据是手机还是电脑，添加不同的监听
```
 this.isMobile = /Mobile|Android/i.test(navigator.userAgent)
 this.isMobile ? this.initPhone() : this.initWindow()
```
###### · 手机监听，并绘制操作键盘
就是在一个顶层的canvas上 画2个大圆圈。在屏幕左边一半的，是操作按钮，右边的一半是方向按钮。
根据移动的出点判断怎么旋转与前进。
```
initPhone() {
        const canvas = document.querySelector('#phoneKeyset');
        canvas.style.display = 'block'
        const ctx = canvas.getContext('2d');
        let leftArc = {
                clientX: 100,
                clientY: window.innerHeight - 60,
        }
        let rightArc = {
                clientX: window.innerWidth - 100,
                clientY: window.innerHeight - 100,
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
```
###### · pc监听
```
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
```
###### · 判断自身是否在边界
这里运用的是点到线段的最短距离算法，判定点到线段最短的距离必须大于某个值。
比如 玩家与玩家 必须保持距离，不然会穿模
玩家与地板边界必须保持距离，不然会穿墙
```
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
```
###### · 重新开始
由于模型与骨骼已经加入到内存中了，重新开始不重新创建人物，只更改必须内容
```
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
```
###### · 开枪射击
这里没有采用常见的物理碰撞，因为子弹速度过快，会导致判定超越边界，故直接用射线方法，把子弹放到目标点上
```
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
                        sprite.position.set(intersects[0].object.player.position.x, 30, intersects[0].object.player.position.z);
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
```


#### 4. 创建AI
继承自player类
###### · 创建自动寻路

![自动寻路.gif](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/e27907fc1f22413cb0bdd7f92e75a872~tplv-k3u1fbpfcp-watermark.image?)

自动寻路在市面上最常见的是A*算法。具体原理大家可以去百度，我这里有一份用three.js写好的案例，可供大家使用与学习。（集成在了仓库a-x.html）

由于射击游戏最注重实时性，为了减少本机的算力，让游戏保持在较高的帧率上，我没有选择A*算法，用的是ai环绕的方式，为每个AI在游戏之初就创立好环游路径。让其在与角色没有直线射程的时候，会根据路径循环走。当其与角色在直线距离中无遮挡的时候，对玩家角色射击。

这里我使用了平面几何算法，判断2点间的直线，是否与地图的多边形几何体相交。

**[逆时针测试是一种判断两条线段是否相交的算法。该算法的思想是，先选择一条线段，验证另一条线段的两个点不在这条线段的同一侧，然后选择另一条线段，用同样的方法进行验证。验证的方法是，取出一个端点与另一条线段构成两个向量，进而判断这两个向量的关系。如果满足“另一条线段的两个端点分别位于当前线段的顺时针和逆时针方向”，则两条线段相交](https://zhuanlan.zhihu.com/p/81599182)**

```
function ccw( A, B, C ) {

    return ( C.y - A.y ) * ( B.x - A.x ) > ( B.y - A.y ) * ( C.x - A.x );

}

//这个算法使用了一个叫做“逆时针测试”的技术来判断两条线段是否相交。
function checkLineCross( p1, p2, p3, p4 ) {

    return ccw( p1, p3, p4 ) != ccw( p2, p3, p4 ) && ccw( p1, p2, p3 ) != ccw( p1, p2, p4 );

}

//ai 与 人物 投影到地板的点 分别 为 P1,P2, 多边形（地图边界） 的某一条边 p3,p4 。
//循环 多边形 的边界 即可得 ai 是否可以攻击 人物。

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
```


#### 5. 创建其他玩家
其他玩家逻辑相对简单，只用根据socket返回信息，做相应动作就好。
为了防止内存溢出，一个游戏房间内，最多创建4个人物，假设 有 ABCD四个人在游戏，
    D中途退出了，ABC三人的游戏中，已经创建了D人物，那么将D加入到空闲仓内，当新人E加入游戏的时候，不创建新的人物，而是先从空闲仓内取出。
```
 // 接收在线用户信息
socket.on('online', (obj) => {
    if(obj.action=='join'){
            if(leaveList.length>0){
                    let person=leaveList.pop()
                    person.join(obj.userId,obj.camp,obj.name)
            }else{
                    addOtherPlayer(obj.userId,obj.camp,obj.name,socket)
            }
    }else{
            let person=personList.find((item)=>{
                    return item.playerModel.uid==obj.userId
            })
            person.leave()
            leaveList.push(person)
    }
    const para = document.createElement("div");
    const node = document.createTextNode('有人'+enumType[obj.action]+'了游戏,当前共'+(personList.length-leaveList.length)+'人');
    para.appendChild(node);
    chatlist.appendChild(para)
    chatlist.scrollTop = chatlist.scrollHeight;
});

```



#### 6. 创建主场景

游戏场景采用blender绘制，这里不多做说明·感兴趣的同学自行去学习blender的使用，B站有很多教程视频。
场景贴图由AI生成··


#### 7. 创建小地图
地图背景由ps绘制

![map.png](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/8826b02a8f584215bcd56b071b6ae6ff~tplv-k3u1fbpfcp-watermark.image?)

为减少canvas绘制点，将地图背景由css导入，每次绘制只用在canvas中绘制投影点
```
export class Nav{
    constructor(id){
        this.navigation =  document.getElementById(id)
        this.navigation.width = 1000;
        this.navigation.height = 1000;
        this.ctx = this.navigation.getContext('2d');
    }
    draw(personList){
        this.ctx.clearRect(0,0, this.navigation.width,this.navigation.height);
        personList.forEach((item)=>{
            if(!item.playerModel.isDel){
                this.ctx.fillStyle = item.playerModel.camp == personList[0].playerModel.camp ?  '#175895':'#ff0000';
                this.ctx.beginPath();
                this.ctx.arc(item.playerModel.position.x + this.navigation.width/2,item.playerModel.position.z + this.navigation.height/2,20,0,2*Math.PI,true);
                this.ctx.fill();
            }
        })
    }
}


#### 8. 创建游戏面板
面板均用原生JS加dom实现。如果想发布到手机端或者类型于小程序的平台无windows,则需要大家更换相应触发匹配。





    
    
    
    
    
