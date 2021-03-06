﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Web;
using Microsoft.AspNet.SignalR;
using education2.Models;
using System.Net;
using System.IO;

namespace education2
{
    public class ChatHub : Hub
    {
       
        public void Send(string name, string message, string type,string groupname)
        {
            if (type == "send")
            {
                // Call the addNewMessageToPage method to update clients.
                Clients.Group(groupname).addNewMessageToPage(name, message);
            }
            else if (type == "JG")
            {
                this.Groups.Add(this.Context.ConnectionId, groupname);
            }
           
        }



        private static readonly List<User> Users = new List<User>();
        private static readonly List<Relay> Relayes = new List<Relay>();
        private static readonly List<UserCall> UserCalls = new List<UserCall>();
        private static readonly List<CallOffer> CallOffers = new List<CallOffer>();
        
        public void Hang(string username)
        {
           
        }
        public void Join(string groupname , string username,string type)
        {
            if (username != "relay")
            {
                User UserCheck = Users.SingleOrDefault(x => x.GroupName == groupname && x.Username == "relay" && x.GuestIDes == "0");
                if (UserCheck == null)
                {
                    SendRelay(groupname);
                }
            }
           

            User user = Users.SingleOrDefault(x => x.Username == username && x.GroupName == groupname);
           
            if (user != null)
            {
                Groups.Remove(user.ConnectionId, groupname);
                Groups.Add(Context.ConnectionId, groupname);
                user.ConnectionId = Context.ConnectionId;

            }
            else
            {
                

                // Add the new user
                Users.Add(new User
                {
                    Username = username,
                    ConnectionId = Context.ConnectionId,
                    GroupName = groupname,
                    GuestIDes = "0",
                    Type = type
                });
                Groups.Add(Context.ConnectionId, groupname);
                // Send down the new list to all clients
                SendUserListUpdate(groupname);
            }

            
        }

        public override System.Threading.Tasks.Task OnDisconnected(bool boolian)
        {
            // Hang up any calls the user is in
            HangUp(""); // Gets the user from "Context" which is available in the whole hub

            string groupname = Users.SingleOrDefault(x => x.ConnectionId == Context.ConnectionId).GroupName;
            // Remove the user
            Users.RemoveAll(u => u.ConnectionId == Context.ConnectionId);
            string Groupname = Users.FirstOrDefault(u => u.ConnectionId == Context.ConnectionId).GroupName;
            Groups.Remove(Context.ConnectionId, groupname);

            


            // Send down the new user list to all clients
            SendUserListUpdate(Groupname);

            return base.OnDisconnected(boolian);
        }
        public void CheckUserExist()
        {
            
            if (Users.SingleOrDefault(x => x.Username != "relay") == null)
            {

                foreach (var item in Relayes)
                {
                    KillRelay(item.session);
                }
            }
            else
            {
                int i = 0;
            }
            
        }
        public void DeleteRelayFromList()
        {
            Users.RemoveAll(u => u.Username == "relay");
            string Groupname = Users.FirstOrDefault(u => u.ConnectionId == Context.ConnectionId).GroupName;
            SendUserListUpdate(Groupname);
        }

