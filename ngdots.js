"use strict";

var app = angular.module("box_game", []);

app.controller("box_ctrl", ["$scope", "$rootScope", "$timeout", "$interval", "$filter", "turn_update", "data",function ($scope, $rootScope, $timeout, $interval, $filter, turn_update, data) {

  /**********  application variables  **********/
  $scope.my_score = "00";
  $scope.your_score = "00";
  $scope.headerText = "Restart";
  $rootScope.computerTurn = false;
  $scope.totalBoxes = 64;
  $scope.timer_mins = "02";
  $scope.timer_secs = "00";
  $scope.time = "2min";
  $rootScope.totalTurns = 0;
  $rootScope.disabled = false;
  $rootScope.gridLength = 64;
  $rootScope.pathFinder;
  $rootScope.endGame = false;
  //used to ngRepeat through the grid squares
  $scope.grid = [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,
                 26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,
                 49,50,51,52,53,54,55,56,57,58,59,60,61,62,63];
  //used to indicate whos turn it is (even#: myturn, odd#: yourturn)
  $rootScope.whos_turn = 0;
  /**********  complete: application variables  **********/



  /**********  test button  **********/
  //disable the computer from taking to turn (used only for testing purposes)
  $rootScope.disableComputer = () => {
      $rootScope.disabled = !$rootScope.disabled;
  };
  /**********  end: test button  **********/



  /**********  reset button  **********/
      $scope.reset = () => {
        $scope.play();
        //reset the reset button text
        $("#reset_text").text("Restart");
        //reset gameboard start indication (used to start the time clock)
        $("#gameboard").removeClass("start");
        //reset scores
        $scope.my_score = $filter("reset_numbers")($scope.my_score);
        $scope.your_score = $filter("reset_numbers")($scope.your_score);
        //reset start time
        $rootScope.timeSelect = true;
        //reset timer
        $rootScope.startGame = false;
        $scope.timer_mins = "02";
        $scope.timer_secs = "00";
        //reset background and borders and other classes
        $(".grid").removeClass("myPoint")
                  .removeClass("yourPoint")
                  .css("border", "0.15em dashed #DDD")
                  .removeClass("you")
                  .removeClass("me");
        //reset the checkers
        $(".checker").attr("data", 0);
        //side checks
        $(".side").attr("data", "false");
        //reset turn opacity and turn variable
        $(".my_score").css("opacity", "1");
        $(".your_score").css("opacity", "0.4");
        $rootScope.whos_turn = 0;
        //remove all path related classes
        $(".grid").removeClass("middlePathBox");
        $(".grid").removeClass("pathEnd");
        $(".grid").removeClass("pathAccounted");
    };

    $scope.play = () => {
      let playGame = new Audio('audio/introSound.wav');
      $(".countDown").css("display", "flex");
        playGame.play();
        $(".countDownBox span").css("opacity", 1).text("3");
        $timeout(function () {
          $(".countDownBox span").text("2");
          $timeout(function () {
            $(".countDownBox span").text("1");
            $timeout(function () {
              $(".countDownBox span").text("GO");
              $timeout(function () {
                $(".countDown").css("display", "none");
              }, 300);
            }, 1000);
          }, 1000);
        }, 1000);
    }
  /**********  complete: reset button  **********/



  /**********  start game when first line is pressed  **********/
  //update timer every sec
  $interval(function () {
          if( $("#gameboard").hasClass("start") && ($rootScope.whos_turn%2 == 0) ){
              //update timer
              //convert the number for incrementing
              $scope.timer_mins = parseInt($scope.timer_mins);
              $scope.timer_secs = parseInt($scope.timer_secs);
              //increment secs by 1
              $scope.timer_secs--;

              if($scope.timer_secs == -1){
                  $scope.timer_secs = 59;
                  $scope.timer_mins--;
              }

              if(($scope.timer_secs == 0) && ($scope.timer_mins == 0)){
                  $("#gameboard").removeClass("start");
              }

              if(($scope.timer_secs == 0) && ($scope.timer_mins == 0) && ($scope.totalScore != 64)){
                  //$scope.headerText = "You Lose!";
              }
              //turn them ino two digit numbers
              $scope.timer_secs = $filter("double_digit")($scope.timer_secs);
              $scope.timer_mins = $filter("double_digit")($scope.timer_mins);
          }
      }, 1000);
  /**********  complete: start game when first dot is pressed  **********/



  /**********  game flow  **********/
  //watch for a turn change and update the opacity of the scores to indicate whos turn it is -> the turn player is the number that is NOT faded out
  $rootScope.$watch("whos_turn", (newValue, oldValue) => {
      if(newValue != oldValue) {
          turn_update.opacity($rootScope.whos_turn);
          turn_update.clickableLines($rootScope.whos_turn);
      }
  });

  //update score an check for winner -> this updates everytime a line is pressed because totalTurns is incremented by 1 everytime a line is pressed
  $rootScope.$watch("totalTurns", (newValue, oldValue) => {
     if(newValue != oldValue){
         //get the number of highlighted boxes for each players (indicated by number of "me" and "you" classes)
         $scope.my_score = data.updateScore("myScore");
         $scope.your_score = data.updateScore("computerScore");
         $scope.totalScore = $scope.my_score + $scope.your_score;
     }
  });
  /**********  complete: game flow  **********/



  /**********  mantain grid box dimensions / update turn indicator opacity  **********/
  $interval( function () {
          var gameWidth = $("#gameboard").width();
          var borderWidth = $(".grid").css("borderWidth");
          var gridWidth = gameWidth * 0.125;
          var gridHeight = gridWidth;
          $(".grid").css("width", gridWidth);
          $(".grid").css("height", gridHeight);
      }, 100);
  /**********  complete: mantain grid box width relative to height  **********/



}]);

