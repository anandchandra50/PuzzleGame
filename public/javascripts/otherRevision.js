

var w = window,
    d = document,
    e = d.documentElement,
    g = d.getElementsByTagName('body')[0],
    x = w.innerWidth || e.clientWidth || g.clientWidth,
    y = w.innerHeight|| e.clientHeight|| g.clientHeight;

var xOffset = 20;
var yOffset = 6;

var blocks = [];
var blockCounts = {
  '1x1|0': 0,
  '2x1|0': 0,
  '2x1|pi/2': 0,
  '2x1|pi': 0,
  '2x1|3pi/2': 0,
  '2x2-1|0': 0,
  '2x2-1|pi/2': 0,
  '2x2-1|pi': 0,
  '2x2-1|3pi/2': 0,
  '2x2|0': 0
}

var currentlyHoldingBlock = null;

var stage = new PIXI.Container();
stage.interactive = true;
stage.buttonMode = true;
stage.defaultCursor = 'cursor';

var mainView = document.getElementById('main-view')
var blocksView = document.getElementById('blocks-view');
var testView = document.getElementById('test-view');
var gridView = document.getElementById('grid-view');
//for some reason doesn't fill entire screen by default
var renderer = PIXI.autoDetectRenderer(x, y, {backgroundColor : 0x666666});

//document.body.appendChild(renderer.view);

mainView.appendChild(renderer.view);
var grid = []; //initialize to start at -1 when undeclared, then 0 when blocks are decided, then 1 when filled
var squareWidth = 100;
var gridLength = 6;
var gridHeight = 6;


var blockTypeData = { //rotate is CLOCKWISE, anchor point is the top left, so it's declared relative to the compared point
  '1x1': {
    imageURL: '/images/1x1.png',
    orientations: [
      {
        cond: '0',
        rotate: 0,
        fromLeft: '0'
      }
    ]
  },
  '2x1': {
    imageURL: '/images/2x1.png',
    orientations: [
      {
        cond: 'R',
        rotate: 0,
        fromLeft: '0+R'
      },
      {
        cond: 'L',
        rotate: Math.PI,
        fromLeft: '0+R'
      },
      {
        cond: 'U',
        rotate: (Math.PI*3/2),
        fromLeft: '0+D'
      },
      {
        cond: 'D',
        rotate: Math.PI/2,
        fromLeft: '0+D'
      },
    ]
  },
  '2x2-1': {
    imageURL: '/images/2x2-1.png',
    orientations: [

    //none
      {
        cond: 'R+D',
        rotate: 0,
        fromLeft: '0+R+D'
      },
      {
        cond: 'U+RU',
        rotate: 0,
        fromLeft: '0+R+D'
      },
      {
        cond: 'L+LD',
        rotate: 0,
        fromLeft: '0+R+D'
      },
      //PI/2
      {
        cond: 'R+RD',
        rotate: Math.PI/2,
        fromLeft: '0+R+RD'
      },
      {
        cond: 'L+D',
        rotate: Math.PI/2,
        fromLeft: '0+R+RD'
      },
      {
        cond: 'U+LU',
        rotate: Math.PI/2,
        fromLeft: '0+R+RD'
      },
      //PI
      {
        cond: 'R+RU',
        rotate: Math.PI,
        fromLeft: 'R+D+RD'
      },
      {
        cond: 'L+U',
        rotate: Math.PI,
        fromLeft: 'R+D+RD'
      },
      {
        cond: 'D+LD',
        rotate: Math.PI,
        fromLeft: 'R+D+RD'
      },
      //3PI/2
      {
        cond: 'D+RD',
        rotate: Math.PI*(3/2),
        fromLeft: '0+D+RD'
      },
      {
        cond: 'R+U',
        rotate: Math.PI*(3/2),
        fromLeft: '0+D+RD'
      },
      {
        cond: 'L+LU',
        rotate: Math.PI*(3/2),
        fromLeft: '0+D+RD'
      },
    ]
  },
  '2x2': {
    imageURL: '/images/2x2.png',
    orientations: [
      {
        cond: 'R+RD+D',
        rotate: 0,
        fromLeft: '0+R+D+RD'
      },
      {
        cond: 'L+LD+D',
        rotate: 0,
        fromLeft: '0+R+D+RD'
      },
      {
        cond: 'R+RU+U',
        rotate: 0,
        fromLeft: '0+R+D+RD'
      },
      {
        cond: 'R+RD+D',
        rotate: 0,
        fromLeft: '0+R+D+RD'
      }
    ]
  },
  '3x2-2': {
    orientations: []
  }
};