        public void CallUser(string targetConnectionId,bool type)
        {
            
            string groupname = Users.SingleOrDefault(c => c.ConnectionId == Context.ConnectionId).GroupName;
            var callingUser = Users.SingleOrDefault(u => u.ConnectionId == Context.ConnectionId);
         

             var targetUser = Users.SingleOrDefault(u => u.ConnectionId == targetConnectionId);

            // Make sure the person we are trying to call is still here
            if (targetUser == null)
            {
                // If not, let the caller know
                Clients.Caller.callDeclined(targetConnectionId, "مخاطب در دسترس نیست");
                SendUserListUpdate(groupname);
                return;
            }

            //// And that they aren't already in a call
            //if (GetUserCall(targetUser.ConnectionId) != null)
            //{
            //    Clients.Caller.callDeclined(targetConnectionId, string.Format("{0} is already in a call.", targetUser.Username));
            //    return;
            //}

            // They are here, so tell them someone wants to talk
            Clients.Client(targetConnectionId).incomingCall(callingUser, type);
            
            // Create an offer
            CallOffers.Add(new CallOffer
            {
                Caller = callingUser,
                Callee = targetUser
            });
        }
        public void SendRelay(string groupname)
        {
            string html = string.Empty;
            //string url = @"http://localhost:8081/openChrome?groupname=" + groupname ;
             string url = @"http://95.217.162.188:8081/openChrome?groupname=" + groupname;

            HttpWebRequest request = (HttpWebRequest)WebRequest.Create(url);
            request.AutomaticDecompression = DecompressionMethods.GZip;

            using (HttpWebResponse response = (HttpWebResponse)request.GetResponse())
            using (Stream stream = response.GetResponseStream())
            using (StreamReader reader = new StreamReader(stream))
            {
                html = reader.ReadToEnd();
            }
            var callingUser = Users.SingleOrDefault(u => u.ConnectionId == Context.ConnectionId);
           // User UserCheck = Users.SingleOrDefault(x => x.GroupName == callingUser.GroupName && x.Username == "relay" && x.GuestIDes.Contains("zero"));
            Relayes.Add(new Relay
            {
                connectionID = "",
                session = html.Replace("portis", "")
            });
            Clients.Client(Context.ConnectionId).relayCallBack(html.Replace("portis", ""));
           
        }
        public void KillRelay(string id)
        {
            string html = string.Empty;
            string url = @"http://95.217.162.188:8082/closeChrome?id=" + id;
          //  string url = @"http://localhost:8083/closeChrome?id=" + id;

            HttpWebRequest request = (HttpWebRequest)WebRequest.Create(url);
            request.AutomaticDecompression = DecompressionMethods.GZip;

            using (HttpWebResponse response = (HttpWebResponse)request.GetResponse())
            using (Stream stream = response.GetResponseStream())
            using (StreamReader reader = new StreamReader(stream))
            {
                html = reader.ReadToEnd();
            }
            var callingUser = Users.SingleOrDefault(u => u.ConnectionId == Context.ConnectionId);
            Clients.Client(Context.ConnectionId).relayCallBack(html.Replace("portis", ""));
        }
        public void RefreshUser() {
            string groupname = Users.SingleOrDefault(x => x.ConnectionId == Context.ConnectionId).GroupName;
            SendUserListUpdate(groupname);
        }

        public void HideVideoOnClient(string groupname ,string index)
        {
            Clients.Group(groupname).HideYourVideo(index);
        }
        public void ShowVideoOnClient(string groupname, string index)
        {
            Clients.Group(groupname).ShowYourVideo(index);
        }
        public void AnswerCall(bool acceptCall, string targetConnectionId,bool type)
        {
            var callingUser = Users.SingleOrDefault(u => u.ConnectionId == Context.ConnectionId);
            var targetUser = Users.SingleOrDefault(u => u.ConnectionId == targetConnectionId);

            // This can only happen if the server-side came down and clients were cleared, while the user
            // still held their browser session.
            if (callingUser == null)
            {
                return;
            }

            // Make sure the original caller has not left the page yet
            if (targetUser == null)
            {
                Clients.Caller.callEnded(targetConnectionId, "The other user in your call has left.");
                return;
            }

            // Send a decline message if the callee said no
            if (acceptCall == false)
            {
                Clients.Client(targetConnectionId).callDeclined(callingUser, string.Format("{0} did not accept your call.", callingUser.Username));
                return;
            }

            // Remove all the other offers for the call initiator, in case they have multiple calls out
            CallOffers.RemoveAll(c => c.Caller.ConnectionId == targetUser.ConnectionId);

            // Create a new call to match these folks up
            UserCalls.Add(new UserCall
            {
                
               Users = new List<User> { callingUser, targetUser },
            });


            // Tell the original caller that the call was accepted
            //.Client(Context.ConnectionId).alertID(isChnager);
            
           
            Clients.Client(targetConnectionId).callAccepted(callingUser, type,callingUser.ConnectionId);

            // Update the user list, since thes two are now in a call
           // SendUserListUpdate("");
        }



