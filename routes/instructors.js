var express = require('express');
var router = express.Router();
var assign = require('object-assign');
var only = require('only');
var uploader = require('../uploaders/avatarUploader');

Class = require('../models/class');
Instructor = require('../models/instructor');
User = require('../models/user');

router.get('/:id/profile', function(req, res, next) {
	var user_id = req.params.id;
	Instructor.findOne({user_id: user_id}, function(err, instructor) {
		if(err) {
			res.send(err);
		}
		else {
			res.render('instructors/edit', {"instructor": instructor});
		}
	});
});

router.post('/:id/update', function(req, res, next) {
	User.findById(req.params.id, function(err, user) {
		if(err) {
			res.send(err);
		}
		else {
			assign(user, user_params(req));
			uploader.upload(user, req.files['avatar'][0], function(user) {
				user.save(function(err) {
					if(err) {
						res.send(err);
					}
					else {
						Instructor.findOne({user_id: req.params.id}, function(err, instructor) {
							assign(instructor, instructor_params(req));
							instructor.save(function(err) {
								if(err) {
									res.send(err);
								}
								else {
									res.locals.user = user;
									res.redirect('/');
								}
							});
						});
					}
				});
			});
		}
	});
});

router.get('/classes', ensureAuthenticated, function(req, res, next){
	Instructor.getInstructorByUsername(req.user.username, function(err, instructor){
		if (err) {
			console.log(err);
			res.send(err);
		} else {
			//console.log(instructor.classes);
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
		req.flash('success', 'You are now registed as an Instructor');
		res.redirect('/instructors/classes');
	});
});

router.get('/classes/:id/lessons/new', ensureAuthenticated, function(req, res, next){	
	res.render('instructors/newlesson', {class_id: req.params.id});	
});

router.post('/classes/:id/lessons/new', function(req, res){
	var info = {
		class_id: req.params.id,
		lesson_number : req.body.lesson_number,
		lesson_title : req.body.lesson_title,
		lesson_body : req.body.lesson_body
	}
	// Form Field Validation
	try{
		req.checkBody('lesson_number', 'Lesson number name is required').notEmpty();
		req.checkBody('lesson_title', 'Lesson title is required').notEmpty();
		req.checkBody('lesson_body', 'Lesson content is required').notEmpty();

		var errors = req.validationErrors();
	}
	catch(err){
		console.log(err);
	}

	if (errors) {
		console.log("Errors: ", errors);
		console.log('/instructors/classes/'+ info.class_id + '/lessons/new');
		try{
			res.render('instructors/newlesson', {
				errors: errors,
				info: info,
				class_id: info.class_id
			});
		} catch(err){
			console.log(err);
			}
	} else {
		Class.addLesson(info, function(err, lesson){
			if (err) throw err;
			console.log("lesson :  ", lesson);
		});
		req.flash('success', 'You are added a new lesson');
		res.redirect('/instructors/classes');		
	}	
});

router.get('/classes/new', ensureAuthenticated, function(req, res, next){	
	res.render('instructors/newClass');	
});

router.post('/classes/new', ensureAuthenticated, function(req, res, next){
	var newClass = new Class({
		title: req.body.class_title,
		description : req.body.class_description,
		// instructor: req.user.username
		_instructor: {name: req.user.username, avatar_url: req.user.avatar_url}
	});

	Class.saveClass(newClass, function(err, newClass){
		if (err) throw err;
		console.log("class :  ", newClass);
		var info = {
			instructor_username : req.user.username,
			class_id : newClass._id,
			class_title : newClass.title
		}
		Instructor.saveClass(info, function(err, instructor){
			if (err) throw err;
			console.log(instructor);
			req.flash('success', 'You are added a new class');
			res.redirect('/instructors/classes');
		});
	});
});

router.get('/classes/:id/edit', ensureAuthenticated, function(req, res, next){	
	Class.getClassesById(req.params.id, function(err, classDetails){
		if (err) throw err;
		res.render('instructors/editClass', {"class": classDetails});	
	});
});

router.post('/classes/:id/update', ensureAuthenticated, function(req, res){	
	var info = {
		instructor_username: req.user.username,
		class_id : req.params.id,
		class_title : req.body.class_title,
		class_description : req.body.class_description
	}
	Class.updateClass(info, function(err, newClass){
		if (err) throw err;
		//console.log("class :  ", newClass);
		console.log(req.user.id);
		Instructor.findOne({user_id: req.user._id}, function(err, instructor){
			if (err) throw err;
			console.log("Instructor :  ", instructor);
			for ($i=0; $i<instructor.classes.length; $i++) {
				if (instructor.classes[$i].class_id == info.class_id) {
					instructor.classes[$i].class_title = info.class_title;
					break;
				}
			}
			instructor.save(function(err, instructor){
				if (err) throw err;
				//console.log("Instructor update:  ", instructor);
					req.flash('success', 'You are added a new class');
					res.redirect('/instructors/classes');
			});
		});
	});
});

router.post('/classes/:id/drop', ensureAuthenticated, function(req, res){	
	var info = {
		instructor_username: req.user.username,
		class_id : req.params.id,
	}
	Class.destroyClass(info, function(err){
		console.log(err);
		if (err) throw err;
		Instructor.getInstructorByUsername(req.user.username, function(err, instructor){
			if (err) throw err;
			//console.log("Instructor finded:  ", instructor.classes[0].class_id[0]==info.class_id);

			instructor.classes = instructor.classes.filter(function(classDetails){return classDetails.class_id[0] != info.class_id});
			/*for ($i=0; $i<instructor.classes.length; $i++) {
				if (instructor.classes[$i].class_id == info.class_id) {
					instructor.classes[$i].remove();
					break;
				}
			}*/

			console.log("Instructor dede:  ", instructor.classes);
			instructor.save(function(err, instructor){
				if (err) throw err;
				console.log("Instructor update:  ", instructor);
				req.flash('success', 'You are added a new class');
				res.redirect('/instructors/classes');
			});
		});
	});
});

function ensureAuthenticated(req, res, next) {
	if (req.isAuthenticated()) {
		return next();
	}
	res.redirect('/');
}

function instructor_params(req) {
	return only(req.body, 'first_name last_name email');
}

function user_params(req) {
	return only(req.body, 'username email')
}

module.exports = router;