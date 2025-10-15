'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';
import { useWallet } from './WalletProvider';
import { useSocialFeatures } from '../hooks/useSocialFeatures';

interface SocialFeaturesProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SharedINFT {
  id: string;
  name: string;
  description: string;
  owner: string;
  sharedAt: Date;
  likes: number;
  comments: number;
  category: string;
  isLiked: boolean;
  imageUrl?: string;
}

interface Challenge {
  id: string;
  title: string;
  description: string;
  creator: string;
  participants: number;
  reward: string;
  deadline: Date;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  status: 'Active' | 'Completed' | 'Upcoming';
  category: string;
}

interface CollaborativeProject {
  id: string;
  title: string;
  description: string;
  creator: string;
  collaborators: string[];
  progress: number;
  targetGoal: string;
  createdAt: Date;
  status: 'Open' | 'In Progress' | 'Completed';
  requiredSkills: string[];
}

const SocialFeatures: React.FC<SocialFeaturesProps> = ({ isOpen, onClose }) => {
  const { wallet } = useWallet();
  const isConnected = wallet.isConnected;
  const address = wallet.address;
  const {
    sharedINFTs,
    challenges,
    collaborativeProjects,
    shareINFT,
    likeINFT,
    commentOnINFT,
    joinChallenge,
    createChallenge,
    joinCollaboration,
    createCollaboration,
    loading
  } = useSocialFeatures();

  const [activeTab, setActiveTab] = useState<'feed' | 'challenges' | 'collaborate'>('feed');
  const [showShareModal, setShowShareModal] = useState(false);
  const [showCreateChallengeModal, setShowCreateChallengeModal] = useState(false);
  const [showCreateCollabModal, setShowCreateCollabModal] = useState(false);
  const [selectedINFT, setSelectedINFT] = useState<string>('');
  const [shareDescription, setShareDescription] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  // Challenge creation form
  const [challengeForm, setChallengeForm] = useState({
    title: '',
    description: '',
    reward: '',
    deadline: '',
    difficulty: 'Medium' as const,
    category: 'AI Training'
  });

  // Collaboration creation form
  const [collabForm, setCollabForm] = useState({
    title: '',
    description: '',
    targetGoal: '',
    requiredSkills: [] as string[],
    maxCollaborators: 5
  });

  const categories = ['All', 'AI Training', 'Data Science', 'Neural Networks', 'Computer Vision', 'NLP'];
  const difficulties = ['Easy', 'Medium', 'Hard'];
  const skillOptions = ['Machine Learning', 'Deep Learning', 'Data Analysis', 'Python', 'TensorFlow', 'PyTorch', 'Computer Vision', 'NLP'];

  const handleShareINFT = async () => {
    if (!selectedINFT || !shareDescription.trim()) return;
    
    try {
      await shareINFT(selectedINFT, shareDescription);
      setShowShareModal(false);
      setSelectedINFT('');
      setShareDescription('');
    } catch (error) {
      console.error('Error sharing INFT:', error);
    }
  };

  const handleCreateChallenge = async () => {
    if (!challengeForm.title || !challengeForm.description) return;
    
    try {
      await createChallenge(challengeForm);
      setShowCreateChallengeModal(false);
      setChallengeForm({
        title: '',
        description: '',
        reward: '',
        deadline: '',
        difficulty: 'Medium',
        category: 'AI Training'
      });
    } catch (error) {
      console.error('Error creating challenge:', error);
    }
  };

  const handleCreateCollaboration = async () => {
    if (!collabForm.title || !collabForm.description) return;
    
    try {
      await createCollaboration(collabForm);
      setShowCreateCollabModal(false);
      setCollabForm({
        title: '',
        description: '',
        targetGoal: '',
        requiredSkills: [],
        maxCollaborators: 5
      });
    } catch (error) {
      console.error('Error creating collaboration:', error);
    }
  };

  const filteredINFTs = filterCategory === 'all' 
    ? sharedINFTs 
    : sharedINFTs.filter(inft => inft.category.toLowerCase() === filterCategory.toLowerCase());

  const filteredChallenges = filterCategory === 'all'
    ? challenges
    : challenges.filter(challenge => challenge.category.toLowerCase() === filterCategory.toLowerCase());

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-6xl h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <Icon icon="mdi:account-group" className="w-8 h-8 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Social Features</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <Icon icon="mdi:close" className="w-6 h-6 text-gray-500" />
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            {[
              { id: 'feed', label: 'Community Feed', icon: 'mdi:home' },
              { id: 'challenges', label: 'Challenges', icon: 'mdi:trophy' },
              { id: 'collaborate', label: 'Collaborate', icon: 'mdi:account-multiple' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-6 py-4 font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <Icon icon={tab.icon} className="w-5 h-5" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {!isConnected ? (
              <div className="text-center py-12">
                <Icon icon="mdi:wallet" className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Connect Your Wallet
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Connect your wallet to access social features and interact with the community.
                </p>
              </div>
            ) : (
              <>
                {/* Community Feed Tab */}
                {activeTab === 'feed' && (
                  <div className="space-y-6">
                    {/* Actions Bar */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <select
                          value={filterCategory}
                          onChange={(e) => setFilterCategory(e.target.value)}
                          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                          {categories.map(category => (
                            <option key={category} value={category.toLowerCase()}>
                              {category}
                            </option>
                          ))}
                        </select>
                      </div>
                      <button
                        onClick={() => setShowShareModal(true)}
                        className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                      >
                        <Icon icon="mdi:share" className="w-5 h-5" />
                        <span>Share INFT</span>
                      </button>
                    </div>

                    {/* Shared INFTs Feed */}
                    <div className="grid gap-6">
                      {filteredINFTs.map((inft) => (
                        <motion.div
                          key={inft.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6"
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                                <span className="text-white font-semibold">
                                  {inft.owner.slice(0, 2).toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <h3 className="font-semibold text-gray-900 dark:text-white">
                                  {inft.name}
                                </h3>
                                <p className="text-sm text-gray-500">
                                  by {inft.owner.slice(0, 6)}...{inft.owner.slice(-4)}
                                </p>
                              </div>
                            </div>
                            <span className="text-xs text-gray-500">
                              {inft.sharedAt.toLocaleDateString()}
                            </span>
                          </div>
                          
                          <p className="text-gray-700 dark:text-gray-300 mb-4">
                            {inft.description}
                          </p>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <button
                                onClick={() => likeINFT(inft.id)}
                                className={`flex items-center space-x-1 ${
                                  inft.isLiked ? 'text-red-500' : 'text-gray-500'
                                } hover:text-red-500 transition-colors`}
                              >
                                <Icon icon={inft.isLiked ? 'mdi:heart' : 'mdi:heart-outline'} className="w-5 h-5" />
                                <span>{inft.likes}</span>
                              </button>
                              <button className="flex items-center space-x-1 text-gray-500 hover:text-blue-500 transition-colors">
                                <Icon icon="mdi:comment-outline" className="w-5 h-5" />
                                <span>{inft.comments}</span>
                              </button>
                            </div>
                            <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full">
                              {inft.category}
                            </span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Challenges Tab */}
                {activeTab === 'challenges' && (
                  <div className="space-y-6">
                    {/* Actions Bar */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <select
                          value={filterCategory}
                          onChange={(e) => setFilterCategory(e.target.value)}
                          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                          {categories.map(category => (
                            <option key={category} value={category.toLowerCase()}>
                              {category}
                            </option>
                          ))}
                        </select>
                      </div>
                      <button
                        onClick={() => setShowCreateChallengeModal(true)}
                        className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
                      >
                        <Icon icon="mdi:plus" className="w-5 h-5" />
                        <span>Create Challenge</span>
                      </button>
                    </div>

                    {/* Challenges Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {filteredChallenges.map((challenge) => (
                        <motion.div
                          key={challenge.id}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-700 rounded-xl p-6 border border-gray-200 dark:border-gray-600"
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center space-x-2">
                              <Icon icon="mdi:trophy" className="w-6 h-6 text-yellow-500" />
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                challenge.difficulty === 'Easy' ? 'bg-green-100 text-green-800' :
                                challenge.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {challenge.difficulty}
                              </span>
                            </div>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              challenge.status === 'Active' ? 'bg-green-100 text-green-800' :
                              challenge.status === 'Completed' ? 'bg-gray-100 text-gray-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {challenge.status}
                            </span>
                          </div>
                          
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                            {challenge.title}
                          </h3>
                          <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                            {challenge.description}
                          </p>
                          
                          <div className="space-y-2 mb-4">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-500">Participants:</span>
                              <span className="font-medium">{challenge.participants}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-500">Reward:</span>
                              <span className="font-medium text-green-600">{challenge.reward}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-500">Deadline:</span>
                              <span className="font-medium">{challenge.deadline.toLocaleDateString()}</span>
                            </div>
                          </div>
                          
                          <button
                            onClick={() => joinChallenge(challenge.id)}
                            disabled={challenge.status !== 'Active'}
                            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-2 rounded-lg transition-colors"
                          >
                            {challenge.status === 'Active' ? 'Join Challenge' : 'Challenge Ended'}
                          </button>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Collaborate Tab */}
                {activeTab === 'collaborate' && (
                  <div className="space-y-6">
                    {/* Actions Bar */}
                    <div className="flex items-center justify-end">
                      <button
                        onClick={() => setShowCreateCollabModal(true)}
                        className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
                      >
                        <Icon icon="mdi:plus" className="w-5 h-5" />
                        <span>Start Collaboration</span>
                      </button>
                    </div>

                    {/* Collaborative Projects */}
                    <div className="grid gap-6">
                      {collaborativeProjects.map((project) => (
                        <motion.div
                          key={project.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900 dark:to-pink-900 rounded-xl p-6 border border-purple-200 dark:border-purple-700"
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                                {project.title}
                              </h3>
                              <p className="text-gray-600 dark:text-gray-400 mb-3">
                                {project.description}
                              </p>
                            </div>
                            <span className={`text-xs px-3 py-1 rounded-full ${
                              project.status === 'Open' ? 'bg-green-100 text-green-800' :
                              project.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {project.status}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div>
                              <span className="text-sm text-gray-500">Progress</span>
                              <div className="mt-1">
                                <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                  <div 
                                    className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${project.progress}%` }}
                                  />
                                </div>
                                <span className="text-sm font-medium">{project.progress}%</span>
                              </div>
                            </div>
                            <div>
                              <span className="text-sm text-gray-500">Collaborators</span>
                              <p className="font-medium">{project.collaborators.length}/5</p>
                            </div>
                            <div>
                              <span className="text-sm text-gray-500">Created</span>
                              <p className="font-medium">{project.createdAt.toLocaleDateString()}</p>
                            </div>
                          </div>
                          
                          <div className="mb-4">
                            <span className="text-sm text-gray-500">Required Skills:</span>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {project.requiredSkills.map((skill, index) => (
                                <span
                                  key={index}
                                  className="text-xs bg-purple-100 dark:bg-purple-800 text-purple-800 dark:text-purple-200 px-2 py-1 rounded-full"
                                >
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                          
                          <button
                            onClick={() => joinCollaboration(project.id)}
                            disabled={project.status === 'Completed' || project.collaborators.length >= 5}
                            className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white py-2 rounded-lg transition-colors"
                          >
                            {project.status === 'Completed' ? 'Project Completed' : 
                             project.collaborators.length >= 5 ? 'Project Full' : 'Join Collaboration'}
                          </button>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </motion.div>

        {/* Share INFT Modal */}
        {showShareModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60"
            onClick={() => setShowShareModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold mb-4">Share INFT</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Select INFT</label>
                  <select
                    value={selectedINFT}
                    onChange={(e) => setSelectedINFT(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                  >
                    <option value="">Choose an INFT to share</option>
                    <option value="inft1">My AI Model #1</option>
                    <option value="inft2">Neural Network #2</option>
                    <option value="inft3">Computer Vision Model</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <textarea
                    value={shareDescription}
                    onChange={(e) => setShareDescription(e.target.value)}
                    placeholder="Tell the community about your INFT..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 h-24 resize-none"
                  />
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowShareModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleShareINFT}
                    disabled={!selectedINFT || !shareDescription.trim()}
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
                  >
                    Share
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Create Challenge Modal */}
        {showCreateChallengeModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60"
            onClick={() => setShowCreateChallengeModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold mb-4">Create Challenge</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Title</label>
                  <input
                    type="text"
                    value={challengeForm.title}
                    onChange={(e) => setChallengeForm({...challengeForm, title: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                    placeholder="Challenge title..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <textarea
                    value={challengeForm.description}
                    onChange={(e) => setChallengeForm({...challengeForm, description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 h-24 resize-none"
                    placeholder="Describe the challenge..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Difficulty</label>
                    <select
                      value={challengeForm.difficulty}
                      onChange={(e) => setChallengeForm({...challengeForm, difficulty: e.target.value as any})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                    >
                      {difficulties.map(diff => (
                        <option key={diff} value={diff}>{diff}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Category</label>
                    <select
                      value={challengeForm.category}
                      onChange={(e) => setChallengeForm({...challengeForm, category: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                    >
                      {categories.slice(1).map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Reward</label>
                    <input
                      type="text"
                      value={challengeForm.reward}
                      onChange={(e) => setChallengeForm({...challengeForm, reward: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                      placeholder="e.g., 100 INFY tokens"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Deadline</label>
                    <input
                      type="date"
                      value={challengeForm.deadline}
                      onChange={(e) => setChallengeForm({...challengeForm, deadline: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                    />
                  </div>
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowCreateChallengeModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateChallenge}
                    disabled={!challengeForm.title || !challengeForm.description}
                    className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
                  >
                    Create
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Create Collaboration Modal */}
        {showCreateCollabModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60"
            onClick={() => setShowCreateCollabModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold mb-4">Start Collaboration</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Project Title</label>
                  <input
                    type="text"
                    value={collabForm.title}
                    onChange={(e) => setCollabForm({...collabForm, title: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                    placeholder="Project title..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <textarea
                    value={collabForm.description}
                    onChange={(e) => setCollabForm({...collabForm, description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 h-24 resize-none"
                    placeholder="Describe your project..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Target Goal</label>
                  <input
                    type="text"
                    value={collabForm.targetGoal}
                    onChange={(e) => setCollabForm({...collabForm, targetGoal: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                    placeholder="What do you want to achieve?"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Required Skills</label>
                  <div className="grid grid-cols-2 gap-2">
                    {skillOptions.map(skill => (
                      <label key={skill} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={collabForm.requiredSkills.includes(skill)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setCollabForm({
                                ...collabForm,
                                requiredSkills: [...collabForm.requiredSkills, skill]
                              });
                            } else {
                              setCollabForm({
                                ...collabForm,
                                requiredSkills: collabForm.requiredSkills.filter(s => s !== skill)
                              });
                            }
                          }}
                          className="rounded"
                        />
                        <span className="text-sm">{skill}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Max Collaborators</label>
                  <input
                    type="number"
                    min="2"
                    max="10"
                    value={collabForm.maxCollaborators}
                    onChange={(e) => setCollabForm({...collabForm, maxCollaborators: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                  />
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowCreateCollabModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateCollaboration}
                    disabled={!collabForm.title || !collabForm.description}
                    className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
                  >
                    Start
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default SocialFeatures;