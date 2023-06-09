const db = require("../config/connection");

const bcrypt = require("bcrypt");

const adminDataModel = require("../models/admin");
const category = require("../models/category");
const Sub_Category = require("../models/sub_category");
const userDataModel = require("../models/user");
const multer = require("multer");
const products = require("../models/products");
const ordermodel = require("../models/order");
const couponmodel = require("../models/Coupen");
const Carouselmodel = require("../models/Carousel");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./public/upload");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "--" + file.originalname);
  },
});
let upload = multer({
  storage: storage,
});

module.exports = {
  doadminlogin: (adminDataa) => {
    return new Promise(async (resolve, reject) => {
      let response = {};
      const admin = await adminDataModel.findOne({ email: adminDataa.email });
      if (admin) {
        bcrypt.compare(adminDataa.password, admin.password).then((result) => {
          if (result) {
            response.admin = admin;
            response.status = true;
            resolve(response);
          } else {
            reject({
              status: false,
              msg: "Your username or password is incorrect",
            });
          }
        });
      } else {
        reject({
          status: false,
          msg: "Your username or password is incorrect",
        });
      }
    });
  },
  getAllUsers: () => {
    return new Promise(async (resolve, reject) => {
      let userinfo = await userDataModel.find().lean();
      resolve(userinfo);
    });
  },
  blockUser: (userId) => {
    return new Promise(async (resolve, reject) => {
      const user = await userDataModel.findByIdAndUpdate(
        { _id: userId },
        { $set: { block: true } },
        { upsert: true }
      );
      resolve(user);
    });
  },
  unblockUser: (userId) => {
    return new Promise(async (resolve, reject) => {
      const user = await userDataModel.findByIdAndUpdate(
        { _id: userId },
        { $set: { block: false } },
        { upsert: true }
      );
      resolve(user);
    });
  },
  upload,
  addcategory: (data, file) => {
    return new Promise(async (resolve, reject) => {
      const categoryname = data.category;
      const categorydata = await category.findOne({
        categoryName: categoryname,
      });
      if (categorydata) {
        reject({ status: false, msg: "category already taken" });
      } else {
        const addcategory = await new category({
          categoryName: categoryname,
          image: file.filename,
        });
        await addcategory.save(async (err, res) => {
          if (err) {
          }
          resolve({ data: res, msg: "Success" });
        });
        resolve(addcategory);
      }
    });
  },
  getallcategory: () => {
    return new Promise(async (resolve, reject) => {
      const allcategory = await category.find({}).lean();
      resolve(allcategory);
    });
  },
  addsubcategory: (Data) => {
    return new Promise(async (resolve, reject) => {
      const sub_categoryname = Data.Subcategory;
      const sub_categorydata = await Sub_Category.findOne({
        Sub_category: sub_categoryname,
      });
      if (sub_categorydata) {
        reject({ status: false, msg: "Sub category already taiken" });
      } else {
        const addsubcategory = await new Sub_Category({
          Sub_category: sub_categoryname,
        });
        await addsubcategory.save(async (err, result) => {
          if (err) {
            reject({ msg: "sub category not added" });
          } else {
            resolve({ result, msg: "subcategory" });
          }
        });
      }
    });
  },
  getallsubcategory: () => {
    return new Promise(async (resolve, reject) => {
      const allsubcategory = await Sub_Category.find({}).lean();
      resolve(allsubcategory);
    });
  },
  getThreeCategory: () => {
    return new Promise(async (resolve, reject) => {
      const getThreeCategory = await category.find({}).limit(3).lean();
      resolve(getThreeCategory);
    });
  },
  getallSubcategory: () => {
    return new Promise(async (resolve, reject) => {
      const allsubcategory = await Sub_Category.find({}).limit(4).lean();
      resolve(allsubcategory);
    });
  },

  upload,
  addProduct: (productData, file) => {
    return new Promise(async (resolve, reject) => {
      Mrp = parseInt(productData.Mrp);
      Prize = Mrp - (Mrp * productData.Discount * 0.01).toFixed(0);

      const sub_categorydata = await Sub_Category.findOne({
        Sub_category: productData.subcategory,
      });
      const categorydata = await category.findOne({
        categoryName: productData.category,
      });
      const newproduct = await new products({
        bookName: productData.bookName,
        author: productData.author,
        description: productData.description,
        category: categorydata._id,
        sub_cateogry: sub_categorydata._id,
        mrp: productData.Mrp,
        Discount: productData.Discount,
        price: Prize,
        stock: productData.stock,
        image: file.filename,
      });
      await newproduct.save(async (err, res) => {
        if (err) {
        }
        resolve({ data: res, msg: "Success" });
      });
    });
  },
  getallproducts: () => {
    return new Promise(async (resolve, reject) => {
      const allproducts = products
        .find({})
        .populate("category")
        .populate("sub_cateogry")
        .sort([["_id", -1]])
        .limit(15)
        .lean();
      resolve(allproducts);
    });
  },
  moreProduct: () => {
    return new Promise(async (resolve, reject) => {
      const moreProducts = products
        .find({})
        .populate("image.[0]")
        .skip(8)
        .limit(10)
        .lean();
      resolve(moreProducts);
    });
  },

  deleteProduct: (proId) => {
    return new Promise(async (resolve, reject) => {
      const removedProduct = await products.findByIdAndDelete({ _id: proId });
      resolve(removedProduct);
    });
  },
  getProductDetails: (proId) => {
    return new Promise(async (resolve, reject) => {
      const productDetails = await products
        .findOne({ _id: proId })
        .populate("category")
        .populate("sub_cateogry")
        .lean()
        .then((productDetails) => {
          resolve(productDetails);
        });
    });
  },
  updateProduct: (proId, data, file) => {
    return new Promise(async (resolve, reject) => {
      Mrp = parseInt(data.Mrp);
      Prize = Mrp - (Mrp * data.Discount * 0.01).toFixed(0);
      const sub_categorydata = await Sub_Category.findOne({
        Sub_category: data.subcategory,
      });
      const categorydata = await category.findOne({
        categoryName: data.category,
      });
      const updateProduct = await products.findByIdAndUpdate(
        { _id: proId },
        {
          $set: {
            bookName: data.bookName,
            author: data.author,
            description: data.description,
            category: categorydata._id,
            sub_cateogry: sub_categorydata._id,
            mrp: data.Mrp,
            price: Prize,
            Discount: data.Discount,
            stock: data.stock,
            image: file,
          },
        }
      );
      resolve({ updateProduct, msg: "You added product successfully!" });
    });
  },

  ProductDetails: (proId) => {
    return new Promise(async (resolve, reject) => {
      const productDetails = await products
        .findOne({ _id: proId })
        .lean()
        .then((productDetails) => {
          resolve(productDetails);
        });
    });
  },
  getproductdetalis: (proId) => {
    return new Promise(async (resolve, reject) => {
      const singleproduct = await products
        .findOne({ _id: proId })
        .lean()
        .then((singleproduct) => {
          resolve(singleproduct);
        });
    });
  },
  allorders: () => {
    return new Promise(async (resolve, reject) => {
      const allorders = await ordermodel
        .find({})
        .populate("product.pro_id")
        .sort([["ordered_on", -1]])
        .lean();
      resolve(allorders);
    });
  },
  orderdetails: (orderID) => {
    return new Promise(async (resolve, reject) => {
      const orderdetails = await ordermodel
        .findOne({ _id: orderID })
        .populate("product.pro_id")
        .lean();
      resolve(orderdetails);
    });
  },
  changeOrderStatus: (data) => {
    return new Promise(async (resolve, reject) => {
      const state = await ordermodel.findOneAndUpdate(
        { _id: data.orderId, "product.pro_id": data.proId },
        {
          $set: {
            "product.$.status": data.orderStatus,
          },
        }
      );
      resolve();
    });
  },

  AddCoupon: (data) => {
    return new Promise(async (resolve, reject) => {
      const newCoupon = new couponmodel({
        couponName: data.couponName,
        couponCode: data.CoupoCode,
        limit: data.Limit,
        expirationTime: data.ExpireDate,
        discount: data.discount,
      });
      await newCoupon.save();
      resolve();
    });
  },

  getAllCoupons: () => {
    return new Promise(async (resolve, reject) => {
      const AllCoupons = await couponmodel.find({}).lean();
      resolve(AllCoupons);
    });
  },
  Deletecoupon: (id) => {
    return new Promise(async (resolve, reject) => {
      const removeCoupon = await couponmodel.findByIdAndDelete({ _id: id });
      resolve(removeCoupon);
    });
  },

  salesReport: (data) => {
    let response = {};
    let { startDate, endDate } = data;

    let d1, d2, text;
    if (!startDate || !endDate) {
      d1 = new Date();
      d1.setDate(d1.getDate() - 7);
      d2 = new Date();
      text = "For the Last 7 days";
    } else {
      d1 = new Date(startDate);
      d2 = new Date(endDate);
      text = `Between ${startDate} and ${endDate}`;
    }

    const date = new Date(Date.now());
    const month = date.toLocaleString("default", { month: "long" });

    return new Promise(async (resolve, reject) => {
      try {
        let salesReport = await ordermodel.aggregate([
          {
            $match: {
              ordered_on: {
                $lt: d2,
                $gte: d1,
              },
            },
          },
          {
            $match: { "product.status": "Order placed" },
          },
          {
            $group: {
              _id: { $dayOfMonth: "$ordered_on" },
              Total: { $sum: "$grandTotal" },
            },
          },
        ]);

        let categoryReport = await ordermodel.aggregate([
          {
            $match: { "product.status": "Order placed" },
          },
          {
            $unwind: "$product",
          },
          {
            $lookup: {
              from: "products",
              localField: "product.pro_id",
              foreignField: "_id",
              as: "productDetails",
            },
          },
          {
            $unwind: "$productDetails",
          },
          {
            $lookup: {
              from: "categories",
              localField: "productDetails.category",
              foreignField: "_id",
              as: "categoryDetails",
            },
          },
          {
            $unwind: "$categoryDetails",
          },
          {
            $group: {
              _id: "$categoryDetails.categoryName",
              totalAmount: { $sum: "$product.quantity" },
            },
          },
          { $sort: { totalAmount: -1 } },
          { $limit: 5 },
        ]);

        let orderCount = await ordermodel.countDocuments({
          ordered_on: { $gt: d1, $lt: d2 },
        });

        let totalAmounts = await ordermodel.aggregate([
          {
            $match: { "product.status": "Order placed" },
          },
          {
            $group: {
              _id: null,
              totalAmount: { $sum: "$grandTotal" },
            },
          },
        ]);

        response.salesReport = salesReport;
        response.categoryReport = categoryReport;
        response.orderCount = orderCount;
        response.totalAmountPaid =
          totalAmounts.length > 0 ? totalAmounts[0].totalAmount : 0;
        resolve(response);
      } catch (error) {
        reject(error);
      }
    });
  },

  getOrderCount: () => {
    return new Promise(async (resolve, reject) => {
      const OrderCount = await ordermodel.find({}).count();
      console.log(OrderCount, "OrderCount");
      resolve(OrderCount);
    });
  },
  getProductCount: () => {
    return new Promise(async (resolve, reject) => {
      const ProductCount = await products.find({}).count();
      resolve(ProductCount);
    });
  },
  allCarousel: () => {
    return new Promise(async (resolve, reject) => {
      const allCarousel = await Carouselmodel.find({}).lean();
      resolve(allCarousel);
    });
  },
  upload,
  addCarousel: (data, file) => {
    return new Promise(async (resolve, reject) => {
      const addCarousel = new Carouselmodel({
        CarouselHeading: data.CarouselHeading,
        Sub_heading: data.Subheading,
        Image: file.filename,
      });
      await addCarousel.save();
      resolve();
    });
  },
  deleteCarousel: (Carouselid) => {
    return new Promise(async (resolve, reject) => {
      const deleteCarousel = await Carouselmodel.findOneAndDelete({
        _id: Carouselid,
      });
      resolve();
    });
  },
};
