var express = require('express');
var router = express.Router();
const userHelpers = require('../helpers/user-helpers')
const adminHelpers = require('../helpers/admin-helpers')
const productHelpers = require('../helpers/product-helpers')
var OTP = require('../config/OTP');
const {
  response
} = require('express');
var twilio = require('twilio')(OTP.accountSID, OTP.authToken)

var verifyLogin = (req, res, next) => {
  var userLogin = req.session.user
  if (userLogin) {
    next()
  } else {
    res.redirect('/login')
  }
}

var paypal = require('paypal-rest-sdk');
paypal.configure({
    'mode': 'sandbox', //sandbox or live 
    'client_id': 'AaMe_nfrAkCyqpIwm2kbokqaA8c3yx0oUdoRnqxgF6qfegourFbXA9PGKtTwpIpOVEc8f_FRa3C3uEz6', // please provide your client id here 
    'client_secret': 'ELE3myMiYsLvsZE4eV9E5GNChhSG7o2bdas70geHg-3q8P6reKklbdqc10swkSpB2sZIVqcmZz_yaL7s' // provide your client secret here 
});

/* GET home page. */
router.get('/', async function (req, res, next) {
  var userData = req.session.user
  var cartCount = null
  if (userData) {
    var cartCount = await userHelpers.getCartCount(req.session.user._id)
    // var total = await userHelpers.getCartTotal(req.session.user._id)
    var cartProducts = await userHelpers.getCartProducts(req.session.user._id)

    productHelpers.getAllProducts().then((products) => {
      isUser = true
      res.render('users/home', {
        userData,
        isUser,
        products,
        cartCount,
        // total,
        cartProducts
      });
    })
  } else {
    productHelpers.getAllProducts().then((products) => {
      isUser = true
      res.render('users/home', {
        userData,
        isUser,
        products
      });
    })
  }
});

router.get('/login', function (req, res) {
  var userLogin = req.session.user
  if (userLogin) {
    res.redirect('/')
  } {
    let isUser = true
    let loginError = req.session.loginError
    res.render('users/login', {
      isUser,
      loginError
    })
    req.session.loginError = false
  }

})

router.post('/login', function (req, res) {
  userHelpers.doLogin(req.body).then((response) => {
    if (response.status) {
      console.log(response);
      // userHelpers.transferLogoutCartProductsToUserCart()
      req.session.userLoggedIn = true
      req.session.user = response.user

      res.redirect('/')
    } else {
      req.session.loginError = 'Invalid email or password'
      res.redirect('/login')
    }
  })
})

router.get('/register', function (req, res) {
  let loggedIn = req.session.user
  if (loggedIn) {
    res.redirect('/')
  } else {
    let isUser = true
    console.log(req.session.signupError);
    res.render('users/register', {
      isUser,
      signupError: req.session.signupError
    })
    req.session.signupError = false
  }
})

router.post('/register', function (req, res) {
  userHelpers.otpRegisterCheck(req.body).then(() => {
    // req.session.userLoggedIn = true
    req.session.otpRegister = req.body

    twilio
      .verify
      .services(OTP.serviceID)
      .verifications
      .create({
        to: `+91${req.body.phone}`,
        channel: 'sms'
      }).then((data) => {
        codeSent = true
        phone = req.body.phone
        res.render('users/OTP-register', {
          phone
        })
      })

  }).catch(() => {
    res.redirect('/register')
    req.session.signupError = '*User Already Exists'
  })
})

router.post('/signup_OTP_verification', (req, res) => {
  twilio
    .verify
    .services(OTP.serviceID)
    .verificationChecks
    .create({
      to: `+91${req.body.phone}`,
      code: req.body.code
    }).then((data) => {
      console.log(data);
      userHelpers.doRegister(req.session.otpRegister).then((user) => {
        req.session.otpRegister = null
        req.session.user = user
        req.session.userLoggedIn = true
        res.redirect('/')
      })
    }).catch((data) => {
      console.log(data);
      res.send('invalid OTP mister')
    })
})

router.get('/logout', function (req, res) {
  req.session.userLoggedIn = false
  req.session.user = false
  res.redirect('/')
})

router.get('/view_product/:id', async (req, res) => {
  let proId = req.params.id
  userData = req.session.user
  var cartCount = null

  if (req.session.user) {
    cartCount = await userHelpers.getCartCount(req.session.user._id)
  }


  productHelpers.getProductDetails(proId).then((product) => {
    let isUser = true
    res.render('users/view-product', {
      isUser,
      product,
      userData,
      cartCount
    })
  })
})

router.get('/cart', verifyLogin, async (req, res) => {

  var cartCount = null

  let products = await userHelpers.getCartProducts(req.session.user._id)

  let total = 0

  if (products.length > 0) {
    total = await userHelpers.getCartTotal(req.session.user._id)
    cartCount = await userHelpers.getCartCount(req.session.user._id)
  }

  let userData = req.session.user

  let isUser = true

  res.render('users/cart', {
    isUser,
    products,
    'user': req.session.user._id,
    cartCount,
    total,
    userData
  })
})