app.controller("line_click", ["$scope", "$rootScope", "$filter", "$timeout", "data", "map", "click",
                              function ($scope, $rootScope, $filter, $timeout, data, map, click){

  $scope.audio = "audio";
  $scope.edge_click = ($event) => {

      //track total amount of turns => when this value changes we know to update the score (functionality used in box_ctrl)
      $rootScope.totalTurns++;

      //start the game clock => when the class is set to start the clcok will start (the functionality is controlled in the box_ctrl)
      $("#gameboard").addClass("start");

      //cache array for: this box's, and it's adjacet box's, data attr value and the side that was clicked
      var thisBoxes = $filter("find")($event);

      let thisBox = map.boxes($event);
      const validLineClick = ( thisBox != false );
      //console.log(thisBox);


      ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////there is a bug at 162

      //if side check == false that side has not been previously clicked
      if( !thisBox.hasBeenClicked && validLineClick){
          //change turn when line is clicked (even#:1st player tun, odd#:computer turn) -> the turn update is handled in box_ctrl
          $rootScope.whos_turn++;

          //make cliked boxes
          map.markBoxes(thisBox);

          //perform line clicked
          click.line(thisBox);

          //fill box if needed
          click.fill( thisBox );

      }  //end: if( side_check == "false" )

      const isComputerTurn = (($rootScope.whos_turn%2 != 0) && ($rootScope.disabled == false));
      //cache the computer's move response time to use in the timeout
      const computerResponseTime = 400;
      //delay computer turn
      $timeout( function () {

          if(isComputerTurn){

              //check for boxes with 0-3 lines to decide the best move
              const noLine = $(".grid").children(".checker[data=0]").parent().attr("data");
              const oneLine = $(".grid").children(".checker[data=1]").parent().attr("data");
              const twoLines = $(".grid").children(".checker[data=2]").parent().attr("data");
              const threeLines = $(".grid").children(".checker[data=3]").parent().attr("data");

              //fill chose a box to change
              if(threeLines != undefined){

                //get click obj
                let obj = click.threeLineClick(threeLines);

                //initiate computer move
                $scope.edge_click(obj);

              } else if( $rootScope.endGame ){

                const obj = click.endGame();
                //initiate computer move
                $scope.edge_click(obj);

              } else if((noLine != undefined) || (oneLine != undefined)){

                //get click obj
                let obj = click.noLineClick();

                if(obj === false){

                  //declare end end to skip over non-endgame logic
                  $rootScope.endGame = true;

                  const obj = click.endGame();
                  //initiate computer move
                  $scope.edge_click(obj);

                } else {
                  //initiate computer move
                  $scope.edge_click(obj);
                }

              } // end: else if((noLine != undefined) || (oneLine != undefined))

          } // end: if(isComputerTurn)

      }, computerResponseTime); // end: $timeout

  }  //end: $scope.edge_click = function ($event)

}]);

app.controller("outOfGamePlayFunction", ["$scope", "$interval", "$timeout", function($scope, $interval, $timeout) {

  $scope.winStatus = "You Win!";
  $scope.menu = "Main Menu"
  $scope.quickStart = "quick start";
  $scope.directions = "directions";
  $scope.score = 0;
  $scope.points = 1000;
  $scope.starOne = true;
  $scope.starTwo = true;
  $scope.starThree = true;
  $scope.endGameWatch = true;

  //increment speed for end game score
  let incrementSpeed = 10;

  //sounds
  const youwin = new Audio('audio/youWinSound.wav');
  const youlose = new Audio('audio/youLoseSound.wav');
  const score = new Audio('audio/points.wav');

  //watch for the end of the game
  $scope.watch = () => {
    let endGame = $interval(function () {
      let myScore = $("#me span").text();
      let yourScore = $("#you span").text();
      myScore = parseInt(myScore);
      yourScore = parseInt(yourScore);
      let totalScore = myScore + yourScore;

      if(totalScore === 64){
        $scope.endGameWatch = false;
        $(".gameCompletionPage").fadeIn();
        //determine winner
        if(myScore > yourScore){
          youwin.play();
          $scope.winStatus = "You Win!";
          $(".winStatus").css("color", "#87E9FF");
          $scope.points = 1000;
          //start score count
          $timeout(function () {
            $scope.timeCount();
          }, 800);
        }
        else if(myScore < yourScore){
          youlose.play();
          $scope.winStatus = "You Lose!";
          $(".winStatus").css("color", "#C12B5F");
          $scope.points = 0;
          $scope.timeCountTest(10);
        }
        else if(myScore === yourScore){ console.log("draw") }
      }

      //stop the interval count
      if($scope.endGameWatch === false){
          $interval.cancel(endGame);
      }
    }, 2000);
  }
  //increment the score
  $scope.timeCount = (incrementSpeed) => {
    score.play();
    let scoreIncrement = $interval(function () {
      $scope.score = Math.floor( $scope.score + $scope.points/80 );

      //star indicator
      if($scope.score > 300){ $(".starOne").css("opacity", 1) }
      if($scope.score > 650){ $(".starTwo").css("opacity", 1) }
      if($scope.score > 950){ $(".starThree").css("opacity", 1) }

      if($scope.score >= $scope.points){
        $scope.score = $scope.points;
        $interval.cancel(scoreIncrement);
      }
    }, incrementSpeed);
  }

  $scope.watch();

  //game sounds
  const playGame = new Audio('audio/introSound.wav');
  const pregame = new Audio('audio/preGameMusic.wav');

  var pregameMusic = document.getElementById("myAudio");
  var gameBoardPage = () => {
    $(".menuPage").fadeOut();
    pregameMusic.pause();
  }

  //initiate the game
  $scope.play = () => {
    gameBoardPage();
    $(".countDown").css("display", "flex");
    playGame.play();
    $(".countDownBox span").css("opacity", 1).text("3");
    $timeout(function () {
      $(".countDownBox span").text("2");
      $timeout(function () {
        $(".countDownBox span").text("1");
        $timeout(function () {
          $(".countDownBox span").text("GO");
          $timeout(function () {
            $(".countDown").css("display", "none");
            $(".countDownBox span").text("3");
          }, 300);
        }, 1000);
      }, 1000);
    }, 1000);
  }
  //back main menuPage
  $scope.mainMenu = () => {
    $(".gameCompletionPage").fadeOut();
    $timeout( () => { $(".menuPage").fadeIn() }, 800);
  }

}]);

