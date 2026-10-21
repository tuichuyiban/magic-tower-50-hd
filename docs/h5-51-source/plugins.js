var plugins_bb40132b_638b_4a9f_b028_d3fe47acc8d1 = 
{
    "init": function () {
	console.log("插件编写测试");

	this._afterLoadResources = function () {
		// 本函数将在所有资源加载完毕后，游戏开启前被执行
		// 可以在这个函数里面对资源进行一些操作。
		// 若需要进行切分图片，可以使用 core.splitImage() 函数，或直接在全塔属性-图片切分中操作
		// 
		core.ui.statusBar.init();
	}



},
    "resizeTo11": function () {
			if (main.mode == 'editor') {
				return;
			}

		// 在不修改libs的情况下将页面适配为11x11
			core.__SIZE__ = 11;
			core.__PIXELS__ = core.__SIZE__ * 32;
			core.__HALF_SIZE__ = 5;
		// core.bigmap.width = core.__SIZE__;
		// core.bigmap.height = core.__SIZE__;
			core.actions.SIZE = core.__SIZE__;
			core.actions.HSIZE = core.__HALF_SIZE__;
			core.actions.LAST = core.__SIZE__ - 1;
			core.actions.CHOICES_LEFT = 3;
			core.actions.CHOICES_RIGHT = core.actions.LAST - core.actions.CHOICES_LEFT;
			core.ui.SIZE = core.__SIZE__;
			core.ui.HSIZE = core.__HALF_SIZE__;
			core.ui.LAST = core.__SIZE__ - 1;
			core.ui.PIXEL = core.__PIXELS__;
			core.ui.HPIXEL = core.__PIXELS__ / 2;
		},
    "statusBar": function () {
	main.dom.floorMsgGroup.style.display = 'none';
	main.dom.statusBar.style.display = 'none';
	main.dom.toolBar.style.display = 'none';

	// 常量定义
	const CONSTANTS = {
		// 视图尺寸
		GAMEVIEW_WIDTH: 640,
		GAMEVIEW_HEIGHT: 422,
		GAMEVIEW_WIDTH_VERTICAL: 388,
		GAMEVIEW_HEIGHT_VERTICAL: 630,

		// 边栏尺寸
		BAR_WIDTH: 125,
		BAR_HEIGHT_VERTICAL: 130,
		BORDER_WIDTH: 18,
		BORDER_HEIGHT: 24,

		// 物品栏位置和尺寸
		ITEM_BOX_LEFT: 13,
		ITEM_BOX_TOP: 190,
		ITEM_BOX_WIDTH: 101,
		ITEM_BOX_HEIGHT: 163,
		ITEM_BOX_LEFT_VERTICAL: 8,
		ITEM_BOX_TOP_VERTICAL: 538,
		ITEM_BOX_WIDTH_VERTICAL: 261,
		ITEM_BOX_HEIGHT_VERTICAL: 65,
		ITEM_ICON_OUTER_SIZE: 33,
		ITEM_COL_STEP: 33,
		ITEM_ROW_STEP: 32,

		// 装备栏位置和尺寸
		EQUIP_BLOCK_LEFT: 524,
		EQUIP_BLOCK_TOP: 45,
		EQUIP_BLOCK_TOP2: 93,
		EQUIP_BLOCK_WIDTH: 103,
		EQUIP_BLOCK_HEIGHT: 37,
		EQUIP_BLOCK_LEFT_VERTICAL: 106,
		EQUIP_BLOCK_TOP_VERTICAL: 8,
		EQUIP_BLOCK_TOP_VERTICAL2: 48,
		EQUIP_BLOCK_WIDTH_VERTICAL: 103,
		EQUIP_BLOCK_HEIGHT_VERTICAL: 33,

		// 钥匙栏位置和尺寸
		KEY_BLOCK_LEFT: 524,
		KEY_BLOCK_TOP: 142,
		KEY_BLOCK_WIDTH: 103,
		KEY_BLOCK_HEIGHT: 67,
		KEY_BLOCK_LEFT_VERTICAL: 106,
		KEY_BLOCK_TOP_VERTICAL: 88,
		KEY_BLOCK_WIDTH_VERTICAL: 103,
		KEY_BLOCK_HEIGHT_VERTICAL: 33,

		// 信息栏位置和尺寸
		INFO_BLOCK_LEFT: 524,
		INFO_BLOCK_TOP: 222,
		INFO_BLOCK_WIDTH: 103,
		INFO_BLOCK_HEIGHT: 96,
		INFO_BLOCK_LEFT_VERTICAL: 216,
		INFO_BLOCK_TOP_VERTICAL: 8,
		INFO_BLOCK_WIDTH_VERTICAL: 163,
		INFO_BLOCK_HEIGHT_VERTICAL: 89,

		// 工具栏位置和尺寸
		TOOL_BOX_LEFT: 524,
		TOOL_BOX_TOP: 318,
		TOOL_BOX_WIDTH: 103,
		TOOL_BOX_HEIGHT: 66,
		TOOL_BOX_LEFT_VERTICAL: 276,
		TOOL_BOX_TOP_VERTICAL: 538,
		TOOL_BOX_WIDTH_VERTICAL: 103,
		TOOL_BOX_HEIGHT_VERTICAL: 65,
		TOOL_ICON_OUTER_SIZE: 34,

		// 信息条尺寸
		INFO_BAR_HEIGHT: 22,
		INFO_BAR_HEIGHT_VERTICAL: 18,
		INFO_BAR_LEFT_MARGIN: 10,

		// 字体设置
		FONT_FAMILY: 'SimSun',
		FONT_SIZE_NORMAL: 16,
		FONT_SIZE_NORMAL_VERTICAL: 14,
		FONT_SIZE_SMALL: 12,
		FONT_WEIGHT: 'bold',
		INFO_TEXT_WEIGHT: 10,

		// 颜色
		TEXT_COLOR: "#FFFFFF",
		BACKGROUND_COLOR: "#676767",
		EQUIP_WEAPON_COLOR: "#ff00ff",
		EQUIP_SHIELD_COLOR: "#00ffff",
		EQUIP_WEAPON_COLOR_VERTICAL: "#FFCFAE",
		EQUIP_SHIELD_COLOR_VERTICAL: "#D1CEFF",
		INFO_TEXT_COLOR: "#D1CEFF",

		// 图片资源
		STATUS_BACKGROUND: "statusBackground.png",
		STATUS_BACKGROUND_VERTICAL: "statusBackground_vertical.png",

		// 预设缩放比例
		PRESET_SCALES: [1, 1.25, 1.5, 1.75, 2],

		// 强制显示数量的物品
		FORCE_COUNTABLE_ITEMS: ["centerFly"],

		// 状态列表设置
		STATUS_LIST: ['hp', 'atk', 'def', 'money'],
		STATUS_ITEM_ROW_HEIGHT: 24,

		// 钥匙设置
		KEY_LIST: ['yellowKey', 'blueKey', 'redKey'],
		KEY_SIZE: [10, 16],
		KEY_REAL_SIZE: [6, 15],

		// 工具栏按钮设置
		TOOL_ICON_SIZE: 32,
		TOOL_COLS: 3,
		TOOL_ROWS: 2,

		//默认文本
		INFO_BAR_DEFAULT_TEXT: "<H>帮助     <S>保存游戏     <D>读取游戏     <N>重新开始",
		INFO_BAR_DEFAULT_TEXT_VERTICAL: "<H>帮助  <S>保存游戏  <D>读取游戏  <N>重新开始",

		EXTRA_INFO_BLOCK_LEFT: 525,
		EXTRA_INFO_BLOCK_TOP: 12,
		EXTRA_INFO_BLOCK_WIDTH: 101, // 113-12=101
		EXTRA_INFO_BLOCK_HEIGHT: 22, // 386-364=22
		EXTRA_INFO_BLOCK_LEFT_VERTICAL: 216,
		EXTRA_INFO_BLOCK_TOP_VERTICAL: 104,
		EXTRA_INFO_BLOCK_WIDTH_VERTICAL: 163,
		EXTRA_INFO_BLOCK_HEIGHT_VERTICAL: 17,
		EXTRA_INFO_FONT_SIZE: 12,
	};

	// 计算信息条位置
	const INFO_BAR_TOP = CONSTANTS.GAMEVIEW_HEIGHT - CONSTANTS.INFO_BAR_HEIGHT;
	const INFO_BAR_TOP_VERTICAL = CONSTANTS.GAMEVIEW_HEIGHT_VERTICAL - CONSTANTS.INFO_BAR_HEIGHT_VERTICAL;

	const outerBackground = document.createElement('canvas');
	outerBackground.style.position = 'absolute';
	outerBackground.style.zIndex = 5;
	outerBackground.id = 'outerBackground';
	outerBackground.style.imageRendering = 'pixelated';

	main.dom.outerBackground = outerBackground;
	main.dom.startPanel.insertAdjacentElement('afterend', outerBackground);

	const outerUI = document.createElement('canvas');
	outerUI.style.position = 'absolute';
	outerUI.style.zIndex = 165;
	outerUI.id = 'outerUI';
	main.dom.outerUI = outerUI;
	outerBackground.insertAdjacentElement('afterend', outerUI);

	// 高清化状态栏Canvas
	setTimeout(function () {
		if (main.replayChecking) return;
		main.canvas.outerUI = outerUI.getContext('2d');
		// 设置高清Canvas尺寸
		core.maps._setHDCanvasSize(main.canvas.outerUI,
			core.domStyle.isVertical ? CONSTANTS.GAMEVIEW_WIDTH_VERTICAL : CONSTANTS.GAMEVIEW_WIDTH,
			core.domStyle.isVertical ? CONSTANTS.GAMEVIEW_HEIGHT_VERTICAL : CONSTANTS.GAMEVIEW_HEIGHT
		);
	});

	outerUI.onclick = function (e) {
		try {
			e.preventDefault();
			if (!core.isPlaying()) return false;
			const left = core.dom.gameGroup.offsetLeft;
			const top = core.dom.gameGroup.offsetTop;
			const px = parseInt((e.clientX - left) / core.domStyle.scale);
			const py = parseInt((e.clientY - top) / core.domStyle.scale);
			core.ui.statusBar.onclick(px, py);
		} catch (ee) {
			main.log(ee);
		}
	};

	const _resize_gameGroup = function (obj) {
		const gameGroup = core.dom.gameGroup;
		gameGroup.style.width = obj.totalWidth + "px";
		gameGroup.style.height = obj.totalHeight + "px";
		gameGroup.style.left = (obj.clientWidth - obj.totalWidth) / 2 + "px";
		gameGroup.style.top = (obj.clientHeight - obj.totalHeight) / 2 + "px";

		core.dom.musicBtn.style.right = (obj.clientWidth - obj.totalWidth) / 2 + "px";
		core.dom.musicBtn.style.bottom = (obj.clientHeight - obj.totalHeight) / 2 - 27 + "px";
		core.dom.enlargeBtn.style.right = (obj.clientWidth - obj.totalWidth) / 2 + 31 + "px";
		core.dom.enlargeBtn.style.bottom = (obj.clientHeight - obj.totalHeight) / 2 - 27 + "px";

		main.dom.startBackground.src = main.styles.startBackground;
	};

	const _resize_canvas = function (obj) {
		main.dom.outerBackground.style.width = obj.totalWidth + 'px';
		main.dom.outerBackground.style.height = obj.totalHeight + 'px';
		main.dom.outerUI.style.width = obj.totalWidth + 'px';
		main.dom.outerUI.style.height = obj.totalHeight + 'px';

		const innerSize = (obj.canvasWidth * core.domStyle.scale) + "px";
		for (let i = 0; i < core.dom.gameCanvas.length; ++i) {
			core.dom.gameCanvas[i].style.width = core.dom.gameCanvas[i].style.height = innerSize;
		}
		core.dom.gif.style.width = core.dom.gif.style.height = innerSize;
		core.dom.gif2.style.width = core.dom.gif2.style.height = innerSize;
		core.dom.gameDraw.style.width = core.dom.gameDraw.style.height = innerSize;
		core.dom.gameDraw.style.top = obj.gameDrawBox.top * core.domStyle.scale + "px";
		core.dom.gameDraw.style.left = obj.gameDrawBox.left * core.domStyle.scale + "px";

		// resize bigmap
		core.bigmap.canvas.forEach(function (cn) {
			let v2 = core.bigmap.width * core.bigmap.height > core.bigmap.threshold;
			let width = v2 ? core.__PIXELS__ + 64 : core.bigmap.width * 32;
			let height = v2 ? core.__PIXELS__ + 64 : core.bigmap.height * 32;
			core.canvas[cn].canvas.style.width = width * core.domStyle.scale + "px";
			core.canvas[cn].canvas.style.height = height * core.domStyle.scale + "px";
		});

		// resize dynamic canvas
		for (const name in core.dymCanvas) {
			const ctx = core.dymCanvas[name];
			const canvas = ctx.canvas;
			const ratio = canvas.hasAttribute('isHD') ? core.domStyle.ratio : 1;
			canvas.style.width = canvas.width / ratio * core.domStyle.scale + "px";
			canvas.style.height = canvas.height / ratio * core.domStyle.scale + "px";
			canvas.style.left = parseFloat(canvas.getAttribute("_left")) * core.domStyle.scale + "px";
			canvas.style.top = parseFloat(canvas.getAttribute("_top")) * core.domStyle.scale + "px";
		}

		// resize next
		main.dom.next.style.width = main.dom.next.style.height = 5 * core.domStyle.scale + "px";
		main.dom.next.style.borderBottomWidth = main.dom.next.style.borderRightWidth = 4 * core.domStyle.scale + "px";
	};

	core.control.resize = function () {
		if (main.replayChecking) return;
		if (main.mode == 'editor') return;

		const clientWidth = main.dom.body.clientWidth;
		const clientHeight = main.dom.body.clientHeight;
		const canvasWidth = core.__PIXELS__;

		const isVertical = clientHeight > clientWidth;
		core.domStyle.isVertical = isVertical;

		const totalWidth = isVertical ? CONSTANTS.GAMEVIEW_WIDTH_VERTICAL : CONSTANTS.GAMEVIEW_WIDTH;
		const totalHeight = isVertical ? CONSTANTS.GAMEVIEW_HEIGHT_VERTICAL : CONSTANTS.GAMEVIEW_HEIGHT;

		const maxRatio = Math.min(clientWidth / totalWidth, clientHeight / totalHeight);

		// 缩放比例计算
		const storageKey = isVertical ? 'scale_vertical' : 'scale_horizontal';
		let chosenScale = null;
		const rawSaved = core.getLocalStorage(storageKey);

		if (rawSaved != null) {
			const s = parseFloat(rawSaved);
			if (!isNaN(s) && s <= maxRatio) {
				chosenScale = s;
			}
		}

		if (chosenScale == null) {
			if (maxRatio < CONSTANTS.PRESET_SCALES[0]) {
				chosenScale = maxRatio;
			} else {
				const candidates = CONSTANTS.PRESET_SCALES.filter(v => v <= maxRatio);
				let best = candidates[0];
				let bestDiff = Math.abs(maxRatio - best);

				for (let v of candidates) {
					const d = Math.abs(maxRatio - v);
					if (d < bestDiff) {
						best = v;
						bestDiff = d;
					}
				}
				chosenScale = best;
			}
		}

		core.domStyle.scale = chosenScale;
		core.domStyle.availableScale = CONSTANTS.PRESET_SCALES.filter(v => v <= maxRatio);

		const totalWidthScaled = totalWidth * core.domStyle.scale;
		const totalHeightScaled = totalHeight * core.domStyle.scale;

		const gameDrawBox = isVertical ? {
			left: CONSTANTS.BORDER_WIDTH,
			top: CONSTANTS.BAR_HEIGHT_VERTICAL + CONSTANTS.BORDER_HEIGHT
		} : {
			left: CONSTANTS.BAR_WIDTH + CONSTANTS.BORDER_WIDTH,
			top: CONSTANTS.BORDER_HEIGHT
		};

		const obj = {
			clientWidth: clientWidth,
			clientHeight: clientHeight,
			canvasWidth: canvasWidth,
			totalWidth: totalWidthScaled,
			totalHeight: totalHeightScaled,
			gameDrawBox: gameDrawBox,
			globalAttribute: core.status.globalAttribute || core.initStatus.globalAttribute
		};

		_resize_gameGroup(obj);
		_resize_canvas(obj);

		if (core.status.automaticRoute == null) {
			core.status.automaticRoute = {};
		}
		core.control.setViewport(32, 32);

		if (core.canvas.outerUI) {
			core.ui.statusBar._update_background();
			core.ui.statusBar._update_toolBox();
		}
		core.status.lastPropsDrawn = null;
		core.ui.statusBar.infoText = null;
		core.updateStatusBar();
	};

	control.prototype.setDisplayScale = function (delta) {
		const PRESET_SCALES = CONSTANTS.PRESET_SCALES;

		// 确保 core.domStyle.isVertical 可用；若不可读则根据 viewport 简单判断
		if (typeof core.domStyle.isVertical === 'undefined') {
			core.domStyle.isVertical = (main.dom.body.clientHeight > main.dom.body.clientWidth);
		}
		const isVertical = core.domStyle.isVertical;

		// 如果 availableScale 尚未计算（例如在某些情况下 setDisplayScale 在 resize 之前被调用），就临时计算一次
		if (!core.domStyle.availableScale || core.domStyle.availableScale.length === 0) {
			const clientWidth = main.dom.body.clientWidth;
			const clientHeight = main.dom.body.clientHeight;
			const totalWidth = isVertical ? CONSTANTS.GAMEVIEW_WIDTH_VERTICAL : CONSTANTS.GAMEVIEW_WIDTH;
			const totalHeight = isVertical ? CONSTANTS.GAMEVIEW_HEIGHT_VERTICAL : CONSTANTS.GAMEVIEW_HEIGHT;
			const maxRatio = Math.min(clientWidth / totalWidth, clientHeight / totalHeight);
			core.domStyle.availableScale = PRESET_SCALES.filter(v => v <= maxRatio);
		}

		// 如果 availableScale 为空（极小屏幕），则允许直接以 maxRatio 为唯一选项
		if (!core.domStyle.availableScale || core.domStyle.availableScale.length === 0) {
			// 直接设置到能 fit 的最大缩放（避免出界）
			const clientWidth = main.dom.body.clientWidth;
			const clientHeight = main.dom.body.clientHeight;
			const totalWidth = isVertical ? CONSTANTS.GAMEVIEW_WIDTH_VERTICAL : CONSTANTS.GAMEVIEW_WIDTH;
			const totalHeight = isVertical ? CONSTANTS.GAMEVIEW_HEIGHT_VERTICAL : CONSTANTS.GAMEVIEW_HEIGHT;
			const maxRatio = Math.min(clientWidth / totalWidth, clientHeight / totalHeight);
			core.domStyle.scale = maxRatio;
			// 保存为对应 orientation（可选）
			const storageKey0 = isVertical ? 'scale_vertical' : 'scale_horizontal';
			core.setLocalStorage(storageKey0, core.domStyle.scale);
			core.setLocalStorage('scale', core.domStyle.scale);
			core.resize();
			return;
		}

		// 在 availableScale 中找到当前 index
		let index = core.domStyle.availableScale.indexOf(core.domStyle.scale);
		if (index < 0) {
			// 当前 scale 不在可选列表（例如之前保存了更大的值），尽量以最接近 maxRatio 的候选为起点
			// 这里我们把 index 设置为 0（第一个候选），然后再按 delta 移动
			index = 0;
		}

		index = (index + delta + core.domStyle.availableScale.length) % core.domStyle.availableScale.length;
		core.domStyle.scale = core.domStyle.availableScale[index];

		// 保存到对应 orientation 的 localStorage
		const storageKey = isVertical ? 'scale_vertical' : 'scale_horizontal';
		core.setLocalStorage(storageKey, core.domStyle.scale);
		core.setLocalStorage('scale', core.domStyle.scale);

		// 触发 resize 重新布局
		core.resize();
	}

	class StatusBar {
		constructor() {
			this.itemMx = [
				["book", "wand", "fly"],
				["snow", "cross", "coin"],
				["knife", "superPotion", "bigKey"],
				["pickaxe", "earthquake", "bomb"],
				["centerFly", "upFly", "downFly"],
			];
			this.itemMx2 = [
				["book", "wand", "I333"],
				["snow", "cross", "coin"],
				["knife", "superPotion", "bigKey"],
				["pickaxe", "earthquake", "bomb"],
				["centerFly", "upFly", "downFly"],
			];
			// 添加竖屏专用物品数组
			this.itemMxVertical = [
				["book", "coin", "fly", "cross", "superPotion", "pickaxe", "bomb", "centerFly"],
				["upFly", "downFly", "knife", "snow", "bigKey", "earthquake", "wand", "skill1"],
			];
			this.itemMxVertical2 = [
				["book", "coin", "I333", "cross", "superPotion", "pickaxe", "bomb", "centerFly"],
				["upFly", "downFly", "knife", "snow", "bigKey", "earthquake", "wand", "skill1"],
			];
			this.infoText = null;
			this.infocnt = 0;
			this.selectedItem = null;
			this.init();
		}

		init() {
			this.toolbarAction = [
				[main.core.openKeyBoard, function () {
					if (core.isReplaying() || core.status.lockControl || core.isMoving()) return;
					core.doSL("autoSave", "load")
				}, function () {
					if (core.isReplaying() || core.status.lockControl || core.isMoving()) return;
					core.insertAction([{ type: "insert", name: "游戏说明" }]);
				}],
				[main.core.save, main.core.load, main.core.openSettings]
			];
			this.replayAction = [
				[core.triggerReplay, core.stopReplay, core.rewindReplay],
				[core.speedDownReplay, core.speedUpReplay, core.control._replay_SL]
			];
		}

		update() {
			if (main.replayChecking) return;
			this._update_background();
			this._update_props();
			this._update_items();
			this._update_equips();
			this._update_keys();
			this._update_infoWindow();
			this._update_infoBar();
			this._update_extraInfo(); // 添加这一行
		}

		// 在 424 行左右
		_update_background() {
			if (main.replayChecking) return;
			const bgctx = main.dom.outerBackground.getContext("2d");
			const uictx = main.dom.outerUI.getContext("2d");

			// 设置高清Canvas尺寸
			const width = core.domStyle.isVertical ? CONSTANTS.GAMEVIEW_WIDTH_VERTICAL : CONSTANTS.GAMEVIEW_WIDTH;
			const height = core.domStyle.isVertical ? CONSTANTS.GAMEVIEW_HEIGHT_VERTICAL : CONSTANTS.GAMEVIEW_HEIGHT;

			core.maps._setHDCanvasSize(bgctx, width, height);
			core.maps._setHDCanvasSize(uictx, width, height);

			bgctx.imageSmoothingEnabled = false;
			bgctx.webkitImageSmoothingEnabled = false; // 兼容旧版 Webkit
			bgctx.mozImageSmoothingEnabled = false; // 兼容旧版 Firefox
			bgctx.msImageSmoothingEnabled = false; // 兼容旧版 IE

			if (core.domStyle.isVertical) {
				const bg = core.material.images.images[CONSTANTS.STATUS_BACKGROUND_VERTICAL];
				if (bg) {
					bgctx.drawImage(bg, 0, 0, CONSTANTS.GAMEVIEW_WIDTH_VERTICAL, CONSTANTS.GAMEVIEW_HEIGHT_VERTICAL);
				}
			} else {
				const bg = core.material.images.images[CONSTANTS.STATUS_BACKGROUND];
				if (bg) {
					bgctx.drawImage(bg, 0, 0, CONSTANTS.GAMEVIEW_WIDTH, CONSTANTS.GAMEVIEW_HEIGHT - CONSTANTS.INFO_BAR_HEIGHT);
				}
				//bgctx.fillStyle = CONSTANTS.BACKGROUND_COLOR;
				//bgctx.fillRect(0, INFO_BAR_TOP, CONSTANTS.GAMEVIEW_WIDTH, CONSTANTS.INFO_BAR_HEIGHT);
			}
			core.setTextAlign('outerUI', 'center');
		}

		_update_props(updatedFloorTitle) {
			if (!updatedFloorTitle && core.status.floorId) {
				updatedFloorTitle = core.status.maps[core.status.floorId].title;
			}

			const drawStatusList = (baseX, baseY) => {
				let curh = baseY;
				core.setTextAlign('outerUI', 'right');

				CONSTANTS.STATUS_LIST.forEach((item) => {
					core.status.hero[item] = Math.round(core.status.hero[item]);
					core.fillText("outerUI", core.getRealStatus(item), baseX, curh, CONSTANTS.TEXT_COLOR);
					curh += CONSTANTS.STATUS_ITEM_ROW_HEIGHT;
				});

				core.setTextAlign('outerUI', 'center');
			};

			const fontSize = core.domStyle.isVertical ?
				`${CONSTANTS.FONT_WEIGHT} ${CONSTANTS.FONT_SIZE_NORMAL_VERTICAL}px ${CONSTANTS.FONT_FAMILY}` :
				`${CONSTANTS.FONT_WEIGHT} ${CONSTANTS.FONT_SIZE_NORMAL}px ${CONSTANTS.FONT_FAMILY}`;

			core.setFont("outerUI", fontSize);

			if (core.domStyle.isVertical) {
				core.clearMap("outerUI", 10, 0, 105, 120);
				if (updatedFloorTitle) {
					core.fillText("outerUI", updatedFloorTitle, 54, 22, CONSTANTS.TEXT_COLOR);
				}
				drawStatusList(96, 46);
			} else {
				core.clearMap("outerUI", 10, 40, 105, 130);
				if (updatedFloorTitle) {
					core.fillText("outerUI", updatedFloorTitle, 64, 62, CONSTANTS.TEXT_COLOR);
				}
				drawStatusList(110, 93);
			}
		}

		_update_items() {
			const drawItem = (item, posx, posy) => {
				const icon = core.material.icons.items[item];
				const image = core.material.images.items;

				core.drawImage('outerUI', image, 0, 32 * icon, 32, 32, posx, posy, 32, 32);

				const cnt = core.itemCount(item);
				const isToolMulti = (core.items.items[item].cls === "tools" && cnt > 1) ||
					CONSTANTS.FORCE_COUNTABLE_ITEMS.includes(item);

				if (isToolMulti) {
					const fontStyle = `${CONSTANTS.FONT_WEIGHT} ${CONSTANTS.FONT_SIZE_SMALL}px ${CONSTANTS.FONT_FAMILY}`;
					core.fillText('outerUI', cnt, posx + 25, posy + 28, '#FFFFFF', fontStyle);
				}
			};

			// 根据横屏/竖屏选择布局
			const layout = core.domStyle.isVertical ? {
				mx: core.getFlag('fly') ? this.itemMxVertical : this.itemMxVertical2,
				left: CONSTANTS.ITEM_BOX_LEFT_VERTICAL,
				top: CONSTANTS.ITEM_BOX_TOP_VERTICAL,
				width: CONSTANTS.ITEM_BOX_WIDTH_VERTICAL,
				height: CONSTANTS.ITEM_BOX_HEIGHT_VERTICAL,
				colStep: CONSTANTS.ITEM_COL_STEP,
				rowStep: CONSTANTS.ITEM_ROW_STEP
			} : {
				mx: core.getFlag('fly') ? this.itemMx : this.itemMx2,
				left: CONSTANTS.ITEM_BOX_LEFT,
				top: CONSTANTS.ITEM_BOX_TOP,
				width: CONSTANTS.ITEM_BOX_WIDTH,
				height: CONSTANTS.ITEM_BOX_HEIGHT,
				colStep: CONSTANTS.ITEM_COL_STEP,
				rowStep: CONSTANTS.ITEM_ROW_STEP
			};

			// 统一绘制逻辑
			core.clearMap("outerUI", layout.left, layout.top, layout.width, layout.height);

			const { mx, left, top, colStep, rowStep } = layout;
			for (let i = 0; i < mx.length; i++) {
				for (let j = 0; j < mx[i].length; j++) {
					const item = mx[i][j];
					if (core.hasItem(item)) {
						drawItem(item, left + j * colStep, top + i * rowStep);
					}
				}
			}
		}

		_update_equips() {
			const fontSize = core.domStyle.isVertical ?
				`${CONSTANTS.FONT_WEIGHT} ${CONSTANTS.FONT_SIZE_NORMAL_VERTICAL}px ${CONSTANTS.FONT_FAMILY}` :
				`${CONSTANTS.FONT_WEIGHT} ${CONSTANTS.FONT_SIZE_NORMAL}px ${CONSTANTS.FONT_FAMILY}`;

			core.setFont("outerUI", fontSize);

			const drawEquip = (baseX, baseY, id, color, back) => {
				if (!id) {
					core.fillText("outerUI", back, baseX + 50, baseY + 22, color);
				} else {
					core.fillText("outerUI", core.material.items[id].name, baseX + 32, baseY + 22, color);
					const icon = core.material.icons.items[id];
					core.drawImage('outerUI', core.material.images.items, 0, 32 * icon, 32, 32, baseX + 64, baseY, 32, 32);
				}
			};

			if (core.domStyle.isVertical) {
				core.clearMap("outerUI", CONSTANTS.EQUIP_BLOCK_LEFT_VERTICAL, CONSTANTS.EQUIP_BLOCK_TOP_VERTICAL, CONSTANTS.EQUIP_BLOCK_WIDTH_VERTICAL, CONSTANTS.EQUIP_BLOCK_HEIGHT_VERTICAL);
				drawEquip(CONSTANTS.EQUIP_BLOCK_LEFT_VERTICAL, CONSTANTS.EQUIP_BLOCK_TOP_VERTICAL,
					core.getFlag("nowWeapon"), CONSTANTS.EQUIP_WEAPON_COLOR_VERTICAL, "无武器");
				drawEquip(CONSTANTS.EQUIP_BLOCK_LEFT_VERTICAL, CONSTANTS.EQUIP_BLOCK_TOP_VERTICAL2,
					core.getFlag("nowShield"), CONSTANTS.EQUIP_SHIELD_COLOR_VERTICAL, "无防具");
			} else {
				core.clearMap("outerUI", CONSTANTS.EQUIP_BLOCK_LEFT, CONSTANTS.EQUIP_BLOCK_TOP, CONSTANTS.EQUIP_BLOCK_WIDTH, CONSTANTS.EQUIP_BLOCK_HEIGHT);
				core.fillText("outerUI", '武 器', CONSTANTS.EQUIP_BLOCK_LEFT + 34, CONSTANTS.EQUIP_BLOCK_TOP + 16, CONSTANTS.EQUIP_WEAPON_COLOR);
				core.fillText("outerUI", '防 具', CONSTANTS.EQUIP_BLOCK_LEFT + 34, CONSTANTS.EQUIP_BLOCK_TOP2 + 16, CONSTANTS.EQUIP_SHIELD_COLOR);

				if (core.getFlag("nowWeapon")) {
					core.fillText("outerUI", core.material.items[core.getFlag("nowWeapon")].name, CONSTANTS.EQUIP_BLOCK_LEFT + 34, CONSTANTS.EQUIP_BLOCK_TOP + 35, CONSTANTS.TEXT_COLOR);
					core.drawImage('outerUI', core.material.images.items, 0, 32 * core.material.icons.items[core.getFlag("nowWeapon")], 32, 32, CONSTANTS.EQUIP_BLOCK_LEFT + 70, CONSTANTS.EQUIP_BLOCK_TOP + 3, 32, 32);
				} else {
					core.fillText("outerUI", '无', CONSTANTS.EQUIP_BLOCK_LEFT + 32, CONSTANTS.EQUIP_BLOCK_TOP + 36, CONSTANTS.TEXT_COLOR);
				}

				if (core.getFlag("nowShield")) {
					core.fillText("outerUI", core.material.items[core.getFlag("nowShield")].name, CONSTANTS.EQUIP_BLOCK_LEFT + 34, CONSTANTS.EQUIP_BLOCK_TOP2 + 35, CONSTANTS.TEXT_COLOR);
					core.drawImage('outerUI', core.material.images.items, 0, 32 * core.material.icons.items[core.getFlag("nowShield")], 32, 32, CONSTANTS.EQUIP_BLOCK_LEFT + 70, CONSTANTS.EQUIP_BLOCK_TOP2 + 3, 32, 32);
				} else {
					core.fillText("outerUI", '无', CONSTANTS.EQUIP_BLOCK_LEFT + 32, CONSTANTS.EQUIP_BLOCK_TOP2 + 36, CONSTANTS.TEXT_COLOR);
				}
			}
		}

		_update_keys() {
			// 缩略模式（数量显示）
			const drawKeyListCompact = (baseX, baseY, lines, rows) => {
				const todraw = [];
				for (let i = 0; i < CONSTANTS.KEY_LIST.length; i++) {
					todraw[i] = core.itemCount(CONSTANTS.KEY_LIST[i]) || 0;
				}

				for (let i = 0; i < CONSTANTS.KEY_LIST.length; i++) {
					const deltaX = i * 32;
					const deltaY = parseInt((lines - 1) / 2 * 14);
					this.drawKey(CONSTANTS.KEY_LIST[i], baseX + deltaX, baseY + deltaY);

					const fontStyle = `${CONSTANTS.FONT_WEIGHT} ${CONSTANTS.FONT_SIZE_NORMAL_VERTICAL}px ${CONSTANTS.FONT_FAMILY}`;
					core.setFont("outerUI", fontStyle);
					core.setTextAlign("outerUI", "left");
					core.fillText(
						"outerUI",
						core.itemCount(CONSTANTS.KEY_LIST[i]),
						baseX + deltaX + 10,
						baseY + deltaY + 20,
						CONSTANTS.TEXT_COLOR
					);
				}
			};

			// 均匀分布绘制模式 (优化版)
			const drawKeyListGrid = (blockLeft, blockTop, blockW, blockH, lines, cols) => {
				const todraw = [];
				let total = 0;

				for (let i = 0; i < CONSTANTS.KEY_LIST.length; i++) {
					todraw[i] = core.itemCount(CONSTANTS.KEY_LIST[i]) || 0;
					total += todraw[i];
				}

				// 若数量超过格子数 → 缩略模式
				if (total > lines * cols) {
					drawKeyListCompact(blockLeft, blockTop, lines, cols);
					return;
				}

				// 图标尺寸
				const iconW = CONSTANTS.KEY_REAL_SIZE[0];
				const iconH = CONSTANTS.KEY_REAL_SIZE[1];

				// --- 核心修复逻辑开始 ---

				// 1. 手动微调修正值 (如果你觉得还是偏左或偏右，修改这个值)
				// 负数向左移，正数向右移。解决"视觉边框"带来的误差。
				const globalOffsetX = -1.5;
				const globalOffsetY = 0.5;

				// 2. 计算间距 (保持原来的 Space Evenly 逻辑，即两边和中间间距相等)
				// 使用 floor 避免间距出现 .999 这种情况导致的渲染模糊
				const gapX = Math.floor((blockW - cols * iconW) / (cols + 1));
				const gapY = Math.floor((blockH - lines * iconH) / (lines + 1));

				const safeGapX = Math.max(0, gapX);
				const safeGapY = Math.max(0, gapY);

				// 3. 计算内容的实际总宽度（包含间距）
				// 这一步是为了再次校准，确保这组内容是绝对居中于 blockW 的
				const contentTotalW = cols * iconW + (cols + 1) * safeGapX;
				const contentTotalH = lines * iconH + (lines + 1) * safeGapY;

				// 4. 计算起始偏移量 (修正因为 Math.floor 丢掉的那些小数像素)
				// 这样可以把舍弃的小数余数平均分到左右两边
				const startOffsetX = Math.floor((blockW - contentTotalW) / 2);
				const startOffsetY = Math.floor((blockH - contentTotalH) / 2);

				// --- 核心修复逻辑结束 ---

				let kindIndex = CONSTANTS.KEY_LIST.length - 1;
				let cellIndex = 0;

				while (kindIndex >= 0 && cellIndex < lines * cols) {
					if (todraw[kindIndex] > 0) {
						const col = cellIndex % cols;
						const row = Math.floor(cellIndex / cols);

						// 坐标公式：
						// 区域左边 + 居中修正 + 全局微调 + (第N+1个间距) + (第N个图标宽)
						const drawX = blockLeft + startOffsetX + globalOffsetX + (col + 1) * safeGapX + col * iconW;
						const drawY = blockTop + startOffsetY + globalOffsetY + (row + 1) * safeGapY + row * iconH;

						this.drawKey(CONSTANTS.KEY_LIST[kindIndex], drawX, drawY);

						todraw[kindIndex]--;
						cellIndex++;
					} else {
						kindIndex--;
					}
				}
			};

			// --- 主体：横竖屏都使用新的 grid 绘制模式 ---
			if (core.domStyle.isVertical) {
				core.clearMap("outerUI",
					CONSTANTS.KEY_BLOCK_LEFT_VERTICAL,
					CONSTANTS.KEY_BLOCK_TOP_VERTICAL,
					CONSTANTS.KEY_BLOCK_WIDTH_VERTICAL,
					CONSTANTS.KEY_BLOCK_HEIGHT_VERTICAL
				);

				drawKeyListGrid(
					CONSTANTS.KEY_BLOCK_LEFT_VERTICAL,
					CONSTANTS.KEY_BLOCK_TOP_VERTICAL,
					CONSTANTS.KEY_BLOCK_WIDTH_VERTICAL,
					CONSTANTS.KEY_BLOCK_HEIGHT_VERTICAL,
					2, 7 // 竖屏行列
				);

			} else {
				core.clearMap("outerUI",
					CONSTANTS.KEY_BLOCK_LEFT,
					CONSTANTS.KEY_BLOCK_TOP,
					CONSTANTS.KEY_BLOCK_WIDTH,
					CONSTANTS.KEY_BLOCK_HEIGHT
				);

				drawKeyListGrid(
					CONSTANTS.KEY_BLOCK_LEFT,
					CONSTANTS.KEY_BLOCK_TOP,
					CONSTANTS.KEY_BLOCK_WIDTH,
					CONSTANTS.KEY_BLOCK_HEIGHT,
					3, 6 // 横屏行列
				);
			}
		}




		drawKey(key, x, y) {
			let sx = 3;
			let sy = 0;
			if (key == "blueKey") {
				sx += 16;
			} else if (key == "yellowKey") {
				sy += 16;
			}
			core.drawImage("outerUI", core.statusBar.icons.keys, sx, sy, CONSTANTS.KEY_SIZE[0], CONSTANTS.KEY_SIZE[1], x, y, CONSTANTS.KEY_SIZE[0], CONSTANTS.KEY_SIZE[1]);
		}

		_update_infoWindow() {
			core.setTextAlign("outerUI", "center")
			const itemId = this.selectedItem;

			if (core.domStyle.isVertical) {
				// 竖屏下信息窗口使用新的位置和布局
				core.clearMap("outerUI", CONSTANTS.INFO_BLOCK_LEFT_VERTICAL, CONSTANTS.INFO_BLOCK_TOP_VERTICAL, CONSTANTS.INFO_BLOCK_WIDTH_VERTICAL, CONSTANTS.INFO_BLOCK_HEIGHT_VERTICAL);
				if (this.selectedItem) {
					const icon = core.material.icons.items[itemId];
					const item = core.material.items[itemId];
					core.fillText("outerUI", item.name,
						CONSTANTS.INFO_BLOCK_LEFT_VERTICAL + 64, CONSTANTS.INFO_BLOCK_TOP_VERTICAL + 22, CONSTANTS.INFO_TEXT_COLOR, `${CONSTANTS.FONT_SIZE_NORMAL}px ${CONSTANTS.FONT_FAMILY}`);
					core.drawImage('outerUI', core.material.images.items, 0, 32 * icon, 32, 32,
						CONSTANTS.INFO_BLOCK_LEFT_VERTICAL + 128, CONSTANTS.INFO_BLOCK_TOP_VERTICAL + 2, 32, 32);
					core.ui.drawTextContent("outerUI", item.text, {
						left: CONSTANTS.INFO_BLOCK_LEFT_VERTICAL + 3,
						top: CONSTANTS.INFO_BLOCK_TOP_VERTICAL + 36,
						maxWidth: CONSTANTS.INFO_BLOCK_WIDTH_VERTICAL - 3,
						color: CONSTANTS.INFO_TEXT_COLOR,
						fontSize: CONSTANTS.INFO_TEXT_WEIGHT
					});
				}
			} else {
				core.clearMap("outerUI", CONSTANTS.INFO_BLOCK_LEFT, CONSTANTS.INFO_BLOCK_TOP, CONSTANTS.INFO_BLOCK_WIDTH, CONSTANTS.INFO_BLOCK_HEIGHT);
				if (this.selectedItem) {
					const icon = core.material.icons.items[itemId];
					core.fillText("outerUI", core.material.items[itemId].name, CONSTANTS.INFO_BLOCK_LEFT + 35, CONSTANTS.INFO_BLOCK_TOP + 25, CONSTANTS.INFO_TEXT_COLOR, `${CONSTANTS.FONT_SIZE_NORMAL}px ${CONSTANTS.FONT_FAMILY}`);
					core.drawImage('outerUI', core.material.images.items, 0, 32 * icon, 32, 32,
						CONSTANTS.INFO_BLOCK_LEFT + 70, CONSTANTS.INFO_BLOCK_TOP + 4, 32, 32);
					core.ui.drawTextContent("outerUI", core.material.items[itemId].text, {
						left: CONSTANTS.INFO_BLOCK_LEFT + 1,
						top: CONSTANTS.INFO_BLOCK_TOP + 36,
						maxWidth: CONSTANTS.INFO_BLOCK_WIDTH - 1,
						color: CONSTANTS.INFO_TEXT_COLOR,
						fontSize: CONSTANTS.INFO_TEXT_WEIGHT
					});
				}
			}
		}

		showItemInfo(itemId) {
			this.selectedItem = itemId;
			this._update_infoWindow();
		}

		clearItemInfo() {
			this.selectedItem = null;
			this._update_infoWindow();
		}

		_update_toolBox() {
			const tools = core.isReplaying() ? [
				[core.status.replay.pausing ? "play" : "pause", "stop", "rewind"],
				["speedDown", "speedUp", "save"],
			] : [
				["keyboard", "autoload", "help"],
				["save", "load", "settings"],
			];

			if (core.domStyle.isVertical) {
				core.clearMap("outerUI", CONSTANTS.TOOL_BOX_LEFT_VERTICAL, CONSTANTS.TOOL_BOX_TOP_VERTICAL, CONSTANTS.TOOL_BOX_WIDTH_VERTICAL, CONSTANTS.TOOL_BOX_HEIGHT_VERTICAL);
				for (let i = 0; i < tools.length; i++) {
					for (let j = 0; j < tools[i].length; j++) {
						core.drawIcon("outerUI", tools[i][j],
							CONSTANTS.TOOL_BOX_LEFT_VERTICAL + j * CONSTANTS.TOOL_ICON_OUTER_SIZE,
							CONSTANTS.TOOL_BOX_TOP_VERTICAL + i * CONSTANTS.TOOL_ICON_OUTER_SIZE, CONSTANTS.TOOL_ICON_SIZE, CONSTANTS.TOOL_ICON_SIZE);
					}
				}
			} else {
				core.clearMap("outerUI", CONSTANTS.TOOL_BOX_LEFT, CONSTANTS.TOOL_BOX_TOP, CONSTANTS.TOOL_BOX_WIDTH, CONSTANTS.TOOL_BOX_HEIGHT);
				for (let i = 0; i < tools.length; i++) {
					for (let j = 0; j < tools[i].length; j++) {
						core.drawIcon("outerUI", tools[i][j],
							CONSTANTS.TOOL_BOX_LEFT + j * CONSTANTS.TOOL_ICON_OUTER_SIZE,
							CONSTANTS.TOOL_BOX_TOP + i * CONSTANTS.TOOL_ICON_OUTER_SIZE, CONSTANTS.TOOL_ICON_SIZE, CONSTANTS.TOOL_ICON_SIZE);
					}
				}
			}
		}

		onclick(x, y) {
			const makeBox = ([x, y], [w, h]) => {
				return [
					[x, y],
					[x + w, y + h]
				];
			};

			const gridify = ([x, y], [gw, gh]) => {
				return [parseInt(x / gw), parseInt(y / gh)];
			};

			const useItem = (itemId) => {
				if (!core.hasItem(itemId)) return;

				if (core.material.items[itemId].cls == "constants") {
					switch (itemId) {
					case "book":
						core.openBook(true);
						break;
					case "fly":
						core.useFly(true);
						break;
					case "wand":
						core.insertAction({ type: "useItem", id: itemId });
						break;
					case "snow":
						core.useItem("snow");
						break;
					default:
						this.showItemInfo(itemId);
					}
				} else if (itemId != this.selectedItem) {
					this.showItemInfo(itemId);
				} else {
					switch (itemId) {
					case "centerFly":
						core.ui._drawCenterFly();
						break;
					default:
						core.useItem(itemId);
					}
				}
			};

			const inRect = ([x, y], [
				[sx, sy],
				[dx, dy]
			]) => {
				return sx <= x && x <= dx && sy <= y && y <= dy;
			};

			const relativeTo = ([x, y], [ax, ay]) => {
				return [x - ax, y - ay];
			};

			const pos = [x, y];

			if (core.domStyle.isVertical) {
				// 竖屏下物品栏点击区域调整为2行8列
				const itemBox = makeBox([CONSTANTS.ITEM_BOX_LEFT_VERTICAL, CONSTANTS.ITEM_BOX_TOP_VERTICAL], [CONSTANTS.ITEM_COL_STEP * 8, CONSTANTS.ITEM_ROW_STEP * 2]);
				if (inRect(pos, itemBox)) {
					const [gx, gy] = gridify(relativeTo(pos, itemBox[0]), [CONSTANTS.ITEM_COL_STEP, CONSTANTS.ITEM_ROW_STEP]);
					const itemId = this.itemMxVertical[gy][gx];
					if (itemId === "book") return useItem(itemId);
					if (core.isReplaying() || core.status.lockControl || core.isMoving()) return;
					useItem(itemId);
					return;
				}

				const toolBox = makeBox([CONSTANTS.TOOL_BOX_LEFT_VERTICAL, CONSTANTS.TOOL_BOX_TOP_VERTICAL], [CONSTANTS.TOOL_ICON_OUTER_SIZE * CONSTANTS.TOOL_COLS, CONSTANTS.TOOL_ICON_OUTER_SIZE * CONSTANTS.TOOL_ROWS]);
				if (inRect(pos, toolBox)) {
					const [row, col] = gridify(relativeTo(pos, toolBox[0]), [CONSTANTS.TOOL_ICON_OUTER_SIZE, CONSTANTS.TOOL_ICON_OUTER_SIZE]);
					if (core.isReplaying()) {
						this.replayAction[col][row].call(core);
					} else if (core.isPlaying()) {
						this.toolbarAction[col][row].call(core, true);
					}
					return;
				}
			} else {
				const itemBox = makeBox([CONSTANTS.ITEM_BOX_LEFT, CONSTANTS.ITEM_BOX_TOP], [CONSTANTS.ITEM_COL_STEP * 3, CONSTANTS.ITEM_ROW_STEP * 5]);
				if (inRect(pos, itemBox)) {
					const [gx, gy] = gridify(relativeTo(pos, itemBox[0]), [CONSTANTS.ITEM_COL_STEP, CONSTANTS.ITEM_ROW_STEP]);
					const itemId = this.itemMx[gy][gx];
					if (itemId === "book") return useItem(itemId);
					if (core.isReplaying() || core.status.lockControl || core.isMoving()) return;
					useItem(itemId);
					return;
				}

				const toolBox = makeBox([CONSTANTS.TOOL_BOX_LEFT, CONSTANTS.TOOL_BOX_TOP], [CONSTANTS.TOOL_ICON_OUTER_SIZE * CONSTANTS.TOOL_COLS, CONSTANTS.TOOL_ICON_OUTER_SIZE * CONSTANTS.TOOL_ROWS]);
				if (inRect(pos, toolBox)) {
					const [row, col] = gridify(relativeTo(pos, toolBox[0]), [CONSTANTS.TOOL_ICON_OUTER_SIZE, CONSTANTS.TOOL_ICON_OUTER_SIZE]);
					if (core.isReplaying()) {
						this.replayAction[col][row].call(core);
					} else if (core.isPlaying()) {
						this.toolbarAction[col][row].call(core, true);
					}
					return;
				}
			}
		}

		_update_infoBar() {
			core.setTextAlign('outerUI', 'left');

			let text = this.infoText;
			if (!text) {
				text = core.domStyle.isVertical ?
					CONSTANTS.INFO_BAR_DEFAULT_TEXT_VERTICAL :
					CONSTANTS.INFO_BAR_DEFAULT_TEXT;
			}

			const fontSize = core.domStyle.isVertical ?
				`${CONSTANTS.FONT_WEIGHT} ${CONSTANTS.FONT_SIZE_NORMAL_VERTICAL}px ${CONSTANTS.FONT_FAMILY}` :
				`${CONSTANTS.FONT_WEIGHT} ${CONSTANTS.FONT_SIZE_NORMAL}px ${CONSTANTS.FONT_FAMILY}`;

			core.setFont("outerUI", fontSize);

			if (core.domStyle.isVertical) {
				core.clearMap("outerUI", 0, INFO_BAR_TOP_VERTICAL, CONSTANTS.GAMEVIEW_WIDTH_VERTICAL, CONSTANTS.INFO_BAR_HEIGHT_VERTICAL);
				core.fillText("outerUI", text, CONSTANTS.INFO_BAR_LEFT_MARGIN, INFO_BAR_TOP_VERTICAL + 14, CONSTANTS.TEXT_COLOR);
			} else {
				core.clearMap("outerUI", 0, INFO_BAR_TOP, CONSTANTS.GAMEVIEW_WIDTH, CONSTANTS.INFO_BAR_HEIGHT);
				core.fillText("outerUI", text, CONSTANTS.INFO_BAR_LEFT_MARGIN, INFO_BAR_TOP + 16, CONSTANTS.TEXT_COLOR);
			}

			core.setTextAlign('outerUI', 'center');
		}

		print(text) {
			this.infoText = text;
			this._update_infoBar();
		}

		printEnvironmentInfo() {
			/*
			const ids = [];
			for (const block of core.status.thisMap.blocks) {
				if (!block.disable && core.nearHero(block.x, block.y)) {
					ids.push(block.event.id);
				}
			}

			const infoRules = [
				{ id: "lava", text: "岩浆好热啊!" },
				{ id: "upFloor", text: "你看到了楼梯" },
				{ id: "downFloor", text: "你看到了楼梯" },
				{ id: "blueShop", text: "你看到了一个祭坛" },
				{ id: "man", text: "你看到了一个老人" },
				{ id: "woman", text: "你看到了一个商人" },
				{ id: "fairy", text: "你看到了一个商人" },
				{ id: "thief", text: "你看到了一个小偷" },
			];

			for (const infoRule of infoRules) {
				if (ids.indexOf(infoRule.id) >= 0) {
					this.print(infoRule.text);
					return;
				}
			}
			*/
		}

		clearInfo() {
			this.clearItemInfo();
			this.infoText = ""; // 清空当前文本
			this._update_infoBar();
		}

		// 在StatusBar类的构造函数后添加方法
		_update_extraInfo() {
			const flag1 = core.getFlag('开启特性', -1);
			const flag2 = core.getFlag('addhp', -1);

			// 如果任何一个标志为-1，则不显示
			if (flag1 === -1 || flag2 === -1) {
				// 清除区域
				if (!core.domStyle.isVertical) {
					core.clearMap("outerUI",
						CONSTANTS.EXTRA_INFO_BLOCK_LEFT,
						CONSTANTS.EXTRA_INFO_BLOCK_TOP,
						CONSTANTS.EXTRA_INFO_BLOCK_WIDTH,
						CONSTANTS.EXTRA_INFO_BLOCK_HEIGHT
					);
				}
				return;
			}

			// 构建显示文本
			let displayText = "";

			// 根据特性标志确定文本
			if (flag1 === 0) {
				displayText = "纯净版";
			} else if (flag1 === 1) {
				displayText = "特性版";
			}

			// 如果addhp标志为1，则添加额外文本
			if (flag2 === 1) {
				displayText += "-疯狂加血";
			}

			if (core.domStyle.isVertical) {
				// 清除区域
				core.clearMap("outerUI",
					CONSTANTS.EXTRA_INFO_BLOCK_LEFT_VERTICAL,
					CONSTANTS.EXTRA_INFO_BLOCK_TOP_VERTICAL,
					CONSTANTS.EXTRA_INFO_BLOCK_WIDTH_VERTICAL,
					CONSTANTS.EXTRA_INFO_BLOCK_HEIGHT_VERTICAL
				);

				// 设置字体
				const fontStyle = `${CONSTANTS.FONT_WEIGHT_VERTICAL} ${CONSTANTS.EXTRA_INFO_FONT_SIZE}px ${CONSTANTS.FONT_FAMILY}`;
				core.setFont("outerUI", fontStyle);

				// 绘制文本（居中对齐）
				core.setTextAlign("outerUI", "center");
				core.fillText("outerUI",
					displayText,
					CONSTANTS.EXTRA_INFO_BLOCK_LEFT_VERTICAL + CONSTANTS.EXTRA_INFO_BLOCK_WIDTH_VERTICAL / 2,
					CONSTANTS.EXTRA_INFO_BLOCK_TOP_VERTICAL + CONSTANTS.EXTRA_INFO_FONT_SIZE + 2, // 稍微下移以便居中
					CONSTANTS.TEXT_COLOR
				);

				// 恢复默认对齐方式
				core.setTextAlign("outerUI", "center");
			} else {
				// 清除区域
				core.clearMap("outerUI",
					CONSTANTS.EXTRA_INFO_BLOCK_LEFT,
					CONSTANTS.EXTRA_INFO_BLOCK_TOP,
					CONSTANTS.EXTRA_INFO_BLOCK_WIDTH,
					CONSTANTS.EXTRA_INFO_BLOCK_HEIGHT
				);

				// 设置字体
				const fontStyle = `${CONSTANTS.FONT_WEIGHT} ${CONSTANTS.EXTRA_INFO_FONT_SIZE}px ${CONSTANTS.FONT_FAMILY}`;
				core.setFont("outerUI", fontStyle);

				// 绘制文本（居中对齐）
				core.setTextAlign("outerUI", "center");
				core.fillText("outerUI",
					displayText,
					CONSTANTS.EXTRA_INFO_BLOCK_LEFT + CONSTANTS.EXTRA_INFO_BLOCK_WIDTH / 2,
					CONSTANTS.EXTRA_INFO_BLOCK_TOP + CONSTANTS.EXTRA_INFO_FONT_SIZE + 5, // 稍微下移以便居中
					CONSTANTS.TEXT_COLOR
				);

				// 恢复默认对齐方式
				core.setTextAlign("outerUI", "center");
			}
		}
	}

	core.ui.statusBar = new StatusBar();

	core.control.clearStatusBar = function () {
		core.clearMap("outerUI");
	};
},
    "override": function () {

	core.statusBar.icons = {
		'floor': 0,
		'name': null,
		'lv': 1,
		'hpmax': 2,
		'hp': 3,
		'atk': 4,
		'def': 5,
		'mdef': 6,
		'money': 7,
		'experience': 8,
		'up': 9,
		'book': 10,
		'fly': 11,
		'toolbox': 12,
		'keyboard': 13,
		'shop': 14,
		'save': 15,
		'load': 16,
		'settings': 17,
		'play': 18,
		'pause': 19,
		'stop': 20,
		'speedDown': 21,
		'speedUp': 22,
		'rewind': 23,
		'equipbox': 24,
		'mana': 25,
		'skill': 26,
		'paint': 27,
		'erase': 28,
		'empty': 29,
		'exit': 30,
		'btn1': 31,
		'btn2': 32,
		'btn3': 33,
		'btn4': 34,
		'btn5': 35,
		'btn6': 36,
		'btn7': 37,
		'btn8': 38,
		'keys': 39,
		'help': 40,
		'battle': 41,
		'autoload': 42
	};

	control.prototype._drawHero_updateViewport = function (x, y, offset) {}

	ui.prototype.drawWindowSkin = function (background, ctx, x, y, w, h, direction, px, py) {
		background = background || core.status.textAttribute.background;
		// 仿RM窗口皮肤 ↓
		// 绘制背景
		core.drawImage(ctx, background, 0, 0, 128, 128, x + 2, y + 2, w - 4, h - 4);
		// 绘制边框
		// 上方
		core.drawImage(ctx, background, 128, 0, 16, 16, x, y, 16, 16);
		for (var dx = 0; dx < w - 64; dx += 32) {
			core.drawImage(ctx, background, 144, 0, 32, 16, x + dx + 16, y, 32, 16);
			core.drawImage(ctx, background, 144, 48, 32, 16, x + dx + 16, y + h - 16, 32, 16);
		}
		core.drawImage(ctx, background, 144, 0, w - dx - 32, 16, x + dx + 16, y, w - dx - 32, 16);
		core.drawImage(ctx, background, 144, 48, w - dx - 32, 16, x + dx + 16, y + h - 16, w - dx - 32, 16);
		core.drawImage(ctx, background, 176, 0, 16, 16, x + w - 16, y, 16, 16);
		// 左右
		for (var dy = 0; dy < h - 64; dy += 32) {
			core.drawImage(ctx, background, 128, 16, 16, 32, x, y + dy + 16, 16, 32);
			core.drawImage(ctx, background, 176, 16, 16, 32, x + w - 16, y + dy + 16, 16, 32);
		}
		core.drawImage(ctx, background, 128, 16, 16, h - dy - 32, x, y + dy + 16, 16, h - dy - 32);
		core.drawImage(ctx, background, 176, 16, 16, h - dy - 32, x + w - 16, y + dy + 16, 16, h - dy - 32);
		// 下方
		core.drawImage(ctx, background, 128, 48, 16, 16, x, y + h - 16, 16, 16);
		core.drawImage(ctx, background, 176, 48, 16, 16, x + w - 16, y + h - 16, 16, 16);

		// arrow
		if (px != null && py != null) {
			if (direction == 'up') {
				core.drawImage(ctx, background, 128, 96, 32, 32, px, y + h - 3, 32, 32);
			} else if (direction == 'down') {
				core.drawImage(ctx, background, 160, 96, 32, 32, px, y - 29, 32, 32);
			}
		}
		var c = parseInt(w / 2);
		core.drawImage(ctx, background, 160, 90, 16, 6, x + c - 8, y, 16, 6);
	}

	ui.prototype._drawCenterFly = function () {
		core.lockControl();
		core.status.event.id = 'centerFly';
		var fillstyle = 'rgba(255,0,0,0.5)';
		if (core.canUseItem('centerFly')) fillstyle = 'rgba(0,255,0,0.5)';
		var toX = core.bigmap.width - 1 - core.getHeroLoc('x'),
			toY = core.bigmap.height - 1 - core.getHeroLoc('y');
		this.clearUI();
		core.fillRect('ui', 0, 0, this.PIXEL, this.PIXEL, '#000000');
		core.drawThumbnail(null, null, { heroLoc: core.status.hero.loc, heroIcon: core.status.hero.image, ctx: 'ui', centerX: toX, centerY: toY });
		var offsetX = 1,
			offsetY = 1;
		core.fillRect('ui', (toX - offsetX) * 32, (toY - offsetY) * 32, 32, 32, fillstyle);
		core.status.event.data = { "x": toX, "y": toY, "posX": toX - offsetX, "posY": toY - offsetY };
		core.playSound('打开界面');
		core.drawTip("请确认当前" + core.material.items['centerFly'].name + "的位置", 'centerFly');
		return;
	}

	actions.prototype._getClickLoc = function (x, y) {
		var size = 32 * core.domStyle.scale;
		var left = main.dom.gameDraw.offsetLeft + main.dom.gameGroup.offsetLeft;
		var top = main.dom.gameDraw.offsetTop + main.dom.gameGroup.offsetTop;
		var loc = { 'x': Math.max(x - left, 0), 'y': Math.max(y - top, 0), 'size': size };
		return loc;
	}

	enemys.prototype.getDamageString = function (enemy, x, y, floorId) {
		if (typeof enemy == 'string') enemy = core.material.enemys[enemy];
		var damage = this.getDamage(enemy, x, y, floorId);

		var color = '#000000';

		if (damage == null) {
			damage = "???";
			color = '#FF2222';
		} else {
			if (core.hasFlag('addhp')) {
				if (damage < core.status.hero.hp) color = '#11FF11';
				else color = '#FF2222';
			} else if (damage <= 0) color = '#11FF11';
			else if (damage < core.status.hero.hp / 3) color = '#FFFFFF';
			else if (damage < core.status.hero.hp * 2 / 3) color = '#FFFF00';
			else if (damage < core.status.hero.hp) color = '#FF9933';
			else color = '#FF2222';

			damage = core.formatBigNumber(damage, true);
			if (core.enemys.hasSpecial(enemy, 19))
				damage += "+";
			if (core.enemys.hasSpecial(enemy, 21))
				damage += "-";
			if (core.enemys.hasSpecial(enemy, 11))
				damage += "^";
		}

		return {
			"damage": damage,
			"color": color
		};
	}

	ui.prototype._drawBook_drawDamage = function (index, enemy, offset, position) {
		core.setTextAlign('ui', 'center');
		var damage = enemy.damage,
			color = '#FFFF00';
		if (damage == null) {
			damage = '不可攻击';
			color = '#FF2222';
		}
		if (damage == 0) {
			damage = '无危险';
			color = '#11FF11';
		} else {
			if (damage >= core.status.hero.hp) color = '#FF2222';
			else if (damage >= core.status.hero.hp * 2 / 3) color = '#FF9933';
			else if (damage <= 0) color = '#11FF11';
			damage = core.formatBigNumber(damage);
			if (core.enemys.hasSpecial(enemy, 19)) damage += "+";
			if (core.enemys.hasSpecial(enemy, 21)) damage += "-";
			if (core.enemys.hasSpecial(enemy, 11)) damage += "^";
		}
		if (enemy.notBomb) damage += "[b]";
		core.fillText('ui', damage, offset, position, color, this._buildFont(13, true));
	}

	ui.prototype._drawWindowSelector = function (background, x, y, w, h) {
		w = Math.round(w) + 48;
		h = Math.round(h);
		var ctx = core.ui.createCanvas("_selector", x - 24, y, w, h, 165);
		ctx.canvas.id = '';
		this._drawSelector(ctx, background, w, h);
	}

	ui.prototype._drawSelector = function (ctx, background, w, h, left, top) {
		left = left || 0;
		top = top || 0;
		ctx = this.getContextByName(ctx);
		if (!ctx) return;
		if (typeof background == 'string')
			background = core.material.images.images[background];
		if (!(background instanceof Image)) return;
		// badge
		core.drawImage(ctx, background, 132, 68, 24, 24, left + 4, top + 4, 24, 24);
		core.drawImage(ctx, background, 132, 68, 24, 24, w - left - 28, top + 4, 24, 24);
	}

	ui.prototype.drawTip = function (text, id, frame) {
		core.ui.statusBar.print(text);
	}

	control.prototype._updateStatusBar_setToolboxIcon = function () {
		core.ui.statusBar._update_toolBox();
	}

	if (window.jsinterface && window.jsinterface.requestLandscape) {
		window.jsinterface.requestLandscape();
	}

	//能获胜时返回0，不能时返回1（不破防）2（伤害过高）
	function canNotBattle(enemy, x, y, floorId, cbd) {
		if (typeof enemy == 'string') enemy = core.material.enemys[enemy];
		var damage = core.getDamage(enemy, x, y, floorId);
		if (damage == null) return 1;
		if (cbd && core?.status?.checkBlock?.damage?.[`${x},${y}`])
			damage += core.status.checkBlock.damage[`${x},${y}`];
		if (damage >= core.status.hero.hp) return 2;
		return 0;
	}

	//战斗函数修复，并还原，加入对话穿墙功能
	events.prototype.battle = function (id, x, y, force, callback) {
		//core.saveAndStopAutomaticRoute();
		var enemy = id || core.getBlockId(x, y);
		if (typeof enemy == 'string') enemy = core.material.enemys[enemy];
		if (!enemy) return core.clearContinueAutomaticRoute(callback);
		let n = canNotBattle(enemy, x, y, false);

		if (n > 0 && !force && !core.status.event.id) {
			if (n === 1) {
				core.drawTip(`${enemy.name}的防御太高，不可攻击`);
			} else if (n === 2) {
				core.drawTip("你的生命太低了，进攻（进入）这个地方会导致死亡!!!");
			}
			core.stopSound();
			core.playSound('操作失败');
			//core.drawTip("你打不过此怪物！", id);
			return core.clearContinueAutomaticRoute(callback);
		}
		// 战前事件
		if (!this.beforeBattle(enemy.id, x, y))
			return core.clearContinueAutomaticRoute(callback);
		// 战后事件
		this.afterBattle(enemy.id, x, y);
		if (callback) callback();
	}
	//打不过的怪物不能进入
	maps.prototype.noPass = function (x, y, floorId) {
		var block = core.getBlock(x, y, floorId);
		if (block == null) return false;
		if (block.event.cls === 'enemys') {
			return canNotBattle(block.event.id, x, y, floorId, true);
		}
		return block.event.noPass;
	}
	//给出提示
	function canMoveHeroWithTip(x, y, direction, noPass) {
		var floorId = core.status.floorId;
		if (!floorId) return false;
		var arrays = core.maps._generateMovableArray_arrays(floorId);

		// 1. 检查该点 cannotMove
		if (core.inArray((core.floors[floorId].cannotMove || {})[x + "," + y], direction))
			return false;

		var nx = x + core.utils.scan[direction].x,
			ny = y + core.utils.scan[direction].y;
		if (nx < 0 || ny < 0 || nx >= core.floors[floorId].width || ny >= core.floors[floorId].height)
			return false;

		// 2. 检查下个点的 cannotMoveIn
		if (core.inArray((core.floors[floorId].cannotMoveIn || {})[nx + "," + ny], core.turnDirection(":back", direction)))
			return false;

		// 3. 检查该点素材的 cannotOut 和下一个点的 cannotIn
		if (core.maps._canMoveHero_checkCannotInOut(Object.keys(arrays).map(function (name) { return arrays[name][y][x]; }), "cannotOut", direction))
			return false;
		if (core.maps._canMoveHero_checkCannotInOut(Object.keys(arrays).map(function (name) { return arrays[name][ny][nx]; }), "cannotIn", direction))
			return false;

		// 4. 检查是否能进将死的领域
		if (floorId == core.status.floorId && !core.flags.canGoDeadZone && !core.status.lockControl &&
			Math.max(core.status.hero.hp, 1) <= ((core.status.checkBlock.damage || {})[nx + "," + ny] || 0)) {
			if (!noPass) core.drawTip("你的生命太低了，进入这个地方会导致死亡!!!");
			return false;
		}
		return true;
	}

	function doorCheck(x, y) {
		let block = core.getBlock(x, y);
		if (!block?.event) return false;

		const id = block.event.id;
		const isDoorLike = core.material.icons.animates[id] || core.material.icons.npc48[id];

		if (!isDoorLike) return false;

		const doorInfo = block.event.doorInfo;
		if (!doorInfo) return false;

		const keyInfo = doorInfo.keys || {};

		for (let rawName in keyInfo) {
			const needCount = keyInfo[rawName];
			const pureName = rawName.endsWith(':o') ? rawName.slice(0, -2) : rawName;

			const item = core.material.items[pureName];

			// — 道具不存在 —
			if (!item) {
				return true;
			}

			// — 数量不足 —
			if (core.itemCount(pureName) < needCount) {
				return true;
			}
		}
		return false;
	}
	//对话穿墙，战斗检测，0血不能移动，自动存档
	control.prototype.moveAction = function (callback) {
		if (core.status.heroMoving > 0) return;

		if (core.status.hero.hp <= 0) {
			core.drawTip("你的生命太低了，进攻（进入）这个地方会导致死亡!!!");
			return this._moveAction_noPass(false, callback);
		}

		let nx = core.nextX(),
			ny = core.nextY();
		if (nx < 1 || ny < 1 || nx > 11 || ny > 11) return this._moveAction_noPass(false, callback);

		var noPass = core.noPass(nx, ny);
		var canMove = canMoveHeroWithTip(core.getHeroLoc('x'), core.getHeroLoc('y'), core.getHeroLoc('direction'), noPass);

		if (noPass === 1) {
			let enemy = core.material.enemys[core.getBlockId(nx, ny)];
			core.drawTip(`${enemy.name}的防御太高，不可攻击`);
		} else if (noPass === 2) {
			core.drawTip("你的生命太低了，进攻（进入）这个地方会导致死亡!!!");
		}
		// 下一个点如果不能走
		if (noPass) {
			let b = core.getBlock(nx, ny);
			if (canMove && core.getFlag('对话能量', 0) > 0 && core.hasFlag('开启特性') && ((!b.event.data && !b.event.trigger) || (noPass === 1 || noPass === 2) || (doorCheck(nx, ny)))) {
				core.plugin.autosaveFromSnapshot();
				core.setFlag('对话能量', 0);
				core.removeBlock(nx, ny);
				core.drawTip('用神秘的力量摧毁了障碍！');
				return this._moveAction_moving(callback);
			} else {
				if (noPass === 1 || noPass === 2) return this._moveAction_noPass(false, callback);
				return this._moveAction_noPass(canMove, callback);
			}
		}
		if (!canMove) return this._moveAction_noPass(canMove, callback);
		var cls = core.getBlockCls(nx, ny);
		if (cls === 'items' || cls === 'enemys') {
			core.plugin.autosaveFromSnapshot();
		}
		this._moveAction_moving(callback);
	}
	//对话穿墙，0血不能移动
	maps.prototype._canMoveDirectly_checkGlobal = function () {
		// 检查全塔是否禁止瞬间移动
		if (!core.flags.enableMoveDirectly) return false;
		// 检查该楼层是否不可瞬间移动
		if (core.status.thisMap.cannotMoveDirectly) return false;
		// flag:cannotMoveDirectly为true：不能
		if (core.hasFlag('cannotMoveDirectly')) return false;
		if (core.getFlag('对话能量', 0) > 0 && core.hasFlag('开启特性')) return false;

		return (core.status.hero.hp > 0);
	}
	//对话穿墙，快照存档
	events.prototype._openDoor_check = function (block, x, y, needKey) {

		const clearAndReturn = () => {
			core.clearContinueAutomaticRoute();
			return false;
		};

		if (!block?.event) return clearAndReturn();

		const id = block.event.id;
		const isDoorLike = core.material.icons.animates[id] || core.material.icons.npc48[id];

		if (!isDoorLike) return clearAndReturn();

		const doorInfo = block.event.doorInfo;
		if (!doorInfo) return clearAndReturn();

		const keyInfo = doorInfo.keys || {};

		// 失败提示统一
		const fail = (msg) => {
			core.stopSound();
			if (msg) core.drawTip(msg, null, true);
			return clearAndReturn();
		};

		// —— 检查钥匙是否足够 ————————————————————————————————————————
		if (needKey) {
			for (let rawName in keyInfo) {
				const needCount = keyInfo[rawName];
				const pureName = rawName.endsWith(':o') ? rawName.slice(0, -2) : rawName;

				const item = core.material.items[pureName];

				// — 道具不存在 —
				if (!item) {
					return fail("无法开启此门");
				}

				// — 数量不足 —
				if (core.itemCount(pureName) < needCount) {
					return fail("你的" + item.name + "不足！");
				}
			}

			// 快照存档
			if (!core.status.event.id) core.plugin.autosaveFromSnapshot(true);

			// 扣除钥匙（忽略带 :o 的）
			for (let rawName in keyInfo) {
				if (!rawName.endsWith(':o')) {
					core.removeItem(rawName, keyInfo[rawName]);
				}
			}
		}

		// —— 开门 ————————————————————————————————————————————————
		core.playSound(doorInfo.openSound);
		return true;
	};
	//对话穿墙，使用道具前存档
	items.prototype.useItem = function (itemId, noRoute, callback) {
		if (!this.canUseItem(itemId)) {
			if (callback) callback();
			return;
		}
		if (core.material.items[itemId].cls === 'tools') {
			if (noRoute) core.autosave(true);
			else core.autosave(false);
		}
		// 执行道具效果
		this._useItemEffect(itemId);
		// 执行完毕
		this._afterUseItem(itemId);
		// 记录路线
		if (!noRoute) {
			core.addFlag('对话能量', -1);
			core.status.route.push("item:" + itemId);
		}
		if (callback) callback();
	}

	function getDamageAngle(direction) {
		switch (direction) {
		case 'up':
			return 0;
		case 'right':
			return Math.PI / 2;
		case 'down':
			return Math.PI;
		case 'left':
			return Math.PI * 3 / 2;
		}
		return 0;
	}


	function showDamageAnimation(x, y) {
		var directions = getDamageDirections(x, y);

		directions.forEach(function (direction) {
			var offset = getDirectionOffset(direction);
			var image = core.material.images.images['85.png'];
			var angle = getDamageAngle(direction);

			core.drawImage(
				'event2',
				image,
				0, 0, 16, 16,
				x * 32 + offset.x,
				y * 32 + offset.y,
				16, 16,
				angle
			);

			setTimeout(function () {
				core.clearMap('event2', x * 32 + offset.x, y * 32 + offset.y, 16, 16);
			}, 200);
		});
	}


	// 获取伤害方向
	function getDamageDirections(x, y) {
		var directions = [];
		let loc = x + ',' + y;

		// 检查阻击伤害
		if (core.status.checkBlock.type && core.status.checkBlock.type[loc] &&
			core.status.checkBlock.type[loc]['阻击伤害']) {

			for (var direction in core.utils.scan) {
				var delta = core.utils.scan[direction];
				var nx = x + delta.x;
				var ny = y + delta.y;

				var enemyId = core.getBlockId(nx, ny);
				if (enemyId && core.material.enemys[enemyId] &&
					core.hasSpecial(core.material.enemys[enemyId].special, 18)) {
					directions.push(direction);
				}
			}
		}

		// 检查领域伤害（逻辑与阻击伤害相同）
		if (core.status.checkBlock.type && core.status.checkBlock.type[loc] &&
			core.status.checkBlock.type[loc]['领域伤害']) {

			for (var direction in core.utils.scan) {
				var delta = core.utils.scan[direction];
				var nx = x + delta.x;
				var ny = y + delta.y;

				var enemyId = core.getBlockId(nx, ny);
				if (enemyId && core.material.enemys[enemyId] &&
					core.hasSpecial(core.material.enemys[enemyId].special, 15)) { // 假设领域伤害也使用特殊技能18
					directions.push(direction);
				}
			}
		}

		// 检查夹击伤害
		if (core.status.checkBlock.type && core.status.checkBlock.type[loc] &&
			core.status.checkBlock.type[loc]['夹击伤害']) {

			// 检查左右夹击
			var leftEnemy = core.getBlockId(x - 1, y);
			var rightEnemy = core.getBlockId(x + 1, y);
			if (leftEnemy && rightEnemy &&
				core.hasSpecial(core.material.enemys[leftEnemy].special, 16) &&
				core.hasSpecial(core.material.enemys[rightEnemy].special, 16)) {
				directions.push('left', 'right');
			}

			// 检查上下夹击
			var upEnemy = core.getBlockId(x, y - 1);
			var downEnemy = core.getBlockId(x, y + 1);
			if (upEnemy && downEnemy &&
				core.hasSpecial(core.material.enemys[upEnemy].special, 16) &&
				core.hasSpecial(core.material.enemys[downEnemy].special, 16)) {
				directions.push('up', 'down');
			}
		}

		// 如果没有找到具体方向，显示所有方向
		if (directions.length === 0) {
			directions = ['up', 'down', 'left', 'right'];
		}

		return directions;
	}

	// 获取方向偏移量 (1/4格位置)
	function getDirectionOffset(direction) {
		switch (direction) {
		case 'up':
			return { x: 8, y: 0 }; // 上1/4
		case 'down':
			return { x: 8, y: 16 };
		case 'left':
			return { x: 0, y: 8 }; // 左1/4
		case 'right':
			return { x: 16, y: 8 }; // 右1/4
		}
	}

	// 在 checkBlock 函数内部添加动画处理
	core.control.checkBlock = function () {
		var x = core.getHeroLoc('x'),
			y = core.getHeroLoc('y'),
			loc = x + "," + y;
		var damage = core.status.checkBlock.damage[loc];

		if (damage) {
			// 显示伤害动画
			showDamageAnimation(x, y);

			core.status.hero.hp -= damage;
			core.drawTip("你没有神圣盾不能防御，受到 " + damage + " 点魔法伤害");
			core.playSound('阻激夹域');
			this._checkBlock_disableQuickShop();
			core.status.hero.statistics.extraDamage += damage;

			if (core.status.hero.hp <= 0) {
				core.status.hero.hp = 0;
				core.updateStatusBar();
				core.events.lose();
				return;
			} else {
				core.updateStatusBar();
			}
		}

		this._checkBlock_ambush(core.status.checkBlock.ambush[loc]);
		this._checkBlock_repulse(core.status.checkBlock.repulse[loc]);
	};
	//禁止在阻击块瞬移
	maps.prototype._canMoveDirectly_checkNextPoint = function (blocksObj, x, y) {
		var index = x + "," + y;
		var block = blocksObj[index];
		// 该点是否不可通行或有脚本
		if (block && !block.disable && (block.event.noPass || block.event.script || block.event.event))
			return false;
		// 该点是否是绿点可触发
		if (block && !block.disable && block.event.trigger) {
			if (block.event.trigger != 'changeFloor') return false;
			var ignore = core.flags.ignoreChangeFloor;
			if (block.event.data && block.event.data.ignoreChangeFloor != null)
				ignore = block.event.data.ignoreChangeFloor;
			if (!ignore) return false;
		}
		// 是否存在阻激夹域伤害
		if (core.status.checkBlock.damage[index]) return false;
		if (core.status.checkBlock.repulse[index]) return false;
		// 是否存在捕捉
		if (core.status.checkBlock.ambush[index]) return false;

		if (core.getFgNumber(x, y) === 103) return false;

		return true;
	}
	//自动寻路会智能避开楼梯，绕开阻击块
	maps.prototype._automaticRoute_bfs = function (startX, startY, destX, destY) {
		var route = {},
			canMoveArray = this.generateMovableArray();
		// 使用优先队列
		var queue = new PriorityQueue({ comparator: function (a, b) { return a.depth - b.depth; } });
		route[startX + "," + startY] = '';
		queue.queue({ depth: 0, x: startX, y: startY });
		var blocks = core.getMapBlocksObj();
		while (queue.length != 0) {
			var curr = queue.dequeue(),
				deep = curr.depth,
				nowX = curr.x,
				nowY = curr.y;
			for (var direction in core.utils.scan) {
				if (!core.inArray(canMoveArray[nowX][nowY], direction)) continue;
				var nx = nowX + core.utils.scan[direction].x;
				var ny = nowY + core.utils.scan[direction].y;
				if (nx < 0 || nx >= core.bigmap.width || ny < 0 || ny >= core.bigmap.height || route[nx + "," + ny] != null) continue;
				// 重点
				if (nx == destX && ny == destY) {
					route[nx + "," + ny] = direction;
					break;
				}
				// 不可通行
				if (core.noPass(nx, ny)) continue;
				let block = core.getBlock(nx, ny);
				// 绕开怪物
				if (block && block.event.cls === 'enemys') continue;
				if (block && block.event.trigger === 'changeFloor') {
					var ignore = core.flags.ignoreChangeFloor;
					if (block.event.data && block.event.data.ignoreChangeFloor != null)
						ignore = block.event.data.ignoreChangeFloor;
					if (!ignore) continue;
				}
				// 绕开阻击块
				if (core.getFgNumber(nx, ny) === 103) continue;
				route[nx + "," + ny] = direction;
				queue.queue({ depth: deep + this._automaticRoute_deepAdd(nx, ny, blocks), x: nx, y: ny });
			}
			if (route[destX + "," + destY] != null) break;
		}
		return route;
	}
	//增加物品提示
	events.prototype.getItem = function (id, num, x, y, isGentleClick, callback) {
		if (num == null) num = 1;
		var itemCls = core.material.items[id].cls;
		core.removeBlock(x, y);
		core.items.getItemEffect(id, num);
		/*
		var text = '获得 ' + core.material.items[id].name;
		if (num > 1) text += "x" + num;
		if (itemCls === 'items' && num == 1) text += core.items.getItemEffectTip(id);
		*/
		var text;
		if (core.material.items[id].itemEffectTip)
			text = core.replaceText(core.material.items[id].itemEffectTip);
		else
			text = '你得到了 ' + core.material.items[id].name;
		core.drawTip(text, id);

		// --- 首次获得道具的提示
		if (!core.hasFlag("__itemHint__")) core.setFlag("__itemHint__", []);
		var itemHint = core.getFlag("__itemHint__");
		if (core.flags.itemFirstText && itemHint.indexOf(id) < 0 && itemCls != 'items') {
			var hint = core.material.items[id].text || "该道具暂无描述";
			try {
				hint = core.replaceText(hint);
			} catch (e) {}
			if (!core.status.event.id || core.status.event.id == 'action') {
				core.insertAction("\t[" + core.material.items[id].name + "," + id + "]" + hint + "\n" +
					(id.endsWith('Key') ? "（钥匙类道具，遇到对应的门时自动打开）" :
						itemCls == 'tools' ? "（消耗类道具，请按T在道具栏使用）" :
						itemCls == 'constants' ? "（永久类道具，请按T在道具栏使用）" :
						itemCls == 'equips' ? "（装备类道具，请按Q在装备栏进行装备）" : ""));
			}
			itemHint.push(id);
		}

		this.afterGetItem(id, x, y, isGentleClick);
		if (callback) callback();
	}
	//更改提示
	core.actions._clickCenterFly = function (x, y) {
		var posX = core.status.event.data.posX,
			posY = core.status.event.data.posY;
		core.ui.closePanel();
		if (x == posX && y == posY) {
			if (core.canUseItem('centerFly')) {
				core.useItem('centerFly');
			} else {
				core.drawTip('对应单元格不是平地不能进入！');
			}
		} else core.drawTip('取消使用');
	}
	////// 是否到达过某个楼层 //////
	events.prototype.hasVisitedFloor = function (floorId) {
		if (!core.hasFlag("__visited__")) core.setFlag("__visited__", {});
		//return core.getFlag("__visited__")[floorId] || false;
		// 方法1：标准反向循环
		if (core.status.maps[floorId].isHide) return core.getFlag("__visited__")[floorId];
		for (let i = core.floorIds.length - 1; i >= 0; i--) {
			if (floorId === core.floorIds[i]) return core.getFlag("__visited__")[floorId];
			if (core.getFlag("__visited__")[core.floorIds[i]]) return true;
		}
	}

	events.prototype._action_setValue = function (data, x, y, prefix) {
		this.setValue(data.name, data.operator, data.value, prefix);
		if (!data.norefresh) {
			core.updateStatusBar();
		}
		core.doAction();
	}
	events.prototype._changeFloor_playSound = function () {
		return;
		// 播放换层音效
		if (core.hasFlag('__fromLoad__')) // 是否是读档造成的切换
			core.playSound('读档');
		else if (core.hasFlag('__isFlying__')) // 是否是楼传造成的切换
			core.playSound('飞行器');
		else
			core.playSound('上下楼');
	}
	maps.prototype.removeBlock = function (x, y, floorId) {
		floorId = floorId || core.status.floorId;
		if (!floorId) return false;

		core.extractBlocks(floorId);
		for (var i in core.status.maps[floorId].blocks) {
			var block = core.status.maps[floorId].blocks[i];
			if (block.x == x && block.y == y) {
				if (block.id === 121 || block.id === 122) core.setFlag('对话能量', 2);
				this.removeBlockByIndex(i, floorId);
				this._removeBlockFromMap(floorId, block);
				return true;
			}
		}
		return false;
	}
},
    "shop": function () {
	// 【全局商店】相关的功能
	// 
	// 打开一个全局商店
	// shopId：要打开的商店id；noRoute：是否不计入录像
	this.openShop = function (shopId, noRoute) {
		var shop = core.status.shops[shopId];
		// Step 1: 检查能否打开此商店
		if (!this.canOpenShop(shopId)) {
			core.drawTip("该商店尚未开启");
			return false;
		}

		// Step 2: （如有必要）记录打开商店的脚本事件
		if (!noRoute) {
			core.status.route.push("shop:" + shopId);
		}

		// Step 3: 检查道具商店 or 公共事件
		if (shop.item) {
			if (core.openItemShop) {
				core.openItemShop(shopId);
			} else {
				core.playSound('操作失败');
				core.insertAction("道具商店插件不存在！请检查是否存在该插件！");
			}
			return;
		}
		if (shop.commonEvent) {
			core.insertCommonEvent(shop.commonEvent, shop.args);
			return;
		}

		_shouldProcessKeyUp = true;

		// Step 4: 执行标准公共商店    
		core.insertAction(this._convertShop(shop));
		return true;
	}

	////// 将一个全局商店转变成可预览的公共事件 //////
	this._convertShop = function (shop) {
		return [
			{ "type": "function", "function": "function() {core.addFlag('@temp@shop', 1);}" },
			{
				"type": "while",
				"condition": "true",
				"data": [
					// 检测能否访问该商店
					{
						"type": "if",
						"condition": "core.isShopVisited('" + shop.id + "')",
						"true": [
							// 可以访问，直接插入执行效果
							{ "type": "function", "function": "function() { core.plugin._convertShop_replaceChoices('" + shop.id + "', false) }" },
						],
						"false": [
							// 不能访问的情况下：检测能否预览
							{
								"type": "if",
								"condition": shop.disablePreview,
								"true": [
									// 不可预览，提示并退出
									{ "type": "playSound", "name": "操作失败" },
									"当前无法访问该商店！",
									{ "type": "break" },
								],
								"false": [
									// 可以预览：将商店全部内容进行替换
									{ "type": "tip", "text": "当前处于预览模式，不可购买" },
									{ "type": "function", "function": "function() { core.plugin._convertShop_replaceChoices('" + shop.id + "', true) }" },
								]
							}
						]
					}
				]
			},
			{ "type": "function", "function": "function() {core.addFlag('@temp@shop', -1);}" }
		];
	}

	this._convertShop_replaceChoices = function (shopId, previewMode) {
		var shop = core.status.shops[shopId];
		var choices = (shop.choices || []).filter(function (choice) {
			if (choice.condition == null || choice.condition == '') return true;
			try { return core.calValue(choice.condition); } catch (e) { return true; }
		}).map(function (choice) {
			var ableToBuy = core.calValue(choice.need);
			return {
				"text": choice.text,
				"icon": choice.icon,
				"color": ableToBuy && !previewMode ? choice.color : [153, 153, 153, 1],
				"action": ableToBuy && !previewMode ? [{ "type": "playSound", "name": "商店" }].concat(choice.action) : [
					{ "type": "playSound", "name": "操作失败" },
					{ "type": "tip", "text": previewMode ? "预览模式下不可购买" : "购买条件不足" }
				]
			};
		}).concat({ "text": "离开", "action": [{ "type": "playSound", "name": "取消" }, { "type": "break" }] });
		core.insertAction({ "type": "choices", "text": shop.text, "choices": choices });
	}

	/// 是否访问过某个快捷商店
	this.isShopVisited = function (id) {
		if (!core.hasFlag("__shops__")) core.setFlag("__shops__", {});
		var shops = core.getFlag("__shops__");
		if (!shops[id]) shops[id] = {};
		return shops[id].visited;
	}

	/// 当前应当显示的快捷商店列表
	this.listShopIds = function () {
		return Object.keys(core.status.shops).filter(function (id) {
			return core.isShopVisited(id) || !core.status.shops[id].mustEnable;
		});
	}

	/// 是否能够打开某个商店
	this.canOpenShop = function (id) {
		if (this.isShopVisited(id)) return true;
		var shop = core.status.shops[id];
		if (shop.item || shop.commonEvent || shop.mustEnable) return false;
		return true;
	}

	/// 启用或禁用某个快捷商店
	this.setShopVisited = function (id, visited) {
		if (!core.hasFlag("__shops__")) core.setFlag("__shops__", {});
		var shops = core.getFlag("__shops__");
		if (!shops[id]) shops[id] = {};
		if (visited) shops[id].visited = true;
		else delete shops[id].visited;
	}

	/// 能否使用快捷商店
	this.canUseQuickShop = function (id) {
		// 如果返回一个字符串，表示不能，字符串为不能使用的提示
		// 返回null代表可以使用

		// 检查当前楼层的canUseQuickShop选项是否为false
		if (core.status.thisMap.canUseQuickShop === false)
			return '当前楼层不能使用快捷商店。';
		return null;
	}

	var _shouldProcessKeyUp = true;

	/// 允许商店X键退出
	core.registerAction('keyUp', 'shops', function (keycode) {
		if (!core.status.lockControl || core.status.event.id != 'action') return false;
		if ((keycode == 13 || keycode == 32) && !_shouldProcessKeyUp) {
			_shouldProcessKeyUp = true;
			return true;
		}

		if (!core.hasFlag("@temp@shop") || core.status.event.data.type != 'choices') return false;
		var data = core.status.event.data.current;
		var choices = data.choices;
		var topIndex = core.actions._getChoicesTopIndex(choices.length);
		if (keycode == 88 || keycode == 27) { // X, ESC
			core.actions._clickAction(core.actions.HSIZE, topIndex + choices.length - 1);
			return true;
		}
		return false;
	}, 60);

	/// 允许长按空格或回车连续执行操作
	core.registerAction('keyDown', 'shops', function (keycode) {
		if (!core.status.lockControl || !core.hasFlag("@temp@shop") || core.status.event.id != 'action') return false;
		if (core.status.event.data.type != 'choices') return false;
		var data = core.status.event.data.current;
		var choices = data.choices;
		var topIndex = core.actions._getChoicesTopIndex(choices.length);
		if (keycode == 13 || keycode == 32) { // Space, Enter
			core.actions._clickAction(core.actions.HSIZE, topIndex + core.status.event.selection);
			_shouldProcessKeyUp = false;
			return true;
		}
		return false;
	}, 60);

	// 允许长按屏幕连续执行操作
	core.registerAction('longClick', 'shops', function (x, y, px, py) {
		if (!core.status.lockControl || !core.hasFlag("@temp@shop") || core.status.event.id != 'action') return false;
		if (core.status.event.data.type != 'choices') return false;
		var data = core.status.event.data.current;
		var choices = data.choices;
		var topIndex = core.actions._getChoicesTopIndex(choices.length);
		if (x >= core.actions.CHOICES_LEFT && x <= core.actions.CHOICES_RIGHT && y >= topIndex && y < topIndex + choices.length) {
			core.actions._clickAction(x, y);
			return true;
		}
		return false;
	}, 60);
},
    "图块彻底移除": function () {
	core.removeBlockThoroughly = core.maps.removeBlockThoroughly = function (x, y, floorId) {
		floorId = floorId || core.status.floorId;
		if (!floorId) return false;

		core.extractBlocks(floorId);
		for (var i in core.status.maps[floorId].blocks) {
			var block = core.status.maps[floorId].blocks[i];
			if (block.x == x && block.y == y) {
				core.status.maps[floorId].blocks.splice(i, 1);
				if (core.status.mapBlockObjs[floorId])
					delete core.status.mapBlockObjs[floorId][x + "," + y];
				if (core.floors[floorId].events && core.floors[floorId].events[x + "," + y]) {
					core.setFlag('R' + floorId + "," + x + "," + y, true);
				}
				core.setMapBlockDisabled(floorId, x, y, true);
				core.maps._updateMapArray(floorId, x, y);
				core.maps._removeBlockFromMap(floorId, block);
				return true;
			}
		}
		return false;
	}
	core.setBlockThoroughly = core.maps.setBlockThoroughly = function (number, x, y, floorId) {
		floorId = floorId || core.status.floorId;
		if (!floorId || number == null || x == null || y == null) return;
		if (x < 0 || x >= core.floors[floorId].width || y < 0 || y >= core.floors[floorId].height) return;
		if (typeof number == 'string') {
			if (/^\d+$/.test(number)) number = parseInt(number);
			else number = core.getNumberById(number);
		}

		core.setFlag('R' + floorId + "," + x + "," + y, true);

		var block = core.maps.initBlock(x, y, number, true, core.floors[floorId]);
		if (block.id == 0 && !block.event.trigger) {
			// 转变图块为0且该点无事件，视为删除
			core.maps.removeBlockThoroughly(x, y, floorId);
			return;
		}

		var originBlock = core.getBlock(x, y, floorId, true);
		var originEvent = originBlock == null ? null : originBlock.event;
		if (originBlock == null) {
			core.status.maps[floorId].blocks.push(block);
			if (core.status.mapBlockObjs[floorId])
				core.status.mapBlockObjs[floorId][block.x + "," + block.y] = block;
			core.setMapBlockDisabled(floorId, block.x, block.y, false);
			delete block.disable;
		} else {
			originBlock.id = number;
			originBlock.event = block.event;
			block = originBlock;
			core.setMapBlockDisabled(floorId, block.x, block.y, false);
			delete block.disable;
		}
		core.maps._updateMapArray(floorId, x, y);
		if (floorId == core.status.floorId) {
			// 有任何一个是autotile直接重绘地图
			if ((originEvent != null && originEvent.cls == 'autotile') || block.event.cls == 'autotile') {
				core.redrawMap();
			} else {
				if (originEvent != null) {
					core.maps._removeBlockFromMap(floorId, { x: x, y: y, event: originEvent });
				}
				core.drawBlock(block);
				core.addGlobalAnimate(block);
				core.updateStatusBar();
			}
		}
	}
	maps.prototype.initBlock = function (x, y, id, addInfo, eventFloor) {
		var disable = null;
		var opacity = null;
		var filter = null;
		if (eventFloor != null) {
			disable = this.isMapBlockDisabled(eventFloor.floorId, x, y);
			opacity = this._getBlockOpacityFromFlag(eventFloor.floorId, x, y);
			filter = this._getBlockFilterFromFlag(eventFloor.floorId, x, y);
		}
		var block = { 'x': x, 'y': y, 'id': id };
		if (disable != null) block.disable = disable;
		if (opacity != null) block.opacity = opacity;
		if (filter != null) block.filter = filter;

		if (id == 17) block.event = { "cls": "terrains", "id": "airwall", "cannotIn": ["up", "down", "left", "right"] };
		else if (id in this.blocksInfo) block.event = JSON.parse(JSON.stringify(this.blocksInfo[id]));
		else if (core.icons.getTilesetOffset(id)) block.event = { "cls": "tileset", "id": "X" + id };
		else block.event = { 'cls': 'terrains', 'id': 'none', 'noPass': false };

		if (block.event.noPass == null) {
			if (block.event.canPass == null) {
				block.event.noPass = block.event.cls != 'items';
			} else {
				block.event.noPass = !block.event.canPass;
			}
		}
		delete block.event.canPass;

		// 增加怪物的faceIds
		if (block.event.cls.indexOf("enemy") == 0) {
			var enemy = core.material.enemys[block.event.id];
			if (enemy && enemy.faceIds) {
				block.event.faceIds = enemy.faceIds;
			}
		}

		if (addInfo) this._addInfo(block);
		if (eventFloor) {
			if (core.getFlag('R' + eventFloor.floorId + "," + block.x + "," + block.y, false) !== true) {
				this._addEvent(block, x, y, (eventFloor.events || {})[x + "," + y]);
				var changeFloor = (eventFloor.changeFloor || {})[x + "," + y];
				if (changeFloor) this._addEvent(block, x, y, { "trigger": "changeFloor", "data": changeFloor });
			}
		}
		if (main.mode == 'editor') delete block.disable;
		return block;
	}
	events.prototype._action_hide = function (data, x, y, prefix) {
		data.loc = this.__action_getLoc2D(data.loc, x, y, prefix);
		if (data.time > 0 && data.floorId == core.status.floorId) {
			this.__action_doAsyncFunc(data.async, core.animateBlock, data.loc, data.destruct ? "destruct" : data.remove ? 'remove' : 'hide', data.time);
		} else {
			data.loc.forEach(function (t) {
				if (data.destruct) core.removeBlockThoroughly(t[0], t[1], data.floorId);
				else if (data.remove) core.removeBlock(t[0], t[1], data.floorId);
				else core.hideBlock(t[0], t[1], data.floorId);
			});
			core.doAction();
		}
	}

	/**
	 * 动作：设置图块（入口函数）
	 * @param {object} data 事件数据
	 * @param {number} x X坐标
	 * @param {number} y Y坐标
	 * @param {string} prefix 前缀
	 */
	events.prototype._action_setBlock = function (data, x, y, prefix) {
		data.loc = this.__action_getLoc2D(data.loc, x, y, prefix);
		data.time = data.time || 0;
		data.floorId = data.floorId || core.status.floorId;
		data.destruct = data.destruct || false; // 确保 destruct 有默认值

		// 如果有动画时间且在当前楼层，则执行动画
		if (data.time > 0 && data.floorId == core.status.floorId) {
			// 调用唯一的动画处理函数
			this.__action_doAsyncFunc(data.async, core.animateSetBlocks, data.number, data.loc, data.floorId, data.time, data.destruct, core.doAction);
		} else {
			// 否则直接设置
			data.loc.forEach(function (loc) {
				if (data.destruct) {
					core.setBlockThoroughly(data.number, loc[0], loc[1], data.floorId);
				} else {
					core.setBlock(data.number, loc[0], loc[1], data.floorId);
				}
			});
			core.doAction();
		}
	};

	/**
	 * [已合并] 批量播放设置图块的动画，并处理所有逻辑
	 * @param {number|string} number 图块ID或名称
	 * @param {Array} locs 坐标数组
	 * @param {string} floorId 楼层ID
	 * @param {number} time 动画时间
	 * @param {boolean} destruct 是否彻底清除
	 * @param {function} callback 动画全部完成后的回调
	 */
	core.animateSetBlocks = core.maps.animateSetBlocks = function (number, locs, floorId, time, destruct, callback) {
		// --- 1. 初始化和参数检查 ---
		if (!(locs instanceof Array)) {
			if (callback) callback();
			return;
		}
		if (typeof locs[0] == 'number' && typeof locs[1] == 'number') {
			locs = [locs];
		}

		var count = locs.length;
		if (count === 0) {
			if (callback) callback();
			return;
		}

		// 动画计数器，在所有动画结束后执行回调
		var _afterSet = function () {
			count--;
			if (count === 0 && callback) {
				callback();
			}
		};

		var setBlockFn = destruct ? core.setBlockThoroughly : core.setBlock;

		// --- 2. 遍历每个坐标并执行动画 ---
		locs.forEach(function (loc) {
			var x = loc[0],
				y = loc[1];

			var currentNumber = number;
			if (typeof currentNumber == 'string') {
				if (/^\d+$/.test(currentNumber)) currentNumber = parseInt(currentNumber);
				else currentNumber = core.getNumberById(currentNumber);
			}
			var originBlock = core.getBlock(x, y, floorId, true);
			var newBlock = core.maps.initBlock(x, y, currentNumber, true, core.floors[floorId]);

			// --- 3. 根据原始图块状态，应用不同动画策略 ---

			// 策略A：原始图块存在且启用
			if (originBlock != null && !originBlock.disable && originBlock.id !== 0) {
				if (newBlock.id == 0) { // 设置为0（清除图块）
					if (!newBlock.event.trigger) { // 无事件，直接移除
						core.animateBlock([x, y], 'remove', time, function () {
							setBlockFn(0, x, y, floorId);
							_afterSet();
						});
					} else { // 有事件，则隐藏图块但保留事件
						core.animateBlock([x, y], 'hide', time, function () {
							setBlockFn(0, x, y, floorId);
							core.showBlock(x, y, floorId);
							_afterSet();
						});
					}
				} else { // 设置为非0（替换图块）
					core.animateBlock([x, y], 'hide', time / 2, function () {
						setBlockFn(currentNumber, x, y, floorId);
						core.animateBlock([x, y], 'show', time / 2, _afterSet);
					});
				}
			}
			// 策略B：原始图块不存在
			else if (originBlock == null || originBlock.id === 0) {
				if (newBlock.id == 0) { // 设置为0，无操作
					setBlockFn(0, x, y, floorId);
					_afterSet();
				} else { // 设置为非0，淡入显示
					setBlockFn(currentNumber, x, y, floorId);
					core.hideBlock(x, y, floorId);
					core.animateBlock([x, y], 'show', time, _afterSet);
				}
			}
			// 策略C：原始图块被禁用（直接设置，无动画）
			else {
				setBlockFn(currentNumber, x, y, floorId);
				_afterSet();
			}
		});
	};
	maps.prototype.animateBlock = function (loc, type, time, callback) {
		if (core.status.replay.speed == 24) time = 1;
		if (typeof loc[0] == 'number' && typeof loc[1] == 'number')
			loc = [loc];
		if (type != 'show' && type != 'hide' && type != 'remove' && type != 'destruct' && typeof type != 'number') {
			if (callback) callback();
		}
		// --- 检测所有是0的点
		var list = this._animateBlock_getList(loc, type);
		if (list.length == 0) {
			if (callback) callback();
			return;
		}
		this._animateBlock_drawList(list, 0);
		time /= Math.max(core.status.replay.speed, 1)
		this._animateBlock_doAnimate(loc, list, type, time, callback);
	}
	maps.prototype._animateBlock_doAnimate = function (loc, list, type, time, callback) {
		var step = 0,
			steps = Math.max(parseInt(time / 10), 1);
		var cb = function () {
			list.forEach(function (t) {
				if (t.blockInfo)
					core.maps._deleteDetachedBlock(t.canvases);
			});
			loc.forEach(function (t) {
				if (type == 'show') core.showBlock(t[0], t[1]);
				else if (type == 'hide') core.hideBlock(t[0], t[1]);
				else if (type == 'remove') core.removeBlock(t[0], t[1]);
				else if (type == 'destruct') core.removeBlockThoroughly(t[0], t[1]);
				else {
					core.setBlockOpacity(type, t[0], t[1]);
					core.showBlock(t[0], t[1]);
				}
			});
			if (callback) callback();
		}

		var animate = setInterval(function () {
			step++;
			core.maps._animateBlock_drawList(list, step / steps);
			if (step == steps) {
				delete core.animateFrame.asyncId[animate];
				clearInterval(animate);
				cb();
			}
		}, 10);

		core.animateFrame.lastAsyncId = animate;
		core.animateFrame.asyncId[animate] = cb;
	}
	maps.prototype._animateBlock_getList = function (loc, type) {
		var list = [];
		loc.forEach(function (t) {
			var block = core.getBlock(t[0], t[1], null, true);
			if (block == null) return;

			var fromOpacity = block.opacity;
			if (fromOpacity == null) fromOpacity = 1.0;

			var blockInfo = core.maps.getBlockInfo(block);
			if (blockInfo == null) {
				list.push({ 'x': t[0], 'y': t[1] });
				return;
			}
			if (typeof type == 'number' && block.disable) return;
			// 该点是否已经被启用/删除
			if ((type == 'show' && !block.disable) || ((type == 'hide' || type == 'remove' || type == 'destruct') && block.disable)) {
				list.push({ 'x': t[0], 'y': t[1] });
				return;
			}

			var toOpacity = type;
			if (type == 'show') {
				toOpacity = fromOpacity;
				fromOpacity = 0.0;
			} else if (type == 'hide' || type == 'remove' || type == 'destruct') {
				core.hideBlock(t[0], t[1]); // 暂时先隐藏
				toOpacity = 0.0;
			} else {
				core.hideBlock(t[0], t[1]); // 暂时先隐藏
			}

			var canvases = core.maps._initDetachedBlock(blockInfo, t[0], t[1], block.event.displayDamage !== false);

			list.push({
				'x': t[0],
				'y': t[1],
				'blockInfo': blockInfo,
				'canvases': canvases,
				'fromOpacity': fromOpacity,
				'toOpacity': toOpacity,
			});

		});
		return list;
	}
},
    "额外功能": function () {
	core.registerSystemEvent("oldman", function (data, callback) {
		var a = parseInt(core.status.floorId.substring(2));
		var b = data.x;
		var c = data.y;
		core.insertAction([
			{ "type": "insert", "name": "对话", "args": [a, b, c, 0] },
		]);
		//console.log(data);
		if (callback) callback();
	});

	core.registerSystemEvent("trader", function (data, callback) {
		var name = core.status.floorId + '@' + data.x + '@' + data.y + '@' + 'A';
		var a = parseInt(core.status.floorId.substring(2));
		var b = data.x;
		var c = data.y;
		if (core.getFlag(name, 0) == 1) {
			core.insertAction([
				{ "type": "insert", "name": "对话", "args": [a, b, c, 1] },
			]);
		} else {
			core.insertAction([
				{ "type": "insert", "name": "商人", "args": [a, b, c] },
			]);
		}
		//console.log(data);
		if (callback) callback();
	});
	//限宽
	ui.prototype._drawBook_drawRow1 = function (index, enemy, top, left, width, position) {
		// 绘制第一行
		core.setTextAlign('ui', 'left');
		var b13 = this._buildFont(13, true),
			f13 = this._buildFont(13, false);
		var col1 = left,
			col2 = left + width * 9 / 25,
			col3 = left + width * 17 / 25;
		var mw = 34;
		core.fillText('ui', core.getStatusLabel('hp'), col1, position, '#DDDDDD', f13);
		core.fillText('ui', core.formatBigNumber(enemy.hp || 0), col1 + 30, position, null, b13, mw);
		core.fillText('ui', core.getStatusLabel('atk'), col2, position, null, f13);
		core.fillText('ui', core.formatBigNumber(enemy.atk || 0), col2 + 30, position, null, b13, mw);
		core.fillText('ui', core.getStatusLabel('def'), col3, position, null, f13);
		core.fillText('ui', core.formatBigNumber(enemy.def || 0), col3 + 30, position, null, b13, mw);
	}
	//限宽
	ui.prototype._drawBook_drawRow2 = function (index, enemy, top, left, width, position) {
		// 绘制第二行
		core.setTextAlign('ui', 'left');
		var b13 = this._buildFont(13, true),
			f13 = this._buildFont(13, false);
		var col1 = left,
			col2 = left + width * 9 / 25,
			col3 = left + width * 17 / 25;
		var mw = 34;
		// 获得第二行绘制的内容
		var second_line = [];
		if (core.flags.statusBarItems.indexOf('enableMoney') >= 0) second_line.push([core.getStatusLabel('money'), core.formatBigNumber(enemy.money || 0)]);
		if (core.flags.enableAddPoint) second_line.push([core.getStatusLabel('point'), core.formatBigNumber(enemy.point || 0)]);
		if (core.flags.statusBarItems.indexOf('enableExp') >= 0) second_line.push([core.getStatusLabel('exp'), core.formatBigNumber(enemy.exp || 0)]);

		var damage_offset = col1 + (this.PIXEL - col1) / 2 - 12;
		// 第一列
		if (second_line.length > 0) {
			var one = second_line.shift();
			core.fillText('ui', one[0], col1, position, '#DDDDDD', f13);
			core.fillText('ui', one[1], col1 + 30, position, null, b13, mw);
			damage_offset = col2 + (this.PIXEL - col2) / 2 - 12;
		}
		// 第二列
		if (second_line.length > 0) {
			var one = second_line.shift();
			core.fillText('ui', one[0], col2, position, '#DDDDDD', f13);
			core.fillText('ui', one[1], col2 + 30, position, null, b13, mw);
			damage_offset = col3 + (this.PIXEL - col3) / 2 - 12;
		}
		// 忽略第三列，直接绘制伤害
		this._drawBook_drawDamage(index, enemy, damage_offset, position);
	}
	//加防改为一防，限宽
	ui.prototype._drawBook_drawRow3 = function (index, enemy, top, left, width, position) {
		// 绘制第三行
		core.setTextAlign('ui', 'left');
		var b13 = this._buildFont(13, true),
			f13 = this._buildFont(13, false);
		var col1 = left,
			col2 = left + width * 9 / 25,
			col3 = left + width * 17 / 25;
		var mw = 34;
		core.fillText('ui', '临界', col1, position, '#DDDDDD', f13);
		core.fillText('ui', core.formatBigNumber(enemy.critical || 0), col1 + 30, position, null, b13, mw);
		core.fillText('ui', '减伤', col2, position, null, f13);
		core.fillText('ui', core.formatBigNumber(enemy.criticalDamage || 0), col2 + 30, position, null, b13, mw);
		core.fillText('ui', '1防', col3, position, null, f13);
		core.fillText('ui', core.formatBigNumber(enemy.defDamage || 0), col3 + 30, position, null, b13, mw);
	}
	enemys.prototype._getCurrentEnemys_addEnemy_defDamage = function (enemy, x, y, floorId) {
		return this.getDefDamage(enemy, 1, x, y, floorId);
	}
	//增强为可以在录像中打开
	events.prototype.openBook = function (fromUserAction) {
		if (core.isReplaying()) {
			if (!core.status.replay.pausing) {
				core.playSound('操作失败');
				return core.drawTip("请先暂停录像");
			}
			if (core.isMoving() || core.status.replay.animate || core.status.event.id) {
				core.playSound('操作失败');
				return core.drawTip("请等待当前事件的处理结束");
			}
		}
		// 如果能恢复事件（从callBook事件触发）
		if (core.status.event.id == 'book' && core.events.recoverEvents(core.status.event.interval))
			return;
		// 当前是book，且从“浏览地图”打开
		if (core.status.event.id == 'book' && core.status.event.ui) {
			core.status.boxAnimateObjs = [];
			core.ui._drawViewMaps(core.status.event.ui);
			return;
		}
		// 从“浏览地图”页面打开
		if (core.status.event.id == 'viewMaps') {
			fromUserAction = false;
			core.status.event.ui = core.status.event.data;
		}
		if (!this._checkStatus('book', fromUserAction, true)) return;
		core.playSound('打开界面');
		core.useItem('book', true);
	}
	//实现“离开后事件”
	control.prototype._moveAction_moving = function (callback) {
		let nowx = core.getHeroLoc('x'),
			nowy = core.getHeroLoc('y');
		core.setHeroMoveInterval(function () {
			core.setHeroLoc('x', core.nextX(), true);
			core.setHeroLoc('y', core.nextY(), true);

			var direction = core.getHeroLoc('direction');
			core.control._moveAction_popAutomaticRoute();
			core.status.route.push(direction);

			core.moveOneStep(nowx, nowy);
			core.checkRouteFolding();
			if (callback) callback();
		});
	}
	//实现“离开后事件”
	events.prototype._action_moveAction = function (data, x, y, prefix) {
		// 检查下一个点是否可通行
		if (core.canMoveHero()) {
			var nx = core.nextX(),
				ny = core.nextY();
			// 检查noPass决定是撞击还是移动
			if (core.noPass(nx, ny)) {
				core.insertAction([
					{ "type": "trigger", "loc": [nx, ny] }
				]);
			} else {
				// 先移动一格，然后尝试触发事件
				core.insertAction([
					{ "type": "moveHero", "steps": ["forward"] },
					{ "type": "function", "function": `function() { core.moveOneStep(${core.getHeroLoc('x')}, ${core.getHeroLoc('y')},core.doAction); }`, "async": true },
					{ "type": "_label" },
				]);
			}
		}
		core.doAction();
	}
	core.moveOneStep = function (fromX, fromY, callback) {
		return core.control.controldata.moveOneStep(fromX, fromY, callback);
	}
	// 隐藏层
	core.events._changeFloor_getInfo = events.prototype._changeFloor_getInfo = function (floorId, stair, heroLoc, time) {
		floorId = floorId || core.status.floorId;

		// --- 新增：跳过隐藏楼层的工具函数 ---
		function findValidFloor(startIndex, step) {
			let i = startIndex;
			while (i >= 0 && i < core.floorIds.length) {
				const id = core.floorIds[i];
				const map = core.status.maps[id];
				if (map && !map.isHide) return id; // canFlyTo 为真或未定义都视为可进入
				i += step; // 继续前/后寻找
			}
			return null;
		}

		// --- 重写 :before ---
		if (floorId == ':before') {
			const cur = core.floorIds.indexOf(core.status.floorId);
			const target = findValidFloor(cur - 1, -1);
			floorId = target || core.status.floorId;
		}

		// --- 重写 :next ---
		else if (floorId == ':next') {
			const cur = core.floorIds.indexOf(core.status.floorId);
			const target = findValidFloor(cur + 1, +1);
			floorId = target || core.status.floorId;
		} else if (floorId == ':now') {
			floorId = core.status.floorId;
		}

		if (!core.status.maps[floorId]) {
			main.log("不存在的楼层：" + floorId);
			return null;
		}

		if (main.mode != 'play' || core.isReplaying()) time = 0;
		if (time == null) time = core.values.floorChangeTime;
		time /= 20;

		return {
			floorId: floorId,
			time: 0,
			heroLoc: core.clone(this._changeFloor_getHeroLoc(floorId, stair, heroLoc))
		};
	};
	//怪物手册中自定义怪物合并
	function isSpecialEqual(a, b) {

		// 1. 统一「无 special」
		const isEmpty = function (v) {
			return v == null || v === 0 || (Array.isArray(v) && v.length === 0);
		};
		if (isEmpty(a) && isEmpty(b)) return true;

		// 2. 统一为数组
		const toArray = function (v) {
			if (Array.isArray(v)) return v;
			if (v == null || v === 0) return [];
			return [v];
		};

		let aa = toArray(a);
		let bb = toArray(b);

		if (aa.length !== bb.length) return false;

		// 3. 内容比较（无视顺序）
		aa = aa.slice().sort();
		bb = bb.slice().sort();

		for (var i = 0; i < aa.length; i++) {
			if (!Object.is(aa[i], bb[i])) return false;
		}

		return true;
	}
	//怪物手册中自定义怪物合并
	enemys.prototype._getCurrentEnemys_addEnemy = function (enemyId, enemys, used, x, y, floorId) {
		var enemy = this._getCurrentEnemys_getEnemy(enemyId);
		if (enemy == null) return;

		// ✅ 保存原始坐标
		var origX = x,
			origY = y;

		var id = enemy.id;

		var enemyInfo = this.getEnemyInfo(enemy, null, null, null, floorId);
		var locEnemyInfo = this.getEnemyInfo(enemy, null, x, y, floorId);

		var areEnemiesEqual = function (infoA, infoB) {
			// 基础属性比较
			var baseProps = ['atk', 'def', 'hp', 'money', 'exp', 'point'];
			for (var i = 0; i < baseProps.length; i++) {
				var prop = baseProps[i];
				if (!Object.is(infoA[prop], infoB[prop])) {
					return false;
				}
			}

			// 特殊处理 special 属性
			return isSpecialEqual(infoA.special, infoB.special);
		};

		var currentEnemyInfo;
		if (!core.flags.enableEnemyPoint || areEnemiesEqual(locEnemyInfo, enemyInfo)) {
			x = null;
			y = null;
			currentEnemyInfo = enemyInfo;
		} else {
			// 检查enemys中是否存在相同属性的怪物
			for (var i = 0; i < enemys.length; ++i) {
				var one = enemys[i];
				if (id == one.id && one.locs != null && areEnemiesEqual(locEnemyInfo, one)) {
					one.locs.push([x, y]);
					return;
				}
			}
			currentEnemyInfo = locEnemyInfo;
		}

		var id = enemy.id + ":" + x + ":" + y;
		if (used[id]) return;
		used[id] = true;

		var specialText = core.enemys.getSpecialText(currentEnemyInfo);
		var specialColor = core.enemys.getSpecialColor(currentEnemyInfo);

		var critical = this.nextCriticals(enemy, 1, x, y, floorId);
		if (critical.length > 0) critical = critical[0];

		var e = core.clone(enemy);
		for (var v in currentEnemyInfo) {
			e[v] = currentEnemyInfo[v];
		}
		if (x != null && y != null) {
			e.locs = [
				[x, y]
			];
		}
		e.name = core.getEnemyValue(enemy, 'name', x, y, floorId);
		e.specialText = specialText;
		e.specialColor = specialColor;
		e.damage = this.getDamage(enemy, x, y, floorId);
		e.critical = critical[0];
		e.criticalDamage = critical[1];
		e.defDamage = this._getCurrentEnemys_addEnemy_defDamage(enemy, x, y, floorId);

		// ✅ 使用原始坐标获取正确的filter
		e.filter = core.getBlockFilter(origX, origY, floorId);

		enemys.push(e);
	};

	//关闭预览模式
	core.registerAction('ondown', '_sys_ondown', function (x, y, px, py) {
		if (core.status.lockControl) return false;
		core.status.downTime = new Date();
		core.clearMap('route', 0, 0, 352, 352);
		var pos = { 'x': parseInt((px + core.bigmap.offsetX) / 32), 'y': parseInt((py + core.bigmap.offsetY) / 32) };
		core.status.stepPostfix = [];
		core.status.stepPostfix.push(pos);
		core.fillRect('ui', pos.x * 32 + 12 - core.bigmap.offsetX, pos.y * 32 + 12 - core.bigmap.offsetY, 8, 8, '#bfbfbf');

		clearTimeout(core.timeout.onDownTimeout);
		core.timeout.onDownTimeout = null;
		core.status.preview.prepareDragging = false;
		/*if (!core.hasFlag('__lockViewport__') && (core.status.thisMap.width > core.__SIZE__ || core.status.thisMap.height > core.__SIZE__)) {
		    core.status.preview.prepareDragging = true;
		    core.status.preview.px = px;
		    core.status.preview.py = py;
		    core.timeout.onDownTimeout = setTimeout(function () {
		        core.clearMap('ui');
		        core.status.preview.prepareDragging = false;
		        core.status.preview.enabled = true;
		        core.status.preview.dragging = true;
		        core.drawTip('已进入预览模式，可直接拖动大地图');
		        core.status.stepPostfix = [];
		    }, 500);
		} */
	}, 0);
	//隐藏空气墙，隐藏机关标识，隐藏特殊墙，隐藏阻击，暗墙
	maps.prototype.getBlockInfo = function (block) {
		if (!block) return null;
		if (typeof block == 'string') { // 参数是ID
			block = this.getNumberById(block);
		}
		if (typeof block == 'number') { // 参数是数字
			if (block == 0) return null;
			block = this.getBlockByNumber(block);
		}
		var number = block.id,
			id = block.event.id,
			cls = block.event.cls,
			name = block.event.name,
			image = null,
			posX = 0,
			posY = 0,
			animate = block.event.animate,
			doorInfo = block.event.doorInfo,
			height = block.event.height || 32,
			faceIds = {},
			face = 'down',
			bigImage = null;

		if (id == 'none') return null;
		if (main.mode !== 'editor' && (id === 'whiteWall2' || id === 'flower' || id === 'fire')) {
			return core.getBlockInfo('airwall');
		} else if (main.mode !== 'editor' && id === 'unbreakableWall') {
			return core.getBlockInfo('yellowWall');
		} else if (main.mode !== 'editor' && !core.getFlag('额外功能开关') && id.startsWith('fakeWall')) {
			return core.getBlockInfo('yellowWall');
		} else if (id == 'airwall') {
			if (!core.material.images.airwall) return null;
			image = core.material.images.airwall;
			name = "空气墙";
		} else if (cls == 'tileset') {
			var offset = core.icons.getTilesetOffset(id);
			if (offset == null) return null;
			posX = offset.x;
			posY = offset.y;
			image = core.material.images.tilesets[offset.image];
		} else if (cls == 'autotile') {
			image = core.material.images.autotile[id];
		} else {
			image = core.material.images[cls];
			posY = core.material.icons[cls][id];
			faceIds = block.event.faceIds || {};
			for (var f in faceIds) {
				if (faceIds[f] == id) {
					face = f;
					break;
				}
			}
			if (block.event.bigImage) bigImage = core.material.images.images[block.event.bigImage];
			if (core.material.enemys[id]) {
				name = core.material.enemys[id].name;
				bigImage = core.material.images.images[core.material.enemys[id].bigImage];
			} else if (core.material.items[id]) {
				name = core.material.items[id].name;
			}
			// 非门效果则强制变成四帧动画
			if (!doorInfo && bigImage != null) animate = 4;
		}

		return {
			number: number,
			id: id,
			cls: cls,
			name: name,
			image: image,
			posX: posX,
			doorInfo: doorInfo,
			posY: posY,
			height: height,
			faceIds: faceIds,
			animate: animate,
			face: face,
			bigImage: bigImage
		};
	}
	//增加跳过伤害判定流程
	events.prototype.afterBattle = function (enemyId, x, y, dr = true) {
		return core.events.eventdata.afterBattle(enemyId, x, y, dr);
	}
	core.events.afterBattle = function (enemyId, x, y, dr = true) {
		return core.events.eventdata.afterBattle(enemyId, x, y, dr);
	}
	core.afterBattle = function (enemyId, x, y, dr = true) {
		return core.events.eventdata.afterBattle(enemyId, x, y, dr);
	}

	//增加不计入录像功能
	actions.prototype._clickAction = function (x, y, px, py) {
		if (core.status.event.data.type == 'text') {
			return this._clickAction_text();
		}

		if (core.status.event.data.type == 'wait') {
			var timeout = Math.max(0, core.status.event.timeout - new Date().getTime()) || 0;
			core.setFlag('type', 1);
			core.setFlag('x', x);
			core.setFlag('y', y);
			core.setFlag('px', px);
			core.setFlag('py', py);
			core.setFlag('timeout', timeout);
			var executed = core.events.__action_wait_afterGet(core.status.event.data.current);
			if (executed || !core.status.event.data.current.forceChild) {
				core.status.route.push("input:" + (1e8 * timeout + 1000000 + 1000 * px + py));
				clearTimeout(core.status.event.interval);
				delete core.status.event.timeout;
				core.doAction();
			}
			return;
		}

		if (core.status.event.data.type == 'choices') {
			// 选项
			var data = core.status.event.data.current;
			var choices = data.choices;
			if (choices.length == 0) return;
			if (x >= this.CHOICES_LEFT && x <= this.CHOICES_RIGHT) {
				var topIndex = this._getChoicesTopIndex(choices.length);
				if (y >= topIndex && y < topIndex + choices.length) {
					var choice = choices[y - topIndex];
					if (choice.need != null && choice.need != '' && !core.calValue(choice.need)) {
						core.playSound('操作失败');
						core.drawTip("无法选择此项");
						return;
					}
					clearTimeout(core.status.event.interval);
					var timeout = Math.max(0, core.status.event.timeout - new Date().getTime()) || 0;
					delete core.status.event.timeout;
					core.setFlag('timeout', timeout);
					// 对全局商店特殊处理
					var index = y - topIndex;
					if (index == choices.length - 1 && core.hasFlag('@temp@shop')) {
						index = -1;
					}
					if (!data.norecord && !choice.norecord) core.status.route.push("choices:" + (100 * timeout + index));
					core.insertAction(choice.action);
					core.doAction();
				}
			}
			return;
		}

		if (core.status.event.data.type == 'confirm') {
			if ((x == this.HSIZE - 2 || x == this.HSIZE - 1) && y == this.HSIZE + 1) {
				clearTimeout(core.status.event.interval);
				var timeout = Math.max(0, core.status.event.timeout - new Date().getTime()) || 0;
				delete core.status.event.timeout;
				core.setFlag('timeout', timeout);
				core.status.route.push("choices:" + 100 * timeout);
				core.insertAction(core.status.event.ui.yes);
				core.doAction();
			} else if ((x == this.HSIZE + 2 || x == this.HSIZE + 1) && y == this.HSIZE + 1) {
				clearTimeout(core.status.event.interval);
				var timeout = Math.max(0, core.status.event.timeout - new Date().getTime()) || 0;
				delete core.status.event.timeout;
				core.setFlag('timeout', timeout);
				if (!data.norecord) core.status.route.push("choices:" + (100 * timeout + 1));
				core.insertAction(core.status.event.ui.no);
				core.doAction();
			}
			return;
		}
	}
	//增加不计入录像功能
	actions.prototype._keyUpAction = function (keycode) {
		if (core.status.event.data.type == 'text' && (keycode == 13 || keycode == 32 || keycode == 67)) {
			return this._clickAction_text();
		}
		if (core.status.event.data.type == 'wait') {
			var timeout = Math.max(0, core.status.event.timeout - new Date().getTime()) || 0;
			core.setFlag('type', 0);
			core.setFlag('keycode', keycode);
			core.setFlag('timeout', timeout);
			var executed = core.events.__action_wait_afterGet(core.status.event.data.current);
			if (executed || !core.status.event.data.current.forceChild) {
				core.status.route.push("input:" + (1e8 * timeout + keycode));
				clearTimeout(core.status.event.interval);
				delete core.status.event.timeout;
				core.doAction();
			}
			return;
		}
		if (core.status.event.data.type == 'choices') {
			var data = core.status.event.data.current;
			var choices = data.choices;
			if (choices.length > 0) {
				this._selectChoices(choices.length, keycode, this._clickAction);
			}
			return;
		}
		if (core.status.event.data.type == 'confirm' &&
			(keycode == 13 || keycode == 32 || keycode == 67 || keycode == 27)) {

			var timeout = Math.max(0, core.status.event.timeout - new Date().getTime()) || 0;
			delete core.status.event.timeout;
			core.setFlag('timeout', timeout);

			// Esc 选择 no
			if (keycode == 27) core.status.event.selection = 1;

			var data = core.status.event.data.current;
			if (!data.norecord)
				core.status.route.push("choices:" + (100 * timeout + core.status.event.selection));

			if (core.status.event.selection == 0)
				core.insertAction(core.status.event.ui.yes);
			else
				core.insertAction(core.status.event.ui.no);

			core.doAction();
			return;
		}

	}
	actions.prototype._selectChoices = function (length, keycode, callback) {
		var topIndex = this._getChoicesTopIndex(length);

		// Enter / Space / C：确认当前选择
		if (keycode == 13 || keycode == 32 || keycode == 67) {
			callback.apply(this, [this.HSIZE, topIndex + core.status.event.selection]);
		}

		// Esc：直接选择最后一项
		if (keycode == 27) {
			callback.apply(this, [this.HSIZE, topIndex + length - 1]);
		}

		// 数字键 1~9
		if (keycode >= 49 && keycode <= 57) {
			var index = keycode - 49;
			if (index < length) {
				callback.apply(this, [this.HSIZE, topIndex + index]);
			}
		}
	}

	//楼传页面加大
	ui.prototype.drawFly = function (page) {
		core.status.event.data = page;
		var floorId = core.floorIds[page];
		var title = core.status.maps[floorId].title;
		core.clearMap('ui');
		core.setAlpha('ui', 0.85);
		core.fillRect('ui', 0, 0, this.PIXEL, this.PIXEL, '#000000');
		core.setAlpha('ui', 1);
		core.setTextAlign('ui', 'center');
		core.fillText('ui', '楼层跳跃', this.HPIXEL, 60, '#FFFFFF', this._buildFont(28, true));
		core.fillText('ui', '返回游戏', this.HPIXEL, this.PIXEL - 13, null, this._buildFont(15, true))
		core.setTextAlign('ui', 'right');
		core.fillText('ui', '浏览地图时也', this.PIXEL - 10, this.PIXEL - 23, '#aaaaaa', this._buildFont(10, false));
		core.fillText('ui', '可楼层跳跃！', this.PIXEL - 10, this.PIXEL - 11, null, this._buildFont(10, false));
		core.setTextAlign('ui', 'center');

		var middle = this.HPIXEL + 39;

		// 换行
		var lines = core.splitLines('ui', title, 120, this._buildFont(19, true));
		var start_y = middle - (lines.length - 1) * 11;
		for (var i in lines) {
			core.fillText('ui', lines[i], this.PIXEL - 60, start_y, '#FFFFFF');
			start_y += 22;
		}

		// 绘制翻页按钮（像素坐标）
		var arrowX = this.PIXEL - 60; // 箭头中心X坐标

		if (core.actions._getNextFlyFloor(1) != page) {
			// 绘制向上箭头
			core.fillText('ui', '▲', arrowX, middle - 48, null, this._buildFont(20, false));
			core.fillText('ui', '▲', arrowX, middle - 96);
			core.fillText('ui', '▲', arrowX, middle - 96 - 7);
		}
		if (core.actions._getNextFlyFloor(-1) != page) {
			// 绘制向下箭头
			core.fillText('ui', '▼', arrowX, middle + 48, null, this._buildFont(20, false));
			core.fillText('ui', '▼', arrowX, middle + 96);
			core.fillText('ui', '▼', arrowX, middle + 96 + 7);
		}
		var size = this.PIXEL - 143;
		core.strokeRect('ui', 20, 100, size, size, '#FFFFFF', 2);
		core.drawThumbnail(floorId, null, { ctx: 'ui', x: 20, y: 100, size: size, damage: true });
	}

	actions.prototype._clickFly = function (x, y, px, py) {
		// 使用像素坐标而不是格子坐标
		var arrowX = core.ui.PIXEL - 60; // 箭头中心X坐标
		var middle = core.ui.HPIXEL + 39; // 中间Y坐标

		// 计算各个区域的像素坐标范围
		var upAreaLeft = arrowX - 50; // 向上翻页区域左边界
		var upAreaRight = arrowX + 50; // 向上翻页区域右边界
		var upAreaTop = middle - 130; // 向上翻页区域顶部
		var upAreaBottom = middle - 20; // 向上翻页区域底部

		var downAreaLeft = arrowX - 50; // 向下翻页区域左边界
		var downAreaRight = arrowX + 50; // 向下翻页区域右边界
		var downAreaTop = middle + 20; // 向下翻页区域顶部
		var downAreaBottom = middle + 130; // 向下翻页区域底部

		// 返回按钮区域（"返回游戏"文本）
		var backBtnLeft = core.ui.HPIXEL - 50; // 返回按钮左边界
		var backBtnRight = core.ui.HPIXEL + 50; // 返回按钮右边界
		var backBtnTop = core.ui.PIXEL - 30; // 返回按钮顶部
		var backBtnBottom = core.ui.PIXEL; // 返回按钮底部

		// 楼层跳跃确认区域（缩略图）
		var size = core.ui.PIXEL - 143;
		var confirmLeft = 20; // 确认区域左边界
		var confirmRight = 20 + size; // 确认区域右边界
		var confirmTop = 100; // 确认区域顶部
		var confirmBottom = 100 + size; // 确认区域底部

		// 检查点击位置是否在向上翻页区域内
		if (px >= upAreaLeft && px <= upAreaRight && py >= upAreaTop && py <= upAreaBottom) {
			// 判断是翻1页还是10页（根据Y坐标在区域内的位置）
			if (py <= middle - 90) {
				// 上半部分：翻10页
				core.playSound('光标移动');
				core.ui.drawFly(this._getNextFlyFloor(10));
			} else {
				// 下半部分：翻1页
				core.playSound('光标移动');
				core.ui.drawFly(this._getNextFlyFloor(1));
			}
		}
		// 检查点击位置是否在向下翻页区域内
		else if (px >= downAreaLeft && px <= downAreaRight && py >= downAreaTop && py <= downAreaBottom) {
			// 判断是翻1页还是10页（根据Y坐标在区域内的位置）
			if (py <= middle + 70) {
				// 上半部分：翻1页
				core.playSound('光标移动');
				core.ui.drawFly(this._getNextFlyFloor(-1));
			} else {
				// 下半部分：翻10页
				core.playSound('光标移动');
				core.ui.drawFly(this._getNextFlyFloor(-10));
			}
		}
		// 检查点击位置是否在返回按钮区域内
		else if (px >= backBtnLeft && px <= backBtnRight && py >= backBtnTop && py <= backBtnBottom) {
			core.playSound('取消');
			core.ui.closePanel();
		}
		// 检查点击位置是否在楼层跳跃确认区域内
		else if (px >= confirmLeft && px <= confirmRight && py >= confirmTop && py <= confirmBottom) {
			core.flyTo(core.floorIds[core.status.event.data]);
		}
		return;
	}
	actions.prototype._keyUpFly = function (keycode) {
		if (keycode == 71 || keycode == 27 || keycode == 88) {
			core.playSound('取消');
			core.ui.closePanel();
		}
		if (keycode == 13 || keycode == 32 || keycode == 67)
			core.flyTo(core.floorIds[core.status.event.data]);
		return;
	}
	core.registerAction('longClick', '_sys_longClick_lockControl', function (x, y, px, py) {
		if (!core.status.lockControl) return false;
		if (core.status.event.id == 'text') {
			core.drawText();
			return true;
		}
		if (core.status.event.id == 'action' && core.status.event.data.type == 'text') {
			core.doAction();
			return true;
		}
		// 长按楼传器的箭头可以快速翻页 - 使用像素坐标
		if (core.status.event.id == 'fly') {
			// 计算翻页按钮的像素坐标区域
			var arrowX = core.ui.PIXEL - 60;
			var middle = core.ui.HPIXEL + 39;

			// 计算各个区域的像素坐标范围
			var upAreaLeft = arrowX - 50; // 向上翻页区域左边界
			var upAreaRight = arrowX + 50; // 向上翻页区域右边界
			var upAreaTop = middle - 130; // 向上翻页区域顶部
			var upAreaBottom = middle - 20; // 向上翻页区域底部

			var downAreaLeft = arrowX - 50; // 向下翻页区域左边界
			var downAreaRight = arrowX + 50; // 向下翻页区域右边界
			var downAreaTop = middle + 20; // 向下翻页区域顶部
			var downAreaBottom = middle + 130; // 向下翻页区域底部

			// 检查是否点击在翻页区域
			if ((px >= upAreaLeft && px <= upAreaRight && py >= upAreaTop && py <= upAreaBottom) ||
				(px >= downAreaLeft && px <= downAreaRight && py >= downAreaTop && py <= downAreaBottom)) {
				core.actions._clickFly(x, y, px, py);
				return true;
			}
		}
		// 长按SL上下页快速翻页 - 这里需要根据您的SL界面具体绘制位置来修改
		if (["save", "load", "replayLoad", "replayRemain", "replaySince"].indexOf(core.status.event.id) >= 0) {
			// 需要根据SL界面的实际像素坐标来修改
			// 暂时保留原逻辑，但建议您根据SL界面的实际绘制位置来设置像素坐标区域
			if ([this.HSIZE - 2, this.HSIZE - 3, this.HSIZE + 2, this.HSIZE + 3].indexOf(x) >= 0 && y == this.LAST) {
				this._clickSL(x, y, px, py);
				return true;
			}
		}
		// 长按可以跳过等待事件
		if (core.status.event.id == 'action' && core.status.event.data.type == 'sleep' &&
			!core.status.event.data.current.noSkip) {
			if (core.timeout.sleepTimeout && !core.hasAsync()) {
				clearTimeout(core.timeout.sleepTimeout);
				core.timeout.sleepTimeout = null;
				core.doAction();
				return true;
			}
		}
		return false;
	}, 50);

	// 新增：移动前快照
	function _snapshotBeforeMove() {
		const loc = core.status.hero.loc;
		core.status.__moveSnapshot__ = {
			x: loc.x,
			y: loc.y,
			direction: loc.direction,
			routeLength: core.status.route.length
		};
	};
	//快照存档
	this.autosaveFromSnapshot = function () {
		const s = core.status.__moveSnapshot__;
		if (!s) return;

		var removeLast = core.status.route.length > s.routeLength;

		const data = {
			heroLoc: { x: s.x, y: s.y, direction: s.direction }
		};

		if (core.hasFlag('__forbidSave__')) return;
		var x = null;
		if (removeLast) {
			x = core.status.route.pop();
			//core.status.route.push("turn:" + core.getHeroLoc('direction'));
		}
		if (core.status.event.id == 'action') // 事件中的自动存档
			core.setFlag("__events__", core.clone(core.status.event.data));
		if (core.saves.autosave.data == null) {
			core.saves.autosave.data = [];
		}
		core.saves.autosave.data.splice(core.saves.autosave.now, 0, core.saveData(data));
		core.saves.autosave.now += 1;
		if (core.saves.autosave.data.length > core.saves.autosave.max) {
			if (core.saves.autosave.now < core.saves.autosave.max / 2)
				core.saves.autosave.data.pop();
			else {
				core.saves.autosave.data.shift();
				core.saves.autosave.now = core.saves.autosave.now - 1;
			}
		}
		core.saves.autosave.updated = true;
		core.saves.ids[0] = true;
		core.removeFlag("__events__");
		if (removeLast) {
			//core.status.route.pop();
			if (x) core.status.route.push(x);
		}

		//delete core.status.__moveSnapshot__;
	};
	core.saveData = function (data) {
		return core.control.saveData(data);
	}
	control.prototype.saveData = function (data) {
		return core.control.controldata.saveData(data);
	}
	control.prototype.moveHero = function (direction, callback) {
		// 如果正在移动，直接return
		if (core.status.heroMoving != 0) return;
		// 逻辑简化：不再在这里分流，而是统一交给 _moveHero_moving 处理
		// 这样可以确保无论是否带 callback，移动的前置处理（如快照、状态位重置）都是一致的
		core._moveHero_moving(direction, callback);
	}
	control.prototype._moveAction_popAutomaticRoute = function () {
		var automaticRoute = core.status.automaticRoute;
		// 检查自动寻路是否被弹出
		if (automaticRoute.autoHeroMove) {
			automaticRoute.movedStep++;
			automaticRoute.lastDirection = core.getHeroLoc('direction');
			if (automaticRoute.destStep == automaticRoute.movedStep) {
				if (automaticRoute.autoStep == automaticRoute.autoStepRoutes.length) {
					core.clearContinueAutomaticRoute();
					core.stopAutomaticRoute();
				} else {
					automaticRoute.movedStep = 0;
					automaticRoute.destStep = automaticRoute.autoStepRoutes[automaticRoute.autoStep].step;
					_snapshotBeforeMove();
					core.setHeroLoc('direction', automaticRoute.autoStepRoutes[automaticRoute.autoStep].direction);
					core.status.automaticRoute.autoStep++;
				}
			}
		}
	}
	core._moveHero_moving = core.control._moveHero_moving = function (direction, callback) {
		core.status.heroStop = false;
		core.status.automaticRoute.moveDirectly = false;

		// 【关键修改 1】快照必须在改变方向之前！
		// 这样 Undo 才能回到移动前原本的朝向，而不是移动前但已经转身的状态
		_snapshotBeforeMove();

		// 改变勇士朝向
		if (core.isset(direction))
			core.setHeroLoc('direction', direction);

		var move = () => {
			if (core.status.heroStop) {
				// 如果有回调且意外停止（通常由事件触发停止），视逻辑决定是否执行回调
				// 这里通常不需要处理 callback，因为 callback 一般绑定在 moveAction 完成后
				return;
			}

			// —— Debug+Ctrl：穿墙单步 —— 
			if (core.hasFlag('debug') && core.status.ctrlDown && core.status.heroMoving === 0) {
				var nx = core.nextX(),
					ny = core.nextY();
				if (nx < 1 || nx >= core.bigmap.width - 1 ||
					ny < 1 || ny >= core.bigmap.height - 1) {
					return;
				}
				core.events.eventMoveHero(
					[core.getHeroLoc('direction') + ':1'],
					core.values.moveSpeed,
					move
				);
			}
			// —— 自动寻路逻辑 —— 
			else if (core.status.automaticRoute.autoStepRoutes.length > 0) {
				// 【关键修改 2】这里移除了原有的 _snapshotBeforeMove()
				// 因为第一步已经在函数最顶层快照过了。

				core.moveAction(); // 执行这一步移动

				setTimeout(() => {
					// 检查是否还有下一步
					if (core.status.automaticRoute.autoStepRoutes.length > 0) {
						// 【关键修改 3】只有在确实要走 Step 2, 3... 时，才在递归前快照
						_snapshotBeforeMove();
					}
					move(); // 递归调用
				}, 50);
			}
			// —— 手动按键控制 / 单步带回调 —— 
			else {
				// 将 callback 透传给 moveAction
				// 这样原本 moveHero 中的 if(callback) return this.moveAction... 逻辑就完美融合进来了
				core.moveAction(callback);

				// 手动移动只走一步，立刻标记停止
				core.status.heroStop = true;
			}
		};

		move();
	};
	control.prototype.setHeroMoveInterval = function (callback) {
		if (core.status.heroMoving > 0) return;
		if (core.status.replay.speed == 24) {
			core.status.heroStop = true;
			if (callback) callback();
			return;
		}

		core.status.heroMoving = 1;

		var toAdd = 1;
		if (core.status.replay.speed > 3) toAdd = 2;
		if (core.status.replay.speed > 6) toAdd = 4;
		if (core.status.replay.speed > 12) toAdd = 8;

		core.interval.heroMoveInterval = window.setInterval(function () {
			core.status.heroMoving += toAdd;
			if (core.status.heroMoving >= 8) {
				clearInterval(core.interval.heroMoveInterval);
				core.status.heroMoving = 0;
				if (callback) callback();
			}
		}, core.values.moveSpeed / 8 * toAdd / core.status.replay.speed);
	}
	// 在此增加新插件
	this.showAltarSummary = function () {
		const maxRatio = 5;

		let totalHpTimes = 0;
		let totalAtkTimes = 0;
		let totalDefTimes = 0;
		let totalHp = 0;
		let totalAtk = 0;
		let totalDef = 0;
		let totalYellowKeyTimes = core.getFlag("黄钥匙出售次数", 0);
		let totalPurchaseTimes = core.getFlag("times1", 0);

		let lines = [];

		for (let r = 1; r <= 5; r++) {
			const hpTimes = core.getFlag(`${r}区购买hp次数`, 0);
			const atkTimes = core.getFlag(`${r}区购买atk次数`, 0);
			const defTimes = core.getFlag(`${r}区购买def次数`, 0);
			const hp = core.getFlag(`${r}区购买hp`, 0);
			const atk = core.getFlag(`${r}区购买atk`, 0);
			const def = core.getFlag(`${r}区购买def`, 0);

			const hasAnyPurchase = hpTimes > 0 || atkTimes > 0 || defTimes > 0;

			if (!hasAnyPurchase) continue;

			totalHpTimes += hpTimes;
			totalAtkTimes += atkTimes;
			totalDefTimes += defTimes;
			totalHp += hp;
			totalAtk += atk;
			totalDef += def;

			let detail = [];
			if (hpTimes > 0) detail.push(`生命 +${hp} (${hpTimes}次)`);
			if (atkTimes > 0) detail.push(`攻击 +${atk} (${atkTimes}次)`);
			if (defTimes > 0) detail.push(`防御 +${def} (${defTimes}次)`);

			lines.push(
				`【第${r}区】\n` +
				`${detail.join('，')}`
			);
		}

		// 如果有黄钥匙出售，也添加一行显示
		if (totalYellowKeyTimes > 0 || totalPurchaseTimes > 0) {
			lines.push(
				`【全局】\n` +
				`黄钥匙出售 ${totalYellowKeyTimes}次\n` +
				`祭坛总购买次数 ${totalPurchaseTimes}次`
			);
		}

		if (lines.length === 0) {
			core.insertAction([{
				"type": "text",
				"text": "你尚未进行过任何购买或出售。"
			}]);
			return;
		}

		const resultText =
			"\t[交易统计]" +
			lines.join("\n");
		// 注释掉的总结部分，如果需要可以取消注释
		/*
		+ "\n\n——————\n" +
		`总购买次数：${totalHpTimes + totalAtkTimes + totalDefTimes}\n` +
		`生命购买：${totalHpTimes}次，+${totalHp}\n` +
		`攻击购买：${totalAtkTimes}次，+${totalAtk}\n` +
		`防御购买：${totalDefTimes}次，+${totalDef}\n` +
		`黄钥匙出售：${totalYellowKeyTimes}次`;
		*/

		core.insertAction([{
			"type": "text",
			"text": resultText
		}]);
	}
	events.prototype.useFly = function (fromUserAction) {
		if (core.isReplaying()) return;
		// 从“浏览地图”页面：尝试直接传送到该层
		if (core.status.event.id == 'viewMaps') {
			if (!core.hasItem('fly')) {
				core.playSound('操作失败');
				core.drawTip('你没有' + core.material.items['fly'].name, 'fly');
			} else if (!core.canUseItem('fly')) {
				core.playSound('操作失败');
				core.drawTip('无法传送到当前层', 'fly');
			} else {
				core.flyTo(core.status.event.data.floorId);
			}
			return;
		}

		if (!this._checkStatus('fly', fromUserAction, true)) return;
		if (!core.canUseItem('fly')) {
			core.playSound('操作失败');
			core.unlockControl();
			core.status.event.data = null;
			core.status.event.id = null;
			return;
		}
		core.playSound('打开界面');
		core.useItem('fly', true);
		return;
	}
	ui.prototype._drawSLPanel_draw = function (page, max_page) {
		// --- 绘制背景
		this._drawSLPanel_drawBackground();
		// --- 绘制文字
		core.ui.drawPagination(page + 1, max_page);
		core.setTextAlign('ui', 'center');
		var bottom = this.PIXEL - 13;
		core.fillText('ui', '返回游戏', this.PIXEL - 28, bottom, '#DDDDDD', this._buildFont(12, true));

		if (core.status.event.selection)
			core.setFillStyle('ui', '#FF6A6A');
		if (core.status.event.id == 'save')
			core.fillText('ui', '删除模式', 28, bottom, null, this._buildFont(12, true));
		else {
			if (core.status.event.data.mode == 'all') {
				core.fillText('ui', '[E]显示收藏', 34, bottom, '#DDDDDD', this._buildFont(12, true));
			} else {
				core.fillText('ui', '[E]显示全部', 34, bottom, '#DDDDDD', this._buildFont(12, true));
			}
		}
		// --- 绘制记录
		this._drawSLPanel_drawRecords();
	}
	ui.prototype.drawBook = function (index) {
		var floorId = core.floorIds[(core.status.event.ui || {}).index] || core.status.floorId;
		// 清除浏览地图时的光环缓存
		if (floorId != core.status.floorId && core.status.checkBlock) {
			core.status.checkBlock.cache = {};
		}
		var enemys = core.enemys.getCurrentEnemys(floorId);
		core.clearUI();
		core.clearMap('data');
		// 生成groundPattern
		core.maps.generateGroundPattern(floorId);
		this._drawBook_drawBackground();
		core.setAlpha('ui', 1);

		if (enemys.length == 0) {
			return this._drawBook_drawEmpty();
		}

		index = core.clamp(index, 0, enemys.length - 1);
		core.status.event.data = index;
		var pageinfo = this._drawBook_pageinfo();
		var perpage = pageinfo.per_page,
			page = parseInt(index / perpage) + 1,
			totalPage = Math.ceil(enemys.length / perpage);

		var start = (page - 1) * perpage;
		enemys = enemys.slice(start, page * perpage);

		for (var i = 0; i < enemys.length; i++)
			this._drawBook_drawOne(floorId, i, enemys[i], pageinfo, index == start + i);

		core.drawBoxAnimate();
		this.drawPagination(page, totalPage);
		core.setTextAlign('ui', 'center');
		core.fillText('ui', '返回游戏', this.PIXEL - 28, this.PIXEL - 13, '#DDDDDD', this._buildFont(13, true));
	}
	////// 绘制分页 //////
	ui.prototype.drawPagination = function (page, totalPage, y) {
		// if (totalPage<page) totalPage=page;
		if (totalPage <= 1) return;
		if (y == null) y = this.LAST;

		core.setFillStyle('ui', '#DDDDDD');
		var length = core.calWidth('ui', page, this._buildFont(12, true));

		core.setTextAlign('ui', 'left');
		core.fillText('ui', page, parseInt((this.PIXEL - length) / 2), y * 32 + 19, '#DDDDDD', this._buildFont(12, true));


		core.setTextAlign('ui', 'center');
		if (page > 1)
			core.fillText('ui', '上一页', this.HPIXEL - 60, y * 32 + 19, '#DDDDDD', this._buildFont(12, true));
		if (page < totalPage)
			core.fillText('ui', '下一页', this.HPIXEL + 60, y * 32 + 19, '#DDDDDD', this._buildFont(12, true));
	}
	// 注册录像行为
	core.control.registerReplayAction("help", function (action) {
		if (!action || action.indexOf("help") !== 0) return false;
		core.insertAction([{ type: "insert", name: "游戏说明" }]);
		return true;
	});
	// 异步事件不再刷新状态栏
	events.prototype.__action_doAsyncFunc = function (isAsync, func) {
		var parameters = Array.prototype.slice.call(arguments, 2);
		if (isAsync) {
			core.status._suppressUpdateStatusBar = true;
			func.apply(this, parameters);
			core.doAction();
		} else {
			func.apply(this, parameters.concat(core.doAction));
		}
	}
	// 异步事件不再刷新状态栏
	const origin = core.control.updateStatusBar;
	core.updateStatusBar = core.control.updateStatusBar = function () {
		if (core.getFlag('__statistics__')) return;
		if (core.status._suppressUpdateStatusBar) {
			core.updateCheckBlock();
			core.updateDamage();
		} else return origin.apply(core.control, arguments);
	}
	// 异步事件不再刷新状态栏
	events.prototype._action_waitAsync = function (data, x, y, prefix) {
		var test = window.setInterval(function () {
			if (!core.hasAsync() &&
				(data.excludeAnimates || core.isReplaying() || core.getPlayingAnimates().length == 0) &&
				(!data.includeSounds || core.isReplaying() || core.getPlayingSounds().length == 0)) {
				clearInterval(test);
				core.status._suppressUpdateStatusBar = false;
				core.updateStatusBar();
				core.doAction();
			}
		}, 50 / core.status.replay.speed);
	}
	core.registerEvent('generateMove', function (data, x, y, prefix) {
		var loc = this.__action_getLoc(data.loc, x, y, prefix);
		this.__action_doAsyncFunc(data.async, core.maps.generateAndMoveBlock,
			loc[0], loc[1], data.id, data.steps, data.time, data.keep, data.fadeInTime, data.zIndex);
	})
	maps.prototype.generateAndMoveBlock = function (x, y, id, steps, time, keep, fadeInTime, zIndex, callback) {
		// 1. 基础参数处理（参考 moveBlock）
		if (core.status.replay.speed == 24) {
			time = 1;
			if (typeof fadeInTime !== 'undefined' && fadeInTime) fadeInTime = 1;
		}
		time = time || 500;

		// 2. 获取图块的基础信息
		var blockInfo = core.getBlockInfo(id);
		if (blockInfo == null) {
			if (callback) callback();
			return;
		}

		// 3. 处理移动步数（完全复用 moveBlock 的逻辑）
		var moveSteps = (steps || []).map(function (t) {
			return [t.split(':')[0], parseInt(t.split(':')[1] || "1")];
		}).filter(function (t) {
			return ['up', 'down', 'left', 'right', 'forward', 'backward', 'leftup', 'leftdown', 'rightup', 'rightdown', 'speed'].indexOf(t[0]) >= 0 &&
				!(t[0] == 'speed' && t[1] < 16)
		});

		// 4. 生成独立画布
		// 第四个参数传 false，表示这是纯动画，不显示怪物显伤
		var canvases = core.maps._initDetachedBlock(blockInfo, x, y, false);

		// 5. 【新功能】自定义 Z 值
		// 遍历生成的画布（头、身、显伤），修改其层级
		if (zIndex != null) {
			for (var key in canvases) {
				var canvasName = canvases[key];
				if (canvasName && core.dymCanvas[canvasName]) {
					// core.dymCanvas[name].canvas 是原生 DOM 节点
					var canvas = core.dymCanvas[canvasName].canvas;
					var ctx = canvas.getContext('2d');

					// 设置画布样式防止模糊
					canvas.style.imageRendering = 'pixelated'; // CSS 设置
					canvas.style.imageRendering = 'crisp-edges'; // 备用
					canvas.style.msInterpolationMode = 'nearest-neighbor'; // IE

					// 设置画布上下文属性防止模糊
					ctx.imageSmoothingEnabled = false;
					ctx.mozImageSmoothingEnabled = false;
					ctx.webkitImageSmoothingEnabled = false;
					ctx.msImageSmoothingEnabled = false;

					// 设置 z-index
					canvas.style.zIndex = zIndex;
				}
			}
		}

		// 6. 初始绘制
		// 在起点 (32*x, 32*y) 绘制图块，透明度设为 1 （但如果启用淡入，会从 0 开始绘制）
		// 为兼容淡入，我们先不强制设为 1，而是由 moveInfo.opacity 决定
		// this._moveDetachedBlock(blockInfo, 32 * x, 32 * y, 1, canvases);

		// 7. 构造移动信息
		// 这里的关键是构造一个和 moveBlock 一模一样的对象
		var moveInfo = {
			sx: x,
			sy: y,
			x: x,
			y: y, // 逻辑坐标
			px: 32 * x,
			py: 32 * y, // 像素坐标
			opacity: 1, // 初始透明度 (会在下面根据 fadeInTime 覆盖为 0)
			keep: keep, // true=停留，false=移动后淡出消失
			lastDirection: null,
			offset: 1,
			moveSteps: moveSteps,
			step: 0,
			per_time: time / 16 / core.status.replay.speed
		};

		// 如果要淡入，初始化为 0（完全透明），否则为 1（默认）
		if (typeof fadeInTime !== 'undefined' && fadeInTime > 0) {
			moveInfo.opacity = 0;
		} else {
			moveInfo.opacity = 1;
		}

		// 先用当前 opacity 画一次初始帧（避免空白）
		core.maps._moveDetachedBlock(blockInfo, moveInfo.px, moveInfo.py, moveInfo.opacity, canvases);


		// 8. 如果需要淡入，先做淡入动画；淡入完成后进入原有移动逻辑
		if (typeof fadeInTime !== 'undefined' && fadeInTime > 0) {
			// 参考 animateBlock 的速度处理
			fadeInTime = fadeInTime / Math.max(core.status.replay.speed, 1);

			var step = 0,
				steps = Math.max(parseInt(fadeInTime / 10), 1);

			var animate = setInterval(function () {
				step++;
				moveInfo.opacity = Math.min(1, step / steps);
				// 重绘当前位置（淡入阶段位置固定为起点）
				core.maps._moveDetachedBlock(blockInfo, moveInfo.px, moveInfo.py, moveInfo.opacity, canvases);

				if (step >= steps) {
					// 清理 interval 注册并开始移动
					delete core.animateFrame.asyncId[animate];
					clearInterval(animate);

					// 确保最终为完全不透明
					moveInfo.opacity = 1;
					core.maps._moveDetachedBlock(blockInfo, moveInfo.px, moveInfo.py, moveInfo.opacity, canvases);

					// 启动原有移动逻辑
					core.maps._moveBlock_doMove(blockInfo, canvases, moveInfo, callback);
				}
			}, 10);

			core.animateFrame.lastAsyncId = animate;
			// 注册一个空的回调占位（与其它动画保持一致的结构）
			core.animateFrame.asyncId[animate] = function () {
				// 如果需要，可以在这里做外部取消逻辑（此处保持空）
			};
		} else {
			// 直接调用现有的核心移动逻辑
			core.maps._moveBlock_doMove(blockInfo, canvases, moveInfo, callback);
		}
	}

},
    "HD": function () {
	maps.prototype._setHDCanvasSize = function (ctx, width, height) {
		if (main.replayChecking) return;
		ctx.setTransform(1, 0, 0, 1, 0, 0);
		var ratio = core.domStyle.ratio;
		//ratio *= devicePixelRatio;
		if (width != null) ctx.canvas.width = width * ratio;
		if (height != null) ctx.canvas.height = height * ratio;
		ctx.scale(ratio, ratio);
		ctx.canvas.setAttribute('isHD', 1);
	}
	ui.prototype.drawTextContent = function (ctx, content, config) {
		if (main.replayChecking) return;
		ctx = core.getContextByName(ctx);
		// 设置默认配置项
		var textAttribute = core.status.textAttribute || core.initStatus.textAttribute;
		var globalAttribute = core.status.globalAttribute || core.initStatus.globalAttribute;
		config = core.clone(config || {});
		config.left = config.left || 0;
		config.right = config.left + (config.maxWidth == null ? core._PX_ : config.maxWidth);
		config.top = config.top || 0;
		config.color = core.arrayToRGBA(config.color || textAttribute.text);
		if (config.bold == null) config.bold = textAttribute.bold;
		config.italic = config.italic || false;
		config.align = config.align || textAttribute.align || "left";
		config.fontSize = config.fontSize || textAttribute.textfont;
		config.lineHeight = config.lineHeight || (config.fontSize * 1.3);
		config.defaultFont = config.font = config.font || globalAttribute.font;
		config.time = config.time || 0;
		config.letterSpacing = config.letterSpacing == null ? (textAttribute.letterSpacing || 0) : config.letterSpacing;

		config.index = 0;
		config.currcolor = config.color;
		config.currfont = config.fontSize;
		config.lineMargin = Math.max(Math.round(config.fontSize / 4), config.lineHeight - config.fontSize);
		config.topMargin = parseInt(config.lineMargin / 2);
		config.lineMaxHeight = config.lineMargin + config.fontSize;
		config.offsetX = 0;
		config.offsetY = 0;
		config.line = 0;
		config.blocks = [];
		config.isHD = ctx == null || ctx.canvas.hasAttribute('isHD');

		// 创建一个新的临时画布
		var tempCtx = document.createElement('canvas').getContext('2d');
		if (config.isHD && ctx) {
			core.maps._setHDCanvasSize(
				tempCtx,
				ctx.canvas.width,
				ctx.canvas.height
			);
		} else {
			tempCtx.canvas.width = ctx == null ? 1 : ctx.canvas.width;
			tempCtx.canvas.height = ctx == null ? 1 : ctx.canvas.height;
		}
		tempCtx.textBaseline = 'top';
		tempCtx.font = this._buildFont(config.fontSize, config.bold, config.italic, config.font);
		tempCtx.fillStyle = config.color;
		config = this._drawTextContent_draw(ctx, tempCtx, content, config);
		return config;
	}
	// —— 初始化 tempCanvas，只需一次 —— 
	core.bigmap.tempCanvas = (function () {
		if (main.replayChecking) return;
		const canvas = document.createElement('canvas');
		const ctx = canvas.getContext('2d');
		return ctx;
	})();

	// —— 重写 drawThumbnail 绘制到临时小画布 —— 
	core.maps._drawThumbnail_drawTempCanvas = function (floorId, blocks, options) {
		if (main.replayChecking) return;
		let width = core.floors[floorId].width,
			height = core.floors[floorId].height;
		const tempCanvas = core.bigmap.tempCanvas;
		const dpr = core.domStyle.ratio;

		if (main.mode == 'editor') {

			// 如果是大地图模式？
			if (options.all) {
				// 计算比例
				var scale = Math.max(core.__SIZE__ / width, core.__SIZE__ / height);
				tempCanvas.canvas.width = width * 32 * scale;
				tempCanvas.canvas.height = height * 32 * scale;
				tempCanvas.scale(scale, scale);
			} else if (width * height > core.bigmap.threshold) {
				options.v2 = true;
				tempCanvas.canvas.width = core.__PIXELS__;
				tempCanvas.canvas.height = core.__PIXELS__;
				var centerX = options.centerX,
					centerY = options.centerY;
				if (centerX == null) centerX = Math.floor(width / 2);
				if (centerY == null) centerY = Math.floor(height / 2);
				var offsetX = core.clamp(centerX - core.__HALF_SIZE__, 0, width - core.__SIZE__),
					offsetY = core.clamp(centerY - core.__HALF_SIZE__, 0, height - core.__SIZE__);
				tempCanvas.translate(-32 * offsetX, -32 * offsetY);
			} else {
				options.v2 = false;
				tempCanvas.canvas.width = width * 32;
				tempCanvas.canvas.height = height * 32;
			}
			options.ctx = tempCanvas;

			// 地图过大的缩略图不绘制显伤
			if (width * height > core.bigmap.threshold)
				options.damage = false;

			// --- 暂存 flags
			var hasHero = core.status.hero != null,
				flags = null;
			if (options.flags) {
				if (!hasHero) core.status.hero = {};
				flags = core.status.hero.flags;
				core.status.hero.flags = options.flags;
			}

			this._drawThumbnail_realDrawTempCanvas(floorId, blocks, options);

			// --- 恢复 flags
			if (!hasHero) delete core.status.hero;
			else if (flags != null) core.status.hero.flags = flags;
			tempCanvas.setTransform(1, 0, 0, 1, 0, 0);
			return;
		}

		width = 11;
		height = 11;

		// 设置临时画布的物理尺寸
		tempCanvas.canvas.width = width * 32 * dpr;
		tempCanvas.canvas.height = height * 32 * dpr;
		tempCanvas.canvas.style.width = width * 32 + "px";
		tempCanvas.canvas.style.height = height * 32 + "px";

		// 设置高清缩放比例
		tempCanvas.setTransform(dpr, 0, 0, dpr, 0, 0);
		//tempCanvas.imageSmoothingEnabled = false;

		options.v2 = false;
		options.ctx = tempCanvas;

		// 绘制时平移坐标到(1,1)格位置
		tempCanvas.save();
		tempCanvas.translate(-32, -32); // 注意这里已经是缩放后的坐标

		var hasHero = core.status.hero != null,
			flags = null;
		if (options.flags) {
			if (!hasHero) core.status.hero = {};
			flags = core.status.hero.flags;
			core.status.hero.flags = options.flags;
		}

		core.maps._drawThumbnail_realDrawTempCanvas(floorId, blocks, options);

		if (!hasHero) delete core.status.hero;
		else if (flags != null) core.status.hero.flags = flags;

		tempCanvas.restore();
	}

	// —— 重写 drawThumbnail 绘制到目标 ctx —— 
	core.maps._drawThumbnail_drawToTarget = function (floorId, options) {
		if (main.replayChecking) return;
		const ctx = core.getContextByName(options.ctx);
		if (!ctx) return;

		const tempCanvas = core.bigmap.tempCanvas;
		if (main.mode == 'editor') {

			if (ctx == null) return;
			var x = options.x || 0,
				y = options.y || 0,
				size = options.size || core.__PIXELS__;
			var width = core.floors[floorId].width,
				height = core.floors[floorId].height;
			var centerX = options.centerX,
				centerY = options.centerY;
			if (centerX == null) centerX = Math.floor(width / 2);
			if (centerY == null) centerY = Math.floor(height / 2);


			if (options.all) {
				var tempWidth = tempCanvas.canvas.width,
					tempHeight = tempCanvas.canvas.height;
				// 绘制全景图
				if (tempWidth <= tempHeight) {
					var realHeight = size,
						realWidth = realHeight * tempWidth / tempHeight;
					var side = (size - realWidth) / 2;
					core.fillRect(ctx, x, y, side, realHeight, '#000000');
					core.fillRect(ctx, x + size - side, y, side, realHeight);
					core.drawImage(ctx, tempCanvas.canvas, 0, 0, tempWidth, tempHeight, x + side, y, realWidth, realHeight);
				} else {
					var realWidth = size,
						realHeight = realWidth * tempHeight / tempWidth;
					var side = (size - realHeight) / 2;
					core.fillRect(ctx, x, y, realWidth, side, '#000000');
					core.fillRect(ctx, x, y + size - side, realWidth, side);
					core.drawImage(ctx, tempCanvas.canvas, 0, 0, tempWidth, tempHeight, x, y + side, realWidth, realHeight);
				}
			} else {
				// 只绘制可见窗口
				if (options.v2) {
					core.drawImage(ctx, tempCanvas.canvas, 0, 0, core.__PIXELS__, core.__PIXELS__, x, y, size, size);
				} else {
					var offsetX = core.clamp(centerX - core.__HALF_SIZE__, 0, width - core.__SIZE__),
						offsetY = core.clamp(centerY - core.__HALF_SIZE__, 0, height - core.__SIZE__);
					core.drawImage(ctx, tempCanvas.canvas, offsetX * 32, offsetY * 32, core.__PIXELS__, core.__PIXELS__, x, y, size, size);
				}

			}
			return;
		}


		const dpr = core.domStyle.ratio;

		const srcW = tempCanvas.canvas.width;
		const srcH = tempCanvas.canvas.height;

		const dstX = options.x || 0;
		const dstY = options.y || 0;
		const dstW = options.width || options.size || core.__PIXELS__;
		const dstH = options.height || options.size || core.__PIXELS__;

		ctx.imageSmoothingEnabled = false;

		ctx.drawImage(
			tempCanvas.canvas,
			0, 0, srcW, srcH, // 源画布
			dstX, dstY, dstW, dstH // 目标画布
		);
	};


	ui.prototype._drawTextContent_draw = function (ctx, tempCtx, content, config) {
		if (main.replayChecking) return;
		// Step 1: 绘制到tempCtx上，并记录下图块信息
		while (this._drawTextContent_next(tempCtx, content, config));

		if (ctx == null) return config;

		// Step 2: 从tempCtx绘制到画布上
		config.index = 0;
		var _drawNext = function () {
			if (config.index >= config.blocks.length) return false;
			var block = config.blocks[config.index++];
			if (block != null) {
				const scale = config.isHD ? core.domStyle.ratio : 1;
				core.drawImage(
					ctx,
					tempCtx.canvas,
					block.left * scale,
					block.top * scale,
					block.width * scale,
					block.height * scale,
					config.left + block.left + block.marginLeft,
					config.top + block.top + block.marginTop,
					block.width,
					block.height
				);
			}
			return true;
		}
		if (config.time == 0) {
			while (_drawNext());
		} else {
			clearInterval(core.status.event.interval);
			core.status.event.interval = setInterval(function () {
				if (!_drawNext()) {
					clearInterval(core.status.event.interval);
					core.status.event.interval = null;
				}
			}, config.time);
		}

		return config;
	}


	ui.prototype.drawScrollText = function (content, time, lineHeight, callback) {
		content = core.replaceText(content || "");
		lineHeight = lineHeight || 1.4;
		time = time || 5000;
		this.clearUI();
		var offset = core.status.textAttribute.offset || 15;
		lineHeight *= core.status.textAttribute.textfont;
		var ctx = this._createTextCanvas(content, lineHeight);
		var obj = { align: core.status.textAttribute.align, lineHeight: lineHeight };
		if (obj.align == 'right') obj.left = this.PIXEL - offset;
		else if (obj.align != 'center') obj.left = offset;
		this.drawTextContent(ctx, content, obj);
		this._drawScrollText_animate(ctx, time, callback);
	}

	ui.prototype._createTextCanvas = function (content, lineHeight) {
		var width = this.PIXEL,
			height = 30 + this.getTextContentHeight(content, { lineHeight: lineHeight });

		// 使用 core.createCanvas 创建画布
		var ctx = core.createCanvas('TextCanvas', 0, 0, width, height, 0);
		return ctx;
	}
	// 假设 'ui.prototype' 已经定义
	ui.prototype._drawScrollText_animate = function (ctx, time, callback) {
		// ctx.canvas 是 TextCanvas，它已经被高清缩放
		var physicalHeight = ctx.canvas.height;
		var physicalWidth = ctx.canvas.width;

		// 1. 获取用于缩放的 ratio
		// 假设 core.domStyle.ratio 和 devicePixelRatio 是全局可访问的，
		// 并且它们是 _setHDCanvasSize 中使用的相同的值。
		var ratio = (core.domStyle.ratio || 1) * (devicePixelRatio || 1);

		// 2. 计算 TextCanvas 的“逻辑”尺寸
		// 这是它在屏幕上应该占据的尺寸
		var logicalHeight = physicalHeight / ratio;
		var logicalWidth = physicalWidth / ratio;

		// 3. 获取目标画布 (ui) 的上下文
		// 你的 core.drawImage('ui', ...) 内部可能就是这么做的
		var ui_ctx = core.getContextByName('ui');
		if (!ui_ctx) {
			console.error("无法获取 'ui' 画布的上下文！");
			if (callback) callback();
			return;
		}

		time /= Math.max(core.status.replay.speed, 1);
		var per_pixel = 1; // 每次滚动 1 "逻辑"像素

		// 4. 使用“逻辑”高度来计算总时间
		var per_time = time * per_pixel / (this.PIXEL + logicalHeight);
		var currH = this.PIXEL; // 初始“逻辑”Y坐标

		// 5. 初始绘制
		// 使用 5 参数的 drawImage
		core.clearMap('ui'); // 先清除
		ui_ctx.drawImage(ctx.canvas, 0, currH, logicalWidth, logicalHeight);

		var animate = setInterval(function () {
			core.clearMap('ui');
			currH -= per_pixel;

			// 6. 使用“逻辑”高度进行结束比较
			if (currH < -logicalHeight) {
				delete core.animateFrame.asyncId[animate];
				clearInterval(animate);
				if (callback) callback();
				return;
			}

			// 7. 在循环中同样使用 5 参数的 drawImage
			// (ctx.canvas是源图像, 0, currH是目标逻辑坐标, logicalWidth, logicalHeight是目标逻辑尺寸)
			ui_ctx.drawImage(ctx.canvas, 0, currH, logicalWidth, logicalHeight);

		}, per_time);

		core.animateFrame.lastAsyncId = animate;
		core.animateFrame.asyncId[animate] = callback;
	}
	ui.prototype.drawImage = function (name, image, x, y, w, h, x1, y1, w1, h1, angle, reverse) {
		if (main.replayChecking) return;
		// 检测文件名以 :x, :y, :o 结尾，表示左右翻转，上下翻转和中心翻转
		var ctx = this.getContextByName(name);

		ctx.imageSmoothingEnabled = false;
		ctx.mozImageSmoothingEnabled = false;
		ctx.webkitImageSmoothingEnabled = false;
		ctx.msImageSmoothingEnabled = false;

		if (!ctx) return;
		// var reverse = null;
		if (typeof image == 'string') {
			if (image.endsWith(':x') || image.endsWith(':y') || image.endsWith(':o')) {
				reverse = image.charAt(image.length - 1);
				image = image.substring(0, image.length - 2);
			}
			image = core.getMappedName(image);
			image = core.material.images.images[image];
			if (!image) return;
		}

		var scale = {
			'x': [-1, 1],
			'y': [1, -1],
			'o': [-1, -1]
		};

		// 只能接受2, 4, 8个参数
		if (x != null && y != null) {
			if (w == null || h == null) {
				// 两个参数变成四个参数
				w = image.width;
				h = image.height;
			}
			if (x1 != null && y1 != null && w1 != null && h1 != null) {
				if (!reverse && !angle) {
					ctx.drawImage(image, x, y, w, h, x1, y1, w1, h1);
				} else {
					ctx.save();
					ctx.translate(x1 + w1 / 2, y1 + h1 / 2);
					if (reverse) ctx.scale(scale[reverse][0], scale[reverse][1]);
					if (angle) ctx.rotate(angle);
					ctx.drawImage(image, x, y, w, h, -w1 / 2, -h1 / 2, w1, h1);
					ctx.restore();
				}
				return;
			}
			if (!reverse && !angle) {
				ctx.drawImage(image, x, y, w, h);
			} else {
				ctx.save();
				ctx.translate(x + w / 2, y + h / 2);
				if (reverse) ctx.scale(scale[reverse][0], scale[reverse][1]);
				if (angle) ctx.rotate(angle);
				ctx.drawImage(image, -w / 2, -h / 2, w, h);
				ctx.restore();
			}
			return;
		}
	}
},
    "键盘优化": function () {

	actions.prototype._clickSwitchs_action_moveSpeed = function (delta) {
		core.values.moveSpeed = core.clamp(core.values.moveSpeed + delta, 1, 200);
		core.setLocalStorage("moveSpeed", core.values.moveSpeed);
		core.ui._drawSwitchs_action();
	}

	events.prototype.eventMoveHero = function (steps, time, callback) {
		time = time || core.values.moveSpeed;
		// 1. 解析所有指令为 {dir, count} 结构
		var moveSteps = (steps || []).map(function (t) {
			var parts = t.split(':');
			return {
				dir: parts[0],
				count: Math.max(1, parseInt(parts[1], 10) || 1)
			};
		}).filter(function (ms) {
			// 只保留合法指令
			return ['up', 'down', 'left', 'right', 'forward', 'backward',
					'leftup', 'leftdown', 'rightup', 'rightdown', 'speed'
				]
				.includes(ms.dir) &&
				!(ms.dir === 'speed' && ms.count < 16);
		});

		if (moveSteps.length === 0) {
			if (callback) callback();
			return;
		}

		core.status.heroMoving = -1;
		var subStep = 0;
		var interval = window.setInterval(function () {
				// 先看是不是 speed 指令，如果是且刚开始该指令，就调整整体速度
				if (moveSteps[0].dir === 'speed' && subStep === 0) {
					time = moveSteps[0].count;
					moveSteps.shift();
					// 如果 speed 是最后一条，直接结束
					if (moveSteps.length === 0) {
						clearInterval(interval);
						delete core.animateFrame.asyncId[interval];
						if (callback) callback();
						return;
					}
				}

				// 执行一次微步动画
				if (core.events._eventMoveHero_moving(++subStep, [
						[moveSteps[0].dir, moveSteps[0].count]
					])) {
					// 这一格走完
					subStep = 0;
					core.status.heroMoving = 0;
					core.drawHero();

					// 普通方向指令：减少 count，走完就出队
					if (moveSteps[0].dir !== 'speed') {
						moveSteps[0].count--;
						if (moveSteps[0].count <= 0) {
							moveSteps.shift();
						}
					}

					// 队列空了，就结束
					if (moveSteps.length === 0) {
						clearInterval(interval);
						delete core.animateFrame.asyncId[interval];
						if (callback) callback();
					}
				}
			}, core.status.replay.speed === 24 ?
			1 :
			time / 8 / core.status.replay.speed);

		core.animateFrame.lastAsyncId = interval;
		core.animateFrame.asyncId[interval] = function () {};
	};


	core.control._moveHero_moving = function () {
		core.status.heroStop = false;
		core.status.automaticRoute.moveDirectly = false;

		var move = () => {
			if (core.status.heroStop) return;

			// —— Debug+Ctrl：穿墙单步 —— 
			if (core.hasFlag('debug') && core.status.ctrlDown && core.status.heroMoving === 0) {
				var nx = core.nextX(),
					ny = core.nextY();
				if (nx < 1 || nx >= core.bigmap.width - 1 ||
					ny < 1 || ny >= core.bigmap.height - 1) {
					return;
				}
				core.events.eventMoveHero(
					[core.getHeroLoc('direction') + ':1'],
					core.values.moveSpeed,
					move
				);
			}
			// —— 自动寻路：改回原始模式 —— 
			else if (core.status.automaticRoute.autoStepRoutes.length > 0) {
				// 直接走一步，然后 50ms 后继续下一步
				core.moveAction();
				setTimeout(move, 50);
			}
			// —— 手动按键控制：只走一步，结束 —— 
			else {
				core.moveAction();
				core.status.heroStop = true;
			}
		};

		move();
	};

	// 改成新的方向键处理逻辑
	actions.prototype._sys_onkeyDown = function (e) {
		core.status.holdingKeys = core.status.holdingKeys || [];
		var isArrow = { 37: true, 38: true, 39: true, 40: true } [e.keyCode];

		if (isArrow && !core.status.lockControl) {
			if (e.preventDefault) e.preventDefault();

			// 新增：记录是否为新按键
			var isNewKey = !core.status.holdingKeys.includes(e.keyCode);
			if (isNewKey) {
				core.status.holdingKeys.push(e.keyCode);
			}

			// 新增：新按下方向键时立即触发一次移动
			if (isNewKey) {
				this.keyDown(e.keyCode);
			}

			if (!core.status._pressTimer) {
				core.status._pressTimer = setInterval(() => {
					if (!core.status.holdingKeys.length) {
						clearInterval(core.status._pressTimer);
						core.status._pressTimer = null;
						return;
					}
					var keyCode = core.status.holdingKeys.slice(-1)[0];
					this.keyDown(keyCode); // 处理后续长按
				}, 50);
			}
		} else {
			if (e.keyCode === 17) core.status.ctrlDown = true;
			this.keyDown(e.keyCode, e.altKey);
		}
	};

	actions.prototype._sys_onkeyUp = function (e) {
		var isArrow = { 37: true, 38: true, 39: true, 40: true } [e.keyCode];
		if (isArrow && !core.status.lockControl) {
			var idx = core.status.holdingKeys.indexOf(e.keyCode);
			if (idx >= 0) core.status.holdingKeys.splice(idx, 1);

			if (e.preventDefault) e.preventDefault();

			this.keyUp(e.keyCode, e.altKey);
		} else {
			if (e.keyCode === 17) core.status.ctrlDown = false;
			this.keyUp(e.keyCode, e.altKey);
		}
	};

	// 删除了 _sys_fastPressLoop，不再需要！

	// 注册（注意：这里不再注册 _sys_fastPressLoop 了）
	core.actions.registerAction('onkeyDown', '_sys_onkeyDown', core.actions._sys_onkeyDown, 0);
	core.actions.registerAction('pressKey', '_sys_pressKey', core.actions._sys_pressKey, 0);
	core.actions.registerAction('onkeyUp', '_sys_onkeyUp', core.actions._sys_onkeyUp, 0);

},
    "物品显示信息": function () {
	/* 宝石血瓶左下角显示数值
	 * 需要将 变量：itemDetail改为true才可正常运行
	 * 请尽量减少勇士的属性数量，否则可能会出现严重卡顿（划掉，现在你放一万个属性也不会卡）
	 * 注意：这里的属性必须是core.status.hero里面的，flag无法显示
	 * 如果不想显示，可以core.setFlag("itemDetail", false);
	 * 然后再core.getItemDetail();
	 * 如有bug在大群或造塔群@古祠
	 */

	const ignore = ['superPotion'];

	// 取消注释下面这句可以减少超大地图的判定。
	// 如果地图宝石过多，可能会略有卡顿，可以尝试取消注释下面这句话来解决。
	// core.bigmap.threshold = 256;
	const origin = core.control.updateStatusBar;
	core.updateStatusBar = core.control.updateStatusBar = function () {
		if (core.getFlag('__statistics__')) return;
		else return origin.apply(core.control, arguments);
	}

	core.getItemEffect = core.items.getItemEffect = items.prototype.getItemEffect = function (itemId, itemNum, floorId) {
		floorId = core.status.floorId || floorId;
		var itemCls = core.material.items[itemId].cls;
		// 消耗品
		if (itemCls === 'items') {
			var curr_hp = core.status.hero.hp;
			var itemEffect = core.material.items[itemId].itemEffect;
			if (itemEffect) {
				try {
					for (var i = 0; i < itemNum; ++i)
						eval(itemEffect);
				} catch (e) {
					main.log(e);
				}
			}
			if (!core.getFlag('__statistics__', false))
				core.status.hero.statistics.hp += core.status.hero.hp - curr_hp;

			var useItemEvent = core.material.items[itemId].useItemEvent;
			if (useItemEvent) {
				try {
					core.insertAction(useItemEvent);
				} catch (e) {
					main.log(e);
				}
			}
			core.updateStatusBar();
		} else {
			core.addItem(itemId, itemNum);
		}
	}

	var _original_updateDamage = core.control.updateDamage;
	core.control.updateDamage = function (floorId, ctx) {
		floorId = floorId || core.status.floorId;
		if (!floorId || core.status.gameOver || main.mode != 'play') return;
		const onMap = ctx == null;

		// 没有怪物手册则不显示（保持原逻辑一致性，可根据需求修改）
		if (!core.hasItem('book')) return;

		// 大地图优化判断
		core.status.damage.posX = core.bigmap.posX;
		core.status.damage.posY = core.bigmap.posY;
		if (!onMap) {
			const width = core.floors[floorId].width,
				height = core.floors[floorId].height;
			if (width * height > core.bigmap.threshold) return;
		}

		// 调用原生显伤逻辑
		this._updateDamage_damage(floorId, onMap);
		this._updateDamage_extraDamage(floorId, onMap);

		// 调用原生道具显伤
		core.getItemDetail(floorId);

		// 【新增】调用怪物详细信息显伤
		if (core.getFlag('显示详细信息', true))
			core.getEnemyDetail(floorId);

		// 最终绘制
		this.drawDamage(ctx);
	};

	this.getEnemyDetail = function (floorId) {
		floorId = floorId != null ? floorId : (core.status.thisMap && core.status.thisMap.floorId);
		if (!core.status.thisMap || !core.status.maps[floorId]) return;

		const blocks = core.status.maps[floorId].blocks;
		const ignore = []; // 如果有需要忽略的事件ID，可加在此处

		blocks.forEach(function (block) {
			var x = block.x,
				y = block.y,
				event = block.event,
				disable = block.disable;

			// 筛选：必须是怪物，且未被禁用
			if (!event || event.cls !== 'enemys' || ignore.includes(event.id) || disable) return;

			// v2地图优化：跳过不可见区域
			if (core.bigmap.v2 &&
				(x < core.bigmap.posX - core.bigmap.extend ||
					x > core.bigmap.posX + core._WIDTH_ + core.bigmap.extend ||
					y < core.bigmap.posY - core.bigmap.extend ||
					y > core.bigmap.posY + core._HEIGHT_ + core.bigmap.extend)) {
				return;
			}

			var enemyId = event.id;
			var enemy = core.material.enemys[enemyId];
			if (!enemy) return;

			// --- 计算数值 ---

			// 1. 计算一防减伤 (defDamage)
			// 依赖 core.enemys.getDefDamage，如果样板版本过低可能需要手动计算: 
			// 手动计算逻辑：(damage_current) - (hero_atk - enemy_def < 0 ? 0 : hero_atk - enemy_def)
			var defDamage = 0;
			if (core.enemys.getDefDamage) {
				defDamage = core.enemys.getDefDamage(enemy, 1, x, y, floorId);
			} else {
				// 简单的fallback，防止报错
				defDamage = 0;
			}

			// 2. 计算临界减伤 (criticalDamage)
			// nextCriticals 返回结构通常为 [[threshold, damage_reduction], ...]
			var criticalDamage = 0;
			var criticals = core.enemys.nextCriticals(enemy, 1, x, y, floorId);
			if (criticals && criticals.length > 0) {
				// 取第一个临界的减伤值
				criticalDamage = criticals[0][1];
			}

			// 如果两个值都为0或无效，可以选择不绘制，这里默认绘制
			if (defDamage === undefined) defDamage = 0;
			if (criticalDamage === undefined) criticalDamage = 0;

			// --- 绘制 ---
			drawEnemyDetail(defDamage, criticalDamage, x, y);
		});
	};

	// -----------------------------------------------------------------------
	// 3. 绘制辅助函数
	// -----------------------------------------------------------------------
	function drawEnemyDetail(defDamage, criticalDamage, x, y) {
		// 坐标计算：
		// 32 * x 是格子左侧。
		// 为了显示在右上角，我们将 px 设为格子右侧附近 (例如 x + 20px)
		// 字体较小 (10px左右)，所以两行字不会遮挡太多

		const px = 32 * x + 20; // 横坐标：偏右
		const py = 32 * y + 10; // 纵坐标：偏上 (第一行)

		// 1. 绘制一防减伤 (defDamage)
		// 使用青色 (#00E6F1) 代表防御相关
		core.status.damage.data.push({
			text: core.formatBigNumber(defDamage, true),
			px: px,
			py: py,
			color: '#00E6F1'
		});

		// 2. 绘制临界减伤 (criticalDamage)
		// 使用黄色 (#F9FF00) 或 橙色 代表临界/暴击相关
		// y 坐标向下偏移 10 像素
		core.status.damage.data.push({
			text: core.formatBigNumber(criticalDamage, true),
			px: px,
			py: py + 10,
			color: '#F9FF00'
		});
	}

	// 获取宝石信息 并绘制
	this.getItemDetail = function (floorId) {
		floorId = floorId != null ? floorId : (core.status.thisMap && core.status.thisMap.floorId);
		if (!core.status.thisMap || !core.status.maps[floorId]) return;

		const beforeRatio = core.status.thisMap.ratio;
		core.status.thisMap.ratio = core.status.maps[floorId].ratio;

		const originalHero = core.clone(core.status.hero);
		const blocks = core.status.maps[floorId].blocks;

		blocks.forEach(function (block) {
			var x = block.x,
				y = block.y,
				event = block.event,
				disable = block.disable;
			if (!event || event.cls !== 'items' || ignore.includes(event.id) || disable) return;

			// v2地图优化跳过不可见区域
			if (core.bigmap.v2 &&
				(x < core.bigmap.posX - core.bigmap.extend ||
					x > core.bigmap.posX + core._WIDTH_ + core.bigmap.extend ||
					y < core.bigmap.posY - core.bigmap.extend ||
					y > core.bigmap.posY + core._HEIGHT_ + core.bigmap.extend)) {
				return;
			}

			var itemId = event.id;
			var item = core.material.items[itemId];
			if (!item) return;

			// --- 处理装备类 ---
			if (item.cls === 'equips') {
				var equipValue = (item.equip && item.equip.value) || {};
				var percentage = (item.equip && item.equip.percentage) || {};
				var equipDiff = {};

				for (var key in equipValue) {
					equipDiff[key] = equipValue[key];
				}
				for (var key in percentage) {
					equipDiff[key + 'per'] = percentage[key] + '%';
				}

				drawItemDetail(equipDiff, x, y);
				return;
			}

			// --- 处理普通道具 ---
			var heroClone = core.clone(originalHero);
			var diff = {};

			var handler = {
				set: function (target, key, val) {
					var oldVal = target[key] || 0;
					var delta = val - oldVal;
					if (delta !== 0) {
						if (diff[key] == null) diff[key] = 0;
						diff[key] += delta;
					}
					target[key] = val;
					return true;
				}
			};

			var proxyHero = new Proxy(heroClone, handler);
			core.status.hero = proxyHero;

			try {
				core.setFlag('__statistics__', true);
				core.getItemEffect(item.id, 1, floorId);
			} catch (e) {
				console.warn("物品效果执行失败：" + itemId, e);
			}

			drawItemDetail(diff, x, y);
		});

		core.status.hero = originalHero;
		core.status.thisMap.ratio = beforeRatio;
		window.hero = originalHero;
		window.flags = originalHero.flags;
	};

	// 绘制
	function drawItemDetail(diff, x, y) {
		const px = 32 * x + 2,
			py = 32 * y + 30;
		let content = '';
		// 获得数据和颜色
		let i = 0;
		for (const name in diff) {
			if (!diff[name]) continue;
			let color = '#fff';

			if (typeof diff[name] === 'number')
				content = core.formatBigNumber(diff[name], true);
			else content = diff[name];
			switch (name) {
			case 'atk':
			case 'atkper':
				color = '#FF7A7A';
				break;
			case 'def':
			case 'defper':
				color = '#00E6F1';
				break;
			case 'mdef':
			case 'mdefper':
				color = '#6EFF83';
				break;
			case 'hp':
				color = '#A4FF00';
				break;
			case 'hpmax':
			case 'hpmaxper':
				color = '#F9FF00';
				break;
			case 'mana':
				color = '#c66';
				break;
			}
			// 绘制
			core.status.damage.data.push({
				text: content,
				px: px,
				py: py - 10 * i,
				color: color
			});
			i++;
		}
	}


},
    "animate": function () {
	// -------------------- 插件说明 -------------------- //

	// github仓库：https://github.com/unanmed/animate
	// npm包名：mutate-animate
	// npm地址：https://www.npmjs.com/package/mutate-animate

	// 不要去尝试读这个插件，这个插件是经过了打包的，不是人类可读的(
	// 想读的话可以去github读

	// 该插件是一个轻量型多功能动画插件，可以允许你使用内置或自定义的速率曲线或轨迹等
	// 除此之外，你还可以自定义绘制函数，来让你的动画可视化

	// -------------------- 安装说明 -------------------- //

	// 直接复制到插件中即可，注意所有插件中不能出现插件名为animate的插件
	// 该插件分为动画和渐变两部分，教程分开，动画在前，渐变在后

	// -------------------- 动画使用教程 -------------------- //

	// 1. 首先创建一个异步函数
	//   async function ani() { }

	// 2. 引入插件中的类和函数，引入内容要看个人需求，所有可用的函数在本插件末尾可以看到
	//   const { Animation, linear, bezier, circle, hyper, trigo, power, inverseTrigo, shake, sleep } = core.plugin.animate

	// 3. 在函数内部创建一个动画
	//   const animate = new Animation();

	// 4. 为动画创建一个绘制函数，这里以绘制一个矩形为例，当然也可以使用core.fillRect替代ctx.fillRect来绘制矩形
	//   const ctx = core.createCanvas('animate', 0, 0, 416, 416, 100);
	//   ctx.save();
	//   const fn = () => {
	//      ctx.restore();
	//      ctx.save();
	//      ctx.clearRect(0, 0, 800, 800);
	//      ctx.translate(animate.x, animate.y);
	//      ctx.rotate(animate.angle * Math.PI / 180);
	//      const size = animate.size;
	//      ctx.fillRect(-30 * size, -30 * size, 60 * size, 60 * size);
	//   }
	//   animate.ticker.add(fn);

	// 5. 执行动画

	//   下面先对一些概念进行解释

	//   动画分为很多种，内置的有move(移动至某一点)  rotate(旋转)  scale(放缩)  moveAs(以指定路径移动)  shake(震动)
	//   对于不同的动画种类，其所对应的属性也不同，move moveAs shake均对应x和y这两个属性
	//   rotate对应angle，scale对应size。你也可以自定义属性，这个之后会提到

	//   除了执行动画之外，这里还提供了三个等待函数，可以等待某个动画执行完毕，以及一个等待指定时长的函数
	//   分别是animate.n(等待指定数量的动画执行完毕)
	//   animate.w(等待指定类型的动画执行完毕，也可以是自定义类型)
	//   animate.all(等待所有动画执行完毕)
	//   sleep(等待指定时长)

	//   执行动画时，要求一个渐变函数，当然这个插件内置了非常丰富的渐变函数，也就是速率曲线。

	//   线性渐变函数  linear()，该函数返回一个线性变化函数

	//   三角渐变函数  trigo('sin' | 'sec', EaseMode)，该函数返回一个指定属性的三角函数变化函数
	//       其中EaseMode可以填'in' 'out' 'in-out' 'center'
	//       分别表示 慢-快  快-慢  慢-快-慢  快-慢-快

	//   幂函数渐变  power(n, EaseMode)，该函数返回一个以x^n变化的函数，n是指数

	//   双曲渐变函数  hyper('sin' | 'tan' | 'sec', EaseMode)，该函数返回一个双曲函数，分别是双曲正弦、双曲正切、双曲正割

	//   反三角渐变函数  inverseTrigo('sin' | 'tan', EaseMode)，该函数返回一个反三角函数

	//   贝塞尔曲线渐变函数  bezier(...cps)，参数为贝塞尔曲线的控制点纵坐标（横坐标不能自定义，毕竟一个时刻不能对应多个速率）
	//       示例：bezier(0.4, 0.2, 0.7); // 三个控制点的四次贝塞尔曲线渐变函数

	//   了解完渐变函数以后，这里还有一个特殊的渐变函数-shake
	//   shake(power, timing)，这个函数是一个震荡函数，会让一个值来回变化，实现震动的效果
	//       其中power是震动的最大值，timing是渐变函数，描述了power在震动时大小的变化

	//   下面，我们就可以进行动画的执行了，我们以 运动 + 旋转 + 放缩为例

	//   animate.mode(hyper('sin', 'out'))  // 设置渐变函数为 双曲正弦 快 -> 慢，注意不能加分号
	//       .time(1000)  // 设置动画的执行时间为1000毫秒
	//       .move(300, 300)  // 移动至[300, 300]的位置
	//       .relative()  // 设置相对模式为相对之前，与之前为相加的关系
	//       .mode(power(3, 'center'))  // 设置为 x^3 快-慢-快 的渐变函数
	//       .time(3000)
	//       .rotate(720)  // 旋转720度
	//       .absolute()  // 设置相对模式为绝对
	//       .mode(trigo('sin', 'in'))  // 设置渐变函数为 正弦 慢 -> 快
	//       .time(1500)
	//       .scale(3);  // 放缩大小至3倍

	//   这样，我们就把三种基础动画都执行了一遍，同时，这种写法非常直观，出现问题时也可以很快地找到问题所在
	//   下面，我们需要等待动画执行完毕，因为同一种动画不可能同时执行两个

	//   await animate.n(1); // 等待任意一个动画执行完毕，别把await忘了
	//   await animate.w('scale'); // 等待放缩动画执行完毕
	//   await animate.all(); // 等待所有动画执行完毕
	//   await sleep(1000); // 等待1000毫秒

	//   下面，还有一个特殊的动画函数-moveAs
	//   这是一个非常强大的函数，它允许你让你的物体按照指定路线运动
	//   说到这，我们需要先了解一下运动函数。
	//   该插件内置了两个运动函数，分别是圆形运动和贝塞尔曲线运动

	//   圆形运动 circle(r, n, timing, inverse)，r是圆的半径，n是圈数，timing描述半径大小的变化，inverse说明了是否翻转timing函数，后面三个可以不填

	//   贝塞尔曲线 bezierPath(start, end, ...cps)
	//       其中start和end是起点和结束点，应当填入[x, y]数组，cps是控制点，也是[x, y]数组
	//       示例：bezierPath([0, 0], [200, 200], [100, 50], [300, 150], [200, 180]);
	//       这是一个起点为 [0, 0]，终点为[200, 200]，有三个控制点的四次贝塞尔曲线

	//   下面，我们就可以使用路径函数了

	//   animate.mode(hyper('sin', 'in-out'))  // 设置渐变曲线
	//       .time(5000)
	//       .relative()  // 设置为相对模式，这个比较必要，不然的话很可能出现瞬移
	//       .moveAs(circle(100, 5, linear()))  // 创建一个5圈的半径从0至100逐渐变大的圆轨迹（是个螺旋线）并让物体沿着它运动
	//
	//   最后，还有一个震动函数 shake(x, y)，x和y表示了在横向上和纵向上的震动幅度，1表示为震动幅度的100%
	//   示例：
	//   animate.mode(shake(5, hyper('sin', 'in')), true) // 这里第二个参数说明是震动函数
	//       .time(2000)
	//       .shake(1, 0.5)

	//   这样，所有内置动画就已经介绍完毕

	// 6. 自定义动画属性

	//   本插件允许你自定义一个动画属性，但功能可能不会像自带的属性那么强大
	//   你可以在创建动画之后使用animate.register(key, init)来注册一个自定义属性
	//   其中key是自定义属性的名称，init是自定义属性的初始值，这个值应当在0-1之间变化

	//   你可以通过animate.value[key]来获取你注册的自定义属性

	//   对于自定义属性的动画，你应当使用animate.apply(key, n, first)
	//   其中，key是你的自定义属性的名称，n是其目标值，first是一个布尔值，说明了是否将该动画插入到目前所有的动画之前，即每帧会优先执行该动画

	//   下面是一个不透明度的示例

	//   animate.register('opacity', 1); // 这句话应该放到刚创建动画之后

	//   ctx.globalAlpha = animate.value.opacity; // 这句话应当放到每帧绘制的函数里面，放在绘制之前

	//   animate.mode(bezier(0.9, 0.1, 0.05))  // 设置渐变函数
	//       .time(2000)
	//       .absolute()
	//       .apply('opacity', 0.3);  // 将不透明度按照渐变曲线更改为0.3

	// 7. 运行动画

	//   还记得刚开始定义的async function 吗，直接调用它就能执行动画了！
	//   示例：ani(); // 执行刚刚写的所有动画

	// 8. 自定义速率曲线和路径

	//   该插件中，速率曲线和路径均可自定义

	//   对于速率曲线，其类型为  (input: number) => number
	//   它接受一个范围在 0-1 的值，输出一个 0-1 的值，表示了动画的完成度，1表示动画已完成，0表示动画刚开始（当前大于1小于0也不会报错，也会执行相应的动画）

	//   对于路径，其类型为  (input: number) => [number, number]
	//   它与速率曲线类似，接收一个 0-1 的值，输出一个坐标数组

	// 9. 多个属性绑定

	//   该插件中，你可以绑定多个动画属性，你可以使用ani.bind(...attr)来绑定。
	//   绑定之后，这三个动画属性可以被一个返回了长度为3的数组的渐变函数执行。
	//   绑定使用ani.bind，设置渐变函数仍然使用ani.mode，注意它与单个动画属性是分开的，也就是它不会影响正常的渐变函数。
	//   然后使用ani.applyMulti即可执行动画

	//   例如：
	//   // 自定义的一个三属性渐变函数
	//   function b(input) {
	//       return [input * 100, input ** 2 * 100, input ** 3 * 100];
	//   }
	//   ani.bind('a', 'b', 'c') // 这样会绑定abc这三个动画属性
	//       .mode(b) // 自定义的一个返回了长度为3的数组的函数
	//       .time(5000)
	//       .absolute()
	//       .applyMulti(); // 执行这个动画

	// 9. 监听  动画的生命周期钩子

	//   这个插件还允许你去监听动画的状态，可以监听动画的开始、结束、运行
	//   你可以使用 animate.listen(type, fn)来监听，fn的类型是 (a: Animation, type: string) => void
	//   当然，一般情况下你不会用到这个功能，插件中已经帮你包装了三个等待函数，他们就是以这些监听为基础的

	// 10. 自定义时间获取函数

	//   你可以修改ani.getTime来修改动画的时间获取函数，例如想让动画速度变成一半可以写ani.getTime = () => Date.now() / 2
	//   这样可以允许你随意控制动画的运行速度，暂停，甚至是倒退。该值默认为`Date.now`

	// -------------------- 渐变使用教程 -------------------- //

	// 相比于动画，渐变属于一种较为简便的动画，它可以让你在设置一个属性后使属性缓慢变化值目标值而不是突变至目标值
	// 现在假设你已经了解了动画的使用，下面我们来了解渐变。

	// 1. 创建一个渐变实例
	//   与动画类似，你需要使用new来实例化一个渐变，当然别忘了引入
	//   const { Transition } = core.plugin.animate;
	//   const tran = new Transition();

	// 2. 绘制
	//   const ctx = core.createCanvas('transition', 0, 0, 416, 416, 100);
	//   ctx.save();
	//   const fn = () => {
	//      ctx.restore();
	//      ctx.save();
	//      ctx.clearRect(0, 0, 800, 800);
	//      ctx.beginPath();
	//      ctx.arc(tran.value.x, tran.value.y, 50, 0, Math.PI * 2); // 使用tran.value.xxx获取当前的属性
	//      ctx.fill();
	//      // 当然也可以用样板的api，例如core.fillCircle();等
	//   }
	//   animate.ticker.add(fn);

	// 3. 设置渐变
	//   同样，与动画类似，你可以使用tran.time()设置渐变时间，使用tran.mode()设置渐变函数，使用tran.absolute()和tran.relative()设置相对模式
	//   例如：
	//   tran.time(1000)
	//       .mode(hyper('sin', 'out'))
	//       .absolute();

	// 4. 初始化渐变属性
	//   与动画不同的是，动画在执行一个自定义属性前都需要register，而渐变不需要。
	//   你可以通过tran.value.xxx = yyy来设置动画属性或使用tran.transition('xxx', yyy)来设置
	//   你的首次赋值即是初始化了渐变属性，这时是不会执行渐变的，例如：
	//   tran.value.x = 200;
	//   tran.transition('y', 200);
	//   上述例子便是将 x 和 y 初始化成了200

	// 5. 执行渐变
	//   初始化完成后，便可以直接执行渐变了，有两种方法
	//   tran.value.x = 400; // 将 x 缓慢移动至400
	//   tran.transition('y', 400); // 将 y 缓慢移动至400

	// 6. 自定义时间获取函数
	//   与动画类似，你依然可以通过修改tran.getTime来修改时间获取函数

	if (main.replayChecking) return (core.plugin.animate = {});

	var M = Object.defineProperty;
	var E = (n, s, t) =>
		s in n ?
		M(n, s, { enumerable: !0, configurable: !0, writable: !0, value: t }) :
		(n[s] = t);
	var o = (n, s, t) => (E(n, typeof s != "symbol" ? s + "" : s, t), t);
	let b = [];
	const k = (n) => {
		for (const s of b)
			if (s.status === "running")
				try {
					for (const t of s.funcs) t(n - s.startTime);
				} catch (t) {
					s.destroy(), console.error(t);
				}
		requestAnimationFrame(k);
	};
	requestAnimationFrame(k);
	class I {
		constructor() {
			o(this, "funcs", []);
			o(this, "status", "stop");
			o(this, "startTime", 0);
			(this.status = "running"),
			b.push(this),
				requestAnimationFrame((s) => (this.startTime = s));
		}
		add(s, t = !1) {
			return t ? this.funcs.unshift(s) : this.funcs.push(s), this;
		}
		remove(s) {
			const t = this.funcs.findIndex((e) => e === s);
			if (t === -1)
				throw new ReferenceError(
					"You are going to remove nonexistent ticker function."
				);
			return this.funcs.splice(t, 1), this;
		}
		clear() {
			this.funcs = [];
		}
		destroy() {
			this.clear(), this.stop();
		}
		stop() {
			(this.status = "stop"), (b = b.filter((s) => s !== this));
		}
	}
	class F {
		constructor() {
			o(this, "timing");
			o(this, "relation", "absolute");
			o(this, "easeTime", 0);
			o(this, "applying", {});
			o(this, "getTime", Date.now);
			o(this, "ticker", new I());
			o(this, "value", {});
			o(this, "listener", {});
			this.timing = (s) => s;
		}
		async all() {
			if (Object.values(this.applying).every((s) => s === !0))
				throw new ReferenceError("There is no animates to be waited.");
			await new Promise((s) => {
				const t = () => {
					Object.values(this.applying).every((e) => e === !1) &&
						(this.unlisten("end", t), s("all animated."));
				};
				this.listen("end", t);
			});
		}
		async n(s) {
			const t = Object.values(this.applying).filter((i) => i === !0).length;
			if (t < s)
				throw new ReferenceError(
					`You are trying to wait ${s} animate, but there are only ${t} animate animating.`
				);
			let e = 0;
			await new Promise((i) => {
				const r = () => {
					e++, e === s && (this.unlisten("end", r), i(`${s} animated.`));
				};
				this.listen("end", r);
			});
		}
		async w(s) {
			if (this.applying[s] === !1)
				throw new ReferenceError(`The ${s} animate is not animating.`);
			await new Promise((t) => {
				const e = () => {
					this.applying[s] === !1 &&
						(this.unlisten("end", e), t(`${s} animated.`));
				};
				this.listen("end", e);
			});
		}
		listen(s, t) {
			var e, i;
			(i = (e = this.listener)[s]) != null || (e[s] = []),
				this.listener[s].push(t);
		}
		unlisten(s, t) {
			const e = this.listener[s].findIndex((i) => i === t);
			if (e === -1)
				throw new ReferenceError(
					"You are trying to remove a nonexistent listener."
				);
			this.listener[s].splice(e, 1);
		}
		hook(...s) {
			const t = Object.entries(this.listener).filter((e) => s.includes(e[0]));
			for (const [e, i] of t)
				for (const r of i) r(this, e);
		}
	}

	function T(n) {
		return n != null;
	}
	async function R(n) {
		return new Promise((s) => setTimeout(s, n));
	}
	class Y extends F {
		constructor() {
			super();
			o(this, "shakeTiming");
			o(this, "path");
			o(this, "multiTiming");
			o(this, "value", {});
			o(this, "size", 1);
			o(this, "angle", 0);
			o(this, "targetValue", {
				system: {
					move: [0, 0],
					moveAs: [0, 0],
					resize: 0,
					rotate: 0,
					shake: 0,
					"@@bind": [],
				},
				custom: {},
			});
			o(this, "animateFn", {
				system: {
					move: [() => 0, () => 0],
					moveAs: () => 0,
					resize: () => 0,
					rotate: () => 0,
					shake: () => 0,
					"@@bind": () => 0,
				},
				custom: {},
			});
			o(this, "ox", 0);
			o(this, "oy", 0);
			o(this, "sx", 0);
			o(this, "sy", 0);
			o(this, "bindInfo", []);
			(this.timing = (t) => t),
			(this.shakeTiming = (t) => t),
			(this.multiTiming = (t) => [t, t]),
			(this.path = (t) => [t, t]),
			(this.applying = {
				move: !1,
				scale: !1,
				rotate: !1,
				shake: !1,
			}),
			this.ticker.add(() => {
				const { running: t } = this.listener;
				if (T(t))
					for (const e of t) e(this, "running");
			});
		}
		get x() {
			return this.ox + this.sx;
		}
		get y() {
			return this.oy + this.sy;
		}
		mode(t, e = !1) {
			return (
				typeof t(0) == "number" ?
				e ?
				(this.shakeTiming = t) :
				(this.timing = t) :
				(this.multiTiming = t),
				this
			);
		}
		time(t) {
			return (this.easeTime = t), this;
		}
		relative() {
			return (this.relation = "relative"), this;
		}
		absolute() {
			return (this.relation = "absolute"), this;
		}
		bind(...t) {
			return (
				this.applying["@@bind"] === !0 && this.end(!1, "@@bind"),
				(this.bindInfo = t),
				this
			);
		}
		unbind() {
			return (
				this.applying["@@bind"] === !0 && this.end(!1, "@@bind"),
				(this.bindInfo = []),
				this
			);
		}
		move(t, e) {
			return (
				this.applying.move && this.end(!0, "move"),
				this.applySys("ox", t, "move"),
				this.applySys("oy", e, "move"),
				this
			);
		}
		rotate(t) {
			return this.applySys("angle", t, "rotate"), this;
		}
		scale(t) {
			return this.applySys("size", t, "resize"), this;
		}
		shake(t, e) {
			this.applying.shake === !0 && this.end(!0, "shake"),
				(this.applying.shake = !0);
			const { easeTime: i, shakeTiming: r } = this,
			h = this.getTime();
			if ((this.hook("start", "shakestart"), i <= 0))
				return this.end(!1, "shake"), this;
			const l = () => {
				const c = this.getTime() - h;
				if (c > i) {
					this.ticker.remove(l),
						(this.applying.shake = !1),
						(this.sx = 0),
						(this.sy = 0),
						this.hook("end", "shakeend");
					return;
				}
				const a = c / i,
					m = r(a);
				(this.sx = m * t), (this.sy = m * e);
			};
			return this.ticker.add(l), (this.animateFn.system.shake = l), this;
		}
		moveAs(t) {
			this.applying.moveAs && this.end(!0, "moveAs"),
				(this.applying.moveAs = !0),
				(this.path = t);
			const { easeTime: e, relation: i, timing: r } = this,
			h = this.getTime(),
				[l, u] = [this.x, this.y],
				[c, a] = (() => {
					if (i === "absolute") return t(1); {
						const [d, f] = t(1);
						return [l + d, u + f];
					}
				})();
			if ((this.hook("start", "movestart"), e <= 0))
				return this.end(!1, "moveAs"), this;
			const m = () => {
				const f = this.getTime() - h;
				if (f > e) {
					this.end(!0, "moveAs");
					return;
				}
				const v = f / e,
					[g, w] = t(r(v));
				i === "absolute" ?
					((this.ox = g), (this.oy = w)) :
					((this.ox = l + g), (this.oy = u + w));
			};
			return (
				this.ticker.add(m, !0),
				(this.animateFn.system.moveAs = m),
				(this.targetValue.system.moveAs = [c, a]),
				this
			);
		}
		register(t, e) {
			if (typeof this.value[t] == "number")
				return this.error(
					`Property ${t} has been regietered twice.`,
					"reregister"
				);
			(this.value[t] = e), (this.applying[t] = !1);
		}
		apply(t, e, i = !1) {
			this.applying[t] === !0 && this.end(!1, t),
				t in this.value ||
				this.error(`You are trying to execute nonexistent property ${t}.`),
				(this.applying[t] = !0);
			const r = this.value[t],
				h = this.getTime(),
				{ timing: l, relation: u, easeTime: c } = this,
				a = u === "absolute" ? e - r : e;
			if ((this.hook("start"), c <= 0)) return this.end(!1, t), this;
			const m = () => {
				const f = this.getTime() - h;
				if (f > c) {
					this.end(!1, t);
					return;
				}
				const v = f / c,
					g = l(v);
				this.value[t] = r + g * a;
			};
			return (
				this.ticker.add(m, i),
				(this.animateFn.custom[t] = m),
				(this.targetValue.custom[t] = a + r),
				this
			);
		}
		applyMulti(t = !1) {
			this.applying["@@bind"] === !0 && this.end(!1, "@@bind"),
				(this.applying["@@bind"] = !0);
			const e = this.bindInfo,
				i = e.map((m) => this.value[m]),
				r = this.getTime(),
				{ multiTiming: h, relation: l, easeTime: u } = this,
				c = h(1);
			if (c.length !== i.length)
				throw new TypeError(
					`The number of binded animate attributes and timing function returns's length does not match. binded: ${e.length}, timing: ${c.length}`
				);
			if ((this.hook("start"), u <= 0)) return this.end(!1, "@@bind"), this;
			const a = () => {
				const d = this.getTime() - r;
				if (d > u) {
					this.end(!1, "@@bind");
					return;
				}
				const f = d / u,
					v = h(f);
				e.forEach((g, w) => {
					l === "absolute" ?
						(this.value[g] = v[w]) :
						(this.value[g] = i[w] + v[w]);
				});
			};
			return (
				this.ticker.add(a, t),
				(this.animateFn.custom["@@bind"] = a),
				(this.targetValue.system["@@bind"] = c),
				this
			);
		}
		applySys(t, e, i) {
			i !== "move" && this.applying[i] === !0 && this.end(!0, i),
				(this.applying[i] = !0);
			const r = this[t],
				h = this.getTime(),
				l = this.timing,
				u = this.relation,
				c = this.easeTime,
				a = u === "absolute" ? e - r : e;
			if ((this.hook("start", `${i}start`), c <= 0)) return this.end(!1, i);
			const m = () => {
				const f = this.getTime() - h;
				if (f > c) {
					this.end(!0, i);
					return;
				}
				const v = f / c,
					g = l(v);
				(this[t] = r + a * g), t !== "oy" && this.hook(i);
			};
			this.ticker.add(m, !0),
				t === "ox" ?
				(this.animateFn.system.move[0] = m) :
				t === "oy" ?
				(this.animateFn.system.move[1] = m) :
				(this.animateFn.system[i] = m),
				i === "move" ?
				(t === "ox" && (this.targetValue.system.move[0] = a + r),
					t === "oy" && (this.targetValue.system.move[1] = a + r)) :
				i !== "shake" && (this.targetValue.system[i] = a + r);
		}
		error(t, e) {
			throw e === "repeat" ?
				new Error(`Cannot execute the same animation twice. Info: ${t}`) :
				e === "reregister" ?
				new Error(`Cannot register an animated property twice. Info: ${t}`) :
				new Error(t);
		}
		end(t, e) {
			if (t === !0)
				if (
					((this.applying[e] = !1),
						e === "move" ?
						(this.ticker.remove(this.animateFn.system.move[0]),
							this.ticker.remove(this.animateFn.system.move[1])) :
						e === "moveAs" ?
						this.ticker.remove(this.animateFn.system.moveAs) :
						e === "@@bind" ?
						this.ticker.remove(this.animateFn.system["@@bind"]) :
						this.ticker.remove(this.animateFn.system[e]),
						e === "move")
				) {
					const [i, r] = this.targetValue.system.move;
					(this.ox = i), (this.oy = r), this.hook("moveend", "end");
				} else if (e === "moveAs") {
				const [i, r] = this.targetValue.system.moveAs;
				(this.ox = i), (this.oy = r), this.hook("moveend", "end");
			} else
				e === "rotate" ?
				((this.angle = this.targetValue.system.rotate),
					this.hook("rotateend", "end")) :
				e === "resize" ?
				((this.size = this.targetValue.system.resize),
					this.hook("resizeend", "end")) :
				e === "@@bind" ?
				this.bindInfo.forEach((r, h) => {
					this.value[r] = this.targetValue.system["@@bind"][h];
				}) :
				((this.sx = 0), (this.sy = 0), this.hook("shakeend", "end"));
			else
				(this.applying[e] = !1),
				this.ticker.remove(this.animateFn.custom[e]),
				(this.value[e] = this.targetValue.custom[e]),
				this.hook("end");
		}
	}
	class j extends F {
		constructor() {
			super();
			o(this, "now", {});
			o(this, "target", {});
			o(this, "transitionFn", {});
			o(this, "value");
			o(this, "handleSet", (t, e, i) => (this.transition(e, i), !0));
			o(this, "handleGet", (t, e) => this.now[e]);
			(this.timing = (t) => t),
			(this.value = new Proxy(this.target, {
				set: this.handleSet,
				get: this.handleGet,
			}));
		}
		mode(t) {
			return (this.timing = t), this;
		}
		time(t) {
			return (this.easeTime = t), this;
		}
		relative() {
			return (this.relation = "relative"), this;
		}
		absolute() {
			return (this.relation = "absolute"), this;
		}
		transition(t, e) {
			if (e === this.target[t]) return this;
			if (!T(this.now[t])) return (this.now[t] = e), this;
			this.applying[t] && this.end(t, !0),
				(this.applying[t] = !0),
				this.hook("start");
			const i = this.getTime(),
				r = this.easeTime,
				h = this.timing,
				l = this.now[t],
				u = e + (this.relation === "absolute" ? 0 : l),
				c = u - l;
			this.target[t] = u;
			const a = () => {
				const d = this.getTime() - i;
				if (d >= r) {
					this.end(t);
					return;
				}
				const f = d / r;
				(this.now[t] = h(f) * c + l), this.hook("running");
			};
			return (
				(this.transitionFn[t] = a),
				r <= 0 ? (this.end(t), this) : (this.ticker.add(a), this)
			);
		}
		end(t, e = !1) {
			const i = this.transitionFn[t];
			if (!T(i))
				throw new ReferenceError(
					`You are trying to end an ended transition: ${t}`
				);
			this.ticker.remove(this.transitionFn[t]),
				delete this.transitionFn[t],
				(this.applying[t] = !1),
				this.hook("end"),
				e || (this.now[t] = this.target[t]);
		}
	}
	const x = (...n) => n.reduce((s, t) => s + t, 0),
		y = (n) => {
			if (n === 0) return 1;
			let s = n;
			for (; n > 1;) n--, (s *= n);
			return s;
		},
		A = (n, s) => Math.round(y(s) / (y(n) * y(s - n))),
		p = (n, s, t = (e) => 1 - s(1 - e)) =>
		n === "in" ?
		s :
		n === "out" ?
		t :
		n === "in-out" ?
		(e) => (e < 0.5 ? s(e * 2) / 2 : 0.5 + t((e - 0.5) * 2) / 2) :
		(e) => (e < 0.5 ? t(e * 2) / 2 : 0.5 + s((e - 0.5) * 2) / 2),
		$ = Math.cosh(2),
		z = Math.acosh(2),
		V = Math.tanh(3),
		P = Math.atan(5);

	function O() {
		return (n) => n;
	}

	function q(...n) {
		const s = [0].concat(n);
		s.push(1);
		const t = s.length,
			e = Array(t)
			.fill(0)
			.map((i, r) => A(r, t - 1));
		return (i) => {
			const r = e.map((h, l) => h * s[l] * (1 - i) ** (t - l - 1) * i ** l);
			return x(...r);
		};
	}

	function U(n, s) {
		if (n === "sin") {
			const t = (i) => Math.sin((i * Math.PI) / 2);
			return p(s, (i) => 1 - t(1 - i), t);
		}
		if (n === "sec") {
			const t = (i) => 1 / Math.cos(i);
			return p(s, (i) => t((i * Math.PI) / 3) - 1);
		}
		throw new TypeError(
			"Unexpected parameters are delivered in trigo timing function."
		);
	}

	function C(n, s) {
		if (!Number.isInteger(n))
			throw new TypeError(
				"The first parameter of power timing function only allow integer."
			);
		return p(s, (e) => e ** n);
	}

	function G(n, s) {
		if (n === "sin") return p(s, (e) => (Math.cosh(e * 2) - 1) / ($ - 1));
		if (n === "tan") {
			const t = (i) => (Math.tanh(i * 3) * 1) / V;
			return p(s, (i) => 1 - t(1 - i), t);
		}
		if (n === "sec") {
			const t = (i) => 1 / Math.cosh(i);
			return p(s, (i) => 1 - (t(i * z) - 0.5) * 2);
		}
		throw new TypeError(
			"Unexpected parameters are delivered in hyper timing function."
		);
	}

	function N(n, s) {
		if (n === "sin") {
			const t = (i) => (Math.asin(i) / Math.PI) * 2;
			return p(s, (i) => 1 - t(1 - i), t);
		}
		if (n === "tan") {
			const t = (i) => Math.atan(i * 5) / P;
			return p(s, (i) => 1 - t(1 - i), t);
		}
		throw new TypeError(
			"Unexpected parameters are delivered in inverse trigo timing function."
		);
	}

	function B(n, s = () => 1) {
		let t = -1;
		return (e) => (
			(t *= -1), e < 0.5 ? n * s(e * 2) * t : n * s((1 - e) * 2) * t
		);
	}

	function D(n, s = 1, t = [0, 0], e = 0, i = (h) => 1, r = !1) {
		return (h) => {
			const l = s * h * Math.PI * 2 + (e * Math.PI) / 180,
				u = Math.cos(l),
				c = Math.sin(l),
				a = n * i(i(r ? 1 - h : h));
			return [a * u + t[0], a * c + t[1]];
		};
	}

	function H(n, s, ...t) {
		const e = [n].concat(t);
		e.push(s);
		const i = e.length,
			r = Array(i)
			.fill(0)
			.map((h, l) => A(l, i - 1));
		return (h) => {
			const l = r.map(
					(c, a) => c * e[a][0] * (1 - h) ** (i - a - 1) * h ** a
				),
				u = r.map((c, a) => c * e[a][1] * (1 - h) ** (i - a - 1) * h ** a);
			return [x(...l), x(...u)];
		};
	}

	if ("animate" in core.plugin)
		throw new ReferenceError(`插件中已存在名为animate的属性！`);

	core.plugin.animate = {
		Animation: Y,
		AnimationBase: F,
		Ticker: I,
		Transition: j,
		sleep: R,
		circle: D,
		bezierPath: H,
		linear: O,
		bezier: q,
		trigo: U,
		power: C,
		hyper: G,
		inverseTrigo: N,
		shake: B,
	};
},
    "自动操作": function () {
	// 合并版自动清怪插件 (修改版：支持过滤血瓶)

	const ctxName = 'autoClear';

	// 定义血瓶ID列表
	const potionIds = ['redPotion', 'bluePotion', 'greenPotion', 'yellowPotion', 'superPotion'];

	// ----------------- 辅助函数 / 工具 -----------------
	function has(v) {
		return v !== null && v !== undefined;
	}

	function willLvUp(exp) {
		const nextExp = core.getNextLvUpNeed();
		if (typeof exp === 'number' && typeof nextExp === 'number' && exp >= nextExp) return true;
		return false;
	}

	// ----------------- canBattle -----------------
	function canBattle(enemy, x, y) {
		const loc = `${x},${y}`;
		const floor = core.floors[core.status.floorId];
		const e = core.getEnemyValue(enemy, null, x, y);
		const hasEvent =
			has(floor.afterBattle[loc]) || has(floor.beforeBattle[loc]) ||
			has(e.beforeBattle) || has(e.afterBattle) ||
			has(floor.events[loc]) || willLvUp(e.exp); // 防止有升级后事件
		const cache = core.status.checkBlock.cache;
		const hasGuards = has(cache) && has(cache[loc]) && cache[loc]?.guards?.length > 0; // 会被支援

		// 有事件，不清
		if (hasEvent) return false;
		// 有特定特殊属性的怪不清
		if (
			core.hasSpecial(e.special, 12) || // 中毒
			core.hasSpecial(e.special, 13) || // 衰弱
			core.hasSpecial(e.special, 14) || // 诅咒
			core.hasSpecial(e.special, 19) || // 自爆 
			core.hasSpecial(e.special, 21) || // 退化
			core.hasSpecial(e.special, 26) || // 支援
			hasGuards || // 会被支援
			core.hasSpecial(e.special, 27) || // 捕捉
			core.hasSpecial(e.special, 28) || // 追猎
			core.hasSpecial(e.special, 29) // 败移:特殊战后事件
		) {
			return false;
		}
		const damage = core.getDamageInfo(enemy, void 0, x, y)?.damage;
		// 0伤或负伤，清
		if (has(damage) && damage <= 0) return true;
		return false;
	}

	// ----------------- canGetItem -----------------
	function canGetItem(item, loc, floorId) {
		return !hasBlockDamage(loc) || core.flags.enableGentleClick;
	}

	// ----------------- 拾取动画 -----------------
	class AttractAnimate {
		constructor() {
			this.name = 'attractAnimate';
			this.isPlaying = false;
			this.nodes = [];
			this.lastTime = -1;
			this.thr = 5; // 缓动比例倒数，越大移动越慢
		}

		add(id, x, y, callback) {
			if (core.isReplaying()) return;
			this.nodes.push({ id, x, y, callback });
		}

		start() {
			if (this.isPlaying) return;
			if (core.isReplaying()) return;
			if (core.getLocalStorage && core.getLocalStorage('skipPerform')) return;
			this.isPlaying = true;
			core.registerAnimationFrame(this.name, true, this.update.bind(this));
			this.ctx = core.createCanvas(this.name, 0, 0, core.__PIXELS__, core.__PIXELS__, 120);
		}

		remove() {
			core.unregisterAnimationFrame(this.name);
			core.deleteCanvas(this.name);
			this.isPlaying = false;
		}

		clear() {
			this.nodes = [];
			this.remove();
		}

		update(timeStamp) {
			if (this.lastTime < 0) this.lastTime = timeStamp;
			if (timeStamp - this.lastTime < 20) return;
			this.lastTime = timeStamp;

			core.clearMap(this.name);

			const heroCenterX = core.status.heroCenter.px - 16;
			const heroCenterY = core.status.heroCenter.py - 16;

			for (const n of this.nodes) {
				const dx = heroCenterX - n.x;
				const dy = heroCenterY - n.y;

				if (Math.abs(dx) <= this.thr && Math.abs(dy) <= this.thr) {
					n.dead = true;
				} else {
					n.x += ~~(dx / this.thr);
					n.y += ~~(dy / this.thr);
				}

				core.drawIcon(this.name, n.id, n.x, n.y, 32, 32);
			}

			const remaining = [];
			for (const n of this.nodes) {
				if (n.dead && n.callback) n.callback();
				if (!n.dead) remaining.push(n);
			}
			this.nodes = remaining;

			if (this.nodes.length === 0) this.remove();
		}
	}

	const animateHwnd = new AttractAnimate();

	this.pickOneItemAnimate = function (id, x, y, callback) {
		if (core.isReplaying()) return;
		animateHwnd.add(id, x, y, callback);
		animateHwnd.start();
	};
	this.clearAttractAnimate = function () {
		animateHwnd.clear();
	};

	// ----------------- 判断地图伤害 -----------------
	function hasBlockDamage(loc) {
		const checkblockInfo = core.status.checkBlock;
		const damage = checkblockInfo?.damage?.[loc];
		const ambush = checkblockInfo?.ambush?.[loc];
		const repulse = checkblockInfo?.repulse?.[loc];
		const chase = checkblockInfo?.chase?.[loc];

		return (has(damage) && damage > 0) || has(ambush) || has(repulse) || has(chase);
	}

	// ----------------- judge -----------------
	function judge(block, nx, ny, tx, ty, dir, floorId, autoFlags) {
		if (core.getFgNumber(tx, ty) === 103) return { type: "unknown", canGoThrough: false };
		if (!has(block) || block.disable) {
			return { type: "none", canGoThrough: true };
		}
		const cls = block.event.cls;
		const loc = `${tx},${ty}`;
		const floor = core.floors[floorId];
		const changeFloor = floor.changeFloor[loc];

		if (has(changeFloor)) {
			if ((changeFloor.ignoreChangeFloor ?? core.flags.ignoreChangeFloor) && block.id === 0) {
				return { type: "unknown", canGoThrough: true };
			}
			return { type: "unknown", canGoThrough: false };
		}

		if (has(block.event.data)) return { type: "unknown", canGoThrough: false };

		const isEnemy = autoFlags.battle && cls && cls.startsWith && cls.startsWith('enemy'),
			isItem = autoFlags.item && cls === 'items';

		const isWall = autoFlags.wall && (block.id === 2);
		const isLava = autoFlags.wall && (block.id === 5 && core.hasItem && core.hasItem('snow') && core.material.items["snow"] && core.material.items["snow"].cls === 'constants');

		if (isEnemy) return { type: "enemy", canGoThrough: true };
		if (isItem) return { type: "item", canGoThrough: true };
		if (isWall) return { type: "wall", canGoThrough: true };
		if (isLava) return { type: "lava", canGoThrough: true };

		return { type: "unknown", canGoThrough: false };
	}

	const { Transition, hyper, Ticker } = core.plugin.animate ?? {};
	const transitionTime = 200;
	const transitionList = [];

	// ------ 修改：增加 autoFlags 参数以判断是否过滤血瓶 ------
	function _performGetItem(item, x, y, loc, floorId, autoFlags) {
		if (!canGetItem(item, loc, floorId)) {
			return false;
		}

		// 判断：如果模式是 nopotion 且物品在血瓶列表中，则不拾取
		if (autoFlags.item === 'nopotion' && potionIds.includes(item.id)) {
			return false;
		}

		core.getItem(item.id, 1, x, y);

		if (!main.replayChecking && Ticker) {
			let px = x * 32 - core.bigmap.offsetX;
			let py = y * 32 - core.bigmap.offsetY;
			const t = new Transition();
			t.mode(hyper('sin', 'out'))
				.time(transitionTime)
				.absolute()
				.transition('x', px)
				.transition('y', py);
			let { x: hx, y: hy } = core.status.hero.loc;
			t.value.x = hx * 32 - core.bigmap.offsetX;
			t.value.y = hy * 32 - core.bigmap.offsetY;
			transitionList.push(t);
			t.ticker.add(() => {
				core.drawIcon('_autoItem_', item.id, t.value.x, t.value.y, 32, 32);
				let { x: hx, y: hy } = core.status.hero.loc;
				const heroPx = hx * 32 - core.bigmap.offsetX;
				const heroPy = hy * 32 - core.bigmap.offsetY;
				if (Math.abs(t.value.x - heroPx) < 0.05 && Math.abs(t.value.y - heroPy) < 0.05) {
					t.ticker.destroy();
					const index = transitionList.findIndex(v => v === t);
					if (index !== -1) transitionList.splice(index, 1);
				}
			});
		}

		return true;
	}

	if (!main.replayChecking) {
		const ticker = new Ticker();
		ticker.add(() => {
			if (!core.isPlaying()) return;
			const ctx = core.getContextByName('_autoItem_');
			if (!has(ctx)) return;
			core.clearMap(ctx);
		});
	}

	// ----------------- BFS -----------------
	function bfs(floorId, deep = Infinity, autoFlags) {
		core.extractBlocks(floorId);
		const objs = core.getMapBlocksObj(floorId);
		const bgMap = core.getBgMapArray(floorId);
		const { x, y } = core.status.hero.loc;
		const dir = Object.entries(core.utils.scan).map(v => [v[0], v[1].x, v[1].y]);
		const floor = core.status.maps[floorId];

		const queue = [
			[x, y]
		];
		const mapped = {
			[`${x},${y}`]: true
		};

		if (!autoFlags) autoFlags = { battle: true, item: true, wall: false };

		while (queue.length > 0 && deep > 0) {
			const [nx, ny] = queue.shift();
			dir.forEach(v => {
				const [tx, ty] = [nx + v[1], ny + v[2]];
				if (tx < 0 || ty < 0 || tx >= floor.width || ty >= floor.height) {
					return;
				}
				const loc = `${tx},${ty}`;
				if (mapped[loc]) return;
				const block = objs[loc];
				mapped[loc] = true;
				if (core.onSki && core.onSki(bgMap[ty][tx])) return;
				const { type, canGoThrough } = judge(block, nx, ny, tx, ty, v[0], floorId, autoFlags);
				if (!canGoThrough) return;

				if (type === 'enemy') {
					if (canBattle(block.event.id, tx, ty) && !block.disable) {
						core.battle(block.event.id, tx, ty);
						core.updateCheckBlock(floorId);
					} else {
						return;
					}
				} else if (type === 'item') {
					const item = core.material.items[block.event.id];
					// 修改：传入 autoFlags
					if (_performGetItem(item, tx, ty, loc, floorId, autoFlags)) {
						core.updateCheckBlock(floorId);
					} else {
						return;
					}
				} else if (type === 'wall' || type === 'lava') {
					if (block && !block.disable && !block.event.data) {
						if (type === 'wall') {
							core.removeBlock(tx, ty);
							core.updateCheckBlock(floorId);
						} else if (type === 'lava') {
							core.removeBlock(tx, ty);
							core.updateCheckBlock(floorId);
						}
					} else {
						return;
					}
				}

				if (hasBlockDamage(loc)) return;
				queue.push([tx, ty]);
			});
			deep--;
		}
	}

	this.auto = function () {
		if (!core.status.floorId || !core.status.checkBlock || !core.status.checkBlock.damage) return;
		if (core.status.event.id == 'action' || core.events.onSki && core.events.onSki() || core.status.lockControl || !core.maps._canMoveDirectly_checkGlobal()) return;

		let autoFlags = { battle: false, item: false, wall: false };
		try {
			const heroFlags = core.status.hero && core.status.hero.flags && core.status.hero.flags.__auto__;
			autoFlags.battle = !!heroFlags.battle;
			// 修改：不要强制转换 boolean，允许 item 为字符串状态
			autoFlags.item = heroFlags.item;
			autoFlags.wall = !!heroFlags.wall;
		} catch (e) {}
		if (!autoFlags.battle && !autoFlags.item && !autoFlags.wall) return;

		const { x, y } = core.status.hero.loc;
		const floor = core.floors[core.status.floorId];
		const loc = `${x},${y}`;
		const hasEvent = has(floor.events[loc]);
		if (hasEvent) return;
		const block = core.getBlock(x, y);
		if (block != null && block.event.cls !== 'items') return;

		const before = core.flags.__forbidSave__;
		core.flags.__forbidSave__ = true;
		core.flags.__statistics__ = true;

		let deep = Infinity;

		core.updateCheckBlock(core.status.floorId);

		if (hasBlockDamage(loc)) {
			deep = core.flags.enableGentleClick ? 1 : 0;
		}

		if (!core.getContextByName('_autoItem_')) {
			core.createCanvas(
				'_autoItem_',
				0,
				0,
				core._PX_ ?? core.__PIXELS__,
				core._PY_ ?? core.__PIXELS__,
				75
			);
		}

		bfs(core.status.floorId, deep, autoFlags);

		if (!core.isReplaying()) animateHwnd.start();

		core.flags.__statistics__ = false;
		core.flags.__forbidSave__ = before;
		core.updateStatusBar();
	}

	core.registerReplayAction("moveDirectly", function (action) {
		if (action.indexOf("move:") != 0) return false;

		var pos = action.substring(5).split(":");
		var x = parseInt(pos[0]),
			y = parseInt(pos[1]);
		var nowx = core.getHeroLoc('x'),
			nowy = core.getHeroLoc('y');
		var ignoreSteps = core.canMoveDirectly(x, y);
		if (!core.moveDirectly(x, y, ignoreSteps)) return false;
		if (core.status.replay.speed == 24) {
			core.replay();
			return true;
		}

		core.ui.drawArrow('ui', 32 * nowx + 16 - core.bigmap.offsetX, 32 * nowy + 16 - core.bigmap.offsetY,
			32 * x + 16 - core.bigmap.offsetX, 32 * y + 16 - core.bigmap.offsetY, '#FF0000', 3);
		var timeout = this.__replay_getTimeout();
		if (ignoreSteps < 10) timeout = timeout * ignoreSteps / 10;
		setTimeout(function () {
			core.clearMap('ui');
			core.replay();
		}, timeout);
		return true;
	});

	function update() {
		core.control.updateCheckBlock();
		core.control.updateDamage();
		core.auto();
		if (main.replayChecking) return;
	}
	core.moveOneStep = function (fromX, fromY, callback) {
		return core.control.moveOneStep(fromX, fromY, callback);
	}
	control.prototype.moveOneStep = function (fromX, fromY, callback) {
		const res = this.controldata.moveOneStep(fromX, fromY, callback);
		if (core.status.event.data)
			core.insertAction({ "type": "function", "function": "function(){ core.auto(); if (main.replayChecking) return; }" }, null, null, null, true);
		else
			update();
		return res;
	};

	control.prototype.moveDirectly = function (destX, destY, ignoreSteps) {
		const res = this.controldata.moveDirectly(
			destX,
			destY,
			ignoreSteps
		);
		update();
		return res;
	};
	control.prototype.setHeroLoc = function (name, value, noGather) {
		if (!core.status.hero) return;
		if (typeof name === 'object' && name !== null) {
			const locObject = name;
			const shouldGather = !value;
			Object.assign(core.status.hero.loc, locObject);
			if (('x' in locObject || 'y' in locObject) && shouldGather) {
				this.gatherFollowers();
			}
		} else {
			core.status.hero.loc[name] = value;
			if ((name == 'x' || name == 'y') && !noGather) {
				this.gatherFollowers();
			}
		}
		for (let i = 0; i < transitionList.length; i++) {
			const t = transitionList[i];
			let { x, y } = core.status.hero.loc;
			t.value.x = x * 32 - core.bigmap.offsetX;
			t.value.y = y * 32 - core.bigmap.offsetY;
		}
	}

	enemys.prototype.getEnemyValue = function (enemy, name, x, y, floorId) {
		floorId = floorId || core.status.floorId;

		const pointInfo = (((flags.enemyOnPoint || {})[floorId] || {})[x + "," + y] || {});

		if (core.isset(name) && pointInfo[name] != null) {
			return pointInfo[name];
		}

		if (enemy == null) {
			var block = core.getBlock(x, y, floorId);
			if (block == null) return null;
			enemy = core.material.enemys[block.event.id];
		} else if (typeof enemy == 'string') {
			enemy = core.material.enemys[enemy];
			if (enemy == null) return null;
		}
		enemy = core.clone(enemy);

		if (!core.isset(name)) {
			for (let status in pointInfo) {
				if (pointInfo.hasOwnProperty(status)) enemy[status] = pointInfo[status];
			}
			return enemy;
		} else return enemy[name];
	}
	core.control.registerReplayAction("help", function (action) {
		if (!action || action.indexOf("help") !== 0) return false;
		core.insertAction([{ type: "insert", name: "游戏说明" }]);
		return true;
	});
},
    "函数修复": function () {
	// 修复，现在选择不存在时报错
	events.prototype.__action_choices_replaying = function (data, index) {
		var selection = index;
		if (index != 'none') {
			selection = parseInt(index);
			if (isNaN(selection)) return false;
			if (selection < 0) selection += data.choices.length;
			if (selection < 0) return false;
			if (selection % 100 > 50) selection += data.choices.length;
			if (selection % 100 > data.choices.length) return false;
			var timeout = Math.floor(selection / 100) || 0;
			core.setFlag('timeout', timeout);
			selection %= 100;
		} else core.setFlag('timeout', 0);
		core.status.event.selection = selection;
		setTimeout(function () {
			core.status.route.push("choices:" + index);
			if (selection != 'none') {
				// 检查
				var choice = data.choices[selection];
				if (!choice || (choice.need != null && choice.need != '' && !core.calValue(choice.need))) {
					// 无法选择此项
					core.control._replay_error("无法选择项：" + index);
					return;
				} else {
					core.insertAction(choice.action);
				}
			}
			core.doAction();
		}, core.status.replay.speed == 24 ? 1 : 750 / Math.max(1, core.status.replay.speed));
		return true;
	}
	control.prototype.getRealStatusOrDefault = function (status, name) {
		if (status && name in status)
			return Math.floor(status[name]);
		return Math.floor(this.getStatus(name) * this.getBuff(name));
	}
	//临界函数修复，现在会计入敌人的额外属性加成
	enemys.prototype._nextCriticals_overAtk = function (enemy, x, y, floorId) {
		var hero_atk = core.getRealStatusOrDefault(null, 'atk');
		var enemyInfo = core.enemys.getEnemyInfo(enemy, null, x, y, floorId);
		var calNext = function (currAtk, maxAtk) {
			var start = currAtk,
				end = maxAtk;
			if (start > end) return null;

			while (start < end) {
				var mid = Math.floor((start + end) / 2);
				if (mid - start > end - mid) mid--;
				var nextInfo = core.enemys.getDamageInfo(enemy, { "atk": mid }, x, y, floorId);
				if (nextInfo != null) end = mid;
				else start = mid + 1;
			}
			var nextInfo = core.enemys.getDamageInfo(enemy, { "atk": start }, x, y, floorId);
			return nextInfo == null ? null : [start - hero_atk, nextInfo];
		}
		return calNext(hero_atk + 1,
			enemyInfo.hp + enemyInfo.def);
	}
	//临界计算现在会以当前勇士攻击力为准，也就是会计入buff
	enemys.prototype._nextCriticals_useBinarySearch = function (enemy, info, number, x, y, floorId) {
		var mon_hp = info.mon_hp,
			hero_atk = core.getRealStatusOrDefault(null, 'atk'),
			mon_def = info.mon_def,
			pre = info.damage;
		var list = [];
		var start_atk = hero_atk;
		if (info.__over__) {
			start_atk += info.__overAtk__;
			list.push([info.__overAtk__, -info.damage]);
		}
		var calNext = function (currAtk, maxAtk) {
			var start = Math.floor(currAtk),
				end = Math.floor(maxAtk);
			if (start > end) return null;

			while (start < end) {
				var mid = Math.floor((start + end) / 2);
				if (mid - start > end - mid) mid--;
				var nextInfo = core.enemys.getDamageInfo(enemy, { "atk": mid }, x, y, floorId);
				if (nextInfo == null || (typeof nextInfo == 'number')) return null;
				if (pre > nextInfo.damage) end = mid;
				else start = mid + 1;
			}
			var nextInfo = core.enemys.getDamageInfo(enemy, { "atk": start }, x, y, floorId);
			return nextInfo == null || (typeof nextInfo == 'number') || nextInfo.damage >= pre ? null : [start, nextInfo.damage];
		}
		var currAtk = start_atk;
		while (true) {
			var next = calNext(currAtk + 1, mon_hp + mon_def, pre);
			if (next == null) break;
			currAtk = next[0];
			pre = next[1];
			list.push([currAtk - hero_atk, info.damage - pre]);
			if (pre <= 0 && !core.flags.enableNegativeDamage) break;
			if (list.length >= number) break;
		}
		if (list.length == 0) list.push([0, 0]);
		return list;
	}
	// 函数修复，之前当运动回原地时会直接删除怪物数据
	events.prototype.moveEnemyOnPoint = function (fromX, fromY, toX, toY, floorId, norefresh) {
		if (fromX === toX && fromY === toY) return;
		floorId = floorId || core.status.floorId;
		if (((flags.enemyOnPoint || {})[floorId] || {})[fromX + "," + fromY]) {
			flags.enemyOnPoint[floorId][toX + "," + toY] = flags.enemyOnPoint[floorId][fromX + "," + fromY];
			delete flags.enemyOnPoint[floorId][fromX + "," + fromY];
			if (!norefresh) core.updateStatusBar();
		}
	}
	// 函数修复，转变时应该删除全局动画
	maps.prototype.setBgFgBlock = function (name, number, x, y, floorId) {
		floorId = floorId || core.status.floorId;
		if (!floorId || number == null || x == null || y == null) return;
		if (x < 0 || x >= core.floors[floorId].width || y < 0 || y >= core.floors[floorId].height) return;
		if (!name || (!name.startsWith('bg') && !name.startsWith('fg'))) return;

		if (typeof number == 'string') {
			if (/^\d+$/.test(number)) number = parseInt(number);
			else number = core.getNumberById(number);
		}

		var values = core.getFlag('__' + name + 'v__', {});
		values[floorId] = (values[floorId] || []).filter(function (one) { return one[0] != x || one[1] != y });
		values[floorId].push([x, y, number]);
		core.setFlag('__' + name + 'v__', values);

		core.status[name + "maps"][floorId] = null;

		if (floorId == core.status.floorId) {
			core.clearMap(name);
			core.removeGlobalAnimate(x, y, name);
			if (name.startsWith('bg')) core.drawBg(floorId);
			else core.drawFg(floorId);
		}
	}
	// 函数修复，隐藏时应该删除全局动画
	maps.prototype._triggerBgFgMap = function (type, name, loc, floorId, callback) {
		if (type != 'show') type = 'hide';
		if (!name || (!name.startsWith('bg') && !name.startsWith('fg'))) return;
		if (typeof loc[0] == 'number' && typeof loc[1] == 'number')
			loc = [loc];
		floorId = floorId || core.status.floorId;
		if (!floorId) return;

		if (loc.length == 0) return;
		var disabled = core.getFlag('__' + name + 'd__', {});
		disabled[floorId] = disabled[floorId] || [];
		loc.forEach(function (t) {
			if (type == 'hide') {
				disabled[floorId].push([t[0], t[1]]);
				core.removeGlobalAnimate(t[0], t[1], name);
			} else {
				disabled[floorId] = disabled[floorId].filter(function (one) { return one[0] != t[0] || one[1] != t[1] });
			}
		})
		core.setFlag('__' + name + 'd__', disabled);

		core.status[name + "maps"][floorId] = null;

		if (floorId == core.status.floorId) {
			core.redrawMap();
		}
		if (callback) callback();
	}
	// 函数修复，重绘时应该删除全局动画
	maps.prototype.redrawMap = function () {
		core.bigmap.canvas.forEach(function (one) {
			core.clearMap(one);
		});
		core.removeGlobalAnimate();
		this._drawMap_drawAll(null, { redraw: true });
		core.drawDamage();
	}
	//录像中存档
	control.prototype._replay_SL = function () {
		if (!core.isPlaying() || !core.isReplaying()) return;
		if (!core.status.replay.pausing) {
			core.playSound('操作失败');
			return core.drawTip("请先暂停录像");
		}
		if (core.isMoving() || core.status.replay.animate || core.status.event.id) {
			core.playSound('操作失败');
			return core.drawTip("请等待当前事件的处理结束");
		}
		if (core.hasFlag('__forbidSave__')) {
			core.playSound('操作失败');
			return core.drawTip('当前禁止存档');
		}
		if (core.dymCanvas.replay)
			core.dymCanvas.replay.canvas.style.display = 'none';

		core.lockControl();
		core.status.event.id = 'save';
		var saveIndex = core.saves.saveIndex;
		var page = parseInt((saveIndex - 1) / 5),
			offset = saveIndex - 5 * page;

		core.ui._drawSLPanel(10 * page + offset);
	}
	//函数修复，增加选项不存在时的报错
	events.prototype.__action_choices_replaying = function (data, index) {
		var selection = index;
		if (index != 'none') {
			selection = parseInt(index);
			if (isNaN(selection)) return false;
			if (selection < 0) selection += data.choices.length;
			if (selection < 0) return false;
			if (selection % 100 > 50) selection += data.choices.length;
			if (selection % 100 > data.choices.length) return false;
			var timeout = Math.floor(selection / 100) || 0;
			core.setFlag('timeout', timeout);
			selection %= 100;
		} else core.setFlag('timeout', 0);
		core.status.event.selection = selection;
		setTimeout(function () {
			core.status.route.push("choices:" + index);
			if (selection != 'none') {
				// 检查
				var choice = data.choices[selection];
				if (!choice || (choice.need != null && choice.need != '' && !core.calValue(choice.need))) {
					// 无法选择此项
					core.control._replay_error("无法选择项：" + index);
					return;
				} else {
					core.insertAction(choice.action);
				}
			}
			core.doAction();
		}, core.status.replay.speed == 24 ? 1 : 750 / Math.max(1, core.status.replay.speed));
		return true;
	}
	//函数修复，敌人不存在时返回空
	enemys.prototype.getEnemyInfo = function (enemy, hero, x, y, floorId) {
		if (enemy == null) return null;
		if (typeof enemy == 'string') enemy = core.material.enemys[enemy];
		if (!enemy) return null;
		return this.enemydata.getEnemyInfo(enemy, hero, x, y, floorId)
	}
	////// 绘制帮助页面 //////
	ui.prototype._drawHelp = function () {
		core.playSound('打开界面');
		core.clearUI();
		if (core.material.images.keyboard) {
			core.status.event.id = 'help';
			core.lockControl();
			core.setAlpha('ui', 1);
			core.fillRect('ui', 0, 0, this.PIXEL, this.PIXEL, '#000000');
			core.drawImage('ui', core.material.images.keyboard, 0, 0, 352, 352);
		} else {
			core.drawText([
				"\t[键盘快捷键列表]" +
				"[CTRL] 跳过对话   [Z] 转向\n" +
				"[X] " + core.material.items['book'].name + "   [G] " + core.material.items['fly'].name + "\n" +
				"[A] 读取自动存档   [W] 撤销读取自动存档\n" +
				"[S/D] 存读档页面   [SPACE] 轻按\n" +
				"[V] 快捷商店   [ESC] 系统菜单\n" +
				"[T] 道具页面   [Q] 装备页面\n" +
				"[B] 数据统计   [H] 帮助页面\n" +
				"[R] 回放录像   [E] 显示光标\n" +
				"[N] 返回标题页面   [P] 游戏主页\n" +
				"[O] 查看工程   [F7] 打开debug穿墙模式\n" +
				"[PgUp/PgDn] 浏览地图\n" +
				"[1~4] 快捷使用破炸飞和其他道具\n" +
				"[Alt+0~9] 快捷换装",
				"\t[鼠标操作]" +
				"点状态栏中图标： 进行对应的操作\n" +
				"点任意块： 寻路并移动\n" +
				"点任意块并拖动： 指定寻路路线\n" +
				"双击空地： 瞬间移动\n" +
				"单击勇士： 转向\n" +
				"双击勇士： 轻按（仅在轻按开关打开时有效）\n" +
				"长按任意位置：跳过剧情对话或打开虚拟键盘"
			]);
		}
	}
	//缩略图不应该更新地图缓存
	maps.prototype._drawThumbnail_realDrawTempCanvas = function (floorId, blocks, options) {
		// 缩略图：背景
		this.drawBg(floorId, options);
		// 缩略图：事件
		this.drawEvents(floorId, blocks, options);
		// 缩略图：勇士
		if (options.heroLoc) {
			options.heroIcon = options.heroIcon || core.status.hero.image || 'hero.png';
			options.heroIcon = core.getMappedName(options.heroIcon);
			var icon = core.material.icons.hero[options.heroLoc.direction];
			var height = core.material.images.images[options.heroIcon].height / 4;
			var width = (core.material.images.images[options.heroIcon].width || 128) / 4;
			core.drawImage(options.ctx, core.material.images.images[options.heroIcon], icon.stop * width, icon.loc * height, width, height,
				32 * options.heroLoc.x + 32 - width, 32 * options.heroLoc.y + 32 - height, width, height);
		}
		// 缩略图：前景
		this.drawFg(floorId, options);
		// 缩略图：显伤
		if (options.damage && core.hasItem('book')) {
			core.updateCheckBlock(floorId);
			core.control.updateDamage(floorId, options.ctx);
		}

		// =========== 新增代码：清理缓存 ===========
		// 强制清除当前楼层的 bg/fg 缓存，防止缩略图生成的脏数据污染实际游戏
		if (core.status.bgmaps) core.status.bgmaps[floorId] = null;
		if (core.status.fgmaps) core.status.fgmaps[floorId] = null;
		// =======================================
	}

},
    "楼传": function () {
	// 判定指定楼层两点间能否瞬移连通
	this.canConnect = function (fromX, fromY, toX, toY, floorId) {

		const floor = core.floors[floorId];

		// 检查坐标是否在楼层范围内
		const isCoordValid = (x, y) => x >= 0 && y >= 0 && x < floor.width && y < floor.height;
		if (!isCoordValid(fromX, fromY) || !isCoordValid(toX, toY)) {
			return false;
		}

		// 起点终点相同，直接判定可连通
		if (fromX === toX && fromY === toY) {
			return true;
		}



		// 步骤3：起点合法性检查
		if (!_canConnect_checkStartPoint(fromX, fromY, floorId)) {
			return false;
		}

		// 步骤4：生成目标楼层的可移动数组
		const canMoveArray = core.maps.generateMovableArray(floorId);
		if (!canMoveArray) {
			return false;
		}

		// 步骤5：获取目标楼层的地图数据
		const blocksObj = core.maps.getMapBlocksObj(floorId); // 需适配floorId参数
		const bgMap = core.maps.getBgMapArray(floorId); // 需适配floorId参数

		// 步骤6：BFS遍历检查路径连通性
		return _canConnect_bfs(fromX, fromY, toX, toY, floorId, canMoveArray, blocksObj, bgMap);
	};


	// 辅助：起点合法性检查（适配floorId，移除勇者绑定）
	_canConnect_checkStartPoint = function (sx, sy, floorId) {
		const key = sx + "," + sy;
		core.updateCheckBlock(floorId)
		if (core.flags.checkBlock[floorId].damage[key]) return false;
		const block = core.getBlock(sx, sy, floorId);
		if (block != null) {
			// 仅起点是传送点（trigger=changeFloor）时允许
			return block.event?.trigger === 'changeFloor';
		}
		return true;
	};

	// 辅助：BFS遍历检查路径连通性（适配floorId，移除勇者绑定）
	_canConnect_bfs = function (sx, sy, ex, ey, floorId, canMoveArray, blocksObj, bgMap) {
		const floor = core.floors[floorId];
		const visited = {}; // 记录已访问坐标：{ "x,y": true }
		const queue = [sx + "," + sy]; // BFS队列
		visited[sx + "," + sy] = true;

		while (queue.length > 0) {
			const currKey = queue.shift();
			const [currX, currY] = currKey.split(",").map(Number);

			// 遍历所有移动方向（left/down/up/right）
			for (const direction in core.utils.scan) {
				// 检查当前位置能否朝该方向移动
				if (!core.inArray(canMoveArray[currX][currY], direction)) continue;

				// 计算下一个坐标
				const dx = core.utils.scan[direction].x;
				const dy = core.utils.scan[direction].y;
				const nx = currX + dx;
				const ny = currY + dy;
				const nextKey = nx + "," + ny;

				// 坐标越界检查
				if (nx < 0 || ny < 0 || nx >= floor.width || ny >= floor.height) continue;
				// 已访问过则跳过
				if (visited[nextKey]) continue;

				// 【缺少逻辑】：core.onSki 需适配floorId，检查目标楼层的滑冰区
				//if (core.onSki?.(bgMap[ny][nx])) continue;

				// 检查下一个点是否符合瞬移条件
				if (!_canConnect_checkNextPoint(blocksObj, nx, ny, floorId)) continue;

				// 标记已访问
				visited[nextKey] = true;

				// 到达终点：检查终点是否可作为瞬移目标
				if (nx === ex && ny === ey) {
					const endBlock = blocksObj[nextKey];
					// 终点有可触发事件且未禁用 → 不可瞬移
					if (endBlock && !endBlock.disable && endBlock.event?.trigger) {
						return false;
					}
					return true;
				}

				// 加入队列继续遍历
				queue.push(nextKey);
			}
		}

		// BFS遍历完未找到终点
		return false;
	};

	// 辅助：检查下一个点是否符合瞬移条件（适配floorId，移除勇者绑定）
	_canConnect_checkNextPoint = function (blocksObj, x, y, floorId) {
		const key = x + "," + y;
		const block = blocksObj[key];

		// 1. 检查block是否不可通行/有脚本/有事件
		if (block && !block.disable) {
			if (block.event?.noPass || block.event?.script || block.event?.event) {
				return false;
			}

			// 2. 检查block的trigger（仅changeFloor且ignore时允许）
			if (block.event?.trigger) {
				if (block.event.trigger !== 'changeFloor') return false;
				let ignore = core.flags.ignoreChangeFloor;
				if (block.event.data && block.event.data.ignoreChangeFloor != null) {
					ignore = block.event.data.ignoreChangeFloor;
				}
				if (!ignore) return false;
			}
		}
		core.updateCheckBlock(floorId)
		// 3. 检查伤害/击退/捕捉（需适配floorId）

		if (core.flags.checkBlock[floorId].damage[key]) return false;
		if (core.flags.checkBlock[floorId].repulse[key]) return false;
		if (core.flags.checkBlock[floorId].ambush[key]) return false;

		return true;
	};
	this.floorTofloor = function (floorId) {
		// 2. 提取重复计算的变量，提升性能和可读性
		const currentFloorIndex = core.floorIds.indexOf(core.status.floorId); //当前楼层索引
		const targetFloorIndex = core.floorIds.indexOf(floorId); //目标楼层索引

		// 3. 处理无效楼层ID（不在列表中）
		if (targetFloorIndex === -1) {
			return false;
		}
		if (main.floors[floorId].isHide) return true
		// 4. 优先判断原地传（减少不必要计算）
		if (floorId === core.status.floorId) {
			const floorDown = main.floors[floorId].downFloor;
			core.flags.popfly = floorId
			return core.canMoveDirectly(floorDown[0], floorDown[1]) !== -1;
		}

		const floorUp = main.floors[floorId].upFloor;
		const floorDown = main.floors[floorId].downFloor;

		// 5. 相邻楼层判断（核心逻辑）
		if (Math.abs(targetFloorIndex - currentFloorIndex) === 1) {
			if (currentFloorIndex === 0 || currentFloorIndex === 44) return true
			// 向上到相邻楼层
			if (targetFloorIndex > currentFloorIndex) {

				core.flags.popfly = core.status.floorId
				return core.plugin.canConnect(hero.loc.x, hero.loc.y, main.floors[core.status.floorId].upFloor[0], main.floors[core.status.floorId].upFloor[1], core.status.floorId)
			}
			// 向下到相邻楼层
			if (targetFloorIndex < currentFloorIndex) {

				core.flags.popfly = core.status.floorId
				return core.plugin.canConnect(hero.loc.x, hero.loc.y, main.floors[core.status.floorId].downFloor[0], main.floors[core.status.floorId].downFloor[1], core.status.floorId)
			}
		}

		// 6. 非相邻楼层：递归检查连通性（增加边界保护）
		// 向上递归
		if (targetFloorIndex > currentFloorIndex) {
			const prevFloorIndex = targetFloorIndex - 1;
			const prevFloorId = core.floorIds[prevFloorIndex];
			const floorUp = main.floors[prevFloorId].upFloor;
			const floorDown = main.floors[prevFloorId].downFloor;
			core.flags.popfly = prevFloorId
			if (main.floors[prevFloorId].isHide) return this.floorTofloor(prevFloorId)
			if (core.plugin.canConnect(floorUp[0], floorUp[1], floorDown[0], floorDown[1], prevFloorId)) {
				return this.floorTofloor(prevFloorId);
			}
		}

		// 向下递归
		if (targetFloorIndex < currentFloorIndex) {
			const nextFloorIndex = targetFloorIndex + 1;
			const nextFloorId = core.floorIds[nextFloorIndex];
			const floorUp = main.floors[nextFloorId].upFloor;
			const floorDown = main.floors[nextFloorId].downFloor;
			core.flags.popfly = nextFloorId
			if (main.floors[nextFloorId].isHide) return this.floorTofloor(nextFloorId)
			if (core.plugin.canConnect(floorUp[0], floorUp[1], floorDown[0], floorDown[1], nextFloorId)) {
				return this.floorTofloor(nextFloorId);
			}
		}

		// 7. 所有条件不满足时，明确返回false（默认返回值）
		return false;
	};
	core.flyTo = function (toId, callback) {
		// 楼层传送器的使用，从当前楼层飞往toId
		// 如果不能飞行请返回false

		var fromId = core.status.floorId;
		if (!core.getFlag('fly')) {
			if (!core.plugin.floorTofloor(toId)) {
				core.playSound('操作失败');
				core.drawTip("无法飞往" + core.status.maps[toId].title + "！" + "因为" + core.flags.popfly + "存在障碍", 'fly')
				return false
			}
		}
		// 检查能否飞行
		if (!core.status.maps[fromId].canFlyFrom || !core.status.maps[toId].canFlyTo || !core.hasVisitedFloor(toId)) {
			core.playSound('操作失败');
			core.drawTip("无法飞往" + core.status.maps[toId].title + "！", 'fly');
			return false;
		}

		// 平面塔模式
		var stair = null,
			loc = null;
		if (core.flags.flyRecordPosition) {
			loc = core.getFlag("__leaveLoc__", {})[toId] || null;
		}
		if (core.status.maps[toId].flyPoint != null && core.status.maps[toId].flyPoint.length == 2) {
			stair = 'flyPoint';
		}
		if (stair == null && loc == null) {
			// 获得两个楼层的索引，以决定是上楼梯还是下楼梯
			var fromIndex = core.floorIds.indexOf(fromId),
				toIndex = core.floorIds.indexOf(toId);
			var stair = fromIndex <= toIndex ? "downFloor" : "upFloor";
			// 地下层：同层传送至上楼梯
			if (fromIndex == toIndex && core.status.maps[fromId].underGround) stair = "upFloor";
		}

		// 记录录像
		core.status.route.push("fly:" + toId);
		// 传送
		core.ui.closePanel();
		core.setFlag('__isFlying__', true);
		core.changeFloor(toId, stair, loc, null, function () {
			core.removeFlag("__isFlying__");
			if (callback) callback();
		});

		return true;
	}
}
}