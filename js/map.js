/*
@author Günther Jungbluth 
*/

var map_json = {};
var speed = 1.0;
var img = "http://ace-design.github.io/IslandExploration/img/week46.png";
var img_black = "http://ace-design.github.io/IslandExploration/img/black.png";
var canvas;
var context;
var locX = 0, locY = 0;
var motX = 1, motY = 0;
var json_index = 0;
var direction = "E";
var tile_size = 10;
var lastAction = "echo";
var chunks = {};
var isFinished = false;
var budget = 0;
var men = 0;
var creeks = {};
var isPaused = false;
var loadedJson = {};
var width = 600;
var height = 600;
var loadedCreeks = {};
var movedTo = {};
var exportVideo = false;
var frameNumber = 0;
var div_contracts;
var contracts = {};

//Let's initialize the canvas and load the context
function initialize(json) {
    map_json = json;
    clearBoard();
    lastAction = "echo";
    chunks = {};
    creeks = {};
    json_index = 1;
    isFinished = false;
    frameNumber = 0;
    movedTo = {};
    $("#stop").show();
    locX = parseInt($("#locX").val()/3);
    locY = parseInt($("#locY").val()/3);
    isPaused = false;
    updatePause();
    direction = map_json[0].data.heading;
    budget = map_json[0].data.budget;
    men = map_json[0].data.men;
    div_contracts.innerHTML = "";
    updateMotion(direction);
    var imageObj = new Image();
    imageObj.setAttribute('crossOrigin', 'anonymous');
    imageObj.onload = function() {
        width = this.width;
        height = this.width;
        canvas.width = width;
        canvas.height = height;
        canvas.style.width = width;
        canvas.style.height = height;
        setTimeout(clearBoard(), 500);
        canvas.style.left = "calc(50% - "+width+"px);"
    };
    imageObj.src = img;
    for(var i in loadedCreeks) {
        var id = loadedCreeks[i].uid;
        creeks[id] = {};
        creeks[id].x = parseInt(loadedCreeks[i].x/10);
        creeks[id].y = parseInt(loadedCreeks[i].y/10);
    }
}

function clearBoard() {
    context.fillStyle = "#000000";
    context.fillRect(0,0,width,height);
}

//Loads the json map from the file input
function onSelectMap(event) {
    var selectedFile = event.target.files[0];
    var reader = new FileReader();
    isFinished = true;

    reader.onload = function(event) {
        loadedJson = JSON.parse(event.target.result);
    };

    reader.readAsText(selectedFile);
}

function onSelectCreeks(event) {
    var selectedFile = event.target.files[0];
    var reader = new FileReader();
    isFinished = true;

    reader.onload = function(event) {
        loadedCreeks = JSON.parse(event.target.result);
    };

    reader.readAsText(selectedFile);
}


function onSelectImg(event) {
    var selectedFile = event.target.files[0];
    isFinished = true;
    img = URL.createObjectURL(selectedFile);
}

//Prints a tile at x,y
function printTile(src,x,y) { 
    printMapPart(src,x,y, tile_size);
}

//Prints part of the map at x,y
function printMapPart(src,x,y, size) { 
    var obj = {src:src, x:x, y:y, size:size};
    addToSchedule(function(SCHEDULEID, obj) {
        var imageObj = new Image();
        imageObj.setAttribute('crossOrigin', 'anonymous');
        imageObj.onload = function() {
            context.drawImage(imageObj, obj.x*tile_size, obj.y*tile_size, obj.size, obj.size, tile_size*obj.x, tile_size*obj.y, obj.size, obj.size);
            finishSchedule(SCHEDULEID);
        };
        imageObj.src = obj.src;
    },obj);
}

var schedules = {};
var scheduleId = 0;

function addToSchedule(funct,obj) {
    schedules[scheduleId] = [funct,obj];
    if(sizeOfObj(schedules) == 1) {
        funct(scheduleId,obj);
    }
    scheduleId++;
}

function finishSchedule(scheduleId1) {
    delete schedules[scheduleId1];
    if(schedules[scheduleId1+1]) {
        schedules[scheduleId1+1][0](scheduleId1+1,schedules[scheduleId1+1][1]);
    }
}

function sizeOfObj(object) {
    var size = 0;
    for(var key in object) size++;
    return size;
}

//Prints the drone, needs progress
function printPlane(src,x,y) { 
    var obj = {src:src, x:x, y:y};
    addToSchedule(function(SCHEDULEID, obj) {
        if(!obj.src)
            sobj.rc="img/gray.png";
        var imageObj = new Image();
        imageObj.setAttribute('crossOrigin', 'anonymous');
        imageObj.onload = function() {
            context.drawImage(imageObj, 0, 0, 32, 32, tile_size*obj.x, tile_size*obj.y, tile_size*3, tile_size*3);
            finishSchedule(SCHEDULEID);
        };
        imageObj.src = obj.src;
    },obj);
    
}