app.service("data", function ($filter) {

    this.updateScore = (request, total, myScore, computerScore) => {

        //returns a value based off of what is asked for
        if(request == "myScore"){
            //return my score
            this.myScore = $(".grid[class*=my]").length;
            this.myScore = $filter("double_digit")(this.myScore);
            return this.myScore;
        } else if (request == "computerScore") {
            //return computer score
            this.computerScore = $(".grid[class*=your]").length;
            this.computerScore = $filter("double_digit")(this.computerScore);
            return this.computerScore;
        }

        if(32 > myScore){
            $("#reset_text").text("You Lose!");
            //stop the game clock
            $("#gameboard").removeClass("start");
        } else if(32 < myScore) {
            $("#reset_text").text("You Win!");
            //stop the game clock
            $("#gameboard").removeClass("start");
        } else if( (myScore + computerScore) == 64 ){
            $("#reset_text").text("Draw!");
            //stop the game clock
            $("#gameboard").removeClass("start");
        }
    };

});

app.service("turn_update", function ($rootScope) {
	this.opacity = (turn_number) => {
		if (turn_number%2 == 1){
			$(".my_score").css("opacity", 0.4);
			$(".your_score").css("opacity", 1);
		} else if (turn_number%2 == 0){
			$(".my_score").css("opacity", 1);
			$(".your_score").css("opacity", 0.4);
		}
	}

    this.clickableLines = (turn_number) => {
		if (turn_number%2 == 1){
			$rootScope.computerTurn = true;
		} else if (turn_number%2 == 0){
			$rootScope.computerTurn = false;
		}
	}
});

app.service("map", function($filter) {

  //return the position of the box as strings -> ex: "topRight", "rightSide", "middle", "topSide"
  //fn(number)
  this.position = (dataLocation) => {

    const data = dataLocation;
    //top right corner box
    const topRight = ( data == 7 );
    //top left corner box
    const topLeft = ( data == 0 );
    //bottom right corner box
    const bottomRight = ( data == 63 );
    //bottome left corner
    const bottomeLeft = ( data == 56 );
    //top side boxes
    const topSide = ( data === 1 || data === 2 || data === 3 || data === 4 || data === 5 || data === 6 );
    //bottom side boxes
    const bottomSide = ( data == 57 || data == 58 || data == 59 || data == 60 || data == 61 || data == 62 );
    //right side boxes
    const rightSide = ( data == 15 || data == 23 || data == 31 || data == 39 || data == 47 || data == 55 );
    //left side boxes
    const leftSide = ( data == 8 || data == 16 || data == 24 || data == 32 || data == 40 || data == 48 );

    if( topRight ) { return "topRight" }
    else if( topLeft ) { return "topLeft" }
    else if( bottomRight ) { return "bottomRight" }
    else if( bottomeLeft ) { return "bottomeLeft" }
    else if( rightSide ) { return "rightSide" }
    else if( leftSide ) { return "leftSide" }
    else if( topSide ) { return "topSide" }
    else if( bottomSide ) { return "bottomSide" }
    else { return "middle" }

  }

  //return the surrounding boxes as an array of numbers -> ex: 1, 10, 56
  //fn(string, number)
  this.surroundingBoxes = (position, dataLocation) => {

    let surroundingBoxArray = [];
    if( position === "topRight" ) {
      surroundingBoxArray.push( dataLocation + 8 );
      surroundingBoxArray.push( dataLocation - 1 );
    } else if( position === "topLeft" ) {
      surroundingBoxArray.push( dataLocation + 1 );
      surroundingBoxArray.push( dataLocation + 8 );
    } else if( position === "bottomRight" ) {
      surroundingBoxArray.push( dataLocation - 8 );
      surroundingBoxArray.push( dataLocation - 1 );
    } else if( position === "bottomeLeft" ) {
      surroundingBoxArray.push( dataLocation - 8 );
      surroundingBoxArray.push( dataLocation + 1 );
    } else if( position === "rightSide" ) {
      surroundingBoxArray.push( dataLocation - 8 );
      surroundingBoxArray.push( dataLocation + 8 );
      surroundingBoxArray.push( dataLocation - 1 );
    } else if( position === "leftSide" ) {
      surroundingBoxArray.push( dataLocation - 8 );
      surroundingBoxArray.push( dataLocation + 1 );
      surroundingBoxArray.push( dataLocation + 8 );
    } else if( position === "middle" ){
      surroundingBoxArray.push( dataLocation - 8 );
      surroundingBoxArray.push( dataLocation + 1 );
      surroundingBoxArray.push( dataLocation + 8 );
      surroundingBoxArray.push( dataLocation - 1 );
    } else if( position == "topSide" ){
      surroundingBoxArray.push( dataLocation + 1 );
      surroundingBoxArray.push( dataLocation + 8 );
      surroundingBoxArray.push( dataLocation - 1 );
    } else if( position == "bottomSide" ){
      surroundingBoxArray.push( dataLocation - 8 );
      surroundingBoxArray.push( dataLocation + 1 );
      surroundingBoxArray.push( dataLocation - 1 );
    }

    return surroundingBoxArray;

  }

  //return this box side clicked as is string -> ex: "top", "right"
  //fn(event obj)
  this.sideClicked = ($event) => {

    let sideClicked = "";
    //cache var to account for the screen size when offsets are compared
    const gameWidth = $("#gameboard").width();
    const gridWidthComparer = gameWidth * 0.125 * 0.7;
    //the side clicked is by the offset and the screen size
		if( $event.offsetY < 10 ){ sideClicked = "top" }
    else if( $event.offsetX > gridWidthComparer ){ sideClicked = "right" }
		else if( $event.offsetY > gridWidthComparer ){ sideClicked = "bottom" }
		else if( $event.offsetX < 10 ){ sideClicked = "left" }
    else { return false };

    return sideClicked;

  }

  //return adj box side that was clicked as is string -> ex: "top", "right"
  //fn(string)
  this.oppositeSide = (side) => {

    if( side == "top" ){ return "bottom" }
    else if( side == "right" ){ return "left" }
    else if( side == "bottom" ){ return "top" }
    else if( side == "left" ){ return "right" }

  }

  //return if a line has already been clicked as a boolean
  //fn(number, string)
  this.isLineAlreadyCicked = (dataLocation, side) => {

    const hasBeenClicked = ( $(".grid[data=" + dataLocation + "]").children("#" + side).attr("data") === "true" );
    return hasBeenClicked;

  }

  //returns all lines click and associated boxes as an object
  //fn(event obj)
  this.boxes = ($event) => {
    //return object that includes:  1. this box position
    //                              2. the line that was clicked
    //                              3. the adjcent box position (if applicable)
    //                              4. the adjcent box line that was clicked (if applicable)

    const object = {};

    let dataLocation = $event.target.attributes.data.nodeValue;
    dataLocation = parseInt(dataLocation);
    const sideClicked = this.sideClicked($event);

    if(sideClicked != false){

      const oppositeSideClicked = this.oppositeSide(sideClicked);
      const positionOnBoard = this.position(dataLocation);
      const surroundingBoxes = this.surroundingBoxes(positionOnBoard, dataLocation);
      const hasBeenClicked = this.isLineAlreadyCicked(dataLocation, sideClicked);

      object.thisBoxLocation = dataLocation;
      object.thisBoxSideClick = sideClicked;
      object.hasBeenClicked = hasBeenClicked;
      object.hasAdjBox = false;

      let possibleAdjBox;

      if( sideClicked === "top" ){ possibleAdjBox = dataLocation - 8 }
      else if( sideClicked === "right" ){ possibleAdjBox = dataLocation + 1 }
      else if( sideClicked === "bottom" ){ possibleAdjBox = dataLocation + 8 }
      else if( sideClicked === "left" ){ possibleAdjBox = dataLocation - 1 }

      const adjBoxInSurroundBoxes = ( surroundingBoxes.indexOf(possibleAdjBox) != -1 );
      if( adjBoxInSurroundBoxes ){
        object.hasAdjBox = true;
        object.adjBox = possibleAdjBox;
        object.adjBoxSideClick = oppositeSideClicked;
      }

      return object;

    }

    //returns false if there wasn't to side clicked
    return false;

  }

  //increment .checker data -> the increment number respresents how many sides are highlighted
  //fn(object)
  this.markBoxes = (thisBox) => {

      //cache line increment number indicators -> ".check[data]"
      var data = $filter("increment_value")(thisBox.thisBoxLocation);
      //assign incremented line values to the boxes
      $(".grid[data=" + thisBox.thisBoxLocation + "]").children(".checker").attr("data", data);
      //indicate this line been clicked
      $(".grid[data=" + thisBox.thisBoxLocation + "]").children("#" + thisBox.thisBoxSideClick + "").attr("data", "true");

      if( thisBox.hasAdjBox ){
        var dataAdj = $filter("increment_value")(thisBox.adjBox);
        $(".grid[data=" + thisBox.adjBox + "]").children(".checker").attr("data", dataAdj);
        $(".grid[data=" + thisBox.adjBox + "]").children("#" + thisBox.adjBoxSideClick + "").attr("data", "true");
      }

    }

});

