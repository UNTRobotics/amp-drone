var express = require('express');
var app = express()
  , http = require('http')
  , server = http.createServer(app)
  , io = require('socket.io').listen(server);

server.listen(3030);

var five = require('johnny-five');

app.use('/static', express.static('public'));

var board = new five.Board();

app.get('/', function (req, res)
{
    var options = {
      root: __dirname + '/',
      dotfiles: 'allow',
      headers: {
          'x-timestamp': Date.now(),
          'x-sent': true
      }
    };

    res.sendFile('/index.html', options, function (err)
    {
       if (err)
       {
         console.log(err);
         return res.end('Error loading index.html');
       }
       else
       {
           console.log('sent index.html');
       }
    });
});



var server = app.listen(server, function () {

  var host = server.address().address;
  var port = server.address().port;

  console.log('AMP-Drone listening at http://%s:%s', host, port);

});

//set board to ready state to start transfer of data
board.on('ready', function() {

// Motor
var motorGroupRight_1 = new five.Motor({
  pins: {
    pwm: 3,
    dir: 2,
    cdir: 4
  }
});
var motorGroupRight_2 = new five.Motor({
  pins: {
    pwm: 5,
    dir: 6,
    cdir: 7
  }
});

var motorGroupLeft_1 = new five.Motor({
  pins: {
    pwm: 9,
    dir: 8,
    cdir: 10
  }
});
var motorGroupLeft_2 = new five.Motor({
  pins: {
    pwm: 11,
    dir: 12,
    cdir: 13
  }
});

  function motorDrive(speed, direction)
  {
    switch (direction)
    {
      case 'forward':
        motorGroupRight_1.forward(speed);
        motorGroupRight_2.forward(speed);

        motorGroupLeft_1.forward(speed);
        motorGroupLeft_2.forward(speed);

        console.log('Case: forward - ', speed);
        break;
      case 'backward':
        motorGroupRight_1.rev(speed);
        motorGroupRight_2.rev(speed);

        motorGroupLeft_1.rev(speed);
        motorGroupLeft_2.rev(speed);
        console.log('Case: backward - ', speed);
        break;
      case 'stop':
        motorGroupRight_1.stop();
        motorGroupRight_2.stop();

        motorGroupLeft_1.stop();
        motorGroupLeft_2.stop();
        console.log('Case: Stop - ', speed);
    }
  }

  function rightTurn(speed, minusSpeed)
  {
      motorGroupRight_1.rev(minusSpeed);
      motorGroupRight_2.rev(minusSpeed);

      motorGroupLeft_1.forward(speed);
      motorGroupLeft_2.forward(speed);
      console.log('Case: right turn');
  }

  function leftTurn(speed, minusSpeed)
  {
      motorGroupLeft_1.rev(minusSpeed);
      motorGroupLeft_2.rev(minusSpeed);

      motorGroupRight_1.forward(speed);
      motorGroupRight_2.forward(speed);

      console.log('Case: Left turn');
  }

  io.on('connection', function(socket)
  {
    socket.on('mag', function(data)
    {
        var turnAMP = data.Results[0];
        var speedGamma = data.Results[1] * 2.83;
        var pSpeed = speedGamma * -1;

        // console.log('gamma' + data.Results[1]);
        // console.log('beta' + data.Results[0]);

        if (turnAMP < 5 && turnAMP > -5)
        {
          if (speedGamma > -10)
          {
            motorDrive(speedGamma, 'forward');
          }
          else if (speedGamma < 10)
          {
            motorDrive((pSpeed), 'backward');
          }
        }
        else if (turnAMP > 5)
        {
          var right = pSpeed - (turnAMP * 3.64);
          rightTurn(pSpeed, right);
        }
        else if (turnAMP < -5)
        {
          var left = pSpeed + (turnAMP * 3.64);
          leftTurn(pSpeed, left);
        }
        else
        {
          motorDrive(pSpeed, 'stop');
        }
    });

    socket.on('autoDrive', function(data)
    {
      motorDrive(255, 'forward');
      console.log('forward_func');
    });

  });

});
