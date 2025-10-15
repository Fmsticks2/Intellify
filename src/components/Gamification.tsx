import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { useGamification } from '../hooks/useGamification';

interface GamificationProps {
  isOpen: boolean;
  onClose: () => void;
}

const Gamification: React.FC<GamificationProps> = ({ isOpen, onClose }) => {
  const {
    achievements,
    leaderboards,
    userStats,
    rewards,
    challenges,
    claimReward,
    joinChallenge,
    getUserRank,
    getAchievementProgress,
    loading,
    error
  } = useGamification();

  const [activeTab, setActiveTab] = useState<'achievements' | 'leaderboards' | 'rewards' | 'challenges'>('achievements');
  const [selectedLeaderboard, setSelectedLeaderboard] = useState('overall');
  const [claimingReward, setClaimingReward] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleClaimReward = async (rewardId: string) => {
    setClaimingReward(rewardId);
    try {
      await claimReward(rewardId);
    } catch (error) {
      console.error('Failed to claim reward:', error);
    } finally {
      setClaimingReward(null);
    }
  };

  const handleJoinChallenge = async (challengeId: string) => {
    try {
      await joinChallenge(challengeId);
    } catch (error) {
      console.error('Failed to join challenge:', error);
    }
  };

  const getAchievementIcon = (type: string) => {
    const iconMap: { [key: string]: string } = {
      'first_inft': 'mdi:star-outline',
      'knowledge_collector': 'mdi:book-multiple',
      'social_butterfly': 'mdi:account-group',
      'ai_trainer': 'mdi:robot',
      'marketplace_trader': 'mdi:store',
      'governance_participant': 'mdi:vote',
      'staking_master': 'mdi:treasure-chest',
      'breeding_expert': 'mdi:heart',
      'evolution_catalyst': 'mdi:trending-up',
      'fusion_master': 'mdi:merge'
    };
    return iconMap[type] || 'mdi:trophy';
  };

  const getRarityColor = (rarity: string) => {
    const colorMap: { [key: string]: string } = {
      'common': 'text-gray-400',
      'uncommon': 'text-green-400',
      'rare': 'text-blue-400',
      'epic': 'text-purple-400',
      'legendary': 'text-yellow-400'
    };
    return colorMap[rarity] || 'text-gray-400';
  };

  const getRarityBg = (rarity: string) => {
    const bgMap: { [key: string]: string } = {
      'common': 'bg-gray-500/20',
      'uncommon': 'bg-green-500/20',
      'rare': 'bg-blue-500/20',
      'epic': 'bg-purple-500/20',
      'legendary': 'bg-yellow-500/20'
    };
    return bgMap[rarity] || 'bg-gray-500/20';
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl border border-gray-700 w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <Icon icon="mdi:trophy" className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Gamification Hub</h2>
              <p className="text-gray-400 text-sm">Achievements, Leaderboards & Rewards</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 bg-gray-800 hover:bg-gray-700 rounded-lg flex items-center justify-center transition-colors"
          >
            <Icon icon="mdi:close" className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* User Stats Overview */}
        <div className="p-6 border-b border-gray-700 bg-gradient-to-r from-gray-800/50 to-gray-900/50">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{userStats?.level || 0}</div>
              <div className="text-sm text-gray-400">Level</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">{userStats?.totalPoints || 0}</div>
              <div className="text-sm text-gray-400">Total Points</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">{userStats?.achievementsUnlocked || 0}</div>
              <div className="text-sm text-gray-400">Achievements</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">#{getUserRank() || 'N/A'}</div>
              <div className="text-sm text-gray-400">Global Rank</div>
            </div>
          </div>
          
          {/* XP Progress Bar */}
          <div className="mt-4">
            <div className="flex justify-between text-sm text-gray-400 mb-2">
              <span>Level {userStats?.level || 0}</span>
              <span>{userStats?.currentXP || 0} / {userStats?.xpToNextLevel || 1000} XP</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((userStats?.currentXP || 0) / (userStats?.xpToNextLevel || 1000)) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-700">
          {[
            { id: 'achievements', label: 'Achievements', icon: 'mdi:trophy' },
            { id: 'leaderboards', label: 'Leaderboards', icon: 'mdi:podium' },
            { id: 'rewards', label: 'Rewards', icon: 'mdi:gift' },
            { id: 'challenges', label: 'Challenges', icon: 'mdi:sword-cross' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center space-x-2 py-4 px-6 transition-colors ${
                activeTab === tab.id
                  ? 'bg-purple-500/20 text-purple-400 border-b-2 border-purple-500'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
              }`}
            >
              <Icon icon={tab.icon} className="w-5 h-5" />
              <span className="font-medium">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <Icon icon="mdi:alert-circle" className="w-12 h-12 text-red-400 mx-auto mb-4" />
              <p className="text-red-400">{error}</p>
            </div>
          ) : (
            <>
              {/* Achievements Tab */}
              {activeTab === 'achievements' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {achievements.map((achievement) => {
                      const progress = getAchievementProgress(achievement.id);
                      const isCompleted = progress >= achievement.requirement;
                      
                      return (
                        <div
                          key={achievement.id}
                          className={`p-4 rounded-xl border transition-all ${
                            isCompleted
                              ? `${getRarityBg(achievement.rarity)} border-${achievement.rarity === 'legendary' ? 'yellow' : achievement.rarity === 'epic' ? 'purple' : achievement.rarity === 'rare' ? 'blue' : achievement.rarity === 'uncommon' ? 'green' : 'gray'}-500/50`
                              : 'bg-gray-800/50 border-gray-700'
                          }`}
                        >
                          <div className="flex items-start space-x-3">
                            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                              isCompleted ? getRarityBg(achievement.rarity) : 'bg-gray-700'
                            }`}>
                              <Icon 
                                icon={getAchievementIcon(achievement.type)} 
                                className={`w-6 h-6 ${isCompleted ? getRarityColor(achievement.rarity) : 'text-gray-400'}`} 
                              />
                            </div>
                            <div className="flex-1">
                              <h3 className={`font-semibold ${isCompleted ? 'text-white' : 'text-gray-400'}`}>
                                {achievement.title}
                              </h3>
                              <p className="text-sm text-gray-500 mb-2">{achievement.description}</p>
                              
                              {/* Progress Bar */}
                              <div className="mb-2">
                                <div className="flex justify-between text-xs text-gray-400 mb-1">
                                  <span>{progress} / {achievement.requirement}</span>
                                  <span className={`font-medium ${getRarityColor(achievement.rarity)}`}>
                                    {achievement.rarity.toUpperCase()}
                                  </span>
                                </div>
                                <div className="w-full bg-gray-700 rounded-full h-1.5">
                                  <div 
                                    className={`h-1.5 rounded-full transition-all duration-300 ${
                                      isCompleted 
                                        ? `bg-gradient-to-r ${achievement.rarity === 'legendary' ? 'from-yellow-400 to-yellow-600' : achievement.rarity === 'epic' ? 'from-purple-400 to-purple-600' : achievement.rarity === 'rare' ? 'from-blue-400 to-blue-600' : achievement.rarity === 'uncommon' ? 'from-green-400 to-green-600' : 'from-gray-400 to-gray-600'}`
                                        : 'bg-gray-600'
                                    }`}
                                    style={{ width: `${Math.min((progress / achievement.requirement) * 100, 100)}%` }}
                                  />
                                </div>
                              </div>
                              
                              {/* Rewards */}
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2 text-xs">
                                  <Icon icon="mdi:star" className="w-4 h-4 text-yellow-400" />
                                  <span className="text-gray-400">{achievement.points} XP</span>
                                </div>
                                {isCompleted && (
                                  <Icon icon="mdi:check-circle" className="w-5 h-5 text-green-400" />
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Leaderboards Tab */}
              {activeTab === 'leaderboards' && (
                <div className="space-y-6">
                  {/* Leaderboard Selection */}
                  <div className="flex flex-wrap gap-2">
                    {Object.keys(leaderboards).map((boardType) => (
                      <button
                        key={boardType}
                        onClick={() => setSelectedLeaderboard(boardType)}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                          selectedLeaderboard === boardType
                            ? 'bg-purple-500 text-white'
                            : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'
                        }`}
                      >
                        {boardType.charAt(0).toUpperCase() + boardType.slice(1).replace('_', ' ')}
                      </button>
                    ))}
                  </div>

                  {/* Leaderboard */}
                  <div className="bg-gray-800/50 rounded-xl border border-gray-700">
                    <div className="p-4 border-b border-gray-700">
                      <h3 className="text-lg font-semibold text-white">
                        {selectedLeaderboard.charAt(0).toUpperCase() + selectedLeaderboard.slice(1).replace('_', ' ')} Leaderboard
                      </h3>
                    </div>
                    <div className="divide-y divide-gray-700">
                      {leaderboards[selectedLeaderboard]?.slice(0, 10).map((entry, index) => (
                        <div key={entry.address} className="p-4 flex items-center space-x-4">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                            index === 0 ? 'bg-yellow-500 text-black' :
                            index === 1 ? 'bg-gray-400 text-black' :
                            index === 2 ? 'bg-orange-600 text-white' :
                            'bg-gray-700 text-gray-300'
                          }`}>
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-white">
                              {entry.username || `${entry.address.slice(0, 6)}...${entry.address.slice(-4)}`}
                            </div>
                            <div className="text-sm text-gray-400">Level {entry.level}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-white">{entry.score.toLocaleString()}</div>
                            <div className="text-sm text-gray-400">
                              {selectedLeaderboard === 'overall' ? 'Points' :
                               selectedLeaderboard === 'trading' ? 'Volume' :
                               selectedLeaderboard === 'staking' ? 'Staked' :
                               selectedLeaderboard === 'social' ? 'Interactions' : 'Score'}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Rewards Tab */}
              {activeTab === 'rewards' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {rewards.map((reward) => (
                      <div key={reward.id} className="bg-gray-800/50 rounded-xl border border-gray-700 p-4">
                        <div className="flex items-start space-x-3">
                          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${getRarityBg(reward.rarity)}`}>
                            <Icon icon="mdi:gift" className={`w-6 h-6 ${getRarityColor(reward.rarity)}`} />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-white">{reward.title}</h3>
                            <p className="text-sm text-gray-400 mb-2">{reward.description}</p>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <span className={`text-xs px-2 py-1 rounded ${getRarityBg(reward.rarity)} ${getRarityColor(reward.rarity)}`}>
                                  {reward.rarity.toUpperCase()}
                                </span>
                                <span className="text-xs text-gray-400">
                                  {reward.type === 'token' ? `${reward.amount} INTL` :
                                   reward.type === 'nft' ? 'Special NFT' :
                                   reward.type === 'boost' ? `${reward.duration}h Boost` : 'Reward'}
                                </span>
                              </div>
                              {reward.claimed ? (
                                <span className="text-xs text-green-400 flex items-center space-x-1">
                                  <Icon icon="mdi:check" className="w-4 h-4" />
                                  <span>Claimed</span>
                                </span>
                              ) : reward.available ? (
                                <button
                                  onClick={() => handleClaimReward(reward.id)}
                                  disabled={claimingReward === reward.id}
                                  className="px-3 py-1 bg-purple-500 hover:bg-purple-600 text-white text-xs rounded-lg transition-colors disabled:opacity-50"
                                >
                                  {claimingReward === reward.id ? 'Claiming...' : 'Claim'}
                                </button>
                              ) : (
                                <span className="text-xs text-gray-500">Locked</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Challenges Tab */}
              {activeTab === 'challenges' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {challenges.map((challenge) => (
                      <div key={challenge.id} className="bg-gray-800/50 rounded-xl border border-gray-700 p-4">
                        <div className="flex items-start space-x-3">
                          <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                            <Icon icon="mdi:sword-cross" className="w-6 h-6 text-white" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-white">{challenge.title}</h3>
                            <p className="text-sm text-gray-400 mb-2">{challenge.description}</p>
                            
                            {/* Challenge Progress */}
                            <div className="mb-3">
                              <div className="flex justify-between text-xs text-gray-400 mb-1">
                                <span>Progress</span>
                                <span>{challenge.currentProgress} / {challenge.target}</span>
                              </div>
                              <div className="w-full bg-gray-700 rounded-full h-1.5">
                                <div 
                                  className="bg-gradient-to-r from-orange-400 to-red-500 h-1.5 rounded-full transition-all duration-300"
                                  style={{ width: `${Math.min((challenge.currentProgress / challenge.target) * 100, 100)}%` }}
                                />
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4 text-xs text-gray-400">
                                <span className="flex items-center space-x-1">
                                  <Icon icon="mdi:clock" className="w-4 h-4" />
                                  <span>{Math.ceil((new Date(challenge.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days left</span>
                                </span>
                                <span className="flex items-center space-x-1">
                                  <Icon icon="mdi:star" className="w-4 h-4 text-yellow-400" />
                                  <span>{challenge.reward} XP</span>
                                </span>
                              </div>
                              {challenge.joined ? (
                                <span className="text-xs text-blue-400 flex items-center space-x-1">
                                  <Icon icon="mdi:check" className="w-4 h-4" />
                                  <span>Joined</span>
                                </span>
                              ) : (
                                <button
                                  onClick={() => handleJoinChallenge(challenge.id)}
                                  className="px-3 py-1 bg-orange-500 hover:bg-orange-600 text-white text-xs rounded-lg transition-colors"
                                >
                                  Join
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Gamification;