app.service("click", function($rootScope, $filter, map){

  //indicates where the last move was ms-radial-gradient
  this.clickCircle = (dataLocation, offsetX, offsetY) => {

    const leftClickPosition = angular.element(document.getElementById( dataLocation )).prop('offsetLeft');
    const topClickPosition = angular.element(document.getElementById( dataLocation )).prop('offsetTop');
    const clientHeight = angular.element(document.getElementById( dataLocation )).prop('clientHeight');
    const clientWidth = angular.element(document.getElementById( dataLocation )).prop('clientWidth');

    let clickX;
    let clickY;

    if(typeof offsetX === "number"){
      if(offsetX === 1){ // left click
        clickX = leftClickPosition - 16;
        clickY = (topClickPosition + (clientHeight / 2)) - 16;
      } else if(offsetX === 1000){ // right click
        clickX = (leftClickPosition + clientWidth) - 16;
        clickY = (topClickPosition + (clientHeight / 2)) - 16;
      }
    } else if (typeof offsetY === "number") {
      if(offsetY === 1){ // top click
        clickX = (leftClickPosition + (clientWidth / 2)) - 16;
        clickY = topClickPosition - 16;
      } else if(offsetY === 1000){ // bottom click
        clickX = (leftClickPosition + (clientWidth / 2)) - 16;
        clickY = (topClickPosition + clientHeight) - 16;
      }
    }

    $("#clickCircle").css("left", clickX).css("top", clickY);
    $("#clickCircle").show().fadeOut(300);

  }

  //perform a box fill
  //fn(object)
  this.fill = (thisBox) => {

    //sound effect controller
    let notFilled = true;

    //cache box fill check
    const isThisBoxFillable = ( $(".grid[data=" + thisBox.thisBoxLocation + "]").children(".checker").attr("data") == 4 );
    const isAdjBoxFillable = ( $(".grid[data=" + thisBox.adjBox + "]").children(".checker").attr("data") == 4 );

    if($rootScope.whos_turn%2 == 0){
      //audio
      const playGame = new Audio('audio/fill.wav');
      playGame.play();

      //the gridboxes w/ the class yourPoint get filled w/ the opponent color
      if( isThisBoxFillable ){ $(".grid[data=" + thisBox.thisBoxLocation + "]").addClass("yourPoint"); notFilled = false; }
      if( isAdjBoxFillable ){ $(".grid[data=" + thisBox.adjBox + "]").addClass("yourPoint"); notFilled = false; }

      if( isThisBoxFillable || isAdjBoxFillable ){
        //reset the turn so the player that scored can go again
        $rootScope.whos_turn--;
      }

    } else {
      //audio
      const playGame = new Audio('audio/fill.wav');
      playGame.play();

      //the gridboxes w/ the class myPoint get filled w/ your color
      if( isThisBoxFillable ){ $(".grid[data=" + thisBox.thisBoxLocation + "]").addClass("myPoint"); notFilled = false; }
      if( isAdjBoxFillable ){ $(".grid[data=" + thisBox.adjBox + "]").addClass("myPoint"); notFilled = false; }

      if( isThisBoxFillable || isAdjBoxFillable ){
        //reset the turn so the player that scored can go again
        $rootScope.whos_turn--;
      }

    }

    if(notFilled){
      var audio = new Audio('audio/click.wav');
      audio.play();
    }

  };

  //perform line click on appropriate boxes
  //fn(object)
  this.line = (thisBox) => {

    //perform line click on this box
    if( thisBox.thisBoxSideClick === "top" ){ $(".grid[data=" + thisBox.thisBoxLocation + "]").css("borderTopColor", "blue") }
    else if( thisBox.thisBoxSideClick === "right" ){ $(".grid[data=" + thisBox.thisBoxLocation + "]").css("borderRightColor", "blue") }
    else if( thisBox.thisBoxSideClick === "bottom" ){ $(".grid[data=" + thisBox.thisBoxLocation + "]").css("borderBottomColor", "blue") }
    else if( thisBox.thisBoxSideClick === "left" ){ $(".grid[data=" + thisBox.thisBoxLocation + "]").css("borderLeftColor", "blue") }

    if( thisBox.hasAdjBox ){
      if( thisBox.thisBoxSideClick === "top" ){ $(".grid[data=" + thisBox.adjBox + "]").css("borderBottomColor", "blue") }
      else if( thisBox.thisBoxSideClick === "right" ){ $(".grid[data=" + thisBox.adjBox + "]").css("borderLeftColor", "blue") }
      else if( thisBox.thisBoxSideClick === "bottom" ){ $(".grid[data=" + thisBox.adjBox + "]").css("borderTopColor", "blue") }
      else if( thisBox.thisBoxSideClick === "left" ){ $(".grid[data=" + thisBox.adjBox + "]").css("borderRightColor", "blue") }
    }

	};

  //return object with box in question and connection boolean
  //fn(number, number)
  this.isConnected = (startLocation, surroundingBox) => {

    var difference = startLocation - surroundingBox;
    let safeBox = {};

    if(difference === 8){
      safeBox.side = "top";
      safeBox.isConnected = ( $(".grid[data=" + startLocation + "]").children("#top").attr("data") === "true" );
      return safeBox;
    } else if(difference === -1){
      safeBox.side = "right";
      safeBox.isConnected = ( $(".grid[data=" + startLocation + "]").children("#right").attr("data") === "true" );
      return safeBox;
    } else if(difference === -8){
      safeBox.side = "bottom";
      safeBox.isConnected = ( $(".grid[data=" + startLocation + "]").children("#bottom").attr("data") === "true" );
      return safeBox;
    } else if(difference === 1){
      safeBox.side = "left";
      safeBox.isConnected = ( $(".grid[data=" + startLocation + "]").children("#left").attr("data") === "true" );
      return safeBox;
    }

  }

  //returns true if the location has no lines clicked
  //fn(number)
  this.hasNoLine = (dataLocation) => {

    const hasOneLine = ( $(".grid[data=" + dataLocation + "]").children(".checker").attr("data") == 0 );
    return hasOneLine;

  }

  //returns true if the location has one line
  //fn(number)
  this.hasOneLine = (dataLocation) => {

    const hasOneLine = ( $(".grid[data=" + dataLocation + "]").children(".checker").attr("data") == 1 );
    return hasOneLine;

  }

  //returns true if the location has one line
  //fn(number)
  this.hasTwoLines = (dataLocation) => {

    const hasTwoLines = ( $(".grid[data=" + dataLocation + "]").children(".checker").attr("data") == 2 );
    return hasTwoLines;

  }

  //returns the opposite edge -> top:bottom or right:left
  //fn(string)
  this.findOppositeEdge = (position) => {

    if( position === "topRight" ){ return "right" }
    else if( position === "topLeft" ){ return "left" }
    else if( position === "bottomRight" ){ return "right" }
    else if( position === "bottomeLeft" ){ return "left" }
    else if( position === "rightSide" ){ return "right" }
    else if( position === "leftSide" ){ return "left" }
    else if( position === "topSide" ){ return "top" }
    else if( position === "bottomSide" ){ return "bottom" }

  }

  //return an object with all open lines and locations
  //fn(number)
  this.findUnclickedLinesAndConnecedBoxes = (dataLocation) => {

    //init return obj
    let openLines = {};

    let position = map.position(dataLocation);
    let surroundingBoxes = map.surroundingBoxes(position, dataLocation);
    let l = surroundingBoxes.length;

    //used to check if the box is around the dataLocation box
    let possibleSurroundingBoxes = [ (dataLocation - 8) , (dataLocation + 1) , (dataLocation + 8) , (dataLocation - 1) ];

    let associatedPositions = [];

    for(let i = 0; i < l; i++){

      let positionCheck = possibleSurroundingBoxes.indexOf(surroundingBoxes[i]);

      if(positionCheck != -1){

        let adjLocation;

        //set adjcent box dataLocation
        if(positionCheck === 0){ adjLocation = dataLocation - 8; }
        else if(positionCheck === 1){ adjLocation = dataLocation + 1; }
        else if(positionCheck === 2){ adjLocation = dataLocation + 8; }
        else if(positionCheck === 3){ adjLocation = dataLocation - 1; }

        let hasTwoLines = this.hasTwoLines(adjLocation);

        if(hasTwoLines){
          if(positionCheck === 0){ associatedPositions.push("top") }
          else if(positionCheck === 1){ associatedPositions.push("right") }
          else if(positionCheck === 2){ associatedPositions.push("bottom") }
          else if(positionCheck === 3){ associatedPositions.push("left") }
        }

      }

    }

    const noNextBoxFound = ( associatedPositions.length === 0 );

    if(noNextBoxFound){
      return -1;
    }

    if(associatedPositions.indexOf("top") != -1){
      let isTopOpen = ( $(".grid[data=" + dataLocation + "]").children("#top").attr("data") === "false" );
      if(isTopOpen === true){
        let temp = [possibleSurroundingBoxes[0], "top"];
        openLines.one = temp;
      };
    }
    if(associatedPositions.indexOf("right") != -1){
      let isRightOpen = ( $(".grid[data=" + dataLocation + "]").children("#right").attr("data") === "false" );
      if(isRightOpen === true){
        let temp = [possibleSurroundingBoxes[1], "right"];
        openLines.two = temp;
      };
    }
    if(associatedPositions.indexOf("bottom") != -1){
      let isBottomOpen = ( $(".grid[data=" + dataLocation + "]").children("#bottom").attr("data") === "false" );
      if(isBottomOpen === true){
        let temp = [possibleSurroundingBoxes[2], "bottom"];
        openLines.three = temp;
      };
    }
    if(associatedPositions.indexOf("left") != -1){
      let isLeftOpen = ( $(".grid[data=" + dataLocation + "]").children("#left").attr("data") === "false" );
      if(isLeftOpen === true){
        let temp = [possibleSurroundingBoxes[3], "left"];
        openLines.four = temp;
      };
    }

    return openLines;

  }

  //check to see if the edge an edge box is clicked
  //fn(number, string)
  this.edgeNotClicked = (dataLocation, position) => {

    let sideToCheck;

    if( position === "topRight" ){ sideToCheck = "right" }
    else if( position === "topLeft" ){ sideToCheck = "left" }
    else if( position === "bottomRight" ){ sideToCheck = "right" }
    else if( position === "bottomeLeft" ){ sideToCheck = "left" }
    else if( position === "rightSide" ){ sideToCheck = "right" }
    else if( position === "leftSide" ){ sideToCheck = "left" }
    else if( position === "topSide" ){ sideToCheck = "top" }
    else if( position === "bottomSide" ){ sideToCheck = "bottom" }

    let isEdgeNotClicked = ( $(".grid[data=" + dataLocation + "]").children("." + sideToCheck).attr("data") === "false" );

    return isEdgeNotClicked;

  }

  //return an object with a box number and a click side
  //check for a safe line click -> used when there is at least one boxe with no clicked lines on the board
  this.noLineClick = () => {

    //choose a random box to make computer moves unpredictable
    let startLocation = $filter("randomNumBetween")(0, 64);

    let count = 0;
    //this will set to true and stop the loop if a click box is found
    let found = false;

    //attempt to find a clickable box
    while(count < 64){

      var hasNoLine = this.hasNoLine(startLocation);
      var hasOneLine = this.hasOneLine(startLocation);

      if(hasNoLine || hasOneLine){
        //get surrounding boxes and check for a one or to line click
        let position = map.position(startLocation);
        let surroundingBoxes = map.surroundingBoxes(position, startLocation);
        let l = surroundingBoxes.length;

        //go through the surrounding boxes to find one with 0 or 1 line clicked
        for( let i = 0; i < l; i++){
          var surBoxHasNoLine = this.hasNoLine(surroundingBoxes[i]);
          var surBoxHasOneLine = this.hasOneLine(surroundingBoxes[i]);
          var box = this.isConnected(startLocation, surroundingBoxes[i]);

          if( (surBoxHasNoLine || surBoxHasOneLine) && !box.isConnected){

            found = true;
            //create obj to be passed in as a computer move
            let obj = { offsetX: "", offsetY: "", target: { attributes: { data: { nodeValue: "" } } } };
            const offsetXValue = $filter("offsetX")(box.side);
            const offsetYValue = $filter("offsetY")(box.side);

            obj.offsetX = offsetXValue;
            obj.offsetY = offsetYValue;
            obj.target.attributes.data.nodeValue = startLocation;

            //place a click indicator on the board
            this.clickCircle(startLocation, offsetXValue, offsetYValue);

            return obj;

          }// end: if( (surBoxHasNoLine || surBoxHasOneLine) && !box.isConnected){
        } //end: for( let i = 0; i < l; i++){

      } // end: if(hasNoLine || hasOneLine){


      if(found === true){ break }
      startLocation++;
      if(startLocation === 64){
        startLocation = 0;
      }
      count++;

    } // end: while(count < 64)

    //do a final check on the edges if the loop is about to end
    let boxLocationsOnTheEndge = [0, 1, 2, 3, 4, 5, 6, 7, 15, 23, 31, 39, 47, 55, 63, 62, 61, 60, 59, 58, 57, 56, 48, 40, 32, 24, 16, 8];
    let edgeLength = 28;
    for(let j = 0; j < 28; j++){

      //check to see if the edge box has one line
      let edgehasOneLine = this.hasOneLine(boxLocationsOnTheEndge[j]);
      //check to see if the edge line is clicked
      let position = map.position(boxLocationsOnTheEndge[j]);
      let edgeNotClicked = this.edgeNotClicked(boxLocationsOnTheEndge[j], position);

      if(edgehasOneLine && edgeNotClicked){

        //find the opposite side check -> this should always be a safe box to pressed
        let edgeSide = this.findOppositeEdge(position);

        //create obj to be passed in as a computer move
        let obj = { offsetX: "", offsetY: "", target: { attributes: { data: { nodeValue: "" } } } };
        const offsetXValue = $filter("offsetX")(edgeSide);
        const offsetYValue = $filter("offsetY")(edgeSide);

        obj.offsetX = offsetXValue;
        obj.offsetY = offsetYValue;
        obj.target.attributes.data.nodeValue = boxLocationsOnTheEndge[j];

        //place a click indicator on the board
        this.clickCircle(boxLocationsOnTheEndge[j], offsetXValue, offsetYValue);

        return obj;
      }

    }

    //return false if no values are found
    return false;

  }

  this.threeLineClick = (dataLocation) => {

    //create obj to be passed in as a computer move
    let obj = { offsetX: "", offsetY: "", target: { attributes: { data: { nodeValue: "" } } } };

    //cache obj parameters
    const clickSide = $(".grid[data=" + dataLocation + "]").children(".side[data=false]").attr("id");
    const offsetXValue = $filter("offsetX")(clickSide);
    const offsetYValue = $filter("offsetY")(clickSide);

    obj.offsetX = offsetXValue;
    obj.offsetY = offsetYValue;
    obj.target.attributes.data.nodeValue = dataLocation;

    //place a click indicator on the board
    this.clickCircle(dataLocation, offsetXValue, offsetYValue);

    return obj;

  }

  //go down the path until all boxes are found
  //fn(array)
  this.pathFinder = (objectLengthHelpArgument, openLinesArgument, currentBoxArgument, nextSide) => {

    let tempPath = [];
    let usedBoxes = [];

    tempPath.push(currentBoxArgument);
    usedBoxes.push(currentBoxArgument);

    let keepGoing = true;
    let property = objectLengthHelpArgument[0];
    let nextBox = openLinesArgument[property][0];

    //used only in the case were a middle path box is found first
    if(nextSide){
      property = objectLengthHelpArgument[1];
      nextBox = openLinesArgument[property][0];
    }

    while(keepGoing){

      let continuedHasTwoLines = this.hasTwoLines(nextBox);

      if(continuedHasTwoLines){

        if(tempPath.indexOf(nextBox) != -1){ // this indicates that we are in a closed loop path
          let obj = {};
          obj.tempPath = tempPath;
          obj.usedBoxes = usedBoxes;
          return obj;
        }

        tempPath.push(nextBox);
        usedBoxes.push(nextBox);
        //i++;

        //find the nextBox unclicked lines and the associated box locations
        let openLines = this.findUnclickedLinesAndConnecedBoxes(nextBox);

        //this check is only used in the case were we initially find a middle box
        if(openLines === -1){ // a -1 return indicates that we didn't find a nextBox
          let obj = {};
          obj.tempPath = tempPath;
          obj.usedBoxes = usedBoxes;
          return obj;
        }

        //find the object length
        let objectLengthHelper = Object.keys(openLines);
        let objectLength = objectLengthHelper.length;

        if(objectLength === 1){ // this indicates that we are at the end of the path

          // tempPath.push(openLines.objectLengthHelper[0]);
          // usedBoxes.push(openLines.objectLengthHelper[0]);
          // i++;
          //allPaths.push(tempPath);
          let obj = {};
          obj.tempPath = tempPath;
          obj.usedBoxes = usedBoxes;
          return obj;

          //keepGoing = false;

        } else { // this indicates that the path keeps going

          //if it doesn't have one line it will get pushed into the array when the loop comes back around
          let property = objectLengthHelper[0];
          let property2 = objectLengthHelper[1];
          let location = openLines[property][0];
          let location2 = openLines[property2][0];

          //insert the location that isn't in the usedBoxes array
          if(usedBoxes.indexOf(location) === -1){
            nextBox = location;
          } else if(usedBoxes.indexOf(location2) === -1){
            nextBox = location2;
          }

        }

      } else { // this indicates that the next box doesn't belong to a path -> this is a one path box


        tempPath.push(nextBox);
        usedBoxes.push(nextBox);

        let obj = {};
        obj.tempPath = tempPath;
        obj.usedBoxes = usedBoxes;

        keepGoing = false;

      }

    }

  }

  //remove any dupplicate from an array of arrays
  //fn(array)
  this.stripArrayOfArraysDuplicates = (array) => {

    let strippedArray = [];
    const l = array.length;

    for(let i = 0; i < l; i++){
      let temp = [];
      let insideLen = array[i].length;
      for(let j = 0; j < insideLen; j++){
        if(temp.indexOf(array[i][j]) != -1 ){ continue }
        temp.push(array[i][j]);
      }
      strippedArray.push(temp);
    }

    return strippedArray;

  }

  //returns a sorted array of array by inside array length
  //fn(array)
  this.sortedArrayOfArrayLengths = (array) => {

    let l = array.length;

	  let keepChecking = true;

    while( keepChecking ){

      keepChecking = false;

      for(let i = 0; i < l - 1; i++){

        let greaterThan = ( array[i].length > array[i + 1].length );

        if(greaterThan){
          keepChecking = true;
          let temp = array[i];
          array[i] = array[i+1];
          array[i+1] = temp;
        }

      } // end: for

    } // end: while

    return array;

  }

  //get the click object given the allPaths array
  //fn(array)
  this.getClickObj = (allPaths) => {

    //strip all duplicates
    allPaths = this.stripArrayOfArraysDuplicates(allPaths);
    //sort array by length
    allPaths = this.sortedArrayOfArrayLengths(allPaths);

    //get obj parameters
    const dataLocation = allPaths[0][0];
    const clickSide = $(".grid[data=" + dataLocation + "]").children(".side[data=false]").attr("id");
    const offsetXValue = $filter("offsetX")(clickSide);
    const offsetYValue = $filter("offsetY")(clickSide);
    const node = dataLocation;

    //create obj to be passed in as a computer move
    let obj = { offsetX: "", offsetY: "", target: { attributes: { data: { nodeValue: "" } } } };
    obj.offsetX = offsetXValue;
    obj.offsetY = offsetYValue;
    obj.target.attributes.data.nodeValue = dataLocation;

    //place a click indicator on the board
    this.clickCircle(dataLocation, offsetXValue, offsetYValue);

    return obj;
    /******************** init computer turn click ********************/

  }

  this.endGame = () => {

    //loop through all boxes to find the paths on the board
    const gridSize = 64;
    let allPaths = [];
    let usedBoxes = [];
    let twoLineArray = [];

    //get the total amount of boxes with 2 lines on them
    for(let j = 0; j < 64; j++){
      let isTwoLines = ( $(".grid[data=" + j + "]").children(".checker").attr("data") == 2 );
      if(isTwoLines){ twoLineArray.push(j) }
    }

    let twoLineArrayLength = twoLineArray.length;

    //this will loop until all boxes are accounted for
    for(let i = 0; i < twoLineArrayLength; i++){
      //current box to checker
      let currentBox = twoLineArray[i];

      //continue if i is already on a path
      if( usedBoxes.indexOf(currentBox) != -1 ){ continue }

      let hasTwoLines = this.hasTwoLines(currentBox);
      if(hasTwoLines){

        let tempPath = [];
        //add this to usedBoxes
        usedBoxes.push(currentBox);
        //add this to tempPath
        tempPath.push(currentBox);

        //find the boxes unclicked lines and the associated box locations
        let openLines = this.findUnclickedLinesAndConnecedBoxes(currentBox);

        //if the object has a length of 0 push it into the paths array and empty the temp array
        let objectLengthHelper = Object.keys(openLines);
        let objectLength = objectLengthHelper.length;
        if(objectLength === 0){ ///////////////////////////////////////start point: end  ///this is a one box path
          tempPath.push(currentBox);
          allPaths.push(tempPath);
        } else if (objectLength === 1) { ///////////////////////////////////////start point: end
          //if the length equal 1 than this must be an end box
          //push the box into the tempPath and usedBoxes arrays
          //start moving along the path until the next box object length is one or we repeat a value in the usedBoxes array
          //increment i everytime a new value is found

          let obj = this.pathFinder(objectLengthHelper, openLines, currentBox);
          tempPath = obj.tempPath;

          allPaths.push(tempPath);
          let usedBoxesArray = obj.usedBoxes;
          let l = usedBoxesArray.length;

          for(let k = 0; k < l; k++){
            usedBoxes.push(usedBoxesArray[k]);
          }

        } else if (objectLength === 2) {
          //this means that we have run into a middle box
          //move down one side until either the object length = 1 or we repeat a value in the usedBoxes array
            //if we repeat a value push the array in the allPaths array and exit the if statement
            //if the object length equals one continue to move down the other end of the loop until the object length = 1

            const nextSide = true;
            const obj1 = this.pathFinder(objectLengthHelper, openLines, currentBox);
            const tempPath1 = obj1.tempPath;
            const obj2 = this.pathFinder(objectLengthHelper, openLines, currentBox, nextSide);
            const tempPath2 = obj2.tempPath;

            let totalTempPath = tempPath1.concat(tempPath2);

            allPaths.push(totalTempPath);

            const usedBoxesArray1 = obj1.usedBoxes;
            const usedBoxesArray2 = obj2.usedBoxes;
            let totalUsedBoxesArray = usedBoxesArray1.concat(usedBoxesArray2);

            const l = totalUsedBoxesArray.length;

            for(let k = 0; k < l; k++){
              usedBoxes.push(totalUsedBoxesArray[k]);
            }

        }

      } // end: if(hasTwoLines)

    } // end: for(let i = 0; i < 64; i++)

    const clickObj = this.getClickObj(allPaths);

    return clickObj;

  }

});