var unplacedBlocks = [];

var background; //keep this shit


window.onresize = function() {
  var w = window,
    d = document,
    e = d.documentElement,
    g = d.getElementsByTagName('body')[0],
    x = w.innerWidth || e.clientWidth || g.clientWidth,
    y = w.innerHeight|| e.clientHeight|| g.clientHeight;
  //resize just happened, pixels changed
  console.log('resized, new x: ' + (blocksView.offsetWidth-(xOffset)));
  renderer.resize(x, y);

  squareWidth = gridView.offsetWidth/gridLength;
  //squareWidth = gridView.offsetWidth/gridLength * 5/6;
  //easy difficulty

  background.x = blocksView.offsetWidth-(xOffset);
  //background.x = 7/6*blocksView.offsetWidth-(xOffset);

  background.y = yOffset;
  background.width = gridView.offsetWidth;
  background.height = gridView.offsetWidth;
  // background.width = gridView.offsetWidth * 5/6;
  // background.height = gridView.offsetWidth * 5/6;
  squareWidth = gridView.offsetWidth/gridLength;
  clearTexts();
  initTexts();
  for (var i = 0; i < blocks.length; i++) {
    blocks[i].width = blocks[i].widthScale*squareWidth-2;
    blocks[i].height = blocks[i].heightScale*squareWidth-2;
    checkBlockWidth(blocks[i]);
    determineBlockLocation(blocks[i], blocks[i].blockType, blocks[i].rotation);
    if (blocks[i].currentPoints.length === 0) {
      console.log('resizing!!!');
      blocks[i].x = blocks[i].initX;
      blocks[i].y = blocks[i].initY;
    } 
    // blocks[i].width = 5/6*blocks[i].widthScale*squareWidth-2;
    // blocks[i].height = 5/6*blocks[i].heightScale*squareWidth-2;

  }
  //background.height = x/2;
};

function firstSquare(latestRow) {
  for (var i = latestRow; i < grid.length; i++) {
    if (grid[i].includes(-1)) {
      return [i, grid[i].indexOf(-1)];
    }
  }
}

function gridFilled() {
  for (i in grid) {
    if (grid[i].includes(-1)) {
      return false;
    }
  }
  return true;
}