//Prints a creek at x,y
function printCreek(x, y, color) {
    if(!color)
        color ="#FF0000"
    printCircle(x, y, tile_size/2, color);
}

//Prints a circle at x,y
function printCircle(x, y, size, color, extra) {
    var obj = {x:x, y:y, size:size, color:color, extra:extra};
    addToSchedule(function(SCHEDULEID, obj) {
        context.beginPath();
        if(!obj.color)
            obj.color ="#FF0000";
        if(!obj.extra)
            obj.extra = 0;
        context.arc(tile_size*obj.x+obj.size/2+obj.extra, tile_size*obj.y+obj.size/2+obj.extra, obj.size, 0, 2 * Math.PI, false);
        context.fillStyle = obj.color;
        context.fill();
        context.stroke();
        finishSchedule(SCHEDULEID);
    },obj);
    
}

//Prints the crew
function printCrew(x, y) {
    var obj = {x:x, y:y};
    addToSchedule(function(SCHEDULEID, obj) {
        context.beginPath();
        context.moveTo(tile_size*obj.x-tile_size/2, tile_size*obj.y-tile_size/2);
        context.lineTo(tile_size*obj.x+tile_size/2, tile_size*obj.y+tile_size/2);
        context.strokeStyle = "#FF0000";
        context.stroke();
        context.beginPath();
        context.moveTo(tile_size*obj.x-tile_size/2, tile_size*obj.y+tile_size/2);
        context.lineTo(tile_size*obj.x+tile_size/2, tile_size*obj.y-tile_size/2);
        context.stroke();
        finishSchedule(SCHEDULEID);
    },obj);
    
}

//Moves the drone and update the display
function moveDrone() {
    if(chunks[locX*3+":"+locY*3] == undefined)
        printMapPart(img_black, locX*3, locY*3, tile_size*3);
    move();
    //if(chunks[locX*3+":"+locY*3] == undefined)
    //    printPlane("img/drone_"+direction.toLowerCase()+".png", locX*3, locY*3);
    chunks[locX*3+":"+locY*3] = {};
}

//Update the coordinates
function move() {
    locX+=motX;
    locY+=motY;
}

//Starts the game
function start() {
    stop();
    setTimeout(function(){
        initialize(loadedJson);
        $("#input_map").val("");
        $("#input_map_pic").val("");
        handleJson(map_json[json_index]);
        contracts = map_json[0].data.contracts;
        div_contracts.innerHTML = "";
        for(var i in contracts) {
            var contract = contracts[i];  
            contract.gathered = 0;
            div_contracts.innerHTML += "<div id='contract_"+i+"_info'><b>"+contract.amount+" " + contract.resource+":</b> <span id='contract_"+i+"'></span></div>"; 
            updateContract(contract.resource, 0);
            updateBudget();
        }
    }, 50);
}

function updateContract(resource, amount) {
    for(var i in contracts) {
        var contract = contracts[i];
        if(contract.resource == resource) {
            contract.gathered+=amount;
            var perc = Math.round(Math.min(1, contract.gathered/contract.amount)*100);
            $("#contract_"+i)[0].innerHTML = contract.gathered + " gathered, <span style='color:"+
                (perc < 25 ? "#AA5555" : perc < 75 ? "#A08800" : perc < 99 ? "#929E00" : "#00AA00")
                +"'>" + perc+"% completed</span>";
            break;
        }
    }
}

function updateBudget() {
    $("#budget").html("<hr><b>Budget: </b> " + budget);
}

//Arrete la simulation
function stop() {
    isFinished = true;
}

function pause() {
    isPaused = !isPaused;
    updatePause();
}

function updatePause() {
    $("#btn_pause").html(isPaused ? "Continuer" : "Pause");
}

//Update the motion according to a direction
function updateMotion(dir) {
    switch(dir) {
        case "N":
            motX=0;motY=-1;
            break;
        case "S":
            motX=0;motY=1;
            break
            case "E":
            motX=1;motY=0;
            break;
        case "W":
            motX=-1;motY=0;
            break;
    }
}

function printEcho(dir, range) {
    if(range <= 1) return;
    range-=1;
    var mx = 0, my = 0;
    switch(dir) {
        case "N":
            mx=0;my=-1;
            break;
        case "S":
            mx=0;my=1;
            break
            case "E":
            mx=1;my=0;
            break;
        case "W":
            mx=-1;my=0;
            break;
    }
    context.beginPath();
    context.rect(locX*tile_size*3, locY*tile_size*3, (mx*range*tile_size*3+tile_size*3), (my*range*tile_size*3+tile_size*3));
    context.fillStyle = '#011B2B';
    context.fill();
}

