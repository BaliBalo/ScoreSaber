let css = document.querySelector('style');
let improvements = [
	{
		css: `
html, body { height: 100%; }
body {
	color: #fff;
	font-family: Calibri,Candara,Segoe,"Segoe UI",Optima,Arial,sans-serif;
	line-height: 1.25;
	transition: color .3s, line-height .3s, font-size .3s;
	margin: 0;
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
	width: 100%;
	height: 100%;
	padding: 16px;
	box-sizing: border-box;
	background: #1e1f26;
	transition: background .3s;
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
	left: 0;
	top: 50%;
	margin-top: -9px;
	display: block;
	width: 16px;
	height: 16px;
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
body { font-family: "Comic Sans MS", "Comic Sans", cursive; font-size: 20px; color: yellow; cursor: crosshair; }
.intro { font-size: 2em; }
`,
		intro: 'wow cool site',
		button: '!͉͔̺͙͖̟̈̈̍̆̍!̪͈͎͎̺͓̞́̅ͭͮ̍̐͗!̞̿̀͗ͫ̐͒͌Í͈ͨ̆m͇̰̗̳̗̈́̐̐͐ͪ̊͐P̖̪̫̟̙ͬ̂͛O̭͚̹͕̲͙͕͂̍̒̎R̆̿̌V͒ͮe͙̺͖͈̞̫ͭͨ͊ͅ!̦̰̞̦̪̺ͥ̐!̞̯͔̗͛̈̔ͫ͌ͤ!̹̱̻'
	},
	{
		css: `

`,
		button: 'ye'
	}
];
let currentImprovement = 0;
let intro = document.querySelector('.intro');
let improve = document.querySelector('aside button');
improve.addEventListener('click', () => {
	let improvement = improvements[currentImprovement++];
	if (!improvement) {
		return;
	}
	if (improvement.css) {
		css.innerText += improvement.css;
	}
	if (improvement.button) {
		improve.textContent = improvement.button;
	}
	if (improvement.intro) {
		intro.textContent = improvement.intro;
	}
});
