//Get Reference to the Canvas element
var canvas = document.getElementById("myCanvas");
var ctx = canvas.getContext("2d");

//This sets the size of our canvas to the size of the browser window 
ctx.canvas.width  = window.innerWidth - 320;
ctx.canvas.height = window.innerHeight;

//declare all of the logic variables:
// timers
	var GameTimer = new Timer();

// Add trial position flags
	var flagInstructions = false; 
	var flagCalibrate = false; 
	var flagValidate = false 
	var flagDegrees = false; 
	var flagTrial = false;
	var flagRender = false 
	var flagEndOfGame = false;

//Create variables 
	var x_targ;
	var y_targ;

	var scene;
	//counter for trial position
	var trialIdx = 0; // This updates inside run trial

	//counter for validation and calibration
	var calCnt = 0;
	var valCnt = 0; 


//Set up information on target locations, image order and length of the whole thing 
	var Nrs = [1,2,3,4,5]; 

	//Locations which our targets shall appear, these are defined in percentage coordinates, which scale with the window size 
	var targX = [0.90*canvas.width,0.40*canvas.width,0.50*canvas.width,0.70*canvas.width,0.20*canvas.width]; 
	var targY = [0.30*canvas.height,0.20*canvas.height,0.80*canvas.height,0.10*canvas.height,0.20*canvas.height]; 

	//These variables contain 5 points that will act as our calibration. Each is 5% from the edge of the window, except the center one. 
	// 0 = top left; 1= top right; 2= bottom left; 3=center, 4=bottom right
	var defCoordsX = [0.05*canvas.width, 0.95*canvas.width, 0.05*canvas.width, 0.5*canvas.width, 0.95*canvas.width];
	var defCoordsY = [0.05*canvas.height, 0.05*canvas.height, 0.90*canvas.height, 0.5*canvas.height, 0.90*canvas.height];
	
	//pick the order of points 
	var calx = [defCoordsX[1], defCoordsX[3], defCoordsX[2], defCoordsX[0], defCoordsX[4]]
	var caly = [defCoordsY[1], defCoordsY[3], defCoordsY[2], defCoordsY[0], defCoordsY[4]]

	//Index location reference for storing Gaze info 
	var calIndex = [1, 3, 2, 0, 4]

	//we choose different locations for the calibration 
	var valx = [defCoordsX[0], defCoordsX[4], defCoordsX[1], defCoordsX[3], defCoordsX[2]]
	var valy = [defCoordsY[0], defCoordsY[4], defCoordsY[1], defCoordsY[3], defCoordsY[2]]

	//Index location reference for storing Gaze info 
	var valIndex = [0, 4, 1, 3, 2]

	//call the game conig function, which returns a nice sorted object 
	var game_info = new game_config();
	var nlen = game_info.trials.length;

// Set up Variables to record eye location data 

    //all Calibration X Y predictions
	var CalDataX = []; 
	var CalDataY = []; 

	//last 10 predictions for each point 
	var CalLastX = [];
	var CalLastY = [];

    //all Validation X Y predictions
	var ValData = []; 
	var ValDataX = []; 
	var ValDataY = []; 
	//last 10 predictions for each point 
	var ValLastX = [];
	var ValLastY = [];

//Important function which actually plays the game! 

function runScript() {

    var JSON;

    // Start timer
    GameTimer.start();

    // Start game by loading images, this will call animate() when ready
    loadImages();

    // Set listener to detect mouse clicks and run router when pressed
    canvas.addEventListener("click",router,false);
    //Set Listener to detect keypress and run router when pressed 
    window.addEventListener("keypress", router, false);
}