function initiate() { //width is width of board in squares, height is height in squares, grid is 2D array for all cells

  console.log('initializing');
  var latestRow = 0;
  while(true) {
    //find first unselected square
    var selectRandom = ['2x1', '2x2-1', '2x2']; //random block types to select from

    if (gridFilled()) {
      break;
    }
    var first = firstSquare(latestRow);
    var row = first[0];
    var col = first[1];
    //goes grid[row][col]
    latestRow = row;
    randomBlockLoop: while (true) {
      if (selectRandom.length === 0) {
        //use 1x1 bc nothing else works
        var block = {
          'block-type': '1x1',
          'rotation': 0,
          'from-left': '0'
        }
        grid[row][col] = 0;
        unplacedBlocks.push(block)
        break;
      }
      var min = 0; var max = selectRandom.length-1;
      var select = Math.floor(Math.random() * (max - min +1)) + min;
      var blockType = selectRandom[select];
      //test to see if that block fits

      var orientations = blockTypeData[blockType].orientations;
      orientationLoop: for (i in orientations) {
        //check each orientation
        var condition = orientations[i]['cond'].split('+'); //this is all the points and their possible relative locations
        var otherPoints = []; //will be like: [[1, 2], [3, 4]] [row, col]

        //condition can look like [D, R, DR]
        var orientationWorks = true;
        conditionLoop: for (j in condition) {
          //each condition[j] is one block relative (such as D or RU)
          var pointDirection = condition[j].split(''); //now this should be [R, D] for example. or [D]
          //this refers to a single block. if the block does not work, then condition works is false then break
          var testRow = row; var testCol = col;
          while (pointDirection.length > 0) {
            var dir = pointDirection.pop(); //dir will either be R L U D
            switch (dir) {
              case 'R':
                testCol += 1;
                break;
              case 'L':
                testCol -= 1;
                break;
              case 'U':
                testRow -= 1;
                break;
              case 'D': 
                testRow += 1;
                break;
            }
          }

          //now testRow and testCol should be the correct grid location
          //check that it is in bounds
          if (testRow < 0 || testRow >= gridHeight || testCol < 0 || testCol >= gridLength) {
            orientationWorks = false;
            break conditionLoop; 
          } else if (grid[testRow][testCol] !== -1) {
            orientationWorks = false;
            break conditionLoop; 
          } else {
            otherPoints.push([testRow, testCol]);
          }

        }

        if (orientationWorks) { //need blocktype, rotation
          var block = {
            'block-type': blockType,
            'rotation': orientations[i]['rotate'],
            'from-left': orientations[i]['fromLeft']
          }
          unplacedBlocks.push(block);
          grid[row][col] = 0;
          for (i in otherPoints) {
            var r = otherPoints[i][0]; var c = otherPoints[i][1];
            grid[r][c] = 0;

          }
          //update grid to become 0s there
          break randomBlockLoop;
        }
        //now has gone through one orientation and checked all the conditions: if it worked, then condition Works is true, then add it and 
        //break out of orientations
        //has cond, rotate, and anchor
        //first check cond, if it works, use rotate and anchor to add block to unplaced
        //then take out all all the shit and break: break randomBlockLoop;

      }
      if (selectRandom.length === 1) {
        selectRandom.pop()
      } else {
        selectRandom = selectRandom.splice(selectRandom.indexOf(blockType), 1); //remove the block so it is not chosen again -- 
      }


    }
    
  }
  var totalSquares = 0;
  var totalBlocks = 0;
  for (i in unplacedBlocks) {
    switch(unplacedBlocks[i]['block-type']) {
      case '1x1':
        totalSquares += 1;
        break;
      case '2x2':
        totalSquares += 4;
        break;
      case '2x2-1':
        totalSquares += 3;
        break;
      case '2x1':
        totalSquares += 2;
        break;
    }
    totalBlocks++;
  }
  console.log('blocks:' + totalBlocks + 'squares:' + totalSquares);
  initBlocks();
}


if (document.getElementById('easy-difficulty') !== null) {
  squareWidth = gridView.offsetWidth/gridLength;
  //easy difficulty
  background = PIXI.Sprite.fromImage('images/6x6-grid.png');
  //background.x = (x/2)-(xOffset);
  //background.x = x/4;
  background.x = blocksView.offsetWidth-(xOffset);

  background.y = yOffset;
  background.width = gridView.offsetWidth;
  //background.width = x/2;
  background.height = gridView.offsetWidth;
  //background.height = x/2;
  stage.addChild(background);
  grid = new Array(gridHeight);
  for (var i = 0; i < gridHeight; i++) {
    grid[i] = new Array(gridLength);
    for (var j = 0; j < gridLength; j++) {
      grid[i][j] = -1;
    }
  }

  initiate();
  //generate board of 8x8
}

function determineBlockLocation(block, blockType, rotation) {
  switch(blockType) {
    case '1x1':
      block.widthScale = 1; block.heightScale = 1;

      block.initX = squareWidth + xOffset;
      block.initY = squareWidth + yOffset;
      break;
    case '2x1':
      block.widthScale = 2; block.heightScale = 1;
      if (rotation === Math.PI || rotation === 0) {
        block.initX = 3.125*squareWidth + xOffset;
      } else {
        block.initX = 5*squareWidth + xOffset;
      }
      
      block.initY = squareWidth + yOffset;
      break;
    case '2x2':
      block.widthScale = 2; block.heightScale = 2;

      block.initX = 1.25*squareWidth + xOffset;
      block.initY = 2.25*squareWidth + 2*yOffset;
      break;
    case '2x2-1':
      block.widthScale = 2; block.heightScale = 2;
      switch (rotation) {
        case 0:
          block.initX = 3.125*squareWidth + xOffset;
          block.initY = 2.25*squareWidth + 2*yOffset;
          break;
        case Math.PI:
          block.initX = 5*squareWidth + xOffset;
          block.initY = 2.25*squareWidth + 2*yOffset;
          break;
        case Math.PI/2:
        console.log('GOT PI/2')
          block.initX = squareWidth + xOffset;
          block.initY = squareWidth + 3*yOffset + 4*squareWidth + 1;
          break;
        case Math.PI*3/2:
          block.initX = 1.25*squareWidth + xOffset;
          block.initY = 3.5*squareWidth + 3*yOffset;
          break;
      }

      
      //block.y = squareWidth + 2*yOffset + 2*squareWidth;
      break;
  }
}

