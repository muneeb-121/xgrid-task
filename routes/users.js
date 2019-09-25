const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const passport = require('passport');
const axios = require('axios');

// Load User model
const User = require('../models/user');
const Place = require('../models/places');
const { forwardAuthenticated } = require('../config/auth');
const {ensureAuthenticated} = require('../config/auth');

// Login Page
router.get('/login', forwardAuthenticated, (req, res) => res.render('login'));

// Register Page
router.get('/register', forwardAuthenticated, (req, res) => res.render('register'));

// Favourite Places
router.get('/favPlaces',ensureAuthenticated,(req,res)=>{
  Place.find({userId:req.user._id}).then(response=>{
    res.render('favPlaces',{favPlaces:response});
  }).catch(err=>{
    return err;
  });
});

//Delete a palace
router.post('/deleteplace',ensureAuthenticated,(req,res)=>{
  //console.log(req);
  Place.findOneAndDelete({placeId:req.body.placeId}).then(response=>{
    return response;
  }).catch(err=>{
    return err;
  });
  res.redirect('/users/favPlaces');
});

// Add Favourite Places
router.post('/addplacegoogle',ensureAuthenticated,(req,res)=>{
  Place.findOne({placeId:req.body.placeId}).then(place=>{
    if(place==null){
      const newplace = new Place({userId:req.user._id,placeId:req.body.placeId,favplace:req.body});
      newplace.save();
      res.redirect('/dashboard');
    }
    res.redirect('/dashboard');
  }).catch(err=>{
    return err;
  });

});

router.post('/addplacebing',ensureAuthenticated,(req,res)=>{
  Place.findOne({favplace:req.body}).then(place=>{
    if(place==null){
      const newplace = new Place({userId:req.user._id,favplace:req.body});
      newplace.save();
      res.redirect('/dashboard');
    }
    res.redirect('/dashboard');
  }).catch(err=>{
    return err;
  });

});

// Register
router.post('/register', (req, res) => {
  const { name, email, password, password2 } = req.body;
  let errors = [];

  if (!name || !email || !password || !password2) {
    errors.push({ msg: 'Please enter all fields' });
  }

  if (password != password2) {
    errors.push({ msg: 'Passwords do not match' });
  }

  if (password.length < 6) {
    errors.push({ msg: 'Password must be at least 6 characters' });
  }

  if (errors.length > 0) {
    res.render('register', {
      errors,
      name,
      email,
      password,
      password2
    });
  } else {
    User.findOne({ email: email }).then(user => {
      if (user) {
        errors.push({ msg: 'Email already exists' });
        res.render('register', {
          errors,
          name,
          email,
          password,
          password2
        });
      } else {
        const newUser = new User({
          name,
          email,
          password
        });

        bcrypt.genSalt(10, (err, salt) => {
          bcrypt.hash(newUser.password, salt, (err, hash) => {
            if (err) throw err;
            newUser.password = hash;
            newUser
              .save()
              .then(user => {
                req.flash(
                  'success_msg',
                  'You are now registered and can log in'
                );
                res.redirect('/users/login');
              })
              .catch(err => console.log(err));
          });
        });
      }
    });
  }
});

// Login
router.post('/login', (req, res, next) => {
  passport.authenticate('local', {
    successRedirect: '/dashboard',
    failureRedirect: '/users/login',
    failureFlash: true
  })(req, res, next);
});

// Logout
router.get('/logout', (req, res) => {
  req.logout();
  req.flash('success_msg', 'You are logged out');
  res.redirect('/users/login');
});

//search
router.post('/search',(req,res)=>{
  if(req.body.searchengine=='Google'){
    googleApiCall(req.body.searchstring).then(apiResponse=>{
      res.render('searchplaces',{searchedplace:apiResponse.data.candidates,searchengine:req.body.searchengine});
    }).catch(err=>{
      return err;
    });
  }
  else if(req.body.searchengine=='Bing'){
    bingApiCall(req.body.searchstring).then(apiResponse=>{
      res.render('searchplaces',{searchedplace:apiResponse.data.resourceSets[0].resources,searchengine:req.body.searchengine});      
    }).catch(err=>{
      return err;
    });
  }
});

//mapView
router.get('/viewmap',ensureAuthenticated,(req,res)=>{

  res.render('viewmap',{userId:req.user._id});
});

//markpoints
router.post('/viewmap',(req,res)=>{

  let markers=[]
  Place.find({userId:req.user._id}).then(response=>{
    response.forEach(x=>{
      let marker = {coords:{lat:parseFloat(x.favplace.lat),lng:parseFloat(x.favplace.lng)},content:'<h4>'+x.favplace.name+'</h4>'};
      markers.push(marker);
    });
    res.send({markers:markers,userId:req.user._id});
  }).catch(err=>{
    return err;
  });
});

function googleApiCall(searchstring){

  const apiKey = 'YOUR API KEY';
  return axios.get('https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input='+searchstring+'&inputtype=textquery&fields=formatted_address,place_id,rating,user_ratings_total,types,photos,name,rating,geometry&key='+apiKey);
};

function bingApiCall(searchstring){

  const apiKey = 'YOUR API KEY';
  return axios.get('https://dev.virtualearth.net/REST/v1/LocalSearch/?query='+searchstring+'&userLocation=37.0902,-95.7129&key='+apiKey);
}

module.exports = router;
