var express = require('express');
var router = express.Router();

Class = require('../models/class');
Instructor = require('../models/instructor');
User = require('../models/user');

router.get('/classes', ensureAuthenticated, function(req, res, next){
	Instructor.getInstructorByUsername(req.user.username, function(err, instructor){
		if (err) {
			console.log(err);
			res.send(err);
		} else {
			res.render('instructors/classes', {"instructor": instructor});
		}
	});
});

router.post('/classes/register', function(req, res){
	var info = {
		instructor_username : req.user.username,
		class_id : req.body.class_id,
		class_title : req.body.class_title
	}
	
	Instructor.register(info, function(err, instructor){
		if (err) throw err;
		console.log(instructor);
	});
	req.flash('success', 'You are now registed as an Instructor');
	res.redirect('/instructors/classes');
});

router.get('/classes/:id/lessons/new', ensureAuthenticated, function(req, res, next){	
	res.render('instructors/newlesson', {"class_id": req.params.id});	
});

router.post('/classes/:id/lessons/new', function(req, res){
	var info = {
		class_id: req.params.id,
		lesson_number : req.body.lesson_number,
		lesson_title : req.body.lesson_title,
		lesson_body : req.body.lesson_body
	}
	
	Class.addLesson(info, function(err, lesson){
		if (err) throw err;
		console.log("lesson :  ", lesson);
	});
	req.flash('success', 'You are added a new lesson');
	res.redirect('/instructors/classes');
});

function ensureAuthenticated(req, res, next) {
	if (req.isAuthenticated()) {
		return next();
	}
	res.redirect('/');
}

module.exports = router;