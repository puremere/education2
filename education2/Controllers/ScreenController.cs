using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using System.Web;
using System.Web.Mvc;
using education2.Models;
namespace education2.Controllers
{
    public class ScreenController : Controller
    {
        private static Random random = new Random();
        private static readonly List<Relay> Relayes = new List<Relay>();
        public static string RandomString(int length)
        {
            const string chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
            return new string(Enumerable.Repeat(chars, length)
              .Select(s => s[random.Next(s.Length)]).ToArray());
        }
        // GET: Teacher
        public ActionResult Index()
        {

            // در پروسه ورود انجام می شود
            if (Session["teacherToken"] == null)
            {
                Session["teacherToken"] = RandomString(10);
            }
               
            return View();
        }
        public ActionResult TeacherFace(string groupname)
        {


            Session["name"] = groupname;
            return View();
        }
        
        public ActionResult UserFace(string  groupname)
        {
            string GN = RandomString(10);
            if (groupname  != null)
            {
                GN = groupname;
            }
            
           
            Session["name"] = GN;
            return View();
        }
        public void checkForUser() {
            int id = 0;
        }
        public ActionResult relay(string groupname)
        {
            Session["name"] = groupname;
            return View();
        }
       
        //[HttpPost]
        //public async Task<JsonResult> uploadFile()
        //{
        //    bool Status = false;
        //    try
        //    {
        //        foreach (string file in Request.Files)
        //        {
        //            var fileContent = Request.Files[file];
        //            if (fileContent != null && fileContent.ContentLength > 0)
        //            {
        //                var stream = fileContent.InputStream;
        //               // var fileName = GetFileName();
        //                var fileExt = Path.GetExtension(fileContent.FileName);
        //                var path = Path.Combine(Server.MapPath("~/App_Data/StaticResource"), fileName + fileExt);
        //                using (var fileStream = System.IO.File.Create(path))
        //                {
        //                    stream.CopyTo(fileStream);
        //                    Status = true;
        //                }
        //            }
        //        }
        //    }
        //    catch { }
        //    return Json(Status);
        //}

    }
}