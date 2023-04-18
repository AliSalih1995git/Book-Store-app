const express = require("express");
const async = require("hbs/lib/async");
const router = express.Router();
const adminHelper = require("../helpers/admin-helpers");
const path = require("path");
const flash = require("connect-flash");
const admin = require("../models/admin");

const verifyadmin = (req, res, next) => {
  if (req.session.admin) {
    next();
  } else {
    res.redirect("/admin");
  }
};

/* GET home page. */
router.get("/", function (req, res, next) {
  res.render("admin/admin-login", {
    err: req.session.adminloggErr,
    admin,
    layout: false,
  });
  req.session.adminloggErr = null;
});

router.post("/adminLogin", (req, res) => {
  adminHelper
    .doadminlogin(req.body)
    .then((response) => {
      req.session.adminlogin = true;
      req.session.admin = response.admin;
      res.redirect("/admin/adminDashboard");
    })
    .catch((err) => {
      req.session.adminloggErr = err.msg;
      res.redirect("/admin");
    });
});

router.get("/adminDashboard", verifyadmin, async (req, res, next) => {
  const adminvalue = req.session.admin;
  [OrderCount, ProductCount] = await Promise.all([
    adminHelper.getOrderCount(),
    adminHelper.getProductCount(),
  ]);
  console.log("bbb", OrderCount);
  res.render("admin/admin-dashboard", {
    OrderCount,
    ProductCount,
    admin: true,
    adminvalue,
    layout: false,
  });
});

router.get("/manage-user", function (req, res) {
  adminHelper.getAllUsers().then((userinfo) => {
    res.render("admin/manage-user", { admin: true, layout: false, userinfo });
  });
});
router.get("/blockUser/:id", (req, res) => {
  const userId = req.params.id;
  adminHelper.blockUser(userId).then((response) => {
    res.redirect("/admin/manage-user");
  });
});
router.get("/unblockUser/:id", (req, res) => {
  try {
    const userId = req.params.id;
    adminHelper.unblockUser(userId).then((response) => {
      res.redirect("/admin/manage-user");
    });
  } catch (error) {
    console.error(error);
  }
});

router.get("/productDetails", async (req, res) => {
  const products = await adminHelper.getallproducts();
  const alert = req.flash("msg");
  res.render("admin/products-manege", { alert, products, layout: false });
});

router.get("/addcategory", (req, res) => {
  adminHelper.getallcategory().then((allcategory) => {
    console.log(allcategory);
    res.render("admin/add_category", {
      allcategory,
      layout: false,
      err1: req.session.loge,
      err2: req.session.loggE,
    });
    req.session.loge = null;
    req.session.loggE = null;
  });
});

router.post("/addcategory", adminHelper.upload.single("image"), (req, res) => {
  console.log(req.file);
  adminHelper
    .addcategory(req.body, req.file)
    .then((Response) => {
      res.redirect("/admin/addcategory");
    })
    .catch((error) => {
      req.session.loggE = error.msg;
      res.redirect("/admin/addcategory");
    });
});

router.post("/addsubcategory", (req, res) => {
  adminHelper
    .addsubcategory(req.body)
    .then((Response) => {
      res.redirect("/admin/addcategory");
    })
    .catch((err) => {
      req.session.loge = err.msg;
      res.redirect("/admin/addcategory");
    });
});
router.get("/add_product", async (req, res) => {
  const category = await adminHelper.getallcategory();
  const subcategory = await adminHelper.getallsubcategory();
  res.render("admin/add_products", {
    category,
    subcategory,
    admin: true,
    layout: false,
  });
});

