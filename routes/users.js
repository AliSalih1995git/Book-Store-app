const express = require("express");
const router = express.Router();
const userHelpers = require("../helpers/user-helpers");
const adminHelpers = require("../helpers/admin-helpers");
const user = require("../models/user");
const products = require("../models/products");

var filterResult;
var filterResultHome;
var allProducts;

//LOGIIN MIDDLEWARE
const verifyLogin = (req, res, next) => {
  if (req.session.loggedIn) {
    next();
  } else {
    res.redirect("/login");
  }
};

//HOME PAGE
router.get("/", async function (req, res, next) {
  let user = req.session.user;
  let cartcount = null;
  let wishlistCount = null;
  if (req.session.user) {
    cartcount = await userHelpers.getcartcount(req.session.user._id);
    wishlistCount = await userHelpers.getWishlistcount(req.session.user._id);
  }
  CarouselData = await userHelpers.getCarousel();
  allProducts = await adminHelpers.getallproducts();
  let product = await adminHelpers.ProductDetails();
  let categories = await adminHelpers.getallSubcategory();
  let getThreeCategory = await adminHelpers.getThreeCategory();
  res.render("user/index", {
    admin: false,
    user,
    CarouselData,
    allProducts,
    product,
    cartcount,
    filterResultHome,
    wishlistCount,
    categories,
    getThreeCategory,
  });
});
router.get("/getHomeFilters/:id", (req, res) => {
  let prid = req.params.id;

  userHelpers.getHomeFilter(prid).then((result) => {
    filterResultHome = result;
    res.json({ status: true });
  });
});

router.get("/getAllFilterProduct", (req, res) => {
  userHelpers.getallproducts().then((response) => {
    filterResultHome = response;
    res.json({ status: true });
  });
});

router.get("/loadMore", (req, res) => {
  adminHelpers.moreProduct().then((response) => {
    res.redirect("/filterpage");
  });
});

router.get("/login", (req, res) => {
  if (req.session.loggedIn) {
    res.redirect("/");
  } else {
    res.render("user/login", { loginErr: req.session.userLoginErr });
    req.session.userLoginErr = false;
  }
});
router.get("/signup", function (req, res) {
  res.render("user/signup", { err: req.session.loggErr2 });
  req.session.loggErr2 = null;
});
router.get("/otp", function (req, res) {
  res.render("user/otp_signup");
});

router.post("/signup", (req, res) => {
  userHelpers
    .doSignup(req.body)
    .then((response) => {
      req.session.otp = response.otp;
      req.session.userdetails = response;
      res.redirect("/otp");
    })
    .catch((err) => {
      req.session.loggErr2 = err.msg;
      res.redirect("/signup");
    });
});
router.post("/login", (req, res) => {
  userHelpers
    .doLogin(req.body)
    .then((response) => {
      if (response.user.block) {
        req.session.userLoginErr = "Admin blocked You";
        res.redirect("/login");
      } else {
        if (response.user) {
          req.session.user = response.user;
          req.session.loggedIn = true;
          res.redirect("/");
        }
      }
    })
    .catch((err) => {
      req.session.userLoginErr = "Invalid Username or Password";
      res.redirect("/login");
    });
});

router.post("/otpverify", async (req, res) => {
  if (req.session.otp == req.body.otpsignup) {
    let userData = req.session.userdetails;
    const adduser = await new user({
      name: userData.name,
      phoneNumber: userData.phoneNumber,
      email: userData.email,
      password: userData.password,
      resetpassword: userData.repw,
    });
    await adduser.save();
    res.redirect("/");
  } else {
    res.redirect("/otp");
  }
});

router.get("/forgotpassword", function (req, res, next) {
  res.render("user/forgotPassword", { msg: req.session.message });
});

router.post("/forget", async (req, res) => {
  userHelpers
    .doresetPasswordOtp(req.body)
    .then((response) => {
      req.session.otp = response.otp;
      req.session.message = "Vreification link has been sent to Your Email";
      req.session.userdetails = response;
      req.session.userRID = response._id;
      res.redirect("/forgotpassword");
    })
    .catch((err) => {
      req.session.loggErr2 = err.msg;
      res.redirect("/login");
    });
});
router.get("/resetPassword", function (req, res) {
  res.render("user/resetPassword", { otpErr: req.session.otpError });
});

