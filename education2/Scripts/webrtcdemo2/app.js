var videoElement = document.querySelector('.video.mine');
var audioSelect = document.querySelector('select#audioSource');
var videoSelect = document.querySelector('select#videoSource');
var _mediaStream;
audioSelect.onchange = getStream;
videoSelect.onchange = getStream;

getStream().then(getDevices).then(gotDevices);

function getDevices() {
    // AFAICT in Safari this only gets default devices until gUM is called :/
    return navigator.mediaDevices.enumerateDevices();
}

function gotDevices(deviceInfos) {
    window.deviceInfos = deviceInfos; // make available to console
    console.log('Available input and output devices:', deviceInfos);
    for (const deviceInfo of deviceInfos) {
        const option = document.createElement('option');
        option.value = deviceInfo.deviceId;
        if (deviceInfo.kind === 'audioinput') {
            option.text = deviceInfo.label || `Microphone ${audioSelect.length + 1}`;
            audioSelect.appendChild(option);
        } else if (deviceInfo.kind === 'videoinput') {
            option.text = deviceInfo.label || `Camera ${videoSelect.length + 1}`;
            videoSelect.appendChild(option);
        }
    }
}

function getStream() {
    if (window.stream) {
        window.stream.getTracks().forEach(track => {
            track.stop();
        });
    }
    const audioSource = audioSelect.value;
    const videoSource = videoSelect.value;
    const constraints = {
        audio: { deviceId: audioSource ? { exact: audioSource } : undefined },
        video: { deviceId: videoSource ? { exact: videoSource } : undefined }
    };
    return navigator.mediaDevices.getUserMedia(constraints).
        then(gotStream).catch(handleError);
}

function gotStream(stream) {
    _mediaStream = stream;
  //  window.stream = stream; // make stream available to console
    audioSelect.selectedIndex = [...audioSelect.options].
        findIndex(option => option.text === stream.getAudioTracks()[0].label);
    videoSelect.selectedIndex = [...videoSelect.options].
        findIndex(option => option.text === stream.getVideoTracks()[0].label);
    videoElement.srcObject = stream;
}

function handleError(error) {
    console.error('Error: ', error);
}


//var imageAddr = "https://stream.sup-ect.ir/img/test.jpg";
//var downloadSize = 3788800; //bytes
//var Result = 0;
//function ShowProgressMessage(msg) {
//    if (console) {
//        if (typeof msg == "string") {
//            console.log(msg);
//        } else {
//            for (var i = 0; i < msg.length; i++) {
//                console.log(msg[i]);
//            }
//        }
//    }
//    var oProgress = document.getElementById("progress");
//    if (oProgress) {
//        var actualHTML = (typeof msg == "string") ? msg : msg.join("<br />");
//        oProgress.innerHTML = actualHTML;
//    }
//}
//function InitiateSpeedDetection() {
//    ShowProgressMessage("Loading the image, please wait...");
//    window.setTimeout(MeasureConnectionSpeed, 1);
//};
//if (window.addEventListener) {
//    window.addEventListener('load', InitiateSpeedDetection, false);
//} else if (window.attachEvent) {
//    window.attachEvent('onload', InitiateSpeedDetection);
//}
//function MeasureConnectionSpeed() {
//    var startTime, endTime;
//    var download = new Image();
//    download.onload = function () {
//        endTime = (new Date()).getTime();
//        showResults();
//    }
//    download.onerror = function (err, msg) {
//        ShowProgressMessage("Invalid image, or error downloading");
//    }
//    startTime = (new Date()).getTime();
//    var cacheBuster = "?nnn=" + startTime;
//    download.src = imageAddr + cacheBuster;
//    function showResults() {
//        var duration = (endTime - startTime) / 1000;
//        var bitsLoaded = downloadSize * 8;
//        var speedBps = (bitsLoaded / duration).toFixed(2);
//        var speedKbps = (speedBps / 1024).toFixed(0);
//        Result = speedKbps; 
//       // var speedMbps = (speedKbps / 1024).toFixed(2);