router.post("/addProduct", adminHelper.upload.single("image"), (req, res) => {
  adminHelper
    .addProduct(req.body, req.file)
    .then((Response) => {
      res.redirect("/admin/productDetails");
    })
    .catch((error) => {});
});
router.get("/deleteProduct/:id", (req, res) => {
  const proId = req.params.id;
  adminHelper.deleteProduct(proId).then((response) => {
    req.session.removedProduct = response;
    res.redirect("/admin/productDetails");
  });
});
router.get("/editProduct/:id", async (req, res) => {
  let product = await adminHelper.getProductDetails(req.params.id);
  const category = await adminHelper.getallcategory();
  const subcategory = await adminHelper.getallsubcategory();
  res.render("admin/editProduct", {
    subcategory,
    category,
    product,
    admin: true,
    layout: false,
  });
});
router.post(
  "/editProduct/:id",
  adminHelper.upload.single("image"),
  async (req, res) => {
    let imageData = await adminHelper.getProductDetails();
    let main_img = req.file ? req.file.filename : imageData[0];
    console.log(main_img);
    await adminHelper
      .updateProduct(req.params.id, req.body, main_img)
      .then((response) => {
        req.flash("msg", response.updateProduct.bookName, response.msg);
        res.redirect("/admin/productDetails");
      });
  }
);
router.get("/order-manegement", (req, res) => {
  adminHelper.allorders().then((response) => {
    const allorders = response;
    res.render("admin/order_manage", { allorders, admin: true, layout: false });
  });
});
router.get("/viewOrderProducts/:id", (req, res) => {
  adminHelper.orderdetails(req.params.id).then((response) => {
    const order = response;
    res.render("admin/OrderDetails", { admin: true, order, layout: false });
  });
});
router.post("/changeOrderStatus", (req, res) => {
  adminHelper.changeOrderStatus(req.body).then((response) => {
    res.redirect("/admin/order-manegement");
  });
});
router.get("/coupon-manegement", (req, res) => {
  adminHelper.getAllCoupons().then((response) => {
    const AllCoupons = response;
    res.render("admin/coupen_manage", { AllCoupons, layout: false });
  });
});

router.get("/deletecoupon/:id", (req, res) => {
  const proId = req.params.id;
  adminHelper.Deletecoupon(proId).then((response) => {
    req.session.removedProduct = response;
    res.redirect("/admin/coupon-manegement");
  });
  console.log(proId);
});

router.get("/addcoupon", (req, res) => {
  res.render("admin/addcoupon", { layout: false });
});
router.post("/AddCoupon", (req, res) => {
  adminHelper.AddCoupon(req.body).then(() => {
    res.redirect("/admin/coupon-manegement");
  });
});
router.post("/getData", async (req, res) => {
  console.log("getdata");
  console.log(req.body);

  try {
    const date = new Date(Date.now());
    const month = date.toLocaleString("default", { month: "long" });
    adminHelper.salesReport(req.body).then((data) => {
      let pendingAmount = data.pendingAmount;
      let salesReport = data.salesReport;
      let brandReport = data.brandReport;
      let orderCount = data.orderCount;
      let totalAmountPaid = data.totalAmountPaid;
      let dateArray = [];
      let totalArray = [];
      salesReport.forEach((s) => {
        dateArray.push(`${month}-${s._id} `);
        totalArray.push(s.total);
      });
      let categoryArray = [];
      let sumArray = [];
      brandReport.forEach((s) => {
        categoryArray.push(s._id);
        sumArray.push(s.totalAmount);
      });
      console.log("", categoryArray);
      console.log("", totalArray);
      res.json({
        dateArray,
        totalArray,
        categoryArray,
        sumArray,
        orderCount,
        totalAmountPaid,
        pendingAmount,
      });
    });
  } catch (error) {
    console.error(error);
  }
});

router.get("/Carousel-manegement", (req, res) => {
  adminHelper.allCarousel().then((response) => {
    const Carousel = response;
    res.render("admin/Carousel-manegement", { layout: false, Carousel });
  });
});
router.get("/addCarousel", (req, res) => {
  res.render("admin/add_carousel", { layout: false });
});
router.post("/AddCarousel", adminHelper.upload.single("image"), (req, res) => {
  adminHelper.addCarousel(req.body, req.file).then((Response) => {
    res.redirect("/admin/Carousel-manegement");
  });
});
router.delete("/deleteCarousel/:id", (req, res) => {
  adminHelper.deleteCarousel(req.params.id).then(() => {
    res.json({ deleteCarousel: true });
  });
});

router.get("/adminlogout", (req, res) => {
  req.session.destroy();
  res.redirect("/admin");
});
module.exports = router;
