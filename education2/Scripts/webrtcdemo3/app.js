﻿
var _mediaStream;


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
    var _hub,
        STes = [],
        guestIDes = [],
        SteamToGo = [blackSilence(), blackSilence(), blackSilence()],
       
        _finalStream,
        _geustStream,
        _geustStream2,
        _hasStream = 'true',
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
                    li.innerHTML = `<p>` + name + ": " + message + `</p> `;
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
            hub.client.callEveryOne = function (connectionID,type) {
                console.log("i am called");
                console.log(connectionID);
                console.log(type);

                hub.server.resPonseToCallEveryOne(connectionID, type);
                console.log("i have stream are you ready")
               
            };
            hub.client.areYouStillThere = function (responser,type) {
                if (_IAMDone != true) {
                    _IAMDone = true;
                    console.log(responser);
                    alertify.success("i am waiting please send stream");
                    hub.server.streamRequest(responser,type);

                }
            };
            hub.client.updateUserList = function (userList) {

                viewModel.setUsers(userList);
            };
            hub.client.GetStreamRequest = function (connectionId, reason, type) {
                _RequestedStream = 'blank';
                _hub.server.callUser(connectionId, type);
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
            hub.client.callAccepted = function (acceptingUser, type,connectionID) {

                console.log('پذیرفته شدن تماس از طرف : ' + JSON.stringify(acceptingUser) + '.  ');
                if (type == true) {
                    var index = guestIDes.indexOf("null");
                    console.log(index);
                    console.log(connectionID);
                    guestIDes[index] = connectionID;
                    console.log(guestIDes[index]);
                    if (guestIDes.includes("null")) {
                      
                    }
                    else {
                        console.log("no more connection ")
                        hub.server.changeRelayStat("1");

                    }
                    // open relay befor next calling 
                  //  guestIDes.push();
                }

                connectionManager.sendSignal(acceptingUser.ConnectionId, _RequestedStream);
                
                connectionManager.initiateOffer(acceptingUser.ConnectionId,  [blackSilence(), blackSilence(), blackSilence()]);
                //connectionManager.initiateOffer(acceptingUser.ConnectionId, _mediaStream);

                // Set UI into call mode
                viewModel.Mode('incall');
            };

            // Hub Callback: Call Declined
            hub.client.callDeclined = function (decliningConnectionId, reason) {
                console.log('رد تماس از طرف: ' + decliningConnectionId);

                // Let the user know that the callee declined to talk 32478b2379023b923
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

                var index = guestIDes.indexOf(connectionId)
                guestIDes[index] = "null";
                SteamToGo[index] = blackSilence();

                connectionManager.closeConnection(connectionId);
                hub.server.changeRelayStat("0");
                hub.server.callOtherClientToUpdate(viewModel.MyConnectionId());


                _geustStream = "0";
                $(".hangup").css("display", "none");
                // Set the UI back into idle mode
                viewModel.Mode('idle');
            };
            hub.client.doWhatYoutThinkIsRight = function (connectionId){
                console.log("check User: " + connectionId)
                if (connectionManager.connectionIsExist(connectionId))
                {
                   
                    console.log("changing stream for " + connectionId);
                    hub.server.callUserTochangeVideo(connectionId, guestIDes.toString(), viewModel.MyConnectionId());
                    stateChange(-1);
                    function stateChange(newState) {
                        setTimeout(function () {
                            if (newState == -1) {
                                console.log(guestIDes[0]);
                                if (guestIDes.includes(connectionId)) {
                                    console.log("it is");
                                    connectionManager.changeTrack(SteamToGo, connectionId);
                                } else {
                                    console.log("it is not");
                                }
                            }
                        }, 1000);
                    }

                }
                else {
                    console.log(connectionId + " has not connection")
                    _hub.server.callUser(connectionId);
                }
               

            };
            // Hub Callback: Update User List
            hub.client.changeStream = function (stream, acceptingUser) {
                console.log(stream);
                console.log(acceptingUser.ConnectionId);

                if (stream == 'video') {
                    connectionManager.changeTrack([_mediaStream], acceptingUser.ConnectionId);
                }
                else if (stream == 'blank') {
                    connectionManager.changeTrack([blackSilence()], acceptingUser.ConnectionId);
                }

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
            hub.client.receiveSignal = function (callingUser, data) {

                connectionManager.newSignal(callingUser.ConnectionId, data);
            };
            $.support.cors = true;
            $.connection.hub.url = '/signalr/hubs';
            $.connection.hub.start()
                .done(function () {
                    //alert('connected to SignalR hub... connection id: ' + _hub.connection.id);

                    // Tell the hub what our username is
                    console.log(viewModel.Groupname());
                    console.log(username);
                    hub.server.join(viewModel.Groupname(), username, 'client');
                    $("#chatname").text(username)
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
            _startSession('relay');
        },

        _startSession = function (username) {

            // Set the selected username in the UI
            viewModel.Username(username);
            viewModel.Loading(true); // Turn on the loading indicator
            $('.instructions').hide();
            var isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
          
            $('.instructions').hide();
            _finalStream = _mediaStream;
           
            $(".audio.mine").css("display", "none");
            $(".mineholder").css("display", "inline-block");



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
                guestIDes = ["null", "null", "null"],
                setInterval(function () {
                    hub.server.checkUserExist();
                }, 8000);
       
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
            $(".mycamera").click(function () {
                var x = document.getElementById("cameraSection");
                if (x.style.display === "none") {
                    $("#cameraSection").slideDown();
                    // x.style.display = "block";
                } else {
                    $("#cameraSection").slideUp();
                    // x.style.display = "none";
                }
            })
            $(".chat").click(function () {
                var isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
                if (isMobile) {
                    var width = $("#chatHolder").width();
                    if (width == 0) {
                        $(".content").css("display", "block");
                        $("#vidoeHolder").animate({
                            width: '0%'
                        });
                        $("#chatHolder").animate({
                            width: '100%'
                        })
                    }
                    else {
                        $(".content").css("display", "none");
                        $("#vidoeHolder").animate({
                            width: '100%'
                        });
                        $("#chatHolder").animate({
                            width: '0%'
                        })
                    }

                }
                else {
                    var width = $("#chatHolder").width();
                    if (width == 0) {
                        $("#vidoeHolder").animate({
                            width: '50%'
                        });
                        $("#chatHolder").animate({
                            width: '50%'
                        })
                    }
                    else {
                        $("#vidoeHolder").animate({
                            width: '100%'
                        });
                        $("#chatHolder").animate({
                            width: '0%'
                        })
                    }

                }


            });
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
                _IAMDone = "";
                _geustStream = "0";
                // Only allow hangup if we are not idle
                $(".requst").css("display", "inline-block")
                $(".hangup").css("display", "none")
                if (viewModel.Mode() != 'idle') {
                    _hub.server.hangUp("");
                    connectionManager.closeAllConnections();
                    viewModel.Mode('idle');
                }
            });
            $('.requst').click(function () {
                _IAMDone = "";
                _geustStream = "0";
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
            onStreamAdded: function (connection, event, partnerClientId) {

                console.log("onstream added by " + partnerClientId);

                if (guestIDes.includes(partnerClientId)) {



                    var index = guestIDes.indexOf(partnerClientId);

                     console.log("on track added fire");
                    
                    console.log(index + "is full");
                    SteamToGo[index] = event.stream;
                    _hub.server.callOtherClientToUpdate(viewModel.MyConnectionId());
                }
               
            },
            onTrackAdded: function (connection, event) {

                if (_geustStream == "0") {
                    _geustStream == "1"
                    var otherVideo = document.querySelector('.video.partner');
                    var otherVideo2 = document.querySelector('.video.partner2');
                    var otherVideo3 = document.querySelector('.video.partner3');


                    var st1 = new MediaStream();
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
                    STes[0] = st1;

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

                    STes[1] = st2;

                    var st3 = new MediaStream();
                    if (event.streams[0].getVideoTracks() != null) {
                        if (event.streams[0].getVideoTracks()[2] != null) {
                            console.log("3 has video")
                            st3.addTrack(event.streams[0].getVideoTracks()[2]);

                        }
                    }
                    if (event.streams[0].getVideoTracks() != null) {

                        if (event.streams[0].getAudioTracks()[2] != null) {
                            console.log("3 has audio")
                            st3.addTrack(event.streams[0].getAudioTracks()[2]);
                        }
                    }
                    STes[2] = st3;



                    attachMediaStream(otherVideo, st1);
                    attachMediaStream(otherVideo2, st2);
                    attachMediaStream(otherVideo3, st3);
                }
                

                //if (_geustStream == null) {
                //    var otherVideo = document.querySelector('.video.partner');
                //    var otherVideo2 = document.querySelector('.video.partner2');
                //    //_geustStream = event.stream;
                //    // _hasStream = "true";
                    
                //    //
                //    //attachMediaStream(otherVideo, st1);
                //    //attachMediaStream(otherVideo2, st2);
                //    console.log("ontrack fired!");

                //    //if (_guestConnectionID != null) {
                //    //    connectionManager.sendSignal(_guestConnectionID, _RequestedStream);
                //    //    connectionManager.initiateOffer(_guestConnectionID, [_geustStream, _geustStream2], "1");
                //    //}

                //}
                //else {
                //    console.log("_getstream in no null");
                //}





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
        setName: _setName
    };
})(WebRtcDemo.ViewModel, WebRtcDemo.ConnectionManager);

// Kick off the app
WebRtcDemo.App.start();