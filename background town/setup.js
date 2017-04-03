// Generated by CoffeeScript 1.11.1
(function() {
  var addBldg, addNewRoadTiles, addTile, advanceRoadTileAgent, agentHistory, agentTouched, bestDirectionTo, buildingLayer, c, cacheEaselValues, closestTile, commercialAxisIsVertical, commercialUndesirability, configureCanvas, distance, expandRoadNetwork, groundLayer, handleComplete, initializeCity, jCanvas, knownProperties, knownRoadTiles, mouseHandlers, mouseIsActive, newTile, pane, pointsAreEqual, populateProperty, printTile, propertyGen, propertyValues, queue, registerEvents, removeBldg, removeRetiredAgents, removeTile, resetAgentHR, reverse, roadGen, roadTileAgents, setMousePointer, slideContentIn, slideContentOut, stage, tileHeight, tileSheet, tileSheetRects, tileWidth, windowMidpoint,
    indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  tileWidth = 36;

  tileHeight = 18;

  c = console;

  tileSheet = tileSheetRects = jCanvas = stage = windowMidpoint = commercialAxisIsVertical = pane = null;

  groundLayer = buildingLayer = null;

  handleComplete = function() {
    jQuery.globalEval(queue.getResult('_').innerHTML);
    jQuery.globalEval(queue.getResult('easel').innerHTML);
    tileSheet = new createjs.Bitmap(queue.getResult('tiles'));
    configureCanvas();
    cacheEaselValues();
    initializeCity();
    return registerEvents();
  };

  queue = new createjs.LoadQueue();

  queue.addEventListener("complete", handleComplete);

  queue.loadManifest((function(path) {
    return [
      {
        id: "_",
        src: path + "underscore-min.js"
      }, {
        id: "easel",
        src: path + "easeljs-0.6.0.min.js"
      }, {
        id: "tiles",
        src: path + "tiles.png"
      }
    ];
  })('background town/'));

  configureCanvas = function() {
    jCanvas = $('#background-city');
    return jCanvas.css({
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: document.body.clientHeight + 'px',
      'z-index': -1
    }).attr({
      width: $(window).width(),
      height: document.body.clientHeight
    });
  };

  cacheEaselValues = function() {
    return tileSheetRects = (function(w, h) {
      return {
        road19: new createjs.Rectangle(0 * w, 0 * h, w, h),
        road37: new createjs.Rectangle(1 * w, 0 * h, w, h),
        road79: new createjs.Rectangle(2 * w, 0 * h, w, h),
        road39: new createjs.Rectangle(3 * w, 0 * h, w, h),
        road13: new createjs.Rectangle(4 * w, 0 * h, w, h),
        road17: new createjs.Rectangle(5 * w, 0 * h, w, h),
        background: new createjs.Rectangle(0 * w, 1 * h, w, h),
        road1379: new createjs.Rectangle(1 * w, 1 * h, w, h),
        road137: new createjs.Rectangle(2 * w, 1 * h, w, h),
        road139: new createjs.Rectangle(3 * w, 1 * h, w, h),
        road379: new createjs.Rectangle(4 * w, 1 * h, w, h),
        road179: new createjs.Rectangle(5 * w, 1 * h, w, h),
        dashed19: new createjs.Rectangle(0 * w, 2 * h, w, h),
        dashed37: new createjs.Rectangle(1 * w, 2 * h, w, h),
        road7: new createjs.Rectangle(2 * w, 2 * h, w, h),
        road9: new createjs.Rectangle(3 * w, 2 * h, w, h),
        road3: new createjs.Rectangle(4 * w, 2 * h, w, h),
        road1: new createjs.Rectangle(5 * w, 2 * h, w, h),
        shop: new createjs.Rectangle(0 * w, 3 * h, w, h),
        house: new createjs.Rectangle(1 * w, 3 * h, w, h),
        parkinglot: new createjs.Rectangle(2 * w, 3 * h, w, h),
        grass: new createjs.Rectangle(3 * w, 3 * h, w, h),
        vacant: new createjs.Rectangle(4 * w, 3 * h, w, h),
        dirt: new createjs.Rectangle(5 * w, 3 * h, w, h),
        outline: new createjs.Rectangle(6 * w, 0 * h, w + 2, h + 1)
      };
    })(tileWidth, tileHeight);
  };

  initializeCity = function() {
    stage = new createjs.Stage("background-city");
    stage.snapToPixel = true;
    groundLayer = new createjs.Container();
    stage.addChild(groundLayer);
    groundLayer.tiles = [];
    buildingLayer = new createjs.Container();
    stage.addChild(buildingLayer);
    buildingLayer.tiles = [];
    pane = $('#content-holder');
    windowMidpoint = closestTile(pane.width() / 2 + pane.position().left, pane.height() / 2 + pane.position().top);
    commercialAxisIsVertical = Math.random() < 0.5;
    roadGen(windowMidpoint);
    propertyGen(knownRoadTiles, true);
    setTimeout(expandRoadNetwork, 15000);
    return stage.update();
  };

  newTile = function(x, y, type) {
    var tile;
    if ((x / 2 + y / 2) % 1) {
      throw new Error("Tile is off grid. x:" + x + " and y:" + y + " should sum to an even number.");
    }
    tile = tileSheet.clone();
    tile.sourceRect = tileSheetRects[type];
    tile.tx = x;
    tile.ty = y;
    tile.x = x / 2 * tileWidth;
    tile.y = y / 2 * tileHeight;
    if (type === 'outline') {
      tile.x -= 1;
      tile.y -= 0.5;
    }
    tile.regX = tile.sourceRect.width / 2;
    tile.regY = tile.sourceRect.height / 2;
    return tile;
  };

  addTile = function(x, y, type) {
    var base, base1, tile;
    tile = newTile(x, y, type);
    tile.type = type;
    groundLayer.addChild(tile);
    ((base = ((base1 = groundLayer.tiles)[x] != null ? base1[x] : base1[x] = []))[y] != null ? base[y] : base[y] = []).push(tile);
    return tile;
  };

  removeTile = function(x, y, qualifier, noRemoveDependants) {
    var base, base1, tileList, tilesToRemove, tilesWithDependants;
    if (qualifier == null) {
      qualifier = '';
    }
    if (typeof qualifier === "function") {
      throw new Error('TODO: Add function-based tile removal.');
    }
    tileList = ((base = ((base1 = groundLayer.tiles)[x] != null ? base1[x] : base1[x] = []))[y] != null ? base[y] : base[y] = []);
    tilesToRemove = tileList.filter(function(tile) {
      return -1 < tile.type.indexOf(qualifier);
    });
    tileList = tileList.filter(function(tile) {
      return -1 === tilesToRemove.indexOf(tile);
    });
    tilesWithDependants = tilesToRemove.filter(function(tile) {
      return tile.dependants;
    });
    if (!noRemoveDependants && tilesWithDependants.length) {
      tilesWithDependants.forEach(function(parentTile) {
        return parentTile.dependants.forEach(function(tile) {
          return removeTile(tile.tx, tile.ty, '', true);
        });
      });
    }
    tilesToRemove.map(function(tile) {
      return groundLayer.removeChild(tile);
    });
    return void 0;
  };

  addBldg = function(x, y, type) {
    var base, base1, tile;
    tile = newTile(x, y, type);
    tile.type = type;
    buildingLayer.addChild(tile);
    ((base = ((base1 = buildingLayer.tiles)[x] != null ? base1[x] : base1[x] = []))[y] != null ? base[y] : base[y] = []).push(tile);
    return tile;
  };

  removeBldg = function(x, y, qualifier) {
    var base, base1, tileList, tilesToRemove;
    if (qualifier == null) {
      qualifier = '';
    }
    if (typeof qualifier === "function") {
      throw new Error('TODO: Add function-based bldg removal.');
    }
    tileList = ((base = ((base1 = buildingLayer.tiles)[x] != null ? base1[x] : base1[x] = []))[y] != null ? base[y] : base[y] = []);
    tilesToRemove = tileList.filter(function(tile) {
      return -1 < tile.type.indexOf(qualifier);
    });
    tileList = tileList.filter(function(tile) {
      return -1 === tile.type.indexOf(qualifier);
    });
    tilesToRemove.map(function(tile) {
      return buildingLayer.removeChild(tile);
    });
    return void 0;
  };

  printTile = function(x, y, qualifier) {
    var base, base1, tileList;
    if (qualifier == null) {
      qualifier = '';
    }
    if (typeof qualifier === "function") {
      throw new Error('TODO: Add function-based print filter.');
    }
    tileList = ((base = ((base1 = groundLayer.tiles)[x] != null ? base1[x] : base1[x] = []))[y] != null ? base[y] : base[y] = []);
    c.log('tile @', x, y, tileList.filter(function(tile) {
      return -1 < tile.type.indexOf(qualifier);
    }));
    return void 0;
  };

  closestTile = function(x, y) {
    var newX, newY;
    x *= 2;
    y *= 2;
    newX = Math.round(x / tileWidth);
    newY = Math.round(y / tileHeight);
    x /= tileWidth;
    y /= tileHeight;
    if ((newX / 2 + newY / 2) % 1) {
      if (Math.abs(x - newX) > Math.abs(y - newY)) {
        x-newX < 0 ? --newX : ++newX;
      } else {
        y-newY < 0 ? --newY : ++newY;
      }
    }
    return new createjs.Point(newX, newY);
  };

  advanceRoadTileAgent = resetAgentHR = removeRetiredAgents = roadTileAgents = null;

  knownRoadTiles = [];

  addNewRoadTiles = function(walked) {
    var i, len, tile;
    for (i = 0, len = walked.length; i < len; i++) {
      tile = walked[i];
      removeTile(tile.x, tile.y, '');
      removeBldg(tile.x, tile.y, '');
      addTile(tile.x, tile.y, 'outline');
      if (!(tile.connects[1] && tile.connects[9] || tile.connects[3] && tile.connects[7])) {
        addTile(tile.x, tile.y, propertyValues(tile) > 0.15 ? 'grass' : 'vacant');
      }
      addTile(tile.x, tile.y, 'road' + (tile.connects[1] * 1 || '') + (tile.connects[3] * 3 || '') + (tile.connects[7] * 7 || '') + (tile.connects[9] * 9 || ''));
    }
    return void 0;
  };

  reverse = function(dir) {
    return {
      1: 9,
      3: 7,
      7: 3,
      9: 1
    }[dir];
  };

  agentHistory = [];

  agentTouched = [];

  roadGen = function(startTile) {
    var advanceAgent, agent, agentNo, agents, branchChance, branchType, crossedExistingPath, i, j, len, newAgents, oldAgents, ref, step, turnChance, turnTo, turnType, walk, walked;
    branchChance = _.random(20, 40) / 100;
    branchType = _.random(10, 90) / 100;
    turnChance = _.random(10, 60) / 100;
    turnType = _.random(30, 70) / 100;
    walked = [startTile.clone()];
    walked[0].connects = {};
    agents = (function() {
      var i, results;
      results = [];
      for (agentNo = i = 1; i <= 4; agentNo = ++i) {
        results.push({
          name: agentNo + 'a',
          position: startTile.clone(),
          directive: [1, 3, 0x7, 9][agentNo - 1],
          impetus: 3,
          step: 0,
          tileOn: walked[0]
        });
      }
      return results;
    })();
    newAgents = [];
    oldAgents = [];
    crossedExistingPath = function(agent) {
      return _.find(walked, function(position) {
        return position.x === agent.position.x && position.y === agent.position.y;
      });
    };
    turnTo = function(facing, turnCCW) {
      return {
        "true": {
          1: 7,
          7: 9,
          9: 3,
          3: 1
        },
        "false": {
          7: 1,
          9: 7,
          3: 9,
          1: 3
        }
      }[turnCCW][facing];
    };
    walk = function(agent) {
      return (function(delta) {
        agent.position.x += delta.x;
        return agent.position.y += delta.y;
      })({1:{x:-1, y:+1}, //For some reason, this just confuses Coffeescript.
					  3:{x:+1, y:+1},
					  7:{x:-1, y:-1},
					  9:{x:+1, y:-1},
				}[agent.directive]);
    };
    advanceAgent = function(agent) {
      var branch, branchDir, crossedPath, turn, turnDir;
      walk(agent);
      if (agent.impetus) {
        --agent.impetus;
      }
      ++agent.step;
      crossedPath = crossedExistingPath(agent);
      if (crossedPath) {
        oldAgents.push(agent);
        agent.tileOn.connects[agent.directive] = true;
        agent.tileOn = crossedPath;
        crossedPath.connects[reverse(agent.directive)] = true;
        return agentTouched.push(crossedPath);
      } else {
        agent.tileOn.connects[agent.directive] = true;
        agent.tileOn = agent.position.clone();
        agent.tileOn.connects = {};
        agent.tileOn.connects[reverse(agent.directive)] = true;
        walked.push(agent.tileOn);
        agentHistory.push(agent.tileOn);
        branch = Math.random() < branchChance && !agent.impetus;
        branchDir = Math.random() < branchType;
        turn = Math.random() < turnChance && !agent.impetus;
        turnDir = Math.random() < turnType;
        if (branch && turn && !branchDir) {
          newAgents.push({
            name: agent.name + '-' + agent.step,
            position: agent.position.clone(),
            directive: turnTo(agent.directive, true),
            impetus: 3,
            step: agent.step,
            tileOn: agent.tileOn
          });
          agent.directive = turnTo(agent.directive, false);
        } else if (branch) {
          if (branchDir) {
            newAgents.push({
              name: agent.name + '-' + agent.step + 'a',
              position: agent.position.clone(),
              directive: turnTo(agent.directive, true),
              impetus: 3,
              step: agent.step,
              tileOn: agent.tileOn
            });
            newAgents.push({
              name: agent.name + '-' + agent.step + 'b',
              position: agent.position.clone(),
              directive: turnTo(agent.directive, false),
              impetus: 3,
              step: agent.step,
              tileOn: agent.tileOn
            });
          } else {
            newAgents.push({
              name: agent.name + '-' + agent.step,
              position: agent.position.clone(),
              directive: turnTo(agent.directive, turnDir),
              impetus: 3,
              step: agent.step,
              tileOn: agent.tileOn
            });
          }
        } else if (turn) {
          agent.directive = turnTo(agent.directive, turnDir);
        }
        if (branch || turn) {
          return agent.impetus = 3;
        }
      }
    };
    resetAgentHR = function() {
      oldAgents = [];
      return newAgents = [];
    };
    removeRetiredAgents = function() {
      oldAgents.forEach(function(agent) {
        return agent.retired = true;
      });
      agents = agents.filter(function(agent) {
        return !(indexOf.call(oldAgents, agent) >= 0);
      }).concat(newAgents);
      if (roadTileAgents) {
        return roadTileAgents = roadTileAgents.filter(function(agent) {
          return !(indexOf.call(oldAgents, agent) >= 0);
        }).concat(newAgents);
      }
    };
    for (step = i = 1, ref = Math.min(startTile.x, startTile.y) / 2 - 1; 1 <= ref ? i <= ref : i >= ref; step = 1 <= ref ? ++i : --i) {
      for (j = 0, len = agents.length; j < len; j++) {
        agent = agents[j];
        advanceAgent(agent);
      }
      removeRetiredAgents();
      newAgents = [];
      oldAgents = [];
    }
    advanceRoadTileAgent = advanceAgent;
    roadTileAgents = agents;
    addNewRoadTiles(walked);
    return knownRoadTiles = knownRoadTiles.concat(walked);
  };

  propertyValues = function(point, y) {
    var x;
    if (isFinite(y)) {
      x = point;
    } else {
      x = point.x;
      y = point.y;
    }
    return Math.abs(Math.sin(x) / 2 + Math.sin(y) / 2) + 0.1;
  };

  pointsAreEqual = function(p1, p2) {
    return p1.x === p2.x && p1.y === p2.y;
  };

  distance = function(p1, p2) {
    return Math.sqrt(Math.pow(Math.abs(p1.x - p2.x), 2) + Math.pow(Math.abs(p1.y - p2.y), 2));
  };

  bestDirectionTo = function(p1, p2) {
    if (p1.x > p2.x && p1.y < p2.y) {
      return 1;
    }
    if (p1.x < p2.x && p1.y < p2.y) {
      return 3;
    }
    if (p1.x > p2.x && p1.y > p2.y) {
      return 7;
    }
    if (p1.x < p2.x && p1.y > p2.y) {
      return 9;
    }
    return void 0;
  };

  knownProperties = [];

  populateProperty = function(tiles) {
    tiles.forEach(function(tile) {
      var prop;
      prop = addTile(tile.x, tile.y, 'outline');
      prop = addTile(tile.x, tile.y, propertyValues(tiles[0]) > 0.15 ? 'grass' : 'vacant');
      if (tile.priority === 1) {
        return prop.dependants = tiles;
      }
    });
    addBldg(tiles[0].x, tiles[0].y, commercialUndesirability(tiles[0], windowMidpoint) < Math.min(windowMidpoint.x, windowMidpoint.y) * 0.15 ? 'shop' : 'house');
    return knownProperties.push(tiles);
  };

  propertyGen = function(roadTiles, exNihilo) {
    var existingProperties, relativeTile, tilesToTheSide, validPropertyLocation;
    relativeTile = function(tile, delta) {
      var dir, rTile;
      rTile = tile.clone();
      dir = {
        1: [-1, +1],
        3: [+1, +1],
        7: [-1, -1],
        9: [+1, -1]
      };
      rTile.x += dir[delta][0];
      rTile.y += dir[delta][1];
      rTile.facing = reverse(delta);
      return rTile;
    };
    tilesToTheSide = function(tile) {
      return {
        1: [3, 7],
        3: [1, 9],
        7: [1, 9],
        9: [3, 7]
      }[tile.facing].map(function(dir) {
        return relativeTile(tile, dir);
      });
    };
    validPropertyLocation = function(tile, index, tileList) {
      var base, base1, name, name1;
      return !(index > _.find(_.range(tileList.length), function(tIndex) {
        return pointsAreEqual(tile, tileList[tIndex]);
      })) && (exNihilo || !(index > _.find(_.range(knownProperties.length), function(tIndex) {
        return pointsAreEqual(tile, knownProperties[tIndex]);
      }))) && (exNihilo || !((base = ((base1 = groundLayer.tiles)[name1 = tile.x] != null ? base1[name1] : base1[name1] = []))[name = tile.y] != null ? base[name] : base[name] = []).length) && !(_.find(roadTiles, function(road) {
        return pointsAreEqual(tile, road);
      }));
    };
    existingProperties = _.chain(roadTiles).map(function(roadTile) {
      var propertyLocations;
      propertyLocations = [];
      if (!roadTile.connects[1] && Math.random() < 0.75) {
        propertyLocations.push(relativeTile(roadTile, 1));
      }
      if (!roadTile.connects[3] && Math.random() < 0.75) {
        propertyLocations.push(relativeTile(roadTile, 3));
      }
      if (!roadTile.connects[7] && Math.random() < 0.75) {
        propertyLocations.push(relativeTile(roadTile, 7));
      }
      if (!roadTile.connects[9] && Math.random() < 0.75) {
        propertyLocations.push(relativeTile(roadTile, 9));
      }
      return propertyLocations;
    }).flatten().shuffle().filter(validPropertyLocation).map(function(prop, index) {
      prop.front = true;
      prop.address = index;
      prop.priority = 1;
      return prop;
    }).map(function(prop) {
      var newProp;
      newProp = relativeTile(prop, reverse(prop.facing));
      newProp.address = prop.address;
      newProp.priority = 2;
      return [prop, newProp];
    }).flatten().map(function(plot) {
      return tilesToTheSide(plot).map(function(newPlot) {
        newPlot.address = plot.address;
        newPlot.priority = 3;
        return newPlot;
      }).concat(plot);
    }).flatten().sortBy('priority').filter(validPropertyLocation).groupBy('address').values().value();
    if (exNihilo) {
      return existingProperties.forEach(function(prop) {
        return populateProperty(prop);
      });
    } else {
      return existingProperties.forEach(function(prop) {
        return setTimeout((function() {
          var validPropsNow;
          validPropsNow = prop.filter(validPropertyLocation);
          if (prop[0] = validPropsNow[0]) {
            populateProperty(validPropsNow);
            return stage.tick();
          }
        }), _.random(2000, 15000));
      });
    }
  };

  commercialUndesirability = function(pointA, pointB) {
    return Math.abs(pointA.x - pointB.x) / ((!commercialAxisIsVertical) + 1) + Math.abs(pointA.y - pointB.y) / (commercialAxisIsVertical + 1);
  };

  expandRoadNetwork = function() {
    var agent;
    if (!mouseIsActive && roadTileAgents.length) {
      agent = roadTileAgents[_.random(0, roadTileAgents.length - 1)];
      agentHistory = [];
      agentTouched = [agent.tileOn];
      _.range(_.random(1, 5)).forEach(function() {
        if (!agent.retired) {
          resetAgentHR();
          advanceRoadTileAgent(agent);
          addNewRoadTiles([].concat(agentTouched, agentHistory));
          knownRoadTiles = knownRoadTiles.concat(agentHistory);
          addNewRoadTiles(agentHistory);
          propertyGen(agentHistory);
          removeRetiredAgents();
          return stage.tick();
        }
      });
    }
    return setTimeout(expandRoadNetwork, _.random(10000, 30000));
  };

  slideContentOut = function() {
    window.city.toggleVisibility = slideContentIn;
    $('body').css({
      'pointer-events': 'none'
    }).animate({
      'margin-top': "-=" + (pane.height())
    }, pane.height() * 1.5);
    return setTimeout(function() {
      return window.scrollTo(0, document.body.clientHeight / 2 - $(window).height() / 2);
    }, 10);
  };

  slideContentIn = function() {
    window.city.toggleVisibility = slideContentOut;
    return $('body').css({
      'pointer-events': 'auto'
    }).animate({
      'margin-top': "+=" + (pane.height())
    }, pane.height() * 1.5);
  };

  setMousePointer = function(id) {
    return jCanvas.css({
      cursor: id
    });
  };

  var swallowMouseEvent = function(evt) { //Stolen directly from Candy Crunch.
	// mouseX = evt.stageX; mouseY = evt.stageY;
	evt.nativeEvent.preventDefault();
	evt.nativeEvent.stopPropagation();
	//evt.nativeEvent.stopImmediatePropagation();
	return false;
};;

  mouseIsActive = false;

  mouseHandlers = (function() {
    var changedRoadTiles, lastMousePos, moved, nearbyAgents, newRoadTiles, onAgent, onMouseDown, onMouseMove, onMouseUp, onRoadTile, retireAgentMaxDistance, spawnedAgentCount;
    lastMousePos = {
      x: 0,
      y: 0
    };
    onRoadTile = onAgent = nearbyAgents = null;
    newRoadTiles = [];
    changedRoadTiles = [];
    spawnedAgentCount = 5;
    retireAgentMaxDistance = 4;
    moved = void 0;
    onMouseDown = function(event) {
      var mousePos;
      setMousePointer('pointer');
      mousePos = closestTile(event.stageX, event.stageY);
      lastMousePos = mousePos;
      onRoadTile = _.find(knownRoadTiles, function(tile) {
        return pointsAreEqual(tile, mousePos);
      });
      moved = false;
      mouseIsActive = true;
      if (onRoadTile) {
        onAgent = _.find(roadTileAgents, function(agent) {
          return pointsAreEqual(onRoadTile, agent.tileOn);
        });
        newRoadTiles = [];
        changedRoadTiles = [];
        agentHistory = [];
        agentTouched = [onRoadTile];
      }
      return stage.tick();
    };
    onMouseMove = function(event) {
      var mousePos, newAgentDirection, newOnRoadTile;
      mousePos = closestTile(event.stageX, event.stageY);
      if (!pointsAreEqual(lastMousePos, mousePos)) {
        lastMousePos = mousePos;
        newOnRoadTile = _.find(knownRoadTiles, function(tile) {
          return pointsAreEqual(tile, mousePos);
        });
        moved = true;
        if (onRoadTile) {
          if (!onAgent) {
            onAgent = {
              name: spawnedAgentCount++ + 'M',
              position: new createjs.Point(onRoadTile.x, onRoadTile.y),
              directive: null,
              impetus: 3,
              step: 0,
              tileOn: onRoadTile
            };
            roadTileAgents.push(onAgent);
          }
          newAgentDirection = void 0;
          while (newAgentDirection = bestDirectionTo(onAgent.position, mousePos)) {
            onAgent.impetus = 1;
            onAgent.impetus = Math.max(1, onAgent.impetus);
            onAgent.directive = newAgentDirection;
            advanceRoadTileAgent(onAgent);
          }
          addNewRoadTiles([].concat(_.last(newRoadTiles) || [], _.last(changedRoadTiles) || [], agentTouched));
          addNewRoadTiles(agentHistory);
          newRoadTiles = newRoadTiles.concat(agentHistory);
          changedRoadTiles = changedRoadTiles.concat(agentTouched);
          knownRoadTiles = knownRoadTiles.concat(agentHistory);
          if (newOnRoadTile) {
            nearbyAgents = _.filter(roadTileAgents, function(agent) {
              return distance(onRoadTile, agent.tileOn) <= retireAgentMaxDistance && agent !== onAgent;
            });
            onRoadTile = newOnRoadTile;
          }
          agentHistory = [];
          agentTouched = [];
        }
        return stage.tick();
      }
    };
    onMouseUp = function(event) {
      var mousePos;
      mousePos = closestTile(event.stageX, event.stageY);
      if (!moved) {

      } else {
        propertyGen(newRoadTiles);
      }
      return setMousePointer('auto');
    };
    return {
      down: onMouseDown,
      move: onMouseMove,
      up: onMouseUp
    };
  })();

  registerEvents = function() {
    (window.city != null ? window.city : window.city = {}).toggleVisibility = slideContentOut;
    createjs.Touch.enable(stage);
    return stage.addEventListener('mousedown', function(event) {
      event.addEventListener('mouseup', mouseHandlers.up);
      event.addEventListener('mousemove', mouseHandlers.move);
      mouseHandlers.down(event);
      return swallowMouseEvent(event);
    });
  };

}).call(this);
