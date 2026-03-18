const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const { auth } = require('../middleware/auth');
const Answer = require('../models/Answer');
const Question = require('../models/Question');
const User = require('../models/User');

router.post(
  '/:questionId',
  [auth, [check('body', 'Answer body is required').not().isEmpty()]],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const question = await Question.findById(req.params.questionId);
      if (!question) {
        return res.status(404).json({ message: 'Question not found' });
      }

      const answer = new Answer({
        body: req.body.body,
        question: question._id,
        author: req.user.id
      });

      await answer.save();

      question.answers.push(answer._id);
      await question.save();

      await answer.populate('author', 'username avatar reputation');

      const answerData = answer.toObject();
      answerData.voteCount = 0;

      res.status(201).json(answerData);
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ message: 'Server Error' });
    }
  }
);

router.put('/accept/:id', auth, async (req, res) => {
  try {
    const answer = await Answer.findById(req.params.id)
      .populate('question', 'author');

    if (!answer) {
      return res.status(404).json({ message: 'Answer not found' });
    }

    if (answer.question.author.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    answer.isAccepted = !answer.isAccepted;
    
    if (answer.isAccepted) {
      await Answer.updateMany(
        { 
          question: answer.question._id, 
          _id: { $ne: answer._id },
          isAccepted: true 
        },
        { $set: { isAccepted: false } }
      );
      
      const answerAuthor = await User.findById(answer.author);
      answerAuthor.reputation = (answerAuthor.reputation || 0) + 15;
      await answerAuthor.save();
    }

    await answer.save();
    
    await answer.populate('author', 'username avatar reputation');
    await answer.populate('question', 'author');
    
    const voteCount = answer.votes ? answer.votes.reduce((sum, vote) => sum + vote.value, 0) : 0;
    const answerData = answer.toObject();
    answerData.voteCount = voteCount;
    answerData.votes = undefined;
    
    res.json(answerData);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

router.put('/vote/:id', auth, async (req, res) => {
  try {
    const answer = await Answer.findById(req.params.id);
    if (!answer) {
      return res.status(404).json({ message: 'Answer not found' });
    }

    const { value } = req.body;
    if (![1, -1].includes(value)) {
      return res.status(400).json({ message: 'Vote value must be 1 or -1' });
    }

    const voteIndex = answer.votes.findIndex(
      vote => vote.user.toString() === req.user.id
    );

    if (voteIndex >= 0) {
      if (answer.votes[voteIndex].value === value) {
        answer.votes.splice(voteIndex, 1);
      } else {
        answer.votes[voteIndex].value = value;
      }
    } else {
      answer.votes.push({ user: req.user.id, value });
    }

    await answer.save();
    
    if (answer.author.toString() !== req.user.id) {
      const author = await User.findById(answer.author);
      const repChange = value > 0 ? 10 : -2;
      author.reputation = Math.max(0, (author.reputation || 0) + repChange);
      await author.save();
    }

    const voteCount = answer.votes ? answer.votes.reduce((sum, vote) => sum + vote.value, 0) : 0;
    const answerData = answer.toObject();
    answerData.voteCount = voteCount;
    answerData.votes = undefined;

    await answer.populate('author', 'username avatar reputation');
    answerData.author = answer.author;

    res.json(answerData);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const answer = await Answer.findById(req.params.id);

    if (!answer) {
      return res.status(404).json({ message: 'Answer not found' });
    }

    if (answer.author.toString() !== req.user.id && !req.user.isAdmin) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    await Question.updateOne(
      { _id: answer.question },
      { $pull: { answers: answer._id } }
    );

    await answer.remove();
    res.json({ message: 'Answer removed' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Answer not found' });
    }
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;