router.post('/change_pro_qty', (req, res, next) => {
  console.log('user id arrived in router', req.body.user);

  userHelpers.changeProQty(req.body).then(async (response) => {
    response.total = await userHelpers.getCartTotal(req.body.user)
    res.json(response)
  })
})

router.get('/add_to_cart/:id', (req, res) => {
  console.log(req.params.id, 'proId arrived in router');
  // console.log(req.session.user._id);
  // if(req.session.user){
  //   userHelpers.addToCart(req.params.id, req.session.user._id).then(() => {
  //     res.json({
  //       status: true
  //     })
  //   })
  // }else{
  console.log(req.session.user);
  if (!req.session.user) {
    console.log('entered in logout case ******');
    userHelpers.addToLogoutCart(req.params.id).then(() => {

      res.json({
        status: true
      })
    })
  } else {
    console.log('arrived in else case*()**');
    userHelpers.addToCart(req.params.id, req.session.user._id).then(() => {
      res.json({
        status: true
      })
    })
  }

  // }

})



router.post('/clear_cart', (req, res) => {
  console.log(req.body, 'arrived in router');
  userHelpers.clearCart(req.body).then(() => {

  })
})

router.post('/remove_product_from_cart', (req, res) => {
  console.log(req.body, 'hari arrived in router');
  userHelpers.removeProductFromCart(req.body).then((response) => {
    res.json(removed)
  })
})

// router.get('/OTP_login', (req, res) => {
//   if (codeSent) {
//     res.render('users/verify-OTP',{mobileNumber})
//   } else {
//     if (req.session.user) {
//       res.redirect('/')
//     } else {
//       res.render('users/send-OTP')
//     }
//   }
// })

// router.post('/OTP_login', (req, res) => {
//   if(codeSent){
//     twilio
//     .verify
//     .services(OTP.serviceID)
//     .verificationChecks
//     .create({
//       to: '+91'+req.body.mobileNumber,
//       code: req.body.code
//     }).then((data) => {
//       req.session.userLoggedIn = true
//       codeSent = false
//       res.redirect('/')
//     }).catch(()=>{
//       req.session.verifyError = 'Wrong OTP'
//       res.redirect('/OTP_login')
//     })
//   }else{
//     var user = userHelpers.getAllUsers

//     if (user.phone == req.body.mobileNumber) {
//       twilio
//         .verify
//         .services(OTP.serviceID)
//         .verifications
//         .create({
//           to: '+91' + req.body.mobileNumber,
//           channel: 'sms'
//         }).then((data) => {
//           codeSent = true
//           res.redirect('/OTP_login')
//         })
//     } else {
//       req.session.OTPloginError = 'NO ACCOUNT FOUND'
//       res.redirect('/OTP_login')
//     }
//   }
// })

router.get('/OTP_login', (req, res) => {
  if (req.session.user) {
    res.redirect('/')
  } else {
    notUser = req.session.notUser
    res.render('users/send-OTP', {
      notUser
    })
    req.session.notUser = false
  }
})

router.post('/OTP_login', (req, res) => {
  // var user = userHelpers.getUserDetailsByPhone(req.body.mobileNumber)
  // console.log(user);
  // var phone = user.phone
  // var number = req.body.mobileNumber
  // console.log(number);
  // if (phone == number) {

  userHelpers.loginOtpRequest(req.body.mobileNumber).then((response) => {
    console.log(response);
    console.log(req.body);
    twilio
      .verify
      .services(OTP.serviceID)
      .verifications
      .create({
        to: `+91${response}`,
        channel: 'sms'
      }).then((data) => {
        codeSent = true
        let mobileNumber = response
        res.render('users/verify-OTP', {
          mobileNumber
        })
      })
  }).catch(() => {
    console.log('not a user');
    req.session.notUser = 'NO ACCOUNT FOUND'
    res.redirect('/OTP_login')
  })

  // }else{
  //   res.redirect('/OTP_login')
  // }
})

router.post('/OTP_verification', (req, res) => {
  console.log(req.body.code);
  console.log(req.body.mobileNumber);
  twilio
    .verify
    .services(OTP.serviceID)
    .verificationChecks
    .create({
      to: `+91${req.body.mobileNumber}`,
      code: req.body.code
    }).then((data) => {
      userHelpers.otpLogin(req.body.mobileNumber).then((response) => {
        console.log(response);
        req.session.userLoggedIn = response.status
        req.session.user = response.user

        res.redirect('/')
      }).catch((data) => {
        res.send('invalid OTP mister')
      })
    })
})

router.get('/checkout', verifyLogin, async (req, res) => {
  isUser = true
  let total = await userHelpers.getCartTotal(req.session.user._id)
  let userAddress =await userHelpers.getUserAddress(req.session.user._id)
  let cartCount =await userHelpers.getCartCount(req.session.user._id)
  let userData = req.session.user

  console.log('kitti ith thanne vegam aavatt',userAddress);

  
  
  
  res.render('users/checkout', {
    isUser,
    total,
    user: req.session.user,
    userAddress,
    cartCount,
    
  })

})

