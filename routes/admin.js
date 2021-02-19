var express = require('express');
var router = express.Router();
const userHelpers = require('../helpers/user-helpers')
const productHelpers = require('../helpers/product-helpers')
const adminHelpers = require('../helpers/admin-helpers');
const { response } = require('express');

var verifyLogin = (req, res, next) => {
  var adminLogin = req.session.admin
  if (adminLogin) {
    next()
  } else {
    res.redirect('/admin/admin_login')
  }
}

/* GET users listing. */
router.get('/', function (req, res, next) {
  var adminLoggedIn = req.session.admin
  if (adminLoggedIn) {
    isAdmin = true
    res.render('admin/dashboard', {
      isAdmin
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
  if(adminLogin){
    productHelpers.getAllProducts().then((products) => {
      res.render('admin/all-products', {
        products,
        isAdmin
      })
    })
  }else{
    res.redirect('/admin')
  }
})

router.get('/add_product',verifyLogin, async(req, res) => {
  isAdmin = true
  let menCategory =await productHelpers.getMenCategoryList()
  let womenCategory =await productHelpers.getWomenCategoryList()
  let boysCategory =await productHelpers.getBoysCategoryList()
  let girlsCategory =await productHelpers.getGirlsCategoryList()
  
  res.render('admin/add-product', {
    menCategory,
    womenCategory,
    boysCategory,
    girlsCategory,
    isAdmin
  })
})

router.post('/add_product', (req, res) => {
  productHelpers.addProduct(req.body, (id) => {
    let image1 = req.files.image[0]
    let image2 = req.files.image[1]
    let image3 = req.files.image[2]
    let image4 = req.files.image[3]
    let image5 = req.files.image[4]    

    image1.mv('./public/images/product-images/' + id +'1'+'.jpg', (err, done) => {
      if (!err) {
        res.redirect('/admin/all_products')
      } else {
        console.log(err)
      }
    })

    image2.mv('./public/images/product-images/' + id +'2'+'.jpg', (err, done) => {
      if (!err) {
        res.redirect('/admin/all_products')
      } else {
        console.log(err)
      }
    })

    image3.mv('./public/images/product-images/' + id +'3'+'.jpg', (err, done) => {
      if (!err) {
        res.redirect('/admin/all_products')
      } else {
        console.log(err)
      }
    })

    image4.mv('./public/images/product-images/' + id +'4'+'.jpg', (err, done) => {
      if (!err) {
        res.redirect('/admin/all_products')
      } else {
        console.log(err)
      }
    })

    image5.mv('./public/images/product-images/' + id +'5'+'.jpg', (err, done) => {
      if (!err) {
        res.redirect('/admin/all_products')
      } else {
        console.log(err)
      }
    })

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
  let isAdmin = true
  res.render('admin/edit-product', {
    product,
    isAdmin
  })
})

router.post('/edit_product/:id', (req, res) => {
  console.log(req.body);
  productHelpers.editProduct(req.params.id, req.body).then(() => {
    res.redirect('/admin/all_products')
    if (req.files.image) {
      let image = req.files.image
      image.mv('./public/images/product-images/' +req.params.id+ '.jpg')
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

router.get('/all_categories', async(req,res) => {
  isAdmin=true
  let menCategory =await productHelpers.getMenCategoryList()
  let womenCategory =await productHelpers.getWomenCategoryList()
  let boysCategory =await productHelpers.getBoysCategoryList()
  let girlsCategory =await productHelpers.getGirlsCategoryList()

  res.render('admin/all-categories',{isAdmin,menCategory,womenCategory,boysCategory,girlsCategory})
})

router.get('/category_men', (req,res)=>{
  let isAdmin = true
  let menCategories = productHelpers.getMenCategoryProducts()
    res.render('admin/category-men', {
    menCategories,
    isAdmin
    })
})

router.post('/add_men_category', (req,res)=>{
  console.log(req.body);
  productHelpers.addMenCategory(req.body).then(()=>{
    res.json({status:true})
  })
})

router.post('/add_women_category', (req,res)=>{
  console.log(req.body);
  productHelpers.addWomenCategory(req.body).then(()=>{
    res.json({status:true})
  })
})

router.post('/add_boys_category', (req,res)=>{
  console.log(req.body);
  productHelpers.addBoysCategory(req.body).then(()=>{
    res.json({status:true})
  })
})

router.post('/add_girls_category', (req,res)=>{
  console.log(req.body);
  productHelpers.addGirlsCategory(req.body).then(()=>{
    res.json({status:true})
  })
})

router.get('/men_collection',verifyLogin, (req,res)=>{
  productHelpers.getMenCollection().then((men)=>{
    console.log(men);
    isAdmin = true
    res.render('admin/men-collection',{men,isAdmin})
  })
})

router.get('/women_collection',verifyLogin, (req,res)=>{
  productHelpers.getWomenCollection().then((women)=>{
    console.log(women);
    isAdmin = true
    res.render('admin/women-collection',{women,isAdmin})
  })
})

router.get('/boys_collection',verifyLogin, (req,res)=>{
  productHelpers.getBoysCollection().then((boys)=>{
    console.log(boys);
    isAdmin = true
    res.render('admin/boys-collection',{boys,isAdmin})
  })
})

router.get('/girls_collection',verifyLogin, (req,res)=>{
  productHelpers.getGirlsCollection().then((girls)=>{
    console.log(girls);
    isAdmin = true
    res.render('admin/girls-collection',{girls,isAdmin})
  })
})

router.get('/clear_men_collection', (req,res)=>{
  productHelpers.clearMenCollection()
  res.redirect('/men_collection')
})

router.get('/products_for_offer', (req,res)=>{
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
  let isSubrouter = true
  res.render('admin/add-product-offer', {
    isAdmin,
    isSubrouter,
    proId
  })
})

router.post('/add_product_offer', (req,res)=>{
  console.log('offer details',req.body)

  adminHelpers.addOfferForProduct(req.body).then(()=>{
    res.json({status:true})
  }) 
  
})

module.exports = router;