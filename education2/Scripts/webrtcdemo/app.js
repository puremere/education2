

var WebRtcDemo = WebRtcDemo || {};

// todo:
//  cleanup: proper module loading
//  cleanup: promises to clear up some of the async chaining
//  feature: multiple chat partners

WebRtcDemo.App = (function (viewModel, connectionManager) {
    var _mediaStream,
        _screenStream,
        _hub,
        STes = {},
        _index,
        _RequestedStream = 'video',
        _connectionManager = connectionManager,
        _indexMustBeChange,
        _connect = function (username, onSuccess, onFailure) {
            // Set Up SignalR Signaler
            
            var hub = $.connection.chatHub;
            hub.client.SetDefaultStream = function (index) {
                _index = index;
            },
            hub.client.alertID = function (count) {
                alert(count);
            },
            hub.client.closeAll = function (id) {
                
                viewmodel.mode('idle');
              //  connectionmanager.closeallconnections();
                alert("aaaaaa")
            };
            hub.client.updateUserList = function (userList) {

                viewModel.setUsers(userList);
            };
            // Hub Callback: Incoming Call
            hub.client.incomingCall = function (callingUser) {
                console.log('تماس ورودی از طرف: ' + JSON.stringify(callingUser));

                // Ask if we want to talk
                alertify.confirm(callingUser.Username + ' منتظر شماست، آیا به گفتمان می پیوندید ؟', function (e) {
                    if (e) {
                        // I want to chat
                        hub.server.answerCall(true, callingUser.ConnectionId);

                        // So lets go into call mode on the UI
                        viewModel.Mode('incall');
                    } else {
                        // Go away, I don't want to chat with you
                        hub.server.answerCall(false, callingUser.ConnectionId);
                    }
                });
            };

            // Hub Callback: Call Accepted
            hub.client.callAccepted = function (acceptingUser, isChnager) {
                _indexMustBeChange = isChnager;
                if (isChnager != "") {
                    
                    _index = "1";
                }
                console.log(isChnager);
                console.log('پذیرفته شدن تماس از طرف : ' + JSON.stringify(acceptingUser) + '.  ');
                console.log(_index);
                // Callee accepted our call, let's send them an offer with our video stream
                console.log(_index);
                connectionManager.sendSignal(acceptingUser.ConnectionId,'blank');
                connectionManager.initiateOffer(acceptingUser.ConnectionId, STes[_index]);
               
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
                alertify.error(reason);

                // Close the WebRTC connection
                connectionManager.closeConnection(connectionId);

                // Set the UI back into idle mode
                viewModel.Mode('idle');
            };

            // Hub Callback: Update User List


            // Hub Callback: WebRTC Signal Received
            hub.client.receiveSignal = function (callingUser, data) {

                connectionManager.newSignal(callingUser.ConnectionId, data);
            };
            $.support.cors = true;
            $.connection.hub.url = '/signalr/hubs';
            $.connection.hub.start()
                .done(function () {
                    console.log('connected to SignalR hub... connection id: ' + _hub.connection.id);

                    // Tell the hub what our username is
                    hub.server.join(username);
                 
               
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

        _start = function (hub) {
            // Show warning if WebRTC support is not detected
            if (webrtcDetectedBrowser == null) {
                console.log('مرورگر خود را به روزرسانی کنید');
                $('.browser-warning').show();
            }

            // Then proceed to the next step, gathering username
            _getUsername();
        },

        _getUsername = function () {
            alertify.prompt(" نام مستعار ؟", function (e, username) {
                if (e == false || username == '') {
                    username = 'کاربر ' + Math.floor((Math.random() * 10000) + 1);
                    alertify.success('شما به نام کاربری نیاز دارید : ' + username);
                }

                // proceed to next step, get media access and start up our connection
                _startSession(username);
            }, '');
        },

        _startSession = function (username) {

            viewModel.Username(username); // Set the selected username in the UI
            viewModel.Loading(true); // Turn on the loading indicator

            // Ask the user for permissions to access the webcam and mic


            navigator.mediaDevices.getDisplayMedia({
                video: {
                    cursor: "always"
                },
                audio: true
            }).then(
                stream => {
                    console.log("awesom");
                    var videoScreen = document.querySelector('.video.screen');
                    _screenStream = stream;
                    STes["0"] = _screenStream;
                    
                    attachMediaStream(videoScreen, STes["0"]);
                    
                },
                error => {
                    console.log("Unable to acquire screen capture", error);
                    viewModel.Loading(false);
                });

            getUserMedia(
                {
                    // Permissions to request
                    video: true,
                    audio: true
                },
                function (stream) { // succcess callback gives us a media stream
                    var audioTrack = stream.getAudioTracks()[0];
                    _screenStream.addTrack(audioTrack);
                    STes["0"] = _screenStream;

                    $('.instructions').hide();

                    // Now we have everything we need for interaction, so fire up SignalR
                    _connect(username, function (hub) {
                        // tell the viewmodel our conn id, so we can be treated like the special person we are.
                        viewModel.MyConnectionId(hub.connection.id);

                        // Initialize our client signal manager, giving it a signaler (the SignalR hub) and some callbacks
                        // alert('initializing connection manager');
                        connectionManager.initialize(hub.server, _callbacks.onReadyForStream, _callbacks.onStreamAdded, _callbacks.onStreamRemoved);

                        // Store off the stream reference so we can share it later
                        _mediaStream = stream;
                        STes["1"] = _mediaStream;
                        _index = "1";
                        // Load the stream into a video element so it starts playing in the UI
                        console.log('playing my local video feed');
                        var videoElement = document.querySelector('.video.mine');
                        attachMediaStream(videoElement, STes["1"]);

                        // Hook up the UI
                        _attachUiHandlers();

                        viewModel.Loading(false);
                    }, function (event) {
                        alertify.alert('<h4>Failed SignalR Connection</h4> We were not able to connect you to the signaling server.<br/><br/>Error: ' + JSON.stringify(event));
                        viewModel.Loading(false);
                    });
                },
                function (error) { // error callback
                    alertify.alert('<h4>Failed to get hardware access!</h4> Do you have another browser type open and using your cam/mic?<br/><br/>You were not connected to the server, because I didn\'t code to make browsers without media access work well. <br/><br/>Actual Error: ' + JSON.stringify(error));
                    viewModel.Loading(false);
                }
            );
        },
        
        _attachUiHandlers = function () {
            // Add click handler to users in the "Users" pane
            $('.user i').live('click', function () {
                var targetConnectionId = $(this).attr('data-cid');
             
                if (targetConnectionId != viewModel.MyConnectionId()) {
                    //hub.invoke('HangUp', id);
                    _hub.server.hangUp(targetConnectionId);
                   // _hub.revoke('HangUp', targetConnectionId);
                    connectionManager.closeConnection(targetConnectionId);
                    viewModel.Mode('idle');
                 
                } else {
                    alertify.error("Ah, nope.  Can't call yourself.");
                }
            });
            $('.user a').live('click', function () {
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

                    _hub.server.callUser(targetConnectionId,"");// 
                    console.log("callUser","");
                    // UI in calling mode
                    viewModel.Mode('calling');
                } else {
                    alertify.error("Ah, nope.  Can't call yourself.");
                }
            });

            // Add handler for the hangup button
            $('.hangup').click(function () {
                // Only allow hangup if we are not idle
                if (viewModel.Mode() != 'idle') {
                    _hub.server.hangUp("");
                    connectionManager.closeAllConnections("");
                    viewModel.Mode('idle');
                }
            });
            //$('.video').click(function () {
            //    alert("aa");

            //    //let id = $(this).attr('id');

            //    //if (viewmodel.mode() != 'idle') {
            //    //    _hub.server.hangup();
            //    //    connectionmanager.closeallconnections();
            //    //    viewmodel.mode('idle');
            //    //}

            //    //_index = id;

            //    //_hub.server.resetallconnction(id);

            //})
        },
        _resetStream = function (id) {
         

            var hub = $.connection.chatHub;
           
            // creation of first channel
            if (id != "0" && id != "1") {


                //close
                _hub.server.hangUp(id);
                // _hub.revoke('HangUp', targetConnectionId);
                connectionManager.closeConnection(id);
                viewModel.Mode('idle');

                //open new
                _hub.server.callUser(id,"1");// 


                viewModel.Mode('calling');
                console.log("stream is ready:" + _index);

                
            }
            else {
              
               
                hub.invoke('HangUpEcexpt', id);
                WebRtcDemo.ConnectionManager.closeAllConnections(id);
                WebRtcDemo.ViewModel.Mode('idle');
                hub.invoke('resetAllConnction', id);   
            }

           
           
           

            
        },
        _setupHubCallbacks = function (hub) {

            

        },

        
        // Connection Manager Callbacks
        _callbacks = {
           
            onReadyForStream: function (connection) {
                // The connection manager needs our stream
                // todo: not sure I like this
                connection.addStream(_mediaStream);
            },
            onStreamAdded: function (partnerClientId, event) {
                console.log('binding remote stream to the partner window');
               
                // Bind the remote stream to the partner window
                STes[partnerClientId] = event.stream;

                
                const div = document.createElement('div');
                div.className = 'span4';
                if (event.stream.getVideoTracks() == "") {
                    console.log("no-video ")
                    div.innerHTML = ` <h4>مخاطب</h4> <audio id='` + partnerClientId + `'  controls autoplay class="audio mine"></audio> `;

                } else  {
                    div.innerHTML = ` <h4>مخاطب</h4> <video style="max-height:200px" id='` + partnerClientId + `' class='video partner cool-background' autoplay='autoplay' onclick='changeStream(this.id)' ></video>  `;
                    console.log("no-audio ")
                }
                //div.innerHTML = ` <h4>مخاطب</h4> <audio id='` + partnerClientId + `'  controls autoplay class="audio mine"></audio> `;

               // div.innerHTML = ` <h4>مخاطب</h4> <video id='` + partnerClientId + `' class='video partner cool-background' autoplay='autoplay' onclick='changeStream(this.id)' ></video>  `;

                var VHolder = document.getElementById('videoHolder');
                VHolder.appendChild(div);
             
                var ListOfVideo = document.getElementById(partnerClientId);
                attachMediaStream(ListOfVideo, event.stream);

                if (_indexMustBeChange == "1") {

                    var hub = $.connection.chatHub;
                    _index = partnerClientId;
                    hub.invoke('HangUpEcexpt', _index);
                    WebRtcDemo.ConnectionManager.closeAllConnections(_index);
                    WebRtcDemo.ViewModel.Mode('idle');
                    hub.invoke('resetAllConnction', _index);
                }


                console.log(_index);
                //for (var i = 0; i < ListOfVideo.length; ++i) {
                //    var id = ListOfVideo[i].attr['id'];
                //    console.log(id);
                //    attachMediaStream(ListOfVideo[i], STes[id]);
                //    console.log(i + "");

                //}
                
              //  attachMediaStream(otherVideo, STes[id]); // from adapter.js
            },
            onStreamRemoved: function (connection, partnerClientId) {
                // todo: proper stream removal.  right now we are only set up for one-on-one which is why this works.

                console.log('removing remote stream from partner window');
                console.log(partnerClientId);
                // Clear out the partner window
                
                var otherVideo = document.getElementById(partnerClientId);
                if (otherVideo != null) {
                    otherVideo.src = '';
                    otherVideo.parentElement.remove();
                }
                
            }
        };
     

    return {
        start: _start, // Starts the UI process
        getStream: function() { // Temp hack for the connection manager to reach back in here for a stream
            return _mediaStream;
        },
        resetStream: _resetStream
    
    };
})(WebRtcDemo.ViewModel, WebRtcDemo.ConnectionManager);

// Kick off the app

WebRtcDemo.App.start();

