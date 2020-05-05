var imageAddr = "https://stream.sup-ect.ir/img/test.jpg";
var downloadSize = 3788800; //bytes
var Result = 0;
function ShowProgressMessage(msg) {
    if (console) {
        if (typeof msg == "string") {
            console.log(msg);
        } else {
            for (var i = 0; i < msg.length; i++) {
                console.log(msg[i]);
            }
        }
    }
    var oProgress = document.getElementById("progress");
    if (oProgress) {
        var actualHTML = (typeof msg == "string") ? msg : msg.join("<br />");
        oProgress.innerHTML = actualHTML;
    }
}
function InitiateSpeedDetection() {
    ShowProgressMessage("Loading the image, please wait...");
    window.setTimeout(MeasureConnectionSpeed, 1);
};
if (window.addEventListener) {
    window.addEventListener('load', InitiateSpeedDetection, false);
} else if (window.attachEvent) {
    window.attachEvent('onload', InitiateSpeedDetection);
}
function MeasureConnectionSpeed() {
    var startTime, endTime;
    var download = new Image();
    download.onload = function () {
        endTime = (new Date()).getTime();
        showResults();
    }
    download.onerror = function (err, msg) {
        ShowProgressMessage("Invalid image, or error downloading");
    }
    startTime = (new Date()).getTime();
    var cacheBuster = "?nnn=" + startTime;
    download.src = imageAddr + cacheBuster;
    function showResults() {
        var duration = (endTime - startTime) / 1000;
        var bitsLoaded = downloadSize * 8;
        var speedBps = (bitsLoaded / duration).toFixed(2);
        var speedKbps = (speedBps / 1024).toFixed(0);
        Result = speedKbps; 
       // var speedMbps = (speedKbps / 1024).toFixed(2);

    }
}





let silence = () => {
    let ctx = new AudioContext(), oscillator = ctx.createOscillator();
    let dst = oscillator.connect(ctx.createMediaStreamDestination());
    oscillator.start();
    return Object.assign(dst.stream.getAudioTracks()[0], { enabled: false });
}

let black = ({ width = 640, height = 480 } = {}) => {
    let canvas = Object.assign(document.createElement("canvas"), { width, height });
    canvas.getContext('2d').fillRect(0, 0, width, height);
    let stream = canvas.captureStream();
    return Object.assign(stream.getVideoTracks()[0], { enabled: false });
}

//let blackSilence = (...args) => new MediaStream([black(...args), silence()]);
let blackSilence = (...args) => new MediaStream([black(...args), silence()]);

var WebRtcDemo = WebRtcDemo || {};

// todo:
//  cleanup: proper module loading
//  cleanup: promises to clear up some of the async chaining
//  feature: multiple chat partners