//    }
//}





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
    var   _hub,
        STes = [],
        _screenStream,
        _finalStream,
        _hostStream = [],
        _geustStream = "0",
        _slaveNumber = 1,
        _streamType = 'blank',
        _guestConnectionID,
        _IAMDone,
        _width,_height,

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
            hub.client.noRelay = function () {
                alertify.success("سرور در حال پردازش اطلاعات میباشد! لطفاً پس از اندکی تامل از دکمه اتصال منوی بالا استفاده نمایید")
            };
            hub.client.callEveryOne = function (connectionID) {
                console.log("i am called");
                
                if (false) {
                    hub.server.resPonseToCallEveryOne(connectionID);
                    console.log("i have stream are you ready")
                }
                else {
                    console.log("i am buisy")
                }
            };
            hub.client.areYouStillThere = function (responser,type) {
                console.log(responser);
                console.log("i am waiting please send stream");
                hub.server.streamRequest(responser,type);
            };
            hub.client.updateUserList = function (userList) {

                viewModel.setUsers(userList);
            };
            hub.client.streamRequest = function (connectionId, reason) {
                console.log("calling user");
                _RequestedStream = 'blank';
                _hub.server.callUser(connectionId, "");
                alertify.success(reason);
            };
           
            hub.client.changeYourClientVideo = function(IDes, relay){
                console.log(_hostStream[relay]);
                console.log(IDes);

                _hostStream[relay] = IDes;
                var list = IDes.split(',');
                list.forEach(myFunction);
               // $(".slave").css("display","none")
                function myFunction(value, index, array) {
                    //if (value != "null" && value != viewModel.MyConnectionId()) {
                    if (value != "null") {
                        console.log(value);
                        console.log(viewModel.MyConnectionId())
                        var id = relay + index;
                        console.log(id);
                        var video = document.getElementById(id);
                       
                        video.parentElement.style.display = "inline-block";
                    }
                    else {
                        console.log(value);
                        console.log(viewModel.MyConnectionId())
                        var id = relay + index;
                        console.log(id);
                        var video = document.getElementById(id);
                     
                        video.parentElement.style.display = "none";
                    }
                   

                    
                };

                var count = 0;
                $(".slave").each(function (index, value) {
                   
                    if (`${this.style.display}` != "none") {
                        count = count + 1;
                    }
                 
                })
                console.log(count);
                var isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
                var amount = "width"

                if (count == 0) {
                    $(".slave").each(function () {
                        $(this).removeAttr('class');
                        $(this).addClass("slave")
                    
                    
                    })
                    $(".master").each(function () {
                        $(this).removeAttr('class');
                        $(this).addClass("master");
                     
                    })
                }
                if (count == 1) {
                    $(".slave").each(function () {
                        
                        $(this).addClass("slave1")
                    });
                    $(".master").each(function () {
                        $(this).addClass("master1")
                    });
                    
                }
                else if (count >= 2 && count < 4) {
                   
                    $(".slave").each(function () {
                        $(this).removeAttr('class');
                        $(this).addClass("slave");   
                        $(this).addClass("slave2")
                    });
                    $(".master").each(function () {
                        $(this).removeAttr('class');
                        $(this).addClass("master");
                        $(this).addClass("master2")
                    });
                    console.log(count % 2)
                    //if (count % 2 == 1) {
                    //    let finalIndex = 0;
                    //    $(".slave").each(function (index, value) {

                    //        if (`${this.style.display}` != "none") {
                    //            finalIndex = index;
                    //        }

                    //    })
                    //   // var element = document.querySelectorAll(".slave:last");
                    //    $(".slave::nth-child(" + finalIndex +")").last().css("width", "100%");
                      
                    //}
                }
               
               

            };
            // Hub Callback: Incoming Call
            hub.client.incomingCall = function (callingUser,type) {
                console.log('تماس ورودی از طرف: ' + JSON.stringify(callingUser));
               // alertify.success( "تماس ورودی " + _geustStream)
                if (type == true) {
                    _streamType = "video"
                    _hostStream[callingUser.ConnectionId] = callingUser.GuestIDes;
                }
                else {
                    _streamType = "blank"
                }
             
                hub.server.answerCall(true, callingUser.ConnectionId,type);
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
                connectionManager.initiateOffer(acceptingUser.ConnectionId, [_geustStream, _geustStream2], "1");
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
                //_geustStream = "0";
                $(".hangup").css("display", "none");
                $(".joinAddress").css("display", "none")
                // Set the UI back into idle mode
                viewModel.Mode('idle');
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
                
               
            };
            hub.client.HideYourVideo = function (index) {
                if (_slaveNumber > 1) {
                    var srt = '.video.partner' + index;
                    console.log(srt);
                    var videoToHide = document.querySelector(srt);
                    videoToHide.style.display = "none";
                    _slaveNumber = _slaveNumber - 1;
                 
                    if (_slaveNumber == 1) {
                        $(".master").css("height", "100%");
                        $(".slave").css("width", "30%");
                        $(".slave").css("height", "30%");
                        $(".slave").css("position", "absolute");
                    }
                    else if (_slaveNumber == 2) {
                        $(".master").css("height", "50%");
                        $(".slave").css("width", "50%");
                        $(".slave").css("height", "50%");
                        $(".slave").css("position", "relative");
                        $(".slave video").css("object-fit", "cover");
                    }
                }
                

            };
            hub.client.ShowYourVideo = function (index) {
                if (_slaveNumber < 3) {
                    var srt = '.video.partner' + index;
                    console.log(srt);
                    var videoToHide = document.querySelector(srt);
                    videoToHide.style.display = "block";
                    _slaveNumber = _slaveNumber + 1;
                  
                    if (_slaveNumber == 2) {
                        $(".master").css("height", "50%");
                        $(".slave").css("width", "50%");
                        $(".slave").css("height", "50%");
                        $(".slave").css("position", "relative");
                        $(".slave video").css("object-fit", "cover");

                    }
                    else if (_slaveNumber == 3) {
                        $(".master").css("height", "50%");
                        $(".master").css("width", "50%");
                        $(".slave").css("width", "50%");
                        $(".slave").css("height", "50%");
                        $(".slave").css("position", "relative");
                        $(".slave video").css("object-fit", "cover");

                    }
                }
                
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
                    console.log(viewModel.Groupname());
                    console.log(username);
                    hub.server.join(viewModel.Groupname(),username ,'client');
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
            alertify.prompt(" نام شما ؟", function (e, username) {
                if (e == false || username == '') {
                    //username = 'کاربر ' + Math.floor((Math.random() * 10000) + 1);
                    alertify.success('جهت اتصال باید نام کلاس را وارد کنید');
                }
                else {
                    _startSession(username);
                }

                // proceed to next step, get media access and start up our connection
               
            }, '');
        },

        _startSession = function (username) {
           
            // Set the selected username in the UI
            viewModel.Username(username);
            viewModel.Loading(true); // Turn on the loading indicator
            $('.instructions').hide();
            var isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
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


            //           // attachMediaStream(videoScreen, _screenStream);

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
            //        video: {
            //            facingMode: "environment",
                       
            //        },
            //        audio: true,
            //    },
            //    function (stream) { // succcess callback gives us a media stream

            //        //var isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
            //        //if (!isMobile) {
            //        //     var audioTrack = stream.getAudioTracks()[0];
            //        //     _screenStream.addTrack(audioTrack);
            //        //}
                   
            //        $('.instructions').hide();
            //        _mediaStream = stream;
            //        _finalStream = stream;
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
            $('.instructions').hide();
            _finalStream = _mediaStream;
            //var videoElement = document.querySelector('.video.mine');
            //attachMediaStream(videoElement, stream);
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
                _IAMDone = "";
                _geustStream = "0";
               
                _hub.server.callForStream(viewModel.MyConnectionId());
              //  alertify.success("درخواست تصویر ارسال شد!! ");

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

            var isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
            if (isMobile) {
                //$(".slave").click(function () {
                //    if (_slaveNumber > 1) {
                       
                //        if ($(this).width() != screen.width || screen.height -  $(this).height() + $(".container-fluid").height() > 100 ) {

                //            $(this).css("width", "100%");
                //            $(this).css("height", "100%");
                //            $(this).css("position", "absolute");
                //            $(this).css("z-index", "9");
                //            $(this).css("overflow", "none");
                //            $(".slave video").css("object-fit", "contain");
                            
                //        }
                //        else {
                //            $(this).css("width", "50%");
                //            $(this).css("height", "50%");
                //            $(this).css("position", "relative");
                //            $(this).css("z-index", "1");
                //            $(this).css("overflow", "hidden");
                //            $(".slave video").css("object-fit", "cover");
                           
                //        }
                //    }
                //})
                //$(".master").click(function () {
                  
                //    if (_slaveNumber == 1) {
                     
                //        if ($(this).width() != screen.width) {

                //            $(this).css("position", "relative");
                //            $(this).css("width", "100%");
                //            $(this).css("z-index", "0");
                         
                //        }
                //        else {
                //            $(this).css("position", "absolute");
                //            $(this).css("width", "101%");
                //            $(this).css("z-index", "9");
                           

                //        }
                //    }
                //    else if (_slaveNumber == 2) {
                //        if ($(this).width() != screen.width || screen.height - $(this).height() + $(".container-fluid").height() > 100) {

                //            $(this).css("width", "100%");
                //            $(this).css("height", "100%");
                //            $(this).css("position", "absolute");
                //            $(this).css("z-index", "9");
                //            $(this).css("overflow", "none");
                //            $(this).css("object-fit", "scale-down");

                //        }
                //        else {
                //            $(this).css("width", "100%");
                //            $(this).css("height", "50%");
                //            $(this).css("position", "relative");
                //            $(this).css("z-index", "1");
                //            $(this).css("overflow", "hidden");
                //            $(this).css("object-fit", "cover");

                //        }
                //    }
                //});
            }

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
                //$(".master").css("height", "100%");
                //$(".slave").css("width", "30%");
                //$(".slave").css("height", "30%");
                //$(".slave").css("position", "absolute");
                _IAMDone = "";
                _geustStream = "0";
              
               
                _hub.server.hangUp("");
                connectionManager.closeAllConnections();
                viewModel.Mode ('idle');
                $(".requst").css("display", "inline-block")
                $(".hangup").css("display", "none")
                $(".joinAddress").css("display", "none")
                $(".master").each(function () {

                    $(this).removeAttr('class');
                    $(this).addClass("master");

                });
                $(".slave").each(function () {
                    $(this).removeAttr('class');
                    $(this).addClass("slave")


                });
             



            });
            $('.requst').click(function () {
                //$(".master").css("height", "100%");
                //$(".slave").css("width", "30%");
                //$(".slave").css("height", "30%");
                //$(".slave").css("position", "absolute");
                _IAMDone = "";
                _geustStream = "0";
                _hub.server.hangUp("");
                connectionManager.closeAllConnections(viewModel.guestConnectionId());
                _hub.server.callForStream(viewModel.MyConnectionId());
                alertify.success("درخواست شما ارسال شد");
                $(".slave").css("width", "100%")
                $(".slave").css("height", "100%")
              
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
                if (_streamType == 'video') {
                    console.log("adding media stream");
                    _mediaStream.getTracks().forEach(function (track) {

                        connection.addTrack(track, st1);
                    });
                }
                else {
                    console.log("adding blank");
                    blackSilence().getTracks().forEach(function (track) {

                        connection.addTrack(track, st1);
                    });
                }

                

                //connection.addStream(_finalStream);
               
                
            },
            onStreamAdded: function (connection, event) {
                console.log('binding remote stream to the partner window');
                
                // Bind the remote stream to the partner window
               
              
                //var otherVideo = document.querySelector('.video.partner');

                //attachMediaStream(otherVideo, event.stream); // from adapter.js

                //$(".video.mine").parent().removeClass();
                //$(".video.mine").parent().addClass('mineholderAfter');
                //$(".video.screen").parent().removeClass();
                //$(".video.screen").parent().addClass('mineholderScreenAfter');
                $(".partnerholder").css("display", "inline-block");
                $(".requst").css("display", "inline-block");
                $(".hangup").css("display", "inline-block");
              
                $(".joinAddress").css("display", "inline-block");
                
                


            },
            onTrackAdded: function (connection, event, partnerClientId) {
               // alertify.success("ontrack   "+_geustStream);
                console.log("adding track on app");
                var partnerClientId1 = partnerClientId + "0";
                var partnerClientId2 = partnerClientId + "1";
                var partnerClientId3 = partnerClientId + "2";

                var isexist = document.getElementById(partnerClientId1);
                if (isexist == null) {
                    const div = document.createElement('div');
                    div.className = 'slave';
                    div.style.display = 'none';
                    div.innerHTML = ` <video controls  id='` + partnerClientId1 + `' class='video partner cool-background' autoplay='autoplay'  ></video>  `;
                    var VHolder = document.getElementById('partnerholder');
                    VHolder.appendChild(div);

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
                    var otherVideo = document.getElementById(partnerClientId1);
                    attachMediaStream(otherVideo, st1);
                }
                else {
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
                    var otherVideo = document.getElementById(partnerClientId1);
                    attachMediaStream(otherVideo, st1);
                }

                var isexist2 = document.getElementById(partnerClientId2);
                if (isexist2 == null) {
                    const div2 = document.createElement('div');
                    div2.className = 'slave';
                    div2.style.display = 'none';
                    div2.innerHTML = ` <video controls  id='` + partnerClientId2 + `' class='video partner cool-background' autoplay='autoplay'  ></video>  `;
                    VHolder.appendChild(div2);

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
                    var otherVideo2 = document.getElementById(partnerClientId2);
                    attachMediaStream(otherVideo2, st2);
                }
                else {
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
                    var otherVideo2 = document.getElementById(partnerClientId2);
                    attachMediaStream(otherVideo2, st2);
                }

                var isexist3 = document.getElementById(partnerClientId3);
                if (isexist3 == null) {
                    const div3 = document.createElement('div');
                    div3.className = 'slave';
                    div3.style.display = 'none';
                    div3.innerHTML = ` <video controls  id='` + partnerClientId3 + `' class='video partner cool-background' autoplay='autoplay'  ></video>  `;
                    VHolder.appendChild(div3);

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
                    var otherVideo3 = document.getElementById(partnerClientId3);
                    attachMediaStream(otherVideo3, st3);
                }
                else {
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
                    var otherVideo3 = document.getElementById(partnerClientId3);
                    attachMediaStream(otherVideo3, st3);
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