        public void ChangeRelayStat( string stat)
        {
            User user = Users.SingleOrDefault(x => x.ConnectionId == Context.ConnectionId);
            user.GuestIDes = stat;
            if (stat == "1")
            {
                SendRelay(user.GroupName);
            }

        }
        public void CallForStream(string GeustConnectionID)
        {
            

            User user = Users.SingleOrDefault(c => c.ConnectionId == Context.ConnectionId);

            User UserList = Users.SingleOrDefault(x => x.GroupName == user.GroupName && x.Username == "relay" && x.GuestIDes == "0");



            if (UserList != null)
            {
                Clients.Client(UserList.ConnectionId).callEveryOne(user.ConnectionId, true);
            }
            else
            {
                Clients.Client(Context.ConnectionId).noRelay();
                //create relay and call client
                // callForStream(GeustConnectionID);
            }
            //User Admin = Users.SingleOrDefault(x => x.GroupName == user.GroupName && x.Type == "admin");
            //Clients.Client(Admin.ConnectionId).callEveryOne(user.ConnectionId);
        }
        public void CallOtherClientToUpdate(string partnerClientId)
        {
            User user = Users.SingleOrDefault(c => c.ConnectionId == Context.ConnectionId);
            if (user != null)
            {
                User relay = Users.SingleOrDefault(x => x.ConnectionId == partnerClientId);
                List<User> userList = Users.Where(x => x.GroupName == user.GroupName && x.Username != "relay").ToList();
                foreach (var client in userList)
                {
                    Clients.Client(relay.ConnectionId).doWhatYoutThinkIsRight(client.ConnectionId);

                    //if (relay.GuestIDes.Contains(client.ConnectionId))
                    //{
                    //    //inform user to change ints client video
                    //    Clients.Client(client.ConnectionId).changeYourClientVideo(relay.GuestIDes,relay.ConnectionId);
                    //    //go to relay and change video 
                    //    Clients.Client(relay.ConnectionId).changeYourStreamFor(client.ConnectionId);
                    //}
                    //else
                    //{
                    //}
                }


            }
        }
        public void CallUserTochangeVideo(string connectionID,string GuestIDes, string relayID)
        {
             Clients.Client(connectionID).changeYourClientVideo(GuestIDes, relayID);

        }
        public void resPonseToCallEveryOne(string requestee, bool type)
        {
            
             Clients.Client(requestee).areYouStillThere(Context.ConnectionId, type);
            //StreamRequest(requestee, type);
        }
        public void StreamRequest(string connectionID,bool type)
        {
            User user = Users.SingleOrDefault(c => c.ConnectionId == Context.ConnectionId);
            if (user != null)
            {
                User resposerUser = Users.SingleOrDefault(x => x.ConnectionId == connectionID);
                Clients.Client(connectionID).GetStreamRequest(user.ConnectionId, string.Format("{0} درخواست استریم دارد.", resposerUser.Username), type);


            }
        }
        public void SendMessage(string message)
        {
            string groupname = Users.SingleOrDefault(x => x.ConnectionId == Context.ConnectionId).GroupName;
            string name = Users.SingleOrDefault(x => x.ConnectionId == Context.ConnectionId).Username;
            Clients.Group(groupname).setMessage(message, Context.ConnectionId,name);
        }
        public void HangUp(string partnerClientId)
        {
           // string groupname = Users.SingleOrDefault(u => u.ConnectionId == Context.ConnectionId).GroupName;

            if (partnerClientId == "")
            {

                var callingUser = Users.SingleOrDefault(u => u.ConnectionId == Context.ConnectionId);

                if (callingUser == null)
                {
                    return;
                }

                var currentCall = GetUserCallList(callingUser.ConnectionId);

              
                // Send a hang up message to each user in the call, if there is one
                if (currentCall != null)
                {
                    foreach (var call in currentCall)
                    {

                        foreach (var user in call.Users.Where(u => u.ConnectionId != callingUser.ConnectionId))
                        {
                               user.GuestIDes = user.GuestIDes.Replace(callingUser.ConnectionId, "zero");
                               Clients.Client(user.ConnectionId).callEnded(callingUser.ConnectionId, string.Format("{0} تماس را قطع کرد.", callingUser.Username));
                            
                        }
                    }
                   

                    // Remove the call from the list if there is only one (or none) person left.  This should
                    // always trigger now, but will be useful when we implement conferencing.
                    foreach (var call in currentCall)
                    {
                        call.Users.RemoveAll(u => u.ConnectionId == callingUser.ConnectionId);
                        if (call.Users.Count < 2)
                        {
                            UserCalls.Remove(call);
                        }
                    }
                   
                }
                Clients.Client(Context.ConnectionId).SetDefaultStream("0");

                // Remove all offers initiating from the caller
                CallOffers.RemoveAll(c => c.Caller.ConnectionId == callingUser.ConnectionId);

                //SendUserListUpdate(groupname);
            }
            else
            {
                var callingUser = Users.SingleOrDefault(u => u.ConnectionId == Context.ConnectionId);

                if (callingUser == null)
                {
                    return;
                }

                var currentCall = GetUserCall(partnerClientId);

                // Send a hang up message to each user in the call, if there is one
                if (currentCall != null)
                {
                    Clients.Client(partnerClientId).callEnded(callingUser.ConnectionId, string.Format("{0} تماس را قطع کرد.", callingUser.Username));


                    UserCalls.Remove(currentCall);
                }

                // Remove all offers initiating from the caller
                CallOffers.RemoveAll(c => c.Caller.ConnectionId == callingUser.ConnectionId);

                //SendUserListUpdate(groupname);
            }
            
        }
        public void HangUpEcexpt(string partnerClientId)
        {
            string groupname = Users.SingleOrDefault(u => u.ConnectionId == Context.ConnectionId).GroupName;

            var callingUser = Users.SingleOrDefault(u => u.ConnectionId == Context.ConnectionId);

            if (callingUser == null)
            {
                return;
            }

            var currentCall = GetUserCallList(callingUser.ConnectionId);
      
            currentCall.RemoveAll(uc => uc.Users.SingleOrDefault(u => u.ConnectionId == partnerClientId) != null);
         

            // Send a hang up message to each user in the call, if there is one
            if (currentCall != null)
            {
                foreach (var call in currentCall)
                {

                    foreach (var user in call.Users.Where(u => u.ConnectionId != callingUser.ConnectionId ))
                    {
                        Clients.Client(user.ConnectionId).callEnded(callingUser.ConnectionId, string.Format("{0} تماس را قطع کرد.", callingUser.Username));
                    }
                }


                // Remove the call from the list if there is only one (or none) person left.  This should
                // always trigger now, but will be useful when we implement conferencing.
                foreach (var call in currentCall)
                {
                    call.Users.RemoveAll(u => u.ConnectionId == callingUser.ConnectionId);
                    if (call.Users.Count < 2)
                    {
                        UserCalls.Remove(call);
                    }
                }

            }

            // Remove all offers initiating from the caller
            CallOffers.RemoveAll(c => c.Caller.ConnectionId == callingUser.ConnectionId);

            //SendUserListUpdate(groupname);
        }
        public void resetAllConnction(string id) {

            Clients.Client(Context.ConnectionId).SetDefaultStream(id);
            string groupname = Users.SingleOrDefault(x => x.ConnectionId == Context.ConnectionId).GroupName;
           
            List<string> List = Users.Where(u => u.ConnectionId != Context.ConnectionId && u.ConnectionId != id && u.GroupName == groupname).Select(x=>x.ConnectionId).ToList();
           
            foreach (var item in List)
            {
               
                CallUser(item, false);
            }

            
        }
        
