var express = require('express');
var router = express.Router();
var async = require('async');


var playerSkills = ["str","sta","pac","mar","tac","wor","pos","pas","cro","tec","hea","fin","lon","set"];
var goalieSkills = ["str","sta","pac","han","one","ref","ari","jum","com","kic","thr",];

// GET main page, uses ajax from global.js to do stuff
router.get('/', function(req, res) {
  var db = req.db;
  var updatetimecoll = db.get('updatetimecollection');
  
  var trainingcoll = db.get('trainingcollection');
  
  var fetchUpdate = "";
  var procUpdate = "";
  
  // finding times for last fetched and last run training updates
  async.parallel([ //TODO add error handling
    function(callback){
      trainingcoll.findOne({}, { sort: { _id: -1 }, limit: 1 }, function(err, latest){
        fetchUpdate = new Date(parseInt(latest._id.toString().substring(0, 8), 16) * 1000);
        callback();
      });
    },
    function(callback){
      updatetimecoll.findOne({}, { sort: { _id: -1 }, limit: 1 }, function(err, latest){
        procUpdate = new Date(parseInt(latest._id.toString().substring(0, 8), 16) * 1000);
        callback();
      });
    }
  ], 
  function(){
    res.render('tmtt', { 
      title: 'TM Training Tracker',
      processedUpdate: procUpdate.toLocaleString("se"),
      fetchedUpdate: fetchUpdate.toLocaleString("se")
      }
    );
  });

});


// GET to retrieve players from db and present it as JSON
router.get('/playerlist', function(req, res) {
  var db = req.db;
  var collection = db.get('playercollection');
  collection.find({},{}, function(e,players){
    res.json(players);
  });
});


// GET to retreive lastest training in db as JSON
router.get('/latesttraining', function(req, res){
  var db = req.db;
  var collection = db.get('trainingcollection');
  
  //find only the latest training
  collection.findOne({}, { sort: { _id: -1 }, limit: 1 }, function(e,latest){
    res.json(latest);
  });
});


// POST to handles JSON from TM.
router.post('/', function(req, res) {
  var db = req.db;
  var playercoll = db.get('playercollection');
  var traincoll = db.get('trainingcollection');

  // turn POSTed string containing all players info into JSON and insert possible new players into the db
  var players = JSON.parse(req.body.players);
  players.forEach(function(player){
    playercoll.insert(player, {w:0});
  });
  
  //remove players that team doesn't own anymore, and update "plot", which is used for calculating career TI
  playercoll.find({},{}, function(e,playersInDB){
    playersInDB.forEach(function(playerInDB){
      //check if player in DB still exist in playerlist fetched from TM, if not remove from DB, if exists update plot
      var playerExists = false;
      for (var i = 0; i<players.length; i++){
        if (players[i].id == playerInDB.id){
          playerExists = true;
          playercoll.update({"id": playerInDB.id},
                           {$set:{
                                "plot": players[i].plot
                                }
                            }
           );
           break;
        };
      }
      if (!playerExists) {
        playercoll.remove({"id": playerInDB.id});
      };
    });
  });
  
  
  // turn POSTed string of training info into JSON and insert into db
  var training = JSON.parse(req.body.training);
  traincoll.insert(training);
  
  res.redirect('/tmtt/');
});

function getLatestTraining(db, callback){
  var traincoll = db.get('trainingcollection');

  traincoll.findOne({}, { sort: { _id: -1 }, limit: 1 }, function(e,latest){
    if (e) {
      callback(e); 
    } else {
      callback(null, db, latest);
    }
  });
}

function processTraining(db, training, callback){
  var playercoll = db.get('playercollection');

  // find all players in db
  playercoll.find({},{}, function(e, players){
    // iterate through players
    players.forEach( function(player) {
      // check if goalkeeper or not and decide which array of skills to use
      var skillArray = (player.fp == "GK") ? goalieSkills : playerSkills;
      // make sure player received training
      if (training[player.id] != null) {
        // training[player.id].raise is an array that show which skill trained (values +1 and +2) or dropped (-1 and -2)
        raiseArray = training[player.id].raise;
        for (let i = 0; i < raiseArray.length; i++){
          switch(raiseArray[i]) {
            // -2 means the integer part of the skill dropped
            case -2:
              player[skillArray[i]] = Math.round((Math.floor(player[skillArray[i]]-1)+0.9) * 10 ) / 10;
              break;
            // -1 means only skill decimals dropped
            // must make sure integer part is not lowered, the raiseArray would show a -2 in that case
            // this is done by checking if the skill is already at xx.0
            case -1:
              if (player[skillArray[i]] * 10 % 10 == 0) {
                break;
              } else {
                player[skillArray[i]] = Math.round((player[skillArray[i]]-0.1) *10) /10;
                break;
              }
            
            // 1 means the decimal part of the skill increased
            // must make sure the integer part is not increased, the raiseArray would show 2 in the case
            // this is done by checking if the skill is already at xx.9
            case 1:
              if (player[skillArray[i]] * 10 % 10 == 9) {
                break;
              } else {
                player[skillArray[i]] = Math.round((player[skillArray[i]]+0.1) *10) /10;
                break;
              }
            case 2:
            // 2 means the integer part of the skill increased
              player[skillArray[i]] = Math.round(Math.floor(player[skillArray[i]]+1)* 10) /10;
              break;
          }
        }
      playercoll.update({"_id": player._id},player);
      }
    });


    if (e) {
      callback(e); 
    } else {
      callback(null, "success");
    }  
  });

};


// POST to update player db based on training
router.post('/update', function(req, res) {
  var db = req.db;
  var updatetimecoll = db.get('updatetimecollection');
  
  async.waterfall([
    async.constant(db),
    getLatestTraining,
    processTraining
  ], function (error) {
      if (error) {
          console.log(error);
      }
  });

  //send the time for when we last processed an update to the view TODO: update document instead of inserting a new one everytime
  updatetimecoll.insert({"foo":"foo"}, function(err, inserted){
    var procUpdate = new Date(parseInt(inserted._id.toString().substring(0, 8), 16) * 1000);
    res.send(
      (err === null) ? { msg: '', processedUpdate: procUpdate.toLocaleString("se") } : { msg: err }
    );
  });
  
});

router.use(function (err, req, res, next) {
  if (err) {
    console.log('Error', err);
  } else {
    console.log('404')
  }
});


module.exports = router;
