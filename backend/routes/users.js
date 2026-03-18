const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const { auth } = require('../middleware/auth');
const User = require('../models/User');
const Question = require('../models/Question');
const Answer = require('../models/Answer');

router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

router.get('/:username', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username })
      .select('-password -email')
      .lean();

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const questions = await Question.find({ author: user._id })
      .select('title views answers votes createdAt')
      .populate('answers')
      .sort('-createdAt')
      .limit(10)
      .lean();

    const questionsWithCounts = questions.map(question => {
      const voteCount = question.votes ? question.votes.reduce((sum, vote) => sum + vote.value, 0) : 0;
      const answerCount = question.answers ? question.answers.length : 0;
      return {
        _id: question._id,
        title: question.title,
        views: question.views || 0,
        voteCount,
        answerCount,
        createdAt: question.createdAt,
      };
    });

    const answers = await Answer.find({ author: user._id })
      .populate('question', 'title _id')
      .select('body question votes isAccepted createdAt')
      .sort('-createdAt')
      .limit(10)
      .lean();

    const answersWithCounts = answers.map(answer => {
      const voteCount = answer.votes ? answer.votes.reduce((sum, vote) => sum + vote.value, 0) : 0;
      return {
        _id: answer._id,
        question: answer.question,
        voteCount,
        isAccepted: answer.isAccepted || false,
        createdAt: answer.createdAt,
      };
    });

    const questionCount = await Question.countDocuments({ author: user._id });
    const answerCount = await Answer.countDocuments({ author: user._id });

    res.json({
      ...user,
      questions: questionsWithCounts,
      answers: answersWithCounts,
      questionCount,
      answerCount,
    });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(500).send('Server Error');
  }
});

router.put(
  '/profile',
  [
    auth,
    [
      check('bio', 'Bio must be less than 500 characters').isLength({ max: 500 })
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { bio, avatar } = req.body;
    const profileFields = {};
    
    if (bio !== undefined) profileFields.bio = bio;
    if (avatar !== undefined) profileFields.avatar = avatar;

    try {
      let user = await User.findByIdAndUpdate(
        req.user.id,
        { $set: profileFields },
        { new: true }
      ).select('-password');

      res.json(user);
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ message: 'Server Error' });
    }
  }
);

router.get('/:username/questions', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { page = 1, limit = 10 } = req.query;
    
    const questions = await Question.find({ author: user._id })
      .sort('-createdAt')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('author', 'username avatar')
      .lean();

    const count = await Question.countDocuments({ author: user._id });

    res.json({
      questions,
      totalPages: Math.ceil(count / limit),
      currentPage: page
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

router.get('/:username/answers', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { page = 1, limit = 10 } = req.query;
    
    const answers = await Answer.find({ author: user._id })
      .sort('-createdAt')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('question', 'title')
      .populate('author', 'username avatar')
      .lean();

    const count = await Answer.countDocuments({ author: user._id });

    res.json({
      answers,
      totalPages: Math.ceil(count / limit),
      currentPage: page
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