router.post("/resetpass", async (req, res) => {
  if (req.body.password == req.body.confirmPassword) {
    userHelpers.doresetPass(req.body, req.session.userRID).then((response) => {
      res.redirect("/login");
    });
  } else {
    console.log("password mismatch");
  }
});
//viwe Product
router.get("/viewDetails/:id", async (req, res) => {
  const singleproduct = await adminHelpers.getproductdetalis(req.params.id);
  const user = req.session.user;
  if (user) {
    const wishlist = await userHelpers.checkWishList(req.params.id, user);
    res.render("user/Product_detail", {
      singleproduct,
      wishlist,
      layout: false,
    });
  } else {
    res.render("user/Product_detail", { singleproduct, layout: false });
  }
});
//cart
router.get("/add-tocart/:id", verifyLogin, (req, res) => {
  userHelpers.addToCart(req.params.id, req.session.user).then((response) => {
    res.json({ status: true });
  });
});
router.get("/cart", verifyLogin, async (req, res) => {
  const user = req.session.user;
  let cartcount = await userHelpers.getcartcount(req.session.user._id);
  if (cartcount > 0) {
    const [subtotal, totalamount] = await Promise.all([
      userHelpers.subtotal(req.session.user._id),
      userHelpers.totalamount(req.session.user._id),
    ]);
    const netTotal = totalamount.grandTotal.total;
    const DeliveryCharges = await userHelpers.DeliveryCharge(netTotal);
    const grandTotal = await userHelpers.grandTotal(netTotal, DeliveryCharges);
    const cartItems = await userHelpers.getcartItems(req.session.user._id);
    res.render("user/cart", {
      user,
      cartItems,
      netTotal,
      cartcount,
      subtotal,
      DeliveryCharges,
      grandTotal,
      layout: false,
    });
  } else {
    let cartItem = await userHelpers.getcartItems(req.session.user._id);
    let cartItems = cartItem ? products : [];
    netTotal = 0;
    cartcount = 0;
    DeliveryCharges = 0;
    grandTotal = 0;
    res.render("user/cart", {
      layout: false,
      cartItem,
      netTotal,
      cartcount,
      DeliveryCharges,
      grandTotal,
    });
  }
});

router.post("/change-product-quantity", (req, res) => {
  userHelpers.changeproductquantity(req.body, req.session.user).then(() => {
    res.json({ status: true });
  });
});
router.post("/remove-Product-forcart", (req, res, next) => {
  userHelpers.removeFromcart(req.body, req.session.user).then(() => {
    res.json({ status: true });
  });
});

router.get("/add-Towishlist/:id", verifyLogin, (req, res, next) => {
  userHelpers
    .addTowishlist(req.params.id, req.session.user._id)
    .then((response) => {
      res.json({ status: true });
    });
});
router.get("/wishlist", verifyLogin, async (req, res) => {
  let wishlist = await userHelpers.getwishlist(req.session.user);
  if (wishlist) {
    res.render("user/wishlist", { wishlist, layout: false });
  }
});
router.post("/deletewishlist", async (req, res) => {
  userHelpers
    .deletewishlist(req.body, req.session.user._id)
    .then((response) => {
      res.json({ status: true });
    });
});
router.get("/checkout", verifyLogin, async (req, res) => {
  const [Addresses, cartItem, totalamount, AllCoupons] = await Promise.all([
    userHelpers.getAddresses(req.session.user),
    userHelpers.getcartItems(req.session.user._id),
    userHelpers.totalamount(req.session.user._id),
    adminHelpers.getAllCoupons(),
  ]);
  cartcount = await userHelpers.getcartcount(req.session.user._id);
  wishlistCount = await userHelpers.getWishlistcount(req.session.user._id);
  const netTotal = totalamount.grandTotal.total;
  const DeliveryCharges = await userHelpers.DeliveryCharge(netTotal);
  const grandTotal = await userHelpers.grandTotal(netTotal, DeliveryCharges);

  res.render("user/checkout", {
    layout: false,
    cartcount,
    wishlistCount,
    netTotal,
    Addresses,
    DeliveryCharges,
    grandTotal,
    user: req.session.user,
    AllCoupons,
  });
});
router.post("/checkout", async (req, res) => {
  const [cartItem, totalamount] = await Promise.all([
    userHelpers.getcartItems(req.session.user._id),
    userHelpers.totalamount(req.session.user._id),
  ]);
  const netTotal = totalamount.grandTotal.total;
  const DeliveryCharges = await userHelpers.DeliveryCharge(netTotal);
  const grandTotal = await userHelpers.grandTotal(netTotal, DeliveryCharges);
  userHelpers
    .placeOrder(
      req.body,
      cartItem,
      grandTotal,
      DeliveryCharges,
      netTotal,
      req.session.user
    )
    .then((response) => {
      req.session.orderId = response._id;
      if (req.body["paymentMethod"] == "cod") {
        res.json({ codSuccess: true });
      } else {
        userHelpers
          .generateRazorpay(response._id, req.body.mainTotal)
          .then((response) => {
            res.json(response);
          });
      }
    });
});

