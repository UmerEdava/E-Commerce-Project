var express = require('express');
var router = express.Router();
const userHelpers = require('../helpers/user-helpers')
const productHelpers = require('../helpers/product-helpers')
const adminHelpers = require('../helpers/admin-helpers');
var voucher_codes = require('voucher-code-generator');
var moment = require("moment");
const {
  response
} = require('express');

var verifyLogin = (req, res, next) => {
  var adminLogin = req.session.admin
  if (adminLogin) {
    next()
  } else {
    res.redirect('/admin/admin_login')
  }
}

/* GET users listing. */
router.get('/', async function (req, res, next) {
  var adminLoggedIn = req.session.admin
  if (adminLoggedIn) {
    isAdmin = true
    salesRevenue = await adminHelpers.salesRevenue()
    totalIncome = salesRevenue[0]
    totalOrders = await adminHelpers.getOrdersCount()
    pendingOrders = await adminHelpers.getPendingOrdersCount()
    deliveredOrders = await adminHelpers.getDeliveredOrdersCount()
    placedOrders = await adminHelpers.getPlacedOrdersCount()
    shippedOrders = await adminHelpers.getShippedOrdersCount()
    cancelledOrders = await adminHelpers.getCancelledOrdersCount()
    console.log(cancelledOrders,'**');
    
    totalUsers = await userHelpers.totalUsers()
    totalProducts =await productHelpers.countOfProducts()

    res.render('admin/dashboard', {
      isAdmin,
      totalProducts,
      totalUsers,
      pendingOrders,
      totalOrders,
      totalIncome,
      deliveredOrders,
      placedOrders,
      shippedOrders,
      cancelledOrders
    })
  } else {
    res.redirect('/admin/admin_login')
  }

});

router.get('/admin_login', (req, res) => {
  var loggedIn = req.session.adminLoggedIn

  if (loggedIn) {
    res.redirect('/admin')
  } else {
    res.render('admin/login', {
      adminLoginError: req.session.adminLoginError
    })
    req.session.adminLoginError = false
  }
})

router.post('/admin_login', (req, res) => {
  adminHelpers.doLogin(req.body).then((response) => {
    if (response.status) {
      req.session.adminLoggedIn = true
      req.session.admin = response.admin
      res.redirect('/admin')
    } else {
      req.session.adminLoginError = 'Invalid username and password'
      res.redirect('/admin/admin_login')
    }
  })
})

router.get('/all_users', verifyLogin, (req, res) => {
  userHelpers.getAllUsers().then((users) => {
    isAdmin = true
    res.render('admin/all-users', {
      users,
      isAdmin
    })
  })
});

router.get('/delete_user/:id', (req, res) => {
  let userId = req.params.id
  userHelpers.removeUser(userId).then((response) => {
    res.redirect('/admin/all_users')
  })
})

router.get('/all_products', (req, res) => {
  let isAdmin = true
  let adminLogin = req.session.admin
  if (adminLogin) {
    productHelpers.getAllProducts().then((products) => {
      console.log('just for testing', products);
      res.render('admin/all-products', {
        products,
        isAdmin
      })
    })
  } else {
    res.redirect('/admin')
  }
})

router.get('/add_product', verifyLogin, async (req, res) => {
  isAdmin = true
  let menCategory = await productHelpers.getMenCategoryList()
  let womenCategory = await productHelpers.getWomenCategoryList()
  let boysCategory = await productHelpers.getBoysCategoryList()
  let girlsCategory = await productHelpers.getGirlsCategoryList()

  res.render('admin/add-product', {
    menCategory,
    womenCategory,
    boysCategory,
    girlsCategory,
    isAdmin
  })
})

router.post('/add_product', (req, res) => {
  console.log('ithaanu saadhanam',req.body.imageBase64Data);
  productHelpers.addProduct(req.body, (id) => {
    let image1 = req.files.image1
    let image2 = req.files.image2
    let image3 = req.files.image3
    let image4 = req.files.image4
    let image5 = req.files.image5    

    image1.mv('./public/images/product-images/' + id + '1' + '.jpg')

    image2.mv('./public/images/product-images/' + id + '2' + '.jpg')

    image3.mv('./public/images/product-images/' + id + '3' + '.jpg')

    image4.mv('./public/images/product-images/' + id + '4' + '.jpg')

    image5.mv('./public/images/product-images/' + id + '5' + '.jpg')

    res.redirect('/admin/all_products')

  });
})