//Saves the creeks
function addCreeks(_creeks, x, y) {
    
    for(var i in _creeks) {
        var id = _creeks[i];
        if(creeks[id] == undefined)
            creeks[id] = {x:x, y:y};
        creeks[id].discovered = true;
    }
}

function printCreeks() {
    for(var i in creeks) {
        var creek = creeks[i]
        if(creek.discovered)
            printCreek(creek.x, creek.y, "#FF0000");
    }
}

var toDraw = [];
//Handles the different game steps
function handleJson(json) {
    setTimeout(function () {
        if(isFinished) {
            $("#btn_stop").hide();
            return;
        }
        if(isPaused) {
            handleJson(json);
            return;
        }
        if(json.part == "Explorer") {
            switch(json.data.action) {
                case "land":
                    printCreeks();
                    var creek = creeks[json.data.parameters.creek];
                    locX = creek.x;
                    locY = creek.y;
                    printCreek(locX, locY, "#FFFF00");
                    break;
                case "explore":
                    printCircle(locX, locY, 3, "#00FFFF", tile_size/3);
                    movedTo[locX+":"+locY] = {x:locX};
                    break;
                case "exploit":
                    printCircle(locX, locY, 4, "#BBFFBB", tile_size/4);
                    movedTo[locX+":"+locY] = {x:locX};
                    break;
                case "transform":
                    for(var key in json.data.parameters) {
                        var amount = json.data.parameters[key];
                        updateContract(key, -amount);
                    }
                    break;
                case "move_to":
                    if(movedTo[locX+":"+locY] == undefined) {
                        printMapPart(img, locX, locY, tile_size)
                        printCircle(locX, locY, 1, "#FFFFFF", tile_size/2);
                    }
                    movedTo[locX+":"+locY] = {x:locX};
                    updateMotion(json.data.parameters.direction);
                    move();
                    break;
                case "fly":
                    printMapPart(img, locX*3, locY*3, tile_size*3)
                    moveDrone();
                    printMapPart(img, locX*3, locY*3, tile_size*3)
                    printPlane("http://ace-design.github.io/IslandExploration/img/drone_"+direction+".png", locX*3, locY*3);
                    break;
                case "scan":
                    chunks[locX*3+":"+locY*3] = {};
                    printMapPart(img, locX*3, locY*3, tile_size*3);
                    printPlane("http://ace-design.github.io/IslandExploration/img/drone_"+direction+".png", locX*3, locY*3);
                    break;
                case "heading":
                    printMapPart(img, locX*3, locY*3, tile_size*3)
                    moveDrone();
                    updateMotion(json.data.parameters.direction);
                    moveDrone();
                    direction = json.data.parameters.direction;
                    printPlane("http://ace-design.github.io/IslandExploration/img/drone_"+direction+".png", locX*3, locY*3);
                    break;
            }
            lastAction = json.data;
        } else if(json.part == "Engine") {
            switch(lastAction.action) {
                case "scan":
                    if(json.data.extras.creeks.length != 0) {
                        addCreeks(json.data.extras.creeks, locX*3+1, locY*3+1);
                        printCreeks();
                    }
                    break;
                case "echo":
                    printEcho(lastAction.parameters.direction, json.data.extras.range);
                    break;
                case "exploit":
                    updateContract(lastAction.parameters.resource, json.data.extras.amount);
                    break;
                case "transform":
                    updateContract(json.data.extras.kind, json.data.extras.production);
                    break;
            }
            if(json.data.cost) {
                budget-=json.data.cost;
            }
        }
        //Wait for the drawing
        addToSchedule(function(SCHEDULEID) {
            updateBudget();
            if(json_index < map_json.length) {
                handleJson(map_json[json_index++]);
            } else {
                printCreeks();
                $("#btn_stop").hide();
            }
            if(exportVideo)
                saveFrame();
            finishSchedule(SCHEDULEID);
        });
    }, speed <= 0.01 ? 0 : speed*100);
}

function saveFrame() {
    var req = new XMLHttpRequest();
    req.open('post', 'http://localhost:8888/index.php');
    var data = canvas.toDataURL();
    data = 'data=' + encodeURIComponent(data) + '&i=' + frameNumber++;
    req.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    req.setRequestHeader("Content-length", data.length);
    req.setRequestHeader("Connection", "close");
    req.send(data);
}

//Load the necessary content when the page is ready
$(document).ready(function(){
    canvas = document.getElementById('map');
    context = canvas.getContext('2d');
    
    $( "#speed_bar" ).slider({
        range: "max",
        min: 0,
        max: 1000,
        value: 500,
        slide: function( event, ui ) {
            speed = (1000-$('#speed_bar').slider("option", "value"))/500;
        }
    });
    $("#speed_bar").keyup(function() {
        $("#speed_bar").slider("value" , $(this).val())
    });
    clearBoard();
    div_contracts = $("#contracts")[0];
});
