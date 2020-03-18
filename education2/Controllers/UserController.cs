using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Web;
using System.Web.Mvc;


namespace education.Controllers
{
    
    public class UserController : Controller
    {

        private static Random random = new Random();
        public static string RandomString(int length)
        {
            const string chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
            return new string(Enumerable.Repeat(chars, length)
              .Select(s => s[random.Next(s.Length)]).ToArray());
        }
        public ActionResult Index()
        {
           
            return View();
        }
        public ContentResult sendToServer()
        {
           
            string pathString = "~/Files";
            if (!Directory.Exists(Server.MapPath(pathString)))
            {
                DirectoryInfo di = Directory.CreateDirectory(Server.MapPath(pathString));
            }
            string filename = "";
            for (int i = 0; i < Request.Files.Count; i++)
            {

                HttpPostedFileBase hpf = Request.Files[i];

                if (hpf.ContentLength == 0)
                    continue;
                filename = RandomString(7) ;
                string savedFileName = Path.Combine(Server.MapPath(pathString), filename + ".wav");
                hpf.SaveAs(savedFileName);
            }
            return Content(filename+",مهرداد منصوری");
        }

        public ContentResult CheckToken(string token) {
            Session["groupID"] = token;
            return Content("success");
        }


        public ActionResult test() {

            return View();
        }
        public ActionResult chat()
        {
            return View();
        }
    }
}