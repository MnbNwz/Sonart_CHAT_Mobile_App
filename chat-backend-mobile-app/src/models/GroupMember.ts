import mongoose from 'mongoose';
import GroupChat from './GroupChat.js';
import User from './User.js';

export default mongoose.model(
	'GroupMember',
	new mongoose.Schema({

		groupChat:Object,
	})
);
