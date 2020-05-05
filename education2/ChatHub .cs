using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Web;
using Microsoft.AspNet.SignalR;
using education2.Models;

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
        private static readonly List<UserCall> UserCalls = new List<UserCall>();
        private static readonly List<CallOffer> CallOffers = new List<CallOffer>();
        public static string isChnager = "";
        public void Hang(string username)
        {
           
        }
        public void Join(string groupname , string username,string type)
        {
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

        public void CallUser(string targetConnectionId,string type)
        {
            isChnager = type;
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
            Clients.Client(targetConnectionId).incomingCall(callingUser);

            // Create an offer
            CallOffers.Add(new CallOffer
            {
                Caller = callingUser,
                Callee = targetUser
            });
        }
        public void RefreshUser() {
            string groupname = Users.SingleOrDefault(x => x.ConnectionId == Context.ConnectionId).GroupName;
            SendUserListUpdate(groupname);
        }
        public void AnswerCall(bool acceptCall, string targetConnectionId)
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

            // Make sure there is still an active offer.  If there isn't, then the other use hung up before the Callee answered.
            //var offerCount = CallOffers.RemoveAll(c => c.Callee.ConnectionId == callingUser.ConnectionId
            //                                      && c.Caller.ConnectionId == targetUser.ConnectionId);
            //if (offerCount < 1)
            //{
            //    Clients.Caller.callEnded(targetConnectionId, string.Format("{0} تماس را زودتر قطع کرده است.", targetUser.Username));
            //    return;
            //}

            // And finally... make sure the user hasn't accepted another call already
            //if (GetUserCall(targetUser.ConnectionId) != null)
            //{
            //    // And that they aren't already in a call
            //    Clients.Caller.callDeclined(targetConnectionId, string.Format("{0} در حال تماس با فرد دیگری می باشد :(", targetUser.Username));
            //    return;
            //}

            // Remove all the other offers for the call initiator, in case they have multiple calls out
            CallOffers.RemoveAll(c => c.Caller.ConnectionId == targetUser.ConnectionId);

            // Create a new call to match these folks up
            UserCalls.Add(new UserCall
            {
                
               Users = new List<User> { callingUser, targetUser },
            });


            // Tell the original caller that the call was accepted
            //.Client(Context.ConnectionId).alertID(isChnager);
            Clients.Client(targetConnectionId).callAccepted(callingUser, isChnager);

            // Update the user list, since thes two are now in a call
           // SendUserListUpdate("");
        }

        public void callEveryOne(string GeustConnectionID)
        {
            User user = Users.SingleOrDefault(c => c.ConnectionId == Context.ConnectionId);
            if (user != null)
            {
                List<User> UserList = Users.Where(x => x.GroupName == user.GroupName && x.ConnectionId != user.ConnectionId && x.ConnectionId != GeustConnectionID ).ToList();
                
                foreach ( User guest in UserList )
                {
                    Clients.Client(guest.ConnectionId).callEveryOne(user.ConnectionId);
                   
                }
                //User Admin = Users.SingleOrDefault(x => x.GroupName == user.GroupName && x.Type == "admin");
                //Clients.Client(Admin.ConnectionId).callEveryOne(user.ConnectionId);

            }
        }
        public void resPonseToCallEveryOne(string requestee)
        {
            
            Clients.Client(requestee).areYouStillThere(Context.ConnectionId);
        }
        public void StreamRequest(string connectionID)
        {
            User user = Users.SingleOrDefault(c => c.ConnectionId == Context.ConnectionId);
            if (user != null)
            {
                User resposerUser = Users.SingleOrDefault(x => x.ConnectionId == connectionID);
                Clients.Client(connectionID).streamRequest(user.ConnectionId, string.Format("{0} درخواست استریم دارد.", resposerUser.Username));


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
               
                CallUser(item, "");
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