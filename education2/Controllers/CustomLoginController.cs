using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace education2.Controllers
{
    public class CustomLoginController : Controller
    {
        // GET: CustomLogin
        public ActionResult Index()
        {
            return View();
        }

        [HttpPost]
       public ActionResult IndexLogin(string Lusername, string Lpassword)
        {
            int number = 1;
            number = number + 1;
            return Content(number.ToString());
        }

    }
}