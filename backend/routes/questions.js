const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const { auth } = require('../middleware/auth');
const Question = require('../models/Question');
const User = require('../models/User');

router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, sort = '-createdAt', search, tag } = req.query;
    const query = {};
    
    if (search) {
      query.$text = { $search: search };
    }
    
    if (tag) {
      query.tags = tag;
    }

    const questions = await Question.find(query)
      .populate('author', 'username avatar')
      .populate('answers')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean()
      .exec();

    const questionsWithCounts = questions.map(question => {
      const voteCount = question.votes ? question.votes.reduce((sum, vote) => sum + vote.value, 0) : 0;
      const answerCount = question.answers ? question.answers.length : 0;
      return {
        ...question,
        voteCount,
        answerCount,
        votes: undefined
      };
    });

    const count = await Question.countDocuments(query);

    res.json({
      questions: questionsWithCounts,
      totalPages: Math.ceil(count / limit),
      currentPage: page
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const question = await Question.findById(req.params.id)
      .populate('author', 'username avatar reputation')
      .populate({
        path: 'answers',
        populate: {
          path: 'author',
          select: 'username avatar reputation'
        },
        options: { sort: { isAccepted: -1, score: -1 } }
      });

    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    question.views += 1;
    await question.save();

    const voteCount = question.votes ? question.votes.reduce((sum, vote) => sum + vote.value, 0) : 0;
    const answerCount = question.answers ? question.answers.length : 0;
    
    const processedAnswers = (question.answers || []).map(answer => {
      const answerVoteCount = answer.votes ? answer.votes.reduce((sum, vote) => sum + vote.value, 0) : 0;
      const answerData = answer.toObject ? answer.toObject() : answer;
      return {
        ...answerData,
        voteCount: answerVoteCount,
        votes: undefined,
      };
    });
    
    const questionData = question.toObject();
    questionData.voteCount = voteCount;
    questionData.answerCount = answerCount;
    questionData.votes = undefined;
    questionData.answers = processedAnswers;
    
    res.json(questionData);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Question not found' });
    }
    res.status(500).json({ message: 'Server Error' });
  }
});

router.post(
  '/',
  [
    auth,
    [
      check('title', 'Title is required').not().isEmpty(),
      check('body', 'Body is required').not().isEmpty(),
      check('tags', 'At least one tag is required').isArray({ min: 1 })
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { title, body, tags } = req.body;

      const question = new Question({
        title,
        body,
        tags: tags.map(tag => tag.toLowerCase().trim()),
        author: req.user.id
      });

      await question.save();
      
      const Community = require('../models/Community');
      for (const tag of tags) {
        await Community.findOneAndUpdate(
          { name: tag.toLowerCase() },
          { $inc: { postCount: 1 } },
          { upsert: false }
        );
      }
      
      await question.populate('author', 'username avatar');

      const questionData = question.toObject();
      questionData.voteCount = 0;
      questionData.answerCount = 0;

      res.status(201).json(questionData);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

router.put('/vote/:id', auth, async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    const { value } = req.body;
    if (![1, -1].includes(value)) {
      return res.status(400).json({ message: 'Vote value must be 1 or -1' });
    }

    const voteIndex = question.votes.findIndex(
      vote => vote.user.toString() === req.user.id
    );

    if (voteIndex >= 0) {
      if (question.votes[voteIndex].value === value) {
        question.votes.splice(voteIndex, 1);
      } else {
        question.votes[voteIndex].value = value;
      }
    } else {
      question.votes.push({ user: req.user.id, value });
    }

    await question.save();
    
    if (question.author.toString() !== req.user.id) {
      const author = await User.findById(question.author);
      const repChange = value > 0 ? 10 : -2;
      author.reputation = Math.max(0, (author.reputation || 0) + repChange);
      await author.save();
    }

    await question.populate('answers');
    
    const voteCount = question.votes ? question.votes.reduce((sum, vote) => sum + vote.value, 0) : 0;
    const answerCount = question.answers ? question.answers.length : 0;
    
    const questionData = question.toObject();
    questionData.voteCount = voteCount;
    questionData.answerCount = answerCount;
    questionData.votes = undefined;
    
    res.json(questionData);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);

    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    if (question.author.toString() !== req.user.id && !req.user.isAdmin) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    await question.remove();
    res.json({ message: 'Question removed' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Question not found' });
    }
    res.status(500).send('Server Error');
  }
});

module.exports = router;
