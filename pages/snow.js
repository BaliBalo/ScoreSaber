(function() {
	let c = document.createElement('canvas');
	let ctx = c.getContext('2d');
	let particles = [];

	let spawner = (() => {
		let last = 0;
		let interval = .2;
		return {
			setInterval: v => interval = v || 1,
			tick: dt => {
				last += dt || 0;
				while (last >= interval) {
					let colorMix = Math.random();
					colorMix *= colorMix * colorMix;
					let whichColor = Math.random() < .5;
					let red = 255 - colorMix * (whichColor ? 0 : 255);
					let green = 255 - colorMix * (whichColor ? 251 : 75);
					let blue = 255 - colorMix * (whichColor ? 251 : 0);
					let opacity = Math.random();
					opacity *= opacity * opacity * opacity * opacity;
					particles.push({
						x: Math.random(),
						y: 0,
						t: Math.random() * 2 * Math.PI,
						speed: .0001 + Math.random() * .0005,
						amp: 3 + Math.random() * 20,
						color: 'rgba(' + red + ', ' + green + ', ' + blue + ', ' + (1 - opacity) + ')'
					});
					last -= interval;
				}
			}
		};
	})();

	let lastT;
	function loop(t) {
		if (!lastT) {
			lastT = t;
		}
		let dt = Math.min(t - lastT, 25) / 1000;
		lastT = t;
		spawner.tick(dt);
		ctx.clearRect(0, 0, c.width, c.height);
		for (let i = particles.length; i--;) {
			let p = particles[i];
			p.t += dt;
			p.y += p.speed;
			let x = p.x * c.width + Math.sin(p.t) * p.amp;
			ctx.fillStyle = p.color;
			ctx.fillRect(x, p.y * c.height, 1, 1);
			if (p.y > 1) {
				particles.splice(i, 1);
			}
		}

		requestAnimationFrame(loop);
	}
	requestAnimationFrame(loop);

	function onResize() {
		c.width = c.clientWidth;
		c.height = c.clientHeight;
	}
	window.addEventListener('resize', onResize);

	c.style.position = 'fixed';
	c.style.top = '0';
	c.style.left = '0';
	c.style.width = '100%';
	c.style.height = '100%';
	// c.style.zIndex = '-1';
	c.style.pointerEvents = 'none';
	document.body.appendChild(c);
	onResize();
})();
