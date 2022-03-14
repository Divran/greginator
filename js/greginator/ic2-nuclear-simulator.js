onVersionChanged(function(version) {
	var card = $( "#ic2-nuclear-simulator-card" );

    if (version != "it2") {
        card.hide();
        return;
    } else {
        card.show();
    }

	var header = $( ".card-header", card );
	header.addClass( "link-pointer" );
	var collapse = $( ".collapse", card );

	var initialized = false;
	var items;
	var grid = [];

	function setComponentAt(x,y,component) {
		grid[y][x] = component;
	}
	function getComponentAt(x,y) {
		return grid[y][x];
	}

	function clearGrid() {
		for (var y=0;y<6;y++) {
			grid[y] = [];
			for(var x=0;x<9;x++) {
				setComponentAt(x,y,items[0]);
			}
		}

		redrawGrid();
	}

	function redrawGrid() {
		for (var y=0;y<6;y++) {
			for(var x=0;x<9;x++) {
				var component = grid[y][x];
				$(".item-grid #item-grid-"+y+"-"+x, card).css("background-image","url(images/"+component.image+")");
			}
		}
	}

	function init(b) {
		if (!b) {collapse.collapse("toggle");}

		if (!initialized) {
			initialized = true;
			items = data.get("ic2 nuclear items",version);
			items_old = data.get("ic2 nuclear items old code",version);
			clearGrid();
			initialize();
		}
	}
    header.off("click");
	header.on("click",function() {init();});
	if (collapse.hasClass("show")) {init(true);}

	function parseCodeNew(code) {
		try {
			var pos = 0;
			for (var y = 0; y < 6; y++) {
				for (var x = 0; x < 9; x++) {
					var component = items[parseInt(code.substring(pos, pos + 2), 16)];
					pos += 2;
					if (pos < code.length && code.charAt(pos) == '(') {
						var paramType = code.charAt(pos + 1);
						var tempPos = pos + 2;
						var param = "";
						while (code.charAt(tempPos) != ')') {
							param.append(code.charAt(tempPos));
							tempPos++;
						}
						if (paramType == "h") {
							component.setInitialHeat(parseInt(param, 36));
						}
						pos = tempPos + 1;
					}

					setComponentAt(x,y,component);
					//console.log(x,y,component);
				}
			}
		} catch (e) {
			console.log("EXCEPTION",e);
		}
	}

	function parseCodeOld(code) {
		var num = bigInt(code,36);

		function readInt(bits) {
			var data = num.and((1 << bits) - 1);
			num = num.shiftRight(bits);
			return data.toJSNumber();
		}

		// initial heat, ignored
		readInt(10);

		for (var x = 8; x >= 0; x--) {
			for (var y = 5; y >= 0; y--) {
				var nextValue = readInt(7);

				// items are no longer stackable in IC2 reactors, but stack sizes from the planner code still need to be handled
				if (nextValue > 64) {
					nextValue = readInt(7);
				}

				var component = items_old[nextValue];
				setComponentAt(x,y,component);
				//console.log(x,y,nextValue,component);
			}
		}
	}

	function parseCode(code) {
		if (code.length >= 108) {
			parseCodeNew(code);
		} else {
			parseCodeOld(code);
		}
	}

	function initialize() {
		var grid = $( ".item-grid", card );
		var code = $( ".code", card );

		// Initialize grid
		var tbl = $( "<table class='table table-bordered'>" );
		var tbody = $("<tbody>");
		for(var y=0;y<6;y++) {
			var cells = [];
			for(var x=0;x<9;x++) {
				cells.push("<td id='item-grid-" + y + "-" + x + "'></td>");
			}
			tbody.append($("<tr id='item-grid-" + y + "'>").append(cells));
		}
		tbl.append(tbody);
		grid.append(tbl);

		function onResize() {
			if (grid.is(":visible")) {
				var width = tbl.width();

				var td = $( "td", tbl );
				td.css("height",width * (6/(9*6)) + "px");
			}
		}
		$(window).on("resize",onResize);
		setTimeout(function() {
			onResize();
		},50);

		code.on( "input", function() {
			parseCode(code.val());
			redrawGrid();
			simulate();
		});

		// Parse querystring
		var query = window.location.search;
		if (query.charAt(0) == "?") {query = query.substr(1);}
		var split = query.split("&");
		query = {};
		for(var i=0;i<split.length;i++) {
			var match = split[i].match(/^(.+)=(.+)$/);
			query[match[1]] = match[2];
		}

		if (query.code) {
			code.val(query.code);
			code.trigger("input");
		}
	}

	var reactor = {
		heat:0,
		vented_heat:0,
		setCurrentHeat: function(h) {
			this.heat = h;
		},
		clearVentedHeat: function() {
			this.vented_heat = 0;
		}
	};

	function simulate() {
		var interval_id;
		var startTime = Date.now();

		var reactorTicks = 0;
		var cooldownTicks = 0;
		var totalRodCount = 0;

		reactor.setCurrentHeat(0);
		reactor.clearVentedHeat();


		interval_id = setInterval(function() {

		},20);

		/*
            double minReactorHeat = initialHeat;
            double maxReactorHeat = initialHeat;
            boolean reachedBurn = initialHeat >= 0.4 * reactor.getMaxHeat();
            boolean reachedEvaporate = initialHeat >= 0.5 * reactor.getMaxHeat();
            boolean reachedHurt = initialHeat >= 0.7 * reactor.getMaxHeat();
            boolean reachedLava = initialHeat >= 0.85 * reactor.getMaxHeat();
            boolean reachedExplode = false;
            for (int row = 0; row < 6; row++) {
                for (int col = 0; col < 9; col++) {
                    ReactorComponent component = reactor.getComponentAt(row, col);
                    if (component != null) {
                        component.clearCurrentHeat();
                        component.clearDamage();
                        totalRodCount += component.getRodCount();
                    }
                    publish(String.format("R%dC%d:0xC0C0C0", row, col)); //NOI18N
                }
            }
            double lastEUoutput = 0.0;
            double totalEUoutput = 0.0;
            double lastHeatOutput = 0.0;
            double totalHeatOutput = 0.0;
            double maxGeneratedHeat = 0.0;
            double minHeatBuildup = Double.MAX_VALUE;
            double maxHeatBuildup = 0.0;
            boolean componentsIntact = true;
            int timeToFirstComponentBreak = 500000;
            do {
                reactor.clearEUOutput();
                reactor.clearVentedHeat();
                for (int row = 0; row < 6; row++) {
                    for (int col = 0; col < 9; col++) {
                        ReactorComponent component = reactor.getComponentAt(row, col);
                        if (component != null) {
                            component.preReactorTick();
                        }
                    }
                }
                double preTickReactorHeat = reactor.getCurrentHeat();
                double generatedHeat = 0.0;
                for (int row = 0; row < 6; row++) {
                    for (int col = 0; col < 9; col++) {
                        ReactorComponent component = reactor.getComponentAt(row, col);
                        if (component != null && !component.isBroken()) {
                            generatedHeat += component.generateHeat();
                            maxReactorHeat = Math.max(reactor.getCurrentHeat(), maxReactorHeat);
                            minReactorHeat = Math.min(reactor.getCurrentHeat(), minReactorHeat);
                            component.dissipate();
                            maxReactorHeat = Math.max(reactor.getCurrentHeat(), maxReactorHeat);
                            minReactorHeat = Math.min(reactor.getCurrentHeat(), minReactorHeat);
                            component.transfer();
                            maxReactorHeat = Math.max(reactor.getCurrentHeat(), maxReactorHeat);
                            minReactorHeat = Math.min(reactor.getCurrentHeat(), minReactorHeat);
                        }
                        if (maxReactorHeat >= 0.4 * reactor.getMaxHeat() && !reachedBurn) {
                            publish(String.format(java.util.ResourceBundle.getBundle("Ic2ExpReactorPlanner/Bundle").getString("REACTOR_BURN_TIME"), reactorTicks));
                            reachedBurn = true;
                        }
                        if (maxReactorHeat >= 0.5 * reactor.getMaxHeat() && !reachedEvaporate) {
                            publish(String.format(java.util.ResourceBundle.getBundle("Ic2ExpReactorPlanner/Bundle").getString("REACTOR_EVAPORATE_TIME"), reactorTicks));
                            reachedEvaporate = true;
                        }
                        if (maxReactorHeat >= 0.7 * reactor.getMaxHeat() && !reachedHurt) {
                            publish(String.format(java.util.ResourceBundle.getBundle("Ic2ExpReactorPlanner/Bundle").getString("REACTOR_HURT_TIME"), reactorTicks));
                            reachedHurt = true;
                        }
                        if (maxReactorHeat >= 0.85 * reactor.getMaxHeat() && !reachedLava) {
                            publish(String.format(java.util.ResourceBundle.getBundle("Ic2ExpReactorPlanner/Bundle").getString("REACTOR_LAVA_TIME"), reactorTicks));
                            reachedLava = true;
                        }
                        if (maxReactorHeat >= reactor.getMaxHeat() && !reachedExplode) {
                            publish(String.format(java.util.ResourceBundle.getBundle("Ic2ExpReactorPlanner/Bundle").getString("REACTOR_EXPLODE_TIME"), reactorTicks));
                            reachedExplode = true;
                        }
                    }
                }
                double postTickReactorHeat = reactor.getCurrentHeat();
                maxGeneratedHeat = Math.max(generatedHeat, maxGeneratedHeat);
                for (int row = 0; row < 6; row++) {
                    for (int col = 0; col < 9; col++) {
                        ReactorComponent component = reactor.getComponentAt(row, col);
                        if (component != null && !component.isBroken()) {
                            component.generateEnergy();
                        }
                    }
                }
                lastEUoutput = reactor.getCurrentEUoutput();
                totalEUoutput += lastEUoutput;
                lastHeatOutput = reactor.getVentedHeat();
                totalHeatOutput += lastHeatOutput;
                if (reactor.getCurrentHeat() <= reactor.getMaxHeat() && lastEUoutput > 0.0) {
                    reactorTicks++;
                    minEUoutput = Math.min(lastEUoutput, minEUoutput);
                    maxEUoutput = Math.max(lastEUoutput, maxEUoutput);
                    minHeatOutput = Math.min(lastHeatOutput, minHeatOutput);
                    maxHeatOutput = Math.max(lastHeatOutput, maxHeatOutput);
                }
                for (int row = 0; row < 6; row++) {
                    for (int col = 0; col < 9; col++) {
                        ReactorComponent component = reactor.getComponentAt(row, col);
                        if (component != null && component.isBroken() && !alreadyBroken[row][col] && !component.getClass().getName().contains("FuelRod")) { //NOI18N
                            publish(String.format("R%dC%d:0xFF0000", row, col)); //NOI18N
                            alreadyBroken[row][col] = true;
                            publish(String.format(java.util.ResourceBundle.getBundle("Ic2ExpReactorPlanner/Bundle").getString("BROKE_TIME"), row, col, reactorTicks));
                            if (componentsIntact) {
                                componentsIntact = false;
                                timeToFirstComponentBreak = reactorTicks;
                            }
                        }
                        if (reactor.isUsingReactorCoolantInjectors()) {
                            if (component instanceof RshCondensator && component.getCurrentHeat() > 17000 && !component.isBroken()) {
                                ((RshCondensator) component).injectCoolant();
                                redstoneUsed++;
                            } else if (component instanceof LzhCondensator && component.getCurrentHeat() > 85000 && !component.isBroken()) {
                                ((LzhCondensator) component).injectCoolant();
                                lapisUsed++;
                            }
                        }
                    }
                }
                if (componentsIntact && postTickReactorHeat >= preTickReactorHeat) {
                    minHeatBuildup = Math.min(minHeatBuildup, postTickReactorHeat - preTickReactorHeat);
                    maxHeatBuildup = Math.max(maxHeatBuildup, postTickReactorHeat - preTickReactorHeat);
                }
            } while (reactor.getCurrentHeat() <= reactor.getMaxHeat() && lastEUoutput > 0.0);
            publish(String.format(java.util.ResourceBundle.getBundle("Ic2ExpReactorPlanner/Bundle").getString("MIN_TEMP"), minReactorHeat));
            publish(String.format(java.util.ResourceBundle.getBundle("Ic2ExpReactorPlanner/Bundle").getString("MAX_TEMP"), maxReactorHeat));
            publish(String.format(java.util.ResourceBundle.getBundle("Ic2ExpReactorPlanner/Bundle").getString("FUEL_RODS_TIME"), reactorTicks));
            if (reactorTicks > 0) {
                if (reactor.isFluid()) {
                    publish(String.format(java.util.ResourceBundle.getBundle("Ic2ExpReactorPlanner/Bundle").getString("HEAT_OUTPUTS"), 2 * totalHeatOutput, 2 * totalHeatOutput / reactorTicks, 2 * minHeatOutput, 2 * maxHeatOutput));
                    if (totalRodCount > 0) {
                        publish(String.format(java.util.ResourceBundle.getBundle("Ic2ExpReactorPlanner/Bundle").getString("EFFICIENCY"), totalHeatOutput / reactorTicks / 4 / totalRodCount, minHeatOutput / 4 / totalRodCount, maxHeatOutput / 4 / totalRodCount));
                    }
                } else {
                    publish(String.format(java.util.ResourceBundle.getBundle("Ic2ExpReactorPlanner/Bundle").getString("EU_OUTPUTS"), totalEUoutput, minEUoutput / 20.0, maxEUoutput / 20.0, totalEUoutput / (reactorTicks * 20)));
                    if (totalRodCount > 0) {
                        publish(String.format(java.util.ResourceBundle.getBundle("Ic2ExpReactorPlanner/Bundle").getString("EFFICIENCY"), totalEUoutput / reactorTicks / 100 / totalRodCount, minEUoutput / 100 / totalRodCount, maxEUoutput / 100 / totalRodCount));
                    }
                }
            }
            lastHeatOutput = 0.0;
            totalHeatOutput = 0.0;
            double prevReactorHeat = reactor.getCurrentHeat();
            double prevTotalComponentHeat = 0.0;
            for (int row = 0; row < 6; row++) {
                for (int col = 0; col < 9; col++) {
                    ReactorComponent component = reactor.getComponentAt(row, col);
                    if (component != null && !component.isBroken()) {
                        prevTotalComponentHeat += component.getCurrentHeat();
                        if (component.getCurrentHeat() > 0.0) {
                            publish(String.format("R%dC%d:0xFFFF00", row, col));
                            publish(String.format(java.util.ResourceBundle.getBundle("Ic2ExpReactorPlanner/Bundle").getString("COMPONENT_REMAINING_HEAT"), row, col, component.getCurrentHeat()));
                            needsCooldown[row][col] = true;
                        }
                    }
                }
            }
            if (prevReactorHeat == 0.0 && prevTotalComponentHeat == 0.0) {
                output.append(java.util.ResourceBundle.getBundle("Ic2ExpReactorPlanner/Bundle").getString("NO_COOLDOWN_NEEDED"));
            } else {
                double currentTotalComponentHeat = prevTotalComponentHeat;
                int reactorCooldownTime = 0;
                do {
                    reactor.clearVentedHeat();
                    prevReactorHeat = reactor.getCurrentHeat();
                    if (prevReactorHeat == 0.0) {
                        reactorCooldownTime = cooldownTicks;
                    }
                    prevTotalComponentHeat = currentTotalComponentHeat;
                    for (int row = 0; row < 6; row++) {
                        for (int col = 0; col < 9; col++) {
                            ReactorComponent component = reactor.getComponentAt(row, col);
                            if (component != null && !component.isBroken()) {
                                component.dissipate();
                                component.transfer();
                            }
                        }
                    }
                    lastHeatOutput = reactor.getVentedHeat();
                    totalHeatOutput += lastHeatOutput;
                    minEUoutput = Math.min(lastEUoutput, minEUoutput);
                    maxEUoutput = Math.max(lastEUoutput, maxEUoutput);
                    minHeatOutput = Math.min(lastHeatOutput, minHeatOutput);
                    maxHeatOutput = Math.max(lastHeatOutput, maxHeatOutput);
                    cooldownTicks++;
                    currentTotalComponentHeat = 0.0;
                    for (int row = 0; row < 6; row++) {
                        for (int col = 0; col < 9; col++) {
                            ReactorComponent component = reactor.getComponentAt(row, col);
                            if (component != null && !component.isBroken()) {
                                currentTotalComponentHeat += component.getCurrentHeat();
                                if (component.getCurrentHeat() == 0.0 && needsCooldown[row][col]) {
                                    publish(String.format(java.util.ResourceBundle.getBundle("Ic2ExpReactorPlanner/Bundle").getString("COMPONENT_COOLDOWN_TIME"), row, col, cooldownTicks));
                                    needsCooldown[row][col] = false;
                                }
                            }
                        }
                    }
                } while (lastHeatOutput > 0 && cooldownTicks < 20000);
                if (reactor.getCurrentHeat() < reactor.getMaxHeat()) {
                    if (reactor.getCurrentHeat() == 0.0) {
                        publish(String.format(java.util.ResourceBundle.getBundle("Ic2ExpReactorPlanner/Bundle").getString("REACTOR_COOLDOWN_TIME"), reactorCooldownTime));
                    } else {
                        publish(String.format(java.util.ResourceBundle.getBundle("Ic2ExpReactorPlanner/Bundle").getString("REACTOR_RESIDUAL_HEAT"), reactor.getCurrentHeat(), reactorCooldownTime));
                    }
                    publish(String.format(java.util.ResourceBundle.getBundle("Ic2ExpReactorPlanner/Bundle").getString("TOTAL_COOLDOWN_TIME"), cooldownTicks));
                }
                for (int row = 0; row < 6; row++) {
                    for (int col = 0; col < 9; col++) {
                        ReactorComponent component = reactor.getComponentAt(row, col);
                        if (component != null && !component.isBroken()) {
                            prevTotalComponentHeat += component.getCurrentHeat();
                            if (component.getCurrentHeat() > 0.0) {
                                publish(String.format("R%dC%d:0xFFA500", row, col)); //NOI18N
                                publish(String.format(java.util.ResourceBundle.getBundle("Ic2ExpReactorPlanner/Bundle").getString("COMPONENT_RESIDUAL_HEAT"), row, col, component.getCurrentHeat()));
                            }
                        }
                    }
                }
            }
            if (reactor.getCurrentHeat() > reactor.getMaxHeat()) {
                publish(String.format(java.util.ResourceBundle.getBundle("Ic2ExpReactorPlanner/Bundle").getString("REACTOR_OVERHEATED_TIME"), reactorTicks));
            }
            if (reactor.isFluid()) {
                publish(String.format(java.util.ResourceBundle.getBundle("Ic2ExpReactorPlanner/Bundle").getString("HEAT_OUTPUTS"), 2 * totalHeatOutput, 2 * totalHeatOutput / cooldownTicks, 2 * minHeatOutput, 2 * maxHeatOutput));
            }
            double totalEffectiveVentCooling = 0.0;
            double totalVentCoolingCapacity = 0.0;
            double totalCellCooling = 0.0;
            double totalCondensatorCooling = 0.0;
            
            for (int row = 0; row < 6; row++) {
                for (int col = 0; col < 9; col++) {
                    ReactorComponent component = reactor.getComponentAt(row, col);
                    if (component != null) {
                        if (component.getVentCoolingCapacity() > 0) {
                            publish(String.format(java.util.ResourceBundle.getBundle("Ic2ExpReactorPlanner/Bundle").getString("USED_COOLING"), row, col, component.getEffectiveVentCooling(), component.getVentCoolingCapacity()));
                            totalEffectiveVentCooling += component.getEffectiveVentCooling();
                            totalVentCoolingCapacity += component.getVentCoolingCapacity();
                        } else if (component.getBestCellCooling() > 0) {
                            publish(String.format(java.util.ResourceBundle.getBundle("Ic2ExpReactorPlanner/Bundle").getString("RECEIVED_HEAT"), row, col, component.getBestCellCooling()));
                            totalCellCooling += component.getBestCellCooling();
                        } else if (component.getBestCondensatorCooling() > 0) {
                            publish(String.format(java.util.ResourceBundle.getBundle("Ic2ExpReactorPlanner/Bundle").getString("RECEIVED_HEAT"), row, col, component.getBestCondensatorCooling()));
                            totalCondensatorCooling += component.getBestCondensatorCooling();
                        }
                    }
                }
            }
                    
            publish(String.format(java.util.ResourceBundle.getBundle("Ic2ExpReactorPlanner/Bundle").getString("TOTAL_VENT_COOLING"), totalEffectiveVentCooling, totalVentCoolingCapacity));
            publish(String.format(java.util.ResourceBundle.getBundle("Ic2ExpReactorPlanner/Bundle").getString("TOTAL_CELL_COOLING"), totalCellCooling));
            publish(String.format(java.util.ResourceBundle.getBundle("Ic2ExpReactorPlanner/Bundle").getString("TOTAL_CONDENSATOR_COOLING"), totalCondensatorCooling));
            publish(String.format(java.util.ResourceBundle.getBundle("Ic2ExpReactorPlanner/Bundle").getString("MAX_HEAT_GENERATED"), maxGeneratedHeat));
            if (redstoneUsed > 0) {
                publish(String.format(java.util.ResourceBundle.getBundle("Ic2ExpReactorPlanner/Bundle").getString("REDSTONE_USED"), redstoneUsed));
            }
            if (lapisUsed > 0) {
                publish(String.format(java.util.ResourceBundle.getBundle("Ic2ExpReactorPlanner/Bundle").getString("LAPIS_USED"), lapisUsed));
            }
            double totalCooling = totalEffectiveVentCooling + totalCellCooling + totalCondensatorCooling;
            if (maxHeatBuildup > 0) {
                publish(String.format(java.util.ResourceBundle.getBundle("Ic2ExpReactorPlanner/Bundle").getString("HEAT_BUILDUP"), minHeatBuildup, maxHeatBuildup));
            }
            //return null;
        } catch (Throwable e) {
            if (cooldownTicks == 0) {
                publish(String.format(java.util.ResourceBundle.getBundle("Ic2ExpReactorPlanner/Bundle").getString("ERROR_AT_REACTOR_TICK"), reactorTicks));
            } else {
                publish(String.format(java.util.ResourceBundle.getBundle("Ic2ExpReactorPlanner/Bundle").getString("ERROR_AT_COOLDOWN_TICK"), cooldownTicks));
            }
            publish(e.toString(), " ", Arrays.toString(e.getStackTrace()));
        }
        long endTime = System.nanoTime();
        publish(String.format(java.util.ResourceBundle.getBundle("Ic2ExpReactorPlanner/Bundle").getString("SIMULATION_TIME"), (endTime - startTime) / 1e9));
        return null;
        */
	}
});