//functions which draw stuff on the canvas  

	//This shows the instructions to the user 
	function showInstructions(){
    	ctx.fillStyle = 'grey';
    	ctx.fillRect(0, 0, canvas.width, canvas.height);
   	 	ctx.fillStyle = 'white';
	    ctx.font = 0.03*canvas.height +'pt Arial';
	    ctx.textAlign="center";
	    ctx.fillStyle ='white';
	    ctx.fillText("Welcome to the Scan Path demo",0.5*canvas.width, 0.2*canvas.height);
	    ctx.font = 0.02*canvas.height +'pt Arial';
	    ctx.fillText("First you will complete a calibration task, so the browser knows where you are looking.",0.5*canvas.width, 0.4*canvas.height);
	    ctx.fillText("Then you can view some pictures and look for the target, when you find the target click it",0.5*canvas.width, 0.5*canvas.height);
	    ctx.fillText("You can then view a rendering of where you looked on the image",0.5*canvas.width, 0.6*canvas.height);
	    ctx.fillStyle ='lime';
	    ctx.fillText("Click to begin.",0.5*canvas.width, 0.8*canvas.height);
	}

	//This shows the calibration points to get WebGazer accurate 
	function showCalibration(){
		ctx.fillStyle = 'grey';
    	ctx.fillRect(0, 0, canvas.width, canvas.height);

		ctx.font = 0.04*canvas.height +'pt Arial';
	    ctx.textAlign="center";
	    ctx.fillStyle ='white'
	    ctx.globalAlpha =0.2;
	    ctx.fillText("Calibration",0.5*canvas.width, 0.1*canvas.height);
	    ctx.globalAlpha =1;
	    //Get the current square location
	    locx = calx[calCnt];
	    locy = caly[calCnt];
	    // Render circle to follow 
	    Sz = 0.015 //size in percent of window
	    ctx.beginPath();
		ctx.arc(locx+Sz*canvas.width,locy+Sz*canvas.width,Sz*canvas.width, 0, 2*Math.PI);
		ctx.strokeStyle = 'white'; 
		ctx.stroke();
		ctx.fillStyle = 'white';
		ctx.fill();

		//This adds WebGazer's current location predictions to the CalData X/Y array
		
		CalDataX.push(window.dataX);
		CalDataY.push(window.dataY);

	}

	function showValidation(){
		ctx.fillStyle = 'grey';
    	ctx.fillRect(0, 0, canvas.width, canvas.height);

		ctx.font = 0.04*canvas.height +'pt Arial';
	    ctx.textAlign="center";
	    ctx.fillStyle ='white'
	    ctx.globalAlpha =0.2;
	    ctx.fillText("Validation",0.5*canvas.width, 0.1*canvas.height);
	    ctx.globalAlpha =1;
	    //Get the current target location
	    locx = valx[valCnt];
	    locy = valy[valCnt];
	    // Render circle to follow 
	    Sz = 0.015 //size in percent of window
	    ctx.beginPath();
		ctx.arc(locx+Sz*canvas.width,locy+Sz*canvas.width,Sz*canvas.width, 0, 2*Math.PI);
		ctx.strokeStyle = 'white'; 
		ctx.stroke();
		ctx.fillStyle = 'white';
		ctx.fill();

		//This adds WebGazer's current location predictions to the CalData X/Y array
		ValDataX.push(window.dataX);
		ValDataY.push(window.dataY);

	}

	function showDegrees(){
		ctx.fillStyle = 'grey';
    	ctx.fillRect(0, 0, canvas.width, canvas.height);

    	//draw all targets - using function
    	//define function
    	function drawCirc(x,y,Sz){
	    	ctx.beginPath();
			ctx.arc(x+Sz*canvas.width,y+Sz*canvas.width,Sz*canvas.width, 0, 2*Math.PI);
			ctx.strokeStyle = 'white'; 
			ctx.stroke();
			ctx.fillStyle = 'white';
			ctx.fill();
    	}
    	//loop through locations
    	for(var i=0; i< 5; i++) {
	        drawCirc(defCoordsX[i], defCoordsY[i], 0.015)
	   		 drawScanPath(ValLastX[i], ValLastY[i], 'red')
	   		 drawScanPath(CalLastX[i], CalLastY[i], 'green')
	   	}
	    //function for drawing paths from coordinates
	    function drawScanPath(x, y, colour){
	    	ctx.beginPath();
	    	ctx.strokeStyle = colour;
	    	//start drawing at first coordinate 
	    	ctx.moveTo(x[0], y[0]);
	    	//loop through remaining coordinates and drawline 
	    	for(var ii=1; ii < x.length; ii++){
	    		ctx.lineTo(x[ii], y[ii]);
	    	}
	    	ctx.stroke();
	    }

	    
	}

	//This shows the image 
	function showTrial(){

	}

	//This renders Scan Path over the image with the target highlighted
	function showRender(){

	}

	//This shows that the game has ended, displays the image(s) with fixation overlayed 
	function showEndofGame(){

	}

flagInstructions == true 


//Main Running of the game:

	// animation loop - calls the different functions which in turn draw on to our canvas 
	function animate(){

		 if(flagEndOfGame == true){
		   showEndOfGame();
		 } else if (flagInstructions == true) {
		        showInstructions();
		 } else if (flagCalibrate == true) {
		 		showCalibration();
		 } else if (flagValidate == true) {
		 		showValidation();
		 } else if (flagDegrees == true) {
		 		showDegrees();
		 } else if (flagTrial == true) {
		 		showTrial();
		 } else if (flagRender == true) {
		 		showRender();
		 } else if (flagEndOfGame == true){
		 		showEndofGame();
		 }

    //Calling itself leads to this function recursively redering things 
    requestAnimationFrame(animate); //this is a technique to ensure framerate is as high as possible
	}

	//This function takes logic flags and alters them to track the stages in the game 
	function router(){
		//if instructions are showing and router is activated by a click, flag that animation should display validation screen
		if(flagInstructions == true) {
			flagInstructions = false;
			flagCalibrate = true; 


		//if instructions were not showing, and calibration points are less than 5, increase the point count 	
		} else if (flagCalibrate == true && calCnt <= 4) {
			//take last ten predictions and keep 
			CalLastY[calIndex[calCnt]] = CalDataY.slice(-10)
			CalLastX[calIndex[calCnt]] = CalDataX.slice(-10)
			calCnt = calCnt + 1; 

		//if points were more than 5 flag validation stage 
		} else if (flagCalibrate == true){
			console.log(CalLastY)
			console.log(CalLastX)
			flagCalibrate = false;
			flagValidate = true;
		//if validation is not complete, increase count 
		} else if (flagValidate == true && valCnt <= 4) {
			//take last 10 item predictions
			ValLastY[calIndex[valCnt]] = ValDataY.slice(-10)
			ValLastX[calIndex[valCnt]] = ValDataX.slice(-10)
			valCnt = valCnt + 1;

		//if validation is complete, flag degrees deviation screen
		} else if (flagValidate == true) {
			console.log(ValLastY)
			flagValidate = false;
			//calculate x and y coords to plot 
			flagDegrees = true; 
		// if degrees is showing flag the first trial 
		} else if (flagDegrees == true) {
			flagDegrees = false
			flagTrial = true
		//if target has been clicked, render eye movements 
		} else if (flagTrial == true){
			flagTrial = false
			flagRender = true
		//if render has finished being viewed, but less than 5 trials, flag trial stage again and increase counter
		} else if (flagRender == true && trialIdx < 4){
			flagRender = false
			flagTrial = true 
			trialIdx = trialIdx + 1

		//if more than 5 trials has passsed flag the game ending 
		} else if (flagRender == true){
			flagRender = false
			flagEndOfGame = true
		}

	}