router.get('/delete_product/:id', (req, res) => {
  let proId = req.params.id
  console.log(proId);
  productHelpers.deleteProduct(proId).then((response) => {
    res.redirect('/admin/all_products')
  })
})

router.get('/edit_product/:id', verifyLogin, async (req, res) => {
  console.log(req.params.id, 'product id arrived in router');
  let product = await productHelpers.getProductDetails(req.params.id)
  let menCategory = await productHelpers.getMenCategoryList()
  let womenCategory = await productHelpers.getWomenCategoryList()
  let boysCategory = await productHelpers.getBoysCategoryList()
  let girlsCategory = await productHelpers.getGirlsCategoryList()

  console.log('oho',product)

  let isAdmin = true
  res.render('admin/edit-product', {
    product,
    isAdmin,
    menCategory,
    womenCategory,
    boysCategory,
    girlsCategory
  })
})

router.post('/edit_product/:id', (req, res) => {
  console.log(req.body);
  productHelpers.editProduct(req.params.id, req.body).then(() => {
    res.redirect('/admin/all_products')
    if (req.files.image) {
      let image = req.files.image
      image.mv('./public/images/product-images/' + req.params.id + '.jpg')
    }
  })
})


router.get('/edit_user/:id', async (req, res) => {
  let user = await userHelpers.getUserDetails(req.params.id)
  console.log(user);
  res.render('admin/edit-user', {
    user,
    isAdmin
  })
})

router.post('/edit_user/:id', (req, res) => {
  userHelpers.updateUser(req.params.id, req.body).then(() => {
    res.redirect('/admin/all_users')
  })
})

router.get('/add_user', verifyLogin, (req, res) => {
  isAdmin = true

  res.render('admin/add-user', {
    addUserError: req.session.addUserError,
    isAdmin
  })
  req.session.addUserError = false

})

router.post('/add_user', (req, res) => {
  userHelpers.doRegister(req.body).then((response) => {
    res.redirect('/admin/all_users')
  }).catch(() => {
    req.session.addUserError = '*User Already Exists'
    res.redirect('/admin/add_user')
    console.log('existing user');
  })
})

router.get('/admin_logout', (req, res) => {
  req.session.adminLoggedIn = false
  req.session.admin = false
  res.redirect('/admin/admin_login')
})

router.get('/all_categories', async (req, res) => {
  isAdmin = true
  let menCategory = await productHelpers.getMenCategoryList()
  let womenCategory = await productHelpers.getWomenCategoryList()
  let boysCategory = await productHelpers.getBoysCategoryList()
  let girlsCategory = await productHelpers.getGirlsCategoryList()

  res.render('admin/all-categories', {
    isAdmin,
    menCategory,
    womenCategory,
    boysCategory,
    girlsCategory
  })
})

router.get('/category_men', (req, res) => {
  let isAdmin = true
  let menCategories = productHelpers.getMenCategoryProducts()
  res.render('admin/category-men', {
    menCategories,
    isAdmin
  })
})

router.post('/add_men_category', (req, res) => {
  console.log(req.body);
  productHelpers.addMenCategory(req.body).then(() => {
    res.json({
      status: true
    })
  })
})

router.post('/add_women_category', (req, res) => {
  console.log(req.body);
  productHelpers.addWomenCategory(req.body).then(() => {
    res.json({
      status: true
    })
  })
})

router.post('/add_boys_category', (req, res) => {
  console.log(req.body);
  productHelpers.addBoysCategory(req.body).then(() => {
    res.json({
      status: true
    })
  })
})

router.post('/add_girls_category', (req, res) => {
  console.log(req.body);
  productHelpers.addGirlsCategory(req.body).then(() => {
    res.json({
      status: true
    })
  })
})

router.get('/men_collection', verifyLogin, (req, res) => {
  productHelpers.getMenCollection().then((men) => {
    console.log(men);
    isAdmin = true
    res.render('admin/men-collection', {
      men,
      isAdmin
    })
  })
})

router.get('/women_collection', verifyLogin, (req, res) => {
  productHelpers.getWomenCollection().then((women) => {
    console.log(women);
    isAdmin = true
    res.render('admin/women-collection', {
      women,
      isAdmin
    })
  })
})

