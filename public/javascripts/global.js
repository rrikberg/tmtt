$(document).ready(function() {

  populateTable();
  decorateTable();
  checkUpdateTimesAndEnableButton();
  $('#btnProcess').on('click', processTraining);

});

//gets player data in JSON and displays as HTML
function populateTable() {

  var playerTableContent = '';
  var gkTableContent = '';

  $.getJSON( '/tmtt/playerlist', function( data ) {
    // sort players by age
    data.sort(function(a, b){return b.age-a.age});
    $.each(data, function(){
      //goalkeepers
      if (this.fp == "GK") {
        gkTableContent += '<tr id="' + this.id + '">';
        gkTableContent += '<td>' + this.name + '</td>';
        gkTableContent += '<td>' + this.str + '</td>';
        gkTableContent += '<td>' + this.sta + '</td>';
        gkTableContent += '<td class="border">' + this.pac + '</td>';
        gkTableContent += '<td>' + this.han + '</td>';
        gkTableContent += '<td>' + this.one + '</td>';
        gkTableContent += '<td>' + this.ref + '</td>';
        gkTableContent += '<td>' + this.ari + '</td>';
        gkTableContent += '<td>' + this.jum + '</td>';
        gkTableContent += '<td>' + this.com + '</td>';
        gkTableContent += '<td>' + this.kic + '</td>';
        gkTableContent += '<td>' + this.thr + '</td>';
        gkTableContent += '<td>' + '-' + '</td>';
        gkTableContent += '<td>' + '-' + '</td>';
        gkTableContent += '<td class="border">' + '-' + '</td>';
        gkTableContent += '<td>' + calcTIsum(this.plot) + '</td>';
        gkTableContent += '</tr>';
      } else {
      //outfielders
        playerTableContent += '<tr id="' + this.id + '">';
        playerTableContent += '<td>' + this.name + '</td>';
        playerTableContent += '<td>' + this.str + '</td>';
        playerTableContent += '<td>' + this.sta + '</td>';
        playerTableContent += '<td class="border">' + this.pac + '</td>';
        playerTableContent += '<td>' + this.mar + '</td>';
        playerTableContent += '<td>' + this.tac + '</td>';
        playerTableContent += '<td>' + this.wor + '</td>';
        playerTableContent += '<td>' + this.pos + '</td>';
        playerTableContent += '<td>' + this.pas + '</td>';
        playerTableContent += '<td>' + this.cro + '</td>';
        playerTableContent += '<td>' + this.tec + '</td>';
        playerTableContent += '<td>' + this.hea + '</td>';
        playerTableContent += '<td>' + this.fin + '</td>';
        playerTableContent += '<td class="border">' + this.lon + '</td>';
        playerTableContent += '<td class="border">' + this.set + '</td>';
        playerTableContent += '<td>' + calcTIsum(this.plot) + '</td>';
        playerTableContent += '</tr>';
      }

    });

    $('tbody#playerTable').html(playerTableContent);
    $('tbody#gkTable').html(gkTableContent);
  });
  
};

//get training data as JSON and colors the skills that trained/deteriorated
function decorateTable() {
  $.getJSON( '/tmtt/latesttraining', function( data ) {
    // goalkeepers
    $('#gkTable').find('tr').each(function(){
      var playerId = $(this).attr('id');
      $(this).find('td').each(function() {
        var index = $(this).index() -1;
        if (data[playerId] != null) {
          if (data[playerId].raise[index] < 0) { 
            $(this).addClass('drop');
          } else if (data[playerId].raise[index] > 0) {
            $(this).addClass('raise');
          }
        }
      });
    });
    //outfielders
    $('#playerTable').find('tr').each(function(){
      var playerId = $(this).attr('id');
      $(this).find('td').each(function() {
        var index = $(this).index() -1;
        if (data[playerId] != null) {
          if (data[playerId].raise[index] < 0) { 
            $(this).addClass('drop');
          } else if (data[playerId].raise[index] > 0) {
            $(this).addClass('raise');
          }
        }
      });
    });
  });
}

// processes the training update
function processTraining(event){
  event.preventDefault();
  
  $.ajax({
      type: 'POST',
      url: '/tmtt/update',
    }).done(function( response ) {

      // Check for successful (blank) response
      if (response.msg === '') {

        // Update the table
        populateTable();
        decorateTable();
        updateUpdateTime(response.processedUpdate);
        $('#btnProcess').prop('disabled', true);
      }
      else {

        // If something goes wrong, alert the error message that our service returned
        alert('Error: ' + response.msg);

      }
    });
};

// updates the time for when the last training was processed
function updateUpdateTime(time) {
  $('td#procDate').text(time);
};

// checks if a training has been fetched after the last update was run
function checkUpdateTimesAndEnableButton(){
  var procDate = $('td#procDate').text();
  var fetchDate = $('td#fetchDate').text();
  
  if (Date.parse(procDate) < Date.parse(fetchDate)) {
    $('#btnProcess').prop('disabled', false);
  }
};

// calculate the total TI of a player during their whole career
function calcTIsum(TIarray) {
  var result = TIarray.map(Number);
  var sum = result.reduce((a, b) => a + b, 0);
  return sum;
};