WebRtcDemo.App = (function (viewModel, connectionManager) {
    var _mediaStream ,
        _hub,
        STes = [],
        _screenStream,
        _finalStream,
        _geustStream , 
        _geustStream2,
        _hasStream,
        _guestConnectionID,
        _IAMDone,

        _connect = function (username, onSuccess, onFailure) {
            // Set Up SignalR Signaler

            var hub = $.connection.chatHub;
            hub.client.SetDefaultStream = function (index) {

            };
            hub.client.setMessage = function (message, connectionID, name) {
                    if (connectionID == viewModel.MyConnectionId()) {
                        var ul = $(".messages ul");
                        const li = document.createElement('li');
                        li.className = 'sent';
                        li.innerHTML = `<p>` + name +": " + message + `</p> `;
                        // var li = ' <li class="sent"> < img src = "http://emilcarlsson.se/assets/mikeross.png" alt = "" /> </li >';
                        ul.append(li);

                    }
                    else {
                        var ul = $(".messages ul");
                        const li = document.createElement('li');
                        li.className = 'replies';
                        li.innerHTML = `<p>` + name + ": " + message + `</p> `;
                        // var li = ' <li class="sent"> < img src = "http://emilcarlsson.se/assets/mikeross.png" alt = "" /> </li >';
                        ul.append(li);


                    }
            };
            hub.client.callEveryOne = function (connectionID) {
                console.log("i am called");
                console.log(Result);
                if (_hasStream == "true") {
                    hub.server.resPonseToCallEveryOne(connectionID);
                    console.log("i have stream are you ready")
                }
                else {
                    console.log("i am buisy")
                }
            };
            hub.client.areYouStillThere = function (responser) {
                if (_IAMDone != true) {
                    _IAMDone = true;
                    console.log(responser);
                    console.log("i am waiting please send stream");
                    hub.server.streamRequest(responser);
                   
                }
            };
            hub.client.updateUserList = function (userList) {

                viewModel.setUsers(userList);
            };
            hub.client.streamRequest = function (connectionId, reason) {
                _RequestedStream = 'blank';
                _hub.server.callUser(connectionId, "");
                alertify.success(reason);
            };
            // Hub Callback: Incoming Call
            hub.client.incomingCall = function (callingUser) {
                console.log('تماس ورودی از طرف: ' + JSON.stringify(callingUser));

                hub.server.answerCall(true, callingUser.ConnectionId);
                viewModel.Mode('incall');

                //// Ask if we want to talk
                //alertify.confirm(callingUser.Username + ' منتظر شماست، آیا به گفتمان می پیوندید ؟', function (e) {
                //    if (e) {
                //        // I want to chat
                //        hub.server.answerCall(true, callingUser.ConnectionId);

                //        // So lets go into call mode on the UI
                //        viewModel.Mode('incall');
                //    } else {
                //        // Go away, I don't want to chat with you
                //        hub.server.answerCall(false, callingUser.ConnectionId);
                //    }
                //});
            };

            // Hub Callback: Call Accepted
            hub.client.callAccepted = function (acceptingUser) {

                console.log('پذیرفته شدن تماس از طرف : ' + JSON.stringify(acceptingUser) + '.  ');

                connectionManager.sendSignal(acceptingUser.ConnectionId, _RequestedStream);
                viewModel.guestConnectionId(acceptingUser.ConnectionId);
                //var videoElement = document.querySelector('.video.mine');
                //attachMediaStream(videoElement, STes["1"]);
                connectionManager.initiateOffer(acceptingUser.ConnectionId, [_geustStream]);// [_geustStream, _mediaStream], "1"); //STes["1"]
                //connectionManager.initiateOffer(acceptingUser.ConnectionId, _mediaStream);

                // Set UI into call mode
                viewModel.Mode('incall');
            };

            // Hub Callback: Call Declined
            hub.client.callDeclined = function (decliningConnectionId, reason) {
                console.log('رد تماس از طرف: ' + decliningConnectionId);

                // Let the user know that the callee declined to talk
                alertify.error(reason);

                // Back to an idle UI
                viewModel.Mode('idle');
            };

            // Hub Callback: Call Ended
            hub.client.callEnded = function (connectionId, reason) {
                console.log('تماس با ' + connectionId + ' پایان یافت: ' + reason);

                // Let the user know why the server says the call is over
                //الرت نمیده
               // alertify.error(reason);

                // Close the WebRTC connection
                connectionManager.closeConnection(connectionId);

                // Set the UI back into idle mode
                viewModel.Mode('idle');
            };

            // Hub Callback: Update User List
            hub.client.changeStream = function (stream, acceptingUser) {
                console.log(acceptingUser.ConnectionId);
                connectionManager.changeTrack([_screenStream], acceptingUser.ConnectionId);

                ////روش دوم
                //if (stream == 'video') {
                //    console.log('video');
                //    _finalStream = _mediaStream;
                //    connectionManager.changeTrack([_screenStream], id);
                //}
                //else if (stream == 'screen') {
                //    console.log('screen');
                //    if (_screenStream == null) {
                //        _finalStream = _mediaStream;
                //        connectionManager.changeTrack([_screenStream], id);

                //    } else {
                //        _finalStream = _screenStream;
                //        connectionManager.changeTrack([_screenStream], id);

                //    }
                //}
                //else {
                //    console.log('blank');
                //    connectionManager.changeTrack([_screenStream], id);
                   
                //}
                


                // روش اول
                //if (stream == 'video') {
                //    console.log('video');
                //    _finalStream = _mediaStream;
                //}
                //else if (stream == 'screen') {
                //    console.log('screen');
                //    if (_screenStream == null) {
                //        _finalStream = _mediaStream;

                //    } else {
                //        _finalStream = _screenStream;

                //    }
                //}
                //else {
                //    console.log('blank');
                //    _finalStream = blackSilence();
                //}
               
            };

            // Hub Callback: WebRTC Signal Received
            hub.client.receiveSignal = function (callingUser, data ) {

                connectionManager.newSignal(callingUser.ConnectionId, data);
            };
            $.support.cors = true;
            $.connection.hub.url = '/signalr/hubs';
            $.connection.hub.start()
                .done(function () {
                    //alert('connected to SignalR hub... connection id: ' + _hub.connection.id);

                    // Tell the hub what our username is
                  
                    hub.server.join(viewModel.Groupname(), username, 'client');
                    console.log(username + 'joined to ' + viewModel.Groupname());

                    if (onSuccess) {
                        onSuccess(hub);
                    }
                })
                .fail(function (event) {

                    if (onFailure) {
                        onFailure(event);
                    }
                });


            // Setup client SignalR operations
            _setupHubCallbacks(hub);

            _hub = hub;
        },


        _start = function (hub, type) {
            console.log("start-" + type);
            // Show warning if WebRTC support is not detected
            if (webrtcDetectedBrowser == null) {
                console.log('مرورگر خود را به روزرسانی کنید');
                $('.browser-warning').show();
            }

            // Then proceed to the next step, gathering username
            _getUsername(type);
        },

        _getUsername = function (type) {
            console.log("getusername-" + type);
            //alertify.prompt(" نام گروه ؟", function (e, username) {
            //    if (e == false || username == '') {
            //        //username = 'کاربر ' + Math.floor((Math.random() * 10000) + 1);
            //        alertify.success('جهت اتصال باید نام کلاس را وارد کنید');
            //    }
            //    else {
                   
            //    }

            //    // proceed to next step, get media access and start up our connection
               
            //}, '');
            _startSession("relay");
        },

        _startSession = function (username) {
           
            // Set the selected username in the UI
            viewModel.Username(username);
            viewModel.Loading(true); // Turn on the loading indicator
            $('.instructions').hide();
            //var isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
            //if (!isMobile) {
               
            //    navigator.mediaDevices.getDisplayMedia({
            //        video: {
            //            cursor: "always"
            //        },
            //        audio: true
            //    }).then(

            //        stream => {
            //            console.log("screen is awesom");
            //            var videoScreen = document.querySelector('.video.screen');
            //            _screenStream = stream;


            //            attachMediaStream(videoScreen, _screenStream);

            //        },
            //        error => {
            //            console.log("Unable to acquire screen capture", error);
            //            viewModel.Loading(false);
            //        });

            //}
            //else {
            //    $('.video.screen').css("display", "none");
            //};
            
           
            //getUserMedia(
            //    {
            //        // Permissions to request
            //        video: true,
            //        audio: true,
            //    },
            //    function (stream) { // succcess callback gives us a media stream

            //        var isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
            //        if (!isMobile) {
            //             var audioTrack = stream.getAudioTracks()[0];
            //             _screenStream.addTrack(audioTrack);
            //        }
                   
            //        $('.instructions').hide();
            //        _mediaStream = stream;
            //        STes["0"] = stream;
            //        var videoElement = document.querySelector('.video.mine');
            //        attachMediaStream(videoElement, stream);
            //        $(".audio.mine").css("display", "none");
                 

            //        //blackSilence());//

            //        viewModel.Loading(false);
            //    },
            //    function (error) { // error callback
            //        alertify.alert('<h4>Failed to get hardware access!</h4> Do you have another browser type open and using your cam/mic?<br/><br/>You were not connected to the server, because I didn\'t code to make browsers without media access work well. <br/><br/>Actual Error: ' + JSON.stringify(error));
            //        viewModel.Loading(false);
            //    }
            //);
            //$(".mineholder").css("display", "inline-block");



            // Now we have everything we need for interaction, so fire up SignalR
            _connect(username, function (hub) {
                // tell the viewmodel our conn id, so we can be treated like the special person we are.
                viewModel.MyConnectionId(hub.connection.id);

                // Initialize our client signal manager, giving it a signaler (the SignalR hub) and some callbacks
                // alert('initializing connection manager');
                connectionManager.initialize(hub.server, _callbacks.onReadyForStream, _callbacks.onStreamAdded, _callbacks.onStreamRemoved, _callbacks.onTrackAdded);

                // Store off the stream reference so we can share it later
               // _mediaStream = stream;

                // Load the stream into a video element so it starts playing in the UI
                console.log('playing my local video feed');


                



                // Hook up the UI
                _attachUiHandlers();

                viewModel.Loading(false);
            }, function (event) {
                alertify.alert('<h4>Failed SignalR Connection</h4> We were not able to connect you to the signaling server.<br/><br/>Error: ' + JSON.stringify(event));
                viewModel.Loading(false);
            });
            // Ask the user for permissions to access the webcam and mic
            //getUserMedia(
            //    {
            //        // Permissions to request
            //        video: true,
            //        audio: true,
            //    },
            //    function (stream) { // succcess callback gives us a media stream

            //    },
            //    function (error) { // error callback
            //        alertify.alert('<h4>Failed to get hardware access!</h4> Do you have another browser type open and using your cam/mic?<br/><br/>You were not connected to the server, because I didn\'t code to make browsers without media access work well. <br/><br/>Actual Error: ' + JSON.stringify(error));
            //        viewModel.Loading(false);
            //    }
            //);
        },

        _attachUiHandlers = function () {
            // Add click handler to users in the "Users" pane
            $('.user').live('click', function () {
                // Find the target user's SignalR client id
                var targetConnectionId = $(this).attr('data-cid');

                // Make sure we are in a state where we can make a call
                //if (viewModel.Mode() !== 'idle') {
                //    alertify.error('Sorry, you are already in a call.  Conferencing is not yet implemented.');
                //    return;
                //}

                // Then make sure we aren't calling ourselves.
                if (targetConnectionId != viewModel.MyConnectionId()) {
                    // Initiate a call
                    _hub.server.callUser(targetConnectionId);// 

                    // UI in calling mode
                    viewModel.Mode('calling');
                } else {
                    alertify.error("Ah, nope.  Can't call yourself.");
                }
            });

            // Add handler for the hangup button
            $('.hangup').click(function () {
                // Only allow hangup if we are not idle
                $(".requst").css("display","inline-block")
                $(".hangup").css("display","none")
                if (viewModel.Mode() != 'idle') {
                    _hub.server.hangUp("");
                    connectionManager.closeAllConnections();
                    viewModel.Mode('idle');
                }
            });
            $('.requst').click(function () {
                _IAMDone = "";
                _geustStream =null;
                _hub.server.hangUp("");
                connectionManager.closeAllConnections(viewModel.guestConnectionId());
                _hub.server.callEveryOne(viewModel.guestConnectionId());
                alertify.success("درخواست شما ارسال شد");
            });
            $(".submit").click(function () {
                var message = $("#chatMessage").val();
                _hub.server.sendMessage(message);
            })

        },

        _setName = function (name) {
            viewModel.Groupname(name);
        },
        _setupHubCallbacks = function (hub) {


        },

        // Connection Manager Callbacks
        _callbacks = {
            
            onReadyForStream: function (connection) {
              
                // The connection manager needs our stream
                // todo: not sure I like this

                //navigator.mediaDevices.getDisplayMedia({
                //    video: {
                //        cursor: "always"
                //    },
                //    audio: true
                //}).then(
                //    stream => {
                //        console.log("awesom");
                //        _mediaStream = stream;
                //        var videoElement = document.querySelector('.video.mine');
                //        attachMediaStream(videoElement, stream);
                //        $(".audio.mine").css("display", "none");

                        
                //    },
                //    error => {
                //        console.log("Unable to acquire screen capture", error);
                //    });
               
                //connection.addStream(_mediaStream); 


                var st1 = new MediaStream();
                var st2 = new MediaStream();

               // st2.getAudioTracks[0] = blackSilence().getAudioTracks[0];
               // st2.getAudioTracks[0] = _mediaStream.getAudioTracks[0];

                //st2.getVideoTracks[0] = blackSilence().getVideoTracks[0];
               // st2.getVideoTracks[0] = _mediaStream.getVideoTracks[0];
              
                //let STES = [_mediaStream, blackSilence()];
                //for (const stream of STES) {
                    
                //};
                blackSilence().getTracks().forEach(function (track) {

                    connection.addTrack(track, st1);
                });
                console.log("adding media stream");
                //connection.addStream(_finalStream);
               
                
            },
            onStreamAdded: function (connection, event) {
                console.log('binding remote stream to the partner window');
                
                // Bind the remote stream to the partner window
               
              
                //var otherVideo = document.querySelector('.video.partner');

                //attachMediaStream(otherVideo, event.stream); // from adapter.js

                $(".video.mine").parent().removeClass();
                $(".video.mine").parent().addClass('mineholderAfter');
                $(".video.screen").parent().removeClass();
                $(".video.screen").parent().addClass('mineholderScreenAfter');
                $(".partnerholder").css("display", "inline-block");
                $(".requst").css("display", "inline-block");
                $(".hangup").css("display", "inline-block");
                
            


            },
            onTrackAdded: function (connection, event) {

                if (_geustStream == null) {
                    var otherVideo = document.querySelector('.video.partner');
                    var otherVideo2 = document.querySelector('.video.partner2');
                    //_geustStream = event.stream;
                    _hasStream = "true";
                    var st1 = new MediaStream();
                    var st2 = new MediaStream();
                    if (event.streams[0].getVideoTracks() != null) {
                        if (event.streams[0].getVideoTracks()[0] != null) {
                            console.log("1 has video")
                            st1.addTrack(event.streams[0].getVideoTracks()[0]);
                          

                        }

                    }
                    if (event.streams[0].getVideoTracks() != null) {
                        if (event.streams[0].getAudioTracks()[0] != null) {
                            console.log("1 has audio")
                            st1.addTrack(event.streams[0].getAudioTracks()[0]);
                           
                        }
                    }
                 //   _geustStream = st1;
                    //_mediaStream

                    _geustStream = st1;
                    var st2 = new MediaStream();
                    if (event.streams[0].getVideoTracks() != null) {
                        if (event.streams[0].getVideoTracks()[1] != null) {
                            console.log("2 has video")
                            st2.addTrack(event.streams[0].getVideoTracks()[1]);

                        }
                    }
                    if (event.streams[0].getVideoTracks() != null) {

                        if (event.streams[0].getAudioTracks()[1] != null) {
                            console.log("2 has audio")
                            st2.addTrack(event.streams[0].getAudioTracks()[1]);
                        }
                    }
                     _geustStream2 = st2;
                    //
                   
                   
                    attachMediaStream(otherVideo, st1);
                    attachMediaStream(otherVideo2, st2);
                    //var videoElement = document.querySelector('.video.mine');
                    //attachMediaStream(videoElement, st2);
                    console.log("ontrack fired!");

                    //if (_guestConnectionID != null) {
                    //    connectionManager.sendSignal(_guestConnectionID, _RequestedStream);
                    //    connectionManager.initiateOffer(_guestConnectionID, [_geustStream, _geustStream2], "1");
                    //}

                }
                else {
                    console.log("_getstream in no null");
                }
            
               
                


            },
            onStreamRemoved: function (connection, streamId) {
                // todo: proper stream removal.  right now we are only set up for one-on-one which is why this works.
                console.log('removing remote stream from partner window');

                // Clear out the partner window
                var otherVideo = document.querySelector('.video.partner');
                otherVideo.src = '';
            }
        };

    return {
        start: _start, // Starts the UI process
        getStream: function () { // Temp hack for the connection manager to reach back in here for a stream
            return _mediaStream;
        },
        setName : _setName
    };
})(WebRtcDemo.ViewModel, WebRtcDemo.ConnectionManager);

// Kick off the app
WebRtcDemo.App.start();