        // WebRTC Signal Handler
        public void SendSignal(string signal, string targetConnectionId)
        {
            var callingUser = Users.SingleOrDefault(u => u.ConnectionId == Context.ConnectionId);
            var targetUser = Users.SingleOrDefault(u => u.ConnectionId == targetConnectionId);

            // Make sure both users are valid
            if (callingUser == null || targetUser == null)
            {
                return;
            }

            Clients.Client(targetConnectionId).receiveSignal(callingUser, signal);
            //// Make sure that the person sending the signal is in a call
            //var userCall = GetUserCall(callingUser.ConnectionId);

            //// ...and that the target is the one they are in a call with
            //if (userCall != null && userCall.Users.Exists(u => u.ConnectionId == targetUser.ConnectionId))
            //{
            //    // These folks are in a call together, let's let em talk WebRTC
               
            //}
        }
        public void SendSignalForStream(string signal, string targetConnectionId)
        {
            var callingUser = Users.SingleOrDefault(u => u.ConnectionId == Context.ConnectionId);
            Clients.Client(targetConnectionId).changeStream(signal, callingUser);

        }

        #region Private Helpers

        private void SendUserListUpdate(string groupname)
        {
           List<User> SelectedUsers =   Users.Where(u => u.GroupName == groupname).ToList();
            Clients.Group(groupname).updateUserList(SelectedUsers);
        }

        private UserCall GetUserCall(string connectionId)
        {
            
            var matchingCall =
                UserCalls.SingleOrDefault(uc => uc.Users.SingleOrDefault(u => u.ConnectionId == connectionId ) != null);
            return matchingCall;
        }
        private List<UserCall> GetUserCallList (string connectionId)
        {
            var matchingCall =
                  UserCalls.Where(uc => uc.Users.SingleOrDefault(u => u.ConnectionId == connectionId) != null).ToList();
            return matchingCall;

        }

        #endregion


    }
}