router.post("/couponApply", async (req, res) => {
  let todayDate = new Date().toISOString().slice(0, 10);
  let userId = req.session.user._id;
  userHelpers.validateCoupon(req.body, userId).then((response) => {
    req.session.couponTotal = response.total;

    if (response.success) {
      res.json({
        couponSuccess: true,
        total: response.total,
        discountpers: response.discoAmountpercentage,
      });
    } else if (response.couponUsed) {
      res.json({ couponUsed: true });
    } else if (response.couponExpired) {
      res.json({ couponExpired: true });
    } else if (response.couponMaxLimit) {
      res.json({ couponMaxLimit: true });
    } else {
      res.json({ invalidCoupon: true });
    }
  });
});

router.post("/verify-Payment", (req, res) => {
  userHelpers
    .verifyPayment(req.body)
    .then(() => {
      userHelpers
        .changePayementStatus(req.body["order[receipt]"])
        .then((response) => {
          res.json({ status: true });
        });
    })
    .catch((err) => {
      res.json({ status: false });
    });
});

router.get("/orderSuccess", verifyLogin, async (req, res) => {
  userHelpers.getorderProducts(req.session.orderId).then((response) => {
    const orderProducts = response;

    res.render("user/order-success", { user, layout: false, orderProducts });
  });
});
router.get("/orders", verifyLogin, async (req, res) => {
  let orders = await userHelpers.getallorders(req.session.user._id);

  // Format the date in orders
  orders.forEach((order) => {
    order.ordered_on = order.ordered_on.toLocaleDateString();
  });

  res.render("user/Orders", {
    orders,
    user: req.session.user,
  });
});
router.get("/viewOrderProducts/:id", (req, res) => {
  userHelpers.getorderProducts(req.params.id).then((response) => {
    const order = response;
    if (order.product[0].status == "Cancelled") {
      order.product[0].cancelled = true;
    }
    res.render("user/order_details", {
      order,
      layout: false,
      user: req.session.user,
    });
  });
});
router.post("/cancel-order", (req, res) => {
  userHelpers.cancelorder(req.body).then((response) => {
    res.json({ status: true });
  });
});

//
router.get("/profile", verifyLogin, (req, res) => {
  res.render("user/profile", { user: req.session.user });
});

router.get("/address-page", async (req, res) => {
  const Addresses = await userHelpers.getAddresses(req.session.user);
  let user = req.session.user;
  res.render("user/address", { user, Addresses });
});
router.get("/edit-profile", async (req, res) => {
  let user = req.session.user;
  const Addresses = await userHelpers.getAddresses(req.session.user);
  res.render("user/editprofile", { Addresses, user });
});
router.get("/addAddress", (req, res) => {
  let user = req.session.user;
  res.render("user/addAddress", { user });
});
router.post("/addAddress/:id", (req, res) => {
  userHelpers.addAddress(req.params.id, req.body).then((response) => {
    res.redirect("/address-page");
  });
});
router.get("/editAddress/:id", async (req, res) => {
  let user = req.session.user;
  const Address = await userHelpers.getOneAddres(req.params.id, user);
  res.render("user/editAddress", { layout: false, Address, user });
});
router.get("/deleteAddress/:id", (req, res) => {
  userHelpers
    .deleteAddress(req.params.id, req.session.user)
    .then((response) => {
      res.redirect("/address-page");
    });
});

//search  and Filter

router.post("/searchResult", (req, res) => {
  let key = req.body.key;
  userHelpers.getSearchProducts(key).then((response) => {
    filterResult = response;
    res.redirect("/filterpage");
  });
});

// checking filters

router.post("/search-filter", (req, res) => {
  try {
    let a = req.body;
    let price = parseInt(a.Prize);
    let categoryFilter = a.category;
    let subcategoryFilter = a.subcategory;

    userHelpers
      .searchFilter(categoryFilter, subcategoryFilter, price)
      .then((result) => {
        filterResultHome = result;

        res.json({ status: true });
      });
  } catch (error) {
    console.error(error);
  }
});

router.get("/shope", (req, res) => {
  adminHelpers.getallproducts().then(async (products) => {
    filterResult = products;
    res.redirect("/filterpage");
  });
});

router.get("/filterpage", async (req, res) => {
  const [category, subcategory] = await Promise.all([
    adminHelpers.getallcategory(),
    adminHelpers.getallsubcategory(),
  ]);
  let getThreeCategory = await adminHelpers.getThreeCategory();

  res.render("user/Filter_Page", {
    getThreeCategory,
    filterResult,
    category,
    subcategory,
    user,
  });
});

router.post("/searchResultHome", (req, res) => {
  let key = req.body.key;

  userHelpers.getSearchProducts(key).then((response) => {
    filterResultHome = response;
    res.redirect("/");
  });
});

router.get("/filterByCategories/:id", (req, res) => {
  var Id = req.params.id;

  userHelpers.getByCategories(Id).then((response) => {
    filterResult = response;
    res.redirect("/filterpage");
  });
});

router.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/login");
});

module.exports = router;
