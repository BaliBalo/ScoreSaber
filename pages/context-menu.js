(() => {
	let css = (`
.context-menu--wrapper { display: none; }
.context-menu--wrapper.context-menu--shown { display: block; }

.context-menu--modal {
	position: fixed;
	top: 0; left: 0; bottom: 0; right: 0;
	z-index: 1000;
}

.context-menu--menu {
	position: fixed;
	top: 0; left: 0;
	z-index: 1001;
	border: 1px solid #bababa;
	background: #fff; color: #000;
	box-shadow: 0 3px 7px rgba(0, 0, 0, .5);
	min-width: 250px; max-width: 500px;
	padding: .2rem 0;
}
.context-menu--reverseY .context-menu--menu { transform: translateY(-100%); }

.context-menu--item {
	font-size: 14px; line-height: 20px;
    padding: 4px 24px;
	overflow: hidden; text-overflow: ellipsis;
	cursor: default;
}
.context-menu--shortcut { float: right; color: #aaa; margin-left: .8rem; }
.context-menu--item.context-menu--disabled { pointer-events: none; color: #666; }
.context-menu--item:last-child { border-bottom: none; }
.context-menu--item:hover { background: rgba(0, 172, 200, .3); }

.context-menu--sep { height: 1px; background: #e9e9e9; margin: .2rem 1px; }`
	);

	let isInit = false;
	// let preventShow = false;
	let $wrapper;
	let $menu;
	function div(className, content) {
		let $el = document.createElement('div');
		$el.className = className;
		if (content) {
			$el.append(content);
		}
		return $el;
	}
	function init() {
		if (isInit) {
			return;
		}
		isInit = true;
		let style = document.createElement('style');
		style.innerHTML = css;
		document.head.appendChild(style);

		$wrapper = div('context-menu--wrapper');

		let $modal = div('context-menu--modal');
		$modal.addEventListener('mousedown', e => {
			e.preventDefault();
			hide();
		});
		$wrapper.appendChild($modal);

		$menu = div('context-menu--menu');
		$menu.addEventListener('mousedown', e => {
			if (e.button === 2) {
				e.preventDefault();
				hide(e);
			}
		});
		$wrapper.appendChild($menu);

		document.body.appendChild($wrapper);
	}

	function hide() {
		if (!$wrapper.classList.contains('context-menu--shown')) {
			return;
		}
		$wrapper.classList.remove('context-menu--shown');
		// preventShow = true;
		// setTimeout(() => preventShow = false, 0);
	}
	function show(elements, position) {
		init();
		if ($wrapper.classList.contains('context-menu--shown')) {
			return;
		}
		let $elements = elements.map(element => {
			if (element.separator) {
				return div('context-menu--sep');
			}
			let $element = div('context-menu--item');
			if (element.shortcut) {
				$element.appendChild(div('context-menu--shortcut', element.shortcut));
			}
			if (element.text) {
				$element.append(element.text);
			}
			if (element.disabled) {
				$element.classList.add('context-menu--disabled');
			} else {
				$element.addEventListener('click', e => {
					if (element.hideOnClick || element.hideOnClick === undefined) {
						hide();
					}
					if (typeof element.action === 'function') {
						try {
							element.action(e, element);
						} catch(e) {}
					}
				});
			}
			return $element;
		});
		$menu.innerHTML = '';
		$menu.append(...$elements);
		$menu.style.top = position.y + 'px';
		$menu.style.left = position.x + 'px';

		$wrapper.classList.add('context-menu--shown');
		let shouldBeReversedY = position.y + $menu.offsetHeight > document.documentElement.clientHeight;
		$wrapper.classList[shouldBeReversedY ? 'add' : 'remove']('context-menu--reverseY');

		let maxX = document.documentElement.clientWidth - $menu.offsetWidth;
		if (position.x > maxX) {
			$menu.style.left = maxX + 'px';
		}
	}

	window.ContextMenu = { show, hide };
})();