app.filter("reset_numbers", function ($filter) {
	return function (score) {
		score = parseInt(score);
		score = 0;
		score = $filter("double_digit")(score);
		return score
	}
});

app.filter("surroundingBoxesArray", function () {
    return function (i) {
        var firstColumn = ((0 < i) && (i < 7));
        var lastColumn = ((56 < i) && (i < 63));
        var leftEdge = (i == 8 || i == 16 || i == 24 || i == 32 || i == 40 || i == 48);
        var rightEdge = (i == 15 || i == 23 || i == 31 || i == 39 || i == 47 || i == 55);
        var topLeftCorner = (i == 0);
        var topRightCorner = (i == 7);
        var bottomLeftCorner = (i == 56);
        var bottomRightCorner = (i == 63);

        if(firstColumn){
            var relativeSideToClick = ["right", "bottom", "left"];
        } else if(lastColumn){
            var relativeSideToClick = ["top", "right", "left"];
        } else if(leftEdge){
            var relativeSideToClick = ["top", "right", "bottom"];
        } else if(rightEdge){
            var relativeSideToClick = ["top", "bottom", "left"];
        } else if(topLeftCorner){
            var relativeSideToClick = ["right", "bottom"];
        } else if(topRightCorner){
            var relativeSideToClick = ["bottom", "left"];
        } else if(bottomLeftCorner){
            var relativeSideToClick = ["top", "right"];
        } else if(bottomRightCorner){
            var relativeSideToClick = ["top", "left"];
        } else {
            var relativeSideToClick = ["top", "right", "bottom", "left"];
        }

        return relativeSideToClick;
    }
});

