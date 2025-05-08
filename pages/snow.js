window.snow = function (container, canvas) {
	if (!container) return;

	let c = canvas || document.createElement('canvas');
	let ctx = c.getContext('2d');
	let particles = [];

	let spawner = (() => {
		let last = 0;
		let interval = .2;
		const colors = [[0, 251, 251], [255, 75, 0]];
		return {
			setInterval: v => interval = v || 1,
			tick: (dt) => {
				last += dt || 0;
				while (last >= interval) {
					let colorMix = Math.random() * .7;
					colorMix *= colorMix * colorMix;
					const color = colors[Math.floor(Math.random() * colors.length)];
					let opacity = Math.random();
					opacity *= opacity * opacity * opacity * opacity;
					particles.push({
						x: Math.random() * c.width,
						y: -1,
						t: Math.random() * 2 * Math.PI,
						speed: 10 + Math.random() * 20,
						amp: 3 + Math.random() * 20,
						color: `rgb(${color.map(v => 255 - colorMix * v).join(' ')} / ${1 - opacity})`
					});
					last -= interval;
				}
			}
		};
	})();

	let lastT;
	let loopTimer;
	function loop(t) {
		let dt = Math.min(t - (lastT || t), 25) / 1000;
		lastT = t;
		spawner.tick(dt);
		ctx.clearRect(0, 0, c.width, c.height);
		for (let i = particles.length; i--;) {
			let p = particles[i];
			p.t += dt;
			p.y += p.speed * dt;
			let x = p.x + Math.sin(p.t) * p.amp;
			ctx.fillStyle = p.color;
			ctx.fillRect(x, p.y, 1, 1);
			if (p.y > c.height) {
				particles.splice(i, 1);
			}
		}
		loopTimer = requestAnimationFrame(loop);
	}
	loopTimer = requestAnimationFrame(loop);

	const resizeObserver = new ResizeObserver(() => {
		c.width = c.clientWidth;
		c.height = c.clientHeight;
	});
	resizeObserver.observe(c);

	Object.assign(c.style, {
		position: container === document.body ? 'fixed' : 'absolute',
		inset: '0',
		width: '100%',
		height: '100%',
		pointerEvents: 'none',
	});
	container.append(c);

	return {
		stop: () => {
			cancelAnimationFrame(loopTimer);
			resizeObserver.disconnect();
			c.remove();
		},
	};
};

(() => {
	const autoContainer = document.currentScript?.dataset?.on;
	if (autoContainer) {
		window.snow(document.querySelector(autoContainer));
	}
})();