router.get('/boys_collection', verifyLogin, (req, res) => {
  productHelpers.getBoysCollection().then((boys) => {
    console.log(boys);
    isAdmin = true
    res.render('admin/boys-collection', {
      boys,
      isAdmin
    })
  })
})

router.get('/girls_collection', verifyLogin, (req, res) => {
  productHelpers.getGirlsCollection().then((girls) => {
    console.log(girls);
    isAdmin = true
    res.render('admin/girls-collection', {
      girls,
      isAdmin
    })
  })
})

router.get('/sub_category_collection:subCategory', verifyLogin,(req,res)=>{
  productHelpers.getSubCategory(req.params.subCategory).then((subCategory)=>{
    console.log(subCategory);
    isAdmin = true
    res.render('admin/sub-category', {
      subCategory,
      isAdmin
    })
  })
})

router.get('/clear_men_collection', (req, res) => {
  productHelpers.clearMenCollection()
  res.redirect('/men_collection')
})

router.get('/products_for_offer', verifyLogin, (req, res) => {
  isAdmin = true
  productHelpers.getAllProducts().then((products) => {
    res.render('admin/products-for-offer', {
      products,
      isAdmin
    })
  })
})

// router.get('/add_product_offer/:id', (req,res)=>{
//   let proId = req.params.id
//   isAdmin = true
//   console.log('id arrived in add page',proId);

//   res.render('admin/add-product-offer',{proId,isAdmin})

//   res.json({response:true})
// })

router.get('/add_product_offer/:id', verifyLogin, (req, res) => {
  console.log(req.params.id, 'product id routeril vanne');

  let proId = req.params.id
  let isAdmin = true
  
  res.render('admin/add-product-offer', {
    isAdmin,
    proId
  })
})

router.post('/add_product_offer', (req, res) => {
  console.log('offer details', req.body)

  adminHelpers.addOfferForProduct(req.body).then(() => {
    res.json({
      status: true
    })
  })
})

router.post('/remove_product_offer', (req, res) => {
  console.log(req.body.proId, 'remove id routeril vanne');

  adminHelpers.removeOfferForProduct(req.body.proId).then(() => {
    res.json(response)
  })
})

router.get('/edit_product_offer/:id', (req, res) => {
  console.log('angottu poi..', req.params.id);
  isAdmin = true
  isSubrouter = true
  productHelpers.getProductDetails(req.params.id).then((product) => {
    console.log('thirichu vanne', product);
    res.render('admin/edit-product-offer', {
      product,
      isAdmin,
      isSubrouter
    })
  })
})

router.post('/edit_product_offer', (req, res) => {
  console.log('poyittunde..', req.body);
  adminHelpers.editOfferForProduct(req.body).then(() => {
    res.json(response)
  })
})

router.get('/categories_for_offer', async (req, res) => {

  let men = await adminHelpers.getProductDetailsForCategory('Men')
  let women = await adminHelpers.getProductDetailsForCategory('Women')
  let boys = await adminHelpers.getProductDetailsForCategory('Boys')
  let girls = await adminHelpers.getProductDetailsForCategory('Girls')

  console.log('ivideyum vannu', men);


  isAdmin = true
  isSubrouter = true
  res.render('admin/categories-for-offer', {
    isAdmin,
    isSubrouter,
    men,
    women,
    boys,
    girls
  })
})

router.post('/add_category_offer', (req, res) => {
  console.log(req.body, 'lkskdjlsj***');

  adminHelpers.addOfferForCategory(req.body).then(() => {
    req.session.categoryOffer
    res.redirect('/admin/categories_for_offer')
  })
})

router.get('/generate_coupon', (req, res) => {
  let isAdmin = true
  let isSubrouter = true
  res.render('admin/generate-coupon', {
    isAdmin
  })
})

router.post('/generate_coupon', (req, res) => {
  console.log(req.body);

  let couponCode = voucher_codes.generate({
    length: 8,
    count: 1
  });

  let coupon = couponCode[0]

  adminHelpers.saveCoupon(req.body, coupon)
  res.redirect('/admin/all_coupons')
})

