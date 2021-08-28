var express = require('express');
var app = express();
var path = require('path');
var bodyparser = require('body-parser');
var mongoose = require('mongoose');
var passport = require('passport');
var LocalStrategy = require('passport-local');
var User = require('./models/user');
var Job = require('./models/job.js');
var Applicant = require('./models/applicant.js');
var nodemailer = require('nodemailer');
const applicant = require('./models/applicant.js');


require('dotenv').config({ path: path.resolve(__dirname, './.env') });

var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'katochayushhp@gmail.com',
        pass: 'lovemyfamily1717@'
    }
});

mongoose.connect("mongodb://localhost:27017", { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true, useFindAndModify: false })
    .then(() =>
        console.log("Database is connected!"))

.catch((err) => console.error(err))

app.use(express.static(path.join(__dirname, '/public')));
//passport config
app.use(require("express-session")({
    secret: "This is the secret",
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


app.use(bodyparser.urlencoded({ extended: true }));

app.listen(5000, process.env.IP, function() {
    console.log("server started on port 5000");
});

let pageCounter = 0;

app.get("/", function(req, res) {
    pageCounter++
    res.render("index.ejs", { currentUser: req.user , pageCounter: pageCounter});
});
app.get("/search", function(req, res) {
    pageCounter++
    Job.find({}, function(err, alljobs) {
        if (err)
            console.log(err);
        else
            res.render("search.ejs", { jobs: alljobs, currentUser: req.user });
    });

});
app.get('/register', function(req, res) {
    pageCounter++
    res.render("register.ejs", { currentUser: req.user });
});
app.get('/dash', function(req, res) {
    pageCounter++
    Job.find({ userid: req.user._id }, function(err, jobs) {
        if (err)
            console.log(err)
        else {
            res.render("dash.ejs", { currentUser: req.user, jobs: jobs });
            console.log(jobs);
        }


    })

});





app.post("/register", function(req, res) {
    var newUser = new User({ username: req.body.username, email: req.body.email });
    User.register(newUser, req.body.password, function(err, user) {
        if (err) {
            console.log(err);
            res.redirect('/register');
        } else {
            var mailOptions = {
                from: 'katochayushhp@gmail.com',
                to: user.email,
                subject: 'SignUp Confirmation',
                text: 'Hi ' + user.username + ' . Welcome to Jan Swayam Seva family! Please provide your details and address for free health kit '
            };
            transporter.sendMail(mailOptions, function(error, info) {
                if (error) {
                    console.log(error);
                } else {
                    console.log('Email sent: ' + info.response);
                }
            });

            console.log(user);

            res.redirect('/');
        }
    });
});

app.get("/login", function(req, res, next) {
    pageCounter++
    res.render("login.ejs", { currentUser: req.user });
});
app.post('/login', passport.authenticate('local', { failureRedirect: '/login' }), function(req, res) {
    res.redirect('/dash');
});
app.get('/logout', function(req, res) {
    req.logout();
    res.redirect('/', )
});
app.get("/listnew", function(req, res, next) {
    res.render("listnew.ejs", { currentUser: req.user });
});
app.post("/search", function(req, res) {
    var jname = req.body.jname;
    var gender = req.body.gender;
    var units = req.body.units;
    var location = req.body.location;
    var pincode = req.body.pin;
    var email = req.body.email;
    var userid = req.user._id;
    var description = req.body.description;
    var newjob = { jname: jname, gender: gender, units: units, location: location, pincode: pincode, email: email, description: description, userid: userid };
    Job.create(newjob, function(err, newlycreated) {
        if (err)
            console.log(err);
        else {
            console.log(newlycreated);
            res.redirect("/search");

        }

    });

});
app.get("/search/:id/apply", function(req, res) {
    pageCounter++
    Job.findById(req.params.id, function(err, job) {
        if (err)
            console.log(err);
        else
            res.render("apply.ejs", { job: job, currentUser: req.user });
    })
})
app.post("/search/:id/applied", function(req, res) {
    Job.findById(req.params.id, function(err, job) {
        if (err) {
            console.log(err);
            res.redirect("/search");
        } else {
            Applicant.create(req.body.applicant, function(err, applicant) {
                if (err)
                    console.log(err);
                else {
                    job.applicants.push(applicant);
                    job.save();
                    console.log(job.applicants);
                    var mailOptions = {
                        from: 'khetsabha@gmail.com',
                        to: job.email,
                        subject: 'Product/Supply Materil Application Received',
                        text: 'Hi! .' + applicant.name + " just applied for your listed product. You can contact them at " + applicant.contact
                    };
                    transporter.sendMail(mailOptions, function(error, info) {
                        if (error) {
                            console.log(error);
                        } else {
                            console.log('Email sent: ' + info.response);
                        }
                    });

                    res.render('applied.ejs', { currentUser: req.user })
                }
            });

        }
    });
});
app.post("/search/result", function(req, res) {
    var job = req.body.job;
    var pin = req.body.pin;
    Job.find({ jname: job, pincode: pin }, function(err, jobs) {
        if (err)
            console.log(err);
        else
            res.render('search.ejs', { jobs: jobs, currentUser: req.user })
    })
});
app.get("/about", function(req, res, next) {
    pageCounter++
    res.render("about.ejs", { currentUser: req.user });
});

app.post('/', function(req, res) {
    var mailOptions = {
        from: 'khetsabha@gmail.com',
        to: req.body.email,
        subject: 'Feedback Confirmation',
        text: 'Welcome ' + req.body.name + ' to Khet Sabha family!.Thanks for your Feedback!'
    };
    transporter.sendMail(mailOptions, function(error, info) {
        if (error) {
            console.log(error);
        } else {
            console.log('Email sent: ' + info.response);
        }
    });
    res.redirect('/');
});
app.get("/dash/:id/applicants", function(req, res) {
    Job.findById(req.params.id).populate("applicants").exec(function(err, foundjob) {
        if (err)
            console.log(err)
        else
            res.render('applicant.ejs', { currentUser: req.user, job: foundjob })
    })
});