function initBlocks() {
  for (var i = 0; i < unplacedBlocks.length; i++) {
    var blockType = unplacedBlocks[i]['block-type'];
    var block = PIXI.Sprite.fromImage(blockTypeData[blockType].imageURL);
    //anchor block in the center for better visuals when picking up/placing
    block.anchor.x = 0.5; 
    block.anchor.y = 0.5;

    //this is a counter of the number of each block type -- used for displaying how many blocks of each are left to place
    

    //this determines how to display it (how many squares wide/tall)
    //block, blockType, rotation
    determineBlockLocation(block, blockType, unplacedBlocks[i]['rotation']);
    block.x = block.initX;
    block.y = block.initY;

    //fill in data for rotation
    //current points are the points that the block occupies -- used for when block is moved along grid (prev. values must be reset to 0)
    //from left is used to determine whether block can be placed, and if it does, which values in grid are changed
    //indicates in terms of L R U D LU LD RU RD where relative blocks are
    block.blockType = blockType;
    block.rotation = unplacedBlocks[i]['rotation'];
    block.fromLeft = unplacedBlocks[i]['from-left'];
    block.currentPoints = [];
    switch(unplacedBlocks[i]['rotation']) {
      case 0: 
        block.rotatedBy = '0';
        break;
      case Math.PI/2: 
        block.rotatedBy = 'pi/2';
        break;
      case Math.PI: 
        block.rotatedBy = 'pi';
        break;
      case Math.PI*(3/2): 
        block.rotatedBy = '3pi/2';
        break;
    }

    blockCounts[blockType + '|' + block.rotatedBy]++;
    //determine x and y placement
    //x can always be 1/10th into the screen
    //y can be ordered: 1x1 and 2x1 then 2x2-1 then 2x2 (each one has 1/3 of screen then?)
    //y can be separated by 1/3 of screen


    // block.x = 100;
    // block.y = 100;
    block.defaultWidth = (block.widthScale * squareWidth)-2;
    block.defaultHeight = (block.heightScale * squareWidth)-2;
    block.width = block.defaultWidth/2;
    block.height = block.defaultHeight/2;
    // if (blockType === '2x1') {
    //   block.y = 300;

    //   if (block.rotatedBy === 'pi/2') {
    //     block.y = 500;
    //     block.rotation = Math.PI/2;
    //   }
      
    // }


    block.anchorX = block.x;
    block.anchorY = block.y;
    block.interactive = true;
    block.buttonMode = true;
    block.moving = false;
    block.dragging = false;
    checkBlockWidth(this);
    
    block.mouseover = function(mouseData) {
        if (this.moving) {
            this.state = 'moving';
            stage.addChild(this);
        } else {
            block.state = 'mouseover';
            this.alpha = .6;
        }
    }

    block.mouseout = function(mouseData) {
      this.alpha = 1
    }


    block.mousedown = function(mouseData) {
      if (currentlyHoldingBlock !== this && currentlyHoldingBlock !== null) { //this means you're already holding one and clicked another
        return;
      }
      this.moving = !this.moving;
      if (!this.moving) { //no longer moving so tried to place
        checkBlockWidth(this);
        currentlyHoldingBlock = null;
        this.alpha = 1;
        this.dragging = false;
        this.data = null;
        var widthScale = this.widthScale;
        var heightScale = this.heightScale;
        if (this.blockType === '2x1' && (this.rotatedBy === 'pi/2' || this.rotatedBy === '3pi/2')) {
            var temp = heightScale;
            heightScale = widthScale;
            widthScale = temp;

        } 
        if (Math.round((this.x - (widthScale/2*squareWidth)) / squareWidth) >= gridLength) { //if block fits
          console.log('on grid');
          this.x = Math.round((this.x - (widthScale/2*squareWidth)) / squareWidth) * squareWidth - xOffset + 1 + (widthScale/2*squareWidth);
          this.y = Math.round((this.y - (heightScale/2*squareWidth)) / squareWidth) * squareWidth + 1 + yOffset  + (heightScale/2*squareWidth);

          var col = Math.round((this.x+xOffset)/squareWidth) - gridLength - 1;
          var row = Math.round((this.y-yOffset)/squareWidth) - 1;

          var pointDirections = this.fromLeft.split('+');
          //console.log(pointDirections);
          if (pointDirections.includes('0') && grid[row][col] === 1) {
            console.log('snapping back because current is taken' + 'r:' + row + 'c:' + col);
            this.x = this.anchorX;
            this.y = this.anchorY;
            blockCounts[this.blockType + '|' + this.rotatedBy]++;
            updateTexts();
            checkBlockWidth(this);
            // if (unplacedBlocks.indexOf(this) === -1) {
            //   unplacedBlocks.push(this);
            // }
            return;
          }
          for (point in pointDirections) {
            if (!testPoint(col, row, pointDirections[point].split(''))) {
              console.log('snapping back because adjacent is taken');
              this.x = this.anchorX;
              this.y = this.anchorY;
              blockCounts[this.blockType + '|' + this.rotatedBy]++;
              updateTexts();
              checkBlockWidth(this);
              // if (unplacedBlocks.indexOf(this) === -1) {
              //   unplacedBlocks.push(this);
              // }
              return;
            }
          }
          //now this works
          //update grid
          if(pointDirections.includes('0')) {
            grid[row][col] = 1;
          }
          for (point in this.currentPoints) {
            grid[this.currentPoints[point][0]][this.currentPoints[point][1]] = 0;
            
          }
          this.currentPoints = [];

          for (point in pointDirections) {
            updatePoint(col, row, pointDirections[point].split(''), this);
          }
          console.log('PLACED POINT=======');
          console.log(grid);
          // unplacedBlocks.splice(unplacedBlocks.indexOf(this), 1);
          checkWon();
        } else { //block does not fit -- clear current points
          console.log('not on grid');
          for (point in this.currentPoints) {
            grid[this.currentPoints[point][0]][this.currentPoints[point][1]] = 0;
          }
          this.currentPoints = [];
          this.x = this.anchorX;
          this.y = this.anchorY;
          blockCounts[this.blockType + '|' + this.rotatedBy]++;
          updateTexts();
          checkBlockWidth(this);
          // if (unplacedBlocks.indexOf(this) === -1) {
          //   unplacedBlocks.push(this);
          // }
        }
          
      } else { //now picking up block
        console.log('Picked up block');
        this.width = this.defaultWidth;
        this.height = this.defaultHeight;
        currentlyHoldingBlock = this;
        this.data = mouseData.data;
        for (point in this.currentPoints) {
          grid[this.currentPoints[point][0]][this.currentPoints[point][1]] = 0;
        }
        if (this.x < x/2) {
          blockCounts[this.blockType + '|' + this.rotatedBy]--;
        }
        
        console.log(blockCounts);
        updateTexts();
        this.currentPoints = [];
        console.log(grid);
          //this.dragging = true;
      }
    }

    block.mouseup = function(mouseData) {
      if (this.dragging) {
        checkBlockWidth(this);
        currentlyHoldingBlock = null;
        this.moving = false;
        this.alpha = 1;
        this.dragging = false;
        this.data = null;
        var widthScale = this.widthScale;
        var heightScale = this.heightScale;
        if (this.blockType === '2x1' && (this.rotatedBy === 'pi/2' || this.rotatedBy === '3pi/2')) {
            var temp = heightScale;
            heightScale = widthScale;
            widthScale = temp;

        } 
        if (Math.round((this.x - (widthScale/2*squareWidth)) / squareWidth) >= gridLength) {
          this.x = Math.round((this.x - (widthScale/2*squareWidth)) / squareWidth) * squareWidth - xOffset + 1 + (widthScale/2*squareWidth);
          this.y = Math.round((this.y - (heightScale/2*squareWidth)) / squareWidth) * squareWidth + 1 + yOffset  + (heightScale/2*squareWidth);

          var col = Math.round((this.x+xOffset)/squareWidth) - gridLength - 1;
          var row = Math.round((this.y-yOffset)/squareWidth) - 1;

          var pointDirections = this.fromLeft.split('+');
          //console.log(pointDirections);
          if (pointDirections.includes('0') && grid[row][col] === 1) {
            console.log('snapping back because current is taken' + 'r:' + row + 'c:' + col);
            this.x = this.anchorX;
            this.y = this.anchorY;
            blockCounts[this.blockType + '|' + this.rotatedBy]++;
            updateTexts();
            checkBlockWidth(this);
            // if (unplacedBlocks.indexOf(this) === -1) {
            //   unplacedBlocks.push(this);
            // }
            return;
          }
          for (point in pointDirections) {
            if (!testPoint(col, row, pointDirections[point].split(''))) {
              console.log('snapping back because adjacent is taken');
              this.x = this.anchorX;
              this.y = this.anchorY;
              blockCounts[this.blockType + '|' + this.rotatedBy]++;
              updateTexts();
              checkBlockWidth(this);
              // if (unplacedBlocks.indexOf(this) === -1) {
              //   unplacedBlocks.push(this);
              // }
              return;
            }
          }
          //now this works
          //update grid
          if(pointDirections.includes('0')) {
            grid[row][col] = 1;
          }
          for (point in this.currentPoints) {
            grid[this.currentPoints[point][0]][this.currentPoints[point][1]] = 0;
            
          }
          this.currentPoints = [];

          for (point in pointDirections) {
            updatePoint(col, row, pointDirections[point].split(''), this);
          }
          console.log('PLACED POINT=======');
          console.log(grid);
          //this.anchorX = this.x;
          //this.anchorY = this.y;
          // unplacedBlocks.splice(unplacedBlocks.indexOf(this), 1);
          checkWon();
        } else { //block does not fit
          if (this.currentPoints.length != 0) {
            for (point in this.currentPoints) {
              grid[this.currentPoints[point][0]][this.currentPoints[point][1]] = 0;
              
            }
            this.currentPoints = [];
          }
          this.x = this.anchorX;
          this.y = this.anchorY;
          blockCounts[this.blockType + '|' + this.rotatedBy]++;
          updateTexts();
          checkBlockWidth(this);
          // if (unplacedBlocks.indexOf(this) === -1) {
          //   unplacedBlocks.push(this);
          // }
          console.log('width: ' + this.width + 'height: ' + this.height);
        }
      }
    }

    block.mousemove = function(mouseData) {
        this.state = 'moving'
        if (this.moving) {
            this.dragging = true;
            var newPosition = this.data.getLocalPosition(this.parent);
            
            //moved here
            this.position.x = newPosition.x;
            this.position.y = newPosition.y;

            //checkBlockWidth(this);
         }
    }
    blocks.push(block);
    stage.addChild(block);
   
    
  }

  //this is now done with all blocks
  //init text next to blocks
  initBlockPlacement();
  initTexts();
}

