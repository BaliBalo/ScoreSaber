(() => {
	let improvements = [
		{
			css: `
html, body { height: 100%; }
body {
	background: #1e1f26;
	color: #fff;
	font-family: Calibri,Candara,Segoe,"Segoe UI",Optima,Arial,sans-serif;
	line-height: 1.25;
	transition: color .3s, line-height .3s, font-size .3s;
	margin: 0;
	overflow: hidden;
}
li { margin: 8px 0; transition: margin .3s; }
a { color: #fff; transition: color .1s; }
a:hover, button:focus { color: #adf; }
button {
	background: none;
	border: none;
	border-bottom: 1px solid;
	margin: 4px 8px;
	padding: 8px 16px;
	color: currentColor;
	font: inherit;
	outline: none;
	cursor: pointer;
}
main {
	width: 100vw; height: 100vh;
	padding: 16px;
	box-sizing: border-box;
	background: #1e1f26;
	transition: background .3s;
	overflow: auto;
}
`,
			intro: 'Here is a list of what you can find on this website:',
			button: 'improve!'
		},
		{
			css: `
@keyframes gradient {
	from { background-position: 0 0; }
	to { background-position: -150px 0; }
}
a {
	color: rgba(255, 255, 255, 0);
	background-image: linear-gradient(to right, hsl(0, 90%, 65%), hsl(60, 90%, 65%), hsl(120, 90%, 65%), hsl(180, 90%, 65%), hsl(240, 90%, 65%), hsl(300, 90%, 65%), hsl(360, 90%, 65%));
	background-size: 150px 100%;
	background-clip: text;
	-webkit-background-clip: text;
	animation: gradient 3s linear infinite;
}
li {
	list-style-type: none;
	position: relative;
	padding: 0 0 0 28px;
	transition: padding .3s;
}
@keyframes rotate {
	from, 22% { transform: rotate(0deg); }
	25%, 47% { transform: rotate(90deg); }
	50%, 72% { transform: rotate(180deg); }
	75%, 97% { transform: rotate(270deg); }
	to { transform: rotate(360deg); }
}
@keyframes appear {
	from { opacity: 0; }
	to { opacity: 1; }
}
li::before {
	content: '▼';
	position: absolute;
	left: 0; top: 50%;
	margin-top: -9px;
	display: block;
	width: 16px; height: 16px;
	line-height: 12px;
	text-align: center;
	border: 1px solid currentColor;
	border-radius: 4px;
	font-size: 6px;
	animation: rotate 8s infinite, appear .3s;
}
`,
			intro: 'Comprehensive listing of the endpoints allowing access to the main utilities and pages available on this domain, granted it is accessed through a standard-compliant web browser:',
			button: 'IMPROVE'
		},
		{
			css: `
@font-face {
	font-family: "Comic Sans MS";
	src: url("/client/comicsans.woff2") format("woff2"),
	url("/client/comicsans.woff2") format("truetype");
}
body { font-family: "Comic Sans MS", "Comic Sans", cursive; font-size: 20px; font-weight: bold; color: yellow; cursor: crosshair; }
.intro { font-size: 2em; }
.trail { position: fixed; top: 0; left: 0; font-size: 30px; transform: translate(-5px, -50%); pointer-events: none; font-weight: normal; color: #fff; }
`,
			intro: 'wow cool site',
			action: (e) => {
				let initX = e.pageX || 0;
				let initY = e.pageY || 0;
				let trail = ['👌', '👀', '✔', '💯', '🔥', '🍆', '💦', '👁', '👅', '👁'].map((e, i) => {
					let dom = document.createElement('div');
					dom.className = 'trail';
					dom.textContent = e;
					let x = initX + 28 * i;
					dom.style.left = x + 'px';
					dom.style.top = initY + 'px';
					document.body.appendChild(dom);
					return {
						x, y: initY,
						dom
					};
				});
				let mouse = { x: initX, y: initY };
				document.body.addEventListener('mousemove', (e) => {
					mouse.x = e.pageX;
					mouse.y = e.pageY;
				});
				function loop() {
					for (let i = 0, l = trail.length; i < l; i++) {
						let elem = trail[i];
						let prev = trail[i - 1] || mouse;
						elem.x += ((prev.x + (i ? 22 : 0)) - elem.x) / 8;
						elem.y += (prev.y - elem.y) / 8;
						elem.dom.style.left = elem.x + 'px';
						elem.dom.style.top = elem.y + 'px';
					}
					requestAnimationFrame(loop);
				}
				requestAnimationFrame(loop);
			},
			button: '!͉͔̺͙͖̟̈̈̍̆̍!̪͈͎͎̺͓̞́̅ͭͮ̍̐͗!̞̿̀͗ͫ̐͒͌Í͈ͨ̆m͇̰̗̳̗̈́̐̐͐ͪ̊͐P̖̪̫̟̙ͬ̂͛O̭͚̹͕̲͙͕͂̍̒̎R̆̿̌V͒ͮe͙̺͖͈̞̫ͭͨ͊ͅ!̦̰̞̦̪̺ͥ̐!̞̯͔̗͛̈̔ͫ͌ͤ!̹̱̻'
		},
		{
			css: `
@keyframes perspective {
	from { perspective: 10000vmax; }
	to { perspective: 100vmax; }
}
body {
	background: #000;
	animation: perspective 4s cubic-bezier(0,1,0,1) both;
}
main { font-size: 1rem; background: none; }
@keyframes cubeRotation {
	from { transform: rotateX(0deg) rotateY(0deg) rotateZ(0deg); }
	to { transform: rotateX(360deg) rotateY(360deg) rotateZ(360deg); }
}
@keyframes cubeScale {
	from { transform: scale3d(1, 1, 1); }
	to { transform: scale3d(.1, .1, .1); }
}
@keyframes faceBG {
	from { background-color: rgba(30, 31, 38, 1); }
	to { background-color: rgba(30, 31, 38, .5); }
}
.scaler {
	position: fixed;
	top: 50%; left: 50%;
	transform-style: preserve-3d;
	animation: cubeScale 5s both;
}
.cube {
	transform-style: preserve-3d;
	animation: cubeRotation 10s linear infinite;
}
.face {
	position: absolute;
	font-size: 100vmax;
	width: 1em; height: 1em;
	margin: -.5em 0 0 -.5em;
	background: rgba(255, 0, 0, .1);
	background: rgba(30, 31, 38, .5);
	transform: translateZ(.5em);
	display: flex;
	align-items: center;
	justify-content: center;
	box-sizing: border-box;
	border: 5px solid white;
	animation: faceBG 3s both;
}
.face:nth-child(2) { transform: rotateY(90deg) translateZ(.5em); }
.face:nth-child(3) { transform: rotateY(180deg) translateZ(.5em); }
.face:nth-child(4) { transform: rotateY(270deg) translateZ(.5em); }
.face:nth-child(5) { transform: rotateX(-90deg) translateZ(.5em); }
.face:nth-child(6) { transform: rotateX(90deg) translateZ(.5em); }
.background {
	position: fixed;
	z-index: -1;
	top: 0; left: 0;
	width: 100%; height: 100%;
	pointer-events: none;
}
aside { display: none }
`,
			action: () => {
				let scaler = document.createElement('div');
				scaler.className = 'scaler';
				let cube = document.createElement('div');
				cube.className = 'cube';
				for (let i = 0; i < 6; i++) {
					let face = document.createElement('div');
					face.className = 'face';
					cube.appendChild(face);
				}
				scaler.appendChild(cube);
				document.body.appendChild(scaler);
				cube.children[0].appendChild(document.querySelector('main'));
				let vid = document.createElement('video');
				vid.className = 'background';
				vid.autoplay = true;
				vid.loop = true;
				vid.src = '/client/gnomed.mp4';
				document.body.appendChild(vid);
			},
			button: 'ye'
		}
	];
	let currentImprovement = 0;
	let intro = document.querySelector('.intro');
	let improveButton = document.querySelector('aside button');
	function improve(e) {
		let improvement = improvements[currentImprovement++];
		if (!improvement) {
			return;
		}
		if (improvement.css) {
			let css = document.createElement('style');
			css.appendChild(document.createTextNode(improvement.css));
			document.head.appendChild(css);
		}
		if (improvement.button) {
			improveButton.textContent = improvement.button;
		}
		if (improvement.intro) {
			intro.textContent = improvement.intro;
		}
		if (typeof improvement.action === 'function') {
			improvement.action(e);
		}
	}
	improveButton.addEventListener('click', improve);
})();