//Game construction functions:

	function game_config (){
	this.exp_name = "ScanPath";
	    this.trials = [];
	    var i = 0; 
	    for(var i = 0; i < Nrs.length; i++) {
	         this.trials[i] = new Trial("Im"+Nrs[i],1,targX[i],targY[i]);
	    }

	}

	//generating Trial information based on input 
	function Trial (scene,code,key_x,key_y, isiInfo, targOrient) {
	    this.scene = scene;
	    this.code = code;
	    this.key_x = key_x;
	    this.key_y = key_y;
	};

	//Timer reference so we know when events happen 
	function Timer() {
	    this.started = false;
	    this.paused = false;
	    this.startTime = 0;
	    this.stopTime = 0;

	    Timer.prototype.start = function() {
	        var now = new Date();
	        this.startTime = now.getTime();
	        this.started = true;
	        this.stopTime = 0;
	    }

	    Timer.prototype.elapsed = function() {
	        if (!this.started) {
	            return 0;
	        }
	        var now = new Date();
	        return now.getTime() - this.startTime;
	    }

	    Timer.prototype.stop = function() {
	        this.stopTime = this.elapsed();
	        this.started = false;
	    }

	    Timer.prototype.pause = function() {
	        if (this.paused) return;

	        var now = new Date();
	        this.pauseTime = now.getTime();
	        this.paused = true;
	    }

	    Timer.prototype.resume = function() {
	        if (!this.paused) return;

	        var now = new Date();
	        this.startTime += now.getTime() - this.pauseTime;
	        this.paused = false;
	        this.pauseTime = 0;
	    }
	};

//Image loading and rendering stuff:

	// functions to draw objects

	function colorRect(leftX,topY,width,height,drawColor) {
	    ctx.fillStyle = drawColor;
	    ctx.fillRect(leftX,topY,width,height);
	}

	function drawPic (useBitmap, atX,atY, withAng) {
	    ctx.save();
	    ctx.translate(atX,atY);
	    ctx.rotate(withAng);
	    ctx.drawImage(useBitmap,-useBitmap.width/2,-useBitmap.height/2);
	    ctx.restore();
	};


	// Variables for the images 
	var Im1 = document.createElement("img");
	var Im2 = document.createElement("img");
	var Im3 = document.createElement("img");
	var Im4 = document.createElement("img");
	var Im5 = document.createElement("img");
	var target = document.createElement("img");

	//Pre-Load the Images into variables and display a waiting screen
		//Counter
	var picsToLoad = 0;

	//call to animation if all images are loaded
	function countLoadedImagesAndLaunchIfReady() {
	    picsToLoad--;
	    if(picsToLoad == 0){
	    	flagInstructions = true;
	        animate();
	    }
	}

	//actually get the images
	function beginLoadingImage(imgVar,fileName) {
	    imgVar.onload = countLoadedImagesAndLaunchIfReady();
	    imgVar.src = "img/"+fileName;
	}

	function loadImages() {
	    var imageList = [
	        {varName: target, theFile: "target.jpg"},
	        {varName: Im1, theFile: "Im1.jpg"},
	        {varName: Im2, theFile: "Im2.jpg"},
	        {varName: Im3, theFile: "Im3.jpg"},
	        {varName: Im4, theFile: "Im4.jpg"},
	        {varName: Im5, theFile: "Im5.jpg"},
	     ];
	    picsToLoad = imageList.length;

	    // show loading screen whilst waiting
	    colorRect(0,0,canvas.width,canvas.height,'black');
	    ctx.font = '12pt Arial';
	    ctx.textAlign="center";
	    ctx.fillStyle = 'white';
	    ctx.fillText("Loading, please wait...",canvas.width/2,canvas.height/2);
	    for(var i=0; i<imageList.length; i++) {
	        beginLoadingImage(imageList[i].varName,imageList[i].theFile);

	    }
	}


