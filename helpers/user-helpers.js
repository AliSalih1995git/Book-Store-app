const db = require("../config/connection");
const nodeMailer = require("nodemailer");
const async = require("hbs/lib/async");
const userDataModel = require("../models/user");
const res = require("express/lib/response");
const bcrypt = require("bcrypt");
const products = require("../models/products");
const wishlistModel = require("../models/wishlist");
const cartModel = require("../models/cart");
const ordermodel = require("../models/order");
const couponmodel = require("../models/Coupen");
const Carouselmodel = require("../models/Carousel");
const { Mongoose, default: mongoose } = require("mongoose");
require("dotenv").config();
const Razorpay = require("razorpay");
const { resolve } = require("path");

let instance = new Razorpay({
  key_id: process.env.RAZORPAY_ID,
  key_secret: process.env.RAZORPAY_KEY,
});

module.exports = {
  doSignup: (userData) => {
    return new Promise(async (resolve, reject) => {
      const user = await userDataModel.findOne({ email: userData.email });
      if (user) {
        reject({ status: false, msg: "Email already taken!" });
      } else {
        userData.pw = await bcrypt.hash(userData.pw, 10);
        // userData.repw=await bcrypt.hash(userData.repw,10)
        const otpGenerator = await Math.floor(1000 + Math.random() * 9000);
        console, log(otpGenerator, "OTPPPPPP");
        const newUser = await {
          name: userData.name,
          phoneNumber: userData.phone,
          email: userData.email,
          password: userData.pw,
          // repassword:userData.repw,
          otp: otpGenerator,
        };
        if (newUser) {
          try {
            const mailTransporter = nodeMailer.createTransport({
              host: "smtp.gmail.com",
              service: "gmail",
              port: 465,
              secure: true,
              auth: {
                user: process.env.NODEMAILER_USER,
                pass: process.env.NODEMAILER_PASS,
              },
              tls: {
                rejectUnauthorized: false,
              },
            });

            const mailDetails = {
              from: "as1950tests@gmail.com",
              to: userData.email,
              subject: "Signup verification From Book Cart",
              text: "Hello Dear,Welcome to My BookCart ",
              html:
                "<p>Hai, " +
                userData.name +
                "   " +
                otpGenerator +
                "  is your OTP to login to your account and start Purchase",
            };
            mailTransporter.sendMail(mailDetails, (err, Info) => {
              if (err) {
              } else {
              }
            });
          } catch (error) {}
        }
        resolve(newUser);
      }
    });
  },
  doLogin: (userDataa) => {
    return new Promise(async (resolve, reject) => {
      let loginStatus = false;
      let response = {};
      let userdat = await userDataModel.findOne({ email: userDataa.email });
      if (userdat) {
        bcrypt.compare(userDataa.pw, userdat.password).then((status) => {
          if (status) {
            response.user = userdat;
            response.status = true;
            resolve(response);
          } else {
            resolve({ status: false });
          }
        });
      } else {
        reject({ status: false });
      }
    });
  },
  doresetPasswordOtp: (resetData) => {
    return new Promise(async (resolve, reject) => {
      const user = await userDataModel.findOne({ email: resetData.email });

      if (user) {
        const otpGenerator = await Math.floor(1000 + Math.random() * 9000);
        const newUser = await {
          email: resetData.email,
          otp: otpGenerator,
          _id: user._id,
        };
        try {
          const mailTransporter = nodeMailer.createTransport({
            host: "smtp.gmail.com",
            service: "gmail",
            port: 465,
            secure: true,
            auth: {
              user: "as1950tests@gmail.com",
              pass: "jaejrlywapvevtpm",
            },

            tls: {
              rejectUnauthorized: false,
            },
          });

          const mailDetails = {
            from: "as1950tests@gmail.com",
            to: resetData.email,
            subject: "Book Cart",
            text: "Reset Password Link ",
            html:
              "<p>hi " +
              "User " +
              "your Reset Password link is: " +
              "http://localhost:3001/resetpassword" +
              ".",
          };
          mailTransporter.sendMail(mailDetails, (err, Info) => {
            if (err) {
              console.log(err);
            } else {
              console.log("email has been sent ");
            }
          });
        } catch (error) {
          console.log(error.message);
        }

        resolve(newUser);
      } else {
        reject({ status: false, msg: "Email not registered, please sign up!" });
      }
    });
  },

  doresetPass: (rData, rid) => {
    return new Promise(async (resolve, reject) => {
      rData.password = await bcrypt.hash(rData.password, 10);
      let userId = rid;
      let resetuser = await userDataModel.findByIdAndUpdate(
        { _id: userId },
        { $set: { password: rData.password } }
      );
      resolve(resetuser);
    });
  },
  addToCart: (proId, userId) => {
    return new Promise(async (resolve, reject) => {
      const product = await products.findOne({ _id: proId });
      const usercart = await cartModel.findOne({ user: userId });

      if (usercart) {
        const proExist = usercart.products.findIndex(
          (products) => products.pro_id == proId
        );
        if (proExist != -1) {
          cartModel
            .updateOne(
              { "products.pro_id": proId, user: userId },
              {
                $inc: { "products.$.quantity": 1 },
              }
            )
            .then((response) => {
              resolve();
            });
        } else {
          await cartModel
            .findOneAndUpdate(
              { user: userId },
              {
                $push: {
                  products: {
                    pro_id: proId,
                    price: product.price,
                    bookName: product.bookName,
                  },
                },
              }
            )
            .then(() => {
              resolve({ msg: "Added,count:res.products.length+1" });
            });
        }
      } else {
        const cartObj = new cartModel({
          user: userId,

          products: {
            pro_id: proId,
            price: product.price,
          },
        });
        await cartObj.save(async (err, result) => {
          if (err) {
            resolve({ error: "cart not created" });
          } else {
            resolve({
              msg: "cart is added",
              count: 1,
            });
          }
        });
      }
    });
  },
  getcartItems: (userId) => {
    return new Promise(async (resolve, reject) => {
      const cart = await cartModel
        .findOne({ user: userId })
        .populate("products.pro_id")
        .lean();

      resolve(cart);
    });
  },
  getcartcount: (userid) => {
    return new Promise(async (resolve, reject) => {
      let count = 0;
      const user = await cartModel.findOne({ user: userid });
      if (user) {
        count = user.products.length;
        resolve(count);
      } else {
        resolve(count);
      }
    });
  },
  changeproductquantity: (data, user) => {
    cart = data.cartid;
    proId = data.product;
    quantity = data.quantity;
    count = data.count;
    const procount = parseInt(count);
    return new Promise(async (resolve, response) => {
      if (count == -1 && quantity == 1) {
        await cartModel
          .findOneAndUpdate(
            { user: user._id },
            {
              $pull: { products: { _id: cart } },
            }
          )
          .then((response) => {
            resolve({ removeProduct: true });
          });
      } else {
        await cartModel
          .findOneAndUpdate(
            { user: user._id, "products.pro_id": data.product },
            { $inc: { "products.$.quantity": procount } }
          )
          .then((response) => {
            resolve(true);
          });
      }
    });
  },
  subtotal: (user) => {
    let id = mongoose.Types.ObjectId(user);
    return new Promise(async (resolve, reject) => {
      const amount = await cartModel.aggregate([
        {
          $match: { user: id },
        },
        {
          $unwind: "$products",
        },
        {
          $project: {
            id: "$products.pro_id",
            total: { $multiply: ["$products.price", "$products.quantity"] },
          },
        },
      ]);
      let cartdata = await cartModel.findOne({ user: id });
      if (cartdata) {
        amount.forEach(async (amt) => {
          await cartModel.updateMany(
            { "products.pro_id": amt.id },
            { $set: { "products.$.subtotal": amt.total } }
          );
        });
        resolve();
      }
    });
  },
  removeFromcart: (data, user) => {
    return new Promise(async (resolve, reject) => {
      await cartModel
        .findOneAndUpdate(
          { user: user._id },
          {
            $pull: { products: { _id: data.cart } },
          }
        )
        .then((response) => {
          resolve({ removeProduct: true });
        });
    });
  },
  totalamount: (userData) => {
    const id = mongoose.Types.ObjectId(userData);
    return new Promise(async (resolve, reject) => {
      const total = await cartModel.aggregate([
        {
          $match: { user: id },
        },
        {
          $unwind: "$products",
        },
        {
          $project: {
            quantity: "$products.quantity",
            price: "$products.price",
          },
        },
        {
          $project: {
            productname: 1,
            quantity: 1,
            price: 1,
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: { $multiply: ["$quantity", "$price"] } },
          },
        },
      ]);
      if (total.length == 0) {
        resolve({ status: true });
      } else {
        let grandTotal = total.pop();
        resolve({ grandTotal, status: true });
      }
    });
  },
  DeliveryCharge: (amount) => {
    return new Promise((resolve, reject) => {
      if (amount < 1000) {
        resolve(40);
      } else {
        resolve(0);
      }
    });
  },
  grandTotal: (netTotal, DeliveryCharges) => {
    return new Promise((resolve, reject) => {
      const grandTotal = netTotal + DeliveryCharges;
      resolve(grandTotal);
    });
  },

  addTowishlist: (proId, userId) => {
    return new Promise(async (resolve, reject) => {
      const userdt = await wishlistModel.findOne({ user_id: userId });
      if (userdt) {
        const proExist = userdt.products.findIndex(
          (products) => products.pro_Id == proId
        );
        if (proExist != -1) {
          resolve({ error: "product already in wishlist" });
        } else {
          await wishlistModel.findOneAndUpdate(
            { user_id: userId },
            { $push: { products: { pro_Id: proId } } }
          );
          resolve({ msg: "added" });
        }
      } else {
        const newwishlist = new wishlistModel({
          user_id: userId,
          products: { pro_Id: proId },
        });
        await newwishlist.save((err, result) => {
          if (err) {
            resolve({ msg: "not added to wishlist" });
          } else {
            resolve({ msg: "wislist created" });
          }
        });
      }
    });
  },

  getwishlist: (userid) => {
    return new Promise(async (resolve, reject) => {
      const wishlist = await wishlistModel
        .findOne({ user_id: userid._id })
        .populate("products.pro_Id")
        .lean();
      resolve(wishlist);
    });
  },
  getWishlistcount: (userid) => {
    return new Promise(async (resolve, reject) => {
      let count = 0;
      const user = await wishlistModel.findOne({ user_id: userid });
      if (user) {
        count = user.products.length;
        resolve(count);
      } else {
        resolve(count);
      }
    });
  },
  checkWishList: (proId, user) => {
    return new Promise(async (resolve, reject) => {
      let wishlist = await wishlistModel
        .findOne({ user_id: user._id })
        .elemMatch("products", { pro_Id: proId });
      resolve(wishlist);
    });
  },

  deletewishlist: (proId, user) => {
    return new Promise(async (resolve, reject) => {
      const remove = await wishlistModel.updateOne(
        { user_id: user },
        { $pull: { products: { pro_Id: proId.cart } } }
      );
      resolve({ msg: "comfirm delete" });
    });
  },
  placeOrder: (order, products, total, DeliveryCharges, netTotal, user) => {
    return new Promise(async (resolve, reject) => {
      const status = order.paymentMethod === "cod" ? "placed" : "Failed";
      const orderObj = await ordermodel({
        user_Id: user._id,
        Total: order.total,
        ShippingCharge: DeliveryCharges,
        grandTotal: order.mainTotal,
        coupondiscountedPrice: order.discountedPrice,
        couponPercent: order.discoAmountpercentage,
        couponName: order.couponName,

        payment_status: status,
        paymentMethod: order.paymentMethod,
        ordered_on: new Date(),
        product: products.products,
        deliveryDetails: {
          name: order.fname,
          number: order.number,
          email: order.email,
          house: order.house,
          localplace: order.localplace,
          town: order.town,
          district: order.district,
          state: order.state,
          pincode: order.pincode,
        },
      });
      await orderObj.save(async (err, res) => {
        await cartModel.remove({ user: order.userId });
        resolve(orderObj);
      });
    });
  },

  generateRazorpay: (orderid, totalamount) => {
    return new Promise((resolve, reject) => {
      var options = {
        amount: totalamount * 100, // amount in the smallest currency unit
        currency: "INR",
        receipt: "" + orderid,
      };
      instance.orders.create(options, function (err, order) {
        if (err) {
          console.log(err);
        } else {
          resolve(order);
        }
      });
    });
  },
  validateCoupon: (data, userId) => {
    return new Promise(async (resolve, reject) => {
      obj = {};

      const coupon = await couponmodel.findOne({ couponCode: data.coupon });
      if (coupon) {
        if (coupon.limit > 0) {
          checkUserUsed = await couponmodel.findOne({
            couponCode: data.coupon,
            usedUsers: { $in: [userId] },
          });
          if (checkUserUsed) {
            obj.couponUsed = true;
            obj.msg = " You Already Used A Coupon";
            resolve(obj);
          } else {
            let nowDate = new Date();
            date = new Date(nowDate);
            if (date <= coupon.expirationTime) {
              await couponmodel.updateOne(
                { couponCode: data.coupon },
                { $push: { usedUsers: userId } }
              );

              await couponmodel.findOneAndUpdate(
                { couponCode: data.coupon },
                { $inc: { limit: -1 } }
              );
              let total = parseInt(data.total);
              let percentage = parseInt(coupon.discount);
              let discoAmount = ((total * percentage) / 100).toFixed();
              obj.discoAmountpercentage = percentage;
              obj.total = total - discoAmount;
              obj.success = true;
              resolve(obj);
            } else {
              obj.couponExpired = true;
              resolve(obj);
            }
          }
        } else {
          obj.couponMaxLimit = true;
          console.log("Used Maximum Limit");
          resolve(obj);
        }
      } else {
        obj.invalidCoupon = true;
        console.log("This Coupon Is Invalid");
        resolve(obj);
      }
    });
  },

  verifyPayment: (details) => {
    return new Promise((resolve, reject) => {
      let crypto = require("crypto");
      let hmac = crypto.createHmac("sha256", "0bPk8Pm9nQkPFumEDRxw2qlV");
      hmac.update(
        details["payment[razorpay_order_id]"] +
          "|" +
          details["payment[razorpay_payment_id]"]
      );
      hmac = hmac.digest("hex");
      if (hmac == details["payment[razorpay_signature]"]) {
        resolve();
      } else {
        reject();
      }
    });
  },
  changePayementStatus: (orderid) => {
    return new Promise(async (resolve, reject) => {
      const changestatus = await ordermodel
        .findOneAndUpdate(
          { _id: orderid },
          {
            $set: { payment_status: "placed" },
          }
        )
        .then((changestatus) => {
          resolve(changestatus);
        });
    });
  },

  getorderProducts: (orderid) => {
    return new Promise(async (resolve, reject) => {
      const orderdetails = await ordermodel
        .findOne({ _id: orderid })
        .populate("product.pro_id")
        .lean();
      resolve(orderdetails);
    });
  },
  getallorders: (user) => {
    return new Promise(async (resolve, reject) => {
      const allorders = await ordermodel
        .find({ user_Id: user })
        .populate("product.pro_id")
        .sort({ _id: -1 })
        .lean();
      resolve(allorders);
    });
  },
  cancelorder: (data) => {
    const status = "Cancelled";
    return new Promise(async (resolve, reject) => {
      const cancelorder = await ordermodel.findOneAndUpdate(
        { _id: data.orderId, "product.pro_id": data.proId },
        {
          $set: {
            "product.$.status": status,
          },
        }
      );
      await products.findOneAndUpdate(
        { _id: data.proId },
        {
          $inc: {
            stock: 1,
          },
        }
      );
      resolve();
    });
  },
  getAddresses: (user) => {
    return new Promise(async (resolve, reject) => {
      const Addresses = await userDataModel.findOne({ _id: user }).lean();
      resolve(Addresses);
    });
  },
  addAddress: (userId, data) => {
    return new Promise(async (resolve, reject) => {
      const user = userDataModel.findOne({ _id: userId });
      await userDataModel.findOneAndUpdate(
        { _id: userId },
        {
          $push: {
            address: {
              fname: data.fname,
              lname: data.lname,
              house: data.house,
              towncity: data.towncity,
              district: data.district,
              state: data.state,
              pincode: data.pincode,
              email: data.email,
              mobile: data.mobile,
            },
          },
        }
      );
      resolve();
    });
  },
  deleteAddress: (addressId, user) => {
    return new Promise(async (resolve, reject) => {
      const address = await userDataModel.updateOne(
        { _id: user._id },
        { $pull: { address: { _id: addressId } } }
      );
      resolve();
    });
  },
  getOneAddres: (user, addressId) => {
    let id = mongoose.Types.ObjectId(user);
    return new Promise(async (resolve, reject) => {
      const address = await userDataModel
        .aggregate([
          {
            $match: {
              _id: id(user),
            },
          },
          {
            $unwind: "address",
          },
          {
            $match: {
              "address._id": addressId,
            },
          },
          {
            project: {
              address: 1,
              _id: 0,
            },
          },
        ])
        .lean();
      resolve(address);
    });
  },
  getSearchProducts: (key) => {
    try {
      return new Promise(async (resolve, reject) => {
        let serchProducts = await products
          .find({
            $or: [
              { bookName: { $regex: new RegExp("^" + key + ".*", "i") } },
              { author: { $regex: new RegExp("^" + key + ".*", "i") } },
            ],
          })
          .lean();
        resolve(serchProducts);
      });
    } catch (error) {
      console.error(error);
    }
  },

  //filter category
  searchFilter: (categoryFilter, subcategoryFilter, price) => {
    try {
      return new Promise(async (resolve, reject) => {
        let result;

        if (categoryFilter && subcategoryFilter) {
          let categoryid = mongoose.Types.ObjectId(categoryFilter);
          let subcategoryid = mongoose.Types.ObjectId(subcategoryFilter);
          result = await products.aggregate([
            {
              $match: { category: categoryid },
            },

            {
              $match: { sub_cateogry: subcategoryid },
            },
            {
              $match: { price: { $lt: price } },
            },
          ]);
        } else if (categoryFilter) {
          let categoryid = mongoose.Types.ObjectId(categoryFilter);
          result = await products.aggregate([
            {
              $match: { category: categoryid },
            },
            {
              $match: { price: { $lt: price } },
            },
          ]);
        } else if (subcategoryFilter) {
          let subcategoryid = mongoose.Types.ObjectId(subcategoryFilter);
          result = await products.aggregate([
            {
              $match: { sub_cateogry: subcategoryid },
            },
            {
              $match: { price: { $lt: price } },
            },
          ]);
        } else {
          result = await products.aggregate([
            {
              $match: { price: { $lt: price } },
            },
          ]);
        }
        resolve(result);
      });
    } catch (error) {
      console.error(error);
    }
  },
  getHomeFilter: (id) => {
    try {
      return new Promise(async (resolve, reject) => {
        let Pid = mongoose.Types.ObjectId(id);
        let result = await products.aggregate([
          {
            $match: { sub_cateogry: Pid },
          },
        ]);
        resolve(result);
      });
    } catch (error) {
      console.error(error);
    }
  },
  getallproducts: () => {
    return new Promise(async (resolve, reject) => {
      const allproducts = products
        .find({})
        .populate("category")
        .populate("sub_cateogry")
        .sort([["_id", -1]])
        .limit(8)
        .lean();
      resolve(allproducts);
    });
  },
  getByCategories: (catid) => {
    try {
      return new Promise(async (resolve, reject) => {
        let categoryid = mongoose.Types.ObjectId(catid);
        let result = await products
          .aggregate([
            {
              $match: { category: categoryid },
            },
          ])
          .limit(20);
        resolve(result);
      });
    } catch (error) {
      console.error(error);
    }
  },
  getCarousel: () => {
    return new Promise(async (resolve, reject) => {
      const Carousel = Carouselmodel.find().sort({ _id: -1 }).limit(3).lean();
      resolve(Carousel);
    });
  },
};