function checkBlockWidth(block) {
  if (block.x > x/2) {
    block.width = block.defaultWidth;
    block.height = block.defaultHeight;
  } else {
    block.width = block.defaultWidth/2;
    block.height = block.defaultHeight/2;
  }
}

function initBlockPlacement() {

}

var text1x1;
var text2x10;
var text2x1rotate;
var text2x2;
var text2x2_10;
var text2x2_1pi;
var text2x2_13pihalf;

function clearTexts() {
  stage.removeChild(text1x1);
  stage.removeChild(text2x10);
  stage.removeChild(text2x1rotate);
  stage.removeChild(text2x2);
  stage.removeChild(text2x2_10);
  stage.removeChild(text2x2_1pi);
  stage.removeChild(text2x2_13pihalf);
}

function initTexts() {

  var style = new PIXI.TextStyle({
    fontFamily: 'Avenir',
    fontSize: 20,
    fontWeight: 'bold',
  });

  text1x1 = new PIXI.Text(blockCounts['1x1|0']+'x', style);
  text1x1.x = squareWidth + xOffset-squareWidth/2;
  text1x1.y = squareWidth;
  if (blockCounts['1x1|0'] !== 0) stage.addChild(text1x1);

  text2x10 = new PIXI.Text((blockCounts['2x1|0'] + blockCounts['2x1|pi']) +'x', style);
  text2x10.x = 2.375*squareWidth + xOffset;
  text2x10.y = squareWidth; 
  if (blockCounts['2x1|0'] + blockCounts['2x1|pi'] !== 0) stage.addChild(text2x10);

  text2x1rotate = new PIXI.Text((blockCounts['2x1|pi/2'] + blockCounts['2x1|3pi/2'])+'x', style);
  text2x1rotate.x = 4.25*squareWidth + xOffset;
  text2x1rotate.y = squareWidth;
  if (blockCounts['2x1|pi/2'] + blockCounts['2x1|3pi/2'] !== 0) stage.addChild(text2x1rotate);

  text2x2 = new PIXI.Text(blockCounts['2x2|0']+'x', style);
  text2x2.x = squareWidth + xOffset-squareWidth/2;
  text2x2.y = 2.125*squareWidth + 2*yOffset;
  if (blockCounts['2x2|0'] !== 0) stage.addChild(text2x2);

  text2x2_10 = new PIXI.Text(blockCounts['2x2-1|0']+'x', style);
  text2x2_10.x = 2.375*squareWidth + xOffset;
  text2x2_10.y = 2.125*squareWidth + 2*yOffset;
  if (blockCounts['2x2-1|0'] !== 0) stage.addChild(text2x2_10);

  text2x2_1pi = new PIXI.Text(blockCounts['2x2-1|pi']+'x', style);
  text2x2_1pi.x = 4.25*squareWidth + xOffset;
  text2x2_1pi.y = 2.125*squareWidth + 2*yOffset;
  if (blockCounts['2x2-1|pi'] !== 0) stage.addChild(text2x2_1pi);


//below
  text2x2_13pihalf = new PIXI.Text(blockCounts['2x2-1|3pi/2']+'x', style);
  text2x2_13pihalf.x = squareWidth + xOffset-squareWidth/2;
  text2x2_13pihalf.y = 3.5*squareWidth + 3*yOffset;
  if (blockCounts['2x2-1|3pi/2'] !== 0) stage.addChild(text2x2_13pihalf);
}