router.post('/place_order', async (req, res) => {
  let products = await userHelpers.getCartProductsList(req.body.userId)
  let totalPrice = await userHelpers.getCartTotal(req.body.userId)
  userHelpers.placeOrder(req.body, products, totalPrice).then((orderId) => {
    if (req.body['payment-method'] === 'COD') {
      res.json({
        codSuccess: "COD"
      })
    } else if (req.body['payment-method'] === 'paypal') {

      response.paypalTotal = totalPrice
      response.paypal = true
      res.json(response)
    } else {
      userHelpers.generateRazorpay(orderId, totalPrice).then((response) => {
        res.json(response)
      })
    }
  })
  console.log(req.body);
})

router.get('/paypal_order', (req, res) => {
  var payment = {
    "intent": "authorize",
    "payer": {
      "payment_method": "paypal"
    },
    "redirect_urls": {
      "return_url": "http://localhost:3000/order_success",
      "cancel_url": "http://localhost:3000/err"
    },
    "transactions": [{
      "amount": {
        "total": "1000",
        "currency": "INR"
      },
      "description": " a book on mean stack "
    }]
  }

  var createPay = ( payment ) => {
    return new Promise( ( resolve , reject ) => {
        paypal.payment.create( payment , function( err , payment ) {
         if ( err ) {
             reject(err); 
         }
        else {
            resolve(payment); 
        }
        }); 
    });
}			

  // call the create Pay method 
  createPay(payment)
    .then((transaction) => {
      var id = transaction.id;
      var links = transaction.links;
      var counter = links.length;
      while (counter--) {
        if (links[counter].method == 'REDIRECT') {
          // redirect to paypal where user approves the transaction 
          return res.redirect(links[counter].href)
        }
      }
    })
    .catch((err) => {
      console.log(err);
      res.redirect('/err');
    });
})

router.get('/order_success', verifyLogin, (req, res) => {
  res.render('users/order-success', {
    user: req.session.user
  })
})

router.get('/err',(req,res)=>{
  console.log(req.query); 
    res.send(req.query) 
})

router.get('/orders', verifyLogin, async (req, res) => {
  let orders = await userHelpers.getUserOrders(req.session.user._id)
  let userData = req.session.user
  let cartCount = await userHelpers.getCartCount(req.session.user._id)
  isUser = true
  userData = req.session.user
  res.render('users/orders', {
    user: req.session.user,
    orders,
    isUser,
    userData,
    cartCount
  })
})

router.get('/view_order_products/:id', async (req, res) => {
  console.log(req.params.id);
  let products = await userHelpers.getOrderProducts(req.params.id)
  console.log(products);
  isUserSubrouter = true
  res.render('users/view-ordered-products', {
    user: req.session.user,
    products,
    isUserSubrouter
  })
})

router.post('/verify_payment', (req, res) => {
  console.log(req.body);
  userHelpers.verifyPayment(req.body).then(() => {
    userHelpers.changePaymentStatus(req.body['order[receipt]']).then(() => {
      console.log('Payment successfull');
      res.json({
        status: true
      })
    })
  }).catch((err) => {
    // console.log(err);
    res.json({
      status: false,
      errMsg: ''
    })
  })
})

router.get('/men_collection', (req, res) => {
  productHelpers.getMenCollection().then((men) => {
    console.log(men);
    isUser = true
    res.render('users/men-collection', {
      men,
      isUser
    })
  })
})

router.get('/women_collection', (req, res) => {
  productHelpers.getWomenCollection().then((women) => {
    console.log(women);
    isUser = true
    res.render('users/women-collection', {
      women,
      isUser
    })
  })
})

router.get('/boys_collection', (req, res) => {
  productHelpers.getBoysCollection().then((boys) => {
    console.log(boys);
    isUser = true
    res.render('users/boys-collection', {
      boys,
      isUser
    })
  })
})

router.get('/girls_collection', (req, res) => {
  productHelpers.getGirlsCollection().then((girls) => {
    console.log(girls);
    isUser = true
    res.render('users/girls-collection', {
      girls,
      isUser
    })
  })
})

router.post('/verify_coupon', async(req,res) => {
  console.log('coupon routeril vannu',req.body);
  console.log(req.body);
  console.log('usere..',req.session.user._id);
  let total =await userHelpers.getCartTotal(req.session.user._id)
  console.log('total',total);
  adminHelpers.verifyCoupon(req.body).then((coupon)=>{
    console.log(coupon);
    if(coupon){
      console.log(coupon);
      discountPrice = total - coupon.amount
      console.log(discountPrice);
      res.json({originalPrice:total,discountPrice:discountPrice,discount:coupon.amount})
      // console.log('cart total**',total);
    }
  })
})

module.exports = router;