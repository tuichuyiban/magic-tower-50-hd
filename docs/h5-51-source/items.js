var items_296f5d02_12fd_4166_a7c1_b5e830c9ee3a = 
{
	"yellowKey": {
		"cls": "tools",
		"name": "黄钥匙",
		"text": "可以打开一扇黄门",
		"hideInToolbox": true,
		"hideInReplay": true
	},
	"blueKey": {
		"cls": "tools",
		"name": "兰钥匙",
		"text": "可以打开一扇蓝门",
		"hideInToolbox": true,
		"hideInReplay": true
	},
	"redKey": {
		"cls": "tools",
		"name": "红钥匙",
		"text": "可以打开一扇红门",
		"hideInToolbox": true,
		"hideInReplay": true
	},
	"redGem": {
		"cls": "items",
		"name": "红宝石",
		"text": "攻击+${core.values.redGem}",
		"itemEffect": "core.status.hero.atk += core.values.redGem * core.status.thisMap.ratio",
		"itemEffectTip": "你的攻击力增加 ${core.values.redGem * core.status.thisMap.ratio} 点",
		"useItemEffect": "core.status.hero.atk += core.values.redGem",
		"canUseItemEffect": "true"
	},
	"blueGem": {
		"cls": "items",
		"name": "蓝宝石",
		"text": "，防御+${core.values.blueGem}",
		"itemEffect": "core.status.hero.def += core.values.blueGem * core.status.thisMap.ratio",
		"itemEffectTip": "你的防御力增加 ${core.values.blueGem * core.status.thisMap.ratio} 点",
		"useItemEffect": "core.status.hero.def += core.values.blueGem",
		"canUseItemEffect": "true"
	},
	"greenGem": {
		"cls": "items",
		"name": "绿宝石",
		"text": "，护盾+${core.values.greenGem}",
		"itemEffect": "core.status.hero.mdef += core.values.greenGem * core.status.thisMap.ratio",
		"itemEffectTip": "，护盾+${core.values.greenGem * core.status.thisMap.ratio}",
		"useItemEffect": "core.status.hero.mdef += core.values.greenGem",
		"canUseItemEffect": "true"
	},
	"yellowGem": {
		"cls": "items",
		"name": "黄宝石",
		"text": "可以进行加点",
		"itemEffect": "core.status.hero.hp+=1000;core.status.hero.atk+=6;core.status.hero.def+=6;core.status.hero.mdef+=10;",
		"itemEffectTip": "，全属性提升",
		"useItemEvent": [
			{
				"type": "choices",
				"choices": [
					{
						"text": "攻击+1",
						"action": [
							{
								"type": "setValue",
								"name": "status:atk",
								"operator": "+=",
								"value": "1"
							}
						]
					},
					{
						"text": "防御+2",
						"action": [
							{
								"type": "setValue",
								"name": "status:def",
								"operator": "+=",
								"value": "2"
							}
						]
					},
					{
						"text": "生命+200",
						"action": [
							{
								"type": "setValue",
								"name": "status:hp",
								"operator": "+=",
								"value": "200"
							}
						]
					}
				]
			}
		],
		"canUseItemEffect": "true"
	},
	"redPotion": {
		"cls": "items",
		"name": "红血瓶",
		"text": "，生命+${core.values.redPotion}",
		"itemEffect": "core.status.hero.hp += core.values.redPotion * core.status.thisMap.ratio",
		"itemEffectTip": "你的生命增加了 ${core.values.redPotion * core.status.thisMap.ratio} 点",
		"useItemEffect": "core.status.hero.hp += core.values.redPotion",
		"canUseItemEffect": "true"
	},
	"bluePotion": {
		"cls": "items",
		"name": "蓝血瓶",
		"text": "，生命+${core.values.bluePotion}",
		"itemEffect": "core.status.hero.hp += core.values.bluePotion * core.status.thisMap.ratio",
		"itemEffectTip": "你的生命增加了 ${core.values.bluePotion * core.status.thisMap.ratio} 点",
		"useItemEffect": "core.status.hero.hp += core.values.bluePotion",
		"canUseItemEffect": "true"
	},
	"yellowPotion": {
		"cls": "items",
		"name": "黄血瓶",
		"text": "，生命+${core.values.yellowPotion}",
		"itemEffect": "core.status.hero.hp += core.values.yellowPotion * core.status.thisMap.ratio",
		"itemEffectTip": "，生命+${core.values.yellowPotion * core.status.thisMap.ratio}",
		"useItemEffect": "core.status.hero.hp += core.values.yellowPotion",
		"canUseItemEffect": "true"
	},
	"greenPotion": {
		"cls": "items",
		"name": "绿血瓶",
		"text": "，生命+${core.values.greenPotion}",
		"itemEffect": "core.status.hero.hp += core.values.greenPotion * core.status.thisMap.ratio",
		"itemEffectTip": "，生命+${core.values.greenPotion * core.status.thisMap.ratio}",
		"useItemEffect": "core.status.hero.hp += core.values.greenPotion",
		"canUseItemEffect": "true"
	},
	"sword0": {
		"cls": "items",
		"name": "破旧的剑",
		"text": "一把已经生锈的剑",
		"equip": {
			"type": 0,
			"animate": "sword",
			"value": {
				"atk": 0
			}
		},
		"itemEffect": "core.status.hero.atk += 0",
		"itemEffectTip": "，攻击+0"
	},
	"sword1": {
		"cls": "items",
		"name": "铁剑",
		"text": "一把很普通的铁剑",
		"equip": {
			"type": 0,
			"animate": "sword",
			"value": {
				"atk": 10
			}
		},
		"itemEffect": "core.status.hero.atk += 10; core.setFlag('nowWeapon', 'sword1');",
		"itemEffectTip": "你得到了铁剑，攻击力增加10点"
	},
	"sword2": {
		"cls": "items",
		"name": "银剑",
		"text": "一把很普通的银剑",
		"equip": {
			"type": 0,
			"animate": "sword",
			"value": {
				"atk": 20
			}
		},
		"itemEffect": "core.status.hero.atk += 20; core.setFlag('nowWeapon', 'sword2');",
		"itemEffectTip": "你得到了银剑，攻击力增加20点"
	},
	"sword3": {
		"cls": "items",
		"name": "骑士剑",
		"text": "一把很普通的骑士剑",
		"equip": {
			"type": 0,
			"animate": "sword",
			"value": {
				"atk": 40
			}
		},
		"itemEffect": "core.status.hero.atk += 40; core.setFlag('nowWeapon', 'sword3');",
		"itemEffectTip": "你得到了骑士剑，攻击力增加40点"
	},
	"sword4": {
		"cls": "items",
		"name": "圣剑",
		"text": "一把很普通的圣剑",
		"equip": {
			"type": 0,
			"animate": "sword",
			"value": {
				"atk": 80
			}
		},
		"itemEffect": "core.status.hero.atk += 50; core.setFlag('nowWeapon', 'sword4');",
		"itemEffectTip": "你得到了圣剑，攻击力增加50点"
	},
	"sword5": {
		"cls": "items",
		"name": "神圣剑",
		"text": "一把很普通的神圣剑",
		"equip": {
			"type": 0,
			"animate": "sword",
			"value": {
				"atk": 160
			}
		},
		"itemEffect": "core.status.hero.atk += 100; core.setFlag('nowWeapon', 'sword5');",
		"itemEffectTip": "你得到了神圣剑，攻击力增加100点"
	},
	"shield0": {
		"cls": "items",
		"name": "破旧的盾",
		"text": "一个很破旧的铁盾",
		"equip": {
			"type": 1,
			"value": {
				"def": 0
			}
		},
		"itemEffect": "core.status.hero.def += 0",
		"itemEffectTip": "你得到了破旧的盾，防御力增加0点"
	},
	"shield1": {
		"cls": "items",
		"name": "铁盾",
		"text": "一个很普通的铁盾",
		"equip": {
			"type": 1,
			"value": {
				"def": 10
			}
		},
		"itemEffect": "core.status.hero.def += 10; core.setFlag('nowShield', 'shield1');",
		"itemEffectTip": "你得到了铁盾，防御力增加10点"
	},
	"shield2": {
		"cls": "items",
		"name": "银盾",
		"text": "一个很普通的银盾",
		"equip": {
			"type": 1,
			"value": {
				"def": 20
			}
		},
		"itemEffect": "core.status.hero.def += 20; core.setFlag('nowShield', 'shield2');",
		"itemEffectTip": "你得到了银盾，防御力增加20点"
	},
	"shield3": {
		"cls": "items",
		"name": "骑士盾",
		"text": "一个很普通的骑士盾",
		"equip": {
			"type": 1,
			"value": {
				"def": 40
			}
		},
		"itemEffect": "core.status.hero.def += 40; core.setFlag('nowShield', 'shield3');",
		"itemEffectTip": "你得到了骑士盾，防御力增加40点"
	},
	"shield4": {
		"cls": "items",
		"name": "圣盾",
		"text": "一个很普通的圣盾",
		"equip": {
			"type": 1,
			"value": {
				"def": 80
			}
		},
		"itemEffect": "core.status.hero.def += 50; core.setFlag('nowShield', 'shield4');",
		"itemEffectTip": "你得到了圣盾，防御力增加50点"
	},
	"shield5": {
		"cls": "items",
		"name": "神圣盾",
		"text": "一个很普通的神圣盾",
		"equip": {
			"type": 1,
			"value": {
				"def": 100,
				"mdef": 100
			}
		},
		"itemEffect": "core.status.hero.def += 100;\ncore.setFlag('nowShield', 'shield5');\ncore.setFlag('魔法免疫', true);",
		"itemEffectTip": "你得到了 神圣盾，可以忽略魔法攻击了"
	},
	"superPotion": {
		"cls": "tools",
		"name": "圣水",
		"itemEffect": null,
		"itemEffectTip": "你得到 圣水 按攻击和防御提升生命点数",
		"useItemEffect": "var hp = Math.round(0.74 * (core.status.hero.atk + core.status.hero.def)) * 10\ncore.status.hero.hp += hp;\ncore.insertAction([\n\t{ \"type\": \"playSound\", \"name\": \"获得道具\" },\n\t{ \"type\": \"tip\", \"text\": \"使用圣水，增加 \" + hp + \" 生命\" },\n]);",
		"canUseItemEffect": "true",
		"text": "使用后获得 round(0.74 * (攻击 + 防御)) * 10 点生命",
		"hideInToolbox": true,
		"hideInReplay": true
	},
	"book": {
		"cls": "constants",
		"name": "游戏手册",
		"text": "察看敌人参数",
		"hideInToolbox": true,
		"useItemEffect": "core.ui.drawBook(0);",
		"canUseItemEffect": "true",
		"hideInReplay": true,
		"itemEffectTip": "你得到 游戏手册，察看敌人参数"
	},
	"fly": {
		"cls": "constants",
		"name": "魔杖",
		"text": "可以飞往到过的楼层",
		"hideInReplay": true,
		"hideInToolbox": true,
		"useItemEffect": "core.ui.drawFly(core.floorIds.indexOf(core.status.floorId));",
		"canUseItemEffect": "(function () {\n\tif (!core.status.maps[core.status.floorId].canFlyFrom) {\n\t\tcore.drawTip(core.material.items['fly'].name + \"似乎失效了\", 'fly');\n\t\treturn false;\n\t}\n\tif (core.nearStair() || !core.flags.flyNearStair) {\n\t\treturn true;\n\t} else {\n\t\tif (!core.getFlag('额外功能开关') && core.flags.flyNearStair) {\n\t\t\tcore.drawTip(\"只有在楼梯边才能使用\" + core.material.items['fly'].name, 'fly');\n\t\t\treturn false;\n\t\t}\n\t\t// ===== 额外功能开启 =====\n\t\tif (core.getFlag('额外功能开关')) {\n\t\t\tif (!core.maps._canMoveDirectly_checkGlobal()) {\n\t\t\t\tcore.drawTip(\"当前不能瞬间移动\");\n\t\t\t\treturn false;\n\t\t\t}\n\t\t\tvar blocks = core.status.maps[core.status.floorId].blocks;\n\t\t\tif (!blocks) return false;\n\n\t\t\t// 四方向偏移\n\t\t\tvar dirs = [\n\t\t\t\t{ x: 1, y: 0 },\n\t\t\t\t{ x: -1, y: 0 },\n\t\t\t\t{ x: 0, y: 1 },\n\t\t\t\t{ x: 0, y: -1 }\n\t\t\t];\n\n\t\t\tvar fp = [\"portal\", \"upFloor\", \"downFloor\"]\n\n\t\t\tfor (var i = 0; i < blocks.length; i++) {\n\t\t\t\tvar block = blocks[i];\n\t\t\t\tif (!block || !block.event) continue;\n\n\t\t\t\tvar id = block.event.id;\n\t\t\t\tif (!fp.includes(id)) continue;\n\n\t\t\t\tvar sx = block.x,\n\t\t\t\t\tsy = block.y;\n\n\t\t\t\tfor (var direction in core.utils.scan) {\n\t\t\t\t\tvar delta = core.utils.scan[direction];\n\t\t\t\t\tvar tx = sx + delta.x,\n\t\t\t\t\t\tty = sy + delta.y;\n\n\t\t\t\t\tif (core.canMoveDirectly(tx, ty) >= 0) {\n\t\t\t\t\t\treturn true;\n\t\t\t\t\t}\n\t\t\t\t}\n\t\t\t}\n\t\t\tcore.drawTip(\"无法到达任何一个楼梯边\");\n\t\t\treturn false;\n\t\t}\n\n\t}\n\treturn false;\n})();",
		"itemEffectTip": "你得到 魔杖 可以飞往到过的楼层"
	},
	"coin": {
		"cls": "constants",
		"name": "幸运金币",
		"text": "战后获得双倍金钱",
		"hideInToolbox": true,
		"hideInReplay": true,
		"itemEffectTip": "你得到 幸运金币 战后获得双倍金钱"
	},
	"snow": {
		"cls": "constants",
		"name": "冰魔法",
		"text": "可冻结熔岩",
		"useItemEffect": "(function () {\n\tvar success = false;\n\n\tvar snowFourDirections = true; // 是否多方向雪花；如果是将其改成true\n\tif (snowFourDirections) {\n\t\t// 多方向雪花\n\t\tfor (var direction in core.utils.scan) { // 多方向雪花默认四方向，如需改为八方向请将这两个scan改为scan2\n\t\t\tvar delta = core.utils.scan[direction];\n\t\t\tvar nx = core.getHeroLoc('x') + delta.x,\n\t\t\t\tny = core.getHeroLoc('y') + delta.y;\n\t\t\tif (core.getBlockId(nx, ny) == 'lava') {\n\t\t\t\tcore.removeBlock(nx, ny);\n\t\t\t\tsuccess = true;\n\t\t\t}\n\t\t}\n\t} else {\n\t\tif (core.getBlockId(core.nextX(), core.nextY()) == 'lava') {\n\t\t\tcore.removeBlock(core.nextX(), core.nextY());\n\t\t\tsuccess = true;\n\t\t}\n\t}\n\n\tif (success) {\n\t\tcore.playSound('打开界面');\n\t\tcore.drawTip(core.material.items[itemId].name + '使用成功', itemId);\n\t} else {\n\t\tcore.playSound('操作失败');\n\t\tcore.drawTip(\"当前无法使用\" + core.material.items[itemId].name, itemId);\n\t\tcore.addItem(itemId, 1);\n\t\treturn;\n\t}\n})();",
		"canUseItemEffect": "true",
		"hideInToolbox": true,
		"hideInReplay": true,
		"itemEffectTip": "你学会 冰魔法 可冻结熔岩"
	},
	"cross": {
		"cls": "constants",
		"name": "十字架",
		"text": "对吸血鬼和兽人攻击力加倍",
		"hideInToolbox": true,
		"hideInReplay": true,
		"itemEffectTip": "你得到 十字架 对吸血鬼和兽人攻击力加倍"
	},
	"knife": {
		"cls": "constants",
		"name": "屠龙匕首",
		"text": "对龙攻击力加倍",
		"hideInToolbox": true,
		"hideInReplay": true,
		"itemEffectTip": "你得到 屠龙匕 对龙攻击力加倍"
	},
	"amulet": {
		"cls": "constants",
		"name": "护符",
		"text": "持有时无视负面地形",
		"hideInToolbox": true,
		"hideInReplay": true
	},
	"bigKey": {
		"cls": "tools",
		"name": "魔法钥匙",
		"text": "可打开一层楼所有的黄门",
		"itemEffect": null,
		"itemEffectTip": "你得到 魔法钥匙 可打开一层楼所有的黄门",
		"useItemEffect": "(function () {\n\tvar actions = core.searchBlock(\"yellowDoor\").map(function (block) {\n\t\treturn { \"type\": \"openDoor\", \"loc\": [block.x, block.y], \"async\": true };\n\t});\n\tactions.push({ \"type\": \"waitAsync\" });\n\tactions.push({ \"type\": \"tip\", \"text\": core.material.items[itemId].name + \"使用成功\" });\n\tcore.insertAction(actions);\n})();",
		"canUseItemEffect": "true",
		"hideInToolbox": true,
		"hideInReplay": true
	},
	"greenKey": {
		"cls": "tools",
		"name": "绿钥匙",
		"text": "可以打开一扇绿门",
		"hideInToolbox": true,
		"hideInReplay": true
	},
	"steelKey": {
		"cls": "tools",
		"name": "铁门钥匙",
		"text": "可以打开一扇铁门",
		"hideInToolbox": true,
		"hideInReplay": true
	},
	"pickaxe": {
		"cls": "tools",
		"name": "镐",
		"text": "可破坏你周围的堵墙",
		"useItemEffect": "(function () {\n\tvar canBreak = function (x, y) {\n\t\tvar block = core.getBlock(x, y);\n\t\tif (block == null || block.disable) return false;\n\t\treturn block.event.canBreak;\n\t};\n\tlet todo = [];\n\tfor (var direction in core.utils.scan) { // 多方向破默认四方向，如需改成八方向请将这两个scan改为scan2\n\t\tvar delta = core.utils.scan[direction];\n\t\tvar nx = core.getHeroLoc('x') + delta.x,\n\t\t\tny = core.getHeroLoc('y') + delta.y;\n\t\tif (canBreak(nx, ny)) {\n\t\t\tcore.push(todo, { \"type\": \"openDoor\", \"loc\": [nx, ny], \"async\": true });\n\t\t\t//core.removeBlock(nx, ny);\n\t\t}\n\t}\n\tcore.push(todo, { \"type\": \"waitAsync\" });\n\tcore.insertAction(todo);\n\n\tcore.playSound('破墙镐');\n\t//core.drawTip(core.material.items[itemId].name + '使用成功', itemId);\n})();",
		"canUseItemEffect": "true",
		"hideInToolbox": true,
		"hideInReplay": true,
		"itemEffectTip": "你得到 镐 可破坏你周围的堵墙"
	},
	"icePickaxe": {
		"cls": "tools",
		"name": "破冰镐",
		"text": "可以破坏勇士面前的一堵冰墙",
		"useItemEffect": "(function () {\n\tcore.drawTip(core.material.items[itemId].name + '使用成功', itemId);\n\tcore.insertAction({ \"type\": \"openDoor\", \"loc\": [\"core.nextX()\", \"core.nextY()\"] });\n})();",
		"canUseItemEffect": "(function () {\n\treturn core.getBlockId(core.nextX(), core.nextY()) == 'ice';\n})();",
		"hideInToolbox": true,
		"hideInReplay": true
	},
	"bomb": {
		"cls": "tools",
		"name": "炸弹",
		"text": "可炸死你周围的敌人",
		"useItemEffect": "(function () {\n\tvar bombList = [],\n\t\ttodo = [],\n\t\tmoney = 0;\n\tvar heroX = core.getHeroLoc('x'),\n\t\theroY = core.getHeroLoc('y');\n\n\t// 用于记录需要移除的坐标，格式为 \"x,y\": true\n\tvar targets = {};\n\n\t// 检查可炸目标\n\tvar canBomb = function (x, y) {\n\t\tvar block = core.getBlock(x, y);\n\t\tif (block && !block.disable && block.event.trigger === 'battle' && block.event.cls.indexOf('enemy') === 0) {\n\t\t\tvar enemy = core.material.enemys[block.event.id];\n\t\t\tvar hp = core.getEnemyValue(enemy, 'hp', x, y);\n\t\t\treturn hp < 500;\n\t\t}\n\t};\n\n\t// 预处理炸弹逻辑（只计算数据和标记，不移除）\n\tvar prepareBomb = function (x, y) {\n\t\tif (!canBomb(x, y)) return;\n\t\tbombList.push([x, y]);\n\n\t\t// 标记该坐标需要移除\n\t\ttargets[x + \",\" + y] = true;\n\n\t\tvar enemy = core.material.enemys[core.getBlockId(x, y)];\n\t\tmoney += core.getEnemyInfo(enemy, null, x, y).money || 0;\n\t\tcore.push(todo, core.floors[core.status.floorId].afterBattle[x + \",\" + y]);\n\t\tcore.push(todo, enemy.afterBattle);\n\t};\n\n\t// 扫描四周\n\tvar scan = core.utils.scan;\n\tfor (var direction in scan) {\n\t\tvar delta = scan[direction];\n\t\tprepareBomb(heroX + delta.x, heroY + delta.y);\n\t}\n\n\t// 如果有目标被炸到，执行批量移除\n\tif (bombList.length > 0) {\n\t\tvar indexes = [];\n\t\t// 遍历当前地图所有图块，寻找匹配的坐标\n\t\t// 这样只需要遍历一次 blocks 数组，而不是每个方向遍历一次\n\t\tfor (var index in core.status.thisMap.blocks) {\n\t\t\tvar block = core.status.thisMap.blocks[index];\n\t\t\tif (targets[block.x + \",\" + block.y]) {\n\t\t\t\tindexes.push(index);\n\t\t\t}\n\t\t}\n\t\t// 批量移除\n\t\tcore.removeBlockByIndexes(indexes);\n\t\tcore.redrawMap();\n\t}\n\n\tcore.playSound('炸弹');\n\tcore.drawTip(core.material.items[itemId].name + '使用成功，你获得了 ' + money + ' 金币');\n\tcore.status.hero.money += money;\n\n\t// 触发战后事件\n\tif (todo.length > 0) core.insertAction(todo);\n})();",
		"canUseItemEffect": "true",
		"hideInToolbox": true,
		"hideInReplay": true,
		"itemEffectTip": "你得到 炸弹 可炸死你周围的敌人"
	},
	"centerFly": {
		"cls": "tools",
		"name": "瞬移",
		"text": "可以飞向当前楼层中心对称的位置",
		"useItemEffect": "core.playSound('飞行器');\ncore.clearMap('hero');\ncore.setHeroLoc('x', core.bigmap.width - 1 - core.getHeroLoc('x'));\ncore.setHeroLoc('y', core.bigmap.height - 1 - core.getHeroLoc('y'));\ncore.drawHero();\ncore.setFlag('talking', 0);\ncore.drawTip(core.material.items[itemId].name + '使用成功');",
		"canUseItemEffect": "(function () {\n\tvar toX = core.bigmap.width - 1 - core.getHeroLoc('x'),\n\t\ttoY = core.bigmap.height - 1 - core.getHeroLoc('y');\n\tvar id = core.getBlockId(toX, toY);\n\treturn id === null || id === 'none' || id === 'airwall';\n})();",
		"hideInToolbox": true,
		"hideInReplay": true
	},
	"upFly": {
		"cls": "tools",
		"name": "向上传送",
		"text": "传送到楼上对应位置",
		"useItemEffect": "(function () {\n\tvar floorId = core.floorIds[core.floorIds.indexOf(core.status.floorId) + 1];\n\tif (core.status.event.id == 'action') {\n\t\tcore.insertAction([\n\t\t\t{ \"type\": \"changeFloor\", \"loc\": [core.getHeroLoc('x'), core.getHeroLoc('y')], \"floorId\": floorId },\n\t\t\t{ \"type\": \"tip\", \"text\": core.material.items[itemId].name + '使用成功' }\n\t\t]);\n\t} else {\n\t\tcore.changeFloor(floorId, null, core.status.hero.loc, null, function () {\n\t\t\tcore.drawTip(core.material.items[itemId].name + '使用成功');\n\t\t\tcore.replay();\n\t\t});\n\t}\n})();",
		"canUseItemEffect": "(function () {\n\tvar floorId = core.status.floorId,\n\t\tindex = core.floorIds.indexOf(floorId);\n\tif (index >= 49) {\n\t\tcore.drawTip('你已在最高层');\n\t\treturn false;\n\t}\n\tif (index < core.floorIds.length - 1) {\n\t\tvar toId = core.floorIds[index + 1],\n\t\t\ttoX = core.getHeroLoc('x'),\n\t\t\ttoY = core.getHeroLoc('y');\n\t\tvar mw = core.floors[toId].width,\n\t\t\tmh = core.floors[toId].height;\n\t\tif (toX >= 0 && toX < mw && toY >= 0 && toY < mh && core.getBlockId(toX, toY, toId) == null) {\n\t\t\treturn true;\n\t\t}\n\t}\n\tcore.drawTip('上一层此位置有东西');\n\treturn false;\n})();",
		"hideInToolbox": true,
		"hideInReplay": true,
		"itemEffectTip": "你得到 向上传送 传送到楼上对应位置"
	},
	"downFly": {
		"cls": "tools",
		"name": "向下传送",
		"text": "传送到楼下对应位置",
		"useItemEffect": "(function () {\n\tvar floorId = core.floorIds[core.floorIds.indexOf(core.status.floorId) - 1];\n\tif (core.status.event.id == 'action') {\n\t\tcore.insertAction([\n\t\t\t{ \"type\": \"changeFloor\", \"loc\": [core.getHeroLoc('x'), core.getHeroLoc('y')], \"floorId\": floorId },\n\t\t\t{ \"type\": \"tip\", \"text\": core.material.items[itemId].name + '使用成功' }\n\t\t]);\n\t} else {\n\t\tcore.changeFloor(floorId, null, core.status.hero.loc, null, function () {\n\t\t\tcore.drawTip(core.material.items[itemId].name + '使用成功');\n\t\t\tcore.replay();\n\t\t});\n\t}\n})();",
		"canUseItemEffect": "(function () {\n\tvar floorId = core.status.floorId,\n\t\tindex = core.floorIds.indexOf(floorId);\n\tif (index < 1) {\n\t\tcore.drawTip('你已在地下室');\n\t\treturn false;\n\t}\n\tvar toId = core.floorIds[index - 1],\n\t\ttoX = core.getHeroLoc('x'),\n\t\ttoY = core.getHeroLoc('y');\n\tvar mw = core.floors[toId].width,\n\t\tmh = core.floors[toId].height;\n\tif (toX >= 0 && toX < mw && toY >= 0 && toY < mh && core.getBlock(toX, toY, toId) == null) {\n\t\treturn true;\n\t}\n\tcore.drawTip('下一层此位置有东西');\n\treturn false;\n})();",
		"hideInToolbox": true,
		"hideInReplay": true,
		"itemEffectTip": "你得到 向下传送 传送到楼下对应位置"
	},
	"earthquake": {
		"cls": "tools",
		"name": "地震卷轴",
		"text": "可破坏一层楼的墙",
		"useItemEffect": "(function () {\n\tvar actions = core.searchBlockWithFilter(block => !block.disable && block.event.canBreak).map(function (block) {\n\t\treturn { \"type\": \"openDoor\", \"loc\": [block.x, block.y], \"async\": true };\n\t});\n\tactions.push({ \"type\": \"waitAsync\" });\n\tactions.push({ \"type\": \"tip\", \"text\": core.material.items[itemId].name + \"使用成功\" });\n\tcore.insertAction(actions);\n})();",
		"canUseItemEffect": "true",
		"hideInToolbox": true,
		"hideInReplay": true,
		"itemEffectTip": "你得到 地震卷 可破坏一层楼的墙"
	},
	"poisonWine": {
		"cls": "tools",
		"name": "解毒药水",
		"text": "可以解除中毒状态",
		"useItemEffect": "core.triggerDebuff('remove', 'poison');",
		"canUseItemEffect": "core.hasFlag('poison');"
	},
	"weakWine": {
		"cls": "tools",
		"name": "解衰药水",
		"text": "可以解除衰弱状态",
		"useItemEffect": "core.triggerDebuff('remove', 'weak');",
		"canUseItemEffect": "core.hasFlag('weak');"
	},
	"curseWine": {
		"cls": "tools",
		"name": "解咒药水",
		"text": "可以解除诅咒状态",
		"useItemEffect": "core.triggerDebuff('remove', 'curse');",
		"canUseItemEffect": "core.hasFlag('curse');"
	},
	"superWine": {
		"cls": "tools",
		"name": "万能药水",
		"text": "可以解除所有不良状态",
		"useItemEffect": "core.triggerDebuff('remove', ['poison', 'weak', 'curse']);",
		"canUseItemEffect": "(function() {\n\treturn core.hasFlag('poison') || core.hasFlag('weak') || core.hasFlag('curse');\n})();"
	},
	"hammer": {
		"cls": "tools",
		"name": "圣锤",
		"text": "消灭面前的怪物"
	},
	"lifeWand": {
		"cls": "constants",
		"name": "魔杖",
		"text": "可以飞往到过的楼层",
		"useItemEvent": [
			{
				"type": "setValue",
				"name": "item:fly",
				"value": "1"
			}
		],
		"canUseItemEffect": "true"
	},
	"jumpShoes": {
		"cls": "tools",
		"name": "跳跃靴",
		"text": "能跳跃到前方两格处",
		"useItemEffect": "core.playSound(\"跳跃\");\ncore.insertAction({ \"type\": \"jumpHero\", \"loc\": [core.nextX(2), core.nextY(2)] });",
		"canUseItemEffect": "(function () {\n\tvar nx = core.nextX(2),\n\t\tny = core.nextY(2);\n\treturn nx >= 0 && nx < core.bigmap.width && ny >= 0 && ny < core.bigmap.height && core.getBlockId(nx, ny) == null;\n})();"
	},
	"skill1": {
		"cls": "constants",
		"name": "技能：二倍斩",
		"text": "可以打开或关闭主动技能二倍斩",
		"hideInReplay": true,
		"useItemEffect": "(function () {\n\tvar skillValue = 1; // 技能的flag:skill值，可用于当前开启技能的判定；对于新技能可以依次改成2，3等等\n\tvar skillNeed = 5; // 技能的需求\n\tvar skillName = '二倍斩'; // 技能的名称\n\n\tif (core.getFlag('skill', 0) != skillValue) { // 判断当前是否已经开了技能\n\t\tif (core.getStatus('mana') >= skillNeed) { // 这里要写当前能否开技能的条件判断，比如魔力值至少要多少\n\t\t\tcore.playSound('打开界面');\n\t\t\tcore.setFlag('skill', skillValue); // 开技能1\n\t\t\tcore.setFlag('skillName', skillName); // 设置技能名\n\t\t} else {\n\t\t\tcore.playSound('操作失败');\n\t\t\tcore.drawTip('魔力不足，无法开启技能');\n\t\t}\n\t} else { // 关闭技能\n\t\tcore.setFlag('skill', 0); // 关闭技能状态\n\t\tcore.setFlag('skillName', '无');\n\t}\n})();",
		"canUseItemEffect": "true"
	},
	"wand": {
		"cls": "constants",
		"name": "备忘录",
		"text": "自动记录谈话内容",
		"itemEffect": null,
		"canUseItemEffect": "true",
		"hideInToolbox": true,
		"hideInReplay": true,
		"useItemEffect": "core.insertCommonEvent(\"记事本\");",
		"itemEffectTip": "你得到 备忘录，自动记录谈话内容"
	},
	"pack": {
		"cls": "items",
		"name": "钱袋",
		"itemEffect": "core.status.hero.money += 500",
		"itemEffectTip": "，金币+500"
	},
	"I300": {
		"cls": "constants",
		"name": "帮助",
		"text": "使用后可以查看帮助",
		"itemEffect": "core.insertCommonEvent(\"帮助\");",
		"canUseItemEffect": "true",
		"hideInToolbox": true,
		"hideInReplay": true
	},
	"centerFly3": {
		"cls": "items",
		"name": "瞬移",
		"itemEffect": "core.addItem('centerFly', 3)",
		"itemEffectTip": "你得到 瞬移 可用3次到达中心对称的对应点",
		"text": "可用3次到达中心对称的对应点"
	},
	"I333": {
		"cls": "constants",
		"name": "新物品",
		"canUseItemEffect": "true"
	}
}