function updateTexts() {
  text1x1.setText(blockCounts['1x1|0']+'x');

  text2x10.setText((blockCounts['2x1|0'] + blockCounts['2x1|pi']) +'x');

  text2x1rotate.setText((blockCounts['2x1|pi/2'] + blockCounts['2x1|3pi/2'])+'x');

  text2x2.setText(blockCounts['2x2|0']+'x');

  text2x2_10.setText(blockCounts['2x2-1|0']+'x');

  text2x2_1pi.setText(blockCounts['2x2-1|pi']+'x');

  text2x2_13pihalf.setText(blockCounts['2x2-1|3pi/2']+'x');

}

function testPoint(col, row, pointDirection) {
  var testRow = row; var testCol = col;
  while (pointDirection.length > 0) {
    var dir = pointDirection.pop(); //dir will either be R L U D
    switch (dir) {
      case '0': break;
      case 'R':
        testCol += 1;
        break;
      case 'L':
        testCol -= 1;
        break;
      case 'U':
        testRow -= 1;
        break;
      case 'D': 
        testRow += 1;
        break;
    }
  }

  //now testRow and testCol should be the correct grid location
  //check that it is in bounds
  if (testRow < 0 || testRow >= gridHeight || testCol < 0 || testCol >= gridLength) {
    return false; 
  } else if (grid[testRow][testCol] === 1) {
    return false;
  } else {
    return true;
  }
}

function updatePoint(col, row, pointDirection, block) {
  var testRow = row; var testCol = col;
  while (pointDirection.length > 0) {
    var dir = pointDirection.pop(); //dir will either be R L U D
    switch (dir) {
      case 'R':
        testCol += 1;
        break;
      case 'L':
        testCol -= 1;
        break;
      case 'U':
        testRow -= 1;
        break;
      case 'D': 
        testRow += 1;
        break;
    }
  }
  grid[testRow][testCol] = 1;
  block.currentPoints.push([testRow, testCol]);
}

function checkWon() {
  for (var i in grid) {
    if (grid[i].includes(0)) {
      return false;
    }
  }
  //do something about winning now because its over!!
  console.log('WON WON WON!!!');

  document.getElementById('finished-button').style.visibility = 'visible';

  return true;
}

animate();

function animate() {
  requestAnimationFrame(animate);
  // render the root container
  renderer.render(stage);
};