app.filter("offsetX", function () {
    return function (clickSide) {
        if(clickSide == "top"){
            var offsetX = "x offset";
        } else if(clickSide == "right"){
            var offsetX = 1000;
        } else if(clickSide == "bottom"){
            var offsetX = "x offset";
        } else if(clickSide == "left"){
            var offsetX = 1;
        }
        return offsetX;
    }
});

app.filter("offsetY", function () {
    return function (clickSide) {
        if(clickSide == "top"){
            var offsetY = 1;
        } else if(clickSide == "right"){
            var offsetY = "y offset";
        } else if(clickSide == "bottom"){
            var offsetY = 1000;
        } else if(clickSide == "left"){
            var offsetY = "y offset";
        }
        return offsetY;
    }
});

app.filter("randomNumBetween", function () {
    return (min, max) => {
        return Math.floor(Math.random() * (max - min)) + min;
    }
});

app.filter("increment_value", function ($timeout) {
	return function (position) {
        var x = $(".grid[data="+position+"]").children(".checker").attr("data");
        x = parseInt(x);
        x++;
        return x;
	}
});

app.filter("double_digit", function () {
	return function (x) {
		if( parseInt(x) < 10 ){
			x = "0" + x;
		}
		return x;
	};
});

app.filter("find", function() {
	return function ($event) {
		var side;
        //cache var to account for the screen size when offsets are compared
        var gameWidth = $("#gameboard").width();
        var gridWidthComparer = gameWidth * 0.125 * 0.7;
        //check the side for a click based off of offset and .grid box size
		if($event.offsetY < 10) {
			//hightlight corresponding side
			side = "top";
		}
		//if bottom edge is clicked highlight that edge and the edge of the box directly next to it
		if($event.offsetY > gridWidthComparer) {
			//hightlight corresponding side
			side = "bottom";
		}
		//if right edge is clicked highlight that edge and the edge of the box directly next to it
		if($event.offsetX > gridWidthComparer) {
			//hightlight corresponding side
			side = "right";
		}
		//if left edge is clicked highlight that edge and the edge of the box directly next to it
		if($event.offsetX < 10) {
			//hightlight corresponding side
			side = "left";
		}
		///////////////////////////////////
		if (side == "top"){
			//cache the top box data attr
			var position = $event.target.attributes.data.nodeValue;
			position = parseInt(position);
			var adjPosition = position - 8;
			var object = { data: position, side: "top", adjData: adjPosition, adjSide: "bottom" };
			return object;
		} else if (side == "right"){
			//cache the right box data attr
			var position = $event.target.attributes.data.nodeValue;
			position = parseInt(position);
			var adjPosition = position + 1;
			var object = { data: position, side: "right", adjData: adjPosition, adjSide: "left" };
			return object;
		} else if (side == "bottom"){
			//cache the bottom box data attr
			var position = $event.target.attributes.data.nodeValue;
			position = parseInt(position);
			var adjPosition = position + 8;
			var object = { data: position, side: "bottom", adjData: adjPosition, adjSide: "top" };
			return object;
		} else if (side == "left"){
			//cache the left box data attr
			var position = $event.target.attributes.data.nodeValue;
			position = parseInt(position);
			var adjPosition = position - 1;
			var object = { data: position, side: "left", adjData: adjPosition, adjSide: "right" };
			return object;
		} else {
			return -1;
		}
	};
});