router.get('/all_coupons', (req, res) => {
  adminHelpers.getAllCoupons().then((coupons) => {
    isAdmin = true
    isSubrouter = true
    res.render('admin/all-coupons', {
      coupons,
      isAdmin
    })
  })
})

router.post('/delete_coupon', (req, res) => {
  console.log('routeril', req.body);
  adminHelpers.deleteCoupon(req.body).then(() => {
    res.json({
      status: true
    })
  })
})

router.get('/add_category_offer/:id', (req, res) => {

  console.log('vanno..', req.params.id)

  isAdmin = true

  if (req.params.id == 'Men') {
    res.render('admin/add-men-offer', {
      isAdmin
    })
  } else if (req.params.id == 'Women') {
    res.render('admin/add-women-offer', {
      isAdmin
    })
  } else if (req.params.id == 'Boys') {
    res.render('admin/add-boys-offer', {
      isAdmin
    })
  } else if (req.params.id == 'Girls') {
    res.render('admin/add-girls-offer', {
      isAdmin
    })
  }


})



router.get('/all_orders', (req, res) => {
  adminHelpers.getAllOrders().then((orders) => {
    console.log(orders)

    res.render('admin/all-orders', {
      orders,
      isAdmin
    })

  })
  isAdmin = true
})

router.get('/pending_orders', (req, res) => {
  adminHelpers.getPendingOrders().then((pendingOrders) => {
    console.log(pendingOrders)
    isAdmin = true
    console.log('order in router', pendingOrders);
    res.render('admin/pending-orders', {
      pendingOrders,
      isAdmin
    })
  })
})

router.get('/delivered_orders', (req, res) => {
  adminHelpers.getDeliveredOrders().then((deliveredOrders) => {
    isAdmin = true
    console.log('order in router', deliveredOrders);
    res.render('admin/delivered-orders', {
      deliveredOrders,
      isAdmin
    })
  })
})

router.get('/remove_category_offer/:id', (req, res) => {

  console.log(req.params.id);

  adminHelpers.removeCategoryOffer(req.params.id).then(() => {
    res.json(response)
  })
})

router.get('/block_user:id', (req, res) => {
  console.log('routeree..', req.params.id);
  userHelpers.blockUser(req.params.id).then(() => {
    res.json(response)
  })
})

router.get('/unblock_user:id', (req, res) => {
  userHelpers.unblockUser(req.params.id).then(() => {
    res.json(response)
  })
})

router.get('/confirm_order:id', (req, res) => {
  console.log('routeril ethiye...', req.params.id);
  adminHelpers.confirmOrder(req.params.id).then(() => {
    res.json(response)
  })
})

router.get('/cancel_order:id', (req, res) => {
  console.log('routeril ethiye...', req.params.id);
  adminHelpers.cancelOrder(req.params.id).then(() => {
    res.json(response)
  })
})

router.get('/ship_order:id', (req, res) => {
  console.log('routeril ethiye...', req.params.id);
  adminHelpers.shipOrder(req.params.id).then(() => {
    res.json(response)
  })
})

router.get('/delivered_order:id', (req, res) => {
  console.log('routeril ethiye...', req.params.id);
  adminHelpers.deliveredOrder(req.params.id).then(() => {
    res.json(response)
  })
})

router.get('/view_order_products/:id', async (req, res) => {
  console.log(req.params.id);
  let products = await userHelpers.getOrderProducts(req.params.id)
  console.log(products);
  isSubrouter = true
  isAdmin = true
  res.render('admin/view-ordered-products', {
    user: req.session.user,
    products,
    isSubrouter,
    isAdmin
  })
})

router.get('/sales_report', (req,res)=>{
  var currentMonthReport
  // adminHelpers.getSalesReportOfCurrentMonth().then((report)=>{
  //   currentMonthReport = report
  // })
  isAdmin = true
  res.render('admin/sales-report',{isAdmin,currentMonthReport})
})

router.post('/sales_report', (req,res)=>{
  var firstDate = moment(req.body.firstDate).format("L");
  var lastDate = moment(req.body.lastDate).format("L");

  console.log(firstDate,lastDate);

  adminHelpers.reportOfSales(firstDate, lastDate).then((response) => {
    console.log(response);
    res.json(response);
  });
})

router.get('/home_banner', (req,res)=>{
  res.render('admin/home-banner')
})

module.exports = router;